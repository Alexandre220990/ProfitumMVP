import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Search,
  User,
  Users,
  Filter,
  UserPlus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { config } from '@/config';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
  id: string;
  type: 'admin_support' | 'expert_client' | 'internal';
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
  updated_at: string;
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  participant_ids: string[];
  
  // Données enrichies
  otherParticipant?: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    type: 'client' | 'expert' | 'apporteur' | 'admin';
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  is_read: boolean;
}

interface ImprovedAdminMessagingProps {
  className?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const ImprovedAdminMessaging: React.FC<ImprovedAdminMessagingProps> = ({
  className = ''
}) => {
  const { user } = useAuth();
  
  // États
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement conversations admin...');
      const response = await fetch(`${config.API_URL}/api/unified-messaging/admin/conversations`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Réponse conversations:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Données conversations reçues:', result);
        const convs = result.data || [];
        
        // Enrichir les conversations avec les infos des participants
        const enrichedConvs = await Promise.all(convs.map(enrichConversation));
        
        setConversations(enrichedConvs);
        setFilteredConversations(enrichedConvs);
      } else {
        console.error('❌ Erreur API conversations:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enrichir une conversation avec les données du participant
  const enrichConversation = async (conv: Conversation): Promise<Conversation> => {
    // Trouver l'autre participant (pas l'admin)
    const otherParticipantId = conv.participant_ids?.find(id => id !== user?.id);
    
    if (!otherParticipantId) return conv;

    try {
      // Déterminer le type et charger les données
      let participantData = null;
      let participantType: 'client' | 'expert' | 'apporteur' | 'admin' = 'client';

      if (conv.client_id) {
        participantType = 'client';
        participantData = await fetchUserData('client', conv.client_id);
      } else if (conv.expert_id) {
        participantType = 'expert';
        participantData = await fetchUserData('expert', conv.expert_id);
      } else if (conv.apporteur_id) {
        participantType = 'apporteur';
        participantData = await fetchUserData('apporteur', conv.apporteur_id);
      }

      if (participantData) {
        return {
          ...conv,
          otherParticipant: {
            id: participantData.id,
            name: participantData.name || `${participantData.first_name || ''} ${participantData.last_name || ''}`.trim(),
            first_name: participantData.first_name,
            last_name: participantData.last_name,
            email: participantData.email,
            type: participantType
          }
        };
      }
    } catch (error) {
      console.error('Erreur enrichissement conversation:', error);
    }

    return conv;
  };

  // Charger les données d'un utilisateur
  const fetchUserData = async (type: string, id: string) => {
    try {
      let endpoint = '';
      if (type === 'client') {
        endpoint = `/api/admin/clients/${id}`;
      } else if (type === 'expert') {
        endpoint = `/api/admin/experts/${id}`;
      } else if (type === 'apporteur') {
        endpoint = `/api/admin/apporteurs/${id}`;
      }

      const response = await fetch(`${config.API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
    return null;
  };

  // ========================================
  // FILTRAGE
  // ========================================

  useEffect(() => {
    filterConversations();
  }, [searchQuery, userTypeFilter, conversations]);

  const filterConversations = () => {
    let filtered = [...conversations];

    // Filtrer par type d'utilisateur
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(conv => conv.otherParticipant?.type === userTypeFilter);
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.otherParticipant?.name?.toLowerCase().includes(query) ||
        conv.otherParticipant?.email?.toLowerCase().includes(query) ||
        conv.last_message?.content?.toLowerCase().includes(query)
      );
    }

    // Trier: nouvelles conversations (non lues) en haut, puis par date
    filtered.sort((a, b) => {
      // Priorité aux non lues
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (a.unread_count === 0 && b.unread_count > 0) return 1;
      
      // Puis par date
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setFilteredConversations(filtered);
  };

  // ========================================
  // GESTION DES MESSAGES
  // ========================================

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Charger les messages
    try {
      console.log('🔍 Chargement messages pour conversation:', conversation.id);
      const response = await fetch(
        `${config.API_URL}/api/messaging/conversations/${conversation.id}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${await getSupabaseToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📡 Réponse API messages:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Données messages reçues:', result);
        setMessages(result.data?.messages || result.data || []);
      } else {
        console.error('❌ Erreur API messages:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const response = await fetch(`${config.API_URL}/api/unified-messaging/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageInput,
          message_type: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // ✅ FIX : Ajouter le nouveau message et recharger pour avoir le dernier état
        setMessages(prev => [...prev, result.data]);
        setMessageInput('');
        
        // ✅ FORCER le rechargement pour assurer la cohérence
        setTimeout(() => {
          handleConversationSelect(selectedConversation);
        }, 100);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  }, [messageInput, selectedConversation, handleConversationSelect]);

  // ========================================
  // NOUVELLE CONVERSATION
  // ========================================

  const loadAvailableContacts = async () => {
    try {
      setLoadingContacts(true);
      
      // Charger tous les utilisateurs (clients, experts, apporteurs)
      const token = await getSupabaseToken();
      const [clientsResp, expertsResp, apporteursResp] = await Promise.all([
        fetch(`${config.API_URL}/api/admin/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${config.API_URL}/api/admin/experts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${config.API_URL}/api/admin/apporteurs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const clientsData = clientsResp.ok ? await clientsResp.json() : { data: { clients: [] } };
      const expertsData = expertsResp.ok ? await expertsResp.json() : { data: { experts: [] } };
      const apporteursData = apporteursResp.ok ? await apporteursResp.json() : { data: { apporteurs: [] } };

      const clients = (clientsData.data?.clients || []).map((c: any) => ({
        id: c.id,
        name: c.first_name && c.last_name 
          ? `${c.first_name} ${c.last_name}`
          : c.company_name || c.email,
        email: c.email,
        type: 'client' as const
      }));

      const experts = (expertsData.data?.experts || []).map((e: any) => ({
        id: e.id,
        name: e.first_name && e.last_name
          ? `${e.first_name} ${e.last_name}`
          : e.company_name || e.email,
        email: e.email,
        type: 'expert' as const
      }));

      const apporteurs = (apporteursData.data?.apporteurs || []).map((a: any) => ({
        id: a.id,
        name: a.company_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email,
        email: a.email,
        type: 'apporteur' as const
      }));

      setAvailableContacts([...clients, ...experts, ...apporteurs]);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCreateConversation = async (contact: any) => {
    try {
      const response = await fetch(`${config.API_URL}/api/unified-messaging/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participant_id: contact.id,
          participant_type: contact.type
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Conversation créée avec ${contact.name}`);
        setShowNewConversationModal(false);
        // Recharger les conversations
        await loadConversations();
        // Sélectionner la nouvelle conversation
        if (result.data) {
          handleConversationSelect(result.data);
        }
      } else {
        toast.error('Erreur lors de la création de la conversation');
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  // ========================================
  // HELPERS
  // ========================================

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      client: 'Client',
      expert: 'Expert',
      apporteur: 'Apporteur',
      admin: 'Admin'
    };
    return labels[type] || type;
  };

  const getUserTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      client: 'bg-blue-100 text-blue-700',
      expert: 'bg-green-100 text-green-700',
      apporteur: 'bg-purple-100 text-purple-700',
      admin: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // ========================================
  // RENDU
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Liste des conversations - 30% */}
      <div className="w-[400px] border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Header filtres */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par type */}
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="expert">Experts</SelectItem>
              <SelectItem value="apporteur">Apporteurs</SelectItem>
            </SelectContent>
          </Select>

          {/* Compteur + Bouton nouvelle conversation */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredConversations.length} conversation(s)
              {filteredConversations.filter(c => c.unread_count > 0).length > 0 && (
                <span className="ml-2 text-purple-600 font-semibold">
                  · {filteredConversations.filter(c => c.unread_count > 0).length} non lue(s)
                </span>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                setShowNewConversationModal(true);
                loadAvailableContacts();
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
              <MessageSquare className="h-12 w-12 mb-3 text-gray-400" />
              <p className="text-center">Aucune conversation trouvée</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                onClick={() => handleConversationSelect(conv)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-white transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-white border-l-4 border-l-purple-500' : ''
                } ${conv.unread_count > 0 ? 'bg-purple-50' : ''}`}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className={`text-white font-semibold ${
                      conv.otherParticipant?.type === 'client' ? 'bg-blue-500' :
                      conv.otherParticipant?.type === 'expert' ? 'bg-green-500' :
                      conv.otherParticipant?.type === 'apporteur' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}>
                      {conv.otherParticipant?.type === 'client' && <User className="w-5 h-5" />}
                      {conv.otherParticipant?.type === 'expert' && <Users className="w-5 h-5" />}
                      {conv.otherParticipant?.type === 'apporteur' && <Users className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        {/* Nom en haut */}
                        <h4 className={`font-medium text-sm truncate mb-0.5 ${conv.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                          {conv.otherParticipant?.name || 'Utilisateur'}
                        </h4>
                        
                        {/* Type en dessous */}
                        <p className="text-xs text-gray-500">
                          {getUserTypeLabel(conv.otherParticipant?.type || '')}
                        </p>
                      </div>

                      {/* Badge unread à droite */}
                      {conv.unread_count > 0 && (
                        <Badge className="bg-purple-600 text-white flex-shrink-0">{conv.unread_count}</Badge>
                      )}
                    </div>

                    {/* Dernier message */}
                    {conv.last_message && (
                      <p className={`text-sm truncate mt-1 ${
                        conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                      }`}>
                        {conv.last_message.content}
                      </p>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conv.updated_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Zone de messages - 70% */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`text-white ${
                      selectedConversation.otherParticipant?.type === 'client' ? 'bg-blue-500' :
                      selectedConversation.otherParticipant?.type === 'expert' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.otherParticipant?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getUserTypeLabel(selectedConversation.otherParticipant?.type || '')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages - Zone scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
              {messages.length > 0 ? (
                messages
                  .filter(message => message && message.id)
                  .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-3 text-gray-400" />
                  <p className="text-sm">Aucun message dans cette conversation</p>
                  <p className="text-xs mt-1">Soyez le premier à envoyer un message!</p>
                </div>
              )}
            </div>

            {/* Input message - Fixe en bas */}
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Votre message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-2">Choisissez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>

      {/* Modale nouvelle conversation */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingContacts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Chargement des contacts...</p>
              </div>
            ) : (
              <>
                <Input 
                  placeholder="Rechercher un contact..."
                  className="mb-4"
                />
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {availableContacts.map(contact => (
                    <div
                      key={`${contact.type}-${contact.id}`}
                      onClick={() => handleCreateConversation(contact)}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-500">{contact.email}</p>
                        </div>
                      </div>
                      <Badge className={getUserTypeBadgeColor(contact.type)}>
                        {getUserTypeLabel(contact.type)}
                      </Badge>
                    </div>
                  ))}
                  {availableContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucun contact disponible</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedAdminMessaging;

