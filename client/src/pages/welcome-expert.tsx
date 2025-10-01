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
  Quote,
  Award,
  TrendingUp,
  Users as UsersIcon,
  Clock,
  Zap
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
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  company_name: z.string().min(2, 'Le nom de l\'entreprise est requis'),
  siren: z.string()
    .transform((val) => val.replace(/\s/g, '')) // Supprimer les espaces
    .refine((val) => val.length === 9, 'Le SIREN doit contenir exactement 9 chiffres')
    .refine((val) => /^\d{9}$/.test(val), 'Le SIREN ne doit contenir que des chiffres'),
  specializations: z.array(z.string()).min(1, 'Au moins une spécialisation est requise'),
  experience: z.string().min(1, 'L\'expérience est requise'),
  location: z.string().min(2, 'La localisation est requise'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  phone: z.string().min(10, 'Le numéro de téléphone est requis'),
  website: z.string().url('Format d\'URL invalide').optional().or(z.literal('')),
  linkedin: z.string().url('Format d\'URL LinkedIn invalide').optional().or(z.literal('')),
  languages: z.array(z.string()).min(1, 'Au moins une langue est requise'),
  compensation: z.number().min(0).max(100).optional(),
  max_clients: z.number().min(1).max(1000).optional(),
  certifications: z.array(z.string()).optional()
});

type FormData = z.infer<typeof formSchema>;

// ============================================================================
// DONNÉES STATIQUES
// ============================================================================

const specializationsOptions = [
  { value: 'TICPE', label: 'TICPE', description: 'Taxe Intérieure de Consommation sur les Produits Énergétiques' },
  { value: 'DFS', label: 'DFS', description: 'Déclaration Fiscale Simplifiée' },
  { value: 'URSSAF', label: 'URSSAF', description: 'Union de Recouvrement des Cotisations de Sécurité Sociale' },
  { value: 'CEE', label: 'CEE', description: 'Certificats d\'Économies d\'Énergie' },
  { value: 'Audit énergétique', label: 'Audit énergétique', description: 'Audit de performance énergétique' },
  { value: 'Certification ISO', label: 'Certification ISO', description: 'Certifications ISO 9001, 14001, etc.' },
  { value: 'Formation', label: 'Formation', description: 'Formation professionnelle' },
  { value: 'Conseil', label: 'Conseil', description: 'Conseil en entreprise' },
  { value: 'Comptabilité', label: 'Comptabilité', description: 'Services comptables' },
  { value: 'Fiscalité', label: 'Fiscalité', description: 'Conseil fiscal' }
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

const testimonials = [
  {
    name: 'Cabinet Fiscal Plus',
    text: 'Profitum nous a permis de doubler notre clientèle en 6 mois. La plateforme est intuitive et les clients sont qualifiés.',
    author: 'Marie Dubois',
    position: 'Directrice',
    rating: 5
  },
  {
    name: 'Expertise Comptable Pro',
    text: 'Une plateforme intuitive qui nous fait gagner un temps précieux. Les missions sont variées et intéressantes.',
    author: 'Pierre Martin',
    position: 'Expert-comptable',
    rating: 5
  },
  {
    name: 'Conseil Fiscal Excellence',
    text: 'Des clients qualifiés et des missions intéressantes. Profitum a transformé notre façon de travailler.',
    author: 'Sophie Bernard',
    position: 'Consultante',
    rating: 5
  },
  {
    name: 'Audit & Optimisation',
    text: 'La meilleure décision pour développer notre activité. Une équipe réactive et des outils performants.',
    author: 'Jean Dupont',
    position: 'Directeur',
    rating: 5
  }
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
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Français']);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company_name: '',
      siren: '',
      specializations: [],
      experience: '',
      location: '',
      description: '',
      phone: '',
      website: '',
      linkedin: '',
      languages: ['Français'],
      compensation: 20,
      max_clients: 100,
      certifications: []
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

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      const newSpecializations = [...selectedSpecializations, specialization];
      setSelectedSpecializations(newSpecializations);
      form.setValue('specializations', newSpecializations);
    } else {
      const newSpecializations = selectedSpecializations.filter(s => s !== specialization);
      setSelectedSpecializations(newSpecializations);
      form.setValue('specializations', newSpecializations);
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
          specializations: selectedSpecializations,
          languages: selectedLanguages,
          certifications: selectedCertifications,
          approval_status: 'pending',
          status: 'inactive',
          rating: 0,
          availability: 'disponible'
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
      
      {/* Section Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 text-blue-100 px-8 py-4 rounded-full text-sm font-medium mb-8">
              <Award className="w-5 h-5 text-yellow-400" />
              Rejoignez l'élite des experts fiscaux
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Développez votre activité avec{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Profitum
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Rejoignez notre réseau d'experts sélectionnés et accédez à des clients qualifiés. 
              Une plateforme moderne pour développer votre activité en toute sérénité.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-full"
                onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Demander une démo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full"
                onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-5 h-5 mr-2" />
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

      {/* Section Témoignages */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Découvrez les témoignages de nos experts partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Quote className="w-8 h-8 text-blue-400 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{testimonial.name}</h3>
                      <p className="text-gray-400 text-sm">{testimonial.author} - {testimonial.position}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Nom complet *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCircle className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <Input 
                                  {...field} 
                                  placeholder="Prénom Nom"
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

                  {/* Spécialisations */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-white flex items-center">
                      <Shield className="w-6 h-6 mr-3 text-purple-400" />
                      Spécialisations *
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {specializationsOptions.map((spec) => (
                        <div key={spec.value} className="flex items-center space-x-3 p-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox
                            id={spec.value}
                            checked={selectedSpecializations.includes(spec.value)}
                            onCheckedChange={(checked: boolean) => handleSpecializationChange(spec.value, checked)}
                            className="border-white/20"
                          />
                          <label htmlFor={spec.value} className="text-sm font-medium cursor-pointer flex-1 text-white">
                            {spec.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {form.formState.errors.specializations && (
                      <p className="text-red-400 text-sm">{form.formState.errors.specializations.message}</p>
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