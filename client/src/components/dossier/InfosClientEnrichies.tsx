import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  TrendingUp,
  Calendar,
  Globe,
  Briefcase,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  FileText,
  User,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface ApporteurData {
  id: string;
  company_name: string;
  name?: string;
  email: string;
  phone_number?: string;
  commission_rate?: number;
}

interface ProduitSimulation {
  id: string;
  montantFinal: number;
  tauxFinal: number;
  statut: string;
  ProduitEligible: {
    nom: string;
    categorie: string;
  };
}

interface PotentielTotal {
  montantTotal: number;
  commissionExpert: number;
  nombreProduits: number;
}

interface InfosClientEnrichiesProps {
  client: ClientData;
  apporteur?: ApporteurData | null;
  autresProduitsSimulation?: ProduitSimulation[];
  potentielTotal?: PotentielTotal;
  produitActuel: {
    nom: string;
    montant: number;
    taux: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount?: number) => {
  if (!amount) return 'N/A';
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

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInterestLevelBadge = (level?: string) => {
  if (!level) return null;
  
  const config: Record<string, { color: string; icon: string }> = {
    'low': { color: 'bg-gray-100 text-gray-700', icon: '📊' },
    'medium': { color: 'bg-yellow-100 text-yellow-800', icon: '📈' },
    'high': { color: 'bg-orange-100 text-orange-800', icon: '🔥' },
    'very_high': { color: 'bg-red-100 text-red-800', icon: '🚀' }
  };

  const { color, icon } = config[level] || config['medium'];
  const label = level === 'low' ? 'Faible' : 
                level === 'medium' ? 'Moyen' :
                level === 'high' ? 'Élevé' : 'Très élevé';

  return <Badge className={color}>{icon} {label}</Badge>;
};

const getQualificationScore = (score?: number) => {
  if (!score) return { label: 'Non évalué', color: 'text-gray-500', percentage: 0 };
  
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600', percentage: score };
  if (score >= 60) return { label: 'Bon', color: 'text-blue-600', percentage: score };
  if (score >= 40) return { label: 'Moyen', color: 'text-yellow-600', percentage: score };
  return { label: 'Faible', color: 'text-orange-600', percentage: score };
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function InfosClientEnrichies({
  client,
  apporteur,
  autresProduitsSimulation = [],
  potentielTotal,
  produitActuel
}: InfosClientEnrichiesProps) {
  
  const qualificationScore = getQualificationScore(client.qualification_score);
  const nomComplet = client.first_name && client.last_name 
    ? `${client.first_name} ${client.last_name}` 
    : client.name || 'Non renseigné';

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="h-6 w-6 text-blue-600" />
          Informations Client
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="entreprise" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="entreprise">
              <Building2 className="h-4 w-4 mr-2" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="simulation">
              <DollarSign className="h-4 w-4 mr-2" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="commercial">
              <Target className="h-4 w-4 mr-2" />
              Commercial
            </TabsTrigger>
            <TabsTrigger value="apporteur">
              <Users className="h-4 w-4 mr-2" />
              Apporteur
            </TabsTrigger>
            <TabsTrigger value="activite">
              <Activity className="h-4 w-4 mr-2" />
              Activité
            </TabsTrigger>
          </TabsList>

          {/* ONGLET 1: Entreprise */}
          <TabsContent value="entreprise" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Informations Entreprise
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Raison sociale</p>
                  <p className="font-semibold text-gray-900">{client.company_name || 'Non renseigné'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">N° SIREN</p>
                  <p className="font-semibold text-gray-900">{client.siren || 'Non renseigné'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Secteur d'activité</p>
                  <p className="font-semibold text-gray-900">{client.secteurActivite || 'Non renseigné'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Chiffre d'affaires annuel</p>
                  <p className="font-semibold text-green-600">{formatCurrency(client.chiffreAffaires)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Revenu annuel</p>
                  <p className="font-semibold text-green-600">{formatCurrency(client.revenuAnnuel)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Effectif</p>
                  <p className="font-semibold text-gray-900">
                    {client.nombreEmployes ? `${client.nombreEmployes} employé${client.nombreEmployes > 1 ? 's' : ''}` : 'Non renseigné'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Ancienneté entreprise</p>
                  <p className="font-semibold text-gray-900">
                    {client.ancienneteEntreprise ? `${client.ancienneteEntreprise} ans` : 'Non renseigné'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Date de création</p>
                  <p className="font-semibold text-gray-900">{formatDate(client.dateCreation)}</p>
                </div>

                {client.website && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Site web</p>
                    <a 
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {client.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Adresse */}
              {(client.address || client.city || client.postal_code) && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    Adresse
                  </h4>
                  <div className="space-y-1">
                    {client.address && <p className="text-gray-700">{client.address}</p>}
                    {(client.postal_code || client.city) && (
                      <p className="text-gray-700">
                        {client.postal_code} {client.city}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ONGLET 2: Contact */}
          <TabsContent value="contact" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Principal
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">👤 Nom complet</p>
                  <p className="font-semibold text-gray-900">{nomComplet}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">💼 Fonction</p>
                  <p className="font-semibold text-gray-900">{client.decision_maker_position || 'Non renseigné'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">✉️ Email</p>
                  <a 
                    href={`mailto:${client.email}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">📱 Téléphone</p>
                  {client.phone_number ? (
                    <a 
                      href={`tel:${client.phone_number}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {client.phone_number}
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-900">Non renseigné</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">🕐 Dernière activité</p>
                  <p className="font-semibold text-gray-900">
                    {client.last_activity_at 
                      ? formatDistanceToNow(new Date(client.last_activity_at), { addSuffix: true, locale: fr })
                      : 'Non renseigné'
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">✅ Premier login</p>
                  <p className="font-semibold text-gray-900">
                    {client.first_login ? `Oui (${formatDate(client.derniereConnexion)})` : 'Pas encore'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Statut</p>
                  <Badge className={
                    client.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-700'
                  }>
                    {client.is_active ? '🟢 Actif' : '⚪ Inactif'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET 3: Simulation */}
          <TabsContent value="simulation" className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Résultats de Simulation
                {client.simulationId && (
                  <Badge variant="outline" className="ml-2">
                    #{client.simulationId}
                  </Badge>
                )}
              </h3>
              
              {client.first_simulation_at && (
                <p className="text-sm text-gray-600 mb-4">
                  Date: {formatDateTime(client.first_simulation_at)}
                </p>
              )}

              {/* Produit actuel */}
              <div className="bg-white p-4 rounded-lg mb-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    {produitActuel.nom}
                  </h4>
                  <Badge className="bg-blue-100 text-blue-800">Dossier actuel</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Montant: </span>
                    <span className="font-semibold text-blue-600">{formatCurrency(produitActuel.montant)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Taux: </span>
                    <span className="font-semibold text-blue-600">{produitActuel.taux.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Autres produits de la simulation */}
              {autresProduitsSimulation && autresProduitsSimulation.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Autres produits éligibles ({autresProduitsSimulation.length})
                  </h4>
                  {autresProduitsSimulation.map((produit, index) => (
                    <div key={produit.id} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {produit.ProduitEligible?.nom || 'Produit inconnu'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {produit.statut}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <span>Montant: {formatCurrency(produit.montantFinal)}</span>
                        <span>Taux: {produit.tauxFinal?.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Potentiel total */}
              {potentielTotal && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-lg">
                  <h4 className="font-semibold mb-3 text-emerald-100">💎 Potentiel Total</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-emerald-200 mb-1">Montant total éligible</p>
                      <p className="text-2xl font-bold">{formatCurrency(potentielTotal.montantTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-200 mb-1">Commission expert</p>
                      <p className="text-2xl font-bold">{formatCurrency(potentielTotal.commissionExpert)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-200 mb-1">Produits</p>
                      <p className="text-2xl font-bold">{potentielTotal.nombreProduits}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-400">
                    <p className="text-xs text-emerald-200">Durée estimée: 3-6 mois</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ONGLET 4: Commercial */}
          <TabsContent value="commercial" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Informations Commerciales
              </h3>
              
              <div className="space-y-4">
                {/* Score de qualification */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">🎯 Score de qualification</p>
                    <span className={`font-bold ${qualificationScore.color}`}>
                      {client.qualification_score || 0}/100 - {qualificationScore.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        qualificationScore.percentage >= 80 ? 'bg-green-500' :
                        qualificationScore.percentage >= 60 ? 'bg-blue-500' :
                        qualificationScore.percentage >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${qualificationScore.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">📈 Niveau d'intérêt</p>
                    <div>{getInterestLevelBadge(client.interest_level)}</div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">💵 Budget</p>
                    <p className="font-semibold text-gray-900">{client.budget_range || 'Non renseigné'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">⏱️ Timeline projet</p>
                    <p className="font-semibold text-gray-900">{client.timeline || 'Non renseigné'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">📍 Source d'acquisition</p>
                    <p className="font-semibold text-gray-900">{client.source || 'Non renseigné'}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">🎨 Type de projet</p>
                    <p className="font-semibold text-gray-900">{client.typeProjet || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET 5: Apporteur */}
          <TabsContent value="apporteur" className="space-y-6">
            {apporteur ? (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  Apporteur d'Affaires
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Société</p>
                    <p className="font-semibold text-gray-900">{apporteur.company_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contact</p>
                    <p className="font-semibold text-gray-900">{apporteur.name || 'Non renseigné'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <a 
                      href={`mailto:${apporteur.email}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {apporteur.email}
                    </a>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                    {apporteur.phone_number ? (
                      <a 
                        href={`tel:${apporteur.phone_number}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {apporteur.phone_number}
                      </a>
                    ) : (
                      <p className="font-semibold text-gray-900">Non renseigné</p>
                    )}
                  </div>
                </div>

                {/* Commission */}
                {potentielTotal && apporteur.commission_rate && (
                  <div className="mt-6 pt-6 border-t border-teal-200">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">💰 Commission prévue</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-teal-600">
                          {formatCurrency(potentielTotal.montantTotal * (apporteur.commission_rate / 100))}
                        </p>
                        <p className="text-sm text-gray-600">
                          ({apporteur.commission_rate}% du total)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contacter l'apporteur
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg border text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun apporteur d'affaires</p>
                <p className="text-sm text-gray-500 mt-1">Ce client a été acquis en direct</p>
              </div>
            )}
          </TabsContent>

          {/* ONGLET 6: Activité */}
          <TabsContent value="activite" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Activité & Engagement
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Créé le</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatDateTime(client.dateCreation)}</span>
                </div>

                {client.first_simulation_at && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Première simulation</span>
                    </div>
                    <span className="font-semibold text-blue-900">{formatDateTime(client.first_simulation_at)}</span>
                  </div>
                )}

                {client.first_login && client.derniereConnexion && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Premier login</span>
                    </div>
                    <span className="font-semibold text-green-900">{formatDateTime(client.derniereConnexion)}</span>
                  </div>
                )}

                {client.expert_contacted_at && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Expert contacté</span>
                    </div>
                    <span className="font-semibold text-purple-900">{formatDate(client.expert_contacted_at)}</span>
                  </div>
                )}

                {client.converted_at && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Converti</span>
                    </div>
                    <span className="font-semibold text-emerald-900">{formatDate(client.converted_at)}</span>
                  </div>
                )}

                {client.derniereConnexion && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Dernière connexion</span>
                    </div>
                    <span className="font-semibold text-orange-900">{formatDateTime(client.derniereConnexion)}</span>
                  </div>
                )}

                {client.last_activity_at && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">Dernière activité</span>
                    </div>
                    <span className="font-semibold text-yellow-900">
                      {formatDistanceToNow(new Date(client.last_activity_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                )}

                {client.last_admin_contact && (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Dernier contact admin</span>
                    </div>
                    <span className="font-semibold text-indigo-900">
                      {formatDistanceToNow(new Date(client.last_admin_contact), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes client */}
              {client.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-2 text-sm text-gray-700">📝 Notes client</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}

              {/* Notes admin (lecture seule pour expert) */}
              {client.admin_notes && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-700 flex items-center gap-2">
                    🔒 Notes admin
                    <Badge variant="outline" className="text-xs">Lecture seule</Badge>
                  </h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200 whitespace-pre-wrap">
                    {client.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

