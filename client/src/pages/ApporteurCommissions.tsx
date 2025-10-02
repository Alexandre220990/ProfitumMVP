import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Download,
  Filter,
  Calendar,
  Target
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';

interface Commission {
  id: string;
  client_name: string;
  company_name: string;
  product_name: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
}

interface CommissionStats {
  total_pending: number;
  total_paid: number;
  total_cancelled: number;
  monthly_earnings: number;
  yearly_earnings: number;
  pending_amount: number;
  paid_amount: number;
}

export default function ApporteurCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');

  useEffect(() => {
    fetchCommissions();
    fetchStats();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getCommissions();
      
      if (result.success && result.data) {
        setCommissions(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Erreur lors du chargement des commissions');
      }
    } catch (err) {
      console.error('Erreur fetchCommissions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await apporteurApi.getStats();
      
      if (result.success && result.data) {
        setStats(result.data as CommissionStats);
      }
    } catch (err) {
      console.error('Erreur fetchStats:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      'paid': { color: 'bg-green-100 text-green-800', label: 'Payée' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Annulée' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredCommissions = commissions.filter(commission => {
    if (filter === 'all') return true;
    return commission.status === filter;
  });

  const handleFilterChange = (newFilter: 'all' | 'pending' | 'paid' | 'cancelled') => {
    setFilter(newFilter);
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
          <Button onClick={fetchCommissions} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-600">Suivi de vos revenus et commissions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pending_amount.toLocaleString()}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Payées ce mois</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.paid_amount.toLocaleString()}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total année</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.yearly_earnings.toLocaleString()}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Objectif mensuel</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.monthly_earnings.toLocaleString()}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('all')}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('pending')}
                size="sm"
              >
                En attente
              </Button>
              <Button
                variant={filter === 'paid' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('paid')}
                size="sm"
              >
                Payées
              </Button>
              <Button
                variant={filter === 'cancelled' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('cancelled')}
                size="sm"
              >
                Annulées
              </Button>
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Plus de filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commissions */}
      <div className="grid gap-4">
        {filteredCommissions.map((commission) => (
          <Card key={commission.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{commission.client_name}</h3>
                    {getStatusBadge(commission.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {commission.company_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(commission.created_at).toLocaleDateString()}
                    </div>
                    {commission.paid_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Payé le {new Date(commission.paid_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Produit:</span>
                      <span className="ml-1 font-medium">{commission.product_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Montant base:</span>
                      <span className="ml-1 font-medium">{commission.base_amount.toLocaleString()}€</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Taux:</span>
                      <span className="ml-1 font-medium">{commission.commission_rate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Commission:</span>
                      <span className="ml-1 font-bold text-green-600">
                        {commission.commission_amount.toLocaleString()}€
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {commission.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      Suivre
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCommissions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commission</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Vous n\'avez pas encore de commissions.'
                : `Aucune commission ${filter === 'pending' ? 'en attente' : filter === 'paid' ? 'payée' : 'annulée'}.`
              }
            </p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setFilter('all')}
              >
                Voir toutes les commissions
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
