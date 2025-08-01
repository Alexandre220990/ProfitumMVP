import { supabase } from '../lib/supabase';

// Types pour les relations
interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  category: string;
}

interface Client {
  id: string;
  name: string;
  company_name: string;
  email: string;
}

// Configuration des étapes par type de produit
const PRODUCT_STEPS_CONFIG: Record<string, Array<{
  name: string;
  type: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment' | 'expert_selection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
}>> = {
  'TICPE': [
    { name: 'Confirmer l\'éligibilité', type: 'validation', priority: 'critical', duration: 60 },
    { name: 'Sélection de l\'expert', type: 'expert_selection', priority: 'high', duration: 120 },
    { name: 'Collecte des documents', type: 'documentation', priority: 'high', duration: 120 },
    { name: 'Audit technique', type: 'expertise', priority: 'critical', duration: 240 },
    { name: 'Validation finale', type: 'approval', priority: 'high', duration: 60 },
    { name: 'Demande de remboursement', type: 'payment', priority: 'medium', duration: 120 }
  ],
  'CIR': [
    { name: 'Vérification des critères', type: 'validation', priority: 'high', duration: 90 },
    { name: 'Analyse des dépenses', type: 'documentation', priority: 'critical', duration: 180 },
    { name: 'Expertise comptable', type: 'expertise', priority: 'critical', duration: 300 },
    { name: 'Validation administrative', type: 'approval', priority: 'high', duration: 90 },
    { name: 'Déclaration fiscale', type: 'payment', priority: 'medium', duration: 120 }
  ],
  'URSSAF': [
    { name: 'Audit des cotisations', type: 'validation', priority: 'high', duration: 120 },
    { name: 'Analyse des erreurs', type: 'documentation', priority: 'critical', duration: 180 },
    { name: 'Expertise sociale', type: 'expertise', priority: 'critical', duration: 240 },
    { name: 'Validation URSSAF', type: 'approval', priority: 'high', duration: 90 },
    { name: 'Remboursement', type: 'payment', priority: 'medium', duration: 120 }
  ],
  'DFS': [
    { name: 'Vérification des conditions', type: 'validation', priority: 'high', duration: 60 },
    { name: 'Collecte des justificatifs', type: 'documentation', priority: 'high', duration: 120 },
    { name: 'Expertise formation', type: 'expertise', priority: 'critical', duration: 180 },
    { name: 'Validation OPCO', type: 'approval', priority: 'high', duration: 90 },
    { name: 'Versement des fonds', type: 'payment', priority: 'medium', duration: 120 }
  ]
};

// Étapes par défaut pour les produits non configurés
const DEFAULT_STEPS = [
  { name: 'Validation initiale', type: 'validation' as const, priority: 'high' as const, duration: 60 },
  { name: 'Documentation requise', type: 'documentation' as const, priority: 'high' as const, duration: 120 },
  { name: 'Expertise technique', type: 'expertise' as const, priority: 'critical' as const, duration: 240 }
];

export class DossierStepGenerator {
  
  /**
   * Génère automatiquement les étapes pour un ClientProduitEligible
   */
  static async generateStepsForDossier(clientProduitId: string): Promise<boolean> {
    try {
      console.log(`🔧 Génération des étapes pour le dossier: ${clientProduitId}`);

      // 1. Vérifier si des étapes existent déjà
      const { data: existingSteps, error: checkError } = await supabase
        .from('DossierStep')
        .select('id')
        .eq('dossier_id', clientProduitId);

      if (checkError) {
        console.error('❌ Erreur vérification des étapes existantes:', checkError);
        return false;
      }

      if (existingSteps && existingSteps.length > 0) {
        console.log(`ℹ️ Des étapes existent déjà pour le dossier: ${clientProduitId}`);
        return true;
      }

      // 2. Récupérer les détails du dossier
      const { data: clientProduit, error: fetchError } = await supabase
        .from('ClientProduitEligible')
        .select('id, clientId, produitId, statut, montantFinal')
        .eq('id', clientProduitId)
        .single();

      if (fetchError || !clientProduit) {
        console.error('❌ Erreur récupération du dossier:', fetchError);
        return false;
      }

      // 3. Récupérer les détails du produit
      const { data: produitEligible, error: produitError } = await supabase
        .from('ProduitEligible')
        .select('id, nom, description, category')
        .eq('id', clientProduit.produitId)
        .single();

      if (produitError || !produitEligible) {
        console.error('❌ Erreur récupération du produit:', produitError);
        return false;
      }

      // 4. Récupérer les détails du client
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('id, name, company_name, email')
        .eq('id', clientProduit.clientId)
        .single();

      if (clientError || !client) {
        console.error('❌ Erreur récupération du client:', clientError);
        return false;
      }

      // 5. Déterminer les étapes à créer
      const productName = produitEligible.nom;
      const stepsConfig = PRODUCT_STEPS_CONFIG[productName] || DEFAULT_STEPS;

      // 6. Calculer les dates d'échéance
      const baseDate = new Date();
      const stepsToCreate = stepsConfig.map((step, index) => {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + (index * 2)); // 2 jours entre chaque étape

        const clientName = client.company_name || client.name || 'Client';

        return {
          dossier_id: clientProduitId,
          dossier_name: `${productName} - ${clientName}`,
          step_name: step.name,
          step_type: step.type,
          due_date: dueDate.toISOString(),
          status: index === 0 ? 'in_progress' : 'pending', // Première étape en cours
          priority: step.priority,
          progress: index === 0 ? 25 : 0, // Première étape 25% complétée
          estimated_duration_minutes: step.duration,
          assignee_type: index === 0 ? 'client' : null, // Première étape assignée au client
          metadata: {
            product_type: productName,
            montant_final: clientProduit.montantFinal,
            generated_at: new Date().toISOString()
          }
        };
      });

      // 7. Créer les étapes
      const { data: createdSteps, error: createError } = await supabase
        .from('DossierStep')
        .insert(stepsToCreate)
        .select();

      if (createError) {
        console.error('❌ Erreur création des étapes:', createError);
        return false;
      }

      console.log(`✅ ${createdSteps?.length || 0} étapes créées pour le dossier: ${clientProduitId}`);
      return true;

    } catch (error) {
      console.error('❌ Erreur génération des étapes:', error);
      return false;
    }
  }

  /**
   * Génère les étapes pour tous les ClientProduitEligible éligibles
   */
  static async generateStepsForAllEligibleDossiers(): Promise<{ success: number; failed: number }> {
    try {
      console.log('🔧 Génération des étapes pour tous les dossiers éligibles...');
      
      // Récupérer tous les ClientProduitEligible éligibles
      const { data: eligibleDossiers, error } = await supabase
        .from('ClientProduitEligible')
        .select('id')
        .in('statut', ['eligible', 'en_cours']);

      if (error) {
        console.error('❌ Erreur récupération des dossiers éligibles:', error);
        return { success: 0, failed: 0 };
      }

      if (!eligibleDossiers || eligibleDossiers.length === 0) {
        console.log('ℹ️ Aucun dossier éligible trouvé');
        return { success: 0, failed: 0 };
      }

      console.log(`📋 ${eligibleDossiers.length} dossiers éligibles trouvés`);

      // Générer les étapes pour chaque dossier
      let successCount = 0;
      let failedCount = 0;

      for (const dossier of eligibleDossiers) {
        const success = await this.generateStepsForDossier(dossier.id);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`✅ Génération terminée: ${successCount} succès, ${failedCount} échecs`);
      return { success: successCount, failed: failedCount };

    } catch (error) {
      console.error('❌ Erreur génération globale:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Met à jour le progress et current_step dans ClientProduitEligible basé sur DossierStep
   */
  static async updateDossierProgress(clientProduitId: string): Promise<boolean> {
    try {
      // Récupérer toutes les étapes du dossier
      const { data: steps, error } = await supabase
        .from('DossierStep')
        .select('status, progress')
        .eq('dossier_id', clientProduitId)
        .order('created_at', { ascending: true });

      if (error || !steps) {
        console.error('❌ Erreur récupération des étapes:', error);
        return false;
      }

      // Calculer le progress global
      const totalSteps = steps.length;
      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
      
      // Calculer le progress en pourcentage
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      // Déterminer l'étape actuelle
      let currentStep = completedSteps;
      if (inProgressSteps > 0) {
        currentStep = completedSteps + 1;
      }

      // Mettre à jour ClientProduitEligible
      const { error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: currentStep,
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientProduitId);

      if (updateError) {
        console.error('❌ Erreur mise à jour du progress:', updateError);
        return false;
      }

      console.log(`✅ Progress mis à jour: étape ${currentStep}, progress ${progress}%`);
      return true;

    } catch (error) {
      console.error('❌ Erreur mise à jour du progress:', error);
      return false;
    }
  }
} 