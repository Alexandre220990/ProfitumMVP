import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  FileText,
  MessageSquare,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Save
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  company: z.string().min(2, "Nom de l'entreprise requis"),
  revenuAnnuel: z.string().optional(),
  secteurActivite: z.string().optional(),
  nombreEmployes: z.string().optional(),
  ancienneteEntreprise: z.string().optional(),
  besoinFinancement: z.string().optional(),
  typeProjet: z.string().optional(),
});

const ClientProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const defaultValues = {
    name: "Marie Martin",
    email: "marie.martin@entreprise.com",
    phone: "+33 6 98 76 54 32",
    company: "Transport Express Sud",
    revenuAnnuel: "1500000",
    secteurActivite: "Transport routier",
    nombreEmployes: "45",
    ancienneteEntreprise: "10",
    besoinFinancement: "50000",
    typeProjet: "Optimisation fiscale",
  };

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    toast({
      title: "Profil mis à jour",
      description: "Vos modifications ont été enregistrées avec succès.",
    });
    setIsEditing(false);
  };

  const stats = [
    { icon: FileText, label: "Dossiers en cours", value: "3" },
    { icon: CheckCircle, label: "Dossiers complétés", value: "8" },
    { icon: MessageSquare, label: "Messages", value: "12" },
    { icon: Building2, label: "Économies réalisées", value: "45k€" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mon Profil Client</h1>
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
                Vos informations de contact
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
                  name="phone"
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
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
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
              <CardTitle>Informations Entreprise</CardTitle>
              <CardDescription>
                Les informations concernant votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="revenuAnnuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenu Annuel</FormLabel>
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
                  name="secteurActivite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur d'activité</FormLabel>
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
                  name="nombreEmployes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'employés</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
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
                  name="ancienneteEntreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancienneté de l'entreprise</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          disabled={!isEditing}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="besoinFinancement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Besoin de financement</FormLabel>
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
                name="typeProjet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de projet</FormLabel>
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
            </CardContent>
          </Card>

          {isEditing && (
            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ClientProfile;
