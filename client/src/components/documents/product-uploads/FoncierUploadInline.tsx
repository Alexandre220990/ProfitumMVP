/**
 * FoncierUploadInline - Wrapper standardisé pour Foncier
 * Utilise le composant générique ProductDocumentUpload
 */

import ProductDocumentUpload, { DocumentFile, ClientProduit } from '../core/ProductDocumentUpload';
import { FONCIER_DOCUMENTS, FONCIER_INFO_MESSAGE } from '@/config/product-documents';

interface FoncierUploadInlineProps {
  clientProduitId: string;
  clientProduit?: ClientProduit | null;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

export default function FoncierUploadInline({
  clientProduitId,
  clientProduit,
  onDocumentsUploaded,
  onStepComplete
}: FoncierUploadInlineProps) {
  return (
    <ProductDocumentUpload
      clientProduitId={clientProduitId}
      productName="Foncier"
      productCategory="eligibilite_foncier"
      requiredDocuments={FONCIER_DOCUMENTS}
      infoMessage={FONCIER_INFO_MESSAGE}
      clientProduit={clientProduit}
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}
