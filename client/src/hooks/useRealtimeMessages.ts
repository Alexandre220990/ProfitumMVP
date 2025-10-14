import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './use-auth';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'client' | 'expert' | 'apporteur' | 'admin';
  content: string;
  message_type: 'text' | 'file' | 'system';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseRealtimeMessagesOptions {
  conversationId?: string;
  autoConnect?: boolean;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, messageType?: 'text' | 'file') => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

/**
 * Hook pour gérer la messagerie temps réel avec Supabase Realtime
 * 
 * Remplace l'ancien useWebSocket qui nécessitait un serveur WebSocket custom.
 * Utilise PostgreSQL LISTEN/NOTIFY via Supabase Realtime.
 * 
 * @param options Configuration du hook
 * @returns Fonctions et état de la messagerie temps réel
 * 
 * @example
 * ```tsx
 * function ChatComponent({ conversationId }: { conversationId: string }) {
 *   const { messages, isConnected, sendMessage } = useRealtimeMessages({
 *     conversationId,
 *     autoConnect: true
 *   });
 * 
 *   return (
 *     <div>
 *       <div>Status: {isConnected ? '✅ Connecté' : '⚠️ Déconnecté'}</div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       <button onClick={() => sendMessage('Hello!')}>Envoyer</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeMessages(
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const { conversationId, autoConnect = true } = options;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Charger les messages existants depuis la BDD
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      console.log(`📥 ${data?.length || 0} messages chargés pour conversation ${conversationId}`);
    } catch (err) {
      console.error('❌ Erreur chargement messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * S'abonner aux changements temps réel
   */
  useEffect(() => {
    if (!conversationId || !user || !autoConnect) {
      return;
    }

    console.log(`📡 Supabase Realtime: Connexion au canal conversation:${conversationId}...`);

    // Charger les messages existants
    loadMessages();

    // Créer le canal Realtime
    const channel = supabase.channel(`conversation:${conversationId}`);

    // Écouter les nouveaux messages (INSERT)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('💬 Nouveau message reçu:', payload.new);
        setMessages((prev) => {
          // Éviter les doublons
          if (prev.some(msg => msg.id === payload.new.id)) {
            return prev;
          }
          return [...prev, payload.new as Message];
        });
      }
    );

    // Écouter les mises à jour de messages (UPDATE)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('✏️ Message mis à jour:', payload.new);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? (payload.new as Message) : msg
          )
        );
      }
    );

    // Écouter les suppressions de messages (DELETE)
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('🗑️ Message supprimé:', payload.old);
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== payload.old.id)
        );
      }
    );

    // S'abonner au canal
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Supabase Realtime: Connecté');
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Supabase Realtime: Erreur de connexion');
        setIsConnected(false);
        setError(new Error('Erreur de connexion au canal Realtime'));
      } else if (status === 'TIMED_OUT') {
        console.warn('⚠️ Supabase Realtime: Timeout');
        setIsConnected(false);
        setError(new Error('Timeout de connexion au canal Realtime'));
      } else if (status === 'CLOSED') {
        console.log('🔌 Supabase Realtime: Canal fermé');
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    // Cleanup lors du démontage
    return () => {
      console.log(`🔌 Supabase Realtime: Déconnexion du canal conversation:${conversationId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationId, user, autoConnect, loadMessages]);

  /**
   * Envoyer un nouveau message
   */
  const sendMessage = useCallback(
    async (content: string, messageType: 'text' | 'file' = 'text'): Promise<Message | null> => {
      if (!conversationId || !user) {
        console.warn('⚠️ ConversationId et user requis pour envoyer un message');
        return null;
      }

      if (!content.trim()) {
        console.warn('⚠️ Contenu du message vide');
        return null;
      }

      try {
        const { data, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_type: user.type,
            content: content.trim(),
            message_type: messageType,
            is_read: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        console.log('✅ Message envoyé:', data);
        // Pas besoin d'ajouter au state - Realtime le fera automatiquement
        return data as Message;
      } catch (err) {
        console.error('❌ Erreur envoi message:', err);
        setError(err as Error);
        return null;
      }
    },
    [conversationId, user]
  );

  /**
   * Marquer un message comme lu
   */
  const markAsRead = useCallback(
    async (messageId: string): Promise<void> => {
      try {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString() 
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        console.log('✅ Message marqué comme lu:', messageId);
        // Realtime mettra à jour automatiquement le state
      } catch (err) {
        console.error('❌ Erreur marquage message lu:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Supprimer un message
   */
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);

        if (deleteError) throw deleteError;

        console.log('✅ Message supprimé:', messageId);
        // Realtime mettra à jour automatiquement le state
      } catch (err) {
        console.error('❌ Erreur suppression message:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Recharger manuellement les messages
   */
  const refreshMessages = useCallback(async (): Promise<void> => {
    await loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isConnected,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
    refreshMessages
  };
}

/**
 * Hook simplifié pour la messagerie avec auto-connexion
 * 
 * @example
 * ```tsx
 * const { messages, sendMessage } = useMessaging(conversationId);
 * ```
 */
export function useMessaging(conversationId?: string) {
  return useRealtimeMessages({ conversationId, autoConnect: true });
}

