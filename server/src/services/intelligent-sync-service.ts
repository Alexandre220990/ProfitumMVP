import { supabase } from '../lib/supabase';
import { googleCalendarService, GoogleCalendarIntegration, SyncResult } from './google-calendar-service';
import { CalendarEvent } from '../types/calendar';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface SyncConflict {
  id: string;
  type: 'time_conflict' | 'data_conflict' | 'deletion_conflict';
  profitumEvent: CalendarEvent;
  googleEvent: any;
  resolution: 'keep_profitum' | 'keep_google' | 'merge' | 'manual';
  description: string;
}

export interface SyncOptions {
  syncDirection: 'import' | 'export' | 'bidirectional';
  timeRange: {
    start: Date;
    end: Date;
  };
  resolveConflicts: boolean;
  createMissingEvents: boolean;
  updateExistingEvents: boolean;
  deleteOrphanedEvents: boolean;
}

export interface SyncProgress {
  totalEvents: number;
  processedEvents: number;
  createdEvents: number;
  updatedEvents: number;
  deletedEvents: number;
  conflicts: SyncConflict[];
  errors: string[];
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  estimatedCompletion?: Date;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class IntelligentSyncService {
  private syncProgress: Map<string, SyncProgress> = new Map();

  /**
   * Synchroniser un calendrier Google avec Profitum
   */
  async syncCalendar(
    integrationId: string,
    options: Partial<SyncOptions> = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Récupérer l'intégration
      const { data: integration, error: fetchError } = await supabase
        .from('GoogleCalendarIntegration')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (fetchError || !integration) {
        throw new Error('Intégration non trouvée');
      }

      // Vérifier si le token est expiré
      if (googleCalendarService.isTokenExpired(new Date(integration.token_expires_at).getTime())) {
        const newTokens = await googleCalendarService.refreshTokens(integration.refresh_token);
        await googleCalendarService.updateIntegration(integrationId, {
          access_token: newTokens.access_token,
          token_expires_at: new Date(newTokens.expiry_date).toISOString()
        });
        integration.access_token = newTokens.access_token;
      }

      // Options par défaut
      const syncOptions: SyncOptions = {
        syncDirection: integration.sync_direction,
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours en arrière
          end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)   // 90 jours en avant
        },
        resolveConflicts: true,
        createMissingEvents: true,
        updateExistingEvents: true,
        deleteOrphanedEvents: false,
        ...options
      };

      // Initialiser le progrès
      const progress: SyncProgress = {
        totalEvents: 0,
        processedEvents: 0,
        createdEvents: 0,
        updatedEvents: 0,
        deletedEvents: 0,
        conflicts: [],
        errors: [],
        status: 'running',
        startTime: new Date()
      };

      this.syncProgress.set(integrationId, progress);

      // Mettre à jour le statut de l'intégration
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      });

      let result: SyncResult;

      // Exécuter la synchronisation selon la direction
      switch (syncOptions.syncDirection) {
        case 'import':
          result = await this.syncFromGoogleToProfitum(integration, syncOptions, progress);
          break;
        case 'export':
          result = await this.syncFromProfitumToGoogle(integration, syncOptions, progress);
          break;
        case 'bidirectional':
          result = await this.syncBidirectional(integration, syncOptions, progress);
          break;
        default:
          throw new Error('Direction de synchronisation invalide');
      }

      // Mettre à jour le statut final
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: result.success ? 'idle' : 'error',
        error_message: result.errors.length > 0 ? result.errors.join('; ') : undefined
      });

      // Sauvegarder le log de synchronisation
      await this.saveSyncLog(integrationId, result, startTime);

      return result;
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      
      // Mettre à jour le statut d'erreur
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: 'error',
        error_message: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      return {
        success: false,
        eventsProcessed: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        duration: Date.now() - startTime
      };
    } finally {
      // Nettoyer le progrès
      this.syncProgress.delete(integrationId);
    }
  }

  /**
   * Synchroniser de Google vers Profitum
   */
  private async syncFromGoogleToProfitum(
    integration: GoogleCalendarIntegration,
    options: SyncOptions,
    progress: SyncProgress
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let eventsProcessed = 0;
    let eventsCreated = 0;
    let eventsUpdated = 0;

    try {
      // Récupérer les événements Google
      const googleEvents = await googleCalendarService.listEvents(
        integration.access_token,
        integration.calendar_id,
        options.timeRange.start,
        options.timeRange.end
      );

      progress.totalEvents = googleEvents.length;

      // Récupérer les événements Profitum existants
      const { data: profitumEvents, error: fetchError } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('client_id', integration.user_id)
        .gte('start_date', options.timeRange.start.toISOString())
        .lte('end_date', options.timeRange.end.toISOString());

      if (fetchError) {
        throw new Error('Erreur récupération événements Profitum');
      }

      // Créer un map des événements Profitum par ID Google
      const profitumEventsMap = new Map();
      for (const event of profitumEvents || []) {
        if (event.metadata?.googleEventId) {
          profitumEventsMap.set(event.metadata.googleEventId, event);
        }
      }

      // Traiter chaque événement Google
      for (const googleEvent of googleEvents) {
        try {
          eventsProcessed++;
          progress.processedEvents = eventsProcessed;

          const existingProfitumEvent = profitumEventsMap.get(googleEvent.id);

          if (existingProfitumEvent) {
            // Mettre à jour l'événement existant
            if (options.updateExistingEvents) {
              const updatedEvent = googleCalendarService.convertGoogleToProfitumEvent(
                googleEvent,
                integration
              );

              const { error: updateError } = await supabase
                .from('CalendarEvent')
                .update(updatedEvent)
                .eq('id', existingProfitumEvent.id);

              if (updateError) {
                errors.push(`Erreur mise à jour événement ${googleEvent.id}: ${updateError.message}`);
              } else {
                eventsUpdated++;
                progress.updatedEvents = eventsUpdated;
              }
            }
          } else {
            // Créer un nouvel événement
            if (options.createMissingEvents) {
              const newEvent = googleCalendarService.convertGoogleToProfitumEvent(
                googleEvent,
                integration
              );

              const { data: createdEvent, error: createError } = await supabase
                .from('CalendarEvent')
                .insert(newEvent)
                .select()
                .single();

              if (createError) {
                errors.push(`Erreur création événement ${googleEvent.id}: ${createError.message}`);
              } else {
                eventsCreated++;
                progress.createdEvents = eventsCreated;

                // Créer le mapping
                await supabase
                  .from('GoogleCalendarEventMapping')
                  .insert({
                    integration_id: integration.id,
                    profitum_event_id: createdEvent.id,
                    google_event_id: googleEvent.id,
                    google_calendar_id: integration.calendar_id
                  });
              }
            }
          }
        } catch (error) {
          errors.push(`Erreur traitement événement ${googleEvent.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      return {
        success: errors.length === 0,
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsDeleted: 0,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
      return {
        success: false,
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsDeleted: 0,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Synchroniser de Profitum vers Google
   */
  private async syncFromProfitumToGoogle(
    integration: GoogleCalendarIntegration,
    options: SyncOptions,
    progress: SyncProgress
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let eventsProcessed = 0;
    let eventsCreated = 0;
    let eventsUpdated = 0;

    try {
      // Récupérer les événements Profitum
      const { data: profitumEvents, error: fetchError } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('client_id', integration.user_id)
        .gte('start_date', options.timeRange.start.toISOString())
        .lte('end_date', options.timeRange.end.toISOString());

      if (fetchError) {
        throw new Error('Erreur récupération événements Profitum');
      }

      progress.totalEvents = profitumEvents?.length || 0;

      // Récupérer les mappings existants
      const { data: mappings, error: mappingsError } = await supabase
        .from('GoogleCalendarEventMapping')
        .select('*')
        .eq('integration_id', integration.id);

      if (mappingsError) {
        throw new Error('Erreur récupération mappings');
      }

      const mappingsMap = new Map();
      for (const mapping of mappings || []) {
        mappingsMap.set(mapping.profitum_event_id, mapping);
      }

      // Traiter chaque événement Profitum
      for (const profitumEvent of profitumEvents || []) {
        try {
          eventsProcessed++;
          progress.processedEvents = eventsProcessed;

          const existingMapping = mappingsMap.get(profitumEvent.id);

          if (existingMapping) {
            // Mettre à jour l'événement Google existant
            if (options.updateExistingEvents) {
              const googleEvent = googleCalendarService.convertProfitumToGoogleEvent(profitumEvent);
              
              await googleCalendarService.updateEvent(
                integration.access_token,
                integration.calendar_id,
                existingMapping.google_event_id,
                googleEvent
              );

              eventsUpdated++;
              progress.updatedEvents = eventsUpdated;
            }
          } else {
            // Créer un nouvel événement Google
            if (options.createMissingEvents) {
              const googleEvent = googleCalendarService.convertProfitumToGoogleEvent(profitumEvent);
              
              const createdGoogleEvent = await googleCalendarService.createEvent(
                integration.access_token,
                integration.calendar_id,
                googleEvent
              );

              if (createdGoogleEvent.id) {
                eventsCreated++;
                progress.createdEvents = eventsCreated;

                // Créer le mapping
                await supabase
                  .from('GoogleCalendarEventMapping')
                  .insert({
                    integration_id: integration.id,
                    profitum_event_id: profitumEvent.id,
                    google_event_id: createdGoogleEvent.id,
                    google_calendar_id: integration.calendar_id
                  });
              }
            }
          }
        } catch (error) {
          errors.push(`Erreur traitement événement ${profitumEvent.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      return {
        success: errors.length === 0,
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsDeleted: 0,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
      return {
        success: false,
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsDeleted: 0,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Synchronisation bidirectionnelle
   */
  private async syncBidirectional(
    integration: GoogleCalendarIntegration,
    options: SyncOptions,
    progress: SyncProgress
  ): Promise<SyncResult> {
    // D'abord synchroniser de Google vers Profitum
    const importResult = await this.syncFromGoogleToProfitum(integration, options, progress);
    
    // Puis synchroniser de Profitum vers Google
    const exportResult = await this.syncFromProfitumToGoogle(integration, options, progress);

    // Combiner les résultats
    return {
      success: importResult.success && exportResult.success,
      eventsProcessed: importResult.eventsProcessed + exportResult.eventsProcessed,
      eventsCreated: importResult.eventsCreated + exportResult.eventsCreated,
      eventsUpdated: importResult.eventsUpdated + exportResult.eventsUpdated,
      eventsDeleted: importResult.eventsDeleted + exportResult.eventsDeleted,
      errors: [...importResult.errors, ...exportResult.errors],
      duration: importResult.duration + exportResult.duration
    };
  }

  /**
   * Détecter les conflits entre événements
   */
  async detectConflicts(
    integrationId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<SyncConflict[]> {
    try {
      // Récupérer l'intégration
      const { data: integration, error: fetchError } = await supabase
        .from('GoogleCalendarIntegration')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (fetchError || !integration) {
        throw new Error('Intégration non trouvée');
      }

      // Récupérer les événements des deux côtés
      const googleEvents = await googleCalendarService.listEvents(
        integration.access_token,
        integration.calendar_id,
        timeRange.start,
        timeRange.end
      );

      const { data: profitumEvents, error: profitumError } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('client_id', integration.user_id)
        .gte('start_date', timeRange.start.toISOString())
        .lte('end_date', timeRange.end.toISOString());

      if (profitumError) {
        throw new Error('Erreur récupération événements Profitum');
      }

      const conflicts: SyncConflict[] = [];

      // Détecter les conflits de temps
      for (const profitumEvent of profitumEvents || []) {
        for (const googleEvent of googleEvents) {
          const profitumStart = new Date(profitumEvent.start_date);
          const profitumEnd = new Date(profitumEvent.end_date);
          const googleStart = new Date(googleEvent.start?.dateTime || googleEvent.start?.date || '');
          const googleEnd = new Date(googleEvent.end?.dateTime || googleEvent.end?.date || '');

          // Vérifier le chevauchement
          if (profitumStart < googleEnd && profitumEnd > googleStart) {
            conflicts.push({
              id: `${profitumEvent.id}_${googleEvent.id}`,
              type: 'time_conflict',
              profitumEvent,
              googleEvent,
              resolution: 'manual',
              description: `Conflit de temps entre "${profitumEvent.title}" et "${googleEvent.summary}"`
            });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error('❌ Erreur détection conflits:', error);
      throw error;
    }
  }

  /**
   * Résoudre un conflit
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'keep_profitum' | 'keep_google' | 'merge'
  ): Promise<boolean> {
    try {
      // TODO: Implémenter la résolution de conflit
      console.log(`Résolution du conflit ${conflictId} avec la stratégie ${resolution}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur résolution conflit:', error);
      return false;
    }
  }

  /**
   * Obtenir le progrès de synchronisation
   */
  getSyncProgress(integrationId: string): SyncProgress | null {
    return this.syncProgress.get(integrationId) || null;
  }

  /**
   * Arrêter une synchronisation en cours
   */
  async stopSync(integrationId: string): Promise<boolean> {
    const progress = this.syncProgress.get(integrationId);
    if (progress && progress.status === 'running') {
      progress.status = 'paused';
      return true;
    }
    return false;
  }

  /**
   * Sauvegarder le log de synchronisation
   */
  private async saveSyncLog(
    integrationId: string,
    result: SyncResult,
    startTime: number
  ): Promise<void> {
    try {
      await supabase
        .from('GoogleCalendarSyncLog')
        .insert({
          integration_id: integrationId,
          sync_type: 'full',
          events_processed: result.eventsProcessed,
          events_created: result.eventsCreated,
          events_updated: result.eventsUpdated,
          events_deleted: result.eventsDeleted,
          errors_count: result.errors.length,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          status: result.success ? 'completed' : 'failed',
          error_details: result.errors.length > 0 ? { errors: result.errors } : null
        });
    } catch (error) {
      console.error('❌ Erreur sauvegarde log synchronisation:', error);
    }
  }
}

// Instance singleton
export const intelligentSyncService = new IntelligentSyncService(); 