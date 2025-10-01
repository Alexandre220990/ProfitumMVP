import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Shield, 
  DollarSign,
  Calculator,
  Check
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import ExpertSelectionModal from './ExpertSelectionModal';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import { config } from '@/config/env';

interface URSSAFWorkflowProps {
  clientProduitId: string;
  companyName?: string;
  estimatedAmount?: number;
  onWorkflowComplete?: () => void;
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

export default function URSSAFWorkflow({
  clientProduitId,
  companyName,
  className = ""
}: URSSAFWorkflowProps) {
  
  // États du workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [documents] = useState<DocumentFile[]>([]);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [isValidatingEligibility, setIsValidatingEligibility] = useState(false);

  // Hook pour les étapes du dossier
  const {
    generateSteps,
    updateStep,
    overallProgress
  } = useDossierSteps(clientProduitId);

  // Définir les étapes du workflow URSSAF
  const workflowSteps = [
    {
      id: 1,
      name: 'Confirmer l\'éligibilité',
      description: 'Upload des documents de paie et déclarations URSSAF',
      icon: Shield,
      status: 'pending',
      component: 'documents'
    },
    {
      id: 2,
      name: 'Sélection de l\'expert',
      description: 'Choisir l\'expert spécialisé URSSAF',
      icon: Users,
      status: 'pending',
      component: 'expert'
    },
    {
      id: 3,
      name: 'Collecte des documents',
      description: 'Upload des bulletins de paie et déclarations',
      icon: FileText,
      status: 'pending',
      component: 'documents'
    },
    {
      id: 4,
      name: 'Audit comptable',
      description: 'Vérification des déclarations et calculs',
      icon: Calculator,
      status: 'pending',
      component: 'audit'
    },
    {
      id: 5,
      name: 'Validation finale',
      description: 'Validation administrative et demande de remboursement',
      icon: CheckCircle,
      status: 'pending',
      component: 'validation'
    },
    {
      id: 6,
      name: 'Demande de remboursement',
      description: 'Soumission du dossier URSSAF',
      icon: DollarSign,
      status: 'pending',
      component: 'reimbursement'
    }
  ];

  // Charger les étapes au montage
  useEffect(() => {
    if (clientProduitId) {
      generateSteps(clientProduitId);
    }
  }, [clientProduitId, generateSteps]);

  // Vérifier les documents requis pour l'éligibilité URSSAF
  const hasRequiredDocuments = (): boolean => {
    const requiredDocs = ['bulletin_paie', 'declaration_urssaf', 'attestation_employeur'];
    const uploadedDocs = documents.map(doc => doc.document_type);
    
    return requiredDocs.every(docType => 
      uploadedDocs.includes(docType)
    );
  };

  // Valider l'éligibilité URSSAF
  const handleValidateEligibility = async () => {
    if (!hasRequiredDocuments()) {
      toast.error("Veuillez uploader tous les documents requis pour l'éligibilité URSSAF");
      return;
    }

    try {
      setIsValidatingEligibility(true);
      
      const response = await fetch(`${config.API_URL}/api/dossier-steps/urssaf/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dossier_id: clientProduitId,
          documents: documents.map(doc => ({
            id: doc.id,
            type: doc.document_type
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentStep(2);
          
          toast.success("Votre éligibilité au remboursement URSSAF a été confirmée");

          // Mettre à jour l'étape dans la base de données
          await updateStep('eligibility', { status: 'completed' });
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('❌ Erreur validation éligibilité URSSAF:', error);
      toast.error("Impossible de valider l'éligibilité URSSAF");
    } finally {
      setIsValidatingEligibility(false);
    }
  };

  // Gérer la sélection d'expert
  const handleExpertSelected = (expert: Expert) => {
    setCurrentStep(3);
    
    toast.success(`${expert.name} vous accompagnera pour votre dossier URSSAF`);
  };

  // Rendu des icônes d'étape
  const getStepIcon = (step: any) => {
    const IconComponent = step.icon;
    return <IconComponent className="w-5 h-5" />;
  };

  // Couleurs des statuts
  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Rendu du contenu de l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirmer l'éligibilité URSSAF
              </h3>
              <p className="text-gray-600 mb-6">
                Upload des documents requis pour valider votre éligibilité au remboursement URSSAF
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents requis pour l'éligibilité URSSAF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Bulletins de paie</p>
                        <p className="text-sm text-gray-600">3 derniers mois</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Déclarations URSSAF</p>
                        <p className="text-sm text-gray-600">Dernières déclarations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Attestation employeur</p>
                        <p className="text-sm text-gray-600">Certification employeur</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Justificatifs de formation</p>
                        <p className="text-sm text-gray-600">Attestations de formation</p>
                      </div>
                    </div>
                  </div>

                  <DocumentUpload
                    dossiers={[]}
                  />

                  <div className="flex justify-center">
                    <Button
                      onClick={handleValidateEligibility}
                      disabled={!hasRequiredDocuments() || isValidatingEligibility}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isValidatingEligibility ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Validation en cours...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Valider l'éligibilité URSSAF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Sélectionner un expert URSSAF
              </h3>
              <p className="text-gray-600 mb-6">
                Choisissez un expert spécialisé en droit social et URSSAF
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Sélection d'expert</h4>
                  <p className="text-gray-600 mb-6">
                    Nos experts URSSAF vous accompagneront dans votre démarche de remboursement
                  </p>
                  
                  <Button
                    onClick={() => setShowExpertModal(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Choisir un expert URSSAF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ExpertSelectionModal
              isOpen={showExpertModal}
              onClose={() => setShowExpertModal(false)}
              dossierId={clientProduitId}
              onExpertSelected={handleExpertSelected}
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Étape en cours de développement</h3>
            <p className="text-gray-600">Cette étape sera bientôt disponible.</p>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec progression globale */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Progression de votre dossier URSSAF
        </h3>
        {companyName && (
          <p className="text-sm text-gray-600 mb-4">Entreprise : {companyName}</p>
        )}
        
        {/* Barre de progression globale */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression globale</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Étapes du workflow URSSAF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {workflowSteps.map((step) => (
          <Card 
            key={step.id} 
            className={`cursor-pointer transition-all ${
              currentStep === step.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  currentStep >= step.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {getStepIcon(step)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.name}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <Badge className={getStepStatusColor(
                  currentStep > step.id ? 'completed' : 
                  currentStep === step.id ? 'in_progress' : 'pending'
                )}>
                  {currentStep > step.id ? 'Terminé' : 
                   currentStep === step.id ? 'En cours' : 'En attente'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu de l'étape actuelle */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
} 