import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { DossierStepGenerator } from '../services/dossierStepGenerator';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import jwt from 'jsonwebtoken';

const router = Router();

console.log('🔧 Module dossier-steps chargé');

// POST /api/dossier-steps/generate - Générer les étapes pour un dossier spécifique
router.post('/generate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.body;
    
    if (!dossier_id) {
      return res.status(400).json({
        success: false,
        message: 'dossier_id requis'
      });
    }

    console.log(`🔧 Génération des étapes pour le dossier: ${dossier_id}`);
    
    const success = await DossierStepGenerator.generateStepsForDossier(dossier_id);
    
    if (success) {
      // Mettre à jour le progress du dossier
      await DossierStepGenerator.updateDossierProgress(dossier_id);
      
      return res.json({
        success: true,
        message: 'Étapes générées avec succès'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des étapes'
      });
    }
  } catch (error) {
    console.error('❌ Erreur génération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier/documents/upload - Upload de documents pour l'éligibilité TICPE
router.post('/documents/upload', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id, document_type, file_data, file_name, file_size, mime_type } = req.body;
    const user = req.user;

    if (!dossier_id || !document_type || !file_data) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, ProduitEligible(nom)')
      .eq('id', dossier_id)
      .single();

    if (dossierError || !dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (!user || dossier.clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Créer l'enregistrement du document
    const { data: document, error: docError } = await supabase
      .from('DocumentFile')
      .insert({
        client_id: user?.id,
        original_filename: file_name,
        stored_filename: `${Date.now()}_${file_name}`,
        file_path: `dossiers/${dossier_id}/${document_type}/${file_name}`,
        file_size: file_size,
        mime_type: mime_type,
        category: 'document_eligibilite',
        document_type: document_type,
        description: `Document ${document_type} pour dossier TICPE`,
        status: 'uploaded',
        validation_status: 'pending',
        metadata: {
          dossier_id: dossier_id,
          product_type: dossier.ProduitEligible?.[0]?.nom,
          uploaded_by: user?.id,
          upload_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Erreur création document:', docError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du document'
      });
    }

    // Vérifier si tous les documents requis sont uploadés
    await checkEligibilityDocumentsComplete(dossier_id);

    return res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: document
    });

  } catch (error) {
    console.error('❌ Erreur upload document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier/eligibility/validate - Validation admin de l'éligibilité
router.post('/eligibility/validate', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id, is_eligible, admin_notes } = req.body;
    const user = req.user;

    if (!dossier_id || typeof is_eligible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier que l'utilisateur est admin
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Mettre à jour le statut du dossier
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        statut: is_eligible ? 'eligible_confirmed' : 'non_eligible',
        notes: admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossier_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour dossier:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation'
      });
    }

    // Mettre à jour l'étape correspondante
    const { error: stepError } = await supabase
      .from('DossierStep')
      .update({
        status: is_eligible ? 'completed' : 'overdue',
        progress: is_eligible ? 100 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Confirmer l\'éligibilité');

    if (stepError) {
      console.error('❌ Erreur mise à jour étape:', stepError);
    }

    // Si éligible, passer à l'étape suivante
    if (is_eligible) {
      await supabase
        .from('DossierStep')
        .update({
          status: 'in_progress',
          progress: 0,
          updated_at: new Date().toISOString()
        })
        .eq('dossier_id', dossier_id)
        .eq('step_name', 'Sélection de l\'expert');
    }

    // Mettre à jour le progress global
    await DossierStepGenerator.updateDossierProgress(dossier_id);

    return res.json({
      success: true,
      message: `Éligibilité ${is_eligible ? 'confirmée' : 'refusée'} avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur validation éligibilité:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// OPTIONS /api/dossier-steps/expert/select - Preflight request
router.options('/expert/select', (req: Request, res: Response) => {
  console.log('🔍 [DEBUG] OPTIONS request reçue sur /expert/select');
  console.log('🔍 [DEBUG] Headers OPTIONS:', req.headers);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).send();
});

// GET /api/dossier-steps/expert/select - Route temporaire pour debug
router.get('/expert/select', (req: Request, res: Response) => {
  console.log('🔍 [DEBUG] GET request reçue sur /expert/select');
  res.status(405).json({
    success: false,
    message: 'Méthode GET non autorisée. Utilisez POST.',
    allowedMethods: ['POST', 'OPTIONS']
  });
});

// POST /api/dossier-steps/expert/select - Sélection d'un expert par le client
console.log('🔧 Route /expert/select définie');
router.post('/expert/select', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DEBUG] Endpoint /expert/select appelé');
    console.log('🔍 [DEBUG] Method:', req.method);
    console.log('🔍 [DEBUG] Headers:', req.headers);
    console.log('🔍 [DEBUG] Body:', req.body);
    console.log('🔍 [DEBUG] User:', req.user);
    
    const { dossier_id, expert_id } = req.body;
    const user = req.user;

    if (!dossier_id || !expert_id) {
      console.error('❌ [DEBUG] Paramètres manquants:', { dossier_id, expert_id });
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    console.log('🔍 [DEBUG] Paramètres reçus:', { dossier_id, expert_id, userId: user?.id, userType: user?.type });

    // Vérifier que l'utilisateur est le propriétaire du dossier
    console.log('🔍 [DEBUG] Recherche dossier:', dossier_id);
    const { data: dossier, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, statut')
      .eq('id', dossier_id)
      .single();

    if (dossierError) {
      console.error('❌ [DEBUG] Erreur recherche dossier:', dossierError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche du dossier'
      });
    }

    if (!dossier) {
      console.error('❌ [DEBUG] Dossier non trouvé:', dossier_id);
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    if (!user || dossier.clientId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    console.log('🔍 [DEBUG] Dossier trouvé:', { clientId: dossier.clientId, statut: dossier.statut });
    
    // Permettre la sélection d'expert dès l'étape 1 (éligibilité)
    if (dossier.statut !== 'eligible' && dossier.statut !== 'en_cours') {
      console.error('❌ [DEBUG] Statut dossier incorrect:', dossier.statut);
      return res.status(400).json({
        success: false,
        message: 'Le dossier doit être éligible ou en cours pour sélectionner un expert'
      });
    }

    // Vérifier que l'expert existe et est disponible
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email, specializations, status')
      .eq('id', expert_id)
      .eq('status', 'active')
      .single();

    if (expertError || !expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé ou non disponible'
      });
    }

    // Mettre à jour l'expert_id dans ClientProduitEligible
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        expert_id: expert_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', dossier_id);

    if (updateError) {
      console.error('❌ Erreur mise à jour expert_id:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du dossier'
      });
    }

    // Créer l'assignation d'expert
    const { data: assignment, error: assignError } = await supabase
      .from('expertassignment')
      .insert({
        expert_id: expert_id,
        client_id: user?.id,
        client_produit_eligible_id: dossier_id,
        statut: 'pending',
        assignment_date: new Date().toISOString(),
        notes: `Assignation pour dossier TICPE ${dossier_id}`
      })
      .select()
      .single();

    if (assignError) {
      console.error('❌ Erreur création assignation:', assignError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la sélection de l\'expert'
      });
    }

    // Mettre à jour l'étape de sélection d'expert
    const { error: stepError } = await supabase
      .from('DossierStep')
      .update({
        status: 'completed',
        progress: 100,
        assignee_id: expert_id,
        assignee_name: expert.name,
        assignee_type: 'expert',
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Sélection de l\'expert');

    if (stepError) {
      console.error('❌ Erreur mise à jour étape:', stepError);
    }

    // Passer à l'étape suivante
    await supabase
      .from('DossierStep')
      .update({
        status: 'in_progress',
        progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('dossier_id', dossier_id)
      .eq('step_name', 'Collecte des documents');

    // Mettre à jour le progress global
    await DossierStepGenerator.updateDossierProgress(dossier_id);

    return res.json({
      success: true,
      message: 'Expert sélectionné avec succès',
      data: {
        assignment,
        expert: {
          id: expert.id,
          name: expert.name,
          email: expert.email
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur sélection expert:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la sélection de l\'expert',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST /api/dossier/expert/accept - Acceptation de l'assignation par l'expert
router.post('/expert/accept', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { assignment_id, expert_notes } = req.body;
    const user = req.user;

    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'assignment_id requis'
      });
    }

    // Vérifier que l'utilisateur est l'expert assigné
    const { data: assignment, error: assignError } = await supabase
      .from('ExpertAssignment')
      .select('id, expert_id, client_produit_id, status')
      .eq('id', assignment_id)
      .single();

    if (assignError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignation non trouvée'
      });
    }

    if (!user || assignment.expert_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette assignation ne peut plus être acceptée'
      });
    }

    // Accepter l'assignation
    const { error: updateError } = await supabase
      .from('ExpertAssignment')
      .update({
        status: 'accepted',
        accepted_date: new Date().toISOString(),
        notes: expert_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment_id);

    if (updateError) {
      console.error('❌ Erreur acceptation assignation:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'acceptation'
      });
    }

    return res.json({
      success: true,
      message: 'Assignation acceptée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur acceptation expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Fonction utilitaire pour vérifier si tous les documents d'éligibilité sont uploadés
async function checkEligibilityDocumentsComplete(dossier_id: string): Promise<boolean> {
  try {
    const { data: documents, error } = await supabase
      .from('DocumentFile')
      .select('document_type, status')
      .eq('metadata->>dossier_id', dossier_id)
      .eq('category', 'document_eligibilite')
      .in('document_type', ['kbis', 'immatriculation']);

    if (error || !documents) {
      return false;
    }

    const hasKbis = documents.some(doc => doc.document_type === 'kbis' && doc.status === 'uploaded');
    const hasImmatriculation = documents.some(doc => doc.document_type === 'immatriculation' && doc.status === 'uploaded');

    return hasKbis && hasImmatriculation;
  } catch (error) {
    console.error('❌ Erreur vérification documents:', error);
    return false;
  }
}

// GET /api/dossier-steps/:dossier_id - Récupérer les étapes d'un dossier
router.get('/:dossier_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { dossier_id } = req.params;
    
    const { data: steps, error } = await supabase
      .from('DossierStep')
      .select('*')
      .eq('dossier_id', dossier_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération des étapes:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des étapes'
      });
    }

    return res.json({
      success: true,
      data: steps || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération étapes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/dossier-steps/:step_id - Mettre à jour une étape
router.put('/:step_id', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { step_id } = req.params;
    const updateData = req.body;
    
    const { data: step, error } = await supabase
      .from('DossierStep')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', step_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour étape:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'étape'
      });
    }

    // Mettre à jour le progress du dossier parent
    if (step) {
      await DossierStepGenerator.updateDossierProgress(step.dossier_id);
    }

    return res.json({
      success: true,
      data: step
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour étape:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/dossier-steps/auto-generate - Déclencheur automatique
router.post('/auto-generate', async (req: Request, res: Response) => {
  try {
    // Cette route peut être appelée par un webhook ou un cron job
    console.log('🤖 Déclenchement automatique de la génération des étapes...');
    
    const result = await DossierStepGenerator.generateStepsForAllEligibleDossiers();
    
    return res.json({
      success: true,
      message: 'Génération automatique terminée',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur génération automatique:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router; 