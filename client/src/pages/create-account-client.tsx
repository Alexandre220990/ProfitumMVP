import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Building, Phone, MapPin, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { RegisterCredentials } from "@/types/api";

const formSchema = z.object({ username: z.string().optional(), email: z.string().email("Email invalide"), password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"), company_name: z.string().min(1, "Le nom de l'entreprise est requis"), phone_number: z.string().min(1, "Le numéro de téléphone est requis"), address: z.string().min(1, "L'adresse est requise"), city: z.string().min(1, "La ville est requise"), postal_code: z.string().min(1, "Le code postal est requis"), siren: z.string().min(1, "Le numéro SIREN est requis") });

type FormData = RegisterCredentials & { siren: string; };

export default function CreateAccountClient() { const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: {
      username: "", email: "", password: "", company_name: "", phone_number: "", address: "", city: "", postal_code: "", siren: "" },
  });

  const onSubmit = async (data: FormData) => { try {
      setIsLoading(true);

      const cleanSiren = data.siren.replace(/\D/g, "");

      const response = await fetch(`${import.meta.env.VITE_API_URL }/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, siren: cleanSiren, type: "client" }),
      });

      const json = await response.json();

      if (!json.success || !json.data) { 
        throw new Error(json.message || "Erreur lors de l'inscription"); 
      }

      const { token, user } = json.data;

      if (!token || !user) { 
        toast({
          title: "Erreur", 
          description: "Données utilisateur incomplètes", 
          variant: "destructive" 
        });
        return;
      }

      localStorage.setItem("token", token);
      setUser(user);

      toast({ 
        title: "Inscription réussie", 
        description: `Bienvenue ${user.username || user.email}`,
      });

      navigate(`/dashboard/client/${user.id}`);
    } catch (error) { console.error("❌ Erreur d'inscription: ", error);
      toast({
        title: "Erreur", description: error instanceof Error ? error.message : "Une erreur est survenue", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const formFields = [{ name: "username", label: "Nom d'utilisateur", icon: User },
    { name: "email", label: "Email", icon: Mail, type: "email" },
    { name: "password", label: "Mot de passe", icon: Lock, type: "password" },
    { name: "company_name", label: "Nom de l'entreprise", icon: Building },
    { name: "phone_number", label: "Téléphone", icon: Phone },
    { name: "address", label: "Adresse", icon: MapPin },
    { name: "city", label: "Ville", icon: MapPin },
    { name: "postal_code", label: "Code postal", icon: FileText },
    { name: "siren", label: "Numéro SIREN", icon: FileText }];

  return (
    <div className="flex min-h-screen bg-gray-50">
      { /* Branding */ }
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Rejoignez Profitum</h1>
        <p className="mt-4 text-lg opacity-90">Créez votre compte client et accédez à nos services</p>
      </div>

      { /* Formulaire */ }
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Créer un compte</h2>
          <p className="text-center text-gray-500">
            Déjà inscrit ?{ " " }
            <Link to="/connexion-client" className="text-blue-600 font-medium hover:underline">
              Connectez-vous
            </Link>
          </p>

          <Form { ...form }>
            <form onSubmit={ form.handleSubmit(onSubmit) } className="space-y-4">
              { formFields.map(({ name, label, icon: Icon, type }) => (
                <FormField
                  key={ name }
                  control={ form.control }
                  name={ name as keyof FormData }
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel>{ label }</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Icon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <Input { ...field } type={ type || "text" } placeholder={ label } className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Button
                type="submit"
                className="w-full py-3 text-lg bg-blue-600 hover: bg-blue-700 text-white font-bold rounded-md transition-all"
                disabled={ isLoading }
              >
                { isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Créer un compte" }
              </Button>
            </form>
          </Form>

          <p className="text-center text-gray-500 text-sm">
            En vous inscrivant, vous acceptez nos{ " " }
            <Link to="/conditions" className="text-blue-600 font-medium hover:underline">
              conditions d'utilisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}