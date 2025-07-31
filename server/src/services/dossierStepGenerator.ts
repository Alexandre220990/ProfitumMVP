import { supabase } from '../lib/supabase';

// Configuration des étapes par type de produit
const PRODUCT_STEPS_CONFIG = {
  'TICPE': [
    { name: 'Validation éligibilité', type: 'validation', priority: 'high', duration: 30 },
    { name: 'Signature charte', type: 'documentation', priority: 'high', duration: 15 },
    { name: 'Sélection expert', type: 'expertise', priority: 'medium', duration: 60 },
    { name: 'Analyse documents', type: 'documentation', priority: 'high', duration: 120 },
    { name: 'Soumission administration', type: 'approval', priority: 'critical', duration: 180 },
    { name: 'Suivi remboursement', type: 'payment', priority: 'high', duration: 240 }
  ],
  'URSSAF': [
    { name: 'Validation éligibilité', type: 'validation', priority: 'high', duration: 30 },
    { name: 'Signature charte', type: 'documentation', priority: 'high', duration: 15 },
    { name: 'Sélection expert', type: 'expertise', priority: 'medium', duration: 60 },
    { name: 'Analyse documents', type: 'documentation', priority: 'high', duration: 120 },
    { name: 'Soumission URSSAF', type: 'approval', priority: 'critical', duration: 180 },
    { name: 'Suivi remboursement', type: 'payment', priority: 'high', duration: 240 }
  ],
  'DFS': [
    { name: 'Validation éligibilité', type: 'validation', priority: 'high', duration: 30 },
    { name: 'Signature charte', type: 'documentation', priority: 'high', duration: 15 },
    { name: 'Sélection expert', type: 'expertise', priority: 'medium', duration: 60 },
    { name: 'Analyse documents', type: 'documentation', priority: 'high', duration: 120 },
    { name: 'Soumission DFS', type: 'approval', priority: 'critical', duration: 180 },
    { name: 'Suivi remboursement', type: 'payment', priority: 'high', duration: 240 }
  ],
  'CIR': [
    { name: 'Validation éligibilité', type: 'validation', priority: 'high', duration: 30 },
    { name: 'Signature charte', type: 'documentation', priority: 'high', duration: 15 },
    { name: 'Sélection expert', type: 'expertise', priority: 'medium', duration: 60 },
    { name: 'Analyse R&D', type: 'documentation', priority: 'high', duration: 180 },
    { name: 'Soumission CIR', type: 'approval', priority: 'critical', duration: 240 },
    { name: 'Suivi crédit d\'impôt', type: 'payment', priority: 'high', duration: 300 }
  ]
};

// Configuration par défaut pour les produits non configurés
const DEFAULT_STEPS = [
  { name: 'Validation éligibilité', type: 'validation', priority: 'high', duration: 30 },
  { name: 'Signature charte', type: 'documentation', priority: 'high', duration: 15 },
  { name: 'Sélection expert', type: 'expertise', priority: 'medium', duration: 60 },
  { name: 'Analyse documents', type: 'documentation', priority: 'high', duration: 120 },
  { name: 'Soumission administration', type: 'approval', priority: 'critical', duration: 180 },
  { name: 'Suivi remboursement', type: 'payment', priority: 'high', duration: 240 }
];

export class DossierStepGenerator {
  
  /**
   * Génère automatiquement les étapes pour un ClientProduitEligible
   */
  static async generateStepsForDossier(clientProduitId: string): Promise<boolean> {
    try {
      console.log(`🔧 Génération des étapes pour le dossier: ${clientProduitId}`);
      
      // 1. Récupérer les informations du ClientProduitEligible
      const { data: clientProduit, error: clientProduitError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          montantFinal,
          ProduitEligible:ProduitEligible!inner(
            id,
            nom,
            description
          ),
          Client:Client!inner(
            id,
            company_name,
            name
          )
        `)
        .eq('id', clientProduitId)
        .single();

      if (clientProduitError || !clientProduit) {
        console.error('❌ ClientProduitEligible non trouvé:', clientProduitError);
        return false;
      }

      // 2. Vérifier si des étapes existent déjà
      const { data: existingSteps, error: existingStepsError } = await supabase
        .from('DossierStep')
        .select('id')
        .eq('dossier_id', clientProduitId);

      if (existingStepsError) {
        console.error('❌ Erreur vérification étapes existantes:', existingStepsError);
        return false;
      }

      if (existingSteps && existingSteps.length > 0) {
        console.log(`ℹ️ Étapes déjà existantes pour le dossier: ${clientProduitId}`);
        return true;
      }

      // 3. Déterminer les étapes à créer
      const productName = clientProduit.ProduitEligible.nom;
      const stepsConfig = PRODUCT_STEPS_CONFIG[productName as keyof typeof PRODUCT_STEPS_CONFIG] || DEFAULT_STEPS;

      // 4. Calculer les dates d'échéance
      const baseDate = new Date();
      const stepsToCreate = stepsConfig.map((step, index) => {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + (index * 2)); // 2 jours entre chaque étape

        return {
          dossier_id: clientProduitId,
          dossier_name: `${productName} - ${clientProduit.Client.company_name || clientProduit.Client.name}`,
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

      // 5. Créer les étapes
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