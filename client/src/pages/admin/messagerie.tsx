import { MessageSquare, Plus, Users } from "lucide-react";
import HeaderAdmin from "@/components/HeaderAdmin";
import { AdminMessagingApp } from "@/components/messaging/AdminMessagingApp";
import AdminUserSelector from "@/components/AdminUserSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState, useCallback } from 'react';

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
// PAGE MESSAGERIE ADMIN - DESIGN MODERNE 2025
// ============================================================================

export default function MessagerieAdmin() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);

  // ========================================
  // GESTION DES UTILISATEURS
  // ========================================

  const handleUserSelect = useCallback((users: User[]) => {
    // AdminUserSelector retourne un tableau, on prend le premier utilisateur
    if (users.length > 0) {
      const user = users[0];
      setSelectedUser(user);
      setShowUserSelector(false);
      toast.success(`Conversation avec ${user.name} (${user.type})`);
    }
  }, []);

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-violet-50/50 overflow-hidden">
      <HeaderAdmin />
      
      {/* Container principal avec design moderne */}
      <div className="h-full pt-16 flex flex-col">
        {/* Header moderne avec design 2025 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="px-6 py-6 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 p-4 rounded-2xl shadow-xl">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <motion.div 
                    className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
                    Messagerie Admin
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Support et gestion des conversations utilisateurs
                  </p>
                </div>
              </div>
              
              {/* Bouton nouvelle conversation */}
              <div className="flex items-center gap-3">
                <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 transition-all duration-300">
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
                      onCancel={() => setShowUserSelector(false)}
                      maxUsers={1}
                    />
                  </DialogContent>
                </Dialog>

                {selectedUser && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                  >
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
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Système de messagerie optimisé avec design moderne */}
        <motion.div 
          className="flex-1 px-6 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="max-w-7xl mx-auto h-full">
            <div className="h-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60">
              <AdminMessagingApp 
                showHeader={false}
                className="h-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 