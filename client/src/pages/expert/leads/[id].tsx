import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { 
  ArrowLeft, Mail, Phone, MessageSquare, Calendar, 
  Archive, Reply, User
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import LoadingScreen from "@/components/LoadingScreen";
import { Navigate } from "react-router-dom";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived' | 'new';
  created_at: string;
  updated_at: string;
}

const statusLabels = {
  unread: 'Non lu',
  read: 'Lu',
  replied: 'Répondu',
  archived: 'Archivé',
  new: 'Nouveau'
};

const statusColors = {
  unread: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-800',
  replied: 'bg-green-100 text-green-800',
  archived: 'bg-slate-100 text-slate-800',
  new: 'bg-blue-100 text-blue-800'
};

export default function ExpertLeadSynthese() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadMessage();
  }, [id]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      const response = await get(`/api/expert/leads/${id}`);
      if (response.success && response.data && typeof response.data === 'object' && 'id' in response.data) {
        // Normaliser le statut si nécessaire (new -> unread, pour compatibilité avec anciennes données)
        const data = response.data as any;
        const normalizedData: ContactMessage = {
          ...data,
          status: (data.status === 'new' ? 'unread' : data.status) as 'unread' | 'read' | 'replied' | 'archived' | 'new'
        };
        setMessage(normalizedData);
      } else {
        toast.error('Lead introuvable');
        navigate('/expert/dashboard');
      }
    } catch (error: any) {
      console.error('Erreur chargement lead:', error);
      toast.error(error.message || 'Erreur lors du chargement du lead');
      navigate('/expert/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    
    try {
      setUpdating(true);
      // Normaliser le statut si nécessaire (new -> unread, pour compatibilité)
      const normalizedStatus = (newStatus === 'new' ? 'unread' : newStatus) as 'unread' | 'read' | 'replied' | 'archived';
      
      // Note: Si l'API ne supporte pas encore la mise à jour de statut pour expert,
      // on peut juste mettre à jour localement pour l'instant
      setMessage(prev => prev ? { 
        ...prev, 
        status: (normalizedStatus as 'unread' | 'read' | 'replied' | 'archived'), 
        updated_at: new Date().toISOString() 
      } : null);
      
      toast.success('Statut mis à jour');
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user || user.type !== 'expert') {
    return <Navigate to="/connexion-expert" replace />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!message) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/expert/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Synthèse du lead</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reçu le {formatDate(message.created_at)}
            </p>
          </div>
        </div>
        <Badge className={statusColors[message.status]}>
          {statusLabels[message.status]}
        </Badge>
      </div>

      {/* Message Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Informations du contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium">{message.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a 
                  href={`mailto:${message.email}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {message.email}
                </a>
              </div>
            </div>
            {message.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <a 
                    href={`tel:${message.phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {message.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(message.created_at)}</p>
              </div>
            </div>
          </div>

          {message.subject && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Sujet</p>
              <p className="font-medium">{message.subject}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Message</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {message.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Statut :</label>
            <Select
              value={message.status}
              onValueChange={updateStatus}
              disabled={updating}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread">Non lu</SelectItem>
                <SelectItem value="read">Lu</SelectItem>
                <SelectItem value="replied">Répondu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.location.href = `mailto:${message.email}?subject=Re: ${message.subject || 'Votre message'}`}
            >
              <Reply className="h-4 w-4 mr-2" />
              Répondre par email
            </Button>
            <Button
              variant="outline"
              onClick={() => updateStatus('archived')}
              disabled={updating || message.status === 'archived'}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

