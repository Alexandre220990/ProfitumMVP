import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteSchema, type Request, type Quote, type Appointment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PartnerDashboard() {
  const { user, logoutMutation } = useAuth();

  const { data: requests, isLoading: isLoadingRequests } = useQuery<Request[]>({
    queryKey: ["/api/requests/available"],
  });

  const { data: quotes, isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes/partner"],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord Expert</h1>
            <p className="text-muted-foreground">Bienvenue, {user.name}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="requests">
          <TabsList className="mb-8">
            <TabsTrigger value="requests">Available Requests</TabsTrigger>
            <TabsTrigger value="quotes">My Quotes</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Available Requests</h2>
              <p className="text-muted-foreground">Browse and submit quotes for client requests</p>
            </div>

            {isLoadingRequests ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-6">
                {requests?.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">My Quotes</h2>
              <p className="text-muted-foreground">Track the status of your submitted quotes</p>
            </div>

            {isLoadingQuotes ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-6">
                {quotes?.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appointments">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Appointments</h2>
              <p className="text-muted-foreground">Manage your scheduled appointments</p>
            </div>
            <AppointmentsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function RequestCard({ request }: { request: Request }) {
  const form = useForm({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      requestId: request.id,
      amount: 0,
      description: "",
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: { requestId: number; amount: number; description: string }) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/partner"] });
      form.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{request.title}</CardTitle>
            <CardDescription>
              Posted on {format(new Date(request.createdAt), "PPP")}
            </CardDescription>
          </div>
          <Badge>{request.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">{request.description}</p>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Submit Quote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Quote</DialogTitle>
              <DialogDescription>
                Provide your quote for this request
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createQuoteMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (€)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                  <Button type="submit" disabled={createQuoteMutation.isPending}>
                    {createQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Quote
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-lg">€{quote.amount}</p>
            <p className="text-muted-foreground">{quote.description}</p>
          </div>
          <Badge variant={quote.status === "accepted" ? "default" : "secondary"}>
            {quote.status}
          </Badge>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Submitted on {format(new Date(quote.createdAt), "PPP")}
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentsList() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/partner"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {appointments?.map((appointment) => (
        <Card key={appointment.id}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(appointment.datetime), "PPP 'at' p")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {appointment.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}