import express from 'express';
import { Request, Response } from 'express';
import { authApporteur, checkProspectOwnership, ApporteurRequest } from '../middleware/auth-apporteur';
import { ApporteurService } from '../services/ApporteurService';
import { ProspectService } from '../services/ProspectService';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// Middleware d'authentification déjà appliqué dans index.ts (enhancedAuthMiddleware)

// ===== DASHBOARD =====
router.get('/dashboard', async (req: any, res: any): Promise<void> => {
    try {
        const dashboard = await ApporteurService.getDashboard(req.user!.database_id);
        res.json({ success: true, data: dashboard });
    } catch (error) {
        console.error('Erreur dashboard apporteur:', error);
        res.status(500).json({ error: 'Erreur lors du chargement du dashboard' });
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
        res.status(500).json({ error: 'Erreur lors de la création du prospect' });
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
