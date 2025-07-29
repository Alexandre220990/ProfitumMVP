import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Building, Phone, MapPin, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SirenValidationField } from "@/components/SirenValidationField";
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Rejoignez Profitum</h1>
        <p className="mt-4 text-lg opacity-90">
          Créez votre compte client et accédez à nos services d'optimisation fiscale
        </p>
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Simulation gratuite et personnalisée</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Optimisations fiscales sur mesure</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Accompagnement expert dédié</span>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Inscription Client</CardTitle>
            <p className="text-gray-600">Créez votre compte en quelques étapes</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} className="pl-10" placeholder="Votre nom d'utilisateur" />
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
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} type="email" className="pl-10" placeholder="votre@email.com" />
                        </div>
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
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} type="password" className="pl-10" placeholder="••••••••" />
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
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} type="password" className="pl-10" placeholder="••••••••" />
                        </div>
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
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} className="pl-10" placeholder="Nom de votre entreprise" />
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
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} className="pl-10" placeholder="0123456789" />
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
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} className="pl-10" placeholder="123 Rue de la Paix" />
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
                      Création en cours...
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InscriptionClient;