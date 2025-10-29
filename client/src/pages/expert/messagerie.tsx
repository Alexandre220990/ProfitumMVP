import { MessageSquare } from "lucide-react";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";

export default function MessagerieExpert() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
        
        {/* Header compact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold text-slate-900">Messagerie Expert</h1>
                <p className="text-sm text-slate-600">
                  Communiquez avec vos clients et le support en temps réel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Système de messagerie unifié optimisé */}
        <div className="h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <OptimizedMessagingApp 
            showHeader={false}
          />
        </div>
    </div>
  );
} 