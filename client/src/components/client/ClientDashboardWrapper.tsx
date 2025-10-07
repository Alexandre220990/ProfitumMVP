import React, { ReactNode } from 'react';
import { useFirstLogin } from '@/hooks/use-first-login';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '@/hooks/use-auth';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
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

