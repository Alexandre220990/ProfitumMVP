import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApporteurData } from '../../hooks/use-apporteur-data';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Users, TrendingUp, DollarSign, BarChart3, Target, Award, Activity, Eye, ArrowUpDown } from 'lucide-react';
import ProspectForm from './ProspectForm';

interface ApporteurDashboardSimpleProps {
  apporteurId: string;
}

export function ApporteurDashboardSimple({ apporteurId }: ApporteurDashboardSimpleProps) {
  const navigate = useNavigate();
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [activeView, setActiveView] = useState<'clients' | 'prospects' | 'dossiers' | 'montant' | 'conversion'>('prospects');
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'alpha_az' | 'alpha_za' | 'montant_desc' | 'montant_asc'>('date_desc');
  
  // Hook principal - Architecture identique au dashboard client
  const { data, loading, error, refresh, loadDossiers } = useApporteurData(apporteurId);

  // Charger les dossiers quand on clique sur la vue dossiers/montant
  useEffect(() => {
    if ((activeView === 'dossiers' || activeView === 'montant') && data && data.dossiers.length === 0) {
      loadDossiers();
    }
  }, [activeView, data, loadDossiers]);

  // Fonctions de navigation avec useCallback
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleProspectSuccess = useCallback(() => {
    setShowProspectForm(false);
    refresh();
  }, [refresh]);

  // État de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de vos données...</span>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Erreur: {error}</span>
        <Button onClick={handleRefresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  // Données formatées - Calculs simples sans useMemo
  const dashboardData = data?.dashboard || {
    total_prospects: 0,
    total_active_clients: 0,
    nouveaux_clients_30j: 0,
    total_montant_demande: 0,
    taux_conversion_pourcent: 0,
    dossiers_acceptes: 0
  };

  const prospectsData = (data?.prospects || []).map((p: any) => ({
    id: p.prospect_id || p.id,
    nom: p.prospect_name || p.company_name,
    name: p.prospect_name || p.company_name,
    email: p.prospect_email || p.email,
    company_name: p.company_name,
    status: p.prospect_status || 'prospect',
    statut: p.prospect_status || 'prospect',
    qualification_score: p.qualification_score
  }));

  const activityData = (data?.activite || []).map((activity: any) => {
    let libelle = '';
    if (activity.type_activite === 'nouveau_client') {
      libelle = `Nouveau client : ${activity.client_name || activity.client_company || 'Client'}`;
    } else if (activity.type_activite === 'nouveau_produit') {
      const client = activity.client_name || activity.client_company || 'Client';
      const produit = activity.produit_nom || 'Produit';
      libelle = `${client} - ${produit}${activity.montant ? ` (${activity.montant.toLocaleString('fr-FR')}€)` : ''}`;
    } else {
      libelle = `${activity.client_name || 'Activité'} - ${activity.produit_nom || ''}`;
    }
    return {
      id: activity.source_id,
      type: activity.type_activite,
      date: activity.date_activite,
      montant: activity.montant || 0,
      libelle: libelle.trim()
    };
  });

  const objectivesData = data?.objectifs ? {
    objectifProspects: data.objectifs.objectif_prospects_mois || 0,
    objectifConversion: data.objectifs.objectif_conversion_pourcent || 0,
    objectifCommission: data.objectifs.objectif_commission_mois || 0,
    realisationProspects: data.objectifs.realisation_prospects_mois || 0,
    realisationConversion: data.objectifs.realisation_conversion_pourcent || 0,
    realisationCommission: data.objectifs.realisation_commission_mois || 0
  } : null;

  const conversionStats = data?.conversionStats || {
    taux_prospect_rdv: 0,
    prospects_avec_rdv: 0,
    total_prospects: 0,
    taux_prospect_signature: 0,
    total_signatures: 0,
    taux_rdv_signature: 0,
    rdv_avec_signature: 0,
    recent_clients: []
  };

  const hasEnhancedData = !!(data?.dashboard && data?.prospects.length > 0);

  // Tri des dossiers - fonction simple
  const getSortedDossiers = () => {
    const dossiers = data?.dossiers || [];
    if (dossiers.length === 0) return [];
    
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
  const dossiersLoading = false; // Pas de loading séparé

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
            <Button onClick={handleRefresh} variant="outline" size="sm">
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

          {/* 5. Conversion */}
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
                    {conversionStats.taux_prospect_signature || dashboardData.taux_conversion_pourcent}%
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

              {/* Vue Montant */}
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

              {/* Vue Conversion */}
              {activeView === 'conversion' && (
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
          onSuccess={handleProspectSuccess}
        />
      )}
    </div>
  );
}
