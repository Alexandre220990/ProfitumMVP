import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { ExcelParserService } from '../services/import/ExcelParserService';
import { TransformationService } from '../services/import/TransformationService';
import { ValidationService } from '../services/import/ValidationService';
import { ProspectService } from '../services/ProspectService';
import { CreateProspectInput } from '../types/prospects';

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
const transformer = new TransformationService();
const validator = new ValidationService();

// Mapping par défaut pour les prospects
const DEFAULT_PROSPECT_MAPPING = {
  email: { required: true, field: 'email' },
  firstname: { required: false, field: 'firstname' },
  lastname: { required: false, field: 'lastname' },
  company_name: { required: false, field: 'company_name' },
  siren: { required: false, field: 'siren' },
  phone_direct: { required: false, field: 'phone_direct' },
  company_website: { required: false, field: 'company_website' },
  adresse: { required: false, field: 'adresse' },
  city: { required: false, field: 'city' },
  postal_code: { required: false, field: 'postal_code' },
  source: { required: false, field: 'source', defaultValue: 'import_csv' }
};

// ============================================================================
// POST /api/admin/import-prospects/upload
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
// POST /api/admin/import-prospects/check-duplicates
// Vérifie les doublons SIREN dans la base de données
// ============================================================================
router.post('/check-duplicates', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  try {
    let mapping = req.body.mapping;
    if (typeof mapping === 'string') {
      try {
        mapping = JSON.parse(mapping);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Format de mapping invalide'
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!mapping) {
      return res.status(400).json({
        success: false,
        message: 'mapping est requis'
      });
    }

    // Vérifier si le SIREN est mappé
    const sirenColumn = mapping.siren?.excelColumn;
    if (!sirenColumn) {
      // Si pas de SIREN mappé, pas de doublons possibles
      return res.json({
        success: true,
        data: {
          duplicates: [],
          uniqueProspects: [],
          totalRows: 0,
          duplicatesCount: 0,
          uniqueCount: 0
        }
      });
    }

    // Parser le fichier
    const fileBuffer = req.file.buffer;
    const fileData = await excelParser.parseFile(fileBuffer);

    const { columns, rows } = fileData;
    const sirenIndex = columns.indexOf(sirenColumn);
    
    if (sirenIndex < 0) {
      return res.json({
        success: true,
        data: {
          duplicates: [],
          uniqueProspects: [],
          totalRows: rows.length,
          duplicatesCount: 0,
          uniqueCount: rows.length
        }
      });
    }

    // Extraire tous les SIREN du fichier (non vides)
    const fileSirens = new Map<string, any[]>(); // SIREN -> [lignes avec ce SIREN]
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sirenValue = row[sirenIndex];
      
      if (sirenValue && typeof sirenValue === 'string' && sirenValue.trim()) {
        const siren = sirenValue.trim();
        if (!fileSirens.has(siren)) {
          fileSirens.set(siren, []);
        }
        fileSirens.get(siren)!.push({ rowIndex: i + 1, rowData: row });
      }
    }

    if (fileSirens.size === 0) {
      // Aucun SIREN dans le fichier
      return res.json({
        success: true,
        data: {
          duplicates: [],
          uniqueProspects: [],
          totalRows: rows.length,
          duplicatesCount: 0,
          uniqueCount: rows.length
        }
      });
    }

    // Vérifier dans la base de données quels SIREN existent déjà
    const sirenList = Array.from(fileSirens.keys());
    const { data: existingProspects, error: dbError } = await supabase
      .from('prospects')
      .select('id, siren, email, company_name, firstname, lastname')
      .in('siren', sirenList)
      .not('siren', 'is', null);

    if (dbError) {
      console.error('Erreur vérification doublons:', dbError);
      return res.status(500).json({
        success: false,
        message: `Erreur lors de la vérification des doublons: ${dbError.message}`
      });
    }

    const existingSirens = new Set((existingProspects || []).map((p: any) => p.siren));
    
    // Séparer les doublons des prospects uniques
    const duplicates: Array<{
      siren: string;
      fileRows: Array<{ rowIndex: number; rowData: any[] }>;
      existingProspect: any;
    }> = [];
    
    const uniqueSirens: string[] = [];

    for (const [siren, fileRows] of fileSirens.entries()) {
      if (existingSirens.has(siren)) {
        const existingProspect = (existingProspects || []).find((p: any) => p.siren === siren);
        duplicates.push({
          siren,
          fileRows,
          existingProspect: existingProspect || null
        });
      } else {
        uniqueSirens.push(siren);
      }
    }

    // Compter les prospects uniques (toutes les lignes sans SIREN + lignes avec SIREN unique)
    const rowsWithSiren = Array.from(fileSirens.values()).flat().length;
    const rowsWithoutSiren = rows.length - rowsWithSiren;
    const uniqueRowsCount = rowsWithoutSiren + uniqueSirens.reduce((sum, siren) => sum + fileSirens.get(siren)!.length, 0);
    const duplicatesRowsCount = duplicates.reduce((sum, dup) => sum + dup.fileRows.length, 0);

    return res.json({
      success: true,
      data: {
        duplicates,
        uniqueSirens,
        totalRows: rows.length,
        duplicatesCount: duplicatesRowsCount,
        uniqueCount: uniqueRowsCount,
        duplicatesSirensCount: duplicates.length
      }
    });
  } catch (error: any) {
    console.error('Erreur vérification doublons:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification des doublons'
    });
  }
}));

// ============================================================================
// POST /api/admin/import-prospects/preview
// Prévisualise les données transformées selon le mapping
// ============================================================================
router.post('/preview', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileData, mapping } = req.body;

    if (!fileData || !mapping) {
      return res.status(400).json({
        success: false,
        message: 'fileData et mapping sont requis'
      });
    }

    const { columns, rows } = fileData;
    const sampleRows = rows.slice(0, 10);
    const transformedRows: any[] = [];

    for (const row of sampleRows) {
      const transformedRow: Record<string, any> = {};

      for (const [dbField, config] of Object.entries(mapping)) {
        const excelColumn = (config as any).excelColumn;
        if (!excelColumn) continue;

        const columnIndex = columns.indexOf(excelColumn);
        let value: any = null;

        if (columnIndex >= 0 && columnIndex < row.length) {
          value = row[columnIndex];
        } else if ((config as any).defaultValue !== undefined) {
          value = (config as any).defaultValue;
        }

        if (value !== null && value !== undefined && value !== '') {
          transformedRow[dbField] = value;
        }
      }

      transformedRows.push(transformedRow);
    }

    return res.json({
      success: true,
      data: {
        columns,
        sampleRows,
        transformedRows
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
// POST /api/admin/import-prospects/execute
// Exécute l'import avec le mapping configuré
// ============================================================================
router.post('/execute', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.database_id || (req as any).user?.id;
    
    // Le mapping peut être dans req.body.mapping (si envoyé en JSON) ou dans req.body (si envoyé en FormData)
    let mapping = req.body.mapping;
    if (typeof mapping === 'string') {
      try {
        mapping = JSON.parse(mapping);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Format de mapping invalide'
        });
      }
    }

    // Récupérer les SIREN à exclure (doublons)
    let excludedSirens: string[] = [];
    if (req.body.excludedSirens) {
      try {
        excludedSirens = typeof req.body.excludedSirens === 'string' 
          ? JSON.parse(req.body.excludedSirens) 
          : req.body.excludedSirens;
      } catch (e) {
        console.warn('Format excludedSirens invalide, ignoré');
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!mapping) {
      return res.status(400).json({
        success: false,
        message: 'mapping est requis'
      });
    }

    // Parser le fichier
    const fileBuffer = req.file.buffer;
    const fileData = await excelParser.parseFile(fileBuffer);

    const { columns, rows } = fileData;
    const prospects: CreateProspectInput[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let skippedCount = 0;

    // Récupérer l'index de la colonne SIREN si mappée
    const sirenColumn = mapping.siren?.excelColumn;
    const sirenIndex = sirenColumn ? columns.indexOf(sirenColumn) : -1;

    // Transformer chaque ligne
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const prospectData: any = {};

      try {
        // Vérifier si cette ligne doit être exclue (doublon SIREN)
        if (sirenIndex >= 0 && excludedSirens.length > 0) {
          const sirenValue = row[sirenIndex];
          if (sirenValue && typeof sirenValue === 'string' && sirenValue.trim()) {
            const siren = sirenValue.trim();
            if (excludedSirens.includes(siren)) {
              // Skip cette ligne car c'est un doublon
              skippedCount++;
              continue;
            }
          }
        }

        // Email est obligatoire
        const emailColumn = mapping.email?.excelColumn;
        if (!emailColumn) {
          errors.push({ row: i + 1, error: 'Colonne email non mappée' });
          continue;
        }

        const emailIndex = columns.indexOf(emailColumn);
        if (emailIndex < 0 || !row[emailIndex] || !row[emailIndex].trim()) {
          errors.push({ row: i + 1, error: 'Email manquant ou invalide' });
          continue;
        }

        const email = row[emailIndex].trim().toLowerCase();
        if (!email.includes('@')) {
          errors.push({ row: i + 1, error: 'Email invalide' });
          continue;
        }

        prospectData.email = email;

        // Mapper les autres champs
        for (const [dbField, config] of Object.entries(mapping)) {
          if (dbField === 'email') continue;

          const excelColumn = (config as any).excelColumn;
          if (!excelColumn) {
            if ((config as any).defaultValue !== undefined) {
              prospectData[dbField] = (config as any).defaultValue;
            }
            continue;
          }

          const columnIndex = columns.indexOf(excelColumn);
          if (columnIndex >= 0 && columnIndex < row.length && row[columnIndex]) {
            let value = row[columnIndex];
            if (typeof value === 'string') {
              value = value.trim();
            }
            if (value) {
              prospectData[dbField] = value;
            }
          } else if ((config as any).defaultValue !== undefined) {
            prospectData[dbField] = (config as any).defaultValue;
          }
        }

        // Source par défaut
        if (!prospectData.source) {
          prospectData.source = 'import_csv';
        }

        prospects.push(prospectData as CreateProspectInput);
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message || 'Erreur lors du traitement de la ligne' });
      }
    }

    // Créer l'entrée dans l'historique
    const { data: historyEntry, error: historyError } = await supabase
      .from('import_history')
      .insert({
        entity_type: 'prospect',
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

    // Créer les prospects par batch en ajoutant l'import_batch_id
    let successCount = 0;
    let errorCount = errors.length;
    const batchSize = 50;
    const importBatchId = historyEntry?.id;

    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize).map(p => ({
        ...p,
        import_batch_id: importBatchId
      }));
      const result = await ProspectService.createBulkProspects(batch);

      if (result.success) {
        successCount += result.data?.created || 0;
      } else {
        errorCount += batch.length;
        errors.push({ row: i + 1, error: result.error || 'Erreur lors de la création' });
      }
    }

    // Mettre à jour l'historique
    if (historyEntry) {
      await supabase
        .from('import_history')
        .update({
          total_rows: rows.length,
          success_count: successCount,
          error_count: errorCount,
          skipped_count: skippedCount,
          results: { errors },
          status: errorCount > 0 && successCount === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', historyEntry.id);
    }

    return res.json({
      success: true,
      data: {
        totalRows: rows.length,
        successCount,
        errorCount,
        skippedCount,
        errors: errors.slice(0, 100) // Limiter à 100 erreurs pour la réponse
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

export default router;

