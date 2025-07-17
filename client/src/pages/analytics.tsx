import React from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  // Vérifier les permissions (admin et expert uniquement)
  if (!user || (user.type !== 'admin' && user.type !== 'expert')) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Analytics Avancées
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dashboard complet avec métriques en temps réel, graphiques interactifs et export de données
          </p>
        </div>

        <AdvancedAnalyticsDashboard 
          showRealTime={true}
          defaultTimeRange="30d"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        />
      </div>
    </div>
  );
};

export default AnalyticsPage; 