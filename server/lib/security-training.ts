import fs from 'fs';
import path from 'path';

/**
 * Système de Formation et Sensibilisation Sécurité
 * Conformité ISO 27001 - A.7.1 Sécurité des Ressources Humaines
 */

export enum TrainingType {
    BASIC_SECURITY = 'basic_security',
    ADVANCED_SECURITY = 'advanced_security',
    INCIDENT_RESPONSE = 'incident_response',
    COMPLIANCE = 'compliance',
    DEVELOPER_SECURITY = 'developer_security'
}

export enum TrainingStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    EXPIRED = 'expired'
}

export interface TrainingModule {
    id: string;
    title: string;
    description: string;
    type: TrainingType;
    duration: number; // minutes
    required: boolean;
    frequency: 'once' | 'annual' | 'quarterly';
    content: string;
    quiz: QuizQuestion[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface UserTraining {
    userId: string;
    userName: string;
    role: string;
    modules: UserTrainingModule[];
    lastTrainingDate: Date;
    nextTrainingDate: Date;
    complianceScore: number;
}

export interface UserTrainingModule {
    moduleId: string;
    status: TrainingStatus;
    startedAt?: Date;
    completedAt?: Date;
    score?: number;
    attempts: number;
    maxAttempts: number;
}

export class SecurityTrainingManager {
    private trainingModules: TrainingModule[] = [];
    private userTrainings: UserTraining[] = [];
    private trainingDataPath: string;

    constructor() {
        this.trainingDataPath = './training/';
        this.ensureTrainingDirectory();
        this.initializeTrainingModules();
        this.loadUserTrainings();
    }

    /**
     * Crée le répertoire de formation
     */
    private ensureTrainingDirectory(): void {
        if (!fs.existsSync(this.trainingDataPath)) {
            fs.mkdirSync(this.trainingDataPath, { recursive: true });
        }
    }

    /**
     * Initialise les modules de formation
     */
    private initializeTrainingModules(): void {
        this.trainingModules = [
            {
                id: 'basic-security-001',
                title: 'Sensibilisation Sécurité de Base',
                description: 'Formation obligatoire pour tous les employés sur les principes de sécurité',
                type: TrainingType.BASIC_SECURITY,
                duration: 30,
                required: true,
                frequency: 'annual',
                content: `
# Sensibilisation Sécurité de Base

## Objectifs
- Comprendre les principes de sécurité de l'information
- Identifier les menaces courantes
- Appliquer les bonnes pratiques de sécurité

## Contenu

### 1. Principes de Sécurité (CIA)
- **Confidentialité** : Les informations ne doivent être accessibles qu'aux personnes autorisées
- **Intégrité** : Les données doivent être exactes et complètes
- **Disponibilité** : Les systèmes doivent être accessibles quand nécessaire

### 2. Menaces Courantes
- **Phishing** : Emails frauduleux
- **Malware** : Logiciels malveillants
- **Ingénierie sociale** : Manipulation psychologique
- **Attaques par force brute** : Tentatives de deviner les mots de passe

### 3. Bonnes Pratiques
- **Mots de passe forts** : 12 caractères minimum, mélange de types
- **Verrouillage d'écran** : Toujours verrouiller son poste
- **Vérification des emails** : Vérifier l'expéditeur avant clic
- **Signalement d'incidents** : Signaler immédiatement tout comportement suspect

### 4. Procédures de Sécurité
- **Gestion des mots de passe** : Ne jamais partager ses identifiants
- **Accès aux locaux** : Badge obligatoire, ne pas faire suivre
- **Traitement des données** : Respecter la classification des données
- **Téléchargements** : Éviter les téléchargements non autorisés
                `,
                quiz: [
                    {
                        id: 'q1',
                        question: 'Quels sont les trois principes de sécurité de l\'information ?',
                        options: [
                            'Confidentialité, Intégrité, Disponibilité',
                            'Sécurité, Fiabilité, Performance',
                            'Accès, Contrôle, Audit',
                            'Protection, Surveillance, Réponse'
                        ],
                        correctAnswer: 0,
                        explanation: 'Les trois principes fondamentaux sont Confidentialité, Intégrité et Disponibilité (CIA).'
                    },
                    {
                        id: 'q2',
                        question: 'Quelle est la longueur minimale recommandée pour un mot de passe ?',
                        options: ['8 caractères', '10 caractères', '12 caractères', '16 caractères'],
                        correctAnswer: 2,
                        explanation: 'Un mot de passe de 12 caractères minimum offre une sécurité suffisante.'
                    },
                    {
                        id: 'q3',
                        question: 'Que faire en cas de suspicion d\'attaque par phishing ?',
                        options: [
                            'Supprimer l\'email immédiatement',
                            'Signaler à l\'équipe sécurité',
                            'Répondre pour demander des précisions',
                            'Transférer à un collègue'
                        ],
                        correctAnswer: 1,
                        explanation: 'Il faut toujours signaler les tentatives de phishing à l\'équipe sécurité.'
                    }
                ]
            },
            {
                id: 'developer-security-001',
                title: 'Sécurité pour Développeurs',
                description: 'Formation spécifique sur la sécurité du code et des applications',
                type: TrainingType.DEVELOPER_SECURITY,
                duration: 60,
                required: true,
                frequency: 'annual',
                content: `
# Sécurité pour Développeurs

## Objectifs
- Comprendre les vulnérabilités courantes
- Appliquer les bonnes pratiques de développement sécurisé
- Intégrer la sécurité dans le cycle de développement

## Contenu

### 1. Vulnérabilités Courantes (OWASP Top 10)
- **Injection** : SQL, NoSQL, LDAP, OS
- **Authentification cassée** : Gestion des sessions
- **Exposition de données sensibles** : Chiffrement
- **XXE** : External Entity Processing
- **Contrôle d'accès cassé** : Autorisations
- **Configuration de sécurité cassée** : Paramètres
- **XSS** : Cross-Site Scripting
- **Désérialisation non sécurisée**
- **Utilisation de composants vulnérables**
- **Logging et monitoring insuffisants**

### 2. Bonnes Pratiques de Développement
- **Validation des entrées** : Toujours valider et sanitiser
- **Principe du moindre privilège** : Accès minimal nécessaire
- **Défense en profondeur** : Plusieurs couches de sécurité
- **Fail securely** : Gestion sécurisée des erreurs
- **Chiffrement** : Données sensibles toujours chiffrées

### 3. Tests de Sécurité
- **Tests unitaires de sécurité**
- **Tests d'intégration**
- **Tests de pénétration**
- **Audit de code**
- **Analyse statique**

### 4. Outils et Ressources
- **OWASP ZAP** : Tests de sécurité automatisés
- **SonarQube** : Analyse de qualité et sécurité
- **Snyk** : Détection de vulnérabilités
- **Bandit** : Analyse Python
- **ESLint Security** : Analyse JavaScript
                `,
                quiz: [
                    {
                        id: 'q1',
                        question: 'Quelle est la première vulnérabilité de l\'OWASP Top 10 ?',
                        options: ['XSS', 'Injection', 'Authentification cassée', 'Exposition de données'],
                        correctAnswer: 1,
                        explanation: 'L\'injection est la vulnérabilité la plus critique selon OWASP.'
                    },
                    {
                        id: 'q2',
                        question: 'Quel principe recommande d\'accorder le minimum de privilèges nécessaire ?',
                        options: [
                            'Principe de défense en profondeur',
                            'Principe du moindre privilège',
                            'Principe de fail securely',
                            'Principe de validation'
                        ],
                        correctAnswer: 1,
                        explanation: 'Le principe du moindre privilège recommande d\'accorder le minimum de droits nécessaire.'
                    },
                    {
                        id: 'q3',
                        question: 'Que faire en cas de découverte d\'une vulnérabilité dans le code ?',
                        options: [
                            'La corriger immédiatement',
                            'Signaler à l\'équipe sécurité',
                            'Documenter et planifier la correction',
                            'Ignorer si elle n\'est pas critique'
                        ],
                        correctAnswer: 2,
                        explanation: 'Il faut documenter et planifier la correction de manière structurée.'
                    }
                ]
            }
        ];
    }

    /**
     * Charge les données de formation des utilisateurs
     */
    private loadUserTrainings(): void {
        const userTrainingsFile = path.join(this.trainingDataPath, 'user-trainings.json');
        if (fs.existsSync(userTrainingsFile)) {
            try {
                const data = fs.readFileSync(userTrainingsFile, 'utf8');
                this.userTrainings = JSON.parse(data);
            } catch (error) {
                console.error('Erreur lors du chargement des formations:', error);
                this.userTrainings = [];
            }
            }
        }

    /**
     * Sauvegarde les données de formation
     */
    private saveUserTrainings(): void {
        const userTrainingsFile = path.join(this.trainingDataPath, 'user-trainings.json');
        fs.writeFileSync(userTrainingsFile, JSON.stringify(this.userTrainings, null, 2));
    }

    /**
     * Enregistre un nouvel utilisateur
     */
    async registerUser(userId: string, userName: string, role: string): Promise<UserTraining> {
        const existingUser = this.userTrainings.find(u => u.userId === userId);
        if (existingUser) {
            return existingUser;
        }

        const userTraining: UserTraining = {
            userId,
            userName,
            role,
            modules: [],
            lastTrainingDate: new Date(),
            nextTrainingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
            complianceScore: 0
        };

        // Assigner les modules requis selon le rôle
        const requiredModules = this.getRequiredModulesForRole(role);
        for (const module of requiredModules) {
            userTraining.modules.push({
                moduleId: module.id,
                status: TrainingStatus.NOT_STARTED,
                attempts: 0,
                maxAttempts: 3
            });
        }

        this.userTrainings.push(userTraining);
        this.saveUserTrainings();

        console.log(`👤 Utilisateur enregistré: ${userName} (${role})`);
        return userTraining;
    }

    /**
     * Obtient les modules requis pour un rôle
     */
    private getRequiredModulesForRole(role: string): TrainingModule[] {
        const requiredModules: TrainingModule[] = [];

        // Module de base pour tous
        const basicModule = this.trainingModules.find(m => m.id === 'basic-security-001');
        if (basicModule) {
            requiredModules.push(basicModule);
        }

        // Modules spécifiques selon le rôle
        switch (role.toLowerCase()) {
            case 'developer':
            case 'dev':
            case 'programmer':
                const devModule = this.trainingModules.find(m => m.id === 'developer-security-001');
                if (devModule) {
                    requiredModules.push(devModule);
                }
                break;
        }

        return requiredModules;
    }

    /**
     * Obtient le statut de formation d'un utilisateur
     */
    getUserTrainingStatus(userId: string): UserTraining | null {
        return this.userTrainings.find(u => u.userId === userId) || null;
    }

    /**
     * Obtient tous les modules de formation
     */
    getAllTrainingModules(): TrainingModule[] {
        return this.trainingModules;
    }

    /**
     * Génère un rapport de conformité
     */
    generateComplianceReport(): any {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalUsers: this.userTrainings.length,
                compliantUsers: this.userTrainings.filter(u => u.complianceScore >= 80).length,
                nonCompliantUsers: this.userTrainings.filter(u => u.complianceScore < 80).length,
                averageComplianceScore: Math.round(
                    this.userTrainings.reduce((sum, u) => sum + u.complianceScore, 0) / this.userTrainings.length
                )
            },
            byRole: {} as any,
            byModule: {} as any,
            users: this.userTrainings.map(u => ({
                userId: u.userId,
                userName: u.userName,
                role: u.role,
                complianceScore: u.complianceScore,
                completedModules: u.modules.filter(m => m.status === TrainingStatus.COMPLETED).length,
                totalModules: u.modules.length
            }))
        };

        return report;
    }
}

export const securityTrainingManager = new SecurityTrainingManager();
