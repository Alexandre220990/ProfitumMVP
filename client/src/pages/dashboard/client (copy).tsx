import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema, type Request, type Quote } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue, {user.username}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Mes demandes</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle demande</DialogTitle>
                <DialogDescription>
                  Soumettez une nouvelle demande de consultation experte
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createRequestMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Soumettre la demande
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingRequests ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6">
            {requests?.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription>
                        Soumis le {format(new Date(request.createdAt!), "PPP")}
                      </CardDescription>
                    </div>
                    <Badge>{request.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{request.description}</p>
                  {request.status === "quoted" && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Devis reçus</h4>
                      <QueryQuotes requestId={request.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function QueryQuotes({ requestId }: { requestId: number }) {
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", requestId],
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {quotes?.map((quote) => (
        <Card key={quote.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">€{quote.amount}</p>
                <p className="text-sm text-muted-foreground">{quote.description}</p>
              </div>
              <Badge variant={quote.status === "accepted" ? "default" : "secondary"}>
                {quote.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}