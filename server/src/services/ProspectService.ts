import { createClient } from '@supabase/supabase-js';
import { 
    ProspectFormData, 
    ProspectResponse, 
    ProspectFilters, 
    ApiResponse,
    CreateProspectResponse 
} from '../types/apporteur';
import { PasswordService } from './PasswordService';
import { EmailService } from './EmailService';
import { getExchangeEmailTemplate, getPresentationEmailTemplate } from '../templates/prospect-emails';

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

            // ÉTAPE 1: Générer un mot de passe provisoire sécurisé
            console.log('🔐 Génération du mot de passe provisoire...');
            const { plainPassword, hashedPassword } = await PasswordService.generateAndHashTemporaryPassword();
            console.log('✅ Mot de passe provisoire généré (format: XXX-XXX-XXX)');

            // ÉTAPE 2: Créer le compte Supabase Auth
            console.log('👤 Création du compte Supabase Auth...');
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: prospectData.email,
                password: plainPassword,
                email_confirm: true, // Email automatiquement confirmé
                user_metadata: {
                    name: prospectData.name,
                    company_name: prospectData.company_name,
                    phone_number: prospectData.phone_number,
                    role: 'client',
                    created_by: 'apporteur',
                    apporteur_id: apporteurId,
                    requires_password_change: true // Changement obligatoire à la première connexion
                }
            });

            if (authError) {
                console.error('❌ Erreur création compte Auth:', authError);
                
                // Si l'utilisateur existe déjà, on récupère son ID
                if (authError.message.includes('already registered')) {
                    throw new Error(`Un compte existe déjà avec l'email ${prospectData.email}. Veuillez utiliser un autre email.`);
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error('Aucun utilisateur créé par Supabase Auth');
            }

            console.log('✅ Compte Supabase Auth créé:', authData.user.id);

            // ÉTAPE 3: Créer le prospect dans la table Client avec status = 'prospect'
            const clientData = {
                // Auth
                auth_id: authData.user.id,
                email: prospectData.email,
                password: hashedPassword, // Mot de passe haché
                type: 'client', // Type = client (sera prospect via status)
                
                // Informations entreprise
                company_name: prospectData.company_name,
                siren: prospectData.siren || null,
                address: prospectData.address || null,
                website: prospectData.website || null,
                
                // Décisionnaire
                name: prospectData.name,
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
                temp_password: plainPassword, // Stocker temporairement pour l'email (sera supprimé après envoi)
                
                // Timestamps
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📊 ProspectService.createProspect - Données à insérer dans Client');

            const { data: prospect, error: clientError } = await supabase
                .from('Client')
                .insert(clientData)
                .select('*')
                .single();

            if (clientError) {
                console.error('❌ ProspectService.createProspect - Erreur Supabase:', clientError);
                
                // Supprimer le compte Auth si la création du Client échoue
                console.log('🗑️ Suppression du compte Auth suite à l\'erreur...');
                await supabase.auth.admin.deleteUser(authData.user.id);
                
                throw clientError;
            }

            console.log('✅ ProspectService.createProspect - Prospect créé:', prospect.id);

            // Gérer les produits sélectionnés si présents
            if (prospectData.selected_products && prospectData.selected_products.length > 0) {
                console.log('🔍 ProspectService.createProspect - Gestion des produits sélectionnés');
                const selectedProducts = prospectData.selected_products.filter((p: any) => p.selected);
                
                if (selectedProducts.length > 0) {
                    const productLinks = selectedProducts.map((p: any) => ({
                        client_id: prospect.id,
                        produit_eligible_id: p.id,
                        notes: p.notes || null,
                        priority: p.priority || 'medium',
                        estimated_amount: p.estimated_amount || null,
                        success_probability: p.success_probability || null,
                        created_at: new Date().toISOString()
                    }));

                    const { error: productsError } = await supabase
                        .from('ClientProduitEligible')
                        .insert(productLinks);

                    if (productsError) {
                        console.error('⚠️ Erreur liaison produits:', productsError);
                        // On ne bloque pas la création du prospect
                    } else {
                        console.log(`✅ ${productLinks.length} produit(s) lié(s) au prospect`);
                    }
                }
            }

            // Gérer le RDV si présent
            if (prospectData.meeting_type && prospectData.scheduled_date && prospectData.scheduled_time) {
                console.log('🔍 ProspectService.createProspect - Création du RDV');
                const rdvData = {
                    client_id: prospect.id,
                    apporteur_id: apporteurId,
                    meeting_type: prospectData.meeting_type,
                    scheduled_date: prospectData.scheduled_date,
                    scheduled_time: prospectData.scheduled_time,
                    location: prospectData.location || null,
                    status: 'scheduled',
                    created_at: new Date().toISOString()
                };

                const { error: rdvError } = await supabase
                    .from('CalendarEvent')
                    .insert({
                        title: `RDV Prospect - ${prospectData.company_name}`,
                        description: `Rendez-vous avec ${prospectData.name} (${prospectData.email})`,
                        start_time: `${prospectData.scheduled_date}T${prospectData.scheduled_time}:00`,
                        end_time: `${prospectData.scheduled_date}T${prospectData.scheduled_time}:00`, // TODO: calculer +1h
                        event_type: prospectData.meeting_type,
                        status: 'scheduled',
                        created_by: apporteurId,
                        client_id: prospect.id,
                        location: prospectData.location,
                        created_at: new Date().toISOString()
                    });

                if (rdvError) {
                    console.error('⚠️ Erreur création RDV:', rdvError);
                    // On ne bloque pas la création du prospect
                } else {
                    console.log('✅ RDV créé dans le calendrier');
                }
            }

            return {
                prospect: {
                    ...prospect,
                    temporaryPassword: plainPassword // Inclure le mot de passe pour l'email (ne sera jamais affiché à l'apporteur dans l'UI)
                },
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

    /**
     * Envoie les identifiants de connexion au prospect par email
     * @param prospectId ID du prospect
     * @param emailType Type d'email ('exchange' ou 'presentation')
     * @param apporteurId ID de l'apporteur qui a créé le prospect
     */
    static async sendProspectCredentials(
        prospectId: string,
        emailType: 'exchange' | 'presentation',
        apporteurId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`📧 Envoi des identifiants au prospect ${prospectId}...`);

            // Récupérer les données du prospect
            const { data: prospect, error: prospectError } = await supabase
                .from('Client')
                .select('id, name, email, company_name, temp_password, status')
                .eq('id', prospectId)
                .eq('status', 'prospect')
                .single();

            if (prospectError || !prospect) {
                throw new Error('Prospect non trouvé');
            }

            if (!prospect.temp_password) {
                throw new Error('Aucun mot de passe provisoire disponible pour ce prospect');
            }

            // Récupérer les données de l'apporteur
            const { data: apporteur, error: apporteurError } = await supabase
                .from('ApporteurAffaires')
                .select('first_name, last_name, company_name, email')
                .eq('id', apporteurId)
                .single();

            if (apporteurError || !apporteur) {
                throw new Error('Apporteur non trouvé');
            }

            const apporteurName = `${apporteur.first_name} ${apporteur.last_name}`;
            const loginUrl = `${process.env.CLIENT_URL || 'https://www.profitum.app'}/login`;

            // Préparer les données pour le template
            const emailData = {
                prospectName: prospect.name,
                prospectEmail: prospect.email,
                temporaryPassword: prospect.temp_password,
                apporteurName,
                apporteurCompany: apporteur.company_name || apporteurName,
                loginUrl
            };

            // Sélectionner le template approprié
            const emailTemplate = emailType === 'exchange' 
                ? getExchangeEmailTemplate(emailData)
                : getPresentationEmailTemplate(emailData);

            // Envoyer l'email
            const emailSent = await EmailService.sendEmail({
                to: prospect.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text
            });

            if (!emailSent) {
                throw new Error('Échec de l\'envoi de l\'email');
            }

            // Supprimer le temp_password de la base de données après envoi réussi
            const { error: updateError } = await supabase
                .from('Client')
                .update({ 
                    temp_password: null,
                    temp_password_sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', prospectId);

            if (updateError) {
                console.error('⚠️ Erreur suppression temp_password:', updateError);
                // On ne bloque pas le succès de l'envoi
            }

            console.log('✅ Email envoyé avec succès au prospect');

            return {
                success: true,
                message: `Email "${emailType === 'exchange' ? 'Échange concluant' : 'Présentation'}" envoyé à ${prospect.email}`
            };

        } catch (error) {
            console.error('❌ Erreur envoi email prospect:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email'
            };
        }
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
