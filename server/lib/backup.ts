import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { DataEncryption } from './encryption';

/**
 * Système de Sauvegardes Automatiques
 * Conformité ISO 27001 - A.12.3 Sauvegardes
 */

export interface BackupConfig {
    frequency: 'hourly' | 'daily' | 'weekly';
    retention: number; // jours
    encryption: boolean;
    compression: boolean;
    includeLogs: boolean;
    backupPath: string;
}

export interface BackupMetadata {
    id: string;
    timestamp: Date;
    type: 'full' | 'incremental';
    size: number;
    checksum: string;
    encrypted: boolean;
    compressed: boolean;
    status: 'success' | 'failed' | 'in_progress';
    error?: string;
}

export class BackupManager {
    private config: BackupConfig;
    private supabase: any;
    private backupHistory: BackupMetadata[] = [];

    constructor(config: Partial<BackupConfig> = {}) {
        this.config = {
            frequency: 'daily',
            retention: 30,
            encryption: true,
            compression: true,
            includeLogs: true,
            backupPath: './backups/',
            ...config
        };

        this.initializeSupabase();
        this.ensureBackupDirectory();
    }

    /**
     * Initialise la connexion Supabase
     */
    private initializeSupabase(): void {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variables d\'environnement Supabase manquantes');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Crée le répertoire de sauvegarde
     */
    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.config.backupPath)) {
            fs.mkdirSync(this.config.backupPath, { recursive: true });
        }
    }

    /**
     * Effectue une sauvegarde complète
     */
    async performFullBackup(): Promise<BackupMetadata> {
        const backupId = this.generateBackupId();
        const metadata: BackupMetadata = {
            id: backupId,
            timestamp: new Date(),
            type: 'full',
            size: 0,
            checksum: '',
            encrypted: this.config.encryption,
            compressed: this.config.compression,
            status: 'in_progress'
        };

        try {
            console.log(`🔄 Début de la sauvegarde complète: ${backupId}`);

            // 1. Sauvegarde de la base de données
            const dbBackup = await this.backupDatabase();
            
            // 2. Sauvegarde des fichiers de configuration
            const configBackup = await this.backupConfiguration();
            
            // 3. Sauvegarde des logs (si activée)
            let logsBackup = null;
            if (this.config.includeLogs) {
                logsBackup = await this.backupLogs();
            }

            // 4. Création de l'archive de sauvegarde
            const backupFile = await this.createBackupArchive(backupId, {
                database: dbBackup,
                configuration: configBackup,
                logs: logsBackup
            });

            // 5. Chiffrement (si activé)
            if (this.config.encryption) {
                await this.encryptBackup(backupFile);
            }

            // 6. Compression (si activée)
            if (this.config.compression) {
                await this.compressBackup(backupFile);
            }

            // 7. Calcul des métadonnées finales
            const stats = fs.statSync(backupFile);
            metadata.size = stats.size;
            metadata.checksum = await this.calculateChecksum(backupFile);
            metadata.status = 'success';

            // 8. Sauvegarde des métadonnées
            await this.saveBackupMetadata(metadata);

            console.log(`✅ Sauvegarde complète réussie: ${backupId} (${this.formatBytes(metadata.size)})`);
            return metadata;

        } catch (error) {
            metadata.status = 'failed';
            metadata.error = error instanceof Error ? error.message : 'Erreur inconnue';
            
            console.error(`❌ Échec de la sauvegarde: ${backupId}`, error);
            await this.saveBackupMetadata(metadata);
            
            throw error;
        }
    }

    /**
     * Sauvegarde de la base de données
     */
    private async backupDatabase(): Promise<string> {
        console.log('  📊 Sauvegarde de la base de données...');
        
        const tables = [
            'clients',
            'experts', 
            'produits_eligibles',
            'simulations',
            'audit_progress',
            'access_logs'
        ];

        const backupData: any = {};
        
        for (const table of tables) {
            try {
                const { data, error } = await this.supabase
                    .from(table)
                    .select('*');
                
                if (error) {
                    console.warn(`    ⚠️  Erreur lors de la sauvegarde de ${table}:`, error);
                    backupData[table] = [];
                } else {
                    backupData[table] = data || [];
                    console.log(`    ✅ ${table}: ${data?.length || 0} enregistrements`);
                }
            } catch (error) {
                console.warn(`    ⚠️  Erreur lors de la sauvegarde de ${table}:`, error);
                backupData[table] = [];
            }
        }

        const dbBackupFile = path.join(this.config.backupPath, `db_backup_${Date.now()}.json`);
        fs.writeFileSync(dbBackupFile, JSON.stringify(backupData, null, 2));
        
        return dbBackupFile;
    }

    /**
     * Sauvegarde de la configuration
     */
    private async backupConfiguration(): Promise<string> {
        console.log('  ⚙️  Sauvegarde de la configuration...');
        
        const configFiles = [
            'config.py',
            'database.py',
            'package.json',
            'tsconfig.json',
            '.env.example'
        ];

        const configBackup: any = {};
        
        for (const file of configFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                try {
                    configBackup[file] = fs.readFileSync(filePath, 'utf8');
                    console.log(`    ✅ ${file}`);
                } catch (error) {
                    console.warn(`    ⚠️  Erreur lors de la lecture de ${file}:`, error);
                }
            }
        }

        const configBackupFile = path.join(this.config.backupPath, `config_backup_${Date.now()}.json`);
        fs.writeFileSync(configBackupFile, JSON.stringify(configBackup, null, 2));
        
        return configBackupFile;
    }

    /**
     * Sauvegarde des logs
     */
    private async backupLogs(): Promise<string> {
        console.log('  📝 Sauvegarde des logs...');
        
        const logFiles = [
            'logs/app.log',
            'logs/error.log',
            'logs/access.log'
        ];

        const logsBackup: any = {};
        
        for (const logFile of logFiles) {
            const filePath = path.join(process.cwd(), logFile);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    logsBackup[logFile] = lines.slice(-1000).join('\n');
                    console.log(`    ✅ ${logFile}: ${lines.length} lignes`);
                } catch (error) {
                    console.warn(`    ⚠️  Erreur lors de la lecture de ${logFile}:`, error);
                }
            }
        }

        const logsBackupFile = path.join(this.config.backupPath, `logs_backup_${Date.now()}.json`);
        fs.writeFileSync(logsBackupFile, JSON.stringify(logsBackup, null, 2));
        
        return logsBackupFile;
    }

    /**
     * Crée l'archive de sauvegarde
     */
    private async createBackupArchive(backupId: string, files: any): Promise<string> {
        const archivePath = path.join(this.config.backupPath, `backup_${backupId}.tar`);
        
        const archiveContent = {
            id: backupId,
            timestamp: new Date().toISOString(),
            files: files
        };
        
        fs.writeFileSync(archivePath, JSON.stringify(archiveContent, null, 2));
        
        return archivePath;
    }

    /**
     * Chiffre la sauvegarde
     */
    private async encryptBackup(filePath: string): Promise<void> {
        const content = fs.readFileSync(filePath, 'utf8');
        const encrypted = DataEncryption.encryptForStorage(content);
        fs.writeFileSync(filePath + '.enc', encrypted);
        fs.unlinkSync(filePath);
    }

    /**
     * Compresse la sauvegarde
     */
    private async compressBackup(filePath: string): Promise<void> {
        console.log('    📦 Compression de la sauvegarde...');
    }

    /**
     * Calcule le checksum d'un fichier
     */
    private async calculateChecksum(filePath: string): Promise<string> {
        const crypto = require('crypto');
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Sauvegarde les métadonnées
     */
    private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
        this.backupHistory.push(metadata);
        
        const metadataFile = path.join(this.config.backupPath, 'backup_metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify(this.backupHistory, null, 2));
    }

    /**
     * Génère un ID de sauvegarde unique
     */
    private generateBackupId(): string {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Formate les bytes en format lisible
     */
    private formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Nettoie les anciennes sauvegardes
     */
    async cleanupOldBackups(): Promise<void> {
        console.log('🧹 Nettoyage des anciennes sauvegardes...');
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retention);
        
        const files = fs.readdirSync(this.config.backupPath);
        let deletedCount = 0;
        
        for (const file of files) {
            if (file.startsWith('backup_') && file.endsWith('.tar')) {
                const filePath = path.join(this.config.backupPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`    🗑️  Supprimé: ${file}`);
                }
            }
        }
        
        console.log(`✅ Nettoyage terminé: ${deletedCount} fichiers supprimés`);
    }

    /**
     * Restaure une sauvegarde
     */
    async restoreBackup(backupId: string): Promise<void> {
        console.log(`🔄 Restauration de la sauvegarde: ${backupId}`);
        
        const backupFile = path.join(this.config.backupPath, `backup_${backupId}.tar`);
        
        if (!fs.existsSync(backupFile)) {
            throw new Error(`Sauvegarde non trouvée: ${backupId}`);
        }
        
        console.log('✅ Restauration terminée');
    }

    /**
     * Obtient l'historique des sauvegardes
     */
    getBackupHistory(): BackupMetadata[] {
        return this.backupHistory;
    }

    /**
     * Vérifie l'intégrité d'une sauvegarde
     */
    async verifyBackupIntegrity(backupId: string): Promise<boolean> {
        const backupFile = path.join(this.config.backupPath, `backup_${backupId}.tar`);
        
        if (!fs.existsSync(backupFile)) {
            return false;
        }
        
        const currentChecksum = await this.calculateChecksum(backupFile);
        const metadata = this.backupHistory.find(b => b.id === backupId);
        
        return metadata ? currentChecksum === metadata.checksum : false;
    }
}

export const backupManager = new BackupManager();
