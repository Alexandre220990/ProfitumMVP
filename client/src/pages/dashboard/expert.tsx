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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Chargement de votre tableau de bord...</CardTitle>
            <p className="text-gray-600">Nous préparons vos données personnalisées</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate("/connexion-expert")} className="w-full">
              Se connecter
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Problème de chargement des données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* En-tête de la page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord Expert
          </h1>
          <p className="text-gray-600">
            Gérez vos missions, suivez vos performances et planifiez votre agenda
          </p>
        </div>

        {/* Métriques principales */}
        <ExpertMetrics 
          analytics={analytics} 
          businessData={businessData} 
          className="mb-8" 
        />

        {/* Section principale avec tableau d'assignations et agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => navigate('/expert/agenda')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Calendar className="h-6 w-6" />
                  <span>Gérer l'agenda</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/expert/messagerie')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span>Messagerie</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/expert/mes-affaires')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Briefcase className="h-6 w-6" />
                  <span>Mes affaires</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard; 