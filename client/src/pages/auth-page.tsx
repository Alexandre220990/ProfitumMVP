import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { Link } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      if (!res.ok) {
        throw new Error("Échec de la connexion");
      }
      return res.json();
    },
    onSuccess: () => {
      setLocation("/dashboard");
    },
    onError: (error) => {
      console.error("Erreur de connexion :", error);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              console.log("Données envoyées :", data); // Vérifier les valeurs en console

              if (!data || !data.email || !data.password) {
                console.error("Données invalides : ", data);
                return;
              }

              loginMutation.mutate(
                { email: data.email, password: data.password }, // 💡 S'assure que l'objet envoyé est correct
                {
                  onSuccess: (res) => console.log("Connexion réussie :", res),
                  onError: (err) => console.error("Erreur de connexion :", err),
                }
              );
            })}
            className="space-y-4"
          >

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p className="text-muted-foreground">Pas encore de compte ?</p>
          <Link href="/client/src/pages/create-account-client">
            <Button variant="outline" className="mt-2">Créer un compte</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
