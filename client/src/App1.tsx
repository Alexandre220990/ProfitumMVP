import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
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
import InscriptionClient from "@/pages/InscriptionClient";
import CreateAccountClient from "./pages/create-account-client";
import NosServices from "@/pages/nos-services";

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
        <Route path="/dashboard/client" component={user.userType === "partner" ? PartnerDashboard : Dashboard} />
        <Route path="/simulateur" component={Simulateur} />
        <Route path="/audit/msa" component={MSA} />
        <Route path="/audit/dfs" component={DFS} />
        <Route path="/audit/:type/expert/:id" component={ExpertPage} />
        <Route path="/audit/:type/sign-charte" component={CharteSignature} />
        <Route path="/audit/TICPE" component={TICPE} />
        <Route path="/audit/foncier" component={Foncier} />
        <Route path="/audit/social" component={Social} />
        <Route path="/reports" component={Reports} />
        <Route path="/auth" component={AuthPage} />
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
        <Route path="/create-account-client" component={CreateAccountClient} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // If user is not logged in, show the public routes
  return (
    <Switch>
      <Route path="/auth-page" component={AuthPage} />
      <Route path="/" component={Home} />
      <Route path="/nos-services" component {NosServices} />
      <Route path="/experts" component={Experts}/>
      <Route path="/tarifs" component={Tarifs} />
      <Route path="/starter" component={Starter}/>
      <Route path="/growth" component={Growth} />
      <Route path="/scale" component={Scale} />
      <Route path="/paiement" component={Paiement} />
      <Route path="/InscriptionClient" component={InscriptionClient} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
