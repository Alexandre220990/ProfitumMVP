// Types pour le système d'import Excel côté frontend

export type EntityType = 'client' | 'expert' | 'apporteur';
export type TransformationType = 'direct' | 'format' | 'lookup' | 'formula' | 'split';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TransformationConfig {
  type: TransformationType;
  params?: {
    inputFormat?: string;
    countryCode?: string;
    lookupField?: string;
    separator?: string;
    decimalSeparator?: string;
    thousandSeparator?: string;
    trueValues?: string[];
    falseValues?: string[];
    formula?: string;
  };
}

export interface MappingRule {
  excelColumn: string;
  databaseField: string;
  transformation?: TransformationConfig;
  isRequired: boolean;
  defaultValue?: any;
}

export interface MappingConfig {
  partnerName: string;
  entityType: EntityType;
  rules: MappingRule[];
}

export interface ExcelColumn {
  name: string;
  index: number;
}

export interface ExcelFileData {
  columns: string[];
  rows: any[][];
  totalRows: number;
  sampleRows?: any[][];
}

export interface PreviewRow {
  rowIndex: number;
  rawData: any[];
  transformedData: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface ImportState {
  currentStep: number;
  fileData?: ExcelFileData;
  entityType?: EntityType;
  mappingConfig?: MappingConfig;
  workflowConfig?: WorkflowConfig;
  previewData?: PreviewData;
  importResult?: ImportResult;
  isImporting: boolean;
  importProgress?: ImportProgress;
}

export interface WorkflowConfig {
  defaultProductStatus?: string;
  defaultExpertId?: string;
  defaultCabinetId?: string;
  initialStep?: number;
  initialProgress?: number;
  productPatterns?: {
    productPattern?: string;
    expertPattern?: string;
    statutPattern?: string;
    montantPattern?: string;
  };
}

export interface PreviewData {
  columns: string[];
  sampleRows: any[][];
  transformedRows: Record<string, any>[];
  validationErrors: Array<{
    rowIndex: number;
    field: string;
    error: string;
  }>;
}

export interface ImportProgress {
  current: number;
  total: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  currentRow?: number;
  status: ImportStatus;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: ImportRowResult[];
  duration?: number;
  historyId?: string;
}

export interface ImportRowResult {
  rowIndex: number;
  success: boolean;
  entityId?: string;
  errors?: string[];
  warnings?: string[];
  data?: any;
}

export interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  mappingConfig: MappingConfig;
  workflowConfig?: WorkflowConfig;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportHistory {
  id: string;
  templateId?: string;
  entityType: EntityType;
  fileName: string;
  fileSize?: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  status: ImportStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

