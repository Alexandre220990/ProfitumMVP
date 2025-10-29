
import { MessageSquare } from "lucide-react";
import { OptimizedMessagingApp } from "@/components/messaging/OptimizedMessagingApp";
import { motion } from "framer-motion";

// ============================================================================
// PAGE MESSAGERIE CLIENT - DESIGN MODERNE 2025
// ============================================================================

export default function MessagerieClient() {
  return (
    <div>
      {/* Container principal avec design moderne */}
      <div className="h-full flex flex-col">
        {/* Header compact avec design moderne */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="px-6 py-3 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <motion.div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Messagerie
                  </h1>
                  <p className="text-sm text-slate-600">
                    Communiquez avec vos experts en temps réel
                  </p>
                </div>
              </div>
              
              {/* Espace réservé pour alignement */}
              <div></div>
            </div>
          </div>
        </motion.div>

        {/* Système de messagerie optimisé avec design moderne */}
        <motion.div 
          className="flex-1 px-6 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
