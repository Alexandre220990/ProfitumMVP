import { createClient } from '@supabase/supabase-js';
import { AuthUser } from '../types/auth';

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GEDDocument {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category: string;
  file_path?: string;
  last_modified: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  read_time?: number;
  version: number;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_type: 'client' | 'expert' | 'admin';
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_share: boolean;
  created_at: string;
  updated_at: string;
}

export class UnifiedDocumentService {
  
  // ===== RÉCUPÉRATION DES DOCUMENTS =====
  
  /**
   * Récupérer les documents selon le type d'utilisateur
   */
  static async getDocumentsByUserType(userType: string, userId: string): Promise<GEDDocument[]> {
    try {
      // Récupérer les permissions de l'utilisateur
      const { data: permissions, error: permError } = await supabaseClient
        .from('GEDDocumentPermission')
        .select('document_id, can_read')
        .eq('user_type', userType)
        .eq('can_read', true);

      if (permError) {
        console.error('Erreur récupération permissions:', permError);
        return [];
      }

      if (!permissions || permissions.length === 0) {
        return [];
      }

      const documentIds = permissions.map(p => p.document_id);

      // Récupérer les documents autorisés
      const { data: documents, error } = await supabaseClient
        .from('GEDDocument')
        .select('*')
        .in('id', documentIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents:', error);
        return [];
      }

      return documents || [];
    } catch (error) {
      console.error('Erreur service documents:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les documents pour l'admin
   */
  static async getAllDocumentsForAdmin(): Promise<GEDDocument[]> {
    try {
      const { data: documents, error } = await supabaseClient
        .from('GEDDocument')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents admin:', error);
        return [];
      }

      return documents || [];
    } catch (error) {
      console.error('Erreur service documents admin:', error);
      return [];
    }
  }

  /**
   * Récupérer les documents par catégorie
   */
  static async getDocumentsByCategory(category: string, userType: string): Promise<GEDDocument[]> {
    try {
      // Récupérer les permissions de l'utilisateur
      const { data: permissions, error: permError } = await supabaseClient
        .from('GEDDocumentPermission')
        .select('document_id, can_read')
        .eq('user_type', userType)
        .eq('can_read', true);

      if (permError) {
        console.error('Erreur récupération permissions:', permError);
        return [];
      }

      if (!permissions || permissions.length === 0) {
        return [];
      }

      const documentIds = permissions.map(p => p.document_id);

      // Récupérer les documents de la catégorie autorisés
      const { data: documents, error } = await supabaseClient
        .from('GEDDocument')
        .select('*')
        .in('id', documentIds)
        .eq('category', category)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération documents par catégorie:', error);
        return [];
      }

      return documents || [];
    } catch (error) {
      console.error('Erreur service documents par catégorie:', error);
      return [];
    }
  }

  // ===== GESTION DES PERMISSIONS =====

  /**
   * Vérifier les permissions d'un utilisateur sur un document
   */
  static async checkUserPermission(
    documentId: string, 
    userType: string, 
    action: 'read' | 'write' | 'delete' | 'share'
  ): Promise<boolean> {
    try {
      const { data: permission, error } = await supabaseClient
        .from('GEDDocumentPermission')
        .select(`can_${action}`)
        .eq('document_id', documentId)
        .eq('user_type', userType)
        .single();

      if (error || !permission) {
        return false;
      }

      return permission[`can_${action}`] || false;
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      return false;
    }
  }

  /**
   * Créer ou mettre à jour les permissions d'un document
   */
  static async setDocumentPermissions(
    documentId: string,
    permissions: {
      user_type: string;
      can_read: boolean;
      can_write: boolean;
      can_delete: boolean;
      can_share: boolean;
    }[]
  ): Promise<boolean> {
    try {
      // Supprimer les anciennes permissions
      await supabaseClient
        .from('GEDDocumentPermission')
        .delete()
        .eq('document_id', documentId);

      // Insérer les nouvelles permissions
      const { error } = await supabaseClient
        .from('GEDDocumentPermission')
        .insert(permissions.map(p => ({
          document_id: documentId,
          ...p,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));

      if (error) {
        console.error('Erreur mise à jour permissions:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur service permissions:', error);
      return false;
    }
  }

  // ===== CRÉATION ET MODIFICATION =====

  /**
   * Créer un nouveau document
   */
  static async createDocument(
    document: Omit<GEDDocument, 'id' | 'created_at' | 'last_modified' | 'version'>,
    permissions: {
      user_type: string;
      can_read: boolean;
      can_write: boolean;
      can_delete: boolean;
      can_share: boolean;
    }[]
  ): Promise<string | null> {
    try {
      const newDocument = {
        ...document,
        version: 1,
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('GEDDocument')
        .insert(newDocument)
        .select('id')
        .single();

      if (error || !data) {
        console.error('Erreur création document:', error);
        return null;
      }

      // Créer les permissions
      await this.setDocumentPermissions(data.id, permissions);

      return data.id;
    } catch (error) {
      console.error('Erreur service création document:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un document
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<GEDDocument>,
    userType: string
  ): Promise<boolean> {
    try {
      // Vérifier les permissions
      const canWrite = await this.checkUserPermission(documentId, userType, 'write');
      if (!canWrite) {
        return false;
      }

      const { error } = await supabaseClient
        .from('GEDDocument')
        .update({
          ...updates,
          last_modified: new Date().toISOString(),
          version: supabaseClient.raw('version + 1')
        })
        .eq('id', documentId);

      if (error) {
        console.error('Erreur mise à jour document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur service mise à jour document:', error);
      return false;
    }
  }

  /**
   * Supprimer un document
   */
  static async deleteDocument(documentId: string, userType: string): Promise<boolean> {
    try {
      // Vérifier les permissions
      const canDelete = await this.checkUserPermission(documentId, userType, 'delete');
      if (!canDelete) {
        return false;
      }

      // Soft delete - marquer comme inactif
      const { error } = await supabaseClient
        .from('GEDDocument')
        .update({ is_active: false })
        .eq('id', documentId);

      if (error) {
        console.error('Erreur suppression document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur service suppression document:', error);
      return false;
    }
  }
} 