import { useEffect, useState } from "react";
import { toast } from "sonner";
import { put, get } from "../lib/api";
import { ApiResponse } from "../types/api";
import { CardContent, Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertCircle, Clock, User, Building, Check, X, FileText, Calendar, CheckCircle } from "lucide-react";

interface Reminder { id: string;
  type: 'dossier_incomplet' | 'document_manquant' | 'sla_expert' | 'sla_client';
  client_id: string;
  expert_id?: string;
  produit_id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  status: 'pending' | 'handled' | 'cancelled';
  handled_at?: string;
  created_at: string;
  Client?: {
    id: string;
    email: string;
    company_name: string;
    first_name: string;
    last_name: string; };
  Expert?: { id: string;
    email: string;
    name: string; };
  ClientProduitEligible?: { id: string;
    ProduitEligible: {
      nom: string;
      description: string; };
  };
}

interface RemindersListProps { showHandled?: boolean;
  maxItems?: number;
  onReminderHandled?: (reminderId: string) => void }

export const RemindersList: React.FC<RemindersListProps> = ({ showHandled = false, maxItems = 10, onReminderHandled }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingReminder, setHandlingReminder] = useState<string | null>(null);

  useEffect(() => { loadReminders(); }, [showHandled]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Reminder[]> = await get<Reminder[]>('/api/reminders');
      
      if (response.success && response.data) {
        let filteredReminders = response.data;
        
        if (!showHandled) {
          filteredReminders = filteredReminders.filter(r => r.status === 'pending');
        }
        
        // Trier par priorité et date
        filteredReminders.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        setReminders(filteredReminders.slice(0, maxItems));
      } else {
        setReminders([]);
      }
    } catch (error) {
      console.error('Erreur chargement relances: ', error);
      toast.error("Impossible de charger les relances");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReminder = async (reminderId: string, action: 'handle' | 'cancel') => {
    try {
      setHandlingReminder(reminderId);
      
      if (action === 'handle') {
        await put(`/api/reminders/${reminderId}/handle`, { notes: 'Traité par l\'utilisateur' });
        
        toast.success("La relance a été marquée comme traitée");
        
        onReminderHandled?.(reminderId);
      }
      
      // Recharger les relances
      await loadReminders();
    } catch (error) {
      console.error('Erreur traitement relance: ', error);
      toast.error("Impossible de traiter la relance");
    } finally {
      setHandlingReminder(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dossier_incomplet':
        return <FileText className="w-4 h-4" />;
      case 'document_manquant':
        return <FileText className="w-4 h-4" />;
      case 'sla_expert':
        return <User className="w-4 h-4" />;
      case 'sla_client':
        return <Building className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dossier_incomplet':
        return 'Dossier incomplet';
      case 'document_manquant':
        return 'Document manquant';
      case 'sla_expert':
        return 'SLA Expert';
      case 'sla_client':
        return 'SLA Client';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune relance en attente
          </h3>
          <p className="text-gray-600">
            {showHandled 
              ? "Aucune relance traitée trouvée" 
              : "Toutes vos relances sont à jour !"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <Card 
          key={reminder.id} 
          className={`border-l-4 ${
            reminder.priority === 'critical' ? 'border-l-red-500' :
            reminder.priority === 'high' ? 'border-l-orange-500' :
            reminder.priority === 'medium' ? 'border-l-yellow-500' :
            'border-l-green-500'}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(reminder.type)}
                  <span className="text-sm font-medium text-gray-600">
                    {getTypeLabel(reminder.type)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(reminder.priority)}`}
                  >
                    {reminder.priority}
                  </Badge>
                  {isOverdue(reminder.due_date) && (
                    <Badge variant="destructive" className="text-xs">
                      En retard
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-900 mb-2">
                  {reminder.message}
                </p>
                
                {reminder.ClientProduitEligible && (
                  <p className="text-xs text-gray-600 mb-2">
                    Produit: {reminder.ClientProduitEligible.ProduitEligible.nom}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Créée: {formatDate(reminder.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Échéance: {formatDate(reminder.due_date)}</span>
                  </div>
                  {reminder.handled_at && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Traitée: {formatDate(reminder.handled_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {reminder.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleReminder(reminder.id, 'handle')}
                    disabled={handlingReminder === reminder.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {handlingReminder === reminder.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReminder(reminder.id, 'cancel')}
                    disabled={handlingReminder === reminder.id}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 