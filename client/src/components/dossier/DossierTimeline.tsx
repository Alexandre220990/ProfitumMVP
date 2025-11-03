/**
 * Composant Timeline pour afficher l'historique d'un dossier
 * Utilisable dans les pages synthèse Admin, Expert, Apporteur
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Calendar, Filter } from 'lucide-react';
import { config } from '@/config/env';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimelineEvent {
  id: string;
  dossier_id: string;
  date: string;
  type: string;
  actor_type: 'client' | 'expert' | 'admin' | 'system' | 'apporteur';
  actor_id?: string;
  actor_name: string;
  title: string;
  description?: string;
  metadata?: any;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  action_url?: string;
}

interface DossierTimelineProps {
  dossierId: string;
  userType?: 'client' | 'expert' | 'admin' | 'apporteur';
  compact?: boolean;
  maxEvents?: number;
  className?: string;
}

const getColorClass = (color?: string) => {
  switch (color) {
    case 'green': return 'bg-green-100 border-green-300 text-green-800';
    case 'blue': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'orange': return 'bg-orange-100 border-orange-300 text-orange-800';
    case 'red': return 'bg-red-100 border-red-300 text-red-800';
    case 'purple': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'gray': return 'bg-gray-100 border-gray-300 text-gray-800';
    default: return 'bg-blue-100 border-blue-300 text-blue-800';
  }
};

const getActorBadgeColor = (actorType: string) => {
  switch (actorType) {
    case 'client': return 'bg-blue-500';
    case 'expert': return 'bg-purple-500';
    case 'admin': return 'bg-red-500';
    case 'apporteur': return 'bg-green-500';
    case 'system': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getActorLabel = (actorType: string) => {
  switch (actorType) {
    case 'client': return 'Client';
    case 'expert': return 'Expert';
    case 'admin': return 'Admin';
    case 'apporteur': return 'Apporteur';
    case 'system': return 'Système';
    default: return actorType;
  }
};

export default function DossierTimeline({
  dossierId,
  userType: _userType,
  compact = false,
  maxEvents = 50,
  className = ''
}: DossierTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActor, setFilterActor] = useState<string>('all');
  const [total, setTotal] = useState(0);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      if (!token) {
        throw new Error('Token non trouvé');
      }

      // Construire URL avec filtres
      let url = `${config.API_URL}/api/dossiers/${dossierId}/timeline?limit=${maxEvents}`;
      
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }
      
      if (filterActor !== 'all') {
        url += `&actor_type=${filterActor}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events || []);
        setTotal(data.data.total || 0);
      } else {
        throw new Error(data.message || 'Erreur chargement timeline');
      }

    } catch (err: any) {
      console.error('❌ Erreur chargement timeline:', err);
      setError(err.message || 'Impossible de charger la timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [dossierId, filterType, filterActor, maxEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement de la timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button onClick={loadTimeline} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl">
              {compact ? 'Timeline' : 'Historique du dossier'}
            </CardTitle>
            <Badge variant="secondary">{total} événement{total > 1 ? 's' : ''}</Badge>
          </div>
          
          {!compact && (
            <Button onClick={loadTimeline} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtres */}
        {!compact && (
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type d'événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="document">📄 Documents</SelectItem>
                  <SelectItem value="status_change">🔄 Changement statut</SelectItem>
                  <SelectItem value="expert_action">👨‍🔧 Action expert</SelectItem>
                  <SelectItem value="client_action">👤 Action client</SelectItem>
                  <SelectItem value="admin_action">👨‍💼 Action admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={filterActor} onValueChange={setFilterActor}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Acteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="apporteur">Apporteur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className={compact ? "p-4" : "p-6"}>
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun événement pour le moment
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`relative pl-8 pb-4 ${
                  index !== events.length - 1 ? 'border-l-2 border-gray-200' : ''
                }`}
              >
                {/* Icône événement */}
                <div className="absolute left-0 top-0 -translate-x-1/2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getColorClass(event.color)}`}>
                    <span className="text-sm">{event.icon || '📋'}</span>
                  </div>
                </div>

                {/* Contenu événement */}
                <div className="ml-2">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          className={`text-xs ${getActorBadgeColor(event.actor_type)} text-white`}
                        >
                          {getActorLabel(event.actor_type)}
                        </Badge>
                        <span className="text-xs text-gray-600">{event.actor_name}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Action URL */}
                  {event.action_url && (
                    <a
                      href={event.action_url}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
                    >
                      → Voir détails
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Indicateur "Voir plus" si events tronqués */}
        {total > events.length && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {events.length} événements affichés sur {total}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
