import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Home from "@/pages/home-page";
import HomeTest from "@/pages/home-page-test";
import HomeRedirect from "@/pages/home-redirect";
import AuthPage from "@/pages/auth-page";
import ConnectAdmin from "@/pages/connect-admin";
import ClientDashboard from "@/pages/dashboard/client";
import ExpertDashboard from "@/pages/dashboard/expert";
import AdminDashboard from "@/pages/dashboard/admin";
import GestionExperts from "@/pages/admin/gestion-experts";
import GestionClients from "@/pages/admin/gestion-clients";
import FormulaireExpert from "@/pages/admin/formulaire-expert";
import ClientDetails from "@/pages/admin/client-details";
import Simulateur from "@/pages/simulateur";
import Paiement from "@/pages/Paiement";
import Growth from "@/pages/Growth";
import Scale from "@/pages/Scale";
import Starter from "@/pages/starter";
import Tarifs from "@/pages/Tarifs";
import NosServices from "@/pages/Nos-Services";
import Contact from "@/pages/contact";
import Experts from "@/pages/experts";
import ConnexionClient from "@/pages/connexion-client";
import ConnexionPartner from "@/pages/connexion-partner";
import CreateAccountClient from "@/pages/create-account-client";
import CreateAccountExpert from "@/pages/create-account-expert";
import MessagerieClient from "@/pages/messagerie-client";
import MessagerieExpert from "@/pages/messagerie-expert";
import DocumentsClient from "@/pages/documents-client";
import DocumentsExpert from "@/pages/documents-expert";
import AideClient from "@/pages/aide-client";
import AideExpert from "@/pages/aide-expert";
import Settings from "@/pages/settings";
import DemandesEnAttente from "@/pages/demandes-en-attente";
import ProfilClient from "@/pages/ProfilClient";
import ProfilExpert from "@/pages/ProfilExpert";
import ConditionsUtilisation from "@/pages/conditions-utilisation";
import ResultatsPage from "@/pages/resultats";
import Reports from "@/pages/reports";
import DossierDetails from "@/pages/dossier-details";
import DetailsDossier from "@/pages/DetailsDossier";
import MarketplaceExperts from "@/pages/marketplace-experts";
import NotFound from "@/pages/not-found";
import Confirmation from "@/pages/confirmation";
import ChatbotPage from "@/pages/chatbot";
import TICPEPage from "@/pages/produits/ticpe";
import DFSPage from "@/pages/produits/dfs";
import URSSAFPage from "@/pages/produits/urssaf";
import SocialProductsPage from "@/pages/produits/social";
import ExpertProfile from "@/pages/expert-profile";
import MessagerieExpertDemo from "@/pages/messagerie-expert-demo";
import ExpertDossier from "@/pages/expert-dossier";
import MessagerieClientDemo from "@/pages/messagerie-client-demo";
import KPIPage from "@/pages/dashboard/KPI";

// Dossiers clients
import DossierClient2 from "@/pages/dossier-client/2";
import DossierClient3 from "@/pages/dossier-client/3";
import DossierClient4 from "@/pages/dossier-client/4";
import DossierClient5 from "@/pages/dossier-client/5";
import DossierClient8 from "@/pages/dossier-client/8";
import DossierClient9 from "@/pages/dossier-client/9";
import DossierClient10 from "@/pages/dossier-client/10";
import DossierClient13 from "@/pages/dossier-client/13";
import DossierClient14 from "@/pages/dossier-client/14";
import DossierClient16 from "@/pages/dossier-client/16";
import DossierClient17 from "@/pages/dossier-client/17";
import ClientDemoDashboard from "@/pages/dashboard/client-demo";
import ClientAudit from "@/pages/dashboard/client-audit";
import DossierClientProduit from "@/pages/dossier-client/[produit]/[id]";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/home" element={<Home />} />
            <Route path="/home-test" element={<HomeTest />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/connect-admin" element={<ConnectAdmin />} />
            <Route path="/connexion-client" element={<ConnexionClient />} />
            <Route path="/connexion-partner" element={<ConnexionPartner />} />
            <Route path="/create-account-client" element={<CreateAccountClient />} />
            <Route path="/create-account-expert" element={<CreateAccountExpert />} />
            <Route path="/Nos-Services" element={<NosServices />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/Growth" element={<Growth />} />
            <Route path="/Scale" element={<Scale />} />
            <Route path="/Starter" element={<Starter />} />
            <Route path="/paiement" element={<Paiement />} />
            <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />

            {/* Routes protégées - Client */}
            <Route path="/dashboard/client/:id" element={<ClientDashboard />} />
            <Route path="/dashboard/client/demo" element={<ClientDemoDashboard />} />
            <Route path="/dashboard/client/demo/audit/:id" element={<ClientAudit />} />
            <Route path="/dashboard/client/demo/KPI" element={<KPIPage />} />
            <Route path="/messagerie-client/:id" element={<MessagerieClient />} />
            <Route path="/messagerie-client/demo" element={<MessagerieClientDemo />} />
            <Route path="/documents-client" element={<DocumentsClient />} />
            <Route path="/aide-client" element={<AideClient />} />
            <Route path="/profile/client" element={<ProfilClient />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/simulateur" element={<Simulateur />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/resultats" element={<ResultatsPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/dossier" element={<DossierDetails />} />
            <Route path="/DetailsDossier" element={<DetailsDossier />} />

            {/* Routes protégées - Expert */}
            <Route path="/dashboard-expert/:id" element={<ExpertDashboard />} />
            <Route path="/dashboard/expert" element={<ExpertDashboard />} />
            <Route path="/dashboard/expert/:id" element={<ExpertDashboard />} />
            <Route path="/dashboard/expert/:id/dossier/:dossierId" element={<ExpertDossier />} />
            <Route path="/expert/:id" element={<ExpertProfile />} />
            <Route path="/messagerie-expert" element={<MessagerieExpert />} />
            <Route path="/messagerie-expert/demo" element={<MessagerieExpertDemo />} />
            <Route path="/documents-expert" element={<DocumentsExpert />} />
            <Route path="/aide-expert" element={<AideExpert />} />
            <Route path="/profile/expert" element={<ProfilExpert />} />
            <Route path="/demandes-en-attente" element={<DemandesEnAttente />} />
            <Route path="/marketplace-experts" element={<MarketplaceExperts />} />

            {/* Routes protégées - Admin */}
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/admin/gestion-experts" element={<GestionExperts />} />
            <Route path="/admin/gestion-clients" element={<GestionClients />} />
            <Route path="/admin/expert/nouveau" element={<FormulaireExpert />} />
            <Route path="/admin/expert/:id/edit" element={<FormulaireExpert />} />
            <Route path="/admin/client/:id" element={<ClientDetails />} />

            {/* Routes des dossiers clients */}
            <Route path="/dossier-client/2" element={<DossierClient2 />} />
            <Route path="/dossier-client/3" element={<DossierClient3 />} />
            <Route path="/dossier-client/4" element={<DossierClient4 />} />
            <Route path="/dossier-client/5" element={<DossierClient5 />} />
            <Route path="/dossier-client/8" element={<DossierClient8 />} />
            <Route path="/dossier-client/9" element={<DossierClient9 />} />
            <Route path="/dossier-client/10" element={<DossierClient10 />} />
            <Route path="/dossier-client/13" element={<DossierClient13 />} />
            <Route path="/dossier-client/14" element={<DossierClient14 />} />
            <Route path="/dossier-client/16" element={<DossierClient16 />} />
            <Route path="/dossier-client/17" element={<DossierClient17 />} />
            
            {/* Route dynamique pour les dossiers clients */}
            <Route path="/dossier-client/:produit/:id" element={<DossierClientProduit />} />

            {/* Route d'erreur */}
            <Route path="*" element={<NotFound />} />

            {/* Nouvelle route de confirmation */}
            <Route path="/confirmation" element={<Confirmation />} />

            {/* Nouvelle route pour la page TICPE */}
            <Route path="/produits/ticpe" element={<TICPEPage />} />
            <Route path="/produits/ticpe/:uuid" element={<TICPEPage />} />
            <Route path="/produits/ticpe/:uuid/:clientUuid" element={<TICPEPage />} />
            <Route path="/produits/ticpe/:uuid/:clientUuid/:auditUuid" element={<TICPEPage />} />
            <Route path="/produits/ticpe/:clientProduitId" element={<TICPEPage />} />
            <Route path="/produits/dfs" element={<DFSPage />} />
            <Route path="/produits/dfs/:clientProduitId" element={<DFSPage />} />
            <Route path="/produits/urssaf" element={<URSSAFPage />} />
            <Route path="/produits/urssaf/:clientProduitId" element={<URSSAFPage />} />
            <Route path="/produits/social/:productId" element={<SocialProductsPage />} />
          </Routes>
          <Toaster />
          <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;