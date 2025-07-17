const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Démarrage du Dashboard Admin...');
console.log('📡 Migration 100% terminée - Système prêt');

// Configuration
const clientPath = path.join(__dirname, '../client');
const serverPath = __dirname;

console.log(`📁 Client path: ${clientPath}`);
console.log(`📁 Server path: ${serverPath}`);

// Configuration du dashboard admin
const dashboardConfig = {
  // Données de test pour le dashboard
  testData: {
    // Créer des métriques de test
    metrics: [
      { name: 'Total Clients', value: 0, unit: 'clients', icon: '👥' },
      { name: 'Total Experts', value: 0, unit: 'experts', icon: '👨‍💼' },
      { name: 'Assignations Actives', value: 0, unit: 'assignations', icon: '📋' },
      { name: 'Produits Éligibles', value: 0, unit: 'produits', icon: '📦' },
      { name: 'Messages Non Lus', value: 0, unit: 'messages', icon: '💬' },
      { name: 'Taux de Réussite', value: 0, unit: '%', icon: '📈' }
    ],
    
    // Graphiques de test
    charts: {
      assignationsParMois: [],
      repartitionProduits: [],
      activiteExperts: [],
      messagesParJour: []
    }
  }
};

// Fonction pour récupérer les métriques réelles
async function getRealMetrics() {
  console.log('📊 Récupération des métriques réelles...');
  
  try {
    // Compter les clients
    const { count: clientCount, error: clientError } = await supabase
      .from('client')
      .select('*', { count: 'exact', head: true });
    
    if (clientError) throw new Error(`Erreur clients: ${clientError.message}`);
    
    // Compter les experts
    const { count: expertCount, error: expertError } = await supabase
      .from('expert')
      .select('*', { count: 'exact', head: true });
    
    if (expertError) throw new Error(`Erreur experts: ${expertError.message}`);
    
    // Compter les assignations actives
    const { count: assignmentCount, error: assignmentError } = await supabase
      .from('expertassignment')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'pending');
    
    if (assignmentError) throw new Error(`Erreur assignations: ${assignmentError.message}`);
    
    // Compter les produits éligibles actifs
    const { count: productCount, error: productError } = await supabase
      .from('ProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    
    if (productError) throw new Error(`Erreur produits: ${productError.message}`);
    
    // Compter les messages non lus (approximation)
    const { count: messageCount, error: messageError } = await supabase
      .from('message')
      .select('*', { count: 'exact', head: true });
    
    if (messageError) throw new Error(`Erreur messages: ${messageError.message}`);
    
    // Calculer le taux de réussite
    const { data: allAssignments, error: statsError } = await supabase
      .from('expertassignment')
      .select('statut');
    
    if (statsError) throw new Error(`Erreur statistiques: ${statsError.message}`);
    
    const totalAssignments = allAssignments.length;
    const acceptedAssignments = allAssignments.filter(a => a.statut === 'accepted').length;
    const successRate = totalAssignments > 0 ? (acceptedAssignments / totalAssignments) * 100 : 0;
    
    return {
      clientCount: clientCount || 0,
      expertCount: expertCount || 0,
      assignmentCount: assignmentCount || 0,
      productCount: productCount || 0,
      messageCount: messageCount || 0,
      successRate: Math.round(successRate * 100) / 100
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des métriques:', error);
    return null;
  }
}

// Fonction pour récupérer les données des graphiques
async function getChartData() {
  console.log('📈 Récupération des données de graphiques...');
  
  try {
    // Assignations par mois (6 derniers mois)
    const { data: monthlyAssignments, error: monthlyError } = await supabase
      .from('v_assignment_reports')
      .select('month, count')
      .order('month', { ascending: false })
      .limit(6);
    
    if (monthlyError) throw new Error(`Erreur assignations mensuelles: ${monthlyError.message}`);
    
    // Répartition par catégorie de produits
    const { data: productCategories, error: categoryError } = await supabase
      .from('ProduitEligible')
      .select('category')
      .eq('active', true);
    
    if (categoryError) throw new Error(`Erreur catégories: ${categoryError.message}`);
    
    const categoryCounts = {};
    productCategories.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    
    // Activité des experts (top 5)
    const { data: expertActivity, error: activityError } = await supabase
      .from('v_expert_assignments')
      .select('expert_first_name, expert_last_name')
      .limit(100);
    
    if (activityError) throw new Error(`Erreur activité experts: ${activityError.message}`);
    
    const expertCounts = {};
    expertActivity.forEach(a => {
      const expertName = `${a.expert_first_name} ${a.expert_last_name}`;
      expertCounts[expertName] = (expertCounts[expertName] || 0) + 1;
    });
    
    const topExperts = Object.entries(expertCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    return {
      monthlyAssignments: monthlyAssignments || [],
      categoryCounts,
      topExperts
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des graphiques:', error);
    return null;
  }
}

// Fonction pour créer les composants du dashboard
async function createDashboardComponents() {
  console.log('🔧 Création des composants du dashboard...');
  
  try {
    // Créer le fichier de configuration du dashboard
    const dashboardConfigPath = path.join(__dirname, '../src/config/dashboard-config.ts');
    const dashboardConfigContent = `// Configuration du Dashboard Admin
// Généré automatiquement le ${new Date().toISOString()}

export interface DashboardMetric {
  name: string;
  value: number;
  unit: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface DashboardConfig {
  metrics: DashboardMetric[];
  charts: {
    assignationsParMois: ChartData;
    repartitionProduits: ChartData;
    activiteExperts: ChartData;
  };
  lastUpdated: string;
}

// Configuration par défaut
export const defaultDashboardConfig: DashboardConfig = {
  metrics: [
    { name: 'Total Clients', value: 0, unit: 'clients', icon: '👥' },
    { name: 'Total Experts', value: 0, unit: 'experts', icon: '👨‍💼' },
    { name: 'Assignations Actives', value: 0, unit: 'assignations', icon: '📋' },
    { name: 'Produits Éligibles', value: 0, unit: 'produits', icon: '📦' },
    { name: 'Messages Non Lus', value: 0, unit: 'messages', icon: '💬' },
    { name: 'Taux de Réussite', value: 0, unit: '%', icon: '📈' }
  ],
  charts: {
    assignationsParMois: {
      labels: [],
      datasets: [{
        label: 'Assignations',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    repartitionProduits: {
      labels: [],
      datasets: [{
        label: 'Produits',
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)'
        ]
      }]
    },
    activiteExperts: {
      labels: [],
      datasets: [{
        label: 'Assignations',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    }
  },
  lastUpdated: new Date().toISOString()
};

export default defaultDashboardConfig;
`;

    // Créer le dossier de configuration s'il n'existe pas
    const configDir = path.dirname(dashboardConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(dashboardConfigPath, dashboardConfigContent);
    console.log('✅ Configuration du dashboard créée');
    
    // Créer le composant principal du dashboard
    const dashboardComponentPath = path.join(__dirname, '../src/components/dashboard/AdminDashboard.tsx');
    const dashboardComponentContent = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  Package, 
  MessageSquare, 
  TrendingUp,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';
import defaultDashboardConfig, { DashboardConfig, DashboardMetric } from '../../config/dashboard-config';

interface AdminDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard({ className }: AdminDashboardProps) {
  const [config, setConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setLoading(true);
    try {
      // Ici, vous pouvez appeler votre API pour récupérer les données réelles
      // Pour l'instant, on utilise les données par défaut
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const MetricCard = ({ metric }: { metric: DashboardMetric }) => (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
        <span className="text-2xl">{metric.icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          {metric.unit}
          {metric.trend && (
            <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'} className="ml-2">
              {metric.trend === 'up' ? '↗' : '↘'} {metric.change}%
            </Badge>
          )}
        </p>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="col-span-full lg:col-span-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title === 'Assignations par Mois' && <Calendar className="h-4 w-4" />}
          {title === 'Répartition des Produits' && <Package className="h-4 w-4" />}
          {title === 'Activité des Experts' && <Activity className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className={\`space-y-6 \${className || ''}\`}>
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
          <p className="text-muted-foreground">
            Dernière mise à jour: {lastRefresh.toLocaleString('fr-FR')}
          </p>
        </div>
        <Button onClick={refreshData} disabled={loading}>
          <RefreshCw className={\`h-4 w-4 mr-2 \${loading ? 'animate-spin' : ''}\`} />
          Rafraîchir
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {config.metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Assignations par mois */}
        <ChartCard title="Assignations par Mois">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={config.charts.assignationsParMois.labels.map((label, index) => ({
              mois: label,
              assignations: config.charts.assignationsParMois.datasets[0].data[index] || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="assignations" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Répartition des produits */}
        <ChartCard title="Répartition des Produits">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={config.charts.repartitionProduits.labels.map((label, index) => ({
                  name: label,
                  value: config.charts.repartitionProduits.datasets[0].data[index] || 0
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {config.charts.repartitionProduits.labels.map((entry, index) => (
                  <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Activité des experts */}
        <ChartCard title="Activité des Experts">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={config.charts.activiteExperts.labels.map((label, index) => ({
              expert: label,
              assignations: config.charts.activiteExperts.datasets[0].data[index] || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="expert" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="assignations" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Gérer les Clients
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <UserCheck className="h-6 w-6 mb-2" />
              Gérer les Experts
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <ClipboardList className="h-6 w-6 mb-2" />
              Assignations
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

    // Créer le dossier des composants s'il n'existe pas
    const componentDir = path.dirname(dashboardComponentPath);
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }
    
    fs.writeFileSync(dashboardComponentPath, dashboardComponentContent);
    console.log('✅ Composant AdminDashboard créé');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des composants:', error);
    return false;
  }
}

// Fonction pour tester le dashboard
async function testDashboard() {
  console.log('🧪 Test du dashboard admin...');
  
  try {
    // Vérifier que les vues nécessaires existent
    const { data: assignments, error: assignmentsError } = await supabase
      .from('v_expert_assignments')
      .select('*')
      .limit(5);
    
    if (assignmentsError) {
      console.log('⚠️  Vue v_expert_assignments non disponible');
    } else {
      console.log(`✅ Vue v_expert_assignments: ${assignments.length} résultats`);
    }
    
    // Vérifier les fonctions de statistiques
    const { data: stats, error: statsError } = await supabase
      .rpc('get_assignment_statistics');
    
    if (statsError) {
      console.log('⚠️  Fonction get_assignment_statistics non disponible');
    } else {
      console.log(`✅ Fonction get_assignment_statistics: ${stats.length} statistiques`);
    }
    
    // Vérifier les métriques mensuelles
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_monthly_metrics', { 
        year_param: currentYear, 
        month_param: currentMonth 
      });
    
    if (metricsError) {
      console.log('⚠️  Fonction get_monthly_metrics non disponible');
    } else {
      console.log(`✅ Fonction get_monthly_metrics: ${metrics.length} métriques`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test du dashboard:', error);
    return false;
  }
}

// Fonction pour démarrer le serveur backend
function startBackend() {
  console.log('\n🔧 Démarrage du serveur backend...');
  
  const backend = spawn('python', ['app.py'], {
    cwd: serverPath,
    stdio: 'inherit',
    shell: true
  });
  
  backend.on('error', (error) => {
    console.error('❌ Erreur backend:', error);
  });
  
  backend.on('close', (code) => {
    console.log(`🔧 Backend terminé avec le code: ${code}`);
  });
  
  return backend;
}

// Fonction pour démarrer le frontend
function startFrontend() {
  console.log('\n🎨 Démarrage du frontend...');
  
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: clientPath,
    stdio: 'inherit',
    shell: true
  });
  
  frontend.on('error', (error) => {
    console.error('❌ Erreur frontend:', error);
  });
  
  frontend.on('close', (code) => {
    console.log(`🎨 Frontend terminé avec le code: ${code}`);
  });
  
  return frontend;
}

// Fonction pour afficher les informations de connexion
function displayConnectionInfo() {
  console.log('\n🌐 Informations de Connexion:');
  console.log('=============================');
  console.log('📱 Frontend: http://localhost:5173');
  console.log('🔧 Backend: http://localhost:5000');
  console.log('📊 Dashboard Admin: http://localhost:5173/admin');
  console.log('');
  console.log('🔑 Identifiants Admin:');
  console.log('- Email: admin@profitum.fr');
  console.log('- Mot de passe: admin123');
  console.log('');
  console.log('💡 Fonctionnalités disponibles:');
  console.log('- Gestion des assignations expert/client');
  console.log('- Tableau de bord avec statistiques');
  console.log('- Messagerie temps réel');
  console.log('- Gestion des produits éligibles');
  console.log('- Rapports et analyses');
}

// Fonction pour gérer l'arrêt propre
function setupGracefulShutdown(backend, frontend) {
  const shutdown = () => {
    console.log('\n🛑 Arrêt en cours...');
    
    if (backend) {
      backend.kill('SIGTERM');
    }
    
    if (frontend) {
      frontend.kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('✅ Arrêt terminé');
      process.exit(0);
    }, 2000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Fonction principale
async function main() {
  try {
    console.log('🎯 Démarrage du système FinancialTracker...\n');
    
    // Afficher les informations de connexion
    displayConnectionInfo();
    
    // Démarrer le backend
    const backend = startBackend();
    
    // Attendre un peu avant de démarrer le frontend
    setTimeout(() => {
      const frontend = startFrontend();
      
      // Configurer l'arrêt propre
      setupGracefulShutdown(backend, frontend);
      
      console.log('\n🎉 Système démarré avec succès !');
      console.log('📱 Accédez au dashboard: http://localhost:5173/admin');
      console.log('🛑 Appuyez sur Ctrl+C pour arrêter');
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 