import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ShieldCheck, 
  Handshake,
  Clock,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
  Star,
  Users,
  Zap,
  Fuel,
  Building2,
  Calculator,
  Home,
  Receipt,
  Lightbulb,
  Zap as Lightning,
  Target,
  Sparkles
} from "lucide-react";
import ProcessSteps from "@/components/ProcessSteps";
import PublicHeader from '@/components/PublicHeader';

// ============================================================================
// CONSTANTES ET DONNÉES
// ============================================================================

const TESTIMONIALS = [
  { 
    text: "Profitum nous a permis d'économiser 15% sur nos charges annuelles grâce à leur expertise pointue.", 
    author: "Jean Dupont", 
    position: "Directeur Financier",
    rating: 5
  },
  { 
    text: "Une plateforme intuitive qui nous fait gagner un temps précieux. L'accompagnement est remarquable.", 
    author: "Sophie Martin", 
    position: "Responsable Comptable",
    rating: 5
  },
  { 
    text: "Enfin une solution transparente qui centralise tout en un seul endroit. Très satisfait !", 
    author: "Pierre Lambert", 
    position: "CEO StartupTech",
    rating: 5
  },
  { 
    text: "Des experts qualifiés, un suivi impeccable et des économies significatives à la clé.", 
    author: "Isabelle Morel", 
    position: "Entrepreneure",
    rating: 5
  }
];

const SERVICES = [
  { 
    id: "ticpe", 
    title: "TICPE", 
    subtitle: "Taxe Intérieure de Consommation sur les Produits Énergétiques",
    icon: Fuel,
    description: "Récupérez la taxe sur les carburants professionnels avec notre accompagnement digitalisé.",
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-200",
    hoverBorderColor: "hover:border-blue-300"
  },
  { 
    id: "urssaf", 
    title: "URSSAF", 
    subtitle: "Union de Recouvrement des Cotisations de Sécurité Sociale",
    icon: Building2,
    description: "Sécurisez vos cotisations et détectez les trop-perçus pour des économies immédiates.",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
    hoverBorderColor: "hover:border-emerald-300"
  },
  { 
    id: "social", 
    title: "SOCIAL", 
    subtitle: "Optimisation des Charges Sociales",
    icon: Users,
    description: "Optimisez vos charges sociales avec un audit complet pour réduire vos coûts.",
    color: "purple",
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200",
    hoverBorderColor: "hover:border-purple-300"
  },
  { 
    id: "foncier", 
    title: "FONCIER", 
    subtitle: "Taxes Foncières et Immobilières",
    icon: Home,
    description: "Analyse experte de vos taxes foncières pour identifier les économies possibles.",
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-50 to-amber-50",
    borderColor: "border-orange-200",
    hoverBorderColor: "hover:border-orange-300"
  },
  { 
    id: "dfs", 
    title: "DFS", 
    subtitle: "Déduction Forfaitaire Spécifique",
    icon: Receipt,
    description: "Accompagnement sur-mesure pour la Déduction Forfaitaire Spécifique.",
    color: "indigo",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-200",
    hoverBorderColor: "hover:border-indigo-300"
  },
  { 
    id: "cir", 
    title: "CIR", 
    subtitle: "Crédit Impôt Recherche",
    icon: Lightbulb,
    description: "Valorisez vos innovations avec le Crédit Impôt Recherche et boostez votre trésorerie.",
    color: "yellow",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    hoverBorderColor: "hover:border-yellow-300"
  },
  { 
    id: "cee", 
    title: "CEE", 
    subtitle: "Certificats d'Économie d'Énergie",
    icon: Sparkles,
    description: "Financez vos travaux d'efficacité énergétique avec les Certificats d'Économie d'Énergie.",
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    hoverBorderColor: "hover:border-green-300"
  },
  { 
    id: "energie", 
    title: "ENERGIE", 
    subtitle: "Optimisation Énergétique",
    icon: Lightning,
    description: "Réduisez vos factures d'énergie avec des offres négociées et un suivi personnalisé.",
    color: "pink",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-50 to-rose-50",
    borderColor: "border-pink-200",
    hoverBorderColor: "hover:border-pink-300"
  }
];

const PROFITUM_HIGHLIGHTS = [
  { 
    icon: Star, 
    title: "Sélection Rigoureuse", 
    desc: "Nous sélectionnons les meilleurs experts pour vous garantir des résultats concrets." 
  },
  { 
    icon: Zap, 
    title: "Accès Instantané", 
    desc: "Accédez aux experts qualifiés en un clic, sans attente ni complexité." 
  },
  { 
    icon: ShieldCheck, 
    title: "Transparence Totale", 
    desc: "Comparez, sélectionnez et collaborez avec une vision claire des coûts et prestations." 
  },
  { 
    icon: TrendingUp, 
    title: "Suivi Intelligent", 
    desc: "Documents centralisés, tableau de bord intuitif et alertes stratégiques automatisées." 
  },
  { 
    icon: Handshake, 
    title: "Optimisation Financière", 
    desc: "Ne payez que le nécessaire grâce à notre benchmark des tarifs et négociations efficaces." 
  },
  { 
    icon: Users, 
    title: "Croissance Illimitée", 
    desc: "Moins de paperasse, plus de décisions stratégiques pour faire croître votre business." 
  }
];

const ADVANTAGES = [
  { 
    icon: ShieldCheck, 
    title: "Experts Vérifiés", 
    desc: "Tous nos experts sont rigoureusement sélectionnés et certifiés pour garantir un accompagnement de qualité."
  },
  { 
    icon: Handshake, 
    title: "Tarifs Négociés", 
    desc: "Bénéficiez des meilleurs prix grâce à nos accords privilégiés avec nos partenaires experts." 
  },
  { 
    icon: TrendingUp, 
    title: "Économies Garanties", 
    desc: "Nos services permettent en moyenne de réduire vos charges de 15% avec des résultats mesurables." 
  }
];

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

const HeroSection = ({ navigate }: { navigate: (path: string) => void }) => (
  <section className="relative min-h-[calc(100vh-73px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden flex items-center">
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
      {/* Badges de confiance - Responsive avec wrap */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <span className="whitespace-nowrap">Plateforme certifiée</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
          <ShieldCheck className="w-3 h-3" />
          <span className="whitespace-nowrap">Experts vérifiés</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-16">
        {/* Section Contenu - Responsive avec max-width adaptatif */}
        <div className="flex-1 w-full max-w-full lg:max-w-3xl xl:max-w-4xl">
          {/* Titre principal - Responsive et centré sur mobile */}
          <div className="mb-8 sm:mb-10 lg:mb-12 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              <span className="block font-bold text-slate-900">
                Profitum connecte les entreprises aux
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                meilleurs experts
              </span>
              <span className="block font-bold text-slate-900 mt-2">
                pour transformer contraintes en opportunités financières
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Économisez jusqu'à 25% sur vos charges et boostez votre trésorerie avec nos experts certifiés. Résultats garantis en 30 jours.
            </p>
          </div>

          {/* Boutons d'action - Responsive avec meilleur espacement */}
          <div className="flex flex-col sm:flex-col lg:flex-row gap-4 sm:gap-6 mb-8">
            {/* CTA Client - Design premium responsive */}
            <div className="flex-1 group w-full">
              <div className="relative">
                {/* Label avec design sophistiqué */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Entreprises</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                </div>
                
                {/* Bouton principal avec effets avancés */}
                <button 
                  onClick={() => navigate('/simulateur')}
                  className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Contenu du bouton - Text responsive */}
                  <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-sm sm:text-base">Calculer mes économies</span>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </span>
                </button>
                
                {/* Annotation avec design premium - Responsive */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full px-3 py-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-700 whitespace-nowrap">Gratuit</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">•</span>
                  <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Résultats en 2 min</span>
                </div>
              </div>
            </div>

            {/* CTA Expert - Design premium responsive */}
            <div className="flex-1 group w-full">
              <div className="relative">
                {/* Label avec design sophistiqué */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Experts</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
                </div>
                
                {/* Bouton principal avec effets avancés */}
                <button 
                  onClick={() => navigate('/welcome-expert')}
                  className="group relative w-full bg-white border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-xl hover:shadow-emerald-500/20 transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Contenu du bouton - Text responsive */}
                  <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-sm sm:text-base">Rejoindre les experts</span>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </span>
                </button>
                
                {/* Annotation avec design premium - Responsive */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full px-3 py-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">+40% clients</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">•</span>
                  <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Commissions garanties</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section KPI - Masqué sur mobile et tablette, visible desktop */}
        <div className="hidden xl:flex flex-shrink-0 w-72">
          <div className="w-full space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-slate-900">€2.5M</div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-600">Économies générées</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-slate-900">98%</div>
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-600">Taux de satisfaction</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-slate-900">24h</div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-600">Délai de réponse</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-slate-900">20+</div>
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-600">Produits d'optimisation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValuePropositionSection = () => (
  <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
          <ShieldCheck className="w-4 h-4" />
          <span className="whitespace-nowrap">Pourquoi choisir Profitum ?</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 lg:mb-8 px-4">
          L'excellence au service de votre <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">performance</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
          Découvrez les avantages qui font de Profitum la référence en optimisation financière pour les entreprises
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
        {ADVANTAGES.map((advantage, index) => (
          <div key={index} className="group relative">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-8 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <advantage.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">{advantage.title}</h3>
              <p className="text-slate-600 text-center leading-relaxed">{advantage.desc}</p>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const RevolutionSection = () => (
  <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 lg:mb-8 px-4">
          Révolutionnez votre gestion avec <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Profitum</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
          L'expertise simplifiée, la transparence garantie et l'efficacité au service de votre croissance
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {PROFITUM_HIGHLIGHTS.map((item, idx) => (
          <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ServicesSection = () => {
  const navigate = useNavigate();
  
  return (
  <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-200 text-blue-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
          <Target className="w-4 h-4" />
          <span className="whitespace-nowrap">Solutions d'optimisation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 lg:mb-8 px-4">
          Une gamme complète de <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">solutions</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
          Découvrez nos services d'optimisation financière adaptés à vos besoins spécifiques
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            onClick={() => {
              if (service.id === 'ticpe') {
                navigate('/solutions/ticpe');
              } else if (service.id === 'urssaf') {
                navigate('/solutions/urssaf');
              } else if (service.id === 'social') {
                navigate('/solutions/social');
              } else if (service.id === 'foncier') {
                navigate('/solutions/foncier');
              } else if (service.id === 'dfs') {
                navigate('/solutions/dfs');
              } else if (service.id === 'cir') {
                navigate('/solutions/cir');
              } else if (service.id === 'cee') {
                navigate('/solutions/cee');
              } else if (service.id === 'energie') {
                navigate('/solutions/energie');
              }
            }}
            className={`group relative bg-gradient-to-br ${service.bgGradient} rounded-3xl p-8 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl cursor-pointer border ${service.borderColor} ${service.hoverBorderColor} overflow-hidden`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            </div>
            
            {/* Icon container with modern design */}
            <div className="relative mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                <service.icon className="w-8 h-8 text-white" />
              </div>
              {/* Floating accent */}
              <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br ${service.gradient} rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
            </div>
            
            {/* Content */}
            <div className="relative">
              <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-800 transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 font-medium leading-tight">
                {service.subtitle}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              
              {/* Action indicator */}
              <div className="flex items-center justify-between">
                <div className={`w-8 h-1 bg-gradient-to-r ${service.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                <div className={`flex items-center gap-2 text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors`}>
                  <span>En savoir plus</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}></div>
            
            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-bl-full`}></div>
          </div>
        ))}
      </div>
      
      {/* Call to action - Responsive avec layout adaptatif */}
      <div className="text-center mt-12 sm:mt-16">
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-6 sm:px-8 py-4 shadow-sm max-w-full">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span className="text-sm sm:text-base text-slate-700 font-medium whitespace-nowrap">Besoin d'une étude individualisée ?</span>
          </div>
          <button 
            onClick={() => navigate('/contact')}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Contactez-nous
          </button>
        </div>
      </div>
    </div>
  </section>
  );
};

const TestimonialsSection = () => (
  <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 lg:mb-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 lg:mb-8 px-4">
          Ce que disent nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">clients</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
          Découvrez les témoignages de nos clients satisfaits qui ont transformé leurs finances
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {TESTIMONIALS.map((testimonial, index) => (
          <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-slate-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">"</span>
              </div>
            </div>
            <p className="text-slate-700 mb-6 leading-relaxed text-center">"{testimonial.text}"</p>
            
            {/* Rating */}
            <div className="flex justify-center mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
            
            <div className="text-center">
              <div className="font-semibold text-slate-900">{testimonial.author}</div>
              <div className="text-sm text-slate-600">{testimonial.position}</div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CallToActionSection = () => (
  <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 px-4">
        Prêt à optimiser vos <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">finances</span> ?
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
        Rejoignez Profitum et commencez à économiser dès aujourd'hui avec nos experts qualifiés.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center">
        <Link to="/simulateur" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto group bg-white text-blue-700 font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="whitespace-nowrap">Commencer une simulation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </Link>
        <Link to="/simulateur" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto group bg-transparent border-2 border-white text-white font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
            <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="whitespace-nowrap">Tester le simulateur</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const FooterSection = () => (
  <footer className="bg-slate-900">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
        {/* Informations entreprise */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Profitum</h3>
          </div>
          <p className="text-slate-300 mb-6 sm:mb-8 max-w-md leading-relaxed text-sm sm:text-base">
            La plateforme d'optimisation financière qui connecte les entreprises aux meilleurs experts pour transformer les contraintes en opportunités.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm break-all sm:break-normal">contact@profitum.app</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">+33 1 23 45 67 89</span>
            </div>
          </div>
        </div>

        {/* Liens rapides */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Liens rapides</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Accueil</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Services</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Experts</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Simulateur</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Services</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">TICPE</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">URSSAF</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">DFS</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">CIR</a></li>
            <li><a href="#" className="text-slate-300 hover:text-white transition-colors">CEE</a></li>
          </ul>
        </div>
      </div>

      {/* Footer inférieur - Responsive */}
      <div className="border-t border-slate-700 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="text-slate-300 text-xs sm:text-sm order-2 sm:order-1">
            © 2024 Profitum. Tous droits réservés.
          </div>
          <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
            <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function HomePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("HomePage monté avec succès");
    
    return () => {
      console.log("HomePage démonté");
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <PublicHeader />
      <HeroSection navigate={navigate} />
      <ValuePropositionSection />
      
      {/* ProcessSteps - Responsive */}
      <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <ProcessSteps />
      </div>
      
      <RevolutionSection />
      <ServicesSection />
      <TestimonialsSection />
      <CallToActionSection />
      <FooterSection />
    </div>
  );
}
