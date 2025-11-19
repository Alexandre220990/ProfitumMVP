import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui remet le scroll en haut de page à chaque changement de route
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Remettre le scroll en haut de page à chaque changement de route
    // Utilisation de scrollTo avec try/catch pour compatibilité navigateurs
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Comportement instantané pour éviter l'animation
      });
    } catch (e) {
      // Fallback pour les navigateurs qui ne supportent pas 'instant'
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

