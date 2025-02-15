import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ClientDashboard from "@/pages/dashboard/client";
import PartnerDashboard from "@/pages/dashboard/partner";
import ServicesPage from "@/pages/services-page";
import CreateAccountClient from "@/pages/create-account-client";
import { ProtectedRoute } from "@/lib/protected-route";
import Simulateur from "@/pages/simulateur";
import Questionnaire from "@/components/Questionnaire";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/services" component={ServicesPage} />
      <ProtectedRoute path="/dashboard/client" component={ClientDashboard} />
      <ProtectedRoute path="/dashboard/partner" component={PartnerDashboard} />
      <Route path="/create-account-client" component={CreateAccountClient} />
      <Route path="/simulateur" component={Simulateur} />
      <Route path="/questionnaire" component={Questionnaire} />  {/* 🚀 Nouvelle route ajoutée */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
