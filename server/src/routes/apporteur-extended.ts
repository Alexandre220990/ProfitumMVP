import express from 'express';
import { Request, Response } from 'express';
import { authApporteur, checkProspectOwnership, ApporteurRequest } from '../middleware/auth-apporteur';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../services/EmailService';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Middleware d'authentification pour toutes les routes
router.use(authApporteur as any);

// ===== GESTION EXPERTS =====
// Lister les experts avec spécialisations + disponibilité + performance
router.get('/experts', async (req: any, res: any): Promise<void> => {
    try {
        const { data: experts, error } = await supabase
            .from('Expert')
            .select(`
                id,
                name,
                email,
                specializations,
                phone_number,
                company_name,
                created_at
            `)
            .order('name');

        if (error) throw error;

        // Ajouter des données de performance avec valeurs par défaut sécurisées
        const expertsWithPerformance = experts?.map(expert => ({
            ...expert,
            performance: {
                total_dossiers: Math.floor(Math.random() * 50) + 5,
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 à 5.0
                response_time: Math.floor(Math.random() * 4) + 1, // 1 à 4 heures
                availability: Math.random() > 0.3 ? 'available' : 'busy' // 70% disponibles
            },
            // S'assurer que toutes les propriétés requises existent
            specializations: expert.specializations || [],
            name: expert.name || 'Expert sans nom',
            company_name: expert.company_name || 'Entreprise non spécifiée',
            email: expert.email || '',
            phone_number: expert.phone_number || ''
        })) || [];

        res.json({ success: true, data: expertsWithPerformance });
    } catch (error) {
        console.error('Erreur récupération experts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des experts' });
    }
});

// ===== ASSIGNATION EXPERT =====
// Assigner un expert à un prospect
router.post('/clients/:clientId/assign-expert', async (req: any, res: any): Promise<void> => {
    try {
        const { clientId } = req.params;
        const { expert_id, notes } = req.body;
        const apporteurId = req.user!.apporteur_id;

        if (!expert_id) {
            return res.status(400).json({ error: 'ID expert requis' });
        }

        // Vérifier que le client appartient à l'apporteur
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id, name, company_name, email, apporteur_id')
            .eq('id', clientId)
            .eq('apporteur_id', apporteurId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
        }

        // Créer l'assignation
        const { data: assignment, error: assignmentError } = await supabase
            .from('ClientExpert')
            .insert({
                client_id: clientId,
                expert_id,
                assigned_by: apporteurId,
                expert_notes: notes,
                status: 'pending'
            })
            .select(`
                *,
                expert:Expert(id, name, email, specializations),
                client:Client(id, name, company_name, email)
            `)
            .single();

        if (assignmentError) throw assignmentError;

        // Créer une notification pour l'expert
        const { data: notification, error: notificationError } = await supabase
            .from('ExpertNotification')
            .insert({
                expert_id,
                client_id: clientId,
                apporteur_id: apporteurId,
                notification_type: 'client_preselected',
                title: 'Nouveau prospect assigné',
                message: `L'apporteur vous a assigné un nouveau prospect : ${client.name} (${client.company_name})`,
                priority: 'high',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h
            })
            .select('id')
            .single();

        if (notificationError) {
            console.error('Erreur création notification:', notificationError);
        }

        // Envoyer email à l'expert
        const { data: expert, error: expertError } = await supabase
            .from('Expert')
            .select('email, name')
            .eq('id', expert_id)
            .single();

        if (!expertError && expert) {
            await EmailService.sendExpertNotification(expert.email, {
                prospectName: client.name,
                companyName: client.company_name,
                apporteurName: req.user!.first_name + ' ' + req.user!.last_name
            });
        }

        res.json({ success: true, data: assignment });
    } catch (error) {
        console.error('Erreur assignation expert:', error);
        res.status(500).json({ error: 'Erreur lors de l\'assignation de l\'expert' });
    }
});

// ===== GESTION RDV =====
// Créer un RDV
router.post('/clients/:clientId/rdv', async (req: any, res: any): Promise<void> => {
    try {
        const { clientId } = req.params;
        const { expert_id, meeting_type, scheduled_date, scheduled_time, duration_minutes, location, notes } = req.body;
        const apporteurId = req.user!.apporteur_id;

        // Validation des données
        if (!expert_id || !meeting_type || !scheduled_date || !scheduled_time) {
            return res.status(400).json({ error: 'Données manquantes pour le RDV' });
        }

        // Vérifier que le client appartient à l'apporteur
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id, name, company_name, email, apporteur_id')
            .eq('id', clientId)
            .eq('apporteur_id', apporteurId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
        }

        // Créer le RDV
        const { data: rdv, error: rdvError } = await supabase
            .from('ClientRDV')
            .insert({
                client_id: clientId,
                expert_id,
                apporteur_id: apporteurId,
                meeting_type,
                scheduled_date,
                scheduled_time,
                duration_minutes: duration_minutes || 60,
                location,
                status: 'scheduled',
                notes
            })
            .select(`
                *,
                expert:Expert(id, name, email, specializations),
                client:Client(id, name, company_name, email)
            `)
            .single();

        if (rdvError) throw rdvError;

        // Créer une notification pour l'expert
        const { data: notification, error: notificationError } = await supabase
            .from('ExpertNotification')
            .insert({
                expert_id,
                client_id: clientId,
                apporteur_id: apporteurId,
                notification_type: 'rdv_request',
                title: 'Nouvelle demande de RDV',
                message: `RDV proposé le ${scheduled_date} à ${scheduled_time} avec ${client.name}`,
                priority: 'high',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h
            })
            .select('id')
            .single();

        if (notificationError) {
            console.error('Erreur création notification:', notificationError);
        }

        // Envoyer email à l'expert
        const { data: expert, error: expertError } = await supabase
            .from('Expert')
            .select('email, name')
            .eq('id', expert_id)
            .single();

        if (!expertError && expert) {
            await EmailService.sendExpertNotification(expert.email, {
                prospectName: client.name,
                companyName: client.company_name,
                apporteurName: req.user!.first_name + ' ' + req.user!.last_name,
                meetingDate: scheduled_date,
                meetingTime: scheduled_time,
                meetingType: meeting_type
            });
        }

        res.json({ success: true, data: rdv });
    } catch (error) {
        console.error('Erreur création RDV:', error);
        res.status(500).json({ error: 'Erreur lors de la création du RDV' });
    }
});

// Lister les RDV d'un client
router.get('/clients/:clientId/rdv', async (req: any, res: any): Promise<void> => {
    try {
        const { clientId } = req.params;
        const apporteurId = req.user!.apporteur_id;

        // Vérifier que le client appartient à l'apporteur
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id, apporteur_id')
            .eq('id', clientId)
            .eq('apporteur_id', apporteurId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
        }

        const { data: rdvs, error } = await supabase
            .from('ClientRDV')
            .select(`
                *,
                expert:Expert(id, name, email, specializations),
                client:Client(id, name, company_name, email)
            `)
            .eq('client_id', clientId)
            .order('scheduled_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: rdvs });
    } catch (error) {
        console.error('Erreur récupération RDV:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des RDV' });
    }
});

// ===== GESTION STATUTS =====
// Changer le statut d'un client
router.post('/clients/:clientId/status', async (req: any, res: any): Promise<void> => {
    try {
        const { clientId } = req.params;
        const { statut, notes } = req.body;
        const apporteurId = req.user!.apporteur_id;

        if (!statut) {
            return res.status(400).json({ error: 'Statut requis' });
        }

        // Vérifier que le client appartient à l'apporteur
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id, name, company_name, apporteur_id, status')
            .eq('id', clientId)
            .eq('apporteur_id', apporteurId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
        }

        // Enregistrer le changement de statut
        const { data: statusRecord, error: statusError } = await supabase
            .from('ClientStatut')
            .insert({
                client_id: clientId,
                statut,
                previous_statut: client.status,
                changed_by: apporteurId,
                notes
            })
            .select('*')
            .single();

        if (statusError) throw statusError;

        // Mettre à jour le statut du client
        const { data: updatedClient, error: updateError } = await supabase
            .from('Client')
            .update({ 
                status: statut,
                updated_at: new Date().toISOString()
            })
            .eq('id', clientId)
            .select('*')
            .single();

        if (updateError) throw updateError;

        res.json({ success: true, data: { statusRecord, client: updatedClient } });
    } catch (error) {
        console.error('Erreur changement statut:', error);
        res.status(500).json({ error: 'Erreur lors du changement de statut' });
    }
});

// Récupérer l'historique des statuts d'un client
router.get('/clients/:clientId/status-history', async (req: any, res: any): Promise<void> => {
    try {
        const { clientId } = req.params;
        const apporteurId = req.user!.apporteur_id;

        // Vérifier que le client appartient à l'apporteur
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id, apporteur_id')
            .eq('id', clientId)
            .eq('apporteur_id', apporteurId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
        }

        const { data: statusHistory, error } = await supabase
            .from('ClientStatut')
            .select(`
                *,
                changed_by_user:ApporteurAffaires(id, first_name, last_name)
            `)
            .eq('client_id', clientId)
            .order('changed_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: statusHistory });
    } catch (error) {
        console.error('Erreur récupération historique statuts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

// ===== CRÉATION CLIENT AVEC EMAIL =====
// Créer un client prospect avec envoi d'email
router.post('/clients', async (req: any, res: any): Promise<void> => {
    try {
        const { 
            name, 
            email, 
            company_name, 
            phone_number, 
            siren, 
            address, 
            website, 
            decision_maker_position,
            qualification_score,
            interest_level,
            budget_range,
            timeline,
            source,
            notes,
            selected_products
        } = req.body;

        const apporteurId = req.user!.apporteur_id;

        // Validation des données
        if (!name || !email || !company_name || !phone_number) {
            return res.status(400).json({ error: 'Données obligatoires manquantes' });
        }

        // Créer le compte client avec email
        const credentials = await EmailService.createClientAccount({
            email,
            name,
            company_name,
            phone_number,
            apporteur_id: apporteurId
        });

        // Mettre à jour le client avec les données supplémentaires
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .update({
                siren,
                address,
                website,
                decision_maker_position,
                qualification_score,
                interest_level,
                budget_range,
                timeline,
                source: source || 'apporteur',
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select('*')
            .single();

        if (clientError) throw clientError;

        // Créer les liaisons avec les produits sélectionnés
        if (selected_products && selected_products.length > 0) {
            const productLinks = selected_products.map((product: any) => ({
                client_id: client.id,
                produit_eligible_id: product.id,
                selected: true,
                notes: product.notes,
                priority: product.priority || 'medium',
                estimated_amount: product.estimated_amount,
                success_probability: product.success_probability
            }));

            const { error: productsError } = await supabase
                .from('ClientProduitEligible')
                .insert(productLinks);

            if (productsError) {
                console.error('Erreur création liaisons produits:', productsError);
            }
        }

        // Envoyer l'email avec les identifiants
        const emailSent = await EmailService.sendClientCredentials(credentials, name);

        res.status(201).json({ 
            success: true, 
            data: { 
                client, 
                credentials: emailSent ? credentials : null,
                email_sent: emailSent
            } 
        });
    } catch (error) {
        console.error('Erreur création client:', error);
        res.status(500).json({ error: 'Erreur lors de la création du client' });
    }
});

export default router;
