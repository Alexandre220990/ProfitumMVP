import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Request, type Quote, type Appointment } from "@shared/schema";

export default function PartnerDashboard() {
  const { user, isLoading, logout } = useAuth();

  // ✅ Récupération des demandes disponibles
  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/requests/available"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/requests/available");
      return res.json();
    },
  });

  // ✅ Récupération des devis partenaires
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["/api/quotes/partner"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/quotes/partner");
      return res.json();
    },
  });

  // ✅ Récupération des rendez-vous
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments/partner"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/appointments/partner");
      return res.json();
    },
  });

  // ✅ Ajoute un écran de chargement si `user` est en cours de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    );
  }

  // ✅ Affiche un message si `user` est `null`
  if (!user) {
    return (
      <div className="flex justify-center min-h-screen items-center">
        <p className="text-gray-500">Utilisateur non authentifié.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord Expert</h1>
            <p className="text-muted-foreground">Bienvenue, {user.email}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={logout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="requests">
          <TabsList className="mb-8">
            <TabsTrigger value="requests">Demandes disponibles</TabsTrigger>
            <TabsTrigger value="quotes">Mes devis</TabsTrigger>
            <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Section title="Demandes disponibles" description="Parcourez et répondez aux demandes des clients">
              {isLoadingRequests ? <Loader /> : <RequestList requests={requests} />}
            </Section>
          </TabsContent>

          <TabsContent value="quotes">
            <Section title="Mes devis" description="Suivez l'état de vos devis soumis">
              {isLoadingQuotes ? <Loader /> : <QuoteList quotes={quotes} />}
            </Section>
          </TabsContent>

          <TabsContent value="appointments">
            <Section title="Rendez-vous" description="Gérez vos rendez-vous programmés">
              {isLoadingAppointments ? <Loader /> : <AppointmentList appointments={appointments} />}
            </Section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ✅ Composant pour afficher un chargement
function Loader() {
  return (
    <div className="flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
}

// ✅ Composant générique pour afficher une section
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      <div className="grid gap-6 mt-4">{children}</div>
    </div>
  );
}

// ✅ Liste des demandes disponibles
function RequestList({ requests }: { requests?: Request[] }) {
  if (!requests || requests.length === 0) return <p className="text-gray-500">Aucune demande disponible.</p>;

  return requests.map((request) => (
    <Card key={request.id}>
      <CardHeader>
        <CardTitle>{request.title}</CardTitle>
        <CardDescription>Posté le {format(new Date(request.createdAt!), "PPP")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{request.description}</p>
        <Badge>{request.status}</Badge>
      </CardContent>
    </Card>
  ));
}

// ✅ Liste des devis partenaires
function QuoteList({ quotes }: { quotes?: Quote[] }) {
  if (!quotes || quotes.length === 0) return <p className="text-gray-500">Aucun devis soumis.</p>;

  return quotes.map((quote) => (
    <Card key={quote.id}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-lg">€{quote.amount}</p>
            <p className="text-muted-foreground">{quote.description}</p>
          </div>
          <Badge variant={quote.status === "accepted" ? "default" : "secondary"}>{quote.status}</Badge>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Soumis le {format(new Date(quote.createdAt!), "PPP")}
        </div>
      </CardContent>
    </Card>
  ));
}

// ✅ Liste des rendez-vous
function AppointmentList({ appointments }: { appointments?: Appointment[] }) {
  if (!appointments || appointments.length === 0) return <p className="text-gray-500">Aucun rendez-vous prévu.</p>;

  return appointments.map((appointment) => (
    <Card key={appointment.id}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {format(new Date(appointment.datetime!), "PPP 'à' p")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Statut : {appointment.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ));
}
