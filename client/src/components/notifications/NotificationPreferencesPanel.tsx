import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Settings, Save, Loader2, Info, Smartphone } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NotificationTypeSettings } from './NotificationTypeSettings';
import { SLASettings } from './SLASettings';
import { NotificationActivationTutorial } from './NotificationActivationTutorial';

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

      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
            <TabsTrigger value="activation" className="text-xs sm:text-sm">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Activation</span>
              <span className="sm:hidden">Activer</span>
            </TabsTrigger>
            <TabsTrigger value="types" className="text-xs sm:text-sm">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Types</span>
              <span className="sm:hidden">Types</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="sla" className="text-xs sm:text-sm col-span-2 sm:col-span-1">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Durées SLA</span>
                <span className="sm:hidden">SLA</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="activation" className="mt-6">
            <NotificationActivationTutorial />
          </TabsContent>

          <TabsContent value="types" className="mt-6">
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Configurez vos préférences de notifications par type et par canal (email, push).
                Les notifications push nécessitent l'activation dans votre navigateur (voir l'onglet "Activation").
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

