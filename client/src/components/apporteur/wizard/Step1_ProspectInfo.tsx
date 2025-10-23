import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, User, Save, ArrowRight } from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

interface Step1Props {
  prospectId?: string; // Pour l'édition d'un prospect existant
  data: any;
  onUpdate: (data: any) => void;
  onNext: (prospectId: string) => void;
  onSaveAndClose: (prospectId: string) => void;
}

export function Step1_ProspectInfo({ prospectId, data, onUpdate, onNext, onSaveAndClose }: Step1Props) {
  const [loading, setLoading] = useState(false);
  const [loadingProspect, setLoadingProspect] = useState(false);
  const [formData, setFormData] = useState({
    company_name: data.company_name || '',
    siren: data.siren || '',
    address: data.address || '',
    website: data.website || '',
    name: data.name || '',
    email: data.email || '',
    phone_number: data.phone_number || '',
    decision_maker_position: data.decision_maker_position || '',
    interest_level: data.interest_level || 'medium',
    timeline: data.timeline || '1-3months'
  });

  // Charger les données du prospect si on est en mode édition
  useEffect(() => {
    if (prospectId) {
      loadProspectData();
    }
  }, [prospectId]);

  const loadProspectData = async () => {
    setLoadingProspect(true);
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/prospects/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du prospect');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const prospect = result.data;
        const loadedData = {
          company_name: prospect.company_name || '',
          siren: prospect.siren || '',
          address: prospect.address || '',
          website: prospect.website || '',
          name: prospect.name || '',
          email: prospect.email || '',
          phone_number: prospect.phone_number || '',
          decision_maker_position: prospect.decision_maker_position || '',
          interest_level: prospect.interest_level || 'medium',
          timeline: prospect.timeline || '1-3months'
        };
        setFormData(loadedData);
        onUpdate(loadedData);
      }
    } catch (error) {
      console.error('❌ Erreur chargement prospect:', error);
      toast.error('Impossible de charger les données du prospect');
    } finally {
      setLoadingProspect(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate({ [field]: value });
  };

  const handleSubmit = async (andContinue: boolean) => {
    // Validation
    if (!formData.company_name || !formData.name || !formData.email || !formData.phone_number) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const isEdit = !!prospectId;
      const url = isEdit 
        ? `${config.API_URL}/api/apporteur/prospects/${prospectId}`
        : `${config.API_URL}/api/apporteur/prospects`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          source: 'apporteur',
          status: 'prospect'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de ${isEdit ? 'la modification' : 'la création'} du prospect`);
      }

      const result = await response.json();
      const savedProspectId = result.data?.prospect?.id || prospectId;

      if (!savedProspectId) {
        throw new Error('Aucun ID de prospect retourné');
      }

      toast.success(isEdit ? '✅ Prospect modifié avec succès !' : '✅ Prospect créé avec succès !');

      if (andContinue) {
        onNext(savedProspectId);
      } else {
        onSaveAndClose(savedProspectId);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde prospect:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProspect) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données du prospect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Introduction compacte */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>{prospectId ? 'Modification' : 'Étape 1'} :</strong> {prospectId ? 'Modifiez les informations du prospect' : 'Renseignez les informations minimales. Ensuite vous pourrez lancer une simulation, sélectionner des experts et planifier des RDV.'}.
        </p>
      </div>

      {/* Informations Entreprise */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Building className="h-4 w-4" />
          Informations Entreprise
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="company_name">
              Nom de l'entreprise <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Ex: SARL Dupont"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="siren">SIREN</Label>
            <Input
              id="siren"
              value={formData.siren}
              onChange={(e) => handleChange('siren', e.target.value)}
              placeholder="123456789"
              maxLength={9}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="12 rue de la Paix, 75000 Paris"
            />
          </div>
          
          <div>
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.exemple.fr"
            />
          </div>
        </div>
      </div>

      {/* Décisionnaire */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Décisionnaire
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="name">
              Nom complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jean.dupont@entreprise.fr"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone_number">
              Téléphone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              placeholder="06 12 34 56 78"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="decision_maker_position">Poste</Label>
            <Input
              id="decision_maker_position"
              value={formData.decision_maker_position}
              onChange={(e) => handleChange('decision_maker_position', e.target.value)}
              placeholder="Directeur, PDG, etc."
            />
          </div>
        </div>
      </div>

      {/* Qualification */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Qualification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="interest_level">Niveau d'intérêt</Label>
            <select
              id="interest_level"
              value={formData.interest_level}
              onChange={(e) => handleChange('interest_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">Élevé</option>
              <option value="medium">Moyen</option>
              <option value="low">Faible</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="timeline">Délai estimé</Label>
            <select
              id="timeline"
              value={formData.timeline}
              onChange={(e) => handleChange('timeline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immédiat</option>
              <option value="1-3months">1-3 mois</option>
              <option value="3-6months">3-6 mois</option>
              <option value="6months+">6 mois+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer et Terminer'}
        </Button>
        
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer et Continuer'}
        </Button>
      </div>
    </div>
  );
}

