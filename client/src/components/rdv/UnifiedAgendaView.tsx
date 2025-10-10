import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Plus,
  Check,
  X,
  RefreshCw,
  Users,
  Eye,
  List,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { RDVFormModal } from './RDVFormModal';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/config';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface RDV {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  meeting_type: 'video' | 'physical' | 'phone';
  location?: string;
  meeting_url?: string;
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  Client?: any;
  Expert?: any;
  ApporteurAffaires?: any;
  description?: string;
  notes?: string;
  priority: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TYPE_COLORS = {
  client: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    badge: 'bg-blue-500',
    hover: 'hover:bg-blue-100'
  },
  expert: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    badge: 'bg-green-500',
    hover: 'hover:bg-green-100'
  },
  apporteur: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    badge: 'bg-purple-500',
    hover: 'hover:bg-purple-100'
  }
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposé', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
  rescheduled: { label: 'Reprogrammé', color: 'bg-orange-100 text-orange-800' }
};

// ============================================================================
// COMPOSANT
// ============================================================================

export const UnifiedAgendaView = () => {
  const { user } = useAuth();
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  
  // 🔥 Type de vue : 'calendar' ou 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // 🔥 Cases à cocher pour afficher les RDV par type
  const [showFilters, setShowFilters] = useState({
    client: true,
    expert: true,
    apporteur: true
  });

  useEffect(() => {
    loadRDVs();
  }, []);

  const loadRDVs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRdvs(result.data || []);
      } else {
        toast.error('Erreur chargement RDV');
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
      toast.error('Erreur chargement RDV');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Déterminer le type de RDV pour un utilisateur
  const getRDVType = (rdv: RDV): 'client' | 'expert' | 'apporteur' | null => {
    if (rdv.client_id === user?.database_id) return 'client';
    if (rdv.expert_id === user?.database_id) return 'expert';
    if (rdv.apporteur_id === user?.database_id) return 'apporteur';
    return null;
  };

  // 🔥 Filtrer les RDV selon les cases cochées
  const filteredRDVs = rdvs.filter(rdv => {
    const type = getRDVType(rdv);
    if (!type) return false; // Ne pas afficher si pas participant
    return showFilters[type];
  });

  // 🔥 Séparer les RDV selon leur statut
  const pendingRDVs = filteredRDVs.filter(rdv => rdv.status === 'proposed');
  const confirmedRDVs = filteredRDVs.filter(rdv => rdv.status === 'confirmed' || rdv.status === 'rescheduled');
  const pastRDVs = filteredRDVs.filter(rdv => rdv.status === 'completed' || rdv.status === 'cancelled');

  // Grouper par date pour la vue calendrier
  const groupedRDVs = filteredRDVs.reduce((acc, rdv) => {
    const date = rdv.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(rdv);
    return acc;
  }, {} as Record<string, RDV[]>);

  const sortedDates = Object.keys(groupedRDVs).sort();

  const handleRDVAction = async (rdvId: string, action: 'accept' | 'refuse' | 'propose_alternative', data?: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv/${rdvId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        loadRDVs(); // Recharger la liste
      } else {
        toast.error(result.message || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur action RDV:', error);
      toast.error('Erreur lors de l\'action');
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'physical': return <MapPin className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  // Déterminer si l'utilisateur a plusieurs types
  const availableTypes = user?.available_types || [];
  const hasMultipleTypes = availableTypes.length > 1;

  // 🔥 Composant interne pour afficher une carte RDV
  const RDVCard = ({ rdv }: { rdv: RDV }) => {
    const rdvType = getRDVType(rdv);
    if (!rdvType) return null;
    
    const colors = TYPE_COLORS[rdvType];
    const status = STATUS_LABELS[rdv.status];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`${colors.border} border-l-4`}>
          <CardContent className={`p-4 ${colors.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header avec badge type */}
                <div className="flex items-center gap-3 mb-2">
                  {hasMultipleTypes && (
                    <div className={`w-3 h-3 rounded-full ${colors.badge}`}></div>
                  )}
                  <h4 className={`font-semibold ${colors.text}`}>
                    {rdv.title}
                  </h4>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                  {hasMultipleTypes && (
                    <Badge variant="outline" className="text-xs">
                      En tant que {rdvType}
                    </Badge>
                  )}
                </div>

                {/* Infos */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {rdv.scheduled_time} ({rdv.duration_minutes}min)
                  </div>
                  <div className="flex items-center gap-1">
                    {getMeetingTypeIcon(rdv.meeting_type)}
                    {rdv.meeting_type === 'video' ? 'Visio' : 
                     rdv.meeting_type === 'physical' ? 'Présentiel' : 'Téléphone'}
                  </div>
                  {rdv.Client && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {rdv.Client.company_name || rdv.Client.name}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {rdv.status === 'proposed' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 hover:bg-green-100 border-green-300"
                      onClick={() => handleRDVAction(rdv.id, 'accept')}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 border-red-300"
                      onClick={() => {
                        const reason = prompt('Motif de refus:');
                        if (reason) {
                          handleRDVAction(rdv.id, 'refuse', { refusal_reason: reason });
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.info('Fonctionnalité en cours de développement');
                      }}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Proposer autre date
                    </Button>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info('Détails du RDV')}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec boutons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {hasMultipleTypes ? 'Mon Agenda Multi-Types' : 'Mon Agenda'}
          </h2>
          <p className="text-gray-600">
            {hasMultipleTypes 
              ? 'Gérez vos RDV selon vos différents types de profil' 
              : 'Gérez tous vos rendez-vous'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur de vue */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Liste
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Calendrier
            </Button>
          </div>
          <Button onClick={() => setShowFormModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* 🔥 Filtres par type avec cases à cocher - Seulement si multi-types */}
      {hasMultipleTypes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Afficher mes RDV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {user?.available_types?.includes('client') && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="filter-client"
                    checked={showFilters.client}
                    onCheckedChange={(checked) => 
                      setShowFilters(prev => ({ ...prev, client: checked as boolean }))
                    }
                  />
                  <Label htmlFor="filter-client" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Mes RDV Client</span>
                  </Label>
                </div>
              )}

              {user?.available_types?.includes('expert') && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="filter-expert"
                    checked={showFilters.expert}
                    onCheckedChange={(checked) => 
                      setShowFilters(prev => ({ ...prev, expert: checked as boolean }))
                    }
                  />
                  <Label htmlFor="filter-expert" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="font-medium">Mes RDV Expert</span>
                  </Label>
                </div>
              )}

              {user?.available_types?.includes('apporteur') && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="filter-apporteur"
                    checked={showFilters.apporteur}
                    onCheckedChange={(checked) => 
                      setShowFilters(prev => ({ ...prev, apporteur: checked as boolean }))
                    }
                  />
                  <Label htmlFor="filter-apporteur" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    <span className="font-medium">Mes RDV Apporteur</span>
                  </Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal : Vue Liste ou Vue Calendrier */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredRDVs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun RDV à afficher</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* 📋 VUE LISTE - Scission claire entre en attente et confirmés */
        <div className="space-y-6">
          {/* Section 1 : RDV en attente de confirmation */}
          {pendingRDVs.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  ⏳ RDV en attente de confirmation ({pendingRDVs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {pendingRDVs
                    .sort((a, b) => `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`))
                    .map(rdv => (
                      <RDVCard key={rdv.id} rdv={rdv} />
                    ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* Section 2 : RDV confirmés */}
          {confirmedRDVs.length > 0 && (
            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  ✅ RDV confirmés ({confirmedRDVs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {confirmedRDVs
                    .sort((a, b) => `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`))
                    .map(rdv => (
                      <RDVCard key={rdv.id} rdv={rdv} />
                    ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* Section 3 : RDV passés (si existent) */}
          {pastRDVs.length > 0 && (
            <Card className="border-2 border-gray-200 bg-gray-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <CalendarIcon className="w-5 h-5" />
                  📅 RDV passés ({pastRDVs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {pastRDVs
                    .sort((a, b) => `${b.scheduled_date} ${b.scheduled_time}`.localeCompare(`${a.scheduled_date} ${a.scheduled_time}`))
                    .map(rdv => (
                      <RDVCard key={rdv.id} rdv={rdv} />
                    ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* 📅 VUE CALENDRIER - Groupé par date */
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {new Date(date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {groupedRDVs[date]
                    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                    .map(rdv => (
                      <RDVCard key={rdv.id} rdv={rdv} />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulaire */}
      <RDVFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={loadRDVs}
      />
    </div>
  );
};

