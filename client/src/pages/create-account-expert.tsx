import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle, Mail, Lock, Building, MapPin, FileText, CreditCard, Calendar, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { post } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { RegisterCredentials, UserType, AuthData } from "@/types/api";

// Schéma de validation du formulaire
const formSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  company_name: z.string().min(1, "Nom de l'entreprise requis"),
  siren: z.string().min(9, "SIREN invalide").max(9, "SIREN invalide"),
  specializations: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  card_number: z.string().min(16, "Numéro de carte invalide").max(19),
  card_expiry: z.string().min(5, "Format MM/AA requis").max(5),
  card_cvc: z.string().min(3, "Code CVC invalide").max(4),
  abonnement: z.enum(["mensuel", "annuel"], {
    required_error: "Veuillez choisir un abonnement"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof formSchema>;

// Configuration des champs du formulaire
const formFields = [
  { name: "name", label: "Nom complet", icon: UserCircle, type: "text" },
  { name: "email", label: "Email", icon: Mail, type: "email" },
  { name: "password", label: "Mot de passe", icon: Lock, type: "password" },
  { name: "confirmPassword", label: "Confirmer le mot de passe", icon: Lock, type: "password" },
  { name: "company_name", label: "Nom de l'entreprise", icon: Building, type: "text" },
  { name: "siren", label: "Numéro SIREN", icon: FileText, type: "text" },
  { name: "specializations", label: "Spécialisations", icon: FileText, type: "text" },
  { name: "experience", label: "Expérience", icon: FileText, type: "text" },
  { name: "location", label: "Localisation", icon: MapPin, type: "text" },
  { name: "description", label: "Description", icon: FileText, type: "text" },
  { name: "card_number", label: "Numéro de carte", icon: CreditCard, type: "text" }
] as const;

export default function CreateAccountExpert() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      company_name: "",
      siren: "",
      specializations: "",
      experience: "",
      location: "",
      description: "",
      card_number: "",
      card_expiry: "",
      card_cvc: "",
      abonnement: "mensuel"
    },
  });

  // Conversion d'AuthUser vers UserType
  const convertAuthUserToUserType = (authUser: any): UserType => ({
    ...authUser,
    experience: authUser.experience?.toString()
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const cleanSiren = data.siren.replace(/\D/g, "");

      const registerData: RegisterCredentials = {
        email: data.email,
        password: data.password,
        name: data.name,
        company_name: data.company_name,
        siren: cleanSiren,
        specializations: data.specializations?.split(", ").map(s => s.trim()),
        experience: data.experience,
        location: data.location,
        description: data.description,
        card_number: data.card_number,
        card_expiry: data.card_expiry,
        card_cvc: data.card_cvc,
        abonnement: data.abonnement,
        type: "expert"
      };

      const response = await post<AuthData>("/api/auth/register", registerData);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors de l'inscription");
      }

      // response.data est maintenant de type AuthData (non-null)
      const { token, user } = response.data;

      if (!token || !user) {
        toast.error("Données utilisateur incomplètes");
        return;
      }

      // Stocker le token et convertir l'utilisateur
      localStorage.setItem("token", token);
      const userType = convertAuthUserToUserType(user);
      setUser(userType);

      toast.success("Compte expert créé avec succès");

      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Erreur d'inscription: ", error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Section de présentation */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Rejoignez Profitum en tant qu'expert !</h1>
        <p className="mt-4 text-lg opacity-90">
          Développez votre activité et connectez-vous avec des clients de qualité.
        </p>
        <Building className="w-16 h-16 mt-6 text-white opacity-90" />
        <p className="mt-2 text-sm opacity-80">
          Un réseau puissant, sécurisé et conçu pour votre succès.
        </p>
      </div>

      {/* Formulaire d'inscription */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Créer un compte expert</h2>
          <p className="text-center text-gray-500">
            Déjà inscrit ?{" "}
            <Link to="/connexion-expert" className="text-blue-600 font-medium hover:underline">
              Connectez-vous
            </Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Champs principaux */}
              {formFields.map(({ name, label, icon: Icon, type }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof FormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Icon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <Input {...field} placeholder={label} type={type} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Champs de carte bancaire */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="card_expiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'expiration</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <Input {...field} placeholder="MM/AA" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="card_cvc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code CVC</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <Input {...field} placeholder="123" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sélection d'abonnement */}
              <FormField
                control={form.control}
                name="abonnement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'abonnement</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={field.value === "mensuel" ? "default" : "outline"}
                          className="w-full"
                          onClick={() => field.onChange("mensuel")}
                        >
                          Mensuel
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "annuel" ? "default" : "outline"}
                          className="w-full"
                          onClick={() => field.onChange("annuel")}
                        >
                          Annuel
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bouton de soumission */}
              <Button
                type="submit"
                className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Créer un compte expert"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-gray-500 text-sm">
            En vous inscrivant, vous acceptez nos{" "}
            <Link to="/conditions" className="text-blue-600 font-medium hover:underline">
              conditions d'utilisation
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}