import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UnifiedCalendar } from '../../components/UnifiedCalendar';
import { rdvService } from '@/services/rdv-service';
import { CalendarEvent } from '@/services/calendar-service';
import { toast } from 'sonner';

/**
 * Page Agenda Expert
 * Utilise le composant UnifiedCalendar pour affichage multi-types
 * Gère le paramètre URL 'event' pour ouvrir automatiquement un événement
 */
export default function AgendaExpert() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventProcessedRef = useRef(false);

  /**
   * Convertir un RDV en CalendarEvent
   */
  const transformRDVToCalendarEvent = (rdv: any): CalendarEvent => {
    const startDateTime = `${rdv.scheduled_date}T${rdv.scheduled_time}`;
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + (rdv.duration_minutes || 60) * 60000
    ).toISOString();

    const getStatusColor = (status: string): string => {
      const colors: Record<string, string> = {
        'proposed': '#F59E0B',
        'confirmed': '#10B981',
        'completed': '#3B82F6',
        'cancelled': '#EF4444',
        'rescheduled': '#8B5CF6'
      };
      return colors[status] || '#6B7280';
    };

    const getPriorityFromNumber = (priority?: number): 'low' | 'medium' | 'high' | 'critical' => {
      if (!priority) return 'medium';
      if (priority >= 4) return 'critical';
      if (priority >= 3) return 'high';
      if (priority >= 2) return 'medium';
      return 'low';
    };

    const mapStatus = (status: string): 'pending' | 'confirmed' | 'cancelled' | 'completed' => {
      switch (status) {
        case 'proposed':
        case 'rescheduled':
          return 'pending';
        case 'confirmed':
          return 'confirmed';
        case 'cancelled':
          return 'cancelled';
        case 'completed':
          return 'completed';
        default:
          return 'pending';
      }
    };

    const mapCategory = (category?: string): 'client' | 'expert' | 'admin' | 'system' | 'collaborative' => {
      if (!category) return 'client';
      if (category.includes('expert')) return 'expert';
      if (category.includes('admin')) return 'admin';
      if (category.includes('system')) return 'system';
      if (category.includes('collaborative')) return 'collaborative';
      return 'client';
    };

    return {
      id: rdv.id,
      title: rdv.title || 'RDV',
      description: rdv.description || rdv.notes,
      start_date: startDateTime,
      end_date: endDateTime,
      location: rdv.location,
      is_online: rdv.meeting_type === 'video',
      meeting_url: rdv.meeting_url,
      color: rdv.metadata?.color || getStatusColor(rdv.status),
      status: mapStatus(rdv.status),
      type: 'appointment',
      priority: getPriorityFromNumber(rdv.priority),
      category: mapCategory(rdv.category),
      client_id: rdv.client_id,
      expert_id: rdv.expert_id,
      created_by: rdv.created_by,
      created_at: rdv.created_at,
      updated_at: rdv.updated_at,
      metadata: {
        ...rdv.metadata,
        source: 'RDV',
        rdv_id: rdv.id,
        meeting_type: rdv.meeting_type,
        apporteur_id: rdv.apporteur_id,
        products: rdv.RDV_Produits || []
      }
    };
  };

  /**
   * Charger et afficher un événement depuis l'URL
   */
  useEffect(() => {
    const eventId = searchParams.get('event');
    
    if (!eventId || eventProcessedRef.current) {
      return;
    }

    const loadAndDisplayEvent = async () => {
      try {
        eventProcessedRef.current = true;
        
        const rdv = await rdvService.getRDV(eventId);
        
        if (!rdv) {
          toast.error('Événement introuvable');
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('event');
          setSearchParams(newSearchParams, { replace: true });
          return;
        }

        const calendarEvent = transformRDVToCalendarEvent(rdv);
        
        localStorage.setItem('calendar_event_to_display', JSON.stringify({
          event: calendarEvent,
          action: 'view'
        }));

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('event');
        setSearchParams(newSearchParams, { replace: true });

        window.dispatchEvent(new CustomEvent('calendar:display-event', { 
          detail: { event: calendarEvent } 
        }));

      } catch (error) {
        console.error('❌ Erreur chargement événement:', error);
        toast.error('Erreur lors du chargement de l\'événement');
        
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('event');
        setSearchParams(newSearchParams, { replace: true });
      } finally {
        setTimeout(() => {
          eventProcessedRef.current = false;
        }, 1000);
      }
    };

    loadAndDisplayEvent();
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        <UnifiedCalendar 
          showHeader={true}
          showViewSelector={true}
          enableRealTime={true}
          defaultView="week"
        />
      </div>
    </div>
  );
}
