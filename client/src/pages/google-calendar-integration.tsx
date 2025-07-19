import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useGoogleCalendar } from '@/hooks/use-google-calendar';
import { GoogleCalendarConnect } from '@/components/google-calendar/GoogleCalendarConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Settings, 
  BarChart3, 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Users,
  Globe,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function GoogleCalendarIntegrationPage() {
  const { user } = useAuth();
  const {
    integrations,
    primaryIntegration,
    isConnected,
    loading,
    syncing,
    syncCalendar,
    refreshIntegrations
  } = useGoogleCalendar();

  // Charger les données au montage
  useEffect(() => {
    if (user?.id) {
      refreshIntegrations();
    }
  }, [user?.id, refreshIntegrations]);

  // Gérer la synchronisation manuelle
  const handleManualSync = async (integrationId: string) => {
    try {
      await syncCalendar(integrationId, 'full');
    } catch (error) {
      console.error('❌ Erreur synchronisation manuelle:', error);
    }
  };

  // Obtenir les statistiques de synchronisation
  const getSyncStats = () => {
    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter(i => i.sync_enabled).length;
    const errorIntegrations = integrations.filter(i => i.sync_status === 'error').length;
    const syncingIntegrations = integrations.filter(i => i.sync_status === 'syncing').length;

    return {
      total: totalIntegrations,
      active: activeIntegrations,
      errors: errorIntegrations,
      syncing: syncingIntegrations
    };
  };

  const stats = getSyncStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Intégration Google Calendar
              </h1>
              <p className="text-gray-600 mt-2">
                Synchronisez vos événements Profitum avec Google Calendar
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refreshIntegrations}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              {isConnected && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connecté
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total intégrations</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actives</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En synchronisation</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.syncing}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Erreurs</p>
                      <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intégration principale */}
            {primaryIntegration && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Intégration principale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {primaryIntegration.google_account_email}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {primaryIntegration.sync_direction === 'bidirectional' && <RefreshCw className="h-3 w-3" />}
                          {primaryIntegration.sync_direction === 'import' && <Globe className="h-3 w-3" />}
                          {primaryIntegration.sync_direction === 'export' && <ExternalLink className="h-3 w-3" />}
                          {primaryIntegration.sync_direction}
                        </span>
                        
                        {primaryIntegration.last_sync_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière sync: {new Date(primaryIntegration.last_sync_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleManualSync(primaryIntegration.id)}
                      disabled={syncing}
                      variant="outline"
                      size="sm"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Sync...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Synchroniser
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guide rapide */}
            <Card>
              <CardHeader>
                <CardTitle>Guide rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Connectez votre compte</h4>
                    <p className="text-sm text-gray-600">
                      Autorisez Profitum à accéder à votre Google Calendar
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Configurez la synchronisation</h4>
                    <p className="text-sm text-gray-600">
                      Choisissez la direction et la fréquence de synchronisation
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Profitez de la synchronisation</h4>
                    <p className="text-sm text-gray-600">
                      Vos événements sont automatiquement synchronisés
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intégrations */}
          <TabsContent value="integrations">
            <GoogleCalendarConnect />
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de synchronisation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Configurez les paramètres globaux de synchronisation Google Calendar.
                </p>
                {/* TODO: Ajouter les paramètres de synchronisation */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gérez les notifications liées à la synchronisation Google Calendar.
                </p>
                {/* TODO: Ajouter les paramètres de notifications */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité et confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🔒 Vos données sont protégées</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Accès limité uniquement aux calendriers autorisés</li>
                    <li>• Tokens d'accès chiffrés et sécurisés</li>
                    <li>• Conformité RGPD et standards de sécurité</li>
                    <li>• Possibilité de révoquer l'accès à tout moment</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">✅ Bonnes pratiques</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Utilisez des mots de passe forts pour votre compte Google</li>
                    <li>• Activez l'authentification à deux facteurs</li>
                    <li>• Vérifiez régulièrement les applications connectées</li>
                    <li>• Déconnectez les intégrations non utilisées</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Informations importantes</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Les tokens d'accès expirent automatiquement</li>
                    <li>• La synchronisation peut être temporairement interrompue</li>
                    <li>• Contactez le support en cas de problème de sécurité</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions de sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Révoquer tous les accès</h4>
                    <p className="text-sm text-gray-600">
                      Déconnecte toutes les intégrations Google Calendar
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Révoquer
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Exporter les données</h4>
                    <p className="text-sm text-gray-600">
                      Téléchargez vos données de synchronisation
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Exporter
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Logs d'activité</h4>
                    <p className="text-sm text-gray-600">
                      Consultez l'historique des actions de synchronisation
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir les logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 