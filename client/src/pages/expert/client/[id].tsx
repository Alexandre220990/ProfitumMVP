import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { get } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InfosClientEnrichies from '@/components/dossier/InfosClientEnrichies';
import {
  Loader2,
  ArrowLeft,
  Briefcase,
  Euro,
  TrendingUp,
  User,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ClientData {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email: string;
  phone_number?: string;
  siren?: string;
  chiffreAffaires?: number;
  revenuAnnuel?: number;
  secteurActivite?: string;
  nombreEmployes?: number;
  ancienneteEntreprise?: number;
  typeProjet?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  website?: string;
  decision_maker_position?: string;
  qualification_score?: number;
  interest_level?: string;
  budget_range?: string;
  timeline?: string;
  source?: string;
  statut?: string;
  is_active?: boolean;
  dateCreation?: string;
  derniereConnexion?: string;
  first_simulation_at?: string;
  first_login?: boolean;
  expert_contacted_at?: string;
  converted_at?: string;
  last_activity_at?: string;
  notes?: string;
  admin_notes?: string;
  last_admin_contact?: string;
  simulationId?: number;
  apporteur_id?: string;
}

interface Dossier {
  id: string;
  produitId: string;
  statut: string;
  metadata?: any;
  montantFinal?: number;
  tauxFinal?: number;
  priorite?: number;
  current_step?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    categorie: string;
  };
}

interface ApporteurData {
  id: string;
  company_name: string;
  name?: string;
  email: string;
  phone_number?: string;
  commission_rate?: number;
}

interface ClientStats {
  totalDossiers: number;
  dossiersEligibles: number;
  dossiersEnCours: number;
  dossiersTermines: number;
  montantTotal: number;
  montantTermine: number;
  commissionPotentielle: number;
}

interface ClientSyntheseData {
  client: ClientData;
  apporteur?: ApporteurData | null;
  dossiers: Dossier[];
  stats: ClientStats;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ExpertClientSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientSyntheseData | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const response = await get<ClientSyntheseData>(`/api/expert/client/${id}`);

        if (response.success && response.data) {
          setData(response.data);
        } else {
          toast.error('Erreur lors du chargement des données client');
        }
      } catch (error) {
        console.error('Erreur récupération client:', error);
        toast.error('Erreur lors du chargement du client');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id, user]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la synthèse client...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Client introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/expert')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, apporteur, dossiers, stats } = data;
  const clientName = client.company_name || 
                    (client.first_name && client.last_name ? `${client.first_name} ${client.last_name}` : client.name) || 
                    'Client inconnu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/expert')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {clientName}
              </h1>
              <p className="text-gray-600">Client #{client.id?.slice(0, 8) || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={client.is_active ? 'bg-green-500' : 'bg-gray-500'}>
              {client.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge variant="outline">
              {client.statut || 'prospect'}
            </Badge>
          </div>
        </div>

        {/* KPIs Statistiques Client */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Total Dossiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalDossiers}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.dossiersEligibles} prospects • {stats.dossiersEnCours} en cours • {stats.dossiersTermines} terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.montantTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pipeline complet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Montant Sécurisé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(stats.montantTermine)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dossiers terminés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(stats.commissionPotentielle)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Potentiel 10%</p>
            </CardContent>
          </Card>
        </div>

        {/* Informations Client Enrichies */}
        <div className="mb-8">
          <InfosClientEnrichies
            client={client}
            apporteur={apporteur}
            autresProduitsSimulation={[]}
            potentielTotal={{
              montantTotal: stats.montantTotal,
              commissionExpert: stats.commissionPotentielle,
              nombreProduits: stats.totalDossiers
            }}
            produitActuel={{
              nom: `${stats.totalDossiers} produit(s)`,
              montant: stats.montantTotal,
              taux: 0
            }}
          />
        </div>

        {/* Liste des Dossiers du Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Dossiers du client ({dossiers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dossiers.length > 0 ? (
              <div className="space-y-3">
                {dossiers.map((dossier) => (
                  <div 
                    key={dossier.id}
                    className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/expert/dossier/${dossier.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900">
                            {dossier.ProduitEligible?.nom || 'Produit'}
                          </h4>
                          <Badge className={
                            dossier.statut === 'eligible' ? 'bg-yellow-100 text-yellow-800' :
                            dossier.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                            dossier.statut === 'termine' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {dossier.statut}
                          </Badge>
                          {dossier.priorite && (
                            <Badge variant="outline">
                              Priorité: {dossier.priorite}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {dossier.ProduitEligible?.description || 'Description non disponible'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Créé le {formatDate(dossier.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Màj le {formatDate(dossier.updated_at)}
                          </span>
                          {dossier.progress !== undefined && (
                            <span>Progression: {dossier.progress}%</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dossier.montantFinal || 0)}
                        </p>
                        {dossier.tauxFinal && (
                          <p className="text-sm text-gray-600">
                            Taux: {(dossier.tauxFinal * 100).toFixed(2)}%
                          </p>
                        )}
                        <Button size="sm" className="mt-2" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/expert/dossier/${dossier.id}`);
                        }}>
                          Voir dossier
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun dossier pour ce client</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

