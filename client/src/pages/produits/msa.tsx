import { useLocation, useNavigate } from "react-router-dom";
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
import { useState, useEffect, useRef } from "react";
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
import { useParams } from "react-router-dom";
import { useAuditProgress } from "@/hooks/use-audit-progress";
import { get } from "@/lib/api";

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
};

const msaExperts: Expert[] = [
  {
    id: 1,
    name: "Henry Gervais",
    company: "AgriCompta Conseil",
    speciality: "Expert Audit MSA",
    experience: "15 ans d'expertise",
    compensation: 30, // % du succès
    rating: 4.8,
    location: "Paris",
    description: "Spécialiste des audits MSA pour les exploitations agricoles et les entreprises du secteur agricole."
  },
  {
    id: 2,
    name: "Eugène Colin",
    company: "MSA Optim",
    speciality: "Optimisation des cotisations MSA",
    experience: "12 ans d'expérience",
    compensation: 28, // % du succès
    rating: 4.6,
    location: "Marseilles",
    description: "Expert en optimisation des cotisations sociales et accompagnement des employeurs agricoles."
  },
  {
    id: 3,
    name: "Nathalie Lefèvre",
    company: "MSA Stratégie",
    speciality: "Planification et conformité MSA",
    experience: "20 ans d'expérience",
    compensation: 2500, // Montant fixe par audit
    rating: 4.9,
    location: "Lyon",
    description: "Accompagnement sur-mesure des grandes entreprises pour leur conformité MSA."
  },
  {
    id: 4,
    name: "Jean-Luc Bernard",
    company: "AgroFinance",
    speciality: "Fiscalité agricole et subventions",
    experience: "10 ans d'expérience",
    compensation: 25, // % du succès
    rating: 4.5,
    location: "Nantes",
    description: "Optimisation des subventions et avantages fiscaux pour les entreprises agricoles."
  },
  {
    id: 5,
    name: "Camille Roche",
    company: "EcoAudit",
    speciality: "Audit et transition écologique MSA",
    experience: "8 ans d'expérience",
    compensation: 2000, // Montant fixe par mission
    rating: 4.7,
    location: "Nice",
    description: "Spécialiste de la transition écologique et des crédits d'impôt pour les entreprises engagées."
  }
];

type DocumentItem = {
  id: string;
  label: string;
  uploadedFiles: { id: number; name: string }[];
};

const documentsList: DocumentItem[] = [
  { id: "payslips", label: "Bulletins de salaire (des trois dernières années)", uploadedFiles: [] },
  { id: "contracts", label: "Contrats de travail des salariés concernés", uploadedFiles: [] },
  { id: "conventions", label: "Conventions collectives applicables", uploadedFiles: [] },
  { id: "attestations", label: "Attestation de l'activité réelle des salariés", uploadedFiles: [] },
  { id: "expenses", label: "Justificatifs de frais professionnels remboursés", uploadedFiles: [] },
  { id: "dsn", label: "Déclarations sociales nominatives (DSN)", uploadedFiles: [] },
  { id: "register", label: "Registre unique du personnel", uploadedFiles: [] },
  { id: "urssaf", label: "Historique des cotisations URSSAF", uploadedFiles: [] },
  { id: "travel", label: "Justificatifs de déplacements professionnels", uploadedFiles: [] },
  { id: "kbis", label: "Extrait Kbis ou numéro SIREN/SIRET", uploadedFiles: [] },
  { id: "statuts", label: "Statuts de l'entreprise (si applicable)", uploadedFiles: [] },
  { id: "salariesList", label: "Liste des salariés avec numéros de Sécurité sociale", uploadedFiles: [] },
  { id: "duerp", label: "Document Unique d'Évaluation des Risques Professionnels (DUERP)", uploadedFiles: [] },
  { id: "workAccidents", label: "Registre des accidents du travail et maladies professionnelles", uploadedFiles: [] },
  { id: "medical", label: "Fiches de suivi médical des salariés (visites médicales)", uploadedFiles: [] },
  { id: "safetyTraining", label: "Justificatifs des formations obligatoires (sécurité, gestes et postures)", uploadedFiles: [] },
  { id: "compliance", label: "Attestation de conformité aux obligations sociales et fiscales", uploadedFiles: [] },
  { id: "fiscalDeclarations", label: "Déclarations de résultats et liasses fiscales", uploadedFiles: [] },
  { id: "accounting", label: "Grand livre comptable et balance générale", uploadedFiles: [] },
  { id: "financialStatements", label: "Comptes annuels (bilan, compte de résultat)", uploadedFiles: [] },
  { id: "socialAids", label: "Justificatifs des aides ou exonérations perçues", uploadedFiles: [] },
  { id: "agreements", label: "Éventuels accords d'entreprise ou décisions unilatérales", uploadedFiles: [] },
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

interface ApiResponse {
  success: boolean;
  data?: Expert[];
  error?: {
    message: string;
  };
}

const MSA = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await get<ApiResponse>('/experts?specialization=msa');
        if (response.success) {
          setExperts(response.data || []);
        } else {
          setError(response.error?.message || 'Erreur lors de la récupération des experts');
        }
      } catch (err) {
        setError('Erreur lors de la récupération des experts');
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Audit MSA</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experts.map((expert) => (
          <Card key={expert.id}>
          <CardHeader>
              <CardTitle>{expert.name}</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-gray-500">{expert.company}</p>
              <p className="text-sm">{expert.experience}</p>
              <p className="text-sm">Note: {expert.rating}/5</p>
              <p className="text-sm">Tarif: {expert.compensation}€/h</p>
              <p className="text-sm mt-2">{expert.description}</p>
              <div className="mt-4">
                <Button>Choisir cet expert</Button>
            </div>
          </CardContent>
        </Card>
                  ))}
                </div>
      </div>
  );
};

export default MSA;