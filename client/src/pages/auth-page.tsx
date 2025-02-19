console.log("Rendering AuthPage");

import { useState, useEffect } from "react";
  import { useAuth } from "@/hooks/use-auth";
  import { useLocation } from "wouter";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import { useForm } from "react-hook-form";
  import { useToast } from "@/hooks/use-toast";
  import { Loader2 } from "lucide-react";

  const AuthPage = () => {
    const { loginMutation, registerMutation, isLoading, user } = useAuth(); // ✅ Récupération de `user`
    const [isLogin, setIsLogin] = useState(true);
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    // **✅ Rediriger immédiatement si l'utilisateur est déjà connecté**
    useEffect(() => {
      if (user) {
        console.log("AuthPage - User already logged in, redirecting...");
        setLocation(user.type === "client" ? `/dashboard/client/${user.id}` : "/dashboard/partner");
      }
    }, [user, setLocation]);

    const form = useForm({
      defaultValues: {
        email: "",
        password: "",
        username: "", // ✅ Ajout de username
      },
    });

    const onSubmit = async (data: { email: string; password: string; username?: string }) => {
      try {
        console.log("AuthPage - Form submitted:", { ...data, password: "[HIDDEN]" });

        let response;
        if (isLogin) {
          console.log("AuthPage - Attempting login");
          response = await loginMutation.mutateAsync(data);
        } else {
          console.log("AuthPage - Attempting registration");
          response = await registerMutation.mutateAsync({
            ...data,
            username: data.username || data.email.split("@")[0], // ✅ Si username n'est pas rempli, on utilise l'email
          });
        }

        toast({ title: "Succès", description: "Authentification réussie !" });

        // ✅ Correction : Utilisation correcte de `response`
        setLocation(response.type === "client" ? `/dashboard/client/${response.id}` : "/dashboard/partner");

      } catch (error: any) {
        console.error("AuthPage - Error during authentication:", error);
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Connexion" : "Inscription"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ✅ Ajout du champ username uniquement en mode inscription */}
                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isLogin ? "Se connecter" : "S'inscrire"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  };

  export default AuthPage;
