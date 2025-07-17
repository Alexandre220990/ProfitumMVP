import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, BarChart3, FileText, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  downloadUrl?: string;
  size?: string;
  description?: string;
}

const generateMockReports = (): Report[] => [
  {
    id: "1",
    title: "Rapport d'audit TICPE 2024",
    type: "Audit",
    date: "2024-01-15",
    status: "completed",
    downloadUrl: "/reports/audit-ticpe-2024.pdf",
    size: "2.4 MB",
    description: "Analyse complète de votre éligibilité TICPE et recommandations d'optimisation"
  },
  {
    id: "2", 
    title: "Analyse des économies URSSAF",
    type: "Analyse",
    date: "2024-01-10",
    status: "completed",
    downloadUrl: "/reports/analyse-urssaf.pdf",
    size: "1.8 MB",
    description: "Détail des économies réalisées sur vos cotisations URSSAF"
  },
  {
    id: "3",
    title: "Rapport DFS - Optimisation fiscale",
    type: "Optimisation",
    date: "2024-01-08",
    status: "completed",
    downloadUrl: "/reports/optimisation-dfs.pdf",
    size: "3.1 MB",
    description: "Plan d'optimisation de votre Déduction Forfaitaire Spécifique"
  },
  {
    id: "4",
    title: "Audit énergétique préliminaire",
    type: "Audit",
    date: "2024-01-05",
    status: "in_progress",
    size: "En cours",
    description: "Évaluation initiale de votre consommation énergétique"
  }
];

export default function Reports() { 
  const [reports] = useState<Report[]>(generateMockReports());
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredReports = reports.filter(report => {
    if (selectedFilter === "all") return true;
    return report.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  const handleDownload = (report: Report) => {
    if (report.downloadUrl) {
      // Simulation d'un téléchargement
      console.log(`Téléchargement de ${report.title}`);
      // Ici vous pourriez implémenter la vraie logique de téléchargement
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'audit':
        return <BarChart3 className="w-5 h-5" />;
      case 'analyse':
        return <FileText className="w-5 h-5" />;
      case 'optimisation':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
                <p className="text-gray-600">Consultez et téléchargez vos rapports d'analyse</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrer par type :</span>
              </div>
              <div className="flex gap-2">
                {['all', 'audit', 'analyse', 'optimisation'].map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter === 'all' ? 'Tous' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Grille des rapports */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <span className="text-lg font-semibold">{report.title}</span>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status === 'completed' ? 'Terminé' : 
                       report.status === 'in_progress' ? 'En cours' : 'En attente'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {report.size}
                      </span>
                    </div>
                    {report.downloadUrl && report.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    )}
                    {report.status === 'in_progress' && (
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <span className="text-sm text-gray-500">Génération en cours...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Message si aucun rapport */}
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport trouvé</h3>
              <p className="text-gray-600">Aucun rapport ne correspond à votre filtre sélectionné.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
