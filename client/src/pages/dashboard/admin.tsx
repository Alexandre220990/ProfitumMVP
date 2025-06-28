import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Settings, BarChart, TrendingUp, DollarSign, Clock, AlertTriangle, LogOut } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

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

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/connect-admin');
    }
  }, [user, navigate]);

  // Charger les données du dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/connect-admin');
          return;
        }

        const response = await fetch('http://localhost:5001/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const data = await response.json();
        setDashboardData(data.data);
      } catch (err) {
        setError('Erreur lors du chargement du dashboard');
        console.error('Erreur dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/connect-admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Administration Profitum</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bienvenue, {user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.kpis.users.totalClients || 0}
              </div>
              <p className="text-xs text-gray-500">
                +{dashboardData?.kpis.users.newClientsThisMonth || 0} ce mois
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Experts</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.kpis.users.totalExperts || 0}
              </div>
              <p className="text-xs text-gray-500">
                {dashboardData?.kpis.users.pendingExperts || 0} en attente
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Dossiers</CardTitle>
              <BarChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.kpis.dossiers.total || 0}
              </div>
              <p className="text-xs text-gray-500">
                {dashboardData?.kpis.dossiers.active || 0} actifs
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gains</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.kpis.financier.totalObtainedGain?.toLocaleString('fr-FR') || '0'}€
              </div>
              <p className="text-xs text-gray-500">
                {dashboardData?.kpis.financier.successRate || 0}% de réussite
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et Statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Funnel de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clients</span>
                  <span className="font-semibold">{dashboardData?.funnel.clients || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produits Éligibles</span>
                  <span className="font-semibold">{dashboardData?.funnel.eligibleProducts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Audits</span>
                  <span className="font-semibold">{dashboardData?.funnel.audits || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Terminés</span>
                  <span className="font-semibold text-green-600">{dashboardData?.funnel.completed || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Alertes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.kpis.dossiers.delayed || 0} dossiers en retard
                    </p>
                    <p className="text-xs text-gray-500">Plus de 30 jours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dashboardData?.kpis.users.pendingExperts || 0} experts en attente
                    </p>
                    <p className="text-xs text-gray-500">Approbation requise</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/admin/gestion-experts')}
              >
                <Users className="mr-2 h-4 w-4" />
                Gérer les Experts
              </Button>
              <Button 
                className="w-full justify-start bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/admin/gestion-clients')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Gérer les Clients
              </Button>
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                <BarChart className="mr-2 h-4 w-4" />
                Voir les Dossiers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 