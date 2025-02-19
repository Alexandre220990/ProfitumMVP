import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Pages et composants
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard/client";
import PartnerDashboard from "@/pages/dashboard/partner";
import Simulateur from "@/pages/simulateur";
import Reports from "@/pages/reports";
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
import CreateAccountClient from "./pages/create-account-client";
import ConnexionClient from "./pages/connexion-client";
import ConnexionPartner from "./pages/connexion-partner";
import ConditionsUtilisation from "./pages/conditions-utilisation";

// Produits pages
import TICPE from "@/pages/produits/ticpe";
import Foncier from "@/pages/produits/foncier";
import MSA from "@/pages/produits/msa";
import DFS from "@/pages/produits/dfs";
import Social from "@/pages/produits/social";
import ExpertPage from "@/pages/expert-page";
import CharteSignature from "@/pages/charte-signature";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      switch (user.type) {
        case "client":
          if (user.id) {
            setLocation(`/dashboard/client/${user.id}`);
          } else {
            setLocation("/");
          }
          break;
        case "partner":
          setLocation("/dashboard/partner");
          break;
        default:
          setLocation("/");
          break;
      }
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth-page" component={AuthPage} />
      <Route path="/nos-services" component={NosServices} />
      <Route path="/experts" component={Experts} />
      <Route path="/tarifs" component={Tarifs} />
      <Route path="/starter" component={Starter} />
      <Route path="/growth" component={Growth} />
      <Route path="/scale" component={Scale} />
      <Route path="/paiement" component={Paiement} />
      <Route path="/create-account-client" component={CreateAccountClient} />
      <Route path="/connexion-client" component={ConnexionClient} />
      <Route path="/connexion-partner" component={ConnexionPartner} />
      <Route path="/conditions-utilisation" component={ConditionsUtilisation} />

      {user && (
        <>
          <Route path="/dashboard/client/:userId" component={Dashboard} />
          <Route path="/dashboard/partner/:userId" component={PartnerDashboard} />
          <Route path="/Produits/msa/:userId" component={MSA} />
          <Route path="/Produits/dfs/:userId" component={DFS} />
          <Route path="/Produits/ticpe/:userId" component={TICPE} />
          <Route path="/Produits/foncier/:userId" component={Foncier} />
          <Route path="/Produits/social/:userId" component={Social} />
          <Route path="/audit/:type/expert/:userId" component={ExpertPage} />
          <Route path="/audit/:type/sign-charte/:userId" component={CharteSignature} />
          <Route path="/reports/:userId" component={Reports} />
          <Route path="/dossier/:userId" component={DossierDetails} />
          <Route path="/profilclient/:userId" component={ProfilClient} />
          <Route path="/DetailsDossier/:userId" component={DetailsDossier} />
          <Route path="/marketplace-experts/:userId" component={MarketplaceExperts} />
          <Route path="/simulateur/:userId" component={Simulateur} />
        </>
      )}

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