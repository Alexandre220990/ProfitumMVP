import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { signCharte, checkCharteSignature, getClientUserAgent } from '@/lib/charte-signature-api';
import { CharteSignature } from '@/types/api';

console.log('🚀 FICHIER use-charte-signature.ts CHARGÉ - VERSION MISE À JOUR:', new Date().toISOString());

interface UseCharteSignatureReturn {
  isSigned: boolean;
  isLoading: boolean;
  isSigning: boolean;
  signature: CharteSignature | null;
  signCharte: () => Promise<boolean>;
  checkSignature: () => Promise<void>;
}

/**
 * Hook pour gérer les signatures de charte
 * @param clientProduitEligibleId - ID du ClientProduitEligible (optionnel, peut être récupéré depuis les paramètres)
 * @returns Objet avec les états et fonctions pour gérer les signatures
 */
export const useCharteSignature = (clientProduitEligibleId?: string): UseCharteSignatureReturn => {
  console.log('🔄 Hook useCharteSignature appelé - VERSION MISE À JOUR:', new Date().toISOString());
  console.log('🔄 clientProduitEligibleId reçu:', clientProduitEligibleId);
  
  const params = useParams();
  const { toast } = useToast();
  
  console.log('🔍 Paramètres de route disponibles:', params);
  console.log('🔍 clientProduitEligibleId reçu en paramètre:', clientProduitEligibleId);
  
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<CharteSignature | null>(null);

  // Utiliser l'ID fourni en paramètre ou celui des paramètres de route
  // Essayer différents noms de paramètres possibles
  const effectiveClientProduitEligibleId = clientProduitEligibleId || 
    params.clientProduitId || 
    params.uuid || 
    params.id;

  console.log('🔍 ID effectif utilisé:', effectiveClientProduitEligibleId);
  console.log('🔍 État initial - isLoading:', isLoading);

  /**
   * Vérifie si une signature existe déjà
   */
  const checkSignature = useCallback(async () => {
    console.log('🔍 checkSignature appelée');
    console.log('🔍 effectiveClientProduitEligibleId dans checkSignature:', effectiveClientProduitEligibleId);
    
    if (!effectiveClientProduitEligibleId) {
      console.warn('⚠️ Aucun clientProduitEligibleId fourni pour vérifier la signature');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Début de la vérification - setIsLoading(true)');
      setIsLoading(true);
      console.log('🔍 Vérification de la signature pour:', effectiveClientProduitEligibleId);

      const response = await checkCharteSignature(effectiveClientProduitEligibleId);
      console.log('🔍 Réponse de checkCharteSignature:', response);

      if (response.success && response.data) {
        setIsSigned(response.data.signed);
        setSignature(response.data.signature);
        
        if (response.data.signed) {
          console.log('✅ Signature trouvée:', response.data.signature?.id);
        } else {
          console.log('ℹ️ Aucune signature trouvée');
        }
      } else {
        console.error('❌ Erreur lors de la vérification:', response.message);
        toast({
          title: "Erreur",
          description: response.message || "Impossible de vérifier la signature",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la signature",
        variant: "destructive"
      });
    } finally {
      console.log('🔍 Fin de la vérification - setIsLoading(false)');
      setIsLoading(false);
    }
  }, [effectiveClientProduitEligibleId, toast]);

  /**
   * Signe la charte
   */
  const handleSignCharte = useCallback(async (): Promise<boolean> => {
    if (!effectiveClientProduitEligibleId) {
      console.error('❌ Aucun clientProduitEligibleId fourni pour signer la charte');
      toast({
        title: "Erreur",
        description: "Impossible de signer la charte",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSigning(true);
      console.log('📝 Signature de la charte pour:', effectiveClientProduitEligibleId);

      const userAgent = getClientUserAgent();
      const signatureData = {
        clientProduitEligibleId: effectiveClientProduitEligibleId,
        ipAddress: undefined, // Sera récupéré côté serveur
        userAgent: userAgent || undefined
      };

      const response = await signCharte(signatureData);

      if (response.success && response.data) {
        setIsSigned(true);
        setSignature(response.data);
        
        console.log('✅ Charte signée avec succès:', response.data.id);
        
        toast({
          title: "Succès",
          description: "Charte signée avec succès",
        });

        return true;
      } else {
        console.error('❌ Erreur lors de la signature:', response.message);
        
        toast({
          title: "Erreur",
          description: response.message || "Impossible de signer la charte",
          variant: "destructive"
        });

        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la signature de la charte:', error);
      
      toast({
        title: "Erreur",
        description: "Impossible de signer la charte",
        variant: "destructive"
      });

      return false;
    } finally {
      setIsSigning(false);
    }
  }, [effectiveClientProduitEligibleId, toast]);

  // Vérifier la signature au chargement et quand l'ID change
  useEffect(() => {
    console.log('🔄 useEffect déclenché');
    console.log('🔄 effectiveClientProduitEligibleId:', effectiveClientProduitEligibleId);
    console.log('🔄 Type de effectiveClientProduitEligibleId:', typeof effectiveClientProduitEligibleId);
    console.log('🔄 effectiveClientProduitEligibleId est truthy:', !!effectiveClientProduitEligibleId);
    
    if (effectiveClientProduitEligibleId) {
      console.log('✅ Appel de checkSignature...');
      checkSignature();
    } else {
      console.log('⚠️ Pas d\'ID, pas d\'appel à checkSignature');
      setIsLoading(false);
    }
  }, [effectiveClientProduitEligibleId, checkSignature]); // Inclure checkSignature dans les dépendances

  return {
    isSigned,
    isLoading,
    isSigning,
    signature,
    signCharte: handleSignCharte,
    checkSignature
  };
}; 