import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { ExcelParserService } from '../services/import/ExcelParserService';
import { ImportService } from '../services/import/ImportService';
import { TransformationService } from '../services/import/TransformationService';
import { ValidationService } from '../services/import/ValidationService';
import {
  MappingConfig,
  ImportOptions,
  EntityType,
  ImportTemplate
} from '../types/import';

const router = Router();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration Multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Formats acceptés: .xlsx, .xls, .csv'));
    }
  }
});

// Services
const excelParser = new ExcelParserService();
const importService = new ImportService();
const transformer = new TransformationService();
const validator = new ValidationService();

// ============================================================================
// POST /api/admin/import/upload
// Upload un fichier Excel et retourne les colonnes détectées
// ============================================================================
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const fileBuffer = req.file.buffer;
    const fileData = await excelParser.parseFile(fileBuffer);

    return res.json({
      success: true,
      data: {
        columns: fileData.columns,
        totalRows: fileData.totalRows,
        sampleRows: fileData.rows.slice(0, 10) // Premières 10 lignes pour prévisualisation
      }
    });
  } catch (error: any) {
    console.error('Erreur upload fichier:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du parsing du fichier'
    });
  }
}));

// ============================================================================
// POST /api/admin/import/preview
// Prévisualise les données transformées selon le mapping
// ============================================================================
router.post('/preview', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileData, mappingConfig } = req.body;

    if (!fileData || !mappingConfig) {
      return res.status(400).json({
        success: false,
        message: 'fileData et mappingConfig sont requis'
      });
    }

    const { columns, rows } = fileData;
    const mapping: MappingConfig = mappingConfig;

    // Transformer les premières 10 lignes
    const sampleRows = rows.slice(0, 10);
    const transformedRows: any[] = [];

    for (const row of sampleRows) {
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
          value = await transformer.transformValue(value, rule.transformation);
        }

        // Gérer le split
        if (rule.transformation?.type === 'split' && value) {
          const splitResult = await transformer.transformValue(value, rule.transformation);
          if (splitResult && typeof splitResult === 'object') {
            transformedRow.first_name = splitResult.first_name;
            transformedRow.last_name = splitResult.last_name;
          }
        } else {
          transformedRow[rule.databaseField] = value;
        }
      }

      transformedRows.push(transformedRow);
    }

    // Valider les lignes
    const validationErrors = await validator.validateRows(
      sampleRows,
      columns,
      mapping.rules,
      mapping.entityType
    );

    return res.json({
      success: true,
      data: {
        columns,
        sampleRows,
        transformedRows,
        validationErrors
      }
    });
  } catch (error: any) {
    console.error('Erreur prévisualisation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la prévisualisation'
    });
  }
}));

// ============================================================================
// POST /api/admin/import/execute
// Exécute l'import avec le mapping configuré
// ============================================================================
router.post('/execute', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.database_id || (req as any).user?.id;
    const { mappingConfig, options, workflowConfig } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!mappingConfig) {
      return res.status(400).json({
        success: false,
        message: 'mappingConfig est requis'
      });
    }

    const mapping: MappingConfig = mappingConfig;
    const importOptions: ImportOptions = options || {};
    const workflow = workflowConfig || {};

    // Créer l'entrée dans l'historique
    const { data: historyEntry, error: historyError } = await supabase
      .from('import_history')
      .insert({
        entity_type: mapping.entityType,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mapping_config: mapping,
        status: 'processing',
        created_by: adminId,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('Erreur création historique:', historyError);
    }

    // Exécuter l'import
    const result = await importService.processImport(
      req.file.buffer,
      mapping,
      importOptions,
      workflow
    );

    // Mettre à jour l'historique
    if (historyEntry) {
      await supabase
        .from('import_history')
        .update({
          total_rows: result.totalRows,
          success_count: result.successCount,
          error_count: result.errorCount,
          skipped_count: result.skippedCount,
          results: result.results,
          status: result.errorCount > 0 && result.successCount === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', historyEntry.id);
    }

    return res.json({
      success: true,
      data: {
        ...result,
        historyId: historyEntry?.id
      }
    });
  } catch (error: any) {
    console.error('Erreur exécution import:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'import'
    });
  }
}));

// ============================================================================
// GET /api/admin/import/templates
// Liste les templates disponibles
// ============================================================================
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { entity_type } = req.query;

    let query = supabase
      .from('import_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    const { data: templates, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: templates || []
    });
  } catch (error: any) {
    console.error('Erreur récupération templates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des templates'
    });
  }
}));

// ============================================================================
// POST /api/admin/import/templates
// Crée un nouveau template
// ============================================================================
router.post('/templates', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.database_id || (req as any).user?.id;
    const { name, description, entity_type, mapping_config, workflow_config } = req.body;

    if (!name || !entity_type || !mapping_config) {
      return res.status(400).json({
        success: false,
        message: 'name, entity_type et mapping_config sont requis'
      });
    }

    const { data: template, error } = await supabase
      .from('import_templates')
      .insert({
        name,
        description,
        entity_type,
        mapping_config,
        workflow_config: workflow_config || {},
        created_by: adminId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Erreur création template:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du template'
    });
  }
}));

// ============================================================================
// PUT /api/admin/import/templates/:id
// Met à jour un template
// ============================================================================
router.put('/templates/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, mapping_config, workflow_config } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (mapping_config !== undefined) updateData.mapping_config = mapping_config;
    if (workflow_config !== undefined) updateData.workflow_config = workflow_config;

    const { data: template, error } = await supabase
      .from('import_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Erreur mise à jour template:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du template'
    });
  }
}));

// ============================================================================
// DELETE /api/admin/import/templates/:id
// Supprime un template
// ============================================================================
router.delete('/templates/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('import_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Template supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression template:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du template'
    });
  }
}));

// ============================================================================
// GET /api/admin/import/history
// Historique des imports
// ============================================================================
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, entity_type, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: history, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: history || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: history?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Erreur récupération historique:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'historique'
    });
  }
}));

// ============================================================================
// GET /api/admin/import/history/:id
// Détails d'un import spécifique
// ============================================================================
router.get('/history/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: historyEntry, error } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Import non trouvé'
      });
    }

    return res.json({
      success: true,
      data: historyEntry
    });
  } catch (error: any) {
    console.error('Erreur récupération détails import:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des détails'
    });
  }
}));

export default router;

