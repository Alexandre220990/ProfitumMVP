// import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientNotifications } from '@/hooks/use-client-notifications';
import { useAuth } from '@/hooks/use-auth';

export const TestNotifications: React.FC = () => {
  const { user } = useAuth();
  const { createNotification } = useClientNotifications();

  const testNotifications = [
    {
      type: 'message_received',
      title: 'Nouveau message reçu',
      message: 'L\'expert Jean Dupont vous a envoyé un nouveau message concernant votre dossier TICPE.',
      priority: 'normal' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'messagerie',
        conversation_id: 'test-conversation-1'
      }
    },
    {
      type: 'document_uploaded',
      title: 'Nouveau document reçu',
      message: 'L\'expert a uploadé le rapport d\'audit pour votre dossier DFS.',
      priority: 'normal' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'documents'
      }
    },
    {
      type: 'document_required',
      title: 'Document à envoyer',
      message: 'Vous devez envoyer votre facture d\'électricité pour finaliser le dossier TICPE.',
      priority: 'high' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'dossier',
        dossier_id: 'test-dossier-1',
        target_id: 'ticpe'
      }
    },
    {
      type: 'dossier_accepted',
      title: 'Dossier accepté',
      message: 'Félicitations ! Votre dossier TICPE a été accepté et validé par l\'expert.',
      priority: 'normal' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'dossier',
        dossier_id: 'test-dossier-1',
        target_id: 'ticpe'
      }
    },
    {
      type: 'dossier_rejected',
      title: 'Dossier refusé',
      message: 'Votre dossier a été refusé. Veuillez retourner sur la marketplace pour choisir un nouvel expert.',
      priority: 'urgent' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'marketplace'
      }
    },
    {
      type: 'deadline_reminder',
      title: 'Échéance approchante',
      message: 'Rappel : vous avez 3 jours pour envoyer les documents manquants pour votre dossier.',
      priority: 'high' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'dossier',
        dossier_id: 'test-dossier-1',
        target_id: 'ticpe'
      }
    },
    {
      type: 'message_urgent',
      title: 'Message urgent',
      message: 'URGENT : L\'expert a besoin de documents supplémentaires immédiatement.',
      priority: 'urgent' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'messagerie',
        conversation_id: 'test-conversation-1'
      }
    },
    {
      type: 'document_approved',
      title: 'Document approuvé',
      message: 'Votre facture d\'électricité a été approuvée par l\'expert.',
      priority: 'normal' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'documents'
      }
    },
    {
      type: 'document_rejected',
      title: 'Document rejeté',
      message: 'Votre facture d\'électricité a été rejetée. Veuillez fournir une version plus récente.',
      priority: 'high' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'documents'
      }
    },
    {
      type: 'dossier_step_completed',
      title: 'Étape terminée',
      message: 'L\'étape "Validation des documents" de votre dossier TICPE est terminée.',
      priority: 'normal' as const,
      actionData: {
        action_type: 'redirect',
        target_page: 'dossier',
        dossier_id: 'test-dossier-1',
        target_id: 'ticpe'
      }
    }
  ];

  const handleCreateTestNotification = async (notification: typeof testNotifications[0]) => {
    if (!user?.id) {
      alert('Utilisateur non connecté');
      return;
    }

    const notificationId = await createNotification(
      notification.type,
      notification.title,
      notification.message,
      notification.priority,
      notification.actionData
    );

    if (notificationId) {
      alert(`Notification créée avec succès ! ID: ${notificationId}`);
    } else {
      alert('Erreur lors de la création de la notification');
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Test des Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Veuillez vous connecter pour tester les notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Test des Notifications Client</CardTitle>
        <p className="text-sm text-gray-600">
          Cliquez sur les boutons ci-dessous pour créer des notifications de test.
          Elles apparaîtront dans le dropdown de notifications du header.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testNotifications.map((notification, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.priority}
                  </span>
                  <span className="text-xs text-gray-500">{notification.type}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleCreateTestNotification(notification)}
                className="w-full"
              >
                Créer cette notification
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 