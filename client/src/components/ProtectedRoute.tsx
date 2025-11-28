import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  requiredType?: "client" | "expert" | "admin" | "apporteur";
}

export default function ProtectedRoute({ requiredType }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Log pour déboguer les problèmes d'authentification
  if (requiredType) {
    console.log('🔒 ProtectedRoute - Vérification:', {
      requiredType,
      userType: user?.type,
      hasUser: !!user,
      isLoading,
      pathname: location.pathname
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute - Aucun utilisateur, redirection vers connexion');
    // Rediriger vers la bonne page de connexion selon le type requis
    if (requiredType === 'expert') {
      return <Navigate to="/connexion-expert" state={{ from: location }} replace />;
    } else if (requiredType === 'admin') {
      return <Navigate to="/connect-admin" state={{ from: location }} replace />;
    } else if (requiredType === 'apporteur') {
      return <Navigate to="/connexion-apporteur" state={{ from: location }} replace />;
    } else {
      return <Navigate to="/connexion-client" state={{ from: location }} replace />;
    }
  }

  if (requiredType && user.type !== requiredType) {
    console.error('❌ ProtectedRoute - Type utilisateur incorrect:', {
      requiredType,
      userType: user.type,
      pathname: location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ ProtectedRoute - Accès autorisé');
  return <Outlet />;
} 