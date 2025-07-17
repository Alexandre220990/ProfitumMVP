import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Award, MessageSquare, AlertCircle, ArrowLeft, Star, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

interface Expert {
  id: string;
  name: string;
  company_name: string;
  specializations: string[];
  experience: string;
  location: string;
  rating: number;
  description: string;
  compensation?: number;
  certifications?: Record<string, boolean>;
  disponibilites?: {
    available: boolean;
    schedule?: string;
  };
  statistics: {
    totalAssignments: number;
    completedAssignments: number;
    avgClientRating: number;
    successRate: number;
  };
}

interface Assignment {
  id: string;
  status: string;
  assignment_date: string;
  completed_date?: string;
  client_rating?: number;
  client_feedback?: string;
  produit_nom?: string;
}

export default function ExpertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (id) {
      loadExpertDetails();
      loadAssignments();
    }
  }, [id]);

  const loadExpertDetails = async () => {
    try {
      const response = await api.get(`/experts/marketplace/${id}`);
      if (response.data.success) {
        setExpert(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement expert: ', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await api.get(`/experts/assignments?expert_id=${id}&status=completed&limit=5`);
      if (response.data.success) {
        setAssignments(response.data.data.assignments);
      }
    } catch (error) {
      console.error('Erreur chargement assignations: ', error);
    }
  };

  const contactExpert = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setContacting(true);
    try {
      const response = await api.post(`/experts/marketplace/${id}/contact`, {
        message: 'Je souhaite vous contacter pour une prestation.'
      });

      if (response.data.success) {
        alert('Demande envoyée avec succès ! L\'expert vous contactera rapidement.');
      }
    } catch (error) {
      console.error('Erreur contact expert: ', error);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'expert...</p>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Expert non trouvé</h2>
          <p className="text-gray-600 mb-4">L'expert que vous recherchez n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate('/marketplace/experts')}>
            Retour à la recherche
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/marketplace/experts')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{expert.name}</h1>
              <p className="text-xl text-gray-600 mb-4">{expert.company_name}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {expert.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  {expert.rating} ({expert.statistics.avgClientRating} avis clients)
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {expert.statistics.completedAssignments} missions
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0">
              <Button
                onClick={contactExpert}
                disabled={contacting}
                className="w-full lg:w-auto"
                size="lg"
              >
                {contacting ? 'Envoi...' : 'Contacter cet expert'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="experience">Expérience</TabsTrigger>
                <TabsTrigger value="reviews">Avis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>À propos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {expert.description || 'Expert qualifié avec une solide expérience dans son domaine.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Spécialisations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Spécialisations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {expert.specializations?.map((spec: string) => (
                        <Badge key={spec} variant="secondary" className="text-sm">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {expert.statistics.completedAssignments}
                        </div>
                        <div className="text-sm text-gray-600">Missions terminées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {expert.statistics.successRate}%
                        </div>
                        <div className="text-sm text-gray-600">Taux de réussite</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {expert.statistics.avgClientRating}
                        </div>
                        <div className="text-sm text-gray-600">Note moyenne</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {expert.statistics.totalAssignments}
                        </div>
                        <div className="text-sm text-gray-600">Total missions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                {/* Expérience */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expérience professionnelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Expérience</h4>
                        <p className="text-gray-700">{expert.experience || 'Expérience détaillée non renseignée'}</p>
                      </div>
                      
                      {expert.certifications && Object.keys(expert.certifications).length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                          <div className="space-y-2">
                            {Object.entries(expert.certifications).map(([cert, value]) => (
                              <div key={cert} className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{cert}</span>
                                {value && <CheckCircle className="h-4 w-4 text-green-600" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {/* Avis clients */}
                <Card>
                  <CardHeader>
                    <CardTitle>Avis clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments.length > 0 ? (
                      <div className="space-y-4">
                        {assignments.map((assignment: Assignment) => (
                          <div key={assignment.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="font-medium">{assignment.client_rating}/5</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(assignment.completed_date || assignment.assignment_date).toLocaleDateString()}
                              </span>
                            </div>
                            {assignment.client_feedback && (
                              <p className="text-gray-700 text-sm">{assignment.client_feedback}</p>
                            )}
                            {assignment.produit_nom && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {assignment.produit_nom}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">
                        Aucun avis disponible pour le moment
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact rapide */}
            <Card>
              <CardHeader>
                <CardTitle>Contact rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={contactExpert}
                  disabled={contacting}
                  className="w-full"
                  size="lg"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {contacting ? 'Envoi...' : 'Envoyer un message'}
                </Button>
                
                <div className="text-center text-sm text-gray-600">
                  Temps de réponse moyen : <span className="font-medium">24h</span>
                </div>
              </CardContent>
            </Card>

            {/* Disponibilité */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${expert.disponibilites?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    {expert.disponibilites?.available ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
                
                {expert.disponibilites?.schedule && (
                  <div className="text-sm text-gray-600">
                    <div className="font-medium mb-2">Horaires :</div>
                    <div className="space-y-1">
                      <div>Lun-Ven : 9h-18h</div>
                      <div>Sam : 9h-12h</div>
                      <div>Dim : Fermé</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tarifs */}
            {expert.compensation && (
              <Card>
                <CardHeader>
                  <CardTitle>Tarifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      À partir de {expert.compensation}€
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      par mission
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations légales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Expert vérifié
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Assurance professionnelle
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Paiement sécurisé
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 