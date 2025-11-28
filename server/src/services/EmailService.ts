import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import * as nodemailer from 'nodemailer';

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
    private static emailTransporter: nodemailer.Transporter | null = null;

    /**
     * Initialiser le transporteur email (singleton pattern)
     */
    private static initializeTransporter(): nodemailer.Transporter {
        if (!this.emailTransporter) {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('⚠️ Variables SMTP non configurées. Les emails ne seront pas envoyés.');
            }

            this.emailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false, // true pour port 465, false pour port 587
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
        return this.emailTransporter;
    }
    
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

    /**
     * Envoyer un email de confirmation d'approbation à un expert
     */
    static async sendExpertApprovalNotification(
        expertEmail: string,
        firstName: string,
        lastName: string,
        loginUrl: string = 'https://www.profitum.app/connexion-expert'
    ): Promise<boolean> {
        const subject = '✅ Votre compte expert Profitum est approuvé !';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Félicitations !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${firstName} ${lastName},</p>
                        
                        <p><strong>Excellente nouvelle !</strong> Votre compte expert Profitum a été approuvé par notre équipe.</p>
                        
                        <p>Vous pouvez désormais accéder à votre espace expert et commencer à collaborer avec nos clients.</p>
                        
                        <p><strong>Pour vous connecter :</strong></p>
                        <ul>
                            <li>Utilisez votre adresse email : <strong>${expertEmail}</strong></li>
                            <li>Utilisez le mot de passe que vous avez défini lors de votre inscription</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${loginUrl}" class="button">Accéder à mon espace expert</a>
                        </div>
                        
                        <p><strong>Ce que vous pouvez faire maintenant :</strong></p>
                        <ul>
                            <li>✅ Compléter votre profil expert</li>
                            <li>✅ Consulter les dossiers qui vous sont attribués</li>
                            <li>✅ Gérer votre agenda et vos rendez-vous</li>
                            <li>✅ Communiquer avec vos clients via la messagerie</li>
                        </ul>
                        
                        <p>Si vous rencontrez le moindre problème ou avez des questions, notre équipe support est là pour vous aider.</p>
                        
                        <p>Bienvenue dans l'équipe Profitum ! 🚀</p>
                        
                        <p>Cordialement,<br>L'équipe Profitum</p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const text = `
            Félicitations !
            
            Bonjour ${firstName} ${lastName},
            
            Excellente nouvelle ! Votre compte expert Profitum a été approuvé par notre équipe.
            
            Vous pouvez désormais accéder à votre espace expert et commencer à collaborer avec nos clients.
            
            Pour vous connecter :
            - Utilisez votre adresse email : ${expertEmail}
            - Utilisez le mot de passe que vous avez défini lors de votre inscription
            
            Accédez à votre espace : ${loginUrl}
            
            Bienvenue dans l'équipe Profitum !
            
            L'équipe Profitum
        `;

        return this.sendEmail(expertEmail, subject, html, text);
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

    /**
     * Envoyer un email de demande de RDV au candidat apporteur
     */
    static async sendApporteurRDVRequestNotification(
        candidateEmail: string,
        firstName: string,
        lastName: string,
        adminNotes?: string
    ): Promise<boolean> {
        const subject = 'Demande de rendez-vous - Candidature Apporteur d\'Affaires';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Demande de rendez-vous</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .notes { background: #fffbeb; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📅 Demande de rendez-vous</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${firstName} ${lastName},</p>
                        <p>Nous avons bien reçu votre candidature pour devenir apporteur d'affaires chez Profitum.</p>
                        <p>Nous souhaiterions échanger avec vous pour mieux comprendre votre profil et vos motivations.</p>
                        <p><strong>Pouvez-vous nous indiquer vos disponibilités pour un échange ?</strong></p>
                        ${adminNotes ? `<div class="notes"><strong>Message de l'équipe :</strong><br>${adminNotes}</div>` : ''}
                        <p>Nous vous remercions pour votre intérêt et restons à votre disposition pour toute question.</p>
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
            Demande de rendez-vous - Candidature Apporteur d'Affaires
            
            Bonjour ${firstName} ${lastName},
            Nous avons bien reçu votre candidature pour devenir apporteur d'affaires chez Profitum.
            Nous souhaiterions échanger avec vous pour mieux comprendre votre profil et vos motivations.
            Pouvez-vous nous indiquer vos disponibilités pour un échange ?
            ${adminNotes ? `Message de l'équipe : ${adminNotes}` : ''}
            Nous vous remercions pour votre intérêt et restons à votre disposition pour toute question.
            Cordialement,
            L'équipe Profitum
        `;

        return this.sendEmail(candidateEmail, subject, html, text);
    }

    /**
     * Notifier l'admin avec un email contenant un message prédéfini pour ouvrir le mail
     */
    static async notifyAdminRDVRequest(
        candidatureId: string,
        firstName: string,
        lastName: string,
        candidateEmail: string,
        candidatePhone: string,
        companyName: string,
        rdvTitle: string,
        rdvDate: string,
        rdvTime: string
    ): Promise<boolean> {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@profitum.app';
        const subject = `📅 Demande de RDV - Candidature ${firstName} ${lastName}`;
        
        // Formater la date en français
        const dateObj = new Date(rdvDate);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Message prédéfini pour l'email à envoyer au candidat avec les infos du RDV
        const predefinedMessage = `Bonjour ${firstName} ${lastName},

Nous avons bien reçu votre candidature pour devenir apporteur d'affaires chez Profitum.

Nous souhaiterions échanger avec vous pour mieux comprendre votre profil et vos motivations.

Nous vous proposons un rendez-vous de qualification :
📅 ${rdvTitle}
🗓️ ${formattedDate}
🕐 ${rdvTime}

Pouvez-vous nous confirmer votre disponibilité pour ce créneau, ou nous proposer un autre horaire si celui-ci ne vous convient pas ?

Nous vous remercions pour votre intérêt et restons à votre disposition pour toute question.

Cordialement,
L'équipe Profitum`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Demande de RDV</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .info-box { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
                    .message-box { background: #fffbeb; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; font-family: monospace; white-space: pre-wrap; }
                    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📅 Demande de RDV</h1>
                    </div>
                    <div class="content">
                        <p>Une demande de RDV a été effectuée pour la candidature suivante :</p>
                        <div class="info-box">
                            <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
                            <p><strong>Email :</strong> <a href="mailto:${candidateEmail}">${candidateEmail}</a></p>
                            <p><strong>Téléphone :</strong> <a href="tel:${candidatePhone}">${candidatePhone}</a></p>
                            <p><strong>Entreprise :</strong> ${companyName}</p>
                            <p><strong>ID Candidature :</strong> ${candidatureId}</p>
                            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                            <p><strong>📅 RDV proposé :</strong></p>
                            <p><strong>Titre :</strong> ${rdvTitle}</p>
                            <p><strong>Date :</strong> ${formattedDate}</p>
                            <p><strong>Heure :</strong> ${rdvTime}</p>
                        </div>
                        <p><strong>Message prédéfini à envoyer au candidat :</strong></p>
                        <div class="message-box">${predefinedMessage}</div>
                        <p>Vous pouvez copier ce message et l'envoyer directement au candidat, ou cliquer sur le lien ci-dessous pour ouvrir votre client email :</p>
                        <div style="text-align: center;">
                            <a href="mailto:${candidateEmail}?subject=Demande de rendez-vous - Candidature Apporteur d'Affaires&body=${encodeURIComponent(predefinedMessage)}" class="button">📧 Ouvrir le mail</a>
                        </div>
                        <p style="margin-top: 20px;">
                            <a href="${process.env.FRONTEND_URL || 'https://www.profitum.app'}/admin">Accéder au dashboard admin</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const text = `
            Demande de RDV - Candidature Apporteur d'Affaires
            
            Une demande de RDV a été effectuée pour la candidature suivante :
            Nom : ${firstName} ${lastName}
            Email : ${candidateEmail}
            Téléphone : ${candidatePhone}
            Entreprise : ${companyName}
            ID Candidature : ${candidatureId}
            
            Message prédéfini à envoyer au candidat :
            ${predefinedMessage}
            
            Accéder au dashboard : ${process.env.FRONTEND_URL || 'https://www.profitum.app'}/admin
        `;

        return this.sendEmail(adminEmail, subject, html, text);
    }

    // ===== ENVOI EMAIL CRÉDENTIALS ADMIN =====
    static async sendAdminCredentials(
        adminEmail: string,
        adminName: string,
        temporaryPassword: string
    ): Promise<boolean> {
        try {
            const template = this.getAdminCredentialsTemplate(adminEmail, adminName, temporaryPassword);
            
            // Utiliser nodemailer pour envoyer l'email réellement
            const emailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            await emailTransporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: adminEmail,
                subject: template.subject,
                html: template.html,
                text: template.text
            });

            console.log('✅ Email identifiants admin envoyé avec succès à:', adminEmail);
            return true;

        } catch (error) {
            console.error('❌ Erreur envoi email identifiants admin:', error);
            // Ne pas faire échouer la création de l'admin si l'email échoue
            return false;
        }
    }

    // ===== TEMPLATE EMAIL CRÉDENTIALS ADMIN =====
    private static getAdminCredentialsTemplate(
        adminEmail: string,
        adminName: string,
        temporaryPassword: string
    ): EmailTemplate {
        const subject = 'Bienvenue sur Profitum - Vos identifiants administrateur';
        const loginUrl = `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://www.profitum.app'}/connect-admin`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Identifiants Administrateur Profitum</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
                    .credentials { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #e5e7eb; }
                    .credential-item { margin: 15px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; }
                    .credential-label { font-weight: 600; color: #374151; margin-bottom: 5px; }
                    .credential-value { font-family: 'Courier New', monospace; font-size: 16px; color: #1f2937; background: white; padding: 8px; border-radius: 4px; }
                    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Identifiants Administrateur</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${adminName}</strong>,</p>
                        
                        <p>Votre compte administrateur a été créé sur la plateforme Profitum. Vous pouvez maintenant accéder au dashboard administrateur avec les identifiants suivants :</p>
                        
                        <div class="credentials">
                            <h3 style="margin-top: 0; color: #1f2937;">Vos identifiants de connexion :</h3>
                            
                            <div class="credential-item">
                                <div class="credential-label">📧 Email :</div>
                                <div class="credential-value">${adminEmail}</div>
                            </div>
                            
                            <div class="credential-item">
                                <div class="credential-label">🔑 Mot de passe provisoire :</div>
                                <div class="credential-value">${temporaryPassword}</div>
                            </div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Important :</strong> Pour votre sécurité, vous devez changer ce mot de passe provisoire lors de votre première connexion.
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${loginUrl}" class="button">Se connecter au dashboard admin</a>
                        </div>
                        
                        <p style="margin-top: 30px;">Une fois connecté, vous aurez accès à toutes les fonctionnalités d'administration de la plateforme.</p>
                        
                        <p>Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à contacter l'équipe technique.</p>
                        
                        <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Profitum</strong></p>
                    </div>
                    <div class="footer">
                        <p>Profitum - Plateforme de gestion des aides financières</p>
                        <p style="font-size: 12px; color: #9ca3af;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Identifiants Administrateur Profitum
            
            Bonjour ${adminName},
            
            Votre compte administrateur a été créé sur la plateforme Profitum. 
            Vous pouvez maintenant accéder au dashboard administrateur avec les identifiants suivants :
            
            Email : ${adminEmail}
            Mot de passe provisoire : ${temporaryPassword}
            
            ⚠️ IMPORTANT : Pour votre sécurité, vous devez changer ce mot de passe provisoire lors de votre première connexion.
            
            Lien de connexion : ${loginUrl}
            
            Une fois connecté, vous aurez accès à toutes les fonctionnalités d'administration de la plateforme.
            
            Si vous avez des questions ou rencontrez des difficultés, n'hésitez pas à contacter l'équipe technique.
            
            Cordialement,
            L'équipe Profitum
            
            ---
            Profitum - Plateforme de gestion des aides financières
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        `;

        return { subject, html, text };
    }

    // ===== MÉTHODE GÉNÉRIQUE D'ENVOI =====
    /**
     * Envoyer un email via SMTP (méthode publique pour les services externes)
     * @param to Adresse email du destinataire
     * @param subject Sujet de l'email
     * @param html Contenu HTML de l'email
     * @param text Version texte de l'email (optionnel)
     * @returns true si l'email a été envoyé avec succès, false sinon
     */
    static async sendDailyReportEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
        return this.sendEmail(to, subject, html, text);
    }

    /**
     * Envoyer un email via SMTP (méthode privée interne)
     * @param to Adresse email du destinataire
     * @param subject Sujet de l'email
     * @param html Contenu HTML de l'email
     * @param text Version texte de l'email (optionnel)
     * @returns true si l'email a été envoyé avec succès, false sinon
     */
    private static async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
        try {
            // Vérifier que les variables SMTP sont configurées
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                const missingVars = [];
                if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
                if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');
                if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
                console.error(`❌ Variables SMTP non configurées (${missingVars.join(', ')}). Email non envoyé à:`, to);
                console.error('💡 Pour configurer SMTP, ajoutez ces variables dans votre fichier .env ou variables d\'environnement:');
                console.error('   SMTP_HOST=smtp.gmail.com');
                console.error('   SMTP_PORT=587');
                console.error('   SMTP_USER=votre_email@gmail.com');
                console.error('   SMTP_PASS=votre_mot_de_passe_application');
                console.error('   SMTP_FROM=Profitum <votre_email@gmail.com>');
                return false;
            }

            // Initialiser le transporteur
            const transporter = this.initializeTransporter();

            // Préparer les options d'envoi
            const mailOptions: nodemailer.SendMailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER || 'Profitum <profitum.app@gmail.com>',
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, ''), // Extraire le texte si non fourni
            };

            // Envoyer l'email
            const info = await transporter.sendMail(mailOptions);
            
            console.log('✅ Email envoyé avec succès:', {
                to,
                subject,
                messageId: info.messageId
            });

            return true;

        } catch (error: any) {
            console.error('❌ Erreur envoi email:', {
                to,
                subject,
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }
}
