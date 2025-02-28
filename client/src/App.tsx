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

// Pages de dossiers statiques
import DossierClient1 from "@/pages/dossier-client/1";
import DossierClient2 from "@/pages/dossier-client/2";
import DossierClient3 from "@/pages/dossier-client/3";
import DossierClient4 from "@/pages/dossier-client/4";
import DossierClient6 from "@/pages/dossier-client/6";
import DossierClient7 from "@/pages/dossier-client/7";
import DossierClient15 from "@/pages/dossier-client/15";
import DossierClient11 from "@/pages/dossier-client/11";
import DossierClient12 from "@/pages/dossier-client/12";
import DossierClient13 from "@/pages/dossier-client/13";
import DossierClient14 from "@/pages/dossier-client/14";
import DossierClient16 from "@/pages/dossier-client/16";
import DossierClient17 from "@/pages/dossier-client/17";
import DossierClient5 from "@/pages/dossier-client/5";
import DossierClient8 from "@/pages/dossier-client/8";
import DossierClient9 from "@/pages/dossier-client/9";
import DossierClient10 from "@/pages/dossier-client/10";

// Produits pages
import TICPE from "@/pages/produits/ticpe";
import Foncier from "@/pages/produits/foncier";
import MSA from "@/pages/produits/msa";
import DFS from "@/pages/produits/dfs";
import Social from "@/pages/produits/social";
import ExpertPage from "@/pages/expert-page";
import CharteSignature from "@/pages/charte-signature";
import MessagerieClient from "./pages/messagerie-client";
import CourtageEnergie from "@/pages/produits/courtage-energie";

// Ajouter les imports des nouvelles pages de profil
import ExpertProfile from "@/pages/profile/expert";
import ClientProfile from "@/pages/profile/client";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Routes publiques accessibles à tous */}
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

      {/* Routes protégées nécessitant une authentification */}
      {user && (
        <>
          {/* Nouvelles routes de profil */}
          <Route path="/profile/expert" component={ExpertProfile} />
          <Route path="/profile/client" component={ClientProfile} />

          {/* Routes de dossiers statiques */}
          <Route path="/dossier-client/1" component={DossierClient1} />
          <Route path="/dossier-client/2" component={DossierClient2} />
          <Route path="/dossier-client/3" component={DossierClient3} />
          <Route path="/dossier-client/4" component={DossierClient4} />
          <Route path="/dossier-client/5" component={DossierClient5} />
          <Route path="/dossier-client/6" component={DossierClient6} />
          <Route path="/dossier-client/7" component={DossierClient7} />
          <Route path="/dossier-client/8" component={DossierClient8} />
          <Route path="/dossier-client/9" component={DossierClient9} />
          <Route path="/dossier-client/10" component={DossierClient10} />
          <Route path="/dossier-client/11" component={DossierClient11} />
          <Route path="/dossier-client/12" component={DossierClient12} />
          <Route path="/dossier-client/13" component={DossierClient13} />
          <Route path="/dossier-client/14" component={DossierClient14} />
          <Route path="/dossier-client/15" component={DossierClient15} />
          <Route path="/dossier-client/16" component={DossierClient16} />
          <Route path="/dossier-client/17" component={DossierClient17} />

          <Route path="/dashboard/client/:userId" component={Dashboard} />
          <Route path="/dashboard/partner/:userId" component={PartnerDashboard} />

          {/* Routes de produits avec userId */}
          <Route path="/produits/msa/:userId" component={MSA} />
          <Route path="/produits/dfs/:userId" component={DFS} />
          <Route path="/produits/ticpe/:userId" component={TICPE} />
          <Route path="/produits/foncier/:userId" component={Foncier} />
          <Route path="/produits/social/:userId" component={Social} />
          <Route path="/produits/courtage-energie/:userId" component={CourtageEnergie} />

          {/* Autres routes protégées */}
          <Route path="/audit/:type/expert/:userId" component={ExpertPage} />
          <Route path="/audit/:type/sign-charte/:userId" component={CharteSignature} />
          <Route path="/reports/:userId" component={Reports} />
          <Route path="/dossier/:userId" component={DossierDetails} />
          <Route path="/profilclient/:userId" component={ProfilClient} />
          <Route path="/DetailsDossier/:userId" component={DetailsDossier} />
          <Route path="/marketplace-experts" component={MarketplaceExperts} />
          <Route path="/simulateur/:userId" component={Simulateur} />
          <Route path="/messagerie-client/:userId" component={MessagerieClient} />
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