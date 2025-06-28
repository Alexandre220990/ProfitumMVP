import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, TrendingUp, ShieldCheck, Users, CheckCircle, Briefcase, DollarSign, 
  Lightbulb, BarChart2, Handshake, FileText, Sparkles, Award, Globe, Search, Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ProcessStepsTest from "@/components/ProcessStepsTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Couleurs officielles françaises (sites gouvernementaux)
const FRENCH_OFFICIAL_COLORS = {
  blue: '#000091',        // Bleu officiel français
  blueLight: '#6A6AF4',   // Bleu clair pour liens
  red: '#E1000F',         // Rouge officiel
  gray: '#3A3A3A',        // Gris neutre pour texte
  grayLight: '#6B6B6B',   // Gris clair
  white: '#FFFFFF',       // Blanc
  background: '#F5F5F5'   // Fond gris très clair
};

const testimonials = [
  { text: "Grâce à Profitum, nous avons économisé 15% sur nos charges annuelles !", author: "Jean Dupont", position: "Directeur Financier" },
  { text: "Une plateforme intuitive et efficace qui nous a fait gagner un temps précieux.", author: "Sophie Martin", position: "Responsable Comptable" },
  { text: "Enfin une solution transparente qui centralise tout en un seul endroit !", author: "Pierre Lambert", position: "CEO StartupTech" },
  { text: "Des experts qualifiés, un suivi impeccable et des économies à la clé.", author: "Isabelle Morel", position: "Entrepreneure" },
];

const keyMetrics = [
  { icon: Users, value: "+500", label: "Clients satisfaits" },
  { icon: Briefcase, value: "+200", label: "Experts partenaires" },
  { icon: DollarSign, value: "15%", label: "d'économies garanties" },
  { icon: Lightbulb, value: "100%", label: "Transparence" }
];

const services = [
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
  },
];

const profitumHighlights = [
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
  },
];

export default function HomePageTest() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: FRENCH_OFFICIAL_COLORS.background }}>
      {/* Navigation avec style officiel français */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Header officiel avec logo République française */}
        <div className="bg-white py-2 px-4 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Logo République française (référence subtile) */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 via-white to-red-600 rounded-sm"></div>
                <span className="text-xs font-medium" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                  République française
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <span className="text-xs" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                Service public
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.blueLight }}>
                <Search className="w-4 h-4" />
              </button>
              <button className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.blueLight }}>
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation principale */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/home" className="flex items-center space-x-3">
                <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-8" />
                <span className="text-lg font-semibold" style={{ color: FRENCH_OFFICIAL_COLORS.blue }}>
                  Profitum
                </span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link to="/Nos-Services" className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                  Nos Services
                </Link>
                <Link to="/experts" className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                  Nos Experts
                </Link>
                <Link to="/tarifs" className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                  Tarifs
                </Link>
                <Link to="/contact" className="text-sm hover:underline" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                  Contact
                </Link>
              </nav>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="flex items-center space-x-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: FRENCH_OFFICIAL_COLORS.blue,
                    color: FRENCH_OFFICIAL_COLORS.white
                  }}
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Connexion</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/connexion-client")}>Client</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/connexion-partner")}>Partenaire</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Header principal avec style officiel */}
      <header className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
              Une plateforme incontournable !
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
              Accédez instantanément aux meilleurs experts français, bénéficiez de tarifs négociés et suivez chaque étape de vos dossiers en toute transparence.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FRENCH_OFFICIAL_COLORS.blue }}></div>
              <span className="text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                Expertise fiscale française reconnue
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FRENCH_OFFICIAL_COLORS.red }}></div>
              <span className="text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                Service public partenaire
              </span>
            </div>
          </div>
          
          <Link to="/create-account-client">
            <Button 
              className="px-8 py-4 text-lg font-medium rounded transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: FRENCH_OFFICIAL_COLORS.red,
                color: FRENCH_OFFICIAL_COLORS.white
              }}
            >
              Inscrivez-vous dès maintenant !
            </Button>
          </Link>
        </div>
      </header>

      {/* Section métriques avec style officiel */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
            Chiffres clés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {keyMetrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                  <metric.icon className="w-8 h-8" style={{ color: FRENCH_OFFICIAL_COLORS.blue }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: FRENCH_OFFICIAL_COLORS.blue }}>
                  {metric.value}
                </div>
                <div className="text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section services avec style officiel */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
            Nos services d'optimisation fiscale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                    <img src={service.image} alt={service.title} className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-lg font-semibold" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ProcessSteps avec design français */}
      <div className="py-16">
        <ProcessStepsTest />
      </div>

      {/* Section témoignages avec style officiel */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
            Témoignages clients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm mb-4 italic" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                    "{testimonial.text}"
                  </p>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                      {testimonial.author}
                    </div>
                    <div className="text-xs" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                      {testimonial.position}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section highlights avec style officiel */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
            Pourquoi choisir Profitum ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profitumHighlights.map((highlight, idx) => (
              <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-3xl mb-4">{highlight.icon}</div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                    {highlight.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                    {highlight.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer avec style officiel */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                Profitum
              </h3>
              <p className="text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                Plateforme d'optimisation fiscale française
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                Services
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                <li><Link to="/Nos-Services" className="hover:underline">TICPE</Link></li>
                <li><Link to="/Nos-Services" className="hover:underline">URSSAF</Link></li>
                <li><Link to="/Nos-Services" className="hover:underline">CIR</Link></li>
                <li><Link to="/Nos-Services" className="hover:underline">DFS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                Entreprise
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                <li><Link to="/contact" className="hover:underline">Contact</Link></li>
                <li><Link to="/tarifs" className="hover:underline">Tarifs</Link></li>
                <li><Link to="/experts" className="hover:underline">Experts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: FRENCH_OFFICIAL_COLORS.gray }}>
                Légal
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
                <li><Link to="/mentions-legales" className="hover:underline">Mentions légales</Link></li>
                <li><Link to="/confidentialite" className="hover:underline">Confidentialité</Link></li>
                <li><Link to="/cgv" className="hover:underline">CGV</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm" style={{ color: FRENCH_OFFICIAL_COLORS.grayLight }}>
              © 2024 Profitum - Service public partenaire
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 