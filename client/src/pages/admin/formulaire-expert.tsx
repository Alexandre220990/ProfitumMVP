import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useParams } from "react-router-dom";
import { Shield, Save, ArrowLeft, UserPlus, User } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ExpertForm {
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  rating: number;
  compensation: number;
  status: string;
  approval_status: string;
  experience: string;
  city: string;
  phone: string;
  description: string;
  siren: string;
  abonnement: string;
}

const specializationsOptions = [
  'TICPE',
  'DFS',
  'URSSAF',
  'CEE',
  'Audit énergétique',
  'Certification ISO',
  'Formation',
  'Conseil'
];

const experienceOptions = [
  'Moins de 2 ans',
  '2-5 ans',
  '5-10 ans',
  '10-15 ans',
  'Plus de 15 ans'
];

const abonnementOptions = [
  'starter',
  'growth',
  'scale'
];

const FormulaireExpert = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState<ExpertForm>({
    name: '',
    email: '',
    company_name: '',
    specializations: [],
    rating: 0,
    compensation: 0,
    status: 'active',
    approval_status: 'pending',
    experience: '',
    city: '',
    phone: '',
    description: '',
    siren: '',
    abonnement: 'starter'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rediriger si l'utilisateur n'est pas un admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/connect-admin');
    }
  }, [user, navigate]);

  // Charger les données de l'expert si en mode édition
  useEffect(() => {
    if (isEditing && id) {
      fetchExpertData();
    }
  }, [id, isEditing]);

  const fetchExpertData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/connect-admin');
        return;
      }

      const response = await fetch(`http://localhost:5001/api/admin/experts/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Expert non trouvé');
      }

      const data = await response.json();
      setForm(data.data.expert);
    } catch (err) {
      setError('Erreur lors du chargement de l\'expert');
      console.error('Erreur chargement expert:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/connect-admin');
        return;
      }

      const url = isEditing 
        ? `http://localhost:5001/api/admin/experts/${id}`
        : 'http://localhost:5001/api/admin/experts';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      setSuccess(isEditing ? 'Expert modifié avec succès' : 'Expert créé avec succès');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/admin/gestion-experts');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur sauvegarde expert:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        specializations: prev.specializations.filter(s => s !== specialization)
      }));
    }
  };

  const handleInputChange = (field: keyof ExpertForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'expert...</p>
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
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Modifier un Expert' : 'Ajouter un Expert'}
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/gestion-experts')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Card className="max-w-4xl mx-auto bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              {isEditing ? (
                <>
                  <User className="w-5 h-5 mr-2" />
                  Modifier l'expert
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Nouvel expert
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Prénom Nom"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="expert@entreprise.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siren">SIREN</Label>
                  <Input
                    id="siren"
                    value={form.siren}
                    onChange={(e) => handleInputChange('siren', e.target.value)}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>

              {/* Spécialisations */}
              <div className="space-y-3">
                <Label>Spécialisations *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {specializationsOptions.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={spec}
                        checked={form.specializations.includes(spec)}
                        onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                      />
                      <Label htmlFor={spec} className="text-sm">{spec}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramètres */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rating">Note (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation (%)</Label>
                  <Input
                    id="compensation"
                    type="number"
                    min="0"
                    max="100"
                    value={form.compensation}
                    onChange={(e) => handleInputChange('compensation', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Expérience</Label>
                  <Select value={form.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceOptions.map((exp) => (
                        <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Statuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approval_status">Statut d'approbation</Label>
                  <Select value={form.approval_status} onValueChange={(value) => handleInputChange('approval_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abonnement">Abonnement</Label>
                  <Select value={form.abonnement} onValueChange={(value) => handleInputChange('abonnement', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {abonnementOptions.map((abonnement) => (
                        <SelectItem key={abonnement} value={abonnement}>{abonnement}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description de l'expert, compétences, certifications..."
                  rows={4}
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/gestion-experts')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || form.specializations.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sauvegarde...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Modifier' : 'Créer'}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormulaireExpert; 