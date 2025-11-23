import { Button } from "@/components/ui/button";
import { Shield, Award, FileCheck, TrendingUp, Star, Zap, CheckCircle, ArrowRight, Search, UserCheck, MessageSquare, Handshake, DollarSign, BarChart3, Clock, Crown, Calculator } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { useNavigate } from "react-router-dom";

// Statistiques du marketplace
const marketplaceStats = [
  { icon: TrendingUp, value: "+200", label: "Experts vérifiés", color: "from-green-500 to-emerald-600" },
  { icon: CheckCircle, value: "98%", label: "Taux de satisfaction", color: "from-blue-500 to-indigo-600" },
  { icon: DollarSign, value: "15%", label: "d'économies moyennes", color: "from-purple-500 to-pink-600" },
  { icon: Clock, value: "<24h", label: "Temps de réponse", color: "from-cyan-500 to-teal-600" }
];

// Processus du marketplace
const marketplaceProcess = [
  { 
    step: "01", 
    icon: Search, 
    title: "Recherche", 
    description: "Sélection des experts correspondant à vos besoins", 
    color: "from-blue-500 to-cyan-500" 
  },
  { 
    step: "02", 
    icon: UserCheck, 
    title: "Vérification", 
    description: "Validation des compétences et certifications", 
    color: "from-purple-500 to-pink-500" 
  },
  { 
    step: "03", 
    icon: MessageSquare, 
    title: "Contact", 
    description: "Échange direct avec l'expert sélectionné", 
    color: "from-green-500 to-emerald-500" 
  },
  { 
    step: "04", 
    icon: Handshake, 
    title: "Accompagnement", 
    description: "Suivi personnalisé adapté à vos objectifs", 
    color: "from-orange-500 to-red-500" 
  }
];

// Avantages du marketplace
const marketplaceBenefits = [
  { 
    icon: Zap, 
    title: "Efficacité", 
    description: "Identification rapide des experts adaptés à vos besoins spécifiques.", 
    highlight: "Optimisation du temps",
    color: "from-blue-500 to-indigo-600"
  },
  { 
    icon: Shield, 
    title: "Qualité", 
    description: "Réseau d'experts vérifiés, certifiés et expérimentés.", 
    highlight: "Sélection rigoureuse",
    color: "from-green-500 to-emerald-600"
  },
  { 
    icon: DollarSign, 
    title: "Transparence", 
    description: "Tarification claire et négociation adaptée à votre contexte.", 
    highlight: "Optimisation budgétaire",
    color: "from-purple-500 to-pink-600"
  },
  { 
    icon: BarChart3, 
    title: "Suivi", 
    description: "Accompagnement personnalisé avec visibilité sur l'avancement.", 
    highlight: "Pilotage continu",
    color: "from-cyan-500 to-teal-600"
  }
];

export default function ExpertsVerifies() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header avec navigation */}
      <PublicHeader />

      {/* Hero Section - Style home page */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          
          {/* Geometric patterns */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center">
            {/* Premium badge with micro-interactions */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700/30 to-slate-800/30 backdrop-blur-xl border border-slate-500/20 text-slate-300 px-5 py-2.5 rounded-full text-xs font-light mb-8 shadow-lg group">
              <div className="relative">
                <Crown className="w-3.5 h-3.5 text-amber-400/80 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-pulse"></div>
              </div>
              <span className="font-light tracking-wide">Experts vérifiés</span>
              <div className="flex items-center gap-1">
                <div className="w-0.5 h-0.5 bg-emerald-400/60 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400 font-light">Certifiés</span>
              </div>
            </div>
            
            {/* Main headline with sophisticated typography */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-8 leading-[1.3] tracking-tight max-w-4xl mx-auto">
                <span className="block font-extralight opacity-75 mb-2">
                  Sélection d'experts
                </span>
                <span className="block font-normal bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-clip-text text-transparent">
                  vérifiés et certifiés
                </span>
                <span className="block font-extralight opacity-70 mt-4 text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
                  Accompagnement sur mesure pour vos projets financiers
                </span>
              </h1>
            </div>

            {/* Value propositions with sophisticated icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
              {marketplaceStats.map((stat, index) => (
                <div key={index} className="group flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                    <div className={`relative bg-gradient-to-br ${stat.color} p-4 rounded-full shadow-2xl group-hover:shadow-xl transition-all duration-300`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="text-xl font-light mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-400 font-light tracking-wide">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust indicators - simplified */}
            <div className="flex items-center justify-center gap-8 text-slate-400/80 text-xs font-light tracking-wide">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-400/50 rounded-full"></div>
                <span>Certifiés</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-slate-400/50 rounded-full"></div>
                <span>Réseau sélectionné</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Section Processus du Marketplace - Style home page */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100/50 to-slate-50/50 border border-slate-200/50 text-slate-600 px-5 py-2 rounded-full text-xs font-light mb-6 tracking-wide">
              <Search className="w-3.5 h-3.5" />
              Processus
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 tracking-tight">
              <span className="text-slate-700">Accès aux</span> <span className="font-normal text-slate-900">experts sélectionnés</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto font-light tracking-wide">
              Parcours simplifié pour identifier et collaborer avec les professionnels adaptés
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketplaceProcess.map((process, index) => (
              <div key={index} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${process.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:border-blue-300 transition-all duration-300 hover-lift">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${process.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                      <div className={`relative bg-gradient-to-br ${process.color} p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <process.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-light text-slate-400 mb-3 text-center tracking-wide">{process.step}</div>
                  <h3 className="text-base font-normal mb-3 text-slate-900 text-center tracking-tight">{process.title}</h3>
                  <p className="text-slate-500 text-center leading-relaxed text-xs font-light">
                    {process.description}
                  </p>
                  
                  {/* Hover effect indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-8 h-1 bg-gradient-to-r ${process.color} rounded-full`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Évangélisation - Style moderne */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100/50 to-slate-50/50 border border-slate-200/50 text-slate-600 px-5 py-2 rounded-full text-xs font-light mb-6 tracking-wide">
                <Shield className="w-3.5 h-3.5" />
                Sélection
              </div>
              <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-6 tracking-tight">
                <span className="text-slate-700">Critères d'excellence</span> <span className="font-normal text-slate-900">et vérification rigoureuse</span>
              </h2>
              <div className="space-y-5 text-slate-600">
                <p className="text-sm leading-relaxed font-light">
                  Chaque expert de notre réseau est sélectionné selon des critères stricts 
                  d'excellence professionnelle. Nous privilégions la qualité sur la quantité, 
                  en validant les compétences, certifications et expériences.
                </p>
                <p className="text-sm leading-relaxed font-light">
                  Notre processus de vérification garantit que vous collaborez uniquement 
                  avec des professionnels reconnus, certifiés et expérimentés dans leur domaine.
                </p>
                <p className="text-sm leading-relaxed font-light">
                  L'excellence se construit dans le détail. Nous consacrons un temps significatif 
                  à l'identification et à la validation de chaque expert avant intégration.
                </p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200/50">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <FileCheck className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-normal text-slate-900 mb-1.5 text-sm tracking-tight">Vérification</h3>
                  <p className="text-xs text-slate-500 font-light">Validation exhaustive</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-normal text-slate-900 mb-1.5 text-sm tracking-tight">Certifications</h3>
                  <p className="text-xs text-slate-500 font-light">Accréditations validées</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-normal text-slate-900 mb-1.5 text-sm tracking-tight">Réputation</h3>
                  <p className="text-xs text-slate-500 font-light">Références vérifiées</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-cyan-500 to-teal-600 p-3 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-normal text-slate-900 mb-1.5 text-sm tracking-tight">Performance</h3>
                  <p className="text-xs text-slate-500 font-light">Résultats attestés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Avantages du Marketplace - Style moderne */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100/50 to-slate-50/50 border border-slate-200/50 text-slate-600 px-5 py-2 rounded-full text-xs font-light mb-6 tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              Avantages
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 tracking-tight">
              <span className="text-slate-700">Services dédiés</span> <span className="font-normal text-slate-900">et accompagnement personnalisé</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto font-light tracking-wide">
              Accès privilégié à un réseau d'experts et à des outils adaptés
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketplaceBenefits.map((benefit, index) => (
              <div key={index} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${benefit.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 hover:border-blue-300 transition-all duration-300 hover-lift">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${benefit.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                      <div className={`relative bg-gradient-to-br ${benefit.color} p-3 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-normal text-slate-900 mb-2 text-center tracking-tight">{benefit.title}</h3>
                  <p className="text-slate-500 mb-3 text-xs leading-relaxed text-center font-light">
                    {benefit.description}
                  </p>
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-3 py-1.5 rounded text-center border border-slate-200/30">
                    <span className="text-xs font-light text-slate-600 tracking-wide">{benefit.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Footer amélioré */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Section principale - Clients */}
          <div className="mb-12 text-center">
            <h2 className="text-xl md:text-2xl font-light text-white mb-4 leading-relaxed max-w-3xl mx-auto tracking-tight">
              Accès à un réseau d'experts pour optimiser vos projets financiers
          </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xl mx-auto font-light tracking-wide">
            Collaboration avec des professionnels sélectionnés et vérifiés
          </p>
            <Button 
              onClick={() => navigate("/simulateur")}
              className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Essayez nos services dès maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Inscription gratuite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Accès immédiat</span>
              </div>
            </div>
          </div>

          {/* Séparateur visuel */}
          <div className="flex items-center justify-center mb-12">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>

          {/* Section experts */}
          <div className="bg-white/5 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
            <p className="text-sm md:text-base text-slate-300 mb-5 max-w-xl mx-auto">
              Vous êtes une société experte dans un domaine et souhaitez intégrer notre catalogue ? Rencontrons-nous
            </p>
            <Button 
              asChild
              className="bg-slate-700 hover:bg-slate-600 text-white border-0 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <a href="https://www.profitum.app/welcome-expert" target="_blank" rel="noopener noreferrer">
                <Handshake className="w-4 h-4 mr-2" />
                Rejoindre notre écosystème
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 