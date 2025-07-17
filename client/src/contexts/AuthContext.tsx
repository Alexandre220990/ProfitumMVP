// Ce fichier est un point d'entrée pour le contexte d'authentification
// Il réexporte AuthProvider et useAuth depuis hooks/use-auth.tsx pour maintenir la compatibilité
// avec les imports existants qui utilisent './contexts/AuthContext'

export { AuthProvider, useAuth } from '@/hooks/use-auth'; 