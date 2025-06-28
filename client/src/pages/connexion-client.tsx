import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormData = z.infer<typeof formSchema>;

export default function ConnexionClient() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      console.log("🔐 Tentative de connexion avec Supabase...");

      // Utiliser le hook d'authentification qui utilise Supabase
      await login({
        email: data.email,
        password: data.password,
        type: "client"
      });

      console.log("✅ Connexion réussie avec Supabase");
      
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Section Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Bienvenue sur Profitum</h1>
        <p className="mt-4 text-lg opacity-90">Connectez-vous pour accéder à votre espace client</p>
      </div>

      {/* Section Formulaire */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Connexion</h2>
          <p className="text-center text-gray-500">
            Pas encore de compte ?{" "}
            <Link to="/create-account-client" className="text-blue-600 font-medium hover:underline">
              Créez-en un
            </Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <Input type="email" placeholder="john@example.com" {...field} className="pl-10" />
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
                        <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <Input type="password" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button type="submit" className="w-full">
                  Se connecter
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/dashboard/client/demo")}
                >
                  Accéder à la démo
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Retour à l'accueil
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center">
            <Link to="/mot-de-passe-oublie" className="text-sm text-blue-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
