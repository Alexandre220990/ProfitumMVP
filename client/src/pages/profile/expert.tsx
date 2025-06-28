// Core React imports
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import { Building2, Trophy, MessageSquare, Star, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Custom Components
import HeaderExpert from "@/components/HeaderExpert";

// Hooks and Utils
import { useToast } from "@/hooks/use-toast";
import { get, post } from "@/lib/api";

// Types
import { PublicExpert } from '@/types/expert';
import { ApiResponse } from '@/types/api';

// Liste des produits éligibles
const eligibleProducts = [
  { id: "ticpe", label: "TICPE" },
  { id: "msa", label: "MSA" },
  { id: "foncier", label: "Taxe Foncière" },
  { id: "dfs", label: "DFS" },
  { id: "social", label: "Social & URSSAF" },
  { id: "energetique", label: "Audit Énergétique" },
];

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone_number: z.string().min(10, "Numéro de téléphone invalide"),
  company_name: z.string().min(2, "Nom de l'entreprise requis"),
  siren: z.string().min(9, "Numéro SIREN invalide"),
  specializations: z.array(z.string()).min(1, "Au moins une spécialisation est requise"),
  experience: z.string().min(1, "Années d'expérience requises"),
  description: z.string().min(10, "Description trop courte"),
  location: z.string().min(2, "Localisation requise"),
});

const ExpertProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(["ticpe"]);
  const [expert, setExpert] = useState<PublicExpert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultValues = {
    name: "Jean Dupont",
    email: "expert.ticpe@profitum.fr",
    phone_number: "+33 6 12 34 56 78",
    company_name: "Expertise Fiscale Plus",
    siren: "123456789",
    specializations: ["ticpe"],
    experience: "15",
    description: "Expert en optimisation fiscale avec plus de 15 ans d'expérience...",
    location: "Paris",
  };

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const response = await get<ApiResponse<PublicExpert>>('/experts/me');
        
        if (response.success && response.data) {
          const expertData = response.data as unknown as PublicExpert;
          setExpert(expertData);
          
          // Mise à jour du formulaire avec les données
          Object.entries(expertData).forEach(([key, value]) => {
            if (form.getValues(key as any) !== undefined) {
              form.setValue(key as any, value);
            }
          });
        } else {
          const message = response.message || 'Erreur lors de la récupération des données';
          setError(message);
          toast({
            title: 'Erreur',
            description: message,
            variant: 'destructive',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des données';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpert();
  }, [toast, form]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const response = await post<ApiResponse<PublicExpert>>('/experts/me', { 
        ...data, 
        specializations: data.specializations.map(String) 
      });
      
      if (response.success && response.data) {
        const updatedExpert = response.data as unknown as PublicExpert;
        setExpert(updatedExpert);
        
        toast({
          title: 'Succès',
          description: 'Profil mis à jour avec succès',
          variant: 'default',
        });
        setIsEditing(false);
      } else {
        const message = response.message || 'Erreur lors de la mise à jour du profil';
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const stats = [
    { icon: Trophy, label: "Dossiers complétés", value: "127" },
    { icon: MessageSquare, label: "Avis clients", value: "84" },
    { icon: Star, label: "Note moyenne", value: "4.8/5" },
    { icon: Building2, label: "Années d'expérience", value: "15" },
  ];

  const toggleSpecialization = (specialization: string) => {
    setSelectedSpecializations(current => {
      if (current.includes(specialization)) {
        return current.filter(spec => spec !== specialization);
      } else {
        return [...current, specialization];
      }
    });
    
    // Mettre à jour le formulaire
    const currentValues = form.getValues().specializations || [];
    if (currentValues.includes(specialization)) {
      form.setValue("specializations", currentValues.filter(spec => spec !== specialization));
    } else {
      form.setValue("specializations", [...currentValues, specialization]);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!expert) {
    return <div>Expert non trouvé</div>;
  }

  return (
    <>
      <HeaderExpert />
      <div className="container mx-auto p-6 pt-28 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mon Profil Expert</h1>
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "destructive" : "default"}
          >
            {isEditing ? "Annuler" : "Modifier le profil"}
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>
                  Vos informations de contact et détails professionnels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            className="bg-background"
                          />
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
                          <Input 
                            {...field} 
                            type="email"
                            disabled={!isEditing}
                            className="bg-background"
                          />
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
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localisation</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations Professionnelles</CardTitle>
                <CardDescription>
                  Vos qualifications et expérience professionnelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cabinet / Entreprise</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Années d'expérience</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditing}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Sélectionnez une tranche d'expérience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-3">1-3 ans</SelectItem>
                            <SelectItem value="3-5">3-5 ans</SelectItem>
                            <SelectItem value="5-10">5-10 ans</SelectItem>
                            <SelectItem value="10+">10 ans et plus</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siren"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro SIREN</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specializations"
                    render={() => (
                      <FormItem className="col-span-2">
                        <FormLabel>Spécialisations</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                            {eligibleProducts.map((product) => (
                              <div key={product.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`specialization-${product.id}`}
                                  checked={selectedSpecializations.includes(product.id)}
                                  onCheckedChange={() => isEditing && toggleSpecialization(product.id)}
                                  disabled={!isEditing}
                                />
                                <label
                                  htmlFor={`specialization-${product.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {product.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                            disabled={!isEditing}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ExpertProfile;
