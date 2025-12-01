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
    const siren = prospectInfo.siren ? ` (SIREN: ${prospectInfo.siren})` : '';

    const stepsInfo = steps.map((step: any, index: number) => {
      const stepType = index === 0 
        ? 'email initial de prise de contact'
        : index === steps.length - 1
        ? 'dernière relance'
        : 'relance';
      
      return `Étape ${step.stepNumber}: ${stepType} (délai: ${step.delayDays} jours après l'étape précédente)`;
    }).join('\n');

    // Prompt système de base
    let systemPrompt = `Tu es un expert en prospection commerciale B2B pour une entreprise de financement et d'investissement.

CONTEXTE:
- Entreprise cible: ${companyName}${siren}
- Décisionnaire: ${decisionMaker}
- Email: ${prospectInfo.email || 'non renseigné'}

OBJECTIF:
Générer une séquence d'emails de prospection professionnelle, personnalisée et pertinente pour cette entreprise et ce décisionnaire.

STRUCTURE DE LA SÉQUENCE:
${stepsInfo}

CONTRAINTES:
- Les emails doivent être professionnels, concis et percutants
- Personnaliser le contenu en fonction du nom de l'entreprise et du décisionnaire
- Le premier email doit être une prise de contact initiale
- Les emails suivants doivent être des relances progressives
- Le dernier email doit être une dernière tentative de contact
- Ne pas être trop insistant, rester professionnel
- Adapter le ton selon le type d'entreprise (utiliser le SIREN si disponible pour comprendre le secteur)`;

    // Ajouter le contexte personnalisé s'il est fourni
    if (context && context.trim()) {
      systemPrompt += `\n\nCONTEXTE SUPPLÉMENTAIRE FOURNI PAR L'ADMINISTRATEUR:
${context.trim()}

Ce contexte doit être pris en compte pour personnaliser davantage les emails. Intègre ces informations de manière naturelle et pertinente dans la séquence.`;
    }

    const userPrompt = `FORMAT DE RÉPONSE:
Retourne un JSON avec cette structure exacte:
{
  "steps": [
    {
      "stepNumber": 1,
      "subject": "Sujet de l'email",
      "body": "Corps de l'email (peut contenir des sauts de ligne avec \\n)"
    },
    ...
  ]
}

IMPORTANT: 
- Ne modifie PAS les délais entre emails (delayDays)
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Le corps des emails doit être en français, professionnel, et adapté au contexte`;

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
      temperature: 0.7,
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

export default router;

