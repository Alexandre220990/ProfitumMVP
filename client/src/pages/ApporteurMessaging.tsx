import { MessageSquare } from "lucide-react";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";

export default function ApporteurMessaging() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie Apporteur</h1>
            <p className="text-gray-600">
              Communiquez avec vos experts et clients en temps réel
            </p>
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
