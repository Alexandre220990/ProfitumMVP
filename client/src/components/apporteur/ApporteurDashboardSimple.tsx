import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApporteurSimple } from '../../hooks/use-apporteur-simple';
import { useApporteurEnhanced } from '../../hooks/use-apporteur-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Users, TrendingUp, DollarSign, BarChart3, Target, Award, Activity, Eye, ArrowUpDown } from 'lucide-react';
import ProspectForm from './ProspectForm';
import { config } from '@/config';

interface ApporteurDashboardSimpleProps {
  apporteurId: string;
}

export function ApporteurDashboardSimple({ apporteurId }: ApporteurDashboardSimpleProps) {
  const navigate = useNavigate();
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [activeView, setActiveView] = useState<'clients' | 'prospects' | 'dossiers' | 'montant' | 'conversion'>('prospects');
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [dossiersLoading, setDossiersLoading] = useState(false);
  const [conversionStats, setConversionStats] = useState<any>(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'alpha_az' | 'alpha_za' | 'montant_desc' | 'montant_asc'>('date_desc');
  
  // Hook pour les données de base (fallback)
  const { 
    analytics, 
    loading: basicLoading, 
    error: basicError, 
    refresh: refreshBasic,
    getProspectsByStatus
  } = useApporteurSimple(apporteurId);

  // Hook pour les données enrichies depuis les vues SQL
  const {
    stats,
    objectives,
    recentActivity,
    enrichedProspects,
    loading: enhancedLoading,
    error: enhancedError,
    refresh: refreshEnhanced,
    hasEnhancedData,
    isLoading,
    hasError
  } = useApporteurEnhanced(apporteurId);

  // Utiliser les données enrichies si disponibles, sinon fallback sur les données de base
  const loading = isLoading || basicLoading;
  const error = hasError ? enhancedError : basicError;
  const refresh = () => {
    refreshEnhanced();
    refreshBasic();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de vos données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Erreur: {error}</span>
        <Button onClick={refresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  // Données réelles ou 0 si vide, logs si erreur
  const prospects = analytics.prospects || [];
  const prospectsActifs = getProspectsByStatus('active');

  // Utiliser les données enrichies si disponibles, sinon données réelles avec 0 si vide
  const dashboardData = hasEnhancedData ? {
    total_prospects: stats.totalProspects || 0,
    total_active_clients: stats.totalClients || 0,
    nouveaux_clients_30j: stats.nouveaux30j || 0,
    total_montant_demande: stats.montantTotal || 0,
    taux_conversion_pourcent: stats.tauxConversion || 0,
    dossiers_acceptes: stats.dossiersAcceptes || 0
  } : {
    total_prospects: prospects.length,
    total_active_clients: prospectsActifs.length,
    nouveaux_clients_30j: prospects.filter(p => {
      const created = new Date(p.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length,
    total_montant_demande: 0,
    taux_conversion_pourcent: 0,
    dossiers_acceptes: 0
  };

  const prospectsData = hasEnhancedData ? enrichedProspects : prospects;
  const activityData = hasEnhancedData ? recentActivity : [];
  const objectivesData = hasEnhancedData ? objectives : null;

  // Charger les dossiers quand la vue change
  const loadDossiers = async () => {
    if (!apporteurId) return;
    
    try {
      setDossiersLoading(true);
      const response = await fetch(`${config.API_URL}/api/apporteur/dossiers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setDossiers(result.data || []);
        console.log(`✅ ${result.data?.length || 0} dossiers chargés`);
      }
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    } finally {
      setDossiersLoading(false);
    }
  };

  // Charger les stats de conversion
  const loadConversionStats = async () => {
    if (!apporteurId) return;
    
    try {
      setConversionLoading(true);
      const response = await fetch(`${config.API_URL}/api/apporteur/conversion-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setConversionStats(result.data);
        console.log('✅ Stats conversion chargées:', result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats conversion:', error);
    } finally {
      setConversionLoading(false);
    }
  };

  // Charger les stats de conversion au montage pour le KPI
  useEffect(() => {
    loadConversionStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apporteurId]);

  // Charger dossiers quand on clique sur dossiers/montant
  useEffect(() => {
    if (activeView === 'dossiers' || activeView === 'montant') {
      loadDossiers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, apporteurId]);

  // Fonction de tri des dossiers
  const getSortedDossiers = () => {
    if (!dossiers || dossiers.length === 0) return [];
    
    const sorted = [...dossiers];
    
    switch (sortOption) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'alpha_az':
        return sorted.sort((a, b) => (a.Client?.company_name || '').localeCompare(b.Client?.company_name || ''));
      case 'alpha_za':
        return sorted.sort((a, b) => (b.Client?.company_name || '').localeCompare(a.Client?.company_name || ''));
      case 'montant_desc':
        return sorted.sort((a, b) => (b.montantFinal || 0) - (a.montantFinal || 0));
      case 'montant_asc':
        return sorted.sort((a, b) => (a.montantFinal || 0) - (b.montantFinal || 0));
      default:
        return sorted;
    }
  };

  const sortedDossiers = getSortedDossiers();

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Compact */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Aperçu de votre activité</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowProspectForm(true)}
            >
              <Users className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Statistiques principales - Compact et Cliquables */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* 1. Clients */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              activeView === 'clients' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => setActiveView('clients')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_active_clients}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* 2. Prospects */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              activeView === 'prospects' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => setActiveView('prospects')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prospects</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_prospects}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* 3. Dossiers */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              activeView === 'dossiers' ? 'ring-2 ring-orange-500 shadow-lg' : ''
            }`}
            onClick={() => setActiveView('dossiers')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dossiers</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.dossiers_acceptes}</p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* 4. Montant */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              activeView === 'montant' ? 'ring-2 ring-yellow-500 shadow-lg' : ''
            }`}
            onClick={() => setActiveView('montant')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Montant</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.total_montant_demande 
                      ? `${(dashboardData.total_montant_demande / 1000).toFixed(0)}K€`
                      : '0€'
                    }
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          {/* 5. Conversion - KPI Principal: Prospect → Signature */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer ${
              activeView === 'conversion' ? 'ring-2 ring-indigo-500 shadow-lg' : ''
            }`}
            onClick={() => setActiveView('conversion')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {conversionStats?.taux_prospect_signature || dashboardData.taux_conversion_pourcent}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Prospect → Signature</p>
                </div>
                <Target className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal en 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Vue dynamique selon la tuile cliquée */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {activeView === 'clients' && 'Clients Récents'}
                  {activeView === 'prospects' && 'Prospects Récents'}
                  {activeView === 'dossiers' && 'Dossiers en Cours'}
                  {activeView === 'montant' && 'Top Montants'}
                  {activeView === 'conversion' && 'Conversions Réussies'}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (activeView === 'prospects') navigate('/apporteur/prospects');
                    if (activeView === 'clients') navigate('/apporteur/prospects?filter=client');
                    if (activeView === 'dossiers') navigate('/apporteur/prospects');
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Vue Clients */}
              {activeView === 'clients' && (
                prospectsData.filter((p: any) => p.status === 'client' || p.statut === 'client').length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucun client</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {prospectsData.filter((p: any) => p.status === 'client' || p.statut === 'client').slice(0, 4).map((client: any) => (
                      <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{client.nom || client.name || client.company_name}</h4>
                            <p className="text-xs text-gray-500">{client.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 text-xs">Client</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Vue Prospects */}
              {activeView === 'prospects' && (
                prospectsData.filter((p: any) => p.status === 'prospect' || p.statut === 'prospect').length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucun prospect</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {prospectsData.filter((p: any) => p.status === 'prospect' || p.statut === 'prospect').slice(0, 4).map((prospect: any) => (
                      <div key={prospect.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{prospect.nom || prospect.name || prospect.company_name}</h4>
                            <p className="text-xs text-gray-500">{prospect.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Prospect</Badge>
                            {prospect.qualification_score && (
                              <span className="text-xs text-gray-600">Score: {prospect.qualification_score}/10</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Vue Dossiers */}
              {activeView === 'dossiers' && (
                <>
                  {/* Tri */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="date_desc">Plus récent</option>
                        <option value="date_asc">Plus ancien</option>
                        <option value="alpha_az">A → Z</option>
                        <option value="alpha_za">Z → A</option>
                        <option value="montant_desc">Montant ↓</option>
                        <option value="montant_asc">Montant ↑</option>
                      </select>
                    </div>
                  </div>
                  
                  {dossiersLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 text-sm">Chargement...</p>
                    </div>
                  ) : sortedDossiers.length === 0 ? (
                    <div className="text-center py-8 px-6">
                      <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Aucun dossier</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {sortedDossiers.slice(0, 4).map((dossier: any) => (
                        <div key={dossier.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{dossier.Client?.company_name || 'Client'}</h4>
                              <p className="text-xs text-gray-500">{dossier.ProduitEligible?.nom}</p>
                              <p className="text-xs text-gray-400">{dossier.Client?.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${
                                dossier.statut === 'validated' ? 'bg-green-100 text-green-800' :
                                dossier.statut === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {dossier.statut}
                              </Badge>
                              {dossier.montantFinal > 0 && (
                                <span className="text-xs font-medium text-green-600">
                                  {dossier.montantFinal.toLocaleString()}€
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Vue Montant - Même que dossiers mais focus sur montants */}
              {activeView === 'montant' && (
                <>
                  {/* Tri */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="date_desc">Plus récent</option>
                        <option value="date_asc">Plus ancien</option>
                        <option value="alpha_az">A → Z</option>
                        <option value="alpha_za">Z → A</option>
                        <option value="montant_desc">Montant ↓</option>
                        <option value="montant_asc">Montant ↑</option>
                      </select>
                    </div>
                  </div>
                  
                  {dossiersLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 text-sm">Chargement...</p>
                    </div>
                  ) : sortedDossiers.length === 0 ? (
                    <div className="text-center py-8 px-6">
                      <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Aucun dossier avec montant</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {sortedDossiers.slice(0, 4).map((dossier: any) => (
                        <div key={dossier.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{dossier.Client?.company_name || 'Client'}</h4>
                              <p className="text-xs text-gray-500">{dossier.ProduitEligible?.nom}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-bold text-green-600">
                                {dossier.montantFinal ? dossier.montantFinal.toLocaleString() : '0'}€
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Vue Conversion - Multi-niveaux */}
              {activeView === 'conversion' && (
                <>
                  {conversionLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 text-sm">Chargement des stats...</p>
                    </div>
                  ) : !conversionStats ? (
                    <div className="text-center py-8 px-6">
                      <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Aucune donnée de conversion</p>
                    </div>
                  ) : (
                    <>
                      {/* 3 Métriques de conversion */}
                      <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="grid grid-cols-3 gap-4">
                          {/* Prospect → RDV */}
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs font-medium text-gray-600 mb-1">Prospect → RDV</p>
                            <p className="text-2xl font-bold text-blue-600">{conversionStats.taux_prospect_rdv}%</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conversionStats.prospects_avec_rdv}/{conversionStats.total_prospects}
                            </p>
                          </div>
                          
                          {/* Prospect → Signature */}
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-green-300">
                            <p className="text-xs font-medium text-gray-600 mb-1">Prospect → Signature</p>
                            <p className="text-2xl font-bold text-green-600">{conversionStats.taux_prospect_signature}%</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conversionStats.total_signatures}/{conversionStats.total_prospects}
                            </p>
                          </div>
                          
                          {/* RDV → Signature */}
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs font-medium text-gray-600 mb-1">RDV → Signature</p>
                            <p className="text-2xl font-bold text-purple-600">{conversionStats.taux_rdv_signature}%</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conversionStats.rdv_avec_signature}/{conversionStats.prospects_avec_rdv}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Liste des clients convertis */}
                      {conversionStats.recent_clients && conversionStats.recent_clients.length > 0 ? (
                        <div className="divide-y">
                          <div className="px-4 py-2 bg-gray-50">
                            <p className="text-xs font-medium text-gray-600">Dernières Conversions Réussies</p>
                          </div>
                          {conversionStats.recent_clients.map((client: any) => (
                            <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{client.company_name || client.name || 'Client'}</h4>
                                  <p className="text-xs text-gray-500">{client.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800 text-xs">✓ Converti</Badge>
                                  <span className="text-xs text-gray-400">
                                    {new Date(client.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 px-6">
                          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Aucune conversion encore</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Activité</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityData.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucune activité</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {activityData.slice(0, 4).map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'nouveau_client' && <Users className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'nouveau_dossier' && <BarChart3 className="h-4 w-4 text-green-500" />}
                        {activity.type === 'dossier_accepte' && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{activity.libelle}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                      {activity.montant > 0 && (
                        <span className="text-xs font-medium text-green-600">
                          {activity.montant}€
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Objectifs et Messages d'information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objectifs */}
          {objectivesData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Objectifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {objectivesData.objectifProspects}
                    </div>
                    <p className="text-xs text-gray-600">Prospects</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {objectivesData.objectifConversion}%
                    </div>
                    <p className="text-xs text-gray-600">Conversion</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {objectivesData.objectifCommission}€
                    </div>
                    <p className="text-xs text-gray-600">Commission</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card className={`border-2 ${hasEnhancedData ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${hasEnhancedData ? 'text-green-500' : 'text-blue-500'}`} />
                <h3 className={`font-medium mb-1 text-sm ${hasEnhancedData ? 'text-green-900' : 'text-blue-900'}`}>
                  {hasEnhancedData ? 'Dashboard Enrichi Actif' : 'Dashboard Optimisé'}
                </h3>
                <p className={`text-xs ${hasEnhancedData ? 'text-green-700' : 'text-blue-700'}`}>
                  {hasEnhancedData 
                    ? 'Vues SQL enrichies actives'
                    : 'Prêt pour les vues SQL enrichies'
                  }
                  {enhancedLoading && " Chargement..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Formulaire de création de prospect */}
      {showProspectForm && (
        <ProspectForm 
          onCancel={() => setShowProspectForm(false)}
          onSuccess={() => {
            setShowProspectForm(false);
            refresh(); // Rafraîchir les données après création
          }}
        />
      )}
    </div>
  );
}
