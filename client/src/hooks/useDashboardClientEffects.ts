import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./use-auth";
import { useAudits } from "./use-audit";

export function useDashboardClientEffects() { const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const { audits, isLoading: isLoadingAudits, error: auditsError, refreshAudits, hasRecentSimulation } = useAudits(user?.id);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [useFallbackData, setUseFallbackData] = useState(false);

  // Redirection si un client tente d'accéder à un autre dashboard
  useEffect(() => { if (user?.type === 'client' && urlId && urlId !== user.id) {
      console.warn('⚠️ Client tentant d\'accéder à un autre dashboard, redirection vers son propre dashboard');
      navigate(`/dashboard/client/${user.id }`);
    }
  }, [user, urlId, navigate]);

  // Effet pour nettoyer les IDs stockés
  useEffect(() => { const redirectedId = localStorage.getItem('redirect_client_id');
    if (redirectedId) {
      localStorage.removeItem('redirect_client_id'); }
  }, []);

  // Effet pour stocker l'ID UUID en session
  useEffect(() => { if (user?.id && user.id.length > 10 && user.id.includes('-')) {
      sessionStorage.setItem('current_client_uuid', user.id); }
  }, [user?.id]);

  // Effet pour détecter si le chargement prend trop de temps
  useEffect(() => { let timeoutId: NodeJS.Timeout;

    if (isLoadingAudits) {
      timeoutId = setTimeout(() => {
        setLoadingTooLong(true); }, 5000);
    }

    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isLoadingAudits]);

  // Effet pour gérer les dialogues
  useEffect(() => { if (!user?.id) return;

    setShowSimulationDialog(!isLoadingAudits && Array.isArray(audits) && audits.length === 0 && hasRecentSimulation);

    // Afficher le popup de bienvenue tant qu'il n'y a pas de produits éligibles
    const hasEligibleProducts = Array.isArray(audits) && audits.length > 0;
    if (!hasEligibleProducts) { setShowWelcomeDialog(true); } else { setShowWelcomeDialog(false); }
  }, [user, audits, isLoadingAudits, hasRecentSimulation]);

  // Effet pour la redirection
  useEffect(() => { if (!isLoading && !user) {
      navigate('/connexion-client'); }
  }, [user, isLoading, navigate]);

  return { showWelcomeDialog, setShowWelcomeDialog, showSimulationDialog, setShowSimulationDialog, loadingTooLong, useFallbackData, setUseFallbackData, audits, isLoadingAudits, auditsError, refreshAudits, hasRecentSimulation };
} 