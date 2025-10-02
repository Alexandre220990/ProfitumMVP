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
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Users,
  Shield,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config';

interface ApporteurRegistrationData {
  // Informations personnelles
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  
  // Informations professionnelles
  company_name: string;
  company_type: string;
  siren?: string;
  sector: string;
  
  // Documents
  cv_file: File | null;
  motivation_letter: string;
  
  // Parrainage
  sponsor_code?: string;
  
  // Conditions
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_commission: boolean;
}

const SECTORS = [
  'Finance & Banque',
  'Immobilier',
  'Conseil & Audit',
  'Assurance',
  'Technologie',
  'Industrie',
  'Commerce',
  'Services',
  'Autre'
];

const COMPANY_TYPES = [
  'Entreprise individuelle',
  'SARL',
  'SAS',
  'SA',
  'EURL',
  'Auto-entrepreneur',
  'Autre'
];

export default function ApporteurRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApporteurRegistrationData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_type: '',
    siren: '',
    sector: '',
    cv_file: null,
    motivation_letter: '',
    sponsor_code: '',
    accept_terms: false,
    accept_privacy: false,
    accept_commission: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.first_name) newErrors.first_name = 'Le prénom est requis';
      if (!formData.last_name) newErrors.last_name = 'Le nom est requis';
      if (!formData.email) newErrors.email = 'L\'email est requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
    }

    if (stepNumber === 2) {
      if (!formData.company_name) newErrors.company_name = 'Le nom de l\'entreprise est requis';
      if (!formData.company_type) newErrors.company_type = 'Le type d\'entreprise est requis';
      if (!formData.sector) newErrors.sector = 'Le secteur d\'activité est requis';
    }

    if (stepNumber === 3) {
      if (!formData.cv_file) newErrors.cv_file = 'Le CV est requis';
      if (!formData.motivation_letter) newErrors.motivation_letter = 'La lettre de motivation est requise';
    }

    if (stepNumber === 4) {
      if (!formData.accept_terms) newErrors.accept_terms = 'Vous devez accepter les conditions';
      if (!formData.accept_privacy) newErrors.accept_privacy = 'Vous devez accepter la politique de confidentialité';
      if (!formData.accept_commission) newErrors.accept_commission = 'Vous devez accepter les conditions de commission';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ApporteurRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Le fichier ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('docx')) {
        toast.error('Seuls les fichiers PDF, DOC et DOCX sont acceptés');
        return;
      }
      setFormData(prev => ({ ...prev, cv_file: file }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('company_type', formData.company_type);
      formDataToSend.append('sector', formData.sector);
      formDataToSend.append('motivation_letter', formData.motivation_letter);
      formDataToSend.append('sponsor_code', formData.sponsor_code || '');
      
      if (formData.cv_file) {
        formDataToSend.append('cv_file', formData.cv_file);
      }

      const response = await fetch(`${config.API_URL}/api/apporteur/register`, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Candidature soumise avec succès ! Vous recevrez un email de confirmation.');
        navigate('/apporteur/login');
      } else {
        toast.error(result.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error('Erreur lors de la soumission de la candidature');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Devenir Apporteur d'Affaires</h1>
                <p className="text-sm text-gray-600">Rejoignez l'équipe Profitum</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Étape {step} sur 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {step === 1 && <User className="h-5 w-5" />}
                  {step === 2 && <Building className="h-5 w-5" />}
                  {step === 3 && <FileText className="h-5 w-5" />}
                  {step === 4 && <Shield className="h-5 w-5" />}
                  {step === 1 && 'Informations Personnelles'}
                  {step === 2 && 'Informations Professionnelles'}
                  {step === 3 && 'Documents & Motivation'}
                  {step === 4 && 'Conditions & Validation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Étape 1: Informations personnelles */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">Prénom *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className={errors.first_name ? 'border-red-500' : ''}
                        />
                        {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="last_name">Nom *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className={errors.last_name ? 'border-red-500' : ''}
                        />
                        {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                )}

                {/* Étape 2: Informations professionnelles */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className={errors.company_name ? 'border-red-500' : ''}
                      />
                      {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_type">Type d'entreprise *</Label>
                        <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                          <SelectTrigger className={errors.company_type ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.company_type && <p className="text-red-500 text-sm mt-1">{errors.company_type}</p>}
                      </div>
                      <div>
                        <Label htmlFor="sector">Secteur d'activité *</Label>
                        <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                          <SelectTrigger className={errors.sector ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Sélectionner le secteur" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTORS.map((sector) => (
                              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.sector && <p className="text-red-500 text-sm mt-1">{errors.sector}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="siren">SIREN (optionnel)</Label>
                      <Input
                        id="siren"
                        value={formData.siren}
                        onChange={(e) => handleInputChange('siren', e.target.value)}
                        placeholder="123456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sponsor_code">Code de parrainage (optionnel)</Label>
                      <Input
                        id="sponsor_code"
                        value={formData.sponsor_code}
                        onChange={(e) => handleInputChange('sponsor_code', e.target.value)}
                        placeholder="Code d'affiliation"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Si vous avez été parrainé par un apporteur existant
                      </p>
                    </div>
                  </div>
                )}

                {/* Étape 3: Documents */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cv_file">CV *</Label>
                      <div className="mt-2">
                        <Input
                          id="cv_file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className={errors.cv_file ? 'border-red-500' : ''}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Formats acceptés: PDF, DOC, DOCX (max 5MB)
                        </p>
                        {errors.cv_file && <p className="text-red-500 text-sm mt-1">{errors.cv_file}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="motivation_letter">Lettre de motivation *</Label>
                      <Textarea
                        id="motivation_letter"
                        value={formData.motivation_letter}
                        onChange={(e) => handleInputChange('motivation_letter', e.target.value)}
                        placeholder="Expliquez pourquoi vous souhaitez devenir apporteur d'affaires chez Profitum..."
                        className={`min-h-[120px] ${errors.motivation_letter ? 'border-red-500' : ''}`}
                      />
                      {errors.motivation_letter && <p className="text-red-500 text-sm mt-1">{errors.motivation_letter}</p>}
                    </div>
                  </div>
                )}

                {/* Étape 4: Conditions */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="accept_terms"
                          checked={formData.accept_terms}
                          onCheckedChange={(checked) => handleInputChange('accept_terms', checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="accept_terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            J'accepte les conditions générales d'utilisation
                          </Label>
                          {errors.accept_terms && <p className="text-red-500 text-sm">{errors.accept_terms}</p>}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="accept_privacy"
                          checked={formData.accept_privacy}
                          onCheckedChange={(checked) => handleInputChange('accept_privacy', checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="accept_privacy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            J'accepte la politique de confidentialité
                          </Label>
                          {errors.accept_privacy && <p className="text-red-500 text-sm">{errors.accept_privacy}</p>}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="accept_commission"
                          checked={formData.accept_commission}
                          onCheckedChange={(checked) => handleInputChange('accept_commission', checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="accept_commission" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            J'accepte les conditions de commission
                          </Label>
                          {errors.accept_commission && <p className="text-red-500 text-sm">{errors.accept_commission}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons de navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                  >
                    Précédent
                  </Button>
                  {step < 4 ? (
                    <Button onClick={nextStep}>
                      Suivant
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Soumission...' : 'Soumettre ma candidature'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar avec informations */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Avantages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Avantages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Commissions attractives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Formation complète</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Support dédié</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Outils professionnels</span>
                  </div>
                </CardContent>
              </Card>

              {/* Processus */}
              <Card>
                <CardHeader>
                  <CardTitle>Processus de validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      1
                    </div>
                    <span className="text-sm">Soumission candidature</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                      2
                    </div>
                    <span className="text-sm">Vérification documents</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                      3
                    </div>
                    <span className="text-sm">Validation admin</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                      4
                    </div>
                    <span className="text-sm">Activation compte</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Besoin d'aide ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Notre équipe est là pour vous accompagner
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">support@profitum.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">01 23 45 67 89</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
