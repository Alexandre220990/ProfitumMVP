import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  User, 
  Users,
  Eye,
  Building
} from 'lucide-react';
import { config } from '@/config';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface Contact {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
  type: 'client' | 'expert' | 'apporteur' | 'admin';
  is_active: boolean;
  created_at: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (contact: Contact) => void;
  onViewProfile?: (contact: Contact) => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  onStartConversation,
  onViewProfile
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [contacts, setContacts] = useState<{
    clients: Contact[];
    experts: Contact[];
    apporteurs: Contact[];
    admins: Contact[];
  }>({
    clients: [],
    experts: [],
    apporteurs: [],
    admins: []
  });

  // État collapse des groupes (sauvegardé dans localStorage)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('messaging_collapsed_groups');
    return saved ? JSON.parse(saved) : {
      clients: false,
      experts: false,
      apporteurs: false,
      admins: false
    };
  });

  // Sauvegarder dans localStorage quand ça change
  useEffect(() => {
    localStorage.setItem('messaging_collapsed_groups', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  // Charger les contacts
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // ✅ Utiliser le token Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${config.API_URL}/api/unified-messaging/contacts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
         console.error('📋 Contacts chargés:', {
          clients: result.data?.clients?.length || 0,
          experts: result.data?.experts?.length || 0,
          apporteurs: result.data?.apporteurs?.length || 0,
          admins: result.data?.admins?.length || 0
        });
        console.error('👤 Admins:', result.data?.admins);
        setContacts(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const filterContacts = (contactList: Contact[]) => {
    if (!searchQuery) return contactList;
    
    const query = searchQuery.toLowerCase();
    return contactList.filter(c => 
      c.full_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company_name?.toLowerCase().includes(query)
    );
  };

  const getUserTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      client: 'bg-blue-500',
      expert: 'bg-green-500',
      apporteur: 'bg-purple-500',
      admin: 'bg-gray-600'
    };
    return colors[type] || 'bg-gray-500';
  };

  // Ordre des groupes selon le type d'utilisateur
  const getGroupOrder = (): Array<{ key: string; label: string; icon: any; contacts: Contact[] }> => {
    const baseGroups = {
      clients: { key: 'clients', label: 'CLIENTS', icon: User, contacts: filterContacts(contacts.clients) },
      experts: { key: 'experts', label: 'EXPERTS', icon: Users, contacts: filterContacts(contacts.experts) },
      apporteurs: { key: 'apporteurs', label: 'APPORTEURS', icon: Building, contacts: filterContacts(contacts.apporteurs) },
      admins: { key: 'admins', label: 'ADMIN', icon: User, contacts: filterContacts(contacts.admins) }
    };

    if (user?.type === 'client') {
      return [baseGroups.experts, baseGroups.apporteurs, baseGroups.admins];
    } else if (user?.type === 'expert') {
      return [baseGroups.clients, baseGroups.apporteurs, baseGroups.admins];
    } else if (user?.type === 'apporteur') {
      return [baseGroups.clients, baseGroups.experts, baseGroups.admins];
    } else {
      return [baseGroups.clients, baseGroups.experts, baseGroups.apporteurs];
    }
  };

  const groups = getGroupOrder();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col p-0 w-[95vw] sm:w-full">
        <DialogHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Contacts
          </DialogTitle>
        </DialogHeader>

        {/* Recherche */}
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Liste des contacts */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {loading ? (
            <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-2 sm:gap-3">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm sm:text-base text-gray-600">Chargement...</span>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {groups.map((group) => (
                <div key={group.key} className="border rounded-lg overflow-hidden">
                  {/* Header du groupe */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <group.icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">{group.label}</span>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                        {group.contacts.length}
                      </Badge>
                    </div>
                    {collapsedGroups[group.key] ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Liste des contacts */}
                  <AnimatePresence>
                    {!collapsedGroups[group.key] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {group.contacts.length === 0 ? (
                          <div className="px-3 sm:px-4 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
                            Aucun contact
                          </div>
                        ) : (
                          <div className="divide-y">
                            {group.contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {/* Avatar */}
                                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                                    <AvatarFallback className={`${getUserTypeColor(contact.type)} text-white text-xs sm:text-sm`}>
                                      {contact.full_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs sm:text-sm truncate">{contact.full_name}</h4>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{contact.email}</p>
                                    {contact.company_name && (
                                      <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:block">{contact.company_name}</p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {onViewProfile && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onViewProfile(contact)}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex"
                                        disabled={creatingConversation}
                                      >
                                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        if (creatingConversation) return;
                                        
                                        setCreatingConversation(true);
                                        try {
                                          await onStartConversation(contact);
                                          onClose();
                                        } catch (error) {
                                          console.error('Erreur création conversation:', error);
                                        } finally {
                                          setCreatingConversation(false);
                                        }
                                      }}
                                      disabled={creatingConversation}
                                      className="h-7 px-2 sm:h-8 sm:px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
                                    >
                                      {creatingConversation ? (
                                        <>
                                          <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-white mr-0.5 sm:mr-1"></div>
                                          <span className="hidden sm:inline">Ouverture...</span>
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                          <span className="hidden sm:inline">Message</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Message si aucun résultat */}
              {searchQuery && groups.every(g => g.contacts.length === 0) && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Search className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-500">Aucun contact trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            {contacts.clients.length + contacts.experts.length + contacts.apporteurs.length + contacts.admins.length} contact(s)
          </p>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactsModal;

