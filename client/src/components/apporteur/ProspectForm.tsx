import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  X, 
  Building, 
  User, 
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { config } from '@/config';

interface ProductEligible {
  id: string;
  nom: string;
  description: string;
  categorie: string;
}

interface ProspectFormData {
  // Informations entreprise
  company_name: string;
  siren?: string;
  address?: string;
  website?: string;
  
  // Décisionnaire
  name: string;
  email: string;
  phone_number: string;
  decision_maker_position?: string;
  
  // Qualification
  qualification_score: number;
  interest_level: 'high' | 'medium' | 'low';
  budget_range: '0-10k' | '10k-50k' | '50k-100k' | '100k+';
  timeline: 'immediate' | '1-3months' | '3-6months' | '6months+';
  
  // RDV
  meeting_type: 'physical' | 'video' | 'phone';
  scheduled_date: string;
  scheduled_time: string;
  location?: string;
  
  // Produits sélectionnés
  selected_products: Array<{
    id: string;
    selected: boolean;
    notes?: string;
    priority?: 'high' | 'medium' | 'low';
    estimated_amount?: number;
    success_probability?: number;
  }>;
  
  // Métadonnées
  source: string;
  notes?: string;
}

export default function ProspectForm({ prospectId, onSuccess, onCancel }: {
  prospectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState<ProspectFormData>({
    company_name: '',
    siren: '',
    address: '',
    website: '',
    name: '',
    email: '',
    phone_number: '',
    decision_maker_position: '',
    qualification_score: 5,
    interest_level: 'medium',
    budget_range: '10k-50k',
    timeline: '1-3months',
    meeting_type: 'physical',
    scheduled_date: '',
    scheduled_time: '',
    location: '',
    selected_products: [],
    source: 'apporteur',
    notes: ''
  });

  const [products, setProducts] = useState<ProductEligible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    if (prospectId) {
      fetchProspect();
    }
  }, [prospectId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/produits-eligibles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(result.data || []);
        
        // Initialiser les produits sélectionnés
        setFormData(prev => ({
          ...prev,
          selected_products: (result.data || []).map((product: ProductEligible) => ({
            id: product.id,
            selected: false,
            notes: '',
            priority: 'medium' as const,
            estimated_amount: 0,
            success_probability: 50
          }))
        }));
      }
    } catch (err) {
      console.error('Erreur fetchProducts:', err);
    }
  };

  const fetchProspect = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/clients/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(result.data);
      }
    } catch (err) {
      console.error('Erreur fetchProspect:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Utiliser la route prospects qui existe dans apporteur.ts
      const url = prospectId 
        ? `${config.API_URL}/api/apporteur/prospects/${prospectId}`
        : `${config.API_URL}/api/apporteur/prospects`;
      
      const method = prospectId ? 'PUT' : 'POST';

      // Préparer les données pour la table Client
      const clientData = {
        // Informations entreprise
        company_name: formData.company_name,
        siren: formData.siren,
        address: formData.address,
        website: formData.website,
        
        // Décisionnaire
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        decision_maker_position: formData.decision_maker_position,
        
        // Qualification
        qualification_score: formData.qualification_score,
        interest_level: formData.interest_level,
        budget_range: formData.budget_range,
        timeline: formData.timeline,
        
        // RDV
        meeting_type: formData.meeting_type,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        location: formData.location,
        
        // Métadonnées
        source: formData.source || 'apporteur',
        notes: formData.notes,
        
        // Produits sélectionnés
        selected_products: formData.selected_products
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      console.log('✅ Prospect sauvegardé:', result);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('❌ Erreur handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.map(product =>
        product.id === productId ? { ...product, [field]: value } : product
      )
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="sticky top-0 bg-white z-10 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {prospectId ? 'Modifier le Prospect' : 'Nouveau Prospect'}
              </CardTitle>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations Entreprise */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations Entreprise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="siren">SIREN</Label>
                  <Input
                    id="siren"
                    value={formData.siren}
                    onChange={(e) => setFormData(prev => ({ ...prev, siren: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>

            {/* Décisionnaire */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Décisionnaire
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Téléphone *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="decision_maker_position">Poste</Label>
                  <Input
                    id="decision_maker_position"
                    value={formData.decision_maker_position}
                    onChange={(e) => setFormData(prev => ({ ...prev, decision_maker_position: e.target.value }))}
                    placeholder="Directeur, PDG, etc."
                  />
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Qualification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualification_score">Score de qualification (1-10) *</Label>
                  <Input
                    id="qualification_score"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.qualification_score}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualification_score: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="interest_level">Niveau d'intérêt *</Label>
                  <select
                    id="interest_level"
                    value={formData.interest_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, interest_level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="high">Élevé</option>
                    <option value="medium">Moyen</option>
                    <option value="low">Faible</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="budget_range">Budget *</Label>
                  <select
                    id="budget_range"
                    value={formData.budget_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="0-10k">0 - 10k€</option>
                    <option value="10k-50k">10k - 50k€</option>
                    <option value="50k-100k">50k - 100k€</option>
                    <option value="100k+">100k€+</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timeline">Délai *</Label>
                  <select
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="immediate">Immédiat</option>
                    <option value="1-3months">1-3 mois</option>
                    <option value="3-6months">3-6 mois</option>
                    <option value="6months+">6 mois+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RDV */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rendez-vous (obligatoire)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meeting_type">Type de meeting *</Label>
                  <select
                    id="meeting_type"
                    value={formData.meeting_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="physical">Physique</option>
                    <option value="video">Visio</option>
                    <option value="phone">Téléphone</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="scheduled_date">Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Heure *</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Adresse ou lien visio"
                  />
                </div>
              </div>
            </div>

            {/* Produits Éligibles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Produits Éligibles
              </h3>
              
              <div className="space-y-3">
                {products.map((product) => {
                  const selectedProduct = formData.selected_products.find(p => p.id === product.id);
                  if (!selectedProduct) return null;

                  return (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedProduct.selected}
                          onCheckedChange={(checked) => 
                            handleProductChange(product.id, 'selected', checked)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{product.nom}</h4>
                            <span className="text-sm text-gray-500">({product.categorie})</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                          
                          {selectedProduct.selected && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Notes</Label>
                                <Input
                                  placeholder="Notes sur ce produit"
                                  value={selectedProduct.notes || ''}
                                  onChange={(e) => handleProductChange(product.id, 'notes', e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Priorité</Label>
                                <select
                                  value={selectedProduct.priority || 'medium'}
                                  onChange={(e) => handleProductChange(product.id, 'priority', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="high">Élevée</option>
                                  <option value="medium">Moyenne</option>
                                  <option value="low">Faible</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Montant estimé (€)</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={selectedProduct.estimated_amount || ''}
                                  onChange={(e) => handleProductChange(product.id, 'estimated_amount', parseInt(e.target.value) || 0)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div>
                <Label htmlFor="notes">Commentaires</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires..."
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
