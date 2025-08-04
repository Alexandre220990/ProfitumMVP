import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useExpertProfile } from "@/hooks/use-expert-profile";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  MapPin, 
  Briefcase, 
  Users, 
  Edit3, 
  ArrowRight, 
  Shield, 
  TrendingUp,
  Phone,
  Mail,
  Home,
  Building,
  Euro,
  Calendar,
  Target,
  Users2,
  Clock,
  Star,
  Globe,
  Award,
  ExternalLink,
  Lock,
  AlertTriangle,
  Send,
  BookOpen,
  Languages,
  Clock3,
  UserCheck,
  FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ExpertProfile = () => { 
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, error, requestProfileUpdate, refreshProfile } = useExpertProfile();
  
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleRequestUpdate = async () => {
    if (!requestReason.trim()) {
      return;
    }

    setIsSubmittingRequest(true);
    const success = await requestProfileUpdate(requestReason);
    if (success) {
      setIsRequestDialogOpen(false);
      setRequestReason('');
    }
    setIsSubmittingRequest(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil expert...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Shield className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshProfile}>Réessayer</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600">Impossible de charger votre profil expert.</p>
        </div>
      </div>
    );
  }

  const getApprovalStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'secondary';
    }
  };

  const getApprovalStatusText = (status: string | null) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return 'Non défini';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Profil Expert</h1>
                  <p className="text-slate-600">Vos informations professionnelles (lecture seule)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/expert/dashboard')}
                  className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Tableau de bord
                </Button>
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="default"
                      className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                    >
                      <Edit3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                      Demander modification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Demande de modification de profil</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason" className="text-sm font-medium">
                          Raison de la modification
                        </Label>
                        <Textarea
                          id="reason"
                          value={requestReason}
                          onChange={(e) => setRequestReason(e.target.value)}
                          placeholder="Décrivez les modifications que vous souhaitez apporter à votre profil..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsRequestDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleRequestUpdate}
                          disabled={!requestReason.trim() || isSubmittingRequest}
                        >
                          {isSubmittingRequest ? 'Envoi...' : 'Envoyer la demande'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span>Nom complet</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900 font-medium">{profile.name}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>Téléphone</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>SIREN</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.siren}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations professionnelles */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    Informations professionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Nom de l'entreprise
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900 font-medium">{profile.company_name}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          <span>Note</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{profile.rating.toFixed(1)}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < Math.floor(profile.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span>Spécialisations</span>
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex flex-wrap gap-2">
                          {profile.specializations.length > 0 ? (
                            profile.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary">
                                {spec}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-slate-500">Aucune spécialisation renseignée</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Expérience</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.experience || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>Localisation</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.location || 'Non renseignée'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Description
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-slate-900">{profile.description || 'Aucune description renseignée'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarifs et disponibilités */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Euro className="w-5 h-5 text-blue-600" />
                    </div>
                    Tarifs et disponibilités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Euro className="w-4 h-4" />
                          <span>Taux horaire</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900 font-medium">
                            {profile.hourly_rate ? `${profile.hourly_rate}€/h` : 'Non défini'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Users2 className="w-4 h-4" />
                          <span>Clients max</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900 font-medium">
                            {profile.max_clients || 'Illimité'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Clock3 className="w-4 h-4" />
                          <span>Disponibilité</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-slate-900">{profile.availability || 'Non renseignée'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        <span>Langues parlées</span>
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex flex-wrap gap-2">
                          {profile.languages && profile.languages.length > 0 ? (
                            profile.languages.map((lang, index) => (
                              <Badge key={index} variant="outline">
                                {lang}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-slate-500">Aucune langue renseignée</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liens et certifications */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ExternalLink className="w-5 h-5 text-indigo-600" />
                    </div>
                    Liens et certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>Site web</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          {profile.website ? (
                            <a 
                              href={profile.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                            >
                              {profile.website}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-slate-500">Non renseigné</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          {profile.linkedin ? (
                            <a 
                              href={profile.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                            >
                              {profile.linkedin}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-slate-500">Non renseigné</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        <span>Certifications</span>
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {profile.certifications ? (
                          <div className="space-y-2">
                            {Object.entries(profile.certifications).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-slate-700">{key}:</span>
                                <span className="text-slate-900 font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">Aucune certification renseignée</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation rapide */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    Accès rapide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group cursor-pointer" onClick={() => navigate('/expert/agenda')}>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">Agenda</h4>
                          <p className="text-sm text-slate-600">Gérez vos rendez-vous</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                    
                    <div className="group cursor-pointer" onClick={() => navigate('/expert/dossiers')}>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <div className="p-3 bg-green-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">Dossiers</h4>
                          <p className="text-sm text-slate-600">Vos dossiers en cours</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statut du compte */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Statut du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Compte vérifié</div>
                      <div className="text-sm text-slate-600">Email confirmé</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Badge variant={getApprovalStatusColor(profile.approval_status) as any}>
                        {getApprovalStatusText(profile.approval_status)}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Statut d'approbation</div>
                      <div className="text-sm text-slate-600">
                        {profile.approved_at ? 
                          `Approuvé le ${new Date(profile.approved_at).toLocaleDateString('fr-FR')}` : 
                          'En attente d\'approbation'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Membre depuis</div>
                      <div className="text-sm text-slate-600">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Mode lecture seule</div>
                      <div className="text-sm text-slate-600">Modifications via admin</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => navigate('/expert/agenda')}
                  >
                    <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Mon agenda
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => navigate('/expert/dossiers')}
                  >
                    <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Mes dossiers
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => navigate('/expert/messagerie')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Messages
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
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

export default ExpertProfile;
