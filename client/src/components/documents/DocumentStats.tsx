import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  FileText, 
  CheckCircle,
  Upload,
  HardDrive,
  PieChart,
  Tag,
  RefreshCw
} from "lucide-react";

interface DocumentStatsProps { 
  userId?: string;
  stats?: {
    total_files: number;
    total_size: number;
    recent_uploads: number;
    files_by_category: { [key: string]: number };
    files_by_status: { [key: string]: number };
    files_by_product: { [key: string]: number };
    storage_usage: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  className?: string;

  variant?: 'compact' | 'detailed' | 'dashboard';
}

export default function DocumentStats({ 
  userId,
  stats: propStats, 
  className = '', 
  variant = 'detailed' 
}: DocumentStatsProps) { 
  const [stats, setStats] = useState(propStats);
  const [loading, setLoading] = useState(!propStats);

  useEffect(() => {
    if (propStats) {
      setStats(propStats);
      setLoading(false);
    } else if (userId) {
      loadStats();
    }
  }, [userId, propStats]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/stats/${userId}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; 
  };

  const getCategoryIcon = (category: string) => { 
    switch (category.toLowerCase()) {
      case 'identity': return FileText;
      case 'financial': return TrendingUp;
      case 'legal': return CheckCircle;
      case 'technical': return Activity;
      case 'kbis': return FileText;
      case 'immatriculation': return Activity;
      case 'facture': return FileText;
      case 'contrat': return CheckCircle;
      default: return FileText; 
    }
  };

  const getStatusColor = (status: string) => { 
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'uploaded': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200'; 
    }
  };

  const getProductColor = (product: string) => {
    switch (product.toLowerCase()) {
      case 'ticpe': return 'bg-blue-500';
      case 'urssaf': return 'bg-green-500';
      case 'foncier': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune statistique disponible</p>
      </div>
    );
  }

  if (variant === 'compact') { 
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Documents</p>
                <p className="text-2xl font-bold">{stats.total_files}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Espace</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(stats.total_size)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Récents</p>
                <p className="text-2xl font-bold">{stats.recent_uploads}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Stockage</p>
                <p className="text-2xl font-bold">
                  {stats.storage_usage.percentage.toFixed(1)}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Statistiques Documentaires</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_files}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Espace Utilisé</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(stats.total_size)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Récemment Ajoutés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PieChart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stockage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.storage_usage.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression du stockage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Utilisation du stockage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {formatFileSize(stats.storage_usage.used)} / {formatFileSize(stats.storage_usage.limit)}
              </span>
              <span className="text-sm text-gray-500">
                {stats.storage_usage.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={stats.storage_usage.percentage} 
              className="h-3"
              style={{
                backgroundColor: stats.storage_usage.percentage > 80 ? '#fef2f2' : '#f3f4f6'
              }}
            />
            {stats.storage_usage.percentage > 80 && (
              <p className="text-sm text-red-600">
                ⚠️ Espace de stockage presque plein
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Onglets détaillés */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Par Catégorie</TabsTrigger>
          <TabsTrigger value="status">Par Statut</TabsTrigger>
          <TabsTrigger value="products">Par Produit</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Documents par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.files_by_category).map(([category, count]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Documents par statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.files_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                      <span className="font-medium capitalize">{status}</span>
                    </div>
                    <Badge className={getStatusColor(status)}>{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Documents par produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.files_by_product).map(([product, count]) => (
                  <div key={product} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getProductColor(product)}`}></div>
                      <span className="font-medium">{product}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 