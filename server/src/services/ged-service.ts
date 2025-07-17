import { createClient } from '@supabase/supabase-js';
import { 
  Document, 
  DocumentLabel, 
  DocumentPermission, 
  DocumentVersion,
  UserDocumentFavorite,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentFilters,
  DocumentListResponse,
  DocumentStats,
  UserPermissions,
  DocumentMetrics,
  UserDocumentActivity
} from '../types/ged';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class GEDService {
  
  // ===== GESTION DES DOCUMENTS =====

  /**
   * Récupère la liste des documents avec filtres et pagination
   */
  async getDocuments(filters: DocumentFilters, userType: string): Promise<DocumentListResponse> {
    const { 
      category, 
      search, 
      labels, 
      page = 1, 
      limit = 10, 
      sortBy = 'last_modified', 
      sortOrder = 'desc' 
    } = filters;

    const offset = (page - 1) * limit;

    // Construction de la requête de base
    let query = supabase
      .from('GEDDocument')
      .select(`
        *,
        GEDDocumentLabelRelation(
          GEDDocumentLabel(*)
        ),
        GEDDocumentPermission!inner(*)
      `, { count: 'exact' })
      .eq('GEDDocumentPermission.user_type', userType)
      .eq('GEDDocumentPermission.can_read', true)
      .eq('is_active', true);

    // Application des filtres
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (labels && labels.length > 0) {
      query = query.in('GEDDocumentLabelRelation.GEDDocumentLabel.name', labels);
    }

    // Tri
    const orderColumn = this.getOrderColumn(sortBy);
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des documents: ${error.message}`);
    }

    // Formatage des documents
    const formattedDocuments = documents?.map(doc => ({
      ...doc,
      labels: doc.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
    })) || [];

    return {
      documents: formattedDocuments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  /**
   * Récupère un document spécifique
   */
  async getDocument(id: string, userType: string): Promise<Document> {
    // Vérifier les permissions
    const hasPermission = await this.checkDocumentPermission(id, userType, 'read');
    if (!hasPermission) {
      throw new Error('Accès non autorisé à ce document');
    }

    const { data: document, error } = await supabase
      .from('GEDDocument')
      .select(`
        *,
        GEDDocumentLabelRelation(
          GEDDocumentLabel(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !document) {
      throw new Error('Document non trouvé');
    }

    // Enregistrer l'activité de consultation
    await this.recordDocumentActivity(id, userType, 'view');

    return {
      ...document,
      labels: document.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
    };
  }

  /**
   * Crée un nouveau document
   */
  async createDocument(data: CreateDocumentRequest, userId: string, userType: string): Promise<Document> {
    // Vérifier les permissions de création
    if (userType !== 'admin' && userType !== 'expert') {
      throw new Error('Permissions insuffisantes pour créer un document');
    }

    // Vérifier que les experts ne peuvent créer que des docs métier
    if (userType === 'expert' && data.category !== 'business') {
      throw new Error('Les experts ne peuvent créer que des documents métier');
    }

    // Validation des données
    this.validateDocumentData(data);

    // Créer le document
    const { data: document, error: docError } = await supabase
      .from('GEDDocument')
      .insert({
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        created_by: userId,
        read_time: data.read_time || 5
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Erreur lors de la création du document: ${docError.message}`);
    }

    // Ajouter les labels si fournis
    if (data.labels && data.labels.length > 0) {
      await this.addDocumentLabels(document.id, data.labels);
    }

    // Créer les permissions par défaut
    await this.createDefaultPermissions(document.id);

    return document;
  }

  /**
   * Met à jour un document existant
   */
  async updateDocument(id: string, data: UpdateDocumentRequest, userId: string, userType: string): Promise<Document> {
    // Vérifier les permissions
    const hasPermission = await this.checkDocumentPermission(id, userType, 'write');
    if (!hasPermission) {
      throw new Error('Permissions insuffisantes pour modifier ce document');
    }

    // Validation des données
    if (data.category && !['business', 'technical'].includes(data.category)) {
      throw new Error('Catégorie invalide');
    }

    // Vérifier que les experts ne peuvent modifier que des docs métier
    if (userType === 'expert' && data.category && data.category !== 'business') {
      throw new Error('Les experts ne peuvent modifier que des documents métier');
    }

    // Créer une nouvelle version avant modification
    await this.createDocumentVersion(id, userId);

    // Mettre à jour le document
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content) updateData.content = data.content;
    if (data.category) updateData.category = data.category;
    if (data.read_time) updateData.read_time = data.read_time;

    const { data: document, error: updateError } = await supabase
      .from('GEDDocument')
      .update({
        ...updateData,
        version: (updateData.version || 0) + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erreur lors de la modification du document: ${updateError.message}`);
    }

    // Mettre à jour les labels si fournis
    if (data.labels !== undefined) {
      await this.updateDocumentLabels(id, data.labels);
    }

    return document;
  }

  /**
   * Supprime un document
   */
  async deleteDocument(id: string, userType: string): Promise<void> {
    // Seuls les admins peuvent supprimer
    if (userType !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent supprimer des documents');
    }

    const { error } = await supabase
      .from('GEDDocument')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression du document: ${error.message}`);
    }
  }

  // ===== GESTION DES LABELS =====

  /**
   * Récupère tous les labels
   */
  async getLabels(): Promise<DocumentLabel[]> {
    const { data: labels, error } = await supabase
      .from('GEDDocumentLabel')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Erreur lors de la récupération des labels: ${error.message}`);
    }

    return labels || [];
  }

  /**
   * Crée un nouveau label
   */
  async createLabel(data: { name: string; color?: string; description?: string }, userType: string): Promise<DocumentLabel> {
    // Seuls les admins peuvent créer des labels
    if (userType !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent créer des labels');
    }

    if (!data.name) {
      throw new Error('Le nom du label est requis');
    }

    const { data: label, error } = await supabase
      .from('GEDDocumentLabel')
      .insert({
        name: data.name,
        color: data.color || '#3B82F6',
        description: data.description
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du label: ${error.message}`);
    }

    return label;
  }

  // ===== GESTION DES FAVORIS =====

  /**
   * Ajoute un document aux favoris
   */
  async addToFavorites(documentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('GEDUserDocumentFavorite')
      .insert({
        user_id: userId,
        document_id: documentId
      });

    if (error) {
      throw new Error(`Erreur lors de l'ajout aux favoris: ${error.message}`);
    }
  }

  /**
   * Retire un document des favoris
   */
  async removeFromFavorites(documentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('GEDUserDocumentFavorite')
      .delete()
      .eq('user_id', userId)
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Erreur lors de la suppression des favoris: ${error.message}`);
    }
  }

  /**
   * Récupère les favoris d'un utilisateur
   */
  async getUserFavorites(userId: string): Promise<any[]> {
    const { data: favorites, error } = await supabase
      .from('GEDUserDocumentFavorite')
      .select(`
        GEDDocument(
          *,
          GEDDocumentLabelRelation(
            GEDDocumentLabel(*)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des favoris: ${error.message}`);
    }

    return favorites?.map(fav => ({
      ...fav.GEDDocument,
      labels: (fav.GEDDocument as any)?.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
    })) || [];
  }

  // ===== GESTION DES PERMISSIONS =====

  /**
   * Vérifie les permissions d'un utilisateur sur un document
   */
  async checkDocumentPermission(documentId: string, userType: string, action: 'read' | 'write' | 'delete' | 'share'): Promise<boolean> {
    const { data: permissions, error } = await supabase
      .from('GEDDocumentPermission')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_type', userType)
      .single();

    if (error || !permissions) {
      return false;
    }

    switch (action) {
      case 'read':
        return permissions.can_read;
      case 'write':
        return permissions.can_write;
      case 'delete':
        return permissions.can_delete;
      case 'share':
        return permissions.can_share;
      default:
        return false;
    }
  }

  /**
   * Met à jour les permissions d'un document
   */
  async updateDocumentPermissions(documentId: string, permissions: DocumentPermission[], userType: string): Promise<void> {
    // Seuls les admins peuvent modifier les permissions
    if (userType !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent modifier les permissions');
    }

    // Supprimer les anciennes permissions
    await supabase
      .from('GEDDocumentPermission')
      .delete()
      .eq('document_id', documentId);

    // Ajouter les nouvelles permissions
    if (permissions.length > 0) {
      const { error } = await supabase
        .from('GEDDocumentPermission')
        .insert(permissions);

      if (error) {
        throw new Error(`Erreur lors de la mise à jour des permissions: ${error.message}`);
      }
    }
  }

  // ===== STATISTIQUES ET MÉTRIQUES =====

  /**
   * Récupère les statistiques des documents
   */
  async getDocumentStats(): Promise<DocumentStats> {
    // Compter les documents par catégorie
    const { data: categoryStats } = await supabase
      .from('GEDDocument')
      .select('category')
      .eq('is_active', true);

    const categories = {
      business: categoryStats?.filter(doc => doc.category === 'business').length || 0,
      technical: categoryStats?.filter(doc => doc.category === 'technical').length || 0
    };

    // Compter les documents par label
    const { data: labelStats } = await supabase
      .from('GEDDocumentLabelRelation')
      .select(`
        GEDDocumentLabel(name)
      `);

    const labels: { [key: string]: number } = {};
    labelStats?.forEach(stat => {
      const labelName = (stat.GEDDocumentLabel as any)?.name;
      if (labelName) {
        labels[labelName] = (labels[labelName] || 0) + 1;
      }
    });

    return {
      totalDocuments: (categories.business + categories.technical),
      categories,
      labels,
      lastUpdate: new Date()
    };
  }

  /**
   * Récupère les métriques d'un document
   */
  async getDocumentMetrics(documentId: string): Promise<DocumentMetrics> {
    // Compter les vues
    const { data: views } = await supabase
      .from('UserDocumentActivity')
      .select('*')
      .eq('document_id', documentId)
      .eq('action', 'view');

    // Compter les favoris
    const { data: favorites } = await supabase
      .from('GEDUserDocumentFavorite')
      .select('*')
      .eq('document_id', documentId);

    // Calculer le temps de lecture moyen
    const { data: readTimes } = await supabase
      .from('UserDocumentActivity')
      .select('session_duration')
      .eq('document_id', documentId)
      .eq('action', 'view')
      .not('session_duration', 'is', null);

    const averageReadTime = readTimes && readTimes.length > 0
      ? readTimes.reduce((sum, view) => sum + (view.session_duration || 0), 0) / readTimes.length
      : 0;

    return {
      total_views: views?.length || 0,
      unique_viewers: new Set(views?.map(v => v.user_id)).size,
      average_read_time: averageReadTime,
      favorite_count: favorites?.length || 0,
      last_viewed: views && views.length > 0 
        ? new Date(Math.max(...views.map(v => new Date(v.timestamp).getTime())))
        : undefined
    };
  }

  // ===== MÉTHODES PRIVÉES =====

  private getOrderColumn(sortBy: string): string {
    switch (sortBy) {
      case 'title':
        return 'title';
      case 'created_at':
        return 'created_at';
      case 'read_time':
        return 'read_time';
      default:
        return 'last_modified';
    }
  }

  private validateDocumentData(data: CreateDocumentRequest | UpdateDocumentRequest): void {
    if ('title' in data && (!data.title || data.title.trim().length === 0)) {
      throw new Error('Le titre est requis');
    }

    if ('content' in data && (!data.content || data.content.trim().length === 0)) {
      throw new Error('Le contenu est requis');
    }

    if ('category' in data && data.category && !['business', 'technical'].includes(data.category)) {
      throw new Error('Catégorie invalide');
    }

    if ('read_time' in data && data.read_time && (data.read_time < 1 || data.read_time > 60)) {
      throw new Error('Le temps de lecture doit être entre 1 et 60 minutes');
    }
  }

  private async addDocumentLabels(documentId: string, labelIds: string[]): Promise<void> {
    const labelRelations = labelIds.map(labelId => ({
      document_id: documentId,
      label_id: labelId
    }));

    const { error } = await supabase
      .from('GEDDocumentLabelRelation')
      .insert(labelRelations);

    if (error) {
      throw new Error(`Erreur lors de l'ajout des labels: ${error.message}`);
    }
  }

  private async updateDocumentLabels(documentId: string, labelIds: string[]): Promise<void> {
    // Supprimer les anciens labels
    await supabase
      .from('GEDDocumentLabelRelation')
      .delete()
      .eq('document_id', documentId);

    // Ajouter les nouveaux labels
    if (labelIds.length > 0) {
      await this.addDocumentLabels(documentId, labelIds);
    }
  }

  private async createDefaultPermissions(documentId: string): Promise<void> {
    const defaultPermissions = [
      { document_id: documentId, user_type: 'admin', can_read: true, can_write: true, can_delete: true, can_share: true },
      { document_id: documentId, user_type: 'client', can_read: true, can_write: false, can_delete: false, can_share: true },
      { document_id: documentId, user_type: 'expert', can_read: true, can_write: true, can_delete: false, can_share: true }
    ];

    const { error } = await supabase
      .from('GEDDocumentPermission')
      .insert(defaultPermissions);

    if (error) {
      throw new Error(`Erreur lors de la création des permissions: ${error.message}`);
    }
  }

  private async createDocumentVersion(documentId: string, userId: string): Promise<void> {
    const { data: currentDoc } = await supabase
      .from('GEDDocument')
      .select('content, version')
      .eq('id', documentId)
      .single();

    if (currentDoc) {
      await supabase
        .from('GEDDocumentVersion')
        .insert({
          document_id: documentId,
          version_number: currentDoc.version,
          content: currentDoc.content,
          modified_by: userId,
          change_description: 'Modification automatique'
        });
    }
  }

  private async recordDocumentActivity(documentId: string, userId: string, action: string): Promise<void> {
    await supabase
      .from('UserDocumentActivity')
      .insert({
        user_id: userId,
        document_id: documentId,
        action,
        timestamp: new Date().toISOString()
      });
  }
}

export const gedService = new GEDService(); 