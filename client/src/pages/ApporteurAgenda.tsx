import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UnifiedCalendar } from '@/components/UnifiedCalendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List } from 'lucide-react';
import { rdvService } from '@/services/rdv-service';
import { CalendarEvent } from '@/services/calendar-service';
import { toast } from 'sonner';

export default function ApporteurAgenda() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month');
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

  // Redirection si non connecté
  if (!user) {
    navigate('/apporteur/login');
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header avec titre et onglets sur la même ligne */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Agenda</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérez vos rendez-vous avec les experts et clients
            </p>
          </div>
        </div>
        
        {/* Onglets de vue alignés à droite */}
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
          <TabsList>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Mois
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Semaine
            </TabsTrigger>
            <TabsTrigger value="day" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Jour
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendrier unifié */}
      <UnifiedCalendar 
        theme="blue"
        showHeader={false}
        showViewSelector={false}
        enableGoogleSync={true}
        enableRealTime={true}
        defaultView={currentView}
        key={currentView}
      />
    </div>
  );
}
