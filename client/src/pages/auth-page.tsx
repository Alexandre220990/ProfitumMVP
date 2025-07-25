import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthPage = () => { 
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const form = useForm({ 
    defaultValues: {
      email: "", 
      password: "", 
      username: "" 
    },
  });

  const onSubmit = async (data: { email: string; password: string; username?: string }) => { 
    try {
      console.log("AuthPage - Form submitted: ", { ...data, password: "[HIDDEN]" });

      if (isLogin) { 
        console.log("AuthPage - Attempting login");
        await login({
          email: data.email,
          password: data.password,
          type: "client" // ou déterminer le type dynamiquement
        });
      } else { 
        console.log("AuthPage - Attempting registration");
        await register({
          email: data.email,
          password: data.password,
          name: data.username || data.email.split("@")[0],
          type: "client" // ou déterminer le type dynamiquement
        });
      }

      // La redirection est gérée dans le hook useAuth
      toast({ title: "Succès", description: "Authentification réussie !" });

    } catch (error: any) { 
      console.error("AuthPage - Error during authentication: ", error);
      toast({
        title: "Erreur", 
        description: error.message || "Une erreur est survenue", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            { isLogin ? "Connexion" : "Inscription" }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form { ...form }>
            <form onSubmit={ form.handleSubmit(onSubmit) } className="space-y-4">
              <FormField
                control={ form.control }
                name="email"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input { ...field } type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ form.control }
                name="password"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input { ...field } type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              { !isLogin && (
                <FormField
                  control={form.control }
                  name="username"
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input { ...field } type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={ isLoading }>
                { isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null }
                { isLogin ? "Se connecter" : "S'inscrire" }
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={ () => setIsLogin(!isLogin) }
              >
                { isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter" }
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;