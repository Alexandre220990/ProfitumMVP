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
      .eq('status', 'candidature')
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
      .eq('status', 'candidature')
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
      .eq('status', 'candidature')
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

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ 
        success: false, 
        error: 'Action invalide. Utilisez "approve" ou "reject"' 
      });
      return;
    }

    // Récupérer la candidature
    const { data: candidature, error: candidatureError } = await supabase
      .from('ApporteurAffaires')
      .select('*')
      .eq('id', id)
      .eq('status', 'candidature')
      .single();

    if (candidatureError || !candidature) {
      res.status(404).json({ 
        success: false, 
        error: 'Candidature non trouvée' 
      });
      return;
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';

    // Mettre à jour la candidature
    const { error: updateError } = await supabase
      .from('ApporteurAffaires')
      .update({
        status: newStatus,
        admin_id: adminId,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erreur mise à jour candidature:', updateError);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour de la candidature' 
      });
      return;
    }

    // Si approuvée, créer le compte apporteur
    if (action === 'approve') {
      try {
        // Générer un mot de passe temporaire
        const temporaryPassword = 'TempPass' + Math.random().toString(36).substring(2, 15);

        // Créer l'utilisateur Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: candidature.email,
          password: temporaryPassword,
          email_confirm: true
        });

        if (authError) {
          console.error('Erreur création utilisateur auth:', authError);
          // Continuer même si l'auth échoue
        }

        // Mettre à jour l'apporteur avec les informations d'auth
        const { data: apporteur, error: apporteurError } = await supabase
          .from('ApporteurAffaires')
          .update({
            auth_user_id: authUser?.user?.id || null,
            commission_rate: 0.15, // 15% par défaut
            affiliation_code: `AFF${Date.now().toString().slice(-6)}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (apporteurError) {
          console.error('Erreur mise à jour apporteur:', apporteurError);
          // Ne pas faire échouer le processus
        }

        // Envoyer email avec les identifiants
        if (apporteur) {
          try {
            const credentials = {
              email: candidature.email,
              temporaryPassword: temporaryPassword,
              loginUrl: `${process.env.FRONTEND_URL || 'https://www.profitum.app'}/apporteur/login`,
              firstName: candidature.first_name,
              lastName: candidature.last_name,
              companyName: candidature.company_name,
              companyType: candidature.company_type,
              siren: candidature.siren
            };
            
            await ApporteurEmailService.sendApporteurCredentials(credentials);
          } catch (emailError) {
            console.error('Erreur envoi email identifiants:', emailError);
            // Ne pas faire échouer le processus
          }
        }
      } catch (error) {
        console.error('Erreur création compte apporteur:', error);
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
      } else {
        await EmailService.sendApporteurRejectionNotification(
          candidature.email, 
          candidature.first_name, 
          candidature.last_name,
          admin_notes
        );
      }
    } catch (emailError) {
      console.error('Erreur envoi email notification:', emailError);
      // Ne pas faire échouer le processus
    }

    res.json({
      success: true,
      message: `Candidature ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
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
