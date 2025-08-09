import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { useBusinessKPIs } from "@/hooks/use-business-kpis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/design-system/Card";
import Button from "@/components/ui/design-system/Button";
import Badge from "@/components/ui/design-system/Badge";
import { useToast } from "@/components/ui/toast-notifications";
import HeaderAdmin from "@/components/HeaderAdmin";
import { get } from "@/lib/api";
import { 
  Users, 
  Building, 
  UserPlus, 
  RefreshCw, 
  TrendingUp, 
  Eye,
  Edit,
  ClipboardList,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  AlertTriangle,
  Check,
  X,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface SectionData {
  experts: any[];
  clients: any[];
  dossiers: any[];
}

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: 'pending' | 'validated' | 'rejected' | 'in_progress';
  progress: number;
  montantFinal?: number;
  tauxFinal?: number;
  documents_sent?: string[];
  expert_id?: string;
  created_at: string;
  updated_at: string;
}

type ActiveSection = 'overview' | 'experts' | 'clients' | 'dossiers';

// ============================================================================
// DASHBOARD ADMIN OPTIMISÉ - VUE MÉTIER PURE
// ============================================================================
// Interface simplifiée pour un pilotage optimal de l'activité

const AdminDashboardOptimized: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  // ===== ÉTATS LOCAUX =====
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [sectionData, setSectionData] = useState<SectionData>({
    experts: [],
    clients: [],
    dossiers: []
  });
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState({
    totalClients: 0,
    clientsThisMonth: 0,
    totalExperts: 0,
    activeExperts: 0,
    pendingExperts: 0,
    totalDossiers: 0,
    pendingDossiers: 0,
    montantPotentiel: 0,
    montantRealise: 0
  });

  const { addToast } = useToast();

  // Hook pour les KPIs métier
  const {
    businessKPIs,
    isLoading,
    error,
    lastUpdated,
    formatCurrency,
    formatPercentage,
    formatNumber
  } = useBusinessKPIs();

  // ========================================
  // CHARGEMENT DES DONNÉES PAR SECTION
  // ========================================

  const loadSectionData = async (section: ActiveSection) => {
    if (section === 'overview') return;
    
    setLoading(true);
    try {
      console.log(`🔍 Chargement section: ${section}`);
      
      switch (section) {
        case 'experts':
          console.log('📡 Appel API /admin/experts...');
          const expertsResponse = await get('/admin/experts');
          console.log('📦 Réponse experts:', expertsResponse);
          if (expertsResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, experts: (expertsResponse.data as any)?.experts || [] }));
          } else {
            console.error('❌ Erreur experts:', expertsResponse.message);
          }
          break;
          
        case 'clients':
          console.log('📡 Appel API /admin/clients...');
          const clientsResponse = await get('/admin/clients');
          console.log('📦 Réponse clients:', clientsResponse);
          if (clientsResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, clients: (clientsResponse.data as any)?.clients || [] }));
          } else {
            console.error('❌ Erreur clients:', clientsResponse.message);
          }
          break;
          
        case 'dossiers':
          console.log('📡 Appel API /admin/dossiers...');
          const dossiersResponse = await get('/admin/dossiers');
          console.log('📦 Réponse dossiers:', dossiersResponse);
          if (dossiersResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, dossiers: (dossiersResponse.data as any)?.dossiers || [] }));
          } else {
            console.error('❌ Erreur dossiers:', dossiersResponse.message);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Erreur chargement ${section}:`, error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Impossible de charger les données ${section}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les données quand la section change
  useEffect(() => {
    loadSectionData(activeSection);
  }, [activeSection]);

  // Test d'authentification admin
  useEffect(() => {
    const testAdminAuth = async () => {
      try {
        console.log('🧪 Test authentification admin...');
        
        // Test de base
        const testResponse = await get('/admin/test');
        console.log('✅ Test admin de base:', testResponse.success);
        
        // Test de diagnostic détaillé
        const diagnosticResponse = await get('/admin/diagnostic');
        console.log('✅ Test diagnostic admin:', diagnosticResponse.success);
        
        if (diagnosticResponse.success) {
          console.log('📊 Diagnostic admin:', diagnosticResponse.data);
        } else {
          console.error('❌ Erreur diagnostic admin:', diagnosticResponse.message);
        }
        
      } catch (error) {
        console.error('❌ Erreur test admin auth:', error);
      }
    };
    
    if (user?.id && user.type === 'admin') {
      testAdminAuth();
    }
  }, [user?.id, user?.type]);

  // ========================================
  // CHARGEMENT DES DONNÉES KPI
  // ========================================
  
  const loadKPIData = async () => {
    try {
      console.log('📊 Chargement des données KPI...');
      
      // Charger les clients
      const clientsResponse = await get('/admin/clients');
      const clients = clientsResponse.success ? (clientsResponse.data as any)?.clients || [] : [];
      
      // Charger les experts
      const expertsResponse = await get('/admin/experts');
      const experts = expertsResponse.success ? (expertsResponse.data as any)?.experts || [] : [];
      
      // Charger les dossiers
      const dossiersResponse = await get('/admin/dossiers');
      const dossiers = dossiersResponse.success ? (dossiersResponse.data as any)?.dossiers || [] : [];
      
      // Calculer les KPIs
      const totalClients = clients.length;
      const clientsThisMonth = clients.filter((client: any) => {
        const clientDate = new Date(client.created_at);
        const now = new Date();
        return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
      }).length;
      
      const totalExperts = experts.length;
      const activeExperts = experts.filter((expert: any) => expert.approval_status === 'approved').length;
      const pendingExperts = experts.filter((expert: any) => expert.approval_status === 'pending').length;
      
      const totalDossiers = dossiers.length;
      const pendingDossiers = dossiers.filter((dossier: any) => dossier.statut === 'pending').length;
      
      const montantPotentiel = dossiers.reduce((sum: number, dossier: any) => {
        return sum + (dossier.montantFinal || 0);
      }, 0);
      
      const montantRealise = dossiers.filter((dossier: any) => dossier.statut === 'validated')
        .reduce((sum: number, dossier: any) => {
          return sum + (dossier.montantFinal || 0);
        }, 0);
      
      // Mettre à jour les KPIs
      setKpiData({
        totalClients,
        clientsThisMonth,
        totalExperts,
        activeExperts,
        pendingExperts,
        totalDossiers,
        pendingDossiers,
        montantPotentiel,
        montantRealise
      });
      
      console.log('✅ KPIs mis à jour:', {
        totalClients,
        clientsThisMonth,
        totalExperts,
        activeExperts,
        pendingExperts,
        totalDossiers,
        pendingDossiers,
        montantPotentiel,
        montantRealise
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement KPIs:', error);
    }
  };

  // Charger les KPIs au montage du composant
  useEffect(() => {
    if (user?.id && user.type === 'admin') {
      loadKPIData();
    }
  }, [user?.id, user?.type]);

  // ===== GESTION DES PERMISSIONS =====
  
  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    if (user.type === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.type === 'expert') {
      return <Navigate to="/expert" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleRefresh = async () => {
    await loadKPIData();
    if (activeSection !== 'overview') {
      await loadSectionData(activeSection);
    }
  };

  // ========================================
  // COMPOSANTS UI
  // ========================================

  const KPICard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color, 
    format = 'number',
    subtitle,
    onClick
  }: any) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        onClick ? 'hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {format === 'currency' ? formatCurrency(value) : formatNumber(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            <div className="flex items-center mt-2">
              {changeType === 'positive' && <ArrowUpRight className="w-4 h-4 text-green-600" />}
              {changeType === 'negative' && <ArrowDownRight className="w-4 h-4 text-red-600" />}
              {changeType === 'neutral' && <Minus className="w-4 h-4 text-gray-600" />}
              <span className={`text-sm ml-1 ${
                changeType === 'positive' ? 'text-green-600' :
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AdminSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administration</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'users' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Utilisateurs</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  // ========================================
  // SECTIONS DYNAMIQUES
  // ========================================

  const BusinessKPIsDashboard = () => {
    if (!businessKPIs) return null;

    return (
      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Métier</h1>
            <p className="text-gray-600 mt-1">
              Vue d'ensemble de l'activité - Dernière mise à jour : {lastUpdated?.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Erreur de chargement</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* KPIs PRINCIPAUX */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Nouvel Utilisateur */}
          <KPICard
            title="Nouvel Utilisateur"
            value={kpiData.clientsThisMonth}
            total={kpiData.totalClients}
            change={`+${kpiData.clientsThisMonth} ce mois`}
            icon={UserPlus}
            color="blue"
            onClick={() => setActiveSection('clients')}
          />

          {/* Experts */}
          <KPICard
            title="Experts"
            value={kpiData.activeExperts}
            total={kpiData.totalExperts}
            change={`${kpiData.pendingExperts} en attente`}
            icon={Users}
            color="green"
            onClick={() => setActiveSection('experts')}
          />

          {/* Clients en attente */}
          <KPICard
            title="Clients en attente"
            value={kpiData.pendingDossiers}
            total={kpiData.totalDossiers}
            change={`${kpiData.pendingDossiers} en cours`}
            icon={Building}
            color="orange"
            onClick={() => setActiveSection('clients')}
          />

          {/* Dossiers à traiter */}
          <KPICard
            title="Dossiers à traiter"
            value={kpiData.montantPotentiel.toLocaleString('fr-FR')}
            total={`${kpiData.montantRealise.toLocaleString('fr-FR')} € réalisés`}
            change={`${kpiData.totalDossiers} dossiers`}
            icon={FileText}
            color="purple"
            onClick={() => setActiveSection('dossiers')}
          />
        </div>

        {/* Section dynamique en dessous des tuiles */}
        <div className="mt-8">
          {activeSection === 'overview' && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Vue d'ensemble
              </h3>
              <p className="text-gray-600">
                Cliquez sur une tuile ci-dessus pour voir les détails
              </p>
            </div>
          )}

          {activeSection === 'experts' && (
            <ExpertsAllSection />
          )}

          {activeSection === 'clients' && (
            <ClientsAllSection />
          )}

          {activeSection === 'dossiers' && (
            <DossiersProcessingSection 
              dossiers={sectionData.dossiers} 
              loading={loading}
              onRefresh={() => loadSectionData('dossiers')}
            />
          )}
        </div>

        {/* Métriques de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Performance Globale</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatPercentage(businessKPIs.performanceGlobale)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Croissance Clients</span>
                  <span className="font-medium text-green-600">+{formatPercentage(businessKPIs.croissanceClients)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux de Conversion</span>
                  <span className="font-medium text-blue-600">{formatPercentage(businessKPIs.tauxConversion)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ========================================
  // COMPOSANTS DE SECTIONS
  // ========================================

  // ========================================
  // SECTION CLIENTS - TABLEAU VISUEL
  // ========================================
  
  const ClientsAllSection = () => {
    const clients = sectionData.clients || [];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Tous les clients de la plateforme ({clients.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Gestion complète des entreprises inscrites
            </p>
          </div>
        </div>

        {/* Tableau des clients */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Entreprise
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {client.company_name || 'Entreprise Temporaire'}
                        </div>
                        {client.siren && (
                          <div className="text-sm text-slate-500">
                            SIREN: {client.siren}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900">{client.email}</div>
                        {client.phone_number && (
                          <div className="text-sm text-slate-500">{client.phone_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={client.statut === 'actif' ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {client.statut || 'actif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/admin/client-details/${client.id}`, '_blank')}
                        >
                          Voir détails
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => window.open(`/admin/messagerie-admin?user=${client.id}`, '_blank')}
                        >
                          Contacter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  // ========================================
  // SECTION EXPERTS - TABLEAU VISUEL
  // ========================================
  
  const ExpertsAllSection = () => {
    const experts = sectionData.experts || [];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Tous les experts de la plateforme ({experts.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Gestion complète des experts inscrits
            </p>
          </div>
        </div>

        {/* Tableau des experts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Expert
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Spécialisations
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {experts.map((expert: any) => (
                  <tr key={expert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {expert.name || expert.company_name}
                        </div>
                        {expert.company_name && expert.name && (
                          <div className="text-sm text-slate-500">
                            {expert.company_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900">{expert.email}</div>
                        {expert.location && (
                          <div className="text-sm text-slate-500">{expert.location}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {expert.specializations?.slice(0, 2).map((spec: string, index: number) => (
                          <Badge key={index} variant="primary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {expert.specializations?.length > 2 && (
                          <Badge variant="primary" className="text-xs">
                            +{expert.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          expert.approval_status === 'approved' ? 'success' : 
                          expert.approval_status === 'pending' ? 'warning' : 'error'
                        }
                        className="text-xs"
                      >
                        {expert.approval_status === 'approved' ? 'Validé' : 
                         expert.approval_status === 'pending' ? 'En cours' : 'Rejeté'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(expert.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/admin/expert-details/${expert.id}`, '_blank')}
                        >
                          Voir détails
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => window.open(`/admin/messagerie-admin?user=${expert.id}`, '_blank')}
                        >
                          Contacter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const DossiersProcessingSection = ({ dossiers, loading, onRefresh }: any) => {
    // Calculer les statistiques
    const totalDossiers = dossiers.length;
    const montantCumule = dossiers.reduce((sum: number, dossier: ClientProduitEligible) => {
      return sum + (dossier.montantFinal || 0);
    }, 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <span>Tous les dossiers ClientProduitEligible ({totalDossiers})</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Montant cumulé</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(montantCumule)}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chargement des dossiers...</p>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun dossier ClientProduitEligible trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dossiers.map((dossier: ClientProduitEligible) => (
                <div key={dossier.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Dossier #{dossier.id}</h4>
                        <p className="text-sm text-gray-600">Client: {dossier.clientId}</p>
                        <p className="text-xs text-gray-500">Produit: {dossier.produitId}</p>
                        <p className="text-xs text-gray-400">Créé le: {new Date(dossier.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={dossier.statut === 'pending' ? 'warning' : 
                               dossier.statut === 'validated' ? 'success' : 
                               dossier.statut === 'rejected' ? 'error' : 'primary'}
                      >
                        {dossier.statut}
                      </Badge>
                      {dossier.montantFinal && (
                        <p className="text-sm font-medium text-purple-600 mt-1">
                          {formatCurrency(dossier.montantFinal)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{dossier.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dossier.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    {dossier.statut === 'pending' && (
                      <>
                        <Button size="sm" variant="success" className="text-white">
                          <Check className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                        <Button size="sm" variant="error" className="text-white">
                          <X className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ===== COMPOSANT ANALYTICS =====
  
  const AnalyticsDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Monitoring</h1>
        <Button variant="secondary" className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Configuration</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques Avancées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics en Développement</h3>
            <p className="text-gray-600">
              Cette section regroupera toutes les statistiques, monitoring et rapports avancés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAdmin />
      
      <div className="flex pt-16">
        <AdminSidebar />
        
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <BusinessKPIsDashboard />}
              {activeTab === 'users' && <AnalyticsDashboard />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOptimized; 