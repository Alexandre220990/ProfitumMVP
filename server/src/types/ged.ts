// Types pour le système de Gestion Électronique Documentaire (GED)

export interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  file_path?: string;
  last_modified: Date;
  created_at: Date;
  created_by?: string;
  is_active: boolean;
  read_time: number;
  version: number;
  labels?: DocumentLabel[];
}

export interface DocumentLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: Date;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_type: 'admin' | 'client' | 'expert';
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_share: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  modified_by?: string;
  modified_at: Date;
  change_description?: string;
}

export interface UserDocumentFavorite {
  user_id: string;
  document_id: string;
  created_at: Date;
}

export interface DocumentLabelRelation {
  document_id: string;
  label_id: string;
  created_at: Date;
}

// Types pour les requêtes API
export interface CreateDocumentRequest {
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  labels?: string[];
  read_time?: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  content?: string;
  category?: 'business' | 'technical';
  labels?: string[];
  read_time?: number;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface DocumentFilters {
  category?: 'business' | 'technical';
  search?: string;
  labels?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'created_at' | 'last_modified' | 'read_time';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentStats {
  totalDocuments: number;
  categories: {
    business: number;
    technical: number;
  };
  labels: {
    [labelName: string]: number;
  };
  lastUpdate: Date;
}

// Types pour les permissions
export interface UserPermissions {
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_share: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentApiResponse extends ApiResponse<Document> {}
export interface DocumentListApiResponse extends ApiResponse<DocumentListResponse> {}
export interface LabelListApiResponse extends ApiResponse<DocumentLabel[]> {}
export interface StatsApiResponse extends ApiResponse<DocumentStats> {}

// Types pour les hooks frontend
export interface UseDocumentsOptions {
  filters?: DocumentFilters;
  enabled?: boolean;
}

export interface UseDocumentOptions {
  id: string;
  enabled?: boolean;
}

// Types pour les événements de la GED
export interface DocumentEvent {
  type: 'created' | 'updated' | 'deleted' | 'favorited' | 'unfavorited';
  document_id: string;
  user_id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Types pour les métriques et analytics
export interface DocumentMetrics {
  total_views: number;
  unique_viewers: number;
  average_read_time: number;
  favorite_count: number;
  last_viewed?: Date;
}

export interface UserDocumentActivity {
  user_id: string;
  document_id: string;
  action: 'view' | 'edit' | 'favorite' | 'share';
  timestamp: Date;
  session_duration?: number;
}

// Types pour les exports
export interface DocumentExportOptions {
  format: 'pdf' | 'markdown' | 'html';
  include_metadata?: boolean;
  include_versions?: boolean;
}

export interface DocumentExport {
  document: Document;
  content: string;
  metadata: {
    exported_at: Date;
    exported_by: string;
    format: string;
  };
}

// Types pour les notifications
export interface DocumentNotification {
  id: string;
  user_id: string;
  document_id: string;
  type: 'new_document' | 'document_updated' | 'document_shared' | 'permission_changed';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

// Types pour les commentaires (extension future)
export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: Date;
  updated_at: Date;
  is_resolved?: boolean;
}

// Types pour les workflows (extension future)
export interface DocumentWorkflow {
  id: string;
  document_id: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  current_step: number;
  total_steps: number;
  assigned_to?: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  name: string;
  description: string;
  assigned_role: 'admin' | 'expert' | 'client';
  is_completed: boolean;
  completed_at?: Date;
  completed_by?: string;
  comments?: string;
} 