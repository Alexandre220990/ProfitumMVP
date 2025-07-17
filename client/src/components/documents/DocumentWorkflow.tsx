import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle, Upload, Share2, Eye, FileText, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentWorkflow } from "@/hooks/use-document-workflow";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { DocumentValidationModal } from "./DocumentValidationModal";
import { DocumentShareModal } from "./DocumentShareModal";

// Types pour le workflow
export enum DocumentWorkflowStatus { 
  UPLOADED = 'uploaded', 
  PROFITUM_REVIEW = 'profitum_review', 
  ELIGIBILITY_CONFIRMED = 'eligibility_confirmed', 
  EXPERT_ASSIGNED = 'expert_assigned', 
  EXPERT_REVIEW = 'expert_review', 
  FINAL_REPORT = 'final_report', 
  COMPLETED = 'completed', 
  REJECTED = 'rejected' 
}



export enum DocumentCategory { 
  CHARTE_PROFITUM = 'charte_profitum', 
  CHARTE_PRODUIT = 'charte_produit', 
  FACTURE = 'facture', 
  DOCUMENT_ADMINISTRATIF = 'document_administratif', 
  DOCUMENT_ELIGIBILITE = 'document_eligibilite', 
  RAPPORT_AUDIT = 'rapport_audit', 
  RAPPORT_SIMULATION = 'rapport_simulation', 
  DOCUMENT_COMPTABLE = 'document_comptable', 
  DOCUMENT_FISCAL = 'document_fiscal', 
  DOCUMENT_LEGAL = 'document_legal', 
  AUTRE = 'autre' 
}

interface WorkflowStep { 
  id: string;
  workflow: DocumentWorkflowStatus;
  assigned_to: string;
  assigned_to_id?: string;
  required: boolean;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
  comments?: string 
}

interface DocumentRequest { 
  id: string;
  category: DocumentCategory;
  description: string;
  status: string;
  workflow: DocumentWorkflowStatus;
  deadline?: string;
  created_at: string;
  WorkflowStep: WorkflowStep[];
  DocumentFile: any[] 
}

interface DocumentWorkflowProps { 
  clientId?: string;
  showPendingOnly?: boolean; 
}

export const DocumentWorkflowComponent: React.FC<DocumentWorkflowProps> = ({ 
  clientId, 
  showPendingOnly = false 
}) => { 
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadData, setUploadData] = useState<any>(null);

  const { pendingDocuments, stats, loading, error, uploadDocumentWithWorkflow, validateDocument, shareDocument, refreshData } = useDocumentWorkflow();

  // Charger les données selon le contexte
  useEffect(() => { 
    if (clientId) {
      // Charger le workflow d'un client spécifique
      refreshData({ clientId });
    } else if (showPendingOnly) { 
      // Charger les documents en attente de l'utilisateur
      refreshData({ pendingOnly: true });
    }
  }, [clientId, showPendingOnly, refreshData]);

  // Obtenir les données à afficher
  const displayData = pendingDocuments;

  // Fonction pour obtenir l'icône de catégorie
  const getCategoryIcon = (category: DocumentCategory) => { 
    switch (category) {
      case DocumentCategory.CHARTE_PROFITUM: 
      case DocumentCategory.CHARTE_PRODUIT:
        return <FileText className="w-4 h-4" />;
      case DocumentCategory.FACTURE:
        return <FileText className="w-4 h-4 text-green-600" />;
      case DocumentCategory.RAPPORT_AUDIT:
      case DocumentCategory.RAPPORT_SIMULATION:
        return <FileText className="w-4 h-4 text-blue-600" />;
      case DocumentCategory.DOCUMENT_ELIGIBILITE:
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4" />; 
    }
  };

  // Fonction pour obtenir le statut visuel
  const getStatusBadge = (status: string) => { 
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />En cours</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default: 
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>; 
    }
  };

  // Fonction pour calculer le progrès
  const calculateProgress = (steps: WorkflowStep[]) => { 
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter(step => step.completed).length;
    return Math.round((completed / steps.length) * 100); 
  };

  // Fonction pour obtenir les actions disponibles
  const getAvailableActions = (request: DocumentRequest) => { 
    const actions = [];
    const userType = user?.type;
    const currentStep = request.WorkflowStep?.find(step => !step.completed);

    if (userType === 'client' && currentStep?.assigned_to === 'client') {
      actions.push(
        <Button
          key="upload"
          size="sm"
          onClick={() => {
            setUploadData({ requestId: request.id, category: request.category });
            setShowUploadModal(true);
          }}
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload
        </Button>
      );
    }

    if (userType === 'expert' && currentStep?.assigned_to === 'expert') { 
      actions.push(
        <Button
          key="validate"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedRequest(request);
            setShowValidationModal(true);
          }}
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Valider
        </Button>
      );
    }

    if (userType === 'admin' && currentStep?.assigned_to === 'profitum') { 
      actions.push(
        <Button
          key="review"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedRequest(request);
            setShowValidationModal(true);
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Analyser
        </Button>
      );
    }

    // Actions communes
    if (request.DocumentFile?.length > 0) { 
      actions.push(
        <Button
          key="view"
          size="sm"
          variant="ghost"
          onClick={() => {
            // Ouvrir le document
            const file = request.DocumentFile[0];
            window.open(`/api/documents/download/${file.id}`, '_blank');
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Voir
        </Button>,
        <Button
          key="share"
          size="sm"
          variant="ghost"
          onClick={() => {
            setSelectedRequest(request);
            setShowShareModal(true);
          }}
        >
          <Share2 className="w-4 h-4 mr-1" />
          Partager
        </Button>
      );
    }

    return actions;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => { 
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) { 
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement du workflow...</span>
      </div>
    ); 
  }

  if (error) { 
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Erreur lors du chargement : {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Statistiques du Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.byStatus?.completed || 0}</div>
                <div className="text-sm text-gray-600">Terminés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.byStatus?.pending || 0}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdue || 0}</div>
                <div className="text-sm text-gray-600">En retard</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des demandes de documents */}
      <div className="space-y-4">
        {displayData?.map((request: DocumentRequest) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getCategoryIcon(request.category)}
                    <div>
                      <h3 className="font-semibold text-lg">{request.description}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(request.status)}
                        <Badge variant="outline" className="text-xs">
                          {request.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progrès du workflow */}
                  {request.WorkflowStep && request.WorkflowStep.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progrès du workflow</span>
                        <span>{calculateProgress(request.WorkflowStep)}%</span>
                      </div>
                      <Progress value={calculateProgress(request.WorkflowStep)} className="h-2" />
                    </div>
                  )}

                  {/* Étapes du workflow */}
                  <div className="space-y-2">
                    {request.WorkflowStep?.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center space-x-2 text-sm ${
                          step.completed ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>
                          Étape {index + 1}: {step.workflow.replace('_', ' ')} 
                          {step.assigned_to && ` (${step.assigned_to})`}
                        </span>
                        {step.deadline && (
                          <span className="text-xs text-gray-500">
                            - Échéance: {formatDate(step.deadline)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="mt-3 text-sm text-gray-500">
                    <span>Créé le {formatDate(request.created_at)}</span>
                    {request.deadline && (
                      <span className="ml-4">
                        Échéance: {formatDate(request.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {getAvailableActions(request)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucune donnée */}
      {(!displayData || displayData.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun document en workflow
            </h3>
            <p className="text-gray-600">
              {showPendingOnly 
                ? 'Vous n\'avez aucun document en attente.'
                : 'Aucun workflow de document trouvé pour ce client.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showUploadModal && (
        <DocumentUploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          category={uploadData?.category}
          requestId={uploadData?.requestId}
          onUpload={async (data) => {
            if (uploadData) {
              await uploadDocumentWithWorkflow(
                data.file, 
                uploadData.requestId, 
                data.category as DocumentCategory, 
                data.description, 
                DocumentWorkflowStatus.UPLOADED as any
              );
              setShowUploadModal(false);
              refreshData();
            }
          }}
        />
      )}

      {showValidationModal && selectedRequest && (
        <DocumentValidationModal
          open={showValidationModal}
          onOpenChange={setShowValidationModal}
          document={selectedRequest.DocumentFile?.[0]}
          onValidate={async (data) => {
            if (selectedRequest.DocumentFile?.[0]) {
              await validateDocument(
                selectedRequest.DocumentFile[0].id, 
                data.status, 
                data.comment
              );
              setShowValidationModal(false);
              refreshData();
            }
          }}
        />
      )}

      {showShareModal && selectedRequest && (
        <DocumentShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          document={selectedRequest.DocumentFile?.[0]}
          onShare={async (data) => {
            if (selectedRequest.DocumentFile?.[0]) {
              await shareDocument(
                selectedRequest.DocumentFile[0].id, 
                data.email, 
                data.view ? 'view' : 'download', 
                data.expiresAt ? (typeof data.expiresAt === 'string' ? data.expiresAt : data.expiresAt.toISOString()) : undefined
              );
              setShowShareModal(false);
              refreshData();
            }
          }}
        />
      )}
    </div>
  );
};

export default DocumentWorkflowComponent; 