import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types de notifications
export enum NotificationType {
  // Documents
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VALIDATED = 'document_validated',
  DOCUMENT_REJECTED = 'document_rejected',
  DOCUMENT_EXPIRING = 'document_expiring',
  DOCUMENT_EXPIRED = 'document_expired',
  
  // Workflow
  WORKFLOW_STEP_COMPLETED = 'workflow_step_completed',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_STUCK = 'workflow_stuck',
  
  // Sécurité
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_LOGIN_ATTEMPTS = 'multiple_login_attempts',
  
  // Rappels
  MISSING_DOCUMENT = 'missing_document',
  VALIDATION_REMINDER = 'validation_reminder',
  DEADLINE_REMINDER = 'deadline_reminder',
  
  // Business
  NEW_CLIENT = 'new_client',
  EXPERT_ASSIGNMENT = 'expert_assignment',
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_GENERATED = 'invoice_generated',
  
  // Expert Management
  EXPERT_DEMO_REQUEST = 'expert_demo_request',
  EXPERT_APPROVED = 'expert_approved',
  EXPERT_REJECTED = 'expert_rejected',
  EXPERT_ACCOUNT_CREATED = 'expert_account_created',
  EXPERT_PROFILE_UPDATED = 'expert_profile_updated',
  EXPERT_STATUS_CHANGED = 'expert_status_changed'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms'
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  emailSubject?: string;
  emailBody?: string;
  pushTitle?: string;
  pushBody?: string;
  smsText?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  variables: string[]; // Variables à remplacer dans le template
}

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: 'client' | 'expert' | 'admin' | 'profitum';
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  sent_channels: NotificationChannel[];
  read: boolean;
  read_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start?: string; // Format HH:MM
  quiet_hours_end?: string; // Format HH:MM
  timezone: string;
  language: string;
  priority_filter: NotificationPriority[];
  type_filter: NotificationType[];
}

export class NotificationService {
  private emailTransporter!: nodemailer.Transporter;
  private templates!: Map<NotificationType, NotificationTemplate>;

  constructor() {
    this.initializeEmailTransporter();
    this.initializeTemplates();
  }

  /**
   * Initialiser le transporteur email
   */
  private initializeEmailTransporter(): void {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Initialiser les templates de notifications
   */
  private initializeTemplates(): void {
    this.templates = new Map([
      [NotificationType.DOCUMENT_UPLOADED, {
        id: 'document_uploaded',
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'Nouveau document uploadé',
        message: 'Un nouveau document "{document_name}" a été uploadé par {uploader_name}',
        emailSubject: 'Nouveau document - {document_name}',
        emailBody: `
          <h2>Nouveau document uploadé</h2>
          <p>Bonjour {recipient_name},</p>
          <p>Un nouveau document a été uploadé :</p>
          <ul>
            <li><strong>Document :</strong> {document_name}</li>
            <li><strong>Uploadé par :</strong> {uploader_name}</li>
            <li><strong>Date :</strong> {upload_date}</li>
            <li><strong>Type :</strong> {document_type}</li>
          </ul>
          <p><a href="{document_url}">Voir le document</a></p>
        `,
        pushTitle: 'Nouveau document',
        pushBody: '{document_name} uploadé par {uploader_name}',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['document_name', 'uploader_name', 'upload_date', 'document_type', 'document_url', 'recipient_name']
      }],
      
      [NotificationType.DOCUMENT_VALIDATED, {
        id: 'document_validated',
        type: NotificationType.DOCUMENT_VALIDATED,
        title: 'Document validé',
        message: 'Le document "{document_name}" a été validé par {validator_name}',
        emailSubject: 'Document validé - {document_name}',
        emailBody: `
          <h2>Document validé</h2>
          <p>Bonjour {recipient_name},</p>
          <p>Le document suivant a été validé :</p>
          <ul>
            <li><strong>Document :</strong> {document_name}</li>
            <li><strong>Validé par :</strong> {validator_name}</li>
            <li><strong>Date :</strong> {validation_date}</li>
            <li><strong>Commentaires :</strong> {comments}</li>
          </ul>
        `,
        pushTitle: 'Document validé',
        pushBody: '{document_name} validé par {validator_name}',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['document_name', 'validator_name', 'validation_date', 'comments', 'recipient_name']
      }],
      
      [NotificationType.UNAUTHORIZED_ACCESS, {
        id: 'unauthorized_access',
        type: NotificationType.UNAUTHORIZED_ACCESS,
        title: '⚠️ Accès non autorisé détecté',
        message: 'Tentative d\'accès non autorisé au document "{document_name}" depuis {ip_address}',
        emailSubject: '⚠️ ALERTE SÉCURITÉ - Accès non autorisé',
        emailBody: `
          <h2 style="color: red;">ALERTE SÉCURITÉ</h2>
          <p>Bonjour {recipient_name},</p>
          <p>Une tentative d'accès non autorisé a été détectée :</p>
          <ul>
            <li><strong>Document :</strong> {document_name}</li>
            <li><strong>Adresse IP :</strong> {ip_address}</li>
            <li><strong>Date :</strong> {access_date}</li>
            <li><strong>User Agent :</strong> {user_agent}</li>
          </ul>
          <p>Si vous n'êtes pas à l'origine de cette tentative, veuillez contacter immédiatement le support.</p>
        `,
        pushTitle: '⚠️ Accès non autorisé',
        pushBody: 'Tentative d\'accès détectée sur {document_name}',
        priority: NotificationPriority.URGENT,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
        variables: ['document_name', 'ip_address', 'access_date', 'user_agent', 'recipient_name']
      }],
      
      [NotificationType.MISSING_DOCUMENT, {
        id: 'missing_document',
        type: NotificationType.MISSING_DOCUMENT,
        title: 'Document manquant',
        message: 'Le document "{document_name}" est requis et manquant',
        emailSubject: 'Document manquant - {document_name}',
        emailBody: `
          <h2>Document manquant</h2>
          <p>Bonjour {recipient_name},</p>
          <p>Le document suivant est requis et manquant :</p>
          <ul>
            <li><strong>Document :</strong> {document_name}</li>
            <li><strong>Type :</strong> {document_type}</li>
            <li><strong>Échéance :</strong> {deadline}</li>
            <li><strong>Description :</strong> {description}</li>
          </ul>
          <p>Veuillez uploader ce document dès que possible.</p>
        `,
        pushTitle: 'Document manquant',
        pushBody: '{document_name} requis - échéance {deadline}',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['document_name', 'document_type', 'deadline', 'description', 'recipient_name']
      }],
      
      [NotificationType.DEADLINE_REMINDER, {
        id: 'deadline_reminder',
        type: NotificationType.DEADLINE_REMINDER,
        title: '⚠️ Échéance approche',
        message: 'L\'échéance pour "{document_name}" approche ({days_left} jours restants)',
        emailSubject: '⚠️ Échéance approche - {document_name}',
        emailBody: `
          <h2>Échéance approche</h2>
          <p>Bonjour {recipient_name},</p>
          <p>L'échéance pour le document suivant approche :</p>
          <ul>
            <li><strong>Document :</strong> {document_name}</li>
            <li><strong>Échéance :</strong> {deadline}</li>
            <li><strong>Jours restants :</strong> {days_left}</li>
            <li><strong>Type :</strong> {document_type}</li>
          </ul>
          <p>Veuillez traiter ce document avant l'échéance.</p>
        `,
        pushTitle: '⚠️ Échéance approche',
        pushBody: '{document_name} - {days_left} jours restants',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['document_name', 'deadline', 'days_left', 'document_type', 'recipient_name']
      }],
      
      // ===== TEMPLATES POUR LES EXPERTS =====
      
      [NotificationType.EXPERT_DEMO_REQUEST, {
        id: 'expert_demo_request',
        type: NotificationType.EXPERT_DEMO_REQUEST,
        title: '🎉 Nouvelle demande de démo expert',
        message: 'Un nouvel expert "{expert_name}" souhaite rejoindre la plateforme',
        emailSubject: '🎉 Nouvelle demande de démo expert - {expert_name}',
        emailBody: `
          <h2>🎉 Nouvelle demande de démo expert</h2>
          <p>Bonjour {recipient_name},</p>
          <p>Un nouvel expert souhaite rejoindre la plateforme Profitum :</p>
          <ul>
            <li><strong>Nom :</strong> {expert_name}</li>
            <li><strong>Email :</strong> {expert_email}</li>
            <li><strong>Entreprise :</strong> {company_name}</li>
            <li><strong>SIREN :</strong> {siren}</li>
            <li><strong>Téléphone :</strong> {phone}</li>
            <li><strong>Localisation :</strong> {location}</li>
            <li><strong>Expérience :</strong> {experience}</li>
            <li><strong>Spécialisations :</strong> {specializations}</li>
            <li><strong>Langues :</strong> {languages}</li>
            {website ? '<li><strong>Site web :</strong> {website}</li>' : ''}
            {linkedin ? '<li><strong>LinkedIn :</strong> {linkedin}</li>' : ''}
            {compensation ? '<li><strong>Compensation souhaitée :</strong> {compensation}%</li>' : ''}
            {max_clients ? '<li><strong>Clients max :</strong> {max_clients}</li>' : ''}
          </ul>
          <h3>Description :</h3>
          <p>{description}</p>
          <p><strong>Action requise :</strong> Contacter l'expert pour organiser une présentation de la plateforme.</p>
          <p>Accédez au dashboard admin pour gérer cette demande : <a href="{admin_dashboard_url}">Dashboard Admin</a></p>
        `,
        pushTitle: '🎉 Nouvelle demande expert',
        pushBody: '{expert_name} souhaite rejoindre la plateforme',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        variables: ['expert_name', 'expert_email', 'company_name', 'siren', 'phone', 'location', 'experience', 'specializations', 'languages', 'website', 'linkedin', 'compensation', 'max_clients', 'description', 'admin_dashboard_url', 'recipient_name']
      }],
      
      [NotificationType.EXPERT_APPROVED, {
        id: 'expert_approved',
        type: NotificationType.EXPERT_APPROVED,
        title: '✅ Votre compte expert a été approuvé !',
        message: 'Félicitations ! Votre compte expert a été approuvé par l\'équipe Profitum',
        emailSubject: '✅ Votre compte expert a été approuvé - Profitum',
        emailBody: `
          <h2>✅ Félicitations ! Votre compte expert a été approuvé</h2>
          <p>Bonjour {expert_name},</p>
          <p>Nous avons le plaisir de vous informer que votre demande d'inscription en tant qu'expert sur la plateforme Profitum a été <strong>approuvée</strong> !</p>
          
          <h3>Prochaines étapes :</h3>
          <ol>
            <li><strong>Accédez à votre espace expert :</strong> <a href="{expert_dashboard_url}">Dashboard Expert</a></li>
            <li><strong>Complétez votre profil :</strong> Ajoutez vos certifications, expériences et disponibilités</li>
            <li><strong>Configurez vos préférences :</strong> Définissez vos taux horaires et conditions</li>
            <li><strong>Commencez à recevoir des missions :</strong> Les clients pourront bientôt vous contacter</li>
          </ol>
          
          <h3>Informations importantes :</h3>
          <ul>
            <li><strong>Votre compensation :</strong> {compensation}%</li>
            <li><strong>Limite de clients :</strong> {max_clients} clients maximum</li>
            <li><strong>Abonnement :</strong> {abonnement}</li>
          </ul>
          
          <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe support : <a href="mailto:support@profitum.fr">support@profitum.fr</a></p>
          
          <p>Bienvenue dans l'équipe Profitum ! 🎉</p>
        `,
        pushTitle: '✅ Compte expert approuvé',
        pushBody: 'Votre compte expert a été approuvé - Accédez à votre dashboard',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['expert_name', 'expert_email', 'compensation', 'max_clients', 'abonnement', 'expert_dashboard_url', 'recipient_name']
      }],
      
      [NotificationType.EXPERT_REJECTED, {
        id: 'expert_rejected',
        type: NotificationType.EXPERT_REJECTED,
        title: '❌ Votre demande expert n\'a pas été retenue',
        message: 'Votre demande d\'inscription en tant qu\'expert n\'a pas été approuvée',
        emailSubject: '❌ Réponse à votre demande expert - Profitum',
        emailBody: `
          <h2>❌ Réponse à votre demande d'inscription expert</h2>
          <p>Bonjour {expert_name},</p>
          <p>Nous vous remercions pour votre intérêt pour la plateforme Profitum et pour le temps que vous avez consacré à votre candidature.</p>
          
          <p>Après avoir examiné attentivement votre profil et votre demande, nous regrettons de vous informer que votre candidature n'a pas été retenue pour le moment.</p>
          
          <h3>Raison(s) :</h3>
          <p>{rejection_reason}</p>
          
          <h3>Que faire maintenant ?</h3>
          <ul>
            <li>Vous pouvez améliorer votre profil et postuler à nouveau dans 3 mois</li>
            <li>Nous vous encourageons à développer vos compétences dans les domaines demandés</li>
            <li>Vous pouvez nous contacter pour plus de détails : <a href="mailto:experts@profitum.fr">experts@profitum.fr</a></li>
          </ul>
          
          <p>Nous vous souhaitons le meilleur pour vos projets futurs.</p>
          <p>Cordialement,<br>L'équipe Profitum</p>
        `,
        pushTitle: '❌ Demande expert non retenue',
        pushBody: 'Votre demande d\'inscription expert n\'a pas été approuvée',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        variables: ['expert_name', 'expert_email', 'rejection_reason', 'recipient_name']
      }],
      
      [NotificationType.EXPERT_ACCOUNT_CREATED, {
        id: 'expert_account_created',
        type: NotificationType.EXPERT_ACCOUNT_CREATED,
        title: '🔐 Votre compte expert a été créé',
        message: 'Votre compte expert a été créé avec succès. Mot de passe temporaire : {temp_password}',
        emailSubject: '🔐 Votre compte expert a été créé - Profitum',
        emailBody: `
          <h2>🔐 Votre compte expert a été créé</h2>
          <p>Bonjour {expert_name},</p>
          <p>Votre compte expert sur la plateforme Profitum a été créé avec succès !</p>
          
          <h3>Informations de connexion :</h3>
          <ul>
            <li><strong>Email :</strong> {expert_email}</li>
            <li><strong>Mot de passe temporaire :</strong> <code>{temp_password}</code></li>
          </ul>
          
          <p><strong>⚠️ IMPORTANT :</strong> Veuillez changer votre mot de passe dès votre première connexion.</p>
          
          <h3>Accès à votre espace :</h3>
          <p><a href="{login_url}">Se connecter à mon espace expert</a></p>
          
          <h3>Prochaines étapes :</h3>
          <ol>
            <li>Connectez-vous avec vos identifiants</li>
            <li>Changez votre mot de passe</li>
            <li>Complétez votre profil</li>
            <li>Configurez vos préférences</li>
          </ol>
          
          <p>Si vous avez des questions, contactez-nous : <a href="mailto:support@profitum.fr">support@profitum.fr</a></p>
        `,
        pushTitle: '🔐 Compte expert créé',
        pushBody: 'Votre compte expert a été créé - Mot de passe temporaire fourni',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        variables: ['expert_name', 'expert_email', 'temp_password', 'login_url', 'recipient_name']
      }],
      
      [NotificationType.EXPERT_PROFILE_UPDATED, {
        id: 'expert_profile_updated',
        type: NotificationType.EXPERT_PROFILE_UPDATED,
        title: '📝 Votre profil expert a été mis à jour',
        message: 'Votre profil expert a été mis à jour par l\'administrateur',
        emailSubject: '📝 Mise à jour de votre profil expert - Profitum',
        emailBody: `
          <h2>📝 Mise à jour de votre profil expert</h2>
          <p>Bonjour {expert_name},</p>
          <p>Votre profil expert sur la plateforme Profitum a été mis à jour par l'équipe administrative.</p>
          
          <h3>Modifications apportées :</h3>
          <ul>
            {updated_fields}
          </ul>
          
          <p>Vous pouvez consulter votre profil mis à jour : <a href="{expert_profile_url}">Voir mon profil</a></p>
          
          <p>Si vous avez des questions concernant ces modifications, n'hésitez pas à nous contacter : <a href="mailto:support@profitum.fr">support@profitum.fr</a></p>
        `,
        pushTitle: '📝 Profil expert mis à jour',
        pushBody: 'Votre profil expert a été mis à jour par l\'administrateur',
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        variables: ['expert_name', 'expert_email', 'updated_fields', 'expert_profile_url', 'recipient_name']
      }],
      
      [NotificationType.EXPERT_STATUS_CHANGED, {
        id: 'expert_status_changed',
        type: NotificationType.EXPERT_STATUS_CHANGED,
        title: '🔄 Statut de votre compte expert modifié',
        message: 'Le statut de votre compte expert a été modifié : {old_status} → {new_status}',
        emailSubject: '🔄 Modification du statut de votre compte expert - Profitum',
        emailBody: `
          <h2>🔄 Modification du statut de votre compte expert</h2>
          <p>Bonjour {expert_name},</p>
          <p>Le statut de votre compte expert sur la plateforme Profitum a été modifié.</p>
          
          <h3>Modification :</h3>
          <ul>
            <li><strong>Ancien statut :</strong> {old_status}</li>
            <li><strong>Nouveau statut :</strong> {new_status}</li>
            <li><strong>Date de modification :</strong> {change_date}</li>
            <li><strong>Raison :</strong> {change_reason}</li>
          </ul>
          
          <h3>Impact :</h3>
          <p>{status_impact}</p>
          
          <p>Si vous avez des questions concernant cette modification, contactez-nous : <a href="mailto:support@profitum.fr">support@profitum.fr</a></p>
        `,
        pushTitle: '🔄 Statut expert modifié',
        pushBody: 'Statut de votre compte expert modifié : {old_status} → {new_status}',
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        variables: ['expert_name', 'expert_email', 'old_status', 'new_status', 'change_date', 'change_reason', 'status_impact', 'recipient_name']
      }]
    ]);
  }

  /**
   * Envoyer une notification
   */
  async sendNotification(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    try {
      // Obtenir le template
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template non trouvé pour le type: ${type}`);
      }

      // Obtenir les préférences utilisateur
      const preferences = await this.getUserPreferences(recipientId);
      
      // Remplacer les variables dans le template
      const title = this.replaceVariables(template.title, data);
      const message = this.replaceVariables(template.message, data);

      // Créer la notification en base
      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          recipient_id: recipientId,
          recipient_type: recipientType,
          type,
          title,
          message,
          data,
          priority: priority || template.priority,
          channels: template.channels,
          sent_channels: [],
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer via les canaux autorisés
      const sentChannels: NotificationChannel[] = [];
      
      for (const channel of template.channels) {
        if (this.isChannelEnabled(channel, preferences)) {
          const sent = await this.sendViaChannel(channel, notification, data, template);
          if (sent) {
            sentChannels.push(channel);
          }
        }
      }

      // Mettre à jour les canaux envoyés
      if (sentChannels.length > 0) {
        await supabase
          .from('notification')
          .update({
            sent_channels: sentChannels,
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      }

      return notification.id;

    } catch (error) {
      console.error('Erreur envoi notification:', error);
      throw error;
    }
  }

  /**
   * Envoyer via un canal spécifique
   */
  private async sendViaChannel(
    channel: NotificationChannel,
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmail(notification, data, template);
        case NotificationChannel.PUSH:
          return await this.sendPushNotification(notification, data, template);
        case NotificationChannel.SMS:
          return await this.sendSMS(notification, data, template);
        case NotificationChannel.IN_APP:
          return true; // Déjà créé en base
        default:
          return false;
      }
    } catch (error) {
      console.error(`Erreur envoi via ${channel}:`, error);
      return false;
    }
  }

  /**
   * Envoyer un email
   */
  private async sendEmail(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      const subject = this.replaceVariables(template.emailSubject || template.title, data);
      const body = this.replaceVariables(template.emailBody || template.message, data);

      // Obtenir l'email du destinataire
      const email = await this.getUserEmail(notification.recipient_id);
      if (!email) return false;

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        html: body
      });

      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Envoyer une notification push
   */
  private async sendPushNotification(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      // Obtenir le token push de l'utilisateur
      const pushToken = await this.getUserPushToken(notification.recipient_id);
      if (!pushToken) return false;

      const title = this.replaceVariables(template.pushTitle || template.title, data);
      const body = this.replaceVariables(template.pushBody || template.message, data);

      // Envoyer via service push (Firebase, OneSignal, etc.)
      // À implémenter selon le service choisi
      
      return true;
    } catch (error) {
      console.error('Erreur envoi push:', error);
      return false;
    }
  }

  /**
   * Envoyer un SMS
   */
  private async sendSMS(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      // Obtenir le numéro de téléphone de l'utilisateur
      const phoneNumber = await this.getUserPhoneNumber(notification.recipient_id);
      if (!phoneNumber) return false;

      const text = this.replaceVariables(template.smsText || template.message, data);

      // Envoyer via service SMS (Twilio, etc.)
      // À implémenter selon le service choisi
      
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  /**
   * Remplacer les variables dans un template
   */
  private replaceVariables(template: string, data: any): string {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Obtenir les préférences utilisateur
   */
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    const { data, error } = await supabase
      .from('UserNotificationPreferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erreur récupération préférences:', error);
      return null;
    }

    return data;
  }

  /**
   * Vérifier si un canal est activé
   */
  private isChannelEnabled(
    channel: NotificationChannel,
    preferences: UserNotificationPreferences | null
  ): boolean {
    if (!preferences) return true; // Par défaut activé

    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.email_enabled;
      case NotificationChannel.PUSH:
        return preferences.push_enabled;
      case NotificationChannel.SMS:
        return preferences.sms_enabled;
      case NotificationChannel.IN_APP:
        return preferences.in_app_enabled;
      default:
        return true;
    }
  }

  /**
   * Obtenir l'email de l'utilisateur
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('Client')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Essayer la table Expert
      const { data: expertData } = await supabase
        .from('Expert')
        .select('email')
        .eq('id', userId)
        .single();

      return expertData?.email || null;
    }

    return data.email;
  }

  /**
   * Obtenir le token push de l'utilisateur
   */
  private async getUserPushToken(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('UserDevices')
      .select('push_token')
      .eq('user_id', userId)
      .eq('active', true)
      .single();

    if (error) return null;
    return data?.push_token || null;
  }

  /**
   * Obtenir le numéro de téléphone de l'utilisateur
   */
  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('Client')
      .select('telephone')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Essayer la table Expert
      const { data: expertData } = await supabase
        .from('Expert')
        .select('telephone')
        .eq('id', userId)
        .single();

      return expertData?.telephone || null;
    }

    return data.telephone;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await supabase
      .from('notification')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId);
  }

  /**
   * Obtenir les notifications d'un utilisateur
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notification')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Erreur comptage notifications:', error);
      return 0;
    }

    return count || 0;
  }
}

export default NotificationService; 