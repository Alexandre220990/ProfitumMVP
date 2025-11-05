import express, { Request, Response } from 'express';
import { supabaseClient } from '../config/supabase';
import { optionalAuthMiddleware } from '../middleware/optional-auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface ClientSimulationRequest {
  responses: Record<string, any>;
  simulationType?: 'update' | 'new';
}

interface ClientSimulationResponse {
  success: boolean;
  data?: {
    simulationId: string;
    productsUpdated: number;
    productsCreated: number;
    productsProtected: number;
    totalSavings: number;
    conflicts: any[];
    historyId: string;
  };
  message?: string;
}

// ============================================================================
// ROUTES API
// ============================================================================

/**
 * POST /api/client/simulation/update
 * Met à jour la simulation d'un client connecté avec fusion intelligente
 */
router.post('/update', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Vérifier l'authentification
    const user = (req as any).user;
    
    if (!user || user.type !== 'client') {
      console.error('❌ Accès non autorisé:', { hasUser: !!user, userType: user?.type });
      return res.status(401).json({
        success: false,
        message: 'Authentification requise - Veuillez vous reconnecter'
      });
    }

    const { responses, simulationType = 'update' }: ClientSimulationRequest = req.body;

    console.log('🚀 Simulation client connecté:', {
      clientId: user.database_id,
      email: user.email,
      simulationType,
      responsesCount: Object.keys(responses || {}).length
    });

    // 1. Créer une nouvelle simulation avec les réponses
    const { data: simulation, error: simulationError } = await supabaseClient
      .from('simulations')
      .insert({
        client_id: user.database_id,
        session_token: `client-sim-${Date.now()}-${user.database_id.substring(0, 8)}`,
        type: 'authentifiee', // ✅ Champ obligatoire
        status: 'en_cours', // ✅ Cohérent avec le reste du code
        answers: responses, // Déjà avec les codes questions
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (simulationError) {
      console.error('❌ Erreur création simulation:', simulationError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la simulation'
      });
    }

    console.log(`📋 Simulation créée: ${simulation.id}`);

    // 2. Calculer l'éligibilité avec les fonctions SQL
    const { data: resultatsSQL, error: calculError } = await supabaseClient
      .rpc('evaluer_eligibilite_avec_calcul', {
        p_simulation_id: simulation.id
      });

    if (calculError || !resultatsSQL || !resultatsSQL.success) {
      console.error('❌ Erreur calcul SQL:', calculError);
      
      await supabaseClient
        .from('simulations')
        .update({ status: 'failed' })
        .eq('id', simulation.id);
        
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul d\'éligibilité'
      });
    }

    console.log(`✅ Calcul SQL réussi: ${resultatsSQL.total_eligible} produits éligibles`);

    // 3. Fusionner intelligemment avec les produits existants
    const mergeResult = await mergeClientProductsSQL(
      user.database_id,
      simulation.id,
      resultatsSQL.produits || []
    );

    // 4. Mettre à jour la simulation avec les résultats
    await supabaseClient
      .from('simulations')
      .update({
        status: 'completed',
        results: resultatsSQL,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulation.id);

    // 5. Vérifier si c'est la première simulation réussie et changer le statut prospect → client
    const { data: clientData, error: clientError } = await supabaseClient
      .from('Client')
      .select('status, first_simulation_at')
      .eq('id', user.database_id)
      .single();

    if (clientData && clientData.status === 'prospect') {
      // Vérifier si c'est vraiment la première simulation
      const { count: simulationCount } = await supabaseClient
        .from('simulations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.database_id)
        .eq('status', 'completed');

      if (simulationCount === 1) {
        // Première simulation réussie : changer prospect → client
        await supabaseClient
          .from('Client')
          .update({ 
            status: 'client',
            first_simulation_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })
          .eq('id', user.database_id);

        console.log('🎉 Premier client converti prospect → client:', {
          clientId: user.database_id,
          email: user.email
        });
      }
    } else if (clientData && clientData.status === 'client') {
      // Client déjà converti, juste mettre à jour last_activity_at
      await supabaseClient
        .from('Client')
        .update({ 
          last_activity_at: new Date().toISOString()
        })
        .eq('id', user.database_id);
    }

    console.log('✅ Simulation client terminée:', {
      simulationId: simulation.id,
      productsUpdated: mergeResult.products_updated,
      productsCreated: mergeResult.products_created,
      productsProtected: mergeResult.products_protected
    });

    const response: ClientSimulationResponse = {
      success: true,
      data: {
        simulationId: simulation.id,
        productsUpdated: mergeResult.products_updated,
        productsCreated: mergeResult.products_created,
        productsProtected: mergeResult.products_protected,
        totalSavings: mergeResult.total_savings,
        conflicts: mergeResult.conflicts || [],
        historyId: mergeResult.history_id
      },
      message: 'Simulation mise à jour avec succès'
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ Erreur simulation client:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la simulation'
    });
  }
}));

/**
 * GET /api/client/simulation/history
 * Récupère l'historique des simulations d'un client
 */
router.get('/history', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'client') {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { data: history, error } = await supabaseClient
      .from('SimulationHistory')
      .select('*')
      .eq('client_id', user.database_id)
      .order('simulation_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur récupération historique:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }

    return res.json({
      success: true,
      data: history || [],
      message: 'Historique récupéré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur historique simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

/**
 * GET /api/client/simulation/status
 * Vérifie le statut de la dernière simulation
 */
router.get('/status', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'client') {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { data: lastSimulation, error } = await supabaseClient
      .from('simulations')
      .select('*')
      .eq('client_id', user.database_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erreur statut simulation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut'
      });
    }

    return res.json({
      success: true,
      data: {
        hasRecentSimulation: !!lastSimulation,
        lastSimulation: lastSimulation || null,
        canRunNewSimulation: !lastSimulation || 
          lastSimulation.status === 'completed' || 
          lastSimulation.status === 'failed'
      },
      message: 'Statut vérifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur statut simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Fusionne les produits avec la logique intelligente (VERSION SQL)
 * - NE PAS remplacer les produits en cours de traitement
 * - Créer les nouveaux produits éligibles
 * - Mettre à jour les produits 'eligible' existants si amélioration
 */
async function mergeClientProductsSQL(clientId: string, simulationId: string, produitsCalcules: any[]) {
  try {
    console.log('🔄 Fusion intelligente SQL pour client:', clientId);
    
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsProtected = 0;
    let totalSavings = 0;
    const conflicts: any[] = [];

    // Récupérer tous les produits existants du client
    const { data: existingProducts } = await supabaseClient
      .from('ClientProduitEligible')
      .select('id, produitId, statut, montantFinal, metadata, created_at')
      .eq('clientId', clientId);

    const existingMap = new Map(existingProducts?.map(p => [p.produitId, p]) || []);

    // Récupérer les CPE avec activité workflow (PROTECTION ABSOLUE)
    // 1. Documents uploadés
    const { data: cpeWithDocs } = await supabaseClient
      .from('GEDDocument')
      .select('client_produit_eligible_id')
      .eq('client_id', clientId)
      .not('client_produit_eligible_id', 'is', null);
    
    // 2. CPE avec expert assigné
    const { data: cpeWithExpert } = await supabaseClient
      .from('ClientProduitEligible')
      .select('id')
      .eq('clientId', clientId)
      .not('expert_id', 'is', null);
    
    // 3. CPE avec factures
    const { data: cpeWithInvoice } = await supabaseClient
      .from('invoice')
      .select('client_produit_eligible_id')
      .not('client_produit_eligible_id', 'is', null);
    
    // Combiner tous les CPE protégés
    const protectedCpeSet = new Set([
      ...(cpeWithDocs?.map(d => d.client_produit_eligible_id) || []),
      ...(cpeWithExpert?.map(e => e.id) || []),
      ...(cpeWithInvoice?.map(i => i.client_produit_eligible_id) || [])
    ]);

    // Pour chaque produit éligible calculé
    for (const produit of produitsCalcules) {
      if (!produit.is_eligible) continue; // Ignorer les non éligibles

      const existing = existingMap.get(produit.produit_id);
      totalSavings += produit.montant_estime || 0;

      if (existing) {
        // Produit existe déjà
        
        // 🔒 PROTECTION ABSOLUE : Si le CPE a une activité workflow
        const hasWorkflowActivity = protectedCpeSet.has(existing.id);
        
        if (hasWorkflowActivity) {
          // CPE avec activité → PROTÉGÉ contre suppression
          // MAIS on peut mettre à jour le montant
          const nouveauMontant = produit.montant_estime || 0;
          const ancienMontant = existing.montantFinal || 0;
          
          if (nouveauMontant !== ancienMontant) {
            await supabaseClient
              .from('ClientProduitEligible')
              .update({
                montantFinal: nouveauMontant,
                simulationId: simulationId,
                calcul_details: produit.calcul_details,
                metadata: {
                  ...(existing.metadata || {}),
                  updated_from_simulation: simulationId,
                  previous_amount: ancienMontant,
                  updated_at: new Date().toISOString(),
                  protected: true,
                  protection_reason: 'workflow_activity'
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
            
            console.log(`🔒💼 CPE protégé (workflow actif) - Montant mis à jour: ${produit.produit_nom} (${ancienMontant}€ → ${nouveauMontant}€)`);
            productsUpdated++;
          } else {
            console.log(`🔒 CPE protégé (workflow actif) - Inchangé: ${produit.produit_nom}`);
            productsProtected++;
          }
          conflicts.push({
            produitId: produit.produit_id,
            produitNom: produit.produit_nom,
            reason: 'CPE avec activité workflow - Protégé',
            existingStatut: existing.statut,
            montantUpdated: nouveauMontant !== ancienMontant
          });
          continue;
        }
        
        // Cas 1 : Produit en cours de traitement → PROTÉGER
        if (['en_cours', 'documents_collecte', 'expert_assigne', 'en_attente_expert', 'dossier_constitue'].includes(existing.statut)) {
          console.log(`🔒 Produit protégé (workflow en cours): ${produit.produit_nom}`);
          productsProtected++;
          conflicts.push({
            produitId: produit.produit_id,
            produitNom: produit.produit_nom,
            reason: 'Produit en cours de traitement',
            existingStatut: existing.statut
          });
          continue;
        }

        // Cas 2 : Produit 'eligible' → METTRE À JOUR si différent
        if (existing.statut === 'eligible') {
          const nouveauMontant = produit.montant_estime || 0;
          const ancienMontant = existing.montantFinal || 0;

          if (nouveauMontant !== ancienMontant) {
            await supabaseClient
              .from('ClientProduitEligible')
              .update({
                montantFinal: nouveauMontant,
                tauxFinal: null,
                dureeFinale: null,
                simulationId: simulationId,
                calcul_details: produit.calcul_details,
                notes: produit.notes,
                metadata: {
                  ...(existing.metadata || {}),
                  updated_from_simulation: simulationId,
                  previous_amount: ancienMontant,
                  updated_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            console.log(`✅ Produit mis à jour: ${produit.produit_nom} (${ancienMontant}€ → ${nouveauMontant}€)`);
            productsUpdated++;
          } else {
            console.log(`→ Produit inchangé: ${produit.produit_nom} (${ancienMontant}€)`);
            productsProtected++;
          }
        }
      } else {
        // Nouveau produit → CRÉER
        const { error: insertError } = await supabaseClient
          .from('ClientProduitEligible')
          .insert({
            clientId: clientId,
            produitId: produit.produit_id,
            simulationId: simulationId,
            statut: 'eligible',
            montantFinal: produit.montant_estime,
            tauxFinal: null,
            dureeFinale: null,
            notes: produit.notes,
            calcul_details: produit.calcul_details,
            metadata: {
              source: 'simulation_client_sql',
              type_produit: produit.type_produit,
              calculated_at: new Date().toISOString()
            }
          });

        if (!insertError) {
          console.log(`✅ Nouveau produit créé: ${produit.produit_nom} - ${produit.montant_estime}€`);
          productsCreated++;
        } else {
          console.error(`❌ Erreur création produit ${produit.produit_nom}:`, insertError);
        }
      }
    }

    return {
      products_created: productsCreated,
      products_updated: productsUpdated,
      products_protected: productsProtected,
      total_savings: totalSavings,
      conflicts: conflicts,
      history_id: simulationId
    };
  } catch (error) {
    console.error('❌ Erreur fusion produits:', error);
    throw error;
  }
}

export default router;
