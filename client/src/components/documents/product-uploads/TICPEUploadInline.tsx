/**
 * TICPEUploadInline - Wrapper standardisé pour TICPE
 * Utilise le composant générique ProductDocumentUpload
 */

import ProductDocumentUpload, { DocumentFile } from '../core/ProductDocumentUpload';
import { TICPE_DOCUMENTS, TICPE_INFO_MESSAGE } from '@/config/product-documents';

interface TICPEUploadInlineProps {
  clientProduitId: string;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

export default function TICPEUploadInline({
  clientProduitId,
  onDocumentsUploaded,
  onStepComplete
}: TICPEUploadInlineProps) {
  return (
    <ProductDocumentUpload
      clientProduitId={clientProduitId}
      productName="TICPE"
      productCategory="eligibilite_ticpe"
      requiredDocuments={TICPE_DOCUMENTS}
      infoMessage={TICPE_INFO_MESSAGE}
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}
