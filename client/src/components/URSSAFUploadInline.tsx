/**
 * URSSAFUploadInline - Wrapper standardisé pour URSSAF
 * Utilise le composant générique ProductDocumentUpload
 */

import ProductDocumentUpload, { DocumentFile } from './ProductDocumentUpload';
import { URSSAF_DOCUMENTS, URSSAF_INFO_MESSAGE } from '@/config/product-documents';

interface URSSAFUploadInlineProps {
  clientProduitId: string;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

export default function URSSAFUploadInline({
  clientProduitId,
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
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}
