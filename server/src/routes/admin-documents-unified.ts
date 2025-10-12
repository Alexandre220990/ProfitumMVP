import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// DOCUMENTS PROCESS CLIENTS
// ============================================================================

/**
 * GET /api/admin/documents/process
 * Liste tous les documents process clients avec filtres
 */
router.get('/process', async (req: Request, res: Response) => {
  try {
    const { 
      client_id, 
      produit_id, 
      document_type, 
      workflow_step, 
      status,
      search 
    } = req.query;

    let query = supabase
      .from('ClientProcessDocument')
      .select(`
        *,
        Client!inner (
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

    // Filtres
    if (client_id) query = query.eq('client_id', client_id);
    if (produit_id) query = query.eq('produit_id', produit_id);
    if (document_type) query = query.eq('document_type', document_type);
    if (workflow_step) query = query.eq('workflow_step', workflow_step);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`filename.ilike.%${search}%,document_type.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération docs process:', error);
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
    console.error('❌ Erreur route /process:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/admin/documents/process/upload
 * Upload un nouveau document process client
 */
router.post('/process/upload', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      client_id,
      produit_id,
      document_type,
      workflow_step,
      filename,
      storage_path,
      bucket_name,
      file_size,
      mime_type,
      metadata
    } = req.body;

    // Validation
    if (!client_id || !document_type || !filename || !storage_path || !bucket_name) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (client_id, document_type, filename, storage_path, bucket_name requis)'
      });
    }

    // Créer l'entrée dans la table
    const { data, error } = await supabase
      .from('ClientProcessDocument')
      .insert({
        client_id,
        produit_id: produit_id || null,
        document_type,
        workflow_step: workflow_step || null,
        filename,
        storage_path,
        bucket_name,
        file_size: file_size || null,
        mime_type: mime_type || null,
        uploaded_by: user?.database_id,
        uploaded_by_type: user?.type || 'admin',
        status: 'pending',
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion document:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur enregistrement document'
      });
    }

    return res.json({
      success: true,
      data,
      message: 'Document enregistré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route /process/upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/admin/documents/process/:id/download
 * Obtenir URL signée pour télécharger un document
 */
router.get('/process/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer infos document
    const { data: doc, error: fetchError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Générer URL signée (valide 1h)
    const { data: signedUrl, error: urlError } = await supabase
      .storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 3600);

    if (urlError || !signedUrl) {
      console.error('❌ Erreur génération URL signée:', urlError);
      return res.status(500).json({
        success: false,
        message: 'Erreur génération lien téléchargement'
      });
    }

    return res.json({
      success: true,
      data: {
        url: signedUrl.signedUrl,
        filename: doc.filename,
        mime_type: doc.mime_type
      }
    });

  } catch (error) {
    console.error('❌ Erreur route /process/:id/download:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/admin/documents/process/:id/validate
 * Valider ou rejeter un document
 */
router.put('/process/:id/validate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, validation_notes } = req.body;
    const user = (req as any).user;

    if (!['validated', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide (validated ou rejected)'
      });
    }

    const { data, error } = await supabase
      .from('ClientProcessDocument')
      .update({
        status,
        validated_by: user?.database_id,
        validated_at: new Date().toISOString(),
        validation_notes: validation_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur validation document:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur validation'
      });
    }

    return res.json({
      success: true,
      data,
      message: status === 'validated' ? 'Document validé' : 'Document rejeté'
    });

  } catch (error) {
    console.error('❌ Erreur route /process/:id/validate:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * DELETE /api/admin/documents/process/:id
 * Supprimer un document process
 */
router.delete('/process/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer infos pour supprimer du storage
    const { data: doc, error: fetchError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Supprimer du storage
    const { error: storageError } = await supabase
      .storage
      .from(doc.bucket_name)
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('⚠️ Erreur suppression storage (non bloquant):', storageError);
    }

    // Supprimer de la table
    const { error: deleteError } = await supabase
      .from('ClientProcessDocument')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erreur suppression BDD:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Erreur suppression document'
      });
    }

    return res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route DELETE /process/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// DOCUMENTATION APP
// ============================================================================

/**
 * GET /api/admin/documentation
 * Liste documentation app (guides, FAQ, etc.)
 */
router.get('/documentation', async (req: Request, res: Response) => {
  try {
    const { category, status, search, published_only } = req.query;

    let query = supabase
      .from('GEDDocument')
      .select(`
        *,
        GEDDocumentPermission (
          user_type,
          can_read,
          can_write
        ),
        GEDDocumentLabel (
          name,
          color
        )
      `)
      .order('created_at', { ascending: false });

    // Filtres
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (published_only === 'true') {
      query = query.eq('is_published', true);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération documentation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur récupération documentation'
      });
    }

    return res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Erreur route /documentation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/admin/documentation
 * Créer un nouveau document de documentation
 */
router.post('/documentation', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      title,
      description,
      content,
      category,
      slug,
      tags,
      is_published,
      is_featured,
      permissions // { client: true, expert: false, apporteur: true, admin: true }
    } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Titre, contenu et catégorie requis'
      });
    }

    // Créer le document
    const { data: doc, error: docError } = await supabase
      .from('GEDDocument')
      .insert({
        title,
        description: description || '',
        content,
        category,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        meta_description: description,
        tags: tags || [],
        is_published: is_published || false,
        is_featured: is_featured || false,
        created_by: user?.database_id,
        author_id: user?.database_id,
        published_at: is_published ? new Date().toISOString() : null,
        is_active: true,
        view_count: 0,
        helpful_count: 0,
        not_helpful_count: 0
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Erreur création document:', docError);
      return res.status(500).json({
        success: false,
        message: 'Erreur création document'
      });
    }

    // Créer les permissions si fournies
    if (permissions && doc) {
      const permissionsToInsert = Object.entries(permissions)
        .filter(([_, canRead]) => canRead)
        .map(([userType, _]) => ({
          document_id: doc.id,
          user_type: userType,
          can_read: true,
          can_write: userType === 'admin',
          can_delete: userType === 'admin',
          can_share: userType === 'admin'
        }));

      if (permissionsToInsert.length > 0) {
        await supabase
          .from('GEDDocumentPermission')
          .insert(permissionsToInsert);
      }
    }

    return res.json({
      success: true,
      data: doc,
      message: 'Documentation créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur route POST /documentation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/admin/documentation/:id
 * Modifier un document de documentation
 */
router.put('/documentation/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      category,
      tags,
      is_published,
      is_featured
    } = req.body;

    const updateData: any = { updated_at: new Date().toISOString() };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (is_published !== undefined) {
      updateData.is_published = is_published;
      if (is_published && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    const { data, error } = await supabase
      .from('GEDDocument')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour document:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur mise à jour'
      });
    }

    return res.json({
      success: true,
      data,
      message: 'Documentation mise à jour'
    });

  } catch (error) {
    console.error('❌ Erreur route PUT /documentation/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/admin/documentation/:id/permissions
 * Modifier les permissions d'un document
 */
router.put('/documentation/:id/permissions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // { client: true, expert: false, apporteur: true, admin: true }

    // Supprimer anciennes permissions
    await supabase
      .from('GEDDocumentPermission')
      .delete()
      .eq('document_id', id);

    // Créer nouvelles permissions
    const permissionsToInsert = Object.entries(permissions)
      .filter(([_, canRead]) => canRead)
      .map(([userType, _]) => ({
        document_id: id,
        user_type: userType,
        can_read: true,
        can_write: userType === 'admin' || userType === 'expert',
        can_delete: userType === 'admin',
        can_share: userType === 'admin'
      }));

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase
        .from('GEDDocumentPermission')
        .insert(permissionsToInsert);

      if (error) {
        console.error('❌ Erreur création permissions:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur mise à jour permissions'
        });
      }
    }

    return res.json({
      success: true,
      message: 'Permissions mises à jour'
    });

  } catch (error) {
    console.error('❌ Erreur route PUT /documentation/:id/permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * DELETE /api/admin/documentation/:id
 * Supprimer un document de documentation
 */
router.delete('/documentation/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Supprimer (cascade supprime aussi permissions, labels, versions)
    const { error } = await supabase
      .from('GEDDocument')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur suppression documentation:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur suppression'
      });
    }

    return res.json({
      success: true,
      message: 'Documentation supprimée'
    });

  } catch (error) {
    console.error('❌ Erreur route DELETE /documentation/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * GET /api/admin/documents/stats
 * Statistiques globales documents
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Appeler la fonction SQL
    const { data, error } = await supabase
      .rpc('get_documents_stats');

    if (error) {
      console.error('❌ Erreur récupération stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur stats'
      });
    }

    return res.json({
      success: true,
      data: data || {}
    });

  } catch (error) {
    console.error('❌ Erreur route /stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/admin/documents/labels
 * Liste des labels disponibles
 */
router.get('/labels', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('GEDDocumentLabel')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur récupération labels'
      });
    }

    return res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Erreur route /labels:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

