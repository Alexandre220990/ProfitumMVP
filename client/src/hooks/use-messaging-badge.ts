import { useState, useEffect } from 'react';
import { useMessaging } from './use-messaging';

// ============================================================================
// HOOK POUR LE BADGE DE MESSAGERIE
// ============================================================================

export const useMessagingBadge = () => {
  const { totalUnreadCount, conversations } = useMessaging();
  const [badgeCount, setBadgeCount] = useState<number>(0);

  useEffect(() => {
    // Mettre à jour le badge avec le nombre total de messages non lus
    setBadgeCount(totalUnreadCount);
  }, [totalUnreadCount]);

  // Formater le badge pour l'affichage
  const getBadgeText = (): string | null => {
    if (badgeCount === 0) return null;
    if (badgeCount > 99) return '99+';
    return badgeCount.toString();
  };

  // Vérifier s'il faut afficher le badge
  const shouldShowBadge = (): boolean => {
    return badgeCount > 0;
  };

  return {
    badgeCount,
    badgeText: getBadgeText(),
    shouldShowBadge: shouldShowBadge(),
    hasUnreadMessages: badgeCount > 0
  };
}; 