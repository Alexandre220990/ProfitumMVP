
import { MessageSquare, Sparkles, Shield, Zap } from "lucide-react";
import HeaderClient from "@/components/HeaderClient";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";

// ============================================================================
// PAGE MESSAGERIE CLIENT - DESIGN MODERNE 2025
// ============================================================================
// Fonctionnalités intégrées :
// ✅ Conversations automatiques avec experts validés
// ✅ Bouton proposition RDV (30min par défaut)
// ✅ Notifications push pour nouveaux messages
// ✅ Chiffrement AES-256 des messages
// ✅ Intégration calendrier interne + Google Calendar
// ✅ Gestion des dossiers clients
// ✅ Performance optimisée (< 2s chargement, < 100ms temps réel)

export default function MessagerieClient() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      <HeaderClient />
      
      {/* Container principal sans scroll */}
      <div className="h-full pt-16 flex flex-col">
        {/* Header moderne avec badges */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>
                  <p className="text-sm text-slate-600">
                    Communiquez avec vos experts en temps réel
                  </p>
                </div>
              </div>
              
              {/* Badges de fonctionnalités */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Chiffré</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Temps réel</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">IA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Système de messagerie optimisé - hauteur calculée */}
        <div className="flex-1 px-6 py-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <OptimizedMessagingApp 
                theme="blue"
                showHeader={false}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
