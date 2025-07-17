import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/design-system/Card";
import Button from "@/components/ui/design-system/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Badge from "@/components/ui/design-system/Badge";
import { CheckCircle2, Euro, FileText, Users, Search, Loader2, AlertCircle, TrendingUp, Activity, Target, Calendar } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import HeaderExpert from "@/components/HeaderExpert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-notifications";
import { get } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dossier } from "@/types/dossier";

type StatusType = "non_démarré" | "en_cours" | "terminé" | "all";

interface Expert {
  id: string;
  username: string;
  email: string;
  clients: number;
  audits: number;
  rating: number;
  compensation: number;
  specializations: string[];
  experience: number;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { addToast } = useToast();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  // Extraire l'ID de l'expert de l'URL ou du user connecté
  const expertId = location.pathname.includes('/dashboard/expert/') 
    ? location.pathname.split('/dashboard/expert/')[1].split('/')[0] 
    : user?.id;

  useEffect(() => {
    const fetchExpert = async () => {
      if (!expertId) return;
      
      try {
        const response = await get<Expert>(`/api/experts/${expertId}`);
        if (response.success && response.data) {
          setExpert(response.data);
          addToast({
            type: 'success',
            title: 'Données chargées',
            message: 'Vos informations ont été récupérées avec succès',
            duration: 3000
          });
        } else {
          setError(response.message || 'Erreur lors de la récupération des données');
          addToast({
            type: 'error',
            title: 'Erreur',
            message: response.message || 'Erreur lors de la récupération des données',
            duration: 5000
          });
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données');
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors de la récupération des données',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpert();
  }, [expertId, addToast]);

  useEffect(() => {
    const fetchDossiers = async () => {
      if (!expertId) return;
      
      try {
        const response = await get<Dossier[]>(`/api/experts/${expertId}/dossiers`);
        if (response.success && response.data) {
          setDossiers(response.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des dossiers:', error);
      }
    };
    
    fetchDossiers();
  }, [expertId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: StatusType) => {
    setStatusFilter(value);
  };

  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch = dossier.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || dossier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Si l'utilisateur n'est pas connecté, on affiche un message pour inviter à se connecter
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>
              Vous devez être connecté en tant qu'expert pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate("/connexion-expert")}
              className="w-full"
            >
              Se connecter
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="p-8 text-center animate-fade-in">
          <CardContent className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <CardTitle className="text-xl">Chargement de votre profil...</CardTitle>
            <CardDescription>
              Nous récupérons vos informations
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <HeaderExpert />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mt-16"></div>
          <Card className="animate-scale-in">
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full animate-scale-in">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Profil non trouvé</CardTitle>
            <CardDescription>
              Impossible de récupérer les informations de l'expert.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <HeaderExpert />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 pt-28">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header avec informations expert */}
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Bienvenue, {expert.username}
              </h1>
              <p className="text-slate-600">
                Gérez vos dossiers et suivez vos performances
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/profile/expert/${expert.id}`)}
                className="hover:shadow-md transition-all duration-300"
              >
                Mon Profil
              </Button>
              <Button
                onClick={() => navigate('/messagerie-expert')}
                className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Messagerie
              </Button>
            </div>
          </div>

          {/* Statistiques principales - Améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Clients</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{expert.clients || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +12% ce mois
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Audits</CardTitle>
                  <FileText className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{expert.audits || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <Activity className="w-3 h-3 inline mr-1" />
                    En cours: 3
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Note</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{expert.rating || 0}/5</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <Target className="w-3 h-3 inline mr-1" />
                    {expert.rating >= 4.5 ? 'Excellent' : 'Très bien'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Tarif</CardTitle>
                  <Euro className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{expert.compensation || 0}€/h</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Disponible
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Onglets principaux */}
          <Tabs defaultValue="audits" className="space-y-6 animate-slide-in">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="audits" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                <FileText className="w-4 h-4" />
                Mes Dossiers
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                <Users className="w-4 h-4" />
                Mon Profil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="audits" className="space-y-6">
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Tableau de bord Expert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Filtres de recherche - Améliorés */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search" className="text-sm font-medium text-slate-700 mb-2 block">
                        Rechercher un dossier
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="search"
                          placeholder="Nom du client..."
                          className="pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={searchTerm}
                          onChange={handleSearch}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <Label htmlFor="status" className="text-sm font-medium text-slate-700 mb-2 block">
                        Filtrer par statut
                      </Label>
                      <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="termine">Terminé</SelectItem>
                          <SelectItem value="annule">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Liste des dossiers */}
                  {filteredDossiers.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">Aucun dossier trouvé</p>
                      <p className="text-slate-400">Essayez de modifier vos filtres de recherche</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredDossiers.map((dossier, index) => (
                        <div key={dossier.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => {
                            const id = expertId || user?.id;
                            if (id) {
                              navigate(`/dashboard/expert/${id}/dossier/${dossier.id}`);
                            }
                          }}>
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                                    {dossier.clientName}
                                  </h3>
                                  <p className="text-sm text-slate-500">
                                    Créé le {formatDate(dossier.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge 
                                    variant="base" 
                                    className={`${getStatusColor(dossier.status)} group-hover:scale-105 transition-transform duration-200`}
                                  >
                                    {dossier.status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    className="group-hover:bg-blue-600 transition-colors duration-200"
                                  >
                                    Voir le dossier
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Informations du Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Informations personnelles</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Nom:</span> {expert.username}</p>
                        <p><span className="font-medium">Email:</span> {expert.email}</p>
                        <p><span className="font-medium">Localisation:</span> {expert.location}</p>
                        <p><span className="font-medium">Expérience:</span> {expert.experience} ans</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Spécialisations</h4>
                      <div className="flex flex-wrap gap-2">
                        {expert.specializations.map((spec, index) => (
                          <Badge key={index} variant="primary" className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600">{expert.description}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate(`/profile/expert/${expert.id}`)}
                      className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Modifier le profil
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/expert/settings')}
                      className="hover:shadow-md transition-all duration-300"
                    >
                      Paramètres
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ExpertDashboard; 