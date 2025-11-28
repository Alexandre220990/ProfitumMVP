import { ExcelParserService } from './ExcelParserService';
import { TransformationService } from './TransformationService';
import { ValidationService } from './ValidationService';
import { EntityCreatorService } from './EntityCreatorService';
import { RelationshipService } from './RelationshipService';
import {
  MappingConfig,
  ImportOptions,
  ImportResult,
  ImportRowResult,
  EntityType
} from '../../types/import';

export class ImportService {
  private excelParser: ExcelParserService;
  private transformer: TransformationService;
  private validator: ValidationService;
  private entityCreator: EntityCreatorService;
  private relationshipService: RelationshipService;

  constructor() {
    this.excelParser = new ExcelParserService();
    this.transformer = new TransformationService();
    this.validator = new ValidationService();
    this.entityCreator = new EntityCreatorService();
    this.relationshipService = new RelationshipService();
  }

  /**
   * Traite un import complet
   */
  async processImport(
    fileBuffer: Buffer,
    mappingConfig: MappingConfig,
    options: ImportOptions = {},
    workflowConfig?: any
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const results: ImportRowResult[] = [];

    // 1. Parser le fichier Excel
    const fileData = await this.excelParser.parseFile(fileBuffer);

    // 2. Transformer les données selon le mapping
    const transformedRows = await this.transformRows(
      fileData.rows,
      fileData.columns,
      mappingConfig
    );

    // 3. Valider les données
    const validationErrors = await this.validator.validateRows(
      fileData.rows,
      fileData.columns,
      mappingConfig.rules,
      mappingConfig.entityType
    );

    // Créer un map des erreurs par ligne
    const errorsByRow = new Map<number, Array<{ field: string; error: string }>>();
    validationErrors.forEach(error => {
      if (!errorsByRow.has(error.rowIndex)) {
        errorsByRow.set(error.rowIndex, []);
      }
      errorsByRow.get(error.rowIndex)!.push({ field: error.field, error: error.error });
    });

    // 4. Créer les entités ligne par ligne
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    const batchSize = options.batchSize || 50;
    const continueOnError = options.continueOnError !== false;

    for (let i = 0; i < transformedRows.length; i++) {
      const rowErrors = errorsByRow.get(i) || [];
      
      // Si la ligne a des erreurs de validation
      if (rowErrors.length > 0) {
        const errorMessages = rowErrors.map(e => e.error);
        if (options.skipDuplicates && errorMessages.some(msg => msg.includes('existe déjà'))) {
          skippedCount++;
          results.push({
            rowIndex: i,
            success: false,
            errors: errorMessages,
            warnings: ['Ligne ignorée (doublon)']
          });
          continue;
        }

        if (!continueOnError) {
          errorCount++;
          results.push({
            rowIndex: i,
            success: false,
            errors: errorMessages
          });
          continue;
        }
      }

      try {
        // Créer l'entité
        const entityResult = await this.createEntity(
          transformedRows[i],
          mappingConfig,
          options
        );

        // Si c'est un client, créer les relations (produits, RDV, assignations)
        if (mappingConfig.entityType === 'client') {
          let createdProduitIds: string[] = [];

          // Créer les produits éligibles
          if (mappingConfig.relatedTables?.produits?.enabled || workflowConfig) {
            try {
              createdProduitIds = await this.relationshipService.createClientProduits(
                entityResult.id,
                fileData.rows[i],
                fileData.columns,
                mappingConfig,
                workflowConfig
              );
            } catch (prodError: any) {
              console.warn(`Erreur création produits pour client ${entityResult.id}:`, prodError.message);
              // Ne pas faire échouer l'import pour ça
            }
          }

          // Créer les RDV préprogrammés
          if (mappingConfig.relatedTables?.rdv?.enabled) {
            try {
              await this.relationshipService.createRDV(
                entityResult.id,
                fileData.rows[i],
                fileData.columns,
                mappingConfig,
                entityResult.authUserId
              );
            } catch (rdvError: any) {
              console.warn(`Erreur création RDV pour client ${entityResult.id}:`, rdvError.message);
              // Ne pas faire échouer l'import pour ça
            }
          }

          // Créer les assignations d'experts
          if (mappingConfig.relatedTables?.expertAssignments?.enabled) {
            try {
              const firstProduitId = createdProduitIds.length > 0 ? createdProduitIds[0] : null;
              await this.relationshipService.createExpertAssignment(
                entityResult.id,
                firstProduitId,
                fileData.rows[i],
                fileData.columns,
                mappingConfig
              );
            } catch (assignError: any) {
              console.warn(`Erreur création assignation pour client ${entityResult.id}:`, assignError.message);
              // Ne pas faire échouer l'import pour ça
            }
          }
        }

        successCount++;
        results.push({
          rowIndex: i,
          success: true,
          entityId: entityResult.id,
          data: transformedRows[i]
        });
      } catch (error: any) {
        errorCount++;
        results.push({
          rowIndex: i,
          success: false,
          errors: [error.message || 'Erreur lors de la création'],
          data: transformedRows[i]
        });

        if (!continueOnError) {
          throw error;
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      totalRows: fileData.rows.length,
      successCount,
      errorCount,
      skippedCount,
      results,
      duration
    };
  }

  /**
   * Transforme toutes les lignes selon le mapping
   */
  private async transformRows(
    rows: any[][],
    columns: string[],
    mapping: MappingConfig
  ): Promise<Record<string, any>[]> {
    const transformed: Record<string, any>[] = [];

    for (const row of rows) {
      const transformedRow: Record<string, any> = {};

      for (const rule of mapping.rules) {
        const columnIndex = columns.indexOf(rule.excelColumn);
        let value: any = null;

        if (columnIndex >= 0 && columnIndex < row.length) {
          value = row[columnIndex];
        } else if (rule.defaultValue !== undefined) {
          value = rule.defaultValue;
        }

        // Appliquer la transformation
        if (value !== null && value !== undefined && value !== '') {
          value = await this.transformer.transformValue(value, rule.transformation);
        }

        // Gérer le split (ex: nom complet → first_name, last_name)
        if (rule.transformation?.type === 'split' && value) {
          const splitResult = await this.transformer.transformValue(value, rule.transformation);
          if (splitResult && typeof splitResult === 'object') {
            transformedRow.first_name = splitResult.first_name;
            transformedRow.last_name = splitResult.last_name;
          }
        } else {
          transformedRow[rule.databaseField] = value;
        }
      }

      transformed.push(transformedRow);
    }

    return transformed;
  }

  /**
   * Crée une entité selon son type
   */
  private async createEntity(
    data: Record<string, any>,
    mapping: MappingConfig,
    options: ImportOptions
  ): Promise<{ id: string; authUserId: string }> {
    const createOptions = {
      generatePassword: options.generatePasswords !== false,
      password: undefined as string | undefined
    };

    switch (mapping.entityType) {
      case 'client':
        return await this.entityCreator.createClient(data, mapping, createOptions);
      
      case 'expert':
        return await this.entityCreator.createExpert(data, mapping, createOptions);
      
      case 'apporteur':
        return await this.entityCreator.createApporteur(data, mapping, createOptions);
      
      default:
        throw new Error(`Type d'entité non supporté: ${mapping.entityType}`);
    }
  }
}

