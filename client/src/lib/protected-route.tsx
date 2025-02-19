import { useEffect, memo, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute = memo(({ path, component: Component }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // 🔒 Redirection automatique si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      console.warn("🔒 Redirection vers /connexion-client (Utilisateur non connecté)");
      setLocation("/connexion-client");
    }
  }, [isLoading, user, setLocation]);

  // ⏳ Affichage d'un loader pendant le chargement des données utilisateur
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // ❌ Si l'utilisateur n'est pas défini après le chargement, éviter le rendu
  if (!user) return null;

  // ✅ Optimisation avec `useMemo()` pour éviter un re-render inutile
  const RenderComponent = useMemo(() => <Component />, [Component]);

  // ✅ Utilisation correcte du `Route` de `wouter`
  return <Route path={path}>{RenderComponent}</Route>;
});
