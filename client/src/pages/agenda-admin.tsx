import { useState } from 'react';
import { UnifiedCalendar } from '../components/UnifiedCalendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List } from 'lucide-react';

/**
 * Page Agenda Admin
 * Vue calendrier avec tous les RDV (clients, experts, apporteurs)
 */
export default function AgendaAdmin() {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      {/* Header avec titre et onglets sur la même ligne */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Agenda</h1>
            <p className="text-sm text-gray-600 mt-1">
              Vue calendrier - Tous les rendez-vous (clients, experts, apporteurs)
            </p>
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
      </div>

      {/* Calendrier unifié */}
      <UnifiedCalendar
        theme="purple"
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
