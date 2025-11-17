/**
 * Service de synchronisation entre Expert.specializations et ExpertProduitEligible
 * Permet une migration progressive sans casser l'existant
 */

import { SupabaseClient } from '@supabase/supabase-js';

export class ExpertProduitEligibleSyncService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Synchronise les specializations d'un expert vers ExpertProduitEligible
     * Crée les entrées manquantes dans ExpertProduitEligible basées sur les noms de spécialisations
     * 
     * @param expertId ID de l'expert
     * @param specializations Liste des noms de spécialisations (ex: ["Électricité", "CEE"])
     * @returns Nombre d'entrées créées/mises à jour
     */
    async syncSpecializationsToExpertProduitEligible(
        expertId: string,
        specializations: string[]
    ): Promise<{ created: number; updated: number; errors: number }> {
        let created = 0;
        let updated = 0;
        let errors = 0;

        if (!specializations || specializations.length === 0) {
            return { created: 0, updated: 0, errors: 0 };
        }

        try {
            // Pour chaque spécialisation, trouver le produit correspondant
            for (const specName of specializations) {
                try {
                    // Chercher le produit par nom (correspondance partielle ou exacte)
                    const { data: produits, error: produitError } = await this.supabase
                        .from('ProduitEligible')
                        .select('id, nom')
                        .ilike('nom', `%${specName}%`)
                        .limit(1);

                    if (produitError || !produits || produits.length === 0) {
                        console.warn(`⚠️ Produit non trouvé pour spécialisation: ${specName}`);
                        // On continue sans créer d'entrée si le produit n'existe pas
                        continue;
                    }

                    const produitId = produits[0].id;

                    // Vérifier si l'entrée existe déjà (Supabase utilise snake_case)
                    const { data: existing, error: checkError } = await this.supabase
                        .from('ExpertProduitEligible')
                        .select('id, statut')
                        .eq('expert_id', expertId)
                        .eq('produit_id', produitId)
                        .maybeSingle();

                    if (checkError && checkError.code !== 'PGRST116') {
                        // PGRST116 = not found, ce qui est OK
                        console.error(`❌ Erreur vérification ExpertProduitEligible:`, checkError);
                        errors++;
                        continue;
                    }

                    const now = new Date().toISOString();

                    if (existing) {
                        // Mettre à jour si inactif
                        if (existing.statut !== 'actif') {
                            const { error: updateError } = await this.supabase
                                .from('ExpertProduitEligible')
                                .update({
                                    statut: 'actif',
                                    niveau_expertise: 'intermediaire', // Valeur par défaut
                                    updated_at: now
                                })
                                .eq('id', existing.id);

                            if (updateError) {
                                console.error(`❌ Erreur mise à jour ExpertProduitEligible:`, updateError);
                                errors++;
                            } else {
                                updated++;
                            }
                        }
                    } else {
                        // Créer nouvelle entrée (Supabase utilise snake_case)
                        const { error: insertError } = await this.supabase
                            .from('ExpertProduitEligible')
                            .insert({
                                expert_id: expertId,
                                produit_id: produitId,
                                statut: 'actif',
                                niveau_expertise: 'intermediaire', // Valeur par défaut
                                created_at: now,
                                updated_at: now
                            });

                        if (insertError) {
                            console.error(`❌ Erreur création ExpertProduitEligible:`, insertError);
                            errors++;
                        } else {
                            created++;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erreur traitement spécialisation ${specName}:`, error);
                    errors++;
                }
            }

            return { created, updated, errors };
        } catch (error) {
            console.error('❌ Erreur syncSpecializationsToExpertProduitEligible:', error);
            throw error;
        }
    }

    /**
     * Récupère les produits éligibles d'un expert depuis ExpertProduitEligible
     * et enrichit avec les noms depuis ProduitEligible
     */
    async getExpertProducts(expertId: string): Promise<Array<{
        produit_id: string;
        produit_nom: string;
        niveauExpertise: string;
        statut: string;
    }>> {
        try {
            const { data, error } = await this.supabase
                .from('ExpertProduitEligible')
                .select(`
                    produit_id,
                    niveau_expertise,
                    statut,
                    ProduitEligible:produit_id (
                        id,
                        nom
                    )
                `)
                .eq('expert_id', expertId)
                .eq('statut', 'actif');

            if (error) throw error;

            return (data || []).map((ep: any) => ({
                produit_id: ep.produit_id,
                produit_nom: ep.ProduitEligible?.nom || 'Produit inconnu',
                niveauExpertise: ep.niveau_expertise || ep.niveauExpertise || 'intermediaire',
                statut: ep.statut
            }));
        } catch (error) {
            console.error('❌ Erreur getExpertProducts:', error);
            return [];
        }
    }

    /**
     * Vérifie si un expert est éligible pour un produit donné
     */
    async isExpertEligibleForProduct(expertId: string, produitId: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from('ExpertProduitEligible')
                .select('id')
                .eq('expert_id', expertId)
                .eq('produit_id', produitId)
                .eq('statut', 'actif')
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Erreur vérification éligibilité:', error);
                return false;
            }

            return !!data;
        } catch (error) {
            console.error('❌ Erreur isExpertEligibleForProduct:', error);
            return false;
        }
    }
}

