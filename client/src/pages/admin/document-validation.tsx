import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Download,
  Eye,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { config } from '@/config/env';
import HeaderAdmin from '@/components/HeaderAdmin';

interface DocumentValidation {
  id: string;
  client_id: string;
  client_name: string;
  company_name: string;
  dossier_id: string;
  product_type: string;
  document_type: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  validation_status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  uploaded_at: string;
  validated_at?: string;
  validated_by?: string;
  validation_comment?: string;
  estimated_amount?: number;
  expert_id?: string;
  expert_name?: string;
}

interface ValidationFilters {
  search: string;
  status: string;
  product_type: string;
  document_type: string;
  date_range: string;
}

export default function DocumentValidationAdmin() {
  const [documents, setDocuments] = useState<DocumentValidation[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentValidation[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [filters, setFilters] = useState<ValidationFilters>({
    search: '',
    status: '',
    product_type: '',
    document_type: '',
    date_range: ''
  });

  // Charger les documents à valider
  useEffect(() => {
    loadDocuments();
  }, []);

  // Filtrer les documents
  useEffect(() => {
    let filtered = documents;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.client_name.toLowerCase().includes(search) ||
        doc.company_name.toLowerCase().includes(search) ||
        doc.original_filename.toLowerCase().includes(search) ||
        doc.product_type.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }

    if (filters.product_type) {
      filtered = filtered.filter(doc => doc.product_type === filters.product_type);
    }

    if (filters.document_type) {
      filtered = filtered.filter(doc => doc.document_type === filters.document_type);
    }

    if (filters.date_range) {
      const days = parseInt(filters.date_range);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(doc => new Date(doc.uploaded_at) >= cutoffDate);
    }

    setFilteredDocuments(filtered);
  }, [documents, filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/admin/documents/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocuments(data.data);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('❌ Erreur chargement documents:', error);
      toast.error("Impossible de charger les documents à valider");
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (documentIds: string[], action: 'approve' | 'reject' | 'require_revision', comment?: string) => {
    try {
      setValidating(true);
      
      const response = await fetch(`${config.API_URL}/api/admin/documents/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_ids: documentIds,
          action,
          comment
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${documentIds.length} document(s) ${action === 'approve' ? 'approuvé(s)' : action === 'reject' ? 'rejeté(s)' : 'demande de révision'}`);
          
          // Recharger les documents
          await loadDocuments();
          setSelectedDocuments([]);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      toast.error("Impossible de valider les documents");
    } finally {
      setValidating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'requires_revision': return 'Révision requise';
      default: return 'En attente';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderAdmin />
      
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Validation des Documents</h1>
              <p className="text-slate-600">
                Validation et contrôle des documents clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={loadDocuments}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            
            {selectedDocuments.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedDocuments.length} sélectionné(s)
                </Badge>
                <Button
                  onClick={() => handleValidation(selectedDocuments, 'approve')}
                  disabled={validating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  onClick={() => handleValidation(selectedDocuments, 'reject')}
                  disabled={validating}
                  variant="destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredDocuments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredDocuments.filter(d => d.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approuvés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredDocuments.filter(d => d.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredDocuments.filter(d => d.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="requires_revision">Révision requise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.product_type} onValueChange={(value) => setFilters(prev => ({ ...prev, product_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les produits</SelectItem>
                  <SelectItem value="TICPE">TICPE</SelectItem>
                  <SelectItem value="URSSAF">URSSAF</SelectItem>
                  <SelectItem value="FONCIER">FONCIER</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.document_type} onValueChange={(value) => setFilters(prev => ({ ...prev, document_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  <SelectItem value="kbis">KBIS</SelectItem>
                  <SelectItem value="immatriculation">Immatriculation</SelectItem>
                  <SelectItem value="facture">Facture</SelectItem>
                  <SelectItem value="contrat">Contrat</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.date_range} onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toute période</SelectItem>
                  <SelectItem value="1">Dernières 24h</SelectItem>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents à valider</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des documents...</p>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
                <p className="text-gray-600">Aucun document ne correspond à vos critères de recherche.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header avec sélection globale */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedDocuments.length} sur {filteredDocuments.length} sélectionné(s)
                  </span>
                </div>

                {/* Documents */}
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedDocuments.includes(document.id)}
                      onCheckedChange={(checked) => handleSelectDocument(document.id, checked as boolean)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">{document.original_filename}</h4>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(document.file_size)} • {document.mime_type}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(document.status)}>
                          {getStatusText(document.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{document.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{document.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(document.uploaded_at)}</span>
                        </div>
                      </div>

                      {document.estimated_amount && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Montant estimé : {document.estimated_amount}€
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {document.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleValidation([document.id], 'approve')}
                            disabled={validating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleValidation([document.id], 'reject')}
                            disabled={validating}
                            variant="destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 