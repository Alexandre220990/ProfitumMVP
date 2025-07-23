import express from 'express';
import { authenticateToken } from '../../middleware/authenticate';
import { supabase } from '../../lib/supabase';

const router = express.Router();

// Middleware d'authentification pour toutes les routes admin
router.use(authenticateToken);

// Interface pour les documents
interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  version: string;
  created_at: string;
  updated_at: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
}

// Récupérer tous les documents
router.get('/documents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération documents:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    return res.json({ documents: data || [] });
  } catch (error) {
    console.error('Erreur route documents:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un document par ID
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('admin_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération document:', error);
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    return res.json({ document: data });
  } catch (error) {
    console.error('Erreur route document:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau document
router.post('/documents', async (req, res) => {
  try {
    const { title, category, content, author } = req.body;
    
    if (!title || !category || !content) {
      return res.status(400).json({ error: 'Titre, catégorie et contenu requis' });
    }

    const newDocument = {
      title,
      category,
      content,
      author: author || 'Admin',
      version: '1.0',
      status: 'draft'
    };

    const { data, error } = await supabase
      .from('admin_documents')
      .insert([newDocument])
      .select()
      .single();

    if (error) {
      console.error('Erreur création document:', error);
      return res.status(500).json({ error: 'Erreur création document' });
    }

    return res.status(201).json({ document: data });
  } catch (error) {
    console.error('Erreur route création:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un document
router.put('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content, version, status } = req.body;
    
    const updates: any = {};
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (content) updates.content = content;
    if (version) updates.version = version;
    if (status) updates.status = status;
    
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('admin_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour document:', error);
      return res.status(500).json({ error: 'Erreur mise à jour' });
    }

    return res.json({ document: data });
  } catch (error) {
    console.error('Erreur route mise à jour:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('admin_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression document:', error);
      return res.status(500).json({ error: 'Erreur suppression' });
    }

    return res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur route suppression:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les documents par catégorie
router.get('/documents/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const { data, error } = await supabase
      .from('admin_documents')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération par catégorie:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    return res.json({ documents: data || [] });
  } catch (error) {
    console.error('Erreur route catégorie:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rechercher des documents
router.get('/documents/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const { data, error } = await supabase
      .from('admin_documents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur recherche documents:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    return res.json({ documents: data || [] });
  } catch (error) {
    console.error('Erreur route recherche:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques des documents
router.get('/documents/stats', async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('admin_documents')
      .select('category, status');

    if (error) {
      console.error('Erreur récupération stats:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const stats = {
      total: documents?.length || 0,
      byCategory: {} as any,
      byStatus: {} as any
    };

    documents?.forEach(doc => {
      // Stats par catégorie
      stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
      
      // Stats par statut
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
    });

    return res.json({ stats });
  } catch (error) {
    console.error('Erreur route stats:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router; 