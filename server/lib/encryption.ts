import crypto from 'crypto';

/**
 * Module de Chiffrement des Données Sensibles
 * Conformité ISO 27001 - A.10.1 Contrôles Cryptographiques
 */

export class DataEncryption {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32; // 256 bits
    private static readonly IV_LENGTH = 16; // 128 bits
    private static readonly TAG_LENGTH = 16; // 128 bits

    /**
     * Génère une clé de chiffrement sécurisée
     */
    static generateKey(): string {
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }

    /**
     * Chiffre des données sensibles
     */
    static encrypt(data: string, key?: string): { encryptedData: string; key: string; iv: string; tag: string } {
        const encryptionKey = key || this.generateKey();
        const iv = crypto.randomBytes(this.IV_LENGTH);
        
        const cipher = crypto.createCipher(this.ALGORITHM, Buffer.from(encryptionKey, 'hex'));
        cipher.setAAD(Buffer.from('profitum-aad', 'utf8'));
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            encryptedData: encrypted,
            key: encryptionKey,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }

    /**
     * Déchiffre des données sensibles
     */
    static decrypt(encryptedData: string, key: string, iv: string, tag: string): string {
        const decipher = crypto.createDecipher(this.ALGORITHM, Buffer.from(key, 'hex'));
        decipher.setAAD(Buffer.from('profitum-aad', 'utf8'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Chiffre des données sensibles pour stockage en base
     */
    static encryptForStorage(data: string): string {
        const result = this.encrypt(data);
        return JSON.stringify({
            encrypted: result.encryptedData,
            iv: result.iv,
            tag: result.tag,
            algorithm: this.ALGORITHM,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Déchiffre des données depuis le stockage
     */
    static decryptFromStorage(encryptedJson: string, key: string): string {
        const data = JSON.parse(encryptedJson);
        return this.decrypt(data.encrypted, key, data.iv, data.tag);
    }

    /**
     * Hash sécurisé pour les mots de passe
     */
    static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
        const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
        
        return { hash, salt: passwordSalt };
    }

    /**
     * Vérifie un mot de passe
     */
    static verifyPassword(password: string, hash: string, salt: string): boolean {
        const { hash: computedHash } = this.hashPassword(password, salt);
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    }

    /**
     * Génère un token sécurisé
     */
    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}

/**
 * Gestionnaire de clés cryptographiques
 * Conformité ISO 27001 - A.10.1.2 Gestion des clés
 */
export class KeyManager {
    private static readonly MASTER_KEY_ENV = 'PROFITUM_MASTER_KEY';

    /**
     * Initialise le gestionnaire de clés
     */
    static initialize(): void {
        if (!process.env[this.MASTER_KEY_ENV]) {
            const masterKey = DataEncryption.generateKey();
            console.warn(`⚠️  MASTER_KEY non définie. Génération automatique: ${masterKey}`);
            console.warn('⚠️  Définissez PROFITUM_MASTER_KEY dans vos variables d\'environnement');
        }
    }

    /**
     * Récupère la clé maître
     */
    static getMasterKey(): string {
        const masterKey = process.env[this.MASTER_KEY_ENV];
        if (!masterKey) {
            throw new Error('MASTER_KEY non définie dans les variables d\'environnement');
        }
        return masterKey;
    }

    /**
     * Génère une clé dérivée pour un usage spécifique
     */
    static deriveKey(purpose: string): string {
        const masterKey = this.getMasterKey();
        const derivedKey = crypto.pbkdf2Sync(
            masterKey,
            `profitum-${purpose}`,
            10000,
            32,
            'sha512'
        ).toString('hex');
        
        return derivedKey;
    }
}

// Initialisation automatique
KeyManager.initialize();
