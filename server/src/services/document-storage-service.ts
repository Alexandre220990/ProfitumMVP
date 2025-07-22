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
  client_id: string;
  audit_id?: string;
  category: DocumentFile['category'];
  description?: string;
  tags?: string[];
  access_level?: DocumentFile['access_level'];
  expires_at?: Date;
  uploaded_by: string;
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

export class DocumentStorageService {
  
  // ===== GESTION DES BUCKETS =====
  
  /**
   * Crée un bucket pour un client spécifique
   */
  async createClientBucket(clientId: string): Promise<boolean> {
    try {
      const bucketName = `client-${clientId}`;
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
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

      return true;
    } catch (error) {
      console.error('Erreur création bucket:', error);
      return false;
    }
  }

  // ===== UPLOAD DE FICHIERS =====
  
  /**
   * Upload un fichier vers Supabase Storage
   */
  async uploadFile(request: UploadFileRequest): Promise<FileUploadResponse> {
    try {
      const { file, client_id, audit_id, category, description, tags, access_level, expires_at, uploaded_by } = request;
      
      // Générer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const originalName = file instanceof File ? file.name : 'uploaded-file';
      const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
      const storedFilename = `${category}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // Déterminer le bucket et le chemin
      const bucketName = `client-${client_id}`;
      const filePath = `${category}/${storedFilename}`;
      
      // Vérifier/créer le bucket
      await this.createClientBucket(client_id);
      
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
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // ===== TÉLÉCHARGEMENT DE FICHIERS =====
  
  /**
   * Télécharger un fichier depuis Supabase Storage
   */
  async downloadFile(fileId: string, userId: string): Promise<FileDownloadResponse> {
    try {
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

      // Vérifier les permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, 'download');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission refusée'
        };
      }

      // Générer l'URL de téléchargement signée
      const { data: urlData, error: urlError } = await supabase.storage
        .from(fileData.bucket_name)
        .createSignedUrl(fileData.file_path, 3600); // 1 heure

      if (urlError) {
        console.error('Erreur génération URL:', urlError);
        return {
          success: false,
          error: `Erreur génération URL: ${urlError.message}`
        };
      }

      // Enregistrer l'activité
      await this.logFileActivity(fileId, userId, 'download');

      return {
        success: true,
        file_url: urlData.signedUrl,
        metadata: fileData
      };

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // ===== LISTE DES FICHIERS =====
  
  /**
   * Lister les fichiers d'un client
   */
  async listClientFiles(clientId: string, filters?: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileListResponse> {
    try {
      let query = supabase
        .from('DocumentFile')
        .select('*', { count: 'exact' })
        .eq('client_id', clientId)
        .is('deleted_at', null);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Pagination stricte
      const limit = filters?.limit ?? 20;
      const offset = filters?.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur liste fichiers:', error);
        return {
          success: false,
          error: `Erreur liste fichiers: ${error.message}`
        };
      }

      return {
        success: true,
        files: data || [],
        total: count || 0
      };

    } catch (error) {
      console.error('Erreur liste fichiers:', error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // ===== VALIDATION DE FICHIERS =====
  
  /**
   * Valider un fichier
   */
  async validateFile(fileId: string, validatedBy: string, status: 'approved' | 'rejected' | 'requires_revision', comment?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('DocumentFile')
        .update({
          validation_status: status,
          status: status === 'approved' ? 'validated' : 'rejected',
          validated_by: validatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) {
        console.error('Erreur validation:', error);
        return false;
      }

      // Enregistrer l'activité
      await this.logFileActivity(fileId, validatedBy, status === 'approved' ? 'validate' : 'reject');

      return true;
    } catch (error) {
      console.error('Erreur validation fichier:', error);
      return false;
    }
  }

  // ===== SUPPRESSION DE FICHIERS =====
  
  /**
   * Supprimer un fichier (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Vérifier les permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, 'delete');
      if (!hasPermission) {
        return false;
      }

      // Soft delete en base
      const { error: dbError } = await supabase
        .from('DocumentFile')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (dbError) {
        console.error('Erreur suppression DB:', dbError);
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
   * Partager un fichier avec un autre utilisateur
   */
  async shareFile(fileId: string, sharedBy: string, sharedWithEmail: string, permissions: {
    view: boolean;
    download: boolean;
  }, expiresAt?: Date): Promise<{ success: boolean; shareToken?: string; error?: string }> {
    try {
      // Générer un token de partage unique
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('DocumentFileShare')
        .insert({
          file_id: fileId,
          shared_by: sharedBy,
          shared_with_email: sharedWithEmail,
          share_token: shareToken,
          permissions,
          expires_at: expiresAt?.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur partage:', error);
        return {
          success: false,
          error: `Erreur partage: ${error.message}`
        };
      }

      return {
        success: true,
        shareToken
      };
    } catch (error) {
      console.error('Erreur partage fichier:', error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // ===== FONCTIONS UTILITAIRES =====
  
  /**
   * Vérifier les permissions d'un utilisateur sur un fichier
   */
  private async checkFilePermission(fileId: string, userId: string, action: 'view' | 'download' | 'update' | 'delete'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('DocumentFilePermission')
        .select('*')
        .eq('file_id', fileId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      switch (action) {
        case 'view':
          return data.can_view;
        case 'download':
          return data.can_download;
        case 'update':
          return data.can_update;
        case 'delete':
          return data.can_delete;
        default:
          return false;
      }
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
        .from('DocumentFileAccessLog')
        .insert({
          file_id: fileId,
          user_id: userId,
          action,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur log activité:', error);
    }
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

    return documentTypes[extension.toLowerCase()] || 'txt';
  }

  // ===== STATISTIQUES =====
  
  /**
   * Obtenir les statistiques de fichiers d'un client
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
      const { data, error } = await supabase
        .rpc('get_client_file_stats', { client_uuid: clientId });

      if (error) {
        console.error('Erreur statistiques:', error);
        return {
          success: false,
          error: `Erreur statistiques: ${error.message}`
        };
      }

      return {
        success: true,
        stats: data[0]
      };

    } catch (error) {
      console.error('Erreur statistiques fichiers:', error);
      return {
        success: false,
        error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}

export default DocumentStorageService; 