import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PerformanceChartsProps {
  kpiData: any;
  dossiers?: any[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ kpiData, dossiers = [] }) => {
  // Préparer les données pour les graphiques
  
  // 1. Données mensuelles (3 derniers mois)
  const getMonthlyData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthDossiers = dossiers.filter((d: any) => {
        const date = new Date(d.created_at);
        return date >= month && date <= monthEnd;
      });
      
      const revenus = monthDossiers
        .filter((d: any) => d.statut === 'validated')
        .reduce((sum: number, d: any) => sum + (d.montantFinal || 0), 0);
      
      months.push({
        name: month.toLocaleDateString('fr-FR', { month: 'short' }),
        dossiers: monthDossiers.length,
        revenus: Math.round(revenus),
        objectifDossiers: i === 0 ? Math.round(kpiData.objectifDossiersMonth) : 0,
        objectifRevenus: i === 0 ? Math.round(kpiData.objectifRevenusMonth) : 0
      });
    }
    
    return months;
  };

  // 2. Répartition par statut (Pie Chart)
  const getStatutData = () => {
    const statuts: {[key: string]: number} = {};
    
    dossiers.forEach((d: any) => {
      const statut = d.statut || 'inconnu';
      statuts[statut] = (statuts[statut] || 0) + 1;
    });
    
    return Object.entries(statuts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: Math.round((value / dossiers.length) * 100)
    }));
  };

  const monthlyData = getMonthlyData();
  const statutData = getStatutData();

  // Couleurs pour le Pie Chart
  const COLORS = {
    'Eligible': '#10b981',
    'Pending': '#f59e0b',
    'Validated': '#3b82f6',
    'Rejected': '#ef4444',
    'Inconnu': '#6b7280'
  };

  return (
    <div className="space-y-6">
      {/* Graphique Revenus */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📈 Évolution des Revenus
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString('fr-FR')}€`}
              labelStyle={{ color: '#1f2937' }}
            />
            <Legend />
            <Bar dataKey="revenus" fill="#10b981" name="Revenus" radius={[8, 8, 0, 0]} />
            <Bar dataKey="objectifRevenus" fill="#d1d5db" name="Objectif" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique Dossiers */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📊 Évolution des Dossiers
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip labelStyle={{ color: '#1f2937' }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="dossiers" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Dossiers"
              dot={{ fill: '#3b82f6', r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="objectifDossiers" 
              stroke="#d1d5db" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Objectif"
              dot={{ fill: '#d1d5db', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique Répartition par statut */}
      {dossiers.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🥧 Répartition par Statut
          </h4>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Inconnu} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {statutData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || COLORS.Inconnu }}
                  ></div>
                  <span className="text-sm text-gray-700">
                    {entry.name}: <strong>{entry.value}</strong> ({entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

