import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  BarChart3,
  Building
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';
import ProspectForm from './ProspectForm';

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
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prospectModalOpen, setProspectModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Chargement des données du dashboard apporteur...');
      const result = await apporteurApi.getDashboardData();
      
      if (result.success && result.data) {
        console.log('✅ Données dashboard récupérées:', result.data);
        setDashboardData(result.data as DashboardData);
      } else {
        console.warn('⚠️ Pas de données dashboard, initialisation avec des zéros');
        setDashboardData(getDefaultDashboardData());
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('❌ Erreur fetchDashboardData:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setDashboardData(getDefaultDashboardData());
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour les données par défaut
  const getDefaultDashboardData = (): DashboardData => ({
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
      monthly_goal: 10,
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
      top_performer: 'Aucun expert assigné',
      avg_response_time: 'N/A'
    }
  });

  const handleProspectSuccess = () => {
    setProspectModalOpen(false);
    // Recharger les données du dashboard
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Apporteur</h1>
            <p className="text-gray-600">Vue d'ensemble de votre activité</p>
          </div>
        </div>
        
        {/* Error state */}
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDashboardData(getDefaultDashboardData())}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mode démo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Dialog open={prospectModalOpen} onOpenChange={setProspectModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau Prospect</DialogTitle>
            </DialogHeader>
            <ProspectForm 
              onSuccess={handleProspectSuccess}
              onCancel={() => setProspectModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Groupe 1 - PROSPECTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            PROSPECTS
            {dashboardData.prospects.total > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({dashboardData.prospects.qualified}/{dashboardData.prospects.total} qualifiés)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-3xl font-bold text-gray-900">{dashboardData.prospects.total}</div>
              <div className="text-sm text-gray-600">Total</div>
              {dashboardData.prospects.total === 0 && (
                <div className="text-xs text-gray-400 mt-1">Aucun prospect</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600">{dashboardData.prospects.qualified}</div>
              <div className="text-sm text-gray-600">Qualifiés</div>
              {dashboardData.prospects.total > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((dashboardData.prospects.qualified / dashboardData.prospects.total) * 100)}%
                </div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-600">{dashboardData.prospects.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
              {dashboardData.prospects.pending > 0 && (
                <div className="text-xs text-orange-500 mt-1">Action requise</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.prospects.new_this_month}</div>
              <div className="text-sm text-gray-600">Nouveaux ce mois</div>
              {dashboardData.prospects.new_this_month > 0 && (
                <div className="text-xs text-blue-500 mt-1">🔥 En croissance</div>
              )}
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
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600">{dashboardData.conversions.signed_this_month}</div>
              <div className="text-sm text-gray-600">Signés ce mois</div>
              <div className="text-xs text-gray-400 mt-1">
                vs {dashboardData.conversions.monthly_goal} objectif
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.conversions.conversion_rate}%</div>
              <div className="text-sm text-gray-600">Taux conversion</div>
              {dashboardData.conversions.conversion_rate >= 20 && (
                <div className="text-xs text-green-500 mt-1">🚀 Excellent</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="text-3xl font-bold text-purple-600">{dashboardData.conversions.in_progress}</div>
              <div className="text-sm text-gray-600">En cours</div>
              {dashboardData.conversions.in_progress > 0 && (
                <div className="text-xs text-purple-500 mt-1">⚡ Pipeline actif</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-bold text-gray-900">{dashboardData.conversions.monthly_goal}</div>
                {dashboardData.conversions.goal_achieved ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-500" />
                )}
              </div>
              <div className="text-sm text-gray-600">Objectif mensuel</div>
              <div className="text-xs text-gray-400 mt-1">
                {dashboardData.conversions.goal_achieved ? '✅ Atteint' : '🎯 En cours'}
              </div>
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
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-600">{dashboardData.commissions.pending.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">En cours</div>
              {dashboardData.commissions.pending > 0 && (
                <div className="text-xs text-yellow-600 mt-1">⏳ En attente</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600">{dashboardData.commissions.paid_this_month.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Payées ce mois</div>
              {dashboardData.commissions.paid_this_month > 0 && (
                <div className="text-xs text-green-600 mt-1">💰 Revenus confirmés</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">{dashboardData.commissions.pending_amount.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Montant en attente</div>
              {dashboardData.commissions.pending_amount > 0 && (
                <div className="text-xs text-blue-600 mt-1">🎯 Potentiel</div>
              )}
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-3xl font-bold text-gray-900">{dashboardData.commissions.total_year.toLocaleString()}€</div>
              <div className="text-sm text-gray-600">Total année</div>
              {dashboardData.commissions.total_year > 0 && (
                <div className="text-xs text-gray-500 mt-1">📈 Performance</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groupe 4 - EXPERTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            EXPERTS PARTENAIRES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.experts.active}</div>
                  <div className="text-sm text-gray-600">Experts actifs</div>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.experts.available}</div>
                  <div className="text-sm text-gray-600">Disponibles</div>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-600 mb-2">Meilleur performer</div>
                <div className="text-lg font-semibold text-gray-900">
                  {dashboardData.experts.top_performer || 'Aucun expert assigné'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-600 mb-2">Temps de réponse moyen</div>
                <div className="text-lg font-semibold text-gray-900">
                  {dashboardData.experts.avg_response_time || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/apporteur/prospects')}
        >
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

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/apporteur/meetings')}
        >
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

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/apporteur/statistics')}
        >
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
