/**
 * Script pour mettre à jour le format des notifications d'événement existantes
 * 
 * Ce script met à jour les notifications d'événement dans la BDD pour :
 * - Retirer le décompte du message (garder uniquement le titre)
 * - Ajouter scheduled_datetime dans les métadonnées
 * - Mettre à jour le statut des événements (upcoming/in_progress/completed)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Formater la date et l'heure du RDV
 */
function formatDateTime(date: string, time: string): string {
  try {
    const dateObj = new Date(`${date}T${time}`);
    const day = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hour = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${day} à ${hour}`;
  } catch {
    return `${date} à ${time}`;
  }
}

/**
 * Déterminer le statut de l'événement
 */
function getEventStatus(rdv: any): 'upcoming' | 'in_progress' | 'completed' {
  const now = new Date();
  const eventStart = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
  const durationMs = (rdv.duration_minutes || 60) * 60 * 1000;
  const eventEnd = new Date(eventStart.getTime() + durationMs);

  if (rdv.status === 'completed' || now >= eventEnd) {
    return 'completed';
  } else if (now >= eventStart && now < eventEnd) {
    return 'in_progress';
  } else {
    return 'upcoming';
  }
}

/**
 * Extraire le titre du message (retirer le décompte)
 */
function extractTitle(message: string): string {
  // Si le message contient " - Dans " ou " - Se termine dans ", prendre seulement la partie avant
  const match = message.match(/^(.+?)(\s*-\s*(Dans|Se termine dans).+)?$/);
  return match ? match[1].trim() : message;
}

async function updateEventNotifications() {
  console.log('🔄 Mise à jour des notifications d\'événement...\n');

  try {
    // Récupérer toutes les notifications d'événement
    const { data: notifications, error: fetchError } = await supabase
      .from('notification')
      .select('*')
      .in('notification_type', ['event_upcoming', 'event_in_progress', 'event_completed']);

    if (fetchError) {
      console.error('❌ Erreur récupération notifications:', fetchError);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ Aucune notification d\'événement à mettre à jour');
      return;
    }

    console.log(`📋 ${notifications.length} notification(s) d'événement trouvée(s)\n`);

    let updated = 0;
    let errors = 0;

    for (const notif of notifications) {
      try {
        const metadata = notif.metadata || {};
        const eventId = metadata.event_id;

        if (!eventId) {
          console.warn(`⚠️  Notification ${notif.id} sans event_id, ignorée`);
          continue;
        }

        // Récupérer le RDV pour obtenir les informations complètes
        const { data: rdv, error: rdvError } = await supabase
          .from('RDV')
          .select('*')
          .eq('id', eventId)
          .single();

        if (rdvError || !rdv) {
          console.warn(`⚠️  RDV ${eventId} introuvable pour notification ${notif.id}`);
          // Mettre à jour quand même avec les données disponibles
        }

        // Déterminer le nouveau statut
        const eventStatus = rdv ? getEventStatus(rdv) : 
          (notif.notification_type === 'event_completed' ? 'completed' :
           notif.notification_type === 'event_in_progress' ? 'in_progress' : 'upcoming');

        const notificationType = `event_${eventStatus}`;

        // Extraire le titre du message
        const title = extractTitle(notif.message);

        // Formater la date/heure
        const scheduledDate = metadata.scheduled_date || rdv?.scheduled_date;
        const scheduledTime = metadata.scheduled_time || rdv?.scheduled_time;
        const scheduledDatetime = scheduledDate && scheduledTime 
          ? formatDateTime(scheduledDate, scheduledTime)
          : null;

        // Mettre à jour les métadonnées
        const updatedMetadata = {
          ...metadata,
          event_status: eventStatus,
          scheduled_datetime: scheduledDatetime || metadata.scheduled_datetime,
          scheduled_date: scheduledDate || metadata.scheduled_date,
          scheduled_time: scheduledTime || metadata.scheduled_time,
        };

        // Mettre à jour la notification
        const { error: updateError } = await supabase
          .from('notification')
          .update({
            title: notif.title, // Garder le titre existant
            message: title, // Message sans décompte
            notification_type: notificationType,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', notif.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour notification ${notif.id}:`, updateError);
          errors++;
        } else {
          console.log(`✅ Notification ${notif.id} mise à jour: ${title} (${eventStatus})`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Erreur traitement notification ${notif.id}:`, error);
        errors++;
      }
    }

    console.log(`\n✅ Mise à jour terminée: ${updated} réussie(s), ${errors} erreur(s)`);
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
updateEventNotifications()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

