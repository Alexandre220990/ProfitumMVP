import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Clock,
  CreditCard,
  FileSignature,
  Loader2,
  FileText,
  CalendarDays,
  Handshake
} from 'lucide-react';

import ProductUploadInline from './ProductUploadInline';
import ExpertSelectionModal from './ExpertSelectionModal';
import EligibilityValidationStatus from './EligibilityValidationStatus';
import ClientDocumentUploadComplementary from './client/ClientDocumentUploadComplementary';
import ClientStep3DocumentCollection from './client/ClientStep3DocumentCollection';
import AuditValidationModal from './client/AuditValidationModal';
import InvoiceDisplay from './client/InvoiceDisplay';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import { useDossierNotifications } from '@/hooks/useDossierNotifications';
import { get, post } from '@/lib/api';
import { getProductConfig} from '@/config/productWorkflowConfigs';
import { config } from '@/config/env';
import CharterDialog from '@/components/CharterDialog';
import { Checkbox } from '@/components/ui/checkbox';
import InitialChecksWizard from '@/components/simplified-products/InitialChecksWizard';
import QuotePanel from '@/components/simplified-products/QuotePanel';

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
  montantFinal?: number;
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
  const [editingInitialChecks, setEditingInitialChecks] = useState(false);
  
  // États modal validation audit
  const [showAuditValidationModal, setShowAuditValidationModal] = useState(false);
  
  // État facture Profitum
  const [invoice, setInvoice] = useState<any>(null);

  // Gestion charte commerciale
  const [showCharterDialog, setShowCharterDialog] = useState(false);
  const [charterRead, setCharterRead] = useState(false);
  const [charterSigning, setCharterSigning] = useState(false);
  const [charterAgreements, setCharterAgreements] = useState({
    cgu: false,
    cgv: false,
    contract: false
  });
  const allCharterAgreementsAccepted = charterAgreements.cgu && charterAgreements.cgv && charterAgreements.contract;
const isSimplifiedProductKey =
  productKey === 'chronotachygraphes' ||
  productKey === 'logiciel_solid' ||
  productKey === 'optimisation_fournisseur_electricite' ||
  productKey === 'optimisation_fournisseur_gaz';
const autoAssignAttemptedRef = useRef(false);
const partnerRequestAttemptedRef = useRef(false);

  // Hook pour les étapes du dossier
  const {
    steps,
    loading: stepsLoading,
    generateSteps,
    overallProgress
  } = useDossierSteps(clientProduitId);

  // Hook pour les notifications en temps réel
  const { getDossierNotifications } = useDossierNotifications();

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '—';
    }
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Définir les étapes du workflow depuis la config
  const workflowSteps = productConfig.workflowSteps;
  const currentDossierStatus = clientProduit?.statut || '';
  const isCharterPending = currentDossierStatus === 'charte_pending';
  const isCharterSigned = currentDossierStatus === 'charte_signed';

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

  // Charger la facture Profitum si générée
  const loadInvoice = useCallback(async () => {
    try {
      const response = await get(`/api/client/dossier/${clientProduitId}/invoice`);
      
      if (response.success && response.data) {
        setInvoice(response.data);
        console.log('🧾 Facture Profitum chargée:', response.data);
      }
    } catch (error) {
      console.error('⚠️ Erreur chargement facture (non bloquant):', error);
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
        
        const statut = produitData.statut || '';
        const adminStatus = produitData.admin_eligibility_status || 'pending';

        const adminValidatedStatuses = new Set([
          'eligibility_validated',
          'admin_validated',
          'expert_selection',
          'expert_pending_acceptance',
          'expert_assigned',
          'expert_pending_validation',
          'expert_validated',
          'charte_pending',
          'charte_signed',
          'documents_manquants',
          'documents_requested',
          'complementary_documents_upload_pending',
          'complementary_documents_sent',
          'complementary_documents_validated',
          'complementary_documents_refused',
          'audit_in_progress',
          'audit_completed',
          'validated',
          'validation_finale',
          'demande_remboursement',
          'soumis_administration',
          'pending_result',
          'resultat_obtenu',
          'implementation_in_progress',
          'implementation_validated',
          'payment_requested',
          'payment_in_progress',
          'refund_completed',
          'signed'
        ]);

        const adminRejectedStatuses = new Set([
          'eligibility_rejected',
          'admin_rejected'
        ]);

        const isAdminValidated = adminStatus === 'validated' || adminValidatedStatuses.has(statut);
        const isAdminRejected = adminStatus === 'rejected' || adminRejectedStatuses.has(statut);

        let nextStep = Math.max(1, produitData.current_step || 1);
        let eligibilityUnlocked = false;

        if (isAdminRejected) {
          console.log('❌ DIAGNOSTIC: Éligibilité rejetée par admin → retour étape 1');
          eligibilityUnlocked = false;
          nextStep = 1;
        } else if (statut === 'documents_manquants') {
          console.log('📄 DIAGNOSTIC: Documents complémentaires requis → étape minimale 3');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 3);
        } else if (isAdminValidated) {
          console.log('✅ DIAGNOSTIC: Validation admin détectée → déblocage étape 2');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 2);
        } else if (statut === 'expert_pending_validation' || statut === 'expert_assigned') {
          console.log('👥 DIAGNOSTIC: Attente validation expert → étape 2 minimum');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 2);
        } else if (statut === 'expert_validated' || statut === 'charte_pending' || statut === 'charte_signed') {
          console.log('📄 DIAGNOSTIC: Étape charte / expert validé → étape minimale 3');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 3);
        } else if (statut.startsWith('complementary_documents')) {
          console.log('📎 DIAGNOSTIC: Boucle documents complémentaires → étape minimale 3');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 3);
        } else if (['audit_in_progress', 'audit_completed', 'validated'].includes(statut)) {
          console.log('🧪 DIAGNOSTIC: Phase audit → étape minimale 4');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 4);
        } else if (['implementation_in_progress', 'implementation_validated', 'soumis_administration', 'pending_result', 'resultat_obtenu'].includes(statut)) {
          console.log('🏛️ DIAGNOSTIC: Phase mise en œuvre administration → étape minimale 5');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 5);
        } else if (['payment_requested', 'payment_in_progress', 'refund_completed', 'completed'].includes(statut)) {
          console.log('💶 DIAGNOSTIC: Phase paiement → étape minimale 6');
          eligibilityUnlocked = true;
          nextStep = Math.max(nextStep, 6);
        } else if (statut === 'eligible' || statut === 'opportunité' || statut === 'pending_admin_validation') {
          console.log('📝 DIAGNOSTIC: Statut initial → étape 1');
          eligibilityUnlocked = false;
          nextStep = 1;
        } else {
          console.log('⏳ DIAGNOSTIC: Statut inchangé → conservation étape actuelle', {
            statut,
            adminStatus,
            nextStep
          });
        }

        setEligibilityValidated(eligibilityUnlocked);
        setCurrentStep(Math.max(1, nextStep));

        // Si un expert est déjà assigné ou en attente d'acceptation, le définir
        if ((produitData.expert_id || produitData.expert_pending_id) && produitData.Expert) {
          const expertRelation: any = Array.isArray(produitData.Expert)
            ? produitData.Expert[0]
            : produitData.Expert;

          if (expertRelation) {
            const expertName =
              expertRelation.name ||
              [expertRelation.first_name, expertRelation.last_name].filter(Boolean).join(' ') ||
              expertRelation.email ||
              'Expert';
            console.log('👨‍💼 DIAGNOSTIC: Expert déjà assigné:', expertName);
          setSelectedExpert({
              ...expertRelation,
              name: expertName,
              specialites: expertRelation.specialites || expertRelation.specializations || [],
              experience_years: expertRelation.experience_years || expertRelation.experienceYears || 0,
              rating: expertRelation.rating || 0
            });
          }
          // ✅ Marquer comme confirmé si expert assigné
          setExpertConfirmed(true);
          setTempSelectedExpert(null); // Pas d'expert temporaire
          autoAssignAttemptedRef.current = true;
        } else if (!produitData.expert_id) {
          autoAssignAttemptedRef.current = false;
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
      loadInvoice(); // ✅ Charger la facture Profitum
    }
  }, [clientProduitId, loadClientProduit, loadDocumentRequest, loadInvoice, productKey]);

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

  const autoAssignDistributorExpert = useCallback(async (): Promise<boolean> => {
    if (autoAssignAttemptedRef.current) {
      return Boolean(clientProduit?.expert_id);
    }

    autoAssignAttemptedRef.current = true;
    try {
      const response = await post(`/api/simplified-products/${clientProduitId}/assign-expert`);
      if (response.success) {
        console.log('🤖 Expert distributeur assigné automatiquement');
        await loadClientProduit();
        return true;
      }
      console.warn(`⚠️ Impossible d'assigner automatiquement l'expert: ${response.message}`);
      autoAssignAttemptedRef.current = false;
      return false;
    } catch (error) {
      console.error('❌ Erreur assignation auto expert:', error);
      autoAssignAttemptedRef.current = false;
      return false;
    }
  }, [clientProduit?.expert_id, clientProduitId, loadClientProduit]);

  const ensurePartnerRequest = useCallback(async () => {
    if (partnerRequestAttemptedRef.current) {
      return;
    }
    partnerRequestAttemptedRef.current = true;

    try {
      const response = await post<{ alreadyRequested?: boolean; requested_at?: string }>(
        `/api/simplified-products/${clientProduitId}/partner-request`,
        {}
      );

      if (response.success) {
        const alreadyRequested = response.data?.alreadyRequested;
        if (alreadyRequested) {
          console.log('ℹ️ Demande de devis déjà enregistrée auprès du partenaire');
        } else {
            toast.success("✅ Demande de devis transmise à l'expert distributeur");
        }
        await loadClientProduit();
        setCurrentStep(3);
      } else {
        toast.error(response.message || 'Erreur lors de la demande de devis');
        partnerRequestAttemptedRef.current = false;
      }
    } catch (error) {
      console.error('❌ Erreur envoi demande devis:', error);
      toast.error('Impossible d'envoyer la demande de devis pour le moment.');
    } finally {
      partnerRequestAttemptedRef.current = false;
    }
  }, [clientProduitId, loadClientProduit]);

  const handleSimplifiedInitialChecksComplete = useCallback(async (_payload: Record<string, any>) => {
    partnerRequestAttemptedRef.current = false;
    await loadClientProduit();
    setCurrentStep(2);
    setEditingInitialChecks(false);
  }, [loadClientProduit]);

  const handleSubmitQuoteRequest = useCallback(async () => {
    const assigned = await autoAssignDistributorExpert();
    if (!assigned) {
      toast.error("Impossible d'assigner l'expert distributeur pour le moment. Réessayez plus tard.");
      return;
    }

    await ensurePartnerRequest();
  }, [autoAssignDistributorExpert, ensurePartnerRequest]);

  useEffect(() => {
    if (!isSimplifiedProductKey || !clientProduit) {
      return;
    }

    const metadata: any = clientProduit.metadata || {};
    const checklistKey = `${productKey}_checklist`;
    const checklistData = metadata[checklistKey];
    const checklistCompleted = Boolean(checklistData?.validated_at);

    if (checklistCompleted) {
      setCurrentStep((prev) => Math.max(prev, 2));
    }
  }, [clientProduit, productKey, isSimplifiedProductKey]);

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

  useEffect(() => {
    if (!clientProduit) {
      return;
    }

    if (clientProduit.statut === 'charte_pending') {
      setCharterAgreements({ cgu: false, cgv: false, contract: false });
      setCharterRead(false);
      setCharterSigning(false);
    } else if (clientProduit.statut === 'charte_signed') {
      setShowCharterDialog(false);
      setCharterSigning(false);
    }
  }, [clientProduit]);

  const simplifiedState = useMemo(() => {
    if (!isSimplifiedProductKey || !clientProduit) {
      return null;
    }

    const metadata: any = clientProduit.metadata || {};
    const checklistKey = `${productKey}_checklist`;
    const checklist = metadata[checklistKey] || {};
    const partnerRequest = metadata.partner_request || {};
    const devis = metadata.devis || {};
    const facture = metadata.facture || {};

    const checklistCompleted = Boolean(checklist.validated_at);
    const quoteRequested = Boolean(partnerRequest.requested_at);
    const quoteAvailable = Boolean(devis.proposed_at || devis.status);
    const quoteAccepted = devis.status === 'accepted';
    const invoiceStatus = facture.status || '';
    const invoiceIssued = invoiceStatus === 'issued';
    const invoicePaid = invoiceStatus === 'paid';

    let activeStep = 1;
    if (invoicePaid) {
      activeStep = 5;
    } else if (quoteAccepted || invoiceIssued) {
      activeStep = 5;
    } else if (quoteAvailable) {
      activeStep = 4;
    } else if (quoteRequested) {
      activeStep = 3;
    } else if (checklistCompleted) {
      activeStep = 2;
    }

    const steps = (productConfig.workflowSteps || []).map((step) => {
      let status: 'pending' | 'in_progress' | 'completed' | 'overdue' = 'pending';

      switch (step.id) {
        case 1:
          status = checklistCompleted ? 'completed' : 'in_progress';
          break;
        case 2:
          status = quoteRequested ? 'completed' : checklistCompleted ? 'in_progress' : 'pending';
          break;
        case 3:
          status = quoteAvailable ? 'completed' : quoteRequested ? 'in_progress' : 'pending';
          break;
        case 4:
          status = quoteAccepted ? 'completed' : quoteAvailable ? 'in_progress' : 'pending';
          break;
        case 5: {
          const isChrono = productKey === 'chronotachygraphes';
          status = invoicePaid ? 'completed' : (quoteAccepted || invoiceIssued) ? 'in_progress' : 'pending';

          return {
            ...step,
            name: isChrono ? 'Facturation & installation' : 'Facturation & déploiement',
            status
          };
        }
        default:
          break;
      }

      return { ...step, status };
    });

    return {
      steps,
      activeStep,
      checklist,
      partnerRequest,
      devis,
      facture,
      checklistCompleted,
      quoteRequested,
      quoteAvailable,
      quoteAccepted,
      invoiceIssued,
      invoicePaid
    };
  }, [clientProduit, isSimplifiedProductKey, productKey, productConfig]);

  const updateWorkflowSteps = useCallback(() => {
    if (isSimplifiedProductKey) {
      if (simplifiedState) {
        setCalculatedSteps(simplifiedState.steps);
      }
      return;
    }

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
        case 3: { // Collecte des documents
          const stepRecord = steps.find(s => s.step_name === 'Collecte des documents');

          if (stepRecord) {
            if (stepRecord.status === 'completed') {
              status = 'completed';
            } else if (stepRecord.status === 'in_progress' || stepRecord.status === 'overdue') {
              status = 'in_progress';
            } else {
              status = 'pending';
            }
          } else if (clientProduit?.statut === 'documents_manquants' || clientProduit?.metadata?.documents_missing) {
            status = 'in_progress';
          } else if (selectedExpert || currentStep >= 3) {
            status = 'completed';
          }
          break;
        }
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
  }, [steps, documents, selectedExpert, eligibilityValidated, workflowSteps, clientProduit, simplifiedState, isSimplifiedProductKey]);

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

  const handleCharterAgreementChange = useCallback(
    (key: 'cgu' | 'cgv' | 'contract') => (value: boolean | "indeterminate") => {
      setCharterAgreements(prev => ({
        ...prev,
        [key]: value === true
      }));
    },
    []
  );

  const handleOpenCharterDialog = useCallback(() => {
    setCharterRead(false);
    setShowCharterDialog(true);
  }, []);

  const handleCharterScrollEnd = useCallback(() => {
    setCharterRead(true);
  }, []);

  const handleSignCharter = useCallback(async () => {
    if (!charterRead) {
      toast.error('Veuillez lire la charte jusqu\'au bout avant de signer.');
      return;
    }

    if (!allCharterAgreementsAccepted) {
      toast.error('Merci d\'accepter toutes les conditions pour signer la charte.');
      return;
    }

    setCharterSigning(true);
    try {
      const response = await post('/api/dossier-steps/charte/sign', {
        dossier_id: clientProduitId,
        accept_terms: true
      });

      if (response.success) {
        toast.success('✍️ Charte signée avec succès !');
        setCharterAgreements({ cgu: false, cgv: false, contract: false });
        setCharterRead(false);
        setShowCharterDialog(false);
        loadClientProduit();
      } else {
        toast.error(response.message || 'Erreur lors de la signature de la charte');
      }
    } catch (error) {
      console.error('❌ Erreur signature charte:', error);
      toast.error('Erreur lors de la signature de la charte');
    } finally {
      setCharterSigning(false);
    }
  }, [allCharterAgreementsAccepted, charterRead, clientProduitId, loadClientProduit]);

  const renderCharterPendingCard = () => (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <FileSignature className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">
              Signature de la charte commerciale requise
            </h4>
            <p className="text-sm text-amber-800">
              Avant de lancer l'audit, merci de lire et d'accepter la charte commerciale contractuelle.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleOpenCharterDialog}
            className="flex-1 border-amber-200 text-amber-900 hover:bg-amber-100"
          >
            <FileSignature className="w-4 h-4 mr-2" />
            Lire la charte complète
          </Button>
          <Button
            onClick={handleSignCharter}
            disabled={charterSigning || !charterRead || !allCharterAgreementsAccepted}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {charterSigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signature en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Signer la charte
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id={`charter-cgu-${clientProduitId}`}
              checked={charterAgreements.cgu}
              onCheckedChange={handleCharterAgreementChange('cgu')}
            />
            <label
              htmlFor={`charter-cgu-${clientProduitId}`}
              className="text-sm text-amber-900 leading-relaxed"
            >
              J'accepte les Conditions Générales d'Utilisation (CGU)
            </label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id={`charter-cgv-${clientProduitId}`}
              checked={charterAgreements.cgv}
              onCheckedChange={handleCharterAgreementChange('cgv')}
            />
            <label
              htmlFor={`charter-cgv-${clientProduitId}`}
              className="text-sm text-amber-900 leading-relaxed"
            >
              J'accepte les Conditions Générales de Vente (CGV)
            </label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id={`charter-contract-${clientProduitId}`}
              checked={charterAgreements.contract}
              onCheckedChange={handleCharterAgreementChange('contract')}
            />
            <label
              htmlFor={`charter-contract-${clientProduitId}`}
              className="text-sm text-amber-900 leading-relaxed"
            >
              Je confirme le contrat d'application avec l'expert sélectionné
            </label>
          </div>
        </div>

        {!charterRead && (
          <p className="text-xs text-amber-700">
            Faites défiler la charte jusqu'en bas pour activer la signature.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderCharterSignedCard = () => (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 mb-1">
              Charte signée
            </h4>
            <p className="text-sm text-green-800">
              Merci ! Votre charte commerciale est validée. Votre expert peut désormais lancer l'audit.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFinalRecapCard = () => {
    if (!clientProduit) return null;

    const metadata: any = clientProduit.metadata || {};
    const implementationInfo = metadata.implementation || {};
    const paymentInfo = metadata.payment || {};
    const auditInfo = metadata.audit_result || {};
    const commissionInfo = metadata.commission_conditions_accepted || {};
    const expertAcceptance = metadata.expert_acceptance || {};
    const administrationResult = metadata.administration_result || {};
    const clientValidation = metadata.client_validation || {};

    const refundAmount: number | null =
      implementationInfo.refund_amount ??
      metadata.montant_reel_recu ??
      clientProduit.montantFinal ??
      estimatedAmount ??
      null;

    const refundDate: string | undefined =
      implementationInfo.refund_date ||
      paymentInfo.refund_date ||
      implementationInfo.validated_at;

    const paymentStatusRaw: string =
      paymentInfo.status ||
      (clientProduit.statut === 'refund_completed' ? 'completed' : clientProduit.statut || '');
    const normalizedPaymentStatus = paymentStatusRaw.toLowerCase();
    const isPaymentCompleted = normalizedPaymentStatus === 'completed' || clientProduit.statut === 'refund_completed';

    const paymentStatusLabel = isPaymentCompleted ? 'Paiement confirmé' : 'Paiement en cours';
    const paymentBadgeClass = isPaymentCompleted
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-blue-100 text-blue-700 border-blue-200';
    const paymentDescription = isPaymentCompleted
      ? 'Votre remboursement et la commission expert sont réglés. Le dossier est clôturé.'
      : 'Le remboursement est confirmé. La validation comptable du paiement de la commission expert reste en cours.';

    const clientFeePercentage =
      commissionInfo.client_fee_percentage !== undefined && commissionInfo.client_fee_percentage !== null
        ? Number(commissionInfo.client_fee_percentage)
        : null;

    const expertFee =
      commissionInfo.expert_total_fee ??
      (clientFeePercentage != null && refundAmount != null ? refundAmount * clientFeePercentage : null);
    const expertName = clientProduit.Expert?.name || commissionInfo.expert_name || expertAcceptance.expert_name;

    const timelineEntries = [
      expertAcceptance.accepted_at && {
        label: 'Expert confirmé',
        date: expertAcceptance.accepted_at,
        detail: expertName
      },
      auditInfo.completed_at && {
        label: 'Audit finalisé',
        date: auditInfo.completed_at,
        detail: auditInfo.montant_final ? `Montant final ${formatCurrency(auditInfo.montant_final)}` : undefined
      },
      clientValidation.validated_at && {
        label: 'Validation client',
        date: clientValidation.validated_at,
        detail: 'Conditions commission acceptées'
      },
      (implementationInfo.validated_at || administrationResult.date_retour) && {
        label: 'Décision administration',
        date: implementationInfo.validated_at || administrationResult.date_retour,
        detail: administrationResult.decision ? `Décision : ${administrationResult.decision}` : undefined
      },
      refundDate && {
        label: 'Remboursement reçu',
        date: refundDate,
        detail: implementationInfo.refund_reference ? `Réf. ${implementationInfo.refund_reference}` : undefined
      },
      (paymentInfo.completed_at || paymentInfo.paiement_date) && {
        label: 'Paiement commission expert',
        date: paymentInfo.completed_at || paymentInfo.paiement_date,
        detail: paymentInfo.payment_reference || paymentInfo.invoice?.number || invoice?.invoice_number
      }
    ].filter(Boolean) as Array<{ label: string; date: string; detail?: string }>;

    return (
      <div className="space-y-6">
        <Card className="max-w-4xl mx-auto border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaymentCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                {isPaymentCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Clock className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Synthèse finale du dossier
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {paymentDescription}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs font-semibold tracking-wide ${paymentBadgeClass}`}>
              {paymentStatusLabel}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-green-200 bg-white/80 p-4">
                <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Montant remboursé</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(refundAmount)}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {formatDate(refundDate)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
                <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Commission expert TTC</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(expertFee)}</p>
                {clientFeePercentage != null && !Number.isNaN(clientFeePercentage) && (
                <p className="mt-2 text-xs text-gray-500">
                    Taux appliqué&nbsp;: {(clientFeePercentage * 100).toFixed(0)}%
                </p>
                )}
              </div>
              <div className="rounded-xl border border-blue-200 bg-white/80 p-4">
                <p className="text-xs uppercase text-gray-500 tracking-wide mb-1">Référence dossier</p>
                <p className="text-sm font-semibold text-blue-800 break-all">{implementationInfo.reference || paymentInfo.payment_reference || '—'}</p>
                {paymentInfo.completed_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    Dernière mise à jour : {formatDate(paymentInfo.completed_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Informations remboursement</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Organisme</dt>
                    <dd className="font-medium text-gray-900">
                      {implementationInfo.organisme || 'Administration compétente'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Décision</dt>
                    <dd className="font-medium text-gray-900">
                      {administrationResult.decision ? administrationResult.decision.toUpperCase() : 'Validé'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Référence remboursement</dt>
                    <dd className="font-medium text-gray-900 break-all">
                      {implementationInfo.refund_reference || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Date de validation</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(implementationInfo.validated_at || administrationResult.date_retour)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Audit & conditions</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Expert référent</dt>
                    <dd className="font-medium text-gray-900">{expertName || '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Montant audit validé</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(auditInfo.montant_final)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Commission expert (%)</dt>
                    <dd className="font-medium text-gray-900">
                      {clientFeePercentage != null && !Number.isNaN(clientFeePercentage)
                        ? `${(clientFeePercentage * 100).toFixed(0)}%`
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Commission expert</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(expertFee)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {timelineEntries.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Moments clés</h4>
                <div className="space-y-3">
                  {timelineEntries.map((entry, index) => (
                    <div key={`${entry.label}-${index}`} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.label}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(entry.date)}
                          {entry.detail && ` • ${entry.detail}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {auditInfo.rapport_url && (
                <Button
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-100"
                  asChild
                >
                  <a href={auditInfo.rapport_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Consulter le rapport d'audit
                  </a>
                </Button>
              )}

              {implementationInfo.reference && (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  Réf. DGDDI&nbsp;: {implementationInfo.reference}
                </Badge>
              )}

              {paymentInfo.payment_reference && (
                <Badge className="border-purple-200 bg-purple-50 text-purple-700">
                  Commission expert&nbsp;: {paymentInfo.payment_reference}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {invoice && (
          <div className="max-w-4xl mx-auto">
            <InvoiceDisplay
              invoice={invoice}
              dossierId={clientProduitId}
              showConfirmPayment={!isPaymentCompleted}
              showPaymentOptions={!isPaymentCompleted}
              onPaymentConfirmed={() => {
                loadClientProduit();
                loadInvoice();
                toast.success('🎉 Paiement confirmé ! Merci pour votre règlement.');
              }}
            />
          </div>
        )}
      </div>
    );
  };

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

  const renderSimplifiedWorkflow = () => {
    if (!simplifiedState) {
      return null;
    }

    const metadata = clientProduit?.metadata || {};
    const {
      checklist,
      devis,
      facture,
      partnerRequest,
      checklistCompleted,
      quoteRequested,
      quoteAvailable,
      quoteAccepted,
      invoiceIssued,
      invoicePaid
    } = simplifiedState;

    const simulationSnapshot =
      metadata.simulation_answers ||
      metadata.simulation ||
      metadata.simulation_summary ||
      metadata.simulation_result ||
      metadata.simulation_resume ||
      {};

    const nbChauffeursFromSimulation =
      simulationSnapshot.nb_chauffeurs ??
      simulationSnapshot.nbChauffeurs ??
      simulationSnapshot.answers?.nb_chauffeurs ??
      simulationSnapshot.answers?.CALCUL_DFS_CHAUFFEURS ??
      null;

    const partnerName =
      productKey === 'chronotachygraphes'
        ? 'SDEI'
        : productKey === 'logiciel_solid'
          ? 'Solid'
          : productKey === 'optimisation_fournisseur_electricite'
            ? 'Expert électricité'
            : 'Expert gaz';

    const renderSummary = () => {
      const blocks: React.ReactNode[] = [];

      if (checklistCompleted) {
        if (productKey === 'logiciel_solid') {
          const chauffeursConfirmes =
            checklist.chauffeurs_confirmes ??
            checklist.nb_chauffeurs ??
            checklist.nb_utilisateurs ??
            '—';
          const chauffeursEstimes =
            checklist.chauffeurs_estimes ??
            checklist.nb_chauffeurs ??
            checklist.nb_utilisateurs ??
            chauffeursConfirmes;
          const benefits = [
            'Conformité et sécurité lors des contrôles',
            'Gain de temps sur la préparation des fiches de paie',
            'Optimisation des charges : le service s'auto-finance',
            'Logiciel reconnu par l'inspection du travail'
          ];

          blocks.push(
            <div
              key="solid-summary"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3 text-sm text-emerald-900"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">
                    {chauffeursConfirmes} chauffeur(s) confirmé(s) • estimation initiale {chauffeursEstimes}.
                  </p>
                  <p>
                    Ces informations ont été transmises à Solid pour préparer un devis sur mesure.
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Bénéfices inclus :</p>
                <ul className="list-disc list-inside space-y-1">
                  {benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        } else if (productKey === 'chronotachygraphes') {
          const totalVehicles = checklist.total_vehicles ?? checklist.nb_camions ?? '—';
          const equippedVehicles = checklist.equipped_vehicles ?? checklist.camions_equipes ?? 0;
          const installationsRequests =
            checklist.installations_requested ??
            checklist.installations_souhaitees ??
            Math.max(
              (checklist.total_vehicles ?? checklist.nb_camions ?? 0) -
                (checklist.equipped_vehicles ?? checklist.camions_equipes ?? 0),
              0
            );

          blocks.push(
            <div
              key="chrono-summary"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-sm text-emerald-900"
            >
              <p className="font-semibold text-emerald-900">
                {totalVehicles} véhicule(s) poids-lourd déclarés • {equippedVehicles} déjà équipés • {installationsRequests} installation(s) à prévoir.
              </p>
              <p>
                L'expert SDEI prépare actuellement une proposition adaptée à votre flotte.
              </p>
            </div>
          );
        } else {
          const energySources = Array.isArray(checklist.energy_sources)
            ? checklist.energy_sources
            : [];
          blocks.push(
            <div
              key="energy-summary"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-sm text-emerald-900"
            >
              <p className="font-semibold text-emerald-900">
                Analyse demandée : {energySources.length > 0 ? energySources.map((src: string) => src.toUpperCase()).join(', ') : '—'}
              </p>
              <p>
                {checklist.site_count ? `${checklist.site_count} site(s) ciblé(s)` : 'Sites en cours de qualification'} pour optimiser vos dépenses. Consommation de référence :{' '}
                {checklist.consumption_reference ? `${checklist.consumption_reference.toLocaleString('fr-FR')} kWh` : 'non renseignée'}.
              </p>
            </div>
          );
        }
      }

      if (quoteRequested) {
        blocks.push(
          <div
            key="partner-request"
            className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
          >
            <p className="font-semibold text-blue-900">
              Demande de devis envoyée à l'expert distributeur ({partnerRequest.expert_email || (productKey === 'chronotachygraphes'
                ? 'sdei@profitum.fr'
                : productKey === 'logiciel_solid'
                  ? 'solid@profitum.fr'
                  : productKey === 'optimisation_fournisseur_gaz'
                    ? 'gaz@profitum.fr'
                    : productKey === 'optimisation_fournisseur_electricite'
                      ? 'elec@profitum.fr'
                      : 'energie@profitum.fr')}).
            </p>
            <p>
              Vous serez notifié dès que le devis sera disponible. En attendant, vous pouvez préparer vos documents complémentaires.
            </p>
          </div>
        );
      }

      if (blocks.length === 0) {
        return null;
      }

      return <div className="space-y-4">{blocks}</div>;
    };

    const summaryNode = renderSummary();

    if (currentStep === 1 || !checklistCompleted || editingInitialChecks) {
      return (
        <InitialChecksWizard
          dossierId={clientProduitId}
          productKey={productKey as 'chronotachygraphes' | 'logiciel_solid' | 'optimisation_fournisseur_electricite' | 'optimisation_fournisseur_gaz'}
          initialData={checklist}
          simulationData={{ nb_chauffeurs: nbChauffeursFromSimulation }}
          onComplete={handleSimplifiedInitialChecksComplete}
        />
      );
    }

    if (!quoteRequested) {
      return (
        <div className="space-y-6">
          {summaryNode}
          <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
            <CardContent className="p-6 space-y-4 text-sm text-gray-700">
              <div className="space-y-2 text-center">
                <Handshake className="w-10 h-10 text-blue-600 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Valider votre demande de devis
                </h3>
                <p>
                  Vérifiez vos informations puis confirmez l'envoi au partenaire {partnerName}. Vous recevrez une notification dès que le devis sera disponible.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  onClick={handleSubmitQuoteRequest}
                  className="sm:min-w-[220px]"
                  disabled={partnerRequestAttemptedRef.current}
                >
                  {partnerRequestAttemptedRef.current ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Valider ma demande de devis'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingInitialChecks(true);
                    setCurrentStep(1);
                  }}
                  className="sm:min-w-[200px]"
                >
                  Modifier mes réponses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!quoteAvailable) {
      return (
        <div className="space-y-6">
          {summaryNode}
          <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
            <CardContent className="p-6 space-y-4 text-sm text-gray-700">
              <div className="text-center space-y-2">
                <Handshake className="w-10 h-10 text-blue-600 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Demande de devis en cours
                </h3>
                <p>
                  Notre partenaire {partnerName} prépare actuellement votre proposition. Vous recevrez une notification dès qu'elle sera disponible.
                </p>
              </div>
              {partnerRequest.summary && (
                <div className="rounded-lg border border-blue-200 bg-white/70 p-4 space-y-1">
                  <p className="font-semibold text-blue-900">Récapitulatif transmis à l'expert :</p>
                  {productKey === 'logiciel_solid' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Chauffeurs confirmés : {partnerRequest.summary.chauffeurs_confirmes ?? '—'}
                      </li>
                      {partnerRequest.summary.chauffeurs_estimes !== undefined && (
                        <li>Estimation initiale : {partnerRequest.summary.chauffeurs_estimes}</li>
                      )}
                      <li>Service : traitement mensuel des fiches de paie</li>
                    </ul>
                  ) : productKey === 'chronotachygraphes' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Total véhicules déclarés : {partnerRequest.summary.total_vehicles ?? '—'}</li>
                      <li>Véhicules déjà équipés : {partnerRequest.summary.equipped_vehicles ?? 0}</li>
                      <li>Installations souhaitées : {partnerRequest.summary.installations_requested ?? 0}</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Sources analysées : {(partnerRequest.summary.energy_sources || []).map((src: string) => src.toUpperCase()).join(', ') || '—'}</li>
                      <li>Sites concernés : {partnerRequest.summary.site_count ?? '—'}</li>
                      <li>Consommation de référence : {partnerRequest.summary.consumption_reference ?? '—'} kWh</li>
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!quoteAccepted && !invoiceIssued && !invoicePaid) {
      return (
        <div className="space-y-6">
          {summaryNode}
          <QuotePanel
            dossierId={clientProduitId}
            devis={devis}
            userType="client"
            onUpdate={() => {
              loadClientProduit();
              setCurrentStep(4);
            }}
          />
        </div>
      );
    }

    if (invoicePaid || clientProduit?.statut === 'refund_completed') {
      return renderFinalRecapCard();
    }

    return (
      <div className="space-y-6">
        {summaryNode}
        <QuotePanel
          dossierId={clientProduitId}
          devis={devis}
          userType="client"
          onUpdate={loadClientProduit}
        />
        {invoice ? (
          <InvoiceDisplay
            invoice={invoice}
            dossierId={clientProduitId}
            showConfirmPayment={facture.status !== 'paid'}
            showPaymentOptions={facture.status !== 'paid'}
            onPaymentConfirmed={() => {
              loadClientProduit();
              loadInvoice();
              toast.success('🎉 Paiement confirmé ! Merci pour votre règlement.');
            }}
          />
        ) : (
          <Card className="max-w-2xl mx-auto border-gray-200">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                Votre expert prépare la facture. Vous serez notifié dès son émission.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    // Détecter les produits simplifiés
    const isSimplifiedProduct = isSimplifiedProductKey;
    
    if (isSimplifiedProduct) {
      return renderSimplifiedWorkflow();
    }

    const steps = calculatedSteps.length > 0 ? calculatedSteps : workflowSteps;
    const lastStepId = steps.length > 0 ? steps[steps.length - 1].id : 0;
    const effectiveStepId = lastStepId ? Math.min(currentStep, lastStepId) : currentStep;
    const currentWorkflowStep = steps.find(step => step.id === effectiveStepId);
    const finalStatuses = ['payment_in_progress', 'refund_completed'];
    
    if (!currentWorkflowStep) {
      if (clientProduit && finalStatuses.includes(clientProduit.statut || '')) {
        return renderFinalRecapCard();
      }
      return null;
    }

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
          if (isCharterPending) {
            return (
              <div className="space-y-6">
                {renderCharterPendingCard()}
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {isCharterSigned && renderCharterSignedCard()}
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
          );
        }

        // Étape 4 : Audit technique - Bouton validation si audit terminé
        if (currentStep === 4) {
          // Si l'audit est terminé, afficher bouton de validation
          const auditCompleted = clientProduit?.statut === 'validated' || 
                                 clientProduit?.statut === 'audit_completed' ||
                                 clientProduit?.statut === 'pending_client_validation';
          
          return (
            <div className="text-center py-12 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {currentWorkflowStep.name}
                </h3>
                <p className="text-gray-600">{currentWorkflowStep.description}</p>
              </div>

              {auditCompleted ? (
                <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-green-900 mb-2">
                      ✅ Audit technique terminé
                    </h4>
                    <p className="text-sm text-green-800 mb-4">
                      Votre expert a finalisé l'audit technique de votre dossier.
                      Veuillez consulter les résultats et valider pour poursuivre.
                    </p>
                    <Button
                      onClick={() => setShowAuditValidationModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Consulter et valider l'audit
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">
                      🔍 Audit en cours
                    </h4>
                    <p className="text-sm text-blue-800">
                      Votre expert analyse votre dossier et prépare l'audit technique.
                      Vous serez notifié dès que l'audit sera prêt pour validation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

        // Étapes 5-6 : Gestion administrative (gérée par expert côté backend)
        // Le client voit juste l'état d'avancement
        return (
          <div className="text-center py-12 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {currentWorkflowStep.name}
              </h3>
              <p className="text-gray-600">{currentWorkflowStep.description}</p>
            </div>

            {/* Message d'attente selon le statut */}
            {clientProduit?.statut === 'implementation_in_progress' && (
              <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    🛠️ Suivi administration en cours
                  </h4>
                  <p className="text-sm text-blue-800">
                    Votre expert pilote désormais la mise en œuvre auprès de l'administration.
                    Nous vous informerons dès réception du résultat officiel.
                  </p>
                </CardContent>
              </Card>
            )}

            {clientProduit?.statut === 'implementation_validated' && (
              <div className="space-y-4">
                <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-green-900 mb-2">
                      ✅ Résultat confirmé
                    </h4>
                    <p className="text-sm text-green-800">
                      L'administration a validé votre dossier. Votre remboursement est en préparation.
                    </p>
                  </CardContent>
                </Card>

                {/* Affichage facture Profitum */}
                {invoice && (
                  <div className="max-w-2xl mx-auto">
                    <InvoiceDisplay
                      invoice={invoice}
                      dossierId={clientProduitId}
                      onPaymentConfirmed={() => {
                        loadClientProduit();
                        loadInvoice();
                        toast.success('🎉 Dossier finalisé avec succès !');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {clientProduit?.statut === 'payment_requested' && (
              <div className="space-y-4">
                <Card className="max-w-2xl mx-auto border-purple-200 bg-purple-50">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-purple-900 mb-2">
                      💶 Paiement requis
                    </h4>
                    <p className="text-sm text-purple-800">
                      Votre remboursement est disponible. Merci de régler les honoraires pour finaliser le dossier.
                    </p>
                  </CardContent>
                </Card>

                {invoice && (
                  <div className="max-w-2xl mx-auto">
                    <InvoiceDisplay
                      invoice={invoice}
                      dossierId={clientProduitId}
                      onPaymentConfirmed={() => {
                        loadClientProduit();
                        loadInvoice();
                        toast.success('🎉 Paiement confirmé !');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {clientProduit?.statut === 'payment_in_progress' && renderFinalRecapCard()}

            {clientProduit?.statut === 'refund_completed' && renderFinalRecapCard()}

            {!['implementation_in_progress', 'implementation_validated', 'payment_requested', 'payment_in_progress', 'refund_completed'].includes(clientProduit?.statut || '') && (
              <Card className="max-w-2xl mx-auto border-gray-200">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    Cette étape est gérée par votre expert.
                    Vous serez notifié de toute avancée.
                  </p>
                </CardContent>
              </Card>
            )}
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

  const stepsToDisplay = isSimplifiedProductKey
    ? simplifiedState?.steps || workflowSteps
    : calculatedSteps.length > 0
      ? calculatedSteps
      : workflowSteps;

  const effectiveCurrentStep = isSimplifiedProductKey && simplifiedState
    ? simplifiedState.activeStep
    : currentStep;

  useEffect(() => {
    if (
      isSimplifiedProductKey &&
      simplifiedState &&
      simplifiedState.activeStep !== currentStep &&
      !editingInitialChecks
    ) {
      setCurrentStep(simplifiedState.activeStep);
    }
  }, [isSimplifiedProductKey, simplifiedState, currentStep, editingInitialChecks]);

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
        {stepsToDisplay.map((step: any) => (
          <Card 
            key={step.id}
            className={`transition-all duration-200 ${getStepStatusColor(step.status)} ${
              step.id === effectiveCurrentStep ? 'ring-2 ring-blue-500' : ''
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
                  
                  {step.id === effectiveCurrentStep && step.status === 'in_progress' && (
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
                      {(['expert_pending_validation', 'expert_assigned', 'expert_pending_acceptance'] as string[]).includes(currentDossierStatus) && (
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
                      )}

                      {/* Signature charte */}
                      {isCharterPending && renderCharterPendingCard()}
                      {isCharterSigned && renderCharterSignedCard()}
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

      <CharterDialog
        open={showCharterDialog}
        onClose={() => setShowCharterDialog(false)}
        onScrollEnd={handleCharterScrollEnd}
        auditType={productKey}
      />

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

      {/* Modal validation audit avec conditions commission */}
      <AuditValidationModal
        isOpen={showAuditValidationModal}
        onClose={() => setShowAuditValidationModal(false)}
        dossierId={clientProduitId}
        onValidated={() => {
          // Recharger le dossier après validation
          loadClientProduit();
          toast.success('🎉 Audit validé ! Votre expert va maintenant soumettre votre dossier.');
        }}
      />
    </div>
  );
}

