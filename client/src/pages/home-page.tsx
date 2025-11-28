import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Calculator,
  Target
} from "lucide-react";
import ProcessSteps from "@/components/ProcessSteps";
import PublicHeader from '@/components/PublicHeader';
import { CATEGORIES } from "@/data/categories";

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

// Les catégories sont maintenant importées depuis @/data/categories

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
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Badges de confiance - Responsive avec wrap */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-blue-200/50 text-blue-600 px-3 py-1 rounded-full text-xs font-light shadow-sm">
          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
          <span className="whitespace-nowrap tracking-wide">Plateforme certifiée</span>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-emerald-200/50 text-emerald-600 px-3 py-1 rounded-full text-xs font-light shadow-sm">
          <ShieldCheck className="w-3 h-3" />
          <span className="whitespace-nowrap tracking-wide">Experts vérifiés</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 xl:gap-12">
        {/* Section Contenu - Responsive avec max-width adaptatif */}
        <div className="flex-1 w-full max-w-full lg:max-w-3xl xl:max-w-4xl">
          {/* Titre principal - Responsive et centré sur mobile */}
          <div className="mb-6 sm:mb-8 lg:mb-10 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-light text-slate-900 mb-3 sm:mb-4 leading-[1.3] tracking-tight">
              <span className="block font-extralight text-slate-700">
                Profitum connecte les entreprises aux
              </span>
              <span className="block font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                meilleurs experts
              </span>
              <span className="block font-extralight text-slate-700 mt-2">
                pour transformer contraintes en opportunités financières
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light tracking-wide">
              Économisez jusqu'à 25% sur vos charges et boostez votre trésorerie avec nos experts certifiés. Résultats garantis en 30 jours.
            </p>
          </div>

          {/* Boutons d'action - Responsive avec meilleur espacement */}
          <div className="flex flex-col sm:flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
            {/* CTA Client - Design premium responsive */}
            <div className="flex-1 group w-full">
              <div className="relative">
                {/* Label avec design sophistiqué */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  <span className="text-xs font-light text-slate-600 uppercase tracking-wide">Entreprises</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                </div>
                
                {/* Bouton principal avec effets avancés */}
                <button 
                  onClick={() => navigate('/simulateur')}
                  className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-medium py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Contenu du bouton - Text responsive */}
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="text-xs sm:text-sm font-medium">Calculer mes économies</span>
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </span>
                </button>
                
                {/* Annotation avec design premium - Responsive */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-full px-2.5 py-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-light text-green-600 whitespace-nowrap tracking-wide">Gratuit</span>
                  </div>
                  <span className="text-xs text-slate-400 font-light hidden sm:inline">•</span>
                  <span className="text-xs text-slate-500 font-light whitespace-nowrap tracking-wide">Résultats en 2 min</span>
                </div>
              </div>
            </div>

            {/* CTA Expert - Design premium responsive */}
            <div className="flex-1 group w-full">
              <div className="relative">
                {/* Label avec design sophistiqué */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                  <span className="text-xs font-light text-slate-600 uppercase tracking-wide">Experts</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
                </div>
                
                {/* Bouton principal avec effets avancés */}
                <button 
                  onClick={() => navigate('/welcome-expert')}
                  className="group relative w-full bg-white border border-emerald-200/50 hover:border-emerald-300 text-emerald-700 font-medium py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-md hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Contenu du bouton - Text responsive */}
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="text-xs sm:text-sm font-medium">Rejoindre les experts</span>
                    <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </span>
                </button>
                
                {/* Annotation avec design premium - Responsive */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-full px-2.5 py-1">
                    <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                    <span className="text-xs font-light text-purple-600 whitespace-nowrap tracking-wide">+40% clients</span>
                  </div>
                  <span className="text-xs text-slate-400 font-light hidden sm:inline">•</span>
                  <span className="text-xs text-slate-500 font-light whitespace-nowrap tracking-wide">Commissions garanties</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section KPI - Masqué sur mobile et tablette, visible desktop */}
        <div className="hidden xl:flex flex-shrink-0 w-64">
          <div className="w-full space-y-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xl font-semibold text-slate-900">€2.5M</div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-light tracking-wide">Économies générées</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-emerald-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xl font-semibold text-slate-900">98%</div>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-light tracking-wide">Taux de satisfaction</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-purple-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xl font-semibold text-slate-900">24h</div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-light tracking-wide">Délai de réponse</div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xl font-semibold text-slate-900">20+</div>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-500 font-light tracking-wide">Produits d'optimisation</div>
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
  <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.02]">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>
    </div>
    
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-16 sm:mb-20 lg:mb-24">
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-8">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          <span className="uppercase tracking-wider">Expertise Spécialisée</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
          <span className="block mb-2">Solutions d'optimisation</span>
          <span className="font-normal bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            pour votre entreprise
          </span>
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
          Expertise pointue et accompagnement sur-mesure pour transformer vos contraintes en opportunités financières
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {CATEGORIES.map((category, index) => (
          <div
            key={category.id}
            onClick={() => navigate(`/categories/${category.id}`)}
            className={`group relative bg-white rounded-2xl p-8 sm:p-10 transition-all duration-700 cursor-pointer border border-slate-200/80 hover:border-slate-300 overflow-hidden`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Subtle gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`}></div>
            
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            
            {/* Icon container - More refined */}
            <div className="relative mb-8">
              <div className={`relative w-14 h-14 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-500 group-hover:scale-105`}>
                <category.icon className="w-7 h-7 text-white" />
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
              </div>
              {/* Small indicator dot */}
              <div className={`absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br ${category.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-sm`}></div>
            </div>
            
            {/* Content */}
            <div className="relative">
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-slate-900 group-hover:text-slate-800 transition-colors duration-300 tracking-tight">
                {category.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-light">
                {category.description}
              </p>
              
              {/* Products count - More refined */}
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-4 bg-gradient-to-b ${category.gradient} rounded-full`}></div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {category.products.length} {category.products.length > 1 ? 'solutions' : 'solution'}
                  </span>
                </div>
              </div>
              
              {/* Action indicator - More sophisticated */}
              <div className="flex items-center justify-between">
                <div className={`w-0 group-hover:w-12 h-[1px] bg-gradient-to-r ${category.gradient} rounded-full transition-all duration-500`}></div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  <span className="tracking-wide">Explorer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
            
            {/* Bottom accent on hover */}
            <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
          </div>
        ))}
      </div>
      
      {/* Call to action - More refined */}
      <div className="text-center mt-16 sm:mt-20">
        <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl px-8 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base text-slate-700 font-medium">Besoin d'une étude individualisée ?</span>
          </div>
          <button 
            onClick={() => navigate('/contact')}
            className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Contactez nos experts
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

const CallToActionSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 text-blue-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-8">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          <span className="uppercase tracking-wider">Démarrez votre optimisation</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 mb-4 sm:mb-6 lg:mb-8 px-4 leading-tight tracking-tight">
          <span className="block mb-2">Prêt à optimiser vos</span>
          <span className="font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            finances ?
          </span>
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4 font-light tracking-wide">
          Rejoignez Profitum et commencez à économiser dès aujourd'hui avec nos experts qualifiés.
        </p>
        
        {/* CTA Buttons - Design premium */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center">
          {/* Bouton principal - Simulation */}
          <div className="flex-1 group w-full sm:w-auto max-w-sm mx-auto sm:max-w-none">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 justify-center">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                <span className="text-xs font-light text-slate-600 uppercase tracking-wide">Simulation</span>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent max-w-12"></div>
              </div>
              
              <button 
                onClick={() => navigate('/simulateur')}
                className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-medium py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <span className="text-sm sm:text-base font-medium">Commencer une simulation</span>
                  <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </span>
              </button>
              
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-full px-2.5 py-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-light text-green-600 whitespace-nowrap tracking-wide">Gratuit</span>
                </div>
                <span className="text-xs text-slate-400 font-light">•</span>
                <span className="text-xs text-slate-500 font-light whitespace-nowrap tracking-wide">Résultats en 2 min</span>
              </div>
            </div>
          </div>
          
          {/* Bouton secondaire - Contact */}
          <div className="flex-1 group w-full sm:w-auto max-w-sm mx-auto sm:max-w-none">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 justify-center">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                <span className="text-xs font-light text-slate-600 uppercase tracking-wide">Contact</span>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent max-w-12"></div>
              </div>
              
              <button 
                onClick={() => navigate('/contact')}
                className="group relative w-full bg-white border border-slate-200/80 hover:border-slate-300 text-slate-700 font-medium py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl shadow-md hover:shadow-slate-500/10 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <span className="text-sm sm:text-base font-medium">Prendre contact</span>
                  <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </span>
              </button>
              
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-full px-2.5 py-1">
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-light text-purple-600 whitespace-nowrap tracking-wide">Expert dédié</span>
                </div>
                <span className="text-xs text-slate-400 font-light">•</span>
                <span className="text-xs text-slate-500 font-light whitespace-nowrap tracking-wide">Réponse sous 24h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

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
      <div className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
