import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Building2, FileText, MessageSquare, CheckCircle, MapPin, Briefcase, Users, Save, Edit3, X, ArrowRight, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

const ClientProfile = () => { 
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    name: user?.name || "",
    email: user?.email || "",
    company: "",
    phone: "",
  });

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (data: ProfileData) => { 
    setIsSaving(true);
    // Simulation de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Données à sauvegarder:", data);
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
    });
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleSave = () => {
    try {
      const validatedData = profileSchema.parse(formData);
      onSubmit(validatedData);
    } catch (error) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez vérifier les informations saisies.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header amélioré */}
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
                  <p className="text-slate-600">Gérez vos informations personnelles</p>
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
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informations personnelles améliorées */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span>Nom complet</span>
                          {formData.name && formData.name.length >= 2 && (
                            <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                          )}
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Votre nom complet"
                          className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span>Email</span>
                          {formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                            <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                          )}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          placeholder="votre@email.com"
                          className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                          Entreprise
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Nom de votre entreprise"
                          className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Votre numéro de téléphone"
                          className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4 animate-fade-in">
                        <Button 
                          onClick={handleSave} 
                          className="flex items-center gap-2 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                          disabled={isSaving}
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
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents et communications améliorés */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    Documents et communications
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

            {/* Sidebar améliorée */}
            <div className="space-y-6">
              {/* Statut du compte amélioré */}
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
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Localisation</div>
                      <div className="text-sm text-slate-600">France</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">Type de compte</div>
                      <div className="text-sm text-slate-600">Client</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides améliorées */}
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
