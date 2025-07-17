import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { supabase } from '../../lib/supabase';

const router = Router();

/**
 * @route POST /api/experts/search
 * @desc Recherche avancée d'experts avec filtres multiples
 * @access Public
 */
router.post('/', asyncHandler(async (req, res) => {
    const {
        query,
        specializations = [],
        location,
        minRating,
        maxRating,
        experience,
        availability,
        priceRange,
        certifications = [],
        page = 1,
        limit = 10,
        sortBy = 'rating',
        sortOrder = 'desc'
    } = req.body;

    try {
        // Construction de la requête de base
        let queryBuilder = supabase
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
                compensation,
                created_at
            `)
            .eq('status', 'active')
            .eq('approval_status', 'approved');

        // Recherche textuelle
        if (query) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,company_name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
        }

        // Filtres de spécialisation
        if (specializations.length > 0) {
            specializations.forEach((spec: string) => {
                queryBuilder = queryBuilder.contains('specializations', [spec]);
            });
        }

        // Filtre de localisation
        if (location) {
            queryBuilder = queryBuilder.ilike('location', `%${location}%`);
        }

        // Filtres de note
        if (minRating) {
            queryBuilder = queryBuilder.gte('rating', parseFloat(minRating));
        }

        if (maxRating) {
            queryBuilder = queryBuilder.lte('rating', parseFloat(maxRating));
        }

        // Filtre d'expérience
        if (experience) {
            queryBuilder = queryBuilder.ilike('experience', `%${experience}%`);
        }

        // Filtre de prix
        if (priceRange) {
            if (priceRange.min) {
                queryBuilder = queryBuilder.gte('compensation', parseFloat(priceRange.min));
            }
            if (priceRange.max) {
                queryBuilder = queryBuilder.lte('compensation', parseFloat(priceRange.max));
            }
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

        // Tri
        if (sortBy === 'rating') {
            queryBuilder = queryBuilder.order('rating', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'name') {
            queryBuilder = queryBuilder.order('name', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'compensation') {
            queryBuilder = queryBuilder.order('compensation', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'location') {
            queryBuilder = queryBuilder.order('location', { ascending: sortOrder === 'asc' });
        } else {
            queryBuilder = queryBuilder.order('rating', { ascending: false });
        }

        // Pagination
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        queryBuilder = queryBuilder.range(offset, offset + parseInt(limit as string) - 1);

        const { data: experts, error } = await queryBuilder;

        if (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la recherche',
                error: error.message 
            });
        }

        const totalPages = Math.ceil((totalCount || 0) / parseInt(limit as string));

        res.json({
            success: true,
            data: {
                experts: experts || [],
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string)
                }
            }
        });

    } catch (error) {
        console.error('Erreur recherche experts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

/**
 * @route GET /api/experts/search/suggestions
 * @desc Obtenir des suggestions de recherche (experts, spécialisations, localisations)
 * @access Public
 */
router.get('/suggestions', asyncHandler(async (req, res) => {
    const { q } = req.query;

    try {
        // Rechercher des experts
        const { data: experts, error: expertsError } = await supabase
            .from('Expert')
            .select('id, name, company_name, specializations, location')
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .or(`name.ilike.%${q}%,company_name.ilike.%${q}%`)
            .limit(5);

        if (expertsError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la recherche d\'experts',
                error: expertsError.message 
            });
        }

        // Rechercher des spécialisations
        const { data: specializations, error: specsError } = await supabase
            .from('Expert')
            .select('specializations')
            .eq('status', 'active')
            .eq('approval_status', 'approved');

        if (specsError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la recherche de spécialisations',
                error: specsError.message 
            });
        }

        // Rechercher des localisations
        const { data: locations, error: locationsError } = await supabase
            .from('Expert')
            .select('location')
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .not('location', 'is', null);

        if (locationsError) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la recherche de localisations',
                error: locationsError.message 
            });
        }

        // Traiter les spécialisations
        const allSpecs = specializations?.flatMap((e: any) => e.specializations || []) || [];
        const filteredSpecs = allSpecs
            .filter((spec: any) => 
                spec.toLowerCase().includes((q as string).toLowerCase())
            )
            .slice(0, 5);

        // Traiter les localisations
        const uniqueLocations = [...new Set(locations?.map((l: any) => l.location).filter(Boolean))];
        const filteredLocations = uniqueLocations
            .filter((loc: string) => 
                loc.toLowerCase().includes((q as string).toLowerCase())
            )
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                experts: experts?.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    company_name: e.company_name,
                    specializations: e.specializations,
                    location: e.location
                })) || [],
                specializations: filteredSpecs,
                locations: filteredLocations
            }
        });

    } catch (error) {
        console.error('Erreur suggestions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        });
    }
}));

export default router; 