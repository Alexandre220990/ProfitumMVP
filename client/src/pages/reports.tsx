import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import HeaderClient from "@/components/HeaderClient";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft } from "lucide-react";

const kpis = [
  { label: "Taux de réussite", value: "85%" },
  { label: "Temps moyen de traitement", value: "12 jours" },
  { label: "Dossiers actifs", value: "24" },
  { label: "Revenus générés", value: "€ 18,450" },
];

const performanceData = [
  { mois: "Jan", dossiers: 10 },
  { mois: "Fév", dossiers: 15 },
  { mois: "Mar", dossiers: 25 },
  { mois: "Avr", dossiers: 20 },
];

const statusDistribution = [
  { name: "Finalisés", value: 40, color: "#10B981" },
  { name: "En cours", value: 30, color: "#3B82F6" },
  { name: "Refusés", value: 10, color: "#EF4444" },
  { name: "En attente", value: 20, color: "#F59E0B" },
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderClient />
      <div className="container mx-auto px-6 py-10">
        {/* Bouton retour */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
            </Button>
          </Link>
        </div>

        {/* Titre principal */}
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">📊 Mes rapports et indicateurs de performance</h1>

        {/* KPIs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">📌 Indicateurs clés</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <Card key={index} className="shadow-lg bg-white rounded-xl text-center p-6">
                <h3 className="text-lg font-medium text-gray-600">{kpi.label}</h3>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Courbe d'évolution */}
          <Card className="shadow-lg bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📈 Évolution des performances</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="dossiers" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Répartition des statuts */}
          <Card className="shadow-lg bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Répartition des dossiers</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={80} stroke="#ffffff" strokeWidth={2}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bouton d'action */}
        <div className="flex justify-center mt-12">
          <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg rounded-lg shadow-md">
            📥 Télécharger mon rapport détaillé
          </Button>
        </div>
      </div>
    </div>
  );
}
