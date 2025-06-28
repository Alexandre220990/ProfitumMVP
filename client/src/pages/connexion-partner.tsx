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
  password: z.string().min(6, "Le mot de passe est requis"),
});

type FormData = z.infer<typeof formSchema>;

export default function ConnexionPartner() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          type: "expert"
        }),
      });

      const json = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.message || "Erreur lors de la connexion");
      }

      const { token, user } = json.data;

      if (!token || !user) {
        toast({
          title: "Erreur",
          description: "Données utilisateur incomplètes",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("token", token);
      setUser(user);

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.username || user.email}`,
      });

      navigate("/dashboard");
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
        <h1 className="text-4xl font-extrabold">Bienvenue sur Profitum !</h1>
        <p className="mt-4 text-lg opacity-90">
          Connectez-vous à votre compte expert et gérez vos clients.
        </p>
        <p className="mt-2 text-sm opacity-80">
          Un réseau puissant, sécurisé et conçu pour votre succès.
        </p>
      </div>

      {/* Section Formulaire */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Connexion Expert</h2>
          <p className="text-center text-gray-500">
            Pas encore inscrit ?{" "}
            <Link to="/create-account-expert" className="text-blue-600 font-medium hover:underline">
              Créez un compte
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
                        <Input type="email" placeholder="expert@example.com" {...field} className="pl-10" />
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Se connecter"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard/expert")}
                  className="w-full"
                >
                  Voir la démo
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
