/**
 * TICPEUploadInline - Wrapper standardisé pour TICPE
 * Utilise le composant générique ProductDocumentUpload
 */

import ProductDocumentUpload, { DocumentFile, ClientProduit } from '../core/ProductDocumentUpload';
import { TICPE_DOCUMENTS, TICPE_INFO_MESSAGE } from '@/config/product-documents';

interface TICPEUploadInlineProps {
  clientProduitId: string;
  clientProduit?: ClientProduit | null;
  onDocumentsUploaded: (documents: DocumentFile[]) => void;
  onStepComplete: () => void;
}

export default function TICPEUploadInline({
  clientProduitId,
  clientProduit,
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
      clientProduit={clientProduit}
      onDocumentsUploaded={onDocumentsUploaded}
      onStepComplete={onStepComplete}
    />
  );
}
