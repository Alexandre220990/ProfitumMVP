import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { DollarSign, Download, Eye, Filter, CheckCircle, Clock, Building, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Commissions
 * Suivi des commissions et paiements
 */
export default function CommissionsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [commissions, setCommissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    const loadCommissions = async () => {
      if (!apporteurId || typeof apporteurId !== 'string') return;
      
      try {
        const service = new ApporteurRealDataService(apporteurId);
        const result = await service.getCommissions();
        const data = result.success ? result.data : null;
        setCommissions(data || []);
      } catch (err) {
        console.error('Erreur lors du chargement des commissions:', err);
        setCommissions([]);
      }
    };

    loadCommissions();
  }, [apporteurId]);

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à vos commissions.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  };

  const totalCommissions = commissions.reduce((sum, comm) => sum + comm.commission, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, comm) => sum + comm.commission, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, comm) => sum + comm.commission, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto py-6">
        {/* Header Optimisé */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Commissions</h1>
            <p className="text-gray-600 text-lg">Suivez vos commissions et paiements en temps réel</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" className="bg-white hover:bg-gray-50" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiques
            </Button>
          </div>
        </div>

        {/* Filtres Avancés */}
        {showFilters && (
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                  <Input
                    placeholder="Rechercher une commission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="paid">Payée</option>
                    <option value="pending">En attente</option>
                    <option value="processing">En cours</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Commissions Totales</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(totalCommissions)}
              </div>
              <p className="text-sm text-green-700">Toutes commissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Commissions Payées</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(paidCommissions)}
              </div>
              <p className="text-sm text-blue-700">Déjà reçues</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">En Attente</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(pendingCommissions)}
              </div>
              <p className="text-sm text-orange-700">À recevoir</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Taux de Paiement</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {Math.round((paidCommissions / totalCommissions) * 100)}%
              </div>
              <p className="text-sm text-purple-700">Commissions payées</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Commissions Optimisée */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              Historique des Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Aucune commission</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Vos commissions apparaîtront ici une fois que vous aurez des dossiers finalisés
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{commission.client}</h3>
                        <p className="text-sm text-gray-600 mb-2">{commission.product}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>Montant: {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(commission.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date: {commission.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(commission.commission)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.paymentDate ? `Payé le ${commission.paymentDate}` : 'En attente'}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(commission.status)} px-4 py-2 rounded-full text-sm font-semibold`}>
                        {getStatusText(commission.status)}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
