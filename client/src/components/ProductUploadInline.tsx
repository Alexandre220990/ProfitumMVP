/**
 * ProductUploadInline - Composant générique d'upload de documents
 * 
 * Ce composant s'adapte automatiquement à chaque produit en utilisant
 * la configuration centralisée dans productWorkflowConfigs.ts
 */

import ProductDocumentUpload, { 
  DocumentFile, 
  ClientProduit,
  RequiredDocument
} from './documents/core/ProductDocumentUpload';
import { getProductConfig, DocumentRequirement } from '@/config/productWorkflowConfigs';
import { FileText } from 'lucide-react';

interface ProductUploadInlineProps {
  clientProduitId: string;
  productKey: string; // 'ticpe', 'urssaf', 'msa', etc.
  clientProduit?: ClientProduit | null;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

/**
 * Convertir DocumentRequirement (config) en RequiredDocument (ProductDocumentUpload)
 */
function mapDocumentRequirement(req: DocumentRequirement): RequiredDocument {
  return {
    type: req.type,
    label: req.label,
    description: req.description,
    icon: FileText, // Icon par défaut
    required: req.required
  };
}

export default function ProductUploadInline({
  clientProduitId,
  productKey,
  clientProduit,
  onDocumentsUploaded,
  onStepComplete
}: ProductUploadInlineProps) {
  
  // Récupérer la configuration du produit
  const productConfig = getProductConfig(productKey);

  if (!productConfig) {
    console.error(`❌ Configuration introuvable pour le produit: ${productKey}`);
    return (
      <div className="text-center text-red-600 p-4">
        Configuration du produit introuvable. Veuillez contacter le support.
      </div>
    );
  }

  // Convertir les documents requis
  const requiredDocuments = productConfig.requiredDocuments.map(mapDocumentRequirement);

  // Message d'information
  const infoMessage = productConfig.specificInstructions || 
    `Uploadez les documents requis pour valider votre éligibilité au produit ${productConfig.productName}.`;

  // Catégorie pour l'API
  const productCategory = `eligibilite_${productKey}`;

  return (
    <ProductDocumentUpload
      clientProduitId={clientProduitId}
      productName={productConfig.productName}
      productCategory={productCategory}
      requiredDocuments={requiredDocuments}
      infoMessage={infoMessage}
      clientProduit={clientProduit}
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}

