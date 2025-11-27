import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState, useEffect } from "react";
import { getCategoryById } from "@/data/categories";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    if (categoryId) {
      const cat = getCategoryById(categoryId);
      setCategory(cat);
    }
  }, [categoryId]);

  if (!category) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-600">Catégorie non trouvée</p>
        </div>
      </div>
    );
  }

  const faqItems = [
    {
      question: `Quels sont les avantages de ${category.title} ?`,
      answer: category.valueProposition
    },
    {
      question: "Comment fonctionne l'accompagnement ?",
      answer: "Notre équipe d'experts vous accompagne à chaque étape, de l'analyse de votre éligibilité jusqu'à la récupération effective. Nous vous guidons dans la collecte des documents nécessaires et assurons le suivi de votre dossier."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents requis varient selon la solution choisie. Notre plateforme vous guide étape par étape dans la collecte sécurisée de tous les documents nécessaires pour optimiser vos chances de succès."
    },
    {
      question: "Y a-t-il des frais cachés ?",
      answer: "Non, notre transparence est totale. Les frais sont clairement indiqués dès le départ et basés sur un pourcentage de la récupération effectuée. Si aucune récupération n'est obtenue, aucun frais n'est dû."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <PublicHeader />
      
      {/* Hero Section - Premium Design */}
      <section className={`relative py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br ${category.bgGradient} overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(15 23 42) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Gradient orb */}
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${category.gradient} rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl`}></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-700 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide mb-10">
              <div className={`w-1.5 h-1.5 bg-gradient-to-br ${category.gradient} rounded-full`}></div>
              <span className="uppercase tracking-wider">Expertise Spécialisée</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
              <span className="block mb-2">{category.title}</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-12 font-light tracking-wide">
              {category.valueProposition}
            </p>
            
            {/* CTA Button */}
            <Button 
              onClick={() => navigate('/simulateur')}
              className={`bg-slate-900 text-white px-10 py-4 rounded-xl font-medium hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg shadow-lg`}
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section : Notre plus-value - Premium Design */}
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
                <div className={`w-1.5 h-1.5 bg-gradient-to-br ${category.gradient} rounded-full`}></div>
                <span className="uppercase tracking-wider">Notre Plus-Value</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
                <span className="font-normal">Expertise dédiée</span> pour {category.title}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                {category.valueProposition}
              </p>
            </div>
            
            {/* Value Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                { icon: ShieldCheck, title: "Expertise reconnue", desc: "Accompagnement par des experts certifiés" },
                { icon: Calculator, title: "Optimisation maximale", desc: "Maximisation de vos économies potentielles" },
                { icon: TrendingUp, title: "Suivi personnalisé", desc: "Accompagnement jusqu'à la récupération" },
                { icon: FileText, title: "Processus simplifié", desc: "Plateforme digitale intuitive" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group relative bg-white rounded-xl p-8 border border-slate-200/80 hover:border-slate-300 transition-all duration-500 hover:shadow-lg"
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-gradient-to-br ${category.bgGradient} rounded-lg flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-105 transition-transform duration-500`}>
                    <item.icon className={`w-6 h-6 text-slate-700`} />
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

      {/* Section : Produits de la catégorie - Premium Design */}
      <section className={`py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br ${category.bgGradient} relative`}>
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
                <div className={`w-1.5 h-1.5 bg-gradient-to-br ${category.gradient} rounded-full`}></div>
                <span className="uppercase tracking-wider">Nos Solutions</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
                Solutions disponibles dans <span className="font-normal">{category.title}</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                Découvrez les solutions disponibles dans cette catégorie pour optimiser votre situation.
              </p>
            </div>
            
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              {category.products.map((product: any, index: number) => (
                <div 
                  key={index} 
                  className="group relative bg-white rounded-xl p-8 border border-slate-200/80 hover:border-slate-300 transition-all duration-500 hover:shadow-xl"
                >
                  {/* Top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3 tracking-tight">{product.name}</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-light">{product.description}</p>
                  
                  {/* CTA Button */}
                  {product.solutionPath && (
                    <Button
                      onClick={() => navigate(product.solutionPath)}
                      variant="outline"
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-medium"
                    >
                      <span className="flex items-center justify-center gap-2">
                        En savoir plus
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section : FAQ - Premium Design */}
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
              <div className={`w-1.5 h-1.5 bg-gradient-to-br ${category.gradient} rounded-full`}></div>
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

      {/* Section CTA finale - Premium Design */}
      <section className={`py-20 sm:py-24 md:py-28 lg:py-32 bg-gradient-to-br ${category.gradient} relative overflow-hidden`}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255 255 255) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 leading-tight tracking-tight">
            Prêt à optimiser votre <span className="font-normal">situation</span> ?
          </h2>
          
          <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Découvrez en quelques clics si votre entreprise est éligible à nos solutions. Simulation gratuite et sans engagement.
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
