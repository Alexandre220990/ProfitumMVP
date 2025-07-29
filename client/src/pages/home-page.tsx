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
  CheckCircle,
  Star,
  Users,
  Zap
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
    image: "/images/ticpe-placeholder.png", 
    description: "Récupérez la taxe sur les carburants professionnels avec notre accompagnement digitalisé.",
    color: "blue"
  },
  { 
    id: "urssaf", 
    title: "URSSAF", 
    image: "/images/urssaf-placeholder.png", 
    description: "Sécurisez vos cotisations et détectez les trop-perçus pour des économies immédiates.",
    color: "green"
  },
  { 
    id: "social", 
    title: "SOCIAL", 
    image: "/images/social-placeholder.png", 
    description: "Optimisez vos charges sociales avec un audit complet pour réduire vos coûts.",
    color: "purple"
  },
  { 
    id: "foncier", 
    title: "FONCIER", 
    image: "/images/foncier-placeholder.png", 
    description: "Analyse experte de vos taxes foncières pour identifier les économies possibles.",
    color: "orange"
  },
  { 
    id: "dfs", 
    title: "DFS", 
    image: "/images/dfs-placeholder.png", 
    description: "Accompagnement sur-mesure pour la Déduction Forfaitaire Spécifique.",
    color: "indigo"
  },
  { 
    id: "cir", 
    title: "CIR", 
    image: "/images/cir-placeholder.png", 
    description: "Valorisez vos innovations avec le Crédit Impôt Recherche et boostez votre trésorerie.",
    color: "emerald"
  },
  { 
    id: "cee", 
    title: "CEE", 
    image: "/images/cee-placeholder.png", 
    description: "Financez vos travaux d'efficacité énergétique avec les Certificats d'Économie d'Énergie.",
    color: "teal"
  },
  { 
    id: "energie", 
    title: "ENERGIE", 
    image: "/images/energie-placeholder.png", 
    description: "Réduisez vos factures d'énergie avec des offres négociées et un suivi personnalisé.",
    color: "cyan"
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
    desc: "Tous nos experts sont rigoureusement sélectionnés et certifiés pour garantir un accompagnement de qualité.", 
    link: "/create-account-client" 
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
  <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
      {/* Badges de confiance */}
      <div className="flex justify-center gap-4 mb-12">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Plateforme certifiée</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
          <ShieldCheck className="w-3 h-3" />
          <span>Experts vérifiés</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-16">
        {/* Section Contenu */}
        <div className="flex-1 max-w-3xl">
          {/* Titre principal */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-8 leading-tight">
              <span className="block font-light text-slate-700">
                Profitum connecte les entreprises aux
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                meilleurs experts
              </span>
              <span className="block font-light text-slate-700 mt-4">
                pour transformer contraintes en
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                opportunités financières
              </span>
            </h1>
            <p className="text-xl text-slate-600 mt-8 leading-relaxed">
              Optimisez vos finances, réduisez vos charges et accélérez votre croissance grâce à notre écosystème d'experts qualifiés.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* CTA Client */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Pour les entreprises</h3>
              <button 
                onClick={() => navigate('/simulateur')}
                className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-center gap-2">
                  Accéder au simulateur
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <p className="text-sm text-slate-500 mt-3 text-center">
                Calculez vos gains en 2 minutes
              </p>
            </div>

            {/* CTA Expert */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Pour les experts</h3>
              <button 
                onClick={() => navigate('/welcome-expert')}
                className="group relative w-full bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-semibold py-4 px-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-center gap-2">
                  Rejoindre l'écosystème
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <p className="text-sm text-slate-500 mt-3 text-center">
                Développez votre activité
              </p>
            </div>
          </div>

          {/* Indicateurs de confiance */}
          <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>500+ experts vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>+15% d'économies moyennes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>98% de satisfaction</span>
            </div>
          </div>
        </div>

        {/* Section KPI */}
        <div className="hidden lg:flex flex-shrink-0 w-80">
          <div className="w-full space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-slate-900">€2.5M</div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-600">Économies générées</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-slate-900">98%</div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-600">Taux de satisfaction</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-slate-900">24h</div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-600">Délai de réponse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValuePropositionSection = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-8">
          <ShieldCheck className="w-4 h-4" />
          Pourquoi choisir Profitum ?
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
          L'excellence au service de votre <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">performance</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Découvrez les avantages qui font de Profitum la référence en optimisation financière pour les entreprises
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {ADVANTAGES.map((advantage, index) => (
          <Link key={index} to={advantage.link || "#"}>
            <div className="group relative">
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
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const RevolutionSection = () => (
  <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
          Révolutionnez votre gestion avec <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Profitum</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          L'expertise simplifiée, la transparence garantie et l'efficacité au service de votre croissance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

const ServicesSection = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
          Nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Services</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Une gamme complète de solutions d'optimisation financière adaptées à vos besoins
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SERVICES.map((service, index) => (
          <div
            key={service.id}
            className="group relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl cursor-pointer min-h-[320px] border border-slate-200 hover:border-blue-300"
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-16 h-16 object-cover rounded-2xl mb-6 border-2 border-slate-100 shadow-sm bg-white group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <h3 className="text-xl font-bold mb-4 text-slate-900">{service.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed flex-1">
              {service.description}
            </p>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
          Ce que disent nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">clients</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Découvrez les témoignages de nos clients satisfaits qui ont transformé leurs finances
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
  <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
        Prêt à optimiser vos <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">finances</span> ?
      </h2>
      <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
        Rejoignez Profitum et commencez à économiser dès aujourd'hui avec nos experts qualifiés.
      </p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <Link to="/create-account-client">
          <Button className="group bg-white text-blue-700 font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <span className="flex items-center gap-2">
              Créer mon compte gratuitement
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </Link>
        <Link to="/simulateur">
          <Button className="group bg-transparent border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
            <span className="flex items-center gap-2">
              Tester le simulateur
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
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* Informations entreprise */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Profitum</h3>
          </div>
          <p className="text-slate-300 mb-8 max-w-md leading-relaxed">
            La plateforme d'optimisation financière qui connecte les entreprises aux meilleurs experts pour transformer les contraintes en opportunités.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4" />
              <span className="text-sm">contact@profitum.app</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+33 1 23 45 67 89</span>
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

      {/* Newsletter */}
      <div className="border-t border-slate-700 pt-8 mb-8">
        <div className="max-w-md mx-auto text-center">
          <h4 className="text-lg font-semibold text-white mb-4">Restez informé</h4>
          <p className="text-slate-300 mb-6">Recevez nos dernières actualités et conseils d'optimisation</p>
          <div className="flex gap-3">
            <input 
              type="email" 
              placeholder="Votre email" 
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300">
              S'abonner
            </button>
          </div>
        </div>
      </div>

      {/* Footer inférieur */}
      <div className="border-t border-slate-700 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-300 text-sm">
            © 2024 Profitum. Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
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
    <div className="min-h-screen">
      <PublicHeader />
      <HeroSection navigate={navigate} />
      <ValuePropositionSection />
      
      {/* ProcessSteps */}
      <div className="py-24 bg-white">
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
