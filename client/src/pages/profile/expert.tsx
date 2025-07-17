// Core React imports
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import { Building2, Trophy, MessageSquare, Star, Save, Edit3, X, Award, Briefcase, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom Components
import HeaderExpert from "@/components/HeaderExpert";

// Hooks and Utils
import { useToast } from "@/hooks/use-toast";
import { get, post } from "@/lib/api";

// Types
import { PublicExpert } from "@/types/expert";
import { ApiResponse } from "@/types/api";

// Liste des produits éligibles
const eligibleProducts = [
  { id: "ticpe", label: "TICPE", icon: "🚛" },
  { id: "msa", label: "MSA", icon: "🏭" },
  { id: "foncier", label: "Taxe Foncière", icon: "🏠" },
  { id: "dfs", label: "DFS", icon: "📊" },
  { id: "social", label: "Social & URSSAF", icon: "👥" },
  { id: "energetique", label: "Audit Énergétique", icon: "⚡" }
];

const profileSchema = z.object({ 
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"), 
  email: z.string().email("Email invalide"), 
  phone_number: z.string().min(10, "Numéro de téléphone invalide"), 
  company_name: z.string().min(2, "Nom de l'entreprise requis"), 
  siren: z.string().min(9, "Numéro SIREN invalide"), 
  specializations: z.array(z.string()).min(1, "Au moins une spécialisation est requise"), 
  experience: z.string().min(1, "Années d'expérience requises"), 
  description: z.string().min(10, "Description trop courte"), 
  location: z.string().min(2, "Localisation requise") 
});

const ExpertProfile = () => { 
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(["ticpe"]);
  const [expert, setExpert] = useState<PublicExpert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultValues = { 
    name: "Jean Dupont", 
    email: "expert.ticpe@profitum.fr", 
    phone_number: "+33 6 12 34 56 78", 
    company_name: "Expertise Fiscale Plus", 
    siren: "123456789", 
    specializations: ["ticpe"], 
    experience: "15", 
    description: "Expert en optimisation fiscale avec plus de 15 ans d'expérience...", 
    location: "Paris" 
  };

  const form = useForm({ 
    resolver: zodResolver(profileSchema), 
    defaultValues 
  });

  useEffect(() => { 
    const fetchExpert = async () => {
      try {
        const response = await get<ApiResponse<PublicExpert>>('/experts/me');
        
        if (response.success && response.data) {
          const expertData = response.data as unknown as PublicExpert;
          setExpert(expertData);
          
          // Mise à jour du formulaire avec les données
          Object.entries(expertData).forEach(([key, value]) => {
            if (form.getValues(key as any) !== undefined) {
              form.setValue(key as any, value); 
            }
          });
        } else { 
          const message = response.message || 'Erreur lors de la récupération des données';
          setError(message);
          toast({
            title: 'Erreur', 
            description: message, 
            variant: 'destructive' 
          });
        }
      } catch (error) { 
        const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des données';
        setError(message);
        toast({
          title: 'Erreur', 
          description: message, 
          variant: 'destructive' 
        });
      } finally { 
        setLoading(false); 
      }
    };

    fetchExpert();
  }, [toast, form]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => { 
    setIsSaving(true);
    try {
      const response = await post<ApiResponse<PublicExpert>>('/experts/me', { 
        ...data, 
        specializations: data.specializations.map(String) 
      });
      
      if (response.success && response.data) { 
        const updatedExpert = response.data as unknown as PublicExpert;
        setExpert(updatedExpert);
        
        toast({
          title: 'Succès', 
          description: 'Profil mis à jour avec succès', 
          variant: 'default' 
        });
        setIsEditing(false);
      } else { 
        const message = response.message || 'Erreur lors de la mise à jour du profil';
        toast({
          title: 'Erreur', 
          description: message, 
          variant: 'destructive' 
        });
      }
    } catch (error) { 
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
      toast({
        title: 'Erreur', 
        description: message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    { icon: Trophy, label: "Dossiers complétés", value: "127", color: "text-yellow-600", bgColor: "bg-yellow-100" },
    { icon: MessageSquare, label: "Avis clients", value: "84", color: "text-blue-600", bgColor: "bg-blue-100" },
    { icon: Star, label: "Note moyenne", value: "4.8/5", color: "text-green-600", bgColor: "bg-green-100" },
    { icon: Building2, label: "Années d'expérience", value: "15", color: "text-purple-600", bgColor: "bg-purple-100" }
  ];

  const toggleSpecialization = (specialization: string) => { 
    setSelectedSpecializations(current => {
      if (current.includes(specialization)) {
        return current.filter(spec => spec !== specialization); 
      } else { 
        return [...current, specialization]; 
      }
    });
    
    // Mettre à jour le formulaire
    const currentValues = form.getValues().specializations || [];
    if (currentValues.includes(specialization)) { 
      form.setValue("specializations", currentValues.filter(spec => spec !== specialization)); 
    } else { 
      form.setValue("specializations", [...currentValues, specialization]); 
    }
  };

  if (loading) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Chargement du profil...</p>
        </div>
      </div>
    ); 
  }

  if (error) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Erreur</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!expert) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Expert non trouvé</h2>
          <p className="text-slate-600">Impossible de charger les informations du profil</p>
        </div>
      </div>
    ); 
  }

  return (
    <>
      <HeaderExpert />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto p-6 pt-28 space-y-8">
          {/* Header amélioré */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Mon Profil Expert</h1>
                <p className="text-slate-600">Gérez vos informations professionnelles</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "default"}
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
                  Modifier le profil
                </>
              )}
            </Button>
          </div>

          {/* Statistiques améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations Personnelles */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Informations Personnelles
                  </CardTitle>
                  <CardDescription>
                    Vos informations de contact et détails professionnels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <span>Nom complet</span>
                            {field.value && field.value.length >= 2 && (
                              <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="Votre nom complet"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <span>Email</span>
                            {field.value && /\S+@\S+\.\S+/.test(field.value) && (
                              <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="votre@email.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700">Téléphone</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="Votre numéro de téléphone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700">Localisation</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="Votre ville"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Informations Professionnelles */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    Informations Professionnelles
                  </CardTitle>
                  <CardDescription>
                    Vos qualifications et expérience professionnelle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700">Cabinet / Entreprise</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="Nom de votre cabinet"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700">Années d'expérience</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!isEditing}
                          >
                            <FormControl>
                              <SelectTrigger className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg">
                                <SelectValue placeholder="Sélectionnez une tranche d'expérience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-3">1-3 ans</SelectItem>
                              <SelectItem value="3-5">3-5 ans</SelectItem>
                              <SelectItem value="5-10">5-10 ans</SelectItem>
                              <SelectItem value="10+">10 ans et plus</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="siren"
                      render={({ field }) => (
                        <FormItem className="group">
                          <FormLabel className="text-sm font-medium text-slate-700">Numéro SIREN</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg"
                              placeholder="Votre numéro SIREN"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specializations"
                      render={() => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-sm font-medium text-slate-700">Spécialisations</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                              {eligibleProducts.map((product) => (
                                <div key={product.id} className="group cursor-pointer">
                                  <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 ${
                                    selectedSpecializations.includes(product.id)
                                      ? 'bg-blue-50 border-blue-200 shadow-md'
                                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                  } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                                    onClick={() => isEditing && toggleSpecialization(product.id)}
                                  >
                                    <Checkbox
                                      id={`specialization-${product.id}`}
                                      checked={selectedSpecializations.includes(product.id)}
                                      onCheckedChange={() => isEditing && toggleSpecialization(product.id)}
                                      disabled={!isEditing}
                                      className="group-hover:scale-110 transition-transform duration-200"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{product.icon}</span>
                                      <label
                                        htmlFor={`specialization-${product.id}`}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                      >
                                        {product.label}
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2 group">
                          <FormLabel className="text-sm font-medium text-slate-700">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4}
                              disabled={!isEditing}
                              className="transition-all duration-300 group-hover:shadow-md focus:shadow-lg resize-none"
                              placeholder="Décrivez votre expertise et votre approche..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end pt-4 animate-fade-in">
                      <Button 
                        type="submit" 
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
                            <Save className="h-4 w-4" />
                            Enregistrer les modifications
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default ExpertProfile;
