import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

// ===== CONFIGURATION SENTRY =====
import { captureError, captureMessage, withSentry } from '../config/sentry';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration Redis pour le cache et les notifications en temps réel
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: () => null, // Ne pas réessayer si Redis n'est pas disponible
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true
});

// Gérer les erreurs Redis silencieusement (non bloquant)
redis.on('error', (err) => {
  // Ignorer les erreurs de connexion Redis (service optionnel)
  if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
    // Redis non disponible, continuer sans cache
    return;
  }
  console.error('❌ Erreur Redis (non bloquant):', err.message);
});

// Ne pas connecter automatiquement si Redis n'est pas disponible
redis.connect().catch(() => {
  // Redis non disponible, continuer sans cache
});

// Event emitter pour les notifications en temps réel
const notificationEmitter = new EventEmitter();

// ===== TYPES ET ENUMS =====

export enum NotificationType {
  // === CLIENTS ===
  CLIENT_DOCUMENT_UPLOADED = 'client_document_uploaded',
  CLIENT_DOCUMENT_VALIDATED = 'client_document_validated',
  CLIENT_DOCUMENT_REJECTED = 'client_document_rejected',
  CLIENT_DOCUMENT_EXPIRING = 'client_document_expiring',
  CLIENT_DOCUMENT_EXPIRED = 'client_document_expired',
  CLIENT_EXPERT_ASSIGNED = 'client_expert_assigned',
  CLIENT_EXPERT_UNASSIGNED = 'client_expert_unassigned',
  CLIENT_MESSAGE_RECEIVED = 'client_message_received',
  CLIENT_DEADLINE_REMINDER = 'client_deadline_reminder',
  CLIENT_DEADLINE_OVERDUE = 'client_deadline_overdue',
  CLIENT_WORKFLOW_COMPLETED = 'client_workflow_completed',
  CLIENT_WORKFLOW_STUCK = 'client_workflow_stuck',
  CLIENT_PAYMENT_RECEIVED = 'client_payment_received',
  CLIENT_INVOICE_GENERATED = 'client_invoice_generated',
  CLIENT_INVOICE_OVERDUE = 'client_invoice_overdue',
  CLIENT_CALENDAR_EVENT_REMINDER = 'client_calendar_event_reminder',
  CLIENT_ACCOUNT_UPGRADED = 'client_account_upgraded',
  CLIENT_ACCOUNT_DOWNGRADED = 'client_account_downgraded',
  
  // === EXPERTS ===
  EXPERT_NEW_ASSIGNMENT = 'expert_new_assignment',
  EXPERT_ASSIGNMENT_CANCELLED = 'expert_assignment_cancelled',
  EXPERT_CLIENT_MESSAGE = 'expert_client_message',
  EXPERT_DEADLINE_APPROACHING = 'expert_deadline_approaching',
  EXPERT_DEADLINE_OVERDUE = 'expert_deadline_overdue',
  EXPERT_DOCUMENT_REQUIRED = 'expert_document_required',
  EXPERT_WORKFLOW_STEP_COMPLETED = 'expert_workflow_step_completed',
  EXPERT_WORKFLOW_ESCALATED = 'expert_workflow_escalated',
  EXPERT_PAYMENT_PROCESSED = 'expert_payment_processed',
  EXPERT_CERTIFICATION_EXPIRING = 'expert_certification_expiring',
  EXPERT_CERTIFICATION_EXPIRED = 'expert_certification_expired',
  EXPERT_PERFORMANCE_REVIEW = 'expert_performance_review',
  EXPERT_CALENDAR_EVENT_REMINDER = 'expert_calendar_event_reminder',
  EXPERT_ACCOUNT_APPROVED = 'expert_account_approved',
  EXPERT_ACCOUNT_REJECTED = 'expert_account_rejected',
  EXPERT_ACCOUNT_SUSPENDED = 'expert_account_suspended',
  EXPERT_ACCOUNT_REACTIVATED = 'expert_account_reactivated',
  
  // === ADMINS ===
  ADMIN_NEW_CLIENT_REGISTRATION = 'admin_new_client_registration',
  ADMIN_NEW_EXPERT_APPLICATION = 'admin_new_expert_application',
  ADMIN_EXPERT_APPROVAL_REQUIRED = 'admin_expert_approval_required',
  ADMIN_WORKFLOW_ESCALATION = 'admin_workflow_escalation',
  ADMIN_PAYMENT_ISSUE = 'admin_payment_issue',
  ADMIN_SYSTEM_ALERT = 'admin_system_alert',
  ADMIN_PERFORMANCE_METRICS = 'admin_performance_metrics',
  ADMIN_SECURITY_ALERT = 'admin_security_alert',
  ADMIN_DOCUMENT_VALIDATION_REQUIRED = 'admin_document_validation_required',
  ADMIN_CLIENT_COMPLAINT = 'admin_client_complaint',
  ADMIN_EXPERT_COMPLAINT = 'admin_expert_complaint',
  ADMIN_SYSTEM_MAINTENANCE = 'admin_system_maintenance',
  ADMIN_BACKUP_COMPLETED = 'admin_backup_completed',
  ADMIN_BACKUP_FAILED = 'admin_backup_failed',
  
  // === SYSTÈME ===
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_BREACH = 'security_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MULTIPLE_LOGIN_ATTEMPTS = 'multiple_login_attempts',
  ACCOUNT_LOCKED = 'account_locked',
  PASSWORD_CHANGED = 'password_changed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  LOGIN_FROM_NEW_DEVICE = 'login_from_new_device'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
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
  variables: string[];
  category: string;
  tags: string[];
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  user_id: string;                                      // ✅ Corrigé (était recipient_id)
  user_type: 'client' | 'expert' | 'admin' | 'apporteur'; // ✅ Corrigé (était recipient_type)
  notification_type: string;                            // ✅ Corrigé (était type)
  title: string;
  message: string;
  action_data?: any;                                    // ✅ Corrigé (était data)
  action_url?: string;                                  // ✅ Ajouté (existe en BDD)
  priority: string;                                     // ✅ Simplifié (varchar en BDD)
  is_read: boolean;                                     // ✅ Corrigé (était read)
  read_at?: string;
  is_dismissed: boolean;                                // ✅ Ajouté (existe en BDD)
  dismissed_at?: string;                                // ✅ Ajouté (existe en BDD)
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTypePreference {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
  };
  slaChannels: {
    target: { push: boolean; email: boolean };
    acceptable: { push: boolean; email: boolean };
    critical: { push: boolean; email: boolean };
  };
}

export interface SLAPreference {
  targetHours: number;
  acceptableHours: number;
  criticalHours: number;
}

export interface UserNotificationPreferences {
  user_id: string;
  user_type?: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  slack_enabled: boolean;
  teams_enabled: boolean;
  webhook_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  language: string;
  priority_filter: NotificationPriority[];
  type_filter: NotificationType[];
  category_filter: string[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly';
  digest_time?: string;
  // Nouvelles préférences granulaires
  notification_types?: Record<string, NotificationTypePreference>;
  sla_config?: Record<string, SLAPreference>;
  created_at: string;
  updated_at: string;
}

export interface NotificationMetrics {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  delivery_rate: number;
  read_rate: number;
  average_delivery_time: number;
  channel_performance: {
    [channel in NotificationChannel]: {
      sent: number;
      delivered: number;
      failed: number;
      delivery_rate: number;
    };
  };
}

export interface NotificationBatch {
  id: string;
  notifications: Notification[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  total_count: number;
  success_count: number;
  failure_count: number;
}

export class NotificationService {
  private emailTransporter!: nodemailer.Transporter;
  private templates!: Map<NotificationType, NotificationTemplate>;

  constructor() {
    this.initializeEmailTransporter();
    this.initializeTemplates();
  }

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

  private initializeTemplates(): void {
    this.templates = new Map();

    // ===== TEMPLATES CLIENTS =====
    
    // Document uploadé
    this.templates.set(NotificationType.CLIENT_DOCUMENT_UPLOADED, {
      id: 'client_document_uploaded',
      type: NotificationType.CLIENT_DOCUMENT_UPLOADED,
      title: 'Document uploadé avec succès',
      message: 'Votre document "{document_name}" a été uploadé et est en cours de validation.',
      emailSubject: 'Document uploadé - {document_name}',
      emailBody: `
        <h2>Document uploadé avec succès</h2>
        <p>Bonjour {client_name},</p>
        <p>Votre document <strong>{document_name}</strong> a été uploadé avec succès dans votre espace client.</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Document : {document_name}</li>
          <li>Type : {document_type}</li>
          <li>Date d'upload : {upload_date}</li>
          <li>Statut : En cours de validation</li>
        </ul>
        <p>Notre équipe va examiner votre document et vous informera du résultat sous 24-48h.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: 'Document uploadé',
      pushBody: 'Votre document {document_name} a été uploadé avec succès',
      smsText: 'Document {document_name} uploadé avec succès. Validation en cours.',
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
      variables: ['document_name', 'document_type', 'upload_date', 'client_name'],
      category: 'documents',
      tags: ['upload', 'success', 'client'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Document validé
    this.templates.set(NotificationType.CLIENT_DOCUMENT_VALIDATED, {
      id: 'client_document_validated',
      type: NotificationType.CLIENT_DOCUMENT_VALIDATED,
      title: 'Document validé',
      message: 'Votre document "{document_name}" a été validé par notre équipe.',
      emailSubject: 'Document validé - {document_name}',
      emailBody: `
        <h2>✅ Document validé</h2>
        <p>Bonjour {client_name},</p>
        <p>Excellente nouvelle ! Votre document <strong>{document_name}</strong> a été validé par notre équipe.</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Document : {document_name}</li>
          <li>Validé le : {validation_date}</li>
          <li>Validé par : {validator_name}</li>
          <li>Commentaires : {comments}</li>
        </ul>
        <p>Votre dossier progresse bien. Nous vous tiendrons informé des prochaines étapes.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: '✅ Document validé',
      pushBody: 'Votre document {document_name} a été validé',
      smsText: 'Document {document_name} validé avec succès.',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
      variables: ['document_name', 'validation_date', 'validator_name', 'comments', 'client_name'],
      category: 'documents',
      tags: ['validation', 'success', 'client'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Document rejeté
    this.templates.set(NotificationType.CLIENT_DOCUMENT_REJECTED, {
      id: 'client_document_rejected',
      type: NotificationType.CLIENT_DOCUMENT_REJECTED,
      title: 'Document rejeté - Action requise',
      message: 'Votre document "{document_name}" a été rejeté. Raison : {rejection_reason}',
      emailSubject: '⚠️ Document rejeté - Action requise',
      emailBody: `
        <h2>⚠️ Document rejeté</h2>
        <p>Bonjour {client_name},</p>
        <p>Votre document <strong>{document_name}</strong> a été rejeté lors de la validation.</p>
        <p><strong>Raison du rejet :</strong></p>
        <p>{rejection_reason}</p>
        <p><strong>Actions à effectuer :</strong></p>
        <ul>
          <li>Corriger le document selon les commentaires</li>
          <li>Réuploader le document corrigé</li>
          <li>Vérifier que le document est lisible et complet</li>
        </ul>
        <p>Une fois corrigé, le document sera revalidé sous 24h.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: '⚠️ Document rejeté',
      pushBody: 'Document {document_name} rejeté. Raison : {rejection_reason}',
      smsText: 'Document {document_name} rejeté. Veuillez corriger et réuploader.',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
      variables: ['document_name', 'rejection_reason', 'client_name'],
      category: 'documents',
      tags: ['rejection', 'action-required', 'client'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Expert assigné
    this.templates.set(NotificationType.CLIENT_EXPERT_ASSIGNED, {
      id: 'client_expert_assigned',
      type: NotificationType.CLIENT_EXPERT_ASSIGNED,
      title: 'Expert assigné à votre dossier',
      message: 'L\'expert {expert_name} a été assigné à votre dossier et vous contactera prochainement.',
      emailSubject: 'Expert assigné - {expert_name}',
      emailBody: `
        <h2>👨‍💼 Expert assigné</h2>
        <p>Bonjour {client_name},</p>
        <p>Un expert a été assigné à votre dossier pour vous accompagner dans votre projet.</p>
        <p><strong>Informations expert :</strong></p>
        <ul>
          <li>Nom : {expert_name}</li>
          <li>Spécialité : {expert_specialty}</li>
          <li>Expérience : {expert_experience}</li>
          <li>Contact : {expert_email}</li>
        </ul>
        <p>L'expert vous contactera dans les 24h pour planifier un premier rendez-vous.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: '👨‍💼 Expert assigné',
      pushBody: 'L\'expert {expert_name} a été assigné à votre dossier',
      smsText: 'Expert {expert_name} assigné à votre dossier. Contact dans les 24h.',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
      variables: ['expert_name', 'expert_specialty', 'expert_experience', 'expert_email', 'client_name'],
      category: 'experts',
      tags: ['assignment', 'expert', 'client'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // ===== TEMPLATES EXPERTS =====

    // Nouvelle assignation
    this.templates.set(NotificationType.EXPERT_NEW_ASSIGNMENT, {
      id: 'expert_new_assignment',
      type: NotificationType.EXPERT_NEW_ASSIGNMENT,
      title: 'Nouvelle assignation client',
      message: 'Vous avez été assigné au client {client_name} pour le projet {project_name}.',
      emailSubject: 'Nouvelle assignation - {client_name}',
      emailBody: `
        <h2>🎯 Nouvelle assignation</h2>
        <p>Bonjour {expert_name},</p>
        <p>Vous avez été assigné à un nouveau client.</p>
        <p><strong>Informations client :</strong></p>
        <ul>
          <li>Client : {client_name}</li>
          <li>Projet : {project_name}</li>
          <li>Type de projet : {project_type}</li>
          <li>Budget estimé : {estimated_budget}</li>
          <li>Deadline : {deadline}</li>
        </ul>
        <p><strong>Actions requises :</strong></p>
        <ul>
          <li>Contacter le client dans les 24h</li>
          <li>Planifier un premier rendez-vous</li>
          <li>Analyser les documents fournis</li>
        </ul>
        <p>Accédez à votre dashboard pour plus de détails.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: '🎯 Nouvelle assignation',
      pushBody: 'Nouveau client {client_name} assigné - Projet {project_name}',
      smsText: 'Nouvelle assignation : {client_name} - {project_name}. Contact dans 24h.',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
      variables: ['client_name', 'project_name', 'project_type', 'estimated_budget', 'deadline', 'expert_name'],
      category: 'assignments',
      tags: ['new-assignment', 'client', 'expert'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Message client
    this.templates.set(NotificationType.EXPERT_CLIENT_MESSAGE, {
      id: 'expert_client_message',
      type: NotificationType.EXPERT_CLIENT_MESSAGE,
      title: 'Nouveau message de {client_name}',
      message: 'Vous avez reçu un nouveau message de {client_name} : "{message_preview}"',
      emailSubject: 'Nouveau message - {client_name}',
      emailBody: `
        <h2>💬 Nouveau message client</h2>
        <p>Bonjour {expert_name},</p>
        <p>Vous avez reçu un nouveau message de <strong>{client_name}</strong>.</p>
        <p><strong>Message :</strong></p>
        <p>"{message_preview}"</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Client : {client_name}</li>
          <li>Projet : {project_name}</li>
          <li>Date : {message_date}</li>
          <li>Urgence : {urgency_level}</li>
        </ul>
        <p>Veuillez répondre dans les plus brefs délais.</p>
        <p>Cordialement,<br>L'équipe Profitum</p>
      `,
      pushTitle: '💬 Message de {client_name}',
      pushBody: 'Nouveau message : {message_preview}',
      smsText: 'Message de {client_name} : {message_preview}',
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
      variables: ['client_name', 'message_preview', 'project_name', 'message_date', 'urgency_level', 'expert_name'],
      category: 'communication',
      tags: ['message', 'client', 'expert'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // ===== TEMPLATES ADMINS =====

    // Nouvelle inscription client
    this.templates.set(NotificationType.ADMIN_NEW_CLIENT_REGISTRATION, {
      id: 'admin_new_client_registration',
      type: NotificationType.ADMIN_NEW_CLIENT_REGISTRATION,
      title: 'Nouvelle inscription client',
      message: 'Un nouveau client {client_name} s\'est inscrit sur la plateforme.',
      emailSubject: '🎉 Nouveau client - {client_name}',
      emailBody: `
        <h2>🎉 Nouvelle inscription client</h2>
        <p>Bonjour {admin_name},</p>
        <p>Un nouveau client s'est inscrit sur la plateforme Profitum.</p>
        <p><strong>Informations client :</strong></p>
        <ul>
          <li>Nom : {client_name}</li>
          <li>Email : {client_email}</li>
          <li>Téléphone : {client_phone}</li>
          <li>Entreprise : {company_name}</li>
          <li>SIREN : {siren}</li>
          <li>Type de projet : {project_type}</li>
          <li>Budget estimé : {estimated_budget}</li>
        </ul>
        <p><strong>Actions recommandées :</strong></p>
        <ul>
          <li>Vérifier les informations client</li>
          <li>Assigner un expert approprié</li>
          <li>Planifier un suivi</li>
        </ul>
        <p>Cordialement,<br>Système Profitum</p>
      `,
      pushTitle: '🎉 Nouveau client',
      pushBody: 'Nouvelle inscription : {client_name} - {project_type}',
      smsText: 'Nouveau client {client_name} inscrit. Projet : {project_type}',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SLACK],
      variables: ['client_name', 'client_email', 'client_phone', 'company_name', 'siren', 'project_type', 'estimated_budget', 'admin_name'],
      category: 'registrations',
      tags: ['new-client', 'registration', 'admin'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Nouvelle candidature expert
    this.templates.set(NotificationType.ADMIN_NEW_EXPERT_APPLICATION, {
      id: 'admin_new_expert_application',
      type: NotificationType.ADMIN_NEW_EXPERT_APPLICATION,
      title: 'Nouvelle candidature expert',
      message: 'Un nouvel expert {expert_name} a soumis sa candidature.',
      emailSubject: '👨‍💼 Nouvelle candidature expert - {expert_name}',
      emailBody: `
        <h2>👨‍💼 Nouvelle candidature expert</h2>
        <p>Bonjour {admin_name},</p>
        <p>Un nouvel expert a soumis sa candidature pour rejoindre la plateforme.</p>
        <p><strong>Informations expert :</strong></p>
        <ul>
          <li>Nom : {expert_name}</li>
          <li>Email : {expert_email}</li>
          <li>Téléphone : {expert_phone}</li>
          <li>Spécialités : {specialties}</li>
          <li>Expérience : {experience_years} ans</li>
          <li>Certifications : {certifications}</li>
          <li>Compensation souhaitée : {compensation}%</li>
        </ul>
        <p><strong>Actions requises :</strong></p>
        <ul>
          <li>Examiner la candidature</li>
          <li>Vérifier les références</li>
          <li>Planifier un entretien</li>
          <li>Prendre une décision d'approbation</li>
        </ul>
        <p>Cordialement,<br>Système Profitum</p>
      `,
      pushTitle: '👨‍💼 Nouvelle candidature',
      pushBody: 'Candidature expert : {expert_name} - {specialties}',
      smsText: 'Nouvelle candidature expert {expert_name}. Spécialités : {specialties}',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SLACK],
      variables: ['expert_name', 'expert_email', 'expert_phone', 'specialties', 'experience_years', 'certifications', 'compensation', 'admin_name'],
      category: 'applications',
      tags: ['new-expert', 'application', 'admin'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Escalade workflow
    this.templates.set(NotificationType.ADMIN_WORKFLOW_ESCALATION, {
      id: 'admin_workflow_escalation',
      type: NotificationType.ADMIN_WORKFLOW_ESCALATION,
      title: '⚠️ Escalade workflow requise',
      message: 'Le workflow du client {client_name} nécessite une intervention administrative.',
      emailSubject: '⚠️ ESCALADE - Workflow {client_name}',
      emailBody: `
        <h2>⚠️ Escalade workflow</h2>
        <p>Bonjour {admin_name},</p>
        <p>Une escalade workflow a été déclenchée et nécessite votre intervention.</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Client : {client_name}</li>
          <li>Expert : {expert_name}</li>
          <li>Projet : {project_name}</li>
          <li>Raison : {escalation_reason}</li>
          <li>Deadline : {deadline}</li>
          <li>Priorité : {priority_level}</li>
        </ul>
        <p><strong>Actions requises :</strong></p>
        <ul>
          <li>Analyser la situation</li>
          <li>Contacter l'expert et/ou le client</li>
          <li>Prendre les mesures correctives</li>
          <li>Mettre à jour le statut</li>
        </ul>
        <p>Cordialement,<br>Système Profitum</p>
      `,
      pushTitle: '⚠️ Escalade workflow',
      pushBody: 'Escalade : {client_name} - {escalation_reason}',
      smsText: 'ESCALADE workflow {client_name}. Raison : {escalation_reason}',
      priority: NotificationPriority.URGENT,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.SLACK],
      variables: ['client_name', 'expert_name', 'project_name', 'escalation_reason', 'deadline', 'priority_level', 'admin_name'],
      category: 'escalations',
      tags: ['escalation', 'workflow', 'admin', 'urgent'],
      isActive: true,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // ===== MÉTHODES PRINCIPALES =====

  async sendNotification(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    try {
      // Récupérer le template
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Template non trouvé pour le type: ${type}`);
      }

      // Récupérer les préférences utilisateur
      const preferences = await this.getUserPreferences(recipientId, recipientType);

      // Remplacer les variables dans le template
      const title = this.replaceVariables(template.title, data);
      const message = this.replaceVariables(template.message, data);

      // Créer la notification en base
      // ⚠️ CORRECTION : Utiliser user_id/user_type au lieu de recipient_id/recipient_type
      const { data: notification, error } = await supabase
        .from('notification')
        .insert({
          user_id: recipientId,                    // ✅ Corrigé
          user_type: recipientType,                // ✅ Corrigé
          notification_type: type,                 // ✅ Corrigé
          title: title,
          message: message,
          action_data: data,                       // ✅ Corrigé
          priority: priority || template.priority,
          is_read: false,                          // ✅ Corrigé
          is_dismissed: false,                     // ✅ Ajouté
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Vérifier si la notification doit être envoyée en fonction des préférences
      if (preferences && !await this.shouldSendNotification(notification, preferences)) {
        console.log(`Notification de type ${type} ignorée pour l'utilisateur ${recipientId} en raison des préférences.`);
        return notification.id;
      }

      // Envoyer via les canaux configurés
      const sentChannels: NotificationChannel[] = [];

      for (const channel of template.channels) {
        if (this.isChannelEnabled(channel, preferences)) {
          const success = await this.sendViaChannel(channel, notification, data, template);
          if (success) {
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
            status: NotificationStatus.SENT,
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
        case NotificationChannel.SLACK:
          return await this.sendSlackNotification(notification, data, template);
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

  private async sendEmail(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      const subject = this.replaceVariables(template.emailSubject || template.title, data);
      const body = this.replaceVariables(template.emailBody || template.message, data);

      // Récupérer l'email de l'utilisateur
      const email = await this.getUserEmail(notification.user_id);
      if (!email) return false;

      // ⛔ BLOQUER les emails temporaires pour éviter les bounces
      if (email.includes('@profitum.temp') || email.includes('temp_')) {
        console.log(`⛔ Email temporaire bloqué (bounce prevention): ${email}`);
        return true; // Retourner success pour ne pas bloquer le workflow
      }

      // Envoyer l'email
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: subject,
        html: body
      });

      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  private async sendPushNotification(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      const title = this.replaceVariables(template.pushTitle || template.title, data);
      const body = this.replaceVariables(template.pushBody || template.message, data);

      // Utiliser FCMPushService pour envoyer via Firebase Cloud Messaging
      const { FCMPushService } = await import('./fcm-push-service');
      
      const result = await FCMPushService.sendToUser(notification.user_id, {
        title,
        body,
        icon: '/Logo-Profitum.png',
        badge: '/favicon.ico',
        tag: notification.id,
        clickAction: notification.action_url || '/',
        requireInteraction: notification.priority === 'urgent' || notification.priority === 'critical',
        data: {
          notification_id: notification.id,
          notification_type: notification.notification_type,
          priority: notification.priority || 'medium',
          ...notification.action_data
        }
      });

      if (result.success && result.successCount > 0) {
        console.log(`✅ Push FCM envoyé à ${result.successCount} device(s)`);
        return true;
      } else {
        console.log(`⚠️ Push FCM échoué: ${result.failureCount} échec(s)`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur envoi push FCM:', error);
      return false;
    }
  }

  private async sendSMS(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      // Récupérer le numéro de téléphone
      const phoneNumber = await this.getUserPhoneNumber(notification.user_id);
      if (!phoneNumber) return false;

      const text = this.replaceVariables(template.smsText || template.message, data);

      // Ici, vous intégreriez votre service SMS
      // Par exemple, Twilio, Vonage, etc.
      console.log('SMS:', { phone: phoneNumber, text });

      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  private async sendSlackNotification(
    notification: Notification,
    data: any,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      // Ici, vous intégreriez l'API Slack
      // Envoi vers un canal Slack spécifique selon le type d'utilisateur
      console.log('Slack notification:', { notification, data, template });
      return true;
    } catch (error) {
      console.error('Erreur envoi Slack:', error);
      return false;
    }
  }

  private replaceVariables(template: string, data: any): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
  }

  private async getUserPreferences(
    userId: string,
    userType?: 'admin' | 'expert' | 'client' | 'apporteur' | 'profitum'
  ): Promise<UserNotificationPreferences | null> {
    let query = supabase
      .from('UserNotificationPreferences')
      .select('*')
      .eq('user_id', userId);
    
    if (userType) {
      query = query.eq('user_type', userType);
    }
    
    const { data, error } = await query.single();

    if (error) {
      console.error('Erreur récupération préférences:', error);
      return null;
    }

    return data;
  }

  private isChannelEnabled(
    channel: NotificationChannel,
    preferences: UserNotificationPreferences | null
  ): boolean {
    if (!preferences) return true; // Par défaut, tous les canaux sont activés

    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.email_enabled;
      case NotificationChannel.PUSH:
        return preferences.push_enabled;
      case NotificationChannel.SMS:
        return preferences.sms_enabled;
      case NotificationChannel.SLACK:
        return preferences.slack_enabled;
      case NotificationChannel.IN_APP:
        return preferences.in_app_enabled;
      default:
        return true;
    }
  }

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

  // ===== MÉTHODES PUBLIQUES =====

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await supabase
      .from('notification')
      .update({
        is_read: true,                          // ✅ Corrigé (était read)
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);                   // ✅ Corrigé (était recipient_id)
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', userId)                    // ✅ Corrigé (était recipient_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }

    return data || [];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)                    // ✅ Corrigé (était recipient_id)
      .eq('is_read', false);                    // ✅ Corrigé (était read)

    if (error) {
      console.error('Erreur comptage notifications:', error);
      return 0;
    }

    return count || 0;
  }

  private async shouldSendNotification(
    notification: Notification,
    preferences: UserNotificationPreferences | null
  ): Promise<boolean> {
    // Vérifier les heures calmes
    if (await this.isInQuietHours(preferences)) {
      return false;
    }

    // Vérifier les filtres de priorité
    if (preferences?.priority_filter && notification.priority &&
        !preferences.priority_filter.includes(notification.priority as any)) {
      return false;
    }

    // Vérifier les préférences granulaires par type
    if (preferences?.notification_types) {
      const typePref = preferences.notification_types[notification.notification_type];
      if (typePref && !typePref.enabled) {
        return false; // Type désactivé par l'utilisateur
      }
    } else {
      // Fallback sur l'ancien système de filtres
      if (preferences?.type_filter && 
          !preferences.type_filter.includes(notification.notification_type as any)) {
        return false;
      }
    }

    return true;
  }

  private async isInQuietHours(preferences: UserNotificationPreferences | null): Promise<boolean> {
    if (!preferences?.quiet_hours_start || !preferences?.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const userTimezone = preferences.timezone || 'Europe/Paris';
    
    // Convertir l'heure actuelle dans le fuseau horaire de l'utilisateur
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes();

    const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Gestion du cas où les heures calmes traversent minuit
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // ===== MÉTHODES SPÉCIFIQUES PAR TYPE D'UTILISATEUR =====

  // Méthodes pour les clients
  async sendClientNotification(
    clientId: string,
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    return this.sendNotification(clientId, 'client', type, data, priority);
  }

  // Méthodes pour les experts
  async sendExpertNotification(
    expertId: string,
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    return this.sendNotification(expertId, 'expert', type, data, priority);
  }

  // Méthodes pour les admins
  async sendAdminNotification(
    adminId: string,
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    return this.sendNotification(adminId, 'admin', type, data, priority);
  }

  // Méthode pour notifier tous les admins
  async notifyAllAdmins(
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string[]> {
    const { data: admins, error } = await supabase
      .from('Admin')
      .select('id');

    if (error || !admins) {
      console.error('Erreur récupération admins:', error);
      return [];
    }

    const notificationIds: string[] = [];
    for (const admin of admins) {
      try {
        const notificationId = await this.sendNotification(
          admin.id,
          'admin',
          type,
          data,
          priority
        );
        notificationIds.push(notificationId);
      } catch (error) {
        console.error(`Erreur notification admin ${admin.id}:`, error);
      }
    }

    return notificationIds;
  }

  // Méthode publique pour ajouter des templates personnalisés
  public addTemplate(template: Partial<NotificationTemplate> & { type: NotificationType }): void {
    const fullTemplate: NotificationTemplate = {
      id: template.id || template.type,
      type: template.type,
      title: template.title || '',
      message: template.message || '',
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
      smsText: template.smsText,
      priority: template.priority || NotificationPriority.MEDIUM,
      channels: template.channels || [NotificationChannel.IN_APP],
      variables: template.variables || [],
      category: template.category || 'general',
      tags: template.tags || [],
      isActive: template.isActive !== false,
      version: template.version || '1.0.0',
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: template.updatedAt || new Date().toISOString()
    };
    this.templates.set(template.type, fullTemplate);
  }
}

export default NotificationService;

// ===== UTILITAIRES ET HELPERS =====

/**
 * Gestionnaire d'erreurs centralisé pour les notifications
 */
class NotificationErrorHandler {
  static handle(error: any, context: string): void {
    // Log local
    console.error(`[Notification Error - ${context}]:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    });

    // Envoyer à Sentry
    captureError(error, {
      tags: {
        service: 'notification-service',
        context: context
      },
      extra: {
        timestamp: new Date().toISOString(),
        context: context
      }
    });
  }

  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Tentative ${attempt}/${maxRetries} échouée:`, (error as any).message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * Cache intelligent pour les templates et préférences
 */
class NotificationCache {
  private static instance: NotificationCache;
  private templateCache = new Map<string, NotificationTemplate>();
  private preferencesCache = new Map<string, UserNotificationPreferences>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): NotificationCache {
    if (!NotificationCache.instance) {
      NotificationCache.instance = new NotificationCache();
    }
    return NotificationCache.instance;
  }

  setTemplate(type: string, template: NotificationTemplate): void {
    this.templateCache.set(type, template);
  }

  getTemplate(type: string): NotificationTemplate | undefined {
    return this.templateCache.get(type);
  }

  setPreferences(userId: string, preferences: UserNotificationPreferences): void {
    this.preferencesCache.set(userId, preferences);
  }

  getPreferences(userId: string): UserNotificationPreferences | undefined {
    return this.preferencesCache.get(userId);
  }

  clearCache(): void {
    this.templateCache.clear();
    this.preferencesCache.clear();
  }
}

/**
 * Métriques de performance pour les notifications
 */
class NotificationMetricsManager {
  private static instance: NotificationMetricsManager;
  private metrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    deliveryTime: [] as number[],
    channelPerformance: {} as Record<string, { sent: number; failed: number }>
  };

  static getInstance(): NotificationMetricsManager {
    if (!NotificationMetricsManager.instance) {
      NotificationMetricsManager.instance = new NotificationMetricsManager();
    }
    return NotificationMetricsManager.instance;
  }

  recordSent(channel: string): void {
    this.metrics.sent++;
    if (!this.metrics.channelPerformance[channel]) {
      this.metrics.channelPerformance[channel] = { sent: 0, failed: 0 };
    }
    this.metrics.channelPerformance[channel].sent++;
  }

  recordDelivered(deliveryTime: number): void {
    this.metrics.delivered++;
    this.metrics.deliveryTime.push(deliveryTime);
  }

  recordFailed(channel: string): void {
    this.metrics.failed++;
    if (!this.metrics.channelPerformance[channel]) {
      this.metrics.channelPerformance[channel] = { sent: 0, failed: 0 };
    }
    this.metrics.channelPerformance[channel].failed++;
  }

  getMetrics() {
    const avgDeliveryTime = this.metrics.deliveryTime.length > 0
      ? this.metrics.deliveryTime.reduce((a, b) => a + b, 0) / this.metrics.deliveryTime.length
      : 0;

    return {
      ...this.metrics,
      deliveryRate: this.metrics.sent > 0 ? (this.metrics.delivered / this.metrics.sent) * 100 : 0,
      failureRate: this.metrics.sent > 0 ? (this.metrics.failed / this.metrics.sent) * 100 : 0,
      averageDeliveryTime: avgDeliveryTime
    };
  }

  reset(): void {
    this.metrics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryTime: [],
      channelPerformance: {}
    };
  }
}

/**
 * Gestionnaire de notifications en lot optimisé
 */
class BatchNotificationManager {
  private static instance: BatchNotificationManager;
  private batchQueue: Array<{
    recipientId: string;
    recipientType: 'client' | 'expert' | 'admin' | 'profitum';
    type: NotificationType;
    data: any;
    priority?: NotificationPriority;
  }> = [];
  private processing = false;
  private batchSize = 50;
  private batchDelay = 1000; // 1 seconde

  static getInstance(): BatchNotificationManager {
    if (!BatchNotificationManager.instance) {
      BatchNotificationManager.instance = new BatchNotificationManager();
    }
    return BatchNotificationManager.instance;
  }

  addToBatch(notification: {
    recipientId: string;
    recipientType: 'client' | 'expert' | 'admin' | 'profitum';
    type: NotificationType;
    data: any;
    priority?: NotificationPriority;
  }): void {
    this.batchQueue.push(notification);
    
    if (!this.processing) {
      this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.batchQueue.length === 0) return;

    this.processing = true;
    
    while (this.batchQueue.length > 0) {
      const batch = this.batchQueue.splice(0, this.batchSize);
      
      try {
                 await Promise.allSettled(
           batch.map(notification => 
             new NotificationService().sendNotification(
               notification.recipientId,
               notification.recipientType,
               notification.type,
               notification.data,
               notification.priority
             )
           )
         );
             } catch (error) {
         NotificationErrorHandler.handle(error as any, 'BatchProcessing');
       }

      // Attendre avant le prochain lot
      if (this.batchQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }
}

/**
 * Gestionnaire de notifications programmées
 */
class ScheduledNotificationManager {
  private static instance: ScheduledNotificationManager;
  private scheduledNotifications = new Map<string, NodeJS.Timeout>();

  static getInstance(): ScheduledNotificationManager {
    if (!ScheduledNotificationManager.instance) {
      ScheduledNotificationManager.instance = new ScheduledNotificationManager();
    }
    return ScheduledNotificationManager.instance;
  }

  scheduleNotification(
    notificationId: string,
    scheduledTime: Date,
    notification: {
      recipientId: string;
      recipientType: 'client' | 'expert' | 'admin' | 'profitum';
      type: NotificationType;
      data: any;
      priority?: NotificationPriority;
    }
  ): void {
    const delay = scheduledTime.getTime() - Date.now();
    
         if (delay <= 0) {
       // Notification en retard, envoyer immédiatement
       new NotificationService().sendNotification(
         notification.recipientId,
         notification.recipientType,
         notification.type,
         notification.data,
         notification.priority
       );
       return;
     }

     const timeout = setTimeout(async () => {
       try {
         await new NotificationService().sendNotification(
           notification.recipientId,
           notification.recipientType,
           notification.type,
           notification.data,
           notification.priority
         );
        this.scheduledNotifications.delete(notificationId);
               } catch (error: any) {
           NotificationErrorHandler.handle(error, 'ScheduledNotification');
         }
    }, delay);

    this.scheduledNotifications.set(notificationId, timeout);
  }

  cancelScheduledNotification(notificationId: string): boolean {
    const timeout = this.scheduledNotifications.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledNotifications.delete(notificationId);
      return true;
    }
    return false;
  }

  getScheduledCount(): number {
    return this.scheduledNotifications.size;
  }
}

// ===== EXTENSIONS DE LA CLASSE PRINCIPALE =====

// Étendre la classe NotificationService avec des méthodes utilitaires
export class NotificationServiceExtended extends NotificationService {
  private static instance: NotificationServiceExtended;

  static getInstance(): NotificationServiceExtended {
    if (!NotificationServiceExtended.instance) {
      NotificationServiceExtended.instance = new NotificationServiceExtended();
    }
    return NotificationServiceExtended.instance;
  }

  // Méthodes utilitaires avancées
  async sendBulkNotifications(
    notifications: Array<{
      recipientId: string;
      recipientType: 'client' | 'expert' | 'admin' | 'profitum';
      type: NotificationType;
      data: any;
      priority?: NotificationPriority;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      notifications.map(notification =>
        this.sendNotification(
          notification.recipientId,
          notification.recipientType,
          notification.type,
          notification.data,
          notification.priority
        )
      )
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    return { success, failed, errors };
  }

  async sendNotificationWithRetry(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    priority?: NotificationPriority,
    maxRetries: number = 3
  ): Promise<string> {
    return NotificationErrorHandler.retry(
      () => this.sendNotification(recipientId, recipientType, type, data, priority),
      maxRetries
    );
  }

  async scheduleNotification(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    scheduledTime: Date,
    priority?: NotificationPriority
  ): Promise<string> {
    const notificationId = uuidv4();
    
    ScheduledNotificationManager.getInstance().scheduleNotification(
      notificationId,
      scheduledTime,
      { recipientId, recipientType, type, data, priority }
    );

    return notificationId;
  }

  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    return ScheduledNotificationManager.getInstance().cancelScheduledNotification(notificationId);
  }

  async addToBatch(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<void> {
    BatchNotificationManager.getInstance().addToBatch({
      recipientId,
      recipientType,
      type,
      data,
      priority
    });
  }

  getMetrics() {
    return NotificationMetricsManager.getInstance().getMetrics();
  }

  resetMetrics() {
    NotificationMetricsManager.getInstance().reset();
  }

  clearCache() {
    NotificationCache.getInstance().clearCache();
  }

  getScheduledCount(): number {
    return ScheduledNotificationManager.getInstance().getScheduledCount();
  }

  // ===== MÉTHODES SENTRY AVANCÉES =====

  /**
   * Créer un breadcrumb pour tracer les actions utilisateur
   */
  addSentryBreadcrumb(message: string, category: string, data?: any): void {
    captureMessage(message, {
      tags: { category },
      extra: { data }
    });
  }

  /**
   * Définir le contexte utilisateur dans Sentry
   */
  setSentryUser(userId: string, userType: 'client' | 'expert' | 'admin'): void {
    captureMessage(`Utilisateur défini: ${userId} (${userType})`, {
      user: { id: userId, type: userType },
      level: 'info'
    });
  }

  /**
   * Envoyer une notification avec traçage Sentry
   */
  async sendNotificationWithTracing(
    recipientId: string,
    recipientType: 'client' | 'expert' | 'admin' | 'profitum',
    type: NotificationType,
    data: any,
    priority?: NotificationPriority
  ): Promise<string> {
    try {
      // Ajouter un breadcrumb
      this.addSentryBreadcrumb(
        `Envoi notification ${type}`,
        'notification',
        { recipientId, recipientType, type }
      );

      // Définir l'utilisateur
      this.setSentryUser(recipientId, recipientType as 'client' | 'expert' | 'admin');

      const result = await this.sendNotification(recipientId, recipientType, type, data, priority);

      // Ajouter un breadcrumb de succès
      this.addSentryBreadcrumb(
        `Notification ${type} envoyée avec succès`,
        'notification_success',
        { recipientId, recipientType, type }
      );

      return result;
    } catch (error) {
      // Ajouter un breadcrumb d'échec
      this.addSentryBreadcrumb(
        `Échec envoi notification ${type}`,
        'notification_error',
        { recipientId, recipientType, type, error: (error as any).message }
      );

      throw error;
    }
  }
} 