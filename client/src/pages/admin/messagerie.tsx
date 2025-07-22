import { useState, useCallback } from 'react';
import { MessageSquare, Plus, Users } from "lucide-react";
import HeaderAdmin from "@/components/HeaderAdmin";
import { MessagingProvider } from "@/components/messaging/MessagingProvider";
import { MessagingApp } from "@/components/messaging/MessagingApp";
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
// COMPOSANT PRINCIPAL - MESSAGERIE ADMIN
// ============================================================================

export default function MessagerieAdmin() {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // ========================================
  // GESTION DES CONVERSATIONS
  // ========================================

  const handleUserSelect = useCallback(async (selectedUsers: User[]) => {
    if (selectedUsers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un utilisateur'
      });
      return;
    }

    setIsCreatingConversation(true);
    
    try {
      // Créer la conversation avec les utilisateurs sélectionnés
      const response = await fetch('/api/admin/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_ids: selectedUsers.map(u => u.id),
          title: `Support - ${selectedUsers.map(u => u.name).join(', ')}`,
          description: `Conversation de support avec ${selectedUsers.length} utilisateur(s)`
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Conversation créée',
          description: `Conversation créée avec ${selectedUsers.length} utilisateur(s)`
        });
        setShowUserSelector(false);
        
        // Recharger la page pour afficher la nouvelle conversation
        window.location.reload();
      } else {
        throw new Error(data.message || 'Erreur lors de la création de la conversation');
      }
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer la conversation'
      });
    } finally {
      setIsCreatingConversation(false);
    }
  }, []);

  const handleCancelUserSelect = useCallback(() => {
    setShowUserSelector(false);
  }, []);

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
            Support client et gestion des conversations en temps réel
          </p>
        </div>
      </div>

      {/* Bouton Nouveau Message */}
      <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
        <DialogTrigger asChild>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 transition-colors"
            disabled={isCreatingConversation}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreatingConversation ? 'Création...' : 'Nouveau message'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Créer une nouvelle conversation
            </DialogTitle>
          </DialogHeader>
          <AdminUserSelector
            onUserSelect={handleUserSelect}
            onCancel={handleCancelUserSelect}
            maxUsers={5}
          />
        </DialogContent>
      </Dialog>
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

        {/* Système de messagerie optimisé avec Supabase Realtime */}
        <div className="h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <MessagingProvider>
            <MessagingApp 
              headerTitle="Messagerie Admin"
              showHeader={false}
            />
          </MessagingProvider>
        </div>
      </div>
    </div>
  );
} 