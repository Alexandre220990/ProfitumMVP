import React, { useEffect, useState, useMemo } from 'react';
import { adminCabinetService } from '@/services/admin-cabinet-service';
import { Cabinet } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Shield, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type SortColumn = 'name' | 'owner' | 'clients' | 'prospects' | 'status' | 'dossiers_en_cours' | 'members';
type SortDirection = 'asc' | 'desc' | null;

const AdminCabinetsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const navigate = useNavigate();

  const fetchCabinets = async () => {
    try {
      setLoading(true);
      const response = await adminCabinetService.getCabinets({ search });
      setCabinets(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement cabinets:', err);
      setError('Impossible de charger les cabinets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabinets();
  }, []);

  const handleSearch = () => {
    fetchCabinets();
  };

  const handleCreateCabinet = () => {
    navigate('/admin/cabinets/new');
  };

  const handleViewCabinet = (id: string) => {
    navigate(`/admin/cabinets/${id}`);
  };

  const handleOwnerClick = (e: React.MouseEvent, ownerId?: string) => {
    e.stopPropagation();
    if (ownerId) {
      navigate(`/admin/experts/${ownerId}`);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCabinets = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return cabinets;
    }

    const sorted = [...cabinets].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'owner':
          aValue = a.owner?.name?.toLowerCase() || a.owner?.email?.toLowerCase() || '';
          bValue = b.owner?.name?.toLowerCase() || b.owner?.email?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'members':
          aValue = a.stats_summary?.members || 0;
          bValue = b.stats_summary?.members || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
          : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);
      }
    });

    return sorted;
  }, [cabinets, sortColumn, sortDirection]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cabinets partenaires</h1>
          <p className="text-gray-600">Gestion des cabinets, équipes et produits éligibles</p>
        </div>
        <Button onClick={handleCreateCabinet} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau cabinet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Rechercher par nom ou SIRET"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="secondary" onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des cabinets</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Cabinet
                    {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('owner')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Owner
                    {getSortIcon('owner')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('clients')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Clients
                    {getSortIcon('clients')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('prospects')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Prospect
                    {getSortIcon('prospects')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Statut
                    {getSortIcon('status')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('dossiers_en_cours')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Dossiers en cours
                    {getSortIcon('dossiers_en_cours')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('members')}
                    className="flex items-center hover:text-gray-900 transition-colors"
                  >
                    Membres
                    {getSortIcon('members')}
                  </button>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : sortedCabinets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    Aucun cabinet trouvé
                  </TableCell>
                </TableRow>
              ) : (
                sortedCabinets.map((cabinet) => {
                  const ownerName = cabinet.owner?.name || 
                    (cabinet.owner?.first_name && cabinet.owner?.last_name 
                      ? `${cabinet.owner.first_name} ${cabinet.owner.last_name}` 
                      : cabinet.owner?.first_name || cabinet.owner?.last_name || '');
                  
                  return (
                    <TableRow 
                      key={cabinet.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleViewCabinet(cabinet.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{cabinet.name}</span>
                          <span className="text-xs text-gray-500">{cabinet.siret || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cabinet.owner ? (
                          <div 
                            className="flex flex-col text-sm"
                            onClick={(e) => handleOwnerClick(e, cabinet.owner?.id)}
                          >
                            <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                              {ownerName || 'Non défini'}
                            </span>
                            {cabinet.owner.email && (
                              <span className="text-gray-500 text-xs">{cabinet.owner.email}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Non défini</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{cabinet.stats_summary?.clients_actifs || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{cabinet.stats_summary?.prospects_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cabinet.status === 'active' ? 'default' : 'outline'}>
                          {cabinet.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{cabinet.stats_summary?.dossiers_en_cours || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-700">
                            <Shield className="h-3.5 w-3.5" />
                            {cabinet.stats_summary?.members || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users className="h-3.5 w-3.5" />
                            {cabinet.produits_count || 0} prod.
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCabinet(cabinet.id);
                            }}
                          >
                            Consulter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCabinetsPage;

