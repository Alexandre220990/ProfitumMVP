import fs from 'fs';
import path from 'path';

/**
 * Système de Gestion des Incidents de Sécurité
 * Conformité ISO 27001 - A.16.1 Gestion des Incidents
 */

export enum IncidentSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum IncidentStatus {
    OPEN = 'open',
    INVESTIGATING = 'investigating',
    CONTAINED = 'contained',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum IncidentType {
    SECURITY_BREACH = 'security_breach',
    DATA_LEAK = 'data_leak',
    UNAUTHORIZED_ACCESS = 'unauthorized_access',
    SYSTEM_FAILURE = 'system_failure',
    PERFORMANCE_ISSUE = 'performance_issue',
    COMPLIANCE_VIOLATION = 'compliance_violation',
    OTHER = 'other'
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    type: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    reportedAt: Date;
    reportedBy: string;
    assignedTo?: string;
    investigationStartedAt?: Date;
    containedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    impact: string;
    rootCause?: string;
    resolution?: string;
    lessonsLearned?: string;
    tags: string[];
    evidence: string[];
    notifications: Notification[];
}

export interface Notification {
    id: string;
    type: 'email' | 'sms' | 'slack' | 'internal';
    recipient: string;
    message: string;
    sentAt: Date;
    status: 'pending' | 'sent' | 'failed';
}

export interface EscalationRule {
    id: string;
    severity: IncidentSeverity;
    timeThreshold: number; // minutes
    escalationLevel: number;
    contacts: string[];
    autoEscalate: boolean;
}

export class IncidentManager {
    private incidents: Incident[] = [];
    private escalationRules: EscalationRule[] = [];
    private incidentLogPath: string;

    constructor() {
        this.setupEscalationRules();
        this.ensureIncidentDirectory();
        this.loadIncidents();
    }

    /**
     * Configure les règles d'escalade
     */
    private setupEscalationRules(): void {
        this.escalationRules = [
            {
                id: 'critical-30min',
                severity: IncidentSeverity.CRITICAL,
                timeThreshold: 30,
                escalationLevel: 1,
                contacts: ['cto@profitum.com', 'security@profitum.com'],
                autoEscalate: true
            },
            {
                id: 'high-2hours',
                severity: IncidentSeverity.HIGH,
                timeThreshold: 120,
                escalationLevel: 2,
                contacts: ['lead-dev@profitum.com'],
                autoEscalate: true
            },
            {
                id: 'medium-24hours',
                severity: IncidentSeverity.MEDIUM,
                timeThreshold: 1440,
                escalationLevel: 3,
                contacts: ['manager@profitum.com'],
                autoEscalate: false
            }
        ];
    }

    /**
     * Crée le répertoire d'incidents
     */
    private ensureIncidentDirectory(): void {
        this.incidentLogPath = './incidents/';
        if (!fs.existsSync(this.incidentLogPath)) {
            fs.mkdirSync(this.incidentLogPath, { recursive: true });
        }
    }

    /**
     * Charge les incidents depuis le stockage
     */
    private loadIncidents(): void {
        const incidentsFile = path.join(this.incidentLogPath, 'incidents.json');
        if (fs.existsSync(incidentsFile)) {
            try {
                const data = fs.readFileSync(incidentsFile, 'utf8');
                this.incidents = JSON.parse(data);
            } catch (error) {
                console.error('Erreur lors du chargement des incidents:', error);
                this.incidents = [];
            }
        }
    }

    /**
     * Sauvegarde les incidents
     */
    private saveIncidents(): void {
        const incidentsFile = path.join(this.incidentLogPath, 'incidents.json');
        fs.writeFileSync(incidentsFile, JSON.stringify(this.incidents, null, 2));
    }

    /**
     * Crée un nouvel incident avec workflow
     */
    async createIncident(
        title: string,
        description: string,
        type: IncidentType,
        severity: IncidentSeverity,
        reportedBy: string,
        impact: string
    ): Promise<Incident> {
        const incident: Incident = {
            id: this.generateIncidentId(),
            title,
            description,
            type,
            severity,
            status: IncidentStatus.OPEN,
            reportedAt: new Date(),
            reportedBy,
            impact,
            tags: [],
            evidence: [],
            notifications: []
        };

        this.incidents.push(incident);
        this.saveIncidents();

        // Déclencher le workflow d'incident
        await this.triggerIncidentWorkflow(incident);

        console.log(`🚨 Nouvel incident créé: ${incident.id} - ${title}`);
        return incident;
    }

    /**
     * Déclenche le workflow de gestion d'incident
     */
    private async triggerIncidentWorkflow(incident: Incident): Promise<void> {
        console.log(`🔄 Démarrage du workflow pour l'incident ${incident.id}`);
        
        // Étape 1: Notification immédiate
        await this.sendInitialNotifications(incident);
        
        // Étape 2: Évaluation initiale
        await this.performInitialAssessment(incident);
        
        // Étape 3: Escalade si nécessaire
        this.checkEscalation(incident);
    }

    /**
     * Effectue l'évaluation initiale
     */
    private async performInitialAssessment(incident: Incident): Promise<void> {
        console.log(`🔍 Évaluation initiale de l'incident ${incident.id}`);
        
        // Analyse automatique selon le type d'incident
        switch (incident.type) {
            case IncidentType.SECURITY_BREACH:
                await this.assessSecurityBreach(incident);
                break;
            case IncidentType.DATA_LEAK:
                await this.assessDataLeak(incident);
                break;
            case IncidentType.UNAUTHORIZED_ACCESS:
                await this.assessUnauthorizedAccess(incident);
                break;
            default:
                console.log(`📋 Évaluation standard pour l'incident ${incident.id}`);
        }
    }

    /**
     * Évalue une violation de sécurité
     */
    private async assessSecurityBreach(incident: Incident): Promise<void> {
        console.log(`🔒 Évaluation spécifique violation de sécurité: ${incident.id}`);
        // Logique spécifique aux violations de sécurité
    }

    /**
     * Évalue une fuite de données
     */
    private async assessDataLeak(incident: Incident): Promise<void> {
        console.log(`💧 Évaluation spécifique fuite de données: ${incident.id}`);
        // Logique spécifique aux fuites de données
    }

    /**
     * Évalue un accès non autorisé
     */
    private async assessUnauthorizedAccess(incident: Incident): Promise<void> {
        console.log(`🚪 Évaluation spécifique accès non autorisé: ${incident.id}`);
        // Logique spécifique aux accès non autorisés
    }

    /**
     * Met à jour le statut d'un incident
     */
    async updateIncidentStatus(
        incidentId: string,
        status: IncidentStatus,
        updatedBy: string,
        notes?: string
    ): Promise<Incident> {
        const incident = this.incidents.find(i => i.id === incidentId);
        if (!incident) {
            throw new Error(`Incident non trouvé: ${incidentId}`);
        }

        const previousStatus = incident.status;
        incident.status = status;

        // Mise à jour des timestamps
        switch (status) {
            case IncidentStatus.INVESTIGATING:
                incident.investigationStartedAt = new Date();
                break;
            case IncidentStatus.CONTAINED:
                incident.containedAt = new Date();
                break;
            case IncidentStatus.RESOLVED:
                incident.resolvedAt = new Date();
                break;
            case IncidentStatus.CLOSED:
                incident.closedAt = new Date();
                break;
        }

        this.saveIncidents();

        // Notification de changement de statut
        await this.sendStatusUpdateNotification(incident, previousStatus, updatedBy, notes);

        console.log(`📝 Statut incident ${incidentId} mis à jour: ${previousStatus} → ${status}`);
        return incident;
    }

    /**
     * Assigne un incident
     */
    async assignIncident(incidentId: string, assignedTo: string): Promise<Incident> {
        const incident = this.incidents.find(i => i.id === incidentId);
        if (!incident) {
            throw new Error(`Incident non trouvé: ${incidentId}`);
        }

        incident.assignedTo = assignedTo;
        this.saveIncidents();

        // Notification d'assignation
        await this.sendAssignmentNotification(incident, assignedTo);

        console.log(`👤 Incident ${incidentId} assigné à: ${assignedTo}`);
        return incident;
    }

    /**
     * Envoie les notifications initiales
     */
    private async sendInitialNotifications(incident: Incident): Promise<void> {
        const notification: Notification = {
            id: this.generateNotificationId(),
            type: 'internal',
            recipient: 'security-team@profitum.com',
            message: `🚨 NOUVEL INCIDENT: ${incident.title}\n\nSévérité: ${incident.severity}\nType: ${incident.type}\nImpact: ${incident.impact}\n\nDétails: ${incident.description}`,
            sentAt: new Date(),
            status: 'sent'
        };

        incident.notifications.push(notification);

        // Notification selon la sévérité
        if (incident.severity === IncidentSeverity.CRITICAL) {
            await this.sendCriticalAlert(incident);
        }
    }

    /**
     * Envoie une alerte critique
     */
    private async sendCriticalAlert(incident: Incident): Promise<void> {
        const criticalNotification: Notification = {
            id: this.generateNotificationId(),
            type: 'email',
            recipient: 'cto@profitum.com',
            message: `🚨 ALERTE CRITIQUE: ${incident.title}\n\nAction immédiate requise!\n\nDétails: ${incident.description}`,
            sentAt: new Date(),
            status: 'sent'
        };

        incident.notifications.push(criticalNotification);
    }

    /**
     * Envoie une notification de mise à jour de statut
     */
    private async sendStatusUpdateNotification(
        incident: Incident,
        previousStatus: IncidentStatus,
        updatedBy: string,
        notes?: string
    ): Promise<void> {
        const notification: Notification = {
            id: this.generateNotificationId(),
            type: 'internal',
            recipient: incident.assignedTo || 'security-team@profitum.com',
            message: `📝 Mise à jour incident ${incident.id}: ${previousStatus} → ${incident.status}\n\nMis à jour par: ${updatedBy}${notes ? `\nNotes: ${notes}` : ''}`,
            sentAt: new Date(),
            status: 'sent'
        };

        incident.notifications.push(notification);
    }

    /**
     * Envoie une notification d'assignation
     */
    private async sendAssignmentNotification(incident: Incident, assignedTo: string): Promise<void> {
        const notification: Notification = {
            id: this.generateNotificationId(),
            type: 'internal',
            recipient: assignedTo,
            message: `👤 Incident ${incident.id} vous a été assigné\n\nTitre: ${incident.title}\nSévérité: ${incident.severity}\n\nDétails: ${incident.description}`,
            sentAt: new Date(),
            status: 'sent'
        };

        incident.notifications.push(notification);
    }

    /**
     * Vérifie les règles d'escalade
     */
    private checkEscalation(incident: Incident): void {
        const rules = this.escalationRules.filter(r => r.severity === incident.severity);
        
        for (const rule of rules) {
            const timeSinceCreation = Date.now() - incident.reportedAt.getTime();
            const timeThresholdMs = rule.timeThreshold * 60 * 1000;

            if (timeSinceCreation >= timeThresholdMs && rule.autoEscalate) {
                this.escalateIncident(incident, rule);
            }
        }
    }

    /**
     * Escalade un incident
     */
    private async escalateIncident(incident: Incident, rule: EscalationRule): Promise<void> {
        console.log(`⚠️  ESCALADE: Incident ${incident.id} escaladé au niveau ${rule.escalationLevel}`);

        for (const contact of rule.contacts) {
            const notification: Notification = {
                id: this.generateNotificationId(),
                type: 'email',
                recipient: contact,
                message: `⚠️  ESCALADE - Incident ${incident.id}\n\nNiveau d'escalade: ${rule.escalationLevel}\nTitre: ${incident.title}\nSévérité: ${incident.severity}\n\nDétails: ${incident.description}`,
                sentAt: new Date(),
                status: 'sent'
            };

            incident.notifications.push(notification);
        }
    }

    /**
     * Génère un ID d'incident unique
     */
    private generateIncidentId(): string {
        return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }

    /**
     * Génère un ID de notification unique
     */
    private generateNotificationId(): string {
        return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }

    /**
     * Obtient tous les incidents
     */
    getAllIncidents(): Incident[] {
        return this.incidents;
    }

    /**
     * Obtient un incident par ID
     */
    getIncidentById(incidentId: string): Incident | undefined {
        return this.incidents.find(i => i.id === incidentId);
    }

    /**
     * Obtient les incidents ouverts
     */
    getOpenIncidents(): Incident[] {
        return this.incidents.filter(i => 
            i.status === IncidentStatus.OPEN || 
            i.status === IncidentStatus.INVESTIGATING ||
            i.status === IncidentStatus.CONTAINED
        );
    }

    /**
     * Génère un rapport d'incidents
     */
    generateIncidentReport(startDate?: Date, endDate?: Date): any {
        const filteredIncidents = this.incidents.filter(incident => {
            if (startDate && incident.reportedAt < startDate) return false;
            if (endDate && incident.reportedAt > endDate) return false;
            return true;
        });

        const report = {
            period: {
                start: startDate || new Date(0),
                end: endDate || new Date()
            },
            summary: {
                total: filteredIncidents.length,
                bySeverity: {
                    critical: filteredIncidents.filter(i => i.severity === IncidentSeverity.CRITICAL).length,
                    high: filteredIncidents.filter(i => i.severity === IncidentSeverity.HIGH).length,
                    medium: filteredIncidents.filter(i => i.severity === IncidentSeverity.MEDIUM).length,
                    low: filteredIncidents.filter(i => i.severity === IncidentSeverity.LOW).length
                },
                byStatus: {
                    open: filteredIncidents.filter(i => i.status === IncidentStatus.OPEN).length,
                    investigating: filteredIncidents.filter(i => i.status === IncidentStatus.INVESTIGATING).length,
                    contained: filteredIncidents.filter(i => i.status === IncidentStatus.CONTAINED).length,
                    resolved: filteredIncidents.filter(i => i.status === IncidentStatus.RESOLVED).length,
                    closed: filteredIncidents.filter(i => i.status === IncidentStatus.CLOSED).length
                }
            },
            incidents: filteredIncidents
        };

        return report;
    }
}

export const incidentManager = new IncidentManager();
