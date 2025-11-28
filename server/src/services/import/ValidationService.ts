import { createClient } from '@supabase/supabase-js';
import { EntityType, MappingRule } from '../../types/import';

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

    // Créer un objet avec les données mappées
    const mappedData: Record<string, any> = {};
    
    mappingRules.forEach(rule => {
      const columnIndex = columns.indexOf(rule.excelColumn);
      if (columnIndex >= 0 && columnIndex < rowData.length) {
        mappedData[rule.databaseField] = rowData[columnIndex];
      } else if (rule.defaultValue !== undefined) {
        mappedData[rule.databaseField] = rule.defaultValue;
      }
    });

    // Validation des champs requis
    for (const rule of mappingRules) {
      if (rule.isRequired) {
        const value = mappedData[rule.databaseField];
        if (value === null || value === undefined || value === '') {
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
    // Validation email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
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
          .eq('email', data.email)
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
    // Validation email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
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
          .eq('email', data.email)
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
    // Validation email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
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
          .eq('email', data.email)
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

