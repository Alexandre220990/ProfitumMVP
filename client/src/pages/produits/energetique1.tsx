import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSignature,
  Check,
  UserCog,
  Calendar,
  Upload,
  Trash2,
  ArrowLeft,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import HeaderClient from "@/components/HeaderClient";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAudit } from "@/hooks/use-audit";

type StepStatus = "completed" | "current" | "upcoming";

type Expert = {
  id: number;
  name: string;
  company: string;
  speciality: string;
  experience: string;
  compensation: number;
  description: string;
  location: string;
  rating: number;
  availability?: string;
};

const energyExperts: Expert[] = [
  {
    id: 1,
    name: "François Delorme",
    company: "Energie Conseil",
    speciality: "Audit énergétique industriel",
    experience: "18 ans d'expertise",
    compensation: 32, // % du succès
    rating: 4.9,
    location: "Paris",
    description: "Spécialiste en optimisation des coûts énergétiques pour les industries et le BTP.",
    availability: "9:00-17:00"
  },
  {
    id: 2,
    name: "Isabelle Moreau",
    company: "EcoWatt Consulting",
    speciality: "Optimisation énergétique PME",
    experience: "14 ans d'expérience",
    compensation: 25,
    rating: 4.7,
    location: "Lyon",
    description: "Accompagnement des PME dans la réduction de leur facture énergétique et l'accès aux subventions.",
    availability: "9:00-17:00"
  },
  {
    id: 3,
    name: "Julien Garnier",
    company: "GreenPower Experts",
    speciality: "Transition énergétique et énergies renouvelables",
    experience: "20 ans d'expérience",
    compensation: 30, // % du succès
    rating: 4.8,
    location: "Bordeaux",
    description: "Accompagnement des entreprises dans la transition énergétique et la mise en place de solutions renouvelables.",
    availability: "9:00-17:00"
  },
  {
    id: 4,
    name: "Clara Dubois",
    company: "Bâtiment Durable",
    speciality: "Optimisation énergétique des bâtiments",
    experience: "10 ans d'expérience",
    compensation: 28, 
    rating: 4.6,
    location: "Marseille",
    description: "Audit et optimisation de la consommation énergétique des bâtiments tertiaires et industriels.",
    availability: "9:00-17:00"
  },
  {
    id: 5,
    name: "Marc Lefebvre",
    company: "Audit Énergie Plus",
    speciality: "Fiscalité énergétique et crédits d'impôt",
    experience: "12 ans d'expérience",
    compensation: 27, // % du succès
    rating: 4.5,
    location: "Nantes",
    description: "Spécialiste de l'optimisation des crédits d'impôt et des dispositifs fiscaux liés à l'énergie.",
    availability: "9:00-17:00"
  }
];

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "energyreceipt", label: "Facture du fournisseur actuel d'énergie de moins de 3 mois", uploadedFiles: [] },
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

const Energetique1 = () => {
  const location = useLocation();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const auditType = "energetique1";

  const { audit, updateAudit, createAudit, addDocument, deleteDocument } = useAudit();

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
    if (audit) {
      setCurrentStep(audit.current_step);
      setProgress(audit.progress);
      setIsCharterSigned(audit.charter_signed);
      setSelectedExpert(audit.expert_id ? {
        id: audit.expert_id,
        name: audit.expert_name || '',
        company: audit.expert_company || '',
        speciality: '',
        description: '',
        rating: 0,
        experience: '',
        location: '',
        compensation: 0,
        availability: audit.appointment_datetime
      } : null);
      setConfirmedDateTime(audit.appointment_datetime);
    } else {
      // Créer un nouvel audit si nécessaire
      createAudit.mutate({
        audit_type: auditType,
        potential_gain: 15000 // Gain potentiel par défaut pour l'audit énergétique
      });
    }
  }, [audit]);

  const handleStepChange = async (newStep: number) => {
    if (newStep >= 1 && newStep <= 5) {
      setCurrentStep(newStep);
      setProgress((newStep - 1) * 25);

      if (audit?.id) {
        await updateAudit.mutateAsync({
          id: audit.id,
          current_step: newStep,
          progress: (newStep - 1) * 25,
          status: newStep === 5 ? 'completed' : 'pending'
        });
      }

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

  const handleCharterSign = async () => {
    if (acceptedCGU && audit?.id) {
      await updateAudit.mutateAsync({
        id: audit.id,
        charter_signed: true
      });
      setIsCharterSigned(true);
      updateProgress(2);
      setShowCharterDialog(false);
      toast({
        title: "La charte est validée avec succès !",
        description: "Vous pouvez maintenant passer à l'étape suivante",
      });
    }
  };

  const handleExpertSelect = async (expert: Expert) => {
    setSelectedExpert(expert);
    if (audit) {
      await updateAudit.mutateAsync({
        id: audit.id,
        expert_id: expert.id,
        appointment_datetime: expert.availability || undefined
      });
    }
  };

  const handleDocumentUpload = async (docId: string, files: {id: number; name: string}[]) => {
    if (!audit?.id) return;

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

    // Ajouter chaque document à la base de données
    for (const file of files) {
      await addDocument.mutateAsync({
        audit_id: audit.id,
        document_type: docId,
        file_name: file.name,
        file_path: `/uploads/${audit.id}/${file.name}` // À adapter selon votre système de stockage
      });
    }
  };

  const handleDeleteDocument = async (docId: string, fileId: number) => {
    if (!audit?.id) return;

    const updatedDocs = uploadedDocuments.map(doc => ({
      ...doc,
      uploadedFiles: doc.uploadedFiles.filter(file => file.id !== fileId)
    }));

    setUploadedDocuments(updatedDocs);
    await deleteDocument.mutateAsync({
      audit_id: audit.id,
      document_id: fileId
    });
  };

  const updateProgress = async (step: number) => {
    if (!audit?.id) return;

    await updateAudit.mutateAsync({
      id: audit.id,
      current_step: step,
      progress: (step - 1) * 25,
      status: step === 5 ? 'completed' : 'pending'
    });
    setCurrentStep(step);
  };

  const handleDownloadCharter = () => {
    toast({
      title: "Téléchargement de la charte",
      description: "La charte signée a été téléchargée",
    });
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsCharterSigned(false);
    setSelectedExpert(null);
    setUploadedDocuments([]);
    if (audit) {
      updateAudit.mutateAsync({
        id: audit.id,
        expert_id: undefined,
        appointment_datetime: undefined
      });
    }
    location.push('/dashboard/client');
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
      description: confirmedDateTime ? `RDV prévu le ${confirmedDateTime}` : "Planification du rendez-vous (facultatif, cliquez sur l'étape suivante pour avancer)",
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
              <h1 className="text-3xl font-bold">Audit des fournisseurs d'énergie</h1>
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
      
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-2 bg-blue-500 rounded-full"
          />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <StepIndicator key={index} step={index + 1} currentStep={currentStep} />
            ))}
          </div>
        </div>

        <Card className="w-full ">
          <CardHeader>
            <CardTitle>Audit des fournisseurs d'énergies</CardTitle>
            <p className="text-m text-muted-foreground">
              Obtenez jusqu'à 30% sur vos factures d'énergie ! 
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
                        <p className="text-sm text-gray-600">Spécialité : {selectedExpert.speciality}</p>
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
              <DialogTitle>Charte Contractuelle DFS</DialogTitle>
              <DialogDescription>
                Veuillez lire attentivement la charte avant de la signer
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-md my-4">
              <h3 className="text-lg font-semibold mb-4">Charte de l'Audit Énergétique</h3>

                  <p className="mb-4">
                    Cette charte définit les engagements mutuels entre le client et l'expert dans le cadre de l'audit relatif à la optimisation des fournisseurs d'énergie. 
                  </p>

                  <h4 className="text-md font-semibold mt-4">1. Objet de la Charte</h4>
                  <p className="mb-4">
                    L'objectif de cette charte est d'encadrer les relations entre le client et l'expert afin de garantir un audit structuré et conforme aux exigences réglementaires.
                  </p>

                  <h4 className="text-md font-semibold mt-4">2. Engagements du Client</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>Fournir tous les justificatifs nécessaires dans les délais impartis.</li>
                    <li>Autoriser l'expert mandaté à procéder à un revelé de vos données de consommations auprès de votre fournisseur d'énergie actuel. Seules vos données de consommation sont concernées et serviront pour garantir un résultat optimal de l'appel d'offre aux fournisseurs. </li> 
                    <li>Garantir l'authenticité des documents et des informations transmises.</li>
                    <li>Collaborer activement avec l'expert en répondant aux demandes de clarification.</li>
                    <li>Respecter les échéances convenues pour éviter tout retard dans la récupération des montants dus.</li>
                  </ul>

                  <h4 className="text-md font-semibold mt-4">3. Engagements de l'Expert</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li>Analyser minutieusement les documents fournis pour optimiser vos contrats d'énergie.</li>
                    <li>Garantir la confidentialité des informations et documents transmis.</li>
                    <li>Assurer un suivi régulier et apporter des conseils adaptés au client.</li>
                    <li>Respecter la réglementation en vigueur et veiller à la conformité des démarches.</li>
                  </ul>

                  <h4 className="text-md font-semibold mt-4">4. Modalités de l'optimisation des dépenses énergétiques :</h4>
                  <p className="mb-4">
                    L'audit suit un processus structuré comprenant l'analyse des dépenses, la vérification de l'éligibilité et l'établissement d'un rapport comprenant les offres les plus pertinentes par rapport à votre situation. La durée estimée est de moins d'une semaine.  
                    La rémunération de l'expert est basée sur un pourcentage des montants récupérés selon le taux de commission applicable de l'expert affiché sur la plateforme. Nous ne garantissons aucun dossier qui pourrait être conclu en dehors de l'application.
                    L'expert fournit un service clé en main avec la consitutution du dossier de cloture avec votre fournisseur d'énergie actuel, la création de votre dossier chez le nouveau fournisseur et la transition pour qu'il n'y ait pas de coupure. 
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
              <Button onClick={handleCharterSign} disabled={!acceptedCGU}>
                Signer la charte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
            <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sélection de l'expert en fournisseur d'énergie</DialogTitle>
              <DialogDescription>
                Choisissez un expert spécialisé pour votre audit des fournisseurs d'énergie
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {energyExperts.map((expert) => (
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
                      <p className="text-sm mt-2">{expert.description}</p>
                      <p className="text-sm text-gray-500">{expert.experience}</p>
                      <p className="text-sm text-gray-500">{expert.rating}</p>
                      <p className="text-sm text-gray-500">{expert.location}</p>
                      <p className="text-sm text-gray-500">Commission{expert.compensation} %  </p>
                    
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        location.push(`/expert/${expert.id}`);
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
};

export default Energetique1;