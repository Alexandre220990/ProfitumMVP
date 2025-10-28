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
 * Sanitize filename - supprime caractères spéciaux et accents
 */
function sanitizeFilename(filename: string): string {
  return filename
    // Normaliser les caractères unicode (décomposer les accents)
    .normalize('NFD')
    // Supprimer les marques diacritiques (accents)
    .replace(/[\u0300-\u036f]/g, '')
    // Remplacer espaces par underscores
    .replace(/\s+/g, '_')
    // Supprimer caractères spéciaux sauf .-_
    .replace(/[^a-zA-Z0-9._-]/g, '')
    // Éviter les doubles underscores
    .replace(/_+/g, '_')
    // Trim underscores au début/fin
    .replace(/^_+|_+$/g, '');
}

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
 * Récupérer les IDs clients accessibles selon user type
 */
async function getAccessibleClientIds(user: any): Promise<string[] | null> {
  const { type, database_id } = user;
  
  if (type === 'client') {
    return [database_id];
  }
  
  if (type === 'expert') {
    const { data: clientIds } = await supabase
      .from('ClientProduitEligible')
      .select('clientId')
      .eq('expert_id', database_id);
    
    if (clientIds && clientIds.length > 0) {
      return clientIds.map((c: any) => c.clientId);
    }
    return []; // Aucun client
  }
  
  if (type === 'apporteur') {
    const { data: clientIds } = await supabase
      .from('Client')
      .select('id')
      .eq('apporteur_id', database_id);
    
    if (clientIds && clientIds.length > 0) {
      return clientIds.map((c: any) => c.id);
    }
    return []; // Aucun client
  }
  
  // Admin voit tout
  return null;
}

/**
 * Appliquer filtres selon user type et permissions
 */
function applyClientFilter(baseQuery: any, clientIds: string[] | null): any {
  if (clientIds === null) {
    // Admin - pas de filtre
    return baseQuery;
  }
  
  if (clientIds.length === 0) {
    // Aucun accès - filtre impossible
    return baseQuery.eq('client_id', '00000000-0000-0000-0000-000000000000');
  }
  
  if (clientIds.length === 1) {
    return baseQuery.eq('client_id', clientIds[0]);
  }
  
  return baseQuery.in('client_id', clientIds);
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
    
    // Récupérer les clients accessibles
    const accessibleClientIds = await getAccessibleClientIds(user);
    
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
    query = applyClientFilter(query, accessibleClientIds);
    
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
    
    // Ajouter les URLs publiques pour chaque document
    const documentsWithUrls = (data || []).map((doc: any) => {
      const { data: publicUrlData } = supabase.storage
        .from(doc.bucket_name)
        .getPublicUrl(doc.storage_path);
      
      return {
        ...doc,
        public_url: publicUrlData.publicUrl
      };
    });
    
    return res.json({
      success: true,
      data: documentsWithUrls
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
    
    // Récupérer les clients accessibles
    const accessibleClientIds = await getAccessibleClientIds(user);
    
    let query = supabase
      .from('ClientProcessDocument')
      .select('produit_id, ProduitEligible(nom), client_id, Client(name, company_name)');
    
    query = applyClientFilter(query, accessibleClientIds);
    
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
    
    // Récupérer les clients accessibles
    const accessibleClientIds = await getAccessibleClientIds(user);
    
    let query = supabase
      .from('ClientProcessDocument')
      .select('status, document_type, file_size');
    
    query = applyClientFilter(query, accessibleClientIds);
    
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
      dossier_id, // Support pour format TICPEUploadInline
      document_type,
      category,
      description,
      user_type,
      metadata
    } = req.body;
    
    console.log('📤 Upload document - User:', user.email, 'Type:', user.type);
    console.log('📦 Body reçu:', { client_id, produit_id, dossier_id, document_type, category });
    
    // Résoudre le vrai produit_id
    let finalProduitId = produit_id;
    
    // Si dossier_id est fourni, c'est un ClientProduitEligible.id
    // Il faut récupérer le vrai produitId depuis ClientProduitEligible
    if (dossier_id) {
      console.log('🔍 Résolution produitId depuis ClientProduitEligible:', dossier_id);
      const { data: clientProduit, error: cpError } = await supabase
        .from('ClientProduitEligible')
        .select('produitId')
        .eq('id', dossier_id)
        .single();
      
      if (cpError || !clientProduit) {
        console.error('❌ ClientProduitEligible non trouvé:', dossier_id, cpError);
        return res.status(404).json({ 
          success: false, 
          message: 'Dossier non trouvé',
          details: cpError?.message 
        });
      }
      
      finalProduitId = clientProduit.produitId;
      console.log('✅ produitId résolu:', finalProduitId);
    }
    
    // Vérifier permissions
    if (user.type === 'client' && client_id && client_id !== user.database_id) {
      return res.status(403).json({ success: false, message: 'Permissions insuffisantes' });
    }
    
    // Obtenir bucket
    const bucketName = getBucketName(user.type);
    
    // Vérifier que le bucket existe
    const { data: bucketExists, error: bucketCheckError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketCheckError) {
      console.error('❌ Bucket non accessible:', bucketName, bucketCheckError);
      
      // Si le bucket n'existe vraiment pas, essayer de le créer
      if (bucketCheckError.message.includes('not found')) {
        console.log('📦 Tentative de création du bucket:', bucketName);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: bucketName === 'admin-documents' ? 104857600 : 52428800, // 100MB admin, 50MB autres
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'text/csv'
          ]
        });
        
        if (createError) {
          console.error('❌ Erreur création bucket:', createError);
          // Le bucket existe peut-être déjà, continuer quand même
          console.log('⚠️ Bucket existe probablement déjà, on continue...');
        } else {
          console.log('✅ Bucket créé:', bucketName);
        }
      }
    } else {
      console.log('✅ Bucket existe:', bucketName);
    }
    
    // Générer chemin fichier avec nom sanitizé
    const timestamp = Date.now();
    const originalFilename = file.originalname;
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const storagePath = `${user.database_id}/${document_type}/${timestamp}-${sanitizedFilename}`;
    
    console.log('📝 Nom fichier:', {
      original: originalFilename,
      sanitized: sanitizedFilename,
      path: storagePath
    });
    
    console.log('📁 Upload vers:', bucketName, '/', storagePath);
    
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
      return res.status(500).json({ success: false, message: 'Erreur upload', details: uploadError.message });
    }
    
    console.log('✅ Fichier uploadé vers Storage');
    
    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    
    // Enregistrer en BDD
    const docMetadata = metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {};
    docMetadata.category = category;
    docMetadata.description = description;
    docMetadata.user_type = user_type;
    
    // Si dossier_id est fourni, l'ajouter aux métadonnées pour garder la référence
    if (dossier_id) {
      docMetadata.client_produit_id = dossier_id;
    }
    
    const { data: doc, error: dbError } = await supabase
      .from('ClientProcessDocument')
      .insert({
        client_id: client_id || user.database_id,
        produit_id: finalProduitId || null,
        document_type,
        filename: originalFilename, // Garder le nom original pour l'affichage
        storage_path: storagePath, // Utiliser le chemin sanitizé pour le storage
        bucket_name: bucketName,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: user.database_id,
        uploaded_by_type: user.type,
        status: 'pending',
        metadata: docMetadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Rollback storage
      await supabase.storage.from(bucketName).remove([storagePath]);
      console.error('❌ DB error:', dbError);
      return res.status(500).json({ success: false, message: 'Erreur enregistrement', details: dbError.message });
    }
    
    console.log('✅ Document enregistré en BDD:', doc.id);
    
    // 🔔 NOTIFICATION EXPERT : Document uploadé par client
    if (user.type === 'client' && dossier_id) {
      try {
        const { data: clientProduit } = await supabase
          .from('ClientProduitEligible')
          .select('expertId, clientId, Client!inner(nom, prenom)')
          .eq('id', dossier_id)
          .single();
        
        if (clientProduit?.expertId) {
          const clientInfo = Array.isArray(clientProduit.Client) ? clientProduit.Client[0] : clientProduit.Client;
          
          const { NotificationTriggers } = await import('../services/NotificationTriggers');
          await NotificationTriggers.onDocumentUploaded(
            clientProduit.expertId,
            {
              id: clientProduit.clientId,
              nom: clientInfo?.nom || 'Client',
              prenom: clientInfo?.prenom || ''
            },
            {
              id: doc.id,
              nom: doc.filename,
              type: doc.document_type
            },
            {
              id: dossier_id,
              nom: docMetadata.produit_nom || 'Dossier'
            }
          );
          console.log('✅ Notification expert envoyée');
        }
      } catch (notifError) {
        console.error('❌ Erreur notification expert (non bloquant):', notifError);
      }
    }
    
    return res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: {
        id: doc.id,
        title: doc.filename,
        original_filename: doc.filename,
        created_at: doc.created_at,
        public_url: publicUrlData.publicUrl,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        document_type: doc.document_type,
        status: doc.status
      }
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
    
    // Vérifier que le bucket existe
    console.log('🔍 Vérification bucket:', doc.bucket_name);
    const { data: bucketCheck, error: bucketError } = await supabase.storage.getBucket(doc.bucket_name);
    if (bucketError) {
      console.error('❌ Bucket non trouvé:', doc.bucket_name, bucketError);
      return res.status(404).json({ 
        success: false, 
        message: `Espace de stockage '${doc.bucket_name}' non trouvé. Le bucket doit être créé dans Supabase Storage.`,
        details: bucketError.message 
      });
    }
    console.log('✅ Bucket existe:', doc.bucket_name);
    
    // Générer URL signée (valide 1h)
    console.log('🔗 Génération URL signée:', {
      bucket: doc.bucket_name,
      path: doc.storage_path,
      filename: doc.filename
    });
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 3600); // 1h
    
    if (signedUrlError || !signedUrl) {
      console.error('❌ Erreur génération URL signée:', {
        bucket: doc.bucket_name,
        path: doc.storage_path,
        error: signedUrlError
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur génération URL de téléchargement',
        details: signedUrlError?.message 
      });
    }
    
    console.log('✅ URL signée générée:', signedUrl.signedUrl.substring(0, 100) + '...');
    
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
    
    // Vérifier que le bucket existe
    const { data: bucketCheck, error: bucketError } = await supabase.storage.getBucket(doc.bucket_name);
    if (bucketError) {
      console.error('❌ Bucket non trouvé:', doc.bucket_name, bucketError);
      return res.status(404).json({ 
        success: false, 
        message: `Espace de stockage '${doc.bucket_name}' non trouvé`,
        details: bucketError.message 
      });
    }
    
    // URL signée pour preview (24h)
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 86400); // 24h
    
    if (signedUrlError || !signedUrl) {
      console.error('❌ Erreur génération URL signée:', signedUrlError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur génération URL de prévisualisation',
        details: signedUrlError?.message 
      });
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

