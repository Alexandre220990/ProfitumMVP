import express, { Request, Response } from 'express';
import { supabaseClient } from '../config/supabase';
import { optionalAuthMiddleware } from '../middleware/optional-auth';
import { asyncHandler } from '../utils/asyncHandler';
import { normalizeDossierStatus } from '../utils/dossierStatus';

const router = express.Router();

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface ClientSimulationRequest {
  responses: Record<string, any>;
  simulationType?: 'update' | 'new';
  simulationId?: string;
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
    results?: any;
    answers?: Record<string, any>;
  };
  message?: string;
}

// ============================================================================
// ROUTES API
// ============================================================================

/**
 * PATCH /api/client/simulation/draft/:simulationId/answers
 * Sauvegarde partielle des réponses d'un brouillon de simulation
 */
router.patch('/draft/:simulationId/answers', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || user.type !== 'client') {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { simulationId } = req.params;
    const { responses } = req.body as { responses?: Record<string, any> };

    if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Le corps de la requête doit contenir un objet responses'
      });
    }

    const { data: draftSimulation, error: draftError } = await supabaseClient
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .eq('client_id', user.database_id)
      .single();

    if (draftError || !draftSimulation) {
      console.error('❌ Simulation introuvable ou inaccessible:', draftError);
      return res.status(404).json({
        success: false,
        message: 'Simulation introuvable'
      });
    }

    if (draftSimulation.status !== 'en_cours') {
      return res.status(409).json({
        success: false,
        message: 'Seules les simulations en cours peuvent être modifiées'
      });
    }

    const mergedAnswers: Record<string, any> = {
      ...(draftSimulation.answers || {})
    };

    Object.entries(responses).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      mergedAnswers[key] = value;
    });

    const patchNow = new Date();
    const patchExpiresAt = new Date(patchNow.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: updatedSimulation, error: updateError } = await supabaseClient
      .from('simulations')
      .update({
        answers: mergedAnswers,
        updated_at: patchNow.toISOString(),
        expires_at: patchExpiresAt
      })
      .eq('id', simulationId)
      .select()
      .single();

    if (updateError || !updatedSimulation) {
      console.error('❌ Erreur sauvegarde brouillon:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la sauvegarde du brouillon'
      });
    }

    const { data: lastHistory, error: historyError } = await supabaseClient
      .from('simulationhistory')
      .select('version_number')
      .eq('simulation_id', simulationId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (historyError) {
      console.error('⚠️ Erreur récupération historique pour versioning:', historyError);
    }

    const nextVersionNumber =
      Array.isArray(lastHistory) && lastHistory.length > 0 && lastHistory[0]?.version_number
        ? Number(lastHistory[0].version_number) + 1
        : 1;

    await supabaseClient
      .from('simulationhistory')
      .insert({
        client_id: user.database_id,
        simulation_id: simulationId,
        session_token: updatedSimulation.session_token,
        simulation_date: new Date().toISOString(),
        responses,
        results: updatedSimulation.results || {},
        products_updated: 0,
        products_created: 0,
        products_protected: 0,
        total_potential_savings: 0,
        simulation_type: 'client_draft',
        fusion_rules_applied: {},
        conflicts_resolved: [],
        answers_snapshot: mergedAnswers,
        answers_diff: responses,
        status_before: 'en_cours',
        status_after: 'en_cours',
        updated_by: user.database_id,
        version_number: nextVersionNumber
      });

    return res.json({
      success: true,
      data: {
        simulation: updatedSimulation
      },
      message: 'Brouillon enregistré'
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde brouillon:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la sauvegarde du brouillon'
    });
  }
}));

/**
 * POST /api/client/simulation/update
 * Met à jour la simulation d'un client connecté avec fusion intelligente
 */
router.post('/update', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || user.type !== 'client') {
      console.error('❌ Accès non autorisé:', { hasUser: !!user, userType: user?.type });
      return res.status(401).json({
        success: false,
        message: 'Authentification requise - Veuillez vous reconnecter'
      });
    }

    const {
      responses = {},
      simulationType = 'update',
      simulationId
    }: ClientSimulationRequest & { simulationId?: string } = req.body;

    if (!simulationId) {
      return res.status(400).json({
        success: false,
        message: 'simulationId manquant pour la mise à jour'
      });
    }

    console.log('🚀 Finalisation simulation client:', {
      clientId: user.database_id,
      email: user.email,
      simulationType,
      simulationId,
      responsesCount: Object.keys(responses || {}).length
    });

    const { data: draftSimulation, error: draftError } = await supabaseClient
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .eq('client_id', user.database_id)
      .single();

    if (draftError || !draftSimulation) {
      console.error('❌ Simulation introuvable ou inaccessible:', draftError);
      return res.status(404).json({
        success: false,
        message: 'Simulation introuvable'
      });
    }

    if (draftSimulation.status !== 'en_cours') {
      return res.status(409).json({
        success: false,
        message: 'Cette simulation est déjà finalisée'
      });
    }

    const mergedAnswers: Record<string, any> = {
      ...(draftSimulation.answers || {})
    };

    Object.entries(responses || {}).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      mergedAnswers[key] = value;
    });

    const { data: questionnaireQuestions, error: questionnaireError } = await supabaseClient
      .from('QuestionnaireQuestion')
      .select('id, validation_rules, conditions');

    if (questionnaireError) {
      console.error('❌ Erreur récupération questions questionnaire:', questionnaireError);
      return res.status(500).json({
        success: false,
        message: 'Impossible de valider les réponses'
      });
    }

    const missingRequiredQuestions = (questionnaireQuestions || []).filter((question: any) => {
      const rules = question.validation_rules || {};
      const isRequired = rules.required === true;
      if (!isRequired) return false;

      const conditions = question.conditions || null;
      if (conditions && conditions.depends_on) {
        const dependentValue = mergedAnswers[conditions.depends_on];
        if (dependentValue === undefined || dependentValue === null) {
          return false;
        }

        switch (conditions.operator) {
          case 'not_equals':
            if (dependentValue === conditions.value) return false;
            break;
          case 'greater_than':
            if (!(Number(dependentValue) > Number(conditions.value))) return false;
            break;
          case 'less_than':
            if (!(Number(dependentValue) < Number(conditions.value))) return false;
            break;
          case 'equals':
          default:
            if (dependentValue !== conditions.value) return false;
            break;
        }
      }

      const answer = mergedAnswers[question.id];
      if (answer === undefined || answer === null) return true;
      if (typeof answer === 'string' && answer.trim() === '') return true;
      if (Array.isArray(answer) && answer.length === 0) return true;
      return false;
    }).map((question: any) => question.id);

    if (missingRequiredQuestions.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Merci de compléter toutes les réponses obligatoires',
        missing_questions: missingRequiredQuestions
      });
    }

    const nowIso = new Date().toISOString();

    const { data: updatedDraft, error: draftUpdateError } = await supabaseClient
      .from('simulations')
      .update({
        answers: mergedAnswers,
        updated_at: nowIso
      })
      .eq('id', simulationId)
      .select()
      .single();

    if (draftUpdateError || !updatedDraft) {
      console.error('❌ Erreur mise à jour brouillon:', draftUpdateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la simulation'
      });
    }

    const { data: resultatsSQL, error: calculError } = await supabaseClient
      .rpc('evaluer_eligibilite_avec_calcul', {
        p_simulation_id: simulationId
      });

    if (calculError || !resultatsSQL || !resultatsSQL.success) {
      console.error('❌ Erreur calcul SQL:', calculError);

      await supabaseClient
        .from('simulations')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', simulationId);

      return res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul d\'éligibilité'
      });
    }

    console.log(`✅ Calcul SQL réussi: ${resultatsSQL.total_eligible} produits éligibles`);

    const mergeResult = await mergeClientProductsSQL(
      user.database_id,
      simulationId,
      resultatsSQL.produits || []
    );

    const metadataFinale = {
      ...(updatedDraft.metadata || {}),
      finalized_at: new Date().toISOString(),
      finalized_by: user.database_id,
      simulation_type: simulationType
    };

    const { error: finalizeError } = await supabaseClient
      .from('simulations')
      .update({
        status: 'completed',
        results: resultatsSQL,
        metadata: metadataFinale,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (finalizeError) {
      console.error('❌ Erreur finalisation simulation:', finalizeError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la finalisation de la simulation'
      });
    }

    const { data: clientData, error: clientError } = await supabaseClient
      .from('Client')
      .select('status, first_simulation_at')
      .eq('id', user.database_id)
      .single();

    if (clientError) {
      console.error('⚠️ Erreur récupération client:', clientError);
    }

    if (clientData && clientData.status === 'prospect') {
      const { count: simulationCount } = await supabaseClient
        .from('simulations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.database_id)
        .eq('status', 'completed');

      if (simulationCount === 1) {
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
      await supabaseClient
        .from('Client')
        .update({
          last_activity_at: new Date().toISOString()
        })
        .eq('id', user.database_id);
    }

    const { data: lastHistory, error: historyFetchError } = await supabaseClient
      .from('simulationhistory')
      .select('version_number')
      .eq('simulation_id', simulationId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (historyFetchError) {
      console.error('⚠️ Erreur récupération historique simulation:', historyFetchError);
    }

    const nextVersionNumber =
      Array.isArray(lastHistory) && lastHistory.length > 0 && lastHistory[0]?.version_number
        ? Number(lastHistory[0].version_number) + 1
        : 1;

    await supabaseClient
      .from('simulationhistory')
      .insert({
        client_id: user.database_id,
        simulation_id: simulationId,
        session_token: updatedDraft.session_token,
        simulation_date: new Date().toISOString(),
        responses: mergedAnswers,
        results: resultatsSQL,
        products_updated: mergeResult.products_updated,
        products_created: mergeResult.products_created,
        products_protected: mergeResult.products_protected,
        total_potential_savings: mergeResult.total_savings,
        simulation_type: simulationType === 'update' ? 'client_update' : simulationType,
        fusion_rules_applied: {},
        conflicts_resolved: mergeResult.conflicts || [],
        answers_snapshot: mergedAnswers,
        answers_diff: responses || {},
        status_before: 'en_cours',
        status_after: 'completed',
        updated_by: user.database_id,
        version_number: nextVersionNumber
      });

    console.log('✅ Simulation client terminée:', {
      simulationId,
      productsUpdated: mergeResult.products_updated,
      productsCreated: mergeResult.products_created,
      productsProtected: mergeResult.products_protected
    });

    const response: ClientSimulationResponse = {
      success: true,
      data: {
        simulationId,
        productsUpdated: mergeResult.products_updated,
        productsCreated: mergeResult.products_created,
        productsProtected: mergeResult.products_protected,
        totalSavings: mergeResult.total_savings,
        conflicts: mergeResult.conflicts || [],
        historyId: mergeResult.history_id,
        results: resultatsSQL,
        answers: mergedAnswers
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
        const existingStatus = normalizeDossierStatus(existing.statut);

        if (['audit_in_progress', 'complementary_documents_validated', 'expert_validated', 'expert_assigned', 'charte_signed'].includes(existingStatus)) {
          console.log(`🔒 Produit protégé (workflow en cours): ${produit.produit_nom}`);
          productsProtected++;
          conflicts.push({
            produitId: produit.produit_id,
            produitNom: produit.produit_nom,
            reason: 'Produit en cours de traitement',
            existingStatut: existingStatus
          });
          continue;
        }

        // Cas 2 : Produit 'eligible' → METTRE À JOUR si différent
        if (existingStatus === 'pending_upload') {
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
        // Nouveau produit calculé : en mode mise à jour client, on ne le crée pas automatiquement
        console.log(`ℹ️ Produit éligible supplémentaire ignoré en mode mise à jour: ${produit.produit_nom}`);
        productsProtected++;
        conflicts.push({
          produitId: produit.produit_id,
          produitNom: produit.produit_nom,
          reason: 'Produit éligible supplémentaire - non créé en mode mise à jour client',
          montant_estime: produit.montant_estime
        });
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
