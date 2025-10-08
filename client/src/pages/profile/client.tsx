import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientProfile, ClientProfileUpdate } from "@/hooks/use-client-profile";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  CheckCircle, 
  MapPin, 
  Briefcase, 
  Users, 
  Save, 
  Edit3, 
  X, 
  Phone,
  Mail,
  Home,
  Building,
  Euro,
  Target,
  Users2,
  Clock,
  TrendingUp
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
            <Users className="w-12 h-12 mx-auto" />
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
    <div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header moderne avec design 2025 */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-5 rounded-3xl shadow-2xl">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white animate-pulse shadow-lg"></div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                      Mon Profil
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                      Gérez vos informations personnelles et professionnelles
                    </p>
                    
                    {/* Statut du compte - Version compacte */}
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Compte vérifié</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {profile.statut}
                        </Badge>
                        <span className="text-sm text-slate-600">Actif</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/client')}
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-slate-200 hover:border-blue-300"
                  >
                    <Briefcase className="w-5 h-5 mr-3" />
                    Tableau de bord
                  </Button>
                  <Button 
                    variant={isEditing ? "destructive" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group px-8"
                  >
                    {isEditing ? (
                      <>
                        <X className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                        Annuler
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        Modifier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
                      <div className="grid lg:grid-cols-1 gap-8">
              {/* Informations principales */}
              <div className="space-y-6">
              {/* Informations personnelles */}
              <Card className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                      Informations personnelles
                    </span>
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
              <Card className="bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-slate-900 to-green-900 bg-clip-text text-transparent">
                      Informations entreprise
                    </span>
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
              <Card className="bg-gradient-to-br from-white via-purple-50/20 to-violet-50/30 backdrop-blur-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
                      Adresse
                    </span>
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
                <Card className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 backdrop-blur-xl border border-white/40 shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex gap-4 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-slate-200 hover:border-red-300 px-6"
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-3 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


            </div>


          </div>
        </div>
    </div>
  );
};

export default ClientProfile;
