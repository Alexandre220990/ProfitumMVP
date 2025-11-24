/**
 * ClientTimelineService
 * Service pour gérer la timeline complète d'un client
 * Fusionne : événements client + tous les événements de tous les dossiers du client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TimelineEvent {
  id?: string;
  client_id?: string;
  dossier_id?: string;
  date?: Date | string;
  type: 'document' | 'notification' | 'status_change' | 'comment' | 'rdv' | 'expert_action' | 'client_action' | 'admin_action' | 'system_action' | 'dossier_created' | 'dossier_updated';
  actor_type: 'client' | 'expert' | 'admin' | 'system' | 'apporteur';
  actor_id?: string;
  actor_name: string;
  title: string;
  description?: string;
  metadata?: any;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  action_url?: string;
}

export class ClientTimelineService {
  
  /**
   * Ajouter un événement à la timeline client
   */
  static async addEvent(event: TimelineEvent): Promise<{ success: boolean; event_id?: string }> {
    try {
      // Vérifier si la table client_timeline existe
      const { data, error } = await supabase
        .from('client_timeline')
        .insert({
          client_id: event.client_id,
          dossier_id: event.dossier_id || null,
          date: event.date || new Date().toISOString(),
          type: event.type,
          actor_type: event.actor_type,
          actor_id: event.actor_id || null,
          actor_name: event.actor_name,
          title: event.title,
          description: event.description || null,
          metadata: event.metadata || null,
          icon: event.icon || null,
          color: event.color || 'blue',
          action_url: event.action_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        // Si la table n'existe pas, on log juste l'événement
        console.warn('⚠️ Table client_timeline n\'existe pas, événement non sauvegardé:', error);
        return { success: true }; // On retourne success pour ne pas bloquer
      }

      console.log(`✅ Événement timeline client ajouté: ${event.title}`);
      return { success: true, event_id: data.id };

    } catch (error) {
      console.error('❌ Erreur addEvent client:', error);
      return { success: false };
    }
  }

  /**
   * Récupérer la timeline complète d'un client
   * Fusionne : événements client + tous les événements de tous les dossiers + commentaires
   */
  static async getTimeline(
    client_id: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      actor_type?: string;
    }
  ): Promise<{ success: boolean; events?: TimelineEvent[]; total?: number }> {
    try {
      const allEvents: TimelineEvent[] = [];

      // 1. Récupérer tous les dossiers du client
      const { data: dossiers, error: dossiersError } = await supabase
        .from('ClientProduitEligible')
        .select('id, statut, created_at, updated_at, produitId, ProduitEligible:produitId(nom)')
        .eq('clientId', client_id);

      if (dossiersError) {
        console.error('❌ Erreur récupération dossiers:', dossiersError);
      }

      const dossierIds = (dossiers || []).map((d: any) => d.id);
      
      // Fonction helper pour extraire le nom du produit
      const getProduitNom = (dossier: any): string => {
        if (!dossier) return 'N/A';
        if (Array.isArray(dossier.ProduitEligible)) {
          return dossier.ProduitEligible[0]?.nom || 'N/A';
        }
        return dossier.ProduitEligible?.nom || 'N/A';
      };

      // 2. Récupérer tous les événements de tous les dossiers du client
      if (dossierIds.length > 0) {
        // Événements de dossier_timeline
        let timelineQuery = supabase
          .from('dossier_timeline')
          .select('*')
          .in('dossier_id', dossierIds);

        if (options?.type) {
          timelineQuery = timelineQuery.eq('type', options.type);
        }

        if (options?.actor_type) {
          timelineQuery = timelineQuery.eq('actor_type', options.actor_type);
        }

        const { data: dossierEvents, error: timelineError } = await timelineQuery;

        if (timelineError) {
          console.error('❌ Erreur récupération timeline dossiers:', timelineError);
        }

        // Convertir en événements client avec référence dossier
        (dossierEvents || []).forEach((event: any) => {
          const dossier = dossiers?.find((d: any) => d.id === event.dossier_id);
          const produitNom = getProduitNom(dossier);
          allEvents.push({
            ...event,
            client_id,
            dossier_id: event.dossier_id,
            title: `${event.title} (Dossier: ${produitNom})`,
            description: event.description,
            date: event.date || event.created_at
          });
        });

        // Commentaires des dossiers (DossierComment)
        let commentsQuery = supabase
          .from('DossierComment')
          .select('*')
          .in('dossier_id', dossierIds)
          .is('deleted_at', null)
          .eq('comment_type', 'manual');

        if (options?.actor_type) {
          commentsQuery = commentsQuery.eq('created_by_type', options.actor_type);
        }

        const { data: dossierComments, error: commentsError } = await commentsQuery;

        if (commentsError) {
          console.error('❌ Erreur récupération commentaires dossiers:', commentsError);
        }

        // Convertir les commentaires en événements
        (dossierComments || []).forEach((comment: any) => {
          const dossier = dossiers?.find((d: any) => d.id === comment.dossier_id);
          const produitNom = getProduitNom(dossier);
          const contentMatch = comment.content.match(/^Commentaire (Admin|Expert|Apporteur) : (.+)$/);
          const actorName = contentMatch ? contentMatch[1] : (comment.created_by_type || 'Système');
          const description = contentMatch ? contentMatch[2] : comment.content;

          let actorType: 'client' | 'expert' | 'admin' | 'system' | 'apporteur' = 'system';
          if (comment.created_by_type === 'admin') actorType = 'admin';
          else if (comment.created_by_type === 'expert') actorType = 'expert';
          else if (comment.created_by_type === 'apporteur') actorType = 'apporteur';

          allEvents.push({
            id: comment.id,
            client_id,
            dossier_id: comment.dossier_id,
            date: comment.created_at,
            type: 'comment',
            actor_type: actorType,
            actor_id: comment.created_by,
            actor_name: actorName,
            title: `Commentaire ${actorName} (Dossier: ${produitNom})`,
            description: description,
            icon: '💬',
            color: actorType === 'admin' ? 'red' : actorType === 'expert' ? 'purple' : 'green'
          });
        });
      }

      // 3. Récupérer les événements client (client_timeline si existe)
      try {
        let clientTimelineQuery = supabase
          .from('client_timeline')
          .select('*')
          .eq('client_id', client_id);

        if (options?.type) {
          clientTimelineQuery = clientTimelineQuery.eq('type', options.type);
        }

        if (options?.actor_type) {
          clientTimelineQuery = clientTimelineQuery.eq('actor_type', options.actor_type);
        }

        const { data: clientEvents, error: clientTimelineError } = await clientTimelineQuery;

        if (!clientTimelineError && clientEvents) {
          clientEvents.forEach((event: any) => {
            allEvents.push({
              ...event,
              client_id,
              date: event.date || event.created_at
            });
          });
        }
      } catch (err) {
        // Table n'existe peut-être pas, ce n'est pas grave
        console.log('ℹ️ Table client_timeline non disponible');
      }

      // 4. Ajouter les événements de création/modification des dossiers
      (dossiers || []).forEach((dossier: any) => {
        const produitNom = getProduitNom(dossier);
        
        allEvents.push({
          id: `dossier-created-${dossier.id}`,
          client_id,
          dossier_id: dossier.id,
          date: dossier.created_at,
          type: 'dossier_created',
          actor_type: 'system',
          actor_name: 'Système',
          title: `Dossier créé: ${produitNom}`,
          description: `Statut initial: ${dossier.statut}`,
          icon: '📄',
          color: 'blue'
        });

        if (dossier.updated_at && dossier.updated_at !== dossier.created_at) {
          allEvents.push({
            id: `dossier-updated-${dossier.id}`,
            client_id,
            dossier_id: dossier.id,
            date: dossier.updated_at,
            type: 'dossier_updated',
            actor_type: 'system',
            actor_name: 'Système',
            title: `Dossier mis à jour: ${produitNom}`,
            description: `Statut: ${dossier.statut}`,
            icon: '🔄',
            color: 'gray'
          });
        }
      });

      // 5. Trier par date (plus récent en premier)
      allEvents.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      // 6. Appliquer la pagination
      let paginatedEvents = allEvents;
      if (options?.limit) {
        const offset = options.offset || 0;
        paginatedEvents = allEvents.slice(offset, offset + options.limit);
      }

      return {
        success: true,
        events: paginatedEvents,
        total: allEvents.length
      };

    } catch (error) {
      console.error('❌ Erreur getTimeline client:', error);
      return { success: false };
    }
  }
}

