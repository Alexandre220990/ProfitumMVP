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
import { SirenValidationField } from "@/components/SirenValidationField";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/config/env";

// Schéma de validation du formulaire
const formSchema = z.object({ 
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
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

type MigrationStep = 'checking' | 'migrating' | 'completed' | 'error' | 'idle';

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
  const { setUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStep, setMigrationStep] = useState<MigrationStep>('checking');
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [highEligibilityCount, setHighEligibilityCount] = useState(0);

  const form = useForm<FormData>({ 
    resolver: zodResolver(formSchema), 
    defaultValues: {
      first_name: "",
      last_name: "",
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
    console.log('📋 État reçu:', state);
    
    if (state?.fromSimulator && state?.sessionToken && state?.eligibilityResults) {
      console.log('✅ Données simulateur présentes:', {
        sessionToken: state.sessionToken,
        resultsCount: state.eligibilityResults.length
      });
      
      setEligibilityResults(state.eligibilityResults);
      setTotalSavings(state.eligibilityResults.reduce((sum: number, r: any) => sum + r.estimated_savings, 0));
      setHighEligibilityCount(state.eligibilityResults.filter((r: any) => r.eligibility_score >= 70).length);
      
      // ✅ Pas besoin de vérifier la migration - on a déjà toutes les données
      setMigrationStep('completed');
      
      // Récupérer l'email depuis le localStorage (saisi avant la simulation)
      const savedEmail = localStorage.getItem('simulator_visitor_email');
      
      // Pré-remplir le formulaire avec les données extraites si disponibles
      const formData: any = {
        ...form.getValues()
      };
      
      if (state.extractedData?.company_name) {
        formData.company_name = state.extractedData.company_name;
      }
      
      // Pré-remplir l'email si disponible
      if (savedEmail) {
        formData.email = savedEmail;
        console.log('✅ Email pré-rempli depuis le simulateur:', savedEmail);
      }
      
      form.reset(formData);
    } else { 
      // Rediriger si pas de données du simulateur
      console.error('❌ Données simulateur manquantes:', {
        fromSimulator: state?.fromSimulator,
        hasSessionToken: !!state?.sessionToken,
        hasResults: !!state?.eligibilityResults
      });
      toast.error("Accès direct non autorisé. Veuillez utiliser le simulateur");
      navigate('/simulateur-eligibilite');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ⚠️ DÉSACTIVÉ: Vérification de migration inutile quand on a déjà les résultats
  // La vérification de migration était conçue pour récupérer les résultats depuis l'API,
  // mais quand on vient du simulateur, on a déjà tout dans location.state
  /*
  useEffect(() => { 
    const checkMigrationEligibility = async () => {
      const state = location.state as any;
      if (!state?.sessionToken) return;
      // Si on a déjà les résultats, pas besoin de vérifier la migration
      if (state?.eligibilityResults) return;

      try {
        const response = await fetch(`${config.API_URL}/api/simulator/results/${state.sessionToken}`);
        const data = await response.json();

        if (data.success && data.can_migrate) { 
          const sessionResponse = await fetch(`${config.API_URL}/api/simulator/results/${state.sessionToken}`);
          const sessionData = await sessionResponse.json();

          if (sessionData.success) { 
            // Session data récupérée (non utilisée car migration automatique)
          }
        } else { 
          setMigrationStep('error');
          toast.error("Cette session ne peut pas être migrée. Veuillez refaire le simulateur");
        }
      } catch (error) { 
        console.error('Erreur vérification migration: ', error);
        setMigrationStep('error'); 
      }
    };

    checkMigrationEligibility();
  }, [location.state]);
  */

  const onSubmit = async (data: FormData) => { 
    setIsLoading(true);
    setMigrationStep('migrating');

    try {
      const state = location.state as any;
      
      // 1. D'abord créer l'utilisateur via /api/auth/register
      console.log('📝 Création du compte utilisateur...');
      
      const cleanSiren = data.siren.replace(/\D/g, "");
      
      const registerResponse = await fetch(`${config.API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...data, 
          siren: cleanSiren, 
          type: "client",
          session_token: state.sessionToken // 🔥 IMPORTANT : Transférer le session_token pour migrer les produits
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResult.success || !registerResult.data) {
        // Gérer spécifiquement l'erreur de SIREN dupliqué
        if (registerResult.error === 'DUPLICATE_SIREN') {
          form.setError('siren', {
            type: 'manual',
            message: '⚠️ Ce numéro SIREN est déjà utilisé. Veuillez en entrer un autre.'
          });
          setMigrationStep('idle');
          toast.error('SIREN déjà existant - Veuillez modifier le numéro SIREN');
          return; // Ne pas lancer d'exception, juste arrêter le processus
        }
        
        // Gérer l'erreur d'email dupliqué
        if (registerResult.error === 'DUPLICATE_EMAIL') {
          form.setError('email', {
            type: 'manual',
            message: '⚠️ Cette adresse email est déjà utilisée.'
          });
          setMigrationStep('idle');
          toast.error('Email déjà existant - Utilisez une autre adresse');
          return;
        }
        
        // Autres erreurs
        throw new Error(registerResult.message || "Erreur lors de la création du compte");
      }

      const { token, user } = registerResult.data;
      console.log('✅ Compte utilisateur créé:', user.id);

      // 2. Migration automatique des données
      // ⚠️ La migration est maintenant gérée automatiquement lors de l'inscription
      // L'ancienne API /session-migration/migrate est obsolète
      console.log('✅ Données de simulation déjà associées au compte lors de l\'inscription');

      setMigrationStep('completed');

      // 3. Connexion automatique avec les données du register
      localStorage.setItem('token', token);
      setUser(user);

      // Nettoyage des données temporaires
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('eligibilityResults');
      localStorage.removeItem('simulator_visitor_email');
      sessionStorage.clear();

      toast.success(`🎉 Inscription réussie ! Bienvenue ${data.username} ! Votre compte a été créé avec ${eligibilityResults.length} produits éligibles`);

      // Rediriger vers le dashboard
      navigate(`/dashboard/client/${user.id}`, { 
        state: {
          fromSimulator: true, 
          eligibilityResults, totalSavings
        }
      });

    } catch (error) { 
      console.error('❌ Erreur lors de l\'inscription: ', error);
      setMigrationStep('error');
      
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription");
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

  const getMigrationMessage = (step: MigrationStep): string => {
    switch (step) {
      case 'checking':
        return 'Vérification...';
      case 'migrating':
        return 'Création du compte...';
      case 'completed':
        return 'Redirection...';
      case 'error':
        return 'Erreur...';
      case 'idle':
        return 'En attente...';
      default:
        return 'Traitement...';
    }
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                  <Input {...field} placeholder="Prénom" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                  <Input {...field} placeholder="Nom" className="pl-10" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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

                      {/* Champ SIREN avec validation */}
                      <SirenValidationField
                        form={form}
                        name="siren"
                        label="Numéro SIREN"
                        placeholder="123456789"
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {getMigrationMessage(migrationStep)}
                          </>
                        ) : (
                          <>
                            Créer mon compte et migrer mes données
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
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