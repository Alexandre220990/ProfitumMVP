/**
 * Formulaire Client - Administration
 * Permet à l'admin de créer des clients directement
 * Structure identique au formulaire apporteur
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Navigate } from "react-router-dom";
import { Save, ArrowLeft, UserPlus, User, Building2, MapPin, Phone, Mail, Shield, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { config } from '@/config';

interface ClientForm {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  company_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  siren: string;
  secteurActivite?: string;
  nombreEmployes?: string;
  revenuAnnuel?: string;
  notes?: string;
}

const secteurOptions = [
  'Transport et Logistique',
  'BTP et Construction',
  'Commerce et Distribution',
  'Industrie',
  'Services',
  'Agriculture',
  'Restauration et Hôtellerie',
  'Santé',
  'Autre'
];

const nombreEmployesOptions = [
  '1 à 5',
  '6 à 10',
  '11 à 20',
  '21 à 50',
  '51 à 100',
  'Plus de 100'
];

const revenuAnnuelOptions = [
  'Moins de 100 000€',
  '100 000€ - 500 000€',
  '500 000€ - 1 000 000€',
  '1 000 000€ - 5 000 000€',
  'Plus de 5 000 000€'
];

const FormulaireClient = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ClientForm>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    siren: '',
    secteurActivite: '',
    nombreEmployes: '',
    revenuAnnuel: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Vérification authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user || user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.first_name.trim()) errors.first_name = 'Le prénom est requis';
    if (!form.last_name.trim()) errors.last_name = 'Le nom est requis';
    if (!form.email.trim()) errors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Format d\'email invalide';
    
    if (!form.company_name.trim()) errors.company_name = 'Le nom de l\'entreprise est requis';
    if (form.siren && !/^\d{9}$/.test(form.siren)) errors.siren = 'Le SIREN doit contenir 9 chiffres';
    if (!form.phone.trim()) errors.phone = 'Le téléphone est requis';
    else if (!/^[\d\s\+\-\(\)]+$/.test(form.phone)) errors.phone = 'Format de téléphone invalide';
    if (!form.password) errors.password = 'Le mot de passe est requis';
    else if (form.password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/connect-admin');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/admin/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          username: `${form.first_name} ${form.last_name}`,
          type: 'client'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création');
      }

      const data = await response.json();
      setSuccess('Client créé avec succès !');
      toast.success('Client créé avec succès');
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setForm({
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          company_name: '',
          phone: '',
          address: '',
          city: '',
          postal_code: '',
          siren: '',
          secteurActivite: '',
          nombreEmployes: '',
          revenuAnnuel: '',
          notes: ''
        });
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
      toast.error(err.message || 'Erreur lors de la création');
      console.error('Erreur création client:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    
    // Assurer au moins une majuscule, une minuscule, un chiffre
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    
    // Compléter avec 9 caractères aléatoires
    for (let i = 0; i < 9; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Mélanger
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setForm(prev => ({
      ...prev,
      password: newPassword
    }));
    setShowPassword(true);
    toast.success('Mot de passe généré');
  };

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
                Créer un Client
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/dashboard-optimized')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Card className="max-w-4xl mx-auto bg-white shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <UserPlus className="w-6 h-6 mr-3 text-green-600" />
              Nouveau client
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Créez un compte client avec accès authentifié
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Informations personnelles */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      Prénom *
                      {validationErrors.first_name && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                      placeholder="Prénom"
                      className={validationErrors.first_name ? 'border-red-500' : ''}
                    />
                    {validationErrors.first_name && (
                      <p className="text-red-500 text-sm">{validationErrors.first_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Nom *
                      {validationErrors.last_name && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                      placeholder="Nom de famille"
                      className={validationErrors.last_name ? 'border-red-500' : ''}
                    />
                    {validationErrors.last_name && (
                      <p className="text-red-500 text-sm">{validationErrors.last_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                      {validationErrors.email && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="client@entreprise.com"
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Téléphone *
                      {validationErrors.phone && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="01 23 45 67 89"
                      className={validationErrors.phone ? 'border-red-500' : ''}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-blue-600" />
                      Mot de passe de connexion
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGeneratePassword}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Générer un mot de passe
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Mot de passe *
                      <Badge variant="secondary" className="ml-2 text-xs">Min. 8 caractères</Badge>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password || ''}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        placeholder="Mot de passe"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ce mot de passe sera envoyé au client par email.
                    </p>
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm">{validationErrors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informations entreprise */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations entreprise</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">
                      Nom de l'entreprise *
                      {validationErrors.company_name && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="company_name"
                      value={form.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      required
                      placeholder="Nom de l'entreprise"
                      className={validationErrors.company_name ? 'border-red-500' : ''}
                    />
                    {validationErrors.company_name && (
                      <p className="text-red-500 text-sm">{validationErrors.company_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siren">
                      SIREN
                      {validationErrors.siren && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="siren"
                      value={form.siren}
                      onChange={(e) => handleInputChange('siren', e.target.value)}
                      placeholder="123456789"
                      maxLength={9}
                      className={validationErrors.siren ? 'border-red-500' : ''}
                    />
                    {validationErrors.siren && (
                      <p className="text-red-500 text-sm">{validationErrors.siren}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secteurActivite">Secteur d'activité</Label>
                    <Select value={form.secteurActivite} onValueChange={(value) => handleInputChange('secteurActivite', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {secteurOptions.map((secteur) => (
                          <SelectItem key={secteur} value={secteur}>{secteur}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreEmployes">Nombre d'employés</Label>
                    <Select value={form.nombreEmployes} onValueChange={(value) => handleInputChange('nombreEmployes', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {nombreEmployesOptions.map((nb) => (
                          <SelectItem key={nb} value={nb}>{nb}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="revenuAnnuel">Revenu annuel</Label>
                    <Select value={form.revenuAnnuel} onValueChange={(value) => handleInputChange('revenuAnnuel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {revenuAnnuelOptions.map((revenu) => (
                          <SelectItem key={revenu} value={revenu}>{revenu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Adresse */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 rue de la République"
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

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={form.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="75001"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes pour l'équipe Profitum..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  Ces notes ne seront visibles que par l'équipe admin
                </p>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard-optimized')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Créer le client</span>
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

export default FormulaireClient;

