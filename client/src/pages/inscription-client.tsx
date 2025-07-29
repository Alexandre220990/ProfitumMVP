import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Building, Phone, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const InscriptionClient = () => { 
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data: FormData) => { 
    setIsLoading(true);
    
    try {
      console.log('🔍 Tentative d\'inscription client directe:', data);

      // 1. Créer le compte utilisateur dans Supabase Auth
      const authResponse = await fetch(`${config.apiUrl}/auth/register-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          user_metadata: {
            username: data.username,
            type: 'client',
            company_name: data.company_name,
            siren: data.siren,
            phone_number: data.phone_number,
            address: data.address,
            city: data.city,
            postal_code: data.postal_code
          }
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte');
      }

      const authData = await authResponse.json();
      console.log('✅ Compte utilisateur créé:', authData);

      // 2. Créer le profil client dans la base de données
      const clientResponse = await fetch(`${config.apiUrl}/client/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.access_token}`
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          company_name: data.company_name,
          siren: data.siren,
          phone_number: data.phone_number,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code
        }),
      });

      if (!clientResponse.ok) {
        const errorData = await clientResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la création du profil client');
      }

      const clientData = await clientResponse.json();
      console.log('✅ Profil client créé:', clientData);

      // 3. Mettre à jour le contexte d'authentification
      setUser({
        id: authData.user.id,
        email: data.email,
        type: 'client',
        username: data.username,
        company_name: data.company_name
      });

      toast({
        title: "Inscription réussie !",
        description: "Votre compte client a été créé avec succès.",
        variant: "default"
      });

      // 4. Rediriger vers le dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      toast({
        title: "Erreur d'inscription",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Inscription Client
            </CardTitle>
            <p className="text-gray-600">
              Créez votre compte client pour accéder à nos services
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom d'utilisateur
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom d'utilisateur" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email professionnel
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@entreprise.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Mot de passe
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirmer le mot de passe
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Nom de l'entreprise
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de votre entreprise" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Numéro SIREN
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="01 23 45 67 89" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresse
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="123 Rue de la Paix" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Ville
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Code postal
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="75001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création du compte...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <button
                  onClick={() => navigate('/connexion-client')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Se connecter
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Ou{' '}
                <button
                  onClick={() => navigate('/simulateur')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  tester notre simulateur d'éligibilité
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InscriptionClient;