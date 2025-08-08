import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Activity, BarChart3, FileText, Star, Users } from "lucide-react";
import api from '../../lib/api';

interface GEDMetrics {
  totalDocuments: number;
  totalLabels: number;
  totalFavorites: number;
  documentsByCategory: {
    business: number;
    technical: number;
  };
  documentsByUserType: {
    admin: number;
    expert: number;
    client: number;
  };
  recentActivity: {
    documentsCreated: number;
    documentsModified: number;
    favoritesAdded: number;
  };
  popularDocuments: Array<{
    id: string;
    title: string;
    views: number;
    favorites: number;
  }>;
  userEngagement: {
    activeUsers: number;
    documentsViewed: number;
    averageReadTime: number;
  };
}

interface GEDMetricsProps {
  refreshTrigger?: number;
}

export default function GEDMetrics({ refreshTrigger }: GEDMetricsProps) {
  const [metrics, setMetrics] = useState<GEDMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/documents/metrics');
      
      if (response.data.success) {
        setMetrics(response.data.data);
      } else {
        throw new Error(response.data.error || 'Erreur lors du chargement des métriques');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            <Activity className="w-8 h-8 mx-auto mb-2" />
            <p>Erreur lors du chargement des métriques</p>
            <button 
              onClick={loadMetrics}
              className="text-blue-600 hover:underline mt-2"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      { /* Métriques principales */ }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{metrics.totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Favoris</p>
                <p className="text-2xl font-bold">{metrics.totalFavorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{metrics.userEngagement.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Temps Lecture Moyen</p>
                <p className="text-2xl font-bold">{metrics.userEngagement.averageReadTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      { /* Répartition par catégorie */ }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Répartition par Catégorie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Documents Métier</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{metrics.documentsByCategory.business}</span>
                  <Badge variant="outline">
                    {Math.round((metrics.documentsByCategory.business / metrics.totalDocuments) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Documents Techniques</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{metrics.documentsByCategory.technical}</span>
                  <Badge variant="outline">
                    {Math.round((metrics.documentsByCategory.technical / metrics.totalDocuments) * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Activité Récente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Documents créés</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">{metrics.recentActivity.documentsCreated}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Documents modifiés</span>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">{metrics.recentActivity.documentsModified}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Favoris ajoutés</span>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{metrics.recentActivity.favoritesAdded}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      { /* Documents populaires */ }
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Documents Populaires</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.popularDocuments.map((doc, index) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-gray-600">
                      {doc.views} vues • {doc.favorites} favoris
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{doc.views} vues</Badge>
                  <Badge variant="outline">{doc.favorites} ❤️</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      { /* Engagement utilisateur */ }
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Engagement Utilisateur</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{metrics.userEngagement.activeUsers}</p>
              <p className="text-sm text-gray-600">Utilisateurs actifs</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{metrics.userEngagement.documentsViewed}</p>
              <p className="text-sm text-gray-600">Documents consultés</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{metrics.userEngagement.averageReadTime}</p>
              <p className="text-sm text-gray-600">Min. lecture moy.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 