import React from 'react';
import { Conversation } from '@/types/messaging';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConversationStatsProps {
  conversations: Conversation[];
}

export const ConversationStats: React.FC<ConversationStatsProps> = ({
  conversations
}) => {
  const calculateStats = () => {
    const total = conversations.length;
    const active = conversations.filter(c => c.status === 'active').length;
    const archived = conversations.filter(c => c.status === 'archived').length;
    const blocked = conversations.filter(c => c.status === 'blocked').length;
    
    const adminSupport = conversations.filter(c => c.type === 'admin_support').length;
    const expertClient = conversations.filter(c => c.type === 'expert_client').length;
    const internal = conversations.filter(c => c.type === 'internal').length;
    
    const urgent = conversations.filter(c => c.priority === 'urgent').length;
    const high = conversations.filter(c => c.priority === 'high').length;
    const medium = conversations.filter(c => c.priority === 'medium').length;
    const low = conversations.filter(c => c.priority === 'low').length;
    
    const withClient = conversations.filter(c => c.client_id).length;
    const withExpert = conversations.filter(c => c.expert_id).length;
    const withDossier = conversations.filter(c => c.dossier_id).length;
    
    const privateConversations = conversations.filter(c => c.access_level === 'private').length;
    const publicConversations = conversations.filter(c => c.access_level === 'public').length;
    const restrictedConversations = conversations.filter(c => c.access_level === 'restricted').length;
    
    // Calculer les conversations récentes (dernières 24h)
    const now = new Date();
    const recent = conversations.filter(c => {
      if (!c.last_message_at) return false;
      const lastMessage = new Date(c.last_message_at);
      const diffHours = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;
    
    return {
      total,
      active,
      archived,
      blocked,
      adminSupport,
      expertClient,
      internal,
      urgent,
      high,
      medium,
      low,
      withClient,
      withExpert,
      withDossier,
      privateConversations,
      publicConversations,
      restrictedConversations,
      recent
    };
  };

  const stats = calculateStats();

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Statistiques des conversations</h3>
        <Badge variant="outline" className="text-sm">
          {stats.total} conversations
        </Badge>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<MessageSquare className="w-4 h-4 text-white" />}
          color="bg-blue-500"
          subtitle="Toutes les conversations"
        />
        
        <StatCard
          title="Actives"
          value={stats.active}
          icon={<CheckCircle className="w-4 h-4 text-white" />}
          color="bg-green-500"
          subtitle="En cours"
        />
        
        <StatCard
          title="Archivées"
          value={stats.archived}
          icon={<Archive className="w-4 h-4 text-white" />}
          color="bg-gray-500"
          subtitle="Terminées"
        />
        
        <StatCard
          title="Récentes"
          value={stats.recent}
          icon={<Clock className="w-4 h-4 text-white" />}
          color="bg-purple-500"
          subtitle="Dernières 24h"
        />
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Types de conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Types de conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🛠️</span>
                <span className="text-sm">Support Administratif</span>
              </div>
              <Badge variant="secondary">{stats.adminSupport}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💬</span>
                <span className="text-sm">Expert-Client</span>
              </div>
              <Badge variant="secondary">{stats.expertClient}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🏢</span>
                <span className="text-sm">Interne</span>
              </div>
              <Badge variant="secondary">{stats.internal}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Priorités */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priorités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-red-600">●</span>
                <span className="text-sm">Urgent</span>
              </div>
              <Badge variant="destructive">{stats.urgent}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">●</span>
                <span className="text-sm">Élevée</span>
              </div>
              <Badge variant="outline" className="text-orange-600">{stats.high}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">●</span>
                <span className="text-sm">Moyenne</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">{stats.medium}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-600">●</span>
                <span className="text-sm">Faible</span>
              </div>
              <Badge variant="outline" className="text-green-600">{stats.low}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liens métier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liens métier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Avec Client</span>
              </div>
              <Badge variant="secondary">{stats.withClient}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Avec Expert</span>
              </div>
              <Badge variant="secondary">{stats.withExpert}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Avec Dossier</span>
              </div>
              <Badge variant="secondary">{stats.withDossier}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Niveaux d'accès */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Niveaux d'accès</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Privé</span>
              <Badge variant="secondary">{stats.privateConversations}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Public</span>
              <Badge variant="secondary">{stats.publicConversations}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium">Restreint</span>
              <Badge variant="secondary">{stats.restrictedConversations}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 