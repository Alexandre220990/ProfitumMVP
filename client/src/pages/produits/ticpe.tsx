import { useState, useEffect } from "react";
import { useLocation, useRoute, useParams } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import HeaderClient from "@/components/HeaderClient";

// Hooks & Utils
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Icons
import { 
  FileSignature, Check, UserCog, Calendar, Upload, Trash2, 
  ArrowLeft, ArrowRight, Download, ExternalLink, ChevronDown, ChevronUp, 
  RefreshCcw, TrendingUp, FileText, DollarSign, Clock, Users 
} from "lucide-react";

type StepStatus = "completed" | "current" | "upcoming";

type Expert = {
  id: number;
  name: string;
  company: string;
  speciality: string;
  experience: string;
  compensation: number;
  description: string;
};

const ticpeExperts: Expert[] = [
  {
    id: 1,
    name: "Laurent Bernard",
    company: "TICPE Solutions",
    speciality: "Audit et récupération TICPE",
    experience: "18 ans d'expertise",
    compensation: 35,
    description: "Spécialiste de la récupération des taxes sur les carburants pour les entreprises de transport."
  },
  {
    id: 2,
    name: "Camille Dupont",
    company: "Fiscalité Carburant",
    speciality: "Optimisation fiscale TICPE",
    experience: "14 ans d'expérience",
    compensation: 32,
    description: "Experte en optimisation TICPE pour maximiser les remboursements des entreprises."
  },
  {
    id: 3,
    name: "Nicolas Moreau",
    company: "TransTax Consulting",
    speciality: "Gestion des dossiers TICPE",
    experience: "10 ans d'expérience",
    compensation: 30,
    description: "Accompagne les sociétés de transport dans leurs déclarations et récupérations TICPE."
  },
  {
    id: 4,
    name: "Élise Garnier",
    company: "Carburant & Fiscalité",
    speciality: "Stratégie de réduction TICPE",
    experience: "16 ans d'expertise",
    compensation: 33,
    description: "Conseil en réduction de charges liées aux taxes carburants pour les flottes professionnelles."
  },
  {
    id: 5,
    name: "Antoine Lefebvre",
    company: "EcoTICPE",
    speciality: "Fiscalité énergétique et TICPE",
    experience: "20 ans d'expérience",
    compensation: 37,
    description: "Expert en récupération et exonération TICPE pour les entreprises du transport et de la logistique."
  }
];

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

export default function TICPEAudit() {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const params = useParams();
  const userId = params.userId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auditType = "ticpe";

  const [isCharterSigned, setIsCharterSigned] = useState(false);
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [acceptedCGU, setAcceptedCGU] = useState(false);

  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [tempSelectedExpert, setTempSelectedExpert] = useState<Expert | null>(null);

  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [confirmedDateTime, setConfirmedDateTime] = useState<string>();

  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>(documentsList);
  const [progress, setProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    setProgress((currentStep - 1) * 25);

    const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
    setIsCharterSigned(!!signedCharters[auditType]);

    const savedProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
    if (savedProgress[auditType]) {
      setCurrentStep(savedProgress[auditType]);
    }

    const savedExperts = JSON.parse(localStorage.getItem('selectedExperts') || '{}');
    if (savedExperts[auditType]) {
      setSelectedExpert(savedExperts[auditType]);
    }

    const savedDateTime = localStorage.getItem(`${auditType}_datetime`);
    if (savedDateTime) {
      setConfirmedDateTime(savedDateTime);
    }

    const savedDocuments = JSON.parse(localStorage.getItem(`${auditType}_documents`) || '{}');
    if (Object.keys(savedDocuments).length > 0) {
      setUploadedDocuments(prevDocs =>
        prevDocs.map(doc => ({
          ...doc,
          uploadedFiles: savedDocuments[doc.id] ? savedDocuments[doc.id].map(f => ({ id: f.id, name: f.name })) : []
        }))
      );
    }
  }, [auditType, currentStep]);

  const handleStepChange = (newStep: number) => {
    if (newStep >= 1 && newStep <= 5) {
      setCurrentStep(newStep);
      setProgress((newStep - 1) * 25);

      const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
      auditProgress[auditType] = newStep;
      localStorage.setItem('auditProgress', JSON.stringify(auditProgress));

      toast({
        title: `Navigation vers l'étape ${newStep}`,
        description: "Vous pouvez revenir aux étapes précédentes à tout moment",
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleCharterSign = () => {
    if (acceptedCGU) {
      const signedCharters = JSON.parse(localStorage.getItem('signedCharters') || '{}');
      signedCharters[auditType] = true;
      localStorage.setItem('signedCharters', JSON.stringify(signedCharters));
      setIsCharterSigned(true);
      updateProgress(2);
      setShowCharterDialog(false);
      toast({
        title: "La charte est validée avec succès !",
        description: "Vous pouvez maintenant passer à l'étape suivante",
      });
    }
  };

  const handleExpertSelect = () => {
    if (tempSelectedExpert) {
      setSelectedExpert(tempSelectedExpert);
      const savedExperts = JSON.parse(localStorage.getItem('selectedExperts') || '{}');
      savedExperts[auditType] = tempSelectedExpert;
      localStorage.setItem('selectedExperts', JSON.stringify(savedExperts));
      updateProgress(3);
      setShowExpertDialog(false);
      toast({
        title: "Expert sélectionné",
        description: `Vous avez choisi ${tempSelectedExpert.name} comme expert`,
      });
    }
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

    localStorage.setItem(`${auditType}_documents`, JSON.stringify(
      updatedDocs.reduce((acc, d) => ({
        ...acc,
        [d.id]: d.uploadedFiles
      }), {})
    ));
  };

  const handleDeleteDocument = (docId: string, fileId: number) => {
    const updatedDocs = uploadedDocuments.map(doc => ({
      ...doc,
      uploadedFiles: doc.uploadedFiles.filter(file => file.id !== fileId)
    }));

    setUploadedDocuments(updatedDocs);
    localStorage.setItem(`${auditType}_documents`, JSON.stringify(
      updatedDocs.reduce((acc, d) => ({
        ...acc,
        [d.id]: d.uploadedFiles
      }), {})
    ));
  };

  const updateProgress = (step: number) => {
    const auditProgress = JSON.parse(localStorage.getItem('auditProgress') || '{}');
    auditProgress[auditType] = step;
    localStorage.setItem('auditProgress', JSON.stringify(auditProgress));
    setCurrentStep(step);
  };

  const handleDownloadCharter = () => {
    toast({
      title: "Téléchargement de la charte",
      description: "La charte signée a été téléchargée",
    });
  };

  const handleReset = () => {
    const confirmReset = window.confirm("Êtes-vous sûr de vouloir réinitialiser ce dossier ? Toutes les données seront perdues.");
    if (confirmReset) {
      // Clear all localStorage data for this audit
      const storageKeys = [
        'signedCharters',
        'auditProgress',
        'selectedExperts',
        `${auditType}_datetime`,
        `${auditType}_documents`
      ];

      storageKeys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        delete data[auditType];
        localStorage.setItem(key, JSON.stringify(data));
      });

      // Reset all states
      setCurrentStep(1);
      setProgress(0);
      setIsCharterSigned(false);
      setSelectedExpert(null);
      setConfirmedDateTime(undefined);
      setUploadedDocuments(documentsList);

      toast({
        title: "Dossier réinitialisé",
        description: "Le dossier a été remis à zéro avec succès",
      });

      // Return to dashboard
      setLocation('/dashboard/client');
    }
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
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
      
   {/* KPI cards */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <StepIndicator key={index} step={index + 1} currentStep={currentStep} />
            ))}
          </div>
        </div>

        <Card className="w-full ">
          <CardHeader>
            <CardTitle>Audit Taxe Intérieure de Consommation sur les Produits Énergétiques  (TICPE)</CardTitle>
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
                            step.action();
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
                        <p className="text-sm text-gray-600">{selectedExpert.company}</p>
                        <p className="text-sm text-gray-600">{selectedExpert.speciality}</p>
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
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Rapport final</h3>
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
                          <div className="bg-gray-50 p-4 rounded-lg">
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
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCharterDialog} onOpenChange={setShowCharterDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Charte Contractuelle</DialogTitle>
              <DialogDescription>
                Veuillez lire attentivement la charte avant de la signer.
              </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-md my-4">
                <h3 className="text-lg font-semibold mb-4">Charte de l'Audit TICPE</h3>

                <p className="mb-4">
                  Cette charte définit les engagements mutuels entre le client et l'expert TICPE dans le cadre de l’audit relatif à la récupération de la Taxe Intérieure de Consommation sur les Produits Énergétiques (TICPE).
                </p>

                <h4 className="text-md font-semibold mt-4">1. Objet de la Charte</h4>
                <p className="mb-4">
                  L’objectif de cette charte est d’encadrer les relations entre le client et l’expert afin de garantir un audit structuré et conforme aux exigences réglementaires.
                </p>

                <h4 className="text-md font-semibold mt-4">2. Engagements du Client</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li>Fournir tous les justificatifs nécessaires dans les délais impartis.</li>
                  <li>Garantir l’authenticité des documents et des informations transmises.</li>
                  <li>Collaborer activement avec l’expert en répondant aux demandes de clarification.</li>
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
                  L’audit suit un processus structuré comprenant l’analyse des dépenses, la vérification de l’éligibilité et l’établissement du dossier de remboursement. La durée estimée est de deux à six semaines selon la complexité du dossier et la réactivité du client.  
                  La rémunération de l’expert est basée sur un forfait fixe ou un pourcentage des montants récupérés, selon l’accord convenu.
                </p>

                <h4 className="text-md font-semibold mt-4">5. Clause de Responsabilité</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li>L’expert ne peut être tenu responsable des rejets de remboursement liés à des informations incomplètes ou erronées fournies par le client.</li>
                  <li>L’expert met tout en œuvre pour optimiser la récupération, mais ne garantit pas un montant spécifique, celui-ci dépendant des critères d’éligibilité.</li>
                </ul>

                <h4 className="text-md font-semibold mt-4">6. Résiliation et Litiges</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li>Chaque partie peut résilier l’audit en cas de manquement grave, avec un préavis de 15 jours.</li>
                  <li>En cas de litige, une résolution à l’amiable sera privilégiée. À défaut, le litige sera soumis aux tribunaux compétents.</li>
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
              <Button onClick={handleCharterSign} disabled={!acceptedCGU}>
                Signer la charte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Sélection de l'expert TICPE</DialogTitle>
              <DialogDescription>
                Choisissez un expert spécialisé en TICPE pour votre audit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {ticpeExperts.map((expert) => (
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
                      <p className="text-sm text-blue-600">{expert.speciality}</p>
                      <p className="text-sm text-gray-500">{expert.experience}</p>
                      <p className="text-sm mt-2">{expert.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/expert/${expert.id}`);
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le profil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExpertDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleExpertSelect}
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
                    localStorage.setItem(`${auditType}_datetime`, formattedDateTime);
                    updateProgress(4);
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
  );
}