import React, { ReactNode } from 'react';
import { useFirstLogin } from '@/hooks/use-first-login';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '@/hooks/use-auth';
import LoadingScreen from '@/components/LoadingScreen';

interface ClientDashboardWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper pour les dashboards clients
 * Affiche automatiquement le modal de changement de mot de passe si c'est la première connexion
 * 
 * Usage:
 * ```tsx
 * <ClientDashboardWrapper>
 *   <YourDashboardContent />
 * </ClientDashboardWrapper>
 * ```
 */
export default function ClientDashboardWrapper({ children }: ClientDashboardWrapperProps) {
  const { user } = useAuth();
  const { isFirstLogin, loading, setIsFirstLogin } = useFirstLogin(user?.id);

  const handlePasswordChanged = () => {
    setIsFirstLogin(false);
    // Optionnel: recharger la page ou afficher un message de succès
    window.location.reload();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Modal de changement de mot de passe si première connexion */}
      {isFirstLogin && (
        <ChangePasswordModal
          onSuccess={handlePasswordChanged}
          userName={user?.name || user?.username}
        />
      )}

      {/* Contenu du dashboard */}
      {children}
    </>
  );
}

