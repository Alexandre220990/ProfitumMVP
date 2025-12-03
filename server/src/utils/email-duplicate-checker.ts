/**
 * Utilitaire de détection et prévention des doublons d'emails
 * 
 * Protection à 3 niveaux :
 * 1. Hash du contenu (subject + body)
 * 2. Vérification avant programmation
 * 3. Vérification avant envoi
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Générer un hash SHA256 du contenu d'un email
 * Format: SHA256(subject|||body)
 * 
 * @param subject Sujet de l'email
 * @param body Corps de l'email
 * @returns Hash SHA256 en hexadécimal (64 caractères)
 */
export function generateEmailContentHash(subject: string, body: string): string {
  return crypto
    .createHash('sha256')
    .update(`${subject}|||${body}`)
    .digest('hex');
}

/**
 * Résultat de la vérification de doublon
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingEmail?: {
    id: string;
    sent_at: string;
    subject: string;
    step?: number;
  };
}

/**
 * Vérifier si un email avec ce contenu a déjà été envoyé à ce prospect
 * 
 * @param prospectId ID du prospect
 * @param subject Sujet de l'email
 * @param body Corps de l'email
 * @returns Résultat de la vérification avec détails si doublon détecté
 */
export async function isEmailContentAlreadySent(
  prospectId: string,
  subject: string,
  body: string
): Promise<DuplicateCheckResult> {
  try {
    const contentHash = generateEmailContentHash(subject, body);

    const { data: existingEmail, error } = await supabase
      .from('prospects_emails')
      .select('id, sent_at, subject, step, is_duplicate_archived')
      .eq('prospect_id', prospectId)
      .eq('content_hash', contentHash)
      .or('is_duplicate_archived.is.null,is_duplicate_archived.eq.false') // Exclure les doublons archivés
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur vérification doublon email:', error);
      // En cas d'erreur, on laisse passer (mieux vaut un doublon rare qu'un blocage)
      return { isDuplicate: false };
    }

    if (existingEmail) {
      console.log(`🔒 Email en doublon détecté pour prospect ${prospectId}`);
      console.log(`   Sujet: "${existingEmail.subject}"`);
      console.log(`   Déjà envoyé le: ${existingEmail.sent_at}`);
      
      return {
        isDuplicate: true,
        existingEmail: {
          id: existingEmail.id,
          sent_at: existingEmail.sent_at,
          subject: existingEmail.subject,
          step: existingEmail.step
        }
      };
    }

    return { isDuplicate: false };
  } catch (error: any) {
    console.error('❌ Exception vérification doublon:', error);
    // En cas d'erreur, on laisse passer
    return { isDuplicate: false };
  }
}

/**
 * Résultat de la vérification de doublons pour plusieurs emails
 */
export interface BulkDuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    subject: string;
    body: string;
    status: string;
    scheduled_for?: string;
    sent_at?: string;
  }>;
}

/**
 * Vérifier si des emails programmés existent déjà pour ce prospect (même contenu)
 * Vérifie à la fois dans prospect_email_scheduled ET prospects_emails
 * 
 * @param prospectId ID du prospect
 * @param emails Liste des emails à vérifier
 * @returns Résultat avec liste des doublons détectés
 */
export async function areEmailsAlreadyScheduledOrSent(
  prospectId: string,
  emails: Array<{ subject: string; body: string }>
): Promise<BulkDuplicateCheckResult> {
  try {
    const hashes = emails.map(e => generateEmailContentHash(e.subject, e.body));

    // Vérifier dans les emails programmés (scheduled)
    const { data: existingScheduled, error: scheduledError } = await supabase
      .from('prospect_email_scheduled')
      .select('subject, body, status, scheduled_for, content_hash')
      .eq('prospect_id', prospectId)
      .in('content_hash', hashes)
      .in('status', ['scheduled', 'sent']);

    if (scheduledError) {
      console.error('❌ Erreur vérification emails programmés:', scheduledError);
    }

    // Vérifier dans les emails déjà envoyés (exclure les doublons archivés)
    const { data: existingSent, error: sentError } = await supabase
      .from('prospects_emails')
      .select('subject, body, sent_at, content_hash, is_duplicate_archived')
      .eq('prospect_id', prospectId)
      .in('content_hash', hashes)
      .or('is_duplicate_archived.is.null,is_duplicate_archived.eq.false');

    if (sentError) {
      console.error('❌ Erreur vérification emails envoyés:', sentError);
    }

    const duplicates: Array<any> = [];

    // Ajouter les emails programmés en doublon
    if (existingScheduled && existingScheduled.length > 0) {
      duplicates.push(...existingScheduled.map(e => ({
        subject: e.subject,
        body: e.body,
        status: e.status,
        scheduled_for: e.scheduled_for
      })));
    }

    // Ajouter les emails déjà envoyés en doublon
    if (existingSent && existingSent.length > 0) {
      duplicates.push(...existingSent.map(e => ({
        subject: e.subject,
        body: e.body,
        status: 'sent',
        sent_at: e.sent_at
      })));
    }

    if (duplicates.length > 0) {
      console.log(`⚠️ ${duplicates.length} email(s) en doublon détecté(s) pour prospect ${prospectId}`);
      duplicates.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. "${dup.subject}" - Status: ${dup.status}`);
      });
      
      return {
        hasDuplicates: true,
        duplicates
      };
    }

    return { hasDuplicates: false, duplicates: [] };
  } catch (error: any) {
    console.error('❌ Exception vérification doublons bulk:', error);
    // En cas d'erreur, on laisse passer
    return { hasDuplicates: false, duplicates: [] };
  }
}

/**
 * Vérifier si une séquence est déjà programmée pour un prospect
 * (indépendamment du contenu des emails)
 * 
 * @param prospectId ID du prospect
 * @param sequenceId ID de la séquence
 * @returns true si la séquence est déjà programmée (status scheduled ou sent)
 */
export async function isSequenceAlreadyScheduled(
  prospectId: string,
  sequenceId: string
): Promise<{
  isScheduled: boolean;
  emailCount?: number;
  statuses?: Array<string>;
}> {
  try {
    const { data, error } = await supabase
      .from('prospect_email_scheduled')
      .select('id, status')
      .eq('prospect_id', prospectId)
      .eq('sequence_id', sequenceId)
      .in('status', ['scheduled', 'sent']);

    if (error) {
      console.error('❌ Erreur vérification séquence:', error);
      return { isScheduled: false };
    }

    if (data && data.length > 0) {
      const statuses = [...new Set(data.map(d => d.status))];
      console.log(`⚠️ Séquence ${sequenceId} déjà programmée pour prospect ${prospectId}`);
      console.log(`   ${data.length} email(s) - Status: ${statuses.join(', ')}`);
      
      return {
        isScheduled: true,
        emailCount: data.length,
        statuses
      };
    }

    return { isScheduled: false };
  } catch (error: any) {
    console.error('❌ Exception vérification séquence:', error);
    return { isScheduled: false };
  }
}

/**
 * Marquer un email programmé comme annulé pour cause de doublon
 * 
 * @param scheduledEmailId ID de l'email programmé
 * @param duplicateOfEmailId ID de l'email existant (doublon détecté)
 */
export async function cancelScheduledEmailAsDuplicate(
  scheduledEmailId: string,
  duplicateOfEmailId: string
): Promise<void> {
  try {
    await supabase
      .from('prospect_email_scheduled')
      .update({
        status: 'cancelled',
        cancelled_reason: 'duplicate_content_detected',
        updated_at: new Date().toISOString(),
        metadata: {
          duplicate_of_email_id: duplicateOfEmailId,
          duplicate_detected_at: new Date().toISOString()
        }
      })
      .eq('id', scheduledEmailId);

    console.log(`✅ Email programmé ${scheduledEmailId} annulé (doublon de ${duplicateOfEmailId})`);
  } catch (error: any) {
    console.error(`❌ Erreur annulation email programmé ${scheduledEmailId}:`, error);
  }
}

/**
 * Obtenir des statistiques sur les doublons détectés
 */
export async function getDuplicateStats(): Promise<{
  totalProspects: number;
  prospectsWithDuplicates: number;
  totalDuplicates: number;
  topDuplicates: Array<{
    subject: string;
    count: number;
    prospect_emails: string[];
  }>;
}> {
  try {
    const { data, error } = await supabase
      .from('v_email_duplicates_analysis')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Erreur récupération stats doublons:', error);
      return {
        totalProspects: 0,
        prospectsWithDuplicates: 0,
        totalDuplicates: 0,
        topDuplicates: []
      };
    }

    if (!data || data.length === 0) {
      return {
        totalProspects: 0,
        prospectsWithDuplicates: 0,
        totalDuplicates: 0,
        topDuplicates: []
      };
    }

    const prospectsWithDuplicates = data.length;
    const totalDuplicates = data.reduce((sum, row) => sum + (row.duplicate_count || 0), 0);
    
    const topDuplicates = data.map(row => ({
      subject: row.subject || '',
      count: row.duplicate_count || 0,
      prospect_emails: [row.prospect_email || '']
    }));

    return {
      totalProspects: 0, // Nécessiterait une requête supplémentaire
      prospectsWithDuplicates,
      totalDuplicates,
      topDuplicates
    };
  } catch (error: any) {
    console.error('❌ Exception stats doublons:', error);
    return {
      totalProspects: 0,
      prospectsWithDuplicates: 0,
      totalDuplicates: 0,
      topDuplicates: []
    };
  }
}

