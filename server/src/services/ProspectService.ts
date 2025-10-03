import { createClient } from '@supabase/supabase-js';
import { 
    ProspectFormData, 
    ProspectResponse, 
    ProspectFilters, 
    ApiResponse,
    CreateProspectResponse 
} from '../types/apporteur';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class ProspectService {
    
    // ===== CRÉATION PROSPECT =====
    static async createProspect(apporteurId: string, prospectData: any): Promise<CreateProspectResponse> {
        try {
            console.log('🔍 ProspectService.createProspect - Données reçues:', prospectData);
            console.log('🔍 ProspectService.createProspect - ApporteurId:', apporteurId);

            // Validation des données obligatoires
            if (!prospectData.company_name || !prospectData.name || !prospectData.email || !prospectData.phone_number) {
                throw new Error('Données obligatoires manquantes (nom entreprise, nom, email, téléphone)');
            }

            // Créer le prospect dans la table Client avec status = 'prospect'
            const clientData = {
                // Informations entreprise
                company_name: prospectData.company_name,
                siren: prospectData.siren || null,
                address: prospectData.address || null,
                website: prospectData.website || null,
                
                // Décisionnaire (mapper name vers name)
                name: prospectData.name,
                email: prospectData.email,
                phone_number: prospectData.phone_number,
                decision_maker_position: prospectData.decision_maker_position || null,
                
                // Qualification
                qualification_score: prospectData.qualification_score || 5,
                interest_level: prospectData.interest_level || 'medium',
                budget_range: prospectData.budget_range || '10k-50k',
                timeline: prospectData.timeline || '1-3months',
                
                // Métadonnées
                source: prospectData.source || 'apporteur',
                notes: prospectData.notes || null,
                status: 'prospect', // IMPORTANT: Marquer comme prospect
                apporteur_id: apporteurId,
                
                // Timestamps
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📊 ProspectService.createProspect - Données à insérer:', clientData);

            const { data: prospect, error } = await supabase
                .from('Client')
                .insert(clientData)
                .select('*')
                .single();

            if (error) {
                console.error('❌ ProspectService.createProspect - Erreur Supabase:', error);
                throw error;
            }

            console.log('✅ ProspectService.createProspect - Prospect créé:', prospect.id);

            // Gérer les produits sélectionnés si présents
            if (prospectData.selected_products && prospectData.selected_products.length > 0) {
                console.log('🔍 ProspectService.createProspect - Gestion des produits sélectionnés');
                // TODO: Créer les liaisons avec les produits dans ClientProduitEligible
                // Pour l'instant, on ignore car la table n'est pas encore configurée
            }

            // Gérer le RDV si présent
            if (prospectData.meeting_type && prospectData.scheduled_date && prospectData.scheduled_time) {
                console.log('🔍 ProspectService.createProspect - Création du RDV');
                // TODO: Créer le RDV dans ClientRDV
                // Pour l'instant, on ignore car la table n'est pas encore configurée
            }

            return {
                prospect,
                notification_sent: false,
                expert_notified: false
            };

        } catch (error) {
            console.error('❌ ProspectService.createProspect - Erreur:', error);
            throw new Error(`Erreur lors de la création du prospect: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    // ===== RÉCUPÉRATION PROSPECTS =====
    static async getProspects(apporteurId: string, filters: ProspectFilters = {}): Promise<ApiResponse<ProspectResponse[]>> {
        try {
            const { page = 1, limit = 20, status, interest_level, budget_range, timeline, expert_id, source, date_from, date_to } = filters;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('Client')
                .select('*')
                .eq('apporteur_id', apporteurId)
                .eq('status', 'prospect') // IMPORTANT: Récupérer seulement les prospects
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            // Filtres
            if (status) {
                query = query.eq('status', status);
            }

            if (interest_level) {
                query = query.eq('interest_level', interest_level);
            }

            if (budget_range) {
                query = query.eq('budget_range', budget_range);
            }

            if (timeline) {
                query = query.eq('timeline', timeline);
            }

            if (expert_id) {
                query = query.eq('preselected_expert_id', expert_id);
            }

            if (source) {
                query = query.eq('source', source);
            }

            if (date_from) {
                query = query.gte('created_at', date_from);
            }

            if (date_to) {
                query = query.lte('created_at', date_to);
            }

            const { data: prospects, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: prospects || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getProspects:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des prospects'
            };
        }
    }

    // ===== DÉTAILS PROSPECT =====
    static async getProspectById(prospectId: string): Promise<ProspectResponse> {
        try {
            const { data: prospect, error } = await supabase
                .from('Client')
                .select('*')
                .eq('id', prospectId)
                .eq('status', 'prospect') // IMPORTANT: Vérifier que c'est bien un prospect
                .single();

            if (error) throw error;
            if (!prospect) throw new Error('Prospect non trouvé');

            return prospect as any; // Cast temporaire

        } catch (error) {
            console.error('Erreur getProspectById:', error);
            throw new Error('Erreur lors de la récupération du prospect');
        }
    }

    // ===== MISE À JOUR PROSPECT =====
    static async updateProspect(prospectId: string, updateData: any): Promise<ProspectResponse> {
        try {
            console.log('🔍 ProspectService.updateProspect - ID:', prospectId);
            console.log('🔍 ProspectService.updateProspect - Données:', updateData);

            const { data: prospect, error } = await supabase
                .from('Client')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prospectId)
                .eq('status', 'prospect') // IMPORTANT: Vérifier que c'est bien un prospect
                .select('*')
                .single();

            if (error) throw error;
            if (!prospect) throw new Error('Prospect non trouvé');

            console.log('✅ ProspectService.updateProspect - Prospect mis à jour:', prospect.id);
            return prospect as any; // Cast temporaire

        } catch (error) {
            console.error('❌ ProspectService.updateProspect - Erreur:', error);
            throw new Error(`Erreur lors de la mise à jour du prospect: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    // ===== SUPPRESSION PROSPECT =====
    static async deleteProspect(prospectId: string): Promise<void> {
        try {
            console.log('🔍 ProspectService.deleteProspect - ID:', prospectId);

            const { error } = await supabase
                .from('Client')
                .delete()
                .eq('id', prospectId)
                .eq('status', 'prospect'); // IMPORTANT: Vérifier que c'est bien un prospect

            if (error) throw error;

            console.log('✅ ProspectService.deleteProspect - Prospect supprimé:', prospectId);

        } catch (error) {
            console.error('❌ ProspectService.deleteProspect - Erreur:', error);
            throw new Error(`Erreur lors de la suppression du prospect: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    // ===== CONVERSION PROSPECT → CLIENT =====
    static async convertProspectToClient(prospectId: string, apporteurId: string): Promise<{ client_id: string; prospect_id: string }> {
        try {
            // Vérifier que le prospect appartient à l'apporteur
            const { data: prospect, error: prospectError } = await supabase
                .from('Prospect')
                .select('*')
                .eq('id', prospectId)
                .eq('apporteur_id', apporteurId)
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé ou non autorisé');
            }

            // Créer le client
            const { data: client, error: clientError } = await supabase
                .from('Client')
                .insert({
                    name: `${prospect.decision_maker_first_name} ${prospect.decision_maker_last_name}`,
                    email: prospect.decision_maker_email,
                    phone: prospect.decision_maker_phone,
                    company_name: prospect.company_name,
                    siren: prospect.siren,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (clientError) throw clientError;

            // Enregistrer la conversion
            const { error: conversionError } = await supabase
                .from('ProspectConversion')
                .insert({
                    prospect_id: prospectId,
                    client_id: client.id,
                    converted_at: new Date().toISOString(),
                    conversion_notes: 'Conversion automatique depuis prospect'
                });

            if (conversionError) throw conversionError;

            // Marquer le prospect comme converti
            const { error: updateError } = await supabase
                .from('Prospect')
                .update({ 
                    status: 'converted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', prospectId);

            if (updateError) throw updateError;

            return {
                client_id: client.id,
                prospect_id: prospectId
            };

        } catch (error) {
            console.error('Erreur convertProspectToClient:', error);
            throw new Error('Erreur lors de la conversion du prospect');
        }
    }

    // ===== NOTIFICATION EXPERT =====
    static async notifyExpertNewProspect(expertId: string, prospectId: string, apporteurId: string): Promise<{ success: boolean; notification_id?: string }> {
        try {
            const { data: notification, error } = await supabase
                .from('ExpertNotification')
                .insert({
                    expert_id: expertId,
                    prospect_id: prospectId,
                    apporteur_id: apporteurId,
                    notification_type: 'prospect_preselected',
                    title: 'Nouveau prospect présélectionné pour vous',
                    message: 'Un apporteur d\'affaires vous a présélectionné pour un prospect chaud. Voulez-vous accepter ?',
                    priority: 'high'
                })
                .select('id')
                .single();

            if (error) throw error;

            // Mettre à jour le statut du prospect
            await supabase
                .from('Prospect')
                .update({ 
                    status: 'expert_assigned',
                    expert_contacted_at: new Date().toISOString()
                })
                .eq('id', prospectId);

            return {
                success: true,
                notification_id: notification.id
            };

        } catch (error) {
            console.error('Erreur notifyExpertNewProspect:', error);
            return {
                success: false
            };
        }
    }

    // ===== VALIDATION =====
    private static validateProspectData(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (data.company_name !== undefined && (!data.company_name || data.company_name.trim().length === 0)) {
            errors.push('Le nom de l\'entreprise est requis');
        }

        if (data.decision_maker_first_name !== undefined && (!data.decision_maker_first_name || data.decision_maker_first_name.trim().length === 0)) {
            errors.push('Le prénom du décisionnaire est requis');
        }

        if (data.decision_maker_last_name !== undefined && (!data.decision_maker_last_name || data.decision_maker_last_name.trim().length === 0)) {
            errors.push('Le nom du décisionnaire est requis');
        }

        if (data.decision_maker_email !== undefined) {
            if (!data.decision_maker_email || !this.isValidEmail(data.decision_maker_email)) {
                errors.push('L\'email du décisionnaire est requis et doit être valide');
            }
        }

        if (data.decision_maker_phone !== undefined && (!data.decision_maker_phone || data.decision_maker_phone.trim().length === 0)) {
            errors.push('Le téléphone du décisionnaire est requis');
        }

        if (data.qualification_score !== undefined && (data.qualification_score < 1 || data.qualification_score > 10)) {
            errors.push('Le score de qualification doit être entre 1 et 10');
        }

        if (data.siren !== undefined && data.siren && !this.isValidSiren(data.siren)) {
            errors.push('Le SIREN doit contenir exactement 9 chiffres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }

    private static isValidSiren(siren: string): boolean {
        const sirenRegex = /^[0-9]{9}$/;
        return sirenRegex.test(siren);
    }
}
