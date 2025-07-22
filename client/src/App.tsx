import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { AdminProvider } from './contexts/AdminContext';
import { reminderService } from './services/reminder-service';

// Pages principales
import DashboardClient from './pages/dashboard/client';
import ClientHome from './pages/dashboard/client-home';
import ClientAssignments from './pages/dashboard/client-assignments';
import AgendaClient from './pages/agenda-client';
import GoogleCalendarIntegration from './pages/google-calendar-integration';
import AideClient from './pages/aide-client';
import AideExpert from './pages/aide-expert';
import ProfileClient from './pages/profile/client';
import ProfileExpert from './pages/profile/expert';
import MessagerieClient from './pages/messagerie-client';
import MessagerieExpert from './pages/messagerie-expert';
import ClientDocuments from './pages/dashboard/client-documents';
import Settings from './pages/settings';
import Experts from './pages/marketplace/experts';
import ExpertDetail from './pages/marketplace/expert-detail';
import MarketplaceExperts from './pages/marketplace-experts';
import ExpertsVerifies from './pages/experts-verifies';
import DossierClient from './pages/dossier-client/[id]';
import ProduitClient from './pages/dossier-client/[produit]/[id]';
import AuditEnergetique from './pages/produits/audit_energetique';
import CeeProduct from './pages/produits/cee-product';
import ComptableProduct from './pages/produits/comptable-product';
import TicpeProduct from './pages/produits/ticpe-product';
import UrssafProduct from './pages/produits/urssaf-product';
import DfsProduct from './pages/produits/dfs-product';
import FoncierProduct from './pages/produits/foncier-product';
import MsaProduct from './pages/produits/msa-product';
import CirProduct from './pages/produits/cir-product';
import SocialProduct from './pages/produits/social-product';

// Pages d'authentification
import ConnexionClient from './pages/connexion-client';
import ConnexionExpert from './pages/connexion-expert';
import CreateAccountClient from './pages/create-account-client';
import CreateAccountExpert from './pages/create-account-expert';
import WelcomeExpert from './pages/welcome-expert';
import DemoConfirmation from './pages/demo-confirmation';
import ConnectAdmin from './pages/connect-admin';
import HomePage from './pages/home-page';
import SimulateurEligibilite from './pages/simulateur-eligibilite';
import UnauthorizedPage from './pages/unauthorized';

// Pages légales
import PrivacyPage from './pages/privacy';
import TermsPage from './pages/terms';

// Admin pages
import AdminDashboard from './pages/admin/dashboard';
import AdminClientDetails from './pages/admin/client-details';
import AdminDocumentationNew from './pages/admin/documentation-new';
import AdminGestionDossiers from './pages/admin/gestion-dossiers';
import AdminGestionExperts from './pages/admin/gestion-experts';
import AdminGestionClients from './pages/admin/gestion-clients';
import AdminMonitoring from './pages/admin/monitoring';
import AdminValidationDashboard from './pages/admin/validation-dashboard';
import AdminFormulaireExpert from './pages/admin/formulaire-expert';
import AdminDocumentUpload from './pages/admin/admin-document-upload';
import AdminTerminalTests from './pages/admin/terminal-tests';
import AdminTests from './pages/admin/tests';
import MessagerieAdmin from './pages/admin/messagerie-admin';

// Expert pages
import ExpertDashboard from './pages/expert/dashboard';
import ExpertDetails from './pages/expert/[id]';
import ExpertMesAffaires from './pages/expert/mes-affaires';
import ExpertAgenda from './pages/expert/agenda';
import ExpertDossier from './pages/expert/dossier/[id]';

// Analytics page
import AnalyticsPage from './pages/analytics';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from "./components/ui/toast-notifications";

function App() {
  // Démarrer le service de rappels automatiques
  useEffect(() => {
    reminderService.start();
    
    // Arrêter le service lors du démontage
    return () => {
      reminderService.stop();
    };
  }, []);

  return (
    <AuthProvider>
      <ClientProvider>
        <AdminProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<HomePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/simulateur" element={<SimulateurEligibilite />} />
                <Route path="/experts" element={<Experts />} />
                <Route path="/experts/:id" element={<ExpertDetail />} />
                <Route path="/connexion-client" element={<ConnexionClient />} />
                <Route path="/connexion-expert" element={<ConnexionExpert />} />
                <Route path="/connect-admin" element={<ConnectAdmin />} />
                <Route path="/register-client" element={<CreateAccountClient />} />
                <Route path="/register-expert" element={<CreateAccountExpert />} />
                <Route path="/welcome-expert" element={<WelcomeExpert />} />
                <Route path="/demo-confirmation" element={<DemoConfirmation />} />
                <Route path="/experts-verifies" element={<ExpertsVerifies />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Routes client directes (avec protection) */}
                <Route path="/agenda-client" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<AgendaClient />} />
                </Route>
                
                <Route path="/google-calendar-integration" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<GoogleCalendarIntegration />} />
                </Route>
                
                {/* Routes produits directes (avec protection) */}
                <Route path="/produits" element={<ProtectedRoute requiredType="client" />}>
                  <Route path="urssaf/:id" element={<UrssafProduct />} />
                  <Route path="dfs/:id" element={<DfsProduct />} />
                  <Route path="foncier/:id" element={<FoncierProduct />} />
                  <Route path="msa/:id" element={<MsaProduct />} />
                  <Route path="cir/:id" element={<CirProduct />} />
                  <Route path="social/:id" element={<SocialProduct />} />
                  <Route path="ticpe/:id" element={<TicpeProduct />} />
                  <Route path="audit_energetique/:id" element={<AuditEnergetique />} />
                </Route>
                <Route path="/aide-client" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<AideClient />} />
                </Route>
                <Route path="/messagerie-client" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<MessagerieClient />} />
                </Route>
                <Route path="/profile/client" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<ProfileClient />} />
                </Route>
                <Route path="/client-document" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<ClientDocuments />} />
                </Route>
                <Route path="/documents-client" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<ClientDocuments />} />
                </Route>
                <Route path="/settings" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<Settings />} />
                </Route>
                <Route path="/experts" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<Experts />} />
                </Route>
                <Route path="/marketplace-experts" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<MarketplaceExperts />} />
                </Route>

                {/* Routes client */}
                <Route path="/dashboard" element={<ProtectedRoute requiredType="client" />}>
                  <Route index element={<DashboardClient />} />
                  <Route path="client" element={<DashboardClient />} />
                  <Route path="client/:id" element={<DashboardClient />} />
                  <Route path="client/demo" element={<DashboardClient />} />
                  <Route path="client-home/:id" element={<ClientHome />} />
                  <Route path="client-assignments" element={<ClientAssignments />} />
                  <Route path="agenda-client" element={<AgendaClient />} />
                  <Route path="aide-client" element={<AideClient />} />
                  <Route path="profile/client" element={<ProfileClient />} />
                  <Route path="messagerie-client" element={<MessagerieClient />} />
                  <Route path="dossier-client/:id" element={<DossierClient />} />
                  <Route path="dossier-client/:produit/:id" element={<ProduitClient />} />
                  <Route path="produits/audit_energetique" element={<AuditEnergetique />} />
                  <Route path="produits/cee-product" element={<CeeProduct />} />
                  <Route path="produits/comptable-product" element={<ComptableProduct />} />
                  <Route path="produits/ticpe-product" element={<TicpeProduct />} />
                  <Route path="produits/urssaf-product" element={<UrssafProduct />} />
                  <Route path="produits/urssaf/:id" element={<UrssafProduct />} />
                  <Route path="produits/dfs/:id" element={<DfsProduct />} />
                  <Route path="produits/foncier/:id" element={<FoncierProduct />} />
                  <Route path="produits/msa/:id" element={<MsaProduct />} />
                  <Route path="produits/cir/:id" element={<CirProduct />} />
                  <Route path="produits/social/:id" element={<SocialProduct />} />
                  <Route path="produits/ticpe/:id" element={<TicpeProduct />} />
                  <Route path="produits/audit_energetique/:id" element={<AuditEnergetique />} />
                </Route>

                {/* Routes expert */}
                <Route path="/expert" element={<ProtectedRoute requiredType="expert" />}>
                  <Route index element={<ExpertDashboard />} />
                  <Route path="dashboard" element={<ExpertDashboard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path=":id" element={<ExpertDetails />} />
                  <Route path="dossier/:id" element={<ExpertDossier />} />
                  <Route path="aide-expert" element={<AideExpert />} />
                  <Route path="profile/expert" element={<ProfileExpert />} />
                  <Route path="messagerie-expert" element={<MessagerieExpert />} />
                  <Route path="mes-affaires" element={<ExpertMesAffaires />} />
                  <Route path="agenda" element={<ExpertAgenda />} />
                </Route>

                {/* Route dashboard/expert pour compatibilité */}
                <Route path="/dashboard/expert" element={<ProtectedRoute requiredType="expert" />}>
                  <Route index element={<ExpertDashboard />} />
                  <Route path=":id" element={<ExpertDashboard />} />
                  <Route path=":id/dossier/:dossierId" element={<ExpertDashboard />} />
                </Route>

                {/* Routes admin */}
                <Route path="/admin" element={<ProtectedRoute requiredType="admin" />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="clients/:id" element={<AdminClientDetails />} />
                  <Route path="documentation" element={<AdminDocumentationNew />} />
                  <Route path="documentation/new" element={<AdminDocumentationNew />} />
                  <Route path="gestion-dossiers" element={<AdminGestionDossiers />} />
                  <Route path="gestion-experts" element={<AdminGestionExperts />} />
                  <Route path="gestion-clients" element={<AdminGestionClients />} />
                  <Route path="monitoring" element={<AdminMonitoring />} />
                  <Route path="validation-dashboard" element={<AdminValidationDashboard />} />
                  <Route path="formulaire-expert" element={<AdminFormulaireExpert />} />
                  <Route path="admin-document-upload" element={<AdminDocumentUpload />} />
                  <Route path="terminal-tests" element={<AdminTerminalTests />} />
                  <Route path="tests" element={<AdminTests />} />
                  <Route path="messagerie-admin" element={<MessagerieAdmin />} />
                  {/* Routes avec paramètres */}
                  <Route path="expert/:id" element={<AdminFormulaireExpert />} />
                  <Route path="expert/:id/edit" element={<AdminFormulaireExpert />} />
                  <Route path="client/:id" element={<AdminClientDetails />} />
                  <Route path="client/:id/edit" element={<AdminClientDetails />} />
                </Route>
              </Routes>
            </div>
            <Toaster position="top-right" />
          </ToastProvider>
        </AdminProvider>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;