import { useState, useCallback } from 'react';
import { config } from '@/config/env';

interface SirenValidationResult {
  exists: boolean;
  siren: string;
  company_name: string | null;
}

interface UseSirenValidationReturn {
  isChecking: boolean;
  validationResult: SirenValidationResult | null;
  checkSiren: (siren: string) => Promise<boolean>;
  clearValidation: () => void;
}

export const useSirenValidation = (): UseSirenValidationReturn => {
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<SirenValidationResult | null>(null);

  const checkSiren = useCallback(async (siren: string): Promise<boolean> => {
    // Nettoyer le SIREN (supprimer les espaces et caractères non numériques)
    const cleanSiren = siren.replace(/\D/g, '');
    
    // Validation basique du format SIREN (9 chiffres)
    if (cleanSiren.length !== 9) {
      setValidationResult({
        exists: false,
        siren: cleanSiren,
        company_name: null
      });
      return false;
    }

    setIsChecking(true);
    
    try {
      const response = await fetch(`${config.apiUrl}/auth/check-siren`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siren: cleanSiren }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationResult(result.data);
        return !result.data.exists; // Retourne true si le SIREN est disponible
      } else {
        console.error('Erreur vérification SIREN:', result.message);
        setValidationResult({
          exists: false,
          siren: cleanSiren,
          company_name: null
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur réseau vérification SIREN:', error);
      setValidationResult({
        exists: false,
        siren: cleanSiren,
        company_name: null
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    isChecking,
    validationResult,
    checkSiren,
    clearValidation
  };
};