import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate, useParams } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import HeaderClient from "@/components/HeaderClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCharteSignature } from "@/hooks/use-charte-signature";

// Icons
import { 
  FileSignature, Check, UserCog, Calendar, Upload, Trash2, 
  ArrowLeft, Download, ExternalLink, ChevronDown, ChevronUp, Loader2, XCircle, CheckCircle2
} from "lucide-react";

type StepStatus = "completed" | "current" | "upcoming";

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "fuel_invoices", label: "Factures de carburant (dernière année)", uploadedFiles: [] },
  { id: "vehicle_list", label: "Liste des véhicules et immatriculations", uploadedFiles: [] },
  { id: "transport_licenses", label: "Licences de transport en cours de validité", uploadedFiles: [] },
  { id: "mileage_reports", label: "Relevés kilométriques par véhicule", uploadedFiles: [] },
  { id: "tax_certificates", label: "Attestations de paiement des taxes sur le carburant", uploadedFiles: [] },
  { id: "dsn", label: "Déclarations sociales nominatives (DSN)", uploadedFiles: [] },
  { id: "urssaf", label: "Historique des cotisations URSSAF", uploadedFiles: [] },
  { id: "accounting", label: "Relevés comptables liés aux dépenses de carburant", uploadedFiles: [] },
  { id: "company_docs", label: "Justificatifs d'existence de l'entreprise (KBIS, SIRET)", uploadedFiles: [] },
  { id: "other", label: "Autre document", uploadedFiles: [] },
];

const getTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const StepIndicator = ({ step, currentStep }: { step: number; currentStep: number }) => {
  const status: StepStatus = step < currentStep ? "completed" : step === currentStep ? "current" : "upcoming";

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2",
          status === "completed" && "bg-green-100 border-green-500 text-green-600",
          status === "current" && "bg-blue-100 border-blue-500 text-blue-600",
          status === "upcoming" && "bg-gray-100 border-gray-300 text-gray-400"
        )}
      >
        {status === "completed" ? (
          <Check className="w-5 h-5" />
        ) : (
          <span className="font-semibold">{step}</span>
        )}
      </div>
      {step < 5 && (
        <div
          className={cn(
            "h-1 w-full mx-2",
            status === "completed" ? "bg-green-500" : "bg-gray-200"
          )}
        />
      )}
    </div>
  );
};

// Données fictives pour les experts
const demoExperts = [
  {
    id: "1",
    name: "Jean Dupont",
    title: "Expert Senior",
    rating: 4.8,
    experience: "15 ans",
    specializations: ["TICPE", "CIR"],
    company: "Cabinet Fiscal Plus",
    description: "Expert reconnu en optimisation fiscale avec une expertise particulière en TICPE",
    location: "Paris",
    compensation: 15
  },
  {
    id: "2",
    name: "Marie Laurent",
    title: "Expert Principal",
    rating: 4.9,
    experience: "12 ans",
    specializations: ["TICPE", "URSSAF"],
    company: "Fiscal Experts",
    description: "Spécialiste des questions fiscales et sociales",
    location: "Lyon",
    compensation: 20
  },
  {
    id: "3",
    name: "Pierre Martin",
    title: "Expert Senior",
    rating: 4.7,
    experience: "10 ans",
    specializations: ["TICPE", "CICE"],
    company: "Cabinet Martin & Associés",
    description: "Expert en crédits d'impôts et optimisations fiscales",
    location: "Marseille",
    compensation: 18
  },
  {
    id: "4",
    name: "Sophie Dubois",
    title: "Expert Principal",
    rating: 4.9,
    experience: "18 ans",
    specializations: ["TICPE", "CIR", "CICE"],
    company: "Dubois Consulting",
    description: "Consultante senior en fiscalité et optimisation",
    location: "Bordeaux",
    compensation: 25
  },
  {
    id: "5",
    name: "Thomas Bernard",
    title: "Expert Senior",
    rating: 4.6,
    experience: "8 ans",
    specializations: ["TICPE", "URSSAF"],
    company: "Bernard Fiscal",
    description: "Expert en fiscalité sociale et optimisations",
    location: "Lille",
    compensation: 12
  }
];

export default function TICPEPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Récupérer l'ID depuis les paramètres de route
  const clientProduitId = params.clientProduitId || params.uuid || params.id;
  
  console.log('🔍 Paramètres dans TICPEPage:', params);
  console.log('🔍 clientProduitId extrait:', clientProduitId);
  
  // Utiliser le hook pour gérer les signatures de charte avec l'ID explicite
  const { isSigned: isCharterSigned, isLoading: isCharterLoading, isSigning: isCharterSigning, signCharte, signature } = useCharteSignature(clientProduitId);
  
  // Logs de débogage
  console.log('🔍 État du hook useCharteSignature:', {
    isCharterSigned,
    isCharterLoading,
    isCharterSigning,
    clientProduitId
  });
  
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [acceptedCGU, setAcceptedCGU] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedExpert, setSelectedExpert] = useState<typeof demoExperts[0] | null>(null);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [tempSelectedExpert, setTempSelectedExpert] = useState<typeof demoExperts[0] | null>(null);

  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [confirmedDateTime, setConfirmedDateTime] = useState<string>();

  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>(documentsList);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleStepChange = (newStep: number) => {
    if (newStep > currentStep && !isCharterSigned) {
      setShowCharterDialog(true);
      return;
    }
    
    if (newStep === 2 && !selectedExpert) {
      setShowExpertDialog(true);
      return;
    }
    
    if (newStep === 3 && !confirmedDateTime) {
      setShowCalendarDialog(true);
      return;
    }
    
    setCurrentStep(newStep);
    setProgress(((newStep - 1) * 25));
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress(((currentStep - 2) * 25));
    } else {
      navigate("/dashboard/client/demo");
    }
  };

  const handleCharterSign = async () => {
    if (!acceptedCGU) {
      toast({
        title: "Conditions non acceptées",
        description: "Veuillez accepter les conditions générales d'utilisation",
        variant: "destructive"
      });
      return;
    }

    if (isCharterSigning) {
      toast({
        title: "Signature en cours",
        description: "Veuillez patienter pendant la signature de la charte",
      });
      return;
    }

    try {
      console.log('📝 Début de la signature de la charte...');
      const success = await signCharte();
      
      if (success) {
        setProgress(25);
        setShowCharterDialog(false);
        
        toast({
          title: "La charte est validée avec succès !",
          description: "Vous pouvez maintenant passer à l'étape suivante",
        });
      } else {
        console.log('❌ Échec de la signature de la charte');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la signature de la charte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de signer la charte. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleExpertSelect = (expert: typeof demoExperts[0]) => {
    setSelectedExpert(expert);
    setProgress(50);
    setShowExpertDialog(false);
    toast({
      title: "Expert sélectionné",
      description: `Vous avez choisi ${expert.name} comme expert`,
    });
  };

  const handleDocumentUpload = (docId: string, files: {id: number; name: string}[]) => {
    const updatedDocs = uploadedDocuments.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          uploadedFiles: [...d.uploadedFiles, ...files]
        };
      }
      return d;
    });
    setUploadedDocuments(updatedDocs);
  };

  const handleDeleteDocument = (docId: string, fileId: number) => {
    const updatedDocs = uploadedDocuments.map(doc => ({
      ...doc,
      uploadedFiles: doc.uploadedFiles.filter(file => file.id !== fileId)
    }));

    setUploadedDocuments(updatedDocs);
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const handleDownloadCharter = () => {
    toast({
      title: "Téléchargement de la charte",
      description: "Le téléchargement va commencer automatiquement",
    });
  };

  const steps = [
    {
      title: "Signature de la charte",
      description: "Signature de la charte contractuelle",
      icon: FileSignature,
      action: !isCharterSigned ? () => setShowCharterDialog(true) : handleDownloadCharter,
      actionLabel: isCharterSigned ? "Télécharger la charte" : "Signer la charte",
      actionIcon: isCharterSigned ? Download : undefined,
      status: isCharterSigned ? "completed" : currentStep === 1 ? "current" : "upcoming"
    },
    {
      title: "Sélection de l'expert",
      description: "Choix et validation de l'expert",
      icon: UserCog,
      action: currentStep === 2 ? () => setShowExpertDialog(true) : undefined,
      actionLabel: "Choisir un expert",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "upcoming"
    },
    {
      title: "Prise de rendez-vous",
      description: confirmedDateTime ? `RDV prévu le ${confirmedDateTime}` : "Planification du rendez-vous",
      icon: Calendar,
      action: currentStep === 3 ? () => setShowCalendarDialog(true) : undefined,
      actionLabel: "Prendre rendez-vous",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "upcoming"
    },
    {
      title: "Documents",
      description: "Téléversement des documents",
      icon: Upload,
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "upcoming"
    },
    {
      title: "Finalisation",
      description: "Rapport et recommandations",
      icon: Check,
      status: currentStep === 5 ? "completed" : "upcoming"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="container mx-auto p-6">
        <div className="pt-24">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Audit TICPE</h1>
            </div>
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="flex items-center gap-2"
              disabled={currentStep <= 1}
            >
              <ArrowLeft className="w-4 h-4" />
              Étape précédente
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="h-2 bg-blue-500 rounded-full mb-4"
        />

        {/* Steps indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <StepIndicator key={index} step={index + 1} currentStep={currentStep} />
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Audit Taxe Intérieure de Consommation sur les Produits Énergétiques (TICPE)</CardTitle>
                <p className="text-m text-muted-foreground">
                  Obtenez jusqu'à 7600€ de déductions par an et par employé !
                </p>
              </CardHeader>
              <CardHeader>
                <CardTitle>Processus en cours :</CardTitle>
                <p className="text-m text-muted-foreground">
                  Suivez les étapes pour finaliser le dossier et obtenir vos remboursements.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isExpanded = expandedSection === `step-${stepNumber}`;
                    const hasExpandableContent = stepNumber === 4 || stepNumber === 5;

                    return (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{ height: "auto" }}
                        className={cn(
                          "p-6 rounded-lg border cursor-pointer transition-all",
                          stepNumber === currentStep && "bg-blue-50 border-blue-200",
                          stepNumber < currentStep && "bg-green-50 border-green-200",
                          stepNumber > currentStep && "bg-gray-50 border-gray-200"
                        )}
                        onClick={() => {
                          handleStepChange(stepNumber);
                          if (hasExpandableContent) {
                            toggleSection(`step-${stepNumber}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <step.icon className={cn(
                            "w-6 h-6",
                            stepNumber === currentStep && "text-blue-500",
                            stepNumber < currentStep && "text-green-500",
                            stepNumber > currentStep && "text-gray-400"
                          )} />
                          <div className="flex-grow">
                            <h3 className="font-semibold">{step.title}</h3>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                          {hasExpandableContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(`step-${stepNumber}`);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {step.action && (stepNumber === currentStep || (stepNumber === 1 && isCharterSigned)) && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (step.action) {
                                  step.action();
                                }
                              }}
                              variant={stepNumber === currentStep ? "default" : "outline"}
                              className="flex items-center gap-2"
                            >
                              {step.actionIcon && <step.actionIcon className="w-4 h-4" />}
                              {step.actionLabel}
                            </Button>
                          )}
                        </div>

                        {stepNumber === 2 && selectedExpert && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <h4 className="font-medium">{selectedExpert.name}</h4>
                            <p className="text-sm text-gray-600">Cabinet : {selectedExpert.company}</p>
                            <p className="text-sm text-gray-600">Spécialisations : {selectedExpert.specializations.join(", ")}</p>
                            <p className="text-sm text-gray-600">{selectedExpert.description}</p>
                            <p className="text-sm text-gray-600">Note : {selectedExpert.rating} /5</p>
                            <p className="text-sm text-gray-600">{selectedExpert.experience}</p>
                            <p className="text-sm text-gray-600">Localisation : {selectedExpert.location}</p>
                            <p className="text-sm text-gray-600">Commission : {selectedExpert.compensation}% des gains récupérés</p>
                          </div>
                        )}

                        {stepNumber === 4 && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                          >
                            {uploadedDocuments.map((doc) => (
                              <div key={doc.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "text-sm",
                                    doc.uploadedFiles.length > 0 && "text-green-600"
                                  )}>
                                    {doc.label}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDocumentUpload(doc.id, [{ id: Date.now(), name: "Document test.pdf" }])}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Téléverser
                                  </Button>
                                </div>
                                {doc.uploadedFiles.length > 0 && (
                                  <div className="ml-4 space-y-1">
                                    {doc.uploadedFiles.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <Check className="w-4 h-4 text-green-600" />
                                          <span>{file.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteDocument(doc.id, file.id)}
                                          className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}

                        {stepNumber === 5 && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 space-y-4"
                          >
                            <div className="p-6 bg-white rounded-lg border space-y-6">
                              <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900">Rapport d'Audit TICPE</h3>
                                  <p className="text-sm text-gray-500">Réf: TICPE-2024-{Math.floor(Math.random() * 10000)}</p>
                                </div>
                                <Button
                                  onClick={() => {
                                    toast({
                                      title: "Rapport téléchargé",
                                      description: "Le rapport d'audit a été téléchargé avec succès",
                                    });
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Télécharger le rapport
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-2">Informations Générales</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Date de finalisation:</span>
                                        <span className="font-medium">{format(new Date(), 'dd/MM/yyyy')}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Expert en charge:</span>
                                        <span className="font-medium">{selectedExpert?.name}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Documents analysés:</span>
                                        <span className="font-medium">
                                          {uploadedDocuments.reduce((sum, doc) => sum + doc.uploadedFiles.length, 0)} documents
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-900 mb-2">Synthèse Financière</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Montant total éligible:</span>
                                        <span className="font-medium text-green-600">45,750 €</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Période concernée:</span>
                                        <span className="font-medium">2023-2024</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Commission expert:</span>
                                        <span className="font-medium">{selectedExpert?.compensation}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-2">Analyse des Éligibilités</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Véhicules de service</span>
                                        <span className="text-sm font-medium text-green-600">Éligible</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Véhicules de fonction</span>
                                        <span className="text-sm font-medium text-green-600">Éligible</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Véhicules de transport</span>
                                        <span className="text-sm font-medium text-green-600">Éligible</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-orange-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-orange-900 mb-2">Recommandations</h4>
                                    <ul className="text-sm space-y-2">
                                      <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 mt-1" />
                                        <span>Optimisation des déclarations mensuelles</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 mt-1" />
                                        <span>Mise en place d'un suivi kilométrique</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 mt-1" />
                                        <span>Formation des équipes sur la gestion TICPE</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-4">Détail de la Situation</h4>
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Contexte</h5>
                                    <p className="text-sm text-gray-600">
                                      L'entreprise dispose d'une flotte de 12 véhicules utilisés pour le transport de marchandises et les déplacements professionnels. 
                                      L'analyse des documents fournis révèle une utilisation mixte des véhicules entre usage professionnel et privé.
                                    </p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Points Clés de l'Audit</h5>
                                    <ul className="text-sm text-gray-600 space-y-2">
                                      <li>• Identification de 8 véhicules éligibles à la récupération TICPE</li>
                                      <li>• Calcul précis des kilométrages professionnels vs privés</li>
                                      <li>• Vérification des justificatifs de consommation de carburant</li>
                                      <li>• Analyse des déclarations fiscales antérieures</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Perspectives</h5>
                                    <p className="text-sm text-gray-600">
                                      La mise en place des recommandations permettra d'optimiser la récupération TICPE sur les prochaines années, 
                                      avec une estimation de gain supplémentaire de 15% sur les montants actuels.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-500">
                                    Rapport généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Validé par {selectedExpert?.name} - {selectedExpert?.company}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showCharterDialog} onOpenChange={setShowCharterDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isCharterSigned ? "Charte Validée" : "Charte Contractuelle"}
              </DialogTitle>
              <DialogDescription>
                {isCharterSigned 
                  ? "Votre charte a été signée avec succès. Vous pouvez maintenant passer à l'étape suivante."
                  : "Veuillez lire attentivement la charte avant de la signer."
                }
              </DialogDescription>
            </DialogHeader>
            
            {!isCharterSigned ? (
              <>
                <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-md my-4">
                  <h3 className="text-lg font-semibold mb-4">Charte de l'Audit TICPE</h3>

                  <p className="mb-4">
                    Cette charte définit les engagements mutuels entre le client et l'expert TICPE dans le cadre de l'audit relatif à la récupération de la Taxe Intérieure de Consommation sur les Produits Énergétiques (TICPE).
                  </p>

                  <h4 className="text-md font-semibold mt-4">1. Objet de la Charte</h4>
                  <p className="mb-4">
                    L'objectif de cette charte est d'encadrer les relations entre le client et l'expert afin de garantir un audit structuré et conforme aux exigences réglementaires.
                  </p>

                  <h4 className="text-md font-semibold mt-4">2. Engagements du Client</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>Fournir tous les justificatifs nécessaires dans les délais impartis.</li>
                    <li>Garantir l'authenticité des documents et des informations transmises.</li>
                    <li>Collaborer activement avec l'expert en répondant aux demandes de clarification.</li>
                    <li>Respecter les échéances convenues pour éviter tout retard dans la récupération des montants dus.</li>
                  </ul>

                  <h4 className="text-md font-semibold mt-4">3. Engagements de l'Expert</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>Analyser minutieusement les documents fournis pour optimiser la récupération de la TICPE.</li>
                    <li>Garantir la confidentialité des informations et documents transmis.</li>
                    <li>Assurer un suivi régulier et apporter des conseils adaptés au client.</li>
                    <li>Respecter la réglementation en vigueur et veiller à la conformité des démarches.</li>
                  </ul>

                  <h4 className="text-md font-semibold mt-4">4. Modalités de Récupération de la TICPE</h4>
                  <p className="mb-4">
                    L'audit suit un processus structuré comprenant l'analyse des dépenses, la vérification de l'éligibilité et l'établissement du dossier de remboursement. La durée estimée est de deux à six semaines selon la complexité du dossier et la réactivité du client.
                    La rémunération de l'expert est basée sur un forfait fixe ou un pourcentage des montants récupérés, selon l'accord convenu.
                  </p>

                  <h4 className="text-md font-semibold mt-4">5. Clause de Responsabilité</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>L'expert ne peut être tenu responsable des rejets de remboursement liés à des informations incomplètes ou erronées fournies par le client.</li>
                    <li>L'expert met tout en œuvre pour optimiser la récupération, mais ne garantit pas un montant spécifique, celui-ci dépendant des critères d'éligibilité.</li>
                  </ul>

                  <h4 className="text-md font-semibold mt-4">6. Résiliation et Litiges</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>Chaque partie peut résilier l'audit en cas de manquement grave, avec un préavis de 15 jours.</li>
                    <li>En cas de litige, une résolution à l'amiable sera privilégiée. À défaut, le litige sera soumis aux tribunaux compétents.</li>
                  </ul>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="cgu"
                    checked={acceptedCGU}
                    onCheckedChange={(checked) => setAcceptedCGU(checked as boolean)}
                  />
                  <label
                    htmlFor="cgu"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    J'accepte les conditions générales d'utilisation
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCharterDialog(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCharterSign} 
                    disabled={!acceptedCGU || isCharterSigning}
                  >
                    {isCharterSigning ? "Signature en cours..." : "Signer la charte"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Charte signée avec succès !
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Votre charte d'engagement a été validée. Vous pouvez maintenant passer à l'étape suivante de votre audit TICPE.
                  </p>
                  {signature && (
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                      <p><strong>ID de signature :</strong> {signature.id}</p>
                      <p><strong>Date de signature :</strong> {new Date(signature.signature_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      setShowCharterDialog(false);
                      // Passer automatiquement à l'étape suivante
                      handleStepChange(2);
                    }}
                    className="w-full"
                  >
                    Retour au dossier - Étape suivante
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Sélection de l'expert TICPE</DialogTitle>
              <DialogDescription>
                Choisissez un expert spécialisé en TICPE pour votre audit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1">
              {demoExperts.map((expert) => (
                <div
                  key={expert.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    tempSelectedExpert?.id === expert.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-400"
                  )}
                  onClick={() => setTempSelectedExpert(expert)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{expert.name}</h4>
                      <p className="text-sm text-gray-600">{expert.company}</p>
                      <p className="text-sm text-blue-600">{expert.specializations.join(", ")}</p>
                      <p className="text-sm text-gray-500">{expert.experience}</p>
                      <p className="text-sm mt-2">{expert.description}</p>
                      <p className="text-sm text-gray-500">Note : {expert.rating}/5</p>
                      <p className="text-sm text-gray-500">Commission : {expert.compensation}%</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/expert/${expert.id}`);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExpertDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (tempSelectedExpert) {
                    handleExpertSelect(tempSelectedExpert);
                  }
                }}
                disabled={!tempSelectedExpert}
              >
                Valider cet expert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Planifier un rendez-vous</DialogTitle>
              <DialogDescription>
                Sélectionnez une date et un horaire pour votre rendez-vous
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={fr}
              />
              {selectedDate && (
                <div className="grid grid-cols-4 gap-2">
                  {getTimeSlots().map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className="text-sm"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (selectedDate && selectedTime) {
                    const formattedDate = format(selectedDate, 'dd/MM/yyyy');
                    const formattedDateTime = `${formattedDate} à ${selectedTime}`;
                    setConfirmedDateTime(formattedDateTime);
                    setProgress(75);
                    setShowCalendarDialog(false);
                    toast({
                      title: "Rendez-vous confirmé",
                      description: `Votre rendez-vous est programmé pour le ${formattedDateTime}`,
                    });
                  }
                }}
                disabled={!selectedDate || !selectedTime}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}