import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home-page";
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
import MessagerieClient from "./pages/messagerie-client";
import ExpertProfile from "@/pages/profile/expert";
import ClientProfile from "@/pages/profile/client";

function Router() {
  return (
    <div className="min-h-screen">
      <Switch>
        {/* Routes publiques */}
        <Route path="/" component={Home} />
        <Route path="/connexion-client" component={ConnexionClient} />
        <Route path="/connexion-partner" component={ConnexionPartner} />
        <Route path="/nos-services" component={NosServices} />
        <Route path="/experts" component={Experts} />
        <Route path="/tarifs" component={Tarifs} />
        <Route path="/starter" component={Starter} />
        <Route path="/growth" component={Growth} />
        <Route path="/scale" component={Scale} />
        <Route path="/paiement" component={Paiement} />
        <Route path="/create-account-client" component={CreateAccountClient} />
        <Route path="/conditions-utilisation" component={ConditionsUtilisation} />

        {/* Routes protégées */}
        <Route path="/profile/expert" component={ExpertProfile} />
        <Route path="/profile/client" component={ClientProfile} />
        <Route path="/dashboard/client" component={Dashboard} />
        <Route path="/dashboard/partner" component={PartnerDashboard} />
        <Route path="/simulateur" component={Simulateur} />
        <Route path="/reports" component={Reports} />
        <Route path="/messagerie-client" component={MessagerieClient} />
        <Route path="/dossier/:id" component={DossierDetails} />
        <Route path="/profil-client" component={ProfilClient} />
        <Route path="/details-dossier" component={DetailsDossier} />
        <Route path="/marketplace-experts" component={MarketplaceExperts} />

        {/* Route 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
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