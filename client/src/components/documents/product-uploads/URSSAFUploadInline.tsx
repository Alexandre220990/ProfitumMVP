/**
 * URSSAFUploadInline - Wrapper standardisé pour URSSAF
 * Utilise le composant générique ProductDocumentUpload
 */

import ProductDocumentUpload, { DocumentFile, ClientProduit } from '../core/ProductDocumentUpload';
import { URSSAF_DOCUMENTS, URSSAF_INFO_MESSAGE } from '@/config/product-documents';

interface URSSAFUploadInlineProps {
  clientProduitId: string;
  clientProduit?: ClientProduit | null;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

export default function URSSAFUploadInline({
  clientProduitId,
  clientProduit,
  onDocumentsUploaded,
  onStepComplete
}: URSSAFUploadInlineProps) {
  return (
    <ProductDocumentUpload
      clientProduitId={clientProduitId}
      productName="URSSAF"
      productCategory="eligibilite_urssaf"
      requiredDocuments={URSSAF_DOCUMENTS}
      infoMessage={URSSAF_INFO_MESSAGE}
      clientProduit={clientProduit}
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}
