import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  User, 
  Building2, 
  Mail, 
  Plus, 
  Users,
  X,
  Loader2
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  type: 'client' | 'expert';
  specializations?: string[];
  status: string;
  created_at: string;
}

interface AdminUserSelectorProps {
  onUserSelect: (users: User[]) => void;
  onCancel: () => void;
  maxUsers?: number;
}

const AdminUserSelector: React.FC<AdminUserSelectorProps> = ({
  onUserSelect,
  onCancel,
  maxUsers = 10
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userType] = useState<'all' | 'client' | 'expert'>('client');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = users;

    // Filtre par type
    if (userType !== 'all') {
      filtered = filtered.filter(user => user.type === userType);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.company && user.company.toLowerCase().includes(query))
      );
    }

    // Exclure les utilisateurs déjà sélectionnés
    filtered = filtered.filter(user => 
      !selectedUsers.some(selected => selected.id === user.id)
    );

    setFilteredUsers(filtered);
  }, [users, searchQuery, userType, selectedUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Utiliser la route admin existante pour les clients
      const response = await api.get('/admin/clients', {
        params: { 
          limit: 100,
          page: 1
        }
      });

      console.log('📡 Réponse API clients:', response.data);

      if (response.data.success) {
        // Transformer les données clients pour correspondre à l'interface User
        const clientUsers = response.data.data.clients.map((client: any) => ({
          id: client.id,
          name: client.company_name || client.email,
          email: client.email,
          company: client.company_name,
          type: 'client' as const,
          status: client.statut || 'active',
          created_at: client.created_at
        }));
        
        console.log('✅ Utilisateurs transformés:', clientUsers.length);
        setUsers(clientUsers);
      } else {
        throw new Error(response.data.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      
      // Afficher des données de test en cas d'erreur
      const fallbackUsers: User[] = [
        {
          id: '1',
          name: 'Client Test 1',
          email: 'client1@test.com',
          company: 'Entreprise Test 1',
          type: 'client',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Client Test 2',
          email: 'client2@test.com',
          company: 'Entreprise Test 2',
          type: 'client',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
      
      setUsers(fallbackUsers);
      
      toast.error('Utilisation des données de test. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await api.get('/admin/clients', {
        params: { 
          search: searchQuery,
          page: 1,
          limit: 50
        }
      });

      if (response.data.success) {
        // Transformer les données clients pour correspondre à l'interface User
        const clientUsers = response.data.data.clients.map((client: any) => ({
          id: client.id,
          name: client.company_name || client.email,
          email: client.email,
          company: client.company_name,
          type: 'client' as const,
          status: client.statut || 'active',
          created_at: client.created_at
        }));
        
        const newUsers = clientUsers.filter((user: User) => 
          !users.some(existing => existing.id === user.id)
        );
        setUsers(prev => [...prev, ...newUsers]);
      }
    } catch (error) {
      console.error('❌ Erreur recherche utilisateurs:', error);
      toast.error('Impossible de rechercher les utilisateurs.');
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user: User) => {
    if (selectedUsers.length >= maxUsers) {
      toast.error(`Vous ne pouvez sélectionner que ${maxUsers} utilisateurs maximum`);
      return;
    }

    setSelectedUsers(prev => [...prev, user]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const confirmSelection = () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    onUserSelect(selectedUsers);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'client' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des utilisateurs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sélectionner des utilisateurs</h2>
          <p className="text-slate-600">
            Choisissez les clients à contacter
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
      </div>

      {/* Utilisateurs sélectionnés */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Utilisateurs sélectionnés ({selectedUsers.length}/{maxUsers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {user.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUser(user.id)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48 flex items-center justify-center px-3 py-2 bg-slate-100 rounded-md">
              <span className="text-sm text-slate-600">Clients uniquement</span>
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Utilisateurs disponibles ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {getTypeIcon(user.type)}
                        <Badge variant="outline" className="text-xs">
                          {user.type}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`}></div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.company}
                          </span>
                        )}
                      </div>
                      {user.specializations && user.specializations.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {user.specializations.slice(0, 3).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {user.specializations.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={confirmSelection} disabled={selectedUsers.length === 0}>
          Créer la conversation ({selectedUsers.length})
        </Button>
      </div>
    </div>
  );
};

export default AdminUserSelector; 