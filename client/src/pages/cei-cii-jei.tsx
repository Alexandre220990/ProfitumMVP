import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown,
  Sparkles
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState } from "react";

export default function CEICIJEIPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quelle est la différence entre CEI, CII et JEI ?",
      answer: "Le CEI (Crédit d'Impôt Innovation) et le CII (Crédit d'Impôt Innovation) sont des dispositifs fiscaux similaires permettant de réduire l'impôt sur les sociétés. La JEI (Jeune Entreprise Innovante) est un statut fiscal qui offre des exonérations et réductions d'impôts pour les entreprises innovantes de moins de 8 ans. Ces dispositifs peuvent être cumulables sous certaines conditions."
    },
    {
      question: "Quelles entreprises sont éligibles au statut JEI ?",
      answer: "Pour bénéficier du statut JEI, l'entreprise doit être créée depuis moins de 8 ans, être indépendante, réaliser des dépenses de R&D représentant au moins 15% des charges, et être innovante (brevets, certificats d'obtention végétale, ou logiciels éligibles au CIR)."
    },
    {
      question: "Comment calculer le crédit d'impôt innovation (CEI/CII) ?",
      answer: "Le CEI/CII est calculé sur la base des dépenses d'innovation éligibles. Le taux varie selon la taille de l'entreprise et peut atteindre jusqu'à 20% des dépenses éligibles. Notre expertise vous permet d'optimiser ce calcul pour maximiser votre crédit d'impôt."
    },
    {
      question: "Peut-on cumuler CEI/CII avec le statut JEI ?",
      answer: "Oui, sous certaines conditions, il est possible de cumuler ces dispositifs. Le statut JEI offre des exonérations d'impôts sur les bénéfices, tandis que le CEI/CII permet de réduire l'impôt dû. Notre équipe d'experts vous accompagne pour optimiser le cumul de ces dispositifs."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents requis incluent les justificatifs des dépenses d'innovation, les descriptions des projets innovants, les déclarations fiscales, les preuves d'innovation (brevets, certificats), et tout document prouvant l'éligibilité aux dispositifs. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "Quels sont les avantages financiers de ces dispositifs ?",
      answer: "Ces dispositifs permettent de réduire significativement vos impôts, d'améliorer votre trésorerie, et de financer vos projets d'innovation. Le statut JEI offre notamment une exonération totale d'impôt sur les bénéfices pendant les premières années, puis une réduction progressive."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const dispositifs = [
    {
      acronym: "CEI",
      name: "Crédit d'Impôt Innovation",
      description: "Dispositif fiscal permettant de réduire l'impôt sur les sociétés pour les entreprises réalisant des dépenses d'innovation.",
      avantages: [
        "Réduction de l'impôt sur les sociétés",
        "Crédit d'impôt sur les dépenses d'innovation",
        "Amélioration de la trésorerie"
      ],
      icon: Lightbulb,
      color: "from-indigo-500 to-purple-500"
    },
    {
      acronym: "CII",
      name: "Crédit d'Impôt Innovation",
      description: "Dispositif fiscal similaire au CEI, permettant de valoriser les dépenses d'innovation et de réduire l'impôt dû.",
      avantages: [
        "Valorisation des dépenses d'innovation",
        "Réduction de l'impôt sur les sociétés",
        "Optimisation fiscale"
      ],
      icon: Sparkles,
      color: "from-purple-500 to-pink-500"
    },
    {
      acronym: "JEI",
      name: "Jeune Entreprise Innovante",
      description: "Statut fiscal avantageux pour les entreprises innovantes de moins de 8 ans, offrant des exonérations et réductions d'impôts.",
      avantages: [
        "Exonération totale d'impôt sur les bénéfices (premières années)",
        "Réduction progressive d'impôt",
        "Exonération de cotisations sociales sur les salaires de R&D"
      ],
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <PublicHeader />
      
      {/* Hero Section - Premium Design */}
      <section className="relative py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Gradient orb */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-10">
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full"></div>
              <span className="uppercase tracking-wider">Expertise Spécialisée</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
              <span className="block mb-2">CEI, CII & JEI</span>
              <span className="font-normal text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Optimisation fiscale pour l'innovation</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12 font-light tracking-wide">
              Valorisez vos projets d'innovation avec les dispositifs fiscaux CEI, CII et JEI. Expertise dédiée pour optimiser votre fiscalité et financer votre croissance.
            </p>
            
            {/* CTA Button */}
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-slate-900 text-white px-10 py-4 rounded-xl font-medium hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg shadow-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section : Les trois dispositifs */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.01]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-8">
                <div className="w-1.5 h-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="uppercase tracking-wider">Nos Dispositifs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
                <span className="font-normal">Trois dispositifs</span> pour votre innovation
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                Découvrez les dispositifs fiscaux dédiés aux entreprises innovantes et optimisez votre fiscalité.
              </p>
            </div>
            
            {/* Dispositifs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {dispositifs.map((dispositif, index) => (
                <div 
                  key={index}
                  className="group relative bg-white rounded-xl p-8 border border-slate-200/80 hover:border-slate-300 transition-all duration-500 hover:shadow-lg"
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${dispositif.color} rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform duration-500`}>
                    <dispositif.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Acronym */}
                  <div className="mb-4">
                    <span className={`text-2xl font-bold bg-gradient-to-r ${dispositif.color} bg-clip-text text-transparent`}>
                      {dispositif.acronym}
                    </span>
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 tracking-tight">{dispositif.name}</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-light">{dispositif.description}</p>
                  
                  {/* Avantages */}
                  <div className="space-y-2">
                    {dispositif.avantages.map((avantage, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 bg-gradient-to-br ${dispositif.color} rounded-full mt-1.5 flex-shrink-0`}></div>
                        <span className="text-xs text-slate-600 font-light">{avantage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section : Notre plus-value */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-8">
                <div className="w-1.5 h-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="uppercase tracking-wider">Notre Plus-Value</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
                <span className="font-normal">Expertise dédiée</span> pour votre innovation
              </h2>
            </div>
            
            {/* Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                { icon: ShieldCheck, title: "Expertise reconnue", desc: "Accompagnement par des experts certifiés en fiscalité de l'innovation" },
                { icon: Calculator, title: "Optimisation maximale", desc: "Maximisation de vos crédits d'impôt et exonérations" },
                { icon: TrendingUp, title: "Suivi personnalisé", desc: "Accompagnement jusqu'à l'obtention effective des avantages" },
                { icon: FileText, title: "Processus simplifié", desc: "Plateforme digitale intuitive pour gérer vos dossiers" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group relative bg-white rounded-xl p-8 border border-slate-200/80 hover:border-slate-300 transition-all duration-500 hover:shadow-lg"
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                    <item.icon className="w-6 h-6 text-slate-700" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section : FAQ */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-white relative">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.01]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-8">
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full"></div>
              <span className="uppercase tracking-wider">Questions Fréquentes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
              <span className="font-normal">Réponses</span> à vos questions
            </h2>
          </div>
          
          {/* FAQ Items */}
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4 text-base tracking-tight">{item.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    <p className="text-slate-600 leading-relaxed pt-4 font-light">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA finale */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255 255 255) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 leading-tight tracking-tight">
            Prêt à optimiser votre <span className="font-normal">fiscalité</span> ?
          </h2>
          
          <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Découvrez en quelques clics si votre entreprise est éligible aux dispositifs CEI, CII et JEI. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-slate-900 px-10 py-4 rounded-xl font-medium hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg shadow-lg"
          >
            <span className="flex items-center gap-2">
              Simulez votre éligibilité
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}

