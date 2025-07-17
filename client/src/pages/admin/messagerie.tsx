import { useState } from 'react';
import { MessageSquare, Plus, Users } from "lucide-react";
import HeaderAdmin from "@/components/HeaderAdmin";
import UnifiedMessaging from "@/components/UnifiedMessaging";
import AdminUserSelector from "@/components/AdminUserSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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

export default function MessagerieAdmin() {
  const { user } = useAuth();
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Participants pour les conversations admin
  const adminParticipants = [
    {
      id: user?.id || '',
      name: user?.name || 'Administrateur',
      type: 'admin',
      company: 'Plateforme',
      avatar: null
    }
  ];

  const handleUserSelect = async (selectedUsers: User[]) => {
    try {
      // Créer la conversation avec les utilisateurs sélectionnés
      const response = await api.post('/unified-messaging/admin/conversations', {
        participant_ids: selectedUsers.map(u => u.id),
        title: `Support - ${selectedUsers.map(u => u.name).join(', ')}`,
        description: `Conversation de support avec ${selectedUsers.length} utilisateur(s)`
      });

      if (response.data.success) {
        toast({
          title: 'Conversation créée',
          description: `Conversation créée avec ${selectedUsers.length} utilisateur(s)`
        });
        setShowUserSelector(false);
        
        // Recharger la page pour afficher la nouvelle conversation
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la conversation'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderAdmin />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* Header amélioré */}
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
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau message
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
                onCancel={() => setShowUserSelector(false)}
                maxUsers={5}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Système de messagerie unifié */}
        <UnifiedMessaging
          conversationType="admin_support"
          participants={adminParticipants}
          features={{
            fileUpload: true,
            realTime: true,
            search: true,
            notifications: true,
            typing: true
          }}
          onMessageSent={(message) => {
            console.log('Message envoyé:', message);
          }}
          onConversationSelect={(conversation) => {
            console.log('Conversation sélectionnée:', conversation);
          }}
        />
      </div>
    </div>
  );
} 