import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types pour le stockage de documents
export interface DocumentFile {
  id: string;
  document_id?: string;
  client_id: string;
  expert_id?: string;
  audit_id?: string;
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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UploadFileRequest {
  file: File | Buffer;
  client_id?: string;
  expert_id?: string;
  audit_id?: string;
  category: DocumentFile['category'];
  description?: string;
  tags?: string[];
  access_level?: DocumentFile['access_level'];
  expires_at?: Date;
  uploaded_by: string;
  user_type: 'client' | 'expert' | 'admin';
}

export interface FileUploadResponse {
  success: boolean;
  file_id?: string;
  file_path?: string;
  error?: string;
  metadata?: Partial<DocumentFile>;
}

export interface FileDownloadResponse {
  success: boolean;
  file_url?: string;
  file_data?: Buffer;
  error?: string;
  metadata?: Partial<DocumentFile>;
}

export interface FileListResponse {
  success: boolean;
  files?: DocumentFile[];
  total?: number;
  error?: string;
}

export class EnhancedDocumentStorageService {
  
  // ===== GESTION DES BUCKETS =====
  
  /**
   * Détermine le bucket approprié selon le type d'utilisateur
   */
  private getBucketName(userType: string, userId: string): string {
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

  /**
   * Crée un bucket si nécessaire
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error && error.message.includes('not found')) {
        // Créer le bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
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
          fileSizeLimit: bucketName === 'admin-documents' ? 104857600 : // 100MB
                         bucketName === 'expert-documents' ? 52428800 : // 50MB
                         10485760 // 10MB pour les autres
        });

        if (createError) {
          console.error('Erreur création bucket:', createError);
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
  
  /**
   * Upload un fichier vers le bucket approprié
   */
  async uploadFile(request: UploadFileRequest): Promise<FileUploadResponse> {
    try {
      const { file, client_id, expert_id, audit_id, category, description, tags, access_level, expires_at, uploaded_by, user_type } = request;
      
      // Déterminer le bucket
      const bucketName = this.getBucketName(user_type, uploaded_by);
      
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
      switch (user_type) {
        case 'client':
          filePath = `${client_id}/${category}/${storedFilename}`;
          break;
        case 'expert':
          filePath = `${expert_id}/${category}/${storedFilename}`;
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
          client_id,
          expert_id,
          audit_id,
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
          is_public: access_level === 'public',
          access_level: access_level || 'private',
          expires_at: expires_at?.toISOString(),
          uploaded_by
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
      await this.logFileActivity(dbData.id, uploaded_by, 'upload');

      return {
        success: true,
        file_id: dbData.id,
        file_path: filePath,
        metadata: dbData
      };

    } catch (error) {
      console.error('Erreur upload fichier:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'upload du fichier'
      };
    }
  }

  // ===== TÉLÉCHARGEMENT DE FICHIERS =====
  
  /**
   * Télécharger un fichier
   */
  async downloadFile(fileId: string, userId: string, userType: string): Promise<FileDownloadResponse> {
    try {
      // Vérifier les permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, userType, 'view');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Accès non autorisé à ce fichier'
        };
      }

      // Récupérer les métadonnées du fichier
      const { data: fileData, error: fileError } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        return {
          success: false,
          error: 'Fichier non trouvé'
        };
      }

      // Télécharger depuis Supabase Storage
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(fileData.bucket_name)
        .download(fileData.file_path);

      if (downloadError) {
        return {
          success: false,
          error: `Erreur téléchargement: ${downloadError.message}`
        };
      }

      // Conversion Blob -> Buffer
      const buffer = Buffer.from(await downloadData.arrayBuffer());
      return {
        success: true,
        file_data: buffer,
        metadata: fileData
      };

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      return {
        success: false,
        error: 'Erreur lors du téléchargement'
      };
    }
  }

  // ===== LISTAGE DE FICHIERS =====
  
  /**
   * Lister les fichiers d'un client
   */
  async listClientFiles(clientId: string, userId: string, userType: string, filters?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileListResponse> {
    try {
      // Vérifier les permissions
      if (userType !== 'admin' && userType !== 'expert' && userId !== clientId) {
        return {
          success: false,
          error: 'Accès non autorisé'
        };
      }

      let query = supabase
        .from('DocumentFile')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: files, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: `Erreur récupération fichiers: ${error.message}`
        };
      }

      return {
        success: true,
        files: files || [],
        total: count || 0
      };

    } catch (error) {
      console.error('Erreur listage fichiers:', error);
      return {
        success: false,
        error: 'Erreur lors du listage des fichiers'
      };
    }
  }

  /**
   * Lister les fichiers d'un expert
   */
  async listExpertFiles(expertId: string, userId: string, userType: string, filters?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileListResponse> {
    try {
      // Vérifier les permissions
      if (userType !== 'admin' && userId !== expertId) {
        return {
          success: false,
          error: 'Accès non autorisé'
        };
      }

      let query = supabase
        .from('DocumentFile')
        .select('*')
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: files, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: `Erreur récupération fichiers: ${error.message}`
        };
      }

      return {
        success: true,
        files: files || [],
        total: count || 0
      };

    } catch (error) {
      console.error('Erreur listage fichiers expert:', error);
      return {
        success: false,
        error: 'Erreur lors du listage des fichiers'
      };
    }
  }

  // ===== VALIDATION DE FICHIERS =====
  
  /**
   * Valider un fichier
   */
  async validateFile(fileId: string, validatedBy: string, userType: string, status: 'approved' | 'rejected' | 'requires_revision', comment?: string): Promise<boolean> {
    try {
      // Vérifier les permissions (seuls les admins et experts peuvent valider)
      if (userType !== 'admin' && userType !== 'expert') {
        return false;
      }

      const { error } = await supabase
        .from('DocumentFile')
        .update({
          validation_status: status,
          validated_by: validatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) {
        console.error('Erreur validation:', error);
        return false;
      }

      // Enregistrer l'activité
      await this.logFileActivity(fileId, validatedBy, `validate_${status}`);

      return true;
    } catch (error) {
      console.error('Erreur validation fichier:', error);
      return false;
    }
  }

  // ===== SUPPRESSION DE FICHIERS =====
  
  /**
   * Supprimer un fichier
   */
  async deleteFile(fileId: string, userId: string, userType: string): Promise<boolean> {
    try {
      // Vérifier les permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, userType, 'delete');
      if (!hasPermission) {
        return false;
      }

      // Récupérer les métadonnées du fichier
      const { data: fileData, error: fileError } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        return false;
      }

      // Supprimer du stockage
      const { error: storageError } = await supabase.storage
        .from(fileData.bucket_name)
        .remove([fileData.file_path]);

      if (storageError) {
        console.error('Erreur suppression stockage:', storageError);
        return false;
      }

      // Marquer comme supprimé en base
      const { error: dbError } = await supabase
        .from('DocumentFile')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Erreur suppression base:', dbError);
        return false;
      }

      // Enregistrer l'activité
      await this.logFileActivity(fileId, userId, 'delete');

      return true;
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      return false;
    }
  }

  // ===== PARTAGE DE FICHIERS =====
  
  /**
   * Partager un fichier
   */
  async shareFile(fileId: string, sharedBy: string, sharedWithEmail: string, permissions: {
    view: boolean;
    download: boolean;
  }, expiresAt?: Date): Promise<{ success: boolean; shareToken?: string; error?: string }> {
    try {
      // Vérifier que l'utilisateur peut partager ce fichier
      const { data: fileData, error: fileError } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        return { success: false, error: 'Fichier non trouvé' };
      }

      // Générer un token de partage
      const shareToken = this.generateShareToken(fileId, sharedWithEmail, permissions, expiresAt);

      // Enregistrer le partage
      const { error: shareError } = await supabase
        .from('DocumentShare')
        .insert({
          file_id: fileId,
          shared_by: sharedBy,
          shared_with_email: sharedWithEmail,
          permissions: permissions,
          share_token: shareToken,
          expires_at: expiresAt?.toISOString()
        });

      if (shareError) {
        return { success: false, error: `Erreur partage: ${shareError.message}` };
      }

      return { success: true, shareToken };

    } catch (error) {
      console.error('Erreur partage fichier:', error);
      return { success: false, error: 'Erreur lors du partage' };
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Vérifier les permissions d'accès à un fichier
   */
  private async checkFilePermission(fileId: string, userId: string, userType: string, action: 'view' | 'download' | 'update' | 'delete'): Promise<boolean> {
    try {
      const { data: fileData, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error || !fileData) {
        return false;
      }

      // Les admins ont tous les droits
      if (userType === 'admin') {
        return true;
      }

      // Vérifier selon le type d'action
      switch (action) {
        case 'view':
        case 'download':
          // Le propriétaire peut voir/télécharger
          if (fileData.client_id === userId || fileData.expert_id === userId) {
            return true;
          }
          // Les experts peuvent voir les fichiers de leurs clients assignés
          if (userType === 'expert') {
            const { data: assignment } = await supabase
              .from('ExpertAssignment')
              .select('*')
              .eq('expert_id', userId)
              .eq('client_id', fileData.client_id)
              .single();
            return !!assignment;
          }
          break;

        case 'update':
        case 'delete':
          // Seul le propriétaire peut modifier/supprimer
          return fileData.client_id === userId || fileData.expert_id === userId;
      }

      return false;
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return false;
    }
  }

  /**
   * Enregistrer l'activité sur un fichier
   */
  private async logFileActivity(fileId: string, userId: string, action: string): Promise<void> {
    try {
      await supabase
        .from('DocumentActivity')
        .insert({
          file_id: fileId,
          user_id: userId,
          action: action,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur log activité:', error);
    }
  }

  /**
   * Générer un token de partage
   */
  private generateShareToken(fileId: string, email: string, permissions: any, expiresAt?: Date): string {
    const payload = {
      fileId,
      email,
      permissions,
      expiresAt: expiresAt?.toISOString(),
      timestamp: Date.now()
    };
    
    // En production, utiliser une vraie signature JWT
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Obtenir le type MIME d'un fichier
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
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
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Obtenir le type de document
   */
  private getDocumentType(extension: string): DocumentFile['document_type'] {
    const documentTypes: { [key: string]: DocumentFile['document_type'] } = {
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
    
    return documentTypes[extension.toLowerCase()] || 'pdf';
  }

  // ===== STATISTIQUES =====
  
  /**
   * Obtenir les statistiques des fichiers d'un client
   */
  async getClientFileStats(clientId: string): Promise<{
    success: boolean;
    stats?: {
      total_files: number;
      total_size: number;
      files_by_category: { [key: string]: number };
      files_by_status: { [key: string]: number };
      recent_uploads: number;
    };
    error?: string;
  }> {
    try {
      const { data: files, error } = await supabase
        .from('DocumentFile')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'uploaded');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total_files: files?.length || 0,
        total_size: files?.reduce((sum, file) => sum + file.file_size, 0) || 0,
        files_by_category: {} as { [key: string]: number },
        files_by_status: {} as { [key: string]: number },
        recent_uploads: files?.filter(file => {
          const uploadDate = new Date(file.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return uploadDate > weekAgo;
        }).length || 0
      };

      // Calculer les statistiques par catégorie et statut
      files?.forEach(file => {
        stats.files_by_category[file.category] = (stats.files_by_category[file.category] || 0) + 1;
        stats.files_by_status[file.validation_status] = (stats.files_by_status[file.validation_status] || 0) + 1;
      });

      return { success: true, stats };

    } catch (error) {
      console.error('Erreur statistiques:', error);
      return { success: false, error: 'Erreur lors du calcul des statistiques' };
    }
  }
} 