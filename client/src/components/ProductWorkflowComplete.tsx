import { useCallback } from 'react';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import UniversalProductWorkflow from './UniversalProductWorkflow';

interface ProductWorkflowCompleteProps {
  clientProduitId: string;
  productName: string;
  companyName?: string;
  estimatedAmount?: number;
  onStepUpdate?: (stepId: string, updates: any) => void;
  className?: string;
}

/**
 * ProductWorkflowComplete
 * 
 * Ce composant est un wrapper qui redirige vers UniversalProductWorkflow
 * Il détecte automatiquement le type de produit basé sur le nom
 * et utilise la bonne configuration.
 * 
 * ✅ Tous les produits (TICPE, URSSAF, FONCIER, MSA, DFS, ENERGIE) utilisent
 * maintenant le même composant UniversalProductWorkflow pour:
 * - Cohérence du code
 * - Facilité de maintenance
 * - Application automatique des bug fixes
 */
export default function ProductWorkflowComplete({
  clientProduitId,
  productName,
  companyName,
  estimatedAmount,
  onStepUpdate,
  className = ""
}: ProductWorkflowCompleteProps) {

  // Hook pour les étapes du dossier (pour compatibilité)
  const {
    loading: stepsLoading
  } = useDossierSteps(clientProduitId);

  // Wrapper pour les callbacks
  const handleWorkflowComplete = useCallback(() => {
    onStepUpdate?.('workflow-complete', { completed: true });
  }, [onStepUpdate]);

  // Mapper le nom du produit vers la clé productKey
  const productType = productName.toLowerCase();
  let productKey = 'generic';
  
  if (productType.includes('ticpe')) productKey = 'ticpe';
  else if (productType.includes('urssaf')) productKey = 'urssaf';
  else if (productType.includes('foncier')) productKey = 'foncier';
  else if (productType.includes('msa')) productKey = 'msa';
  else if (productType.includes('dfs') || productType.includes('dsf')) productKey = 'dfs';
  else if (productType.includes('énergie') || productType.includes('energie')) productKey = 'energie';

  if (stepsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // ✅ Utiliser UniversalProductWorkflow pour TOUS les produits
  // Cela assure la cohérence et tous les bugs fixes s'appliquent partout
  return (
    <UniversalProductWorkflow
      clientProduitId={clientProduitId}
      productKey={productKey}
      companyName={companyName}
      estimatedAmount={estimatedAmount}
      onWorkflowComplete={handleWorkflowComplete}
      className={className}
    />
  );
}
