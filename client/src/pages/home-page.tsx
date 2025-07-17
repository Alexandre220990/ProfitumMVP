import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ShieldCheck, 
  Handshake,
  Target, 
  Calculator,
  UserCheck,
  Crown,
  Clock,
  Eye,
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
  <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
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
          <span className="font-semibold">Plateforme #1 d'optimisation financière</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300">Certifiée</span>
          </div>
        </div>

        {/* Main headline with sophisticated typography */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight text-white mb-6 leading-[0.9] tracking-tight max-w-6xl mx-auto">
            <span className="block font-light opacity-90">
              Profitum connecte les entreprises aux
            </span>
            <span className="block font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              meilleurs experts
            </span>
            <span className="block font-light opacity-90 mt-2">
              pour transformer contraintes en
            </span>
            <span className="block font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient delay-500">
              opportunités financières
            </span>
          </h1>
        </div>

        {/* Value propositions with sophisticated icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
          {/* Experts vérifiés */}
          <div className="group flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full shadow-2xl group-hover:shadow-green-500/25 transition-all duration-300">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-1">500+</div>
              <div className="text-sm text-slate-300 font-medium">Experts vérifiés</div>
            </div>
          </div>

          {/* Économies */}
          <div className="group flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-1">+15%</div>
              <div className="text-sm text-slate-300 font-medium">d'économies</div>
            </div>
          </div>

          {/* Résultats immédiats */}
          <div className="group flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-full shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-1">Immédiat</div>
              <div className="text-sm text-slate-300 font-medium">Résultats instantanés</div>
            </div>
          </div>

          {/* Transparence totale */}
          <div className="group flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-teal-600 p-4 rounded-full shadow-2xl group-hover:shadow-cyan-500/25 transition-all duration-300">
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold mb-1">0€</div>
              <div className="text-sm text-slate-300 font-medium">Frais cachés</div>
            </div>
          </div>
        </div>

        {/* Sophisticated CTA section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Primary CTA - Clients */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-2xl">
                    <Calculator className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Entreprises</h3>
              <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
                Découvrez instantanément vos gains potentiels avec notre simulation IA avancée
              </p>
              <Button 
                onClick={() => navigate('/simulateur')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 group-hover:scale-105"
              >
                <Target className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Simuler mes gains
              </Button>
            </div>
          </div>

          {/* Secondary CTA - Experts */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-full shadow-2xl">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 text-center">Experts</h3>
              <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
                Intégrez notre écosystème premium et développez votre activité avec des clients qualifiés
              </p>
              <Button 
                onClick={() => navigate('/welcome-expert')}
                variant="outline"
                className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold py-4 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 group-hover:scale-105"
              >
                <UserCheck className="w-5 h-5 mr-3" />
                Demander une démo
              </Button>
            </div>
          </div>
        </div>

        {/* Trust indicators - simplified */}
        <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Certifié ISO 27001</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
            <span>+1000 entreprises satisfaites</span>
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
);

const ValuePropositionSection = () => (
  <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
    {/* Background decorative elements */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          Pourquoi choisir Profitum ?
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          L'excellence au service de votre <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">performance</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Découvrez les avantages qui font de Profitum la référence en optimisation financière
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ADVANTAGES.map((advantage, index) => (
          <Link key={index} to={advantage.link || "#"}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 hover:border-blue-300 transition-all duration-300 hover-lift">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <advantage.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 text-center">{advantage.title}</h3>
                <p className="text-slate-600 text-center leading-relaxed">{advantage.desc}</p>
                
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
  <section className="w-full max-w-7xl px-4 mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-2xl shadow-lg py-10 mb-12 border border-blue-100">
    <h2 className="text-3xl font-bold text-center mb-2 text-blue-900">
      🚀 Révolutionnez votre gestion avec Profitum !
    </h2>
    <p className="text-center text-lg text-blue-700 mb-8 font-medium">
      L'expertise simplifiée, la transparence garantie et l'efficacité au bout des doigts.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {PROFITUM_HIGHLIGHTS.map((item, idx) => (
        <div key={idx} className="flex items-start gap-4 bg-white rounded-xl p-6 shadow border border-blue-100 hover:shadow-md transition">
          <div className="text-3xl md:text-4xl mt-1 text-blue-500">{item.icon}</div>
          <div>
            <div className="font-bold text-lg mb-1 text-blue-800">{item.title}</div>
            <div className="text-gray-600 text-sm leading-snug">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const ServicesSection = () => (
  <section className="container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-6 text-center">Nos Services</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {SERVICES.map((service) => (
        <div
          key={service.id}
          className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer min-h-[370px] border-2 border-blue-200 hover:border-blue-400"
        >
          <img
            src={service.image}
            alt={service.title}
            className="w-20 h-20 object-cover rounded-full mb-4 border-2 border-blue-100 shadow-sm bg-gray-50"
            loading="lazy"
          />
          <div className="text-xl font-bold mb-2">{service.title}</div>
          <div className="text-gray-600 text-sm leading-snug flex-1 flex items-start justify-center">
            {service.description}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-12 bg-gray-50 rounded-lg">
    <h2 className="text-3xl font-bold text-center mb-8">Ce que disent nos clients</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
      {TESTIMONIALS.map((testimonial, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
          <div className="font-semibold">{testimonial.author}</div>
          <div className="text-sm text-gray-500">{testimonial.position}</div>
        </div>
      ))}
    </div>
  </section>
);

const CallToActionSection = () => (
  <section className="py-12 text-center">
    <h2 className="text-3xl font-bold mb-4">Prêt à optimiser vos finances ?</h2>
    <p className="text-gray-600 mb-8">
      Rejoignez Profitum et commencez à économiser dès aujourd'hui.
    </p>
    <Link to="/create-account-client">
      <Button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-700">
        Créer mon compte gratuitement
      </Button>
    </Link>
  </section>
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
    </div>
  );
}
