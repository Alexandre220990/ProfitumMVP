// Ce fichier est un point d'entrée pour le contexte d'authentification
// Il réexporte AuthProvider depuis hooks/use-auth.tsx pour maintenir la compatibilité
// avec les imports existants qui utilisent './contexts/AuthContext'

export { AuthProvider } from '@/hooks/use-auth'; 