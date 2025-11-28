import { TransformationConfig } from '../../types/import';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class TransformationService {
  /**
   * Transforme une valeur selon la configuration de transformation
   */
  async transformValue(value: any, transformation?: TransformationConfig): Promise<any> {
    if (!transformation || transformation.type === 'direct') {
      return value;
    }

    if (value === null || value === undefined || value === '') {
      return value;
    }

    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation);
      
      case 'lookup':
        return await this.lookupValue(value, transformation);
      
      case 'formula':
        return this.applyFormula(value, transformation);
      
      case 'split':
        return this.splitValue(value, transformation);
      
      default:
        return value;
    }
  }

  /**
   * Formatage de valeurs (dates, téléphones, nombres, booléens)
   */
  private formatValue(value: any, config: TransformationConfig): any {
    const params = config.params || {};
    
    // Format date
    if (params.inputFormat) {
      return this.formatDate(value, params.inputFormat);
    }

    // Format téléphone
    if (params.countryCode !== undefined) {
      return this.formatPhone(value, params.countryCode);
    }

    // Parse nombre
    if (params.decimalSeparator !== undefined || params.thousandSeparator !== undefined) {
      return this.parseNumber(value, params.decimalSeparator, params.thousandSeparator);
    }

    // Parse booléen
    if (params.trueValues || params.falseValues) {
      return this.parseBoolean(value, params.trueValues || [], params.falseValues || []);
    }

    return value;
  }

  /**
   * Formatage de date vers ISO
   */
  private formatDate(value: any, inputFormat: string): string {
    if (!value) return null as any;

    const dateStr = value.toString().trim();
    
    // Si c'est déjà une date ISO, la retourner
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr;
    }

    try {
      let date: Date;

      // Parser selon le format
      if (inputFormat === 'DD/MM/YYYY') {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          throw new Error('Format de date invalide');
        }
      } else if (inputFormat === 'MM/DD/YYYY') {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        } else {
          throw new Error('Format de date invalide');
        }
      } else {
        // Essayer de parser directement
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) {
        throw new Error('Date invalide');
      }

      return date.toISOString();
    } catch (error) {
      console.warn(`Erreur formatage date: ${value}`, error);
      return null as any;
    }
  }

  /**
   * Formatage de téléphone
   */
  private formatPhone(value: any, countryCode?: string): string {
    if (!value) return null as any;

    let phone = value.toString().trim();
    
    // Enlever tous les caractères non numériques sauf +
    phone = phone.replace(/[^\d+]/g, '');

    // Ajouter le code pays si nécessaire
    if (countryCode && !phone.startsWith('+')) {
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      phone = countryCode + phone;
    }

    return phone;
  }

  /**
   * Parse un nombre avec séparateurs personnalisés
   */
  private parseNumber(value: any, decimalSep?: string, thousandSep?: string): number | null {
    if (!value) return null;

    let numStr = value.toString().trim();

    // Enlever les séparateurs de milliers
    if (thousandSep) {
      numStr = numStr.replace(new RegExp(`\\${thousandSep}`, 'g'), '');
    }

    // Remplacer le séparateur décimal
    if (decimalSep && decimalSep !== '.') {
      numStr = numStr.replace(decimalSep, '.');
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse un booléen
   */
  private parseBoolean(value: any, trueValues: string[], falseValues: string[]): boolean | null {
    if (!value) return null;

    const str = value.toString().trim().toLowerCase();
    
    if (trueValues.some(v => v.toLowerCase() === str)) {
      return true;
    }
    
    if (falseValues.some(v => v.toLowerCase() === str)) {
      return false;
    }

    return null;
  }

  /**
   * Lookup d'une valeur (expert, cabinet, produit)
   */
  private async lookupValue(value: any, config: TransformationConfig): Promise<string | null> {
    if (!value) return null;

    const params = config.params || {};
    const lookupField = params.lookupField || 'name';
    const valueStr = value.toString().trim();

    // Déterminer la table selon le type de lookup
    let tableName: string;
    if (config.params?.lookupField === 'expert') {
      tableName = 'Expert';
    } else if (config.params?.lookupField === 'cabinet') {
      tableName = 'Cabinet';
    } else if (config.params?.lookupField === 'produit') {
      tableName = 'ProduitEligible';
    } else {
      // Essayer de détecter depuis le nom du champ
      const field = config.params?.lookupField || '';
      if (field.includes('expert')) {
        tableName = 'Expert';
      } else if (field.includes('cabinet')) {
        tableName = 'Cabinet';
      } else if (field.includes('produit')) {
        tableName = 'ProduitEligible';
      } else {
        return null;
      }
    }

    try {
      // Rechercher par nom ou email
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .or(`${lookupField}.ilike.%${valueStr}%,email.ilike.%${valueStr}%`)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch (error) {
      console.warn(`Erreur lookup ${tableName}: ${value}`, error);
      return null;
    }
  }

  /**
   * Application d'une formule
   */
  private applyFormula(value: any, config: TransformationConfig): any {
    if (!config.params?.formula) {
      return value;
    }

    try {
      // Remplacer {value} par la valeur actuelle dans la formule
      const formula = config.params.formula.replace(/\{value\}/g, value);
      
      // Évaluer la formule (attention à la sécurité)
      // Pour l'instant, on supporte seulement des opérations simples
      if (formula.match(/^[\d+\-*/().\s]+$/)) {
        return eval(formula);
      }
      
      return value;
    } catch (error) {
      console.warn(`Erreur formule: ${config.params.formula}`, error);
      return value;
    }
  }

  /**
   * Split d'une valeur (ex: nom complet → first_name, last_name)
   */
  private splitValue(value: any, config: TransformationConfig): any {
    if (!value) return null;

    const params = config.params || {};
    const separator = params.separator || ' ';
    const parts = value.toString().trim().split(separator);

    if (parts.length === 0) {
      return null;
    }

    if (parts.length === 1) {
      return { first_name: parts[0], last_name: '' };
    }

    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(separator)
    };
  }
}

