import { createClient } from '@supabase/supabase-js';
import { MappingConfig } from '../../types/import';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class RelationshipService {
  /**
   * Crée les produits éligibles pour un client
   * Détecte les patterns de colonnes multiples (Produit_1, Produit_2, etc.)
   */
  async createClientProduits(
    clientId: string,
    rowData: any[],
    columns: string[],
    mapping: MappingConfig,
    workflowConfig?: any
  ): Promise<void> {
    const produits: Array<{
      clientId: string;
      produitId: string;
      statut?: string;
      montantFinal?: number;
      tauxFinal?: number;
      dureeFinale?: number;
      expert_id?: string;
      current_step?: number;
      progress?: number;
    }> = [];

    // Détecter les patterns de produits multiples
    const productPatterns = workflowConfig?.productPatterns || {};
    const productPattern = productPatterns.productPattern || 'Produit_{index}';
    const expertPattern = productPatterns.expertPattern || 'Expert_Produit_{index}';
    const statutPattern = productPatterns.statutPattern || 'Statut_Produit_{index}';
    const montantPattern = productPatterns.montantPattern || 'Montant_Produit_{index}';

    // Chercher toutes les colonnes qui correspondent aux patterns
    let index = 1;
    while (true) {
      const produitCol = productPattern.replace('{index}', index.toString());
      const produitColIndex = columns.indexOf(produitCol);

      if (produitColIndex < 0) {
        // Plus de produits trouvés
        break;
      }

      const produitValue = rowData[produitColIndex];
      if (!produitValue) {
        index++;
        continue;
      }

      // Chercher le produit par nom
      const { data: produit } = await supabase
        .from('ProduitEligible')
        .select('id')
        .ilike('nom', `%${produitValue}%`)
        .limit(1)
        .single();

      if (!produit) {
        console.warn(`Produit non trouvé: ${produitValue}`);
        index++;
        continue;
      }

      // Récupérer les autres valeurs associées
      const expertCol = expertPattern.replace('{index}', index.toString());
      const statutCol = statutPattern.replace('{index}', index.toString());
      const montantCol = montantPattern.replace('{index}', index.toString());

      const expertColIndex = columns.indexOf(expertCol);
      const statutColIndex = columns.indexOf(statutCol);
      const montantColIndex = columns.indexOf(montantCol);

      let expertId: string | undefined;
      if (expertColIndex >= 0 && rowData[expertColIndex]) {
        // Chercher l'expert par nom ou email
        const expertValue = rowData[expertColIndex];
        const { data: expert } = await supabase
          .from('Expert')
          .select('id')
          .or(`name.ilike.%${expertValue}%,email.ilike.%${expertValue}%`)
          .limit(1)
          .single();

        if (expert) {
          expertId = expert.id;
        }
      }

      const statut = statutColIndex >= 0 && rowData[statutColIndex]
        ? rowData[statutColIndex].toString()
        : workflowConfig?.defaultProductStatus || 'eligible';

      const montantFinal = montantColIndex >= 0 && rowData[montantColIndex]
        ? Number(rowData[montantColIndex])
        : null;

      produits.push({
        clientId,
        produitId: produit.id,
        statut,
        montantFinal: montantFinal || undefined,
        expert_id: expertId,
        current_step: workflowConfig?.initialStep || 1,
        progress: workflowConfig?.initialProgress || 0
      });

      index++;
    }

    // Si aucun pattern trouvé mais qu'il y a un produit par défaut dans le mapping
    if (produits.length === 0 && workflowConfig?.defaultProduitId) {
      produits.push({
        clientId,
        produitId: workflowConfig.defaultProduitId,
        statut: workflowConfig.defaultProductStatus || 'eligible',
        expert_id: workflowConfig.defaultExpertId,
        current_step: workflowConfig.initialStep || 1,
        progress: workflowConfig.initialProgress || 0
      });
    }

    // Insérer les produits éligibles
    if (produits.length > 0) {
      const produitsToInsert = produits.map(p => ({
        clientId: p.clientId,
        produitId: p.produitId,
        statut: p.statut || 'eligible',
        montantFinal: p.montantFinal || null,
        tauxFinal: p.tauxFinal || null,
        dureeFinale: p.dureeFinale || null,
        expert_id: p.expert_id || null,
        current_step: p.current_step || 1,
        progress: p.progress || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('ClientProduitEligible')
        .insert(produitsToInsert);

      if (error) {
        console.error('Erreur création produits éligibles:', error);
        throw new Error(`Erreur création produits: ${error.message}`);
      }
    }
  }

  /**
   * Assigne un expert à un client (si spécifié dans les données)
   */
  async assignExpertToClient(
    clientId: string,
    expertId?: string
  ): Promise<void> {
    if (!expertId) {
      return;
    }

    // Vérifier que l'expert existe
    const { data: expert } = await supabase
      .from('Expert')
      .select('id')
      .eq('id', expertId)
      .single();

    if (!expert) {
      throw new Error(`Expert non trouvé: ${expertId}`);
    }

    // L'assignation se fait généralement au niveau des produits éligibles
    // Cette méthode peut être étendue selon les besoins
  }

  /**
   * Assigne un cabinet à un expert ou apporteur
   */
  async assignCabinetToExpert(
    expertId: string,
    cabinetId?: string
  ): Promise<void> {
    if (!cabinetId) {
      return;
    }

    // Vérifier que le cabinet existe
    const { data: cabinet } = await supabase
      .from('Cabinet')
      .select('id')
      .eq('id', cabinetId)
      .single();

    if (!cabinet) {
      throw new Error(`Cabinet non trouvé: ${cabinetId}`);
    }

    // Mettre à jour l'expert avec le cabinet_id
    const { error } = await supabase
      .from('Expert')
      .update({ cabinet_id: cabinetId })
      .eq('id', expertId);

    if (error) {
      throw new Error(`Erreur assignation cabinet: ${error.message}`);
    }
  }
}

