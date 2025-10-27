import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Users, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';

import ProductUploadInline from './ProductUploadInline';
import ExpertSelectionModal from './ExpertSelectionModal';
import EligibilityValidationStatus from './EligibilityValidationStatus';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import { get } from '@/lib/api';
import { getProductConfig } from '@/config/productWorkflowConfigs';

interface UniversalProductWorkflowProps {
  clientProduitId: string;
  productKey: string; // 'ticpe', 'urssaf', 'msa', 'dfs', 'foncier', 'energie'
  companyName?: string;
  estimatedAmount?: number;
  onWorkflowComplete?: () => void; // Callback appelé quand le workflow est complété
  className?: string;
}

interface DocumentFile {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  specialites: string[];
  experience_years: number;
  rating: number;
  completed_projects: number;
}

interface ClientProduit {
  id: string;
  statut: string;
  current_step: number;
  progress: number;
  metadata?: any;
  Client?: {
    company_name?: string;
    email?: string;
  };
  ProduitEligible?: {
    nom?: string;
  };
}

export default function UniversalProductWorkflow({
  clientProduitId,
  productKey,
  companyName,
  estimatedAmount,
  // onWorkflowComplete peut être utilisé plus tard pour des notifications
  className = ""
}: UniversalProductWorkflowProps) {
  
  // Récupérer la configuration du produit
  const productConfig = getProductConfig(productKey);

  if (!productConfig) {
    return (
      <div className="text-center text-red-600 p-4">
        ❌ Configuration du produit "{productKey}" introuvable
      </div>
    );
  }

  // États du workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [clientProduit, setClientProduit] = useState<ClientProduit | null>(null);
  const [eligibilityValidated, setEligibilityValidated] = useState(false);

  // Hook pour les étapes du dossier
  const {
    steps,
    loading: stepsLoading,
    generateSteps,
    overallProgress
  } = useDossierSteps(clientProduitId);

  // Définir les étapes du workflow depuis la config
  const workflowSteps = productConfig.workflowSteps;

  // Charger le clientProduit pour avoir le statut de validation
  useEffect(() => {
    const loadClientProduit = async () => {
      try {
        const response = await get(`/api/client/produits-eligibles/${clientProduitId}`);
        
        if (response.success && response.data) {
          const produitData = response.data as ClientProduit;
          setClientProduit(produitData);
          
          // Mettre à jour eligibilityValidated basé sur le statut
          if (produitData.statut === 'eligibility_validated') {
            setEligibilityValidated(true);
            setCurrentStep(2); // Déverrouiller étape 2
          } else if (produitData.statut === 'eligible' || produitData.statut === 'opportunité') {
            // État initial : permettre l'upload des documents
            setEligibilityValidated(false);
            setCurrentStep(1);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement ClientProduit:', error);
      }
    };

    if (clientProduitId) {
      loadClientProduit();
    }
  }, [clientProduitId]);

  // Initialiser les étapes au chargement
  useEffect(() => {
    if (clientProduitId && !stepsLoading && steps.length === 0) {
      generateSteps(clientProduitId);
    }
  }, [clientProduitId, stepsLoading, steps.length, generateSteps]);

  // Mettre à jour le statut des étapes basé sur les données
  useEffect(() => {
    if (steps.length > 0) {
      updateWorkflowSteps();
    }
  }, [steps, documents, selectedExpert, eligibilityValidated]);

  // S'assurer que l'étape 1 est toujours accessible au début
  useEffect(() => {
    if (!eligibilityValidated && currentStep !== 1) {
      setCurrentStep(1);
    }
  }, [eligibilityValidated, currentStep]);

  const updateWorkflowSteps = useCallback(() => {
    const updatedSteps = workflowSteps.map(step => {
      let status = 'pending';
      
      switch (step.id) {
        case 1: // Confirmer l'éligibilité
          if (eligibilityValidated) {
            status = 'completed';
          } else if (documents.length >= 1) {
            status = 'in_progress';
          } else {
            status = 'in_progress'; // Toujours in_progress par défaut pour permettre l'upload
          }
          break;
        case 2: // Sélection de l'expert
          if (eligibilityValidated) {
            status = selectedExpert ? 'completed' : 'in_progress';
          }
          break;
        case 3: // Collecte des documents
          if (selectedExpert) {
            status = 'in_progress';
          }
          break;
        case 4: // Audit technique
          if (steps.some(s => s.step_name === 'Audit technique' && s.status === 'completed')) {
            status = 'completed';
          } else if (steps.some(s => s.step_name === 'Audit technique' && s.status === 'in_progress')) {
            status = 'in_progress';
          }
          break;
        case 5: // Validation finale
          if (steps.some(s => s.step_name === 'Validation finale' && s.status === 'completed')) {
            status = 'completed';
          } else if (steps.some(s => s.step_name === 'Validation finale' && s.status === 'in_progress')) {
            status = 'in_progress';
          }
          break;
        case 6: // Demande de remboursement
          if (steps.some(s => s.step_name === 'Demande de remboursement' && s.status === 'completed')) {
            status = 'completed';
          } else if (steps.some(s => s.step_name === 'Demande de remboursement' && s.status === 'in_progress')) {
            status = 'in_progress';
          }
          break;
      }
      
      return { ...step, status };
    });
    
    // Mettre à jour l'étape courante
    const currentStepIndex = updatedSteps.findIndex((step: any) => step.status === 'in_progress');
    if (currentStepIndex !== -1) {
      setCurrentStep(currentStepIndex + 1);
    }
  }, [steps, documents, selectedExpert, eligibilityValidated, workflowSteps]);

  const handleDocumentsComplete = useCallback((uploadedDocuments: DocumentFile[]) => {
    setDocuments(uploadedDocuments);
    toast.success("Documents complets ! Tous les documents requis ont été uploadés");
  }, []);

  const handleExpertSelected = useCallback((expert: Expert) => {
    setSelectedExpert(expert);
    toast.success(`Expert sélectionné ! ${expert.name} vous accompagnera dans votre démarche`);
  }, []);

  const getStepIcon = (step: any) => {
    const Icon = step.icon;
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Icon className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Icon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'overdue':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const renderStepContent = () => {
    const currentWorkflowStep = workflowSteps.find(step => step.id === currentStep);
    
    if (!currentWorkflowStep) return null;

    switch (currentWorkflowStep.component) {
      case 'expert':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Sélectionner votre expert {productConfig.productName}
              </h3>
              <p className="text-gray-600">
                Choisissez l'expert qui vous accompagnera dans votre démarche
              </p>
            </div>
            
            {selectedExpert ? (
              <Card 
                className={`border-green-200 bg-green-50 transition-all duration-200 ${
                  currentStep < 4 ? 'cursor-pointer hover:bg-green-100 hover:shadow-md' : ''
                }`}
                onClick={() => {
                  // Permettre le changement d'expert seulement avant l'étape 4 (Audit technique)
                  if (currentStep < 4) {
                    setShowExpertModal(true);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{selectedExpert.name}</h4>
                        {selectedExpert.company_name && (
                          <p className="text-sm text-gray-600">{selectedExpert.company_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{selectedExpert.experience_years} ans d'expérience</span>
                          <span className="text-sm text-gray-600">•</span>
                          <span className="text-sm text-gray-600">{selectedExpert.completed_projects} projets</span>
                          {selectedExpert.specialites && (
                            <>
                              <span className="text-sm text-gray-600">•</span>
                              <span className="text-sm text-gray-600">{selectedExpert.specialites.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-800">Expert sélectionné</span>
                        {currentStep < 4 && (
                          <p className="text-xs text-gray-500 mt-1">Cliquez pour changer</p>
                        )}
                        {currentStep >= 4 && (
                          <p className="text-xs text-gray-500 mt-1">Verrouillé</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center">
                <Button
                  onClick={() => setShowExpertModal(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Sélectionner un expert
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {currentWorkflowStep.name}
            </h3>
            <p className="text-gray-600">{currentWorkflowStep.description}</p>
            <p className="text-sm text-gray-500 mt-4">
              Cette étape sera gérée par votre expert sélectionné.
            </p>
          </div>
        );
    }
  };

  if (stepsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec progression */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Workflow {productConfig.productName} - {companyName}
        </h3>
        <p className="text-sm text-gray-600 mb-1">
          Durée estimée : {productConfig.estimatedDuration}
        </p>
        {estimatedAmount && (
          <p className="text-sm text-gray-600 mb-4">
            Gain potentiel estimé : {estimatedAmount.toLocaleString()}€
          </p>
        )}
        
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression globale</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Étapes du workflow */}
      <div className="grid gap-4">
        {workflowSteps.map((step: any) => (
          <Card 
            key={step.id}
            className={`transition-all duration-200 ${getStepStatusColor(step.status)} ${
              step.id === currentStep ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStepIcon(step)}
                    <span className="text-sm font-medium text-gray-600">
                      {step.id}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800">{step.name}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'in_progress' ? 'secondary' :
                      step.status === 'overdue' ? 'destructive' :
                      'outline'
                    }
                    className={
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      step.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      ''
                    }
                  >
                    {step.status === 'completed' ? 'Terminé' :
                     step.status === 'in_progress' ? 'En cours' :
                     step.status === 'overdue' ? 'En retard' :
                     'En attente'}
                  </Badge>
                  
                  {step.id === currentStep && step.status === 'in_progress' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>

              {/* Contenu intégré pour l'étape 1 */}
              {step.id === 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Afficher le statut de validation si documents soumis */}
                  {clientProduit && (clientProduit.statut === 'documents_uploaded' || 
                                     clientProduit.statut === 'eligibility_validated' || 
                                     clientProduit.statut === 'eligibility_rejected') && (
                    <EligibilityValidationStatus
                      clientProduit={clientProduit}
                      onModifyDocuments={() => {
                        // Permettre de modifier les documents
                        console.log('📝 Modification des documents demandée');
                      }}
                    />
                  )}

                  {/* Formulaire d'upload des documents (masqué si éligibilité validée) */}
                  {clientProduit?.statut !== 'eligibility_validated' && (
                    <ProductUploadInline
                      clientProduitId={clientProduitId}
                      productKey={productKey}
                      clientProduit={clientProduit}
                      onDocumentsUploaded={handleDocumentsComplete}
                      onStepComplete={async () => {
                        // Recharger le clientProduit pour afficher le nouveau statut
                        const response = await get(`/api/client/produits-eligibles/${clientProduitId}`);
                        if (response.success && response.data) {
                          setClientProduit(response.data as ClientProduit);
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu de l'étape courante - seulement pour les étapes autres que l'étape 1 */}
      {currentStep !== 1 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              Étape {currentStep} : {workflowSteps.find(s => s.id === currentStep)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      )}

      {/* Modal de sélection d'expert */}
      <ExpertSelectionModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        dossierId={clientProduitId}
        onExpertSelected={handleExpertSelected}
      />
    </div>
  );
}

