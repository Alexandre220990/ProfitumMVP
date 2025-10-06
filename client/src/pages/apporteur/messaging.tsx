import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Plus,
  Clock,
  Star,
  Bell,
  Download
} from 'lucide-react';
import { ApporteurRealDataService } from '../../services/apporteur-real-data-service';

/**
 * Page Messagerie
 * Système de messagerie intégré
 */
export default function MessagingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apporteurId = searchParams.get('apporteurId');
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (apporteurId && typeof apporteurId === 'string') {
      loadConversations();
    }
  }, [apporteurId]);

  const loadConversations = async () => {
    try {
      const service = new ApporteurRealDataService(apporteurId as string);
      const result = await service.getConversations();
      
      if (result.success) {
        setConversations(result.data || []);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des conversations:', err);
      setConversations([]);
    }
  };

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à la messagerie.</p>
          </div>
        </div>
      </div>
    );
  }


  const conversationsData = conversations;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Optimisé */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Messagerie</h1>
              <p className="text-gray-600 mt-1">Communiquez avec vos clients et prospects</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Message
              </Button>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par contact, message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="online">En ligne</option>
                    <option value="offline">Hors ligne</option>
                    <option value="away">Absent</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setStatusFilter('');
                      setSearchQuery('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">5</div>
                  <p className="text-sm font-semibold text-gray-600">Messages Non Lus</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Messages en attente</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">12</div>
                  <p className="text-sm font-semibold text-gray-600">Conversations Actives</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Conversations ouvertes</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">2h</div>
                  <p className="text-sm font-semibold text-gray-600">Temps de Réponse</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Temps moyen</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">4.8/5</div>
                  <p className="text-sm font-semibold text-gray-600">Satisfaction</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Note moyenne</p>
            </CardContent>
          </Card>
        </div>

        {/* Interface de Messagerie Optimisée */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des Conversations */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversationsData.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500">Aucune conversation</p>
                    </div>
                  ) : (
                    conversationsData.map((conversation) => (
                      <div 
                        key={conversation.id} 
                        className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 truncate">{conversation.contact}</span>
                              <Badge className={`${getStatusColor(conversation.status)} px-2 py-1 rounded-full text-xs font-semibold`}>
                                {conversation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">{conversation.timestamp}</div>
                          {conversation.unread > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone de Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0 h-96">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  {selectedConversation ? `Conversation avec ${selectedConversation.contact}` : 'Sélectionnez une conversation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {selectedConversation ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white p-3 rounded-xl max-w-xs">
                          Bonjour, avez-vous pu examiner notre proposition TICPE ?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-xl max-w-xs">
                          Oui, nous l'avons étudiée. C'est très intéressant.
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white p-3 rounded-xl max-w-xs">
                          Parfait ! Souhaitez-vous planifier un rendez-vous pour en discuter ?
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="h-12 w-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Sélectionnez une conversation</h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Choisissez une conversation dans la liste pour commencer à échanger
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
