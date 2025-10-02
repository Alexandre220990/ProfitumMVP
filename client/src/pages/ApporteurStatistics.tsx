import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apporteurApi } from '@/services/apporteur-api';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Target,
  Download,
} from 'lucide-react';

interface StatisticsData {
  prospects: {
    total: number;
    qualified: number;
    converted: number;
    conversion_rate: number;
  };
  meetings: {
    total: number;
    completed: number;
    success_rate: number;
  };
  commissions: {
    total_earnings: number;
    monthly_earnings: number;
    pending_amount: number;
  };
  performance: {
    score: number;
    ranking: number;
    total_apporteurs: number;
  };
}

export default function ApporteurStatistics() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getStats();
      
      if (result.success && result.data) {
        setStats(result.data as StatisticsData);
      } else {
        // Si pas de données, initialiser avec des zéros
        setStats({
          prospects: {
            total: 0,
            qualified: 0,
            converted: 0,
            conversion_rate: 0
          },
          meetings: {
            total: 0,
            completed: 0,
            success_rate: 0
          },
          commissions: {
            total_earnings: 0,
            monthly_earnings: 0,
            pending_amount: 0
          },
          performance: {
            score: 0,
            ranking: 0,
            total_apporteurs: 0
          }
        });
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error('Erreur fetchStatistics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // En cas d'erreur, initialiser avec des zéros
      setStats({
        prospects: {
          total: 0,
          qualified: 0,
          converted: 0,
          conversion_rate: 0
        },
        meetings: {
          total: 0,
          completed: 0,
          success_rate: 0
        },
        commissions: {
          total_earnings: 0,
          monthly_earnings: 0,
          pending_amount: 0
        },
        performance: {
          score: 0,
          ranking: 0,
          total_apporteurs: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d' | '1y') => {
    setPeriod(newPeriod);
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
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchStatistics} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600">Analyse de vos performances</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">1 an</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Prospects totaux</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prospects.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.prospects.qualified} qualifiés ({Math.round((stats.prospects.qualified / stats.prospects.total) * 100)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Taux de conversion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prospects.conversion_rate}%</p>
                <p className="text-xs text-gray-500">
                  {stats.prospects.converted} conversions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">RDV réussis</p>
                <p className="text-2xl font-bold text-gray-900">{stats.meetings.success_rate}%</p>
                <p className="text-xs text-gray-500">
                  {stats.meetings.completed}/{stats.meetings.total} RDV
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Gains totaux</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.commissions.total_earnings.toLocaleString()}€
                </p>
                <p className="text-xs text-gray-500">
                  {stats.commissions.monthly_earnings.toLocaleString()}€ ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Score global</span>
                <span className="text-2xl font-bold text-blue-600">{stats.performance.score}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.performance.score / 10) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Classement</span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.performance.ranking}ᵉ sur {stats.performance.total_apporteurs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objectifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Prospects mensuels</span>
                  <span className="text-sm text-gray-500">8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Conversions mensuelles</span>
                  <span className="text-sm text-gray-500">3/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Gains mensuels</span>
                  <span className="text-sm text-gray-500">4.2k€/5k€</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau de bord détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.prospects.total}
              </div>
              <div className="text-sm text-gray-600">Prospects totaux</div>
              <div className="text-xs text-gray-500 mt-1">
                +12% vs mois dernier
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.prospects.conversion_rate}%
              </div>
              <div className="text-sm text-gray-600">Taux de conversion</div>
              <div className="text-xs text-gray-500 mt-1">
                +5% vs mois dernier
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.commissions.monthly_earnings.toLocaleString()}€
              </div>
              <div className="text-sm text-gray-600">Gains ce mois</div>
              <div className="text-xs text-gray-500 mt-1">
                +18% vs mois dernier
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
