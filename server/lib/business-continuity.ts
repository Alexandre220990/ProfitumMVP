import fs from 'fs';
import path from 'path';

/**
 * Système de Continuité d'Activité
 * Conformité ISO 27001 - A.17 Aspects de Continuité
 */

export enum DisasterType {
    NATURAL = 'natural',
    TECHNICAL = 'technical',
    HUMAN = 'human',
    CYBER = 'cyber',
    SUPPLIER = 'supplier'
}

export enum RecoveryTier {
    CRITICAL = 'critical',    // RTO < 4h
    HIGH = 'high',           // RTO < 24h
    MEDIUM = 'medium',       // RTO < 72h
    LOW = 'low'              // RTO < 1 semaine
}

export interface BusinessProcess {
    id: string;
    name: string;
    description: string;
    tier: RecoveryTier;
    rto: number; // Recovery Time Objective (heures)
    rpo: number; // Recovery Point Objective (heures)
    dependencies: string[];
    owner: string;
    critical: boolean;
}

export interface DisasterRecoveryPlan {
    id: string;
    name: string;
    disasterType: DisasterType;
    description: string;
    procedures: RecoveryProcedure[];
    contacts: EmergencyContact[];
    resources: RecoveryResource[];
    lastTested: Date;
    nextTest: Date;
}

export interface RecoveryProcedure {
    id: string;
    title: string;
    description: string;
    steps: string[];
    estimatedTime: number; // minutes
    responsible: string;
    dependencies: string[];
}

export interface EmergencyContact {
    id: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    priority: number; // 1 = premier contact
}

export interface RecoveryResource {
    id: string;
    name: string;
    type: 'hardware' | 'software' | 'data' | 'personnel';
    description: string;
    location: string;
    availability: 'immediate' | '4h' | '24h' | '72h';
    cost: number;
}

export interface BusinessContinuityTest {
    id: string;
    planId: string;
    testDate: Date;
    testType: 'tabletop' | 'functional' | 'full';
    participants: string[];
    results: TestResult[];
    lessonsLearned: string[];
    nextActions: string[];
    status: 'planned' | 'in_progress' | 'completed' | 'failed';
}

export interface TestResult {
    procedureId: string;
    status: 'success' | 'partial' | 'failed';
    timeTaken: number; // minutes
    issues: string[];
    recommendations: string[];
}

export class BusinessContinuityManager {
    private businessProcesses: BusinessProcess[] = [];
    private disasterRecoveryPlans: DisasterRecoveryPlan[] = [];
    private continuityTests: BusinessContinuityTest[] = [];
    private dataPath: string;

    constructor() {
        this.dataPath = './business-continuity/';
        this.ensureDataDirectory();
        this.initializeBusinessProcesses();
        this.initializeDisasterRecoveryPlans();
        this.loadData();
    }

    /**
     * Crée le répertoire de données
     */
    private ensureDataDirectory(): void {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    /**
     * Initialise les processus métier critiques
     */
    private initializeBusinessProcesses(): void {
        this.businessProcesses = [
            {
                id: 'auth-system',
                name: 'Système d\'Authentification',
                description: 'Authentification des utilisateurs et gestion des sessions',
                tier: RecoveryTier.CRITICAL,
                rto: 2,
                rpo: 1,
                dependencies: ['database', 'network'],
                owner: 'Lead Dev',
                critical: true
            },
            {
                id: 'database',
                name: 'Base de Données',
                description: 'Stockage et gestion des données clients et métier',
                tier: RecoveryTier.CRITICAL,
                rto: 4,
                rpo: 1,
                dependencies: ['backup-system'],
                owner: 'DevOps',
                critical: true
            },
            {
                id: 'api-services',
                name: 'Services API',
                description: 'APIs de l\'application Profitum',
                tier: RecoveryTier.HIGH,
                rto: 8,
                rpo: 2,
                dependencies: ['auth-system', 'database'],
                owner: 'Lead Dev',
                critical: true
            },
            {
                id: 'backup-system',
                name: 'Système de Sauvegarde',
                description: 'Sauvegardes automatiques et restauration',
                tier: RecoveryTier.CRITICAL,
                rto: 1,
                rpo: 0.5,
                dependencies: [],
                owner: 'DevOps',
                critical: true
            }
        ];
    }

    /**
     * Initialise les plans de reprise d'activité
     */
    private initializeDisasterRecoveryPlans(): void {
        this.disasterRecoveryPlans = [
            {
                id: 'drp-cyber-attack',
                name: 'Plan de Reprise - Attaque Cyber',
                disasterType: DisasterType.CYBER,
                description: 'Procédures de reprise en cas d\'attaque cyber',
                procedures: [
                    {
                        id: 'proc-1',
                        title: 'Isolation des Systèmes',
                        description: 'Isoler immédiatement les systèmes compromis',
                        steps: [
                            'Identifier les systèmes compromis',
                            'Déconnecter du réseau',
                            'Préserver les preuves',
                            'Notifier l\'équipe sécurité'
                        ],
                        estimatedTime: 30,
                        responsible: 'Lead Sécurité',
                        dependencies: []
                    },
                    {
                        id: 'proc-2',
                        title: 'Activation du Site de Secours',
                        description: 'Activer l\'environnement de secours',
                        steps: [
                            'Vérifier l\'intégrité du site de secours',
                            'Restaurer les données depuis les sauvegardes',
                            'Reconfigurer les services critiques',
                            'Tester la connectivité'
                        ],
                        estimatedTime: 120,
                        responsible: 'DevOps',
                        dependencies: ['proc-1']
                    }
                ],
                contacts: [
                    {
                        id: 'contact-1',
                        name: 'CTO',
                        role: 'Responsable technique',
                        phone: '+33 1 XX XX XX XX',
                        email: 'cto@profitum.com',
                        priority: 1
                    }
                ],
                resources: [
                    {
                        id: 'resource-1',
                        name: 'Site de Secours Supabase',
                        type: 'hardware',
                        description: 'Environnement de secours sur Supabase',
                        location: 'Cloud',
                        availability: 'immediate',
                        cost: 500
                    }
                ],
                lastTested: new Date('2025-01-01'),
                nextTest: new Date('2025-04-01')
            }
        ];
    }

    /**
     * Charge les données depuis le stockage
     */
    private loadData(): void {
        const processesFile = path.join(this.dataPath, 'business-processes.json');
        const plansFile = path.join(this.dataPath, 'disaster-recovery-plans.json');
        const testsFile = path.join(this.dataPath, 'continuity-tests.json');

        if (fs.existsSync(processesFile)) {
            try {
                const data = fs.readFileSync(processesFile, 'utf8');
                this.businessProcesses = JSON.parse(data);
            } catch (error) {
                console.error('Erreur lors du chargement des processus:', error);
            }
        }

        if (fs.existsSync(plansFile)) {
            try {
                const data = fs.readFileSync(plansFile, 'utf8');
                this.disasterRecoveryPlans = JSON.parse(data);
            } catch (error) {
                console.error('Erreur lors du chargement des plans:', error);
            }
        }

        if (fs.existsSync(testsFile)) {
            try {
                const data = fs.readFileSync(testsFile, 'utf8');
                this.continuityTests = JSON.parse(data);
            } catch (error) {
                console.error('Erreur lors du chargement des tests:', error);
            }
        }
    }

    /**
     * Sauvegarde les données
     */
    private saveData(): void {
        const processesFile = path.join(this.dataPath, 'business-processes.json');
        const plansFile = path.join(this.dataPath, 'disaster-recovery-plans.json');
        const testsFile = path.join(this.dataPath, 'continuity-tests.json');

        fs.writeFileSync(processesFile, JSON.stringify(this.businessProcesses, null, 2));
        fs.writeFileSync(plansFile, JSON.stringify(this.disasterRecoveryPlans, null, 2));
        fs.writeFileSync(testsFile, JSON.stringify(this.continuityTests, null, 2));
    }

    /**
     * Obtient tous les processus métier
     */
    getAllBusinessProcesses(): BusinessProcess[] {
        return this.businessProcesses;
    }

    /**
     * Obtient les processus critiques
     */
    getCriticalProcesses(): BusinessProcess[] {
        return this.businessProcesses.filter(p => p.critical);
    }

    /**
     * Obtient tous les plans de reprise
     */
    getAllDisasterRecoveryPlans(): DisasterRecoveryPlan[] {
        return this.disasterRecoveryPlans;
    }

    /**
     * Génère un rapport de continuité d'activité
     */
    generateContinuityReport(): any {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalProcesses: this.businessProcesses.length,
                criticalProcesses: this.businessProcesses.filter(p => p.critical).length,
                totalPlans: this.disasterRecoveryPlans.length,
                totalTests: this.continuityTests.length
            },
            processes: this.businessProcesses.map(p => ({
                id: p.id,
                name: p.name,
                tier: p.tier,
                rto: p.rto,
                rpo: p.rpo,
                critical: p.critical
            })),
            plans: this.disasterRecoveryPlans.map(p => ({
                id: p.id,
                name: p.name,
                disasterType: p.disasterType,
                proceduresCount: p.procedures.length,
                lastTested: p.lastTested,
                nextTest: p.nextTest
            }))
        };

        return report;
    }

    /**
     * Vérifie la conformité des RTO/RPO
     */
    checkRTOCompliance(): any {
        const compliance = {
            compliant: true,
            issues: [] as string[],
            recommendations: [] as string[]
        };

        for (const process of this.businessProcesses) {
            if (process.tier === RecoveryTier.CRITICAL && process.rto > 4) {
                compliance.compliant = false;
                compliance.issues.push(`${process.name}: RTO de ${process.rto}h dépasse les 4h requises`);
                compliance.recommendations.push(`Réduire le RTO de ${process.name} à moins de 4h`);
            }
        }

        return compliance;
    }
}

export const businessContinuityManager = new BusinessContinuityManager();
