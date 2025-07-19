// Types pour les analytics expert

export interface ExpertAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalEarnings: number;
  monthlyEarnings: number;
  conversionRate: number;
  prospectsInProgress: number;
  averageCompletionTime: number;
  clientSatisfaction: number;
  topProducts: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  performanceByMonth: Array<{
    month: string;
    assignments: number;
    revenue: number;
    completionRate: number;
  }>;
  clientDistribution: Array<{
    clientType: string;
    count: number;
    percentage: number;
  }>;
  timeAnalysis: {
    averageResponseTime: number;
    averageProcessingTime: number;
    peakHours: string[];
    preferredDays: string[];
  };
}

export interface AnalyticsFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  productType?: string;
  clientType?: string;
  status?: string;
}

export interface AnalyticsExport {
  format: 'csv' | 'xlsx' | 'pdf';
  data: ExpertAnalytics;
  filters?: AnalyticsFilter;
} 