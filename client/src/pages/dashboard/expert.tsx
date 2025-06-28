import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Euro, FileText, Users, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import HeaderExpert from "@/components/HeaderExpert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { get } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Json } from "@/types/supabase";
import { Dossier } from '@/types/dossier';
import { Specialization } from '@/types/specialization';
import { ExpertCategory } from '@/types/expert-category';
import { ExpertSpecialization } from '@/types/expert-specialization';

type StatusType = "non_démarré" | "en_cours" | "terminé" | "all";

interface Expert {
  id: string;
  email: string;
  password: string;
  name: string;
  company: string | null;
  siren: string | null;
  specializations: string[] | null;
  experience: string | null;
  location: string | null;
  rating: number | null;
  compensation: number | null;
  description: string | null;
  status: string;
  disponibilites: Json | null;
  certifications: Json | null;
  createdAt: string;
  updatedAt: string;
  card_number: string | null;
  card_expiry: string | null;
  card_cvc: string | null;
  abonnement: string | null;
  clients: number;
  audits: number;
  categoryId: number | null;
}

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [expertSpecializations, setExpertSpecializations] = useState<ExpertSpecialization[]>([]);
  const [expertCategories, setExpertCategories] = useState<ExpertCategory[]>([]);
  const [useDemoData, setUseDemoData] = useState(false);

  // Données de démonstration pour les spécialisations
  const demoSpecializations: Specialization[] = [
    {
      id: 1,
      nom: "TICPE",
      description: "Optimisation de la Taxe Intérieure de Consommation sur les Produits Énergétiques",
      tauxSuccess: 85,
      dureeAverage: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      nom: "CIR",
      description: "Crédit d'Impôt Recherche",
      tauxSuccess: 90,
      dureeAverage: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      nom: "URSSAF",
      description: "Optimisation des cotisations sociales",
      tauxSuccess: 75,
      dureeAverage: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const demoExpertSpecializations: ExpertSpecialization[] = [
    {
      id: 1,
      expertId: "demo-1",
      specializationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      expertId: "demo-1",
      specializationId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      expertId: "demo-1",
      specializationId: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const demoExpertCategories: ExpertCategory[] = [
    {
      id: 1,
      nom: "Expert Senior",
      description: "Expert avec plus de 10 ans d'expérience",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Données de démonstration
  const demoExpert: Expert = {
    id: "demo-1",
    email: "expert@profitum.fr",
    password: "",
    name: "Jean Dupont",
    company: "Expert Conseil Fiscal",
    siren: "123456789",
    specializations: ["TICPE", "CIR", "URSSAF"],
    experience: "15 ans d'expérience en optimisation fiscale",
    location: "Paris",
    rating: 4.8,
    compensation: 150,
    description: "Expert en optimisation fiscale et sociale, spécialisé dans les dispositifs TICPE et CIR",
    status: "active",
    disponibilites: null,
    certifications: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    card_number: null,
    card_expiry: null,
    card_cvc: null,
    abonnement: "premium",
    clients: 25,
    audits: 45,
    categoryId: 1
  };

  const demoDossiers: Dossier[] = [
    {
      id: "1",
      clientId: "client-1",
      clientName: "Transport Express",
      status: "en_cours",
      type: "TICPE",
      createdAt: new Date(),
      updatedAt: new Date(),
      expertId: "demo-1",
      potentialGain: 25000,
      currentStep: 2,
      progress: 45
    },
    {
      id: "2",
      clientId: "client-2",
      clientName: "Logistique Pro",
      status: "en_attente",
      type: "TICPE",
      createdAt: new Date(),
      updatedAt: new Date(),
      expertId: "demo-1",
      potentialGain: 18000,
      currentStep: 1,
      progress: 20
    },
    {
      id: "3",
      clientId: "client-3",
      clientName: "Transport National",
      status: "termine",
      type: "TICPE",
      createdAt: new Date(),
      updatedAt: new Date(),
      expertId: "demo-1",
      potentialGain: 32000,
      currentStep: 3,
      progress: 100
    }
  ];

  // Extraire l'ID de l'expert de l'URL ou du user connecté
  const expertId = location.pathname.includes('/dashboard/expert/') 
    ? location.pathname.split('/dashboard/expert/')[1].split('/')[0] 
    : user?.id || (useDemoData ? demoExpert.id : undefined);

  // Utiliser les données de démonstration si demandé
  useEffect(() => {
    if (useDemoData) {
      setExpert(demoExpert);
      setDossiers(demoDossiers);
      setSpecializations(demoSpecializations);
      setExpertSpecializations(demoExpertSpecializations);
      setExpertCategories(demoExpertCategories);
      setLoading(false);
    }
  }, [useDemoData]);

  useEffect(() => {
    const fetchExpert = async () => {
      if (!expertId || useDemoData) return;
      
      try {
        const response = await get<Expert>(`/api/experts/${expertId}`);
        if (response.success && response.data) {
          setExpert(response.data);
        } else {
          setError(response.message || 'Erreur lors de la récupération des données');
          toast({
            title: 'Erreur',
            description: response.message || 'Erreur lors de la récupération des données',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données');
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la récupération des données',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpert();
  }, [expertId, useDemoData, toast]);

  useEffect(() => {
    const fetchDossiers = async () => {
      if (!expertId || useDemoData) return;

      try {
        setLoading(true);
        setError(null);
        const response = await get<Dossier[]>(`/api/experts/${expertId}/dossiers`);
        
        if (response.success && response.data) {
          setDossiers(response.data);
        } else {
          setError(response.message || "Erreur lors du chargement des dossiers");
        }
      } catch (error) {
        setError("Une erreur est survenue lors du chargement des dossiers");
        console.error("Erreur lors du chargement des dossiers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDossiers();
  }, [expertId, useDemoData]);

  useEffect(() => {
    const fetchData = async () => {
      if (useDemoData) return;

      try {
        // Récupérer les spécialisations
        const specializationsResponse = await get<Specialization[]>('/api/specializations');
        if (specializationsResponse.success && specializationsResponse.data) {
          setSpecializations(specializationsResponse.data);
        }

        // Récupérer les catégories
        const categoriesResponse = await get<ExpertCategory[]>('/api/specializations/categories');
        if (categoriesResponse.success && categoriesResponse.data) {
          setExpertCategories(categoriesResponse.data);
        }

        // Récupérer les spécialisations de l'expert
        if (expertId) {
          const expertSpecsResponse = await get<ExpertSpecialization[]>(`/api/specializations/expert/${expertId}`);
          if (expertSpecsResponse.success && expertSpecsResponse.data) {
            setExpertSpecializations(expertSpecsResponse.data);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la récupération des données',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [expertId, useDemoData, toast]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours":
        return "bg-blue-100 text-blue-800";
      case "en_attente":
        return "bg-yellow-100 text-yellow-800";
      case "termine":
        return "bg-green-100 text-green-800";
      case "annule":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Si l'utilisateur n'est pas connecté, on affiche un message pour inviter à se connecter
  if (!isLoading && !user && !useDemoData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6 text-center">
            Vous devez être connecté en tant qu'expert pour accéder à cette page.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/connexion-partner")}
              className="w-full"
            >
              Se connecter
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setUseDemoData(true);
                setExpert(demoExpert);
                setDossiers(demoDossiers);
                setLoading(false);
              }}
              className="w-full"
            >
              Voir la démo
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800">Aucune donnée disponible</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données de l'expert</p>
          
          <div className="text-left mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
            <h3 className="font-bold mb-2">Informations de débogage:</h3>
            <p>ID dans l'URL: {expertId || 'Non disponible'}</p>
            <p>ID utilisateur connecté: {user?.id || 'Non disponible'}</p>
            <p>Type utilisateur: {user?.type || 'Non disponible'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderExpert />
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expert.clients || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audits</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expert.audits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expert.rating || 0}/5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarif</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expert.compensation || 0}€/h</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>
          <TabsContent value="audits" className="space-y-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tableau de bord Expert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search">Rechercher un dossier</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Nom du client..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="status">Filtrer par statut</Label>
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                      <SelectTrigger>
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

                {filteredDossiers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun dossier trouvé</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredDossiers.map((dossier) => (
                      <Card key={dossier.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{dossier.clientName}</h3>
                              <p className="text-sm text-gray-500">
                                Créé le {formatDate(new Date(dossier.createdAt))}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                                  dossier.status
                                )}`}
                              >
                                {dossier.status}
                              </span>
                              <Button
                                onClick={() => {
                                  const id = expertId || user?.id || (useDemoData ? demoExpert.id : 'demo-1');
                                  navigate(`/dashboard/expert/${id}/dossier/${dossier.id}`);
                                }}
                              >
                                Voir le dossier
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{expert.name}</h3>
                    <p className="text-sm text-gray-500">{expert.company}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Spécialisations</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expert.specializations && expert.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Expérience</h4>
                    <p className="text-sm">{expert.experience}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Localisation</h4>
                    <p className="text-sm">{expert.location}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="text-sm">{expert.description}</p>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium text-lg">Catégorie</h4>
                    {expert?.categoryId ? (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        {expertCategories.find(cat => cat.id === expert.categoryId)?.nom || 'Catégorie inconnue'}
                      </div>
                    ) : (
                      <div className="mt-2 text-gray-500">Aucune catégorie définie</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Mes Spécialisations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertSpecializations.length > 0 ? (
                    expertSpecializations.map((expertSpec) => {
                      const specialization = specializations.find(s => s.id === expertSpec.specializationId);
                      return (
                        <div key={expertSpec.id} className="p-4 border rounded-lg bg-white shadow-sm">
                          <h3 className="font-semibold text-lg">{specialization?.nom || 'Spécialisation inconnue'}</h3>
                          {specialization && (
                            <>
                              <p className="text-sm text-gray-600 mt-2">{specialization.description}</p>
                              <div className="mt-4 space-y-2">
                                {specialization.tauxSuccess && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Taux de succès: {specialization.tauxSuccess}%
                                  </div>
                                )}
                                {specialization.dureeAverage && (
                                  <div className="flex items-center text-sm text-blue-600">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Durée moyenne: {specialization.dureeAverage} jours
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-4">
                                Ajoutée le: {new Date(expertSpec.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-gray-500">
                      Aucune spécialisation trouvée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ExpertDashboard; 