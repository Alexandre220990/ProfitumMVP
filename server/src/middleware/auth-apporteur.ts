import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface ApporteurUser {
    id: string;
    auth_user_id: string;
    apporteur_id: string;
    type: 'apporteur';
    status: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface ExpertUser {
    id: string;
    auth_user_id: string;
    expert_id: string;
    type: 'expert';
    status: string;
    name: string;
    email: string;
}

export interface ApporteurRequest extends Omit<Request, 'user'> {
    user?: ApporteurUser;
}

export interface ExpertRequest extends Omit<Request, 'user'> {
    user?: ExpertUser;
}

// Middleware d'authentification pour les apporteurs d'affaires
export const authApporteur = async (req: ApporteurRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'Token d\'authentification requis' });
            return;
        }

        // Vérification du token avec Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            res.status(401).json({ error: 'Token invalide' });
            return;
        }

        // Vérification du rôle apporteur d'affaires
        const { data: apporteur, error: apporteurError } = await supabase
            .from('ApporteurAffaires')
            .select('id, auth_user_id, status, first_name, last_name, email, commission_rate')
            .eq('auth_user_id', user.id)
            .single();

        if (apporteurError || !apporteur) {
            res.status(403).json({ error: 'Accès refusé - Rôle apporteur d\'affaires requis' });
            return;
        }

        // Vérification du statut actif
        if (apporteur.status !== 'active') {
            res.status(403).json({ 
                error: 'Compte inactif', 
                status: apporteur.status,
                message: 'Votre compte n\'est pas encore activé. Contactez l\'administrateur.'
            });
            return;
        }

        // Ajout des informations utilisateur à la requête
        req.user = {
            id: user.id,
            auth_user_id: user.id,
            apporteur_id: apporteur.id,
            type: 'apporteur',
            status: apporteur.status,
            first_name: apporteur.first_name,
            last_name: apporteur.last_name,
            email: apporteur.email
        };

        next();
    } catch (error) {
        console.error('Erreur d\'authentification apporteur:', error);
        res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};

// Middleware pour vérifier les permissions sur les prospects
export const checkProspectOwnership = async (req: ApporteurRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const prospectId = req.params.prospectId || req.body.prospect_id;
        
        if (!prospectId) {
            res.status(400).json({ error: 'ID prospect requis' });
            return;
        }

        console.log(`🔐 Vérification ownership prospect ${prospectId} pour apporteur ${req.user?.apporteur_id}`);

        // Les prospects sont stockés dans la table Client avec status='prospect'
        const { data: prospect, error } = await supabase
            .from('Client')
            .select('apporteur_id, status')
            .eq('id', prospectId)
            .single();

        if (error) {
            console.error('❌ Erreur récupération prospect:', error);
            res.status(404).json({ error: 'Prospect non trouvé' });
            return;
        }

        if (!prospect) {
            console.log('❌ Prospect introuvable');
            res.status(404).json({ error: 'Prospect non trouvé' });
            return;
        }

        console.log(`📋 Prospect trouvé: apporteur_id=${prospect.apporteur_id}, status=${prospect.status}`);

        if (prospect.apporteur_id !== req.user?.apporteur_id) {
            console.log(`❌ Accès refusé: ${prospect.apporteur_id} !== ${req.user?.apporteur_id}`);
            res.status(403).json({ error: 'Accès refusé - Prospect non autorisé' });
            return;
        }

        console.log('✅ Ownership vérifié');
        next();
    } catch (error) {
        console.error('❌ Erreur de vérification ownership:', error);
        res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
};

// Middleware pour les experts (accès aux notifications)
export const authExpert = async (req: ExpertRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'Token d\'authentification requis' });
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            res.status(401).json({ error: 'Token invalide' });
            return;
        }

        // Vérification du rôle expert
        const { data: expert, error: expertError } = await supabase
            .from('Expert')
            .select('id, auth_user_id, status, name, email, specializations')
            .eq('auth_user_id', user.id)
            .single();

        if (expertError || !expert) {
            res.status(403).json({ error: 'Accès refusé - Rôle expert requis' });
            return;
        }

        if (expert.status !== 'active') {
            res.status(403).json({ 
                error: 'Compte expert inactif', 
                status: expert.status 
            });
            return;
        }

        req.user = {
            id: user.id,
            auth_user_id: user.id,
            expert_id: expert.id,
            type: 'expert',
            status: expert.status,
            name: expert.name,
            email: expert.email
        };

        next();
    } catch (error) {
        console.error('Erreur d\'authentification expert:', error);
        res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};

// Middleware pour vérifier les permissions sur les notifications expert
export const checkNotificationOwnership = async (req: ExpertRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const notificationId = req.params.notificationId;
        
        if (!notificationId) {
            res.status(400).json({ error: 'ID notification requis' });
            return;
        }

        const { data: notification, error } = await supabase
            .from('ExpertNotification')
            .select('expert_id')
            .eq('id', notificationId)
            .single();

        if (error || !notification) {
            res.status(404).json({ error: 'Notification non trouvée' });
            return;
        }

        if (notification.expert_id !== req.user?.expert_id) {
            res.status(403).json({ error: 'Accès refusé - Notification non autorisée' });
            return;
        }

        next();
    } catch (error) {
        console.error('Erreur de vérification notification:', error);
        res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
};

// Middleware pour vérifier les permissions sur les rencontres
export const checkMeetingOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const meetingId = req.params.meetingId;
        const user = (req as any).user;
        
        if (!meetingId) {
            res.status(400).json({ error: 'ID rencontre requis' });
            return;
        }

        const { data: meeting, error } = await supabase
            .from('ProspectMeeting')
            .select('expert_id, apporteur_id')
            .eq('id', meetingId)
            .single();

        if (error || !meeting) {
            res.status(404).json({ error: 'Rencontre non trouvée' });
            return;
        }

        // Vérifier si l'utilisateur est l'expert ou l'apporteur
        const isExpert = user.type === 'expert' && meeting.expert_id === user.expert_id;
        const isApporteur = user.type === 'apporteur' && meeting.apporteur_id === user.apporteur_id;

        if (!isExpert && !isApporteur) {
            res.status(403).json({ error: 'Accès refusé - Rencontre non autorisée' });
            return;
        }

        next();
    } catch (error) {
        console.error('Erreur de vérification rencontre:', error);
        res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
};

// Middleware pour vérifier le statut admin
export const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            res.status(401).json({ error: 'Token d\'authentification requis' });
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            res.status(401).json({ error: 'Token invalide' });
            return;
        }

        // Vérification du rôle admin
        const { data: admin, error: adminError } = await supabase
            .from('Admin')
            .select('id, auth_user_id, status, name, email')
            .eq('auth_user_id', user.id)
            .single();

        if (adminError || !admin) {
            res.status(403).json({ error: 'Accès refusé - Rôle administrateur requis' });
            return;
        }

        if (admin.status !== 'active') {
            res.status(403).json({ 
                error: 'Compte admin inactif', 
                status: admin.status 
            });
            return;
        }

        (req as any).user = {
            id: user.id,
            auth_user_id: user.id,
            admin_id: admin.id,
            type: 'admin',
            status: admin.status,
            name: admin.name,
            email: admin.email
        };

        next();
    } catch (error) {
        console.error('Erreur d\'authentification admin:', error);
        res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};