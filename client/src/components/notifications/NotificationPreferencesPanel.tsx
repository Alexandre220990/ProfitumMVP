import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Settings, Save, Loader2, Info } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationTypeSettings } from './NotificationTypeSettings';
import { SLASettings } from './SLASettings';

export function NotificationPreferencesPanel() {
  const {
    preferences,
    slaPreferences,
    loading,
    saving,
    isAdmin,
    savePreferences,
    toggleType,
    updateChannel,
    updateSLAChannel,
    updateSLADurations,
  } = useNotificationPreferences();

  const [activeTab, setActiveTab] = useState('types');

  const handleSave = async () => {
    try {
      await savePreferences();
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement des préférences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-600" />
            Paramètres de notifications
          </CardTitle>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="types">
              <Bell className="w-4 h-4 mr-2" />
              Types de notifications
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="sla">
                <Settings className="w-4 h-4 mr-2" />
                Durées SLA
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="types" className="mt-6">
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Les notifications push ne pourront être activées qu'en téléchargeant l'application mobile.
              </AlertDescription>
            </Alert>
            <NotificationTypeSettings
              preferences={preferences}
              onUpdateChannel={updateChannel}
              onUpdateSLAChannel={updateSLAChannel}
              onToggleType={toggleType}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="sla" className="mt-6">
              <SLASettings
                slaPreferences={slaPreferences}
                onUpdateSLADurations={updateSLADurations}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

