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

      // 4. Récupérer les RDV liés au client
      try {
        let rdvQuery = supabase
          .from('RDV')
          .select('*')
          .eq('client_id', client_id);

        if (options?.type && options.type === 'rdv') {
          // Si on filtre par type rdv, on garde la requête
        } else if (options?.type && options.type !== 'rdv') {
          // Si on filtre par un autre type, on exclut les RDV
          rdvQuery = rdvQuery.limit(0);
        }

        const { data: rdvs, error: rdvError } = await rdvQuery;

        if (!rdvError && rdvs) {
          // Récupérer tous les IDs uniques des créateurs de RDV
          const rdvCreatorIds = [...new Set(rdvs.map((rdv: any) => rdv.created_by).filter(Boolean))];
          
          // Récupérer tous les admins et experts en une fois
          const rdvCreators = new Map<string, { type: 'admin' | 'expert' | 'system', email?: string }>();
          
          if (rdvCreatorIds.length > 0) {
            try {
              const { data: admins } = await supabase
                .from('Admin')
                .select('id, email')
                .in('id', rdvCreatorIds);
              
              (admins || []).forEach((admin: any) => {
                rdvCreators.set(admin.id, { type: 'admin', email: admin.email });
              });

              const { data: experts } = await supabase
                .from('Expert')
                .select('id, email')
                .in('id', rdvCreatorIds);
              
              (experts || []).forEach((expert: any) => {
                if (!rdvCreators.has(expert.id)) {
                  rdvCreators.set(expert.id, { type: 'expert', email: expert.email });
                }
              });
            } catch (err) {
              console.warn('⚠️ Erreur récupération créateurs RDV:', err);
            }
          }

          rdvs.forEach((rdv: any) => {
            const rdvDate = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
            // Déterminer le type d'acteur selon created_by
            let actorType: 'client' | 'expert' | 'admin' | 'system' | 'apporteur' = 'system';
            let actorName = 'Système';
            
            if (rdv.created_by && rdvCreators.has(rdv.created_by)) {
              const creator = rdvCreators.get(rdv.created_by)!;
              actorType = creator.type;
              actorName = creator.type === 'admin' ? 'Administrateur' : 'Expert';
            }
            
            allEvents.push({
              id: `rdv-${rdv.id}`,
              client_id,
              dossier_id: rdv.dossier_id || rdv.metadata?.dossier_id || undefined,
              date: rdvDate.toISOString(),
              type: 'rdv',
              actor_type: actorType,
              actor_id: rdv.created_by || null,
              actor_name: actorName,
              title: `Rendez-vous : ${rdv.title || 'Sans titre'}`,
              description: rdv.description || `Rendez-vous prévu le ${rdvDate.toLocaleDateString('fr-FR')} à ${rdvDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${rdv.location ? ` - ${rdv.location}` : ''}`,
              metadata: {
                rdv_id: rdv.id,
                scheduled_date: rdv.scheduled_date,
                scheduled_time: rdv.scheduled_time,
                duration_minutes: rdv.duration_minutes,
                location: rdv.location,
                meeting_url: rdv.meeting_url,
                meeting_type: rdv.meeting_type,
                ...(rdv.metadata || {})
              },
              icon: '📅',
              color: 'blue',
              action_url: `${process.env.FRONTEND_URL || ''}/admin/agenda-admin?event=${rdv.id}`
            });
          });
        }
      } catch (rdvErr) {
        console.warn('⚠️ Erreur récupération RDV pour timeline client:', rdvErr);
      }

      // 5. Ajouter les événements de création/modification des dossiers
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

      // 6. Dédupliquer les événements (notamment les RDV qui peuvent apparaître plusieurs fois)
      // Priorité : Admin > Expert > Apporteur > Système
      const uniqueEventsMap = new Map<string, TimelineEvent>();
      const actorPriority: Record<string, number> = {
        'admin': 4,
        'expert': 3,
        'apporteur': 2,
        'system': 1,
        'client': 0
      };
      
      allEvents.forEach((event) => {
        // Créer une clé unique basée sur l'ID et le type
        let uniqueKey: string;
        
        if (event.id) {
          // Si l'événement a déjà un ID, l'utiliser
          uniqueKey = event.id;
        } else if (event.type === 'rdv' && event.metadata?.rdv_id) {
          // Pour les RDV, utiliser l'ID du RDV comme clé unique
          uniqueKey = `rdv-${event.metadata.rdv_id}`;
        } else if (event.type === 'dossier_created' && event.dossier_id) {
          // Pour les créations de dossier, utiliser dossier_id comme clé
          uniqueKey = `dossier-created-${event.dossier_id}`;
        } else {
          // Pour les autres événements, créer une clé basée sur type + date + titre
          uniqueKey = `${event.type}-${event.date}-${event.title}`;
        }
        
        // Si l'événement existe déjà, vérifier la priorité
        const existingEvent = uniqueEventsMap.get(uniqueKey);
        if (existingEvent) {
          const existingPriority = actorPriority[existingEvent.actor_type] || 0;
          const newPriority = actorPriority[event.actor_type] || 0;
          
          // Garder l'événement avec la priorité la plus élevée (Admin > Expert > Apporteur > Système)
          if (newPriority > existingPriority) {
            uniqueEventsMap.set(uniqueKey, event);
          }
        } else {
          uniqueEventsMap.set(uniqueKey, event);
        }
      });
      
      const deduplicatedEvents = Array.from(uniqueEventsMap.values());

      // 7. Enrichir les événements avec les emails des acteurs (pour distinguer les admins)
      const actorIds = new Set<string>();
      deduplicatedEvents.forEach(event => {
        if (event.actor_id && (event.actor_type === 'admin' || event.actor_type === 'expert' || event.actor_type === 'apporteur')) {
          actorIds.add(event.actor_id);
        }
      });

      // Récupérer les emails des acteurs
      const actorEmails = new Map<string, string>();
      if (actorIds.size > 0) {
        try {
          // Admins
          const { data: admins } = await supabase
            .from('Admin')
            .select('id, email')
            .in('id', Array.from(actorIds));
          
          (admins || []).forEach((admin: any) => {
            actorEmails.set(admin.id, admin.email);
          });

          // Experts
          const { data: experts } = await supabase
            .from('Expert')
            .select('id, email')
            .in('id', Array.from(actorIds));
          
          (experts || []).forEach((expert: any) => {
            actorEmails.set(expert.id, expert.email);
          });

          // Apporteurs
          const { data: apporteurs } = await supabase
            .from('ApporteurAffaires')
            .select('id, email')
            .in('id', Array.from(actorIds));
          
          (apporteurs || []).forEach((apporteur: any) => {
            actorEmails.set(apporteur.id, apporteur.email);
          });
        } catch (err) {
          console.warn('⚠️ Erreur récupération emails acteurs:', err);
        }
      }

      // Enrichir les événements avec les emails
      deduplicatedEvents.forEach(event => {
        if (event.actor_id && actorEmails.has(event.actor_id)) {
          const email = actorEmails.get(event.actor_id);
          // Ajouter l'email à actor_name si c'est un admin
          if (event.actor_type === 'admin' && email) {
            event.actor_name = `${event.actor_name} (${email})`;
          }
        }
      });

      // 8. Trier par date (plus récent en premier)
      deduplicatedEvents.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      // 9. Appliquer la pagination
      let paginatedEvents = deduplicatedEvents;
      if (options?.limit) {
        const offset = options.offset || 0;
        paginatedEvents = deduplicatedEvents.slice(offset, offset + options.limit);
      }

      return {
        success: true,
        events: paginatedEvents,
        total: deduplicatedEvents.length
      };

    } catch (error) {
      console.error('❌ Erreur getTimeline client:', error);
      return { success: false };
    }
  }
}

