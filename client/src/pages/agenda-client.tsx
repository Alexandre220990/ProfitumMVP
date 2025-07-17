import { useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useCalendar } from "@/hooks/use-calendar";
import HeaderClient from "@/components/HeaderClient";
import { AdvancedCalendar } from "@/components/ui/calendar";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, FileText, AlertTriangle, RefreshCw } from "lucide-react";

export default function AgendaClient() {
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
    <div className="app-professional min-h-screen">
      <HeaderClient />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-16"></div>
        
        {/* Header de la page */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mon Agenda</h1>
                <p className="text-gray-600">Gérez vos rendez-vous, échéances et événements</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.eventsToday}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réunions cette semaine</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.meetingsThisWeek}</p>
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
                  <p className="text-sm font-medium text-gray-600">Documents à valider</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.documentsToValidate}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FileText className="w-5 h-5 text-orange-600" />
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
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Calendrier Personnel
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