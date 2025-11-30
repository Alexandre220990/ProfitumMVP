import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoadingScreen from '@/components/LoadingScreen';

/**
 * Page de redirection automatique pour les admins en PWA
 * Redirige vers /connect-admin si pas connecté, sinon vers le dashboard admin
 */
export default function AdminRedirect() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user?.type === 'admin') {
      // Admin connecté, rediriger vers le dashboard
      navigate('/admin/dashboard-optimized', { replace: true });
    } else {
      // Pas d'admin connecté, rediriger vers la page de connexion
      navigate('/connect-admin', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return <LoadingScreen />;
}

