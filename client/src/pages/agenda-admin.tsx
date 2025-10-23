import { useState } from 'react';
import { UnifiedAgendaView } from '../components/rdv/UnifiedAgendaView';
import { UnifiedCalendar } from '../components/UnifiedCalendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, List } from 'lucide-react';

/**
 * Page Agenda Admin
 * Vue calendrier mensuelle avec tous les RDV (clients, experts, apporteurs)
 */
export default function AgendaAdmin() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      {/* Header avec sélecteur de vue */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Agenda</h1>
          <p className="text-gray-600">
            {viewMode === 'calendar' 
              ? 'Vue calendrier mensuelle - Tous les rendez-vous (clients, experts, apporteurs)'
              : 'Gérez tous vos rendez-vous'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Calendrier
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Liste
          </Button>
        </div>
      </div>

      {/* Contenu selon le mode */}
      {viewMode === 'calendar' ? (
        <UnifiedCalendar
          theme="purple"
          showHeader={false}
          enableGoogleSync={true}
          enableRealTime={true}
          defaultView="month"
        />
      ) : (
        <UnifiedAgendaView />
      )}
    </div>
  );
}
