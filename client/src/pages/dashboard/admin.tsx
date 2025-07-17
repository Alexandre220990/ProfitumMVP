import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Users, BarChart, DollarSign, Clock, AlertTriangle, LogOut, 
  Settings, UserPlus, Database, Monitor, CheckCircle, 
  TrendingUp, Activity, BookOpen, FolderOpen, UserCheck, Zap,
  ArrowUpRight, Target, Calendar, Globe
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DashboardData {
  kpis: {
    users: {
      totalClients: number;
      totalExperts: number;
      pendingExperts: number;
      newClientsThisMonth: number;
      newExpertsThisMonth: number;
    };
    dossiers: {
      total: number;
      active: number;
      completed: number;
      delayed: number;
    };
    financier: {
      totalPotentialGain: number;
      totalObtainedGain: number;
      conversionRate: number;
      auditRate: number;
      successRate: number;
    };
  };
  produitStats: Record<string, { total: number; eligible: number }>;
  expertStats: Array<{
    id: string;
    name: string;
    rating: number;
    compensation: number;
    specializations: string[];
  }>;
  dailyStats: Array<{
    date: string;
    newClients: number;
    newAudits: number;
  }>;
  locationStats: Array<{
    city: string;
    count: number;
  }>;
  funnel: {
    clients: number;
    eligibleProducts: number;
    audits: number;
    completed: number;
  };
}

// Configuration des actions rapides
const quickActions = [
  {
    title: "Documentation",
    description: "Centre documentaire",
    icon: BookOpen,
    path: "/admin/documentation-new",
    color: "bg-blue-500 hover:bg-blue-600",
    badge: "Nouveau"
  },
  {
    title: "Gestion Experts",
    description: "Gérer les experts",
    icon: UserCheck,
    path: "/admin/gestion-experts",
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    title: "Gestion Clients",
    description: "Gérer les clients",
    icon: Users,
    path: "/admin/gestion-clients",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    title: "Gestion Dossiers",
    description: "Suivi des dossiers",
    icon: FolderOpen,
    path: "/admin/gestion-dossiers",
    color: "bg-orange-500 hover:bg-orange-600"
  },
  {
    title: "Monitoring",
    description: "Surveillance système",
    icon: Monitor,
    path: "/admin/monitoring",
    color: "bg-red-500 hover:bg-red-600"
  },
  {
    title: "Validation",
    description: "Dashboard validation",
    icon: CheckCircle,
    path: "/admin/validation-dashboard",
    color: "bg-emerald-500 hover:bg-emerald-600"
  },
  {
    title: "Formulaire Expert",
    description: "Créer un expert",
    icon: UserPlus,
    path: "/admin/formulaire-expert",
    color: "bg-indigo-500 hover:bg-indigo-600"
  },
  {
    title: "GED Management",
    description: "Gestion documents",
    icon: Database,
    path: "/admin/admin-document-upload",
    color: "bg-teal-500 hover:bg-teal-600"
  },
  {
    title: "Terminal Tests",
    description: "Tests système",
    icon: Settings,
    path: "/admin/terminal-tests",
    color: "bg-gray-500 hover:bg-gray-600"
  },
  {
    title: "Tests",
    description: "Tests fonctionnels",
    icon: Zap,
    path: "/admin/tests",
    color: "bg-pink-500 hover:bg-pink-600"
  }
];

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Attendre que l'authentification soit vérifiée
  useEffect(() => {
    if (!authLoading) {
      // Si pas d'utilisateur après vérification, rediriger
      if (!user) {
        console.log('🔒 Aucun utilisateur connecté, redirection vers connect-admin');
        navigate('/connect-admin');
        return;
      }

      // Si l'utilisateur n'est pas admin, rediriger
      if (user.type !== 'admin') {
        console.log('🚫 Utilisateur non admin, redirection vers connect-admin');
        navigate('/connect-admin');
        return;
      }

      // Si tout est OK, charger les données
      fetchDashboardData();
    }
  }, [user, authLoading, navigate]);

  // Charger les données du dashboard
  const fetchDashboardData = async () => {
    try {
      console.log('📊 Chargement des données du dashboard admin...');
      
      // Utiliser le token du localStorage ou de Supabase
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ Aucun token disponible');
        setError('Token d\'authentification manquant');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Réponse API:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('🔒 Token invalide, redirection vers connect-admin');
          navigate('/connect-admin');
          return;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Données dashboard reçues:', data);
      setDashboardData(data.data);
    } catch (err) {
      console.error('❌ Erreur dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/connect-admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header moderne */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                <div className="w-4 h-6 bg-blue-600 rounded-sm"></div>
                <div className="w-4 h-6 bg-white border border-gray-300 rounded-sm"></div>
                <div className="w-4 h-6 bg-red-600 rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administration Profitum</h1>
                <p className="text-sm text-gray-500">Tableau de bord de gestion</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-300">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* KPIs Principaux avec design moderne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.kpis.users.totalClients?.toLocaleString('fr-FR') || '0'}
              </div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <p className="text-sm text-green-600 font-medium">
                  +{dashboardData?.kpis.users.newClientsThisMonth || 0} ce mois
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Experts Actifs</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.kpis.users.totalExperts?.toLocaleString('fr-FR') || '0'}
              </div>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {dashboardData?.kpis.users.pendingExperts || 0} en attente
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Dossiers Actifs</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.kpis.dossiers.active?.toLocaleString('fr-FR') || '0'}
              </div>
              <div className="flex items-center mt-2">
                <p className="text-sm text-gray-500">
                  {dashboardData?.kpis.dossiers.completed || 0} terminés
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gains Réalisés</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData?.kpis.financier.totalObtainedGain?.toLocaleString('fr-FR') || '0'}€
              </div>
              <div className="flex items-center mt-2">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <p className="text-sm text-blue-600 font-medium">
                  {dashboardData?.kpis.financier.successRate || 0}% de réussite
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Actions Rapides moderne */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Actions Rapides</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Accès direct aux fonctionnalités principales</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`h-auto p-4 flex flex-col items-center space-y-3 ${action.color} text-white hover:scale-105 transition-all duration-200 shadow-md`}
                  onClick={() => navigate(action.path)}
                >
                  <div className="relative">
                    <action.icon className="h-6 w-6" />
                    {action.badge && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métriques avancées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Funnel de Conversion</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Clients</span>
                  </div>
                  <span className="font-bold text-blue-600">{dashboardData?.funnel.clients?.toLocaleString('fr-FR') || '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Produits Éligibles</span>
                  </div>
                  <span className="font-bold text-green-600">{dashboardData?.funnel.eligibleProducts?.toLocaleString('fr-FR') || '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Audits</span>
                  </div>
                  <span className="font-bold text-purple-600">{dashboardData?.funnel.audits?.toLocaleString('fr-FR') || '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Terminés</span>
                  </div>
                  <span className="font-bold text-emerald-600">{dashboardData?.funnel.completed?.toLocaleString('fr-FR') || '0'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Alertes & Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.kpis.dossiers.delayed || 0} dossiers en retard
                    </p>
                    <p className="text-xs text-gray-500">Plus de 30 jours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.kpis.users.pendingExperts || 0} experts en attente
                    </p>
                    <p className="text-xs text-gray-500">Approbation requise</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.kpis.users.newClientsThisMonth || 0} nouveaux clients
                    </p>
                    <p className="text-xs text-gray-500">Ce mois-ci</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques géographiques */}
        {dashboardData?.locationStats && dashboardData.locationStats.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Répartition Géographique</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.locationStats.slice(0, 6).map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{location.city}</span>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      {location.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 