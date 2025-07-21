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
} from "lucide-react";
import ProcessSteps from "@/components/ProcessSteps";
import PublicHeader from '@/components/PublicHeader';

// ============================================================================
// CONSTANTES ET DONNÉES
// ============================================================================

const TESTIMONIALS = [
  { 
    text: "Grâce à Profitum, nous avons économisé 15% sur nos charges annuelles !", 
    author: "Jean Dupont", 
    position: "Directeur Financier" 
  },
  { 
    text: "Une plateforme intuitive et efficace qui nous a fait gagner un temps précieux.", 
    author: "Sophie Martin", 
    position: "Responsable Comptable" 
  },
  { 
    text: "Enfin une solution transparente qui centralise tout en un seul endroit !", 
    author: "Pierre Lambert", 
    position: "CEO StartupTech" 
  },
  { 
    text: "Des experts qualifiés, un suivi impeccable et des économies à la clé.", 
    author: "Isabelle Morel", 
    position: "Entrepreneure" 
  }
];

const SERVICES = [
  { 
    id: "ticpe", 
    title: "TICPE", 
    image: "/images/ticpe-placeholder.png", 
    description: "Récupérez la taxe sur les carburants professionnels grâce à notre accompagnement 100% digitalisé et maximisez vos remboursements sans effort." 
  },
  { 
    id: "urssaf", 
    title: "URSSAF", 
    image: "/images/urssaf-placeholder.png", 
    description: "Sécurisez vos cotisations et détectez les trop-perçus URSSAF avec l'expertise Profitum, pour des économies immédiates et une conformité totale." 
  },
  { 
    id: "social", 
    title: "SOCIAL", 
    image: "/images/social-placeholder.png", 
    description: "Optimisez vos charges sociales et bénéficiez d'un audit complet pour réduire vos coûts tout en respectant la législation." 
  },
  { 
    id: "foncier", 
    title: "FONCIER", 
    image: "/images/foncier-placeholder.png", 
    description: "Profitez d'une analyse experte de vos taxes foncières pour identifier les économies possibles et simplifier vos démarches." 
  },
  { 
    id: "dfs", 
    title: "DFS", 
    image: "/images/dfs-placeholder.png", 
    description: "Bénéficiez d'un accompagnement sur-mesure pour la Déduction Forfaitaire Spécifique et récupérez ce qui vous revient de droit." 
  },
  { 
    id: "cir", 
    title: "CIR", 
    image: "/images/cir-placeholder.png", 
    description: "Valorisez vos innovations avec le Crédit Impôt Recherche, boostez votre trésorerie et sécurisez vos déclarations avec Profitum." 
  },
  { 
    id: "cee", 
    title: "CEE", 
    image: "/images/cee-placeholder.png", 
    description: "Financez vos travaux d'efficacité énergétique grâce aux Certificats d'Économie d'Énergie, sans complexité administrative." 
  },
  { 
    id: "energie", 
    title: "ENERGIE", 
    image: "/images/energie-placeholder.png", 
    description: "Réduisez vos factures d'énergie et accédez à des offres négociées, tout en profitant d'un suivi personnalisé par nos experts." 
  }
];

const PROFITUM_HIGHLIGHTS = [
  { 
    icon: "🌟", 
    title: "L'Ultra-Sélection", 
    desc: "Nous sélectionnons les meilleurs experts pour vous. Fini les mauvaises surprises, place aux résultats concrets." 
  },
  { 
    icon: "⚡", 
    title: "L'Expertise Instantanée", 
    desc: "Accédez aux bons experts en un clic, sans attente. Un réseau qualifié, accessible immédiatement." 
  },
  { 
    icon: "🔍", 
    title: "La Transparence Absolue", 
    desc: "Comparez, sélectionnez et collaborez en toute sérénité, avec une vision claire des coûts et prestations." 
  },
  { 
    icon: "📊", 
    title: "Un Suivi Intelligent", 
    desc: "Documents centralisés, tableau de bord intuitif, alertes stratégiques : tout est automatisé pour vous." 
  },
  { 
    icon: "💸", 
    title: "L'Optimisation Financière", 
    desc: "Ne payez que ce qui est nécessaire. Benchmark des tarifs, négociation efficace, gain de temps et d'argent." 
  },
  { 
    icon: "🚀", 
    title: "Votre Business, Sans Limite", 
    desc: "Prenez de l'avance. Moins de paperasse, plus de décisions stratégiques et rentables." 
  }
];

const ADVANTAGES = [
  { 
    icon: ShieldCheck, 
    title: "Experts vérifiés", 
    desc: "Tous nos experts sont rigoureusement sélectionnés pour garantir un accompagnement de qualité.", 
    link: "/create-account-client" 
  },
  { 
    icon: Handshake, 
    title: "Tarifs négociés", 
    desc: "Bénéficiez des meilleurs prix grâce à nos accords avec nos partenaires." 
  },
  { 
    icon: TrendingUp, 
    title: "Économies garanties", 
    desc: "Nos services permettent en moyenne de réduire vos charges de 15%." 
  }
];

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================



const HeroSection = ({ navigate }: { navigate: (path: string) => void }) => (
  <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
    {/* Premium geometric pattern - Ecosystem 360 */}
    <div className="absolute inset-0 opacity-8">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='hexagons' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 0l30 17.32v34.64L30 69.28 0 51.96V17.32L30 0z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23hexagons)'/%3E%3C/svg%3E")`,
      }}></div>
    </div>

    {/* Subtle gradient overlays */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-transparent to-indigo-600/8"></div>
    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/60 to-transparent"></div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-20">
      {/* Premium badges */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 text-blue-100 px-4 py-2 rounded-full text-sm font-medium shadow-xl">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>Écosystème 360</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/30 text-emerald-100 px-4 py-2 rounded-full text-sm font-medium shadow-xl">
          <ShieldCheck className="w-3 h-3" />
          <span>Plateforme certifiée</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-16">
        {/* Content Section */}
        <div className="flex-1 max-w-3xl">
          {/* Main headline - Ultra premium and compact */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight tracking-tight">
              <span className="block font-light opacity-90">
                Profitum connecte les entreprises aux
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1">
                meilleurs experts
              </span>
              <span className="block font-light opacity-90 mt-2">
                pour transformer contraintes en
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1">
                opportunités financières
              </span>
            </h1>
          </div>

          {/* CTA Section - Ultra premium buttons */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Client CTA */}
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">Client</h3>
              <button 
                onClick={() => navigate('/simulateur')}
                className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative">Accéder au simulateur</span>
              </button>
              <p className="text-sm text-slate-400 mt-3 text-center">
                Calculez vos gains immédiatement
              </p>
            </div>

            {/* Expert CTA */}
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">Expert</h3>
              <button 
                onClick={() => navigate('/welcome-expert')}
                className="group relative w-full bg-white/10 backdrop-blur-sm border border-white/25 hover:border-white/40 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative">Rejoignez notre écosystème</span>
              </button>
              <p className="text-sm text-slate-400 mt-3 text-center">
                Pour booster votre croissance
              </p>
            </div>
          </div>

          {/* Trust indicators - Ultra premium */}
          <div className="flex items-center justify-center gap-8 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>500+ experts vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></div>
              <span>+15% d'économies moyennes</span>
            </div>
          </div>
        </div>

        {/* Right Section - Ultra premium KPI tiles */}
        <div className="hidden lg:flex flex-shrink-0 w-80">
          <div className="w-full space-y-5">
            {/* Ultra premium KPI cards with glassmorphism */}
            <div className="group bg-white/12 backdrop-blur-xl rounded-2xl p-6 border border-white/25 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/15">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-white">€2.5M</div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-300">Économies générées</div>
            </div>
            
            <div className="group bg-white/12 backdrop-blur-xl rounded-2xl p-6 border border-white/25 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/15">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-300">Taux de satisfaction</div>
            </div>
            
            <div className="group bg-white/12 backdrop-blur-xl rounded-2xl p-6 border border-white/25 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/15">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl font-bold text-white">24h</div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-sm text-slate-300">Délai de réponse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ValuePropositionSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-300 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-300/50 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4" />
          Pourquoi choisir Profitum ?
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          L'excellence au service de votre <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">performance</span>
        </h2>
        <p className="text-xl text-slate-700 max-w-3xl mx-auto">
          Découvrez les avantages qui font de Profitum la référence en optimisation financière
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ADVANTAGES.map((advantage, index) => (
          <Link key={index} to={advantage.link || "#"}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-8 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <advantage.icon className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">{advantage.title}</h3>
                <p className="text-slate-700 text-center leading-relaxed">{advantage.desc}</p>
                
                {/* Hover effect indicator */}
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
  <section className="w-full max-w-7xl px-4 mx-auto bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-3xl shadow-2xl py-12 mb-12 border border-blue-700/50 backdrop-blur-sm">
    <h2 className="text-3xl font-bold text-center mb-3 text-white">
      🚀 Révolutionnez votre gestion avec Profitum !
    </h2>
    <p className="text-center text-lg text-blue-100 mb-10 font-medium">
      L'expertise simplifiée, la transparence garantie et l'efficacité au bout des doigts.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {PROFITUM_HIGHLIGHTS.map((item, idx) => (
        <div key={idx} className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">
          <div className="flex items-start gap-4">
            <div className="text-3xl md:text-4xl mt-1 text-blue-300 group-hover:text-blue-200 transition-colors">{item.icon}</div>
            <div>
              <div className="font-bold text-lg mb-2 text-white">{item.title}</div>
              <div className="text-blue-100 text-sm leading-relaxed">{item.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const ServicesSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-25 via-blue-50 to-blue-100 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Services</span>
        </h2>
        <p className="text-xl text-slate-700 max-w-3xl mx-auto">
          Une gamme complète de solutions d'optimisation financière
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SERVICES.map((service, index) => (
          <div
            key={service.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer min-h-[370px] border border-blue-200/50 hover:border-blue-400"
          >
            {/* Accent color based on index */}
            <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${
              index % 4 === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
              index % 4 === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              index % 4 === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}></div>
            
            <img
              src={service.image}
              alt={service.title}
              className="w-20 h-20 object-cover rounded-full mb-4 border-2 border-blue-100 shadow-sm bg-gray-50 group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="text-xl font-bold mb-3 text-slate-900">{service.title}</div>
            <div className="text-slate-700 text-sm leading-relaxed flex-1 flex items-start justify-center">
              {service.description}
            </div>
            
            {/* Hover effect indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={`w-8 h-1 rounded-full ${
                index % 4 === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                index % 4 === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                index % 4 === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-20 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Ce que disent nos <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">clients</span>
        </h2>
        <p className="text-xl text-slate-700 max-w-3xl mx-auto">
          Découvrez les témoignages de nos clients satisfaits
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {TESTIMONIALS.map((testimonial, index) => (
          <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200/50 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">"</span>
              </div>
            </div>
            <p className="text-slate-700 mb-6 leading-relaxed text-center">"{testimonial.text}"</p>
            <div className="text-center">
              <div className="font-semibold text-slate-900">{testimonial.author}</div>
              <div className="text-sm text-slate-600">{testimonial.position}</div>
            </div>
            
            {/* Hover effect indicator */}
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
  <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Prêt à optimiser vos <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">finances</span> ?
      </h2>
      <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
        Rejoignez Profitum et commencez à économiser dès aujourd'hui.
      </p>
      <Link to="/create-account-client">
        <Button className="group relative bg-gradient-to-r from-white to-blue-50 text-blue-900 font-bold px-10 py-4 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative">Créer mon compte gratuitement</span>
        </Button>
      </Link>
    </div>
  </section>
);

const FooterSection = () => (
  <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Company Info */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Profitum</h3>
          </div>
          <p className="text-blue-200 mb-6 max-w-md leading-relaxed">
            La plateforme d'optimisation financière qui connecte les entreprises aux meilleurs experts pour transformer les contraintes en opportunités.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-200">
              <Mail className="w-4 h-4" />
              <span className="text-sm">contact@profitum.app</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+33 1 23 45 67 89</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Liens rapides</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Accueil</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Services</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Experts</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Simulateur</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Services</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">TICPE</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">URSSAF</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">DFS</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">CIR</a></li>
            <li><a href="#" className="text-blue-200 hover:text-white transition-colors">CEE</a></li>
          </ul>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-blue-700/50 pt-8 mb-8">
        <div className="max-w-md mx-auto text-center">
          <h4 className="text-lg font-semibold text-white mb-4">Restez informé</h4>
          <p className="text-blue-200 mb-6">Recevez nos dernières actualités et conseils d'optimisation</p>
          <div className="flex gap-3">
            <input 
              type="email" 
              placeholder="Votre email" 
              className="flex-1 px-4 py-3 bg-white/10 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-400"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300">
              S'abonner
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-blue-700/50 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-blue-200 text-sm">
            © 2024 Profitum. Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
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
  
  // Ajout de logs pour déboguer le rendu
  console.log("Démarrage du rendu de la page d'accueil");
  
  // Hook useEffect pour vérifier si le composant est monté correctement
  useEffect(() => {
    console.log("HomePage monté avec succès");
    
    // Nettoyage
    return () => {
      console.log("HomePage démonté");
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <PublicHeader />
      <HeroSection navigate={navigate} />
      <ValuePropositionSection />
      
      {/* ProcessSteps */}
      <div className="my-12">
        <ProcessSteps />
      </div>
      
      <RevolutionSection />
      
      {/* Séparation visuelle légère */}
      <div className="w-full flex justify-center my-4">
        <div className="h-1 w-32 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 rounded-full opacity-60" />
      </div>
      
      <ServicesSection />
      <TestimonialsSection />
      <CallToActionSection />
      <FooterSection />
    </div>
  );
}
