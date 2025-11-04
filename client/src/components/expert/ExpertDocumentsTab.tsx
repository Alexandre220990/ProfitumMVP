import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { get, put, post } from '@/lib/api';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Clock
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
  bucket_name: string;
  mime_type: string;
  file_size: number;
  validation_status: 'pending' | 'validated' | 'rejected';
  workflow_step: string | null;
  rejection_reason: string | null;
  validated_at: string | null;
  created_at: string;
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
  onRequestDocumentsWithInvalid?: (invalidDocs: Array<{name: string; reason: string}>) => void;
}

interface DocumentValidation {
  documentId: string;
  status: 'valid' | 'invalid' | 'pending';
  rejectionReason?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export default function ExpertDocumentsTab({ 
  dossierId, 
  onRequestDocuments,
  onRequestDocumentsWithInvalid 
}: ExpertDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState<Record<string, DocumentValidation>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActiveDocumentRequest, setHasActiveDocumentRequest] = useState(false);

  // Charger les documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await get<Document[]>(`/api/expert/dossier/${dossierId}/documents`);
      
      if (response.success && response.data) {
        setDocuments(response.data);
        // Initialiser les validations pour les documents pending
        const initialValidations: Record<string, DocumentValidation> = {};
        response.data.forEach(doc => {
          if (doc.validation_status === 'pending') {
            initialValidations[doc.id] = {
              documentId: doc.id,
              status: 'pending',
              rejectionReason: ''
            };
          }
        });
        setValidations(initialValidations);
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
      checkActiveDocumentRequest();
    }
  }, [dossierId]);

  // Vérifier s'il y a une demande de documents active
  const checkActiveDocumentRequest = async () => {
    try {
      const response = await get(`/api/expert/dossier/${dossierId}/document-request`);
      if (response.success && response.data) {
        setHasActiveDocumentRequest(true);
        console.log('📋 Demande de documents active trouvée');
      } else {
        setHasActiveDocumentRequest(false);
      }
    } catch (error) {
      console.error('Erreur vérification document request:', error);
      setHasActiveDocumentRequest(false);
    }
  };

  // Changer le statut d'un document (valid/invalid)
  const handleToggleValidation = (documentId: string, status: 'valid' | 'invalid') => {
    setValidations(prev => ({
      ...prev,
      [documentId]: {
        documentId,
        status,
        rejectionReason: status === 'valid' ? '' : prev[documentId]?.rejectionReason || ''
      }
    }));
  };

  // Mettre à jour la raison de rejet
  const handleRejectionReasonChange = (documentId: string, reason: string) => {
    setValidations(prev => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        rejectionReason: reason
      }
    }));
  };

  // Calculer les stats de validation
  const validationStats = {
    total: Object.keys(validations).length,
    valid: Object.values(validations).filter(v => v.status === 'valid').length,
    invalid: Object.values(validations).filter(v => v.status === 'invalid').length,
    pending: Object.values(validations).filter(v => v.status === 'pending').length
  };

  const allValidated = validationStats.pending === 0 && validationStats.total > 0;
  const hasInvalid = validationStats.invalid > 0;
  const allValid = validationStats.valid === validationStats.total && validationStats.total > 0;

  // Valider le dossier (tous documents valides + lancer audit)
  const handleValidateDossier = async () => {
    try {
      setIsProcessing(true);

      // 1. Valider tous les documents
      const validDocIds = Object.entries(validations)
        .filter(([_, v]) => v.status === 'valid')
        .map(([docId]) => docId);

      for (const docId of validDocIds) {
        await put(`/api/expert/document/${docId}/validate`, {});
      }

      // 2. Lancer l'audit
      const response = await post(`/api/expert/dossier/${dossierId}/launch-audit`, {});

      if (response.success) {
        toast.success('✅ Dossier validé - Audit lancé !');
        await loadDocuments();
      } else {
        toast.error('Erreur lors du lancement de l\'audit');
      }
    } catch (error) {
      console.error('Erreur validation dossier:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Demander documents complémentaires (avec ou sans invalides)
  const handleRequestDocuments = async () => {
    console.log('📋 handleRequestDocuments appelé', { hasInvalid, validations });
    
    if (hasInvalid) {
      // Cas avec documents invalides : pré-remplir le modal
      const invalidDocs = Object.entries(validations)
        .filter(([_, v]) => v.status === 'invalid')
        .map(([docId, v]) => {
          const doc = documents.find(d => d.id === docId);
          return {
            name: doc?.filename || 'Document',
            reason: v.rejectionReason || ''
          };
        });

      console.log('📋 Documents invalides préparés:', invalidDocs);

      // Valider d'abord les documents valides en arrière-plan
      const validDocIds = Object.entries(validations)
        .filter(([_, v]) => v.status === 'valid')
        .map(([docId]) => docId);

      for (const docId of validDocIds) {
        await put(`/api/expert/document/${docId}/validate`, {});
      }

      // Rejeter les invalides
      for (const [docId, validation] of Object.entries(validations)) {
        if (validation.status === 'invalid' && validation.rejectionReason) {
          await put(`/api/expert/document/${docId}/reject`, {
            reason: validation.rejectionReason
          });
        }
      }

      // Appeler le callback avec les documents invalides
      console.log('📋 Appel onRequestDocumentsWithInvalid');
      if (onRequestDocumentsWithInvalid) {
        onRequestDocumentsWithInvalid(invalidDocs);
        // Marquer qu'une demande va être créée
        setHasActiveDocumentRequest(true);
      } else {
        console.warn('⚠️ onRequestDocumentsWithInvalid non défini');
      }
    } else {
      // Cas sans invalides : modal vide
      console.log('📋 Appel onRequestDocuments (sans invalides)');
      if (onRequestDocuments) {
        onRequestDocuments();
        // Marquer qu'une demande va être créée
        setHasActiveDocumentRequest(true);
      } else {
        console.warn('⚠️ onRequestDocuments non défini');
      }
    }
  };

  // Télécharger un document
  const handleDownload = async (doc: Document) => {
    try {
      toast.info('Téléchargement en cours...');

      // Récupérer le token d'authentification (essayer plusieurs clés)
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      console.log('🔐 Téléchargement - Tokens disponibles:', {
        token: !!localStorage.getItem('token'),
        supabase_token: !!localStorage.getItem('supabase_token'),
        tokenToUse: !!token
      });
      
      if (!token) {
        console.error('❌ Aucun token trouvé dans localStorage');
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      console.log('📥 Téléchargement document:', {
        id: doc.id,
        filename: doc.filename,
        bucket: doc.bucket_name,
        path: doc.storage_path
      });

      // Récupérer le document via une requête authentifiée
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/expert/document/${doc.id}/view`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer une URL temporaire pour le blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer un lien invisible pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL après le téléchargement
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Erreur téléchargement document:', error);
      toast.error('Erreur lors du téléchargement du document');
    }
  };

  // Visualiser un document
  const handleView = async (doc: Document) => {
    try {
      toast.info('Ouverture du document...');

      // Récupérer le token d'authentification (essayer plusieurs clés)
      const token = localStorage.getItem('token') || localStorage.getItem('supabase_token');
      
      console.log('🔐 Visualisation - Tokens disponibles:', {
        token: !!localStorage.getItem('token'),
        supabase_token: !!localStorage.getItem('supabase_token'),
        tokenToUse: !!token
      });
      
      if (!token) {
        console.error('❌ Aucun token trouvé dans localStorage');
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      console.log('👁️ Visualisation document:', {
        id: doc.id,
        filename: doc.filename,
        bucket: doc.bucket_name,
        path: doc.storage_path
      });

      // Récupérer le document via une requête authentifiée
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/expert/document/${doc.id}/view`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer une URL temporaire pour le blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        toast.error('Popup bloquée - Veuillez autoriser les popups');
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Nettoyer l'URL après 1 minute
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
      
      toast.success('Document ouvert dans un nouvel onglet');
    } catch (error) {
      console.error('Erreur visualisation document:', error);
      toast.error('Erreur lors de l\'ouverture du document');
    }
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
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Documents du Dossier
          </h3>
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
        <>
          <div className="space-y-3">
            {documents.map((doc) => {
              const validation = validations[doc.id];
              const isPending = doc.validation_status === 'pending';
              
              return (
                <div
                  key={doc.id}
                  className={`bg-white p-4 rounded-lg border-2 transition-all ${
                    doc.validation_status === 'validated' ? 'border-green-200 bg-green-50' :
                    doc.validation_status === 'rejected' ? 'border-red-200 bg-red-50' :
                    validation?.status === 'valid' ? 'border-green-300' :
                    validation?.status === 'invalid' ? 'border-red-300' :
                    'border-gray-200'
                  }`}
                >
                  {/* En-tête document */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
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
                            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          {doc.workflow_step && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">{doc.workflow_step}</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Boutons visualiser et télécharger */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc)}
                        title="Visualiser le document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        title="Télécharger le document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Zone de validation */}
                  <div className="ml-8 space-y-3">
                    {/* Documents déjà validés/rejetés */}
                    {doc.validation_status === 'validated' && (
                      <div className="inline-flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">✅ Document validé</span>
                        {doc.validated_at && (
                          <span className="text-xs">
                            • {formatDistanceToNow(new Date(doc.validated_at), { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>
                    )}

                    {doc.validation_status === 'rejected' && (
                      <div className="bg-red-100 px-3 py-2 rounded">
                        <div className="flex items-center gap-2 text-red-700 mb-1">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">❌ Document rejeté</span>
                        </div>
                        {doc.rejection_reason && (
                          <p className="text-sm text-red-600">
                            Raison : {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Documents en attente - Radio buttons */}
                    {isPending && validation && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`validation-${doc.id}`}
                              checked={validation.status === 'valid'}
                              onChange={() => handleToggleValidation(doc.id, 'valid')}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-green-700">✅ Document valide</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`validation-${doc.id}`}
                              checked={validation.status === 'invalid'}
                              onChange={() => handleToggleValidation(doc.id, 'invalid')}
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-red-700">❌ Document invalide</span>
                          </label>
                        </div>

                        {/* Champ raison si invalide */}
                        {validation.status === 'invalid' && (
                          <div className="mt-2 bg-red-50 p-3 rounded-lg border border-red-200">
                            <label className="block text-sm font-medium text-red-900 mb-2">
                              Raison du rejet *
                            </label>
                            <textarea
                              className="w-full border border-red-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder="Ex: Document illisible, date expirée, informations manquantes..."
                              value={validation.rejectionReason || ''}
                              onChange={(e) => handleRejectionReasonChange(doc.id, e.target.value)}
                              rows={2}
                            />
                            {(!validation.rejectionReason || validation.rejectionReason.trim().length === 0) && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ La raison est obligatoire pour les documents invalides
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Résumé et boutons d'action globaux */}
          {allValidated && !hasActiveDocumentRequest && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Résumé de validation</h4>
                <div className="flex items-center gap-4 text-sm">
                  {validationStats.valid > 0 && (
                    <span className="text-green-700">✅ {validationStats.valid} valide{validationStats.valid > 1 ? 's' : ''}</span>
                  )}
                  {validationStats.invalid > 0 && (
                    <span className="text-red-700">❌ {validationStats.invalid} invalide{validationStats.invalid > 1 ? 's' : ''}</span>
                  )}
                  {validationStats.pending > 0 && (
                    <span className="text-yellow-700">⏳ {validationStats.pending} en attente</span>
                  )}
                </div>

                {/* Liste des documents invalides pour visibilité */}
                {hasInvalid && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-2">Documents invalides :</p>
                    <ul className="space-y-1">
                      {Object.entries(validations)
                        .filter(([_, v]) => v.status === 'invalid')
                        .map(([docId, v]) => {
                          const doc = documents.find(d => d.id === docId);
                          return (
                            <li key={docId} className="text-sm text-red-700">
                              • {doc?.filename} - {v.rejectionReason || 'Raison non spécifiée'}
                            </li>
                          );
                        })
                      }
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {/* Bouton "Valider dossier" uniquement si tous valides */}
                {allValid && (
                  <Button
                    onClick={handleValidateDossier}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Valider le dossier - Lancer l'audit
                      </>
                    )}
                  </Button>
                )}

                {/* Bouton "Demander documents" - toujours disponible */}
                <Button
                  onClick={handleRequestDocuments}
                  disabled={isProcessing || (hasInvalid && Object.values(validations).some(v => v.status === 'invalid' && !v.rejectionReason?.trim()))}
                  className={`${allValid ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Demander documents complémentaires
                  {hasInvalid && ` (${validationStats.invalid} invalide${validationStats.invalid > 1 ? 's' : ''})`}
                </Button>
              </div>

              {hasInvalid && Object.values(validations).some(v => v.status === 'invalid' && !v.rejectionReason?.trim()) && (
                <p className="text-xs text-red-600 mt-3 text-center">
                  ⚠️ Veuillez fournir une raison pour tous les documents invalides
                </p>
              )}
            </div>
          )}

          {/* Message en attente documents complémentaires */}
          {hasActiveDocumentRequest && (
            <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">En attente des documents complémentaires</h4>
              </div>
              <p className="text-sm text-yellow-800">
                Vous avez demandé des documents complémentaires au client. 
                Vous serez notifié lorsque le client aura uploadé les documents.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

