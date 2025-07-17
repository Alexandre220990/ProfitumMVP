import { Router } from 'express';
import marketplaceRoutes from './marketplace';
import searchRoutes from './search';
import assignmentRoutes from './assignments';
import notificationsRouter from '../expert/notifications';
import notificationPreferencesRouter from '../expert/notification-preferences';

const router = Router();

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