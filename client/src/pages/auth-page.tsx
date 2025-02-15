import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Phone, MapPin, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { registerMutation, loginMutation, user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // ✅ Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      console.log("Utilisateur connecté, redirection vers /dashboard/client");
      setLocation("/dashboard/client");
    }
  }, [user, setLocation]);

  // ✅ Changement automatique de mode selon l'URL
  useEffect(() => {
    setIsLogin(window.location.pathname === "/auth");
  }, []);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      type: "client",
      username: "",
      email: "",
      password: "",
      companyName: "",
      phoneNumber: "",
      address: "",
      city: "",
      postalCode: "",
      siret: "",
    },
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      if (isLogin) {
        console.log("Tentative de connexion avec :", data);
        await loginMutation.mutateAsync({
          email: data.email,
          password: data.password,
        });
      } else {
        console.log("Tentative d'inscription avec :", data);
        await registerMutation.mutateAsync({
          ...data,
          type: "client",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'authentification :", error);
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
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Connexion Client" : "Inscription Client"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ Loader global si la session est en chargement */}
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* ✅ Affichage des champs pour l'inscription */}
                {!isLogin && (
                  <>
                    <FormField control={form.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="companyName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {/* ✅ Email */}
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} type="email" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ✅ Mot de passe */}
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ✅ Affichage des champs supplémentaires pour l'inscription */}
                {!isLogin && (
                  <>
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {/* ✅ Bouton de soumission avec Loader */}
                <Button type="submit" className="w-full flex justify-center" disabled={registerMutation.isPending || loginMutation.isPending}>
                  {(registerMutation.isPending || loginMutation.isPending) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isLogin ? "Se connecter" : "S'inscrire"}
                </Button>

                {/* ✅ Changement de mode (Connexion <-> Inscription) */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setLocation(isLogin ? "/create-account-client" : "/auth");
                  }}
                >
                  {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
