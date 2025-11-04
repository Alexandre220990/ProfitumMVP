import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { get, put } from '@/lib/api';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface Document {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  validation_status: 'pending' | 'validated' | 'rejected';
  workflow_step: string | null;
  rejection_reason: string | null;
  validated_at: string | null;
  uploaded_at: string;
  validated_by: string | null;
  Expert?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ExpertDocumentsTabProps {
  dossierId: string;
  onRequestDocuments?: () => void;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export default function ExpertDocumentsTab({ dossierId, onRequestDocuments }: ExpertDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);

  // Charger les documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await get<Document[]>(`/api/expert/dossier/${dossierId}/documents`);
      
      if (response.success && response.data) {
        setDocuments(response.data);
      } else {
        toast.error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dossierId) {
      loadDocuments();
    }
  }, [dossierId]);

  // Valider un document
  const handleValidate = async (documentId: string) => {
    try {
      setValidating(documentId);
      const response = await put(`/api/expert/document/${documentId}/validate`, {});
      
      if (response.success) {
        toast.success('Document validé avec succès');
        await loadDocuments(); // Recharger la liste
      } else {
        toast.error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  // Rejeter un document
  const handleReject = async () => {
    if (!documentToReject || !rejectReason.trim()) {
      toast.error('Veuillez fournir une raison pour le rejet');
      return;
    }

    try {
      setRejecting(documentToReject);
      const response = await put(`/api/expert/document/${documentToReject}/reject`, {
        reason: rejectReason
      });
      
      if (response.success) {
        toast.success('Document rejeté');
        setShowRejectModal(false);
        setRejectReason('');
        setDocumentToReject(null);
        await loadDocuments();
      } else {
        toast.error('Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setRejecting(null);
    }
  };

  // Ouvrir le modal de rejet
  const openRejectModal = (documentId: string) => {
    setDocumentToReject(documentId);
    setShowRejectModal(true);
    setRejectReason('');
  };

  // Télécharger un document
  const handleDownload = (_document: Document) => {
    // TODO: Implémenter le téléchargement sécurisé
    toast.info('Téléchargement en cours...');
  };

  // Formatter la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Stats des documents
  const stats = {
    total: documents.length,
    validated: documents.filter(d => d.validation_status === 'validated').length,
    pending: documents.filter(d => d.validation_status === 'pending').length,
    rejected: documents.filter(d => d.validation_status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Documents du Dossier
          </h3>
          {onRequestDocuments && (
            <Button 
              onClick={onRequestDocuments}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Demander des documents
            </Button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">Validés</p>
            <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">Rejetés</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucun document</p>
          <p className="text-sm text-gray-500 mt-1">
            Le client n'a pas encore uploadé de documents
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white p-4 rounded-lg border-2 transition-all ${
                doc.validation_status === 'validated' ? 'border-green-200 bg-green-50' :
                doc.validation_status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className={`h-5 w-5 ${
                      doc.validation_status === 'validated' ? 'text-green-600' :
                      doc.validation_status === 'rejected' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{doc.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true, locale: fr })}
                        </span>
                        {doc.workflow_step && (
                          <>
                            <span>•</span>
                            <Badge variant="outline">{doc.workflow_step}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statut de validation */}
                  <div className="ml-8">
                    {doc.validation_status === 'validated' && (
                      <div className="inline-flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Validé</span>
                        {doc.validated_at && (
                          <span className="text-xs">
                            - {formatDistanceToNow(new Date(doc.validated_at), { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {doc.validation_status === 'rejected' && (
                      <div className="bg-red-100 px-3 py-2 rounded">
                        <div className="flex items-center gap-2 text-red-700 mb-1">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Document rejeté</span>
                        </div>
                        {doc.rejection_reason && (
                          <p className="text-sm text-red-600 ml-6">
                            Raison : {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}

                    {doc.validation_status === 'pending' && (
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">En attente de validation</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {doc.validation_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleValidate(doc.id)}
                        disabled={validating === doc.id}
                      >
                        {validating === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span className="ml-1">Valider</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectModal(doc.id)}
                        disabled={rejecting === doc.id}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="ml-1">Rejeter</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeter le document
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Veuillez indiquer la raison du rejet. Le client recevra cette information.
            </p>

            <textarea
              className="w-full border rounded-lg p-3 mb-4 min-h-[100px]"
              placeholder="Ex: Document illisible, date expirée, informations manquantes..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false);
                  setDocumentToReject(null);
                  setRejectReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting !== null}
              >
                {rejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Rejet...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmer le rejet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

