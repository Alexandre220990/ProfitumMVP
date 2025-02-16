import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { UserCircle, Mail, Lock, Building, Phone, MapPin, FileText } from "lucide-react";
import { Link } from "wouter";

export default function CreateAccountClient() {
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(createClientSchema),
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
      siret: "",
      type: "client",
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: () => {
      setLocation("/dashboard/client");
    },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Section Branding (Gauche) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Rejoignez Profitum dès aujourd’hui !</h1>
        <p className="mt-4 text-lg opacity-90">
          Accédez à des experts de confiance et faites évoluer votre entreprise sans effort.
        </p>
        <Building className="w-16 h-16 mt-6 text-white opacity-90" />
        <p className="mt-2 text-sm opacity-80">
          Un réseau puissant, sécurisé et conçu pour votre succès.
        </p>
      </div>

      {/* Section Formulaire (Droite) */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Créer un compte</h2>
          <p className="text-center text-gray-500">
            Déjà inscrit ?{" "}
            <Link href="/connexion-client" className="text-blue-600 font-medium hover:underline">
              Connectez-vous
            </Link>
          </p>

          {/* Formulaire */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(() => {
                const formData = form.getValues();
                if (!formData.email || !formData.password) {
                  console.error("Données invalides ou incomplètes :", formData);
                  return;
                }
                createAccountMutation.mutate(formData, {
                  onSuccess: () => setLocation("/dashboard/client"),
                  onError: (error) => console.error("Erreur lors de la création du compte :", error),
                });
              })}
              className="grid grid-cols-1 gap-5"
            >
              {/* Champs d'inscription */}
              {[
                { name: "username", label: "Nom d'utilisateur", type: "text", icon: UserCircle },
                { name: "email", label: "Adresse e-mail", type: "email", icon: Mail },
                { name: "password", label: "Mot de passe", type: "password", icon: Lock },
                { name: "confirmPassword", label: "Confirmer le mot de passe", type: "password", icon: Lock },
                { name: "company_name", label: "Nom de l'entreprise", type: "text", icon: Building },
                { name: "phone_number", label: "Numéro de téléphone", type: "tel", icon: Phone },
                { name: "address", label: "Adresse", type: "text", icon: MapPin },
                { name: "city", label: "Ville", type: "text", icon: MapPin },
                { name: "postal_code", label: "Code postal", type: "text", icon: FileText },
                { name: "siret", label: "Numéro SIRET", type: "text", icon: FileText },
              ].map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: controller }) => (
                    <FormItem>
                      <FormLabel className="text-lg">{field.label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <field.icon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <Input
                            type={field.type}
                            {...controller}
                            className="py-3 px-4 pl-10 text-lg border-gray-300 focus:ring-2 focus:ring-blue-500 w-full rounded-md"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all"
                disabled={createAccountMutation.isPending}
              >
                {createAccountMutation.isPending ? "Création en cours..." : "Créer un compte"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-gray-500 text-sm">
            En vous inscrivant, vous acceptez nos{" "}
            <Link href="/conditions" className="text-blue-600 font-medium hover:underline">
              conditions d’utilisation
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
