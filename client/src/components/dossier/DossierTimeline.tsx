import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle,
  Bell,
  Calendar,
  FileText,
  Phone,
  Users,
  Clock,
  MessageSquare,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { get, post, patch, del } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

type CommentCategory = 'alert' | 'rdv_event' | 'document' | 'status_change' | 'expert_action' | 'apporteur_action';
type CommentPriority = 'low' | 'medium' | 'high' | 'critical';

interface DossierComment {
  id: string;
  dossier_id: string;
  comment_type: 'system' | 'manual';
  category: CommentCategory;
  event_type: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: CommentPriority;
  created_by?: string;
  created_by_type?: 'expert' | 'admin' | 'apporteur' | 'system';
  created_at: string;
  updated_at: string;
  visible_to_expert: boolean;
  visible_to_apporteur: boolean;
  visible_to_admin: boolean;
  creator?: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
}

interface DossierTimelineProps {
  dossierId: string;
  userType: 'expert' | 'admin' | 'apporteur';
}

// ============================================================================
// HELPERS
// ============================================================================

const getCategoryIcon = (category: CommentCategory) => {
  switch (category) {
    case 'alert':
      return AlertCircle;
    case 'rdv_event':
      return Calendar;
    case 'document':
      return FileText;
    case 'status_change':
      return CheckCircle;
    case 'expert_action':
      return Phone;
    case 'apporteur_action':
      return Users;
    default:
      return MessageSquare;
  }
};

const getCategoryColor = (category: CommentCategory) => {
  switch (category) {
    case 'alert':
      return 'text-red-600 bg-red-50';
    case 'rdv_event':
      return 'text-blue-600 bg-blue-50';
    case 'document':
      return 'text-purple-600 bg-purple-50';
    case 'status_change':
      return 'text-green-600 bg-green-50';
    case 'expert_action':
      return 'text-orange-600 bg-orange-50';
    case 'apporteur_action':
      return 'text-teal-600 bg-teal-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getCategoryLabel = (category: CommentCategory) => {
  switch (category) {
    case 'alert':
      return 'Alerte';
    case 'rdv_event':
      return 'RDV';
    case 'document':
      return 'Document';
    case 'status_change':
      return 'Statut';
    case 'expert_action':
      return 'Action Expert';
    case 'apporteur_action':
      return 'Action Apporteur';
    default:
      return 'Autre';
  }
};

const getPriorityBadge = (priority?: CommentPriority) => {
  if (!priority) return null;

  const config = {
    low: { label: 'Faible', color: 'bg-gray-100 text-gray-700' },
    medium: { label: 'Modérée', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critique', color: 'bg-red-100 text-red-800' }
  };

  const { label, color } = config[priority];
  return <Badge className={`${color} text-xs`}>{label}</Badge>;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function DossierTimeline({ dossierId, userType }: DossierTimelineProps) {
  const [comments, setComments] = useState<DossierComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<DossierComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CommentCategory | 'all'>('all');
  const [showAddComment, setShowAddComment] = useState(false);
  
  // Formulaire nouveau commentaire
  const [newComment, setNewComment] = useState({
    content: '',
    category: 'expert_action' as CommentCategory,
    event_type: ''
  });

  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Charger les commentaires
  useEffect(() => {
    fetchComments();
  }, [dossierId]);

  // Filtrer les commentaires
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredComments(comments);
    } else {
      setFilteredComments(comments.filter(c => c.category === selectedCategory));
    }
  }, [selectedCategory, comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await get<DossierComment[]>(`/api/dossier/${dossierId}/comments`);
      
      if (response.success && response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.content.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      const response = await post(`/api/dossier/${dossierId}/comments`, {
        content: newComment.content,
        category: newComment.category,
        event_type: newComment.event_type || 'manual_note'
      });

      if (response.success) {
        toast.success('Commentaire ajouté');
        setNewComment({ content: '', category: 'expert_action', event_type: '' });
        setShowAddComment(false);
        fetchComments();
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      const response = await patch(`/api/dossier/${dossierId}/comments/${commentId}`, {
        content: editContent
      });

      if (response.success) {
        toast.success('Commentaire modifié');
        setEditingComment(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Erreur modification commentaire:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      const response = await del(`/api/dossier/${dossierId}/comments/${commentId}`);

      if (response.success) {
        toast.success('Commentaire supprimé');
        fetchComments();
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const canEditComment = (comment: DossierComment) => {
    return comment.comment_type === 'manual' && 
           (userType === 'admin' || comment.created_by_type === userType);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Timeline & Commentaires
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filtre par catégorie */}
            <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="alert">🔴 Alertes</SelectItem>
                <SelectItem value="rdv_event">📅 RDV</SelectItem>
                <SelectItem value="document">📄 Documents</SelectItem>
                <SelectItem value="status_change">📊 Statuts</SelectItem>
                <SelectItem value="expert_action">📞 Actions Expert</SelectItem>
                <SelectItem value="apporteur_action">🤝 Actions Apporteur</SelectItem>
              </SelectContent>
            </Select>

            {/* Bouton ajouter commentaire */}
            <Button
              size="sm"
              onClick={() => setShowAddComment(!showAddComment)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-2 mt-4">
          <Badge variant="outline" className="text-xs">
            {comments.length} commentaire{comments.length > 1 ? 's' : ''}
          </Badge>
          {comments.filter(c => c.category === 'alert').length > 0 && (
            <Badge className="bg-red-100 text-red-800 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {comments.filter(c => c.category === 'alert').length} alerte{comments.filter(c => c.category === 'alert').length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Formulaire ajout commentaire */}
        {showAddComment && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3">Ajouter un commentaire</h3>
            
            <Select 
              value={newComment.category} 
              onValueChange={(value: CommentCategory) => setNewComment({ ...newComment, category: value })}
            >
              <SelectTrigger className="w-full mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userType === 'expert' && (
                  <SelectItem value="expert_action">📞 Action Expert</SelectItem>
                )}
                {userType === 'apporteur' && (
                  <SelectItem value="apporteur_action">🤝 Action Apporteur</SelectItem>
                )}
                {userType === 'admin' && (
                  <>
                    <SelectItem value="expert_action">📞 Action Expert</SelectItem>
                    <SelectItem value="apporteur_action">🤝 Action Apporteur</SelectItem>
                    <SelectItem value="alert">🔴 Alerte</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Votre commentaire..."
              value={newComment.content}
              onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
              className="mb-3"
              rows={3}
            />

            <div className="flex gap-2">
              <Button onClick={handleAddComment} size="sm">
                Ajouter
              </Button>
              <Button onClick={() => setShowAddComment(false)} size="sm" variant="outline">
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Liste des commentaires */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun commentaire</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCategory !== 'all' ? 'Aucun commentaire dans cette catégorie' : 'Soyez le premier à ajouter un commentaire'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => {
              const Icon = getCategoryIcon(comment.category);
              const colorClass = getCategoryColor(comment.category);
              const isEditing = editingComment === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`relative pl-8 pb-4 border-l-2 ${
                    comment.priority === 'critical' ? 'border-red-500' :
                    comment.priority === 'high' ? 'border-orange-500' :
                    'border-gray-200'
                  }`}
                >
                  {/* Icône de catégorie */}
                  <div className={`absolute left-0 top-0 transform -translate-x-1/2 p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Contenu du commentaire */}
                  <div className="ml-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(comment.category)}
                        </Badge>
                        
                        {comment.comment_type === 'system' && (
                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                            Système
                          </Badge>
                        )}

                        {getPriorityBadge(comment.priority)}

                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                        </span>

                        {comment.creator && (
                          <span className="text-xs text-gray-600">
                            par {comment.creator.name}
                          </span>
                        )}
                      </div>

                      {/* Actions (pour commentaires manuels) */}
                      {canEditComment(comment) && (
                        <div className="flex gap-1">
                          {!isEditing && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingComment(comment.id);
                                  setEditContent(comment.content);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    )}

                    {/* Métadonnées */}
                    {comment.metadata && Object.keys(comment.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Détails
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(comment.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

