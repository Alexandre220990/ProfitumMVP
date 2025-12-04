import React, { useState, useEffect } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Search, 
    Trash2, 
    UserCheck, 
    UserX 
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { config } from '@/config';

interface ApporteurData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    company_type: 'independant' | 'expert' | 'call_center' | 'societe_commerciale';
    siren?: string;
    commission_rate: number;
    status: 'candidature' | 'active' | 'inactive' | 'suspended' | 'rejected';
    created_at: string;
    prospects_count?: number;
}

interface ApporteurFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    company_type: 'independant' | 'expert' | 'call_center' | 'societe_commerciale';
    siren: string;
    password: string;
    confirm_password: string;
}

const ApporteurManagement: React.FC = () => {
    const [apporteurs, setApporteurs] = useState<ApporteurData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState<ApporteurFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        company_type: 'independant', // Valeur par défaut
        siren: '',
        password: '',
        confirm_password: ''
    });

    // Charger les apporteurs
    const loadApporteurs = async () => {
        try {
            setLoading(true);
            const token = await getSupabaseToken();
            
            console.log('🔍 Frontend - Chargement apporteurs:', {
                url: `${config.API_URL}/api/admin/apporteurs`,
                hasToken: !!token,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'MANQUANT'
            });

            const response = await fetch(`${config.API_URL}/api/admin/apporteurs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 Frontend - Réponse chargement apporteurs:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Frontend - Erreur chargement apporteurs:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText: errorText
                });
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('🔍 Frontend - Données apporteurs chargées:', {
                success: data.success,
                count: data.data?.length || 0,
                data: data.data
            });
            
            setApporteurs(data.data || []);
        } catch (error) {
            console.error('❌ Frontend - Erreur chargement apporteurs:', {
                error: error,
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            });
            toast.error('Erreur lors du chargement des apporteurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApporteurs();
    }, []);

    // Créer un apporteur
    const handleCreateApporteur = async () => {
        try {
            console.log('🔍 Frontend - Tentative création apporteur:', {
                formData: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    company_name: formData.company_name,
                    company_type: formData.company_type,
                    siren: formData.siren,
                    password: formData.password ? '***' : 'MANQUANT',
                    confirm_password: formData.confirm_password ? '***' : 'MANQUANT'
                },
                timestamp: new Date().toISOString()
            });

            // Validation côté frontend
            const validationErrors = [];
            if (!formData.first_name?.trim()) validationErrors.push('Prénom requis');
            if (!formData.last_name?.trim()) validationErrors.push('Nom requis');
            if (!formData.email?.trim()) validationErrors.push('Email requis');
            if (!formData.phone?.trim()) validationErrors.push('Téléphone requis');
            if (!formData.company_name?.trim()) validationErrors.push('Nom entreprise requis');
            if (!formData.company_type?.trim()) {
                validationErrors.push('Type entreprise requis');
            } else {
                const validCompanyTypes = ['independant', 'expert', 'call_center', 'societe_commerciale'];
                if (!validCompanyTypes.includes(formData.company_type)) {
                    validationErrors.push(`Type entreprise invalide: ${formData.company_type}`);
                }
            }
            if (!formData.password?.trim()) validationErrors.push('Mot de passe requis');
            if (formData.password !== formData.confirm_password) validationErrors.push('Mots de passe différents');

            if (validationErrors.length > 0) {
                console.error('❌ Frontend - Erreurs de validation:', validationErrors);
                toast.error(`Erreurs de validation: ${validationErrors.join(', ')}`);
                return;
            }

            const token = await getSupabaseToken();
            console.log('🔍 Frontend - Envoi requête API:', {
                url: `${config.API_URL}/api/admin/apporteurs/create`,
                method: 'POST',
                hasToken: !!token,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'MANQUANT'
            });

            const response = await fetch(`${config.API_URL}/api/admin/apporteurs/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('🔍 Frontend - Réponse API:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            const data = await response.json();
            console.log('🔍 Frontend - Données réponse:', data);

            if (data.success) {
                toast.success('Apporteur créé avec succès');
                setIsCreateDialogOpen(false);
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    company_name: '',
                    company_type: 'independant', // Valeur par défaut
                    siren: '',
                    password: '',
                    confirm_password: ''
                });
                loadApporteurs();
            } else {
                console.error('❌ Frontend - Erreur API:', {
                    success: data.success,
                    error: data.error,
                    fullResponse: data
                });
                toast.error(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('❌ Frontend - Erreur réseau/exception:', {
                error: error,
                message: error instanceof Error ? error.message : 'Erreur inconnue',
                stack: error instanceof Error ? error.stack : undefined,
                formData: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    company_name: formData.company_name,
                    company_type: formData.company_type,
                    siren: formData.siren
                }
            });
            toast.error('Erreur lors de la création de l\'apporteur');
        }
    };

    // Mettre à jour le statut
    const handleUpdateStatus = async (apporteurId: string, newStatus: string) => {
        try {
            const token = await getSupabaseToken();
            const response = await fetch(`${config.API_URL}/api/admin/apporteurs/${apporteurId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Statut mis à jour avec succès');
                loadApporteurs();
            } else {
                toast.error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    // Supprimer un apporteur
    const handleDeleteApporteur = async (apporteurId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet apporteur ?')) {
            return;
        }

        try {
            const token = await getSupabaseToken();
            const response = await fetch(`${config.API_URL}/api/admin/apporteurs/${apporteurId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Apporteur supprimé avec succès');
                loadApporteurs();
            } else {
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression apporteur:', error);
            toast.error('Erreur lors de la suppression de l\'apporteur');
        }
    };

    // Filtrer les apporteurs
    const filteredApporteurs = apporteurs.filter(apporteur => {
        const matchesSearch = 
            apporteur.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apporteur.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apporteur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apporteur.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || apporteur.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            candidature: { label: 'Candidature', variant: 'secondary' as const },
            active: { label: 'Actif', variant: 'default' as const },
            inactive: { label: 'Inactif', variant: 'destructive' as const },
            suspended: { label: 'Suspendu', variant: 'destructive' as const },
            rejected: { label: 'Rejeté', variant: 'destructive' as const }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.candidature;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Gestion des Apporteurs d'Affaires</h2>
                    <p className="text-muted-foreground">
                        Gérez les apporteurs d'affaires et leurs permissions
                    </p>
                </div>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un Apporteur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Créer un Apporteur d'Affaires</DialogTitle>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first_name">Prénom *</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    placeholder="Prénom"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="last_name">Nom *</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    placeholder="Nom"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@example.com"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="phone">Téléphone *</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+33123456789"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="company_name">Entreprise *</Label>
                                <Input
                                    id="company_name"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                    placeholder="Nom de l'entreprise"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="company_type">Type d'entreprise *</Label>
                                <Select 
                                    value={formData.company_type} 
                                    onValueChange={(value: 'independant' | 'expert' | 'call_center' | 'societe_commerciale') => setFormData({...formData, company_type: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="independant">Indépendant</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                        <SelectItem value="call_center">Call Center</SelectItem>
                                        <SelectItem value="societe_commerciale">Société Commerciale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label htmlFor="siren">SIREN (optionnel)</Label>
                                <Input
                                    id="siren"
                                    value={formData.siren}
                                    onChange={(e) => setFormData({...formData, siren: e.target.value})}
                                    placeholder="123456789"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="password">Mot de passe *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Mot de passe"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                                    placeholder="Confirmer le mot de passe"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsCreateDialogOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button onClick={handleCreateApporteur}>
                                Créer l'Apporteur
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Rechercher par nom, email ou entreprise..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="candidature">Candidature</SelectItem>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="inactive">Inactif</SelectItem>
                                <SelectItem value="suspended">Suspendu</SelectItem>
                                <SelectItem value="rejected">Rejeté</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des apporteurs */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Apporteurs ({filteredApporteurs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Entreprise</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Créé le</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        Chargement...
                                    </TableCell>
                                </TableRow>
                            ) : filteredApporteurs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        Aucun apporteur trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredApporteurs.map((apporteur) => (
                                    <TableRow key={apporteur.id}>
                                        <TableCell>
                                            {apporteur.first_name} {apporteur.last_name}
                                        </TableCell>
                                        <TableCell>{apporteur.email}</TableCell>
                                        <TableCell>{apporteur.company_name}</TableCell>
                                        <TableCell>
                                            {apporteur.company_type === 'independant' && 'Indépendant'}
                                            {apporteur.company_type === 'expert' && 'Expert'}
                                            {apporteur.company_type === 'call_center' && 'Call Center'}
                                            {apporteur.company_type === 'societe_commerciale' && 'Société Commerciale'}
                                        </TableCell>
                                        <TableCell>{apporteur.commission_rate}%</TableCell>
                                        <TableCell>{getStatusBadge(apporteur.status)}</TableCell>
                                        <TableCell>
                                            {new Date(apporteur.created_at).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                {apporteur.status === 'candidature' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdateStatus(apporteur.id, 'active')}
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                
                                                {apporteur.status === 'active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUpdateStatus(apporteur.id, 'inactive')}
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteApporteur(apporteur.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
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

export default ApporteurManagement;
