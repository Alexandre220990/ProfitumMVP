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

// Notifications avec pagination/filtre
router.get('/notifications', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const {
            page = '1',
            limit = '20',
            type,
            priority,
            status,
            search,
            includeArchived
        } = req.query;

        const filters = {
            page: Number(page),
            limit: Number(limit),
            type: type as string | undefined,
            priority: priority as string | undefined,
            status: status as string | undefined,
            search: search as string | undefined,
            includeArchived: includeArchived === 'true'
        };

        const result = await ApporteurService.getNotifications(apporteurId, filters);
        res.json(result);
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des notifications' });
    }
});

// Marquer une notification comme lue
router.put('/notifications/:notificationId/read', async (req: any, res: any): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.markNotificationAsRead(notificationId, apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur mark notification as read:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la notification' });
    }
});

// Marquer une notification comme non lue
router.put('/notifications/:notificationId/unread', async (req: any, res: any): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.markNotificationAsUnread(notificationId, apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur mark notification as unread:', error);
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

// Archiver une notification
router.put('/notifications/:notificationId/archive', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const { notificationId } = req.params;
        const result = await ApporteurService.archiveNotification(notificationId, apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur archivage notification:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'archivage de la notification' });
    }
});

// Archiver toutes les notifications
router.put('/notifications/archive-all', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const result = await ApporteurService.archiveAllNotifications(apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur archivage notifications:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'archivage des notifications' });
    }
});

// Supprimer une notification
router.delete('/notifications/:notificationId', async (req: any, res: any): Promise<void> => {
    try {
        const apporteurId = req.user!.database_id;
        const { notificationId } = req.params;
        const result = await ApporteurService.deleteNotification(notificationId, apporteurId);
        res.json(result);
    } catch (error) {
        console.error('Erreur suppression notification:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la notification' });
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

/**
 * GET /api/apporteur/commissions
 * Liste des commissions Profitum pour l'apporteur
 */
router.get('/commissions', async (req: any, res: any): Promise<void> => {
  try {
    const apporteurId = req.user?.database_id;

    if (!apporteurId) {
      res.status(403).json({
        success: false,
        message: 'Accès réservé aux apporteurs'
      });
      return;
    }

    console.log('💰 Récupération commissions apporteur:', apporteurId);

    // Récupérer toutes les factures avec commission apporteur
    const { data: invoices, error } = await supabase
      .from('invoice')
      .select(`
        *,
        ClientProduitEligible(
          id,
          montantFinal,
          Client(company_name, nom, prenom),
          ProduitEligible(nom)
        )
      `)
      .eq('apporteur_id', apporteurId)
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération commissions apporteur:', error);
      throw error;
    }

    // Calculer les commissions à partir des factures
    const commissionsAvecDetails = (invoices || []).map(inv => {
      const metadata = inv.metadata as any || {};
      const commissionApporteur = metadata.commission_apporteur || 0;
      const tauxApporteur = inv.taux_commission_apporteur || 0.10;

      return {
        ...inv,
        commission_apporteur: commissionApporteur,
        taux_commission: tauxApporteur
      };
    });

    // Calculer les totaux
    const totaux = {
      nombre_factures: commissionsAvecDetails.length,
      total_commissions: commissionsAvecDetails.reduce((sum, inv) => sum + (inv.commission_apporteur || 0), 0),
      commissions_payees: commissionsAvecDetails.filter(inv => inv.status === 'paid').length,
      montant_paye: commissionsAvecDetails
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.commission_apporteur || 0), 0),
      montant_en_attente: commissionsAvecDetails
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + (inv.commission_apporteur || 0), 0)
    };

    console.log(`✅ ${totaux.nombre_factures} commission(s) trouvée(s)`);

    res.json({
      success: true,
      data: commissionsAvecDetails,
      totaux
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération commissions apporteur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

// GET /api/apporteur/events/:id/synthese - Synthèse complète d'un événement pour apporteur
router.get('/events/:id/synthese', async (req: any, res: any): Promise<void> => {
  try {
    if (!req.user || req.user.type !== 'apporteur') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux apporteurs' });
    }

    const { id } = req.params;
    const apporteurId = req.user.database_id;
    
    console.log(`🔍 Récupération synthèse événement ${id} pour apporteur ${apporteurId}`);

    // Récupérer l'événement avec vérification que l'apporteur y a accès
    const { data: event, error: eventError } = await supabase
      .from('RDV')
      .select(`
        *,
        Client:client_id (
          id,
          company_name,
          first_name,
          last_name,
          name,
          email,
          phone_number
        ),
        Expert:expert_id (
          id,
          first_name,
          last_name,
          name,
          company_name,
          email,
          cabinet_id,
          Cabinet:cabinet_id (
            id,
            name,
            siret
          )
        ),
        ApporteurAffaires:apporteur_id (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        ),
        RDV_Produits (
          produit_id,
          ProduitEligible:produit_id (
            id,
            nom,
            description,
            categorie
          )
        ),
        RDV_Participants (
          user_id,
          user_type,
          status
        )
      `)
      .eq('id', id)
      .eq('apporteur_id', apporteurId)
      .single();

    if (eventError || !event) {
      console.error('❌ Erreur récupération événement:', eventError);
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé ou accès non autorisé'
      });
    }

    // Récupérer le rapport si existant
    const { data: report, error: reportError } = await supabase
      .from('RDV_Report')
      .select('*')
      .eq('rdv_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('❌ Erreur récupération rapport:', reportError);
    }

    // Enrichir les participants avec leurs informations
    const enrichedParticipants = [];
    if (event.RDV_Participants && event.RDV_Participants.length > 0) {
      for (const participant of event.RDV_Participants) {
        let participantData = null;
        
        if (participant.user_type === 'client') {
          const { data: clientData } = await supabase
            .from('Client')
            .select('id, name, email, company_name')
            .eq('id', participant.user_id)
            .single();
          participantData = clientData;
        } else if (participant.user_type === 'expert') {
          const { data: expertData } = await supabase
            .from('Expert')
            .select('id, name, email, company_name')
            .eq('id', participant.user_id)
            .single();
          participantData = expertData;
        } else if (participant.user_type === 'apporteur') {
          const { data: apporteurData } = await supabase
            .from('ApporteurAffaires')
            .select('id, first_name, last_name, company_name, email')
            .eq('id', participant.user_id)
            .single();
          participantData = apporteurData;
        }

        if (participantData) {
          enrichedParticipants.push({
            ...participant,
            ...participantData
          });
        }
      }
    }

    console.log('✅ Synthèse événement récupérée pour apporteur:', event.id);

    return res.json({
      success: true,
      data: {
        event: {
          ...event,
          RDV_Participants: enrichedParticipants
        },
        report: report || null
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur route apporteur events/:id/synthese:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
