import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import { Database } from '../types/supabase';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// SERVICE DOCUMENTAIRE UNIFIÉ RÉVOLUTIONNAIRE
// ============================================================================
// Inspiré par Ryan Dahl (Node.js) - Event-driven architecture
// Performance, scalabilité et simplicité

// Types unifiés
export interface DocumentFile {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  category: 'charte' | 'rapport' | 'audit' | 'simulation' | 'guide' | 'facture' | 'contrat' | 'certificat' | 'formulaire' | 'autre';
  document_type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'txt' | 'csv' | 'zip' | 'rar';
  description?: string;
  tags: string[];
  status: 'uploaded' | 'validated' | 'rejected' | 'archived' | 'deleted';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  is_public: boolean;
  is_encrypted: boolean;
  access_level: 'public' | 'private' | 'restricted' | 'confidential';
  expires_at?: Date;
  download_count: number;
  last_downloaded?: Date;
  uploaded_by?: string;
  validated_by?: string;
  client_id?: string;
  expert_id?: string;
  audit_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UploadRequest {
  file: File | Buffer;
  userId: string;
  userType: 'client' | 'expert' | 'admin';
  category: string;
  description?: string;
  tags?: string[];
  accessLevel?: 'public' | 'private' | 'restricted' | 'confidential';
  expiresAt?: Date;
  clientId?: string;
  expertId?: string;
  auditId?: string;
}

export interface UploadResponse {
  success: boolean;
  fileId?: string;
  filePath?: string;
  metadata?: DocumentFile;
  error?: string;
}

export interface DocumentStats {
  total_files: number;
  total_size: number;
  recent_uploads: number;
  files_by_category: Record<string, number>;
  files_by_status: Record<string, number>;
  files_by_access_level: Record<string, number>;
}

// Événements du système
export enum DocumentEvents {
  FILE_UPLOADED = 'file:uploaded',
  FILE_DELETED = 'file:deleted',
  FILE_DOWNLOADED = 'file:downloaded',
  FILE_SHARED = 'file:shared',
  FILE_VALIDATED = 'file:validated',
  ERROR_OCCURRED = 'error:occurred'
}

// Service principal unifié
export class UnifiedDocumentService extends EventEmitter {
  private static instance: UnifiedDocumentService;
  
  private constructor() {
    super();
    this.setupEventHandlers();
  }

  public static getInstance(): UnifiedDocumentService {
    if (!UnifiedDocumentService.instance) {
      UnifiedDocumentService.instance = new UnifiedDocumentService();
    }
    return UnifiedDocumentService.instance;
  }

  // ===== GESTION DES ÉVÉNEMENTS =====
  
  private setupEventHandlers() {
    this.on(DocumentEvents.FILE_UPLOADED, (file: DocumentFile) => {
      console.log(`📁 Fichier uploadé: ${file.original_filename}`);
      this.updateStats(file.uploaded_by || '');
    });

    this.on(DocumentEvents.FILE_DELETED, (fileId: string) => {
      console.log(`🗑️ Fichier supprimé: ${fileId}`);
    });

    this.on(DocumentEvents.ERROR_OCCURRED, (error: Error) => {
      console.error(`❌ Erreur documentaire: ${error.message}`);
    });
  }

  // ===== GESTION DES BUCKETS =====
  
  private getBucketName(userType: string): string {
    switch (userType) {
      case 'client':
        return 'client-documents';
      case 'expert':
        return 'expert-documents';
      case 'admin':
        return 'admin-documents';
      default:
        throw new Error(`Type d'utilisateur non supporté: ${userType}`);
    }
  }

  private async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: false,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'text/csv',
            'application/zip',
            'application/x-rar-compressed'
          ],
          fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
          console.error('Erreur création bucket:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification bucket:', error);
      return false;
    }
  }

  // ===== UPLOAD DE FICHIERS =====
  
  async uploadFile(request: UploadRequest): Promise<UploadResponse> {
    try {
      const { file, userId, userType, category, description, tags, accessLevel, expiresAt, clientId, expertId, auditId } = request;
      
      // Déterminer le bucket
      const bucketName = this.getBucketName(userType);
      
      // Vérifier/créer le bucket
      const bucketExists = await this.ensureBucketExists(bucketName);
      if (!bucketExists) {
        return {
          success: false,
          error: 'Impossible de créer le bucket de stockage'
        };
      }

      // Générer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const originalName = file instanceof File ? file.name : 'uploaded-file';
      const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
      const storedFilename = `${category}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // Déterminer le chemin selon le type d'utilisateur
      let filePath: string;
      switch (userType) {
        case 'client':
          filePath = `${clientId || userId}/${category}/${storedFilename}`;
          break;
        case 'expert':
          filePath = `${expertId || userId}/${category}/${storedFilename}`;
          break;
        case 'admin':
          filePath = `${category}/${storedFilename}`;
          break;
        default:
          filePath = `${category}/${storedFilename}`;
      }
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        return {
          success: false,
          error: `Erreur upload: ${uploadError.message}`
        };
      }

      // Obtenir les métadonnées du fichier
      const fileSize = file instanceof File ? file.size : (file as Buffer).length;
      const mimeType = file instanceof File ? file.type : this.getMimeType(extension);
      
      // Enregistrer en base de données
      const { data: dbData, error: dbError } = await supabase
        .from('DocumentFile')
        .insert({
          client_id: clientId,
          expert_id: expertId,
          audit_id: auditId,
          original_filename: originalName,
          stored_filename: storedFilename,
          file_path: filePath,
          bucket_name: bucketName,
          file_size: fileSize,
          mime_type: mimeType,
          file_extension: extension,
          category,
          document_type: this.getDocumentType(extension),
          description,
          tags: tags || [],
          status: 'uploaded',
          validation_status: 'pending',
          is_public: accessLevel === 'public',
          access_level: accessLevel || 'private',
          expires_at: expiresAt?.toISOString(),
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erreur base de données:', dbError);
        // Supprimer le fichier uploadé en cas d'erreur DB
        await supabase.storage.from(bucketName).remove([filePath]);
        return {
          success: false,
          error: `Erreur base de données: ${dbError.message}`
        };
      }

      // Enregistrer l'activité
      await this.logFileActivity(dbData.id, userId, 'upload');

      // Émettre l'événement
      this.emit(DocumentEvents.FILE_UPLOADED, dbData);

      return {
        success: true,
        fileId: dbData.id,
        filePath,
        metadata: dbData
      };

    } catch (error) {
      console.error('Erreur upload fichier:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // ===== LISTAGE DE FICHIERS =====
  
  async listFiles(userId: string, userType: string, filters?: {
    category?: string;
    status?: string;
    search?: string;
    accessLevel?: string;
  }): Promise<DocumentFile[]> {
    try {
      let query = supabase
        .from('DocumentFile')
        .select('*');

      // Filtres selon le type d'utilisateur
      switch (userType) {
        case 'client':
          query = query.eq('client_id', userId);
          break;
        case 'expert':
          query = query.eq('expert_id', userId);
          break;
        case 'admin':
          // Les admins voient tous les fichiers
          break;
        default:
          throw new Error(`Type d'utilisateur non supporté: ${userType}`);
      }

      // Appliquer les filtres
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.accessLevel && filters.accessLevel !== 'all') {
        query = query.eq('access_level', filters.accessLevel);
      }
      if (filters?.search) {
        query = query.or(`original_filename.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Tri par date de création décroissante
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erreur listage fichiers:', error);
        throw new Error(`Erreur listage: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Erreur listage fichiers:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      throw error;
    }
  }

  // ===== TÉLÉCHARGEMENT =====
  
  async downloadFile(fileId: string, userId: string, userType: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Vérifier les permissions
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: 'Fichier non trouvé' };
      }

      if (!this.hasDownloadPermission(file, userId, userType)) {
        return { success: false, error: 'Permission refusée' };
      }

      // Générer l'URL de téléchargement
      const { data, error } = await supabase.storage
        .from(file.bucket_name)
        .createSignedUrl(file.file_path, 3600); // 1 heure

      if (error) {
        console.error('Erreur génération URL:', error);
        return { success: false, error: 'Erreur génération URL' };
      }

      // Mettre à jour le compteur de téléchargements
      await this.updateDownloadCount(fileId);

      // Émettre l'événement
      this.emit(DocumentEvents.FILE_DOWNLOADED, file);

      return { success: true, url: data.signedUrl };

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      return { success: false, error: 'Erreur téléchargement' };
    }
  }

  // ===== SUPPRESSION =====
  
  async deleteFile(fileId: string, userId: string, userType: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier les permissions
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: 'Fichier non trouvé' };
      }

      if (!this.hasDeletePermission(file, userId, userType)) {
        return { success: false, error: 'Permission refusée' };
      }

      // Supprimer du stockage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_name)
        .remove([file.file_path]);

      if (storageError) {
        console.error('Erreur suppression stockage:', storageError);
        return { success: false, error: 'Erreur suppression stockage' };
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('DocumentFile')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Erreur suppression DB:', dbError);
        return { success: false, error: 'Erreur suppression base de données' };
      }

      // Émettre l'événement
      this.emit(DocumentEvents.FILE_DELETED, fileId);

      return { success: true };

    } catch (error) {
      console.error('Erreur suppression:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      return { success: false, error: 'Erreur suppression' };
    }
  }

  // ===== PARTAGE =====
  
  async shareFile(fileId: string, shareOptions: {
    email: string;
    canDownload: boolean;
    expiresAt?: Date;
  }): Promise<{ success: boolean; shareUrl?: string; error?: string }> {
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        return { success: false, error: 'Fichier non trouvé' };
      }

      // Générer un lien de partage temporaire
      const { data, error } = await supabase.storage
        .from(file.bucket_name)
        .createSignedUrl(file.file_path, 86400); // 24 heures

      if (error) {
        console.error('Erreur génération lien partage:', error);
        return { success: false, error: 'Erreur génération lien partage' };
      }

      // Enregistrer le partage en base
      await this.logFileShare(fileId, shareOptions.email, shareOptions.canDownload, shareOptions.expiresAt);

      // Émettre l'événement
      this.emit(DocumentEvents.FILE_SHARED, { file, shareOptions });

      return { success: true, shareUrl: data.signedUrl };

    } catch (error) {
      console.error('Erreur partage:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      return { success: false, error: 'Erreur partage' };
    }
  }

  // ===== VALIDATION =====
  
  async validateFile(fileId: string, validationData: {
    status: 'approved' | 'rejected' | 'requires_revision';
    comment?: string;
    validatedBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('DocumentFile')
        .update({
          validation_status: validationData.status,
          validated_by: validationData.validatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        console.error('Erreur validation:', error);
        return { success: false, error: 'Erreur validation' };
      }

      // Émettre l'événement
      this.emit(DocumentEvents.FILE_VALIDATED, data);

      return { success: true };

    } catch (error) {
      console.error('Erreur validation:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      return { success: false, error: 'Erreur validation' };
    }
  }

  // ===== STATISTIQUES =====
  
  async getStats(userId: string): Promise<DocumentStats> {
    try {
      const { data: files, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .or(`client_id.eq.${userId},expert_id.eq.${userId},uploaded_by.eq.${userId}`);

      if (error) {
        console.error('Erreur récupération stats:', error);
        throw new Error('Erreur récupération statistiques');
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: DocumentStats = {
        total_files: files?.length || 0,
        total_size: files?.reduce((sum, file) => sum + file.file_size, 0) || 0,
        recent_uploads: files?.filter(file => new Date(file.created_at) > oneDayAgo).length || 0,
        files_by_category: {},
        files_by_status: {},
        files_by_access_level: {}
      };

      // Calculer les statistiques par catégorie
      files?.forEach(file => {
        stats.files_by_category[file.category] = (stats.files_by_category[file.category] || 0) + 1;
        stats.files_by_status[file.status] = (stats.files_by_status[file.status] || 0) + 1;
        stats.files_by_access_level[file.access_level] = (stats.files_by_access_level[file.access_level] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Erreur statistiques:', error);
      this.emit(DocumentEvents.ERROR_OCCURRED, error as Error);
      throw error;
    }
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  private async getFileById(fileId: string): Promise<DocumentFile | null> {
    const { data, error } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Erreur récupération fichier:', error);
      return null;
    }

    return data;
  }

  private hasDownloadPermission(file: DocumentFile, userId: string, userType: string): boolean {
    // Les admins peuvent tout télécharger
    if (userType === 'admin') return true;
    
    // Les utilisateurs peuvent télécharger leurs propres fichiers
    if (file.uploaded_by === userId) return true;
    
    // Les clients peuvent télécharger leurs fichiers
    if (userType === 'client' && file.client_id === userId) return true;
    
    // Les experts peuvent télécharger leurs fichiers
    if (userType === 'expert' && file.expert_id === userId) return true;
    
    return false;
  }

  private hasDeletePermission(file: DocumentFile, userId: string, userType: string): boolean {
    // Les admins peuvent tout supprimer
    if (userType === 'admin') return true;
    
    // Les utilisateurs peuvent supprimer leurs propres fichiers
    if (file.uploaded_by === userId) return true;
    
    return false;
  }

  private async updateDownloadCount(fileId: string): Promise<void> {
    await supabase
      .from('DocumentFile')
      .update({
        download_count: supabase.rpc('increment'),
        last_downloaded: new Date().toISOString()
      })
      .eq('id', fileId);
  }

  private async logFileActivity(fileId: string, userId: string, action: string): Promise<void> {
    // Logique de journalisation des activités
    console.log(`📝 Activité: ${action} sur fichier ${fileId} par utilisateur ${userId}`);
  }

  private async logFileShare(fileId: string, email: string, canDownload: boolean, expiresAt?: Date): Promise<void> {
    // Logique de journalisation des partages
    console.log(`🔗 Partage: fichier ${fileId} partagé avec ${email}`);
  }

  private async updateStats(userId: string): Promise<void> {
    // Mise à jour des statistiques en cache
    console.log(`📊 Mise à jour stats pour utilisateur ${userId}`);
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private getDocumentType(extension: string): string {
    const documentTypes: Record<string, string> = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'xls': 'xls',
      'xlsx': 'xlsx',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'jpg': 'jpg',
      'jpeg': 'jpeg',
      'png': 'png',
      'gif': 'gif',
      'txt': 'txt',
      'csv': 'csv',
      'zip': 'zip',
      'rar': 'rar'
    };
    return documentTypes[extension] || 'autre';
  }
}

// Export de l'instance singleton
export const unifiedDocumentService = UnifiedDocumentService.getInstance(); 