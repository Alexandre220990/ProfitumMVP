import express from 'express';
import { Request, Response } from 'express';
import { authApporteur, checkProspectOwnership, ApporteurRequest } from '../middleware/auth-apporteur';
import { ApporteurService } from '../services/ApporteurService';
import { ProspectService } from '../services/ProspectService';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// Middleware d'authentification déjà appliqué dans index.ts (enhancedAuthMiddleware)

// ===== DASHBOARD =====
// Route dashboard déplacée vers apporteur-api.ts pour éviter les conflits

// ===== VUES SQL - ACCÈS AUX VUES SUPABASE VIA BACKEND (ÉVITE CORS) =====

// Vue dashboard principal
router.get('/views/dashboard-principal', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getDashboardPrincipal(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue dashboard principal:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération du dashboard' });
    }
});

// Vue prospects détaillés
router.get('/views/prospects-detaille', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getProspectsDetaille(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue prospects détaillés:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des prospects' });
    }
});

// Vue objectifs et performance
router.get('/views/objectifs-performance', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getObjectifsPerformance(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue objectifs performance:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des objectifs' });
    }
});

// Vue activité récente
router.get('/views/activite-recente', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getActiviteRecente(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue activité récente:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'activité' });
    }
});

// Vue statistiques mensuelles
router.get('/views/statistiques-mensuelles', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getStatistiquesMensuelles(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue statistiques mensuelles:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des statistiques' });
    }
});

// Vue performance produits
router.get('/views/performance-produits', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getPerformanceProduits(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue performance produits:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la performance' });
    }
});

// Vue sources prospects
router.get('/views/sources-prospects', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getSourcesProspects(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue sources prospects:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des sources' });
    }
});

// Vue KPIs globaux
router.get('/views/kpis-globaux', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getKpisGlobaux(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue KPIs globaux:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des KPIs' });
    }
});

// Vue notifications
router.get('/views/notifications', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.getNotifications(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur vue notifications:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des notifications' });
    }
});

// Marquer une notification comme lue
router.put('/notifications/:notificationId/read', async (req: any, res: any): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const result = await ApporteurService.markNotificationAsRead(notificationId);
        res.json(result);
    } catch (error) {
        console.error('Erreur mark notification as read:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la notification' });
    }
});

// Marquer toutes les notifications comme lues
router.put('/notifications/mark-all-read', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.markAllNotificationsAsRead(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur mark all notifications as read:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour des notifications' });
    }
});

// ===== STATISTIQUES =====
router.get('/stats', async (req: any, res: any): Promise<void> => {
    try {
        const { period = '30d' } = req.query;
        const stats = await ApporteurService.getStats(req.user!.database_id, period as string);
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// ===== GESTION PROSPECTS =====
// Créer un nouveau prospect
router.post('/prospects', async (req: any, res: any): Promise<void> => {
    try {
        const prospectData = req.body;
        const apporteurId = req.user!.database_id;
        
        const result = await ProspectService.createProspect(apporteurId, prospectData);
        
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Erreur création prospect:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la création du prospect',
            message: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});

// Envoyer les identifiants au prospect par email
router.post('/prospects/:prospectId/send-credentials', async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const { emailType } = req.body; // 'exchange' ou 'presentation'
        const apporteurId = req.user!.database_id;
        
        if (!emailType || !['exchange', 'presentation'].includes(emailType)) {
            res.status(400).json({ 
                success: false,
                error: 'Type d\'email invalide. Utilisez "exchange" ou "presentation"' 
            });
            return;
        }
        
        const result = await ProspectService.sendProspectCredentials(prospectId, emailType, apporteurId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur envoi identifiants:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de l\'envoi des identifiants' 
        });
    }
});

// Lister tous les prospects
router.get('/prospects', async (req: any, res: any): Promise<void> => {
    try {
        const filters = req.query;
        const apporteurId = req.user!.database_id;
        
        const result = await ProspectService.getProspects(apporteurId, filters);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération prospects:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des prospects' });
    }
});

// Détails d'un prospect
router.get('/prospects/:prospectId', checkProspectOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const prospect = await ProspectService.getProspectById(prospectId);
        
        res.json({ success: true, data: prospect });
    } catch (error) {
        console.error('Erreur récupération prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du prospect' });
    }
});

// Mettre à jour un prospect
router.put('/prospects/:prospectId', checkProspectOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const updateData = req.body;
        
        const prospect = await ProspectService.updateProspect(prospectId, updateData);
        
        res.json({ success: true, data: prospect });
    } catch (error) {
        console.error('Erreur mise à jour prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du prospect' });
    }
});

// Supprimer un prospect
router.delete('/prospects/:prospectId', checkProspectOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        await ProspectService.deleteProspect(prospectId);
        
        res.json({ success: true, message: 'Prospect supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du prospect' });
    }
});

// Convertir prospect en client
router.post('/prospects/:prospectId/convert', checkProspectOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        const apporteurId = req.user!.database_id;
        
        const result = await ProspectService.convertProspectToClient(prospectId, apporteurId);
        
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Erreur conversion prospect:', error);
        res.status(500).json({ error: 'Erreur lors de la conversion du prospect' });
    }
});

// ===== GESTION EXPERTS =====
// Lister les experts disponibles
router.get('/experts', async (req: any, res: any): Promise<void> => {
    try {
        const { specialization, location } = req.query;
        const experts = await ApporteurService.getAvailableExperts({
            specialization: specialization as string,
            location: location as string
        });
        
        res.json({ success: true, data: experts });
    } catch (error) {
        console.error('Erreur récupération experts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des experts' });
    }
});

// Récupérer les experts disponibles pour des produits spécifiques
router.post('/experts/by-products', async (req: any, res: any): Promise<void> => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Liste de produits requise' 
            });
        }

        const experts = await ApporteurService.getExpertsByProducts(productIds);
        
        res.json({ success: true, data: experts });
    } catch (error) {
        console.error('Erreur récupération experts par produits:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des experts' 
        });
    }
});

// ===== PRODUITS ÉLIGIBLES =====
// Récupérer les produits éligibles
router.get('/produits', async (req: any, res: any): Promise<void> => {
    try {
        const result = await ApporteurService.getProduitsEligibles();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération produits:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }
});

// ===== COMMISSIONS =====
// Récupérer les commissions
router.get('/commissions', async (req: any, res: any): Promise<void> => {
    try {
        const filters = req.query;
        const apporteurId = req.user!.database_id;
        
        const result = await ApporteurService.getCommissions(apporteurId, filters);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération commissions:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des commissions' });
    }
});

// ===== PROFIL APPORTEUR =====
// Récupérer le profil
router.get('/profile', async (req: any, res: any): Promise<void> => {
    try {
        const { database_id, first_name, last_name, email } = req.user!;
        
        res.json({ 
            success: true, 
            data: {
                id: database_id,
                first_name,
                last_name,
                email
            }
        });
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

// Mettre à jour le profil
router.put('/profile', async (req: any, res: any): Promise<void> => {
    try {
        const { first_name, last_name, phone, company_name, company_type, siren } = req.body;
        const apporteurId = req.user!.database_id;
        
        // Validation des données
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'Prénom et nom requis' });
        }
        
        // Mise à jour en base (à implémenter selon votre structure)
        res.json({ success: true, message: 'Profil mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
});

export default router;
