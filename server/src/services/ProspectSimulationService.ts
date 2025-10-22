import { createClient } from '@supabase/supabase-js';
import { ExpertOptimizationService, ProductEligibility, OptimizationResult } from './ExpertOptimizationService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface ProspectSimulationRequest {
  prospect_id: string;
  apporteur_id: string;
  answers: Record<string, any>; // Changé : string keys (UUIDs des questions)
  prospect_data?: {
    company_name: string;
    budget_range: string;
    timeline: string;
    qualification_score: number;
    secteur_activite?: string;
  };
}

export interface ProspectSimulationResult {
  simulation_id: string;
  eligible_products: ClientProduitEligibleWithScore[];
  expert_optimization: OptimizationResult;
  total_savings: number;
  summary: {
    highly_eligible: number; // montant >= 10000
    eligible: number; // montant > 0
    to_confirm: number; // montant == 0 mais is_eligible
    not_eligible: number; // not is_eligible
  };
}

export interface ClientProduitEligibleWithScore {
  id: string;
  client_id: string;
  produit_id: string;
  produit_name: string;
  produit_description: string;
  statut: 'eligible' | 'non_eligible' | 'to_confirm';
  montant_estime: number;
  tauxFinal: number | null;
  montantFinal: number | null;
  dureeFinale: number | null;
  priorite: number;
  calcul_details: any;
  metadata: {
    source: 'simulation_apporteur_sql';
    simulation_id: string;
    apporteur_id: string;
    detected_at: string;
    type_produit: string;
  };
  recommended_expert?: {
    id: string;
    name: string;
    company_name: string;
    rating: number;
    matchScore: number;
  };
}

// ============================================================================
// SERVICE DE SIMULATION PROSPECT - VERSION SQL
// ============================================================================

export class ProspectSimulationService {
  
  /**
   * Créer une simulation pour un prospect (par apporteur)
   * Processus complet : évaluation SQL + création ClientProduitEligible + optimisation experts
   */
  static async createProspectSimulation(
    request: ProspectSimulationRequest
  ): Promise<ProspectSimulationResult> {
    
    console.log(`📊 Création simulation pour prospect ${request.prospect_id} par apporteur ${request.apporteur_id}`);
    
    try {
      // 1. Créer la simulation dans la table simulations
      const { data: simulation, error: simError } = await supabase
        .from('simulations')
        .insert({
          client_id: request.prospect_id,
          type: 'apporteur_prospect',
          status: 'pending',
          answers: request.answers, // Format: { uuid: value }
          metadata: {
            source: 'apporteur',
            apporteur_id: request.apporteur_id,
            prospect_data: request.prospect_data,
            created_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (simError || !simulation) {
        throw new Error('Erreur lors de la création de la simulation: ' + simError?.message);
      }
      
      console.log(`✅ Simulation créée: ${simulation.id}`);
      
      // 2. Appeler la fonction SQL pour évaluer l'éligibilité
      console.log('🧮 Appel fonction SQL evaluer_eligibilite_avec_calcul...');
      
      const { data: resultatsSQL, error: sqlError } = await supabase.rpc(
        'evaluer_eligibilite_avec_calcul',
        { p_simulation_id: simulation.id }
      );
      
      if (sqlError) {
        console.error('❌ Erreur fonction SQL:', sqlError);
        throw new Error('Erreur calcul éligibilité SQL: ' + sqlError.message);
      }
      
      if (!resultatsSQL || !resultatsSQL.success) {
        throw new Error('Fonction SQL n\'a pas retourné de résultats valides');
      }
      
      console.log(`✅ Calcul SQL réussi: ${resultatsSQL.total_eligible} produits éligibles`);
      console.log('📊 Produits retournés:', resultatsSQL.produits);
      
      // 3. Récupérer TOUS les produits actifs pour info
      const { data: allProducts, error: productsError } = await supabase
        .from('ProduitEligible')
        .select('id, nom, description, categorie, type_produit')
        .eq('active', true)
        .order('nom');
      
      if (productsError || !allProducts) {
        throw new Error('Erreur lors de la récupération des produits');
      }
      
      // 4. Créer les ClientProduitEligible UNIQUEMENT pour les produits éligibles
      const clientProduitsToCreate = [];
      
      for (const produitSQL of resultatsSQL.produits) {
        // Ne créer que les produits éligibles
        if (!produitSQL.is_eligible) {
          console.log(`⏭️ Produit non éligible ignoré: ${produitSQL.produit_nom}`);
          continue;
        }
        
        const produitInfo = allProducts.find(p => p.id === produitSQL.produit_id);
        const montant = produitSQL.montant_estime || 0;
        
        // Déterminer le statut selon le montant
        let statut: 'eligible' | 'non_eligible' | 'to_confirm';
        if (montant >= 1000) statut = 'eligible';
        else if (montant > 0) statut = 'to_confirm';
        else statut = 'non_eligible';
        
        clientProduitsToCreate.push({
          clientId: request.prospect_id,
          produitId: produitSQL.produit_id,
          simulationId: simulation.id,
          statut: statut,
          tauxFinal: null, // SQL ne retourne pas de taux
          montantFinal: montant,
          dureeFinale: 12,
          priorite: montant >= 10000 ? 1 : montant >= 5000 ? 2 : 3,
          notes: `${produitSQL.notes || 'Produit éligible'} - Montant: ${montant.toLocaleString()}€`,
          metadata: {
            source: 'simulation_apporteur_sql',
            simulation_id: simulation.id,
            apporteur_id: request.apporteur_id,
            detected_at: new Date().toISOString(),
            type_produit: produitSQL.type_produit,
            calcul_details: produitSQL.calcul_details
          },
          calcul_details: produitSQL.calcul_details,
          dateEligibilite: new Date().toISOString(),
          current_step: 0,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      console.log(`📝 Création de ${clientProduitsToCreate.length} ClientProduitEligible...`);
      
      // Insérer les ClientProduitEligible
      const { data: createdCPE, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitsToCreate)
        .select('*');
      
      if (cpeError) {
        console.error('❌ Erreur création ClientProduitEligible:', cpeError);
        throw cpeError;
      }
      
      console.log(`✅ ${createdCPE?.length || 0} ClientProduitEligible créés`);
      
      // 5. Préparer les produits pour l'optimisation des experts
      const eligibleForOptimization: ProductEligibility[] = resultatsSQL.produits
        .filter((p: any) => p.is_eligible && p.montant_estime > 0)
        .map((p: any, index: number) => ({
          productId: p.produit_id,
          productName: p.produit_nom,
          score: p.montant_estime >= 10000 ? 90 : p.montant_estime >= 5000 ? 75 : 60,
          estimatedSavings: p.montant_estime,
          priority: index + 1
        }));
      
      console.log(`🎯 Optimisation experts pour ${eligibleForOptimization.length} produits...`);
      
      const expertOptimization = await ExpertOptimizationService.optimizeExpertSelection(
        eligibleForOptimization,
        request.prospect_data
      );
      
      console.log(`✅ Optimisation experts: ${expertOptimization.recommended.meetings.length} RDV recommandés`);
      
      // 6. Enrichir les ClientProduitEligible avec experts recommandés
      // ⚠️ NE PAS assigner automatiquement - L'apporteur choisira manuellement
      const enrichedProducts: ClientProduitEligibleWithScore[] = (createdCPE || []).map(cpe => {
        const produit = allProducts.find(p => p.id === cpe.produitId);
        const produitSQL = resultatsSQL.produits.find((p: any) => p.produit_id === cpe.produitId);
        
        // Trouver l'expert recommandé pour ce produit (pour suggestion à l'apporteur)
        let recommendedExpert;
        for (const meeting of expertOptimization.recommended.meetings) {
          if (meeting.productIds.includes(cpe.produitId)) {
            recommendedExpert = {
              id: meeting.expert.id,
              name: meeting.expert.name,
              company_name: meeting.expert.company_name,
              rating: meeting.expert.rating,
              matchScore: meeting.combinedScore
            };
            break;
          }
        }
        
        // 💡 L'expert recommandé est seulement une SUGGESTION
        // L'apporteur pourra le sélectionner manuellement (ou laisser vide)
        console.log(`💡 Expert recommandé pour ${produit?.nom || cpe.produitId}: ${recommendedExpert?.name || 'aucun'}`);
        
        return {
          id: cpe.id,
          client_id: cpe.clientId,
          produit_id: cpe.produitId,
          produit_name: produit?.nom || '',
          produit_description: produit?.description || '',
          statut: cpe.statut as 'eligible' | 'non_eligible' | 'to_confirm',
          montant_estime: produitSQL?.montant_estime || 0,
          tauxFinal: cpe.tauxFinal,
          montantFinal: cpe.montantFinal,
          dureeFinale: cpe.dureeFinale,
          priorite: cpe.priorite || 999,
          calcul_details: produitSQL?.calcul_details,
          metadata: cpe.metadata as any,
          recommended_expert: recommendedExpert
        };
      });
      
      // 7. Calculer le résumé
      const summary = {
        highly_eligible: enrichedProducts.filter(p => p.montant_estime >= 10000).length,
        eligible: enrichedProducts.filter(p => p.montant_estime > 0 && p.montant_estime < 10000).length,
        to_confirm: enrichedProducts.filter(p => p.montant_estime === 0 && p.statut === 'to_confirm').length,
        not_eligible: 0 // On ne crée que les éligibles maintenant
      };
      
      const totalSavings = enrichedProducts
        .reduce((sum, p) => sum + (p.montantFinal || 0), 0);
      
      // 8. Mettre à jour la simulation avec les résultats
      await supabase
        .from('simulations')
        .update({
          results: resultatsSQL,
          status: 'completed',
          metadata: {
            source: 'apporteur',
            apporteur_id: request.apporteur_id,
            prospect_data: request.prospect_data,
            created_at: new Date().toISOString(),
            expert_optimization: {
              recommended_meetings: expertOptimization.recommended.meetings.length,
              total_experts: expertOptimization.recommended.experts.length
            },
            total_savings: totalSavings,
            summary: summary
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', simulation.id);
      
      console.log(`✅ Simulation complète: ${summary.highly_eligible + summary.eligible} produits éligibles, ${totalSavings.toLocaleString()}€ d'économies`);
      
      return {
        simulation_id: simulation.id,
        eligible_products: enrichedProducts,
        expert_optimization: expertOptimization,
        total_savings: totalSavings,
        summary: summary
      };
      
    } catch (error) {
      console.error('❌ Erreur création simulation prospect:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer une simulation existante
   */
  static async getProspectSimulation(prospectId: string): Promise<ProspectSimulationResult | null> {
    try {
      // Récupérer la dernière simulation du prospect
      const { data: simulation, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('client_id', prospectId)
        .eq('type', 'apporteur_prospect')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (simError || !simulation) {
        return null;
      }
      
      // Récupérer les ClientProduitEligible associés
      const { data: cpes, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          ProduitEligible (
            id,
            nom,
            description,
            categorie
          )
        `)
        .eq('clientId', prospectId)
        .eq('simulationId', simulation.id);
      
      if (cpeError) {
        throw cpeError;
      }
      
      const enrichedProducts: ClientProduitEligibleWithScore[] = (cpes || []).map((cpe: any) => ({
        id: cpe.id,
        client_id: cpe.clientId,
        produit_id: cpe.produitId,
        produit_name: cpe.ProduitEligible?.nom || '',
        produit_description: cpe.ProduitEligible?.description || '',
        statut: cpe.statut,
        montant_estime: cpe.montantFinal || 0,
        tauxFinal: cpe.tauxFinal,
        montantFinal: cpe.montantFinal,
        dureeFinale: cpe.dureeFinale,
        priorite: cpe.priorite,
        calcul_details: cpe.calcul_details,
        metadata: cpe.metadata
      }));
      
      const summary = {
        highly_eligible: enrichedProducts.filter(p => p.montant_estime >= 10000).length,
        eligible: enrichedProducts.filter(p => p.montant_estime > 0 && p.montant_estime < 10000).length,
        to_confirm: enrichedProducts.filter(p => p.statut === 'to_confirm').length,
        not_eligible: enrichedProducts.filter(p => p.statut === 'non_eligible').length
      };
      
      const totalSavings = enrichedProducts.reduce((sum, p) => sum + (p.montantFinal || 0), 0);
      
      return {
        simulation_id: simulation.id,
        eligible_products: enrichedProducts,
        expert_optimization: simulation.metadata?.expert_optimization || { recommended: { meetings: [], experts: [] } },
        total_savings: totalSavings,
        summary: summary
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération simulation:', error);
      throw error;
    }
  }
}

export default ProspectSimulationService;
