import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types TypeScript
interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  file_path?: string;
  last_modified: Date;
  created_at: Date;
  created_by?: string;
  is_active: boolean;
  read_time: number;
  version: number;
}

interface DocumentLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: Date;
}

interface DocumentPermission {
  id: string;
  document_id: string;
  user_type: 'admin' | 'client' | 'expert';
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_share: boolean;
  created_at: Date;
  updated_at: Date;
}

// ===== ROUTES DOCUMENTS =====

// GET /api/documents - Lister les documents avec filtres
router.get('/', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  const { 
    category, 
    search, 
    labels, 
    page = 1, 
    limit = 10, 
    sortBy = 'last_modified', 
    sortOrder = 'desc' 
  } = req.query;

  const userType = authUser.type || 'client';
  const offset = (Number(page) - 1) * Number(limit);

  // Construction de la requête de base
  let query = supabase
    .from('GEDDocument')
    .select(`
      *,
      GEDDocumentLabelRelation(
        GEDDocumentLabel(*)
      ),
      GEDDocumentPermission!inner(*)
    `)
    .eq('GEDDocumentPermission.user_type', userType)
    .eq('GEDDocumentPermission.can_read', true)
    .eq('is_active', true);

  // Filtres
  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (labels && Array.isArray(labels)) {
    query = query.in('GEDDocumentLabelRelation.GEDDocumentLabel.name', labels);
  }

  // Tri
  const orderColumn = sortBy === 'title' ? 'title' : 
                     sortBy === 'created_at' ? 'created_at' : 
                     sortBy === 'read_time' ? 'read_time' : 'last_modified';
  
  query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + Number(limit) - 1);

  const { data: documents, error, count } = await query;

  if (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des documents' 
    });
  }

  // Traitement des données pour formater les labels
  const formattedDocuments = documents?.map(doc => ({
    ...doc,
    labels: doc.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
  })) || [];

  return res.json({
    success: true,
    data: {
      documents: formattedDocuments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    }
  });
}));

// GET /api/documents/:id - Récupérer un document spécifique
router.get('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  // Vérifier les permissions
  const { data: permissions, error: permError } = await supabase
    .from('GEDDocumentPermission')
    .select('*')
    .eq('document_id', id)
    .eq('user_type', authUser.type)
    .single();

  if (permError || !permissions?.can_read) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès non autorisé à ce document' 
    });
  }

  // Récupérer le document avec ses labels
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
    return res.status(404).json({ 
      success: false, 
      error: 'Document non trouvé' 
    });
  }

  // Formater les labels
  const formattedDocument = {
    ...document,
    labels: document.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
  };

  return res.json({
    success: true,
    data: formattedDocument
  });
}));

// POST /api/documents - Créer un nouveau document
router.post('/', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { 
    title, 
    description, 
    content, 
    category, 
    labels = [], 
    read_time = 5 
  } = req.body;

  // Validation des données
  if (!title || !content || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Titre, contenu et catégorie sont requis' 
    });
  }

  if (!['business', 'technical'].includes(category)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Catégorie invalide' 
    });
  }

  // Vérifier que les experts ne peuvent créer que des docs métier
  if (authUser.type === 'expert' && category !== 'business') {
    return res.status(403).json({ 
      success: false, 
      error: 'Les experts ne peuvent créer que des documents métier' 
    });
  }

  // Créer le document
  const { data: document, error: docError } = await supabase
    .from('GEDDocument')
    .insert({
      title,
      description,
      content,
      category,
      created_by: authUser.id,
      read_time
    })
    .select()
    .single();

  if (docError) {
    console.error('Erreur lors de la création du document:', docError);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du document' 
    });
  }

  // Ajouter les labels si fournis
  if (labels.length > 0) {
    const labelRelations = labels.map((labelId: string) => ({
      document_id: document.id,
      label_id: labelId
    }));

    const { error: labelError } = await supabase
      .from('GEDDocumentLabelRelation')
      .insert(labelRelations);

    if (labelError) {
      console.error('Erreur lors de l\'ajout des labels:', labelError);
    }
  }

  // Créer les permissions par défaut
  const defaultPermissions = [
    { document_id: document.id, user_type: 'admin', can_read: true, can_write: true, can_delete: true, can_share: true },
    { document_id: document.id, user_type: 'client', can_read: true, can_write: false, can_delete: false, can_share: true },
    { document_id: document.id, user_type: 'expert', can_read: true, can_write: true, can_delete: false, can_share: true }
  ];

  const { error: permError } = await supabase
    .from('GEDDocumentPermission')
    .insert(defaultPermissions);

  if (permError) {
    console.error('Erreur lors de la création des permissions:', permError);
  }

  return res.status(201).json({
    success: true,
    data: document
  });
}));

// PUT /api/documents/:id - Modifier un document
router.put('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  // Vérifier les permissions
  const { data: permissions, error: permError } = await supabase
    .from('GEDDocumentPermission')
    .select('*')
    .eq('document_id', id)
    .eq('user_type', authUser.type)
    .single();

  if (permError || !permissions?.can_write) {
    return res.status(403).json({ 
      success: false, 
      error: 'Permissions insuffisantes pour modifier ce document' 
    });
  }

  const { 
    title, 
    description, 
    content, 
    category, 
    labels = [], 
    read_time 
  } = req.body;

  // Validation des données
  if (!title || !content || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Titre, contenu et catégorie sont requis' 
    });
  }

  // Vérifier que les experts ne peuvent modifier que des docs métier
  if (authUser.type === 'expert' && category !== 'business') {
    return res.status(403).json({ 
      success: false, 
      error: 'Les experts ne peuvent modifier que des documents métier' 
    });
  }

  // Créer une nouvelle version avant modification
  const { data: currentDoc } = await supabase
    .from('GEDDocument')
    .select('content, version')
    .eq('id', id)
    .single();

  if (currentDoc) {
    await supabase
      .from('GEDDocumentVersion')
      .insert({
        document_id: id,
        version_number: currentDoc.version,
        content: currentDoc.content,
        modified_by: authUser.id,
        change_description: 'Modification automatique'
      });
  }

  // Mettre à jour le document
  const updateData: any = {
    title,
    description,
    content,
    category,
    read_time
  };

  const { data: document, error: updateError } = await supabase
    .from('GEDDocument')
    .update({
      ...updateData,
      version: currentDoc ? currentDoc.version + 1 : 1
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur lors de la modification du document:', updateError);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la modification du document' 
    });
  }

  // Mettre à jour les labels si fournis
  if (labels.length >= 0) {
    // Supprimer les anciens labels
    await supabase
      .from('GEDDocumentLabelRelation')
      .delete()
      .eq('document_id', id);

    // Ajouter les nouveaux labels
    if (labels.length > 0) {
      const labelRelations = labels.map((labelId: string) => ({
        document_id: id,
        label_id: labelId
      }));

      await supabase
        .from('GEDDocumentLabelRelation')
        .insert(labelRelations);
    }
  }

  return res.json({
    success: true,
    data: document
  });
}));

// DELETE /api/documents/:id - Supprimer un document
router.delete('/:id', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  // Seuls les admins peuvent supprimer
  if (authUser.type !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Seuls les administrateurs peuvent supprimer des documents' 
    });
  }

  const { error } = await supabase
    .from('GEDDocument')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du document:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du document' 
    });
  }

  return res.json({
    success: true,
    message: 'Document supprimé avec succès'
  });
}));

// ===== ROUTES LABELS =====

// GET /api/labels - Lister tous les labels
router.get('/labels', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { data: labels, error } = await supabase
    .from('GEDDocumentLabel')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération des labels:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des labels' 
    });
  }

  return res.json({
    success: true,
    data: labels
  });
}));

// POST /api/labels - Créer un nouveau label
router.post('/labels', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

  // Seuls les admins peuvent créer des labels
  if (authUser.type !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Seuls les administrateurs peuvent créer des labels' 
    });
  }

  const { name, color, description } = req.body;

  if (!name) {
    return res.status(400).json({ 
      success: false, 
      error: 'Le nom du label est requis' 
    });
  }

  const { data: label, error } = await supabase
    .from('GEDDocumentLabel')
    .insert({
      name,
      color: color || '#3B82F6',
      description
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du label:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du label' 
    });
  }

  return res.status(201).json({
    success: true,
    data: label
  });
}));

// ===== ROUTES FAVORIS =====

// POST /api/documents/:id/favorite - Ajouter aux favoris
router.post('/:id/favorite', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  const { error } = await supabase
    .from('GEDUserDocumentFavorite')
    .insert({
      user_id: authUser.id,
      document_id: id
    });

  if (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'ajout aux favoris' 
    });
  }

  return res.json({
    success: true,
    message: 'Document ajouté aux favoris'
  });
}));

// DELETE /api/documents/:id/favorite - Retirer des favoris
router.delete('/:id/favorite', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;
  const { id } = req.params;

  const { error } = await supabase
    .from('GEDUserDocumentFavorite')
    .delete()
    .eq('user_id', authUser.id)
    .eq('document_id', id);

  if (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression des favoris' 
    });
  }

  return res.json({
    success: true,
    message: 'Document retiré des favoris'
  });
}));

// GET /api/documents/favorites - Récupérer les favoris de l'utilisateur
router.get('/favorites', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const authUser = req.user as AuthUser;

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
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des favoris' 
    });
  }

  const formattedFavorites = favorites?.map(fav => ({
    ...fav.GEDDocument,
    labels: (fav.GEDDocument as any)?.GEDDocumentLabelRelation?.map((rel: any) => rel.GEDDocumentLabel) || []
  })) || [];

  return res.json({
    success: true,
    data: formattedFavorites
  });
}));

// Route pour les métriques GED
router.get('/metrics', async (req, res) => {
  try {
    console.log('📊 Récupération des métriques GED...');
    
    // Récupérer les statistiques de base
    const totalDocuments = await supabase
      .from('GED_documents')
      .select('id', { count: 'exact' });
    
    const totalLabels = await supabase
      .from('GED_labels')
      .select('id', { count: 'exact' });
    
    const totalFavorites = await supabase
      .from('GED_favorites')
      .select('id', { count: 'exact' });
    
    // Documents par catégorie
    const documentsByCategory = await supabase
      .from('GED_documents')
      .select('category')
      .eq('is_active', true);
    
    const businessDocs = documentsByCategory.data?.filter(d => d.category === 'business').length || 0;
    const technicalDocs = documentsByCategory.data?.filter(d => d.category === 'technical').length || 0;
    
    // Documents par type d'utilisateur (créateur)
    const documentsByUserType = await supabase
      .from('GED_documents')
      .select('created_by')
      .eq('is_active', true);
    
    // Simuler les données par type d'utilisateur (à adapter selon votre logique)
    const adminDocs = Math.floor((documentsByUserType.data?.length || 0) * 0.3);
    const expertDocs = Math.floor((documentsByUserType.data?.length || 0) * 0.5);
    const clientDocs = Math.floor((documentsByUserType.data?.length || 0) * 0.2);
    
    // Activité récente (derniers 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDocuments = await supabase
      .from('GED_documents')
      .select('created_at, last_modified')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    const recentFavorites = await supabase
      .from('GED_favorites')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    // Documents populaires (simulation)
    const popularDocuments = await supabase
      .from('GED_documents')
      .select('id, title')
      .eq('is_active', true)
      .limit(5);
    
    const metrics = {
      totalDocuments: totalDocuments.count || 0,
      totalLabels: totalLabels.count || 0,
      totalFavorites: totalFavorites.count || 0,
      documentsByCategory: {
        business: businessDocs,
        technical: technicalDocs
      },
      documentsByUserType: {
        admin: adminDocs,
        expert: expertDocs,
        client: clientDocs
      },
      recentActivity: {
        documentsCreated: recentDocuments.data?.length || 0,
        documentsModified: Math.floor((recentDocuments.data?.length || 0) * 0.7),
        favoritesAdded: recentFavorites.data?.length || 0
      },
      popularDocuments: (popularDocuments.data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        views: Math.floor(Math.random() * 100) + 10,
        favorites: Math.floor(Math.random() * 20) + 1
      })),
      userEngagement: {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        documentsViewed: Math.floor(Math.random() * 200) + 50,
        averageReadTime: Math.floor(Math.random() * 10) + 3
      }
    };
    
    return res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des métriques:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques'
    });
  }
});

export default router; 