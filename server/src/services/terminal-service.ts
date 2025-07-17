import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export interface TerminalSession {
  id: string;
  category: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  output: string[];
  error: string[];
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  process?: ChildProcess;
}

export interface TestCommand {
  category: string;
  command: string;
  description: string;
  timeout?: number; // en millisecondes
}

export class TerminalService extends EventEmitter {
  private sessions = new Map<string, TerminalSession>();
  private readonly MAX_SESSIONS = 10; // Limite de sessions simultanées
  private readonly DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Commandes autorisées par catégorie
  private readonly ALLOWED_COMMANDS: Record<string, TestCommand[]> = {
    security: [
      {
        category: 'security',
        command: 'node scripts/tests/security-tests.js',
        description: 'Tests de sécurité et audit ISO 27001',
        timeout: 3 * 60 * 1000 // 3 minutes
      },
      {
        category: 'security',
        command: 'npm run test:security',
        description: 'Tests de sécurité via npm',
        timeout: 3 * 60 * 1000
      }
    ],
    performance: [
      {
        category: 'performance',
        command: 'node scripts/tests/performance-tests.js',
        description: 'Tests de performance et monitoring',
        timeout: 4 * 60 * 1000 // 4 minutes
      },
      {
        category: 'performance',
        command: 'npm run test:performance',
        description: 'Tests de performance via npm',
        timeout: 4 * 60 * 1000
      }
    ],
    database: [
      {
        category: 'database',
        command: 'node scripts/tests/database-tests.js',
        description: 'Tests de base de données et intégrité',
        timeout: 2 * 60 * 1000 // 2 minutes
      },
      {
        category: 'database',
        command: 'npm run test:database',
        description: 'Tests de base de données via npm',
        timeout: 2 * 60 * 1000
      }
    ],
    api: [
      {
        category: 'api',
        command: 'node scripts/tests/api-tests.js',
        description: 'Tests d\'API et endpoints',
        timeout: 2 * 60 * 1000 // 2 minutes
      },
      {
        category: 'api',
        command: 'npm run test:api',
        description: 'Tests d\'API via npm',
        timeout: 2 * 60 * 1000
      }
    ],
    system: [
      {
        category: 'system',
        command: 'node scripts/tests/system-tests.js',
        description: 'Tests système et monitoring',
        timeout: 2 * 60 * 1000 // 2 minutes
      },
      {
        category: 'system',
        command: 'npm run test:system',
        description: 'Tests système via npm',
        timeout: 2 * 60 * 1000
      }
    ]
  };

  constructor() {
    super();
    this.setupCleanup();
  }

  /**
   * Exécuter une commande de test pour une catégorie
   */
  async executeCommand(category: string, commandIndex: number = 0): Promise<string> {
    // Validation de la catégorie
    if (!this.ALLOWED_COMMANDS[category]) {
      throw new Error(`Catégorie non autorisée: ${category}`);
    }

    // Vérification du nombre de sessions actives
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error(`Nombre maximum de sessions atteint (${this.MAX_SESSIONS})`);
    }

    const commands = this.ALLOWED_COMMANDS[category];
    if (commandIndex >= commands.length) {
      throw new Error(`Index de commande invalide pour la catégorie ${category}`);
    }

    const testCommand = commands[commandIndex];
    const sessionId = uuidv4();

    // Créer la session
    const session: TerminalSession = {
      id: sessionId,
      category,
      command: testCommand.command,
      status: 'running',
      output: [],
      error: [],
      startTime: new Date()
    };

    this.sessions.set(sessionId, session);

    try {
      // Démarrer l'exécution
      await this.startProcess(session, testCommand);
      
      // Émettre l'événement de création
      this.emit('sessionCreated', session);
      
      return sessionId;
    } catch (error) {
      // Nettoyer en cas d'erreur
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Démarrer le processus pour une session
   */
  private async startProcess(session: TerminalSession, testCommand: TestCommand): Promise<void> {
    const { command, timeout = this.DEFAULT_TIMEOUT } = testCommand;
    
    // Parser la commande
    const [cmd, ...args] = command.split(' ');
    
    // Définir le répertoire de travail
    const workingDir = process.cwd();
    
    console.log(`🚀 Démarrage de la session ${session.id}: ${command}`);
    console.log(`📁 Répertoire: ${workingDir}`);

    // Créer le processus
    const childProcess = spawn(cmd, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' } // Activer les couleurs
    });

    session.process = childProcess;

    // Gestionnaire de sortie standard
    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        session.output.push(`[${new Date().toISOString()}] ${output}`);
        this.emit('output', session.id, output);
      }
    });

    // Gestionnaire d'erreur standard
    childProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString().trim();
      if (error) {
        session.error.push(`[${new Date().toISOString()}] ${error}`);
        this.emit('error', session.id, error);
      }
    });

    // Gestionnaire de fin de processus
    childProcess.on('close', (code: number) => {
      session.endTime = new Date();
      session.exitCode = code;
      session.status = code === 0 ? 'completed' : 'failed';
      session.process = undefined;

      console.log(`✅ Session ${session.id} terminée avec le code ${code}`);
      this.emit('sessionCompleted', session);
    });

    // Gestionnaire d'erreur de processus
    childProcess.on('error', (error: Error) => {
      session.endTime = new Date();
      session.status = 'failed';
      session.error.push(`[${new Date().toISOString()}] Erreur de processus: ${error.message}`);
      session.process = undefined;

      console.error(`❌ Erreur de processus pour la session ${session.id}:`, error);
      this.emit('sessionError', session, error);
    });

    // Timeout automatique
    setTimeout(() => {
      if (session.status === 'running' && session.process) {
        console.log(`⏰ Timeout pour la session ${session.id}`);
        this.killSession(session.id);
      }
    }, timeout);
  }

  /**
   * Récupérer le statut d'une session
   */
  getSessionStatus(sessionId: string): TerminalSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Récupérer toutes les sessions
   */
  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Récupérer les sessions actives
   */
  getActiveSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'running');
  }

  /**
   * Arrêter une session
   */
  async killSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (session.status === 'running' && session.process) {
      try {
        session.process.kill('SIGTERM');
        
        // Attendre un peu puis forcer l'arrêt si nécessaire
        setTimeout(() => {
          if (session.process && session.status === 'running') {
            session.process.kill('SIGKILL');
          }
        }, 5000);

        session.status = 'killed';
        session.endTime = new Date();
        session.error.push(`[${new Date().toISOString()}] Session arrêtée manuellement`);
        
        console.log(`🛑 Session ${sessionId} arrêtée`);
        this.emit('sessionKilled', session);
        return true;
      } catch (error) {
        console.error(`❌ Erreur lors de l'arrêt de la session ${sessionId}:`, error);
        return false;
      }
    }

    return false;
  }

  /**
   * Nettoyer les sessions terminées
   */
  private cleanupCompletedSessions(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status !== 'running' && session.endTime) {
        const age = now.getTime() - session.endTime.getTime();
        if (age > maxAge) {
          this.sessions.delete(sessionId);
          console.log(`🧹 Session ${sessionId} nettoyée (âge: ${Math.round(age / 1000 / 60)} minutes)`);
        }
      }
    }
  }

  /**
   * Configuration du nettoyage automatique
   */
  private setupCleanup(): void {
    // Nettoyer toutes les 30 minutes
    setInterval(() => {
      this.cleanupCompletedSessions();
    }, 30 * 60 * 1000);
  }

  /**
   * Récupérer les commandes disponibles
   */
  getAvailableCommands(): Record<string, TestCommand[]> {
    return this.ALLOWED_COMMANDS;
  }

  /**
   * Validation d'une commande
   */
  validateCommand(category: string, command: string): boolean {
    const commands = this.ALLOWED_COMMANDS[category];
    if (!commands) return false;
    
    return commands.some(cmd => cmd.command === command);
  }
}

// Instance singleton
export const terminalService = new TerminalService(); 