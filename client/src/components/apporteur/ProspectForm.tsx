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
  Target,
  Mail,
  AlertCircle,
  Users,
  Star,
  Award,
  CheckCircle
} from 'lucide-react';
import { config } from '@/config';

interface ProductEligible {
  id: string;
  nom: string;
  description: string;
  categorie: string;
}

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  rating: number;
  relevance_score?: number;
  matched_specializations?: string[];
  performance?: {
    total_dossiers: number;
    rating: string;
    response_time: number;
    availability: string;
  };
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
  
  // Expert présélectionné
  preselected_expert_id?: string;
  
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
  const [availableExperts, setAvailableExperts] = useState<Expert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailOption, setEmailOption] = useState<'none' | 'exchange' | 'presentation'>('none');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

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
        
        // Si un expert est présélectionné, le charger
        if (result.data.preselected_expert_id) {
          fetchExpertDetails(result.data.preselected_expert_id);
        }
      }
    } catch (err) {
      console.error('Erreur fetchProspect:', err);
    }
  };

  // Charger les détails d'un expert spécifique
  const fetchExpertDetails = async (expertId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/experts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const expert = result.data?.find((e: Expert) => e.id === expertId);
        if (expert) {
          setSelectedExpert(expert);
          console.log('✅ Expert présélectionné chargé:', expert.name);
        }
      }
    } catch (err) {
      console.error('Erreur fetchExpertDetails:', err);
    }
  };

  // Fonction pour charger les experts disponibles en fonction des produits sélectionnés
  const fetchExpertsByProducts = async () => {
    const selectedProductIds = formData.selected_products
      .filter(p => p.selected)
      .map(p => p.id);

    if (selectedProductIds.length === 0) {
      setAvailableExperts([]);
      return;
    }

    try {
      setLoadingExperts(true);
      const response = await fetch(`${config.API_URL}/api/apporteur/experts/by-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds: selectedProductIds })
      });

      if (response.ok) {
        const result = await response.json();
        setAvailableExperts(result.data || []);
        console.log(`✅ ${result.data?.length || 0} expert(s) trouvé(s) pour les produits sélectionnés`);
      } else {
        console.error('Erreur chargement experts');
        setAvailableExperts([]);
      }
    } catch (err) {
      console.error('Erreur fetchExpertsByProducts:', err);
      setAvailableExperts([]);
    } finally {
      setLoadingExperts(false);
    }
  };

  // Charger les experts quand les produits sélectionnés changent
  useEffect(() => {
    const hasSelectedProducts = formData.selected_products.some(p => p.selected);
    if (hasSelectedProducts) {
      fetchExpertsByProducts();
    } else {
      setAvailableExperts([]);
      setSelectedExpert(null);
    }
  }, [formData.selected_products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Utiliser la route prospects qui existe dans apporteur.ts
      const url: string = prospectId 
        ? `${config.API_URL}/api/apporteur/prospects/${prospectId}`
        : `${config.API_URL}/api/apporteur/prospects`;
      
      const method: 'PUT' | 'POST' = prospectId ? 'PUT' : 'POST';

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
        
        // Expert présélectionné
        preselected_expert_id: selectedExpert?.id || null,
        
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

      const response: Response = await fetch(url, {
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

      const result: any = await response.json();
      console.log('✅ Prospect sauvegardé:', result);
      
      const createdProspectId: string | undefined = result.data?.prospect?.id;
      
      // Envoyer l'email si une option a été sélectionnée
      if (emailOption !== 'none' && createdProspectId) {
        await sendCredentialsEmail(createdProspectId, emailOption);
      } else {
        // Pas d'email, fermer directement
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('❌ Erreur handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const sendCredentialsEmail = async (prospectId: string, emailType: 'exchange' | 'presentation') => {
    setSendingEmail(true);
    setEmailSuccess(null);
    
    try {
      const response = await fetch(
        `${config.API_URL}/api/apporteur/prospects/${prospectId}/send-credentials`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emailType })
        }
      );

      const result = await response.json();

      if (result.success) {
        setEmailSuccess(result.message);
        // Attendre 2 secondes pour afficher le message de succès, puis fermer
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        setError(`Prospect créé mais erreur d'envoi d'email: ${result.message}`);
        // Fermer quand même après 3 secondes
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Erreur envoi email:', err);
      setError('Prospect créé mais erreur lors de l\'envoi de l\'email');
      // Fermer quand même après 3 secondes
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);
    } finally {
      setSendingEmail(false);
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

            {/* Sélection Expert (nouvelle étape) */}
            {formData.selected_products.some(p => p.selected) && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Présélection d'un Expert (optionnel)
                    </h3>
                  </div>
                  {selectedExpert && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Experts recommandés en fonction des produits sélectionnés. 
                  {selectedExpert && " L'expert sera automatiquement invité au rendez-vous."}
                </p>

                {loadingExperts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Chargement des experts...</span>
                  </div>
                ) : availableExperts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun expert trouvé pour les produits sélectionnés</p>
                    <p className="text-sm mt-2">Vous pouvez continuer sans présélectionner d'expert</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableExperts.slice(0, 6).map((expert) => (
                      <Card 
                        key={expert.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                          selectedExpert?.id === expert.id 
                            ? 'ring-2 ring-purple-500 bg-purple-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (selectedExpert?.id === expert.id) {
                            setSelectedExpert(null);
                          } else {
                            setSelectedExpert(expert);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{expert.name}</h4>
                              {selectedExpert?.id === expert.id && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{expert.company_name}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-semibold">{expert.rating || '4.5'}</span>
                          </div>
                        </div>

                        {expert.matched_specializations && expert.matched_specializations.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Spécialisations pertinentes:</p>
                            <div className="flex flex-wrap gap-1">
                              {expert.matched_specializations.slice(0, 3).map((spec, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {expert.performance && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <span>{expert.performance.total_dossiers || 0} dossiers</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>{expert.performance.availability || 'Disponible'}</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}

                {selectedExpert && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900">Expert sélectionné : {selectedExpert.name}</p>
                        <p className="text-sm text-green-700 mt-1">
                          Cet expert sera automatiquement invité au rendez-vous et pourra accéder aux informations du prospect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedExpert && availableExperts.length > 0 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Cliquez sur une carte pour sélectionner un expert, ou continuez sans sélection
                  </p>
                )}
              </div>
            )}

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

            {/* Sélecteur d'envoi d'email */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Envoi des identifiants au prospect</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Un compte sera automatiquement créé pour le prospect avec un mot de passe provisoire. 
                Choisissez si vous souhaitez lui envoyer les identifiants par email :
              </p>

              <div className="space-y-3">
                {/* Option 1: Ne pas envoyer */}
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  emailOption === 'none' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="emailOption"
                    value="none"
                    checked={emailOption === 'none'}
                    onChange={(e) => setEmailOption(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Ne pas envoyer d'email</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Le compte sera créé mais aucun email ne sera envoyé. Vous pourrez communiquer les identifiants vous-même.
                    </div>
                  </div>
                </label>

                {/* Option 2: Email Échange concluant */}
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  emailOption === 'exchange' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="emailOption"
                    value="exchange"
                    checked={emailOption === 'exchange'}
                    onChange={(e) => setEmailOption(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">Email "Échange concluant"</div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommandé</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Pour un prospect avec qui vous avez eu un échange positif. Ton chaleureux et engageant.
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">
                      "Suite à notre échange, nous sommes ravis de vous accompagner..."
                    </div>
                  </div>
                </label>

                {/* Option 3: Email Présentation */}
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  emailOption === 'presentation' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="emailOption"
                    value="presentation"
                    checked={emailOption === 'presentation'}
                    onChange={(e) => setEmailOption(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Email "Présentation Profitum"</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Pour un premier contact. Invitation à découvrir la plateforme sans engagement.
                    </div>
                    <div className="text-xs text-gray-500 mt-2 italic">
                      "Découvrez Profitum, votre partenaire d'optimisation..."
                    </div>
                  </div>
                </label>
              </div>

              {emailOption !== 'none' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Note de sécurité :</strong> Le mot de passe provisoire ne sera jamais affiché ici. 
                      Il sera uniquement envoyé par email au prospect et supprimé de notre système après l'envoi.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={loading || sendingEmail} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Création du prospect...' : sendingEmail ? 'Envoi de l\'email...' : 'Sauvegarder'}
              </Button>
            </div>

            {/* Messages de feedback */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {emailSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">{emailSuccess}</div>
                </div>
              </div>
            )}

            {sendingEmail && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <div className="text-sm text-blue-800">Envoi de l'email en cours...</div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
