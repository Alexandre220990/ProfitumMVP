import React, { useEffect, useState } from 'react';
import { adminCabinetService } from '@/services/admin-cabinet-service';
import { Cabinet } from '@/types';
import { useRouter } from 'next/router';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminCabinetsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    router.push('/admin/cabinets/new');
  };

  const handleViewCabinet = (id: string) => {
    router.push(`/admin/cabinets/${id}`);
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
                <TableHead>Nom</TableHead>
                <TableHead>SIRET</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : cabinets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Aucun cabinet trouvé
                  </TableCell>
                </TableRow>
              ) : (
                cabinets.map((cabinet) => (
                  <TableRow key={cabinet.id}>
                    <TableCell className="font-medium">{cabinet.name}</TableCell>
                    <TableCell>{cabinet.siret || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {cabinet.email && <span>{cabinet.email}</span>}
                        {cabinet.phone && <span className="text-gray-500">{cabinet.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{cabinet.produits?.length || 0}</TableCell>
                    <TableCell>{cabinet.members?.length || 0}</TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => handleViewCabinet(cabinet.id)}>
                        Consulter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCabinetsPage;

