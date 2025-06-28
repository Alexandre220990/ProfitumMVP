import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Euro
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Client {
  id: string;
  email: string;
  company_name: string;
  city: string;
  phone: string;
  statut: string;
  created_at: string;
  derniereConnexion?: string;
  siren?: string;
  description?: string;
}

interface ProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  created_at: string;
  ProduitEligible: {
    name: string;
    description: string;
    category: string;
  };
}

interface Audit {
  id: string;
  client_id: string;
  expert_id: string;
  status: string;
  potential_gain: number;
  obtained_gain: number;
  created_at: string;
  updated_at: string;
  Expert: {
    name: string;
    email: string;
    company_name: string;
  };
}

interface CharteSignature {
  id: string;
  client_id: string;
  signed_at: string;
  ip_address: string;
}

interface ClientStats {
  totalProduits: number;
  produitsEligibles: number;
  totalAudits: number;
  auditsEnCours: number;
  auditsTermines: number;
  gainsPotentiels: number;
  gainsObtenus: number;
  charteSignee: boolean;
}

const ClientDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [client, setClient] = useState<Client | null>(null);
  const [produitsEligibles, setProduitsEligibles] = useState<ProduitEligible[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [charteSignature, setCharteSignature] = useState<CharteSignature | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/connect-admin');
    }
  }, [user, navigate]);

  // Charger les données du client
  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/connect-admin');
        return;
      }

      const response = await fetch(`http://localhost:5001/api/admin/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Client non trouvé');
      }

      const data = await response.json();
      setClient(data.data.client);
      setProduitsEligibles(data.data.produitsEligibles);
      setAudits(data.data.audits);
      setCharteSignature(data.data.charteSignature);
      setStats(data.data.stats);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement client:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getAuditStatusBadge = (status: string) => {
    switch (status) {
      case 'terminé':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'non_démarré':
        return <Badge className="bg-gray-100 text-gray-800">Non démarré</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getProduitStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return <Badge className="bg-green-100 text-green-800">Éligible</Badge>;
      case 'non_eligible':
        return <Badge className="bg-red-100 text-red-800">Non éligible</Badge>;
      case 'en_cours':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Client non trouvé'}</p>
          <Button onClick={() => navigate('/admin/gestion-clients')}>
            ← Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/gestion-clients')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Détails du Client</h1>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/admin/client/${client.id}/edit`)}
              >
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Informations client */}
          <Card className="lg:col-span-2 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Entreprise</p>
                    <p className="font-medium">{client.company_name || 'Non renseigné'}</p>
                  </div>
                </div>

                {client.siren && (
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">SIREN</p>
                      <p className="font-medium">{client.siren}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}

                {client.city && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ville</p>
                      <p className="font-medium">{client.city}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Dernière connexion</p>
                    <p className="font-medium">
                      {client.derniereConnexion ? formatDate(client.derniereConnexion) : 'Jamais'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="mr-3">
                    {getStatusBadge(client.statut)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium capitalize">{client.statut}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Produits éligibles</span>
                    <span className="font-semibold">{stats.produitsEligibles}/{stats.totalProduits}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Audits terminés</span>
                    <span className="font-semibold">{stats.auditsTermines}/{stats.totalAudits}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gains potentiels</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stats.gainsPotentiels)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gains obtenus</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(stats.gainsObtenus)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Charte signée</span>
                    <div className="flex items-center">
                      {stats.charteSignee ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Onglets détaillés */}
        <Tabs defaultValue="produits" className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="produits">Produits Éligibles</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
              <TabsTrigger value="charte">Charte</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="produits" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Produits Éligibles ({produitsEligibles.length})
            </CardTitle>
            
            {produitsEligibles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'éligibilité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produitsEligibles.map((produit) => (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{produit.ProduitEligible.name}</div>
                          <div className="text-sm text-gray-500">{produit.ProduitEligible.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{produit.ProduitEligible.category}</TableCell>
                      <TableCell>{getProduitStatusBadge(produit.statut)}</TableCell>
                      <TableCell>{formatDate(produit.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun produit éligible trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audits" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Audits ({audits.length})
            </CardTitle>
            
            {audits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expert</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Gain potentiel</TableHead>
                    <TableHead>Gain obtenu</TableHead>
                    <TableHead>Date de création</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{audit.Expert.name}</div>
                          <div className="text-sm text-gray-500">{audit.Expert.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getAuditStatusBadge(audit.status)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(audit.potential_gain)}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {formatCurrency(audit.obtained_gain)}
                      </TableCell>
                      <TableCell>{formatDate(audit.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun audit trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="charte" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Signature de la Charte
            </CardTitle>
            
            {charteSignature ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium text-green-600">Charte signée</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date de signature</p>
                    <p className="font-medium">{formatDate(charteSignature.signed_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Adresse IP</p>
                    <p className="font-medium">{charteSignature.ip_address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-500">Charte non signée</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetails; 