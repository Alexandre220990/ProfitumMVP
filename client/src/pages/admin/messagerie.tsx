import { motion } from "framer-motion";
import { ImprovedAdminMessaging } from "@/components/messaging/ImprovedAdminMessaging";

// ============================================================================
// PAGE MESSAGERIE ADMIN - VERSION AMÉLIORÉE 2025
// ============================================================================

export default function MessagerieAdmin() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Container principal - hauteur fixe sans scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Système de messagerie - occupe toute la hauteur */}
        <motion.div 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ImprovedAdminMessaging className="h-full" />
        </motion.div>
      </div>
    </div>
  );
} 