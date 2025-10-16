import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KPIItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: string;
}

interface KPISectionProps {
  kpis: KPIItem[];
  loading?: boolean;
}

export const KPISection: React.FC<KPISectionProps> = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded mt-2 w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {kpi.label}
                  </p>
                  <p className={`text-2xl font-bold ${kpi.color || 'text-gray-900'}`}>
                    {kpi.value}
                  </p>
                  {kpi.subtext && (
                    <p className="text-xs text-gray-500 mt-1">{kpi.subtext}</p>
                  )}
                </div>
                {Icon && (
                  <Icon className={`w-8 h-8 ${kpi.color || 'text-blue-600'}`} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

