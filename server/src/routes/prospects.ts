import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { ProspectService } from '../services/ProspectService';
import { ProspectEmailService } from '../services/ProspectEmailService';
import { ProspectReportService } from '../services/ProspectReportService';
import { ProspectRepliesService } from '../services/ProspectRepliesService';
import { ProspectFilters, ProspectEnrichmentData, Prospect } from '../types/prospects';
import { EmailStep } from '../types/enrichment-v4';
import ProspectEnrichmentServiceV4 from '../services/ProspectEnrichmentServiceV4';
import { ProspectEnrichmentServiceV4 as ProspectEnrichmentServiceV4Class } from '../services/ProspectEnrichmentServiceV4';
import SequenceGeneratorServiceV4 from '../services/SequenceGeneratorServiceV4';

// Configuration multer pour upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});
import OpenAI from 'openai';

const router = express.Router();

// Initialiser Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// GET /api/prospects/import-batches - Récupérer les listes d'import avec statistiques
router.get('/import-batches', async (req, res) => {
  try {
    const result = await ProspectService.getImportBatchesWithStats();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prospects/import-batches/:batchId/prospects - Récupérer les prospects d'un batch spécifique
router.get('/import-batches/:batchId/prospects', async (req, res) => {
  try {
    const { batchId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters: ProspectFilters = {
      page,
      limit,
      search: req.query.search as string,
      sort_by: (req.query.sort_by as any) || 'created_at',
      sort_order: (req.query.sort_order as any) || 'desc'
    };

    // Si batchId est 'manual', on récupère les prospects sans import_batch_id
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' });

    if (batchId === 'manual') {
      query = query.is('import_batch_id', null);
    } else {
      query = query.eq('import_batch_id', batchId);
    }

    // Appliquer la recherche
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,lastname.ilike.%${filters.search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Tri
    query = query.order(filters.sort_by || 'created_at', { ascending: filters.sort_order === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Erreur récupération prospects: ${error.message}`
      });
    }

    return res.json({
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page: page,
        limit: limit,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
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

// DELETE /api/prospects/bulk-delete - Supprimer plusieurs prospects (DOIT être avant /:id)
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

// Fonction helper pour créer un enrichissement de fallback
function createFallbackEnrichment(prospectInfo: any): ProspectEnrichmentData {
  const nafLabel = prospectInfo.naf_label || 'Activité non renseignée';
  const companyName = prospectInfo.company_name || 'l\'entreprise';
  
  return {
    secteur_activite: {
      description: `${companyName} opère dans le secteur : ${nafLabel}`,
      tendances_profitum: "Les entreprises de ce secteur peuvent bénéficier d'optimisations fiscales, sociales et énergétiques selon leur profil opérationnel."
    },
    actualites_entreprise: {
      recentes: ["Informations non disponibles - analyse basée sur le secteur général"],
      pertinence_profitum: "Profitum peut aider à identifier les dispositifs d'optimisation adaptés à l'activité de l'entreprise."
    },
    signaux_operationnels: {
      recrutements_en_cours: false,
      locaux_physiques: true,
      parc_vehicules_lourds: false,
      consommation_gaz_importante: false,
      details: "Analyse générique - informations précises non disponibles"
    },
    profil_eligibilite: {
      ticpe: {
        eligible: false,
        raison: "À évaluer selon le parc de véhicules professionnels",
        potentiel_economie: "À évaluer"
      },
      cee: {
        eligible: true,
        raison: "La plupart des entreprises avec locaux sont éligibles aux CEE",
        potentiel_economie: "À évaluer"
      },
      optimisation_sociale: {
        eligible: true,
        raison: "Les entreprises avec salariés peuvent optimiser leurs charges sociales",
        potentiel_economie: "À évaluer"
      }
    },
    resume_strategique: `${companyName} pourrait bénéficier d'une analyse approfondie de son éligibilité aux dispositifs d'optimisation fiscale, sociale et énergétique disponibles via Profitum.`,
    enriched_at: new Date().toISOString(),
    enrichment_version: 'v2.0-fallback'
  };
}

// POST /api/prospects/generate-ai-sequence-v2 - Génération V2 avec enrichissement en 2 étapes
router.post('/generate-ai-sequence-v2', async (req, res) => {
  try {
    const { prospectInfo, steps, context, forceReenrichment = false } = req.body;

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

    const companyName = prospectInfo.company_name || prospectInfo.name || 'l\'entreprise';
    console.log(`🚀 Génération V4 pour ${companyName}...`);

    // ========================================================================
    // ÉTAPE 1 : ENRICHISSEMENT COMPLET V4 (LinkedIn + Site Web + Opérationnel + Timing)
    // ========================================================================
    
    // Normaliser les données du prospect pour le format Prospect
    const normalizedProspect: Prospect = {
      id: prospectInfo.id,
      company_name: prospectInfo.company_name || prospectInfo.name,
      email: prospectInfo.email,
      firstname: prospectInfo.firstname || prospectInfo.first_name,
      lastname: prospectInfo.lastname || prospectInfo.last_name,
      job_title: prospectInfo.job_title,
      naf_code: prospectInfo.naf_code,
      naf_label: prospectInfo.naf_label,
      siren: prospectInfo.siren,
      linkedin_company: prospectInfo.linkedin_company || prospectInfo.linkedin_company_url || null,
      linkedin_profile: prospectInfo.linkedin_profile || prospectInfo.linkedin_profile_url || null,
      company_website: prospectInfo.company_website || prospectInfo.website || null,
      phone_direct: prospectInfo.phone_direct || prospectInfo.phone || null,
      phone_standard: prospectInfo.phone_standard || null,
      adresse: prospectInfo.adresse || prospectInfo.address || null,
      city: prospectInfo.city,
      postal_code: prospectInfo.postal_code,
      email_validity: prospectInfo.email_validity || null,
      source: prospectInfo.source || 'manuel',
      created_at: prospectInfo.created_at || new Date().toISOString(),
      enrichment_status: prospectInfo.enrichment_status || 'pending',
      enrichment_data: prospectInfo.enrichment_data || null,
      enriched_at: prospectInfo.enriched_at || null,
      ai_status: prospectInfo.ai_status || 'pending',
      emailing_status: prospectInfo.emailing_status || 'not_sent',
      score_priority: prospectInfo.score_priority || 0,
      ai_summary: prospectInfo.ai_summary || null,
      ai_trigger_points: prospectInfo.ai_trigger_points || null,
      ai_product_match: prospectInfo.ai_product_match || null,
      ai_email_personalized: prospectInfo.ai_email_personalized || null,
      metadata: prospectInfo.metadata || null,
      import_batch_id: prospectInfo.import_batch_id || null,
      employee_range: prospectInfo.employee_range || null,
      updated_at: prospectInfo.updated_at || new Date().toISOString()
    };

    // Utiliser l'enrichissement V4 avec cache intelligent
    const enrichedDataV4 = await ProspectEnrichmentServiceV4.enrichProspectComplete(
      normalizedProspect,
      steps.length, // Nombre d'emails pour analyse temporelle
      forceReenrichment
    );

    console.log(`✅ Enrichissement V4 terminé pour ${companyName}`);

    // Sauvegarder l'enrichissement V4 en base
    if (normalizedProspect.id) {
      await supabase
        .from('prospects')
        .update({
          enrichment_status: 'completed',
          enrichment_data: enrichedDataV4,
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', normalizedProspect.id);
      console.log(`💾 Enrichissement V4 sauvegardé pour prospect ${normalizedProspect.id}`);
    }

    // ========================================================================
    // ÉTAPE 2 : GÉNÉRATION DES SÉQUENCES AVEC DONNÉES ENRICHIES V4
    // ========================================================================
    
    console.log(`✍️ Génération de la séquence avec SequenceGeneratorServiceV4...`);

    // Préparer les steps avec leurs délais
    const adjustedSteps: EmailStep[] = steps.map((step: any) => ({
      stepNumber: step.stepNumber,
      delayDays: step.delayDays,
      subject: '',
      body: ''
    }));

    // Utiliser le générateur V4 pour créer la séquence
    const { sequence, adjustment } = await SequenceGeneratorServiceV4.generateOptimalSequence(
      normalizedProspect,
      enrichedDataV4,
      context || '',
      steps.length
    );

    // Mettre à jour ai_status à 'completed'
    if (normalizedProspect.id) {
      await supabase
        .from('prospects')
        .update({ 
          ai_status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', normalizedProspect.id);
    }

    console.log(`✅ Séquence V4 générée avec succès pour ${companyName}`);
    if (adjustment.adjusted && adjustment.adjustment) {
      console.log(`📊 Ajustement timing: ${adjustment.adjustment > 0 ? '+' : ''}${adjustment.adjustment} emails (${adjustment.rationale || adjustment.message})`);
    }

    // Générer la synthèse complète V4
    const synthesis = ProspectEnrichmentServiceV4Class.generateEnrichmentSynthesis(
      enrichedDataV4,
      companyName
    );
    console.log(`📝 Synthèse V4 générée : ${synthesis.points_cles.length} points clés, ${synthesis.recommandations_action.length} recommandations`);

    return res.json({
      success: true,
      data: {
        enrichment: enrichedDataV4,
        steps: sequence.steps,
        adjustment: adjustment,
        prospect_insights: {
          potentiel_economies: enrichedDataV4.operational_data?.potentiel_global_profitum?.economies_annuelles_totales,
          score_attractivite: enrichedDataV4.operational_data?.potentiel_global_profitum?.score_attractivite_prospect,
          timing_score: enrichedDataV4.timing_analysis?.scoring_opportunite?.score_global_timing
        },
        synthese_v4: {
          synthese_complete: synthesis.synthese_complete,
          synthese_html: synthesis.synthese_html,
          points_cles: synthesis.points_cles,
          recommandations_action: synthesis.recommandations_action,
          score_global: synthesis.score_global
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur génération IA V4:', error);
    
    // En cas d'erreur, marquer le prospect comme failed
    if (req.body.prospectInfo?.id) {
      await supabase
        .from('prospects')
        .update({
          enrichment_status: 'failed',
          ai_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', req.body.prospectInfo.id);
    }
    
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

    // Nettoyer le contenu : enlever les backticks markdown si présents
    let cleanedContent = content.trim();
    
    // Si le contenu commence par ```json ou ``` et se termine par ```, extraire le JSON
    if (cleanedContent.startsWith('```')) {
      // Trouver le premier saut de ligne après les backticks d'ouverture
      const firstNewline = cleanedContent.indexOf('\n');
      // Trouver les backticks de fermeture
      const lastBackticks = cleanedContent.lastIndexOf('```');
      
      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        cleanedContent = cleanedContent.substring(firstNewline + 1, lastBackticks).trim();
      }
    }

    // Parser le JSON
    const result = JSON.parse(cleanedContent);

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

// POST /api/prospects/generate-ai-email-v4 - Générer un email simple ENRICHI (comme séquences V4)
router.post('/generate-ai-email-v4', async (req, res) => {
  try {
    const { prospects, context, forceReenrichment = false } = req.body;

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

    // Utiliser le premier prospect comme base
    const prospect = prospects[0];
    const prospectInfo: Prospect = {
      id: prospect.id,
      company_name: prospect.company_name,
      email: prospect.email,
      firstname: prospect.firstname,
      lastname: prospect.lastname,
      job_title: prospect.job_title,
      naf_code: prospect.naf_code,
      naf_label: prospect.naf_label,
      siren: prospect.siren,
      linkedin_company: prospect.linkedin_company || prospect.linkedin_company_url || null,
      linkedin_profile: prospect.linkedin_profile || prospect.linkedin_profile_url || null,
      company_website: prospect.company_website || prospect.website || null,
      phone_direct: prospect.phone_direct || prospect.phone || null,
      phone_standard: prospect.phone_standard || null,
      adresse: prospect.adresse || prospect.address || null,
      city: prospect.city,
      postal_code: prospect.postal_code,
      // Champs requis par l'interface Prospect
      email_validity: prospect.email_validity || null,
      source: prospect.source || 'manuel',
      created_at: prospect.created_at || new Date().toISOString(),
      updated_at: prospect.updated_at || new Date().toISOString(),
      enrichment_status: prospect.enrichment_status || 'pending',
      enrichment_data: prospect.enrichment_data || null,
      enriched_at: prospect.enriched_at || null,
      ai_status: prospect.ai_status || 'pending',
      emailing_status: prospect.emailing_status || 'not_sent',
      score_priority: prospect.score_priority || 0,
      ai_summary: prospect.ai_summary || null,
      ai_trigger_points: prospect.ai_trigger_points || null,
      ai_product_match: prospect.ai_product_match || null,
      ai_email_personalized: prospect.ai_email_personalized || null,
      metadata: prospect.metadata || null,
      import_batch_id: prospect.import_batch_id || null,
      employee_range: prospect.employee_range || null
    };

    console.log(`🚀 Génération email enrichi V4 pour ${prospectInfo.company_name || prospectInfo.email}`);

    // ✨ ENRICHISSEMENT COMPLET V4 (comme pour les séquences)
    const enrichedData = await ProspectEnrichmentServiceV4.enrichProspectComplete(
      prospectInfo,
      1, // Un seul email
      forceReenrichment
    );

    console.log(`✅ Enrichissement V4 terminé pour ${prospectInfo.company_name}`);

    // Sauvegarder l'enrichissement en base si ID prospect disponible
    if (prospectInfo.id) {
      await supabase
        .from('prospects')
        .update({
          enrichment_status: 'completed',
          enrichment_data: enrichedData,
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectInfo.id);

      console.log(`💾 Enrichissement V4 sauvegardé pour prospect ${prospectInfo.id}`);
    }

    // 📝 CONSTRUIRE UN PROMPT SYSTÈME ENRICHI
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `Tu es un expert en prospection B2B ultra-personnalisée pour Profitum, plateforme SaaS d'optimisation financière pour entreprises françaises.

🎯 IDENTITÉ CLAIRE ET ABSOLUE :
- TU REPRÉSENTES : Profitum (l'expéditeur de l'email)
- TU ÉCRIS À : ${prospectInfo.company_name} (le prospect/destinataire)
- TU N'ES JAMAIS : L'entreprise du prospect
- TOUJOURS se présenter au nom de Profitum

📊 DONNÉES ENRICHIES DISPONIBLES :

**DATE ACTUELLE : ${currentDate}**

**PROFIL PROSPECT :**
- Entreprise : ${prospectInfo.company_name}
- Secteur : ${prospectInfo.naf_label || 'Non renseigné'}
- Contact : ${prospectInfo.firstname} ${prospectInfo.lastname}
- Poste : ${prospectInfo.job_title || 'Non renseigné'}

**ICE BREAKERS LINKEDIN (AVEC GESTION TEMPORELLE) :**
${enrichedData.linkedin_data?.ice_breakers_generes ? JSON.stringify(enrichedData.linkedin_data.ice_breakers_generes, null, 2).substring(0, 1500) : 'Non disponibles'}

**ÉLIGIBILITÉ & POTENTIEL PROFITUM :**
${enrichedData.operational_data?.donnees_operationnelles?.signaux_eligibilite_profitum ? JSON.stringify(enrichedData.operational_data.donnees_operationnelles.signaux_eligibilite_profitum, null, 2).substring(0, 1000) : 'Non disponibles'}

**POTENTIEL ÉCONOMIES :**
- Moyenne : ${enrichedData.operational_data?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0}€/an
- Maximum : ${enrichedData.operational_data?.potentiel_global_profitum?.economies_annuelles_totales?.maximum ?? 0}€/an
- Score attractivité : ${enrichedData.operational_data?.potentiel_global_profitum?.score_attractivite_prospect ?? 5}/10

**CONTEXTE TEMPOREL :**
${enrichedData.timing_analysis?.analyse_periode?.contexte_business ? JSON.stringify(enrichedData.timing_analysis.analyse_periode.contexte_business, null, 2).substring(0, 800) : 'Non disponible'}

🚨 RÈGLES CRITIQUES :

1. **GESTION DES ICE BREAKERS TEMPORELS** :
   - Si statut_temporel = "FUTUR" → Utiliser phrase standard
   - Si statut_temporel = "PASSE" → Utiliser phrase_alternative_si_passe
   - Si statut_temporel = "EN_COURS" → Adapter avec phrase_alternative_si_en_cours
   - Si statut_temporel = "PERIME" → Éviter cet ice breaker

2. **TON PROFESSIONNEL MAIS CHALEUREUX** :
   - ❌ Éviter : "On bosse avec", "On gère", "Ça cartonne"
   - ✅ Utiliser : "Nous travaillons avec", "Nous accompagnons", "Tout vous est simplifié"

3. **STRUCTURE EMAIL** :
   - Ouverture personnalisée (ice breaker adapté temporellement)
   - Connexion valeur (arguments éligibilité pertinents)
   - Potentiel chiffré personnalisé
   - Call-to-action clair
   - 150-250 mots maximum

4. **OBJET D'EMAIL** :
   - Court (5-7 mots)
   - Contextuel et personnalisé
   - Pas de clichés marketing
   - Si l'utilisateur fournit un objet dans les instructions, l'utiliser tel quel ou s'en inspirer`;

    // 📝 PROMPT UTILISATEUR ENRICHI
    const userPrompt = `🎯 INSTRUCTIONS UTILISATEUR (PRIORITÉ ABSOLUE) :

${context}

${context.toLowerCase().includes('objet:') || context.toLowerCase().includes('subject:') 
  ? '\n⚠️ IMPORTANT : Un objet d\'email est mentionné dans les instructions ci-dessus. UTILISE-LE tel quel ou INSPIRE-TOI en pour créer quelque chose de similaire. Ne le remplace pas par quelque chose de complètement différent.\n' 
  : ''}

📋 TA TÂCHE : GÉNÉRATION ULTRA-PERSONNALISÉE

**Étape 1 : SÉLECTIONNER LES MEILLEURS ICE BREAKERS**
Choisis 1-2 ice breakers parmi ceux disponibles, en validant leur statut temporel.

**Étape 2 : CONSTRUIRE L'EMAIL**
Crée un email fluide qui :
- Intègre les ice breakers de manière naturelle et temporellement cohérente
- Utilise les arguments d'éligibilité pertinents
- Mentionne le potentiel d'économies personnalisé
- Adapte le timing du CTA au contexte (si période chargée, proposer "début janvier")

**Étape 3 : VALIDATION TEMPORELLE**
Assure-toi que chaque référence à un événement/post est cohérente avec sa date.

Réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après) :
{
  "subject": "L'objet de l'email (5-7 mots, contextuel)",
  "body": "Le corps de l'email en HTML (avec <p>, <br>, <strong>, etc.)",
  "ice_breakers_utilises": [
    {
      "type": "Événement",
      "phrase": "Phrase exacte utilisée",
      "statut_temporel": "PASSE",
      "validation": "✅ Cohérent temporellement"
    }
  ],
  "arguments_eligibilite_utilises": ["Arg1", "Arg2"],
  "potentiel_mentionne": "${enrichedData.operational_data?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0}€/an",
  "adaptation_temporelle": "Description de l'adaptation au contexte temporel",
  "nombre_mots": 180,
  "score_personnalisation": 9
}`;

    // 🤖 APPEL À L'IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Pas de réponse de l\'IA');
    }

    // Parser le JSON
    const result = JSON.parse(content);

    // 📊 INSIGHTS PROSPECT POUR LE FRONTEND
    const prospectInsights = {
      potentiel_economies: `${enrichedData.operational_data?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0}€/an`,
      score_attractivite: `${enrichedData.operational_data?.potentiel_global_profitum?.score_attractivite_prospect ?? 5}/10`,
      timing_score: `${enrichedData.timing_analysis?.scoring_opportunite?.score_global_timing ?? 5}/10`,
      ice_breakers_disponibles: enrichedData.linkedin_data?.ice_breakers_generes?.length || 0,
      donnees_operationnelles: {
        poids_lourds: enrichedData.operational_data?.donnees_operationnelles?.parc_vehicules?.poids_lourds_plus_7_5T?.valeur ?? 0,
        chauffeurs: enrichedData.operational_data?.donnees_operationnelles?.ressources_humaines?.nombre_chauffeurs?.valeur ?? 0,
        salaries: enrichedData.operational_data?.donnees_operationnelles?.ressources_humaines?.nombre_salaries_total?.valeur ?? 0
      }
    };

    console.log(`✅ Email enrichi V4 généré : ${result.nombre_mots || '?'} mots, score perso ${result.score_personnalisation || '?'}/10`);

    return res.json({
      success: true,
      data: {
        subject: result.subject,
        body: result.body,
        meta: {
          ice_breakers_utilises: result.ice_breakers_utilises,
          arguments_eligibilite: result.arguments_eligibilite_utilises,
          potentiel_mentionne: result.potentiel_mentionne,
          adaptation_temporelle: result.adaptation_temporelle,
          nombre_mots: result.nombre_mots,
          score_personnalisation: result.score_personnalisation
        },
        enrichment: enrichedData,
        prospect_insights: prospectInsights
      },
      message: `Email enrichi V4 généré avec succès (${result.nombre_mots} mots)`
    });

  } catch (error: any) {
    console.error('❌ Erreur génération email enrichi V4:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération par IA'
    });
  }
});

// ============================================================================
// ENDPOINTS V4 - SYSTÈME OPTIMISÉ COMPLET
// ============================================================================

import SequenceSchedulerService from '../services/SequenceSchedulerService';
import SequencePerformanceTracker from '../services/SequencePerformanceTracker';
import ProspectCacheService from '../services/ProspectCacheService';
import DataCompletenessDetector from '../services/DataCompletenessDetector';

/**
 * POST /api/prospects/generate-optimal-sequence-v4
 * Génération optimale avec enrichissement complet V4
 */
router.post('/generate-optimal-sequence-v4', async (req, res) => {
  try {
    const { prospectInfo, context, defaultNumEmails = 3, forceReenrichment = false } = req.body;

    if (!prospectInfo) {
      return res.status(400).json({
        success: false,
        error: 'Informations prospect requises'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Service IA non configuré'
      });
    }

    console.log(`🚀 Démarrage génération V4 pour ${prospectInfo.company_name || prospectInfo.email}`);

    // Enrichissement complet V4 (avec cache intelligent)
    const enrichedData = await ProspectEnrichmentServiceV4.enrichProspectComplete(
      prospectInfo,
      defaultNumEmails,
      forceReenrichment
    );

    // Génération de séquence optimale
    const { sequence, adjustment } = await SequenceGeneratorServiceV4.generateOptimalSequence(
      prospectInfo,
      enrichedData,
      context || '',
      defaultNumEmails
    );

    // Sauvegarder l'enrichissement en base si ID prospect disponible
    if (prospectInfo.id) {
      await supabase
        .from('prospects')
        .update({
          enrichment_status: 'completed',
          enrichment_data: enrichedData,
          enriched_at: new Date().toISOString(),
          ai_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectInfo.id);

      console.log(`✅ Enrichissement V4 sauvegardé pour prospect ${prospectInfo.id}`);
    }

    // Construire les insights
    const prospectInsights = {
      potentiel_economies: `${enrichedData.operational_data?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0}€/an`,
      score_attractivite: `${enrichedData.operational_data?.potentiel_global_profitum?.score_attractivite_prospect ?? 5}/10`,
      timing_strategy: enrichedData.timing_analysis?.scoring_opportunite?.action_recommandee ?? 'À déterminer',
      donnees_operationnelles: {
        poids_lourds: enrichedData.operational_data?.donnees_operationnelles?.parc_vehicules?.poids_lourds_plus_7_5T?.valeur ?? 0,
        chauffeurs: enrichedData.operational_data?.donnees_operationnelles?.ressources_humaines?.nombre_chauffeurs?.valeur ?? 0,
        salaries: enrichedData.operational_data?.donnees_operationnelles?.ressources_humaines?.nombre_salaries_total?.valeur ?? 0,
        ca: enrichedData.operational_data?.donnees_operationnelles?.donnees_financieres?.chiffre_affaires?.valeur ?? 0,
        surface_locaux: enrichedData.operational_data?.donnees_operationnelles?.infrastructures?.locaux_principaux?.surface_m2?.valeur ?? 0,
        statut_propriete: enrichedData.operational_data?.donnees_operationnelles?.infrastructures?.locaux_principaux?.statut_propriete?.proprietaire_ou_locataire ?? 'INCONNU'
      }
    };

    // Générer la synthèse complète V4
    const synthesis = ProspectEnrichmentServiceV4Class.generateEnrichmentSynthesis(
      enrichedData,
      prospectInfo.company_name || prospectInfo.email || 'Prospect'
    );
    console.log(`📝 Synthèse V4 générée : ${synthesis.points_cles.length} points clés`);

    return res.json({
      success: true,
      data: {
        sequence,
        enrichment: enrichedData,
        adjustment: {
          adjusted: adjustment.adjusted,
          original_num: adjustment.originalNum || defaultNumEmails,
          new_num: adjustment.newNum || defaultNumEmails,
          change: adjustment.adjustment || 0,
          rationale: adjustment.rationale || 'Aucun ajustement nécessaire'
        },
        prospect_insights: prospectInsights,
        synthese_v4: {
          synthese_complete: synthesis.synthese_complete,
          synthese_html: synthesis.synthese_html,
          points_cles: synthesis.points_cles,
          recommandations_action: synthesis.recommandations_action,
          score_global: synthesis.score_global
        }
      },
      message: adjustment.adjusted 
        ? `Séquence générée avec ${sequence.steps.length} emails (ajustée depuis ${adjustment.originalNum})`
        : `Séquence générée avec ${sequence.steps.length} emails (optimal)`
    });

  } catch (error: any) {
    console.error('❌ Erreur génération V4:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération V4'
    });
  }
});

/**
 * POST /api/prospects/generate-optimal-sequence-batch-v4
 * Génération batch pour liste de prospects
 */
router.post('/generate-optimal-sequence-batch-v4', async (req, res) => {
  try {
    const { prospects, context, defaultNumEmails = 3, forceReenrichment = false } = req.body;

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste de prospects requise'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Service IA non configuré'
      });
    }

    console.log(`📋 Génération batch V4 pour ${prospects.length} prospects...`);

    const results = [];
    const adjustments = {
      increased: 0,
      decreased: 0,
      unchanged: 0
    };

    for (const prospect of prospects) {
      try {
        console.log(`\n🔄 Traitement ${prospect.company_name || prospect.email}...`);

        // Enrichissement (avec cache intelligent)
        const enrichedData = await ProspectEnrichmentServiceV4.enrichProspectComplete(
          prospect,
          defaultNumEmails,
          forceReenrichment
        );

        // Génération
        const { sequence, adjustment } = await SequenceGeneratorServiceV4.generateOptimalSequence(
          prospect,
          enrichedData,
          context || '',
          defaultNumEmails
        );

        // Sauvegarder en base
        if (prospect.id) {
          await supabase
            .from('prospects')
            .update({
              enrichment_status: 'completed',
              enrichment_data: enrichedData,
              enriched_at: new Date().toISOString(),
              ai_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', prospect.id);
        }

        // Tracking des ajustements
        if (adjustment.adjusted) {
          if (adjustment.adjustment && adjustment.adjustment > 0) {
            adjustments.increased++;
          } else {
            adjustments.decreased++;
          }
        } else {
          adjustments.unchanged++;
        }

        // Générer la synthèse V4
        const synthesis = ProspectEnrichmentServiceV4Class.generateEnrichmentSynthesis(
          enrichedData,
          prospect.company_name || prospect.email || 'Prospect'
        );

        results.push({
          success: true,
          prospect: {
            id: prospect.id,
            company_name: prospect.company_name,
            email: prospect.email
          },
          sequence,
          enrichment: enrichedData,
          adjustment,
          synthese_v4: {
            synthese_complete: synthesis.synthese_complete,
            points_cles: synthesis.points_cles,
            recommandations_action: synthesis.recommandations_action,
            score_global: synthesis.score_global
          }
        });

        // Pause pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Erreur pour ${prospect.company_name || prospect.email}:`, error);
        results.push({
          success: false,
          prospect: {
            id: prospect.id,
            company_name: prospect.company_name,
            email: prospect.email
          },
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    console.log(`\n📊 RÉSUMÉ BATCH V4 :`);
    console.log(`✅ Succès : ${successCount}/${prospects.length}`);
    console.log(`📈 Augmentations : ${adjustments.increased}`);
    console.log(`📉 Réductions : ${adjustments.decreased}`);
    console.log(`➡️ Inchangés : ${adjustments.unchanged}`);

    return res.json({
      success: true,
      total: prospects.length,
      generated: successCount,
      adjustments,
      results,
      message: `${successCount}/${prospects.length} séquences générées (${adjustments.increased} augmentées, ${adjustments.decreased} réduites)`
    });

  } catch (error: any) {
    console.error('❌ Erreur génération batch V4:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération batch V4'
    });
  }
});

/**
 * POST /api/prospects/enrich-only-v4
 * Enrichissement seul sans génération de séquence (avec cache intelligent)
 */
router.post('/enrich-only-v4', async (req, res) => {
  try {
    const { prospectInfo, forceReenrichment = false } = req.body;

    if (!prospectInfo) {
      return res.status(400).json({
        success: false,
        error: 'Informations prospect requises'
      });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'Service IA non configuré'
      });
    }

    console.log(`🔍 Enrichissement seul V4 pour ${prospectInfo.company_name || prospectInfo.email}`);

    // Vérifier complétude si pas de force
    let cacheHit = false;
    if (!forceReenrichment && prospectInfo.id) {
      const shouldSkip = DataCompletenessDetector.shouldSkipEnrichment(prospectInfo);
      if (shouldSkip.skip) {
        const existing = DataCompletenessDetector.createEnrichmentFromExisting(prospectInfo);
        if (existing) {
          cacheHit = true;
          return res.json({
            success: true,
            data: existing,
            cached: true,
            completeness: shouldSkip.completeness,
            message: `Enrichissement skip: ${shouldSkip.reason}`
          });
        }
      }
    }

    // Enrichissement complet V4 (utilise cache automatiquement)
    const enrichedData = await ProspectEnrichmentServiceV4.enrichProspectComplete(
      prospectInfo,
      3, // Par défaut pour l'analyse timing
      forceReenrichment
    );

    // Sauvegarder en base si ID disponible (fait automatiquement par cache service)
    // Mais on peut aussi le faire explicitement
    if (prospectInfo.id) {
      await supabase
        .from('prospects')
        .update({
          enrichment_status: 'completed',
          enrichment_data: enrichedData,
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectInfo.id);
    }

    return res.json({
      success: true,
      data: enrichedData,
      cached: cacheHit,
      message: cacheHit 
        ? 'Données récupérées du cache' 
        : 'Enrichissement V4 terminé avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur enrichissement V4:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'enrichissement V4'
    });
  }
});

/**
 * POST /api/prospects/:prospectId/invalidate-cache
 * Invalider le cache d'un prospect (forcer re-enrichissement)
 */
router.post('/:prospectId/invalidate-cache', async (req, res) => {
  try {
    const { prospectId } = req.params;
    const { cacheType } = req.body; // 'linkedin' | 'web' | 'operational' | 'timing' | 'full' | undefined

    await ProspectCacheService.invalidateCache(
      prospectId,
      cacheType as any
    );

    return res.json({
      success: true,
      message: `Cache invalidé pour prospect ${prospectId}${cacheType ? ` (${cacheType})` : ' (tous)'}`
    });

  } catch (error: any) {
    console.error('❌ Erreur invalidation cache:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/:prospectId/completeness
 * Obtenir le score de complétude d'un prospect
 */
router.get('/:prospectId/completeness', async (req, res) => {
  try {
    const { prospectId } = req.params;

    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (error || !prospect) {
      return res.status(404).json({
        success: false,
        error: 'Prospect non trouvé'
      });
    }

    const completeness = DataCompletenessDetector.calculateCompleteness(prospect);
    const fieldsToEnrich = DataCompletenessDetector.getFieldsToEnrich(completeness);

    return res.json({
      success: true,
      data: {
        completeness,
        fields_to_enrich: fieldsToEnrich,
        recommendation: completeness.recommendation
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur calcul complétude:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/cache/stats
 * Statistiques du cache
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = ProspectCacheService.getCacheStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Erreur stats cache:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ENDPOINTS SCHEDULING ET TRACKING
// ============================================================================

/**
 * POST /api/prospects/schedule-sequence
 * Programmer l'envoi d'une séquence générée
 */
router.post('/schedule-sequence', async (req, res) => {
  try {
    const { prospectId, sequence, startDate, sequenceName } = req.body;

    if (!prospectId || !sequence) {
      return res.status(400).json({
        success: false,
        error: 'Prospect ID et séquence requis'
      });
    }

    const result = await SequenceSchedulerService.scheduleSequence({
      prospectId,
      sequence,
      startDate: startDate ? new Date(startDate) : undefined,
      sequenceName
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.json({
      success: true,
      data: {
        scheduled_emails: result.scheduledEmails,
        total: result.scheduledEmails.length
      },
      message: `${result.scheduledEmails.length} emails programmés avec succès`
    });

  } catch (error: any) {
    console.error('❌ Erreur programmation séquence:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prospects/schedule-sequence-batch
 * Programmer plusieurs séquences
 */
router.post('/schedule-sequence-batch', async (req, res) => {
  try {
    const { prospects, startDate, sequenceName } = req.body;

    if (!prospects || !Array.isArray(prospects)) {
      return res.status(400).json({
        success: false,
        error: 'Liste de prospects requise'
      });
    }

    const result = await SequenceSchedulerService.scheduleSequenceBatch(
      prospects,
      startDate ? new Date(startDate) : undefined,
      sequenceName
    );

    return res.json({
      success: true,
      data: result,
      message: `${result.scheduled}/${result.total} séquences programmées`
    });

  } catch (error: any) {
    console.error('❌ Erreur programmation batch:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prospects/:prospectId/cancel-sequence
 * Annuler une séquence programmée
 */
router.post('/:prospectId/cancel-sequence', async (req, res) => {
  try {
    const { prospectId } = req.params;
    const { reason } = req.body;

    const result = await SequenceSchedulerService.cancelSequence(prospectId, reason);

    return res.json({
      success: true,
      data: {
        cancelled: result.cancelled
      },
      message: `${result.cancelled} email(s) annulé(s)`
    });

  } catch (error: any) {
    console.error('❌ Erreur annulation séquence:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prospects/:prospectId/pause-sequence
 * Mettre en pause une séquence
 */
router.post('/:prospectId/pause-sequence', async (req, res) => {
  try {
    const { prospectId } = req.params;

    const result = await SequenceSchedulerService.pauseSequence(prospectId);

    return res.json({
      success: true,
      data: {
        paused: result.paused
      },
      message: `${result.paused} email(s) mis en pause`
    });

  } catch (error: any) {
    console.error('❌ Erreur pause séquence:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prospects/:prospectId/resume-sequence
 * Reprendre une séquence en pause
 */
router.post('/:prospectId/resume-sequence', async (req, res) => {
  try {
    const { prospectId } = req.params;

    const result = await SequenceSchedulerService.resumeSequence(prospectId);

    return res.json({
      success: true,
      data: {
        resumed: result.resumed
      },
      message: `${result.resumed} email(s) repris`
    });

  } catch (error: any) {
    console.error('❌ Erreur reprise séquence:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/:prospectId/scheduled-sequence
 * Récupérer la séquence programmée d'un prospect
 */
router.get('/:prospectId/scheduled-sequence', async (req, res) => {
  try {
    const { prospectId } = req.params;

    const result = await SequenceSchedulerService.getScheduledSequence(prospectId);

    return res.json({
      success: true,
      data: {
        emails: result.emails
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération séquence:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/metrics
 * Obtenir les métriques globales de performance
 */
router.get('/performance/metrics', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const metrics = await SequencePerformanceTracker.getGlobalMetrics(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    return res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('❌ Erreur métriques:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/ice-breakers
 * Analyser les performances par type d'ice breaker
 */
router.get('/performance/ice-breakers', async (req, res) => {
  try {
    const performance = await SequencePerformanceTracker.getIceBreakerPerformance();

    return res.json({
      success: true,
      data: performance
    });

  } catch (error: any) {
    console.error('❌ Erreur analyse ice breakers:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/adjustments
 * Analyser les performances selon les ajustements
 */
router.get('/performance/adjustments', async (req, res) => {
  try {
    const performance = await SequencePerformanceTracker.getAdjustmentPerformance();

    return res.json({
      success: true,
      data: performance
    });

  } catch (error: any) {
    console.error('❌ Erreur analyse ajustements:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/score-correlation
 * Analyser la corrélation score attractivité / conversion
 */
router.get('/performance/score-correlation', async (req, res) => {
  try {
    const correlation = await SequencePerformanceTracker.getScoreCorrelation();

    return res.json({
      success: true,
      data: correlation
    });

  } catch (error: any) {
    console.error('❌ Erreur corrélation scores:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/report
 * Générer un rapport complet de performances
 */
router.get('/performance/report', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const report = await SequencePerformanceTracker.generatePerformanceReport(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    return res.json({
      success: true,
      data: report
    });

  } catch (error: any) {
    console.error('❌ Erreur rapport performances:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prospects/performance/ab-testing-data
 * Exporter les données pour A/B testing V4 vs Legacy
 */
router.get('/performance/ab-testing-data', async (req, res) => {
  try {
    const data = await SequencePerformanceTracker.exportABTestingData();

    return res.json({
      success: true,
      data,
      summary: {
        v4_count: data.v4_prospects.length,
        legacy_count: data.legacy_prospects.length,
        v4_avg_reply_rate: data.v4_prospects.length > 0
          ? data.v4_prospects.reduce((sum, p) => sum + p.reply_rate, 0) / data.v4_prospects.length
          : 0,
        legacy_avg_reply_rate: data.legacy_prospects.length > 0
          ? data.legacy_prospects.reduce((sum, p) => sum + p.reply_rate, 0) / data.legacy_prospects.length
          : 0
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur export A/B testing:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// RAPPORTS PROSPECTS
// ============================================================================

/**
 * GET /api/prospects/:id/report
 * Récupérer le rapport d'un prospect
 */
router.get('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProspectReportService.getReport(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prospects/:id/report
 * Créer ou mettre à jour un rapport
 */
router.post('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'system';
    
    const result = await ProspectReportService.createOrUpdateReport(
      id,
      req.body,
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prospects/:id/report/enrich
 * Enrichir le rapport avec l'IA
 */
router.post('/:id/report/enrich', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'system';

    const result = await ProspectReportService.enrichReport({
      prospect_id: id,
      user_id: userId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/prospects/:id/report/history
 * Historique des versions du rapport
 */
router.get('/:id/report/history', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProspectReportService.getReportHistory(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prospects/:id/report/restore
 * Restaurer une version précédente
 */
router.post('/:id/report/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    const userId = (req as any).user?.id || 'system';

    const result = await ProspectReportService.restoreVersion(id, version, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prospects/:id/report/attachments
 * Ajouter une pièce jointe au rapport
 */
router.post('/:id/report/attachments', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'system';
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucun fichier fourni' 
      });
    }

    const result = await ProspectReportService.addAttachment(id, req.file, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/prospects/:id/report/attachments
 * Supprimer une pièce jointe
 */
router.delete('/:id/report/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL du fichier requise' 
      });
    }

    const result = await ProspectReportService.removeAttachment(id, url);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/prospects/:id/report
 * Supprimer un rapport
 */
router.delete('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProspectReportService.deleteReport(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/prospects/reports/stats
 * Statistiques sur les rapports
 */
router.get('/reports/stats', async (req, res) => {
  try {
    const result = await ProspectReportService.getReportStats();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RÉPONSES PROSPECTS
// ============================================================================

/**
 * GET /api/prospects/replies
 * Liste toutes les réponses avec filtres
 */
router.get('/replies', async (req, res) => {
  try {
    const filters = {
      unread_only: req.query.unread === 'true',
      sequence_id: req.query.sequence_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      quick_reply_only: req.query.quick_reply === 'true'
    };

    const result = await ProspectRepliesService.getRepliesSummary(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/prospects/replies/stats
 * Statistiques globales des réponses
 */
router.get('/replies/stats', async (req, res) => {
  try {
    const result = await ProspectRepliesService.getGlobalStats();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/prospects/replies/unread-count
 * Nombre de réponses non lues (pour badge)
 */
router.get('/replies/unread-count', async (req, res) => {
  try {
    const result = await ProspectRepliesService.getUnreadCount();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prospects/:id/replies/mark-read
 * Marquer toutes les réponses comme lues
 */
router.post('/:id/replies/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ProspectRepliesService.markProspectRepliesAsRead(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// GESTION DES EMAILS PROGRAMMÉS
// ============================================================================

/**
 * PUT /api/prospects/scheduled-emails/:id
 * Modifier un email programmé (sujet, corps, date)
 */
router.put('/scheduled-emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, scheduled_for } = req.body;

    // Vérifier que l'email existe et est bien en status 'scheduled'
    const { data: existing, error: fetchError } = await supabase
      .from('prospect_email_scheduled')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Email programmé non trouvé'
      });
    }

    if (existing.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: `Impossible de modifier un email avec le statut "${existing.status}"`
      });
    }

    // Préparer les champs à mettre à jour
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (subject !== undefined) updates.subject = subject;
    if (body !== undefined) updates.body = body;
    if (scheduled_for !== undefined) {
      // Valider la date
      const newDate = new Date(scheduled_for);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Date invalide'
        });
      }
      updates.scheduled_for = newDate.toISOString();
    }

    // Mettre à jour l'email
    const { data: updated, error: updateError } = await supabase
      .from('prospect_email_scheduled')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour email programmé:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Email programmé mis à jour avec succès'
    });
  } catch (error: any) {
    console.error('Erreur modification email programmé:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/prospects/scheduled-emails/:id/pause
 * Suspendre un email programmé
 */
router.patch('/scheduled-emails/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'email existe et est bien en status 'scheduled'
    const { data: existing, error: fetchError } = await supabase
      .from('prospect_email_scheduled')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Email programmé non trouvé'
      });
    }

    if (existing.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: `Impossible de suspendre un email avec le statut "${existing.status}"`
      });
    }

    // Mettre à jour le statut
    const { data: updated, error: updateError } = await supabase
      .from('prospect_email_scheduled')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur suspension email programmé:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suspension'
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Email programmé suspendu avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suspension email programmé:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/prospects/scheduled-emails/:id/resume
 * Reprendre un email programmé suspendu
 */
router.patch('/scheduled-emails/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'email existe et est bien en status 'paused'
    const { data: existing, error: fetchError } = await supabase
      .from('prospect_email_scheduled')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Email programmé non trouvé'
      });
    }

    if (existing.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: `Impossible de reprendre un email avec le statut "${existing.status}"`
      });
    }

    // Mettre à jour le statut
    const { data: updated, error: updateError } = await supabase
      .from('prospect_email_scheduled')
      .update({
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur reprise email programmé:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la reprise'
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Email programmé repris avec succès'
    });
  } catch (error: any) {
    console.error('Erreur reprise email programmé:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/prospects/scheduled-emails/:id
 * Annuler/supprimer un email programmé
 */
router.delete('/scheduled-emails/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'email existe et peut être supprimé
    const { data: existing, error: fetchError } = await supabase
      .from('prospect_email_scheduled')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Email programmé non trouvé'
      });
    }

    if (existing.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un email déjà envoyé'
      });
    }

    // Marquer comme annulé plutôt que de supprimer complètement
    const { data: cancelled, error: cancelError } = await supabase
      .from('prospect_email_scheduled')
      .update({
        status: 'cancelled',
        cancelled_reason: 'Annulé manuellement par l\'administrateur',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (cancelError) {
      console.error('Erreur annulation email programmé:', cancelError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation'
      });
    }

    return res.json({
      success: true,
      data: cancelled,
      message: 'Email programmé annulé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression email programmé:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TRANSFERT PROSPECT VERS CLIENT/EXPERT
// ============================================================================

/**
 * POST /api/prospects/:prospectId/transfer-to-expert
 * Transfère un prospect vers un client avec assignation d'un produit et d'un expert
 */
router.post('/:prospectId/transfer-to-expert', async (req, res) => {
  try {
    const { prospectId } = req.params;
    const { produitId, expertId, montantPotentiel, notes } = req.body;
    const user = (req as any).user;

    if (!produitId || !expertId) {
      return res.status(400).json({
        success: false,
        error: 'produitId et expertId sont requis'
      });
    }

    const { ProspectTransferService } = await import('../services/ProspectTransferService');

    const result = await ProspectTransferService.transferProspectToExpert(
      {
        prospectId,
        produitId,
        expertId,
        montantPotentiel,
        notes
      },
      user?.database_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      data: {
        clientId: result.clientId,
        clientProduitEligibleId: result.clientProduitEligibleId
      },
      message: result.message
    });
  } catch (error: any) {
    console.error('Erreur transfert prospect:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    });
  }
});

export default router;

