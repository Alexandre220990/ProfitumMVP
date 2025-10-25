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
      const response = await fetch(`${config.API_URL}/api/unified-messaging/contacts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      client: 'Client',
      expert: 'Expert',
      apporteur: 'Apporteur',
      admin: 'Admin'
    };
    return labels[type] || type;
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
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacts
          </DialogTitle>
        </DialogHeader>

        {/* Recherche */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste des contacts */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des contacts...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.key} className="border rounded-lg overflow-hidden">
                  {/* Header du groupe */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <group.icon className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">{group.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.contacts.length}
                      </Badge>
                    </div>
                    {collapsedGroups[group.key] ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
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
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            Aucun contact dans cette catégorie
                          </div>
                        ) : (
                          <div className="divide-y">
                            {group.contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="px-4 py-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Avatar */}
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className={`${getUserTypeColor(contact.type)} text-white`}>
                                      {contact.full_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{contact.full_name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                                    {contact.company_name && (
                                      <p className="text-xs text-gray-400 truncate">{contact.company_name}</p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    {onViewProfile && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onViewProfile(contact)}
                                        className="h-8 px-2"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        onStartConversation(contact);
                                        onClose();
                                      }}
                                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Message
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
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun contact trouvé pour "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {contacts.clients.length + contacts.experts.length + contacts.apporteurs.length + contacts.admins.length} contact(s) au total
          </p>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactsModal;

