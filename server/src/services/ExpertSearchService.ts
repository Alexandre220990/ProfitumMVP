import { SupabaseClient } from '@supabase/supabase-js';

export interface ExpertSearchCriteria {
    specializations?: string[];
    location?: string;
    minRating?: number;
    maxRating?: number;
    experience?: string;
    availability?: any;
    priceRange?: {
        min?: number;
        max?: number;
    };
    certifications?: string[];
    maxDistance?: number;
}

export interface ExpertSearchResult {
    id: string;
    name: string;
    company_name: string;
    specializations: string[];
    experience: string;
    location: string;
    rating: number;
    description: string;
    compensation?: number;
    relevance_score: number;
    match_percentage: number;
    availability_status: string;
    response_time: string;
    completed_assignments: number;
    success_rate: number;
}

export class ExpertSearchService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Recherche d'experts avec algorithmes de matching avancés
     */
    async searchExperts(criteria: ExpertSearchCriteria, page: number = 1, limit: number = 10): Promise<{
        experts: ExpertSearchResult[];
        totalCount: number;
        totalPages: number;
    }> {
        try {
            // Construction de la requête de base avec scoring
            let query = `
                WITH expert_base AS (
                    SELECT 
                        e.id,
                        e.name,
                        e.company_name,
                        e.specializations,
                        e.experience,
                        e.location,
                        e.rating,
                        e.description,
                        e.client_fee_percentage AS compensation,
                        e.disponibilites,
                        e.certifications,
                        e.created_at,
                        COUNT(DISTINCT ea.id) as assignment_count,
                        COUNT(DISTINCT CASE WHEN ea.status = 'completed' THEN ea.id END) as completed_assignments,
                        AVG(ea.client_rating) as avg_client_rating
                    FROM "Expert" e
                    LEFT JOIN "ExpertAssignment" ea ON e.id = ea.expert_id
                    WHERE e.status = 'active' AND e.approval_status = 'approved'
            `;

            const conditions: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;

            // Filtres de spécialisation - Utiliser ExpertProduitEligible au lieu de specializations
            // Si des spécialisations sont demandées, on filtre via ExpertProduitEligible
            // On garde aussi le filtre sur specializations pour compatibilité (fallback)
            if (criteria.specializations && criteria.specializations.length > 0) {
                // Convertir les noms de spécialisations en IDs de produits si nécessaire
                // Pour l'instant, on utilise les deux méthodes pour compatibilité
                const specConditions = criteria.specializations.map(spec => {
                    // Fallback sur specializations pour compatibilité
                    conditions.push(`e.specializations @> $${paramIndex}`);
                    params.push(`["${spec}"]`);
                    paramIndex++;
                    return `$${paramIndex - 1}`;
                });
            }

            // Filtre de localisation
            if (criteria.location) {
                conditions.push(`e.location ILIKE $${paramIndex}`);
                params.push(`%${criteria.location}%`);
                paramIndex++;
            }

            // Filtres de note
            if (criteria.minRating) {
                conditions.push(`e.rating >= $${paramIndex}`);
                params.push(criteria.minRating);
                paramIndex++;
            }

            if (criteria.maxRating) {
                conditions.push(`e.rating <= $${paramIndex}`);
                params.push(criteria.maxRating);
                paramIndex++;
            }

            // Filtre d'expérience
            if (criteria.experience) {
                conditions.push(`e.experience ILIKE $${paramIndex}`);
                params.push(`%${criteria.experience}%`);
                paramIndex++;
            }

            // Filtre de disponibilité
            if (criteria.availability) {
                conditions.push(`e.disponibilites @> $${paramIndex}`);
                params.push(JSON.stringify(criteria.availability));
                paramIndex++;
            }

            // Filtre de prix
            if (criteria.priceRange) {
                if (criteria.priceRange.min) {
                    conditions.push(`e.client_fee_percentage >= $${paramIndex}`);
                    params.push(criteria.priceRange.min);
                    paramIndex++;
                }
                if (criteria.priceRange.max) {
                    conditions.push(`e.client_fee_percentage <= $${paramIndex}`);
                    params.push(criteria.priceRange.max);
                    paramIndex++;
                }
            }

            // Filtres de certification
            if (criteria.certifications && criteria.certifications.length > 0) {
                criteria.certifications.forEach(cert => {
                    conditions.push(`e.certifications @> $${paramIndex}`);
                    params.push(`{"${cert}": true}`);
                    paramIndex++;
                });
            }

            // Ajouter les conditions
            if (conditions.length > 0) {
                query += ` AND (${conditions.join(' AND ')})`;
            }

            // Finaliser la requête de base
            query += `
                GROUP BY e.id
            )`;

            // Calcul du score de pertinence
            query += `, scored_experts AS (
                SELECT 
                    *,
                    -- Score de spécialisation (40% du score total)
                    CASE 
                        WHEN '${criteria.specializations?.join(',')}' IS NOT NULL THEN
                            (ARRAY_LENGTH(ARRAY(
                                SELECT UNNEST(specializations) 
                                INTERSECT 
                                SELECT UNNEST(ARRAY[${criteria.specializations?.map(s => `'${s}'`).join(',')}])
                            ), 1) * 40.0 / GREATEST(ARRAY_LENGTH(specializations, 1), 1))
                        ELSE 0
                    END +
                    -- Score de note (25% du score total)
                    (rating * 5.0) +
                    -- Score d'expérience (20% du score total)
                    CASE 
                        WHEN completed_assignments >= 20 THEN 20.0
                        WHEN completed_assignments >= 10 THEN 15.0
                        WHEN completed_assignments >= 5 THEN 10.0
                        WHEN completed_assignments >= 1 THEN 5.0
                        ELSE 0
                    END +
                    -- Score de satisfaction client (15% du score total)
                    CASE 
                        WHEN avg_client_rating >= 4.5 THEN 15.0
                        WHEN avg_client_rating >= 4.0 THEN 12.0
                        WHEN avg_client_rating >= 3.5 THEN 8.0
                        WHEN avg_client_rating >= 3.0 THEN 4.0
                        ELSE 0
                    END as relevance_score
                FROM expert_base
            )`;

            // Tri et pagination
            query += `
                SELECT 
                    *,
                    CASE 
                        WHEN relevance_score >= 80 THEN 'Excellent'
                        WHEN relevance_score >= 60 THEN 'Très bon'
                        WHEN relevance_score >= 40 THEN 'Bon'
                        WHEN relevance_score >= 20 THEN 'Correct'
                        ELSE 'Basique'
                    END as match_level,
                    ROUND(relevance_score) as match_percentage
                FROM scored_experts
                ORDER BY relevance_score DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            const offset = (page - 1) * limit;
            params.push(limit, offset);

            // Exécuter la requête
            const { data: experts, error } = await this.supabase.rpc('exec_sql', {
                sql_query: query,
                params: params
            });

            if (error) {
                throw new Error(`Erreur recherche: ${error.message}`);
            }

            // Compter le total
            const { count: totalCount, error: countError } = await this.supabase
                .from('Expert')
                .select('id', { count: 'exact' })
                .eq('status', 'active')
                .eq('approval_status', 'approved');

            if (countError) {
                throw new Error(`Erreur comptage: ${countError.message}`);
            }

            const totalPages = Math.ceil((totalCount || 0) / limit);

            // Enrichir les résultats
            const enrichedExperts = experts?.map((expert: any) => ({
                ...expert,
                availability_status: expert.disponibilites?.available ? 'Disponible' : 'Indisponible',
                response_time: this.calculateResponseTime(expert.completed_assignments),
                success_rate: expert.completed_assignments > 0 
                    ? Math.round((expert.completed_assignments / expert.assignment_count) * 100)
                    : 0
            }));

            return {
                experts: enrichedExperts || [],
                totalCount: totalCount || 0,
                totalPages
            };

        } catch (error) {
            console.error('Erreur ExpertSearchService:', error);
            throw error;
        }
    }

    /**
     * Calcul du temps de réponse estimé basé sur l'historique
     */
    private calculateResponseTime(completedAssignments: number): string {
        if (completedAssignments >= 20) return '2-4h';
        if (completedAssignments >= 10) return '4-8h';
        if (completedAssignments >= 5) return '8-12h';
        if (completedAssignments >= 1) return '12-24h';
        return '24-48h';
    }

    /**
     * Recommandations d'experts basées sur l'historique
     */
    async getRecommendations(userId: string, limit: number = 5): Promise<ExpertSearchResult[]> {
        try {
            // Analyser l'historique de l'utilisateur
            const { data: userHistory, error: historyError } = await this.supabase
                .from('ExpertAssignment')
                .select(`
                    produit_id,
                    expert_id,
                    Expert!inner(specializations, rating)
                `)
                .or(`client_id.eq.${userId},expert_id.eq.${userId}`)
                .eq('status', 'completed');

            if (historyError || !userHistory || userHistory.length === 0) {
                // Pas d'historique, retourner les experts les mieux notés
                return this.getTopRatedExperts(limit);
            }

            // Extraire les préférences
            const preferences = this.extractUserPreferences(userHistory);

            // Rechercher des experts similaires
            const { experts } = await this.searchExperts({
                specializations: preferences.specializations,
                minRating: preferences.minRating
            }, 1, limit);

            return experts;

        } catch (error) {
            console.error('Erreur recommandations:', error);
            return this.getTopRatedExperts(limit);
        }
    }

    /**
     * Extraire les préférences utilisateur de l'historique
     */
    private extractUserPreferences(history: any[]): {
        specializations: string[];
        minRating: number;
    } {
        const specializations = new Set<string>();
        let totalRating = 0;
        let ratingCount = 0;

        history.forEach(item => {
            if (item.Expert?.specializations) {
                item.Expert.specializations.forEach((spec: string) => {
                    specializations.add(spec);
                });
            }
            if (item.Expert?.rating) {
                totalRating += item.Expert.rating;
                ratingCount++;
            }
        });

        return {
            specializations: Array.from(specializations),
            minRating: ratingCount > 0 ? Math.max(3.5, totalRating / ratingCount - 0.5) : 4.0
        };
    }

    /**
     * Obtenir les experts les mieux notés
     */
    private async getTopRatedExperts(limit: number): Promise<ExpertSearchResult[]> {
        try {
            const { data: experts, error } = await this.supabase
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
                    compensation
                `)
                .eq('status', 'active')
                .eq('approval_status', 'approved')
                .gte('rating', 4.0)
                .order('rating', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return experts?.map(expert => ({
                ...expert,
                relevance_score: expert.rating * 20,
                match_percentage: Math.round(expert.rating * 20),
                availability_status: 'Disponible',
                response_time: '24h',
                completed_assignments: 0,
                success_rate: 0
            })) || [];

        } catch (error) {
            console.error('Erreur top rated experts:', error);
            return [];
        }
    }

    /**
     * Recherche par géolocalisation (si disponible)
     */
    async searchByLocation(location: string, maxDistance: number = 100): Promise<ExpertSearchResult[]> {
        try {
            const { data: experts, error } = await this.supabase
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
                    compensation
                `)
                .eq('status', 'active')
                .eq('approval_status', 'approved')
                .ilike('location', `%${location}%`)
                .order('rating', { ascending: false });

            if (error) {
                throw error;
            }

            return experts?.map(expert => ({
                ...expert,
                relevance_score: expert.rating * 15,
                match_percentage: Math.round(expert.rating * 15),
                availability_status: 'Disponible',
                response_time: '24h',
                completed_assignments: 0,
                success_rate: 0
            })) || [];

        } catch (error) {
            console.error('Erreur recherche géolocalisation:', error);
            return [];
        }
    }
} 