import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Edit, 
  User, 
  UserCheck, 
  Target, 
  Globe, 
  Lock, 
  Eye,
  X,
  Users2,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types pour les cibles
export interface Target {
  id: string;
  name: string;
  type: 'client' | 'expert' | 'group';
  email?: string;
  company?: string;
  description?: string;
  memberCount?: number;
  isActive: boolean;
}

export interface TargetGroup {
  id: string;
  name: string;
  description?: string;
  members: Target[];
  created_at: string;
  isActive: boolean;
}

interface AdvancedTargetSelectorProps {
  selectedTargets: Target[];
  onTargetsChange: (targets: Target[]) => void;
  accessLevel: 'public' | 'private' | 'restricted' | 'confidential';
  onAccessLevelChange: (level: 'public' | 'private' | 'restricted' | 'confidential') => void;
  className?: string;
}

export default function AdvancedTargetSelector({
  selectedTargets,
  onTargetsChange,
  accessLevel,
  onAccessLevelChange,
  className
}: AdvancedTargetSelectorProps) {
  const [clients, setClients] = useState<Target[]>([]);
  const [experts, setExperts] = useState<Target[]>([]);
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'experts' | 'groups'>('clients');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<TargetGroup>>({});

  // Charger les données
  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      // Simuler le chargement des données (à remplacer par vos appels API)
      const mockClients: Target[] = [
        { id: '1', name: 'Alexandre Martin', type: 'client', email: 'alex.martin@example.com', company: 'TechCorp', isActive: true },
        { id: '2', name: 'Marie Dubois', type: 'client', email: 'marie.dubois@example.com', company: 'FinancePlus', isActive: true },
        { id: '3', name: 'Jean Dupont', type: 'client', email: 'jean.dupont@example.com', company: 'StartupXYZ', isActive: true },
      ];

      const mockExperts: Target[] = [
        { id: '4', name: 'Dr. Sophie Bernard', type: 'expert', email: 'sophie.bernard@expert.com', company: 'ExpertConsulting', isActive: true },
        { id: '5', name: 'Pierre Moreau', type: 'expert', email: 'pierre.moreau@expert.com', company: 'TechExperts', isActive: true },
        { id: '6', name: 'Lisa Chen', type: 'expert', email: 'lisa.chen@expert.com', company: 'InnovationLab', isActive: true },
      ];

      const mockGroups: TargetGroup[] = [
        {
          id: '1',
          name: 'Groupe Premium',
          description: 'Clients et experts premium',
          members: [...mockClients.slice(0, 2), ...mockExperts.slice(0, 1)],
          created_at: new Date().toISOString(),
          isActive: true
        },
        {
          id: '2',
          name: 'Groupe Innovation',
          description: 'Équipe innovation et R&D',
          members: [...mockClients.slice(1), ...mockExperts.slice(1)],
          created_at: new Date().toISOString(),
          isActive: true
        }
      ];

      setClients(mockClients);
      setExperts(mockExperts);
      setGroups(mockGroups);
    } catch (error) {
      console.error('Erreur lors du chargement des cibles:', error);
    }
  };

  // Gestion de la sélection
  const toggleTarget = (target: Target) => {
    const isSelected = selectedTargets.some(t => t.id === target.id && t.type === target.type);
    
    if (isSelected) {
      onTargetsChange(selectedTargets.filter(t => !(t.id === target.id && t.type === target.type)));
    } else {
      onTargetsChange([...selectedTargets, target]);
    }
  };

  const removeTarget = (targetId: string, targetType: string) => {
    onTargetsChange(selectedTargets.filter(t => !(t.id === targetId && t.type === targetType)));
  };

  // Gestion des groupes
  const handleCreateGroup = () => {
    setEditingGroup({
      name: '',
      description: '',
      members: []
    });
    setShowGroupDialog(true);
  };

  const saveGroup = async () => {
    try {
      if (editingGroup.id) {
        // Modification
        const updatedGroups = groups.map(g => 
          g.id === editingGroup.id ? { ...g, ...editingGroup } : g
        );
        setGroups(updatedGroups);
      } else {
        // Création
        const newGroup: TargetGroup = {
          id: Date.now().toString(),
          name: editingGroup.name || '',
          description: editingGroup.description,
          members: editingGroup.members || [],
          created_at: new Date().toISOString(),
          isActive: true
        };
        setGroups([...groups, newGroup]);
      }
      
      setShowGroupDialog(false);
      setEditingGroup({});
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du groupe:', error);
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'restricted': return <Shield className="w-4 h-4" />;
      case 'confidential': return <Eye className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Niveau d'accès */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Niveau d'accès</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['public', 'private', 'restricted', 'confidential'] as const).map((level) => (
            <Button
              key={level}
              variant={accessLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => onAccessLevelChange(level)}
              className="justify-start"
            >
              {getAccessLevelIcon(level)}
              <span className="ml-2 capitalize">{level}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Cibles sélectionnées */}
      {selectedTargets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cibles sélectionnées ({selectedTargets.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedTargets.map((target) => (
              <Badge
                key={`${target.type}-${target.id}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {target.type === 'client' && <User className="w-3 h-3" />}
                {target.type === 'expert' && <UserCheck className="w-3 h-3" />}
                {target.type === 'group' && <Users2 className="w-3 h-3" />}
                <span className="capitalize">{target.type}:</span>
                <span>{target.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeTarget(target.id, target.type)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sélecteur de cibles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Sélectionner les cibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher des clients, experts ou groupes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Onglets */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Clients ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="experts" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Experts ({experts.length})
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users2 className="w-4 h-4" />
                Groupes ({groups.length})
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            <TabsContent value="clients" className="space-y-2">
              <ScrollArea className="h-48">
                {clients.map((client) => {
                  const isSelected = selectedTargets.some(t => t.id === client.id && t.type === 'client');
                  return (
                    <div
                      key={client.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleTarget(client)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                          {client.company && (
                            <div className="text-xs text-gray-400">{client.company}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant={client.isActive ? "default" : "secondary"}>
                        {client.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="experts" className="space-y-2">
              <ScrollArea className="h-48">
                {experts.map((expert) => {
                  const isSelected = selectedTargets.some(t => t.id === expert.id && t.type === 'expert');
                  return (
                    <div
                      key={expert.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleTarget(expert)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <div className="font-medium">{expert.name}</div>
                          <div className="text-sm text-gray-500">{expert.email}</div>
                          {expert.company && (
                            <div className="text-xs text-gray-400">{expert.company}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant={expert.isActive ? "default" : "secondary"}>
                        {expert.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Gérer les groupes</span>
                <Button size="sm" onClick={handleCreateGroup}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nouveau groupe
                </Button>
              </div>
              <ScrollArea className="h-48">
                {groups.map((group) => {
                  const groupTarget: Target = {
                    id: group.id,
                    name: group.name,
                    type: 'group',
                    description: group.description,
                    memberCount: group.members.length,
                    isActive: group.isActive
                  };
                  const isSelected = selectedTargets.some(t => t.id === group.id && t.type === 'group');
                  
                  return (
                    <div
                      key={group.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleTarget(groupTarget)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-gray-500">{group.description}</div>
                          <div className="text-xs text-gray-400">
                            {group.members.length} membre(s)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={group.isActive ? "default" : "secondary"}>
                          {group.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group);
                            setShowGroupDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de gestion des groupes */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup.id ? 'Modifier le groupe' : 'Nouveau groupe'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Nom du groupe *</Label>
              <Input
                id="group-name"
                value={editingGroup.name || ''}
                onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                placeholder="Nom du groupe"
              />
            </div>
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={editingGroup.description || ''}
                onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                placeholder="Description du groupe"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Membres du groupe</Label>
              <div className="mt-2 space-y-2">
                {[...clients, ...experts].map((member) => {
                  const isSelected = editingGroup.members?.some(m => m.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const currentMembers = editingGroup.members || [];
                        if (isSelected) {
                          setEditingGroup({
                            ...editingGroup,
                            members: currentMembers.filter(m => m.id !== member.id)
                          });
                        } else {
                          setEditingGroup({
                            ...editingGroup,
                            members: [...currentMembers, member]
                          });
                        }
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          {member.email} • {member.type}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveGroup}>
              {editingGroup.id ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 