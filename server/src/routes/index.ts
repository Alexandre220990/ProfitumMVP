import { Router } from "express";
import authRoutes from "./auth";
import auditRoutes from "./audits";
import simulationRoutes from "./simulations";
import partnerRoutes from "./partners";
import produitsEligiblesRoutes from "./produits-eligibles";
import chatbotRoutes from "./chatbot";
import charteSignatureRoutes from "./charte-signature";
import specializationsRoutes from "./specializations";
import expertsRoutes from "./experts";
import adminRoutes from "./admin";

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des audits
router.use('/audits', auditRoutes);

// Routes des simulations
router.use('/simulations', simulationRoutes);

// Routes des partenaires
router.use('/partners', partnerRoutes);

// Routes des produits éligibles
router.use('/produits-eligibles', produitsEligiblesRoutes);

// Routes du chatbot
router.use('/chatbot', chatbotRoutes);

// Routes des signatures de charte
router.use('/api', charteSignatureRoutes);

// Routes des spécialisations
router.use('/specializations', specializationsRoutes);

// Routes des experts
router.use('/experts', expertsRoutes);

// Routes administrateur
router.use('/admin', adminRoutes);

export default router; 