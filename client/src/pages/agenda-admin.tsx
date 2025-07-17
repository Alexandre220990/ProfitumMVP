import { useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useCalendar } from "@/hooks/use-calendar";
import { AdvancedCalendar } from "@/components/ui/calendar";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, AlertTriangle, RefreshCw, Shield, BarChart } from "lucide-react";

export default function AgendaAdmin() {
  const { user } = useAuth();
  const {
    dossierSteps,
    stats,
    upcomingEvents,
    loading,
    error,
    refreshAll
  } = useCalendar();

  // Charger les données au montage du composant
  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, refreshAll]);

  const handleRefresh = () => {
    refreshAll();
  };

  const handleEventClick = (event: any) => {
    console.log('Événement cliqué:', event);
    // TODO: Ouvrir le modal de détails de l'événement
  };

  const handleStepClick = (step: any) => {
    console.log('Étape cliquée:', step);
    // TODO: Ouvrir le modal de détails de l'étape
  };

  return (
    <div className="app-professional min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600">Panel de contrôle</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Connecté en tant qu'admin</span>
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Retour
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-8"></div>
        
        {/* Header de la page */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Agenda Administratif</h1>
                <p className="text-gray-600">Gestion globale des événements et échéances</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistiques rapides - KPI dynamiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements aujourd'hui</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.eventsToday}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réunions cette semaine</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.meetingsThisWeek}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Échéances en retard</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdueDeadlines}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Validations en attente</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.documentsToValidate}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <BarChart className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal - Calendrier et événements à venir */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendrier principal */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Calendrier Administratif
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AdvancedCalendar className="w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Section événements à venir */}
          <div className="lg:col-span-1">
            <UpcomingEvents
              events={upcomingEvents}
              dossierSteps={dossierSteps}
              onEventClick={handleEventClick}
              onStepClick={handleStepClick}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 