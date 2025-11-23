import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  Mail, 
  Building, 
  MapPin, 
  FileText, 
  Phone, 
  Globe, 
  Shield, 
  Star, 
  Percent, 
  Users, 
  Play,
  CheckCircle,
  ArrowRight,
  Award,
  TrendingUp,
  Users as UsersIcon,
  Clock,
  Zap,
  Upload,
  X as XIcon,
  File,
  Paperclip,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { config } from '@/config/env';
import PublicHeader from '@/components/PublicHeader';

// ============================================================================
// SCHEMA DE VALIDATION
// ============================================================================

const formSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirm_password: z.string().min(8, 'Veuillez confirmer votre mot de passe'),
  company_name: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siren: z.string()
    .transform((val) => val.replace(/\s/g, '')) // Supprimer les espaces
    .refine((val) => val.length === 9, 'Le SIREN doit contenir exactement 9 chiffres')
    .refine((val) => /^\d{9}$/.test(val), 'Le SIREN ne doit contenir que des chiffres'),
  produits_eligibles: z.array(z.string()).min(1, 'Au moins un produit est requis'),
  autre_produit: z.string().optional(),
  cabinet_role: z.enum(['OWNER', 'MANAGER', 'EXPERT']).optional(),
  secteur_activite: z.array(z.string()).min(1, 'Au moins un secteur d\'activité est requis'),
  experience: z.string().min(1, 'L\'expérience est requise'),
  location: z.string().min(2, 'La localisation est requise'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  phone: z.string().min(10, 'Le numéro de téléphone est requis'),
  website: z.string().url('Format d\'URL invalide').optional().or(z.literal('')),
  linkedin: z.string().url('Format d\'URL LinkedIn invalide').optional().or(z.literal('')),
  languages: z.array(z.string()).min(1, 'Au moins une langue est requise'),
  compensation: z.number().min(0).max(100).optional(),
  max_clients: z.number().min(1).max(1000).optional(),
  certifications: z.array(z.string()).optional(),
  documents: z.any().optional() // Documents optionnels
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof formSchema>;

// ============================================================================
// DONNÉES STATIQUES
// ============================================================================

// Grandes catégories d'expertise (types d'expertise)
interface CategorieExpertise {
  id: string;
  nom: string;
  description: string;
}

const categoriesExpertise: CategorieExpertise[] = [
  {
    id: 'optimisation-fiscale',
    nom: 'Optimisation Fiscale',
    description: 'Optimisation de la fiscalité (FONCIER, TVA)'
  },
  {
    id: 'optimisation-sociale',
    nom: 'Optimisation Sociale',
    description: 'Optimisation des charges sociales (DFS, MSA, URSSAF)'
  },
  {
    id: 'optimisation-energetique',
    nom: 'Optimisation Énergétique',
    description: 'Optimisation énergétique (CEE, Optimisation fournisseur électricité, Optimisation fournisseur gaz, TICPE)'
  },
  {
    id: 'services-juridiques-recouvrement',
    nom: 'Services Juridiques et Recouvrement',
    description: 'Services juridiques et recouvrement d\'impayés'
  },
  {
    id: 'logiciels-outils-numeriques',
    nom: 'Logiciels et Outils Numériques',
    description: 'Logiciels et outils numériques (Logiciel Solid, Chronotachygraphes digitaux)'
  }
];

// Secteurs d'activité alignés sur le simulateur (GENERAL_001)
const secteursActiviteOptions = [
  'Transport et Logistique',
  'Commerce et Distribution',
  'Industrie et Fabrication',
  'Services aux Entreprises',
  'BTP et Construction',
  'Restauration et Hôtellerie',
  'Santé et Services Sociaux',
  'Agriculture et Agroalimentaire',
  'Services à la Personne',
  'Autre secteur'
];

const experienceOptions = [
  { value: 'Moins de 2 ans', label: 'Moins de 2 ans' },
  { value: '2-5 ans', label: '2-5 ans' },
  { value: '5-10 ans', label: '5-10 ans' },
  { value: '10-15 ans', label: '10-15 ans' },
  { value: 'Plus de 15 ans', label: 'Plus de 15 ans' }
];

const languageOptions = [
  'Français',
  'Anglais',
  'Allemand',
  'Espagnol',
  'Italien',
  'Chinois'
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

const benefits = [
  {
    icon: TrendingUp,
    title: 'Développez votre activité',
    description: 'Accédez à un réseau de clients qualifiés et développez votre portefeuille'
  },
  {
    icon: UsersIcon,
    title: 'Clients sélectionnés',
    description: 'Des entreprises triées sur le volet pour des missions de qualité'
  },
  {
    icon: Clock,
    title: 'Gain de temps',
    description: 'Automatisation des processus administratifs et de suivi'
  },
  {
    icon: Zap,
    title: 'Outils performants',
    description: 'Plateforme moderne avec tous les outils nécessaires à votre activité'
  }
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const WelcomeExpert = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [autreProduit, setAutreProduit] = useState('');
  const [cabinetRole, setCabinetRole] = useState<'OWNER' | 'MANAGER' | 'EXPERT' | ''>('');
  const [selectedSecteurs, setSelectedSecteurs] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Français']);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<{name: string, url: string, type: string}[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      company_name: '',
      siren: '',
      produits_eligibles: [], // Sera rempli avec les catégories sélectionnées
      autre_produit: '',
      cabinet_role: undefined,
      secteur_activite: [],
      experience: '',
      location: '',
      description: '',
      phone: '',
      website: '',
      linkedin: '',
      languages: ['Français'],
      compensation: 20,
      max_clients: 100,
      certifications: [],
      documents: undefined
    }
  });

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  const formatPhoneNumber = (value: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Si c'est un numéro français (commence par 0)
    if (numbers.startsWith('0') && numbers.length === 10) {
      return `+33 ${numbers.slice(1, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9)}`;
    }
    
    // Si c'est déjà au format international
    if (numbers.startsWith('33') && numbers.length === 11) {
      return `+33 ${numbers.slice(2, 4)} ${numbers.slice(4, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)} ${numbers.slice(10)}`;
    }
    
    return value;
  };

  const formatSiren = (value: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Limiter à 9 chiffres maximum
    const limitedNumbers = numbers.slice(0, 9);
    
    // Formater avec des espaces tous les 3 chiffres
    if (limitedNumbers.length >= 6) {
      return limitedNumbers.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (limitedNumbers.length >= 3) {
      return limitedNumbers.replace(/(\d{3})(\d{3})/, '$1 $2');
    } else {
      return limitedNumbers;
    }
  };

  // ============================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================================================

  const handleCategorieChange = (categorieId: string, checked: boolean) => {
    if (checked) {
      const newCategories = [...selectedCategories, categorieId];
      setSelectedCategories(newCategories);
      // Envoyer les IDs des catégories comme produits_eligibles pour la compatibilité avec le backend
      form.setValue('produits_eligibles', newCategories);
    } else {
      const newCategories = selectedCategories.filter(c => c !== categorieId);
      setSelectedCategories(newCategories);
      form.setValue('produits_eligibles', newCategories);
    }
  };

  const handleSecteurChange = (secteur: string, checked: boolean) => {
    if (checked) {
      const newSecteurs = [...selectedSecteurs, secteur];
      setSelectedSecteurs(newSecteurs);
      form.setValue('secteur_activite', newSecteurs);
    } else {
      const newSecteurs = selectedSecteurs.filter(s => s !== secteur);
      setSelectedSecteurs(newSecteurs);
      form.setValue('secteur_activite', newSecteurs);
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      const newLanguages = [...selectedLanguages, language];
      setSelectedLanguages(newLanguages);
      form.setValue('languages', newLanguages);
    } else {
      const newLanguages = selectedLanguages.filter(l => l !== language);
      setSelectedLanguages(newLanguages);
      form.setValue('languages', newLanguages);
    }
  };

  const handleCertificationChange = (certification: string, checked: boolean) => {
    if (checked) {
      const newCertifications = [...selectedCertifications, certification];
      setSelectedCertifications(newCertifications);
      form.setValue('certifications', newCertifications);
    } else {
      const newCertifications = selectedCertifications.filter(c => c !== certification);
      setSelectedCertifications(newCertifications);
      form.setValue('certifications', newCertifications);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    const newDocuments: {name: string, url: string, type: string}[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validation taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
          continue;
        }

        // Validation type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Le fichier ${file.name} n'est pas au format autorisé (PDF, JPG, PNG, DOC, DOCX)`);
          continue;
        }

        // Créer FormData pour upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'expert-documents');

        // Upload vers le backend
        const response = await fetch(`${config.API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Échec de l'upload de ${file.name}`);
        }

        const result = await response.json();
        newDocuments.push({
          name: file.name,
          url: result.url,
          type: file.type
        });
      }

      setUploadedDocuments([...uploadedDocuments, ...newDocuments]);
      toast.success(`${newDocuments.length} document(s) uploadé(s) avec succès`);
    } catch (error) {
      console.error('Erreur upload documents:', error);
      toast.error('Erreur lors de l\'upload des documents');
    } finally {
      setIsUploadingDoc(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    const newDocuments = uploadedDocuments.filter((_, i) => i !== index);
    setUploadedDocuments(newDocuments);
    toast.success('Document supprimé');
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${config.API_URL}/api/expert/demo-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          produits_eligibles: selectedCategories, // Envoyer les catégories sélectionnées
          autre_produit: autreProduit || undefined,
          cabinet_role: cabinetRole || undefined,
          secteur_activite: selectedSecteurs,
          languages: selectedLanguages,
          certifications: selectedCertifications,
          documents: uploadedDocuments.length > 0 ? uploadedDocuments : null
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la demande');
      }

      toast.success('🎉 Demande envoyée avec succès ! L\'équipe Profitum revient vers vous dans les 24-48h pour organiser une présentation personnalisée');

      // Redirection vers une page de confirmation
      navigate('/demo-confirmation');
      
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader />
      
      {/* Section Hero - Design haut niveau et compact */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-16">
        {/* Animated background elements - plus subtils */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-8">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          
          {/* Geometric patterns subtils */}
          <div className="absolute inset-0 opacity-3">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid-hero" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid-hero)" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            {/* Badge premium - plus discret */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 backdrop-blur-xl border border-blue-500/20 text-blue-100 px-6 py-2.5 rounded-full text-xs font-medium mb-6 shadow-lg">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="font-medium">Réseau d'experts sélectionnés</span>
            </div>
            
            {/* Titre principal - typographie sophistiquée et compacte */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-white mb-4 leading-[1.1] tracking-tight max-w-5xl mx-auto">
              <span className="block font-light opacity-90 mb-1">
                Développez votre activité avec
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Profitum
              </span>
            </h1>
            
            {/* Description - plus concise */}
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Rejoignez notre réseau d'experts sélectionnés et accédez à des clients qualifiés.
            </p>

            {/* CTA - couleurs différentes pour texte et fond */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-base font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200"
                onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Demander une démo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 px-8 py-3 text-base font-semibold rounded-lg backdrop-blur-sm transition-all duration-200"
                onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-4 h-4 mr-2" />
                Voir la présentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Avantages */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Pourquoi rejoindre Profitum ?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Une plateforme conçue pour les experts qui veulent se concentrer sur leur expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-300">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section Vidéo */}
      <section id="video-section" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Découvrez Profitum en vidéo
            </h2>
            <p className="text-xl text-gray-300">
              Une présentation complète de notre plateforme
            </p>
          </div>

          <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
                <p className="text-white text-lg font-medium">Vidéo de présentation</p>
                <p className="text-gray-400 text-sm">Bientôt disponible</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Formulaire */}
      <section id="form-section" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Demander une démo
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Remplissez ce formulaire et notre équipe vous recontactera dans les 24-48h 
              pour organiser une présentation personnalisée de la plateforme.
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Informations personnelles */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <UserCircle className="w-6 h-6 mr-3 text-blue-400" />
                      Informations personnelles
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Prénom *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCircle className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="Prénom"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Nom *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCircle className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="Nom de famille"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  type="email"
                                  placeholder="expert@entreprise.com"
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Mot de passe *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">
                              Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Confirmer le mot de passe *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Téléphone *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="+33 6 12 34 56 78"
                                  onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    field.onChange(formatted);
                                  }}
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Localisation *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="Paris, Lyon, Marseille..."
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Informations entreprise */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Building className="w-6 h-6 mr-3 text-green-400" />
                      Informations entreprise
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Nom de l'entreprise *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Nom de votre cabinet/entreprise"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="siren"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">SIREN *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="123 456 789"
                                  maxLength={11}
                                  onChange={(e) => {
                                    const formatted = formatSiren(e.target.value);
                                    field.onChange(formatted);
                                  }}
                                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center">
                              Site web
                              <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="url"
                                placeholder="https://www.entreprise.com"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                              />
                            </FormControl>
                            <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center">
                              LinkedIn
                              <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="url"
                                placeholder="https://linkedin.com/in/expert"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                              />
                            </FormControl>
                            <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Rôle dans le cabinet */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Users className="w-6 h-6 mr-3 text-blue-400" />
                      Rôle dans le cabinet
                    </h3>
                    <p className="text-sm text-gray-300">Indiquez votre rôle si vous faites partie d'un cabinet</p>
                    
                    <FormField
                      control={form.control}
                      name="cabinet_role"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select 
                              value={cabinetRole} 
                              onValueChange={(value) => {
                                setCabinetRole(value as 'OWNER' | 'MANAGER' | 'EXPERT');
                                field.onChange(value || undefined);
                              }}
                            >
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Sélectionner un rôle (optionnel)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OWNER">Propriétaire (Owner)</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="EXPERT">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Type d'expertise */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Shield className="w-6 h-6 mr-3 text-purple-400" />
                      Type d'expertise *
                    </h3>
                    <p className="text-sm text-gray-300">Sélectionnez vos types d'expertise</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoriesExpertise.map((categorie) => (
                        <div key={categorie.id} className="flex items-start space-x-3 p-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox
                            id={categorie.id}
                            checked={selectedCategories.includes(categorie.id)}
                            onCheckedChange={(checked: boolean) => handleCategorieChange(categorie.id, checked)}
                            className="border-white/20 mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor={categorie.id} className="text-sm font-medium cursor-pointer text-white block">
                              {categorie.nom}
                            </label>
                            {categorie.description && (
                              <p className="text-xs text-gray-400 mt-1">{categorie.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Option "Autre" */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3 p-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                        <Checkbox
                          id="autre-produit"
                          checked={autreProduit.length > 0}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              // Laisser l'utilisateur remplir le champ
                            } else {
                              setAutreProduit('');
                              form.setValue('autre_produit', '');
                            }
                          }}
                          className="border-white/20 mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="autre-produit" className="text-sm font-medium cursor-pointer text-white block">
                            Autre
                          </label>
                          <p className="text-xs text-gray-400 mt-1">Précisez un produit non listé</p>
                        </div>
                      </div>
                      {autreProduit.length > 0 && (
                        <FormField
                          control={form.control}
                          name="autre_produit"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={autreProduit}
                                  onChange={(e) => {
                                    setAutreProduit(e.target.value);
                                    field.onChange(e.target.value);
                                  }}
                                  placeholder="Décrivez le produit..."
                                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    
                    {form.formState.errors.produits_eligibles && (
                      <p className="text-red-400 text-sm">{form.formState.errors.produits_eligibles.message}</p>
                    )}
                  </div>

                  {/* Secteurs d'activité */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Building className="w-6 h-6 mr-3 text-green-400" />
                      Secteurs d'activité *
                    </h3>
                    <p className="text-sm text-gray-300">Dans quels secteurs d'activité intervenez-vous ?</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {secteursActiviteOptions.map((secteur) => (
                        <div key={secteur} className="flex items-center space-x-3 p-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox
                            id={`secteur-${secteur}`}
                            checked={selectedSecteurs.includes(secteur)}
                            onCheckedChange={(checked: boolean) => handleSecteurChange(secteur, checked)}
                            className="border-white/20"
                          />
                          <label htmlFor={`secteur-${secteur}`} className="text-sm font-medium cursor-pointer flex-1 text-white">
                            {secteur}
                          </label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.secteur_activite && (
                      <p className="text-red-400 text-sm">{form.formState.errors.secteur_activite.message}</p>
                    )}
                  </div>

                  {/* Expérience et description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Expérience *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Sélectionner votre expérience" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-white/20">
                                {experienceOptions.map((exp) => (
                                  <SelectItem key={exp.value} value={exp.value} className="text-white hover:bg-gray-700">
                                    {exp.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Décrivez vos compétences, expériences et spécialités..."
                              rows={4}
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Champs optionnels */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Star className="w-6 h-6 mr-3 text-yellow-400" />
                      Paramètres optionnels
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="compensation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center">
                              <Percent className="w-4 h-4 mr-2" />
                              Compensation (%)
                              <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                max="100"
                                placeholder="20"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_clients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Nombre max de clients
                              <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                max="1000"
                                placeholder="100"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Langues parlées */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Langues parlées
                        <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {languageOptions.map((lang) => (
                          <div key={lang} className="flex items-center space-x-3">
                            <Checkbox
                              id={lang}
                              checked={selectedLanguages.includes(lang)}
                              onCheckedChange={(checked: boolean) => handleLanguageChange(lang, checked)}
                              className="border-white/20"
                            />
                            <label htmlFor={lang} className="text-sm text-white cursor-pointer">{lang}</label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                    </div>

                    {/* Certifications */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Certifications
                        <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certificationOptions.map((cert) => (
                          <div key={cert} className="flex items-center space-x-3">
                            <Checkbox
                              id={cert}
                              checked={selectedCertifications.includes(cert)}
                              onCheckedChange={(checked: boolean) => handleCertificationChange(cert, checked)}
                              className="border-white/20"
                            />
                            <label htmlFor={cert} className="text-sm text-white cursor-pointer">{cert}</label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400">Ce champ est optionnel</p>
                    </div>

                    {/* Documents justificatifs (optionnel) */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white flex items-center">
                        <Paperclip className="w-5 h-5 mr-2" />
                        Documents justificatifs
                        <Badge variant="outline" className="ml-2 text-xs">Optionnel</Badge>
                      </h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Vous pouvez joindre des documents pour accélérer votre validation (CV, certifications, KBIS, etc.)
                      </p>
                      
                      {/* Zone d'upload */}
                      <div className="border-2 border-dashed border-white/30 rounded-lg p-6 bg-white/5 hover:bg-white/10 transition-colors">
                        <label htmlFor="document-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="w-12 h-12 text-blue-400 mb-3" />
                            <p className="text-white font-medium mb-1">
                              Cliquez pour uploader des documents
                            </p>
                            <p className="text-sm text-gray-400">
                              PDF, JPG, PNG, DOC, DOCX (max 10MB par fichier)
                            </p>
                          </div>
                          <input
                            id="document-upload"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleDocumentUpload}
                            className="hidden"
                            disabled={isUploadingDoc}
                          />
                        </label>
                      </div>

                      {/* Liste des documents uploadés */}
                      {uploadedDocuments.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-sm text-gray-300 font-medium">
                            Documents ajoutés ({uploadedDocuments.length}) :
                          </p>
                          {uploadedDocuments.map((doc, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between bg-white/10 border border-white/20 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <File className="w-5 h-5 text-blue-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">
                                    {doc.name}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {doc.type.includes('pdf') ? 'PDF' : doc.type.includes('image') ? 'Image' : 'Document'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveDocument(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <XIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {isUploadingDoc && (
                        <div className="flex items-center justify-center gap-2 text-blue-400 mt-4">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Upload en cours...</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        💡 Les documents sont optionnels mais peuvent accélérer la validation de votre profil
                      </p>
                    </div>
                  </div>

                  {/* Bouton de soumission */}
                  <div className="flex justify-center pt-8">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-lg font-semibold rounded-full"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Envoi en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Demander une démo</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default WelcomeExpert; 