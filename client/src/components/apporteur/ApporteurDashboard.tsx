import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  BarChart3
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';

interface DashboardData {
  prospects: {
    total: number;
    qualified: number;
    pending: number;
    new_this_month: number;
  };
  conversions: {
    signed_this_month: number;
    conversion_rate: number;
    in_progress: number;
    monthly_goal: number;
    goal_achieved: boolean;
  };
  commissions: {
    pending: number;
    paid_this_month: number;
    total_year: number;
    pending_amount: number;
  };
  experts: {
    active: number;
    available: number;
    top_performer: string;
    avg_response_time: string;
  };
}

export default function ApporteurDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getDashboardData();
      
      if (result.success && result.data) {
        setDashboardData(result.data as DashboardData);
      } else {
        // Si pas de données, initialiser avec des zéros
        setDashboardData({
          prospects: {
            total: 0,
            qualified: 0,
            pending: 0,
            new_this_month: 0
          },
          conversions: {
            signed_this_month: 0,
            conversion_rate: 0,
            in_progress: 0,
            monthly_goal: 0,
            goal_achieved: false
          },
          commissions: {
            pending: 0,
            paid_this_month: 0,
            total_year: 0,
            pending_amount: 0
          },
          experts: {
            active: 0,
            available: 0,
            top_performer: '',
            avg_response_time: ''
          }
        });
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Erreur fetchDashboardData:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // En cas d'erreur, initialiser avec des zéros
      setDashboardData({
        prospects: {
          total: 0,
          qualified: 0,
          pending: 0,
          new_this_month: 0
        },
        conversions: {
          signed_this_month: 0,
          conversion_rate: 0,
          in_progress: 0,
          monthly_goal: 0,
          goal_achieved: false
        },
        commissions: {
          pending: 0,
          paid_this_month: 0,
          total_year: 0,
          pending_amount: 0
        },
        experts: {
          active: 0,
          available: 0,
          top_performer: '',
          avg_response_time: ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Apporteur</h1>
          <p className="text-gray-600">Vue d'ensemble de votre activité</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prospect
        </Button>
      </div>

      {/* Groupe 1 - PROSPECTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            PROSPECTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{dashboardData.prospects.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.prospects.qualified}</div>
              <div className="text-sm text-gray-600">Qualifiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.prospects.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.prospects.new_this_month}</div>
              <div className="text-sm text-gray-600">Nouveaux ce mois</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groupe 2 - CONVERSIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            CONVERSIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.conversions.signed_this_month}</div>
              <div className="text-sm text-gray-600">Signés ce mois</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.conversions.conversion_rate}%</div>
              <div className="text-sm text-gray-600">Taux conversion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.conversions.in_progress}</div>
              <div className="text-sm text-gray-600">En cours</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{dashboardData.conversions.monthly_goal}</div>
                {dashboardData.conversions.goal_achieved ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="text-sm text-gray-600">Objectif mensuel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groupe 3 - COMMISSIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            COMMISSIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.commissions.pending.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Encours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.commissions.paid_this_month.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Payées ce mois</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.commissions.pending_amount.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{dashboardData.commissions.total_year.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Total année</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Gérer les Prospects</h3>
                <p className="text-sm text-gray-600">Voir et gérer tous vos prospects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Planifier un RDV</h3>
                <p className="text-sm text-gray-600">Organiser un rendez-vous</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Voir les Statistiques</h3>
                <p className="text-sm text-gray-600">Analyser vos performances</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Notifications Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Expert a accepté le prospect</p>
                <p className="text-sm text-gray-600">Jean Dupont - Entreprise ABC</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Meeting planifié</p>
                <p className="text-sm text-gray-600">RDV confirmé pour demain 14h</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Deadline approchante</p>
                <p className="text-sm text-gray-600">Réponse expert attendue dans 2h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
