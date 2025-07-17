import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types de documents sensibles
export enum SensitiveDocumentType {
  FISCAL = 'fiscal',           // Avis d'imposition, déclarations
  COMPTABLE = 'comptable',     // Bilans, comptes de résultat
  JURIDIQUE = 'juridique',     // Contrats, statuts
  RH = 'rh',                   // Fiches de paie, contrats de travail
  BANCAIRE = 'bancaire',       // Relevés bancaires
  ASSURANCE = 'assurance',     // Polices d'assurance
  AUTRE_SENSIBLE = 'autre_sensible'
}

// Niveaux de chiffrement
export enum EncryptionLevel {
  STANDARD = 'standard',       // AES-256-GCM
  HIGH = 'high',               // AES-256-GCM + clé dérivée
  MAXIMUM = 'maximum'          // AES-256-GCM + clé dérivée + chiffrement supplémentaire
}

export interface EncryptedDocument {
  originalContent: Buffer;
  encryptedContent: Buffer;
  encryptionKey: string;
  iv: Buffer;
  algorithm: string;
  encryptionLevel: EncryptionLevel;
  keyVersion: string;
  checksum: string;
  metadata: {
    sensitiveType: SensitiveDocumentType;
    retentionPeriod: number; // en années
    legalRequirements: string[];
    accessLogRequired: boolean;
  };
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 32;
  private readonly tagLength = 16;

  /**
   * Chiffrer un document selon son niveau de sensibilité
   */
  async encryptDocument(
    content: Buffer,
    sensitiveType: SensitiveDocumentType,
    userId: string,
    documentId: string
  ): Promise<EncryptedDocument> {
    try {
      // Déterminer le niveau de chiffrement selon le type
      const encryptionLevel = this.getEncryptionLevel(sensitiveType);
      
      // Générer les clés et vecteurs d'initialisation
      const { key, iv, salt } = await this.generateKeys(encryptionLevel, userId, documentId);
      
      // Chiffrer le contenu
      const encryptedContent = await this.encryptContent(content, key, iv);
      
      // Calculer le checksum
      const checksum = this.calculateChecksum(content);
      
      // Obtenir les métadonnées de rétention
      const metadata = this.getRetentionMetadata(sensitiveType);
      
      // Stocker la clé de manière sécurisée
      const keyId = await this.storeKey(key, encryptionLevel, userId, documentId);
      
      return {
        originalContent: content,
        encryptedContent,
        encryptionKey: keyId,
        iv,
        algorithm: this.algorithm,
        encryptionLevel,
        keyVersion: 'v1',
        checksum,
        metadata
      };
    } catch (error) {
      console.error('Erreur chiffrement document:', error);
      throw new Error('Erreur lors du chiffrement du document');
    }
  }

  /**
   * Déchiffrer un document
   */
  async decryptDocument(encryptedDoc: EncryptedDocument, userId: string): Promise<Buffer> {
    try {
      // Vérifier les permissions d'accès
      await this.verifyAccess(encryptedDoc.encryptionKey, userId);
      
      // Récupérer la clé
      const key = await this.retrieveKey(encryptedDoc.encryptionKey, userId);
      
      // Déchiffrer le contenu
      const decryptedContent = await this.decryptContent(
        encryptedDoc.encryptedContent,
        key,
        encryptedDoc.iv
      );
      
      // Vérifier le checksum
      const expectedChecksum = this.calculateChecksum(decryptedContent);
      if (expectedChecksum !== encryptedDoc.checksum) {
        throw new Error('Intégrité du document compromise');
      }
      
      // Logger l'accès
      await this.logAccess(encryptedDoc, userId, 'decrypt');
      
      return decryptedContent;
    } catch (error) {
      console.error('Erreur déchiffrement document:', error);
      throw new Error('Erreur lors du déchiffrement du document');
    }
  }

  /**
   * Déterminer le niveau de chiffrement selon le type de document
   */
  private getEncryptionLevel(sensitiveType: SensitiveDocumentType): EncryptionLevel {
    switch (sensitiveType) {
      case SensitiveDocumentType.FISCAL:
      case SensitiveDocumentType.COMPTABLE:
      case SensitiveDocumentType.BANCAIRE:
        return EncryptionLevel.MAXIMUM;
      case SensitiveDocumentType.JURIDIQUE:
      case SensitiveDocumentType.RH:
        return EncryptionLevel.HIGH;
      default:
        return EncryptionLevel.STANDARD;
    }
  }

  /**
   * Générer les clés de chiffrement
   */
  private async generateKeys(
    level: EncryptionLevel,
    userId: string,
    documentId: string
  ): Promise<{ key: Buffer; iv: Buffer; salt: Buffer }> {
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);
    
    let key: Buffer;
    
    switch (level) {
      case EncryptionLevel.MAXIMUM:
        // Clé dérivée avec PBKDF2 + clé maître
        const masterKey = await this.getMasterKey();
        const derivedKey = crypto.pbkdf2Sync(
          masterKey,
          salt,
          100000, // 100k itérations
          this.keyLength,
          'sha512'
        );
        key = derivedKey;
        break;
        
      case EncryptionLevel.HIGH:
        // Clé dérivée avec PBKDF2
        key = crypto.pbkdf2Sync(
          userId + documentId,
          salt,
          50000, // 50k itérations
          this.keyLength,
          'sha512'
        );
        break;
        
      default:
        // Clé standard
        key = crypto.randomBytes(this.keyLength);
    }
    
    return { key, iv, salt };
  }

  /**
   * Chiffrer le contenu
   */
  private async encryptContent(content: Buffer, key: Buffer, iv: Buffer): Promise<Buffer> {
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(iv);
    
    const encrypted = Buffer.concat([
      cipher.update(content),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([encrypted, tag]);
  }

  /**
   * Déchiffrer le contenu
   */
  private async decryptContent(encryptedContent: Buffer, key: Buffer, iv: Buffer): Promise<Buffer> {
    const tag = encryptedContent.slice(-this.tagLength);
    const encrypted = encryptedContent.slice(0, -this.tagLength);
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted;
  }

  /**
   * Calculer le checksum SHA-256
   */
  private calculateChecksum(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Obtenir les métadonnées de rétention légale
   */
  private getRetentionMetadata(sensitiveType: SensitiveDocumentType) {
    const metadata: { [key in SensitiveDocumentType]: any } = {
      [SensitiveDocumentType.FISCAL]: {
        retentionPeriod: 10, // 10 ans pour documents fiscaux
        legalRequirements: ['Code général des impôts', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.COMPTABLE]: {
        retentionPeriod: 10, // 10 ans pour documents comptables
        legalRequirements: ['Code de commerce', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.JURIDIQUE]: {
        retentionPeriod: 30, // 30 ans pour documents juridiques
        legalRequirements: ['Code civil', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.RH]: {
        retentionPeriod: 5, // 5 ans pour documents RH
        legalRequirements: ['Code du travail', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.BANCAIRE]: {
        retentionPeriod: 5, // 5 ans pour relevés bancaires
        legalRequirements: ['Code monétaire et financier', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.ASSURANCE]: {
        retentionPeriod: 10, // 10 ans pour polices d'assurance
        legalRequirements: ['Code des assurances', 'RGPD'],
        accessLogRequired: true
      },
      [SensitiveDocumentType.AUTRE_SENSIBLE]: {
        retentionPeriod: 5, // 5 ans par défaut
        legalRequirements: ['RGPD'],
        accessLogRequired: true
      }
    };
    
    return metadata[sensitiveType];
  }

  /**
   * Stocker la clé de manière sécurisée
   */
  private async storeKey(
    key: Buffer,
    level: EncryptionLevel,
    userId: string,
    documentId: string
  ): Promise<string> {
    const keyId = crypto.randomUUID();
    
    // Chiffrer la clé avant stockage
    const masterKey = await this.getMasterKey();
    const keyIv = crypto.randomBytes(this.ivLength);
    const keyCipher = crypto.createCipher('aes-256-gcm', masterKey);
    keyCipher.setAAD(keyIv);
    
    const encryptedKey = Buffer.concat([
      keyCipher.update(key),
      keyCipher.final()
    ]);
    
    const keyTag = keyCipher.getAuthTag();
    
    // Stocker dans la base de données
    await supabase
      .from('EncryptionKeys')
      .insert({
        id: keyId,
        encrypted_key: Buffer.concat([encryptedKey, keyTag]).toString('base64'),
        iv: keyIv.toString('base64'),
        encryption_level: level,
        user_id: userId,
        document_id: documentId,
        created_at: new Date().toISOString()
      });
    
    return keyId;
  }

  /**
   * Récupérer la clé
   */
  private async retrieveKey(keyId: string, userId: string): Promise<Buffer> {
    const { data, error } = await supabase
      .from('EncryptionKeys')
      .select('*')
      .eq('id', keyId)
      .single();
    
    if (error || !data) {
      throw new Error('Clé de chiffrement non trouvée');
    }
    
    // Vérifier les permissions
    if (data.user_id !== userId) {
      throw new Error('Accès non autorisé à la clé de chiffrement');
    }
    
    // Déchiffrer la clé
    const masterKey = await this.getMasterKey();
    const encryptedKeyWithTag = Buffer.from(data.encrypted_key, 'base64');
    const keyIv = Buffer.from(data.iv, 'base64');
    
    const tag = encryptedKeyWithTag.slice(-this.tagLength);
    const encryptedKey = encryptedKeyWithTag.slice(0, -this.tagLength);
    
    const keyDecipher = crypto.createDecipher('aes-256-gcm', masterKey);
    keyDecipher.setAAD(keyIv);
    keyDecipher.setAuthTag(tag);
    
    const key = Buffer.concat([
      keyDecipher.update(encryptedKey),
      keyDecipher.final()
    ]);
    
    return key;
  }

  /**
   * Obtenir la clé maître (depuis variable d'environnement ou service externe)
   */
  private async getMasterKey(): Promise<Buffer> {
    const masterKeyEnv = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyEnv) {
      throw new Error('Clé maître de chiffrement non configurée');
    }
    
    return Buffer.from(masterKeyEnv, 'base64');
  }

  /**
   * Vérifier les permissions d'accès
   */
  private async verifyAccess(keyId: string, userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('EncryptionKeys')
      .select('user_id, document_id')
      .eq('id', keyId)
      .single();
    
    if (error || !data) {
      throw new Error('Clé de chiffrement non trouvée');
    }
    
    // Vérifier si l'utilisateur a accès au document
    if (data.user_id !== userId) {
      // Vérifier les permissions de partage
      const { data: shareData } = await supabase
        .from('DocumentShare')
        .select('*')
        .eq('document_file_id', data.document_id)
        .eq('shared_with', userId)
        .eq('active', true)
        .single();
      
      if (!shareData) {
        throw new Error('Accès non autorisé au document');
      }
    }
  }

  /**
   * Logger l'accès au document
   */
  private async logAccess(
    encryptedDoc: EncryptedDocument,
    userId: string,
    action: string
  ): Promise<void> {
    await supabase
      .from('DocumentAccessLog')
      .insert({
        document_file_id: encryptedDoc.encryptionKey, // Utiliser la clé comme référence
        user_id: userId,
        user_role: 'client', // À adapter selon le contexte
        action,
        ip_address: '[::1]', // À récupérer depuis la requête
        user_agent: 'API', // À récupérer depuis la requête
        metadata: {
          encryption_level: encryptedDoc.encryptionLevel,
          sensitive_type: encryptedDoc.metadata.sensitiveType,
          checksum_verified: true
        },
        created_at: new Date().toISOString()
      });
  }

  /**
   * Rotation automatique des clés
   */
  async rotateKeys(): Promise<void> {
    // Logique de rotation des clés
    // À implémenter selon les besoins de sécurité
  }

  /**
   * Nettoyer les anciennes clés
   */
  async cleanupOldKeys(): Promise<void> {
    // Supprimer les clés expirées
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await supabase
      .from('EncryptionKeys')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());
  }
}

export default EncryptionService; 