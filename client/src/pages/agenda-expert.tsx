import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { UnifiedCalendar } from '@/components/UnifiedCalendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List } from 'lucide-react';

export default function AgendaExpertPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month');

  // Redirection si non connecté
  if (!user) {
    navigate('/connexion-expert');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
        
        {/* Header avec titre et onglets sur la même ligne */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Calendrier Expert</h1>
              <p className="text-sm text-slate-600 mt-1">
                Gérez vos consultations et rendez-vous clients
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
          theme="green"
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