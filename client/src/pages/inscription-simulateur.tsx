import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Building, Phone, MapPin, Loader2, TrendingUp, Euro, ArrowRight, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { config } from "@/config/env";

// Schéma de validation du formulaire
const formSchema = z.object({ 
  username: z.string().min(2, "Le nom d'utilisateur doit contenir au moins 2 caractères"), 
  email: z.string().email("Email invalide"), 
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"), 
  confirmPassword: z.string(), 
  company_name: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"), 
  phone_number: z.string().min(10, "Numéro de téléphone invalide"), 
  address: z.string().min(5, "Adresse invalide"), 
  city: z.string().min(2, "Ville invalide"), 
  postal_code: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  siren: z.string().regex(/^\d{9}$/, "Numéro SIREN invalide"),
}).refine((data) => data.password === data.confirmPassword, { 
  message: "Les mots de passe ne correspondent pas", 
  path: ["confirmPassword"] 
});

type FormData = z.infer<typeof formSchema>;

interface EligibilityResult { 
  produit_id: string;
  eligibility_score: number;
  estimated_savings: number;
  confidence_level: string;
  recommendations: string[] 
}

const InscriptionSimulateur = () => { 
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStep, setMigrationStep] = useState<'checking' | 'migrating' | 'completed' | 'error'>('checking');
  const [sessionData, setSessionData] = useState<any>(null);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [highEligibilityCount, setHighEligibilityCount] = useState(0);

  const form = useForm<FormData>({ 
    resolver: zodResolver(formSchema), 
    defaultValues: {
      username: "", 
      email: "", 
      password: "", 
      confirmPassword: "", 
      company_name: "", 
      phone_number: "", 
      address: "", 
      city: "", 
      postal_code: "", 
      siren: "" 
    },
  });

  // Récupérer les données du simulateur depuis la navigation
  useEffect(() => { 
    const state = location.state as any;
    if (state?.fromSimulator && state?.sessionToken && state?.eligibilityResults) {
      setEligibilityResults(state.eligibilityResults);
      setTotalSavings(state.eligibilityResults.reduce((sum: number, r: any) => sum + r.estimated_savings, 0));
      setHighEligibilityCount(state.eligibilityResults.filter((r: any) => r.eligibility_score >= 70).length);
      
      // Pré-remplir le formulaire avec les données extraites si disponibles
      if (state.extractedData) {
        form.reset({
          ...form.getValues(), 
          company_name: state.extractedData.company_name || ""
        });
      }
    } else { 
      // Rediriger si pas de données du simulateur
      toast({
        title: "Erreur", 
        description: "Accès direct non autorisé. Veuillez utiliser le simulateur.", 
        variant: "destructive" 
      });
      navigate('/simulateur-eligibilite');
    }
  }, [location, navigate, toast, form]);

  // Vérifier si la session peut être migrée
  useEffect(() => { 
    const checkMigrationEligibility = async () => {
      const state = location.state as any;
      if (!state?.sessionToken) return;

      try {
        const response = await fetch(`${config.API_URL}/api/session-migration/can-migrate/${state.sessionToken}`);
        const data = await response.json();

        if (data.success && data.can_migrate) { 
          // Récupérer les données de session
          const sessionResponse = await fetch(`${config.API_URL}/api/session-migration/session-data/${state.sessionToken}`);
          const sessionData = await sessionResponse.json();

          if (sessionData.success) { 
            setSessionData(sessionData.data); 
          }
        } else { 
          setMigrationStep('error');
          toast({
            title: "Erreur", 
            description: "Cette session ne peut pas être migrée. Veuillez refaire le simulateur.", 
            variant: "destructive" 
          });
        }
      } catch (error) { 
        console.error('Erreur vérification migration: ', error);
        setMigrationStep('error'); 
      }
    };

    checkMigrationEligibility();
  }, [location, toast]);

  const onSubmit = async (data: FormData) => { 
    setIsLoading(true);
    setMigrationStep('migrating');

    try {
      const state = location.state as any;
      
      // Préparer les données de migration
      const migrationData = {
        sessionToken: state.sessionToken, 
        sessionId: state.sessionToken, // Utiliser le token comme ID pour simplifier
        clientData: {
          ...data, // Ajouter les données extraites de la session
          ...sessionData?.extracted_client_data // Ajouter les données extraites de la session
        }
      };

      // Effectuer la migration
      const response = await fetch(`${config.API_URL}/api/session-migration/migrate`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(migrationData)
      });

      const result = await response.json();

      if (!result.success) { 
        throw new Error(result.error || 'Erreur lors de la migration'); 
      }

      setMigrationStep('completed');

      // Connexion automatique après migration réussie
      const loginResponse = await fetch(`${config.API_URL}/api/auth/login`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      const loginResult = await loginResponse.json();

      if (loginResult.success && loginResult.data) { 
        localStorage.setItem('token', loginResult.data.token);
        setUser(loginResult.data.user);

        toast({
          title: "🎉 Inscription réussie !", 
          description: `Bienvenue ${data.username} ! Votre compte a été créé avec ${result.data.client_produit_eligibles?.length || 0} produits éligibles.`,
        });

        // Rediriger vers le dashboard avec les données migrées
        navigate(`/dashboard/client/${loginResult.data.user.id}`, { 
          state: {
            fromSimulator: true, 
            migrationData: result.data 
          }
        });
      } else { 
        // Migration réussie mais problème de connexion
        toast({
          title: "Compte créé", 
          description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter." 
        });
        navigate('/connexion-client');
      }

    } catch (error) { 
      console.error('Erreur lors de l\'inscription: ', error);
      setMigrationStep('error');
      
      toast({
        title: "Erreur", 
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription", 
        variant: "destructive" 
      });
    } finally { 
      setIsLoading(false); 
    }
  };

  const getProductIcon = (produitId: string) => { 
    const icons: Record<string, any> = {
      'TICPE': '🚛', 
      'URSSAF': '👥', 
      'DFS': '📄', 
      'FONCIER': '🏢' 
    };
    return icons[produitId] || '💰';
  };



  if (migrationStep === 'error') { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Erreur de migration</h2>
            <p className="text-gray-600 mb-4">
              Impossible de migrer votre session. Veuillez refaire le simulateur.
            </p>
            <Button onClick={() => navigate('/simulateur-eligibilite')}>
              Retour au simulateur
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-blue-900 text-white py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TrendingUp className="w-8 h-8 text-yellow-300" />
            <div>
              <h1 className="text-xl font-bold">🎯 Finalisez votre inscription</h1>
              <p className="text-blue-100 text-sm">Transformez vos résultats en économies réelles</p>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-yellow-300 font-semibold">{totalSavings.toLocaleString('fr-FR')}€</span> d'économies potentielles
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Formulaire d'inscription */}
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-6 h-6 text-blue-600" />
                  <span>Créer votre compte</span>
                </CardTitle>
                <p className="text-gray-600">
                  Complétez vos informations pour finaliser votre inscription et accéder à vos économies
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom d'utilisateur</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} placeholder="Votre nom d'utilisateur" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} type="email" placeholder="votre@email.com" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                  <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmer le mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                  <Input {...field} type="password" placeholder="••••••••" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de l'entreprise</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} placeholder="Nom de votre entreprise" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="siren"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro SIREN</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} placeholder="123456789" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} placeholder="0123456789" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input {...field} placeholder="123 Rue de la Paix" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Paris" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code postal</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="75001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Bouton de soumission */}
                    <Button
                      type="submit"
                      className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {migrationStep === 'migrating' ? 'Migration en cours...' : 'Création du compte...'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Créer mon compte</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Résumé des résultats */}
          <div className="space-y-6">
            {/* Résumé des économies */}
            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <Euro className="w-12 h-12 mx-auto mb-4 text-green-200" />
                  <h2 className="text-2xl font-bold mb-2">
                    {totalSavings.toLocaleString('fr-FR')}€
                  </h2>
                  <p className="text-green-100">
                    d'économies potentielles identifiées
                  </p>
                  <div className="mt-4 flex justify-center space-x-4 text-sm">
                    <div>
                      <div className="font-bold">{eligibilityResults.length}</div>
                      <div className="text-green-200">Produits analysés</div>
                    </div>
                    <div>
                      <div className="font-bold">{highEligibilityCount}</div>
                      <div className="text-green-200">Très éligibles</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détail des produits éligibles */}
            <Card>
              <CardHeader>
                <CardTitle>Vos opportunités d'optimisation</CardTitle>
                <p className="text-gray-600">Produits pour lesquels vous êtes éligible</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {eligibilityResults.map((result) => (
                  <div key={result.produit_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getProductIcon(result.produit_id)}</div>
                      <div>
                        <h4 className="font-semibold">{result.produit_id}</h4>
                        <p className="text-sm text-gray-600">
                          Score: {result.eligibility_score}% • {result.confidence_level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {result.estimated_savings.toLocaleString('fr-FR')}€
                      </div>
                      <Badge 
                        variant={result.eligibility_score >= 70 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {result.eligibility_score >= 70 ? 'Très éligible' : 'Éligible'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Avantages de l'inscription */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">🎁 Avantages de votre inscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Accès à votre dashboard personnalisé</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Accompagnement par nos experts certifiés</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Suivi en temps réel de vos dossiers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Notifications automatiques des opportunités</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionSimulateur; 