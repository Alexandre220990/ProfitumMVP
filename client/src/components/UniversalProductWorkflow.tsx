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
  ArrowRight,
  Clock
} from 'lucide-react';

import ProductUploadInline from './ProductUploadInline';
import ExpertSelectionModal from './ExpertSelectionModal';
import EligibilityValidationStatus from './EligibilityValidationStatus';
import ClientDocumentUploadComplementary from './client/ClientDocumentUploadComplementary';
import ClientStep3DocumentCollection from './client/ClientStep3DocumentCollection';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import { useDossierNotifications } from '@/hooks/useDossierNotifications';
import { get } from '@/lib/api';
import { getProductConfig} from '@/config/productWorkflowConfigs';
import { config } from '@/config/env';

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
  completed_projects?: number;
}

interface ClientProduit {
  id: string;
  statut: string;
  current_step: number;
  progress: number;
  metadata?: any;
  expert_id?: string;
  expert_pending_id?: string; // ✅ Expert en attente d'acceptation
  
  // ✅ NOUVEAUX CHAMPS - Validations séparées
  admin_eligibility_status?: 'pending' | 'validated' | 'rejected';
  admin_validated_by?: string;
  eligibility_validated_at?: string;
  validation_admin_notes?: string;
  expert_validation_status?: 'pending' | 'validated' | 'rejected' | 'documents_requested';
  expert_validated_at?: string;
  
  Client?: {
    company_name?: string;
    email?: string;
  };
  ProduitEligible?: {
    id?: string;
    nom?: string;
    description?: string;
  };
  Expert?: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
    specialites?: string[];
    experience_years?: number;
    rating?: number;
    completed_projects?: number;
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
  const [tempSelectedExpert, setTempSelectedExpert] = useState<Expert | null>(null); // ✅ Expert temporaire avant validation
  const [expertConfirmed, setExpertConfirmed] = useState(false); // ✅ Expert confirmé définitivement
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [clientProduit, setClientProduit] = useState<ClientProduit | null>(null);
  const [eligibilityValidated, setEligibilityValidated] = useState(false);
  const [calculatedSteps, setCalculatedSteps] = useState<any[]>([]);
  const [documentRequest, setDocumentRequest] = useState<any>(null); // ✅ Demande de documents complémentaires

  // Hook pour les étapes du dossier
  const {
    steps,
    loading: stepsLoading,
    generateSteps,
    overallProgress
  } = useDossierSteps(clientProduitId);

  // Hook pour les notifications en temps réel
  const { getDossierNotifications } = useDossierNotifications();

  // Définir les étapes du workflow depuis la config
  const workflowSteps = productConfig.workflowSteps;

  // Charger la demande de documents complémentaires
  const loadDocumentRequest = useCallback(async () => {
    try {
      const response = await get(`/api/client/dossier/${clientProduitId}/document-request`);
      
      if (response.success && response.data) {
        setDocumentRequest(response.data);
        console.log('📄 Demande de documents chargée:', response.data);
      }
    } catch (error) {
      console.error('⚠️ Erreur chargement demande documents (non bloquant):', error);
    }
  }, [clientProduitId]);

  // Charger le clientProduit pour avoir le statut de validation
  const loadClientProduit = useCallback(async () => {
    try {
      const response = await get(`/api/client/produits-eligibles/${clientProduitId}`);
      
      if (response.success && response.data) {
        const produitData = response.data as ClientProduit;
        
        // 🔍 DIAGNOSTIC : Afficher le statut exact
        console.log('🔍 DIAGNOSTIC loadClientProduit:', {
          dossier_id: clientProduitId,
          statut: produitData.statut,
          statut_exact: `"${produitData.statut}"`,
          current_step_bdd: produitData.current_step,
          progress_bdd: produitData.progress,
          expert_id: produitData.expert_id
        });
        
        setClientProduit(produitData);
        
        // Mettre à jour eligibilityValidated basé sur le statut
        if (produitData.statut === 'eligibility_validated') {
          console.log('✅ DIAGNOSTIC: Éligibilité validée détectée → Déblocage étape 2');
          setEligibilityValidated(true);
          setCurrentStep(2); // Déverrouiller étape 2
        } else if (produitData.statut === 'eligibility_rejected') {
          // ❌ Documents de pré-éligibilité rejetés par l'ADMIN → RESTER ÉTAPE 1
          console.log('❌ DIAGNOSTIC: Éligibilité rejetée par admin → RESTER ÉTAPE 1');
          setEligibilityValidated(false);
          setCurrentStep(1); // Forcer le retour à l'étape 1
        } else if (produitData.statut === 'documents_manquants') {
          // 📄 Documents complémentaires rejetés par l'EXPERT → RESTER ÉTAPE 3
          console.log('📄 DIAGNOSTIC: Documents manquants détectés par expert → RESTER ÉTAPE 3');
          setEligibilityValidated(true); // L'éligibilité est validée si on est à l'étape 3
          setCurrentStep(3); // Forcer l'étape 3
        } else if (produitData.statut === 'eligible' || produitData.statut === 'opportunité') {
          // État initial : permettre l'upload des documents
          console.log('📝 DIAGNOSTIC: Statut initial → Étape 1');
          setEligibilityValidated(false);
          setCurrentStep(1);
        } else {
          // Autres statuts (documents_uploaded, etc.)
          console.log('⏳ DIAGNOSTIC: Autre statut → Pas de changement étape');
        }

        // Si un expert est déjà assigné ou en attente d'acceptation, le définir
        if ((produitData.expert_id || produitData.expert_pending_id) && produitData.Expert) {
          console.log('👨‍💼 DIAGNOSTIC: Expert déjà assigné:', produitData.Expert.name);
          setSelectedExpert({
            ...produitData.Expert,
            specialites: produitData.Expert.specialites || [],
            experience_years: produitData.Expert.experience_years || 0,
            rating: produitData.Expert.rating || 0
          });
          // ✅ Marquer comme confirmé si expert assigné
          setExpertConfirmed(true);
          setTempSelectedExpert(null); // Pas d'expert temporaire
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement ClientProduit:', error);
    }
  }, [clientProduitId]);

  useEffect(() => {
    console.log('🚀 DIAGNOSTIC: Montage composant UniversalProductWorkflow:', {
      clientProduitId,
      productKey
    });
    if (clientProduitId) {
      loadClientProduit();
      loadDocumentRequest(); // ✅ Charger la demande de documents
    }
  }, [clientProduitId, loadClientProduit, loadDocumentRequest, productKey]);

  // Écouter les notifications pour ce dossier et recharger automatiquement
  useEffect(() => {
    const dossierNotifs = getDossierNotifications(clientProduitId);
    
    // Si une nouvelle notification arrive (< 10 secondes), recharger le dossier
    if (dossierNotifs.latestNotification) {
      const notifDate = new Date(dossierNotifs.latestNotification.created_at);
      const now = new Date();
      const secondsDiff = (now.getTime() - notifDate.getTime()) / 1000;
      
      if (secondsDiff < 10) {
        console.log('🔔 Nouvelle notification détectée - Rechargement du dossier...');
        loadClientProduit();
      }
    }
  }, [getDossierNotifications, clientProduitId, loadClientProduit]);

  // Initialiser les étapes au chargement
  useEffect(() => {
    if (clientProduitId && !stepsLoading && steps.length === 0) {
      generateSteps(clientProduitId);
    }
  }, [clientProduitId, stepsLoading, steps.length, generateSteps]);

  // Mettre à jour le statut des étapes basé sur les données
  useEffect(() => {
    console.log('🔄 DIAGNOSTIC: Déclenchement updateWorkflowSteps:', {
      steps_length: steps.length,
      eligibilityValidated,
      currentStep,
      selectedExpert: selectedExpert?.name
    });
    if (steps.length > 0) {
      updateWorkflowSteps();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, documents, selectedExpert, eligibilityValidated]);

  // S'assurer que l'étape 1 est toujours accessible au début
  // ⚠️ FIX : Ne forcer le retour à l'étape 1 QUE si on est au-delà de l'étape 2 sans validation
  useEffect(() => {
    if (!eligibilityValidated && currentStep > 2) {
      console.log('⚠️ DIAGNOSTIC: Force retour étape 1 car pas validé et étape > 2');
      setCurrentStep(1);
    }
  }, [eligibilityValidated, currentStep]);

  const updateWorkflowSteps = useCallback(() => {
    console.log('🔧 DIAGNOSTIC updateWorkflowSteps:', {
      eligibilityValidated,
      selectedExpert: selectedExpert?.name,
      currentStep,
      documents_count: documents.length
    });
    
    const updatedSteps = workflowSteps.map(step => {
      let status = 'pending';
      
      switch (step.id) {
        case 1: // Confirmer l'éligibilité
          // ✅ FIX : Marquer comme complété si on est au-delà de l'étape 1
          if (currentStep > 1 || eligibilityValidated) {
            status = 'completed';
          } else if (documents.length >= 1) {
            status = 'in_progress';
          } else {
            status = 'in_progress'; // Toujours in_progress par défaut pour permettre l'upload
          }
          break;
        case 2: // Sélection de l'expert
          // ✅ FIX : Marquer comme complété si on est au-delà de l'étape 2
          if (currentStep > 2) {
            status = 'completed';
          } else if (eligibilityValidated) {
            status = selectedExpert ? 'completed' : 'in_progress';
            console.log(`📊 DIAGNOSTIC Étape 2: eligibilityValidated=${eligibilityValidated}, status=${status}`);
          } else {
            console.log(`📊 DIAGNOSTIC Étape 2: eligibilityValidated=${eligibilityValidated}, RESTE PENDING`);
          }
          break;
        case 3: // Collecte des documents
          if (clientProduit?.statut === 'documents_manquants' || 
              clientProduit?.metadata?.documents_missing) {
            status = 'in_progress'; // Documents manquants - Étape en cours
          } else if (selectedExpert || currentStep >= 3) {
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
    
    // ✅ FIX MAJEUR: STOCKER les steps calculés dans l'état
    setCalculatedSteps(updatedSteps);
    
    console.log('🔧 DIAGNOSTIC: workflowSteps mis à jour avec status:', {
      currentStep,
      steps: updatedSteps.map(s => ({ id: s.id, name: s.name, status: s.status }))
    });
  }, [steps, documents, selectedExpert, eligibilityValidated, workflowSteps, clientProduit]);

  const handleDocumentsComplete = useCallback((uploadedDocuments: DocumentFile[]) => {
    setDocuments(uploadedDocuments);
    toast.success("Documents complets ! Tous les documents requis ont été uploadés");
  }, []);

  const handleExpertSelected = useCallback((expert: Expert) => {
    // ✅ NOUVEAU: Sélection temporaire, pas encore confirmée
    setTempSelectedExpert(expert);
    setShowExpertModal(false);
    toast.success(`Expert sélectionné : ${expert.name}. Validez définitivement votre choix pour continuer.`);
  }, []);

  // ✅ NOUVEAU: Confirmer définitivement la sélection d'expert
  const handleConfirmExpert = useCallback(async () => {
    if (!tempSelectedExpert) return;

    try {
      // Appeler l'API backend pour assigner l'expert
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/dossier-steps/expert/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossier_id: clientProduitId,
          expert_id: tempSelectedExpert.id
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la confirmation de l\'expert');
      }

      // Marquer comme confirmé
      setSelectedExpert(tempSelectedExpert);
      setExpertConfirmed(true);
      setTempSelectedExpert(null);
      
      toast.success(`Expert confirmé ! ${tempSelectedExpert.name} a été notifié et va étudier votre dossier.`);
      
      // Recharger les données
      setTimeout(() => {
        loadClientProduit();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur confirmation expert:', error);
      toast.error('Impossible de confirmer l\'expert. Veuillez réessayer.');
    }
  }, [tempSelectedExpert, clientProduitId, loadClientProduit]);

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
    const steps = calculatedSteps.length > 0 ? calculatedSteps : workflowSteps;
    const currentWorkflowStep = steps.find(step => step.id === currentStep);
    
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
        // Étape 3 : Documents complémentaires (si demandés par expert)
        if (currentStep === 3 && documentRequest && documentRequest.status !== 'completed') {
          const requiredDocs = (documentRequest.requested_documents || []).map((doc: any) => ({
            id: doc.id,
            description: doc.name,
            required: doc.mandatory !== false,
            uploaded: doc.uploaded || false,
            uploaded_at: doc.uploaded_at || null,
            document_id: doc.document_id || null
          }));
          
          const expertMessage = documentRequest.notes || '';
          
          return (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  📋 Documents complémentaires requis
                </h3>
                <p className="text-gray-600">
                  Votre expert {documentRequest.Expert?.name || 'Expert'} a besoin de documents supplémentaires pour finaliser l'analyse
                </p>
              </div>

              <ClientDocumentUploadComplementary
                dossierId={clientProduitId}
                requiredDocuments={requiredDocs}
                expertMessage={expertMessage}
                onComplete={() => {
                  toast.success('Documents validés ! Votre expert va maintenant procéder à l\'audit.');
                  // Recharger les données
                  loadClientProduit();
                  loadDocumentRequest();
                }}
              />
            </div>
          );
        }

        // Étape 3 : Collecte des documents (avec nouveau design complet)
        if (currentStep === 3) {
          return (
            <ClientStep3DocumentCollection
              dossierId={clientProduitId}
              onComplete={() => {
                toast.success('✅ Étape 3 validée avec succès !');
                // Recharger les données du dossier
                loadClientProduit();
                // Passer à l'étape suivante si applicable
                setCurrentStep(4);
              }}
            />
          );
        }

        // Par défaut : étape gérée par l'expert
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
        {(calculatedSteps.length > 0 ? calculatedSteps : workflowSteps).map((step: any) => (
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

              {/* Contenu intégré pour l'étape 1 - SEULEMENT si on est à l'étape 1 */}
              {step.id === 1 && currentStep === 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Afficher le statut de validation UNIQUEMENT si validé ou rejeté (pas en attente) */}
                  {clientProduit && (clientProduit.statut === 'eligibility_validated' || 
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

              {/* Contenu intégré pour l'étape 2 - Sélection expert - SEULEMENT si on est à l'étape 2 */}
              {step.id === 2 && currentStep === 2 && eligibilityValidated && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {tempSelectedExpert && !expertConfirmed ? (
                    /* Expert sélectionné temporairement - Demander confirmation */
                    <>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{tempSelectedExpert.name}</h4>
                                {tempSelectedExpert.company_name && (
                                  <p className="text-xs text-gray-600">{tempSelectedExpert.company_name}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {tempSelectedExpert.specialites && tempSelectedExpert.specialites.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {tempSelectedExpert.specialites[0]}
                                    </Badge>
                                  )}
                                  {tempSelectedExpert.experience_years && (
                                    <span className="text-xs text-gray-600">
                                      {tempSelectedExpert.experience_years} ans d'expérience
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTempSelectedExpert(null);
                                setShowExpertModal(true);
                              }}
                            >
                              Changer
                            </Button>
                          </div>
                          
                          {/* Bouton de validation définitive */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-blue-200">
                            <p className="text-sm text-blue-800 font-medium">
                              ⚠️ Confirmez votre choix d'expert
                            </p>
                            <p className="text-xs text-blue-700 mb-2">
                              Une fois validé, l'expert sera notifié et vous ne pourrez plus modifier votre choix.
                            </p>
                            <Button
                              onClick={handleConfirmExpert}
                              className="bg-blue-600 hover:bg-blue-700 w-full"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Valider définitivement
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : selectedExpert && expertConfirmed ? (
                    /* Expert confirmé définitivement - Afficher card + Message d'attente */
                    <>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{selectedExpert.name}</h4>
                                {selectedExpert.company_name && (
                                  <p className="text-xs text-gray-600">{selectedExpert.company_name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                ✓ Confirmé
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Message d'attente acceptation expert */}
                      <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-amber-900 mb-1">
                                🕐 En attente d'acceptation
                              </h4>
                              <p className="text-sm text-amber-800 mb-2">
                                Votre expert étudie votre dossier.
                              </p>
                              <p className="text-xs text-amber-700">
                                ⏱️ Délai de traitement : jusqu'à 48h. Vous serez notifié dès que l'expert aura accepté votre demande.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    /* Pas d'expert - Bouton de sélection */
                    <div className="text-center p-6">
                      <Button
                        onClick={() => setShowExpertModal(true)}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Sélectionner un expert
                      </Button>
                      <p className="text-sm text-gray-600 mt-3">
                        Choisissez l'expert qui vous accompagnera dans votre démarche {productConfig.productName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contenu intégré pour l'étape 3 - Collecte des documents - SEULEMENT si on est à l'étape 3 */}
              {step.id === 3 && currentStep === 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <ClientStep3DocumentCollection
                    dossierId={clientProduitId}
                    onComplete={() => {
                      toast.success('✅ Étape 3 validée avec succès !');
                      // Recharger les données du dossier
                      loadClientProduit();
                      // Passer à l'étape suivante si applicable
                      setCurrentStep(4);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu de l'étape courante - seulement pour les étapes 4+ (1, 2 et 3 sont intégrées) */}
      {currentStep >= 4 && (
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
        produitEligible={clientProduit?.ProduitEligible ? {
          id: clientProduit.ProduitEligible.id || clientProduitId,
          nom: clientProduit.ProduitEligible.nom || 'Produit',
          description: clientProduit.ProduitEligible.description
        } : undefined}
      />
    </div>
  );
}

