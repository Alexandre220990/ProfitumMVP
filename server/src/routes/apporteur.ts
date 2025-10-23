import express from 'express';
import { Request, Response } from 'express';
import { authApporteur, checkProspectOwnership, ApporteurRequest } from '../middleware/auth-apporteur';
import { ApporteurService } from '../services/ApporteurService';
import { ProspectService } from '../services/ProspectService';
import { NotificationService } from '../services/NotificationService';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

// Récupérer les RDV d'un prospect
router.get('/prospects/:prospectId/meetings', checkProspectOwnership as any, async (req: any, res: any): Promise<void> => {
    try {
        const { prospectId } = req.params;
        
        console.log(`📅 Récupération RDV pour prospect ${prospectId}`);
        
        // Récupérer les RDV depuis la table RDV (nouvelle table)
        const { data: meetings, error } = await supabase
            .from('RDV')
            .select(`
                id,
                title,
                description,
                scheduled_date,
                scheduled_time,
                duration_minutes,
                meeting_type,
                status,
                location,
                meeting_url,
                expert:Expert!expert_id (
                    id,
                    name,
                    first_name,
                    last_name,
                    company_name
                )
            `)
            .eq('client_id', prospectId)
            .order('scheduled_date', { ascending: true });

        if (error) {
            console.error('❌ Erreur récupération RDV:', error);
            throw error;
        }

        // Formater les données au format attendu par le frontend
        const formattedMeetings = (meetings || []).map((meeting: any) => ({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description || '',
            start_date: `${meeting.scheduled_date}T${meeting.scheduled_time}`,
            end_date: meeting.scheduled_date && meeting.scheduled_time && meeting.duration_minutes
                ? new Date(new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`).getTime() + meeting.duration_minutes * 60000).toISOString()
                : null,
            type: meeting.meeting_type,
            status: meeting.status,
            location: meeting.location || (meeting.meeting_type === 'video' ? 'En ligne' : null),
            is_online: meeting.meeting_type === 'video',
            meeting_url: meeting.meeting_url,
            expert_name: meeting.expert 
                ? (meeting.expert.first_name && meeting.expert.last_name 
                    ? `${meeting.expert.first_name} ${meeting.expert.last_name}`
                    : meeting.expert.name)
                : null,
            expert_company: meeting.expert?.company_name || null
        }));

        console.log(`✅ ${formattedMeetings.length} RDV trouvés pour le prospect`);

        res.json({ success: true, data: formattedMeetings });
    } catch (error) {
        console.error('❌ Erreur récupération RDV prospect:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des rendez-vous' 
        });
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

// ===== DOSSIERS (ClientProduitEligible) =====
// Récupérer tous les ClientProduitEligible des clients de l'apporteur
router.get('/dossiers', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        
        console.log('🔍 Récupération dossiers pour apporteur:', apporteurId);
        
        // 1. Récupérer tous les clients de l'apporteur (Client avec status='client' OU 'prospect')
        const { data: clients, error: clientsError } = await supabase
            .from('Client')
            .select('id, company_name, email, status')
            .eq('apporteur_id', apporteurId);
        
        if (clientsError) {
            console.error('Erreur récupération clients:', clientsError);
            throw clientsError;
        }
        
        if (!clients || clients.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        const clientIds = clients.map((c: any) => c.id);
        console.log(`📋 ${clientIds.length} clients trouvés pour l'apporteur`);
        
        // 2. Récupérer tous les ClientProduitEligible de ces clients
        const { data: dossiers, error: dossiersError } = await supabase
            .from('ClientProduitEligible')
            .select(`
                id,
                clientId,
                produitId,
                statut,
                progress,
                montantFinal,
                tauxFinal,
                current_step,
                expert_id,
                created_at,
                updated_at,
                Client:Client!inner(
                    id,
                    company_name,
                    email,
                    status,
                    phone_number
                ),
                ProduitEligible:ProduitEligible!inner(
                    id,
                    nom,
                    description,
                    categorie
                ),
                Expert:Expert(
                    id,
                    name,
                    company_name
                )
            `)
            .in('clientId', clientIds)
            .order('created_at', { ascending: false });
        
        if (dossiersError) {
            console.error('Erreur récupération dossiers:', dossiersError);
            throw dossiersError;
        }
        
        console.log(`✅ ${dossiers?.length || 0} dossiers trouvés`);
        
        res.json({ 
            success: true, 
            data: dossiers || [] 
        });
        
    } catch (error) {
        console.error('Erreur récupération dossiers:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des dossiers' 
        });
    }
});

// ===== STATISTIQUES DE CONVERSION =====
// Récupérer les stats de conversion multi-niveaux
router.get('/conversion-stats', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        
        console.log('📊 Récupération stats conversion pour apporteur:', apporteurId);
        
        // 1. Total prospects de l'apporteur
        const { data: allProspects, error: prospectsError } = await supabase
            .from('Client')
            .select('id, status, created_at')
            .eq('apporteur_id', apporteurId);
        
        if (prospectsError) throw prospectsError;
        
        const totalProspects = allProspects?.length || 0;
        const prospectsOnly = allProspects?.filter(p => p.status === 'prospect') || [];
        const clients = allProspects?.filter(p => p.status === 'client') || [];
        
        // 2. Prospects avec RDV (ClientRDV ou RDV ou ProspectMeeting)
        const { data: rdvs, error: rdvError } = await supabase
            .from('RDV')
            .select('id, client_id, status')
            .eq('apporteur_id', apporteurId);
        
        const prospectsAvecRDV = new Set(rdvs?.map(r => r.client_id) || []).size;
        
        // 3. Conversions (ProspectConversion)
        const { data: conversions, error: convError } = await supabase
            .from('ProspectConversion')
            .select(`
                id,
                prospect_id,
                converted_at,
                conversion_value,
                commission_amount,
                Client:Client!inner(
                    id,
                    company_name,
                    email,
                    apporteur_id
                )
            `)
            .eq('Client.apporteur_id', apporteurId);
        
        const totalSignatures = clients.length;
        const rdvAvecSignature = rdvs?.filter(r => 
            clients.some(c => c.id === r.client_id)
        ).length || 0;
        
        // 4. Calculer les taux
        const tauxProspectRDV = totalProspects > 0 ? ((prospectsAvecRDV / totalProspects) * 100).toFixed(1) : '0';
        const tauxProspectSignature = totalProspects > 0 ? ((totalSignatures / totalProspects) * 100).toFixed(1) : '0';
        const tauxRDVSignature = prospectsAvecRDV > 0 ? ((rdvAvecSignature / prospectsAvecRDV) * 100).toFixed(1) : '0';
        
        console.log(`✅ Stats conversion:`, {
            totalProspects,
            prospectsAvecRDV,
            totalSignatures,
            rdvAvecSignature
        });
        
        res.json({
            success: true,
            data: {
                // Métriques absolues
                total_prospects: totalProspects,
                prospects_avec_rdv: prospectsAvecRDV,
                total_signatures: totalSignatures,
                rdv_avec_signature: rdvAvecSignature,
                
                // Taux de conversion
                taux_prospect_rdv: parseFloat(tauxProspectRDV),
                taux_prospect_signature: parseFloat(tauxProspectSignature),
                taux_rdv_signature: parseFloat(tauxRDVSignature),
                
                // Dernières conversions
                recent_conversions: conversions?.slice(0, 5) || [],
                recent_clients: clients.slice(0, 5)
            }
        });
        
    } catch (error) {
        console.error('Erreur récupération stats conversion:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des stats de conversion' 
        });
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
