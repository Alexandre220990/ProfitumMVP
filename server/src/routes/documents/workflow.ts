import express from 'express';
import DocumentWorkflowService, { DocumentWorkflow, DocumentCategory, UserRole } from '../../services/document-workflow-service';
import { authenticateToken } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = express.Router();
const workflowService = new DocumentWorkflowService();

// ===== ROUTES WORKFLOW =====

/**
 * Initialiser le workflow pour un nouveau client
 * POST /api/documents/workflow/initialize-client
 */
router.post('/initialize-client', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { clientId } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'clientId requis' 
      });
    }

    const success = await workflowService.initializeClientWorkflow(clientId);
    
    if (success) {
      return res.json({ 
        success: true, 
        message: 'Workflow client initialisé avec succès' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'initialisation du workflow' 
      });
    }
  })
);

/**
 * Créer une demande de document
 * POST /api/documents/workflow/request
 */
router.post('/request',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      clientId,
      category,
      description,
      required = true,
      deadline,
      expertId,
      workflow
    } = req.body;

    // Validation des données
    if (!clientId || !category || !description || !workflow) {
      return res.status(400).json({
        success: false,
        error: 'clientId, category, description et workflow requis'
      });
    }

    // Validation de la catégorie
    if (!Object.values(DocumentCategory).includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Catégorie invalide'
      });
    }

    // Validation du workflow
    if (!Object.values(DocumentWorkflow).includes(workflow)) {
      return res.status(400).json({
        success: false,
        error: 'Workflow invalide'
      });
    }

    try {
      const requestId = await workflowService.createDocumentRequest({
        clientId,
        category,
        description,
        required,
        deadline: deadline ? new Date(deadline) : undefined,
        expertId,
        workflow
      });

      return res.json({
        success: true,
        requestId,
        message: 'Demande de document créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création demande document:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la demande'
      });
    }
  })
);

/**
 * Upload de document avec workflow
 * POST /api/documents/workflow/upload
 */
router.post('/upload',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      clientId,
      category,
      description,
      workflow,
      expertId
    } = req.body;

    // Validation des données
    if (!clientId || !category || !description || !workflow) {
      return res.status(400).json({
        success: false,
        error: 'clientId, category, description et workflow requis'
      });
    }

    // Récupération du fichier depuis multer ou autre middleware
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Fichier requis'
      });
    }

    try {
      const result = await workflowService.uploadDocumentWithWorkflow(
        file.buffer,
        clientId,
        category,
        description,
        workflow,
        expertId
      );

      if (result.success) {
        return res.json({
          success: true,
          fileId: result.fileId,
          message: 'Document uploadé avec succès'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erreur lors de l\'upload'
        });
      }
    } catch (error) {
      console.error('Erreur upload document:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'upload du document'
      });
    }
  })
);

/**
 * Compléter une étape du workflow
 * POST /api/documents/workflow/complete-step
 */
router.post('/complete-step',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      documentRequestId,
      workflow,
      comments
    } = req.body;

    const userId = req.user?.id;

    if (!documentRequestId || !workflow || !userId) {
      return res.status(400).json({
        success: false,
        error: 'documentRequestId, workflow et utilisateur requis'
      });
    }

    try {
      const success = await workflowService.completeWorkflowStep(
        documentRequestId,
        workflow,
        userId,
        comments
      );

      if (success) {
        return res.json({
          success: true,
          message: 'Étape du workflow complétée avec succès'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la complétion de l\'étape'
        });
      }
    } catch (error) {
      console.error('Erreur complétion étape:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la complétion de l\'étape'
      });
    }
  })
);

// ===== ROUTES DE CONSULTATION =====

/**
 * Obtenir le workflow d'un client
 * GET /api/documents/workflow/client/:clientId
 */
router.get('/client/:clientId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const userRole = req.user?.role;

    // Vérification des permissions
    if (userRole !== 'admin' && userRole !== 'profitum' && req.user?.id !== clientId) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    try {
      const workflow = await workflowService.getClientWorkflow(clientId);
      
      return res.json({
        success: true,
        workflow,
        count: workflow.length
      });
    } catch (error) {
      console.error('Erreur récupération workflow client:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du workflow'
      });
    }
  })
);

/**
 * Obtenir les documents en attente de l'utilisateur
 * GET /api/documents/workflow/pending
 */
router.get('/pending',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        error: 'Informations utilisateur manquantes'
      });
    }

    try {
      const pendingDocuments = await workflowService.getPendingDocuments(userId, userRole as any);
      
      return res.json({
        success: true,
        pendingDocuments,
        count: pendingDocuments.length
      });
    } catch (error) {
      console.error('Erreur récupération documents en attente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des documents en attente'
      });
    }
  })
);

/**
 * Obtenir les statistiques du workflow
 * GET /api/documents/workflow/stats
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userRole = req.user?.role;

    // Seuls les admins et Profitum peuvent voir les stats
    if (userRole !== 'admin' && userRole !== 'profitum') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    try {
      // Requête pour obtenir les statistiques
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Stats par statut
      const { data: statusStats } = await supabase
        .from('DocumentRequest')
        .select('status')
        .then(result => {
          const stats = result.data?.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {} as any) || {};
          return { data: stats };
        });

      // Stats par catégorie
      const { data: categoryStats } = await supabase
        .from('DocumentRequest')
        .select('category')
        .then(result => {
          const stats = result.data?.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {} as any) || {};
          return { data: stats };
        });

      // Stats par workflow
      const { data: workflowStats } = await supabase
        .from('DocumentRequest')
        .select('workflow')
        .then(result => {
          const stats = result.data?.reduce((acc, item) => {
            acc[item.workflow] = (acc[item.workflow] || 0) + 1;
            return acc;
          }, {} as any) || {};
          return { data: stats };
        });

      // Documents en retard
      const { data: overdueDocuments } = await supabase
        .from('DocumentRequest')
        .select('*')
        .lt('deadline', new Date().toISOString())
        .eq('status', 'pending');

      return res.json({
        success: true,
        stats: {
          byStatus: statusStats,
          byCategory: categoryStats,
          byWorkflow: workflowStats,
          overdue: overdueDocuments?.length || 0,
          total: Object.values(statusStats || {}).reduce((a: any, b: any) => a + b, 0)
        }
      });
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  })
);

// ===== ROUTES DE VALIDATION =====

/**
 * Valider un document
 * POST /api/documents/workflow/validate
 */
router.post('/validate',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      documentFileId,
      validationType,
      status,
      comments
    } = req.body;

    const validatorId = req.user?.id;
    const validatorRole = req.user?.role;

    if (!documentFileId || !validationType || !status || !validatorId || !validatorRole) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('DocumentValidation')
        .insert({
          document_file_id: documentFileId,
          validator_id: validatorId,
          validator_role: validatorRole,
          validation_type: validationType,
          status,
          comments,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        validationId: data.id,
        message: 'Validation enregistrée avec succès'
      });
    } catch (error) {
      console.error('Erreur validation document:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la validation'
      });
    }
  })
);

/**
 * Obtenir les validations d'un document
 * GET /api/documents/workflow/validations/:documentFileId
 */
router.get('/validations/:documentFileId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { documentFileId } = req.params;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('DocumentValidation')
        .select('*')
        .eq('document_file_id', documentFileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json({
        success: true,
        validations: data || []
      });
    } catch (error) {
      console.error('Erreur récupération validations:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des validations'
      });
    }
  })
);

// ===== ROUTES DE PARTAGE =====

/**
 * Partager un document
 * POST /api/documents/workflow/share
 */
router.post('/share',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      documentFileId,
      sharedWith,
      shareType,
      expiresAt
    } = req.body;

    const sharedBy = req.user?.id;

    if (!documentFileId || !sharedWith || !shareType || !sharedBy) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('DocumentShare')
        .insert({
          document_file_id: documentFileId,
          shared_by: sharedBy,
          shared_with: sharedWith,
          share_type: shareType,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        shareId: data.id,
        message: 'Document partagé avec succès'
      });
    } catch (error) {
      console.error('Erreur partage document:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du partage'
      });
    }
  })
);

/**
 * Obtenir les partages d'un document
 * GET /api/documents/workflow/shares/:documentFileId
 */
router.get('/shares/:documentFileId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { documentFileId } = req.params;
    const userId = req.user?.id;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data, error } = await supabase
        .from('DocumentShare')
        .select('*')
        .eq('document_file_id', documentFileId)
        .eq('active', true)
        .or(`shared_by.eq.${userId},shared_with.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json({
        success: true,
        shares: data || []
      });
    } catch (error) {
      console.error('Erreur récupération partages:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des partages'
      });
    }
  })
);

export default router; 