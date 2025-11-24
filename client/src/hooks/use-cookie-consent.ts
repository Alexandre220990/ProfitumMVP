import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_EXPIRY = 365; // jours

export type CookieConsent = {
  analytics: boolean;
  timestamp: number;
};

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Vérifier si le consentement est encore valide (moins de 1 an)
        const age = Date.now() - parsed.timestamp;
        const maxAge = COOKIE_CONSENT_EXPIRY * 24 * 60 * 60 * 1000;
        
        if (age < maxAge) {
          setConsent(parsed);
          setIsVisible(false);
          return;
        }
      } catch (e) {
        // Si erreur de parsing, considérer comme non consenti
      }
    }
    
    setIsVisible(true);
  }, []);

  const acceptAll = () => {
    const newConsent: CookieConsent = {
      analytics: true,
      timestamp: Date.now()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setIsVisible(false);
    loadAnalyticsScripts();
  };

  const rejectAll = () => {
    const newConsent: CookieConsent = {
      analytics: false,
      timestamp: Date.now()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setIsVisible(false);
  };

  const hasConsented = () => {
    return consent?.analytics === true;
  };

  return {
    consent,
    isVisible,
    acceptAll,
    rejectAll,
    hasConsented
  };
}

function loadAnalyticsScripts() {
  // Charger Microsoft Clarity uniquement après consentement
  if (typeof window !== 'undefined' && !(window as any).clarity) {
    const clarityId = "sif392inpt";
    
    // Initialiser l'objet clarity sur window
    (window as any).clarity = (window as any).clarity || function() {
      ((window as any).clarity.q = (window as any).clarity.q || []).push(arguments);
    };
    
    // Créer et injecter le script Clarity
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${clarityId}`;
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }
}

