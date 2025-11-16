import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Save, ArrowLeft, UserPlus, User, Building2, MapPin, Phone, Mail, Star, Percent, Calendar, Shield, AlertCircle, CheckCircle, XCircle, Globe, Lock, Eye, EyeOff, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Configuration Supabase - Utilise l'instance importée depuis @/lib/supabase

interface ProduitEligible {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
}

interface ExpertForm {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  temp_password?: string;
  company_name: string;
  produits_eligibles: string[];
  autre_produit?: string;
  cabinet_role?: 'OWNER' | 'MANAGER' | 'EXPERT';
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
  website?: string;
  linkedin?: string;
  certifications?: string[];
  languages?: string[];
  availability?: string;
  max_clients?: number;
  hourly_rate?: number;
}


const experienceOptions = [
  { value: 'Moins de 2 ans', label: 'Moins de 2 ans' },
  { value: '2-5 ans', label: '2-5 ans' },
  { value: '5-10 ans', label: '5-10 ans' },
  { value: '10-15 ans', label: '10-15 ans' },
  { value: 'Plus de 15 ans', label: 'Plus de 15 ans' }
];

const abonnementOptions = [
  { value: 'starter', label: 'Starter', description: 'Accès de base' },
  { value: 'growth', label: 'Growth', description: 'Accès étendu' },
  { value: 'scale', label: 'Scale', description: 'Accès complet' }
];

const certificationOptions = [
  'Expert-comptable',
  'Commissaire aux comptes',
  'Certification ISO 9001',
  'Certification ISO 14001',
  'Certification ISO 27001',
  'Certification TICPE',
  'Certification CEE',
  'Formation continue'
];

const languageOptions = [
  'Français',
  'Anglais',
  'Allemand',
  'Espagnol',
  'Italien',
  'Chinois'
];

const availabilityOptions = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'partiel', label: 'Temps partiel' },
  { value: 'limite', label: 'Capacité limitée' },
  { value: 'indisponible', label: 'Indisponible' }
];

const FormulaireExpert = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // États du formulaire
  const [form, setForm] = useState<ExpertForm>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    temp_password: '',
    company_name: '',
    produits_eligibles: [],
    autre_produit: '',
    cabinet_role: undefined,
    rating: 0,
    compensation: 0,
    status: 'active',
    approval_status: 'pending',
    experience: '',
    city: '',
    phone: '',
    description: '',
    siren: '',
    abonnement: 'basic',
    website: '',
    linkedin: '',
    certifications: [],
    languages: ['Français'],
    availability: 'disponible',
    max_clients: 10,
    hourly_rate: 0
  });

  const [produitsEligibles, setProduitsEligibles] = useState<ProduitEligible[]>([]);
  const [loadingProduits, setLoadingProduits] = useState(true);
  const [selectedProduits, setSelectedProduits] = useState<string[]>([]);
  const [autreProduit, setAutreProduit] = useState('');
  const [cabinetRole, setCabinetRole] = useState<'OWNER' | 'MANAGER' | 'EXPERT' | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Vérification d'authentification
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

  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  // Charger les produits éligibles
  useEffect(() => {
    const fetchProduitsEligibles = async () => {
      try {
        setLoadingProduits(true);
        const response = await fetch('/api/produits-eligibles');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des produits');
        }
        const data = await response.json();
        if (data.success && data.data) {
          setProduitsEligibles(data.data);
        }
      } catch (error) {
        console.error('Erreur chargement produits:', error);
      } finally {
        setLoadingProduits(false);
      }
    };
    
    fetchProduitsEligibles();
  }, []);

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
        console.log('Session expirée, redirection vers connect-admin');
        navigate('/connect-admin');
        return;
      }

      const response = await fetch(`/api/admin/experts/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Expert non trouvé');
      }

      const data = await response.json();
      const expertData = data.data.expert;
      
      // Mapping correct des données de la base vers le formulaire
      // Gestion migration name → first_name/last_name
      let firstName = expertData.first_name || '';
      let lastName = expertData.last_name || '';
      
      // Si pas de first_name/last_name mais un name legacy, le splitter
      if (!firstName && !lastName && expertData.name) {
        const nameParts = expertData.name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Charger les produits éligibles de l'expert
      const produitsResponse = await fetch(`/api/admin/experts/${id}/produits`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let produitsIds: string[] = [];
      if (produitsResponse.ok) {
        const produitsData = await produitsResponse.json();
        if (produitsData.success && produitsData.data) {
          produitsIds = produitsData.data.map((p: any) => p.produit_id || p.id);
        }
      }
      
      setForm({
        ...expertData,
        first_name: firstName,
        last_name: lastName,
        city: expertData.location || '', // Mapping location -> city
        phone: expertData.phone || '',
        website: expertData.website || '',
        linkedin: expertData.linkedin || '',
        languages: expertData.languages || ['Français'],
        availability: expertData.availability || 'disponible',
        max_clients: expertData.max_clients || 10,
        hourly_rate: expertData.hourly_rate || 0,
        certifications: expertData.certifications || [],
        produits_eligibles: produitsIds,
        autre_produit: expertData.autre_produit || '',
        cabinet_role: expertData.cabinet_role || undefined
      });
      
      setSelectedProduits(produitsIds);
      setAutreProduit(expertData.autre_produit || '');
      setCabinetRole(expertData.cabinet_role || '');
    } catch (err) {
      setError('Erreur lors du chargement de l\'expert');
      console.error('Erreur chargement expert: ', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.first_name.trim()) errors.first_name = 'Le prénom est requis';
    if (!form.last_name.trim()) errors.last_name = 'Le nom est requis';
    if (!form.email.trim()) errors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Format d\'email invalide';
    
    if (!form.company_name.trim()) errors.company_name = 'Le nom de l\'entreprise est requis';
    if (form.siren && !/^\d{9}$/.test(form.siren)) errors.siren = 'Le SIREN doit contenir 9 chiffres';
    if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) errors.phone = 'Format de téléphone invalide';
    if (form.produits_eligibles.length === 0) errors.produits_eligibles = 'Au moins un produit est requis';
    if (form.rating < 0 || form.rating > 5) errors.rating = 'La note doit être entre 0 et 5';
    if (form.compensation < 0 || form.compensation > 100) errors.compensation = 'La compensation doit être entre 0 et 100%';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/connect-admin');
        return;
      }

      const url = isEditing 
        ? `/api/admin/experts/${id}`
        : '/api/admin/experts';

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
        navigate('/admin/dashboard-optimized');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur sauvegarde expert: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProduitChange = (produitId: string, checked: boolean) => {
    if (checked) {
      const newProduits = [...selectedProduits, produitId];
      setSelectedProduits(newProduits);
      setForm(prev => ({
        ...prev,
        produits_eligibles: newProduits
      }));
    } else {
      const newProduits = selectedProduits.filter(p => p !== produitId);
      setSelectedProduits(newProduits);
      setForm(prev => ({
        ...prev,
        produits_eligibles: newProduits
      }));
    }
  };

  const handleCertificationChange = (certification: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certification]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        certifications: (prev.certifications || []).filter(c => c !== certification)
      }));
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setForm(prev => ({
        ...prev,
        languages: [...(prev.languages || []), language]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        languages: (prev.languages || []).filter(l => l !== language)
      }));
    }
  };

  const handleInputChange = (field: keyof ExpertForm, value: any) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    
    // Assurer au moins une majuscule, une minuscule, un chiffre
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    
    // Compléter avec 9 caractères aléatoires pour avoir 12 caractères au total
    for (let i = 0; i < 9; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGenerateTempPassword = () => {
    const newPassword = generateRandomPassword();
    setForm(prev => ({
      ...prev,
      temp_password: newPassword,
      password: newPassword
    }));
    setShowPassword(true);
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
    <TooltipProvider>
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
                onClick={() => navigate('/admin/dashboard-optimized')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6">
          <Card className="max-w-5xl mx-auto bg-white shadow-lg">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                {isEditing ? (
                  <>
                    <User className="w-6 h-6 mr-3 text-blue-600" />
                    Modifier l'expert
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6 mr-3 text-green-600" />
                    Nouvel expert
                  </>
                )}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {isEditing ? 'Modifiez les informations de l\'expert' : 'Créez un nouveau profil d\'expert'}
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

                {/* Informations de base */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="flex items-center">
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
                        <Label htmlFor="last_name" className="flex items-center">
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email *
                        {validationErrors.email && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        placeholder="expert@entreprise.com"
                        className={validationErrors.email ? 'border-red-500' : ''}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm">{validationErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Téléphone
                        {validationErrors.phone && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="01 23 45 67 89"
                        className={validationErrors.phone ? 'border-red-500' : ''}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm">{validationErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Ville
                      </Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Paris"
                      />
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
                        onClick={handleGenerateTempPassword}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Générer un mot de passe
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center">
                        Mot de passe {!isEditing && '*'}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {isEditing ? 'Optionnel' : 'Requis'}
                        </Badge>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password || ''}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder={isEditing ? "Laisser vide pour ne pas modifier" : "Mot de passe"}
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
                        {isEditing 
                          ? "Laisser vide pour conserver le mot de passe actuel"
                          : "Ce mot de passe sera envoyé à l'expert par email. Min. 8 caractères."
                        }
                      </p>
                      {form.temp_password && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>Mot de passe généré :</strong> Copiez-le maintenant, il ne sera plus visible ensuite. 
                            L'expert recevra ce mot de passe par email.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Label htmlFor="company_name" className="flex items-center">
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
                      <Label htmlFor="siren" className="flex items-center">
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
                      <Label htmlFor="website">Site web</Label>
                      <Input
                        id="website"
                        type="url"
                        value={form.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.entreprise.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={form.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/expert"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rôle dans le cabinet */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Rôle dans le cabinet</h3>
                  </div>
                  
                  <div className="max-w-md">
                    <Select 
                      value={cabinetRole} 
                      onValueChange={(value) => {
                        setCabinetRole(value as 'OWNER' | 'MANAGER' | 'EXPERT');
                        setForm(prev => ({ ...prev, cabinet_role: value as 'OWNER' | 'MANAGER' | 'EXPERT' }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Propriétaire (Owner)</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Produits éligibles */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Produits éligibles *</h3>
                    {validationErrors.produits_eligibles && <span className="text-red-500">*</span>}
                  </div>
                  
                  {loadingProduits ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Chargement des produits...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {produitsEligibles.map((produit) => (
                          <Tooltip key={produit.id}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <Checkbox
                                  id={produit.id}
                                  checked={selectedProduits.includes(produit.id)}
                                  onCheckedChange={(checked: boolean) => handleProduitChange(produit.id, checked as boolean)}
                                />
                                <Label htmlFor={produit.id} className="text-sm font-medium cursor-pointer flex-1">
                                  {produit.nom}
                                </Label>
                              </div>
                            </TooltipTrigger>
                            {produit.description && (
                              <TooltipContent>
                                <p>{produit.description}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </div>
                      
                      {/* Option "Autre" */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id="autre-produit"
                            checked={autreProduit.length > 0}
                            onCheckedChange={(checked: boolean) => {
                              if (!checked) {
                                setAutreProduit('');
                                setForm(prev => ({ ...prev, autre_produit: '' }));
                              }
                            }}
                          />
                          <Label htmlFor="autre-produit" className="text-sm font-medium cursor-pointer flex-1">
                            Autre
                          </Label>
                        </div>
                        {autreProduit.length > 0 && (
                          <div className="ml-8">
                            <Label htmlFor="autre-produit-text" className="text-sm text-gray-600 mb-2 block">
                              Décrivez le produit
                            </Label>
                            <Textarea
                              id="autre-produit-text"
                              value={autreProduit}
                              onChange={(e) => {
                                setAutreProduit(e.target.value);
                                setForm(prev => ({ ...prev, autre_produit: e.target.value }));
                              }}
                              placeholder="Décrivez le produit..."
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                      
                      {validationErrors.produits_eligibles && (
                        <p className="text-red-500 text-sm">{validationErrors.produits_eligibles}</p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* Certifications et langues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Certifications
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {certificationOptions.map((cert) => (
                        <div key={cert} className="flex items-center space-x-3">
                          <Checkbox
                            id={cert}
                            checked={form.certifications?.includes(cert) || false}
                            onCheckedChange={(checked: boolean) => handleCertificationChange(cert, checked as boolean)}
                          />
                          <Label htmlFor={cert} className="text-sm">{cert}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-green-600" />
                      Langues parlées
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {languageOptions.map((lang) => (
                        <div key={lang} className="flex items-center space-x-3">
                          <Checkbox
                            id={lang}
                            checked={form.languages?.includes(lang) || false}
                            onCheckedChange={(checked: boolean) => handleLanguageChange(lang, checked as boolean)}
                          />
                          <Label htmlFor={lang} className="text-sm">{lang}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Paramètres professionnels */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-600" />
                    Paramètres professionnels
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Note (0-5)
                        {validationErrors.rating && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={form.rating}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                        className={validationErrors.rating ? 'border-red-500' : ''}
                      />
                      {validationErrors.rating && (
                        <p className="text-red-500 text-sm">{validationErrors.rating}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="compensation" className="flex items-center">
                        <Percent className="w-4 h-4 mr-2" />
                        Compensation (%)
                        {validationErrors.compensation && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="compensation"
                        type="number"
                        min="0"
                        max="100"
                        value={form.compensation}
                        onChange={(e) => handleInputChange('compensation', parseInt(e.target.value) || 0)}
                        className={validationErrors.compensation ? 'border-red-500' : ''}
                      />
                      {validationErrors.compensation && (
                        <p className="text-red-500 text-sm">{validationErrors.compensation}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Taux horaire (€)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        min="0"
                        value={form.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_clients">Clients max</Label>
                      <Input
                        id="max_clients"
                        type="number"
                        min="1"
                        value={form.max_clients}
                        onChange={(e) => handleInputChange('max_clients', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Expérience
                      </Label>
                      <Select value={form.experience} onValueChange={(value: string) => handleInputChange('experience', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceOptions.map((exp) => (
                            <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Disponibilité</Label>
                      <Select value={form.availability} onValueChange={(value: string) => handleInputChange('availability', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availabilityOptions.map((avail) => (
                            <SelectItem key={avail.value} value={avail.value}>{avail.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Statuts */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Statuts et configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="flex items-center">
                        Statut
                      </Label>
                      <Select value={form.status} onValueChange={(value: string) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon('active')}
                              <span>Actif</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon('inactive')}
                              <span>Inactif</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="approval_status" className="flex items-center">
                        Statut d'approbation
                      </Label>
                      <Select value={form.approval_status} onValueChange={(value: string) => handleInputChange('approval_status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center space-x-2">
                              {getApprovalStatusIcon('pending')}
                              <span>En attente</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="approved">
                            <div className="flex items-center space-x-2">
                              {getApprovalStatusIcon('approved')}
                              <span>Approuvé</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center space-x-2">
                              {getApprovalStatusIcon('rejected')}
                              <span>Rejeté</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="abonnement">Abonnement</Label>
                      <Select value={form.abonnement} onValueChange={(value: string) => handleInputChange('abonnement', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {abonnementOptions.map((abonnement) => (
                            <SelectItem key={abonnement.value} value={abonnement.value}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{abonnement.label}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{abonnement.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description de l'expert, compétences, certifications, expériences notables..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500">
                    Décrivez les compétences, expériences et spécialités de l'expert
                  </p>
                </div>

                {/* Résumé des produits sélectionnés */}
                {form.produits_eligibles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Produits sélectionnés</Label>
                    <div className="flex flex-wrap gap-2">
                      {form.produits_eligibles.map((produitId) => {
                        const produit = produitsEligibles.find(p => p.id === produitId);
                        return (
                          <Badge key={produitId} variant="secondary" className="bg-blue-100 text-blue-800">
                            {produit?.nom || produitId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    disabled={loading || form.produits_eligibles.length === 0}
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
    </TooltipProvider>
  );
};

export default FormulaireExpert; 