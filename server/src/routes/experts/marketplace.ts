import { Router } from 'express';
import { authenticateUser } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { supabase } from '../../lib/supabase';

const router = Router();

/**
 * @route GET /api/experts/marketplace
 * @desc Récupérer la liste des experts disponibles pour la marketplace
 * @access Public (avec filtres optionnels)
 */
router.get('/', asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        specialization, 
        location, 
        rating, 
        availability,
        sortBy = 'rating',
        sortOrder = 'desc'
    } = req.query;

    try {
        // Construction de la requête de base
        let query = supabase
            .from('Expert')
            .select(`
                id,
                name,
                company_name,
                specializations,
                experience,
                location,
                rating,
                description,
                status,
                disponibilites,
                certifications,
                created_at,
                compensation
            `)
            .eq('status', 'active')
            .eq('approval_status', 'approved');

        // Filtres
        if (specialization) {
            query = query.contains('specializations', [specialization]);
        }

        if (location) {
            query = query.ilike('location', `%${location}%`);
        }

        if (rating) {
            query = query.gte('rating', parseFloat(rating as string));
        }

        // Tri
        if (sortBy === 'rating') {
            query = query.order('rating', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'name') {
            query = query.order('name', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'compensation') {
            query = query.order('compensation', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'location') {
            query = query.order('location', { ascending: sortOrder === 'asc' });
        } else {
            query = query.order('rating', { ascending: false });
        }

        // Pagination
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        query = query.range(offset, offset + parseInt(limit as string) - 1);

        const { data: experts, error } = await query;

        if (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des experts',
                error: error.message 
            });
        }

        // Compter le total pour la pagination
        const { count: totalCount, error: countError } = await supabase
            .from('Expert')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('approval_status', 'approved');

        if (countError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors du comptage',
                error: countError.message 
            });
        }

        const totalPages = Math.ceil((totalCount || 0) / parseInt(limit as string));

        res.json({
            success: true,
            data: experts || [],
            pagination: {
                currentPage: parseInt(page as string),
                totalPages,
                totalItems: totalCount,
                itemsPerPage: parseInt(limit as string)
            }
        });

    } catch (error) {
        console.error('Erreur marketplace:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route GET /api/experts/marketplace/:id
 * @desc Récupérer les détails d'un expert spécifique
 * @access Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Récupérer les détails de l'expert
        const { data: expert, error: expertError } = await supabase
            .from('Expert')
            .select(`
                *,
                ExpertSpecialization!inner(*)
            `)
            .eq('id', id)
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .single();

        if (expertError || !expert) {
            return res.status(404).json({ 
                success: false, 
                message: 'Expert non trouvé' 
            });
        }

        // Récupérer les statistiques
        const { data: stats, error: statsError } = await supabase
            .from('ExpertAssignment')
            .select('client_rating, expert_rating, status')
            .eq('expert_id', id);

        if (statsError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des statistiques',
                error: statsError.message 
            });
        }

        // Calculer les statistiques
        const completedAssignments = stats?.filter((s: any) => s.status === 'completed') || [];
        const avgClientRating = completedAssignments.length > 0 
            ? completedAssignments.reduce((sum: number, s: any) => sum + (s.client_rating || 0), 0) / completedAssignments.length
            : 0;

        const expertData = {
            ...expert,
            statistics: {
                totalAssignments: stats?.length || 0,
                completedAssignments: completedAssignments.length,
                avgClientRating: Math.round(avgClientRating * 10) / 10,
                successRate: completedAssignments.length > 0 
                    ? Math.round((completedAssignments.length / stats!.length) * 100)
                    : 0
            }
        };

        res.json({
            success: true,
            data: expertData
        });

    } catch (error) {
        console.error('Erreur expert details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route POST /api/experts/marketplace/:id/contact
 * @desc Contacter un expert (créer une assignation)
 * @access Private (clients uniquement)
 */
router.post('/:id/contact', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message, produit_id } = req.body;
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser) {
        return res.status(401).json({
            success: false,
            message: 'Utilisateur non authentifié'
        });
    }

    const userId = authenticatedUser.id;

    try {
        // Vérifier que l'utilisateur est un client
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('id')
            .eq('auth_id', userId)
            .single();

        if (clientError || !client) {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux clients'
            });
        }

        // Vérifier que l'expert existe et est actif
        const { data: expert, error: expertError } = await supabase
            .from('Expert')
            .select('id, name, specializations')
            .eq('id', id)
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .single();

        if (expertError || !expert) {
            return res.status(404).json({
                success: false,
                message: 'Expert non trouvé ou inactif'
            });
        }

        // Si un produit est spécifié, vérifier qu'il appartient au client
        if (produit_id) {
            const { data: produit, error: produitError } = await supabase
                .from('ClientProduitEligible')
                .select('*')
                .eq('id', produit_id)
                .eq('client_id', client.id)
                .single();

            if (produitError || !produit) {
                return res.status(404).json({
                    success: false,
                    message: 'Produit éligible non trouvé'
                });
            }
        }

        // Créer l'assignation
        const { data: assignment, error: assignmentError } = await supabase
            .from('ExpertAssignment')
            .insert({
                client_id: client.id,
                expert_id: id,
                produit_id: produit_id || null,
                status: 'pending',
                message: message || '',
                created_at: new Date().toISOString()
            })
            .select('*')
            .single();

        if (assignmentError) {
            throw assignmentError;
        }

        // Mettre à jour le produit éligible si spécifié
        if (produit_id) {
            await supabase
                .from('ClientProduitEligible')
                .update({
                    expert_id: id,
                    statut: 'expert_contacté',
                    updated_at: new Date().toISOString()
                })
                .eq('id', produit_id);
        }

        res.json({
            success: true,
            data: assignment,
            message: 'Demande de contact envoyée avec succès'
        });

    } catch (error) {
        console.error('Erreur contact expert:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la demande de contact'
        });
    }
}));

export default router; 