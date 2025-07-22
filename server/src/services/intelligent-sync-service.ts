import { supabase } from '../lib/supabase';
import { googleCalendarService, GoogleCalendarIntegration, SyncOptions, SyncResult, SyncProgress } from './google-calendar-service';
import { CalendarEvent } from '../types/calendar';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface SyncConflict {
  profitumEvent: CalendarEvent;
  googleEvent: any;
  conflictType: 'time_overlap' | 'title_mismatch' | 'participant_mismatch' | 'location_mismatch';
  resolution: 'keep_profitum' | 'keep_google' | 'merge' | 'manual';
}

export interface SyncMetrics {
  totalEvents: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflictsResolved: number;
  errors: string[];
  duration: number;
  syncDirection: 'import' | 'export' | 'bidirectional';
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class IntelligentSyncService {
  private syncProgress: Map<string, SyncProgress> = new Map();
  private syncMetrics: Map<string, SyncMetrics> = new Map();

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

      // Initialiser le suivi de progression
      this.syncProgress.set(integrationId, {
        status: 'running',
        progress: 0,
        currentStep: 'Initialisation de la synchronisation',
        startTime: startTime
      });

      // Mettre à jour le statut de l'intégration
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      });

      let result: SyncResult;

      // Exécuter la synchronisation selon la direction
      switch (syncOptions.syncDirection) {
        case 'import':
          result = await this.syncFromGoogle(integration, syncOptions);
          break;
        case 'export':
          result = await this.syncToGoogle(integration, syncOptions);
          break;
        case 'bidirectional':
          result = await this.syncBidirectional(integration, syncOptions);
          break;
        default:
          throw new Error('Direction de synchronisation invalide');
      }

      // Mettre à jour le statut final
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: 'idle',
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null
      });

      // Finaliser le suivi de progression
      this.syncProgress.set(integrationId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Synchronisation terminée',
        startTime: startTime,
        endTime: Date.now()
      });

      return result;

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      
      // Mettre à jour le statut d'erreur
      await googleCalendarService.updateIntegration(integrationId, {
        sync_status: 'error',
        error_message: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      // Finaliser le suivi de progression avec erreur
      this.syncProgress.set(integrationId, {
        status: 'failed',
        progress: 0,
        currentStep: 'Erreur de synchronisation',
        startTime: startTime,
        endTime: Date.now()
      });

      throw error;
    }
  }

  /**
   * Synchroniser depuis Google Calendar vers Profitum
   */
  private async syncFromGoogle(
    integration: GoogleCalendarIntegration,
    options: SyncOptions
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
        options.timeRange.end,
        1000
      );

      // Récupérer les événements Profitum existants
      const { data: profitumEvents, error: fetchError } = await supabase
        .from('CalendarEvent')
        .select('*')
        .eq('client_id', integration.user_id)
        .gte('start_date', options.timeRange.start.toISOString())
        .lte('end_date', options.timeRange.end.toISOString());

      if (fetchError) throw fetchError;

      // Traiter chaque événement Google
      for (const googleEvent of googleEvents) {
        try {
          eventsProcessed++;
          
          // Vérifier si l'événement existe déjà dans Profitum
          const existingEvent = profitumEvents?.find(
            event => event.metadata?.googleEventId === googleEvent.id
          );

          if (existingEvent) {
            // Mettre à jour l'événement existant
            if (options.updateExistingEvents) {
              const updatedEvent = googleCalendarService.convertGoogleToProfitumEvent(
                googleEvent,
                integration
              );

              const { error: updateError } = await supabase
                .from('CalendarEvent')
                .update(updatedEvent)
                .eq('id', existingEvent.id);

              if (updateError) {
                errors.push(`Erreur mise à jour événement ${googleEvent.id}: ${updateError.message}`);
              } else {
                eventsUpdated++;
              }
            }
          } else {
            // Créer un nouvel événement
            if (options.createMissingEvents) {
              const newEvent = googleCalendarService.convertGoogleToProfitumEvent(
                googleEvent,
                integration
              );

              const { error: createError } = await supabase
                .from('CalendarEvent')
                .insert(newEvent);

              if (createError) {
                errors.push(`Erreur création événement ${googleEvent.id}: ${createError.message}`);
              } else {
                eventsCreated++;
              }
            }
          }

          // Mettre à jour la progression
          this.updateSyncProgress(integration.id, (eventsProcessed / googleEvents.length) * 100, 
            `Traitement événement ${eventsProcessed}/${googleEvents.length}`);

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
      errors.push(`Erreur synchronisation depuis Google: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
   * Synchroniser vers Google Calendar depuis Profitum
   */
  private async syncToGoogle(
    integration: GoogleCalendarIntegration,
    options: SyncOptions
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

      if (fetchError) throw fetchError;

      // Récupérer les événements Google existants
      const googleEvents = await googleCalendarService.listEvents(
        integration.access_token,
        integration.calendar_id,
        options.timeRange.start,
        options.timeRange.end,
        1000
      );

      // Traiter chaque événement Profitum
      for (const profitumEvent of profitumEvents || []) {
        try {
          eventsProcessed++;
          
          // Vérifier si l'événement existe déjà dans Google
          const existingGoogleEvent = googleEvents.find(
            event => event.extendedProperties?.private?.profitumEventId === profitumEvent.id
          );

          if (existingGoogleEvent) {
            // Mettre à jour l'événement Google existant
            if (options.updateExistingEvents) {
              const googleEvent = googleCalendarService.convertProfitumToGoogleEvent(profitumEvent);
              
              await googleCalendarService.updateEvent(
                integration.access_token,
                integration.calendar_id,
                existingGoogleEvent.id!,
                googleEvent
              );
              
              eventsUpdated++;
            }
          } else {
            // Créer un nouvel événement Google
            if (options.createMissingEvents) {
              const googleEvent = googleCalendarService.convertProfitumToGoogleEvent(profitumEvent);
              
              await googleCalendarService.createEvent(
                integration.access_token,
                integration.calendar_id,
                googleEvent
              );
              
              eventsCreated++;
            }
          }

          // Mettre à jour la progression
          this.updateSyncProgress(integration.id, (eventsProcessed / (profitumEvents?.length || 1)) * 100,
            `Traitement événement ${eventsProcessed}/${profitumEvents?.length || 0}`);

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
      errors.push(`Erreur synchronisation vers Google: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    options: SyncOptions
  ): Promise<SyncResult> {
    // Exécuter d'abord l'import depuis Google
    const importResult = await this.syncFromGoogle(integration, options);
    
    // Puis l'export vers Google
    const exportResult = await this.syncToGoogle(integration, options);

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
   * Résoudre les conflits de synchronisation
   */
  private async resolveConflicts(conflicts: SyncConflict[]): Promise<number> {
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      try {
        switch (conflict.resolution) {
          case 'keep_profitum':
            // Supprimer l'événement Google et recréer depuis Profitum
            // TODO: Implémenter la logique de résolution
            resolvedCount++;
            break;
          case 'keep_google':
            // Mettre à jour l'événement Profitum avec les données Google
            // TODO: Implémenter la logique de résolution
            resolvedCount++;
            break;
          case 'merge':
            // Fusionner les deux événements
            // TODO: Implémenter la logique de fusion
            resolvedCount++;
            break;
          case 'manual':
            // Laisser l'utilisateur résoudre manuellement
            // TODO: Implémenter l'interface de résolution manuelle
            break;
        }
      } catch (error) {
        console.error('❌ Erreur résolution conflit:', error);
      }
    }

    return resolvedCount;
  }

  /**
   * Mettre à jour la progression de synchronisation
   */
  private updateSyncProgress(integrationId: string, progress: number, currentStep: string): void {
    const existingProgress = this.syncProgress.get(integrationId);
    if (existingProgress) {
      this.syncProgress.set(integrationId, {
        ...existingProgress,
        progress: Math.min(progress, 100),
        currentStep
      });
    }
  }

  /**
   * Obtenir la progression de synchronisation
   */
  getSyncProgress(integrationId: string): SyncProgress | null {
    return this.syncProgress.get(integrationId) || null;
  }

  /**
   * Obtenir les métriques de synchronisation
   */
  getSyncMetrics(integrationId: string): SyncMetrics | null {
    return this.syncMetrics.get(integrationId) || null;
  }

  /**
   * Nettoyer les données de synchronisation
   */
  cleanupSyncData(integrationId: string): void {
    this.syncProgress.delete(integrationId);
    this.syncMetrics.delete(integrationId);
  }
}

// Instance singleton
export const intelligentSyncService = new IntelligentSyncService(); 