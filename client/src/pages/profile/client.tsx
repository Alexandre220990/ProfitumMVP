import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientProfile, ClientProfileUpdate } from "@/hooks/use-client-profile";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  MapPin, 
  Briefcase, 
  Users, 
  Save, 
  Edit3, 
  X, 
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
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ClientProfile = () => { 
  const navigate = useNavigate();
  const { profile, isLoading, isSaving, error, updateProfile, refreshProfile } = useClientProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ClientProfileUpdate>({});

  // Initialiser les données du formulaire quand le profil est chargé
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        company_name: profile.company_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        siren: profile.siren || '',
        revenuAnnuel: profile.revenuAnnuel || undefined,
        secteurActivite: profile.secteurActivite || '',
        nombreEmployes: profile.nombreEmployes || undefined,
        ancienneteEntreprise: profile.ancienneteEntreprise || undefined,
        typeProjet: profile.typeProjet || '',
        chiffreAffaires: profile.chiffreAffaires || undefined,
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ClientProfileUpdate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
      refreshProfile();
    }
  };

  const handleCancel = () => {
    // Restaurer les données originales
    if (profile) {
      setFormData({
        name: profile.name || '',
        company_name: profile.company_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        siren: profile.siren || '',
        revenuAnnuel: profile.revenuAnnuel || undefined,
        secteurActivite: profile.secteurActivite || '',
        nombreEmployes: profile.nombreEmployes || undefined,
        ancienneteEntreprise: profile.ancienneteEntreprise || undefined,
        typeProjet: profile.typeProjet || '',
        chiffreAffaires: profile.chiffreAffaires || undefined,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
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
          <p className="text-gray-600">Impossible de charger votre profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header avec actions rapides */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Profil Client</h1>
                  <p className="text-slate-600">Gérez vos informations personnelles et professionnelles</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Tableau de bord
                </Button>
                <Button 
                  variant={isEditing ? "destructive" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                      Modifier
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Actions rapides - Tuiles bien alignées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => navigate('/documents-client')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Documents</h3>
                      <p className="text-sm text-slate-600">Gérer vos fichiers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => navigate('/messagerie-client')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">Messages</h3>
                      <p className="text-sm text-slate-600">Communiquer avec les experts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => navigate('/marketplace-experts')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <Users2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Experts</h3>
                      <p className="text-sm text-slate-600">Trouver un expert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => navigate('/agenda-client')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">Agenda</h3>
                      <p className="text-sm text-slate-600">Gérer vos rendez-vous</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span>Nom complet</span>
                          {formData.name && formData.name.length >= 2 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </Label>
                        <Input
                          id="name"
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Votre nom complet"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled={true}
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>Téléphone</span>
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone_number || ''}
                          onChange={(e) => handleInputChange('phone_number', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Votre numéro de téléphone"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="siren" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>SIREN</span>
                        </Label>
                        <Input
                          id="siren"
                          value={formData.siren || ''}
                          onChange={(e) => handleInputChange('siren', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Numéro SIREN"
                          className="transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations entreprise */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    Informations entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                          Nom de l'entreprise
                        </Label>
                        <Input
                          id="company"
                          value={formData.company_name || ''}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Nom de votre entreprise"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secteur" className="text-sm font-medium text-slate-700">
                          Secteur d'activité
                        </Label>
                        <Select 
                          value={formData.secteurActivite || ''} 
                          onValueChange={(value) => handleInputChange('secteurActivite', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un secteur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="industrie">Industrie</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="commerce">Commerce</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="sante">Santé</SelectItem>
                            <SelectItem value="education">Éducation</SelectItem>
                            <SelectItem value="technologie">Technologie</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employes" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Users2 className="w-4 h-4" />
                          <span>Nombre d'employés</span>
                        </Label>
                        <Input
                          id="employes"
                          type="number"
                          value={formData.nombreEmployes || ''}
                          onChange={(e) => handleInputChange('nombreEmployes', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          placeholder="0"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="anciennete" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Ancienneté (années)</span>
                        </Label>
                        <Input
                          id="anciennete"
                          type="number"
                          value={formData.ancienneteEntreprise || ''}
                          onChange={(e) => handleInputChange('ancienneteEntreprise', parseInt(e.target.value) || 0)}
                          disabled={!isEditing}
                          placeholder="0"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="typeProjet" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          <span>Type de projet</span>
                        </Label>
                        <Select 
                          value={formData.typeProjet || ''} 
                          onValueChange={(value) => handleInputChange('typeProjet', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="investissement">Investissement</SelectItem>
                            <SelectItem value="renovation">Rénovation</SelectItem>
                            <SelectItem value="expansion">Expansion</SelectItem>
                            <SelectItem value="optimisation">Optimisation</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="revenu" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Euro className="w-4 h-4" />
                          <span>Revenu annuel (€)</span>
                        </Label>
                        <Input
                          id="revenu"
                          type="number"
                          value={formData.revenuAnnuel || ''}
                          onChange={(e) => handleInputChange('revenuAnnuel', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          placeholder="0"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chiffreAffaires" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Chiffre d'affaires (€)</span>
                        </Label>
                        <Input
                          id="chiffreAffaires"
                          type="number"
                          value={formData.chiffreAffaires || ''}
                          onChange={(e) => handleInputChange('chiffreAffaires', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          placeholder="0"
                          className="transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Home className="w-5 h-5 text-purple-600" />
                    </div>
                    Adresse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Adresse complète</span>
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Votre adresse complète"
                        className="transition-all duration-300"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                          Ville
                        </Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Votre ville"
                          className="transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal" className="text-sm font-medium text-slate-700">
                          Code postal
                        </Label>
                        <Input
                          id="postal"
                          value={formData.postal_code || ''}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Code postal"
                          className="transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {isEditing && (
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex gap-3 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation rapide */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    Accès rapide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group cursor-pointer" onClick={() => navigate('/documents')}>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">Documents</h4>
                          <p className="text-sm text-slate-600">Gérez vos documents</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                    
                    <div className="group cursor-pointer" onClick={() => navigate('/messagerie')}>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <div className="p-3 bg-green-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">Messages</h4>
                          <p className="text-sm text-slate-600">Consultez vos conversations</p>
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
                      <Badge variant="default">{profile.statut}</Badge>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Statut</div>
                      <div className="text-sm text-slate-600">Actif</div>
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
                    onClick={() => navigate('/produits')}
                  >
                    <Briefcase className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Voir les produits
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => navigate('/experts')}
                  >
                    <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Trouver un expert
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => navigate('/aide')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Support client
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

export default ClientProfile;
