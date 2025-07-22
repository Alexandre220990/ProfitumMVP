import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Obtenir tous les audits d'un client
router.get('/client/:clientId', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;
    
    // Vérifier que l'utilisateur a accès à ces informations
    if (clientId !== authUser.id && authUser.type !== 'expert') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;
    const limit = offset + pageSize - 1;

    // Récupérer les audits du client (pagination)
    const { data: audits, error, count } = await supabase
      .from('Audit')
      .select(`
        *,
        Expert (id, name, email)
      `, { count: 'exact' })
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })
      .range(offset, limit);
    
    if (error) {
      console.error('Erreur lors de la récupération des audits:', error);
      throw error;
    }

    // Formater les audits pour le frontend
    const formattedAudits = audits?.map(audit => ({
      id: audit.id,
      clientId: audit.clientId,
      expertId: audit.expertId,
      type: audit.type,
      statut: audit.status,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
      expert: audit.Expert,
      montantRecupere: audit.montantRecupere,
      montantPotentiel: audit.montantPotentiel,
      notes: audit.notes
    })) || [];

    res.json({
      success: true,
      data: formattedAudits,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des audits:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}) as RequestHandler);

// Obtenir un audit spécifique par ID
router.get('/:auditId', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { auditId } = req.params;
    
    // Récupérer l'audit
    const { data: audit, error } = await supabase
      .from('Audit')
      .select(`
        *,
        Expert (id, name, email),
        Client (id, username, email)
      `)
      .eq('id', auditId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération de l\'audit:', error);
      throw error;
    }

    if (!audit) {
      return res.status(404).json({ message: 'Audit non trouvé' });
    }
    
    // Vérifier que l'utilisateur a accès à cet audit
    if (audit.clientId !== authUser.id && audit.expertId !== authUser.id && authUser.type !== 'expert') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json({
      success: true,
      data: audit
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'audit'
    });
  }
}) as RequestHandler);

// Créer un nouvel audit
router.post('/', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { clientId, type, expertId, documents, eligibility, comments } = req.body;
    
    // Vérifier l'éligibilité
    let eligibilityRecord = null;
    
    if (eligibility) {
      const { data, error } = await supabase
        .from('AuditEligibility')
        .select('*')
        .eq('clientId', clientId)
        .eq('type', type)
        .maybeSingle();
      
      if (error) {
        console.error('Erreur lors de la vérification de l\'éligibilité:', error);
      } else {
        eligibilityRecord = data;
      }
    }
    
    // Créer l'audit
    const auditId = crypto.randomUUID();
    
    const { data: audit, error: auditError } = await supabase
      .from('Audit')
      .insert({
        id: auditId,
        clientId,
        expertId,
        type,
        status: 'non_démarré',
        comments,
        eligibilityId: eligibilityRecord?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (auditError) {
      console.error('Erreur lors de la création de l\'audit:', auditError);
      throw auditError;
    }
    
    // Gérer les documents associés
    const documentsCreated = [];
    
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        const docId = crypto.randomUUID();
        
        const { data: document, error: docError } = await supabase
          .from('AuditDocument')
          .insert({
            id: docId,
            auditId: audit.id,
            name: doc.name,
            url: doc.url,
            type: doc.type,
            createdAt: new Date().toISOString()
          })
          .select()
          .single();
        
        if (docError) {
          console.error('Erreur lors de la création du document:', docError);
        } else {
          documentsCreated.push(document);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        audit,
        documents: documentsCreated
      },
      message: 'Audit créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'audit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'audit'
    });
  }
}) as RequestHandler);

// Signer la charte pour un audit
router.post('/sign-charter', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { auditId, auditType } = req.body;
    
    if (!auditId || !auditType) {
      return res.status(400).json({ 
        success: false, 
        message: 'auditId et auditType sont requis' 
      });
    }
    
    // Vérifier que l'utilisateur a accès à cet audit
    const { data: audit, error: auditError } = await supabase
      .from('Audit')
      .select('*')
      .eq('id', auditId)
      .single();
    
    if (auditError) {
      console.error('Erreur lors de la récupération de l\'audit:', auditError);
      throw auditError;
    }
    
    if (!audit) {
      return res.status(404).json({ message: 'Audit non trouvé' });
    }
    
    if (audit.clientId !== authUser.id && authUser.type !== 'expert') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Mettre à jour l'audit pour marquer la charte comme signée
    const { data: updatedAudit, error: updateError } = await supabase
      .from('Audit')
      .update({
        charter_signed: true,
        status: 'en_cours',
        current_step: 2,
        updatedAt: new Date().toISOString()
      })
      .eq('id', auditId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'audit:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      data: { audit_id: auditId },
      message: 'Charte signée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la signature de la charte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la signature de la charte'
    });
  }
}) as RequestHandler);

// Mettre à jour le statut d'un audit
router.put('/:auditId/status', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { auditId } = req.params;
    const { status, comments } = req.body;
    
    // Vérifier que l'utilisateur est l'expert assigné à cet audit
    const { data: audit, error: auditError } = await supabase
      .from('Audit')
      .select('*')
      .eq('id', auditId)
      .single();
    
    if (auditError) {
      console.error('Erreur lors de la récupération de l\'audit:', auditError);
      throw auditError;
    }
    
    if (audit.expertId !== authUser.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Mettre à jour l'audit
    const { data: updatedAudit, error: updateError } = await supabase
      .from('Audit')
      .update({
        status,
        comments: comments || audit.comments,
        updatedAt: new Date().toISOString()
      })
      .eq('id', auditId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'audit:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedAudit,
      message: 'Statut de l\'audit mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'audit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de l\'audit'
    });
  }
}) as RequestHandler);

// Télécharger un document pour un audit
router.post('/:auditId/documents', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { auditId } = req.params;
    const { name, url, type } = req.body;
    
    // Vérifier que l'utilisateur a accès à cet audit
    const { data: audit, error: auditError } = await supabase
      .from('Audit')
      .select('*')
      .eq('id', auditId)
      .single();
    
    if (auditError) {
      console.error('Erreur lors de la récupération de l\'audit:', auditError);
      throw auditError;
    }
    
    if (audit.clientId !== authUser.id && audit.expertId !== authUser.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Créer le document
    const docId = crypto.randomUUID();
    
    const { data: document, error: docError } = await supabase
      .from('AuditDocument')
      .insert({
        id: docId,
        auditId,
        name,
        url,
        type,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (docError) {
      console.error('Erreur lors de la création du document:', docError);
      throw docError;
    }

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document ajouté avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du document'
    });
  }
}) as RequestHandler);

// Supprimer un document
router.delete('/documents/:documentId', authenticateUser, (async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    
    const authUser = req.user as AuthUser;
    const { documentId } = req.params;
    
    // Récupérer le document pour vérifier l'accès
    const { data: document, error: docError } = await supabase
      .from('AuditDocument')
      .select(`
        *,
        Audit (clientId, expertId)
      `)
      .eq('id', documentId)
      .single();
    
    if (docError) {
      console.error('Erreur lors de la récupération du document:', docError);
      throw docError;
    }
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Vérifier que l'utilisateur a accès à ce document
    const audit = document.Audit;
    if (audit.clientId !== authUser.id && audit.expertId !== authUser.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    // Supprimer le document
    const { error: deleteError } = await supabase
      .from('AuditDocument')
      .delete()
      .eq('id', documentId);
    
    if (deleteError) {
      console.error('Erreur lors de la suppression du document:', deleteError);
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du document'
    });
  }
}) as RequestHandler);

export default router; 