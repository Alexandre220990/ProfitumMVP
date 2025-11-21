import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Building, 
  FileText, 
  CheckCircle, 
  Shield,
  Star,
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Zap,
  MessageSquare,
  Calendar,
  BarChart3,
  ArrowRight,
  Award,
  Briefcase,
  Clock,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config';
import PublicHeader from '@/components/PublicHeader';

// ============================================================================
// TYPES & CONSTANTES
// ============================================================================

interface ApporteurRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  company_name: string;
  company_type: string;
  siren?: string;
  sector: string;
  cv_file: File | null;
  motivation_letter: string;
  sponsor_code?: string;
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
  'Indépendant',
  'Expert',
  'Call Center',
  'Société Commerciale'
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Revenus Récurrents",
    description: "Commission moyenne de 15% par dossier + récurrence annuelle. Pour sociétés : partenariats B2B avec volumes. Pour commerciaux : revenus complémentaires flexibles",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    title: "Simplicité d'Usage",
    description: "Plateforme 100% digitale. Enregistrez un prospect en 5 minutes. Pour sociétés : intégration API possible. Pour commerciaux : outils de prospection intégrés",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Support Complet",
    description: "Formation obligatoire 1h, support technique dédié, documentation complète. Pour sociétés : account manager dédié. Pour commerciaux : communauté et outils marketing",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: Target,
    title: "Multi-Produits & Multi-Profils",
    description: "10 produits éligibles. Augmentez vos revenus en proposant plusieurs solutions. Adapté aux deux modèles : apport d'affaires structuré ou prospection commerciale",
    color: "from-orange-500 to-red-500"
  }
];

const STEPS_TIMELINE = [
  {
    number: 1,
    title: "S'Inscrire",
    description: "Remplissez le formulaire ci-dessous. Validation sous 24-48h après entretien qualificatif",
    icon: User
  },
  {
    number: 2,
    title: "Enregistrer un Prospect",
    description: "Créez une fiche prospect (nom, secteur, budget). Pour sociétés : orientez vos clients existants. Pour commerciaux : enregistrez vos prospects. Simulation automatique identifie les besoins en 5 questions",
    icon: Briefcase
  },
  {
    number: 3,
    title: "Matching Expert",
    description: "Notre algorithme assigne automatiquement l'expert le plus adapté selon les produits identifiés",
    icon: Target
  },
  {
    number: 4,
    title: "Suivi & Accompagnement",
    description: "Dashboard temps réel, messagerie intégrée, agenda synchronisé. Vous suivez tout de A à Z",
    icon: BarChart3
  },
  {
    number: 5,
    title: "Commission & Paiement",
    description: "Client signe → Commission calculée automatiquement → Paiement sous 30 jours + récurrence annuelle",
    icon: Award
  }
];

const TESTIMONIALS = [
  {
    quote: "En tant que cabinet d'expertise-comptable, nous avons monétisé notre portefeuille client existant. 12,000€ de commissions en 3 mois avec seulement 8 clients orientés. Le partenariat B2B fonctionne parfaitement !",
    author: "Marie L.",
    role: "Cabinet d'Expertise-Comptable, Paris",
    revenue: "4,000€/mois",
    clients: 8,
    duration: "3 mois",
    rating: 5,
    type: "société"
  },
  {
    quote: "Commercial indépendant, j'ai développé une activité complémentaire avec Profitum. Le matching automatique avec les experts est génial. Je me concentre sur la prospection, Profitum gère le reste.",
    author: "Thomas B.",
    role: "Commercial Indépendant, Lyon",
    revenue: "6,500€/mois",
    clients: 15,
    duration: "6 mois",
    rating: 5,
    type: "commercial"
  },
  {
    quote: "Notre société de conseil a intégré Profitum pour générer des leads qualifiés. Les outils de suivi sont incroyables, nous savons toujours où en sont nos apports. Interface très professionnelle adaptée au B2B !",
    author: "Alexandre D.",
    role: "Société de Conseil, Bordeaux",
    revenue: "8,000€/mois",
    clients: 22,
    duration: "1 an",
    rating: 5,
    type: "société"
  }
];

const FAQ_ITEMS = [
  {
    question: "Dois-je déjà avoir des clients pour devenir apporteur ?",
    answer: "Non, cela dépend de votre profil ! Si vous êtes une société partenaire, vous pouvez monétiser votre portefeuille client existant. Si vous êtes commercial indépendant, vous pouvez démarrer sans portefeuille - notre plateforme vous accompagne avec des outils de prospection. Nous réfléchissons également à fournir des leads qualifiés pour les commerciaux."
  },
  {
    question: "Y a-t-il des frais d'inscription ou des coûts cachés ?",
    answer: "Absolument aucun frais. L'inscription est 100% gratuite pour tous les profils. Vous ne payez rien, vous ne faites que gagner des commissions sur les dossiers convertis."
  },
  {
    question: "Quelle est la différence entre société partenaire et commercial indépendant ?",
    answer: "Les sociétés partenaires ont généralement un portefeuille client existant qu'elles orientent vers Profitum (partenariats B2B, intégration API possible, account manager dédié). Les commerciaux indépendants prospectent activement de nouveaux clients pour générer des revenus complémentaires (outils de prospection, flexibilité horaire). Les deux bénéficient de la même plateforme et des mêmes commissions."
  },
  {
    question: "Puis-je travailler à temps partiel ou cumuler avec une autre activité ?",
    answer: "Oui, surtout pour les commerciaux indépendants ! Beaucoup de nos apporteurs cumulent avec une autre activité. Vous gérez votre temps librement et développez à votre rythme. Pour les sociétés, c'est un complément de revenus sur votre activité principale."
  },
  {
    question: "Les commissions sont-elles récurrentes ?",
    answer: "Oui pour certains produits ! Vous touchez une commission initiale lors de la signature + des commissions annuelles sur les renouvellements (max 1 an selon les produits). Cela fonctionne pour les deux profils d'apporteurs."
  },
  {
    question: "Quel support vais-je recevoir selon mon profil ?",
    answer: "Tous les apporteurs bénéficient d'une formation obligatoire MOOC d'1h avec QCM, support technique, et documentation complète. Les sociétés partenaires ont en plus un account manager dédié et peuvent bénéficier d'intégrations API. Les commerciaux ont accès à des outils marketing clés en main et une communauté active."
  },
  {
    question: "Combien de temps avant ma première commission ?",
    answer: "En moyenne 30-45 jours (inscription → premier client → signature → paiement sous 30 jours). Pour les sociétés avec un portefeuille existant, cela peut être plus rapide. Pour les commerciaux en prospection, cela dépend de votre rythme de prospection."
  },
  {
    question: "Les sociétés peuvent-elles intégrer Profitum via API ?",
    answer: "Oui, nous proposons des intégrations API pour les sociétés partenaires souhaitant automatiser l'envoi de leurs clients vers notre plateforme. Contactez-nous pour discuter de votre projet d'intégration."
  }
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function BecomeApporteur() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<ApporteurRegistrationData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
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

  // Scroll vers formulaire
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.first_name) newErrors.first_name = 'Le prénom est requis';
      if (!formData.last_name) newErrors.last_name = 'Le nom est requis';
      if (!formData.email) newErrors.email = 'L\'email est requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
      if (!formData.password) newErrors.password = 'Le mot de passe est requis';
      else if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      if (!formData.confirm_password) newErrors.confirm_password = 'La confirmation du mot de passe est requise';
      else if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Les mots de passe ne correspondent pas';
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
      if (file.size > 5 * 1024 * 1024) {
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
      formDataToSend.append('password', formData.password);
      formDataToSend.append('company_name', formData.company_name);
      formDataToSend.append('company_type', formData.company_type);
      formDataToSend.append('sector', formData.sector);
      formDataToSend.append('motivation_letter', formData.motivation_letter);
      formDataToSend.append('sponsor_code', formData.sponsor_code || '');
      
      if (formData.siren) {
        formDataToSend.append('siren', formData.siren);
      }
      
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
    <div className="min-h-screen bg-white">
      {/* Header Public */}
      <PublicHeader />

      {/* ========================================
          SECTION HERO
      ======================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white py-20 lg:py-28">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Rejoignez notre réseau d'apporteurs performants
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Devenez Apporteur d'Affaires
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Pour Sociétés & Commerciaux
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Monétisez votre réseau client ou développez votre activité commerciale | Plateforme 100% digitale | Commission jusqu'à 15%
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={scrollToForm}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 shadow-xl"
              >
                🚀 Devenir Apporteur Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">15%</div>
                <div className="text-sm text-blue-200">Commission moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">0€</div>
                <div className="text-sm text-blue-200">Frais d'inscription</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">24-48h</div>
                <div className="text-sm text-blue-200">Validation</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================
          SECTION DEUX PROFILS D'APPORTEURS
      ======================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Deux Profils, Une Même Opportunité
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Que vous soyez une société avec un portefeuille client ou un commercial indépendant, 
              Profitum s'adapte à votre modèle d'affaires
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Profil 1 : Société */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Building className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">Société Partenaire</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 mb-6 font-medium">
                    Vous avez une société avec un portefeuille client existant ? 
                    <span className="text-blue-600 font-bold"> Monétisez vos relations</span> en les orientant vers Profitum.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Apport d'Affaires Structuré</h4>
                        <p className="text-gray-600 text-sm">
                          Renvoyez vos clients vers notre plateforme et générez des revenus récurrents 
                          sur chaque dossier converti
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Génération de Leads Qualifiés</h4>
                        <p className="text-gray-600 text-sm">
                          Transformez votre réseau en source de leads qualifiés avec suivi complet 
                          et reporting détaillé
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Partnership B2B</h4>
                        <p className="text-gray-600 text-sm">
                          Accords de partenariat, intégration API possible, dashboard dédié pour 
                          suivre vos apports en temps réel
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong className="text-blue-600">Idéal pour :</strong> Cabinets d'expertise-comptable, 
                      sociétés de conseil, courtiers, agences immobilières, call centers, 
                      et toute société avec un portefeuille client B2B
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Profil 2 : Commercial */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">Commercial Indépendant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 mb-6 font-medium">
                    Vous êtes commercial ou chasseur de clients ? 
                    <span className="text-purple-600 font-bold"> Développez votre activité</span> avec Profitum 
                    et générez des revenus complémentaires.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Revenus Complémentaires</h4>
                        <p className="text-gray-600 text-sm">
                          Générez 2,000€ à 8,000€/mois en apportant des clients. 
                          Commission moyenne de 15% par dossier signé
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Prospection Facilitée</h4>
                        <p className="text-gray-600 text-sm">
                          Outils de prospection intégrés, simulation automatique des besoins, 
                          matching expert pour convertir plus facilement
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Activité Flexible</h4>
                        <p className="text-gray-600 text-sm">
                          Travaillez à votre rythme, cumulez avec une autre activité, 
                          gérez votre portefeuille depuis votre dashboard
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong className="text-purple-600">Idéal pour :</strong> Commerciaux indépendants, 
                      chasseurs de clients, experts-comptables, conseillers, 
                      et toute personne souhaitant développer une activité d'apporteur d'affaires
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Les Deux Profils Bénéficient de la Même Plateforme
                </h3>
                <p className="text-gray-700 mb-4">
                  Dashboard temps réel, suivi des dossiers, messagerie intégrée, 
                  calcul automatique des commissions, et support dédié pour tous
                </p>
                <Button 
                  size="lg"
                  onClick={scrollToForm}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg"
                >
                  Rejoindre le Réseau
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ========================================
          SECTION POURQUOI PROFITUM
      ======================================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Rejoindre Profitum ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Que vous soyez société partenaire ou commercial indépendant, 
              bénéficiez d'une plateforme complète pour monétiser vos apports d'affaires
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4`}>
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION TIMELINE - 5 ÉTAPES
      ======================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comment Ça Marche ?
            </h2>
            <p className="text-xl text-gray-600">
              5 étapes simples pour réussir avec Profitum - Valable pour sociétés partenaires et commerciaux indépendants
            </p>
          </motion.div>

          <div className="space-y-8">
            {STEPS_TIMELINE.map((stepItem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {stepItem.number}
                  </div>
                </div>
                <Card className="flex-1 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <stepItem.icon className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{stepItem.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{stepItem.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Button 
              size="lg"
              onClick={scrollToForm}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg"
            >
              🚀 Je me lance maintenant !
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========================================
          SECTION OUTILS PLATEFORME
      ======================================== */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Vos Outils Professionnels
            </h2>
            <p className="text-xl text-gray-600">
              Une plateforme complète pour gérer votre activité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "Dashboard KPI", desc: "Clients, Prospects, Dossiers, Conversion temps réel" },
              { icon: Briefcase, title: "Gestion Prospects", desc: "Enregistrement 5min, simulation auto, kanban visuel" },
              { icon: MessageSquare, title: "Messagerie Pro", desc: "Chat temps réel, upload fichiers, historique" },
              { icon: Calendar, title: "Agenda Intégré", desc: "RDV multi-types, synchronisation, rappels auto" },
              { icon: Target, title: "10 Produits", desc: "Fiscal, Social, Environnemental, Énergie" },
              { icon: Users, title: "Réseau Experts", desc: "Matching automatique, experts vérifiés" },
              { icon: DollarSign, title: "Suivi Commissions", desc: "Dashboard revenus, détails, export" },
              { icon: TrendingUp, title: "Statistiques", desc: "Conversion, performance, objectifs" }
            ].map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                      <tool.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{tool.title}</h4>
                    <p className="text-sm text-gray-600">{tool.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION TÉMOIGNAGES
      ======================================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Ils Réussissent avec Profitum
            </h2>
            <p className="text-xl text-gray-600">
              Des résultats concrets de nos apporteurs - Sociétés partenaires et commerciaux indépendants
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className={`h-full border-0 shadow-lg hover:shadow-2xl transition-all ${
                  testimonial.type === 'société' ? 'border-l-4 border-blue-500' : 'border-l-4 border-purple-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <Badge className={
                        testimonial.type === 'société' 
                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                          : 'bg-purple-100 text-purple-700 border-purple-300'
                      }>
                        {testimonial.type === 'société' ? '🏢 Société' : '👤 Commercial'}
                      </Badge>
                    </div>
                    <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                    <div className="border-t pt-4">
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600 mb-3">{testimonial.role}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-green-50 px-2 py-1 rounded text-green-700 font-medium">
                          {testimonial.revenue}
                        </div>
                        <div className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                          {testimonial.clients} clients
                        </div>
                        <div className="bg-purple-50 px-2 py-1 rounded text-purple-700 font-medium">
                          {testimonial.duration}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION FAQ
      ======================================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border-0"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 flex-1 pr-4">{faq.question}</h4>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedFaq === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-gray-600 mt-4 leading-relaxed"
                      >
                        {faq.answer}
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION FORMULAIRE - OPTIMISÉ COMPACT
      ======================================== */}
      <section ref={formRef} id="formulaire" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Inscription Apporteur
            </h2>
            <p className="text-lg text-gray-600">
              Remplissez le formulaire ci-dessous pour rejoindre notre réseau
            </p>
          </motion.div>

          {/* Progress Bar Compact */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    num === step ? 'bg-blue-600 text-white' :
                    num < step ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {num < step ? <CheckCircle className="w-5 h-5" /> : num}
                  </div>
                  {num < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      num < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Personnel</span>
              <span>Professionnel</span>
              <span>Documents</span>
              <span>Validation</span>
            </div>
          </div>

          {/* Formulaire Compact */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                {step === 1 && <><User className="h-5 w-5 text-blue-600" /> Informations Personnelles</>}
                {step === 2 && <><Building className="h-5 w-5 text-blue-600" /> Informations Professionnelles</>}
                {step === 3 && <><FileText className="h-5 w-5 text-blue-600" /> Documents & Motivation</>}
                {step === 4 && <><Shield className="h-5 w-5 text-blue-600" /> Conditions & Validation</>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Étape 1 */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={errors.first_name ? 'border-red-500' : ''}
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={errors.last_name ? 'border-red-500' : ''}
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
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
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                      placeholder="Minimum 8 caractères"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                      className={errors.confirm_password ? 'border-red-500' : ''}
                      placeholder="Répétez le mot de passe"
                    />
                    {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
                  </div>
                </div>
              )}

              {/* Étape 2 */}
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
                    {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_type">Type d'entreprise *</Label>
                      <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                        <SelectTrigger className={errors.company_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.company_type && <p className="text-red-500 text-xs mt-1">{errors.company_type}</p>}
                    </div>
                    <div>
                      <Label htmlFor="sector">Secteur *</Label>
                      <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                        <SelectTrigger className={errors.sector ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTORS.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.sector && <p className="text-red-500 text-xs mt-1">{errors.sector}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="sponsor_code">Code parrainage (optionnel)</Label>
                      <Input
                        id="sponsor_code"
                        value={formData.sponsor_code}
                        onChange={(e) => handleInputChange('sponsor_code', e.target.value)}
                        placeholder="Code d'affiliation"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cv_file">CV * (PDF, DOC, DOCX - max 5MB)</Label>
                    <Input
                      id="cv_file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className={`mt-2 ${errors.cv_file ? 'border-red-500' : ''}`}
                    />
                    {formData.cv_file && (
                      <p className="text-sm text-green-600 mt-1">✓ {formData.cv_file.name}</p>
                    )}
                    {errors.cv_file && <p className="text-red-500 text-xs mt-1">{errors.cv_file}</p>}
                  </div>
                  <div>
                    <Label htmlFor="motivation_letter">Lettre de motivation *</Label>
                    <Textarea
                      id="motivation_letter"
                      value={formData.motivation_letter}
                      onChange={(e) => handleInputChange('motivation_letter', e.target.value)}
                      placeholder="Expliquez pourquoi vous souhaitez devenir apporteur d'affaires chez Profitum..."
                      className={`min-h-[100px] ${errors.motivation_letter ? 'border-red-500' : ''}`}
                    />
                    {errors.motivation_letter && <p className="text-red-500 text-xs mt-1">{errors.motivation_letter}</p>}
                  </div>
                </div>
              )}

              {/* Étape 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Dernière étape !</strong> Acceptez les conditions ci-dessous pour soumettre votre candidature.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="accept_terms"
                        checked={formData.accept_terms}
                        onCheckedChange={(checked) => handleInputChange('accept_terms', checked)}
                      />
                      <Label htmlFor="accept_terms" className="text-sm cursor-pointer">
                        J'accepte les conditions générales d'utilisation
                        {errors.accept_terms && <p className="text-red-500 text-xs mt-1">{errors.accept_terms}</p>}
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="accept_privacy"
                        checked={formData.accept_privacy}
                        onCheckedChange={(checked) => handleInputChange('accept_privacy', checked)}
                      />
                      <Label htmlFor="accept_privacy" className="text-sm cursor-pointer">
                        J'accepte la politique de confidentialité
                        {errors.accept_privacy && <p className="text-red-500 text-xs mt-1">{errors.accept_privacy}</p>}
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="accept_commission"
                        checked={formData.accept_commission}
                        onCheckedChange={(checked) => handleInputChange('accept_commission', checked)}
                      />
                      <Label htmlFor="accept_commission" className="text-sm cursor-pointer">
                        J'accepte les conditions de commission (15% moyen, variable selon produits)
                        {errors.accept_commission && <p className="text-red-500 text-xs mt-1">{errors.accept_commission}</p>}
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons navigation */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="px-6"
                >
                  ← Précédent
                </Button>
                {step < 4 ? (
                  <Button onClick={nextStep} className="px-6 bg-blue-600 hover:bg-blue-700">
                    Suivant →
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? 'Soumission...' : '🚀 Soumettre ma Candidature'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info validation rapide */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 text-green-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Validation sous 24-48h après entretien qualificatif</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

