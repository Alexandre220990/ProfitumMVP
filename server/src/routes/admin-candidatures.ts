import express from 'express';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import { EmailService } from '../services/EmailService';
import { ApporteurEmailService } from '../services/ApporteurEmailService';
// import { generateTemporaryPassword } from '../utils/auth';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Middleware d'authentification admin
router.use(enhancedAuthMiddleware);

// ===== LISTER LES CANDIDATURES =====
router.get('/apporteur-candidatures', async (req: any, res: Response): Promise<void> => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('ApporteurAffaires')
      .select(`
        *,
        admin:Admin(id, first_name, last_name)
      `)
      .in('status', ['candidature', 'pending_approval'])
      .order('candidature_created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtres
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data: candidatures, error } = await query;

    if (error) {
      console.error('Erreur récupération candidatures:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des candidatures' 
      });
      return;
    }

    res.json({
      success: true,
      data: candidatures || []
    });

  } catch (error) {
    console.error('Erreur list candidatures:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des candidatures' 
    });
  }
});

// ===== DÉTAILS D'UNE CANDIDATURE =====
router.get('/apporteur-candidatures/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: candidature, error } = await supabase
      .from('ApporteurAffaires')
      .select(`
        *,
        admin:Admin(id, first_name, last_name)
      `)
      .eq('id', id)
      .in('status', ['candidature', 'pending_approval'])
      .single();

    if (error || !candidature) {
      res.status(404).json({ 
        success: false, 
        error: 'Candidature non trouvée' 
      });
      return;
    }

    res.json({
      success: true,
      data: candidature
    });

  } catch (error) {
    console.error('Erreur détails candidature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la candidature' 
    });
  }
});

// ===== TÉLÉCHARGER CV =====
router.get('/apporteur-candidatures/:id/cv', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: candidature, error } = await supabase
      .from('ApporteurAffaires')
      .select('cv_file_path, first_name, last_name')
      .eq('id', id)
      .in('status', ['candidature', 'pending_approval'])
      .single();

    if (error || !candidature || !candidature.cv_file_path) {
      res.status(404).json({ 
        success: false, 
        error: 'CV non trouvé' 
      });
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), candidature.cv_file_path);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ 
        success: false, 
        error: 'Fichier CV non trouvé sur le serveur' 
      });
      return;
    }

    const fileName = `CV_${candidature.first_name}_${candidature.last_name}.pdf`;
    res.download(filePath, fileName);

  } catch (error) {
    console.error('Erreur téléchargement CV:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du téléchargement du CV' 
    });
  }
});

// ===== TRAITER UNE CANDIDATURE (APPROUVER/REJETER) =====
router.post('/apporteur-candidatures/:id/process', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body;
    const adminId = req.user.database_id;

    if (!['approve', 'reject', 'request_rdv'].includes(action)) {
      res.status(400).json({ 
        success: false, 
        error: 'Action invalide. Utilisez "approve", "reject" ou "request_rdv"' 
      });
      return;
    }

    // Pour request_rdv, vérifier que les données du RDV sont fournies
    if (action === 'request_rdv') {
      const { rdv_title, rdv_date, rdv_time } = req.body;
      if (!rdv_title || !rdv_date || !rdv_time) {
        res.status(400).json({ 
          success: false, 
          error: 'Pour demander un RDV, les champs rdv_title, rdv_date et rdv_time sont requis' 
        });
        return;
      }
    }

    // Récupérer la candidature
    const { data: candidature, error: candidatureError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('id', id)
      .in('status', ['candidature', 'pending_approval'])
      .single();

    if (candidatureError || !candidature) {
      res.status(404).json({ 
        success: false, 
        error: 'Candidature non trouvée' 
      });
      return;
    }

    let newStatus: string;
    let updateData: any = {
      approved_by: adminId, // Utiliser approved_by au lieu de admin_id
      admin_notes: admin_notes || null,
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      newStatus = 'active';
      updateData.approved_at = new Date().toISOString();
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'request_rdv') {
      const { rdv_title, rdv_date, rdv_time } = req.body;
      newStatus = 'candidature'; // Garder le statut candidature mais marquer la demande de RDV
      updateData.rdv_requested = true;
      updateData.rdv_requested_at = new Date().toISOString();
      updateData.rdv_requested_by = adminId;
      // Stocker les infos du RDV dans admin_notes ou dans une colonne dédiée si elle existe
      updateData.admin_notes = admin_notes || '';
      updateData.rdv_title = rdv_title;
      updateData.rdv_date = rdv_date;
      updateData.rdv_time = rdv_time;
    } else {
      newStatus = 'candidature';
    }

    updateData.status = newStatus;

    // Mettre à jour la candidature
    const { error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Erreur mise à jour candidature:', updateError);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour de la candidature' 
      });
      return;
    }

    // Si approuvée, activer le compte apporteur (le compte auth a déjà été créé lors de l'inscription)
    if (action === 'approve') {
      try {
        // Si le compte auth n'existe pas encore, le créer (cas de migration)
        if (!candidature.auth_user_id) {
          // Générer un mot de passe temporaire si le compte n'existe pas
          const temporaryPassword = 'TempPass' + Math.random().toString(36).substring(2, 15);

          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: candidature.email,
            password: temporaryPassword,
            email_confirm: true
          });

          if (authError) {
            console.error('Erreur création utilisateur auth:', authError);
          } else {
            updateData.auth_user_id = authUser?.user?.id || null;
          }
        } else {
          // Activer le compte existant (confirmer l'email)
          const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
            candidature.auth_user_id,
            { email_confirm: true }
          );

          if (updateAuthError) {
            console.error('Erreur activation compte auth:', updateAuthError);
          }
        }

        // Mettre à jour l'apporteur avec les informations d'activation
        const { data: apporteur, error: apporteurError } = await supabase
          .from('ApporteurAffaires')
          .update({
            ...updateData,
            profitum_share_percentage: 0.10, // 10% par défaut (au lieu de commission_rate)
            affiliation_code: candidature.affiliation_code || `AFF${Date.now().toString().slice(-6)}`,
            is_active: true
          })
          .eq('id', id)
          .select()
          .single();

        if (apporteurError) {
          console.error('Erreur mise à jour apporteur:', apporteurError);
          // Ne pas faire échouer le processus
        }

        // Envoyer email de confirmation (le mot de passe a déjà été défini lors de l'inscription)
        if (apporteur) {
          try {
            await EmailService.sendApporteurApprovalNotification(
              candidature.email,
              candidature.first_name,
              candidature.last_name
            );
          } catch (emailError) {
            console.error('Erreur envoi email confirmation:', emailError);
            // Ne pas faire échouer le processus
          }
        }
      } catch (error) {
        console.error('Erreur activation compte apporteur:', error);
        // Ne pas faire échouer le processus de validation
      }
    }

    // Envoyer email de notification au candidat
    try {
      if (action === 'approve') {
        await EmailService.sendApporteurApprovalNotification(
          candidature.email, 
          candidature.first_name, 
          candidature.last_name
        );
      } else if (action === 'reject') {
        await EmailService.sendApporteurRejectionNotification(
          candidature.email, 
          candidature.first_name, 
          candidature.last_name,
          admin_notes
        );
      } else if (action === 'request_rdv') {
        const { rdv_title, rdv_date, rdv_time } = req.body;
        // Envoyer email à l'admin avec message prédéfini pour ouvrir le mail avec les infos du RDV
        await EmailService.notifyAdminRDVRequest(
          candidature.id,
          candidature.first_name,
          candidature.last_name,
          candidature.email,
          candidature.phone,
          candidature.company_name,
          rdv_title,
          rdv_date,
          rdv_time
        );
      }
    } catch (emailError) {
      console.error('Erreur envoi email notification:', emailError);
      // Ne pas faire échouer le processus
    }

    const actionMessages: Record<string, string> = {
      'approve': 'approuvée',
      'reject': 'rejetée',
      'request_rdv': 'demande de RDV envoyée'
    };

    res.json({
      success: true,
      message: `Candidature ${actionMessages[action] || 'traitée'} avec succès`,
      data: {
        candidature_id: id,
        status: newStatus,
        action: action
      }
    });

  } catch (error) {
    console.error('Erreur traitement candidature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du traitement de la candidature' 
    });
  }
});

// ===== STATISTIQUES CANDIDATURES =====
router.get('/apporteur-candidatures-stats', async (req: any, res: Response): Promise<void> => {
  try {
    const { data: stats, error } = await supabase
      .from('ApporteurAffaires')
      .select('status')
      .then(({ data }) => {
        const counts = {
          total: data?.filter(c => c.status === 'candidature').length || 0,
          pending: data?.filter(c => c.status === 'candidature').length || 0,
          approved: data?.filter(c => c.status === 'active').length || 0,
          rejected: data?.filter(c => c.status === 'rejected').length || 0
        };
        return { data: counts, error: null };
      });

    if (error) {
      console.error('Erreur stats candidatures:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques' 
      });
      return;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur stats candidatures:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

export default router;
