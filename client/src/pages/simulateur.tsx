import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema, type Request } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Questionnaire from "@/components/Questionnaire";

export default function Simulateur() { // ✅ Exportation par défaut ajoutée
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Simulateur</h1>
      <p className="mt-2 text-gray-600">Bienvenue dans le simulateur.</p>

      {/* ✅ Ajout du questionnaire ici */}
      <div className="mt-6">
        <Questionnaire />
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: requests, isLoading: isLoadingRequests } = useQuery<Request[]>({
    queryKey: ["/api/requests/client"],
  });

  const form = useForm({
    resolver: zodResolver(insertRequestSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/client"] });
      form.reset();
    },
  });

  if (!user) return null;

  const eligibleAudits = [
    { name: "Audit financier", description: "Analyse des états financiers d'une entreprise." },
    { name: "Audit fiscal", description: "Vérification des obligations fiscales et des déclarations." },
    { name: "Audit de conformité", description: "Évaluation du respect des réglementations en vigueur." },
    { name: "Audit de performance", description: "Analyse de l'efficacité et de la productivité des processus." },
    { name: "Audit de gestion", description: "Examen des pratiques de gestion et des stratégies organisationnelles." },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <header className="border-b mb-6">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue, {user.username}</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>Déconnexion</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle demande</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle demande</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createRequestMutation.mutate(data))} className="space-y-4">
                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={createRequestMutation.isPending}>
                        {createRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Soumettre
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <div className="flex flex-col gap-4 mt-4">
                <Link href="/simulateur">
                  <Button className="w-full bg-green-600 text-white hover:bg-green-700">Effectuer une simulation</Button>
                </Link>
                <Link href="/reports">
                  <Button className="w-full bg-gray-600 text-white hover:bg-gray-700">Accéder aux rapports</Button>
                </Link>
              </div>
              <div className="mt-6">
                <h2 className="text-xl font-bold">Audits disponibles</h2>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  {eligibleAudits.map((audit, index) => (
                    <li key={index}>
                      <span className="font-semibold">{audit.name}:</span> {audit.description}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ✅ Export unique pour éviter les erreurs
export { Simulateur, ClientDashboard };
