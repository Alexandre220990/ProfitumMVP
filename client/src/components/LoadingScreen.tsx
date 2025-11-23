import { motion } from "framer-motion";

/**
 * Écran de chargement avec logo Profitum animé
 * Affiche le logo avec une animation de remplissage de couleur
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        {/* Logo Profitum avec animation de remplissage */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Texte de base (non rempli) */}
          <span className="text-3xl sm:text-4xl font-bold text-slate-300 select-none">
            Profitum
          </span>
          
          {/* Texte avec gradient animé (remplissage) */}
          <motion.span
            className="absolute inset-0 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent select-none"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Profitum
          </motion.span>
        </motion.div>
        
        {/* Indicateur de chargement discret */}
        <motion.div
          className="mt-6 flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-600"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

