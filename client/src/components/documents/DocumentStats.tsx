import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Activity, FileText, CheckCircle } from "lucide-react";

interface DocumentStatsProps { 
  stats: {
    totalDocuments: number;
    totalChartes: number;
    chartesSignees: number;
    totalAudits: number;
    auditsEnCours: number;
    totalSimulations: number;
    simulationsCompletees: number;
    totalGuides: number;
    gainsPotentiels: number;
    total_files: number;
    total_size: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    recent_uploads: number; 
  };
  className?: string;
  showDetails?: boolean;
  variant?: 'compact' | 'detailed' | 'dashboard';
}

export default function DocumentStats({ 
  stats, 
  className = '', 
  showDetails = true, 
  variant = 'detailed' 
}: DocumentStatsProps) { 
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; 
  };

  const getCategoryIcon = (category: string) => { 
    switch (category) {
      case 'charte': return FileText;
      case 'audit': return BarChart3;
      case 'simulation': return TrendingUp;
      case 'guide': return Activity;
      case 'rapport': return FileText;
      case 'facture': return FileText;
      default: return FileText; 
    }
  };

  const getStatusColor = (status: string) => { 
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200'; 
    }
  };

  if (variant === 'compact') { 
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Gains</p>
                <p className="text-2xl font-bold">
                  {stats.gainsPotentiels.toLocaleString()}€
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Audits</p>
                <p className="text-2xl font-bold">{stats.totalAudits}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Chartes</p>
                <p className="text-2xl font-bold">{stats.totalChartes}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'dashboard') { 
    return (
      <div className={`space-y-6 ${className}`}>
        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Documents</p>
                  <p className="text-3xl font-bold">{stats.totalDocuments}</p>
                  <p className="text-blue-200 text-sm mt-1">
                    +{stats.recent_uploads} ce mois
                  </p>
                </div>
                <FileText className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Gains Potentiels</p>
                  <p className="text-3xl font-bold">
                    {stats.gainsPotentiels.toLocaleString()}€
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    {stats.chartesSignees} chartes signées
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Audits en cours</p>
                  <p className="text-3xl font-bold">{stats.auditsEnCours}</p>
                  <p className="text-purple-200 text-sm mt-1">
                    {stats.totalAudits} au total
                  </p>
                </div>
                <BarChart3 className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Espace utilisé</p>
                  <p className="text-3xl font-bold">{formatFileSize(stats.total_size)}</p>
                  <p className="text-orange-200 text-sm mt-1">
                    {stats.total_files} fichiers
                  </p>
                </div>
                <FileText className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et détails */}
        {showDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Répartition par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_category).map(([category, count]) => {
                    const Icon = getCategoryIcon(category);
                    const percentage = stats.total_files > 0 ? (count / stats.total_files) * 100 : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium capitalize">
                            {category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Statuts des documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Statuts des documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.files_by_status).map(([status, count]) => {
                    const percentage = stats.total_files > 0 ? (count / stats.total_files) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(status)}>
                            {status === 'approved' ? 'Validé' :
                             status === 'rejected' ? 'Rejeté' :
                             status === 'pending' ? 'En attente' : status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                status === 'approved' ? 'bg-green-600' :
                                status === 'rejected' ? 'bg-red-600' :
                                status === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Variant détaillé par défaut
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats.recent_uploads} ce mois
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gains Potentiels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.gainsPotentiels.toLocaleString()}€
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.chartesSignees} chartes signées
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audits en cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.auditsEnCours}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalAudits} au total
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espace utilisé</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.total_size)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_files} fichiers
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails supplémentaires */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chartes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{stats.totalChartes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Signées</span>
                  <span className="font-semibold text-green-600">{stats.chartesSignees}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En attente</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.totalChartes - stats.chartesSignees}
                  </span>
                </div>
                <Progress 
                  value={(stats.chartesSignees / stats.totalChartes) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{stats.totalAudits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En cours</span>
                  <span className="font-semibold text-blue-600">{stats.auditsEnCours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Terminés</span>
                  <span className="font-semibold text-green-600">
                    {stats.totalAudits - stats.auditsEnCours}
                  </span>
                </div>
                <Progress 
                  value={(stats.auditsEnCours / stats.totalAudits) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Simulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-semibold">{stats.totalSimulations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Complétées</span>
                  <span className="font-semibold text-green-600">{stats.simulationsCompletees}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En cours</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.totalSimulations - stats.simulationsCompletees}
                  </span>
                </div>
                <Progress 
                  value={stats.totalSimulations > 0 ? (stats.simulationsCompletees / stats.totalSimulations) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 