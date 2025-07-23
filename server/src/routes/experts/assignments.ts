import { Router } from 'express';
import { authenticateUser } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { supabase } from '../../lib/supabase';

const router = Router();

/**
 * @route GET /api/experts/assignments
 * @desc Récupérer les assignations de l'utilisateur connecté
 * @access Authentifié (Expert/Client)
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
    const authenticatedUser = (req as any).user;
    const { status, page = 1, limit = 10 } = req.query;

    if (!authenticatedUser) {
        return res.status(401).json({ 
            success: false, 
            message: 'Utilisateur non authentifié' 
        });
    }

    const userId = authenticatedUser.id;

    try {
        // Déterminer le type d'utilisateur
        const { data: expert } = await supabase
            .from('Expert')
            .select('id')
            .eq('auth_id', userId)
            .single();

        const { data: client } = await supabase
            .from('Client')
            .select('id')
            .eq('auth_id', userId)
            .single();

        if (!expert && !client) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé' 
            });
        }

        // Construire la requête selon le type d'utilisateur
        let queryBuilder = supabase
            .from('ExpertAssignment')
            .select(`
                *,
                Expert (
                    id,
                    name,
                    company_name,
                    rating
                ),
                Client (
                    id,
                    name,
                    company_name
                ),
                ProduitEligible (
                    id,
                    nom,
                    description
                )
            `);

        if (expert) {
            queryBuilder = queryBuilder.eq('expert_id', expert.id);
        } else {
            queryBuilder = queryBuilder.eq('client_id', client!.id);
        }

        if (status) {
            queryBuilder = queryBuilder.eq('status', status);
        }

        // Pagination
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        queryBuilder = queryBuilder.range(offset, offset + parseInt(limit as string) - 1);
        queryBuilder = queryBuilder.order('created_at', { ascending: false });

        const { data: assignments, error } = await queryBuilder;

        if (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des assignations',
                error: error.message 
            });
        }

        // Compter le total
        const { count: totalCount, error: countError } = await supabase
            .from('ExpertAssignment')
            .select('*', { count: 'exact', head: true })
            .eq(expert ? 'expert_id' : 'client_id', expert ? expert.id : client!.id);

        if (countError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors du comptage',
                error: countError.message 
            });
        }

        const totalPages = Math.ceil((totalCount || 0) / parseInt(limit as string));

    return res.json({
            success: true,
            data: {
                assignments: assignments || [],
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string)
                },
                userType: expert ? 'expert' : 'client'
            }
        });

    } catch (error) {
        console.error('Erreur assignations:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route GET /api/experts/assignments/:id
 * @desc Récupérer les détails d'une assignation spécifique
 * @access Authentifié (Expert/Client concerné)
 */
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
        return res.status(401).json({ 
            success: false, 
            message: 'Utilisateur non authentifié' 
        });
    }

    const userId = authenticatedUser.id;

    try {
        // Vérifier les permissions
        const { data: assignment, error: assignmentError } = await supabase
            .from('ExpertAssignment')
            .select(`
                *,
                Expert!inner(auth_id),
                Client!inner(auth_id),
                ProduitEligible(*)
            `)
            .eq('id', id)
            .single();

        if (assignmentError || !assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignation non trouvée' 
            });
        }

        // Vérifier que l'utilisateur a accès à cette assignation
        if (assignment.Expert.auth_id !== userId && assignment.Client.auth_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé' 
            });
        }

        // Récupérer les messages associés
        const { data: messages, error: messagesError } = await supabase
            .from('Message')
            .select('*')
            .eq('assignment_id', id)
            .order('created_at', { ascending: true });

        if (messagesError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des messages',
                error: messagesError.message 
            });
        }

    return res.json({
            success: true,
            data: {
                assignment,
                messages: messages || []
            }
        });

    } catch (error) {
        console.error('Erreur assignation details:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route PUT /api/experts/assignments/:id/status
 * @desc Mettre à jour le statut d'une assignation
 * @access Authentifié (Expert/Client concerné)
 */
router.put('/:id/status', authenticateUser, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
        return res.status(401).json({ 
            success: false, 
            message: 'Utilisateur non authentifié' 
        });
    }

    const userId = authenticatedUser.id;

    try {
        // Récupérer l'assignation
        const { data: assignment, error: assignmentError } = await supabase
            .from('ExpertAssignment')
            .select(`
                *,
                Expert!inner(auth_id),
                Client!inner(auth_id)
            `)
            .eq('id', id)
            .single();

        if (assignmentError || !assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignation non trouvée' 
            });
        }

        // Vérifier que l'utilisateur a accès à cette assignation
        if (assignment.Expert.auth_id !== userId && assignment.Client.auth_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès non autorisé' 
            });
        }

        // Déterminer le type d'utilisateur
        const userType = assignment.Expert.auth_id === userId ? 'expert' : 'client';

        // Définir les transitions autorisées
        const allowedTransitions: any = {
            expert: {
                pending: ['accepted', 'declined'],
                accepted: ['in_progress', 'completed'],
                in_progress: ['completed'],
                completed: []
            },
            client: {
                pending: ['cancelled'],
                accepted: ['cancelled'],
                in_progress: ['cancelled'],
                completed: []
            }
        };

        const allowedStatuses = allowedTransitions[userType][assignment.status] || [];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Transition de statut non autorisée de '${assignment.status}' vers '${status}'` 
            });
        }

        // Mettre à jour l'assignation
        const { data: updatedAssignment, error: updateError } = await supabase
            .from('ExpertAssignment')
            .update({
                status,
                notes: notes || assignment.notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la mise à jour',
                error: updateError?.message || 'Erreur inconnue'
            });
        }

        // Créer une notification pour l'autre partie
        const notificationData = {
            user_id: userType === 'expert' ? assignment.Client.auth_id : assignment.Expert.auth_id,
            user_type: userType === 'expert' ? 'client' : 'expert',
            title: `Assignation ${status}`,
            message: `L'assignation #${id} a été mise à jour vers le statut '${status}'`,
            notification_type: 'assignment_update',
            action_url: `/assignments/${id}`,
            created_at: new Date().toISOString()
        };

        await supabase
            .from('notification')
            .insert(notificationData);

        return res.json({
            success: true,
            data: updatedAssignment,
            message: 'Statut mis à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route POST /api/experts/assignments/:id/complete
 * @desc Marquer une assignation comme terminée et évaluer
 * @access Authentifié (Client uniquement)
 */
router.post('/:id/complete', authenticateUser, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
        return res.status(401).json({ 
            success: false, 
            message: 'Utilisateur non authentifié' 
        });
    }

    const userId = authenticatedUser.id;

    try {
        // Récupérer l'assignation
        const { data: assignment, error: assignmentError } = await supabase
            .from('ExpertAssignment')
            .select(`
                *,
                Expert!inner(auth_id, id),
                Client!inner(auth_id)
            `)
            .eq('id', id)
            .single();

        if (assignmentError || !assignment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignation non trouvée' 
            });
        }

        // Vérifier que l'utilisateur est le client
        if (assignment.Client.auth_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès réservé au client' 
            });
        }

        // Vérifier que l'assignation est en cours
        if (assignment.status !== 'in_progress') {
            return res.status(400).json({ 
                success: false, 
                message: 'L\'assignation doit être en cours pour être terminée' 
            });
        }

        // Mettre à jour l'assignation
        const { data: updatedAssignment, error: updateError } = await supabase
            .from('ExpertAssignment')
            .update({
                status: 'completed',
                client_rating: rating,
                client_feedback: feedback,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la mise à jour',
                error: updateError?.message || 'Erreur inconnue'
            });
        }

        // Mettre à jour la note moyenne de l'expert
        const { data: expertStats, error: statsError } = await supabase
            .from('ExpertAssignment')
            .select('client_rating')
            .eq('expert_id', assignment.Expert.id)
            .eq('status', 'completed')
            .not('client_rating', 'is', null);

        if (!statsError && expertStats && expertStats.length > 0) {
            const avgRating = expertStats.reduce((sum: number, a: any) => sum + (a.client_rating || 0), 0) / expertStats.length;
            
            await supabase
                .from('Expert')
                .update({ rating: Math.round(avgRating * 10) / 10 })
                .eq('id', assignment.Expert.id);
        }

        return res.json({
            success: true,
            data: updatedAssignment,
            message: 'Assignation terminée avec succès'
        });

    } catch (error) {
        console.error('Erreur completion assignation:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

export default router; 