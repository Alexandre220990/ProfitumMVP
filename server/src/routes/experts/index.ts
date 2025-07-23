import { Router } from 'express';
import marketplaceRoutes from './marketplace';
import searchRoutes from './search';
import assignmentRoutes from './assignments';
import notificationsRouter from '../expert/notifications';
import notificationPreferencesRouter from '../expert/notification-preferences';
import { asyncHandler } from '../../utils/asyncHandler';
import { supabase } from '../../lib/supabase';

const router = Router();

// Route publique pour récupérer les experts approuvés (marketplace)
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { data: experts, error } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        company_name,
        specializations,
        experience,
        location,
        rating,
        description,
        compensation,
        status,
        disponibilites,
        certifications,
        created_at
      `)
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .order('rating', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: experts || []
    });

  } catch (error) {
    console.error('Erreur récupération experts marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des experts'
    });
  }
}));

// Routes de la marketplace
router.use('/marketplace', marketplaceRoutes);

// Routes de recherche
router.use('/search', searchRoutes);

// Routes des assignations
router.use('/assignments', assignmentRoutes);

// Routes de notifications
router.use('/notifications', notificationsRouter);
router.use('/notification-preferences', notificationPreferencesRouter);

export default router; 