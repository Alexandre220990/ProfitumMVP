import express from 'express';
import { ProspectService } from '../services/ProspectService';
import { ProspectEmailService } from '../services/ProspectEmailService';
import { ProspectFilters } from '../types/prospects';

const router = express.Router();

// GET /api/prospects - Liste des prospects
router.get('/', async (req, res) => {
  try {
    const filters: ProspectFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      source: req.query.source as any,
      email_validity: req.query.email_validity as any,
      enrichment_status: req.query.enrichment_status as any,
      ai_status: req.query.ai_status as any,
      emailing_status: req.query.emailing_status as any,
      search: req.query.search as string,
        min_score_priority: req.query.min_score_priority ? parseInt(req.query.min_score_priority as string) : undefined,
        has_siren: req.query.has_siren === 'true',
        has_sequences: req.query.has_sequences === 'true' ? true : req.query.has_sequences === 'false' ? false : undefined,
        sort_by: (req.query.sort_by as any) || 'created_at',
        sort_order: (req.query.sort_order as any) || 'desc'
      };

    const result = await ProspectService.listProspects(filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/stats - Statistiques
router.get('/stats', async (req, res) => {
  try {
    const result = await ProspectService.getStats();
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/pending-enrichment - Prospects en attente d'enrichissement
router.get('/pending-enrichment', async (req, res) => {
  try {
    const result = await ProspectService.getPendingEnrichment();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/pending-ai - Prospects en attente d'IA
router.get('/pending-ai', async (req, res) => {
  try {
    const result = await ProspectService.getPendingAI();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/ready-for-emailing - Prospects prêts pour emailing
router.get('/ready-for-emailing', async (req, res) => {
  try {
    const result = await ProspectService.getReadyForEmailing();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/scheduled-sequences - Prospects avec séquences programmées
router.get('/scheduled-sequences', async (req, res) => {
  try {
    const filters: ProspectFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      source: req.query.source as any,
      enrichment_status: req.query.enrichment_status as any,
      ai_status: req.query.ai_status as any,
      emailing_status: req.query.emailing_status as any,
      search: req.query.search as string,
      sort_by: (req.query.sort_by as any) || 'created_at',
      sort_order: (req.query.sort_order as any) || 'desc'
    };

    const result = await ProspectService.getProspectsWithScheduledSequences(filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/completed-sequences - Prospects avec séquences terminées
router.get('/completed-sequences', async (req, res) => {
  try {
    const filters: ProspectFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      source: req.query.source as any,
      enrichment_status: req.query.enrichment_status as any,
      ai_status: req.query.ai_status as any,
      emailing_status: req.query.emailing_status as any,
      search: req.query.search as string,
      sort_by: (req.query.sort_by as any) || 'created_at',
      sort_order: (req.query.sort_order as any) || 'desc'
    };

    const result = await ProspectService.getProspectsWithCompletedSequences(filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects - Créer un prospect
router.post('/', async (req, res) => {
  try {
    const result = await ProspectService.createProspect(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/bulk - Créer plusieurs prospects
router.post('/bulk', async (req, res) => {
  try {
    const result = await ProspectService.createBulkProspects(req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/:id - Récupérer un prospect
router.get('/:id', async (req, res) => {
  try {
    const result = await ProspectService.getProspectById(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/:id - Mettre à jour un prospect
router.put('/:id', async (req, res) => {
  try {
    const result = await ProspectService.updateProspect(req.params.id, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/prospects/:id - Supprimer un prospect
router.delete('/:id', async (req, res) => {
  try {
    const result = await ProspectService.deleteProspect(req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/:id/emails - Récupérer les emails d'un prospect
router.get('/:id/emails', async (req, res) => {
  try {
    const result = await ProspectService.getProspectEmails(req.params.id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/:id/emails - Créer un email pour un prospect
router.post('/:id/emails', async (req, res) => {
  try {
    const result = await ProspectService.createProspectEmail({
      ...req.body,
      prospect_id: req.params.id
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SÉQUENCES D'EMAILS =====

// GET /api/prospects/sequences - Récupérer toutes les séquences
router.get('/sequences/list', async (req, res) => {
  try {
    const result = await ProspectService.getEmailSequences();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/sequences - Créer une séquence
router.post('/sequences', async (req, res) => {
  try {
    const result = await ProspectService.createEmailSequence(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/sequences/:id - Mettre à jour une séquence
router.put('/sequences/:id', async (req, res) => {
  try {
    const result = await ProspectService.updateEmailSequence(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/prospects/sequences/:id - Supprimer une séquence
router.delete('/sequences/:id', async (req, res) => {
  try {
    const result = await ProspectService.deleteEmailSequence(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/:id/schedule-sequence - Programmer une séquence pour un prospect
router.post('/:id/schedule-sequence', async (req, res) => {
  try {
    const { sequence_id, start_date } = req.body;
    if (!sequence_id) {
      return res.status(400).json({ success: false, error: 'sequence_id requis' });
    }
    
    const result = await ProspectService.scheduleSequenceForProspect(
      req.params.id,
      sequence_id,
      start_date
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/:id/schedule-custom-sequence - Programmer une séquence personnalisée pour un prospect
router.post('/:id/schedule-custom-sequence', async (req, res) => {
  try {
    const { email, scheduled_emails } = req.body;
    
    if (!email || !scheduled_emails || !Array.isArray(scheduled_emails) || scheduled_emails.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'email et scheduled_emails (array) sont requis' 
      });
    }

    const result = await ProspectService.scheduleCustomSequenceForProspect(
      req.params.id,
      email,
      scheduled_emails
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/:id/scheduled-emails - Récupérer les emails programmés
router.get('/:id/scheduled-emails', async (req, res) => {
  try {
    const result = await ProspectService.getScheduledEmails(req.params.id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/prospects/scheduled-emails/:emailId - Annuler un email programmé
router.delete('/scheduled-emails/:emailId', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await ProspectService.cancelScheduledEmail(req.params.emailId, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/scheduled-emails/:emailId/delay - Modifier le délai d'un email programmé
router.put('/scheduled-emails/:emailId/delay', async (req, res) => {
  try {
    const { delay_days } = req.body;
    
    if (delay_days === undefined || delay_days === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'delay_days est requis' 
      });
    }

    const result = await ProspectService.updateScheduledEmailDelay(
      req.params.emailId,
      parseInt(delay_days)
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/scheduled-emails/:emailId - Modifier le sujet et/ou la date d'envoi d'un email programmé
router.put('/scheduled-emails/:emailId', async (req, res) => {
  try {
    const { subject, scheduled_for } = req.body;
    
    if (!subject && !scheduled_for) {
      return res.status(400).json({ 
        success: false, 
        error: 'Au moins un champ (subject ou scheduled_for) doit être fourni' 
      });
    }

    const result = await ProspectService.updateScheduledEmail(
      req.params.emailId,
      {
        subject,
        scheduled_for
      }
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ENVOI D'EMAILS =====

// POST /api/prospects/:id/send-email - Envoyer un email à un prospect
router.post('/:id/send-email', async (req, res) => {
  try {
    const { subject, body, step, scheduled_email_id } = req.body;
    
    if (!subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'subject et body sont requis' 
      });
    }

    const result = await ProspectEmailService.sendProspectEmail({
      prospect_id: req.params.id,
      subject,
      body,
      step,
      scheduled_email_id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/send-bulk - Envoyer des emails à plusieurs prospects
router.post('/send-bulk', async (req, res) => {
  try {
    const { prospect_ids, subject, body, step } = req.body;
    
    if (!prospect_ids || !Array.isArray(prospect_ids) || prospect_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'prospect_ids (array) est requis' 
      });
    }

    if (!subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'subject et body sont requis' 
      });
    }

    const result = await ProspectEmailService.sendBulkProspectEmails({
      prospect_ids,
      subject,
      body,
      step
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/send-scheduled - Envoyer les emails programmés qui sont dus
router.post('/send-scheduled', async (req, res) => {
  try {
    const result = await ProspectEmailService.sendScheduledEmailsDue();
    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GESTION SÉQUENCES =====

// PUT /api/prospects/:id/pause-sequence - Suspendre une séquence
router.put('/:id/pause-sequence', async (req, res) => {
  try {
    const result = await ProspectService.pauseResumeSequence(req.params.id, true);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/:id/resume-sequence - Reprendre une séquence
router.put('/:id/resume-sequence', async (req, res) => {
  try {
    const result = await ProspectService.pauseResumeSequence(req.params.id, false);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/:id/restart-sequence - Relancer une séquence terminée
router.post('/:id/restart-sequence', async (req, res) => {
  try {
    const { scheduled_emails } = req.body;
    
    if (!scheduled_emails || !Array.isArray(scheduled_emails) || scheduled_emails.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'scheduled_emails (array) est requis' 
      });
    }

    const result = await ProspectService.restartSequence(
      req.params.id,
      scheduled_emails
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

