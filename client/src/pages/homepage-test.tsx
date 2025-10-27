import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ShieldCheck, 
  Clock,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Users,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle,
  Star
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';

// ============================================================================
// DONNÉES STRUCTURÉES SCHEMA.ORG POUR SEO/IA
// ============================================================================

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Profitum",
  "url": "https://profitum.app",
  "logo": "https://profitum.app/logo.png",
  "description": "Plateforme d'optimisation financière qui connecte les entreprises aux meilleurs experts pour transformer les contraintes en opportunités financières",
  "foundingDate": "2020",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "FR",
    "addressLocality": "Paris"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+33-1-23-45-67-89",
    "contactType": "customer service",
    "email": "contact@profitum.app"
  },
  "sameAs": [
    "https://www.linkedin.com/company/profitum",
    "https://twitter.com/profitum_app",
    "https://www.facebook.com/profitum"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services d'optimisation financière",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "TICPE - Récupération taxe carburants",
          "description": "Récupérez la taxe sur les carburants professionnels"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "URSSAF - Audit et optimisation",
          "description": "Sécurisez vos cotisations et détectez les trop-perçus"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "CIR - Crédit Impôt Recherche",
          "description": "Valorisez vos innovations avec le CIR"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  }
};

// ============================================================================
// CONSTANTES ET DONNÉES OPTIMISÉES SEO
// ============================================================================

const KEYWORDS_SEO = [
  "optimisation financière", "expert comptable", "TICPE", "URSSAF", "CIR", "CEE",
  "économie entreprise", "récupération taxes", "audit fiscal", "expertise financière",
  "plateforme experts", "marketplace financière", "optimisation charges", "économie carburant",
  "crédit impôt recherche", "certificats économie énergie", "déduction forfaitaire spécifique"
];

const TESTIMONIALS_SEO = [
  { 
    text: "Grâce à Profitum, nous avons économisé 15% sur nos charges annuelles et récupéré 45 000€ de TICPE !", 
    author: "Jean Dupont", 
    position: "Directeur Financier - Groupe Transport Plus",
    company: "Transport Plus",
    rating: 5,
    savings: "45 000€",
    service: "TICPE"
  },
  { 
    text: "Une plateforme intuitive qui nous a fait gagner un temps précieux. Notre audit URSSAF a révélé 23 000€ de trop-perçus.", 
    author: "Sophie Martin", 
    position: "Responsable Comptable - TechStart SAS",
    company: "TechStart SAS",
    rating: 5,
    savings: "23 000€",
    service: "URSSAF"
  },
  { 
    text: "Enfin une solution transparente qui centralise tout ! Notre CIR nous rapporte 180 000€ par an grâce à Profitum.", 
    author: "Pierre Lambert", 
    position: "CEO - InnovationLab",
    company: "InnovationLab",
    rating: 5,
    savings: "180 000€",
    service: "CIR"
  },
  { 
    text: "Des experts qualifiés, un suivi impeccable. Nous avons optimisé nos charges sociales de 12% en 6 mois.", 
    author: "Isabelle Morel", 
    position: "Entrepreneure - GreenTech Solutions",
    company: "GreenTech Solutions",
    rating: 5,
    savings: "12%",
    service: "Optimisation sociale"
  }
];

const SERVICES_SEO = [
  { 
    id: "ticpe", 
    title: "TICPE - Récupération Taxe Carburants", 
    image: "/images/ticpe-placeholder.png", 
    description: "Récupérez la taxe sur les carburants professionnels grâce à notre accompagnement 100% digitalisé. Économies moyennes : 15 000€ à 50 000€ par an.",
    benefits: ["Récupération automatique", "Suivi en temps réel", "Expertise spécialisée"],
    keywords: ["TICPE", "taxe carburants", "récupération fiscale", "transport professionnel"]
  },
  { 
    id: "urssaf", 
    title: "URSSAF - Audit et Optimisation", 
    image: "/images/urssaf-placeholder.png", 
    description: "Sécurisez vos cotisations et détectez les trop-perçus URSSAF avec l'expertise Profitum. Économies moyennes : 5 000€ à 25 000€ par audit.",
    benefits: ["Audit complet", "Détection erreurs", "Conformité garantie"],
    keywords: ["URSSAF", "cotisations sociales", "audit social", "trop-perçus"]
  },
  { 
    id: "cir", 
    title: "CIR - Crédit Impôt Recherche", 
    image: "/images/cir-placeholder.png", 
    description: "Valorisez vos innovations avec le Crédit Impôt Recherche. Boostez votre trésorerie et sécurisez vos déclarations. Économies moyennes : 50 000€ à 200 000€ par an.",
    benefits: ["Valorisation R&D", "Sécurisation déclarations", "Accompagnement expert"],
    keywords: ["CIR", "crédit impôt recherche", "innovation", "R&D", "fiscalité"]
  },
  { 
    id: "cee", 
    title: "CEE - Certificats Économie Énergie", 
    image: "/images/cee-placeholder.png", 
    description: "Financez vos travaux d'efficacité énergétique grâce aux Certificats d'Économie d'Énergie. Économies moyennes : 20% à 40% sur vos travaux.",
    benefits: ["Financement travaux", "Économies d'énergie", "Transition écologique"],
    keywords: ["CEE", "efficacité énergétique", "travaux", "économie d'énergie"]
  }
];

const STATISTICS_SEO = [
  { value: "€2.5M", label: "Économies générées", icon: TrendingUp, color: "blue" },
  { value: "98%", label: "Taux de satisfaction", icon: Star, color: "green" },
  { value: "24h", label: "Délai de réponse", icon: Clock, color: "purple" },
  { value: "500+", label: "Experts vérifiés", icon: Users, color: "orange" },
  { value: "15%", label: "Économies moyennes", icon: BarChart3, color: "teal" },
  { value: "1000+", label: "Entreprises accompagnées", icon: Building2, color: "indigo" }
];

// ============================================================================
// COMPOSANTS OPTIMISÉS SEO/IA
// ============================================================================

const HeroSection = ({ navigate }: { navigate: (path: string) => void }) => (
  <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
    {/* Schema.org structured data injection */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    
    {/* Premium geometric pattern */}
    <div className="absolute inset-0 opacity-8">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='hexagons' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 0l30 17.32v34.64L30 69.28 0 51.96V17.32L30 0z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23hexagons)'/%3E%3C/svg%3E")`,
      }}></div>
    </div>

    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/8 via-transparent to-indigo-600/8"></div>
    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/60 to-transparent"></div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-20">
      {/* SEO-optimized badges */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 text-blue-100 px-4 py-2 rounded-full text-sm font-medium shadow-xl">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>Écosystème 360° - Optimisation Financière</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/30 text-emerald-100 px-4 py-2 rounded-full text-sm font-medium shadow-xl">
          <ShieldCheck className="w-3 h-3" />
          <span>Plateforme certifiée - Experts vérifiés</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-16">
        {/* Content Section - SEO optimized */}
        <div className="flex-1 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight tracking-tight">
              <span className="block font-light opacity-90">
                Profitum connecte les entreprises aux
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1">
                meilleurs experts financiers
              </span>
              <span className="block font-light opacity-90 mt-2">
                pour transformer contraintes fiscales en
              </span>
              <span className="block font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1">
                opportunités d'économies
              </span>
            </h1>
            
            {/* SEO-optimized subtitle */}
            <p className="text-lg text-slate-300 mt-6 leading-relaxed">
              Plateforme d'optimisation financière spécialisée en TICPE, URSSAF, CIR, CEE et audit fiscal. 
              Économies moyennes de 15% sur vos charges avec nos 500+ experts certifiés.
            </p>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">Entreprise</h3>
              <button 
                onClick={() => navigate('/simulateur')}
                className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative">Calculer mes économies</span>
              </button>
              <p className="text-sm text-slate-400 mt-3 text-center">
                Simulateur gratuit - Résultats en 2 minutes
              </p>
            </div>

            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">Expert</h3>
              <button 
                onClick={() => navigate('/welcome-expert')}
                className="group relative w-full bg-white/10 backdrop-blur-sm border border-white/25 hover:border-white/40 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative">Rejoindre la marketplace</span>
              </button>
              <p className="text-sm text-slate-400 mt-3 text-center">
                Développez votre activité avec Profitum
              </p>
            </div>
          </div>

          {/* Trust indicators - SEO optimized */}
          <div className="flex items-center justify-center gap-8 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>500+ experts vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300"></div>
              <span>+15% d'économies moyennes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-600"></div>
              <span>98% de satisfaction</span>
            </div>
          </div>
        </div>

        {/* Right Section - Statistics */}
        <div className="hidden lg:flex flex-shrink-0 w-80">
          <div className="w-full space-y-5">
            {STATISTICS_SEO.slice(0, 3).map((stat, index) => (
              <div key={index} className="group bg-white/12 backdrop-blur-xl rounded-2xl p-6 border border-white/25 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/15">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className={`w-10 h-10 bg-gradient-to-r from-${stat.color}-500 to-${stat.color === 'blue' ? 'indigo' : stat.color === 'green' ? 'emerald' : stat.color === 'purple' ? 'pink' : stat.color === 'orange' ? 'amber' : stat.color === 'teal' ? 'cyan' : 'indigo'}-500 rounded-xl flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ServicesSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Services d'<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Optimisation Financière</span>
        </h2>
        <p className="text-xl text-slate-700 max-w-3xl mx-auto">
          Une gamme complète de solutions d'optimisation fiscale et financière pour maximiser vos économies
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SERVICES_SEO.map((service, index) => (
          <div
            key={service.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer min-h-[420px] border border-blue-200/50 hover:border-blue-400"
          >
            <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${
              index % 4 === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
              index % 4 === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              index % 4 === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}></div>
            
            <img
              src={service.image}
              alt={`Service ${service.title} - Optimisation financière`}
              className="w-20 h-20 object-cover rounded-full mb-4 border-2 border-blue-100 shadow-sm bg-gray-50 group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="text-xl font-bold mb-3 text-slate-900">{service.title}</div>
            <div className="text-slate-700 text-sm leading-relaxed flex-1 flex items-start justify-center mb-4">
              {service.description}
            </div>
            
            {/* Benefits list */}
            <div className="w-full space-y-2">
              {service.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-20 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Témoignages <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Clients</span>
        </h2>
        <p className="text-xl text-slate-700 max-w-3xl mx-auto">
          Découvrez les résultats concrets obtenus par nos clients avec nos services d'optimisation financière
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {TESTIMONIALS_SEO.map((testimonial, index) => (
          <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200/50 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">"</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-slate-700 mb-6 leading-relaxed text-center">"{testimonial.text}"</p>
            
            {/* Savings highlight */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{testimonial.savings}</div>
                <div className="text-sm text-green-600">économies réalisées</div>
                <div className="text-xs text-green-500 mt-1">{testimonial.service}</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-semibold text-slate-900">{testimonial.author}</div>
              <div className="text-sm text-slate-600">{testimonial.position}</div>
              <div className="text-xs text-slate-500">{testimonial.company}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CallToActionSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
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
        Calcul gratuit et sans engagement.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/simulateur">
          <Button className="group relative bg-gradient-to-r from-white to-blue-50 text-blue-900 font-bold px-10 py-4 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Calculer mes économies
            </span>
          </Button>
        </Link>
        <Link to="/create-account-client">
          <Button className="group relative bg-white/10 backdrop-blur-sm border border-white/25 text-white font-bold px-10 py-4 rounded-xl hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative flex items-center gap-2">
              <Users className="w-5 h-5" />
              Créer mon compte
            </span>
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const FooterSection = () => (
  <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Profitum</h3>
          </div>
          <p className="text-blue-200 mb-6 max-w-md leading-relaxed">
            Plateforme d'optimisation financière leader en France. 
            Spécialisée en TICPE, URSSAF, CIR, CEE et audit fiscal. 
            Plus de 1000 entreprises nous font confiance.
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

        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Services</h4>
          <ul className="space-y-3">
            <li><a href="/produits/ticpe" className="text-blue-200 hover:text-white transition-colors">TICPE - Taxe Carburants</a></li>
            <li><a href="/produits/urssaf" className="text-blue-200 hover:text-white transition-colors">URSSAF - Audit Social</a></li>
            <li><a href="/produits/cir" className="text-blue-200 hover:text-white transition-colors">CIR - Crédit Impôt Recherche</a></li>
            <li><a href="/produits/cee" className="text-blue-200 hover:text-white transition-colors">CEE - Économies d'Énergie</a></li>
            <li><a href="/produits/dfs" className="text-blue-200 hover:text-white transition-colors">DFS - Déduction Forfaitaire</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Ressources</h4>
          <ul className="space-y-3">
            <li><a href="/simulateur" className="text-blue-200 hover:text-white transition-colors">Simulateur gratuit</a></li>
            <li><a href="/experts" className="text-blue-200 hover:text-white transition-colors">Nos experts</a></li>
            <li><a href="/blog" className="text-blue-200 hover:text-white transition-colors">Blog conseils</a></li>
            <li><a href="/a-propos" className="text-blue-200 hover:text-white transition-colors">À Propos</a></li>
            <li><a href="/mentions-legales" className="text-blue-200 hover:text-white transition-colors">Mentions légales</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-blue-700/50 pt-8 mb-8">
        <div className="max-w-md mx-auto text-center">
          <h4 className="text-lg font-semibold text-white mb-4">Restez informé</h4>
          <p className="text-blue-200 mb-6">Recevez nos conseils d'optimisation financière</p>
          <div className="flex gap-3">
            <input 
              type="email" 
              placeholder="Votre email professionnel" 
              className="flex-1 px-4 py-3 bg-white/10 border border-blue-600/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-blue-400"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300">
              S'abonner
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-700/50 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-blue-200 text-sm">
            © 2024 Profitum. Tous droits réservés. | Optimisation financière et fiscale
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/20 transition-all duration-300">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// ============================================================================
// COMPOSANT PRINCIPAL AVEC OPTIMISATIONS SEO/IA
// ============================================================================

export default function HomepageTest() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // SEO optimizations
    document.title = "Profitum - Plateforme d'Optimisation Financière | TICPE, URSSAF, CIR, CEE";
    document.querySelector('meta[name="description"]')?.setAttribute('content', 
      "Profitum connecte les entreprises aux meilleurs experts pour l'optimisation financière. TICPE, URSSAF, CIR, CEE. Économies moyennes de 15%. 500+ experts vérifiés."
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute('content', 
      KEYWORDS_SEO.join(', ')
    );
    
    // Structured data injection
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <HeroSection navigate={navigate} />
      <ServicesSection />
      <TestimonialsSection />
      <CallToActionSection />
      <FooterSection />
    </div>
  );
} 