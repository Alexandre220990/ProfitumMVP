import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Globe,
  Target,
  TrendingUp,
  Clock,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Video,
  PhoneCall,
  Loader2,
  Edit
} from 'lucide-react';
import { config } from '@/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProspectDetails {
  // Informations de base
  id: string;
  name: string;
  email: string;
  phone_number: string;
  company_name: string;
  siren?: string;
  address?: string;
  website?: string;
  decision_maker_position?: string;
  
  // Qualification
  status: string;
  qualification_score: number;
  interest_level: string;
  budget_range: string;
  timeline: string;
  source?: string;
  notes?: string;
  
  // Dates
  created_at: string;
  updated_at: string;
  
  // Expert présélectionné
  preselected_expert_id?: string;
  expert_name?: string;
  expert_company?: string;
  
  // Produits sélectionnés
  selected_products?: Array<{
    id: string;
    nom: string;
    categorie: string;
    montantFinal?: number;
    priorite?: number;
    notes?: string;
  }>;
  
  // Simulation
  simulation_completed?: boolean;
  simulation_results?: {
    total_products: number;
    eligible_products: number;
    estimated_total_savings: number;
    answers?: Record<string, any>;
  };
  
  // RDV
  meetings?: Array<{
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    type: string;
    location?: string;
    status: string;
    expert_name?: string;
  }>;
}

interface ProspectDetailsViewProps {
  prospectId: string;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ProspectDetailsView({ 
  prospectId, 
  onClose,
  onEdit 
}: ProspectDetailsViewProps) {
  const [prospect, setProspect] = useState<ProspectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProspectDetails();
  }, [prospectId]);

  const fetchProspectDetails = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails du prospect
      const response = await fetch(`${config.API_URL}/api/apporteur/clients/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des détails');
      }

      const result = await response.json();
      
      // Récupérer les RDV associés
      const meetingsResponse = await fetch(
        `${config.API_URL}/api/apporteur/prospects/${prospectId}/meetings`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let meetings = [];
      if (meetingsResponse.ok) {
        const meetingsResult = await meetingsResponse.json();
        meetings = meetingsResult.data || [];
      }

      setProspect({
        ...result.data,
        meetings
      });
      
    } catch (err) {
      console.error('Erreur fetchProspectDetails:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'prospect': 'Nouveau Prospect',
      'qualified': 'Qualifié',
      'rdv_negotiated': 'RDV Négocié',
      'expert_validated': 'Expert Validé',
      'meeting_done': 'Meeting Effectué',
      'in_progress': 'En Cours',
      'signed': 'Signé',
      'refused': 'Refusé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'prospect': 'bg-gray-100 text-gray-800',
      'qualified': 'bg-blue-100 text-blue-800',
      'rdv_negotiated': 'bg-yellow-100 text-yellow-800',
      'expert_validated': 'bg-purple-100 text-purple-800',
      'meeting_done': 'bg-green-100 text-green-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'signed': 'bg-emerald-100 text-emerald-800',
      'refused': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getInterestLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'high': 'Élevé',
      'medium': 'Moyen',
      'low': 'Faible'
    };
    return labels[level] || level;
  };

  const getTimelineLabel = (timeline: string) => {
    const labels: Record<string, string> = {
      'immediate': 'Immédiat',
      '1-3months': '1-3 mois',
      '3-6months': '3-6 mois',
      '6months+': '6 mois+'
    };
    return labels[timeline] || timeline;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <PhoneCall className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full">
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Chargement des détails...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full">
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error || 'Prospect non trouvé'}</p>
              <Button onClick={onClose} className="mt-4">Fermer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          {/* Header */}
          <CardHeader className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white z-10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {prospect.name}
                  </CardTitle>
                  <p className="text-blue-100 mt-1">{prospect.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEdit}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/20 text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Statut et Qualification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                    Statut et Qualification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Statut</span>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(prospect.status)} text-sm font-semibold`}>
                        {getStatusLabel(prospect.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Score de qualification</span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(prospect.qualification_score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {prospect.qualification_score}/10
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-gray-600">Intérêt</span>
                      <p className="font-semibold text-gray-900 mt-1">
                        {getInterestLevelLabel(prospect.interest_level)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Délai</span>
                      <p className="font-semibold text-gray-900 mt-1">
                        {getTimelineLabel(prospect.timeline)}
                      </p>
                    </div>
                  </div>
                  {prospect.budget_range && (
                    <div>
                      <span className="text-sm text-gray-600">Budget</span>
                      <p className="font-semibold text-gray-900 mt-1">{prospect.budget_range}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    Informations de Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                      {prospect.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${prospect.phone_number}`} className="text-blue-600 hover:underline">
                      {prospect.phone_number}
                    </a>
                  </div>
                  {prospect.decision_maker_position && (
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">{prospect.decision_maker_position}</span>
                    </div>
                  )}
                  {prospect.source && (
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">Source: {prospect.source}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Informations Entreprise */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                  Informations Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Nom de l'entreprise</span>
                    <p className="font-semibold text-gray-900 mt-1">{prospect.company_name}</p>
                  </div>
                  {prospect.siren && (
                    <div>
                      <span className="text-sm text-gray-600">SIREN</span>
                      <p className="font-semibold text-gray-900 mt-1">{prospect.siren}</p>
                    </div>
                  )}
                  {prospect.address && (
                    <div>
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresse
                      </span>
                      <p className="text-gray-900 mt-1">{prospect.address}</p>
                    </div>
                  )}
                  {prospect.website && (
                    <div>
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Site web
                      </span>
                      <a 
                        href={prospect.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 inline-block"
                      >
                        {prospect.website}
                      </a>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Dates
                  </span>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">Créé le : </span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(prospect.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mis à jour le : </span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(prospect.updated_at), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expert Présélectionné */}
            {prospect.preselected_expert_id && (
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                    Expert Présélectionné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{prospect.expert_name}</p>
                      {prospect.expert_company && (
                        <p className="text-sm text-gray-600">{prospect.expert_company}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Produits Sélectionnés */}
            {prospect.selected_products && prospect.selected_products.length > 0 && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Produits Sélectionnés
                    <Badge variant="outline" className="ml-2">
                      {prospect.selected_products.length} produit{prospect.selected_products.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prospect.selected_products.map((product) => (
                      <div 
                        key={product.id} 
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{product.nom}</span>
                              <Badge variant="outline" className="text-xs">
                                {product.categorie}
                              </Badge>
                            </div>
                            {product.notes && (
                              <p className="text-sm text-gray-600 mt-1">{product.notes}</p>
                            )}
                          </div>
                          {product.montantFinal && product.montantFinal > 0 && (
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-green-600">
                                {product.montantFinal.toLocaleString('fr-FR')}€
                              </div>
                              <span className="text-xs text-gray-500">Montant estimé</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résultats de la Simulation */}
            {prospect.simulation_completed && prospect.simulation_results && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Résultats de la Simulation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {prospect.simulation_results.eligible_products}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Produits éligibles
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {prospect.simulation_results.total_products}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total analysés
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {prospect.simulation_results.estimated_total_savings?.toLocaleString('fr-FR')}€
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Économies estimées
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RDV Planifiés */}
            {prospect.meetings && prospect.meetings.length > 0 && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Rendez-vous Planifiés
                    <Badge variant="outline" className="ml-2">
                      {prospect.meetings.length} RDV
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prospect.meetings.map((meeting) => (
                      <div 
                        key={meeting.id} 
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getMeetingTypeIcon(meeting.type)}
                              <span className="font-semibold text-gray-900">{meeting.title}</span>
                              <Badge 
                                variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {meeting.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(new Date(meeting.start_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{meeting.location}</span>
                                </div>
                              )}
                              {meeting.expert_name && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Expert: {meeting.expert_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {prospect.notes && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{prospect.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onEdit && (
                <Button 
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier ce prospect
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

