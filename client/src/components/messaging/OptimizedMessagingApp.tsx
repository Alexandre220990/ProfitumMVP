import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getUserDisplayName } from '../../../../shared/utils/user-display';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Phone,
  Video,
  Info,
  Users,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import { Conversation, CreateConversationRequest } from '@/types/messaging';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContactsModal } from './ContactsModal';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// MESSAGERIE CLIENT MODERNE - DESIGN PROFESSIONNEL 2025
// ============================================================================

interface OptimizedMessagingAppProps {
  className?: string;
  showHeader?: boolean;
}

export const OptimizedMessagingApp: React.FC<OptimizedMessagingAppProps> = ({
  className = ''
}) => {
  // Fonction utilitaire pour nettoyer les titres des conversations
  const cleanConversationTitle = (title?: string): string => {
    if (!title) return 'Conversation';
    // Supprimer les emails et garder seulement le nom de l'interlocuteur
    return title.replace(/\s*-\s*[^\s@]+@[^\s@]+\.[^\s@]+/g, '').trim();
  };
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ✅ FIX CRITIQUE: Calculer userId une seule fois
  // Pour les apporteurs avec JWT custom, database_id = ID dans ApporteurAffaires
  // user.id peut être l'ID auth.users, donc on privilégie database_id
  const userId = user?.database_id || user?.id || '';
  
  // État local optimisé
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // ✅ FIX: Utilise messaging.currentConversation au lieu d'un état local dupliqué
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<{ is_active: boolean; name: string } | null>(null);
  const [isAutoOpening, setIsAutoOpening] = useState(false);

  // Hook de messagerie optimisé
  const messaging = useMessaging({
    autoConnect: true,
    enableTyping: true,
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10,
    allowedFileTypes: ['image/*', 'application/pdf', 'text/*'],
    enableAutoConversations: true
  });

  // ========================================
  // GESTION DES CONVERSATIONS
  // ========================================

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    console.log('🔍 Sélection conversation:', {
      id: conversation.id,
      title: conversation.title,
      participant_ids: conversation.participant_ids
    });
    
    // ✅ FIX: Utilise directement messaging.selectConversation() qui met à jour currentConversation
    messaging.selectConversation(conversation);
    
    console.log('✅ Conversation sélectionnée dans l\'état local et le hook');
    console.log('📊 État messaging:', {
      currentConversation: messaging.currentConversation?.id,
      messagesCount: messaging.messages?.length,
      loading: messaging.loading,
      isConnected: messaging.isConnected
    });
    
    // Vérifier le statut du participant
    await checkParticipantStatus(conversation);
  }, [messaging]);

  // Vérifier si le participant est actif
  const checkParticipantStatus = async (conversation: Conversation) => {
    try {
      const otherParticipantId = conversation.participant_ids?.find(id => id !== userId);
      if (!otherParticipantId) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messaging/user-status/${otherParticipantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setParticipantStatus({
          is_active: data.is_active,
          name: conversation.title || 'Utilisateur'
        });
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    }
  };

  // ========================================
  // GESTION DES PARAMÈTRES URL (ouverture automatique depuis autres pages)
  // ========================================
  useEffect(() => {
    const handleUrlParams = async () => {
      // Vérifier si on a déjà traité les paramètres URL ou si on est en train de le faire
      if (isAutoOpening) return;

      // Récupérer les paramètres URL
      const expertId = searchParams.get('expertId');
      const clientId = searchParams.get('clientId');
      const apporteurId = searchParams.get('apporteurId');
      const adminId = searchParams.get('adminId');
      
      // Identifier le contact à ouvrir
      const contactId = expertId || clientId || apporteurId || adminId;
      const contactType = expertId ? 'expert' : clientId ? 'client' : apporteurId ? 'apporteur' : adminId ? 'admin' : null;
      
      if (!contactId || !contactType) return;

      console.log('🔗 Paramètres URL détectés:', { contactId, contactType });
      setIsAutoOpening(true);

      try {
        // Attendre que les conversations soient chargées
        if (messaging.loading || !messaging.conversations || messaging.conversations.length === 0) {
          console.log('⏳ En attente du chargement des conversations...');
          return;
        }

        // Chercher si une conversation existe déjà avec ce contact
        const existingConversation = messaging.conversations.find(conv => 
          conv.participant_ids?.includes(contactId)
        );

        if (existingConversation) {
          console.log('✅ Conversation existante trouvée, ouverture...');
          await handleConversationSelect(existingConversation);
          setSearchParams({}); // Nettoyer les paramètres URL
        } else {
          console.log('🆕 Aucune conversation existante, création...');
          
          // Récupérer les infos du contact via l'API
          const token = localStorage.getItem('token');
          let contactInfo = null;
          
          try {
            const response = await fetch(`/api/messaging/user-info/${contactId}?type=${contactType}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              contactInfo = await response.json();
            }
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer les infos du contact, création avec infos minimales');
          }

          // Créer la nouvelle conversation
          const newConversation = await messaging.createConversation({
            type: contactType === 'admin' ? 'admin_support' : 'expert_client',
            participant_ids: [userId, contactId],
            title: contactInfo?.name || contactInfo?.full_name || `${contactType.charAt(0).toUpperCase() + contactType.slice(1)}`
          });

          console.log('✅ Conversation créée:', newConversation);
          await handleConversationSelect(newConversation);
          toast.success(`Conversation ouverte`);
          setSearchParams({}); // Nettoyer les paramètres URL
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture automatique:', error);
        toast.error('Impossible d\'ouvrir la conversation');
        setSearchParams({}); // Nettoyer les paramètres même en cas d'erreur
      } finally {
        setIsAutoOpening(false);
      }
    };

    handleUrlParams();
  }, [searchParams, messaging.conversations, messaging.loading, isAutoOpening, messaging, handleConversationSelect, setSearchParams]);

  // ========================================
  // GESTION DES MESSAGES
  // ========================================

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    // Vérifier si l'utilisateur est désactivé
    if (participantStatus && !participantStatus.is_active) {
      toast.error(
        `${getUserDisplayName(participantStatus)} s'est désinscrit. Le message ne sera pas délivré.`
      );
      return;
    }

    try {
      await messaging.sendMessage(messageInput, selectedFiles);
      setMessageInput('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error("Impossible d'envoyer le message");
    }
  }, [messageInput, selectedFiles, messaging, participantStatus]);

  // Supprimer une conversation
  const handleDeleteConversation = async () => {
    if (!messaging.currentConversation) return;

    try {
      const token = localStorage.getItem('token');
      const isAdmin = user?.type === 'admin';
      const endpoint = isAdmin 
        ? `/api/messaging/conversations/${messaging.currentConversation.id}/hard`
        : `/api/messaging/conversations/${messaging.currentConversation.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(
          isAdmin ? "Conversation supprimée définitivement" : "Conversation masquée"
        );
        messaging.selectConversation(null);
        setShowDeleteDialog(false);
        // Forcer un rechargement de la page pour actualiser la liste
        window.location.reload();
      } else {
        throw new Error('Erreur suppression');
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error);
      toast.error("Impossible de supprimer la conversation");
    }
  };

  // Organiser et afficher les conversations par catégorie
  const renderConversationsByCategory = useCallback((conversations: Conversation[]) => {
    // Vérifier que conversations est bien un array
    if (!Array.isArray(conversations)) {
      console.warn('⚠️ conversations n\'est pas un array:', typeof conversations, conversations);
      return null;
    }
    
    // Séparer les conversations par type
    const adminSupportConversations = conversations.filter(conv => conv.type === 'admin_support');
    const otherConversations = conversations.filter(conv => conv.type !== 'admin_support');

    const renderConversationItem = (conversation: Conversation, index: number) => (
      <motion.div
        key={conversation.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ backgroundColor: 'rgb(241 245 249)' }}
        className={`p-4 cursor-pointer transition-colors border-b border-slate-100 ${
          messaging.currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={() => handleConversationSelect(conversation)}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className={`text-white font-semibold ${
              conversation.type === 'admin_support' 
                ? 'bg-gradient-to-br from-purple-500 to-violet-600' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {conversation.type === 'admin_support' ? '🛠️' : conversation.title?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isSidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-slate-900 text-sm truncate">
                  {cleanConversationTitle(conversation.title)}
                </h3>
                {conversation.unread_count > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {typeof conversation.last_message === 'string' 
                  ? conversation.last_message 
                  : 'Aucun message récent'
                }
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {conversation.updated_at 
                  ? new Date(conversation.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Récemment'
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );

    return (
      <>
        {/* Catégorie Support Administratif */}
        {adminSupportConversations.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200">
              <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                <span>🛠️</span>
                Support Administratif
                {adminSupportConversations.some(conv => conv.unread_count > 0) && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {adminSupportConversations.reduce((sum, conv) => sum + conv.unread_count, 0)}
                  </Badge>
                )}
              </h3>
            </div>
            {adminSupportConversations.map((conversation, index) => 
              renderConversationItem(conversation, index)
            )}
          </div>
        )}

        {/* Catégorie Autres Conversations */}
        {otherConversations.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <span>💬</span>
                Autres Conversations
                {otherConversations.some(conv => conv.unread_count > 0) && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {otherConversations.reduce((sum, conv) => sum + conv.unread_count, 0)}
                  </Badge>
                )}
              </h3>
            </div>
            {otherConversations.map((conversation, index) => 
              renderConversationItem(conversation, adminSupportConversations.length + index)
            )}
          </div>
        )}

        {/* État vide */}
        {conversations.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          </div>
        )}
      </>
    );
  }, [messaging.currentConversation, isSidebarOpen, handleConversationSelect, cleanConversationTitle]);

  // ========================================
  // RENDU PRINCIPAL - DESIGN MESSAGERIE MODERNE
  // ========================================

  return (
    <div className={`h-full flex bg-white ${className}`}>
      {/* Sidebar des conversations - Design moderne */}
      <motion.div 
        className={`${isSidebarOpen ? 'w-80' : 'w-20'} bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out flex-shrink-0`}
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="h-full flex flex-col">
          {/* Header de la sidebar */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <motion.h2 
                className="text-lg font-bold text-slate-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isSidebarOpen ? 'Conversations' : ''}
              </motion.h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-8 w-8 p-0"
              >
                {isSidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Barre de recherche et bouton contacts */}
            {isSidebarOpen && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-100 border-0 focus:bg-white focus:border-slate-300"
                  />
                </div>
                <Button 
                  onClick={() => setShowContactsModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Contacts
                </Button>
              </motion.div>
            )}
          </div>

          {/* Liste des conversations organisées par catégorie */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {renderConversationsByCategory(
                Array.isArray(messaging.conversations) ? messaging.conversations : []
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Zone principale de messagerie */}
      <div className="flex-1 flex flex-col bg-white">
        {messaging.currentConversation ? (
          <>
            {/* Header de conversation */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={messaging.currentConversation.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {messaging.currentConversation.title?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      {cleanConversationTitle(messaging.currentConversation.title)}
                      {participantStatus && !participantStatus.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Désactivé
                        </Badge>
                      )}
                    </h3>
                    <p className={`text-sm flex items-center gap-1 ${
                      participantStatus?.is_active === false ? 'text-red-600' : 'text-green-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        participantStatus?.is_active === false ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      {participantStatus?.is_active === false ? 'Désinscrit' : 'En ligne'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Info className="w-4 h-4" />
                  </Button>
                  
                  {/* Menu contextuel avec suppression */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {user?.type === 'admin' ? 'Supprimer définitivement' : 'Masquer la conversation'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Alerte utilisateur désactivé */}
            {participantStatus && !participantStatus.is_active && (
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <p>
                    <strong>{getUserDisplayName(participantStatus)}</strong> s'est désinscrit de la plateforme. 
                    Vos messages ne seront pas délivrés.
                  </p>
                </div>
              </div>
            )}

            {/* Zone des messages - Pleine hauteur */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {/* Debug et indicateur de chargement */}
              {messaging.loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-slate-600">Chargement des messages...</span>
                </div>
              )}

              {/* Messages */}
              {!messaging.loading && messaging.messages && messaging.messages.length > 0 ? (
                <AnimatePresence>
                  {messaging.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md lg:max-w-lg p-4 rounded-2xl shadow-sm ${
                        message.sender_id === userId 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-slate-200'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender_id === userId ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : !messaging.loading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3" />
                  <p className="text-sm">Aucun message dans cette conversation</p>
                  <p className="text-xs mt-1">Soyez le premier à envoyer un message!</p>
                </div>
              )}
            </div>

            {/* Zone de saisie - Fixée en bas */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Upload fichier')}
                  className="h-10 w-10 p-0 flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    placeholder="Tapez votre message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[44px] border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && selectedFiles.length === 0}
                  className="h-10 px-6 bg-blue-500 hover:bg-blue-600 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <motion.div 
            className="flex-1 flex items-center justify-center bg-slate-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="w-96 p-8 text-center">
              <CardContent className="space-y-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Choisissez une conversation dans la liste pour commencer à échanger avec vos experts
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modal Contacts */}
      <ContactsModal 
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        onStartConversation={async (contact) => {
          try {
            console.error('🚨🚨🚨 ========================================');
            console.error('🚨 FRONTEND: Début création conversation');
            console.error('🚨🚨🚨 ========================================');
            console.error('👤 User actuel:', {
              id: user?.id,
              type: user?.type,
              email: user?.email,
              database_id: user?.database_id
            });
            console.error('👥 Contact sélectionné:', {
              id: contact.id,
              type: contact.type,
              full_name: contact.full_name,
              email: contact.email
            });
            
            const conversationRequest: CreateConversationRequest = {
              type: contact.type === 'admin' ? 'admin_support' : 'expert_client',
              participant_ids: [userId, contact.id],
              title: contact.full_name
            };
            
            console.error('📋 Requête à envoyer:', JSON.stringify(conversationRequest, null, 2));
            console.error('⚠️ userId vide ?', userId === '' || userId === undefined);
            console.error('🆔 userId utilisé:', userId);
            
            // Créer la conversation via l'API
            const newConversation = await messaging.createConversation(conversationRequest);
            
            console.error('📦 Réponse reçue:', {
              hasConversation: !!newConversation,
              isNull: newConversation === null,
              conversation: newConversation
            });
            
            if (!newConversation) {
              console.error('❌ CONVERSATION NULL RETOURNÉE !');
              toast.error('Erreur: conversation non créée');
              return;
            }
            
            console.error('✅✅✅ CONVERSATION CRÉÉE:', newConversation.id);
            
            // Sélectionner la conversation créée
            await handleConversationSelect(newConversation);
            
            // Fermer le modal et afficher le succès
            setShowContactsModal(false);
            toast.success(`Conversation avec ${contact.full_name} créée`);
          } catch (error) {
            console.error('💥💥💥 EXCEPTION FRONTEND:', error);
            console.error('💥 Error message:', error instanceof Error ? error.message : JSON.stringify(error));
            toast.error('Impossible de créer la conversation');
          }
        }}
        onViewProfile={(contact) => {
          toast.info(`Profil de ${contact.full_name}`);
          // TODO: Naviguer vers le profil
        }}
      />

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user?.type === 'admin' ? 'Supprimer définitivement ?' : 'Masquer la conversation ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user?.type === 'admin' 
                ? 'Cette action est irréversible. La conversation sera supprimée pour tous les participants.'
                : 'Cette conversation sera masquée de votre vue mais restera visible pour les autres participants.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-red-600 hover:bg-red-700">
              {user?.type === 'admin' ? 'Supprimer' : 'Masquer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 