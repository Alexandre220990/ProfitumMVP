import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { mapDossierToWorkflow } from '@/lib/workflow-mapper';
import ExpertDossierWorkflow from '@/components/expert/ExpertDossierWorkflow';
import DossierActionModal from '@/components/expert/DossierActionModal';
import { useExpertDossierActions } from '@/hooks/use-expert-dossier-actions';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/design-system/Card';
import Button from '@/components/ui/design-system/Button';
import { useToast } from '@/components/ui/toast-notifications';
import { cn } from '@/lib/utils';

// Types pour le dossier
interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone_number: string;
  city: string;
  siren: string;
}

interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  category: string;
}

interface Expert {
  id: string;
  name: string;
  company_name: string;
  email: string;
}

interface Dossier {
  id: string;
  client_id: string;
  produit_eligible_id: string;
  expert_id: string;
  status: string;
  current_step: number;
  progress: number;
  statut: string;
  charte_signed: boolean;
  charte_signed_at?: string;
  created_at: string;
  updated_at: string;
  montantFinal: number;
  tauxFinal: number;
  dureeFinale: number;
  priorite?: number;
  notes?: string;
  metadata?: {
    notes?: Array<{
      stepId: number;
      note: string;
      timestamp: string;
      author: string;
    }>;
  };
  Client: Client;
  ProduitEligible: ProduitEligible;
  Expert: Expert;
}

const ExpertDossierPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { handleStepAction, handleDocumentAction } = useExpertDossierActions();
  
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    stepId: 0,
    action: '',
    actionData: null
  });

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          Client (
            id,
            name,
            email,
            company_name,
            phone_number,
            city,
            siren
          ),
          ProduitEligible (
            id,
            nom,
            description,
            category
          ),
          Expert (
            id,
            name,
            company_name,
            email
          )
        `)
        .eq('id', id)
        .eq('expert_id', user?.id)
        .single();

      if (error || !data) {
        addToast({
          type: 'error',
          title: 'Dossier non trouvé',
          message: 'Le dossier demandé n\'existe pas ou vous n\'y avez pas accès',
          duration: 5000
        });
        navigate('/expert/dashboard');
        return;
      }

      setDossier(data as Dossier);
    } catch (error) {
      console.error('Erreur récupération dossier:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la récupération du dossier',
        duration: 5000
      });
      navigate('/expert/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user?.id) {
      fetchDossier();
    }
  }, [id, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDossier();
    setRefreshing(false);
  };

  const handleStepActionCallback = async (stepId: number, action: string) => {
    // Actions qui nécessitent un modal
    const modalActions = ['sign_charte', 'upload', 'contact_client', 'schedule_meeting'];
    
    if (modalActions.includes(action)) {
      setModalState({
        isOpen: true,
        stepId,
        action,
        actionData: null
      });
      return;
    }

    // Actions directes
    try {
      const success = await handleStepAction(id!, stepId, action);
      if (success) {
        // Recharger les données après une action réussie
        await fetchDossier();
      }
    } catch (error) {
      console.error('Erreur action étape:', error);
    }
  };

  const handleDocumentActionCallback = async (documentName: string, action: string, file?: File, metadata?: any) => {
    try {
      const success = await handleDocumentAction(id!, documentName, action, file, metadata);
      if (success) {
        // Recharger les données après une action réussie
        await fetchDossier();
      }
    } catch (error) {
      console.error('Erreur action document:', error);
    }
  };

  const handleNoteAdd = async (stepId: number, note: string) => {
    if (!dossier) return;
    
    try {
      // Ajouter une note au dossier
      const { error } = await supabase
        .from('ClientProduitEligible')
        .update({
          notes: note,
          updated_at: new Date().toISOString(),
          metadata: {
            ...dossier.metadata,
            notes: [...(dossier.metadata?.notes || []), {
              stepId,
              note,
              timestamp: new Date().toISOString(),
              author: 'expert'
            }]
          }
        })
        .eq('id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Note ajoutée',
        message: 'La note a été ajoutée avec succès',
        duration: 3000
      });

      // Recharger les données
      await fetchDossier();
    } catch (error) {
      console.error('Erreur ajout note:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout de la note',
        duration: 5000
      });
    }
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      stepId: 0,
      action: '',
      actionData: null
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  const steps = mapDossierToWorkflow(dossier);
  const clientName = dossier.Client?.company_name || dossier.Client?.name || 'Client inconnu';
  const productName = dossier.ProduitEligible?.nom || 'Produit inconnu';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header avec navigation */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/expert/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Dossier {productName}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {clientName} • ID: {dossier.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                <span>Actualiser</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Workflow du dossier */}
          <Card className="shadow-xl border-0">
            <ExpertDossierWorkflow
              steps={steps}
              dossier={dossier}
              onStepAction={handleStepActionCallback}
              onDocumentAction={handleDocumentActionCallback}
              onNoteAdd={handleNoteAdd}
            />
          </Card>

          {/* Informations complémentaires */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations client */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Informations client
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Entreprise</span>
                    <p className="text-neutral-900 dark:text-white">{clientName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Email</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.Client?.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Téléphone</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.Client?.phone_number || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Ville</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.Client?.city || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">SIREN</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.Client?.siren || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Informations financières */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Informations financières
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Montant final</span>
                    <p className="text-2xl font-bold text-green-600">€{dossier.montantFinal?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Taux final</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.tauxFinal}%</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Durée finale</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.dureeFinale} mois</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Priorité</span>
                    <p className="text-neutral-900 dark:text-white">{dossier.priorite || 1}/5</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal pour les actions */}
      <DossierActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        dossierId={id!}
        stepId={modalState.stepId}
        action={modalState.action}
      />
    </div>
  );
};

export default ExpertDossierPage; 