import { createClient } from '@supabase/supabase-js';
import { DecisionEngine } from './decisionEngine';
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
  answers: Record<number, string | string[]>;
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
    highly_eligible: number; // score >= 80
    eligible: number; // score 60-79
    to_confirm: number; // score 40-59
    not_eligible: number; // score < 40
  };
}

export interface ClientProduitEligibleWithScore {
  id: string;
  client_id: string;
  produit_id: string;
  produit_name: string;
  produit_description: string;
  statut: 'eligible' | 'non_eligible' | 'to_confirm';
  score: number;
  tauxFinal: number | null;
  montantFinal: number | null;
  dureeFinale: number | null;
  priorite: number;
  metadata: {
    source: 'simulation_apporteur';
    simulation_id: string;
    apporteur_id: string;
    detected_at: string;
    score: number;
    satisfied_rules: number;
    total_rules: number;
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
// SERVICE DE SIMULATION PROSPECT
// ============================================================================

export class ProspectSimulationService {
  
  /**
   * Créer une simulation pour un prospect (par apporteur)
   * Processus complet : évaluation + création ClientProduitEligible + optimisation experts
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
          status: 'completed',
          answers: request.answers,
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
        throw new Error('Erreur lors de la création de la simulation');
      }
      
      console.log(`✅ Simulation créée: ${simulation.id}`);
      
      // 2. Évaluer l'éligibilité avec le DecisionEngine
      const decisionEngine = new DecisionEngine();
      
      // Convertir les réponses au format attendu
      const formattedAnswers = Object.entries(request.answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value: Array.isArray(value) ? value[0] : String(value),
        timestamp: new Date()
      }));
      
      const eligibleProducts = await decisionEngine.evaluateEligibility(
        simulation.id,
        formattedAnswers
      );
      
      console.log(`✅ ${eligibleProducts.length} produits évalués`);
      
      // 3. Récupérer TOUS les produits actifs
      const { data: allProducts, error: productsError } = await supabase
        .from('ProduitEligible')
        .select('id, nom, description, categorie')
        .eq('active', true)
        .order('nom');
      
      if (productsError || !allProducts) {
        throw new Error('Erreur lors de la récupération des produits');
      }
      
      // 4. Créer les ClientProduitEligible pour TOUS les produits
      const clientProduitsToCreate = allProducts.map((produit, index) => {
        const eligibility = eligibleProducts.find(ep => ep.productId === produit.id);
        const isEligible = !!eligibility;
        const score = isEligible ? eligibility.score : 0;
        
        // Déterminer le statut selon le score
        let statut: 'eligible' | 'non_eligible' | 'to_confirm';
        if (score >= 60) statut = 'eligible';
        else if (score >= 40) statut = 'to_confirm';
        else statut = 'non_eligible';
        
        return {
          clientId: request.prospect_id,
          produitId: produit.id,
          simulationId: simulation.id,
          statut: statut,
          tauxFinal: isEligible ? (score / 100) : null,
          montantFinal: isEligible ? (score * 1000) : null, // Estimation
          dureeFinale: isEligible ? 12 : null,
          priorite: isEligible ? (eligibleProducts.indexOf(eligibility) + 1) : (index + 10),
          notes: isEligible 
            ? `Identifié via simulation apporteur - Score: ${score.toFixed(0)}%`
            : 'Non éligible selon simulation',
          metadata: {
            source: 'simulation_apporteur',
            simulation_id: simulation.id,
            apporteur_id: request.apporteur_id,
            detected_at: new Date().toISOString(),
            score: score,
            satisfied_rules: isEligible ? eligibility.satisfiedRules : 0,
            total_rules: isEligible ? eligibility.totalRules : 0
          },
          dateEligibilite: isEligible ? new Date().toISOString() : null,
          current_step: 0,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
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
      
      // 5. Optimiser la sélection des experts
      const eligibleForOptimization: ProductEligibility[] = eligibleProducts.map(ep => ({
        productId: ep.productId,
        productName: allProducts.find(p => p.id === ep.productId)?.nom || '',
        score: ep.score,
        estimatedSavings: ep.score * 1000, // Estimation
        priority: eligibleProducts.indexOf(ep) + 1
      }));
      
      const expertOptimization = await ExpertOptimizationService.optimizeExpertSelection(
        eligibleForOptimization,
        request.prospect_data
      );
      
      console.log(`✅ Optimisation experts: ${expertOptimization.recommended.meetings.length} RDV recommandés`);
      
      // 6. Enrichir les ClientProduitEligible avec experts recommandés
      const enrichedProducts: ClientProduitEligibleWithScore[] = (createdCPE || []).map(cpe => {
        const produit = allProducts.find(p => p.id === cpe.produitId);
        const eligibility = eligibleProducts.find(ep => ep.productId === cpe.produitId);
        const score = eligibility?.score || 0;
        
        // Trouver l'expert recommandé pour ce produit
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
        
        return {
          id: cpe.id,
          client_id: cpe.clientId,
          produit_id: cpe.produitId,
          produit_name: produit?.nom || '',
          produit_description: produit?.description || '',
          statut: cpe.statut as 'eligible' | 'non_eligible' | 'to_confirm',
          score: score,
          tauxFinal: cpe.tauxFinal,
          montantFinal: cpe.montantFinal,
          dureeFinale: cpe.dureeFinale,
          priorite: cpe.priorite || 999,
          metadata: cpe.metadata as any,
          recommended_expert: recommendedExpert
        };
      });
      
      // 7. Calculer le résumé
      const summary = {
        highly_eligible: enrichedProducts.filter(p => p.score >= 80).length,
        eligible: enrichedProducts.filter(p => p.score >= 60 && p.score < 80).length,
        to_confirm: enrichedProducts.filter(p => p.score >= 40 && p.score < 60).length,
        not_eligible: enrichedProducts.filter(p => p.score < 40).length
      };
      
      const totalSavings = enrichedProducts
        .filter(p => p.score >= 60)
        .reduce((sum, p) => sum + (p.montantFinal || 0), 0);
      
      // 8. Mettre à jour la simulation avec les résultats
      await supabase
        .from('simulations')
        .update({
          results: {
            eligible_products: eligibleProducts,
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
   * Récupérer une simulation existante pour un prospect
   */
  static async getProspectSimulation(prospectId: string): Promise<ProspectSimulationResult | null> {
    try {
      // Récupérer la simulation la plus récente
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
      
      // Récupérer les ClientProduitEligible
      const { data: cpe, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          ProduitEligible (id, nom, description, categorie)
        `)
        .eq('clientId', prospectId)
        .eq('simulationId', simulation.id);
      
      if (cpeError || !cpe) {
        return null;
      }
      
      // Reconstruire le résultat (structure identique à createProspectSimulation)
      // TODO: Implémenter reconstruction complète si nécessaire
      
      return null; // À implémenter si besoin de récupération
      
    } catch (error) {
      console.error('Erreur récupération simulation:', error);
      return null;
    }
  }
  
  /**
   * Pré-remplir les questions de simulation avec les données du formulaire
   */
  static prefillSimulationAnswers(prospectData: {
    budget_range?: string;
    timeline?: string;
    secteur_activite?: string;
    nombre_employes?: number;
    qualification_score?: number;
  }): Partial<Record<number, string>> {
    
    const prefilled: Record<number, string> = {};
    
    // Mapping des données formulaire → questions simulation
    // TODO: À adapter selon vos questions réelles
    
    if (prospectData.budget_range) {
      // Question budget (exemple: question_id = 5)
      prefilled[5] = prospectData.budget_range;
    }
    
    if (prospectData.timeline) {
      // Question délai (exemple: question_id = 6)
      prefilled[6] = prospectData.timeline;
    }
    
    if (prospectData.secteur_activite) {
      // Question secteur (exemple: question_id = 1)
      prefilled[1] = prospectData.secteur_activite;
    }
    
    if (prospectData.nombre_employes) {
      // Question taille entreprise (exemple: question_id = 3)
      prefilled[3] = prospectData.nombre_employes.toString();
    }
    
    return prefilled;
  }
  
  /**
   * Créer les RDV pour les experts recommandés
   */
  static async createRecommendedMeetings(request: {
    prospect_id: string;
    apporteur_id: string;
    meetings: Array<{
      expert_id: string;
      product_ids: string[];
      client_produit_eligible_ids: string[];
      meeting_type: 'physical' | 'video' | 'phone';
      scheduled_date: string;
      scheduled_time: string;
      location?: string;
      notes?: string;
      estimated_duration?: number;
    }>;
  }): Promise<{
    created_meetings: any[];
    notifications_sent: string[];
  }> {
    
    console.log(`📅 Création de ${request.meetings.length} RDV pour prospect ${request.prospect_id}`);
    
    const createdMeetings: any[] = [];
    const notificationsSent: string[] = [];
    
    try {
      for (const meetingData of request.meetings) {
        // 1. Créer le RDV
        const { data: rdv, error: rdvError } = await supabase
          .from('ClientRDV')
          .insert({
            client_id: request.prospect_id,
            expert_id: meetingData.expert_id,
            apporteur_id: request.apporteur_id,
            meeting_type: meetingData.meeting_type,
            scheduled_date: meetingData.scheduled_date,
            scheduled_time: meetingData.scheduled_time,
            duration_minutes: meetingData.estimated_duration || (meetingData.product_ids.length * 45),
            location: meetingData.location,
            status: 'proposed', // Statut initial: proposé (expert doit valider)
            notes: meetingData.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (rdvError || !rdv) {
          console.error('❌ Erreur création RDV:', rdvError);
          continue;
        }
        
        console.log(`✅ RDV créé: ${rdv.id} avec expert ${meetingData.expert_id}`);
        
        // 2. Lier les produits au RDV
        const produitLinks = meetingData.product_ids.map((productId, index) => ({
          rdv_id: rdv.id,
          client_produit_eligible_id: meetingData.client_produit_eligible_ids[index],
          product_id: productId,
          priority: index + 1,
          estimated_duration_minutes: 45,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: linkError } = await supabase
          .from('ClientRDV_Produits')
          .insert(produitLinks);
        
        if (linkError) {
          console.error('❌ Erreur liaison produits-RDV:', linkError);
        } else {
          console.log(`✅ ${produitLinks.length} produits liés au RDV ${rdv.id}`);
        }
        
        // 3. Mettre à jour les ClientProduitEligible avec l'expert assigné
        for (const cpeId of meetingData.client_produit_eligible_ids) {
          await supabase
            .from('ClientProduitEligible')
            .update({
              expert_id: meetingData.expert_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', cpeId);
        }
        
        // 4. Créer notification pour l'expert
        const { data: expert } = await supabase
          .from('Expert')
          .select('name, email')
          .eq('id', meetingData.expert_id)
          .single();
        
        const { data: client } = await supabase
          .from('Client')
          .select('name, company_name')
          .eq('id', request.prospect_id)
          .single();
        
        // Récupérer les noms de produits
        const { data: produitsDetails } = await supabase
          .from('ProduitEligible')
          .select('nom')
          .in('id', meetingData.product_ids);
        
        const produitsNames = produitsDetails?.map(p => p.nom).join(', ') || '';
        
        const notificationData = {
          expert_id: meetingData.expert_id,
          notification_type: 'EXPERT_PROSPECT_RDV_PROPOSED',
          title: 'Nouveau RDV Proposé',
          message: `RDV avec ${client?.company_name || client?.name} le ${meetingData.scheduled_date} à ${meetingData.scheduled_time}`,
          data: {
            rdv_id: rdv.id,
            prospect_id: request.prospect_id,
            prospect_name: client?.company_name || client?.name,
            products: produitsNames,
            product_ids: meetingData.product_ids,
            meeting_date: meetingData.scheduled_date,
            meeting_time: meetingData.scheduled_time,
            meeting_type: meetingData.meeting_type,
            location: meetingData.location
          },
          priority: 'high',
          status: 'unread',
          created_at: new Date().toISOString()
        };
        
        // Insérer dans la table notification (table générique)
        const { error: notifError } = await supabase
          .from('notification')
          .insert({
            recipient_id: meetingData.expert_id,
            recipient_type: 'expert',
            type: notificationData.notification_type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
            priority: notificationData.priority,
            read: false,
            created_at: new Date().toISOString()
          });
        
        if (notifError) {
          console.error('❌ Erreur création notification:', notifError);
        } else {
          console.log(`✅ Notification envoyée à expert ${meetingData.expert_id}`);
          notificationsSent.push(meetingData.expert_id);
        }
        
        createdMeetings.push(rdv);
      }
      
      console.log(`✅ ${createdMeetings.length} RDV créés, ${notificationsSent.length} notifications envoyées`);
      
      return {
        created_meetings: createdMeetings,
        notifications_sent: notificationsSent
      };
      
    } catch (error) {
      console.error('❌ Erreur création RDV recommandés:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour l'assignation d'expert sur un ClientProduitEligible
   */
  static async assignExpertToProduct(
    clientProduitEligibleId: string,
    expertId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          expert_id: expertId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientProduitEligibleId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erreur assignation expert:', error);
      return false;
    }
  }
}

