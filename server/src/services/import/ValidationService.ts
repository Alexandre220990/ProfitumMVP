import { createClient } from '@supabase/supabase-js';
import { EntityType, MappingRule } from '../../types/import';
import { TransformationService } from './TransformationService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ValidationError {
  rowIndex: number;
  field: string;
  error: string;
}

export class ValidationService {
  private transformer: TransformationService;

  constructor() {
    this.transformer = new TransformationService();
  }

  /**
   * Valide une ligne de données selon les règles de mapping
   */
  async validateRow(
    rowData: any[],
    rowIndex: number,
    columns: string[],
    mappingRules: MappingRule[],
    entityType: EntityType
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Créer un objet avec les données mappées (avec transformations)
    const mappedData: Record<string, any> = {};
    
    for (const rule of mappingRules) {
      const columnIndex = columns.indexOf(rule.excelColumn);
      let value: any = null;

      if (columnIndex >= 0 && columnIndex < rowData.length) {
        value = rowData[columnIndex];
      } else if (rule.defaultValue !== undefined) {
        value = rule.defaultValue;
      }

      // Appliquer la transformation comme dans ImportService
      if (value !== null && value !== undefined && value !== '') {
        try {
          value = await this.transformer.transformValue(value, rule.transformation);
        } catch (error) {
          console.warn(`Erreur transformation pour ${rule.databaseField}:`, error);
          // Continuer avec la valeur brute en cas d'erreur
        }
      }

      // Gérer le split (ex: nom complet → first_name, last_name)
      if (rule.transformation?.type === 'split' && value && typeof value === 'object') {
        if (value.first_name) mappedData.first_name = value.first_name;
        if (value.last_name) mappedData.last_name = value.last_name;
      } else if (rule.databaseField) {
        mappedData[rule.databaseField] = value;
      }
    }

    // Fonction pour normaliser les valeurs vides (gère les placeholders comme "—", "-", "N/A", etc.)
    const normalizeEmptyValue = (value: any): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'object' && Object.keys(value).length === 0) return true;
      
      const strValue = String(value).trim();
      const emptyPlaceholders = ['—', '-', '--', 'N/A', 'n/a', 'NA', 'na', 'NULL', 'null', ''];
      return emptyPlaceholders.includes(strValue);
    };
    
    // Validation des champs requis
    // Pour les apporteurs, ignorer address et postal_code car ils ne sont pas dans ApporteurAffaires
    const fieldsToIgnoreForApporteurs = ['address', 'postal_code', 'city'];
    
    for (const rule of mappingRules) {
      if (rule.isRequired && rule.databaseField) {
        // Ignorer certains champs pour les apporteurs
        if (entityType === 'apporteur' && fieldsToIgnoreForApporteurs.includes(rule.databaseField)) {
          continue;
        }
        
        const value = mappedData[rule.databaseField];
        
        // Normaliser les valeurs vides (inclut les placeholders)
        if (normalizeEmptyValue(value)) {
          errors.push({
            rowIndex,
            field: rule.databaseField,
            error: `Le champ ${rule.databaseField} est requis`
          });
        }
      }
    }

    // Validations spécifiques selon le type d'entité
    if (entityType === 'client') {
      await this.validateClient(mappedData, rowIndex, errors);
    } else if (entityType === 'expert') {
      await this.validateExpert(mappedData, rowIndex, errors);
    } else if (entityType === 'apporteur') {
      await this.validateApporteur(mappedData, rowIndex, errors);
    }

    return errors;
  }

  /**
   * Valide les données d'un client
   */
  private async validateClient(
    data: Record<string, any>,
    rowIndex: number,
    errors: ValidationError[]
  ): Promise<void> {
    // Validation email - convertir en string si c'est un objet
    let emailValue = data.email;
    if (emailValue && typeof emailValue === 'object') {
      emailValue = emailValue.toString();
    }
    
    if (emailValue) {
      const emailStr = String(emailValue).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(emailStr)) {
        errors.push({
          rowIndex,
          field: 'email',
          error: 'Format d\'email invalide'
        });
      } else {
        // Vérifier unicité
        const { data: existing } = await supabase
          .from('Client')
          .select('id')
          .eq('email', emailStr)
          .single();

        if (existing) {
          errors.push({
            rowIndex,
            field: 'email',
            error: 'Cet email existe déjà'
          });
        }
      }
    }

    // Validation SIREN
    if (data.siren) {
      const sirenStr = data.siren.toString().replace(/\s/g, '');
      if (sirenStr.length !== 14 && sirenStr.length !== 9) {
        errors.push({
          rowIndex,
          field: 'siren',
          error: 'Le SIREN doit contenir 9 ou 14 caractères'
        });
      } else {
        // Vérifier unicité
        const { data: existing } = await supabase
          .from('Client')
          .select('id')
          .eq('siren', sirenStr)
          .single();

        if (existing) {
          errors.push({
            rowIndex,
            field: 'siren',
            error: 'Ce SIREN existe déjà'
          });
        }
      }
    }

    // Validation champs numériques
    if (data.revenuAnnuel !== undefined && data.revenuAnnuel !== null) {
      const revenu = Number(data.revenuAnnuel);
      if (isNaN(revenu) || revenu < 0) {
        errors.push({
          rowIndex,
          field: 'revenuAnnuel',
          error: 'Le revenu annuel doit être un nombre positif'
        });
      }
    }

    if (data.nombreEmployes !== undefined && data.nombreEmployes !== null) {
      const employes = Number(data.nombreEmployes);
      if (isNaN(employes) || employes < 0 || !Number.isInteger(employes)) {
        errors.push({
          rowIndex,
          field: 'nombreEmployes',
          error: 'Le nombre d\'employés doit être un entier positif'
        });
      }
    }
  }

  /**
   * Valide les données d'un expert
   */
  private async validateExpert(
    data: Record<string, any>,
    rowIndex: number,
    errors: ValidationError[]
  ): Promise<void> {
    // Validation email - convertir en string si c'est un objet
    let emailValue = data.email;
    if (emailValue && typeof emailValue === 'object') {
      emailValue = emailValue.toString();
    }
    
    if (emailValue) {
      const emailStr = String(emailValue).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(emailStr)) {
        errors.push({
          rowIndex,
          field: 'email',
          error: 'Format d\'email invalide'
        });
      } else {
        // Vérifier unicité
        const { data: existing } = await supabase
          .from('Expert')
          .select('id')
          .eq('email', emailStr)
          .single();

        if (existing) {
          errors.push({
            rowIndex,
            field: 'email',
            error: 'Cet email existe déjà'
          });
        }
      }
    }

    // Validation SIREN
    if (data.siren) {
      const sirenStr = data.siren.toString().replace(/\s/g, '');
      if (sirenStr.length !== 14 && sirenStr.length !== 9) {
        errors.push({
          rowIndex,
          field: 'siren',
          error: 'Le SIREN doit contenir 9 ou 14 caractères'
        });
      }
    }

    // Validation expert_id si présent (doit exister)
    if (data.expert_id) {
      const { data: expert } = await supabase
        .from('Expert')
        .select('id')
        .eq('id', data.expert_id)
        .single();

      if (!expert) {
        errors.push({
          rowIndex,
          field: 'expert_id',
          error: 'L\'expert spécifié n\'existe pas'
        });
      }
    }
  }

  /**
   * Valide les données d'un apporteur
   */
  private async validateApporteur(
    data: Record<string, any>,
    rowIndex: number,
    errors: ValidationError[]
  ): Promise<void> {
    // Validation email - convertir en string si c'est un objet
    let emailValue = data.email;
    if (emailValue && typeof emailValue === 'object') {
      emailValue = emailValue.toString();
    }
    
    if (emailValue) {
      const emailStr = String(emailValue).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(emailStr)) {
        errors.push({
          rowIndex,
          field: 'email',
          error: 'Format d\'email invalide'
        });
      } else {
        // Vérifier unicité
        const { data: existing } = await supabase
          .from('ApporteurAffaires')
          .select('id')
          .eq('email', emailStr)
          .single();

        if (existing) {
          errors.push({
            rowIndex,
            field: 'email',
            error: 'Cet email existe déjà'
          });
        }
      }
    }
    
    // Note: address et postal_code ne sont pas requis pour les apporteurs
    // car ils ne sont pas dans la table ApporteurAffaires
  }

  /**
   * Valide plusieurs lignes en batch
   */
  async validateRows(
    rows: any[][],
    columns: string[],
    mappingRules: MappingRule[],
    entityType: EntityType
  ): Promise<ValidationError[]> {
    const allErrors: ValidationError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const errors = await this.validateRow(rows[i], i, columns, mappingRules, entityType);
      allErrors.push(...errors);
    }

    return allErrors;
  }
}

