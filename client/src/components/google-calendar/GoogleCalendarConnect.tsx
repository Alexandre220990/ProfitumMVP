import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { googleCalendarClientService, GoogleCalendarIntegration, ConnectIntegrationData } from '@/services/google-calendar-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Shield,
  Globe
} from 'lucide-react';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface GoogleCalendarConnectProps {
  onConnect?: (integration: GoogleCalendarIntegration) => void;
  onDisconnect?: (integrationId: string) => void;
  className?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  onDisconnect,
  className = ""
}) => {
  const { user } = useAuth();
  
  const [integrations, setIntegrations] = useState<GoogleCalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<GoogleCalendarIntegration | null>(null);

  // État du formulaire de connexion
  const [connectData, setConnectData] = useState<ConnectIntegrationData>({
    google_account_email: '',
    calendar_id: 'primary',
    is_primary: false,
    sync_enabled: true,
    sync_direction: 'bidirectional'
  });

  // Charger les intégrations au montage
  useEffect(() => {
    if (user?.id) {
      loadIntegrations();
    }
  }, [user?.id]);

  // Charger les intégrations existantes
  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await googleCalendarClientService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('❌ Erreur chargement intégrations:', error);
      toast.error('Impossible de charger les intégrations Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la connexion OAuth2
  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // Générer l'URL d'autorisation
      const { authUrl } = await googleCalendarClientService.generateAuthUrl();
      
      // Ouvrir la fenêtre d'autorisation Google
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'autorisation');
      }

      // Attendre la réponse de Google
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          const { tokens, google_account_email } = event.data;
          
          // Connecter l'intégration
          await googleCalendarClientService.connectIntegration({
            ...connectData,
            google_account_email,
            tokens: encodeURIComponent(JSON.stringify(tokens))
          });

          toast.success('Votre compte Google Calendar a été connecté avec succès');

          // Recharger les intégrations
          await loadIntegrations();
          
          // Fermer la popup
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          setConnecting(false);
          setShowConnectForm(false);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          toast.error(event.data.error || 'Erreur lors de la connexion Google');
          
          popup.close();
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout de sécurité
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
          toast.error('La connexion a pris trop de temps');
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('❌ Erreur connexion Google:', error);
      toast.error('Impossible de se connecter à Google Calendar');
      setConnecting(false);
    }
  };

  // Supprimer une intégration
  const handleDisconnect = async (integrationId: string) => {
    try {
      await googleCalendarClientService.deleteIntegration(integrationId);
      
      toast.success('L\'intégration Google Calendar a été supprimée');

      await loadIntegrations();
      
      if (onDisconnect) {
        onDisconnect(integrationId);
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      toast.error('Impossible de supprimer l\'intégration');
    }
  };

  // Mettre à jour une intégration
  const handleUpdateIntegration = async (integrationId: string, updates: any) => {
    try {
      await googleCalendarClientService.updateIntegration(integrationId, updates);
      
      toast.success('L\'intégration a été mise à jour');

      await loadIntegrations();
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      toast.error('Impossible de mettre à jour l\'intégration');
    }
  };

  // Obtenir le statut de synchronisation
  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'idle':
        return <Badge className="bg-green-100 text-green-800">Prêt</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800">Synchronisation...</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  // Obtenir l'icône de direction de synchronisation
  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'import':
        return <Globe className="h-4 w-4" />;
      case 'export':
        return <ExternalLink className="h-4 w-4" />;
      case 'bidirectional':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google Calendar</h2>
          <p className="text-gray-600 mt-1">
            Connectez votre compte Google pour synchroniser vos événements
          </p>
        </div>
        <Button
          onClick={() => setShowConnectForm(!showConnectForm)}
          disabled={connecting}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showConnectForm ? 'Annuler' : 'Connecter'}
        </Button>
      </div>

      {/* Formulaire de connexion */}
      {showConnectForm && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Nouvelle connexion Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calendar_id">Calendrier</Label>
                <select
                  id="calendar_id"
                  value={connectData.calendar_id}
                  onChange={(e) => setConnectData({ ...connectData, calendar_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="primary">Calendrier principal</option>
                </select>
              </div>

              <div>
                <Label htmlFor="sync_direction">Direction de synchronisation</Label>
                <select
                  id="sync_direction"
                  value={connectData.sync_direction}
                  onChange={(e) => setConnectData({ ...connectData, sync_direction: e.target.value as 'import' | 'export' | 'bidirectional' })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="import">Import uniquement</option>
                  <option value="export">Export uniquement</option>
                  <option value="bidirectional">Bidirectionnel</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={connectData.is_primary}
                  onChange={(e) => setConnectData({ ...connectData, is_primary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="is_primary">Calendrier principal</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sync_enabled"
                  checked={connectData.sync_enabled}
                  onChange={(e) => setConnectData({ ...connectData, sync_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="sync_enabled">Synchronisation activée</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Se connecter avec Google
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
              <p className="font-medium mb-2">🔒 Sécurité et confidentialité :</p>
              <ul className="space-y-1 text-xs">
                <li>• Nous n'accédons qu'aux calendriers que vous autorisez</li>
                <li>• Vos données restent sous votre contrôle</li>
                <li>• Vous pouvez révoquer l'accès à tout moment</li>
                <li>• Conformité RGPD et standards de sécurité</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des intégrations existantes */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Intégrations connectées ({integrations.length})
          </h3>
          
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {integration.google_account_email}
                        </h4>
                        {integration.is_primary && (
                          <Badge className="bg-blue-100 text-blue-800">Principal</Badge>
                        )}
                        {getSyncStatusBadge(integration.sync_status)}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {getSyncDirectionIcon(integration.sync_direction)}
                          {integration.sync_direction === 'import' && 'Import'}
                          {integration.sync_direction === 'export' && 'Export'}
                          {integration.sync_direction === 'bidirectional' && 'Bidirectionnel'}
                        </span>
                        
                        {integration.last_sync_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière sync: {new Date(integration.last_sync_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {integration.error_message && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Erreur :</span>
                      <span className="text-sm">{integration.error_message}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && integrations.length === 0 && !showConnectForm && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune intégration Google Calendar
            </h3>
            <p className="text-gray-600 mb-4">
              Connectez votre premier compte Google pour commencer la synchronisation
            </p>
            <Button onClick={() => setShowConnectForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connecter Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de configuration (simplifié) */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Configuration - {selectedIntegration.google_account_email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Calendrier principal</Label>
                <input
                  type="checkbox"
                  checked={selectedIntegration.is_primary}
                  onChange={(e) => 
                    handleUpdateIntegration(selectedIntegration.id, { is_primary: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label>Synchronisation activée</Label>
                <input
                  type="checkbox"
                  checked={selectedIntegration.sync_enabled}
                  onChange={(e) => 
                    handleUpdateIntegration(selectedIntegration.id, { sync_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIntegration(null)}
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 