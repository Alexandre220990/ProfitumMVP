import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { useBusinessKPIs } from "@/hooks/use-business-kpis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/design-system/Card";
import Button from "@/components/ui/design-system/Button";
import Badge from "@/components/ui/design-system/Badge";
import { useToast } from "@/components/ui/toast-notifications";
import HeaderAdmin from "@/components/HeaderAdmin";
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Edit,
  X,
  Check,
  UserPlus,
  Building,
  ClipboardList
} from "lucide-react";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface Expert {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
  documents?: string[];
}

interface Client {
  id: string;
  company_name: string;
  email: string;
  statut: string;
  created_at: string;
  produits_eligibles?: ClientProduitEligible[];
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
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [sectionData, setSectionData] = useState({
    experts: [] as Expert[],
    clients: [] as Client[],
    dossiers: [] as ClientProduitEligible[]
  });
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();

  // Hook pour les KPIs métier
  const {
    businessKPIs,
    isLoading,
    error,
    lastUpdated,
    refreshData,
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
      let response;
      
      switch (section) {
        case 'experts':
          response = await fetch('/api/admin/experts/pending', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setSectionData(prev => ({ ...prev, experts: data.experts || [] }));
          }
          break;
          
        case 'clients':
          response = await fetch('/api/admin/clients/waiting', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setSectionData(prev => ({ ...prev, clients: data.clients || [] }));
          }
          break;
          
        case 'dossiers':
          response = await fetch('/api/admin/dossiers/pending', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setSectionData(prev => ({ ...prev, dossiers: data.dossiers || [] }));
          }
          break;
      }
    } catch (error) {
      console.error(`Erreur chargement ${section}:`, error);
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
        const testResponse = await fetch('/api/admin/test', {
          credentials: 'include'
        });
        console.log('✅ Test admin de base:', testResponse.status, testResponse.ok);
        
        // Test de diagnostic détaillé
        const diagnosticResponse = await fetch('/api/admin/diagnostic', {
          credentials: 'include'
        });
        console.log('✅ Test diagnostic admin:', diagnosticResponse.status, diagnosticResponse.ok);
        
        if (diagnosticResponse.ok) {
          const diagnosticData = await diagnosticResponse.json();
          console.log('📊 Diagnostic admin:', diagnosticData);
        } else {
          const errorData = await diagnosticResponse.json();
          console.error('❌ Erreur diagnostic admin:', errorData);
        }
        
      } catch (error) {
        console.error('❌ Erreur test admin auth:', error);
      }
    };
    
    if (user?.id && user.type === 'admin') {
      testAdminAuth();
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
  // FONCTIONS UTILITAIRES
  // ========================================

  const handleRefresh = async () => {
    await refreshData();
    await loadSectionData(activeSection);
    addToast({
      type: 'success',
      title: 'Actualisé',
      message: 'Données mises à jour'
    });
  };

  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
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

        {/* KPIs Principaux - TUILES INTERACTIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Nouvel Utilisateur"
            value={businessKPIs.newClientsThisMonth}
            change={`+${businessKPIs.newClientsThisMonth} ce mois`}
            changeType="positive"
            icon={UserPlus}
            color="from-blue-500 to-blue-600"
            subtitle={`${businessKPIs.totalClients} total`}
            onClick={() => handleSectionChange('clients')}
          />
          
          <KPICard
            title="Experts à valider"
            value={businessKPIs.pendingExperts}
            change={`${businessKPIs.activeExperts} actifs`}
            changeType="neutral"
            icon={UserCheck}
            color="from-orange-500 to-orange-600"
            subtitle={`${businessKPIs.totalExperts} total`}
            onClick={() => handleSectionChange('experts')}
          />
          
          <KPICard
            title="Clients en attente"
            value={businessKPIs.dossiersOpportunites}
            change={`${businessKPIs.dossiersEnCours} en cours`}
            changeType="neutral"
            icon={Building}
            color="from-green-500 to-green-600"
            subtitle={`${businessKPIs.totalDossiers} total`}
            onClick={() => handleSectionChange('clients')}
          />
          
          <KPICard
            title="Dossiers à traiter"
            value={businessKPIs.dossiersEnCours}
            change={`${formatCurrency(businessKPIs.gainsRealises)} réalisés`}
            changeType="positive"
            icon={ClipboardList}
            color="from-purple-500 to-purple-600"
            subtitle={`${formatCurrency(businessKPIs.gainsPotentiels)} potentiels`}
            onClick={() => handleSectionChange('dossiers')}
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
            <ExpertsValidationSection 
              experts={sectionData.experts} 
              loading={loading}
              onRefresh={() => loadSectionData('experts')}
            />
          )}

          {activeSection === 'clients' && (
            <ClientsWaitingSection 
              clients={sectionData.clients} 
              loading={loading}
              onRefresh={() => loadSectionData('clients')}
            />
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

  const ExpertsValidationSection = ({ experts, loading, onRefresh }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-orange-600" />
            <span>Experts à valider ({experts.length})</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Chargement des experts...</p>
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun expert en attente de validation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experts.map((expert: Expert) => (
              <div key={expert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{expert.name}</h4>
                    <p className="text-sm text-gray-600">{expert.email}</p>
                    <div className="flex space-x-2 mt-1">
                      {expert.specializations?.map((spec, index) => (
                        <Badge key={index} variant="primary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="success" className="text-white">
                    <Check className="w-4 h-4 mr-1" />
                    Valider
                  </Button>
                  <Button size="sm" variant="error" className="text-white">
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ClientsWaitingSection = ({ clients, loading, onRefresh }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-green-600" />
            <span>Clients en attente ({clients.length})</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Chargement des clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun client en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client: Client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{client.company_name}</h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <p className="text-xs text-gray-500">Statut: {client.statut}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="secondary">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir dossiers
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Edit className="w-4 h-4 mr-1" />
                    Contacter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const DossiersProcessingSection = ({ dossiers, loading, onRefresh }: any) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            <span>Dossiers à traiter ({dossiers.length})</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
            <p className="text-gray-600">Aucun dossier à traiter</p>
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
                    </div>
                  </div>
                  <Badge 
                    variant={dossier.statut === 'pending' ? 'warning' : 
                           dossier.statut === 'validated' ? 'success' : 'error'}
                  >
                    {dossier.statut}
                  </Badge>
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
                  <Button size="sm" variant="success" className="text-white">
                    <Check className="w-4 h-4 mr-1" />
                    Valider
                  </Button>
                  <Button size="sm" variant="error" className="text-white">
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir détails
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Edit className="w-4 h-4 mr-1" />
                    Assigner expert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

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