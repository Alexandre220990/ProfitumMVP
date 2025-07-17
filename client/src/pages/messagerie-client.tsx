
import HeaderClient from "@/components/HeaderClient";
import UnifiedMessaging from "@/components/UnifiedMessaging";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";

export default function MessagerieClient() {
  const { user } = useAuth();

  // Participants pour la conversation admin
  const adminParticipants = [
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Support Administratif',
      type: 'admin',
      company: 'Plateforme',
      avatar: null
    },
    {
      id: user?.id || '',
      name: user?.name || 'Client',
      type: 'client',
      company: user?.company_name || '',
      avatar: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderClient />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* Header amélioré */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Messagerie</h1>
              <p className="text-slate-600">
                Communiquez avec vos experts et le support en temps réel
              </p>
            </div>
          </div>
        </div>

        {/* Système de messagerie unifié */}
        <UnifiedMessaging
          conversationType="expert_client"
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
