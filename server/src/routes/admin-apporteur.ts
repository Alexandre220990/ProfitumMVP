import express from 'express';
import { Request, Response } from 'express';
import { AdminApporteurService } from '../services/AdminApporteurService';

const router = express.Router();

// Note: L'authentification admin est déjà gérée par enhancedAuthMiddleware + requireUserType('admin') dans index.ts
// Pas besoin de middleware supplémentaire ici

// ===== CRÉER UN APPORTEUR =====
router.post('/create', async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.database_id;
        const apporteurData = req.body;
        
        console.log('🔍 Données reçues pour création apporteur:', {
            adminId,
            apporteurData: {
                first_name: apporteurData.first_name,
                last_name: apporteurData.last_name,
                email: apporteurData.email,
                phone: apporteurData.phone,
                company_name: apporteurData.company_name,
                company_type: apporteurData.company_type,
                siren: apporteurData.siren,
                password: apporteurData.password ? '***' : 'MANQUANT',
                confirm_password: apporteurData.confirm_password ? '***' : 'MANQUANT'
            }
        });
        
        const result = await AdminApporteurService.createApporteur(adminId, apporteurData);
        
        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Apporteur d\'affaires créé avec succès',
                data: result.apporteur
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur création apporteur:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la création de l\'apporteur' 
        });
    }
});

// ===== LISTER LES APPORTEURS =====
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const result = await AdminApporteurService.getApporteurs({
            status: status as string,
            page: Number(page),
            limit: Number(limit)
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération apporteurs:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la récupération des apporteurs' 
        });
    }
});

// ===== DÉTAILS D'UN APPORTEUR =====
router.get('/:apporteurId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { apporteurId } = req.params;
        
        // Récupérer les détails de l'apporteur avec ses prospects
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: apporteur, error: apporteurError } = await supabase
            .from('ApporteurAffaires')
            .select(`
                *,
                prospects:Prospect(
                    id,
                    company_name,
                    decision_maker_first_name,
                    decision_maker_last_name,
                    status,
                    qualification_score,
                    created_at
                )
            `)
            .eq('id', apporteurId)
            .single();

        if (apporteurError || !apporteur) {
            res.status(404).json({ 
                success: false,
                error: 'Apporteur non trouvé' 
            });
            return;
        }

        res.json({ 
            success: true, 
            data: apporteur 
        });
    } catch (error) {
        console.error('Erreur récupération apporteur:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la récupération de l\'apporteur' 
        });
    }
});

// ===== ACTIVER/DÉSACTIVER UN APPORTEUR =====
router.put('/:apporteurId/status', async (req: Request, res: Response): Promise<void> => {
    try {
        const { apporteurId } = req.params;
        const { status } = req.body;
        const adminId = (req as any).user.database_id;
        
        if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Statut invalide. Valeurs autorisées: active, inactive, suspended'
            });
            return;
        }
        
        const result = await AdminApporteurService.updateApporteurStatus(apporteurId, status, adminId);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Statut de l'apporteur mis à jour avec succès`
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la mise à jour du statut' 
        });
    }
});

// ===== MODIFIER LE TAUX DE COMMISSION =====
router.put('/:apporteurId/commission-rate', async (req: Request, res: Response): Promise<void> => {
    try {
        const { apporteurId } = req.params;
        const { commission_rate } = req.body;
        const adminId = (req as any).user.database_id;
        
        if (typeof commission_rate !== 'number' || commission_rate < 0 || commission_rate > 100) {
            res.status(400).json({
                success: false,
                error: 'Le taux de commission doit être un nombre entre 0 et 100'
            });
            return;
        }
        
        const result = await AdminApporteurService.updateCommissionRate(apporteurId, commission_rate, adminId);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Taux de commission mis à jour avec succès'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur mise à jour commission:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la mise à jour du taux de commission' 
        });
    }
});

// ===== STATISTIQUES APPORTEURS =====
router.get('/stats/overview', async (req: Request, res: Response) => {
    try {
        const result = await AdminApporteurService.getApporteurStats();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
});

// ===== SUPPRIMER UN APPORTEUR =====
router.delete('/:apporteurId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { apporteurId } = req.params;
        
        // Récupérer l'auth_user_id avant suppression
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        const { data: apporteur, error: fetchError } = await supabase
            .from('ApporteurAffaires')
            .select('auth_user_id')
            .eq('id', apporteurId)
            .single();

        if (fetchError || !apporteur) {
            res.status(404).json({
                success: false,
                error: 'Apporteur non trouvé'
            });
            return;
        }

        // Supprimer l'apporteur (cascade supprimera les prospects)
        const { error: deleteError } = await supabase
            .from('ApporteurAffaires')
            .delete()
            .eq('id', apporteurId);

        if (deleteError) throw deleteError;

        // Supprimer l'utilisateur auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(apporteur.auth_user_id);
        
        if (authDeleteError) {
            console.warn('Erreur suppression utilisateur auth:', authDeleteError);
        }

        res.json({
            success: true,
            message: 'Apporteur supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression apporteur:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la suppression de l\'apporteur' 
        });
    }
});

export default router;
