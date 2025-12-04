/**
 * Formulaire Client Complet - Multi-étapes
 * Identique au workflow apporteur
 * Étapes : Identité → Entreprise → Simulation (opt) → Produits → Communication
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Shield,
  Calculator,
  Package,
  Send,
  Eye,
  EyeOff,
  Check,
  MapPin,
  FileText,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { ClientEmbeddedSimulator } from '@/components/ClientEmbeddedSimulator';

interface ClientFormData {
  // Étape 1 : Identité
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  
  // Étape 2 : Entreprise
  company_name: string;
  siren: string;
  secteurActivite: string;
  nombreEmployes: string;
  revenuAnnuel: string;
  address: string;
  city: string;
  postal_code: string;
  
  // Étape 3 : Simulation (optionnelle)
  doSimulation: boolean;
  simulationAnswers?: Record<string, any>;
  
  // Étape 4 : Communication
  sendWelcomeEmail: boolean;
  customEmailMessage: string;
  
  // Metadata
  notes: string;
}

const SECTEURS = [
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

export default function FormulaireClientComplet() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);
  
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    company_name: '',
    siren: '',
    secteurActivite: '',
    nombreEmployes: '',
    revenuAnnuel: '',
    address: '',
    city: '',
    postal_code: '',
    doSimulation: false,
    simulationAnswers: {},
    sendWelcomeEmail: true,
    customEmailMessage: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4; // Identité, Entreprise, Options, Confirmation

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.first_name) newErrors.first_name = 'Prénom requis';
      if (!formData.last_name) newErrors.last_name = 'Nom requis';
      if (!formData.email) newErrors.email = 'Email requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.phone) newErrors.phone = 'Téléphone requis';
      if (!formData.password) newErrors.password = 'Mot de passe requis';
      else if (formData.password.length < 8) newErrors.password = 'Min. 8 caractères';
    }

    if (stepNumber === 2) {
      if (!formData.company_name) newErrors.company_name = 'Nom entreprise requis';
      if (formData.siren && !/^\d{9}$/.test(formData.siren)) newErrors.siren = 'SIREN = 9 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Veuillez corriger les erreurs');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSkipSimulation = () => {
    setFormData(prev => ({ ...prev, doSimulation: false }));
    setCurrentStep(4); // Passer à la confirmation
  };

  const handleInputChange = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    for (let i = 0; i < 9; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setFormData(prev => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.success('Mot de passe généré');
  };

  const handleSimulationComplete = (answers: Record<string, string | string[]>) => {
    console.log('✅ Simulation terminée, réponses reçues:', answers);
    
    // Stocker les réponses dans formData
    setFormData(prev => ({
      ...prev,
      simulationAnswers: answers
    }));
    
    setSimulationCompleted(true);
    setSimulationStarted(false);
    
    toast.success('✅ Simulation enregistrée ! Les produits éligibles seront calculés lors de la création.');
  };

  const handleSimulationCancel = () => {
    setSimulationStarted(false);
    setFormData(prev => ({ ...prev, doSimulation: false }));
  };

  const handleStartSimulation = () => {
    // Vérifier que les données de base sont renseignées
    if (!formData.secteurActivite || !formData.nombreEmployes || !formData.revenuAnnuel) {
      toast.warning('Veuillez d\'abord renseigner les informations de l\'entreprise (secteur, effectif, CA)');
      setCurrentStep(2); // Retour à l'étape entreprise
      return;
    }
    
    setSimulationStarted(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await getSupabaseToken();
      
      // 1. Créer le client
      const response = await fetch(`${config.API_URL}/api/admin/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          company_name: formData.company_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          siren: formData.siren,
          secteurActivite: formData.secteurActivite,
          nombreEmployes: formData.nombreEmployes,
          revenuAnnuel: formData.revenuAnnuel,
          notes: formData.notes,
          username: `${formData.first_name} ${formData.last_name}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur création client');
      }

      const data = await response.json();
      const clientId = data.data.client.id;

      // 2. Si simulation demandée, calculer l'éligibilité
      if (formData.doSimulation && formData.simulationAnswers && Object.keys(formData.simulationAnswers).length > 0) {
        const simulationResult = await runSimulation(clientId);
        
        // Stocker les produits éligibles pour l'affichage
        if (simulationResult && simulationResult.eligible_products) {
          setEligibleProducts(simulationResult.eligible_products);
        }
      }

      // 3. Envoyer l'email de bienvenue si demandé
      if (formData.sendWelcomeEmail) {
        await sendWelcomeEmail(clientId);
      }

      toast.success('✅ Client créé avec succès !');
      
      setTimeout(() => {
        navigate('/admin/dashboard-optimized');
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (clientId: string) => {
    try {
      console.log('🧮 Calcul des produits éligibles pour le client:', clientId);
      toast.info('Calcul des produits éligibles...');
      
      const token = await getSupabaseToken();
      
      // Créer une simulation et calculer l'éligibilité
      const response = await fetch(`${config.API_URL}/api/admin/clients/${clientId}/simulation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: formData.simulationAnswers
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du calcul d\'éligibilité');
      }
      
      const result = await response.json();
      console.log('✅ Résultats de simulation:', result);
      
      if (result.data && result.data.eligible_products) {
        const eligibleCount = result.data.eligible_products.length;
        toast.success(`${eligibleCount} produit(s) éligible(s) identifié(s) !`);
        return result.data;
      }
      
      return null;
      
    } catch (error: any) {
      console.error('❌ Erreur simulation:', error);
      toast.error(`Erreur simulation : ${error.message}`);
      return null;
    }
  };

  const sendWelcomeEmail = async (clientId: string) => {
    try {
      // TODO: Implémenter l'envoi d'email
      console.log('📧 Email de bienvenue pour:', clientId);
      toast.info('Email envoyé');
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              step < currentStep 
                ? 'bg-green-500 border-green-500 text-white' 
                : step === currentStep 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < totalSteps && (
              <div className={`flex-1 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Identité</span>
        <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>Entreprise</span>
        <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>Options</span>
        <span className={currentStep === 4 ? 'font-semibold text-blue-600' : ''}>Confirmation</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Informations personnelles</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Prénom *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            placeholder="Prénom"
            className={errors.first_name ? 'border-red-500' : ''}
          />
          {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Nom *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            placeholder="Nom"
            className={errors.last_name ? 'border-red-500' : ''}
          />
          {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          <Mail className="w-4 h-4 inline mr-2" />
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="client@entreprise.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          <Phone className="w-4 h-4 inline mr-2" />
          Téléphone *
        </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="01 23 45 67 89"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>

      <div className="space-y-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Mot de passe *
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGeneratePassword}
            className="bg-blue-100 hover:bg-blue-200"
          >
            <Shield className="w-4 h-4 mr-1" />
            Générer
          </Button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Min. 8 caractères"
            className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Building className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Informations entreprise</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="company_name">Nom de l'entreprise *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            placeholder="Nom de l'entreprise"
            className={errors.company_name ? 'border-red-500' : ''}
          />
          {errors.company_name && <p className="text-red-500 text-sm">{errors.company_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="siren">SIREN</Label>
          <Input
            id="siren"
            value={formData.siren}
            onChange={(e) => handleInputChange('siren', e.target.value)}
            placeholder="123456789"
            maxLength={9}
            className={errors.siren ? 'border-red-500' : ''}
          />
          {errors.siren && <p className="text-red-500 text-sm">{errors.siren}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secteurActivite">Secteur d'activité</Label>
          <Select value={formData.secteurActivite} onValueChange={(value) => handleInputChange('secteurActivite', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {SECTEURS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombreEmployes">Nombre d'employés</Label>
          <Input
            id="nombreEmployes"
            type="number"
            min="0"
            max="10000"
            value={formData.nombreEmployes}
            onChange={(e) => handleInputChange('nombreEmployes', e.target.value)}
            placeholder="Ex: 25"
          />
          <p className="text-xs text-gray-500">💡 Entrez le nombre exact d'employés</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenuAnnuel">Chiffre d'affaires annuel</Label>
          <div className="relative">
            <Input
              id="revenuAnnuel"
              type="number"
              min="0"
              max="100000000"
              step="1000"
              value={formData.revenuAnnuel}
              onChange={(e) => handleInputChange('revenuAnnuel', e.target.value)}
              placeholder="Ex: 250000"
              className="pr-8"
            />
            <span className="absolute right-3 top-3 text-gray-400 text-sm">€</span>
          </div>
          <p className="text-xs text-gray-500">💡 Entrez le montant exact du CA annuel (ex: 250000 pour 250 k€)</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4 mt-6">
        <MapPin className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Adresse</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 rue de la République"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Paris"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Code postal</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => handleInputChange('postal_code', e.target.value)}
            placeholder="75001"
            maxLength={5}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Options & Simulation</h3>
      </div>

      {/* Simulation */}
      <Card className="border-2 border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Faire une simulation d'éligibilité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!simulationStarted ? (
            <>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="doSimulation"
                  checked={formData.doSimulation}
                  onCheckedChange={(checked) => {
                    handleInputChange('doSimulation', checked);
                    if (!checked) {
                      setSimulationCompleted(false);
                      setFormData(prev => ({ ...prev, simulationAnswers: {} }));
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="doSimulation" className="font-medium cursor-pointer">
                    Lancer une simulation pour ce client
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Calculer automatiquement les produits éligibles selon son profil (TICPE, DFS, etc.)
                  </p>
                </div>
              </div>

              {formData.doSimulation && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      📋 Informations pour la simulation :
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Badge variant="outline" className="justify-center">
                        {formData.secteurActivite || '❌ Secteur'}
                      </Badge>
                      <Badge variant="outline" className="justify-center">
                        {formData.nombreEmployes || '❌ Effectif'}
                      </Badge>
                      <Badge variant="outline" className="justify-center">
                        {formData.revenuAnnuel || '❌ CA'}
                      </Badge>
                    </div>
                  </div>

                  {simulationCompleted ? (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Simulation terminée !</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        {Object.keys(formData.simulationAnswers || {}).length} réponse(s) enregistrée(s)
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSimulationCompleted(false);
                          setFormData(prev => ({ ...prev, simulationAnswers: {} }));
                        }}
                        className="mt-2"
                      >
                        Recommencer la simulation
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleStartSimulation}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Démarrer la Simulation Intelligente
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <ClientEmbeddedSimulator
              clientData={{
                company_name: formData.company_name,
                secteurActivite: formData.secteurActivite,
                nombreEmployes: formData.nombreEmployes,
                revenuAnnuel: formData.revenuAnnuel
              }}
              prefilledAnswers={{}}
              onComplete={handleSimulationComplete}
              onCancel={handleSimulationCancel}
            />
          )}
        </CardContent>
      </Card>

      {/* Notes admin */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          <FileText className="w-4 h-4 inline mr-2" />
          Notes internes (optionnel)
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Notes visibles uniquement par l'équipe admin..."
          rows={4}
        />
        <p className="text-sm text-gray-500">Ces notes ne seront pas visibles par le client</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Send className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Communication & Confirmation</h3>
      </div>

      {/* Email de bienvenue */}
      <Card className="border-2 border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email de bienvenue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onCheckedChange={(checked) => handleInputChange('sendWelcomeEmail', checked)}
            />
            <div className="flex-1">
              <Label htmlFor="sendWelcomeEmail" className="font-medium cursor-pointer">
                Envoyer un email de bienvenue
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Le client recevra ses identifiants de connexion
              </p>
            </div>
          </div>

          {formData.sendWelcomeEmail && (
            <div className="space-y-2">
              <Label htmlFor="customEmailMessage">Message personnalisé (optionnel)</Label>
              <Textarea
                id="customEmailMessage"
                value={formData.customEmailMessage}
                onChange={(e) => handleInputChange('customEmailMessage', e.target.value)}
                placeholder="Message d'accueil personnalisé..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Résumé de la création</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold">Client :</span>
              <p className="text-gray-700">{formData.first_name} {formData.last_name}</p>
            </div>
            <div>
              <span className="font-semibold">Email :</span>
              <p className="text-gray-700">{formData.email}</p>
            </div>
            <div>
              <span className="font-semibold">Entreprise :</span>
              <p className="text-gray-700">{formData.company_name}</p>
            </div>
            <div>
              <span className="font-semibold">SIREN :</span>
              <p className="text-gray-700">{formData.siren || 'Non renseigné'}</p>
            </div>
            <div>
              <span className="font-semibold">Email bienvenue :</span>
              <Badge variant={formData.sendWelcomeEmail ? 'default' : 'secondary'}>
                {formData.sendWelcomeEmail ? '✓ Oui' : 'Non'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation info */}
      {formData.doSimulation && simulationCompleted && (
        <Card className="border-2 border-purple-300 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Simulation d'éligibilité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Simulation complétée</span>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm text-gray-700">
                <strong>{Object.keys(formData.simulationAnswers || {}).length} réponse(s)</strong> enregistrée(s)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Les produits éligibles (TICPE, DFS, etc.) seront calculés automatiquement lors de la création du client.
              </p>
            </div>
            <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
              💡 Le calcul d'éligibilité utilisera les réponses fournies lors de la simulation pour identifier les produits adaptés au profil du client.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produits éligibles si simulation */}
      {formData.doSimulation && eligibleProducts.length > 0 && (
        <Card className="border-green-300 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Produits éligibles ({eligibleProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eligibleProducts.map((produit, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{produit.nom}</p>
                    <p className="text-xs text-gray-600">{produit.description}</p>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {produit.montant_estime ? `${produit.montant_estime.toLocaleString()}€` : 'Éligible'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

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
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Card className="max-w-4xl mx-auto bg-white shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Formulaire de création client - Étape {currentStep}/{totalSteps}
            </CardTitle>
            <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
          </CardHeader>
          
          <CardContent className="p-8">
            {renderStepIndicator()}

            <div className="min-h-[400px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-3">
                {currentStep === 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipSimulation}
                    disabled={loading}
                  >
                    Passer
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Création...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Créer le client
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

