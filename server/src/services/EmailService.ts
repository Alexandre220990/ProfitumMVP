import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface ClientCredentials {
    email: string;
    temporaryPassword: string;
    loginUrl: string;
}

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export class EmailService {
    
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

    // ===== CRÉATION COMPTE CLIENT =====
    static async createClientAccount(clientData: {
        email: string;
        name: string;
        company_name: string;
        phone_number: string;
        apporteur_id: string;
    }): Promise<ClientCredentials> {
        try {
            // Générer mot de passe provisoire
            const temporaryPassword = this.generateTemporaryPassword();
            
            // Créer le compte Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: clientData.email,
                password: temporaryPassword,
                email_confirm: true,
                user_metadata: {
                    name: clientData.name,
                    company_name: clientData.company_name,
                    phone_number: clientData.phone_number,
                    type: 'client'
                }
            });

            if (authError) throw authError;

            // Créer l'entrée dans la table Client
            const { data: client, error: clientError } = await supabase
                .from('Client')
                .insert({
                    auth_user_id: authData.user.id,
                    email: clientData.email,
                    name: clientData.name,
                    company_name: clientData.company_name,
                    phone_number: clientData.phone_number,
                    status: 'prospect',
                    apporteur_id: clientData.apporteur_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (clientError) throw clientError;

            // Générer URL de connexion
            const loginUrl = `${process.env.FRONTEND_URL || 'https://www.profitum.app'}/client/login`;

            return {
                email: clientData.email,
                temporaryPassword,
                loginUrl
            };

        } catch (error) {
            console.error('Erreur createClientAccount:', error);
            throw new Error('Erreur lors de la création du compte client');
        }
    }

    // ===== ENVOI EMAIL CRÉDENTIALS =====
    static async sendClientCredentials(credentials: ClientCredentials, clientName: string): Promise<boolean> {
        try {
            const template = this.getClientCredentialsTemplate(credentials, clientName);
            
            // Ici vous pouvez intégrer votre service d'email (SendGrid, Mailgun, etc.)
            // Pour l'instant, on simule l'envoi
            console.log('📧 Email à envoyer:', {
                to: credentials.email,
                subject: template.subject,
                html: template.html
            });

            // TODO: Intégrer le vrai service d'email
            // await this.sendEmail(credentials.email, template.subject, template.html);

            return true;

        } catch (error) {
            console.error('Erreur sendClientCredentials:', error);
            return false;
        }
    }

    // ===== TEMPLATE EMAIL CRÉDENTIALS =====
    private static getClientCredentialsTemplate(credentials: ClientCredentials, clientName: string): EmailTemplate {
        const subject = 'Bienvenue sur Profitum - Vos identifiants de connexion';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Bienvenue sur Profitum</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bienvenue sur Profitum</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${clientName},</p>
                        
                        <p>Votre apporteur d'affaires vous a enregistré sur notre plateforme Profitum. Vous pouvez maintenant accéder à votre espace client avec les identifiants suivants :</p>
                        
                        <div class="credentials">
                            <h3>Vos identifiants de connexion :</h3>
                            <p><strong>Email :</strong> ${credentials.email}</p>
                            <p><strong>Mot de passe provisoire :</strong> <code>${credentials.temporaryPassword}</code></p>
                        </div>
                        
                        <p>Pour votre sécurité, nous vous recommandons de changer ce mot de passe lors de votre première connexion.</p>
                        
                        <a href="${credentials.loginUrl}" class="button">Se connecter à mon espace</a>
                        
                        <p>Si vous avez des questions, n'hésitez pas à contacter votre apporteur d'affaires.</p>
                        
                        <p>Cordialement,<br>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Bienvenue sur Profitum
            
            Bonjour ${clientName},
            
            Votre apporteur d'affaires vous a enregistré sur notre plateforme Profitum. 
            Vous pouvez maintenant accéder à votre espace client avec les identifiants suivants :
            
            Email : ${credentials.email}
            Mot de passe provisoire : ${credentials.temporaryPassword}
            
            Pour votre sécurité, nous vous recommandons de changer ce mot de passe lors de votre première connexion.
            
            Lien de connexion : ${credentials.loginUrl}
            
            Si vous avez des questions, n'hésitez pas à contacter votre apporteur d'affaires.
            
            Cordialement,
            L'équipe Profitum
        `;

        return { subject, html, text };
    }

    // ===== NOTIFICATION EXPERT =====
    static async sendExpertNotification(expertEmail: string, notificationData: {
        prospectName: string;
        companyName: string;
        apporteurName: string;
        meetingDate?: string;
        meetingTime?: string;
        meetingType?: string;
    }): Promise<boolean> {
        try {
            const template = this.getExpertNotificationTemplate(notificationData);
            
            console.log('📧 Notification expert à envoyer:', {
                to: expertEmail,
                subject: template.subject,
                html: template.html
            });

            // TODO: Intégrer le vrai service d'email
            // await this.sendEmail(expertEmail, template.subject, template.html);

            return true;

        } catch (error) {
            console.error('Erreur sendExpertNotification:', error);
            return false;
        }
    }

    // ===== TEMPLATE NOTIFICATION EXPERT =====
    private static getExpertNotificationTemplate(data: {
        prospectName: string;
        companyName: string;
        apporteurName: string;
        meetingDate?: string;
        meetingTime?: string;
        meetingType?: string;
    }): EmailTemplate {
        const subject = 'Nouvelle demande de rendez-vous - Profitum';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Nouvelle demande de rendez-vous</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #059669; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .meeting-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nouvelle demande de rendez-vous</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour,</p>
                        
                        <p>L'apporteur d'affaires <strong>${data.apporteurName}</strong> vous a assigné un nouveau prospect :</p>
                        
                        <div class="meeting-info">
                            <h3>Informations du prospect :</h3>
                            <p><strong>Nom :</strong> ${data.prospectName}</p>
                            <p><strong>Entreprise :</strong> ${data.companyName}</p>
                            ${data.meetingDate ? `<p><strong>Date proposée :</strong> ${data.meetingDate}</p>` : ''}
                            ${data.meetingTime ? `<p><strong>Heure proposée :</strong> ${data.meetingTime}</p>` : ''}
                            ${data.meetingType ? `<p><strong>Type de rendez-vous :</strong> ${data.meetingType}</p>` : ''}
                        </div>
                        
                        <p>Vous avez 48h pour répondre à cette demande. Vous pouvez :</p>
                        <ul>
                            <li>✅ Accepter le créneau proposé</li>
                            <li>🔄 Proposer un autre créneau</li>
                            <li>📞 Appeler pour fixer directement</li>
                            <li>❌ Refuser avec motif</li>
                        </ul>
                        
                        <a href="${process.env.FRONTEND_URL || 'https://www.profitum.app'}/expert/dashboard" class="button">Voir la demande</a>
                        
                        <p>Cordialement,<br>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Nouvelle demande de rendez-vous - Profitum
            
            Bonjour,
            
            L'apporteur d'affaires ${data.apporteurName} vous a assigné un nouveau prospect :
            
            Nom : ${data.prospectName}
            Entreprise : ${data.companyName}
            ${data.meetingDate ? `Date proposée : ${data.meetingDate}` : ''}
            ${data.meetingTime ? `Heure proposée : ${data.meetingTime}` : ''}
            ${data.meetingType ? `Type de rendez-vous : ${data.meetingType}` : ''}
            
            Vous avez 48h pour répondre à cette demande. Vous pouvez :
            - Accepter le créneau proposé
            - Proposer un autre créneau
            - Appeler pour fixer directement
            - Refuser avec motif
            
            Lien : ${process.env.FRONTEND_URL || 'https://www.profitum.app'}/expert/dashboard
            
            Cordialement,
            L'équipe Profitum
        `;

        return { subject, html, text };
    }

    // ===== EMAILS CANDIDATURES APPORTEUR =====
    
    static async sendApporteurCandidatureConfirmation(candidateEmail: string, firstName: string, lastName: string): Promise<boolean> {
        const subject = 'Candidature Apporteur d\'Affaires - Confirmation de réception';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Confirmation de candidature</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Candidature reçue</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${firstName} ${lastName},</p>
                        <p>Nous avons bien reçu votre candidature pour devenir apporteur d'affaires chez Profitum.</p>
                        <p>Votre dossier sera examiné par notre équipe dans les 48 heures. Vous recevrez une réponse par email.</p>
                        <p>En attendant, n'hésitez pas à consulter notre site pour en savoir plus sur nos services.</p>
                        <p>Merci pour votre intérêt pour Profitum !</p>
                        <p>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const text = `
            Candidature Apporteur d'Affaires - Confirmation de réception
            
            Bonjour ${firstName} ${lastName},
            Nous avons bien reçu votre candidature pour devenir apporteur d'affaires chez Profitum.
            Votre dossier sera examiné par notre équipe dans les 48 heures. Vous recevrez une réponse par email.
            En attendant, n'hésitez pas à consulter notre site pour en savoir plus sur nos services.
            Merci pour votre intérêt pour Profitum !
            L'équipe Profitum
        `;

        return this.sendEmail(candidateEmail, subject, html, text);
    }

    static async notifyAdminNewCandidature(candidatureId: string, firstName: string, lastName: string, companyName: string): Promise<boolean> {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@profitum.app';
        const subject = 'Nouvelle candidature Apporteur d\'Affaires';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Nouvelle candidature</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Nouvelle candidature</h1>
                    </div>
                    <div class="content">
                        <p>Une nouvelle candidature d'apporteur d'affaires a été soumise :</p>
                        <ul>
                            <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
                            <li><strong>Entreprise :</strong> ${companyName}</li>
                            <li><strong>ID Candidature :</strong> ${candidatureId}</li>
                        </ul>
                        <p>Veuillez traiter cette candidature dans le dashboard admin.</p>
                        <a href="${process.env.FRONTEND_URL || 'https://www.profitum.app'}/admin" class="button">Accéder au dashboard</a>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const text = `
            Nouvelle candidature Apporteur d'Affaires
            
            Une nouvelle candidature d'apporteur d'affaires a été soumise :
            Nom : ${firstName} ${lastName}
            Entreprise : ${companyName}
            ID Candidature : ${candidatureId}
            Veuillez traiter cette candidature dans le dashboard admin.
        `;

        return this.sendEmail(adminEmail, subject, html, text);
    }

    static async sendApporteurApprovalNotification(candidateEmail: string, firstName: string, lastName: string): Promise<boolean> {
        const subject = 'Félicitations ! Votre candidature Apporteur d\'Affaires a été approuvée';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Candidature approuvée</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #059669; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Félicitations !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${firstName} ${lastName},</p>
                        <p>Excellente nouvelle ! Votre candidature pour devenir apporteur d'affaires chez Profitum a été approuvée.</p>
                        <p>Vous recevrez prochainement vos identifiants de connexion par email séparé.</p>
                        <p>Bienvenue dans l'équipe Profitum !</p>
                        <p>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const text = `
            Félicitations ! Votre candidature Apporteur d'Affaires a été approuvée
            
            Bonjour ${firstName} ${lastName},
            Excellente nouvelle ! Votre candidature pour devenir apporteur d'affaires chez Profitum a été approuvée.
            Vous recevrez prochainement vos identifiants de connexion par email séparé.
            Bienvenue dans l'équipe Profitum !
            L'équipe Profitum
        `;

        return this.sendEmail(candidateEmail, subject, html, text);
    }

    static async sendApporteurRejectionNotification(candidateEmail: string, firstName: string, lastName: string, adminNotes?: string): Promise<boolean> {
        const subject = 'Candidature Apporteur d\'Affaires - Décision';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Décision candidature</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .notes { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Décision candidature</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${firstName} ${lastName},</p>
                        <p>Après examen de votre candidature, nous ne sommes pas en mesure de vous proposer le poste d'apporteur d'affaires chez Profitum.</p>
                        ${adminNotes ? `<div class="notes"><strong>Commentaires :</strong> ${adminNotes}</div>` : ''}
                        <p>Nous vous remercions pour votre intérêt et vous souhaitons bonne chance dans vos projets.</p>
                        <p>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const text = `
            Candidature Apporteur d'Affaires - Décision
            
            Bonjour ${firstName} ${lastName},
            Après examen de votre candidature, nous ne sommes pas en mesure de vous proposer le poste d'apporteur d'affaires chez Profitum.
            ${adminNotes ? `Commentaires : ${adminNotes}` : ''}
            Nous vous remercions pour votre intérêt et vous souhaitons bonne chance dans vos projets.
            L'équipe Profitum
        `;

        return this.sendEmail(candidateEmail, subject, html, text);
    }

    // ===== MÉTHODE GÉNÉRIQUE D'ENVOI =====
    private static async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
        // TODO: Intégrer votre service d'email préféré
        // Exemples : SendGrid, Mailgun, AWS SES, etc.
        
        console.log('📧 Email envoyé:', { to, subject });
        return true;
    }
}
