import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Calendar, 
  AlertCircle,
  Loader2,
  MessageCircle
} from "lucide-react";
import { ExpertMetrics } from "@/components/expert/ExpertMetrics";
import { ExpertAssignmentsTable } from "@/components/expert/ExpertAssignmentsTable";
import { ExpertAgendaWidget } from "@/components/expert/ExpertAgendaWidget";
import type { ExpertAnalytics } from "@/types/analytics";
import type { Assignment } from "@/types/assignment";
import type { AgendaEvent } from "@/types/agenda";
import type { ExpertBusiness } from "@/types/business";

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  const expertId = user?.id;
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [analytics, setAnalytics] = useState<ExpertAnalytics | null>(null);
  const [businessData, setBusinessData] = useState<ExpertBusiness | null>(null);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger les données de l'expert
  useEffect(() => {
    const fetchExpertData = async () => {
      if (!expertId) return;
      
      try {
        
        // Charger les assignations
        const assignmentsResponse = await get<Assignment[]>(`/api/expert/assignments`);
        if (assignmentsResponse.success && assignmentsResponse.data) {
          setAssignments(assignmentsResponse.data);
        }

        // Charger les analytics
        const analyticsResponse = await get<ExpertAnalytics>(`/api/expert/analytics`);
        if (analyticsResponse.success && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
        }

        // Charger les données business
        const businessResponse = await get<ExpertBusiness>(`/api/expert/business`);
        if (businessResponse.success && businessResponse.data) {
          setBusinessData(businessResponse.data);
        }

        // Charger les événements agenda
        const agendaResponse = await get<AgendaEvent[]>(`/api/expert/agenda`);
        if (agendaResponse.success && agendaResponse.data) {
          setAgendaEvents(agendaResponse.data);
        }

        toast.success('Vos informations ont été récupérées avec succès');

      } catch (error) {
        console.error('Erreur chargement données expert:', error);
        setError('Erreur lors de la récupération des données');
        toast.error('Erreur lors de la récupération des données');
      } finally {
        
      }
    };
    
    fetchExpertData();
  }, [expertId]);

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
        <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-md">
          <CardContent className="p-0">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
            <CardTitle className="text-base sm:text-lg md:text-xl mb-1 sm:mb-2">Chargement...</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">Préparation de vos données</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Authentification requise</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">Vous devez être connecté pour accéder à cette page.</p>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
            <Button onClick={() => navigate("/connexion-expert")} className="w-full text-sm sm:text-base">
              Se connecter
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="w-full text-sm sm:text-base">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-red-600">Problème de chargement</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button onClick={() => window.location.reload()} className="text-sm sm:text-base">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        <div className="mt-12 sm:mt-14 md:mt-16"></div>
        
        {/* En-tête de la page */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Tableau de bord Expert
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            Gérez vos missions, suivez vos performances
          </p>
        </div>

        {/* Métriques principales */}
        <ExpertMetrics 
          analytics={analytics} 
          businessData={businessData} 
          className="mb-4 sm:mb-6 md:mb-8" 
        />

        {/* Section principale avec tableau d'assignations et agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Tableau d'assignations */}
          <div className="lg:col-span-2">
            <ExpertAssignmentsTable 
              assignments={assignments}
              className="h-full"
            />
          </div>

          {/* Widget Agenda */}
          <div className="lg:col-span-1">
            <ExpertAgendaWidget 
              events={agendaEvents}
              className="h-full"
            />
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-4 sm:mt-6 md:mt-8">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <Button 
                  onClick={() => navigate('/expert/agenda')}
                  className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span>Gérer l'agenda</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/expert/messagerie')}
                  variant="outline"
                  className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 text-xs sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span>Messagerie</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/expert/mes-affaires')}
                  variant="outline"
                  className="h-16 sm:h-18 md:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 text-xs sm:text-sm sm:col-span-2 md:col-span-1"
                >
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span>Mes affaires</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default ExpertDashboard; 