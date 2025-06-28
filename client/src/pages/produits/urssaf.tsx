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
  { id: "dsn", label: "Déclarations sociales nominatives (DSN) - 12 derniers mois", uploadedFiles: [] },
  { id: "urssaf_certificates", label: "Attestations de paiement URSSAF", uploadedFiles: [] },
  { id: "payroll", label: "Bulletins de paie et registres du personnel", uploadedFiles: [] },
  { id: "contracts", label: "Contrats de travail et avenants", uploadedFiles: [] },
  { id: "social_agreements", label: "Accords collectifs et conventions", uploadedFiles: [] },
  { id: "accounting", label: "Relevés comptables et journaux de paie", uploadedFiles: [] },
  { id: "tax_returns", label: "Déclarations fiscales (TVA, IS, etc.)", uploadedFiles: [] },
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
    specializations: ["URSSAF", "TICPE"],
    company: "Cabinet Social Plus",
    description: "Expert reconnu en optimisation sociale avec une expertise particulière en URSSAF",
    location: "Paris",
    compensation: 15
  },
  {
    id: "2",
    name: "Marie Laurent",
    title: "Expert Principal",
    rating: 4.9,
    experience: "12 ans",
    specializations: ["URSSAF", "Social"],
    company: "Social Experts",
    description: "Spécialiste des questions sociales et URSSAF",
    location: "Lyon",
    compensation: 20
  },
  {
    id: "3",
    name: "Pierre Martin",
    title: "Expert Senior",
    rating: 4.7,
    experience: "10 ans",
    specializations: ["URSSAF", "CICE"],
    company: "Cabinet Martin & Associés",
    description: "Expert en crédits d'impôts et optimisations sociales",
    location: "Marseille",
    compensation: 18
  },
  {
    id: "4",
    name: "Sophie Dubois",
    title: "Expert Principal",
    rating: 4.9,
    experience: "18 ans",
    specializations: ["URSSAF", "CIR", "CICE"],
    company: "Dubois Consulting",
    description: "Consultante senior en fiscalité sociale et optimisation",
    location: "Bordeaux",
    compensation: 25
  },
  {
    id: "5",
    name: "Thomas Bernard",
    title: "Expert Senior",
    rating: 4.6,
    experience: "8 ans",
    specializations: ["URSSAF", "Social"],
    company: "Bernard Social",
    description: "Expert en fiscalité sociale et optimisations URSSAF",
    location: "Lille",
    compensation: 12
  }
];

export default function URSSAFPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Récupérer l'ID depuis les paramètres de route
  const clientProduitId = params.clientProduitId || params.uuid || params.id;
  
  console.log('🔍 Paramètres dans URSSAFPage:', params);
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
    
    setCurrentStep(newStep);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCharterSign = async () => {
    if (!acceptedCGU) {
      toast({
        title: "Conditions non acceptées",
        description: "Veuillez accepter les conditions générales d'utilisation.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signCharte();
      setShowCharterDialog(false);
      toast({
        title: "Charte signée",
        description: "Votre charte d'engagement a été validée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la signature de la charte.",
        variant: "destructive",
      });
    }
  };

  const handleExpertSelect = (expert: typeof demoExperts[0]) => {
    setTempSelectedExpert(expert);
    setShowExpertDialog(false);
    setSelectedExpert(expert);
    setCurrentStep(2);
    toast({
      title: "Expert sélectionné",
      description: `${expert.name} a été sélectionné pour votre audit URSSAF.`,
    });
  };

  const handleDocumentUpload = (docId: string, files: {id: number; name: string}[]) => {
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === docId 
          ? { ...doc, uploadedFiles: [...doc.uploadedFiles, ...files] }
          : doc
      )
    );
    
    toast({
      title: "Documents uploadés",
      description: `${files.length} document(s) ajouté(s) avec succès.`,
    });
  };

  const handleDeleteDocument = (docId: string, fileId: number) => {
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === docId 
          ? { ...doc, uploadedFiles: doc.uploadedFiles.filter(f => f.id !== fileId) }
          : doc
      )
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDownloadCharter = () => {
    // Logique de téléchargement de la charte
    toast({
      title: "Téléchargement",
      description: "La charte d'engagement a été téléchargée.",
    });
  };

  const handleConfirmAppointment = () => {
    if (selectedDate && selectedTime) {
      const formattedDate = format(selectedDate, 'dd/MM/yyyy', { locale: fr });
      setConfirmedDateTime(`${formattedDate} à ${selectedTime}`);
      setShowCalendarDialog(false);
      setCurrentStep(4);
      toast({
        title: "Rendez-vous confirmé",
        description: `Votre rendez-vous est programmé le ${formattedDate} à ${selectedTime}.`,
      });
    }
  };

  const totalUploadedFiles = uploadedDocuments.reduce((total, doc) => total + doc.uploadedFiles.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header avec navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Audit URSSAF</h1>
            <p className="text-gray-600">Optimisation de vos charges sociales et cotisations URSSAF</p>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Progression de votre audit</h2>
            <span className="text-sm text-gray-500">Étape {currentStep} sur 5</span>
          </div>
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <StepIndicator key={step} step={step} currentStep={currentStep} />
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Étape 1: Présentation */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Optimisation des Charges Sociales URSSAF</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold mb-4">Qu'est-ce qu'un audit URSSAF ?</h3>
                      <p className="text-gray-600 mb-4">
                        L'audit URSSAF est une analyse approfondie de vos cotisations sociales pour identifier 
                        les opportunités d'optimisation légales et réduire vos charges sociales. Notre expertise 
                        vous permet de bénéficier de tous les dispositifs d'allègement disponibles.
                      </p>
                      
                      <h3 className="text-lg font-semibold mb-4">Bénéfices de l'audit URSSAF</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Réduction des charges sociales de 15% à 30% en moyenne</li>
                        <li>• Identification des dispositifs d'allègement applicables</li>
                        <li>• Optimisation de la structure salariale</li>
                        <li>• Mise en conformité avec la réglementation</li>
                        <li>• Accompagnement dans la mise en œuvre</li>
                      </ul>

                      <h3 className="text-lg font-semibold mb-4">Notre méthodologie</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">1. Analyse</h4>
                          <p className="text-blue-700 text-sm">Étude approfondie de vos documents sociaux et fiscaux</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">2. Identification</h4>
                          <p className="text-green-700 text-sm">Repérage des opportunités d'optimisation</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-900 mb-2">3. Recommandations</h4>
                          <p className="text-purple-700 text-sm">Préconisations personnalisées et chiffrées</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-orange-900 mb-2">4. Accompagnement</h4>
                          <p className="text-orange-700 text-sm">Mise en œuvre et suivi des optimisations</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => handleStepChange(2)}>
                        Commencer l'audit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 2: Sélection d'expert */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Sélection de votre expert URSSAF</CardTitle>
                    <p className="text-gray-600">
                      Choisissez l'expert qui vous accompagnera dans votre audit d'optimisation des charges sociales
                    </p>
                  </CardHeader>
                  <CardContent>
                    {selectedExpert ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <UserCog className="w-8 h-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-green-900">{selectedExpert.name}</h3>
                            <p className="text-green-700">{selectedExpert.title} - {selectedExpert.company}</p>
                            <p className="text-sm text-green-600">{selectedExpert.experience} d'expérience</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600">
                              <span className="font-semibold">{selectedExpert.rating}</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-green-600">{selectedExpert.compensation}% de commission</p>
                          </div>
                        </div>
                        <p className="mt-4 text-green-700">{selectedExpert.description}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Aucun expert sélectionné</p>
                        <Button onClick={() => setShowExpertDialog(true)}>
                          Choisir un expert
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 3: Upload de documents */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Documents requis pour l'audit URSSAF</CardTitle>
                    <p className="text-gray-600">
                      Uploadez les documents nécessaires à l'analyse de vos charges sociales
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uploadedDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{doc.label}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDocumentUpload(doc.id, [{ id: Date.now(), name: `document_${doc.id}.pdf` }])}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Ajouter
                            </Button>
                          </div>
                          {doc.uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                              {doc.uploadedFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <span className="text-sm">{file.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id, file.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 4: Planification */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Planification de votre audit URSSAF</CardTitle>
                    <p className="text-gray-600">
                      Choisissez la date et l'heure de votre rendez-vous avec l'expert
                    </p>
                  </CardHeader>
                  <CardContent>
                    {confirmedDateTime ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Rendez-vous confirmé</h3>
                        <p className="text-green-700">{confirmedDateTime}</p>
                        <p className="text-sm text-green-600 mt-2">
                          Un email de confirmation vous a été envoyé
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Aucun rendez-vous programmé</p>
                        <Button onClick={() => setShowCalendarDialog(true)}>
                          Programmer un rendez-vous
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 5: Rapport */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Rapport d'Audit URSSAF</CardTitle>
                    <p className="text-sm text-gray-500">Réf: URSSAF-2024-{Math.floor(Math.random() * 10000)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold mb-4">Résumé exécutif</h3>
                      <p className="text-gray-600 mb-6">
                        L'audit de vos charges sociales a révélé plusieurs opportunités d'optimisation 
                        permettant une réduction significative de vos cotisations URSSAF tout en respectant 
                        la réglementation en vigueur.
                      </p>

                      <h3 className="text-lg font-semibold mb-4">Opportunités identifiées</h3>
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900">1. Allègement Fillon</h4>
                          <p className="text-blue-700 text-sm">
                            Optimisation possible sur 12 postes pour un gain estimé de 8 500€/an
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-900">2. Réduction générale des cotisations</h4>
                          <p className="text-green-700 text-sm">
                            Application du taux réduit sur les bas salaires : 3 200€/an
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-900">3. Optimisation de la structure</h4>
                          <p className="text-purple-700 text-sm">
                            Réorganisation des contrats : 2 800€/an
                          </p>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mt-6 mb-4">Gain total estimé</h3>
                      <div className="bg-green-100 border border-green-200 rounded-lg p-6 text-center">
                        <p className="text-2xl font-bold text-green-800">14 500€/an</p>
                        <p className="text-green-600">Soit une réduction de 18% de vos charges sociales</p>
                      </div>

                      <h3 className="text-lg font-semibold mt-6 mb-4">Plan d'action recommandé</h3>
                      <ol className="space-y-2 text-gray-600">
                        <li>1. Mise en place de l'allègement Fillon sur les postes éligibles</li>
                        <li>2. Application des taux réduits sur les bas salaires</li>
                        <li>3. Optimisation de la structure des contrats</li>
                        <li>4. Formation des équipes sur la gestion URSSAF</li>
                        <li>5. Mise en place d'un suivi mensuel des optimisations</li>
                      </ol>

                      <h3 className="text-lg font-semibold mt-6 mb-4">Détail des économies</h3>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Allègement Fillon : 8 500€/an</li>
                        <li>• Réduction générale : 3 200€/an</li>
                        <li>• Optimisation structure : 2 800€/an</li>
                        <li>• <strong>Total : 14 500€/an</strong></li>
                      </ul>

                      <p className="mt-6 text-gray-600">
                        La mise en place des recommandations permettra d'optimiser vos charges sociales 
                        sur les prochaines années, avec un retour sur investissement immédiat.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Progression */}
            <Card>
              <CardHeader>
                <CardTitle>Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Documents uploadés</span>
                    <span>{totalUploadedFiles}/9</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(totalUploadedFiles / 9) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation des étapes */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <Button
                      key={step}
                      variant={currentStep === step ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleStepChange(step)}
                      disabled={step > currentStep}
                    >
                      Étape {step}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informations rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Audit personnalisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Expert certifié</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Gain garanti</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Accompagnement complet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog Charte */}
      <Dialog open={showCharterDialog} onOpenChange={setShowCharterDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Charte de l'Audit URSSAF</DialogTitle>
            <DialogDescription>
              Cette charte définit les engagements mutuels entre le client et l'expert URSSAF dans le cadre de l'audit relatif à l'optimisation des charges sociales et cotisations URSSAF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold">1. Objet de l'Audit URSSAF</h4>
              <p className="text-sm text-gray-600">
                L'audit a pour objet d'analyser les cotisations sociales de l'entreprise afin d'identifier 
                les opportunités d'optimisation légales et de proposer des solutions pour réduire les charges sociales.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold">2. Engagements de l'Expert</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Analyser minutieusement les documents fournis pour optimiser les charges sociales.</li>
                <li>• Proposer uniquement des solutions conformes à la réglementation URSSAF.</li>
                <li>• Fournir un rapport détaillé avec les recommandations chiffrées.</li>
                <li>• Accompagner la mise en œuvre des optimisations identifiées.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold">3. Engagements du Client</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fournir tous les documents demandés dans les délais impartis.</li>
                <li>• Participer activement aux échanges avec l'expert.</li>
                <li>• Respecter les recommandations proposées dans le cadre légal.</li>
                <li>• Informer l'expert de tout changement significatif.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold">4. Modalités de Récupération URSSAF</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Les optimisations seront appliquées selon le calendrier URSSAF.</li>
                <li>• Les gains seront visibles sur les prochaines déclarations sociales.</li>
                <li>• Un suivi mensuel sera mis en place pour vérifier les économies.</li>
                <li>• L'expert restera disponible pour toute question post-audit.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-md font-semibold">5. Confidentialité</h4>
              <p className="text-sm text-gray-600">
                Toutes les informations échangées dans le cadre de cet audit sont strictement confidentielles 
                et ne seront utilisées que dans le but de l'optimisation des charges sociales.
              </p>
            </div>

            <div>
              <h4 className="text-md font-semibold">6. Commission</h4>
              <p className="text-sm text-gray-600">
                La commission de l'expert est fixée à {selectedExpert?.compensation || 15}% des gains réalisés 
                sur la première année d'application des optimisations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="cgu"
              checked={acceptedCGU}
              onCheckedChange={(checked) => setAcceptedCGU(checked as boolean)}
            />
            <label htmlFor="cgu" className="text-sm">
              J'accepte les conditions générales d'utilisation et la charte d'engagement
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCharterDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCharterSign} disabled={!acceptedCGU || isCharterSigning}>
              {isCharterSigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4 mr-2" />
                  Signer la charte
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Sélection Expert */}
      <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélection de l'expert URSSAF</DialogTitle>
            <DialogDescription>
              Choisissez un expert spécialisé en URSSAF pour votre audit
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoExperts.map((expert) => (
              <Card 
                key={expert.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleExpertSelect(expert)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{expert.name}</CardTitle>
                      <p className="text-sm text-gray-600">{expert.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{expert.rating}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-xs text-gray-500">{expert.experience}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{expert.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{expert.company}</span>
                    <span className="font-semibold text-blue-600">{expert.compensation}% commission</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Calendrier */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programmer votre rendez-vous</DialogTitle>
            <DialogDescription>
              Choisissez la date et l'heure de votre audit URSSAF
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
            
            {selectedDate && (
              <div>
                <label className="text-sm font-medium">Heure</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {getTimeSlots().map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmAppointment}
              disabled={!selectedDate || !selectedTime}
            >
              Confirmer le rendez-vous
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 