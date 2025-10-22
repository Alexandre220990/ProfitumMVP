import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, User, Save, ArrowRight } from 'lucide-react';
import { config } from '@/config';
import { toast } from 'sonner';

interface Step1Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (prospectId: string) => void;
  onSaveAndClose: (prospectId: string) => void;
}

export function Step1_ProspectInfo({ data, onUpdate, onNext, onSaveAndClose }: Step1Props) {
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`${config.API_URL}/api/apporteur/prospects`, {
        method: 'POST',
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
        throw new Error(errorData.message || 'Erreur lors de la création du prospect');
      }

      const result = await response.json();
      const prospectId = result.data?.prospect?.id;

      if (!prospectId) {
        throw new Error('Aucun ID de prospect retourné');
      }

      toast.success('✅ Prospect créé avec succès !');

      if (andContinue) {
        onNext(prospectId);
      } else {
        onSaveAndClose(prospectId);
      }
    } catch (error) {
      console.error('❌ Erreur création prospect:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">Étape 1 : Informations de base</h3>
        <p className="text-sm text-blue-700">
          Renseignez les informations minimales pour créer le prospect. Vous pourrez ensuite :
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li>Lancer une simulation d'éligibilité (optionnel)</li>
          <li>Sélectionner des experts (optionnel)</li>
          <li>Planifier des rendez-vous (optionnel)</li>
        </ul>
      </div>

      {/* Informations Entreprise */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          Informations Entreprise
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Décisionnaire
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Qualification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="flex justify-end gap-3 pt-6 border-t">
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

