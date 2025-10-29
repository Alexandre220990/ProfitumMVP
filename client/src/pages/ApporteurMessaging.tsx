import { MessageSquare } from "lucide-react";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";

export default function ApporteurMessaging() {
  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Messagerie Apporteur</h1>
              <p className="text-sm text-gray-600">
                Communiquez avec vos experts et clients en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Système de messagerie unifié optimisé */}
      <div className="h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <OptimizedMessagingApp 
          showHeader={false}
        />
      </div>
    </div>
  );
}
