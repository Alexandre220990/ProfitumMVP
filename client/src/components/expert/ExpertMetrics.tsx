import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Euro, 
  Briefcase, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Star 
} from "lucide-react";
import type { ExpertAnalytics } from "@/types/analytics";
import type { ExpertBusiness } from "@/types/business";

interface ExpertMetricsProps {
  analytics: ExpertAnalytics | null;
  businessData: ExpertBusiness | null;
  className?: string;
}

export const ExpertMetrics = ({ analytics, businessData, className = "" }: ExpertMetricsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <Euro className="h-8 w-8" />;
      case 'assignments':
        return <Briefcase className="h-8 w-8" />;
      case 'conversion':
        return <Target className="h-8 w-8" />;
      case 'clients':
        return <Users className="h-8 w-8" />;
      case 'earnings':
        return <TrendingUp className="h-8 w-8" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8" />;
      case 'pending':
        return <Clock className="h-8 w-8" />;
      case 'rating':
        return <Star className="h-8 w-8" />;
      default:
        return <Euro className="h-8 w-8" />;
    }
  };

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'from-green-500 to-green-600';
      case 'assignments':
        return 'from-blue-500 to-blue-600';
      case 'conversion':
        return 'from-purple-500 to-purple-600';
      case 'clients':
        return 'from-orange-500 to-orange-600';
      case 'earnings':
        return 'from-emerald-500 to-emerald-600';
      case 'completed':
        return 'from-teal-500 to-teal-600';
      case 'pending':
        return 'from-amber-500 to-amber-600';
      case 'rating':
        return 'from-pink-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const metrics = [
    {
      type: 'revenue',
      label: 'Revenus du mois',
      value: businessData?.monthlyEarnings ? formatCurrency(businessData.monthlyEarnings) : '0€',
      trend: '+12%',
      trendPositive: true
    },
    {
      type: 'assignments',
      label: 'Missions en cours',
      value: analytics?.pendingAssignments || 0,
      trend: '+3',
      trendPositive: true
    },
    {
      type: 'conversion',
      label: 'Taux de conversion',
      value: analytics?.conversionRate ? `${analytics.conversionRate.toFixed(1)}%` : '0%',
      trend: '+2.5%',
      trendPositive: true
    },
    {
      type: 'clients',
      label: 'Prospects en cours',
      value: analytics?.prospectsInProgress || 0,
      trend: '+1',
      trendPositive: true
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric) => (
        <Card key={metric.type} className={`bg-gradient-to-r ${getMetricColor(metric.type)} text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium mb-1">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold mb-2">
                  {metric.value}
                </p>
                <div className="flex items-center">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      metric.trendPositive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metric.trend}
                  </Badge>
                  <span className="text-white/70 text-xs ml-2">
                    vs mois dernier
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-white/80">
                {getMetricIcon(metric.type)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 