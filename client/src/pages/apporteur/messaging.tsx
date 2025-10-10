import { motion } from 'framer-motion';
import { OptimizedMessagingApp } from '../../components/messaging/OptimizedMessagingApp';

/**
 * Page Messagerie Apporteur - Version Professionnelle 2025
 * Utilise le composant OptimizedMessagingApp moderne
 */
export default function MessagingPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Container principal - hauteur fixe sans scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Système de messagerie optimisé - occupe toute la hauteur */}
        <motion.div 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <OptimizedMessagingApp className="h-full" />
        </motion.div>
      </div>
    </div>
  );
}
