import { createClient } from '@supabase/supabase-js';
import { ApporteurRegistrationData } from '../types/apporteur';
import { ApporteurEmailService } from './ApporteurEmailService';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class AdminApporteurService {
    
    // ===== CRÉER UN APPORTEUR D'AFFAIRES =====
    static async createApporteur(adminId: string, apporteurData: ApporteurRegistrationData): Promise<{ success: boolean; apporteur?: any; error?: string }> {
        try {
            // Validation des données
            const validation = this.validateApporteurData(apporteurData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `Données invalides: ${validation.errors.join(', ')}`
                };
            }

            // 1. Créer l'utilisateur dans Supabase Auth
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: apporteurData.email,
                password: apporteurData.password,
                email_confirm: true, // Auto-confirmer l'email
                user_metadata: {
                    first_name: apporteurData.first_name,
                    last_name: apporteurData.last_name,
                    type: 'apporteur'
                }
            });

            if (authError || !authUser.user) {
                console.error('Erreur création utilisateur auth:', authError);
                return {
                    success: false,
                    error: 'Erreur lors de la création de l\'utilisateur'
                };
            }

            // 2. Créer l'apporteur dans la table ApporteurAffaires
            const { data: apporteur, error: apporteurError } = await supabase
                .from('ApporteurAffaires')
                .insert({
                    auth_user_id: authUser.user.id, // 🔥 Utiliser auth_user_id (cohérent)
                    first_name: apporteurData.first_name,
                    last_name: apporteurData.last_name,
                    email: apporteurData.email,
                    phone: apporteurData.phone,
                    company_name: apporteurData.company_name,
                    company_type: apporteurData.company_type,
                    siren: apporteurData.siren,
                    commission_rate: 5.00, // Taux par défaut
                    status: 'candidature', // Statut valide selon la contrainte DB
                    is_active: true,
                    approved_by: adminId
                })
                .select(`
                    id,
                    auth_user_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    company_name,
                    company_type,
                    siren,
                    commission_rate,
                    status,
                    created_at
                `)
                .single();

            if (apporteurError) {
                console.error('Erreur création apporteur:', apporteurError);
                
                // Nettoyer l'utilisateur auth créé en cas d'erreur
                await supabase.auth.admin.deleteUser(authUser.user.id);
                
                return {
                    success: false,
                    error: 'Erreur lors de la création de l\'apporteur'
                };
            }

            // 3. Envoyer l'email avec les identifiants
            try {
                const credentials = await ApporteurEmailService.createApporteurAccount({
                    email: apporteurData.email,
                    first_name: apporteurData.first_name,
                    last_name: apporteurData.last_name,
                    phone: apporteurData.phone,
                    company_name: apporteurData.company_name,
                    company_type: apporteurData.company_type,
                    siren: apporteurData.siren
                });

                const emailSent = await ApporteurEmailService.sendApporteurCredentials(credentials);
                
                console.log('📧 Email apporteur envoyé:', {
                    email: credentials.email,
                    sent: emailSent
                });
            } catch (emailError) {
                console.error('Erreur envoi email apporteur:', emailError);
                // Ne pas faire échouer la création si l'email échoue
            }

            return {
                success: true,
                apporteur
            };

        } catch (error) {
            console.error('Erreur createApporteur:', error);
            return {
                success: false,
                error: 'Erreur lors de la création de l\'apporteur'
            };
        }
    }

    // ===== LISTER LES APPORTEURS =====
    static async getApporteurs(filters: { status?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; data?: any[]; error?: string; pagination?: any }> {
        try {
            const { status, page = 1, limit = 20 } = filters;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('ApporteurAffaires')
                .select(`
                    id,
                    auth_user_id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    company_name,
                    company_type,
                    siren,
                    status,
                    approved_at,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data: apporteurs, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: apporteurs || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Erreur getApporteurs:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des apporteurs'
            };
        }
    }

    // ===== ACTIVER/DÉSACTIVER UN APPORTEUR =====
    static async updateApporteurStatus(apporteurId: string, status: 'active' | 'inactive' | 'suspended', adminId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            };

            if (status === 'active') {
                updateData.approved_at = new Date().toISOString();
                updateData.approved_by = adminId;
            }

            const { error } = await supabase
                .from('ApporteurAffaires')
                .update(updateData)
                .eq('id', apporteurId);

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Erreur updateApporteurStatus:', error);
            return {
                success: false,
                error: 'Erreur lors de la mise à jour du statut'
            };
        }
    }

    // ===== MODIFIER LE TAUX DE COMMISSION =====
    static async updateCommissionRate(apporteurId: string, commissionRate: number, adminId: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (commissionRate < 0 || commissionRate > 100) {
                return {
                    success: false,
                    error: 'Le taux de commission doit être entre 0 et 100'
                };
            }

            const { error } = await supabase
                .from('ApporteurAffaires')
                .update({
                    commission_rate: commissionRate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', apporteurId);

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Erreur updateCommissionRate:', error);
            return {
                success: false,
                error: 'Erreur lors de la mise à jour du taux de commission'
            };
        }
    }

    // ===== STATISTIQUES APPORTEURS =====
    static async getApporteurStats(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Statistiques générales
            const { data: totalApporteurs, error: totalError } = await supabase
                .from('ApporteurAffaires')
                .select('status', { count: 'exact' });

            if (totalError) throw totalError;

            // Statistiques par statut
            const stats = totalApporteurs?.reduce((acc: any, apporteur: any) => {
                acc[apporteur.status] = (acc[apporteur.status] || 0) + 1;
                return acc;
            }, {});

            // Statistiques des prospects
            const { data: prospectsStats, error: prospectsError } = await supabase
                .from('Prospect')
                .select('apporteur_id, status')
                .not('apporteur_id', 'is', null);

            if (prospectsError) throw prospectsError;

            const prospectsByApporteur = prospectsStats?.reduce((acc: any, prospect: any) => {
                if (!acc[prospect.apporteur_id]) {
                    acc[prospect.apporteur_id] = { total: 0, converted: 0 };
                }
                acc[prospect.apporteur_id].total++;
                if (prospect.status === 'converted') {
                    acc[prospect.apporteur_id].converted++;
                }
                return acc;
            }, {});

            return {
                success: true,
                data: {
                    total_apporteurs: totalApporteurs?.length || 0,
                    by_status: stats,
                    prospects_by_apporteur: prospectsByApporteur
                }
            };

        } catch (error) {
            console.error('Erreur getApporteurStats:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des statistiques'
            };
        }
    }

    // ===== VALIDATION =====
    private static validateApporteurData(data: ApporteurRegistrationData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        console.log('🔍 Validation des données apporteur:', {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            company_name: data.company_name,
            company_type: data.company_type,
            siren: data.siren,
            password: data.password ? '***' : 'MANQUANT',
            confirm_password: data.confirm_password ? '***' : 'MANQUANT'
        });

        if (!data.first_name || data.first_name.trim().length === 0) {
            errors.push('Le prénom est requis');
        }

        if (!data.last_name || data.last_name.trim().length === 0) {
            errors.push('Le nom est requis');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('L\'email est requis et doit être valide');
        }

        if (!data.phone || data.phone.trim().length === 0) {
            errors.push('Le téléphone est requis');
        }

        if (!data.company_name || data.company_name.trim().length === 0) {
            errors.push('Le nom de l\'entreprise est requis');
        }

        if (!data.company_type) {
            errors.push('Le type d\'entreprise est requis');
        } else {
            const validCompanyTypes = ['independant', 'expert', 'call_center', 'societe_commerciale'];
            if (!validCompanyTypes.includes(data.company_type)) {
                errors.push(`Le type d'entreprise doit être l'un des suivants: ${validCompanyTypes.join(', ')}`);
            }
        }

        if (data.siren && !this.isValidSiren(data.siren)) {
            errors.push('Le SIREN doit contenir exactement 9 chiffres');
        }

        if (!data.password || data.password.length < 6) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }

        // Vérifier la confirmation du mot de passe seulement si elle est fournie
        if (data.confirm_password && data.password !== data.confirm_password) {
            errors.push('Les mots de passe ne correspondent pas');
        }

        console.log('🔍 Résultat validation:', {
            isValid: errors.length === 0,
            errorsCount: errors.length,
            errors: errors
        });

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
