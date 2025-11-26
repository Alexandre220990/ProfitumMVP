import { Router } from 'express';
// Import des routes supprimées - commentées car les fichiers n'existent plus
// import marketplaceRoutes from './marketplace';
// import searchRoutes from './search';
import assignmentRoutes from './assignments';
import notificationsRouter from '../expert/notifications';
import notificationPreferencesRouter from '../expert/notification-preferences';
import { asyncHandler } from '../../utils/asyncHandler';
import { supabase } from '../../lib/supabase';
import { enhancedAuthMiddleware } from '../../middleware/auth-enhanced';

const router = Router();

// Route publique pour récupérer les experts approuvés (marketplace)
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { speciality, experience, rating, availability } = req.query;
    
    let query = supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        specializations,
        experience,
        location,
        rating,
        description,
        compensation:client_fee_percentage,
        status,
        disponibilites,
        certifications,
        completed_projects,
        created_at
      `)
      .eq('status', 'active')
      .eq('approval_status', 'approved');

    // Filtres optionnels
    if (speciality) {
      query = query.contains('specializations', [speciality]);
    }
    
    if (experience) {
      const minExperience = parseInt(experience as string);
      query = query.gte('experience', minExperience);
    }
    
    if (rating) {
      const minRating = parseFloat(rating as string);
      query = query.gte('rating', minRating);
    }
    
    if (availability) {
      query = query.eq('disponibilites', availability);
    }

    const { data: experts, error } = await query.order('rating', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: experts || []
    });

  } catch (error) {
    console.error('Erreur récupération experts marketplace:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts'
    });
  }
}));

// Routes de la marketplace - commentées car les fichiers n'existent plus
// router.use('/marketplace', marketplaceRoutes);

// Routes de recherche - commentées car les fichiers n'existent plus
// router.use('/search', searchRoutes);

// Routes des assignations
router.use('/assignments', assignmentRoutes);

// Routes de notifications
router.use('/notifications', notificationsRouter);
router.use('/notification-preferences', notificationPreferencesRouter);

// GET /api/experts/approval-status
// Récupérer le statut d'approbation de l'expert connecté
router.get('/approval-status', enhancedAuthMiddleware, asyncHandler(async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user || user.type !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux experts'
      });
    }

    const { data: expert, error } = await supabase
      .from('Expert')
      .select('id, approval_status, status')
      .eq('id', user.database_id)
      .single();

    if (error) {
      console.error('❌ Erreur récupération statut approbation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut'
      });
    }

    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé'
      });
    }

    return res.json({
      success: true,
      data: {
        status: expert.approval_status || 'pending',
        active: expert.status === 'active'
      }
    });
  } catch (error) {
    console.error('❌ Erreur route approval-status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}));

export default router; 