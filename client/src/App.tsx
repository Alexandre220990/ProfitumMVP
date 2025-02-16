import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth"; 
import Dashboard from "@/pages/dashboard/client";
import Simulateur from "@/pages/simulateur";
import TICPE from "@/pages/audit/TICPE";
import Foncier from "@/pages/audit/foncier";
import MSA from "@/pages/audit/msa";
import DFS from "@/pages/audit/dfs";
import Social from "@/pages/audit/social";
import ExpertPage from "@/pages/expert-page";
import Reports from "@/pages/reports";
import CharteSignature from "@/pages/charte-signature";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import PartnerDashboard from "@/pages/dashboard/partner";
import DossierDetails from "@/pages/dossier-details";
import NosServices from "@/pages/Nos-Services";
import Tarifs from "@/pages/Tarifs";
import Experts from "@/pages/experts";
import Starter from "@/pages/starter";
import Growth from "@/pages/Growth";
import Scale from "@/pages/Scale";
import Paiement from "@/pages/Paiement";
import ProfilClient from "@/pages/ProfilClient";
import DetailsDossier from "@/pages/DetailsDossier";
import MarketplaceExperts from "@/pages/marketplace-experts";
import CreateAccountClient from "@/pages/create-account-client";
import ConnexionClient from "@/pages/connexion-client";
import ConnexionPartner from "@/pages/connexion-partner";
import ConditionsUtilisation from "@/pages/conditions-utilisation";

function Router() {
  const { user, isLoading } = useUser();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If user is logged in, show the respective dashboard
  if (user) {
    return (
      <Switch>
        <Route path="/" component={user.type === "partner" ? PartnerDashboard : Dashboard} />
        <Route path="/dashboard/client" component={Dashboard} />
        <Route path="/dashboard/partner" component={PartnerDashboard} />
        <Route path="/simulateur" component={Simulateur} />
        <Route path="/audit/msa" component={MSA} />
        <Route path="/audit/dfs" component={DFS} />
        <Route path="/audit/:type/expert/:id" component={ExpertPage} />
        <Route path="/audit/:type/sign-charte" component={CharteSignature} />
        <Route path="/audit/TICPE" component={TICPE} />
        <Route path="/audit/foncier" component={Foncier} />
        <Route path="/audit/social" component={Social} />
        <Route path="/reports" component={Reports} />
        <Route path="/dossier/:id" component={DossierDetails} />
        <Route path="/nos-services" component={NosServices} />
        <Route path="/experts" component={Experts} />
        <Route path="/tarifs" component={Tarifs} />
        <Route path="/starter" component={Starter} />
        <Route path="/growth" component={Growth} />
        <Route path="/scale" component={Scale} />
        <Route path="/paiement" component={Paiement} />
        <Route path="/profilclient" component={ProfilClient} />
        <Route path="/DetailsDossier" component={DetailsDossier} />
        <Route path="/marketplace-experts" component={MarketplaceExperts} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // If user is not logged in, show the public routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/nos-services" component={NosServices} />
      <Route path="/experts" component={Experts}/>
      <Route path="/tarifs" component={Tarifs} />
      <Route path="/starter" component={Starter}/>
      <Route path="/growth" component={Growth} />
      <Route path="/scale" component={Scale} />
      <Route path="/paiement" component={Paiement} />
      <Route path="/create-account-client" component={CreateAccountClient} />
      <Route path="/connexion-client" component={ConnexionClient} />
      <Route path="/connexion-partner" component={ConnexionPartner} />
      <Route path="/conditions-utilisation" component={ConditionsUtilisation} />
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