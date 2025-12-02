import express from 'express';
import { ProspectService } from '../services/ProspectService';
import { ProspectEmailService } from '../services/ProspectEmailService';
import { ProspectFilters } from '../types/prospects';
import OpenAI from 'openai';

const router = express.Router();

// Initialiser OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

// ===== ROUTES EMAILS REÇUS =====

// GET /api/prospects/:id/emails-received - Récupérer tous les emails reçus d'un prospect
router.get('/:id/emails-received', async (req, res) => {
  try {
    const result = await ProspectService.getReceivedEmails(req.params.id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/:id/emails-received/:emailId - Récupérer un email reçu spécifique
router.get('/:id/emails-received/:emailId', async (req, res) => {
  try {
    const result = await ProspectService.getReceivedEmail(req.params.id, req.params.emailId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/:id/emails-received/:emailId/mark-read - Marquer un email reçu comme lu
router.post('/:id/emails-received/:emailId/mark-read', async (req, res) => {
  try {
    const result = await ProspectService.markReceivedEmailAsRead(req.params.id, req.params.emailId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prospects/generate-email-reply - Générer une réponse avec IA
router.post('/generate-email-reply', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI non configuré'
      });
    }

    const {
      prospect_name,
      prospect_email,
      sent_emails_history,
      received_email,
      num_steps,
      steps
    } = req.body;

    // Construire le prompt pour l'IA
    const historyText = sent_emails_history
      .map((e: any, i: number) => `Email ${i + 1} envoyé:\nSujet: ${e.subject}\nCorps: ${e.body}\n`)
      .join('\n');

    const systemPrompt = `Tu es un expert en réponse commerciale pour Profitum, plateforme de courtage en financement professionnel.

🎯 CONTEXTE
Tu réponds à ${prospect_name} (${prospect_email}) qui a répondu à notre prospection.

📧 HISTORIQUE DE LA CONVERSATION
${historyText}

📩 RÉPONSE REÇUE DU PROSPECT
${received_email}

✅ CONSIGNES
1. Répondre de manière professionnelle et personnalisée
2. Tenir compte du contexte de la conversation
3. Adapter le ton à la réponse du prospect
4. Proposer une action concrète (rendez-vous, appel, etc.)
5. Rester concis (150-200 mots max par email)
6. Signature: "Alexandre, Co-fondateur Profitum"

${num_steps > 1 ? `\n📋 SÉQUENCE DEMANDÉE\n${num_steps} emails avec relances progressives si besoin\n` : ''}`;

    const userPrompt = `Génère ${num_steps} email(s) de réponse au format JSON:
{
  "steps": [
    {
      "step_number": 1,
      "subject": "...",
      "body": "... (HTML)"
    }
  ]
}

${steps.map((s: any) => `Email ${s.step_number}: ${s.subject} (délai: ${s.delay_days} jours)`).join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const generated = JSON.parse(completion.choices[0].message.content || '{}');

    return res.json({
      success: true,
      data: generated
    });
  } catch (error: any) {
    console.error('Erreur génération IA réponse:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur génération IA'
    });
  }
});

// POST /api/prospects/:id/send-reply/:emailReceivedId - Envoyer une réponse (et relances)
router.post('/:id/send-reply/:emailReceivedId', async (req, res) => {
  try {
    const { steps } = req.body;
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun email à envoyer'
      });
    }

    const result = await ProspectService.sendReplyWithFollowUps(
      req.params.id,
      req.params.emailReceivedId,
      steps
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Erreur envoi réponse:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur envoi réponse'
    });
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

// PUT /api/prospects/scheduled-emails/:emailId/comment - Ajouter/modifier un commentaire sur un email programmé
router.put('/scheduled-emails/:emailId/comment', async (req, res) => {
  try {
    const { comment } = req.body;
    const result = await ProspectService.updateScheduledEmailComment(req.params.emailId, comment);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prospects/emails/:emailId/comment - Ajouter/modifier un commentaire sur un email envoyé
router.put('/emails/:emailId/comment', async (req, res) => {
  try {
    const { comment } = req.body;
    const result = await ProspectService.updateProspectEmailComment(req.params.emailId, comment);
    
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

// POST /api/prospects/generate-ai-sequence - Générer une séquence d'emails avec IA
router.post('/generate-ai-sequence', async (req, res) => {
  try {
    const { prospectInfo, steps, context } = req.body;

    if (!prospectInfo || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Informations prospect et étapes requises'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Configuration OpenAI manquante. Veuillez configurer OPENAI_API_KEY.'
      });
    }

    // Construire le prompt pour ChatGPT
    const companyName = prospectInfo.company_name || 'l\'entreprise';
    const decisionMaker = prospectInfo.firstname && prospectInfo.lastname
      ? `${prospectInfo.firstname} ${prospectInfo.lastname}`
      : prospectInfo.firstname || prospectInfo.lastname || 'le décisionnaire';
    const siren = prospectInfo.siren || '';
    const nafCode = prospectInfo.naf_code || '';
    const nafLabel = prospectInfo.naf_label || '';
    
    // Construire les informations secteur
    let secteurInfo = '';
    if (siren) {
      secteurInfo += `SIREN: ${siren}`;
    }
    if (nafCode) {
      secteurInfo += secteurInfo ? ` | Code NAF: ${nafCode}` : `Code NAF: ${nafCode}`;
    }
    if (nafLabel) {
      secteurInfo += secteurInfo ? ` | Activité: ${nafLabel}` : `Activité: ${nafLabel}`;
    }
    if (!secteurInfo) {
      secteurInfo = 'non renseigné';
    }

    const numSteps = steps.length;
    const stepsInfo = steps.map((step: any, index: number) => {
      let stepType = '';
      if (index === 0) {
        stepType = 'Email 1 — Prise de contact (objectif : point téléphonique)';
      } else if (index === numSteps - 1) {
        stepType = `Email ${index + 1} — Dernière tentative courtoise`;
      } else {
        stepType = `Email ${index + 1} — Relance`;
      }
      
      return `Étape ${step.stepNumber}: ${stepType} (délai: ${step.delayDays} jour${step.delayDays > 1 ? 's' : ''} après l'étape précédente)`;
    }).join('\n');

    // Déterminer la structure des emails selon le nombre d'étapes
    let emailStructureGuide = '';
    if (numSteps === 1) {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique`;
    } else if (numSteps === 2) {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Phrase de clôture : "je clos ma boucle si vous n'êtes pas concerné(e)"`;
    } else if (numSteps === 3) {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)

Email 3 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Interroger sur la réception de nos précédents emails.
- Repréciser les avantages en fonction du profil de l'entreprise`;
    } else {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)
- Proposition d'un point téléphonique court

Email 3 — Relance orientée résultat (70–90 mots)
- Nouveau bénéfice différent, toujours sectorisé
- Mention discrète : "vos homologues y gagnent souvent…"
- Proposition claire : point téléphonique de 10 min`;
      if (numSteps > 3) {
        emailStructureGuide += `\n\nEmail 4 à ${numSteps - 1} — Relances intermédiaires (70–90 mots chacune)
- Varier les bénéfices et angles sectorisés
- Toujours proposer un point téléphonique
- Rester professionnel et non intrusif`;
      }
      emailStructureGuide += `\n\nEmail ${numSteps} — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Interroger sur la réception de nos précédents emails
- Repréciser les avantages en fonction du profil de l'entreprise`;
    }

    // Construire le prompt système - version optimisée et moins restrictive
    let systemPrompt = `Tu es un assistant expert en prospection B2B pour Profitum, une plateforme qui aide les entreprises françaises à identifier, vérifier et activer les dispositifs d'optimisation fiscale, sociale, énergétique et foncière adaptés à leur situation réelle (TICPE, URSSAF, DFS, Foncier, CEE, Énergie, etc.).

📋 TA MISSION PRINCIPALE

Ta mission est de rédiger ${numSteps} e-mail${numSteps > 1 ? 's' : ''} professionnel${numSteps > 1 ? 's' : ''} en optimisant les instructions fournies par l'utilisateur dans le contexte. Tu dois adapter et améliorer le souhait de l'utilisateur pour créer des emails efficaces et pertinents.

🎯 INFORMATIONS DISPONIBLES POUR LA PERSONNALISATION

- Nom de l'entreprise : ${companyName}
- Décisionnaire : ${decisionMaker}
- Informations secteur : ${secteurInfo}
  → Le SIREN permet d'identifier l'entreprise de manière unique
  → Le code NAF (code APE) et son libellé révèlent précisément le secteur d'activité
  → Exemples de déductions : code NAF "49" = transport, "43" = BTP, "25" = industrie métallurgie, "56" = restauration, etc.

💡 GUIDE D'OPTIMISATION (Suggestions, pas d'obligations strictes)

Pour optimiser les emails générés, voici des suggestions que tu peux appliquer :

1. PERSONNALISATION
   - Utiliser systématiquement le nom de l'entreprise et du décisionnaire
   - S'appuyer sur le secteur d'activité pour personnaliser les angles d'approche
   - Intégrer naturellement le contexte utilisateur

2. STYLE RECOMMANDÉ
   - Style sobre, humain, non-marketing
   - Phrases courtes et claires
   - Ton consultatif plutôt que commercial

3. ANTI-SPAM (Recommandations importantes)
   - Éviter le mot "gratuit" (préférer "sans engagement", "sans frais", "complémentaire")
   - Limiter les emojis, points d'exclamation et majuscules commerciales
   - Éviter les call-to-action agressifs

4. STRUCTURE SUGGÉRÉE

${emailStructureGuide}

⚠️ IMPORTANT : Ces suggestions servent à optimiser les emails. Si le contexte utilisateur indique une approche différente, adapte-toi tout en conservant la qualité professionnelle et la personnalisation.

STRUCTURE DE LA SÉQUENCE À GÉNÉRER :
${stepsInfo}`;

    // Construire le prompt utilisateur avec le contexte en priorité
    let userContextPrompt = '';
    if (context && context.trim()) {
      userContextPrompt = `🎯 INSTRUCTIONS DE L'UTILISATEUR (PRIORITÉ ABSOLUE) :

${context.trim()}

Ces instructions décrivent ce que l'utilisateur souhaite pour cette séquence d'emails. Tu dois :
1. Comprendre et respecter ces instructions comme base principale
2. Utiliser le prompt système pour optimiser et améliorer ces instructions
3. Adapter les suggestions du prompt système selon le contexte utilisateur
4. Intégrer les informations du prospect (nom, entreprise, secteur) pour personnaliser les emails

Si les instructions utilisateur sont incomplètes ou vagues, utilise les suggestions du prompt système pour enrichir et compléter intelligemment.`;
    } else {
      userContextPrompt = `Note : Aucune instruction spécifique n'a été fournie par l'utilisateur. Utilise les suggestions du prompt système pour créer une séquence d'emails professionnelle et personnalisée basée sur les informations du prospect.`;
    }

    // Construire le prompt utilisateur final qui intègre le contexte en priorité
    const userPrompt = `${userContextPrompt}

📝 FORMAT DE RÉPONSE REQUIS :

Retourne un JSON avec cette structure exacte, en générant EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} :
{
  "steps": [
    {
      "stepNumber": 1,
      "subject": "Sujet de l'email",
      "body": "Corps de l'email (peut contenir des sauts de ligne avec \\n)"
    }${numSteps > 1 ? ',\n    {\n      "stepNumber": 2,\n      "subject": "...",\n      "body": "..."\n    }' : ''}${numSteps > 2 ? ',\n    ...' : ''}
  ]
}

IMPORTANT : 
- Génère EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} correspondant aux ${numSteps} étape${numSteps > 1 ? 's' : ''} de la séquence
- Ne modifie PAS les délais entre emails (delayDays) - ils sont déjà définis
- Respecte les instructions utilisateur fournies dans le contexte (si disponibles)
- Utilise les suggestions du prompt système pour optimiser et compléter intelligemment
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Le corps des emails doit être en français, professionnel et adapté au contexte`;

    // Appeler ChatGPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // ou 'gpt-4-turbo' selon votre préférence
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.6, // Température légèrement réduite pour des emails plus cohérents et professionnels
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération par IA'
      });
    }

    // Parser la réponse JSON
    let generatedSteps;
    try {
      generatedSteps = JSON.parse(responseContent);
    } catch (parseError) {
      // Essayer d'extraire le JSON si la réponse contient du texte supplémentaire
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedSteps = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Format de réponse invalide');
      }
    }

    // Vérifier que la structure est correcte
    if (!generatedSteps.steps || !Array.isArray(generatedSteps.steps)) {
      return res.status(500).json({
        success: false,
        error: 'Format de réponse IA invalide'
      });
    }

    // Vérifier que le nombre d'emails générés correspond au nombre demandé
    if (generatedSteps.steps.length !== numSteps) {
      console.warn(`Nombre d'emails générés (${generatedSteps.steps.length}) ne correspond pas au nombre demandé (${numSteps})`);
      // Continuer quand même mais avec un avertissement
    }

    // Mapper les résultats avec les délais originaux
    const result = generatedSteps.steps.map((generatedStep: any, index: number) => {
      const originalStep = steps.find((s: any) => s.stepNumber === generatedStep.stepNumber);
      return {
        stepNumber: generatedStep.stepNumber,
        delayDays: originalStep?.delayDays || steps[index]?.delayDays || 0,
        subject: generatedStep.subject || '',
        body: generatedStep.body?.replace(/\\n/g, '\n') || ''
      };
    });

    return res.json({
      success: true,
      data: { steps: result }
    });

  } catch (error: any) {
    console.error('Erreur génération IA:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération par IA'
    });
  }
});

// POST /api/prospects/generate-ai-sequence-batch - Générer des séquences d'emails pour plusieurs prospects
router.post('/generate-ai-sequence-batch', async (req, res) => {
  try {
    const { prospects, steps, context } = req.body;

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste de prospects requise'
      });
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Étapes de séquence requises'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Configuration OpenAI manquante. Veuillez configurer OPENAI_API_KEY.'
      });
    }

    // Générer les séquences pour chaque prospect
    const results = [];
    
    for (const prospectInfo of prospects) {
      try {
        // Construire le prompt pour ChatGPT
        const companyName = prospectInfo.company_name || 'l\'entreprise';
        const decisionMaker = prospectInfo.firstname && prospectInfo.lastname
          ? `${prospectInfo.firstname} ${prospectInfo.lastname}`
          : prospectInfo.firstname || prospectInfo.lastname || 'le décisionnaire';
        const siren = prospectInfo.siren || '';
        const nafCode = prospectInfo.naf_code || '';
        const nafLabel = prospectInfo.naf_label || '';
        
        // Construire les informations secteur
        let secteurInfo = '';
        if (siren) {
          secteurInfo += `SIREN: ${siren}`;
        }
        if (nafCode) {
          secteurInfo += secteurInfo ? ` | Code NAF: ${nafCode}` : `Code NAF: ${nafCode}`;
        }
        if (nafLabel) {
          secteurInfo += secteurInfo ? ` | Activité: ${nafLabel}` : `Activité: ${nafLabel}`;
        }
        if (!secteurInfo) {
          secteurInfo = 'non renseigné';
        }

        const numSteps = steps.length;
        const stepsInfo = steps.map((step: any, index: number) => {
          let stepType = '';
          if (index === 0) {
            stepType = 'Email 1 — Prise de contact (objectif : point téléphonique)';
          } else if (index === numSteps - 1) {
            stepType = `Email ${index + 1} — Dernière tentative courtoise`;
          } else {
            stepType = `Email ${index + 1} — Relance`;
          }
          
          return `Étape ${step.stepNumber}: ${stepType} (délai: ${step.delayDays} jour${step.delayDays > 1 ? 's' : ''} après l'étape précédente)`;
        }).join('\n');

        // Déterminer la structure des emails selon le nombre d'étapes
        let emailStructureGuide = '';
        if (numSteps === 1) {
          emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique`;
        } else if (numSteps === 2) {
          emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Phrase de clôture : "je clos ma boucle si vous n'êtes pas concerné(e)"`;
        } else if (numSteps === 3) {
          emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)

Email 3 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Interroger sur la réception de nos précédents emails.
- Repréciser les avantages en fonction du profil de l'entreprise`;
        } else {
          emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un point téléphonique

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)

Emails suivants — Relances progressives
- Augmenter progressivement l'urgence et la personnalisation
- Varier les angles d'approche et les bénéfices mis en avant

Email ${numSteps} — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Interroger sur la réception de nos précédents emails.
- Repréciser les avantages en fonction du profil de l'entreprise`;
        }

        // Construire le prompt système
        const systemPrompt = `Tu es un expert en prospection commerciale B2B pour Profitum, une plateforme de courtage en financement professionnel. Ton rôle est de créer des séquences d'emails personnalisées, professionnelles et performantes.

🎯 CONTEXTE PROFITUM
Profitum met en relation les entreprises avec les meilleures solutions de financement (crédit pro, leasing, affacturage, etc.) et les meilleurs partenaires bancaires. Nous optimisons les conditions et accélérons les démarches.

📋 INFORMATIONS DU PROSPECT
- Entreprise: ${companyName}
- Décisionnaire: ${decisionMaker}
- Secteur d'activité: ${secteurInfo}

🔢 SÉQUENCE DEMANDÉE
${stepsInfo}

📐 STRUCTURE DES EMAILS
${emailStructureGuide}

✅ RÈGLES OBLIGATOIRES
1. Personnalisation : Adapter chaque email au profil de l'entreprise (secteur NAF, SIREN, taille)
2. Ton professionnel mais chaleureux : Français business mais jamais rigide
3. Bénéfices concrets : Focus sur les gains réels pour l'entreprise (taux, rapidité, simplicité)
4. Icebreaker pertinent : Email 1 doit contenir une accroche personnalisée liée au secteur
5. Objets courts et efficaces : 5-7 mots max, engageants, pas de spam
6. Corps concis : Respecter strictement les limites de mots indiquées
7. Call-to-action clair : Toujours proposer une action simple (point téléphonique)
8. Pas de spam : Éviter les mots comme "gratuit", "offre exceptionnelle", etc.
9. Signature cohérente : Utiliser "Alexandre" ou "Alex" comme prénom, "Co-fondateur Profitum"

⚠️ INTERDICTIONS
- Jamais de "Bonjour Monsieur/Madame" générique (toujours utiliser le prénom/nom si disponible)
- Pas de discours commercial trop agressif ou vendeur
- Éviter les formules bateau ("j'espère que vous allez bien")
- Pas de liste à puces dans les emails (intégrer naturellement dans le texte)
- Ne pas mentionner explicitement qu'on connaît le SIREN ou code NAF (l'utiliser subtilement)`;

        // Construire le prompt utilisateur avec contexte prioritaire
        const userContextPrompt = context?.trim() 
          ? `📝 INSTRUCTIONS PRIORITAIRES DE L'UTILISATEUR :
${context.trim()}

⚡ IMPORTANT : Ces instructions sont la BASE de ta génération. Respecte-les en priorité et utilise le prompt système pour optimiser et enrichir selon les bonnes pratiques de prospection B2B.`
          : `📝 GÉNÉRATION STANDARD :
Génère une séquence d'emails professionnelle et efficace en respectant toutes les règles ci-dessus, adaptée spécifiquement au profil de ${companyName} dans le secteur ${secteurInfo}.`;

        const userPrompt = `${userContextPrompt}

📝 FORMAT DE RÉPONSE REQUIS :

Retourne un JSON avec cette structure exacte, en générant EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} :
{
  "steps": [
    {
      "stepNumber": 1,
      "subject": "Sujet de l'email",
      "body": "Corps de l'email (peut contenir des sauts de ligne avec \\n)"
    }${numSteps > 1 ? ',\n    {\n      "stepNumber": 2,\n      "subject": "...",\n      "body": "..."\n    }' : ''}${numSteps > 2 ? ',\n    ...' : ''}
  ]
}

IMPORTANT : 
- Génère EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} correspondant aux ${numSteps} étape${numSteps > 1 ? 's' : ''} de la séquence
- Ne modifie PAS les délais entre emails (delayDays) - ils sont déjà définis
- Respecte les instructions utilisateur fournies dans le contexte (si disponibles)
- Utilise les suggestions du prompt système pour optimiser et compléter intelligemment
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Le corps des emails doit être en français, professionnel et adapté au contexte`;

        // Appeler ChatGPT
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
          results.push({
            prospect_id: prospectInfo.id,
            success: false,
            error: 'Erreur lors de la génération par IA'
          });
          continue;
        }

        // Parser la réponse JSON
        let generatedSteps;
        try {
          generatedSteps = JSON.parse(responseContent);
        } catch (parseError) {
          // Essayer d'extraire le JSON si la réponse contient du texte supplémentaire
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedSteps = JSON.parse(jsonMatch[0]);
          } else {
            results.push({
              prospect_id: prospectInfo.id,
              success: false,
              error: 'Format de réponse invalide'
            });
            continue;
          }
        }

        // Vérifier que la structure est correcte
        if (!generatedSteps.steps || !Array.isArray(generatedSteps.steps)) {
          results.push({
            prospect_id: prospectInfo.id,
            success: false,
            error: 'Format de réponse IA invalide'
          });
          continue;
        }

        // Mapper les résultats avec les délais originaux
        const result = generatedSteps.steps.map((generatedStep: any, index: number) => {
          const originalStep = steps.find((s: any) => s.stepNumber === generatedStep.stepNumber);
          return {
            stepNumber: generatedStep.stepNumber,
            delayDays: originalStep?.delayDays || steps[index]?.delayDays || 0,
            subject: generatedStep.subject || '',
            body: generatedStep.body?.replace(/\\n/g, '\n') || ''
          };
        });

        results.push({
          prospect_id: prospectInfo.id,
          success: true,
          data: { steps: result }
        });

      } catch (error: any) {
        console.error(`Erreur génération IA pour prospect ${prospectInfo.id}:`, error);
        results.push({
          prospect_id: prospectInfo.id,
          success: false,
          error: error.message || 'Erreur lors de la génération'
        });
      }
    }

    return res.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Erreur génération IA batch:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération par IA'
    });
  }
});

// POST /api/prospects/generate-ai-email - Générer un email simple par IA
router.post('/generate-ai-email', async (req, res) => {
  try {
    const { prospects, context } = req.body;

    if (!prospects || prospects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Au moins un prospect est requis'
      });
    }

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Le contexte est requis pour la génération'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Service IA non configuré'
      });
    }

    // Utiliser le premier prospect comme base pour la personnalisation
    const prospect = prospects[0];

    const systemPrompt = `Tu es un expert en prospection B2B et rédaction d'emails de prospection commerciale.
Ton objectif est de créer un email de prospection professionnel, personnalisé et efficace.

L'email doit :
- Être court et percutant (150-200 mots maximum)
- Avoir un objet accrocheur qui incite à l'ouverture
- Être personnalisé selon l'entreprise ciblée
- Créer de la valeur dès les premières lignes
- Avoir un call-to-action clair
- Utiliser un ton professionnel mais accessible
- Éviter le jargon commercial agressif`;

    const userPrompt = `Génère un email de prospection pour :

**Entreprise**: ${prospect.company_name || 'Non renseigné'}
**Secteur d'activité**: ${prospect.naf_label || 'Non renseigné'}
**Contact**: ${prospect.firstname || ''} ${prospect.lastname || ''}
**Poste**: ${prospect.job_title || 'Non renseigné'}

**Instructions spécifiques**:
${context}

Réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après) :
{
  "subject": "L'objet de l'email",
  "body": "Le corps de l'email en HTML (avec <p>, <br>, <strong>, etc.)"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Pas de réponse de l\'IA');
    }

    // Parser le JSON
    const result = JSON.parse(content);

    return res.json({
      success: true,
      data: {
        subject: result.subject,
        body: result.body
      }
    });

  } catch (error: any) {
    console.error('Erreur génération email IA:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération par IA'
    });
  }
});

// DELETE /api/prospects/bulk-delete - Supprimer plusieurs prospects
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { prospect_ids } = req.body;
    
    if (!prospect_ids || !Array.isArray(prospect_ids) || prospect_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'prospect_ids (array) est requis' 
      });
    }

    const result = await ProspectService.bulkDeleteProspects(prospect_ids);

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/import-batches - Récupérer les listes d'import avec statistiques
router.get('/import-batches', async (req, res) => {
  try {
    const result = await ProspectService.getImportBatchesWithStats();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/prospects/import-batches/:id - Mettre à jour le nom d'une liste d'import
router.patch('/import-batches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name } = req.body;

    if (!file_name || file_name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom de la liste ne peut pas être vide' 
      });
    }

    const result = await ProspectService.updateImportBatchName(id, file_name.trim());
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

