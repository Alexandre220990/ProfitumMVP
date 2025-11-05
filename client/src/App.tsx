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
const AgendaClient = React.lazy(() => import('./pages/agenda-client'));
const AgendaExpert = React.lazy(() => import('./pages/agenda-expert'));
const AgendaAdmin = React.lazy(() => import('./pages/agenda-admin'));
const GoogleCalendarIntegration = React.lazy(() => import('./pages/google-calendar-integration'));
const AideClient = React.lazy(() => import('./pages/aide-client'));
const AideExpert = React.lazy(() => import('./pages/aide-expert'));
const ProfileClient = React.lazy(() => import('./pages/profile/client'));
const ProfileExpert = React.lazy(() => import('./pages/profile/expert'));
const MessagerieClient = React.lazy(() => import('./pages/messagerie-client'));
const MessagerieAdmin = React.lazy(() => import('./pages/admin/messagerie'));
const ClientDocumentsPage = React.lazy(() => import('./pages/client/documents'));
const ExpertDocumentsPage = React.lazy(() => import('./pages/expert/documents'));
const ApporteurDocumentsPage = React.lazy(() => import('./pages/apporteur/documents'));
const NotificationCenter = React.lazy(() => import('./pages/notification-center'));
const NotificationPreferences = React.lazy(() => import('./pages/notification-preferences'));
const Settings = React.lazy(() => import('./pages/settings'));
const Experts = React.lazy(() => import('./pages/marketplace-experts'));
const MarketplaceExperts = React.lazy(() => import('./pages/marketplace-experts'));
const ExpertsVerifies = React.lazy(() => import('./pages/experts-verifies'));
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
const BecomeApporteur = React.lazy(() => import('./pages/BecomeApporteur'));
const ValidationPending = React.lazy(() => import('./pages/validation-pending'));
const ValidationPendingApporteur = React.lazy(() => import('./pages/validation-pending-apporteur'));
const ApporteurDashboard = React.lazy(() => import('./pages/apporteur/dashboard'));
const ApporteurProspects = React.lazy(() => import('./pages/ApporteurProspects'));
const ApporteurMeetings = React.lazy(() => import('./pages/ApporteurMeetings'));
const ApporteurExperts = React.lazy(() => import('./pages/ApporteurExperts'));
const ApporteurCommissions = React.lazy(() => import('./pages/ApporteurCommissions'));
const ApporteurStatistics = React.lazy(() => import('./pages/ApporteurStatistics'));
const ApporteurNotifications = React.lazy(() => import('./pages/ApporteurNotifications'));
const ApporteurProducts = React.lazy(() => import('./pages/ApporteurProducts'));
const ApporteurMessaging = React.lazy(() => import('./pages/ApporteurMessaging'));
const ApporteurAgenda = React.lazy(() => import('./pages/ApporteurAgenda'));
const ApporteurSettings = React.lazy(() => import('./pages/apporteur/settings'));
const ApporteurLayout = React.lazy(() => import('./components/apporteur/ApporteurLayout'));
const ClientLayout = React.lazy(() => import('./components/client/ClientLayout'));
const ExpertLayout = React.lazy(() => import('./components/expert/ExpertLayout'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const CreateAccountClient = React.lazy(() => import('./pages/create-account-client'));
const CreateAccountExpert = React.lazy(() => import('./pages/create-account-expert'));
const InscriptionClient = React.lazy(() => import('./pages/inscription-client'));
const WelcomeExpert = React.lazy(() => import('./pages/welcome-expert'));
const DemoConfirmation = React.lazy(() => import('./pages/demo-confirmation'));
const ConnectAdmin = React.lazy(() => import('./pages/connect-admin'));
const HomePage = React.lazy(() => import('./pages/home-page'));
const HomepageTest = React.lazy(() => import('./pages/homepage-test'));
const SimulateurEligibilite = React.lazy(() => import('./pages/simulateur-eligibilite'));
const InscriptionSimulateur = React.lazy(() => import('./pages/inscription-simulateur'));
const SimulateurClient = React.lazy(() => import('./pages/simulateur-client'));
const UnauthorizedPage = React.lazy(() => import('./pages/unauthorized'));

// Pages légales
const PrivacyPage = React.lazy(() => import('./pages/privacy'));
const TermsPage = React.lazy(() => import('./pages/terms'));
const AboutPage = React.lazy(() => import('./pages/about'));

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/dashboard'));
const AdminDashboardOptimized = React.lazy(() => import('./pages/admin/dashboard-optimized'));
const AdminClientDetails = React.lazy(() => import('./pages/admin/client-details'));
const AdminExpertDetails = React.lazy(() => import('./pages/admin/expert-details'));
const AdminGestionDossiers = React.lazy(() => import('./pages/admin/gestion-dossiers'));
const AdminGestionClients = React.lazy(() => import('./pages/admin/gestion-clients'));
const AdminGestionProduits = React.lazy(() => import('./pages/admin/gestion-produits'));
const AdminMonitoring = React.lazy(() => import('./pages/admin/monitoring'));
// SUPPRIMÉ: AdminValidationDashboard (remplacé par Centre de Notifications dans dashboard-optimized)
// const AdminValidationDashboard = React.lazy(() => import('./pages/admin/validation-dashboard'));
const AdminFormulaireExpert = React.lazy(() => import('./pages/admin/formulaire-expert'));
const AdminFormulaireClient = React.lazy(() => import('./pages/admin/formulaire-client-complet'));
const AdminDocumentsGEDUnifie = React.lazy(() => import('./pages/admin/documents-ged-unifie')); // ✅ PAGE UNIFIÉE (GED + Documentation + Upload)
const AdminClientSynthese = React.lazy(() => import('./pages/admin/client-synthese')); // ✅ PAGE SYNTHÈSE CLIENT
const AdminExpertSynthese = React.lazy(() => import('./pages/admin/expert-synthese')); // ✅ PAGE SYNTHÈSE EXPERT
const AdminDossierSynthese = React.lazy(() => import('./pages/admin/dossier-synthese')); // ✅ PAGE SYNTHÈSE DOSSIER

// Expert pages
const ExpertDashboard = React.lazy(() => import('./pages/expert/dashboard'));
const ExpertDetails = React.lazy(() => import('./pages/expert/[id]'));
const ExpertMesAffaires = React.lazy(() => import('./pages/expert/mes-affaires'));
const ExpertAgenda = React.lazy(() => import('./pages/expert/agenda'));
const ExpertDossier = React.lazy(() => import('./pages/expert/dossier/[id]'));
const ExpertClient = React.lazy(() => import('./pages/expert/client/[id]'));

// Analytics page
const AnalyticsPage = React.lazy(() => import('./pages/analytics-simple'));

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

  // Gérer les erreurs de chargement de chunks dynamiques (après déploiement)
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const chunkFailedMessage = /Failed to fetch dynamically imported module|Loading chunk/i;
      
      if (chunkFailedMessage.test(event.message)) {
        console.warn('🔄 Erreur de chargement de module détectée, rechargement de la page...');
        
        // Éviter les boucles infinies
        if (!sessionStorage.getItem('chunk_reload_attempted')) {
          sessionStorage.setItem('chunk_reload_attempted', 'true');
          window.location.reload();
        } else {
          sessionStorage.removeItem('chunk_reload_attempted');
          console.error('❌ Erreur persistante après rechargement');
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    
    return () => {
      window.removeEventListener('error', handleChunkError);
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
                    <Route path="/a-propos" element={<AboutPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/simulateur" element={<SimulateurEligibilite />} />
                    <Route path="/simulateur-eligibilite" element={<SimulateurEligibilite />} />
                    <Route path="/inscription-simulateur" element={<InscriptionSimulateur />} />
                    <Route path="/experts" element={<Experts />} />
                    <Route path="/experts/:id" element={<ExpertDetails />} />
                    <Route path="/connexion-client" element={<ConnexionClient />} />
                    <Route path="/connexion-expert" element={<ConnexionExpert />} />
                    <Route path="/connexion-apporteur" element={<ConnexionApporteur />} />
                    <Route path="/apporteur/login" element={<ApporteurLogin />} />
                    <Route path="/apporteur/register" element={<ApporteurRegister />} />
                    <Route path="/become-apporteur" element={<BecomeApporteur />} />
                    <Route path="/validation-pending" element={<ValidationPending />} />
                    <Route path="/validation-pending-apporteur" element={<ValidationPendingApporteur />} />
                    
                    {/* Routes apporteur avec layout */}
                    <Route path="/apporteur" element={<ApporteurLayout />}>
                        <Route path="dashboard" element={<ApporteurDashboard />} />
                        <Route path="prospects" element={<ApporteurProspects />} />
                        <Route path="meetings" element={<ApporteurMeetings />} />
                        <Route path="experts" element={<ApporteurExperts />} />
                        <Route path="products" element={<ApporteurProducts />} />
                        <Route path="documents" element={<ApporteurDocumentsPage />} />
                        <Route path="messaging" element={<ApporteurMessaging />} />
                        <Route path="agenda" element={<ApporteurAgenda />} />
                        <Route path="commissions" element={<ApporteurCommissions />} />
                        <Route path="statistics" element={<ApporteurStatistics />} />
                        <Route path="notifications" element={<ApporteurNotifications />} />
                        <Route path="settings" element={<ApporteurSettings />} />
                    </Route>
                    <Route path="/connect-admin" element={<ConnectAdmin />} />
                    <Route path="/register-client" element={<CreateAccountClient />} />
                    <Route path="/inscription-client" element={<InscriptionClient />} />
                    <Route path="/register-expert" element={<CreateAccountExpert />} />
                    <Route path="/welcome-expert" element={<WelcomeExpert />} />
                    <Route path="/demo-confirmation" element={<DemoConfirmation />} />
                    <Route path="/experts-verifies" element={<ExpertsVerifies />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    
                    {/* Routes PARTAGÉES - Accessibles à tous les utilisateurs authentifiés */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/notification-center" element={<NotificationCenter />} />
                      <Route path="/notification-preferences" element={<NotificationPreferences />} />
                    </Route>
                    
                    {/* Routes CLIENT avec nouveau layout unifié */}
                    <Route element={<ProtectedRoute requiredType="client" />}>
                      <Route element={<ClientLayout />}>
                        {/* Dashboard */}
                        <Route path="/dashboard" element={<DashboardClient />} />
                        <Route path="/dashboard/client" element={<DashboardClient />} />
                        <Route path="/dashboard/client/:id" element={<DashboardClient />} />
                        <Route path="/dashboard/client/demo" element={<DashboardClient />} />
                        <Route path="/dashboard/client-home/:id" element={<ClientHome />} />
                        
                        {/* Agenda & Calendar */}
                        <Route path="/agenda-client" element={<AgendaClient />} />
                        <Route path="/google-calendar-integration" element={<GoogleCalendarIntegration />} />
                        
                        {/* Simulateur */}
                        <Route path="/simulateur-client" element={<SimulateurClient />} />
                        
                        {/* Messagerie */}
                        <Route path="/messagerie" element={<MessagerieClient />} />
                        <Route path="/messagerie-client" element={<MessagerieClient />} />
                        
                        {/* Documents & Dossiers */}
                        <Route path="/documents-client" element={<ClientDocumentsPage />} />
                        <Route path="/dossier-client/:produit/:id" element={<ProduitClient />} />
                        
                        {/* Produits */}
                        <Route path="/produits/audit_energetique" element={<AuditEnergetique />} />
                        <Route path="/produits/audit_energetique/:id" element={<AuditEnergetique />} />
                        <Route path="/produits/cee-product" element={<CeeProduct />} />
                        <Route path="/produits/comptable-product" element={<ComptableProduct />} />
                        <Route path="/produits/ticpe-product" element={<TicpeProduct />} />
                        <Route path="/produits/ticpe/:id" element={<TicpeProduct />} />
                        <Route path="/produits/urssaf-product" element={<UrssafProduct />} />
                        <Route path="/produits/urssaf/:id" element={<UrssafProduct />} />
                        <Route path="/produits/dfs/:id" element={<DfsProduct />} />
                        <Route path="/produits/foncier/:id" element={<FoncierProduct />} />
                        <Route path="/produits/msa/:id" element={<MsaProduct />} />
                        <Route path="/produits/cir/:id" element={<CirProduct />} />
                        <Route path="/produits/social/:id" element={<SocialProduct />} />
                        
                        {/* Experts & Marketplace */}
                        <Route path="/experts" element={<Experts />} />
                        <Route path="/marketplace-experts" element={<MarketplaceExperts />} />
                        
                        {/* Profil & Paramètres */}
                        <Route path="/profile/client" element={<ProfileClient />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/aide-client" element={<AideClient />} />
                      </Route>
                    </Route>

                    {/* Routes EXPERT avec nouveau layout unifié */}
                    <Route element={<ProtectedRoute requiredType="expert" />}>
                      <Route path="/expert" element={<ExpertLayout />}>
                        {/* Dashboard */}
                        <Route index element={<ExpertDashboard />} />
                        <Route path="dashboard" element={<ExpertDashboard />} />
                        <Route path=":id" element={<ExpertDetails />} />
                        
                        {/* Mes Affaires */}
                        <Route path="mes-affaires" element={<ExpertMesAffaires />} />
                        <Route path="dossier/:id" element={<ExpertDossier />} />
                        <Route path="client/:id" element={<ExpertClient />} />
                        
                        {/* Documents */}
                        <Route path="documents" element={<ExpertDocumentsPage />} />
                        
                        {/* Agenda */}
                        <Route path="agenda" element={<ExpertAgenda />} />
                        <Route path="agenda-expert" element={<AgendaExpert />} />
                        
                        {/* Analytics */}
                        <Route path="analytics" element={<AnalyticsPage />} />
                        
                        {/* Messagerie */}
                        <Route path="messagerie" element={<MessagerieClient />} />
                        
                        {/* Profil & Aide */}
                        <Route path="profile/expert" element={<ProfileExpert />} />
                        <Route path="aide-expert" element={<AideExpert />} />
                      </Route>
                      
                      {/* Routes dashboard/expert pour compatibilité */}
                      <Route path="/dashboard/expert" element={<ExpertLayout />}>
                        <Route index element={<ExpertDashboard />} />
                        <Route path=":id" element={<ExpertDashboard />} />
                        <Route path=":id/dossier/:dossierId" element={<ExpertDashboard />} />
                      </Route>
                      
                      {/* Route agenda-expert directe */}
                      <Route path="/agenda-expert" element={<ExpertLayout />}>
                        <Route index element={<AgendaExpert />} />
                      </Route>
                    </Route>

                    {/* Routes ADMIN avec nouveau layout unifié */}
                    <Route element={<ProtectedRoute requiredType="admin" />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        {/* Dashboard */}
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="dashboard-optimized" element={<AdminDashboardOptimized />} />
                        
                        {/* Agenda */}
                        <Route path="agenda-admin" element={<AgendaAdmin />} />
                        
                        {/* Messagerie */}
                        <Route path="messagerie-admin" element={<MessagerieAdmin />} />
                        
                        {/* GED & Documents - PAGE UNIFIÉE */}
                        <Route path="documents-ged" element={<AdminDocumentsGEDUnifie />} />
                        
                        {/* Gestion */}
                        <Route path="gestion-clients" element={<AdminGestionClients />} />
                        <Route path="client-details/:id" element={<AdminClientDetails />} />
                        <Route path="clients/:id" element={<AdminClientSynthese />} />
                        <Route path="expert-details/:id" element={<AdminExpertDetails />} />
                        <Route path="experts/:id" element={<AdminExpertSynthese />} />
                        <Route path="dossiers/:id" element={<AdminDossierSynthese />} />
                        <Route path="gestion-dossiers" element={<AdminGestionDossiers />} />
                        <Route path="gestion-produits" element={<AdminGestionProduits />} />
                        
                        {/* Outils */}
                        {/* SUPPRIMÉ: validation-dashboard - Utilisez /admin/dashboard-optimized?section=validations */}
                        <Route path="monitoring" element={<AdminMonitoring />} />
                        <Route path="formulaire-expert" element={<AdminFormulaireExpert />} />
                        <Route path="formulaire-client" element={<AdminFormulaireClient />} />
                      </Route>
                      
                      {/* Routes dashboard/admin pour compatibilité */}
                      <Route path="/dashboard/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path=":id" element={<AdminDashboard />} />
                      </Route>
                      
                      {/* Route agenda-admin directe */}
                      <Route path="/agenda-admin" element={<AdminLayout />}>
                        <Route index element={<AgendaAdmin />} />
                      </Route>
                      
                      {/* Route analytics admin */}
                      <Route path="/analytics" element={<AdminLayout />}>
                        <Route index element={<AnalyticsPage />} />
                      </Route>
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