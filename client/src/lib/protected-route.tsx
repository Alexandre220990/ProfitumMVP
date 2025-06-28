import { useEffect, memo, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = memo(({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ⏳ Affichage d'un loader pendant le chargement des données utilisateur
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, on redirige vers la page de connexion
  if (!user) {
    return <Navigate to="/connexion-client" state={{ from: location }} replace />;
  }

  // ✅ Optimisation avec `useMemo()` pour éviter un re-render inutile
  const RenderComponent = useMemo(() => <>{children}</>, [children]);

  return RenderComponent;
});
