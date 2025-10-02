import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Mail,
  Phone,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config';

interface ApporteurCandidature {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_type: string;
  sector: string;
  siren?: string;
  motivation_letter: string;
  cv_file_path?: string;
  sponsor_code?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  admin_id?: string;
  admin_name?: string;
}

const ApporteurCandidatures: React.FC = () => {
  const [candidatures, setCandidatures] = useState<ApporteurCandidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidature, setSelectedCandidature] = useState<ApporteurCandidature | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger les candidatures
  const loadCandidatures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/apporteur-candidatures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des candidatures');
      }

      const data = await response.json();
      setCandidatures(data.data || []);
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
      toast.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidatures();
  }, []);

  // Traiter une candidature (approuver/rejeter)
  const handleProcessCandidature = async (candidatureId: string, action: 'approve' | 'reject') => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/apporteur-candidatures/${candidatureId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Candidature ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
        setAdminNotes('');
        setIsDetailDialogOpen(false);
        loadCandidatures();
      } else {
        toast.error(result.error || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur traitement candidature:', error);
      toast.error('Erreur lors du traitement de la candidature');
    } finally {
      setIsProcessing(false);
    }
  };

  // Télécharger un CV
  const handleDownloadCV = async (candidatureId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/apporteur-candidatures/${candidatureId}/cv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${candidatureId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Erreur lors du téléchargement du CV');
      }
    } catch (error) {
      console.error('Erreur téléchargement CV:', error);
      toast.error('Erreur lors du téléchargement du CV');
    }
  };

  // Filtrer les candidatures
  const filteredCandidatures = candidatures.filter(candidature => {
    const matchesSearch = 
      candidature.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidature.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Approuvée', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejetée', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Candidatures Apporteurs</h2>
          <p className="text-muted-foreground">
            Gérez les candidatures d'apporteurs d'affaires
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {candidatures.filter(c => c.status === 'pending').length} en attente
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {candidatures.filter(c => c.status === 'approved').length} approuvées
          </Badge>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="rejected">Rejetées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des candidatures */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidatures.map((candidature) => (
                <TableRow key={candidature.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {candidature.first_name} {candidature.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidature.sector}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{candidature.company_name}</div>
                      <div className="text-sm text-gray-500">{candidature.company_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {candidature.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {candidature.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(candidature.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(candidature.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidature(candidature);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {candidature.cv_file_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadCV(candidature.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détail */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Candidature de {selectedCandidature?.first_name} {selectedCandidature?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCandidature && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <div className="text-sm font-medium">{selectedCandidature.first_name}</div>
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <div className="text-sm font-medium">{selectedCandidature.last_name}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="text-sm font-medium">{selectedCandidature.email}</div>
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <div className="text-sm font-medium">{selectedCandidature.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations professionnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Professionnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Entreprise</Label>
                      <div className="text-sm font-medium">{selectedCandidature.company_name}</div>
                    </div>
                    <div>
                      <Label>Type d'entreprise</Label>
                      <div className="text-sm font-medium">{selectedCandidature.company_type}</div>
                    </div>
                    <div>
                      <Label>Secteur</Label>
                      <div className="text-sm font-medium">{selectedCandidature.sector}</div>
                    </div>
                    {selectedCandidature.siren && (
                      <div>
                        <Label>SIREN</Label>
                        <div className="text-sm font-medium">{selectedCandidature.siren}</div>
                      </div>
                    )}
                    {selectedCandidature.sponsor_code && (
                      <div>
                        <Label>Code de parrainage</Label>
                        <div className="text-sm font-medium">{selectedCandidature.sponsor_code}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lettre de motivation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lettre de Motivation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedCandidature.motivation_letter}</p>
                  </div>
                </CardContent>
              </Card>

              {/* CV */}
              {selectedCandidature.cv_file_path && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CV</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">CV disponible</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCV(selectedCandidature.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions admin */}
              {selectedCandidature.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="admin_notes">Notes admin</Label>
                      <Textarea
                        id="admin_notes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Ajoutez vos commentaires sur cette candidature..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleProcessCandidature(selectedCandidature.id, 'approve')}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        onClick={() => handleProcessCandidature(selectedCandidature.id, 'reject')}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historique */}
              {selectedCandidature.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Traité le {formatDate(selectedCandidature.updated_at)}
                        </span>
                      </div>
                      {selectedCandidature.admin_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Par {selectedCandidature.admin_name}
                          </span>
                        </div>
                      )}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{selectedCandidature.admin_notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApporteurCandidatures;
