/**
 * 📁 Documents Unified All Users - Route backend universelle
 * 
 * Route unique pour tous les types d'utilisateurs
 * Permissions automatiques selon user.type
 * 
 * Endpoints:
 * - GET    /api/documents              → Liste documents
 * - GET    /api/documents/folders      → Arborescence
 * - GET    /api/documents/stats        → Statistiques
 * - POST   /api/documents/upload       → Upload
 * - GET    /api/documents/:id/download → Download URL signée
 * - GET    /api/documents/:id/preview  → Preview URL
 * - PUT    /api/documents/:id/validate → Valider (expert/admin)
 * - PUT    /api/documents/:id/reject   → Rejeter (expert/admin)
 * - DELETE /api/documents/:id          → Supprimer
 * - POST   /api/documents/:id/favorite → Toggle favori
 * - POST   /api/documents/:id/share    → Partager
 * - GET    /api/documents/:id/versions → Historique
 * 
 * Date: 2025-10-13
 * Version: 1.0
 */

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration multer pour upload mémoire
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtenir le bucket selon user type
 */
function getBucketName(userType: string): string {
  const buckets: Record<string, string> = {
    'client': 'client-documents',
    'expert': 'expert-documents',
    'apporteur': 'apporteur-documents',
    'admin': 'admin-documents'
  };
  return buckets[userType] || 'documents';
}

/**
 * Appliquer filtres selon user type et permissions
 */
async function applyUserFilters(
  baseQuery: any,
  user: any
): Promise<any> {
  const { type, database_id } = user;
  
  if (type === 'client') {
    // Client voit uniquement ses documents
    return baseQuery.eq('client_id', database_id);
  }
  
  if (type === 'expert') {
    // Expert voit documents de ses clients assignés via ClientProduitEligible
    const { data: clientIds } = await supabase
      .from('ClientProduitEligible')
      .select('clientId')
      .eq('expert_id', database_id);
    
    if (clientIds && clientIds.length > 0) {
      const ids = clientIds.map((c: any) => c.clientId);
      return baseQuery.in('client_id', ids);
    }
    
    return baseQuery.eq('client_id', 'none'); // Aucun résultat
  }
  
  if (type === 'apporteur') {
    // Apporteur voit documents de ses prospects/clients via Client.apporteur_id
    const { data: clientIds } = await supabase
      .from('Client')
      .select('id')
      .eq('apporteur_id', database_id);
    
    if (clientIds && clientIds.length > 0) {
      const ids = clientIds.map((c: any) => c.id);
      return baseQuery.in('client_id', ids);
    }
    
    return baseQuery.eq('client_id', 'none');
  }
  
  // Admin voit tout
  return baseQuery;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/documents
 * Liste des documents selon permissions user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const { produit_id, document_type, status, search } = req.query;
    
    let query = supabase
      .from('ClientProcessDocument')
      .select(`
        *,
        Client (
          id,
          name,
          company_name,
          email
        ),
        ProduitEligible (
          id,
          nom,
          categorie
        )
      `)
      .order('created_at', { ascending: false });
    
    // Appliquer filtres user
    query = await applyUserFilters(query, user);
    
    // Filtres additionnels
    if (produit_id) query = query.eq('produit_id', produit_id);
    if (document_type) query = query.eq('document_type', document_type);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`filename.ilike.%${search}%,document_type.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Erreur récupération documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur récupération documents'
      });
    }
    
    return res.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('❌ Erreur route /documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/documents/folders
 * Arborescence des dossiers selon user type
 */
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    let query = supabase
      .from('ClientProcessDocument')
      .select('produit_id, ProduitEligible(nom), client_id, Client(name, company_name)');
    
    query = await applyUserFilters(query, user);
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur' });
    }
    
    // Organiser en dossiers selon user type
    const folders = organizeFolders(data || [], user.type);
    
    return res.json({
      success: true,
      data: folders
    });
    
  } catch (error) {
    console.error('❌ Erreur /folders:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * Helper : Organiser en dossiers
 */
function organizeFolders(data: any[], userType: string): any[] {
  if (userType === 'client') {
    // Grouper par produit
    const byProduct = data.reduce((acc, item) => {
      const productName = item.ProduitEligible?.nom || 'Autres';
      acc[productName] = (acc[productName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byProduct).map(([name, count]) => ({
      id: name,
      name,
      count,
      type: 'product'
    }));
  }
  
  if (userType === 'expert' || userType === 'apporteur') {
    // Grouper par client
    const byClient = data.reduce((acc, item) => {
      const clientName = item.Client?.company_name || item.Client?.name || 'Clients';
      acc[clientName] = (acc[clientName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byClient).map(([name, count]) => ({
      id: name,
      name,
      count,
      type: 'client'
    }));
  }
  
  return [];
}

/**
 * GET /api/documents/stats
 * Statistiques documents user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    let query = supabase
      .from('ClientProcessDocument')
      .select('status, document_type, file_size');
    
    query = await applyUserFilters(query, user);
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur' });
    }
    
    const docs = data || [];
    
    const stats = {
      total: docs.length,
      pending: docs.filter(d => d.status === 'pending').length,
      validated: docs.filter(d => d.status === 'validated').length,
      rejected: docs.filter(d => d.status === 'rejected').length,
      by_product: docs.reduce((acc, d) => {
        acc[d.document_type] = (acc[d.document_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_type: {},
      total_size: docs.reduce((sum, d) => sum + (d.file_size || 0), 0)
    };
    
    return res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur /stats:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/documents/upload
 * Upload document avec permissions auto
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = (req as any).file;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'Fichier manquant' });
    }
    
    const {
      client_id,
      produit_id,
      document_type,
      metadata
    } = req.body;
    
    // Vérifier permissions
    if (user.type === 'client' && client_id && client_id !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Permissions insuffisantes' });
    }
    
    // Obtenir bucket
    const bucketName = getBucketName(user.type);
    
    // Générer chemin fichier
    const timestamp = Date.now();
    const filename = file.originalname;
    const storagePath = `${user.database_id}/${document_type}/${timestamp}-${filename}`;
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload Storage error:', uploadError);
      return res.status(500).json({ success: false, message: 'Erreur upload' });
    }
    
    // Enregistrer en BDD
    const { data: doc, error: dbError } = await supabase
      .from('ClientProcessDocument')
      .insert({
        client_id: client_id || user.database_id,
        produit_id: produit_id || null,
        document_type,
        filename,
        storage_path: storagePath,
        bucket_name: bucketName,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: user.database_id,
        uploaded_by_type: user.type,
        status: 'pending',
        metadata: metadata ? JSON.parse(metadata) : {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Rollback storage
      await supabase.storage.from(bucketName).remove([storagePath]);
      console.error('❌ DB error:', dbError);
      return res.status(500).json({ success: false, message: 'Erreur enregistrement' });
    }
    
    return res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: doc
    });
    
  } catch (error) {
    console.error('❌ Erreur /upload:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/documents/:id/download
 * Obtenir URL signée pour download
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    // Récupérer document
    const { data: doc, error } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !doc) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }
    
    // Vérifier permissions
    const hasPermission = await checkUserPermission(user, doc);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    
    // Générer URL signée (valide 1h)
    const { data: signedUrl } = await supabase.storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 3600); // 1h
    
    if (!signedUrl) {
      return res.status(500).json({ success: false, message: 'Erreur génération URL' });
    }
    
    return res.json({
      success: true,
      data: {
        download_url: signedUrl.signedUrl,
        filename: doc.filename,
        mime_type: doc.mime_type
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur /download:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/documents/:id/preview
 * Obtenir URL pour preview inline
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const { data: doc, error } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !doc) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }
    
    const hasPermission = await checkUserPermission(user, doc);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    
    // URL signée pour preview (24h)
    const { data: signedUrl } = await supabase.storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 86400); // 24h
    
    if (!signedUrl) {
      return res.status(500).json({ success: false, message: 'Erreur génération URL' });
    }
    
    return res.json({
      success: true,
      data: {
        preview_url: signedUrl.signedUrl,
        mime_type: doc.mime_type
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur /preview:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/documents/:id/validate
 * Valider document (expert/admin uniquement)
 */
router.put('/:id/validate', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!user || (user.type !== 'expert' && user.type !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Permissions insuffisantes' });
    }
    
    const { data, error } = await supabase
      .from('ClientProcessDocument')
      .update({
        status: 'validated',
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        validation_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur validation:', error);
      return res.status(500).json({ success: false, message: 'Erreur validation' });
    }
    
    // TODO: Envoyer notification au client
    
    return res.json({
      success: true,
      message: 'Document validé',
      data
    });
    
  } catch (error) {
    console.error('❌ Erreur /validate:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/documents/:id/reject
 * Rejeter document (expert/admin uniquement)
 */
router.put('/:id/reject', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!user || (user.type !== 'expert' && user.type !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Permissions insuffisantes' });
    }
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Raison requise' });
    }
    
    const { data, error } = await supabase
      .from('ClientProcessDocument')
      .update({
        status: 'rejected',
        validated_by: user.database_id,
        validated_at: new Date().toISOString(),
        validation_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur rejet:', error);
      return res.status(500).json({ success: false, message: 'Erreur rejet' });
    }
    
    // TODO: Envoyer notification au client
    
    return res.json({
      success: true,
      message: 'Document rejeté',
      data
    });
    
  } catch (error) {
    console.error('❌ Erreur /reject:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/documents/:id
 * Supprimer document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    // Récupérer document
    const { data: doc, error: fetchError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !doc) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }
    
    // Vérifier permissions
    const canDelete = 
      user.type === 'admin' ||
      (user.type === 'client' && doc.client_id === user.database_id && doc.status !== 'validated');
    
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Permissions insuffisantes' });
    }
    
    // Supprimer de Storage
    await supabase.storage.from(doc.bucket_name).remove([doc.storage_path]);
    
    // Supprimer de BDD
    const { error: deleteError } = await supabase
      .from('ClientProcessDocument')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError);
      return res.status(500).json({ success: false, message: 'Erreur suppression' });
    }
    
    return res.json({
      success: true,
      message: 'Document supprimé'
    });
    
  } catch (error) {
    console.error('❌ Erreur /delete:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/documents/:id/favorite
 * Toggle favori
 */
router.post('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    // Vérifier si déjà favori
    const { data: existing } = await supabase
      .from('GEDUserDocumentFavorite')
      .select('*')
      .eq('user_id', user.database_id)
      .eq('document_id', id)
      .single();
    
    if (existing) {
      // Retirer des favoris
      await supabase
        .from('GEDUserDocumentFavorite')
        .delete()
        .eq('user_id', user.database_id)
        .eq('document_id', id);
      
      return res.json({
        success: true,
        data: { is_favorite: false }
      });
    } else {
      // Ajouter aux favoris
      await supabase
        .from('GEDUserDocumentFavorite')
        .insert({
          user_id: user.database_id,
          document_id: id,
          created_at: new Date().toISOString()
        });
      
      return res.json({
        success: true,
        data: { is_favorite: true }
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur /favorite:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/documents/:id/share
 * Partager document
 */
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { email, can_download, expires_at } = req.body;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }
    
    // TODO: Implémenter système de partage
    // - Créer table DocumentShare
    // - Envoyer email avec lien
    // - Gérer expiration
    
    return res.json({
      success: true,
      message: `Document partagé avec ${email}`
    });
    
  } catch (error) {
    console.error('❌ Erreur /share:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/documents/:id/versions
 * Obtenir historique versions
 */
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const { data, error } = await supabase
      .from('GEDDocumentVersion')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur' });
    }
    
    return res.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('❌ Erreur /versions:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// HELPER: Vérifier permissions user sur document
// ============================================================================

async function checkUserPermission(user: any, document: any): Promise<boolean> {
  const { type, database_id } = user;
  
  // Admin a tous les droits
  if (type === 'admin') return true;
  
  // Client voit uniquement ses documents
  if (type === 'client') {
    return document.client_id === database_id;
  }
  
  // Expert voit documents de ses clients
  if (type === 'expert') {
    const { data } = await supabase
      .from('ClientProduitEligible')
      .select('clientId')
      .eq('expert_id', database_id)
      .eq('clientId', document.client_id)
      .single();
    
    return !!data;
  }
  
  // Apporteur voit documents de ses clients
  if (type === 'apporteur') {
    const { data } = await supabase
      .from('Client')
      .select('id')
      .eq('id', document.client_id)
      .eq('apporteur_id', database_id)
      .single();
    
    return !!data;
  }
  
  return false;
}

export default router;

