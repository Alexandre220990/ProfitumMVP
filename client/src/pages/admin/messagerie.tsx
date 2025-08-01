import { useState, useCallback } from 'react';
import { MessageSquare, Plus, Users } from "lucide-react";
import HeaderAdmin from "@/components/HeaderAdmin";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";
import AdminUserSelector from "@/components/AdminUserSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

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

// ============================================================================
// PAGE MESSAGERIE ADMIN OPTIMISÉE
// ============================================================================

export default function MessagerieAdmin() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>("");

  // ========================================
  // GESTION DES UTILISATEURS
  // ========================================

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setShowUserSelector(false);
    toast({
      title: 'Utilisateur sélectionné',
      description: `Conversation avec ${user.name} (${user.type})`,
      variant: 'default'
    });
  }, []);

  const handleCreateConversation = useCallback(async () => {
    if (!selectedUser) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading('create-conversation');
    try {
      // Logique de création de conversation
      toast({
        title: 'Conversation créée',
        description: `Nouvelle conversation avec ${selectedUser.name}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la conversation',
        variant: 'destructive'
      });
    } finally {
      setActionLoading("");
    }
  }, [selectedUser]);

  // ========================================
  // RENDU DU HEADER
  // ========================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl shadow-lg">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Messagerie Admin</h1>
          <p className="text-slate-600">
            Support et gestion des conversations utilisateurs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sélectionner un utilisateur</DialogTitle>
            </DialogHeader>
            <AdminUserSelector 
              onUserSelect={handleUserSelect}
              onClose={() => setShowUserSelector(false)}
            />
          </DialogContent>
        </Dialog>

        {selectedUser && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              {selectedUser.name} ({selectedUser.type})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
            >
              ×
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderAdmin />
      
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {renderHeader()}

        {/* Système de messagerie unifié optimisé */}
        <div className="h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <OptimizedMessagingApp 
            theme="purple"
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
} 