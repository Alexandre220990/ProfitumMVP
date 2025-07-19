// Types pour les données business expert

export interface ExpertBusiness {
  id: string;
  username: string;
  totalEarnings: number;
  monthlyEarnings: number;
  totalAssignments: number;
  completedAssignments: number;
  conversionRate: number;
  averageRating: number;
  totalClients: number;
  activeClients: number;
  created_at: string;
  updated_at: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  assignments: number;
  expenses?: number;
  netRevenue?: number;
}

export interface ProductPerformance {
  product: string;
  assignments: number;
  revenue: number;
  successRate: number;
  averageRating: number;
  averageDuration: number;
  totalClients: number;
}

export interface ClientPerformance {
  clientId: string;
  clientName: string;
  totalAssignments: number;
  totalRevenue: number;
  averageRating: number;
  lastAssignment: string;
  totalSpent: number;
  loyaltyScore: number;
}

export interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  totalAssignments: number;
  completedAssignments: number;
  conversionRate: number;
  averageRating: number;
  clientSatisfaction: number;
  averageCompletionTime: number;
  topProducts: ProductPerformance[];
  topClients: ClientPerformance[];
} 