import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { AdminProvider } from './contexts/AdminContext';
import { reminderService } from './services/reminder-service';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "./components/ui/sonner";


// Pages principales
const DashboardClient = React.lazy(() => import('./pages/dashboard/client'));
const ClientHome = React.lazy(() => import('./pages/dashboard/client-home'));
const ClientAssignments = React.lazy(() => import('./pages/dashboard/client-assignments'));
const AgendaClient = React.lazy(() => import('./pages/agenda-client'));
const AgendaExpert = React.lazy(() => import('./pages/agenda-expert'));
const AgendaAdmin = React.lazy(() => import('./pages/agenda-admin'));
const GoogleCalendarIntegration = React.lazy(() => import('./pages/google-calendar-integration'));
const AideClient = React.lazy(() => import('./pages/aide-client'));
const AideExpert = React.lazy(() => import('./pages/aide-expert'));
const ProfileClient = React.lazy(() => import('./pages/profile/client'));
const ProfileExpert = React.lazy(() => import('./pages/profile/expert'));
const MessagerieClient = React.lazy(() => import('./pages/messagerie-client'));
const ClientDocuments = React.lazy(() => import('./pages/dashboard/client-documents'));
const DocumentsClient = React.lazy(() => import('./pages/documents-client'));
const NotificationCenter = React.lazy(() => import('./pages/notification-center'));
const Settings = React.lazy(() => import('./pages/settings'));
const Experts = React.lazy(() => import('./pages/marketplace-experts'));
const MarketplaceExperts = React.lazy(() => import('./pages/marketplace-experts'));
const ExpertsVerifies = React.lazy(() => import('./pages/experts-verifies'));
const DossierClient = React.lazy(() => import('./pages/dossier-client/[id]'));
const ProduitClient = React.lazy(() => import('./pages/dossier-client/[produit]/[id]'));
const AuditEnergetique = React.lazy(() => import('./pages/produits/audit_energetique'));
const CeeProduct = React.lazy(() => import('./pages/produits/cee-product'));
const ComptableProduct = React.lazy(() => import('./pages/produits/comptable-product'));
const TicpeProduct = React.lazy(() => import('./pages/produits/ticpe-product'));
const UrssafProduct = React.lazy(() => import('./pages/produits/urssaf-product'));
const DfsProduct = React.lazy(() => import('./pages/produits/dfs-product'));
const FoncierProduct = React.lazy(() => import('./pages/produits/foncier-product'));
const MsaProduct = React.lazy(() => import('./pages/produits/msa-product'));
const CirProduct = React.lazy(() => import('./pages/produits/cir-product'));
const SocialProduct = React.lazy(() => import('./pages/produits/social-product'));

// Pages d'authentification
const ConnexionClient = React.lazy(() => import('./pages/connexion-client'));
const ConnexionExpert = React.lazy(() => import('./pages/connexion-expert'));
const ConnexionApporteur = React.lazy(() => import('./pages/connexion-apporteur'));
const ApporteurLogin = React.lazy(() => import('./pages/ApporteurLogin'));
const ApporteurRegister = React.lazy(() => import('./pages/ApporteurRegister'));
const ApporteurDashboard = React.lazy(() => import('./pages/ApporteurDashboard'));
const ApporteurProspects = React.lazy(() => import('./pages/ApporteurProspects'));
const ApporteurMeetings = React.lazy(() => import('./pages/ApporteurMeetings'));
const ApporteurExperts = React.lazy(() => import('./pages/ApporteurExperts'));
const ApporteurCommissions = React.lazy(() => import('./pages/ApporteurCommissions'));
const ApporteurStatistics = React.lazy(() => import('./pages/ApporteurStatistics'));
const ApporteurKanban = React.lazy(() => import('./pages/ApporteurKanban'));
const ApporteurNotifications = React.lazy(() => import('./pages/ApporteurNotifications'));
const ApporteurProducts = React.lazy(() => import('./pages/ApporteurProducts'));
const ApporteurMessaging = React.lazy(() => import('./pages/ApporteurMessaging'));
const ApporteurAgenda = React.lazy(() => import('./pages/ApporteurAgenda'));
const ApporteurLayout = React.lazy(() => import('./components/apporteur/ApporteurLayout'));
const CreateAccountClient = React.lazy(() => import('./pages/create-account-client'));
const CreateAccountExpert = React.lazy(() => import('./pages/create-account-expert'));
const InscriptionClient = React.lazy(() => import('./pages/inscription-client'));
const WelcomeExpert = React.lazy(() => import('./pages/welcome-expert'));
const DemoConfirmation = React.lazy(() => import('./pages/demo-confirmation'));
const ConnectAdmin = React.lazy(() => import('./pages/connect-admin'));
const HomePage = React.lazy(() => import('./pages/home-page'));
const HomepageTest = React.lazy(() => import('./pages/homepage-test'));
const SimulateurEligibilite = React.lazy(() => import('./pages/simulateur-eligibilite'));
const UnauthorizedPage = React.lazy(() => import('./pages/unauthorized'));

// Pages légales
const PrivacyPage = React.lazy(() => import('./pages/privacy'));
const TermsPage = React.lazy(() => import('./pages/terms'));

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/dashboard'));
const AdminDashboardOptimized = React.lazy(() => import('./pages/admin/dashboard-optimized'));
const AdminClientDetails = React.lazy(() => import('./pages/admin/client-details'));
const AdminExpertDetails = React.lazy(() => import('./pages/admin/expert-details'));
const AdminDocuments = React.lazy(() => import('./pages/admin/enhanced-admin-documents'));
const AdminDocumentationNew = React.lazy(() => import('./pages/admin/documentation-new'));
const AdminGestionDossiers = React.lazy(() => import('./pages/admin/gestion-dossiers'));
const AdminGestionExperts = React.lazy(() => import('./pages/admin/gestion-experts'));
const AdminGestionClients = React.lazy(() => import('./pages/admin/gestion-clients'));
const AdminMonitoring = React.lazy(() => import('./pages/admin/monitoring'));
const AdminValidationDashboard = React.lazy(() => import('./pages/admin/validation-dashboard'));
const AdminFormulaireExpert = React.lazy(() => import('./pages/admin/formulaire-expert'));
const AdminDocumentUpload = React.lazy(() => import('./pages/admin/admin-document-upload'));
const AdminTerminalTests = React.lazy(() => import('./pages/admin/terminal-tests'));
const AdminTests = React.lazy(() => import('./pages/admin/tests'));

// Expert pages
const ExpertDashboard = React.lazy(() => import('./pages/expert/dashboard'));
const ExpertDetails = React.lazy(() => import('./pages/expert/[id]'));
const ExpertMesAffaires = React.lazy(() => import('./pages/expert/mes-affaires'));
const ExpertAgenda = React.lazy(() => import('./pages/expert/agenda'));
const ExpertDossier = React.lazy(() => import('./pages/expert/dossier/[id]'));

// Analytics page
const AnalyticsPage = React.lazy(() => import('./pages/analytics'));

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react";

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientProvider>
          <AdminProvider>
            <Suspense fallback={<div>Chargement...</div>}>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                    {/* Routes publiques */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/homepage-test" element={<HomepageTest />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/simulateur" element={<SimulateurEligibilite />} />
                    <Route path="/experts" element={<Experts />} />
                    <Route path="/experts/:id" element={<ExpertDetails />} />
                    <Route path="/connexion-client" element={<ConnexionClient />} />
                    <Route path="/connexion-expert" element={<ConnexionExpert />} />
                    <Route path="/connexion-apporteur" element={<ConnexionApporteur />} />
                    <Route path="/apporteur/login" element={<ApporteurLogin />} />
                    <Route path="/apporteur/register" element={<ApporteurRegister />} />
                    <Route path="/become-apporteur" element={<ApporteurRegister />} />
                    
                    {/* Routes apporteur avec layout */}
                    <Route path="/apporteur" element={<ApporteurLayout />}>
                        <Route path="dashboard" element={<ApporteurDashboard />} />
                        <Route path="prospects" element={<ApporteurProspects />} />
                        <Route path="kanban" element={<ApporteurKanban />} />
                        <Route path="meetings" element={<ApporteurMeetings />} />
                        <Route path="experts" element={<ApporteurExperts />} />
                        <Route path="products" element={<ApporteurProducts />} />
                        <Route path="messaging" element={<ApporteurMessaging />} />
                        <Route path="agenda" element={<ApporteurAgenda />} />
                        <Route path="commissions" element={<ApporteurCommissions />} />
                        <Route path="statistics" element={<ApporteurStatistics />} />
                        <Route path="notifications" element={<ApporteurNotifications />} />
                    </Route>
                    <Route path="/connect-admin" element={<ConnectAdmin />} />
                    <Route path="/register-client" element={<CreateAccountClient />} />
                    <Route path="/inscription-client" element={<InscriptionClient />} />
                    <Route path="/register-expert" element={<CreateAccountExpert />} />
                    <Route path="/welcome-expert" element={<WelcomeExpert />} />
                    <Route path="/demo-confirmation" element={<DemoConfirmation />} />
                    <Route path="/experts-verifies" element={<ExpertsVerifies />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    
                    {/* Routes agenda directes (avec protection) */}
                    <Route path="/agenda-client" element={<ProtectedRoute requiredType="client" />}>
                      <Route index element={<AgendaClient />} />
                    </Route>
                    
                    <Route path="/agenda-expert" element={<ProtectedRoute requiredType="expert" />}>
                      <Route index element={<AgendaExpert />} />
                    </Route>
                    
                    <Route path="/agenda-admin" element={<ProtectedRoute requiredType="admin" />}>
                      <Route index element={<AgendaAdmin />} />
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
                    
                    <Route path="/notification-center" element={<ProtectedRoute requiredType="client" />}>
                      <Route index element={<NotificationCenter />} />
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
                      <Route index element={<DocumentsClient />} />
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
                      <Route path="notification-center" element={<NotificationCenter />} />
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
                      <Route path="mes-affaires" element={<ExpertMesAffaires />} />
                      <Route path="agenda" element={<ExpertAgenda />} />
                      <Route path="agenda-expert" element={<AgendaExpert />} />
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
                      <Route path="dashboard-optimized" element={<AdminDashboardOptimized />} />
                      <Route path="client-details/:id" element={<AdminClientDetails />} />
                      <Route path="expert-details/:id" element={<AdminExpertDetails />} />
                      <Route path="documentation-new" element={<AdminDocumentationNew />} />
                      <Route path="enhanced-admin-documents" element={<AdminDocuments />} />
                      <Route path="gestion-dossiers" element={<AdminGestionDossiers />} />
                      <Route path="gestion-experts" element={<AdminGestionExperts />} />
                      <Route path="gestion-clients" element={<AdminGestionClients />} />
                      <Route path="monitoring" element={<AdminMonitoring />} />
                      <Route path="validation-dashboard" element={<AdminValidationDashboard />} />
                      <Route path="formulaire-expert" element={<AdminFormulaireExpert />} />
                      <Route path="admin-document-upload" element={<AdminDocumentUpload />} />
                      <Route path="terminal-tests" element={<AdminTerminalTests />} />
                      <Route path="tests" element={<AdminTests />} />
                    </Route>

                    {/* Route dashboard/admin pour compatibilité */}
                    <Route path="/dashboard/admin" element={<ProtectedRoute requiredType="admin" />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path=":id" element={<AdminDashboard />} />
                    </Route>

                    {/* Route analytics - Admin et Expert */}
                    <Route path="/analytics" element={<ProtectedRoute requiredType="admin" />}>
                      <Route index element={<AnalyticsPage />} />
                    </Route>
                  </Routes>
                  <Analytics />
                </div>
                <Toaster />
              </Suspense>
            </AdminProvider>
          </ClientProvider>
        </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;