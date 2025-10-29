import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";

// ============================================================================
// PAGE MESSAGERIE ADMIN - VERSION UNIFIÉE 2025
// ============================================================================

export default function MessagerieAdmin() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-red-50 to-orange-50">
      {/* Container principal - hauteur fixe sans scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header compact moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="px-6 py-3 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="bg-gradient-to-br from-red-500 via-orange-600 to-red-600 p-3 rounded-xl shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
                  Messagerie Admin
                </h1>
                <p className="text-sm text-slate-600">
                  Conversations avec clients, experts et apporteurs
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Système de messagerie unifié optimisé - occupe toute la hauteur */}
        <motion.div 
          className="flex-1 overflow-hidden px-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto h-full">
            <div className="h-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60">
              <OptimizedMessagingApp className="h-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 