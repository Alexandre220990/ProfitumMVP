import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Building, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { apporteurApi } from '@/services/apporteur-api';

interface Prospect {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string;
  status: string;
  qualification_score: number;
  interest_level: string;
  budget_range: string;
  timeline: string;
  created_at: string;
  updated_at: string;
  preselected_expert_id?: string;
  expert_name?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  prospects: Prospect[];
  color: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'nouveau', title: 'Nouveau', prospects: [], color: 'bg-gray-100' },
  { id: 'qualifie', title: 'Qualifié', prospects: [], color: 'bg-blue-100' },
  { id: 'rdv_negocie', title: 'RDV négocié', prospects: [], color: 'bg-yellow-100' },
  { id: 'expert_valide', title: 'Expert validé', prospects: [], color: 'bg-purple-100' },
  { id: 'meeting_fait', title: 'Meeting fait', prospects: [], color: 'bg-green-100' },
  { id: 'en_cours', title: 'En cours', prospects: [], color: 'bg-orange-100' },
  { id: 'signe', title: 'Signé', prospects: [], color: 'bg-emerald-100' },
  { id: 'refuse', title: 'Refusé', prospects: [], color: 'bg-red-100' }
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>(KANBAN_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const result = await apporteurApi.getClients();
      
      if (result.success && result.data) {
        const prospects = Array.isArray(result.data) ? result.data : [];
        organizeProspectsInColumns(prospects);
      } else {
        setError(result.error || 'Erreur lors du chargement des prospects');
      }
    } catch (err) {
      console.error('Erreur fetchProspects:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const organizeProspectsInColumns = (prospects: Prospect[]) => {
    const newColumns = KANBAN_COLUMNS.map(column => ({
      ...column,
      prospects: prospects.filter(prospect => {
        switch (column.id) {
          case 'nouveau': return prospect.status === 'prospect';
          case 'qualifie': return prospect.status === 'qualified';
          case 'rdv_negocie': return prospect.status === 'rdv_negotiated';
          case 'expert_valide': return prospect.status === 'expert_validated';
          case 'meeting_fait': return prospect.status === 'meeting_done';
          case 'en_cours': return prospect.status === 'in_progress';
          case 'signe': return prospect.status === 'signed';
          case 'refuse': return prospect.status === 'refused';
          default: return false;
        }
      })
    }));
    setColumns(newColumns);
  };

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    try {
      const result = await apporteurApi.updateClientStatus(prospectId, newStatus);
      
      if (result.success) {
        // Recharger les données
        await fetchProspects();
      } else {
        setError(result.error || 'Erreur lors du changement de statut');
      }
    } catch (err) {
      console.error('Erreur changement statut:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'prospect': { color: 'bg-gray-100 text-gray-800', label: 'Nouveau' },
      'qualified': { color: 'bg-blue-100 text-blue-800', label: 'Qualifié' },
      'rdv_negotiated': { color: 'bg-yellow-100 text-yellow-800', label: 'RDV négocié' },
      'expert_validated': { color: 'bg-purple-100 text-purple-800', label: 'Expert validé' },
      'meeting_done': { color: 'bg-green-100 text-green-800', label: 'Meeting fait' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', label: 'En cours' },
      'signed': { color: 'bg-emerald-100 text-emerald-800', label: 'Signé' },
      'refused': { color: 'bg-red-100 text-red-800', label: 'Refusé' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['prospect'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchProspects} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline Prospects</h1>
          <p className="text-gray-600">Suivi visuel de vos prospects par étape</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prospect
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`${column.color} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <Badge variant="outline" className="bg-white">
                  {column.prospects.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {column.prospects.map((prospect) => (
                  <Card key={prospect.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{prospect.name}</h4>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          {prospect.company_name}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          {prospect.email}
                        </div>
                        
                        {prospect.expert_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            Expert: {prospect.expert_name}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Score: {prospect.qualification_score}/10
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {getStatusBadge(prospect.status)}
                          <div className="text-xs text-gray-500">
                            {new Date(prospect.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(prospect.id, 'qualified')}
                            className="flex-1"
                          >
                            Qualifier
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(prospect.id, 'rdv_negotiated')}
                            className="flex-1"
                          >
                            RDV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {column.prospects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Aucun prospect</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
