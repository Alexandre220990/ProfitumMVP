// import React from 'react';
import HeaderClient from '@/components/HeaderClient';
import { Card } from "@/components/ui/card";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const KPIPage: React.FC = () => { // Données fictives pour les graphiques
  const barData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], datasets: [
      {
        label: 'Gains obtenus (€)', data: [2000, 3500, 4000, 2500, 5000, 9000], backgroundColor: '#2563eb', borderRadius: 8 },
      { label: 'Gains potentiels (€)', data: [8000, 12000, 10000, 9000, 11000, 8000], backgroundColor: '#60a5fa', borderRadius: 8 }
    ]
  };

  const pieData = { labels: ['TICPE', 'URSSAF', 'CIR', 'CEE'], datasets: [
      {
        label: 'Répartition des gains', data: [18000, 12000, 8000, 4000], backgroundColor: ['#2563eb', '#60a5fa', '#fbbf24', '#10b981'], borderWidth: 1 }
    ]
  };

  return (
    <div>
      <HeaderClient />
      <div className="container mx-auto p-4 mt-20">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Analytique & KPI</h1>
        <div className="grid grid-cols-1 md: grid-cols-2 gap-8">
          <Card className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Évolution des gains</h2>
            <Bar data={ barData } options={ {
              responsive: true, plugins: { legend: { position: 'top' as const } },
              scales: { y: { beginAtZero: true } }
            }} />
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Répartition des gains par produit</h2>
            <Pie data={ pieData } options={ {
              responsive: true, plugins: { legend: { position: 'bottom' as const } }
            }} />
          </Card>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">58 000€</div>
            <div className="text-gray-700">Gains potentiels</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">18 000€</div>
            <div className="text-gray-700">Gains obtenus</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-2">90%</div>
            <div className="text-gray-700">Taux de réussite</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KPIPage; 