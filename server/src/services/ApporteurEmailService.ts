import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface ApporteurCredentials {
    email: string;
    temporaryPassword: string;
    loginUrl: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyType: string;
    siren?: string;
}

export class ApporteurEmailService {
    
    // ===== GÉNÉRATION MOT DE PASSE PROVISOIRE =====
    static generateTemporaryPassword(): string {
        // Générer un mot de passe de 12 caractères avec lettres et chiffres
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // ===== CRÉATION COMPTE APPORTEUR =====
    static async createApporteurAccount(apporteurData: {
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        company_name: string;
        company_type: string;
        siren?: string;
    }): Promise<ApporteurCredentials> {
        try {
            // Générer mot de passe provisoire
            const temporaryPassword = this.generateTemporaryPassword();
            
            // Créer le compte Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: apporteurData.email,
                password: temporaryPassword,
                email_confirm: true,
                user_metadata: {
                    first_name: apporteurData.first_name,
                    last_name: apporteurData.last_name,
                    phone: apporteurData.phone,
                    company_name: apporteurData.company_name,
                    company_type: apporteurData.company_type,
                    siren: apporteurData.siren,
                    role: 'apporteur_affaires',
                    type: 'apporteur_affaires'
                }
            });

            if (authError) throw authError;

            // Créer l'entrée dans la table ApporteurAffaires
            const { data: apporteur, error: apporteurError } = await supabase
                .from('ApporteurAffaires')
                .insert({
                    auth_id: authData.user.id,
                    email: apporteurData.email,
                    first_name: apporteurData.first_name,
                    last_name: apporteurData.last_name,
                    phone: apporteurData.phone,
                    company_name: apporteurData.company_name,
                    company_type: apporteurData.company_type,
                    siren: apporteurData.siren,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (apporteurError) throw apporteurError;

            // Générer URL de connexion
            const loginUrl = `${process.env.FRONTEND_URL || 'https://www.profitum.app'}/apporteur/login`;

            return {
                email: apporteurData.email,
                temporaryPassword,
                loginUrl,
                firstName: apporteurData.first_name,
                lastName: apporteurData.last_name,
                companyName: apporteurData.company_name,
                companyType: apporteurData.company_type,
                siren: apporteurData.siren
            };

        } catch (error) {
            console.error('Erreur createApporteurAccount:', error);
            throw new Error('Erreur lors de la création du compte apporteur');
        }
    }

    // ===== ENVOI EMAIL CRÉDENTIALS APPORTEUR =====
    static async sendApporteurCredentials(credentials: ApporteurCredentials): Promise<boolean> {
        try {
            const template = this.getApporteurCredentialsTemplate(credentials);
            
            // Ici vous pouvez intégrer votre service d'email (SendGrid, Mailgun, etc.)
            console.log('📧 Email apporteur à envoyer:', {
                to: credentials.email,
                subject: template.subject,
                html: template.html
            });

            // TODO: Intégrer le vrai service d'email
            // await this.sendEmail(credentials.email, template.subject, template.html);

            return true;

        } catch (error) {
            console.error('Erreur sendApporteurCredentials:', error);
            return false;
        }
    }

    // ===== TEMPLATE EMAIL CRÉDENTIALS APPORTEUR =====
    private static getApporteurCredentialsTemplate(credentials: ApporteurCredentials): { subject: string; html: string; text: string } {
        const subject = 'Bienvenue sur Profitum - Vos identifiants Apporteur d\'Affaires';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Bienvenue sur Profitum - Apporteur d'Affaires</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .feature { display: flex; align-items: center; margin: 10px 0; }
                    .feature-icon { width: 20px; height: 20px; margin-right: 10px; color: #2563eb; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bienvenue sur Profitum</h1>
                        <p>Espace Apporteur d'Affaires</p>
                    </div>
                    <div class="content">
                        <p>Bonjour ${credentials.firstName} ${credentials.lastName},</p>
                        
                        <p>Félicitations ! Votre compte Apporteur d'Affaires a été créé avec succès sur notre plateforme Profitum. Vous pouvez maintenant accéder à votre espace dédié avec les identifiants suivants :</p>
                        
                        <div class="credentials">
                            <h3>Vos identifiants de connexion :</h3>
                            <p><strong>Email :</strong> ${credentials.email}</p>
                            <p><strong>Mot de passe provisoire :</strong> <code>${credentials.temporaryPassword}</code></p>
                        </div>
                        
                        <div class="features">
                            <h3>Fonctionnalités disponibles :</h3>
                            <div class="feature">
                                <span class="feature-icon">👥</span>
                                <span>Gestion de vos prospects</span>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">📅</span>
                                <span>Planification de rendez-vous</span>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">👨‍💼</span>
                                <span>Assignation d'experts</span>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">💰</span>
                                <span>Suivi de vos commissions</span>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">📊</span>
                                <span>Tableaux de bord et statistiques</span>
                            </div>
                        </div>
                        
                        <p>Pour votre sécurité, nous vous recommandons de changer ce mot de passe lors de votre première connexion.</p>
                        
                        <a href="${credentials.loginUrl}" class="button">Accéder à mon espace Apporteur</a>
                        
                        <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe support.</p>
                        
                        <p>Cordialement,<br>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                        <p>Espace Apporteur d'Affaires</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Bienvenue sur Profitum - Apporteur d'Affaires
            
            Bonjour ${credentials.firstName} ${credentials.lastName},
            
            Félicitations ! Votre compte Apporteur d'Affaires a été créé avec succès sur notre plateforme Profitum.
            
            Vos identifiants de connexion :
            Email : ${credentials.email}
            Mot de passe provisoire : ${credentials.temporaryPassword}
            
            Fonctionnalités disponibles :
            - Gestion de vos prospects
            - Planification de rendez-vous
            - Assignation d'experts
            - Suivi de vos commissions
            - Tableaux de bord et statistiques
            
            Pour votre sécurité, nous vous recommandons de changer ce mot de passe lors de votre première connexion.
            
            Lien de connexion : ${credentials.loginUrl}
            
            Si vous avez des questions, n'hésitez pas à contacter notre équipe support.
            
            Cordialement,
            L'équipe Profitum
        `;

        return { subject, html, text };
    }

    // ===== MÉTHODE GÉNÉRIQUE D'ENVOI =====
    private static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        // TODO: Intégrer votre service d'email préféré
        // Exemples : SendGrid, Mailgun, AWS SES, etc.
        
        console.log('📧 Email apporteur envoyé:', { to, subject });
        return true;
    }
}
