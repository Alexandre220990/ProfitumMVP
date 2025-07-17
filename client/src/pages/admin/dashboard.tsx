import React, { useState, useCallback } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/design-system/Card";
import Button from "@/components/ui/design-system/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Badge from "@/components/ui/design-system/Badge";
import { useToast } from "@/components/ui/toast-notifications";
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  BookOpen,
  Settings,
  Database,
  UserCheck,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Monitor,
  TestTube,
  Terminal,
  Eye,
  UserPlus,
  FolderOpen,
  Gauge,
  Zap,
  Activity
} from "lucide-react";

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { addToast } = useToast();

  // Données par défaut pour le dashboard
  const defaultMetrics = {
    activeUsers: 1250,
    completedDossiers: 342,
    totalRevenue: 125000,
    conversionRate: 15.8,
    securityScore: 92,
    complianceScore: 98.5,
    totalClients: 890,
    totalExperts: 156,
    activeDossiers: 234,
    pendingValidations: 45
  };

  const refreshMetrics = useCallback(() => {
    addToast({
      type: 'info',
      title: 'Actualisation en cours',
      message: 'Mise à jour des métriques...',
      duration: 2000
    });
    
    // Simulation d'actualisation
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Métriques actualisées',
        message: 'Les données ont été mises à jour avec succès',
        duration: 3000
      });
    }, 2000);
  }, [addToast]);

  // Vérifier les permissions - seulement si pas d'utilisateur
  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  // Si l'utilisateur n'est pas admin, rediriger vers la page appropriée
  if (user.type !== 'admin') {
    if (user.type === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.type === 'expert') {
      return <Navigate to="/expert" replace />;
    } else {
      return <Navigate to="/connect-admin" replace />;
    }
  }

  // Modules du dashboard organisés par catégorie
  const dashboardModules = {
    monitoring: [
      {
        id: 'monitoring',
        title: 'Monitoring & Analytics',
        description: 'Surveillance système et tableaux de bord',
        icon: Monitor,
        color: 'from-blue-500 to-cyan-500',
        path: '/admin/monitoring',
        stats: { active: 12, total: 15 }
      },
      {
        id: 'tests',
        title: 'Tests Système',
        description: 'Tests automatisés et diagnostics',
        icon: TestTube,
        color: 'from-purple-500 to-pink-500',
        path: '/admin/tests',
        stats: { passed: 89, total: 92 }
      },
      {
        id: 'terminal',
        title: 'Terminal Tests',
        description: 'Tests avancés et diagnostics techniques',
        icon: Terminal,
        color: 'from-orange-500 to-red-500',
        path: '/admin/terminal-tests',
        stats: { running: 3, total: 8 }
      }
    ],
    users: [
      {
        id: 'clients',
        title: 'Gestion Clients',
        description: 'Gestion complète de la base clients',
        icon: Users,
        color: 'from-indigo-500 to-purple-500',
        path: '/admin/gestion-clients',
        stats: { total: defaultMetrics.totalClients, active: 756 }
      },
      {
        id: 'experts',
        title: 'Gestion Experts',
        description: 'Gestion des experts et compétences',
        icon: UserCheck,
        color: 'from-teal-500 to-cyan-500',
        path: '/admin/gestion-experts',
        stats: { total: defaultMetrics.totalExperts, available: 89 }
      },
      {
        id: 'client-details',
        title: 'Détails Clients',
        description: 'Vue détaillée des profils clients',
        icon: Eye,
        color: 'from-blue-600 to-indigo-600',
        path: '/admin/client-details',
        stats: { viewed: 234, total: defaultMetrics.totalClients }
      },
      {
        id: 'expert-form',
        title: 'Formulaire Expert',
        description: 'Création et édition des profils experts',
        icon: UserPlus,
        color: 'from-emerald-500 to-teal-500',
        path: '/admin/formulaire-expert',
        stats: { created: 45, pending: 12 }
      },
      {
        id: 'validation',
        title: 'Validation Dashboard',
        description: 'Validation des processus et workflows',
        icon: CheckCircle,
        color: 'from-green-500 to-emerald-500',
        path: '/admin/validation-dashboard',
        stats: { pending: defaultMetrics.pendingValidations, total: 67 }
      },
      {
        id: 'dossiers',
        title: 'Gestion Dossiers',
        description: 'Gestion des dossiers et processus',
        icon: FolderOpen,
        color: 'from-rose-500 to-pink-500',
        path: '/admin/gestion-dossiers',
        stats: { active: defaultMetrics.activeDossiers, completed: defaultMetrics.completedDossiers }
      }
    ],
    documents: [
      {
        id: 'ged',
        title: 'GED Management',
        description: 'Gestion Électronique Documentaire',
        icon: FileText,
        color: 'from-slate-500 to-gray-500',
        path: '/admin/admin-document-upload',
        stats: { documents: 1234, categories: 8 }
      },
      {
        id: 'upload',
        title: 'Upload Documents',
        description: 'Upload et gestion des guides prêts',
        icon: BookOpen,
        color: 'from-amber-500 to-orange-500',
        path: '/admin/admin-document-upload',
        stats: { uploaded: 89, templates: 15 }
      },
      {
        id: 'documentation',
        title: 'Documentation',
        description: 'Interface de consultation documentaire',
        icon: Database,
        color: 'from-violet-500 to-purple-500',
        path: '/admin/documentation',
        stats: { articles: 567, views: 2340 }
      }
    ]
  };

  const metricCards = [
    {
      title: 'Utilisateurs Actifs',
      value: defaultMetrics.activeUsers,
      change: 12.5,
      changeType: 'increase',
      icon: Users,
      color: 'text-blue-600',
      format: 'number'
    },
    {
      title: 'Dossiers Complétés',
      value: defaultMetrics.completedDossiers,
      change: 8.3,
      changeType: 'increase',
      icon: FileText,
      color: 'text-green-600',
      format: 'number'
    },
    {
      title: 'Revenus Totaux',
      value: defaultMetrics.totalRevenue,
      change: 15.2,
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-emerald-600',
      format: 'currency'
    },
    {
      title: 'Taux de Conversion',
      value: defaultMetrics.conversionRate,
      change: -2.1,
      changeType: 'decrease',
      icon: TrendingUp,
      color: 'text-orange-600',
      format: 'percentage'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingUp className="w-4 h-4 rotate-180" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header principal - Amélioré */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Dashboard Administrateur
            </h1>
            <p className="text-slate-600 text-lg">
              Centre de contrôle et gestion de la plateforme Profitum
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={refreshMetrics} 
              variant="secondary" 
              className="flex items-center gap-2 hover:shadow-md transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button 
              className="flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Métriques principales - Améliorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${metric.color.replace('text-', 'bg-')} bg-opacity-10`}>
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {getChangeIcon(metric.changeType)}
                      <span className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatValue(metric.value, metric.format)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Onglets des modules - Améliorés */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-in">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Monitor className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble - Améliorée */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Modules prioritaires */}
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Modules Prioritaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    dashboardModules.monitoring[0],
                    dashboardModules.users[0],
                    dashboardModules.documents[0]
                  ].map((module) => (
                    <div 
                      key={module.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:shadow-md transition-all duration-300 group cursor-pointer"
                      onClick={() => window.location.href = module.path}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Statistiques système */}
              <Card className="animate-scale-in hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-blue-500" />
                    Statistiques Système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{defaultMetrics.securityScore}%</div>
                      <div className="text-sm text-green-700">Score Sécurité</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{defaultMetrics.complianceScore}%</div>
                      <div className="text-sm text-blue-700">Conformité ISO</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">Performance système</span>
                    </div>
                    <Badge variant="primary">Excellent</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.monitoring.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.users.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardModules.documents.map((module, index) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card 
                    className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" 
                    onClick={() => window.location.href = module.path}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-200`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.title}</h4>
                          <p className="text-sm text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="group-hover:bg-white transition-colors duration-200">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;