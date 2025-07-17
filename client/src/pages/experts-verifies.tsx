import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, FileCheck, TrendingUp, Star, Zap, CheckCircle, ArrowRight, Search, UserCheck, MessageSquare, Handshake, DollarSign, BarChart3, MapPin, Clock, Crown, Eye, Target, Calculator, Users } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

// Données des experts vedettes (simulées)
const featuredExperts = [
  {
    id: "1",
    name: "Marie Dubois",
    specializations: ["Optimisation fiscale", "Comptabilité"],
    experience: "15+ ans",
    location: "Paris",
    rating: 4.9,
    completedProjects: 127,
    successRate: 98,
    description: "Experte en optimisation fiscale pour PME et startups",
    avatar: "MD"
  },
  {
    id: "2", 
    name: "Pierre Martin",
    specializations: ["Audit énergétique", "Développement durable"],
    experience: "12+ ans",
    location: "Lyon",
    rating: 4.8,
    completedProjects: 89,
    successRate: 96,
    description: "Spécialiste en audit énergétique et solutions durables",
    avatar: "PM"
  },
  {
    id: "3",
    name: "Sophie Bernard",
    specializations: ["CIR", "Innovation"],
    experience: "10+ ans", 
    location: "Marseille",
    rating: 4.9,
    completedProjects: 156,
    successRate: 99,
    description: "Experte en Crédit d'Impôt Recherche et innovation",
    avatar: "SB"
  }
];

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
    title: "Recherche intelligente", 
    description: "Notre algorithme vous propose les experts les plus pertinents selon vos besoins spécifiques", 
    color: "from-blue-500 to-cyan-500" 
  },
  { 
    step: "02", 
    icon: UserCheck, 
    title: "Sélection vérifiée", 
    description: "Tous nos experts sont rigoureusement sélectionnés et validés pour garantir la qualité", 
    color: "from-purple-500 to-pink-500" 
  },
  { 
    step: "03", 
    icon: MessageSquare, 
    title: "Contact direct", 
    description: "Échangez directement avec l'expert de votre choix, sans intermédiaire", 
    color: "from-green-500 to-emerald-500" 
  },
  { 
    step: "04", 
    icon: Handshake, 
    title: "Accompagnement sur-mesure", 
    description: "Bénéficiez d'un suivi personnalisé et d'un accompagnement adapté à vos objectifs", 
    color: "from-orange-500 to-red-500" 
  }
];

// Avantages du marketplace
const marketplaceBenefits = [
  { 
    icon: Zap, 
    title: "Simplicité absolue", 
    description: "Trouvez l'expert parfait en quelques clics. Plus besoin de passer des heures à chercher et comparer.", 
    highlight: "Gain de temps : 80%",
    color: "from-blue-500 to-indigo-600"
  },
  { 
    icon: Shield, 
    title: "Qualité garantie", 
    description: "Tous nos experts sont vérifiés et évalués. Vous avez accès aux meilleurs professionnels du marché.", 
    highlight: "Experts certifiés : 100%",
    color: "from-green-500 to-emerald-600"
  },
  { 
    icon: DollarSign, 
    title: "Tarifs transparents", 
    description: "Pas de surprise ! Les tarifs sont clairement affichés et négociés pour vous garantir les meilleurs prix.", 
    highlight: "Économies : 15-30%",
    color: "from-purple-500 to-pink-600"
  },
  { 
    icon: BarChart3, 
    title: "Suivi en temps réel", 
    description: "Suivez l'avancement de vos projets en temps réel avec notre tableau de bord intuitif.", 
    highlight: "Visibilité : 100%",
    color: "from-cyan-500 to-teal-600"
  }
];

export default function ExpertsVerifies() {
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
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 text-blue-100 px-8 py-4 rounded-full text-sm font-medium mb-8 shadow-2xl hover:scale-105 transition-all duration-300 group">
              <div className="relative">
                <Crown className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="font-semibold">Marketplace d'experts vérifiés</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-300">Certifiés</span>
              </div>
            </div>
            
            {/* Main headline with sophisticated typography */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight text-white mb-6 leading-[0.9] tracking-tight max-w-6xl mx-auto">
                <span className="block font-light opacity-90">
                  Découvrez notre réseau d'
                </span>
                <span className="block font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                  experts vérifiés
                </span>
                <span className="block font-light opacity-90 mt-2">
                  rigoureusement sélectionnés pour
                </span>
                <span className="block font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient delay-500">
                  transformer vos contraintes
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
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-300 font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sophisticated CTA section */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {/* Primary CTA - Découvrir les experts */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-2xl">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 text-center">Découvrir nos experts</h3>
                  <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
                    Explorez notre réseau d'experts vérifiés et trouvez le professionnel idéal pour vos besoins
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 group-hover:scale-105"
                  >
                    <Target className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    Explorer le marketplace
                  </Button>
                </div>
              </div>

              {/* Secondary CTA - Processus de sélection */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-full shadow-2xl">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 text-center">Notre processus</h3>
                  <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
                    Découvrez notre processus de sélection rigoureux en 7 étapes pour garantir la qualité
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold py-4 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 group-hover:scale-105"
                  >
                    <Eye className="w-5 h-5 mr-3" />
                    Voir le processus
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust indicators - simplified */}
            <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Experts certifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span>+200 experts vérifiés</span>
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
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <Search className="w-4 h-4" />
              Comment ça marche ?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              En 4 étapes simples, accédez aux <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">meilleurs experts</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Un processus optimisé pour vous connecter rapidement aux experts les plus qualifiés
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
                  <div className="text-sm font-semibold text-blue-600 mb-2 text-center">{process.step}</div>
                  <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">{process.title}</h3>
                  <p className="text-slate-600 text-center leading-relaxed text-sm">
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
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" />
                L'Ultra-Sélection qui fait la différence
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8">
                Pourquoi nos experts sont <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">exceptionnels</span>
              </h2>
              <div className="space-y-6 text-slate-700">
                <p className="text-lg leading-relaxed">
                  Chez Profitum, nous ne croyons pas au hasard. Chaque expert de notre réseau 
                  a été méticuleusement sélectionné selon des critères d'excellence exigeants 
                  que nous appliquons sans compromis.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Fini les mauvaises surprises</strong> - place aux résultats concrets. 
                  Notre processus de sélection garantit que vous travaillez uniquement avec 
                  des professionnels reconnus, certifiés et expérimentés.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Votre succès est notre réputation</strong>. C'est pourquoi nous 
                  investissons des centaines d'heures chaque mois pour identifier, évaluer 
                  et valider les meilleurs experts de chaque domaine.
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
                  <h3 className="font-semibold text-slate-900 mb-2">Vérification Rigoureuse</h3>
                  <p className="text-sm text-slate-600">7 étapes de validation</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Certifications</h3>
                  <p className="text-sm text-slate-600">Diplômes et accréditations</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Réputation</h3>
                  <p className="text-sm text-slate-600">Avis clients vérifiés</p>
                </div>
                <div className="text-center group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-cyan-500 to-teal-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Performance</h3>
                  <p className="text-sm text-slate-600">Résultats mesurables</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Experts Vedettes - Style moderne */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <Crown className="w-4 h-4" />
              Nos experts vedettes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Découvrez nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">experts vedettes</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Ces experts ont aidé des centaines d'entreprises à optimiser leurs performances
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredExperts.map((expert) => (
              <div key={expert.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:border-blue-300 transition-all duration-300 hover-lift">
                  <div className="text-center mb-6">
                    <div className="relative mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300">
                        {expert.avatar}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{expert.name}</h3>
                    <div className="flex items-center justify-center mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(expert.rating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-slate-600 font-semibold">{expert.rating}</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {expert.location}
                    </div>
                    <div className="flex items-center justify-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {expert.experience}
                    </div>
                  </div>
                  
                  <p className="text-slate-700 mb-4 text-sm leading-relaxed text-center">
                    {expert.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {expert.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{expert.completedProjects}</div>
                      <div className="text-slate-600">Projets</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{expert.successRate}%</div>
                      <div className="text-slate-600">Succès</div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter cet expert
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
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
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Pourquoi choisir notre marketplace ?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Des avantages <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">concrets</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Des avantages concrets qui transforment votre expérience
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
                  <h3 className="text-xl font-semibold text-slate-900 mb-3 text-center">{benefit.title}</h3>
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed text-center">
                    {benefit.description}
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg text-center">
                    <span className="text-sm font-semibold text-blue-700">{benefit.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages - Style moderne */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4" />
              Ce que disent nos clients
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Des milliers d'entreprises nous <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">font confiance</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Découvrez les témoignages de nos clients satisfaits
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200/50 hover:border-blue-300 transition-all duration-300 hover-lift">
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-6 italic text-lg leading-relaxed">
                  "Grâce aux experts vérifiés de Profitum, nous avons économisé 25% sur nos charges 
                  en seulement 3 mois. La qualité du travail est exceptionnelle !"
                </p>
                <div className="font-semibold text-slate-900 text-lg">Marie Dubois</div>
                <div className="text-slate-600">Directrice Financière - TechStart</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200/50 hover:border-blue-300 transition-all duration-300 hover-lift">
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-6 italic text-lg leading-relaxed">
                  "L'expertise et le professionnalisme des experts Profitum ont transformé 
                  notre gestion administrative. Un vrai gain de temps et d'argent !"
                </p>
                <div className="font-semibold text-slate-900 text-lg">Pierre Martin</div>
                <div className="text-slate-600">CEO - InnovationLab</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200/50 hover:border-blue-300 transition-all duration-300 hover-lift">
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-6 italic text-lg leading-relaxed">
                  "Enfin une plateforme qui garantit la qualité ! Les experts Profitum 
                  sont vraiment au top. Je recommande sans hésitation."
                </p>
                <div className="font-semibold text-slate-900 text-lg">Sophie Bernard</div>
                <div className="text-slate-600">Entrepreneure - GreenTech</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Style home page */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à travailler avec les <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">meilleurs experts</span> ?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Rejoignez les milliers d'entreprises qui font déjà confiance à nos experts vérifiés 
            pour optimiser leurs performances et réduire leurs coûts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:-translate-y-1">
              <Calculator className="w-5 h-5 mr-3" />
              Créer mon compte gratuitement
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1">
              <Users className="w-5 h-5 mr-3" />
              Découvrir tous nos experts
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-blue-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Inscription gratuite
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accès immédiat
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Satisfaction garantie
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 