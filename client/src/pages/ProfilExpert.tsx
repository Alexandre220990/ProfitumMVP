import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, MapPin, Building2, Star, Briefcase, Calendar, DollarSign, Award, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Expert {
  id: string;
  name: string;
  email: string;
  specializations?: string[];
  rating?: number;
  experience?: string;
  compensation?: number;
  location?: string;
  company?: string;
  bio?: string;
  totalAssignments?: number;
  completedAssignments?: number;
  averageRating?: number;
  joinDate?: string;
  certifications?: string[];
  availability?: string;
}

const ProfilExpert = () => { 
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expertData, setExpertData] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    const loadExpertData = async () => { 
      try {
        setLoading(true);
        const response = await get('/api/expert/profile');
        if (response.success && response.data) {
          setExpertData(response.data as Expert);
        }
      } catch (error) { 
        console.error("Erreur lors du chargement du profil :", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadExpertData();
    }
  }, [user]);

  const handleLogout = () => {
    // Logique de déconnexion
    navigate('/logout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!expertData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données du profil expert.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <UserCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Profil Expert</h1>
                  <p className="text-gray-600">Gérez votre profil et vos paramètres</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/expert/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informations personnelles */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-blue-600" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <UserCircle className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{expertData.name}</h3>
                        <p className="text-gray-600">{expertData.email}</p>
                        {expertData.company && (
                          <div className="flex items-center gap-2 mt-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{expertData.company}</span>
                          </div>
                        )}
                        {expertData.location && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{expertData.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {expertData.bio && (
                      <div>
                        <h4 className="font-medium mb-2">Biographie</h4>
                        <p className="text-gray-700 leading-relaxed">{expertData.bio}</p>
                      </div>
                    )}
                    
                    {expertData.specializations && expertData.specializations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Spécialisations</h4>
                        <div className="flex flex-wrap gap-2">
                          {expertData.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {expertData.certifications && expertData.certifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {expertData.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="border-green-200 text-green-700">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Statistiques professionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {expertData.totalAssignments || 0}
                      </div>
                      <div className="text-sm text-gray-600">Assignations totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {expertData.completedAssignments || 0}
                      </div>
                      <div className="text-sm text-gray-600">Missions terminées</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {expertData.averageRating ? expertData.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Note moyenne
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informations rapides */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Informations rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expertData.experience && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">Expérience</div>
                        <div className="text-sm text-gray-600">{expertData.experience}</div>
                      </div>
                    </div>
                  )}
                  
                  {expertData.compensation && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">Commission</div>
                        <div className="text-sm text-gray-600">{expertData.compensation}%</div>
                      </div>
                    </div>
                  )}

                  {expertData.availability && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">Disponibilité</div>
                        <div className="text-sm text-gray-600">{expertData.availability}</div>
                      </div>
                    </div>
                  )}

                  {expertData.joinDate && (
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">Membre depuis</div>
                        <div className="text-sm text-gray-600">
                          {new Date(expertData.joinDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/expert/edit-profile')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Modifier le profil
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/expert/assignments')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Mes missions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/expert/calendar')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendrier
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilExpert; 