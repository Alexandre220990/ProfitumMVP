import { createClient } from '@supabase/supabase-js';
import { MappingConfig } from '../../types/import';
import { TransformationService as Transformer } from './TransformationService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class RelationshipService {
  private transformer: Transformer;

  constructor() {
    this.transformer = new Transformer();
  }

  /**
   * Crée les produits éligibles pour un client depuis les règles de mapping
   */
  async createClientProduits(
    clientId: string,
    rowData: any[],
    columns: string[],
    mapping: MappingConfig,
    workflowConfig?: any
  ): Promise<string[]> {
    const createdProduitIds: string[] = [];

    // Utiliser les règles de mapping si disponibles
    if (mapping.relatedTables?.produits?.enabled && mapping.relatedTables.produits.rules.length > 0) {
      const produitData: Record<string, any> = {};
      
      // Transformer les données selon les règles
      for (const rule of mapping.relatedTables.produits.rules) {
        const columnIndex = columns.indexOf(rule.excelColumn);
        if (columnIndex >= 0 && columnIndex < rowData.length) {
          let value = rowData[columnIndex];
          
          if (value !== null && value !== undefined && value !== '') {
            if (rule.transformation) {
              value = await this.transformer.transformValue(value, rule.transformation);
            }
            produitData[rule.databaseField] = value;
          } else if (rule.defaultValue !== undefined) {
            produitData[rule.databaseField] = rule.defaultValue;
          }
        }
      }

      // Si on a un produitId (nom ou ID), peut être multiple (séparé par virgule)
      if (produitData.produitId) {
        const produitIdsStr = produitData.produitId.toString();
        // Séparer par virgule, point-virgule ou saut de ligne
        const produitNames = produitIdsStr.split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
        
        for (const produitName of produitNames) {
          let produitId: string | null = null;
          
          // Chercher le produit par nom ou ID
          const { data: produit } = await supabase
            .from('ProduitEligible')
            .select('id')
            .or(`id.eq.${produitName},nom.ilike.%${produitName}%`)
            .limit(1)
            .single();

          if (!produit) {
            console.warn(`Produit non trouvé: ${produitName}`);
            continue;
          }

          produitId = produit.id;

          // Chercher l'expert si spécifié
          let expertId: string | null = null;
          if (produitData.expert_id) {
            const { data: expert } = await supabase
              .from('Expert')
              .select('id')
              .or(`id.eq.${produitData.expert_id},name.ilike.%${produitData.expert_id}%,email.ilike.%${produitData.expert_id}%`)
              .limit(1)
              .single();
            
            if (expert) {
              expertId = expert.id;
            }
          }

          const produitToInsert = {
            clientId,
            produitId,
            statut: produitData.statut || workflowConfig?.defaultProductStatus || 'eligible',
            montantFinal: produitData.montantFinal ? Number(produitData.montantFinal) : null,
            tauxFinal: produitData.tauxFinal ? Number(produitData.tauxFinal) : null,
            dureeFinale: produitData.dureeFinale ? Number(produitData.dureeFinale) : null,
            expert_id: expertId,
            priorite: produitData.priorite ? Number(produitData.priorite) : null,
            notes: produitData.notes || null,
            current_step: workflowConfig?.initialStep || 1,
            progress: workflowConfig?.initialProgress || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: inserted, error } = await supabase
            .from('ClientProduitEligible')
            .insert(produitToInsert)
            .select('id')
            .single();

          if (error) {
            console.error('Erreur création produit éligible:', error);
            // Continuer avec les autres produits même en cas d'erreur
            continue;
          }

          if (inserted) {
            createdProduitIds.push(inserted.id);
          }
        }
      }
    } else {
      // Fallback sur l'ancienne méthode avec patterns
      await this.createClientProduitsLegacy(clientId, rowData, columns, mapping, workflowConfig);
    }

    return createdProduitIds;
  }

  /**
   * Ancienne méthode de création de produits (fallback)
   */
  private async createClientProduitsLegacy(
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
   * Crée un RDV préprogrammé pour un client
   */
  async createRDV(
    clientId: string,
    rowData: any[],
    columns: string[],
    mapping: MappingConfig,
    createdBy?: string
  ): Promise<string | null> {
    if (!mapping.relatedTables?.rdv?.enabled || !mapping.relatedTables.rdv.rules.length) {
      return null;
    }

    const rdvData: Record<string, any> = {};

    // Transformer les données selon les règles
    for (const rule of mapping.relatedTables.rdv.rules) {
      const columnIndex = columns.indexOf(rule.excelColumn);
      if (columnIndex >= 0 && columnIndex < rowData.length) {
        let value = rowData[columnIndex];
        
        if (value !== null && value !== undefined && value !== '') {
          if (rule.transformation) {
            value = await this.transformer.transformValue(value, rule.transformation);
          }
          rdvData[rule.databaseField] = value;
        } else if (rule.defaultValue !== undefined) {
          rdvData[rule.databaseField] = rule.defaultValue;
        }
      }
    }

    // Vérifier les champs requis
    if (!rdvData.scheduled_date || !rdvData.scheduled_time) {
      console.warn('RDV ignoré: date ou heure manquante');
      return null;
    }

    // Chercher l'expert si spécifié
    let expertId: string | null = null;
    if (rdvData.expert_id) {
      const { data: expert } = await supabase
        .from('Expert')
        .select('id')
        .or(`id.eq.${rdvData.expert_id},name.ilike.%${rdvData.expert_id}%,email.ilike.%${rdvData.expert_id}%`)
        .limit(1)
        .single();
      
      if (expert) {
        expertId = expert.id;
      }
    }

    const rdvToInsert = {
      client_id: clientId,
      expert_id: expertId,
      scheduled_date: rdvData.scheduled_date,
      scheduled_time: rdvData.scheduled_time,
      duration_minutes: rdvData.duration_minutes ? Number(rdvData.duration_minutes) : 60,
      meeting_type: rdvData.meeting_type || 'video',
      location: rdvData.location || null,
      meeting_url: rdvData.meeting_url || null,
      title: rdvData.title || `RDV avec client`,
      description: rdvData.description || null,
      status: rdvData.status || 'proposed',
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
      .from('RDV')
      .insert(rdvToInsert)
      .select('id')
      .single();

    if (error) {
      console.error('Erreur création RDV:', error);
      throw new Error(`Erreur création RDV: ${error.message}`);
    }

    return inserted?.id || null;
  }

  /**
   * Crée une assignation d'expert
   */
  async createExpertAssignment(
    clientId: string,
    clientProduitEligibleId: string | null,
    rowData: any[],
    columns: string[],
    mapping: MappingConfig
  ): Promise<string | null> {
    if (!mapping.relatedTables?.expertAssignments?.enabled || !mapping.relatedTables.expertAssignments.rules.length) {
      return null;
    }

    const assignmentData: Record<string, any> = {};

    // Transformer les données selon les règles
    for (const rule of mapping.relatedTables.expertAssignments.rules) {
      const columnIndex = columns.indexOf(rule.excelColumn);
      if (columnIndex >= 0 && columnIndex < rowData.length) {
        let value = rowData[columnIndex];
        
        if (value !== null && value !== undefined && value !== '') {
          if (rule.transformation) {
            value = await this.transformer.transformValue(value, rule.transformation);
          }
          assignmentData[rule.databaseField] = value;
        } else if (rule.defaultValue !== undefined) {
          assignmentData[rule.databaseField] = rule.defaultValue;
        }
      }
    }

    // Vérifier l'expert requis
    if (!assignmentData.expert_id) {
      console.warn('Assignation ignorée: expert manquant');
      return null;
    }

    // Chercher l'expert
    const { data: expert } = await supabase
      .from('Expert')
      .select('id')
      .or(`id.eq.${assignmentData.expert_id},name.ilike.%${assignmentData.expert_id}%,email.ilike.%${assignmentData.expert_id}%`)
      .limit(1)
      .single();

    if (!expert) {
      console.warn(`Expert non trouvé: ${assignmentData.expert_id}`);
      return null;
    }

    const assignmentToInsert = {
      expert_id: expert.id,
      client_id: clientId,
      client_produit_eligible_id: assignmentData.client_produit_eligible_id || clientProduitEligibleId || null,
      status: assignmentData.status || 'pending',
      notes: assignmentData.notes || null,
      assignment_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
      .from('expertassignment')
      .insert(assignmentToInsert)
      .select('id')
      .single();

    if (error) {
      console.error('Erreur création assignation:', error);
      throw new Error(`Erreur création assignation: ${error.message}`);
    }

    return inserted?.id || null;
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

