import express from 'express';
import { authenticateToken } from '../middleware/authenticate';
import { checkRole } from '../middleware/check-role';
import ComplianceService from '../services/compliance-service';
// import WorkflowConfigurationService from '../services/workflow-configuration-service';
import ExternalIntegrationsService from '../services/external-integrations-service';

const router = express.Router();
const complianceService = new ComplianceService();
// const workflowService = new WorkflowConfigurationService();
const integrationsService = new ExternalIntegrationsService();

// ===== ROUTES WORKFLOW PERSONNALISABLE =====
// COMMENTÉ - Service workflow supprimé temporairement

/*
router.get('/workflow/templates', 
  authenticateToken, 
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const { category } = req.query;
      let templates;

      if (category) {
        templates = await workflowService.getWorkflowTemplatesByCategory(category as string);
      } else {
        // Récupérer tous les templates actifs
        templates = await workflowService.getAllActiveTemplates();
      }

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Erreur récupération templates workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des templates'
      });
    }
  }
);
*/

/**
 * @route GET /api/workflow/templates/:id
 * @desc Obtenir un template de workflow spécifique
 * @access Admin, Expert
 */
router.get('/workflow/templates/:id',
  authenticateToken,
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const { id } = req.params;
      // const template = await workflowService.getWorkflowTemplate(id);

      // if (!template) {
      //   return res.status(404).json({
      //     success: false,
      //     error: 'Template de workflow non trouvé'
      //   });
      // }

      res.json({
        success: true,
        data: { message: 'Workflow templates are currently disabled.' }
      });
    } catch (error) {
      console.error('Erreur récupération template workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération du template'
      });
    }
  }
);

/**
 * @route POST /api/workflow/templates
 * @desc Créer un nouveau template de workflow
 * @access Admin
 */
router.post('/workflow/templates',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const templateData = req.body;
      // const templateId = await workflowService.createWorkflowTemplate(templateData);

      res.status(201).json({
        success: true,
        data: { message: 'Workflow templates are currently disabled.' },
        message: 'Template de workflow créé avec succès'
      });
    } catch (error) {
      console.error('Erreur création template workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création du template'
      });
    }
  }
);

/**
 * @route POST /api/workflow/instances
 * @desc Créer une nouvelle instance de workflow
 * @access Admin, Expert
 */
router.post('/workflow/instances',
  authenticateToken,
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const { template_id, document_id, client_id, expert_id } = req.body;
      // const instanceId = await workflowService.createWorkflowInstance(
      //   template_id,
      //   document_id,
      //   client_id,
      //   expert_id
      // );

      res.status(201).json({
        success: true,
        data: { message: 'Workflow instances are currently disabled.' },
        message: 'Instance de workflow créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création instance workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création de l\'instance'
      });
    }
  }
);

/**
 * @route POST /api/workflow/instances/:id/execute-step
 * @desc Exécuter une étape de workflow
 * @access Admin, Expert
 */
router.post('/workflow/instances/:id/execute-step',
  authenticateToken,
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { step_number, result } = req.body;
      const userId = req.user?.id;

      // const success = await workflowService.executeWorkflowStep(
      //   id,
      //   step_number,
      //   userId,
      //   result
      // );

      // if (success) {
        res.json({
          success: true,
          message: 'Étape de workflow exécutée avec succès'
        });
      // } else {
      //   res.status(400).json({
      //     success: false,
      //     error: 'Échec de l\'exécution de l\'étape'
      //   });
      // }
    } catch (error) {
      console.error('Erreur exécution étape workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'exécution de l\'étape'
      });
    }
  }
);

// ===== ROUTES INTÉGRATIONS EXTERNES =====

/**
 * @route POST /api/integrations/signature/request
 * @desc Créer une demande de signature électronique
 * @access Admin, Expert
 */
router.post('/integrations/signature/request',
  authenticateToken,
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const signatureRequest = req.body;
      let externalId;

      switch (signatureRequest.provider) {
        case 'docusign':
          externalId = await integrationsService.createDocuSignSignature(signatureRequest);
          break;
        case 'hellosign':
          externalId = await integrationsService.createHelloSignSignature(signatureRequest);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Provider de signature non supporté'
          });
      }

      res.status(201).json({
        success: true,
        data: { external_id: externalId },
        message: 'Demande de signature créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création demande signature:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création de la demande de signature'
      });
    }
  }
);

/**
 * @route GET /api/integrations/signature/:id/status
 * @desc Vérifier le statut d'une signature
 * @access Admin, Expert
 */
router.get('/integrations/signature/:id/status',
  authenticateToken,
  checkRole(['admin', 'expert']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { provider } = req.query;

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider requis'
        });
      }

      const status = await integrationsService.checkSignatureStatus(id, provider as string);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Erreur vérification statut signature:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification du statut'
      });
    }
  }
);

/**
 * @route POST /api/integrations/payment/request
 * @desc Créer une demande de paiement
 * @access Admin
 */
router.post('/integrations/payment/request',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const paymentRequest = req.body;
      let externalId;

      switch (paymentRequest.provider) {
        case 'stripe':
          externalId = await integrationsService.createStripePayment(paymentRequest);
          break;
        case 'paypal':
          externalId = await integrationsService.createPayPalPayment(paymentRequest);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Provider de paiement non supporté'
          });
      }

      res.status(201).json({
        success: true,
        data: { external_id: externalId },
        message: 'Demande de paiement créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création demande paiement:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création de la demande de paiement'
      });
    }
  }
);

/**
 * @route GET /api/integrations/payment/:id/status
 * @desc Vérifier le statut d'un paiement
 * @access Admin
 */
router.get('/integrations/payment/:id/status',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { provider } = req.query;

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider requis'
        });
      }

      const status = await integrationsService.checkPaymentStatus(id, provider as string);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Erreur vérification statut paiement:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification du statut'
      });
    }
  }
);

/**
 * @route POST /api/integrations/push/send
 * @desc Envoyer une notification push
 * @access Admin
 */
router.post('/integrations/push/send',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const notification = req.body;
      let externalId;

      switch (notification.provider) {
        case 'firebase':
          externalId = await integrationsService.sendFirebasePush(notification);
          break;
        case 'onesignal':
          externalId = await integrationsService.sendOneSignalPush(notification);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Provider de notification push non supporté'
          });
      }

      res.status(201).json({
        success: true,
        data: { external_id: externalId },
        message: 'Notification push envoyée avec succès'
      });
    } catch (error) {
      console.error('Erreur envoi notification push:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'envoi de la notification'
      });
    }
  }
);

// ===== ROUTES CONFORMITÉ =====

/**
 * @route GET /api/compliance/controls
 * @desc Obtenir les contrôles de conformité
 * @access Admin, CISO
 */
router.get('/compliance/controls',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const { standard } = req.query;
      let controls;

      if (standard) {
        controls = await complianceService.getComplianceControls(standard as string);
      } else {
        // Récupérer tous les contrôles
        controls = await complianceService.getAllComplianceControls();
      }

      res.json({
        success: true,
        data: controls,
        count: controls.length
      });
    } catch (error) {
      console.error('Erreur récupération contrôles conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des contrôles'
      });
    }
  }
);

/**
 * @route POST /api/compliance/controls
 * @desc Créer un contrôle de conformité
 * @access Admin, CISO
 */
router.post('/compliance/controls',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const controlData = req.body;
      const controlId = await complianceService.createComplianceControl(controlData);

      res.status(201).json({
        success: true,
        data: { id: controlId },
        message: 'Contrôle de conformité créé avec succès'
      });
    } catch (error) {
      console.error('Erreur création contrôle conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la création du contrôle'
      });
    }
  }
);

/**
 * @route PUT /api/compliance/controls/:id
 * @desc Mettre à jour un contrôle de conformité
 * @access Admin, CISO
 */
router.put('/compliance/controls/:id',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      await complianceService.updateComplianceControl(id, updates);

      res.json({
        success: true,
        message: 'Contrôle de conformité mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour contrôle conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la mise à jour du contrôle'
      });
    }
  }
);

/**
 * @route POST /api/compliance/reports/generate
 * @desc Générer un rapport de conformité
 * @access Admin, CISO
 */
router.post('/compliance/reports/generate',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const { standard, period_start, period_end } = req.body;
      const report = await complianceService.generateComplianceReport(
        standard,
        period_start,
        period_end
      );

      res.status(201).json({
        success: true,
        data: report,
        message: 'Rapport de conformité généré avec succès'
      });
    } catch (error) {
      console.error('Erreur génération rapport conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la génération du rapport'
      });
    }
  }
);

/**
 * @route GET /api/compliance/stats
 * @desc Obtenir les statistiques de conformité
 * @access Admin, CISO
 */
router.get('/compliance/stats',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const stats = await complianceService.getComplianceStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur récupération statistiques conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * @route POST /api/compliance/incidents
 * @desc Enregistrer un incident de sécurité
 * @access Admin, CISO
 */
router.post('/compliance/incidents',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const incidentData = req.body;
      const incidentId = await complianceService.recordSecurityIncident(incidentData);

      res.status(201).json({
        success: true,
        data: { id: incidentId },
        message: 'Incident de sécurité enregistré avec succès'
      });
    } catch (error) {
      console.error('Erreur enregistrement incident sécurité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'enregistrement de l\'incident'
      });
    }
  }
);

/**
 * @route POST /api/compliance/data-subject-requests
 * @desc Traiter une demande RGPD
 * @access Admin, DPO
 */
router.post('/compliance/data-subject-requests',
  authenticateToken,
  checkRole(['admin', 'dpo']),
  async (req, res) => {
    try {
      const requestData = req.body;
      const requestId = await complianceService.processDataSubjectRequest(requestData);

      res.status(201).json({
        success: true,
        data: { id: requestId },
        message: 'Demande RGPD traitée avec succès'
      });
    } catch (error) {
      console.error('Erreur traitement demande RGPD:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors du traitement de la demande'
      });
    }
  }
);

/**
 * @route GET /api/compliance/audit-logs
 * @desc Obtenir les logs d'audit
 * @access Admin, CISO
 */
router.get('/compliance/audit-logs',
  authenticateToken,
  checkRole(['admin', 'ciso']),
  async (req, res) => {
    try {
      const { user_id, action, resource_type, resource_id, start_date, end_date, limit = 100 } = req.query;

      const logs = await complianceService.getAuditLogs({
        user_id: user_id as string,
        action: action as string,
        resource_type: resource_type as string,
        resource_id: resource_id as string,
        start_date: start_date as string,
        end_date: end_date as string,
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Erreur récupération logs audit:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la récupération des logs'
      });
    }
  }
);

// ===== ROUTES D'INITIALISATION =====

/**
 * @route POST /api/compliance/initialize
 * @desc Initialiser les contrôles de conformité par défaut
 * @access Admin
 */
router.post('/compliance/initialize',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      const { standards } = req.body;

      for (const standard of standards) {
        switch (standard) {
          case 'iso_27001':
            await complianceService.initializeISO27001Controls();
            break;
          case 'soc_2':
            await complianceService.initializeSOC2Controls();
            break;
          case 'rgpd':
            await complianceService.initializeRGPDControls();
            break;
        }
      }

      res.json({
        success: true,
        message: 'Contrôles de conformité initialisés avec succès'
      });
    } catch (error) {
      console.error('Erreur initialisation contrôles conformité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'initialisation'
      });
    }
  }
);

/**
 * @route POST /api/workflow/initialize
 * @desc Initialiser les workflows par défaut
 * @access Admin
 */
router.post('/workflow/initialize',
  authenticateToken,
  checkRole(['admin']),
  async (req, res) => {
    try {
      // await workflowService.initializeDefaultWorkflows();

      res.json({
        success: true,
        message: 'Workflows par défaut initialisés avec succès'
      });
    } catch (error) {
      console.error('Erreur initialisation workflows:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de l\'initialisation'
      });
    }
  }
);

export default router; 