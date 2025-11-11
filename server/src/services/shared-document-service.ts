import { supabase } from '../lib/supabase';

type ValidationStatus = 'pending' | 'validated' | 'rejected';

export interface SharedDocumentParams {
  clientId: string;
  documentType: string;
  filename: string;
  storagePath: string;
  bucketName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  metadata?: Record<string, any> | null;
  validationStatus?: ValidationStatus;
  validatedBy?: string | null;
  validatedAt?: string | null;
  parentSharedDocumentId?: string | null;
}

interface SharedDocumentRecord {
  id: string;
  client_id: string;
  document_type: string;
  filename: string;
  storage_path: string;
  bucket_name: string;
  file_size: number | null;
  mime_type: string | null;
  validation_status: ValidationStatus;
  validated_by: string | null;
  validated_at: string | null;
  metadata: Record<string, any> | null;
  version_number: number;
  created_at: string;
  updated_at: string;
}

interface ClientProcessDocumentRecord {
  id: string;
  client_id: string;
  client_produit_id: string | null;
  produit_id: string | null;
  document_type: string;
  filename: string;
  storage_path: string;
  bucket_name: string;
  file_size: number | null;
  mime_type: string | null;
  validation_status: string | null;
  status: string | null;
  metadata: Record<string, any> | null;
  shared_document_id: string | null;
  parent_document_id: string | null;
}

export class SharedDocumentService {
  /**
   * Crée une nouvelle entrée SharedClientDocument ou récupère la plus récente pour un type de document donné.
   */
  static async resolveSharedDocumentForUpload(params: SharedDocumentParams): Promise<SharedDocumentRecord> {
    const {
      clientId,
      documentType,
      filename,
      storagePath,
      bucketName,
      fileSize,
      mimeType,
      metadata,
      validationStatus = 'pending',
      validatedBy = null,
      validatedAt = null,
      parentSharedDocumentId = null
    } = params;

    const existing = await supabase
      .from<SharedDocumentRecord>('SharedClientDocument' as any)
      .select('*')
      .eq('client_id', clientId)
      .eq('document_type', documentType)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion =
      (existing.data?.version_number ?? 0) + 1;

    const metadataToStore = {
      ...(existing.data?.metadata || {}),
      ...(metadata || {}),
      ...(parentSharedDocumentId
        ? { parent_shared_document_id: parentSharedDocumentId }
        : {})
    };

    const { data, error } = await supabase
      .from<SharedDocumentRecord>('SharedClientDocument' as any)
      .insert({
        client_id: clientId,
        document_type: documentType,
        filename,
        storage_path: storagePath,
        bucket_name: bucketName,
        file_size: fileSize ?? null,
        mime_type: mimeType ?? null,
        validation_status: validationStatus,
        validated_by: validatedBy,
        validated_at: validatedAt,
        metadata: metadataToStore,
        version_number: nextVersion
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ SharedDocumentService.resolveSharedDocumentForUpload - error:', error);
      throw new Error(error?.message || 'Impossible de créer le document partagé');
    }

    return data;
  }

  /**
   * Propagation d'une validation vers tous les dossiers et mise à jour du document partagé.
   */
  static async propagateValidation(processDocumentId: string, validatedBy: string): Promise<void> {
    const { data: processDocument, error: processError } = await supabase
      .from<ClientProcessDocumentRecord>('ClientProcessDocument' as any)
      .select('*')
      .eq('id', processDocumentId)
      .single();

    if (processError || !processDocument) {
      console.error('❌ SharedDocumentService.propagateValidation - document introuvable', processError);
      throw new Error('Document à valider introuvable');
    }

    const sharedDocumentId = processDocument.shared_document_id;

    if (!sharedDocumentId) {
      console.warn('⚠️ SharedDocumentService.propagateValidation - shared_document_id manquant, tentative de récupération');
      const sharedDoc = await this.resolveSharedDocumentForUpload({
        clientId: processDocument.client_id,
        documentType: processDocument.document_type,
        filename: processDocument.filename,
        storagePath: processDocument.storage_path,
        bucketName: processDocument.bucket_name,
        fileSize: processDocument.file_size,
        mimeType: processDocument.mime_type,
        metadata: processDocument.metadata ?? {},
        validationStatus: 'validated',
        validatedBy,
        validatedAt: new Date().toISOString()
      });

      await supabase
        .from('ClientProcessDocument')
        .update({
          shared_document_id: sharedDoc.id
        })
        .eq('id', processDocument.id);

      await this.propagateValidation(processDocumentId, validatedBy);
      return;
    }

    const nowIso = new Date().toISOString();

    const { error: updateSharedError } = await supabase
      .from('SharedClientDocument')
      .update({
        filename: processDocument.filename,
        storage_path: processDocument.storage_path,
        bucket_name: processDocument.bucket_name,
        file_size: processDocument.file_size,
        mime_type: processDocument.mime_type,
        validation_status: 'validated',
        validated_by: validatedBy,
        validated_at: nowIso,
        metadata: {
          ...(processDocument.metadata || {}),
          propagated_from_document_id: processDocument.id,
          propagated_from_dossier_id: processDocument.client_produit_id
        },
        updated_at: nowIso
      })
      .eq('id', sharedDocumentId);

    if (updateSharedError) {
      console.error('❌ SharedDocumentService.propagateValidation - mise à jour shared échouée', updateSharedError);
      throw new Error('Erreur lors de la mise à jour du document partagé');
    }

    const { data: relatedDocuments, error: relatedError } = await supabase
      .from<ClientProcessDocumentRecord>('ClientProcessDocument' as any)
      .select('id, metadata')
      .eq('client_id', processDocument.client_id)
      .eq('document_type', processDocument.document_type);

    if (relatedError) {
      console.error('❌ SharedDocumentService.propagateValidation - récupération documents liés échouée', relatedError);
      throw new Error('Erreur lors de la récupération des documents liés');
    }

    if (!relatedDocuments || relatedDocuments.length === 0) {
      return;
    }

    for (const related of relatedDocuments) {
      const mergedMetadata = {
        ...(related.metadata || {}),
        shared_document_id: sharedDocumentId,
        shared_document_origin: {
          document_id: processDocument.id,
          dossier_id: processDocument.client_produit_id
        }
      };

      const { error: updateProcessError } = await supabase
        .from('ClientProcessDocument')
        .update({
          shared_document_id: sharedDocumentId,
          status: 'validated',
          validation_status: 'validated',
          validated_by: validatedBy,
          validated_at: nowIso,
          filename: processDocument.filename,
          storage_path: processDocument.storage_path,
          bucket_name: processDocument.bucket_name,
          file_size: processDocument.file_size,
          mime_type: processDocument.mime_type,
          metadata: mergedMetadata,
          updated_at: nowIso
        })
        .eq('id', related.id);

      if (updateProcessError) {
        console.error('⚠️ SharedDocumentService.propagateValidation - échec mise à jour document', {
          documentId: related.id,
          error: updateProcessError
        });
      }
    }
  }
}

