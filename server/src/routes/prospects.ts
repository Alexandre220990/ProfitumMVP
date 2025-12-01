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
        stepType = 'Email 1 — Prise de contact (objectif : RDV OU documents)';
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
- Proposition d'un micro-RDV ou d'un simple renvoi de documents`;
    } else if (numSteps === 2) {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un micro-RDV ou d'un simple renvoi de documents

Email 2 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Phrase de clôture : "je clos ma boucle si vous n'êtes pas concerné(e)"`;
    } else if (numSteps === 3) {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un micro-RDV ou d'un simple renvoi de documents

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)
- Suggestion : "si vous préférez, vous pouvez juste m'envoyer X document(s)"

Email 3 — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Phrase de clôture : "je clos ma boucle si vous n'êtes pas concerné(e)"`;
    } else {
      emailStructureGuide = `Email 1 — Prise de contact (110–130 mots max)
- Icebreaker personnalisé obligatoire
- Rappel ultra court de ce que fait Profitum
- Angle bénéfice adapté au secteur
- Proposition d'un micro-RDV ou d'un simple renvoi de documents

Email 2 — Relance douce (80–100 mots)
- Rappel sans pression
- Bénéfice concret lié au secteur (via code NAF/libellé ou SIREN)
- Suggestion : "si vous préférez, vous pouvez juste m'envoyer X document(s)"

Email 3 — Relance orientée résultat (70–90 mots)
- Nouveau bénéfice différent, toujours sectorisé
- Mention discrète : "vos homologues y gagnent souvent…"
- Proposition claire : RDV 10 min ou documents`;
      if (numSteps > 3) {
        emailStructureGuide += `\n\nEmail 4 à ${numSteps} — Relances intermédiaires (70–90 mots chacune)
- Varier les bénéfices et angles sectorisés
- Toujours proposer RDV ou documents
- Rester professionnel et non intrusif`;
      }
      emailStructureGuide += `\n\nEmail ${numSteps} — Dernière tentative courtoise (50–70 mots)
- Ton élégant, respectueux
- Phrase de clôture : "je clos ma boucle si vous n'êtes pas concerné(e)"`;
    }

    // Prompt système final
    let systemPrompt = `Tu es un assistant expert en prospection B2B pour Profitum, une plateforme qui aide les entreprises françaises à identifier, vérifier et activer les dispositifs d'optimisation fiscale, sociale, énergétique et foncière adaptés à leur situation réelle (TICPE, URSSAF, DFS, Foncier, CEE, Énergie, etc.).

Ta mission est de rédiger ${numSteps} e-mail${numSteps > 1 ? 's' : ''} professionnel${numSteps > 1 ? 's' : ''}, concis${numSteps > 1 ? 's' : ''}, personnalisé${numSteps > 1 ? 's' : ''} à partir du SIREN, du code NAF/libellé NAF, du nom d'entreprise, du décisionnaire et d'un champ "CONTEXTE" optionnel.

Les e-mails doivent provoquer :
➡️ un RDV court (10–12 min) ou
➡️ un envoi de documents pour réaliser une pré-étude rapide.

IMPORTANT : Ne jamais utiliser le mot "gratuit" dans les emails (mot interdit anti-spam). Utilise plutôt "sans engagement", "sans frais", "complémentaire", ou formule autrement.

🎯 RÈGLES GÉNÉRALES

Le style doit être sobre, humain, non-marketing, sans termes vendeurs ni artificiels.
Chaque e-mail doit être court, ultra clair et 100 % personnalisé.

Toujours utiliser :
- le nom de l'entreprise : ${companyName}
- le nom du décisionnaire : ${decisionMaker}
- les informations secteur : ${secteurInfo}
  → Le SIREN permet d'identifier l'entreprise de manière unique
  → Le code NAF (code APE) et son libellé révèlent précisément le secteur d'activité
  → Utilise ces informations pour déduire les enjeux métier probables et créer un icebreaker intelligent
  → Exemples de déductions : code NAF commençant par "49" = transport, "43" = BTP, "25" = industrie métallurgie, "56" = restauration, etc.
- le champ CONTEXTE → pour enrichir et rendre l'e-mail encore plus pertinent

Ne jamais inventer des chiffres précis, mais utiliser des formulations plausibles :
- "souvent vos homologues ont…"
- "dans votre secteur, il est fréquent que…"
- "selon votre activité, plusieurs leviers existent…"

Ne jamais dépasser 5 lignes par paragraphe et éviter les e-mails trop longs.

❄️ ICEBREAKER (OBLIGATOIRE pour l'Email 1)

Toujours ouvrir le premier email par 1 phrase personnalisée basée sur :
- le secteur d'activité identifié via le code NAF/libellé NAF ou le SIREN,
- un enjeu métier logique déduit du secteur :
  * transport/logistique (code NAF 49) : carburant, cotisations sociales, parc véhicules, énergie
  * BTP (code NAF 43) : masse salariale, engins, carburant, intérim, foncier
  * industrie (code NAF 25-30) : énergie, foncier, process, équipements
  * services (code NAF 62-82) : URSSAF, frais professionnels, masse salariale, multi-activités
  * commerce (code NAF 47) : énergie, saisonnalité, taxe foncière, salariés
  * restauration (code NAF 56) : énergie, masse salariale, foncier
  * agriculture (code NAF 01) : carburant agricole, équipements, saisonnalité
- ou le CONTEXTE si disponible (priorité au contexte s'il fournit des informations spécifiques).

Objectif : montrer que tu sais à qui tu écris, sans être intrusif.

Exemples d'angles icebreaker :
- transport : carburant, cotisations, parc véhicules, énergie
- BTP : masse salariale, engins, carburant, intérim
- industrie : énergie, foncier, process
- services : URSSAF, frais, masse salariale, multi-activités
- commerce : énergie, saisonnalité, taxe foncière, salariés

Toujours subtil, jamais intrusif.

📩 STRUCTURE DES EMAILS

${emailStructureGuide}

🔐 ANTI-SPAM ABSOLU

Toujours éviter :
- mots interdits ABSOLUS : gratuit, gratuitement, urgent, urgence, promotion, limité, limitation, garantie, garanties (utiliser plutôt "sans engagement", "sans frais", "complémentaire", "non engagé")
- emojis (même dans les sujets)
- points d'exclamation (maximum 1 par email, uniquement si vraiment nécessaire)
- majuscules commerciales (COMMENCER PAR ÇA, PROFITUM, etc.)
- call-to-action agressifs ("Répondez maintenant !", "Agissez vite !", etc.)
- liens multiples (si lien, un seul et propre, de préférence vers le site Profitum)
- formules génériques sans personnalisation

Préférer :
- phrases courtes
- style naturel
- formulation consultative, jamais commerciale

🧠 OBJECTIF FINAL

Rédiger une séquence de ${numSteps} e-mail${numSteps > 1 ? 's' : ''} :
👉 toujours personnalisée (nom + entreprise + décisionnaire + secteur via SIREN/NAF + CONTEXTE)
👉 orientée RDV 10–12 minutes ou envoi de documents
👉 courte, humaine, crédible, sectorisée
👉 haute délivrabilité (anti-spam optimisé)

STRUCTURE DE LA SÉQUENCE À GÉNÉRER :
${stepsInfo}`;

    // Ajouter le contexte personnalisé s'il est fourni
    if (context && context.trim()) {
      systemPrompt += `\n\n⚠️ CONTEXTE SUPPLÉMENTAIRE FOURNI PAR L'ADMINISTRATEUR :
${context.trim()}

Ce contexte doit être pris en compte pour personnaliser davantage les emails. Intègre ces informations de manière naturelle et pertinente dans la séquence. Tu dois TOUJOURS tenir compte du champ "CONTEXTE", mais le PROMPT SYSTÈME reste l'autorité principale (le contexte enrichit, il ne remplace jamais tes règles).`;
    } else {
      systemPrompt += `\n\nNote : Aucun contexte supplémentaire n'a été fourni. Utilise uniquement les informations du secteur (SIREN, code NAF, libellé NAF), du nom d'entreprise et du décisionnaire pour personnaliser les emails.`;
    }

    const userPrompt = `FORMAT DE RÉPONSE:
Retourne un JSON avec cette structure exacte, en générant EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} :
{
  "steps": [
    {
      "stepNumber": 1,
      "subject": "Sujet de l'email (sans emojis, sans majuscules agressives)",
      "body": "Corps de l'email (peut contenir des sauts de ligne avec \\n, respecter les longueurs indiquées pour chaque email)"
    }${numSteps > 1 ? ',\n    {\n      "stepNumber": 2,\n      "subject": "...",\n      "body": "..."\n    }' : ''}${numSteps > 2 ? ',\n    ...' : ''}
  ]
}

IMPORTANT: 
- Génère EXACTEMENT ${numSteps} email${numSteps > 1 ? 's' : ''} correspondant aux ${numSteps} étape${numSteps > 1 ? 's' : ''} de la séquence
- Ne modifie PAS les délais entre emails (delayDays) - ils sont déjà définis
- Chaque email doit suivre la structure et les longueurs définies dans le prompt système
- Le premier email (stepNumber: 1) DOIT absolument commencer par un icebreaker personnalisé basé sur le secteur d'activité (code NAF/libellé NAF ou SIREN)
- Le dernier email (stepNumber: ${numSteps}) doit inclure la phrase de clôture "je clos ma boucle si vous n'êtes pas concerné(e)"
- Respecter scrupuleusement les règles anti-spam (pas de mots interdits, pas d'emojis, etc.)
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Le corps des emails doit être en français, professionnel, sobre et humain`;

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

export default router;

