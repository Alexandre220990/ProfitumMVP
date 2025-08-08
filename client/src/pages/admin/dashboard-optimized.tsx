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
  FileText, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  BarChart3,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Trash2
} from "lucide-react";

// ============================================================================
// DASHBOARD ADMIN OPTIMISÉ - VUE MÉTIER PURE
// ============================================================================
// Interface simplifiée pour un pilotage optimal de l'activité

const AdminDashboardOptimized: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { addToast } = useToast();

  // Hook pour les KPIs métier
  const {
    businessKPIs,
    userData,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    formatCurrency,
    formatPercentage,
    formatNumber
  } = useBusinessKPIs();

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
      return <Navigate to="/connect-admin" replace />;
    }
  }

  // ===== ACTIONS =====
  
  const handleRefresh = async () => {
    await refreshData();
    addToast({
      type: 'success',
      title: 'Données actualisées',
      message: 'Les métriques ont été mises à jour',
      duration: 3000
    });
  };

  // ===== COMPOSANTS DE MÉTRIQUES =====
  
  const KPICard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color, 
    format = 'number',
    subtitle
  }: any) => (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {format === 'currency' 
                ? formatCurrency(value)
                : format === 'percentage'
                ? formatPercentage(value)
                : formatNumber(value)
              }
            </div>
            {change && (
              <div className={`flex items-center text-sm ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {changeType === 'positive' ? <ArrowUpRight className="w-4 h-4" /> :
                 changeType === 'negative' ? <ArrowDownRight className="w-4 h-4" /> :
                 <Minus className="w-4 h-4" />}
                <span className="ml-1">{change}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ===== COMPOSANT SIDEBAR =====
  
  const AdminSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Administration</h2>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <div>
              <div className="font-medium">Dashboard</div>
              <div className="text-sm text-gray-500">Vue métier et pilotage</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'users' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <div>
              <div className="font-medium">Gestion Utilisateurs</div>
              <div className="text-sm text-gray-500">Clients, experts, validations</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <div>
              <div className="font-medium">Analytics</div>
              <div className="text-sm text-gray-500">Statistiques et monitoring</div>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );

  // ===== COMPOSANT DASHBOARD PRINCIPAL =====
  
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

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Clients Actifs"
            value={businessKPIs.activeClients}
            change={`+${businessKPIs.newClientsThisMonth} ce mois`}
            changeType="positive"
            icon={Users}
            color="from-blue-500 to-blue-600"
            subtitle={`${businessKPIs.totalClients} total`}
          />
          
          <KPICard
            title="Experts en Attente"
            value={businessKPIs.pendingExperts}
            change={`${businessKPIs.activeExperts} actifs`}
            changeType="neutral"
            icon={UserCheck}
            color="from-orange-500 to-orange-600"
            subtitle={`${businessKPIs.totalExperts} total`}
          />
          
          <KPICard
            title="Dossiers Opportunités"
            value={businessKPIs.dossiersOpportunites}
            change={`${businessKPIs.dossiersEnCours} en cours`}
            changeType="neutral"
            icon={FileText}
            color="from-green-500 to-green-600"
            subtitle={`${businessKPIs.totalDossiers} total`}
          />
          
          <KPICard
            title="Montant Éligible"
            value={businessKPIs.montantTotalEligible}
            format="currency"
            change={`${formatCurrency(businessKPIs.gainsRealises)} réalisés`}
            changeType="positive"
            icon={DollarSign}
            color="from-purple-500 to-purple-600"
            subtitle={`${formatCurrency(businessKPIs.gainsPotentiels)} potentiels`}
          />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Actions en Attente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Experts à valider</span>
                  </div>
                  <Badge variant="warning">{businessKPIs.pendingExperts}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Dossiers à traiter</span>
                  </div>
                  <Badge variant="primary">{businessKPIs.dossiersOpportunites}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span>Gains Financiers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Gains Potentiels</div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(businessKPIs.gainsPotentiels)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gains Réalisés</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(businessKPIs.gainsRealises)}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-600">Taux de Réalisation</div>
                  <div className="text-lg font-bold text-blue-600">
                    {businessKPIs.gainsPotentiels > 0 
                      ? formatPercentage((businessKPIs.gainsRealises / businessKPIs.gainsPotentiels) * 100)
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ===== COMPOSANT GESTION UTILISATEURS =====
  
  const UserManagementPanel = () => {
    if (!userData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Gestion Utilisateurs</h1>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nouvel Utilisateur</span>
          </Button>
        </div>

        {/* Actions Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{userData.validations.pendingExperts.length}</div>
                  <div className="text-sm text-gray-600">Experts à valider</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{userData.validations.pendingClients.length}</div>
                  <div className="text-sm text-gray-600">Clients en attente</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{userData.validations.pendingDossiers.length}</div>
                  <div className="text-sm text-gray-600">Dossiers à traiter</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Experts en Attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              <span>Experts en Attente de Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userData.validations.pendingExperts.length > 0 ? (
                userData.validations.pendingExperts.map((expert) => (
                  <div key={expert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{expert.name.split(' ').map((n: string) => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-medium">{expert.name}</div>
                        <div className="text-sm text-gray-600">{expert.email}</div>
                        <div className="text-xs text-gray-500">
                          Spécialisations: {expert.specializations.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="secondary" className="text-green-600 border-green-600 hover:bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button size="sm" variant="secondary" className="text-red-600 border-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun expert en attente de validation</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
              {activeTab === 'users' && <UserManagementPanel />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOptimized; 