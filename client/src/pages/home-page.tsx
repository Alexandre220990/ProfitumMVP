import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, TrendingUp, ShieldCheck, Users, CheckCircle, Briefcase, DollarSign, 
  Lightbulb, BarChart2, Handshake, FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ProcessSteps from "@/components/ProcessSteps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      {/* Navigation */}
      <div className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/home">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>
          <div className="flex space-x-6">
            <Link to="/Nos-Services">Nos Services</Link>
            <Link to="/experts">Nos Experts</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-white text-blue-600 flex items-center">
              <UserCircle className="mr-2" /> Connexion
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/connexion-client")}>Client</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/connexion-partner")}>Partenaire</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header principal */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold">Une plateforme incontournable !</h1>
        <p className="mt-4 text-lg">Accédez instantanément aux meilleurs experts, bénéficiez de tarifs négociés et suivez chaque étape de vos dossiers en toute transparence.</p>
        <Link to="/create-account-client">
          <Button className="mt-7 bg-yellow-400 text-black font-bold px-10 py-6 rounded-lg hover:bg-yellow-500">Inscrivez-vous dès maintenant !</Button>
        </Link>
      </header>

      {/* Key Metrics */}
      <section className="py-10 text-center grid grid-cols-2 md:grid-cols-4 gap-8">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="flex flex-col items-center">
            <metric.icon className="text-blue-600 w-12 h-12 mb-2" />
            <span className="text-3xl font-bold">{metric.value}</span>
            <span className="text-gray-600">{metric.label}</span>
          </div>
        ))}
      </section>

      {/* Section Valeur Ajoutée */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-8">Pourquoi choisir Profitum ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[{ icon: ShieldCheck, title: "Experts vérifiés", desc: "Tous nos experts sont rigoureusement sélectionnés pour garantir un accompagnement de qualité.", link: "/create-account-client" },
            { icon: Handshake, title: "Tarifs négociés", desc: "Bénéficiez des meilleurs prix grâce à nos accords avec nos partenaires." },
            { icon: TrendingUp, title: "Économies garanties", desc: "Nos services permettent en moyenne de réduire vos charges de 15%." },
          ].map((advantage, index) => (
            <Link key={index} to={advantage.link || "#"}>
              <div className="p-6 border-2 border-blue-600 shadow-md rounded-lg flex flex-col items-center hover:shadow-xl hover:-translate-y-1 bg-white cursor-pointer">
                <advantage.icon className="text-blue-600 w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">{advantage.title}</h3>
                <p className="text-gray-600">{advantage.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- ProcessSteps --- */}
      <div className="my-12">
        <ProcessSteps />
      </div>

      {/* Section Révolutionnez votre gestion avec Profitum */}
      <section className="w-full max-w-7xl px-4 mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-2xl shadow-lg py-10 mb-12 border border-blue-100">
        <h2 className="text-3xl font-bold text-center mb-2 text-blue-900">🚀 Révolutionnez votre gestion avec Profitum !</h2>
        <p className="text-center text-lg text-blue-700 mb-8 font-medium">L'expertise simplifiée, la transparence garantie et l'efficacité au bout des doigts.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profitumHighlights.map((item, idx) => (
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

      {/* Séparation visuelle légère */}
      <div className="w-full flex justify-center my-4">
        <div className="h-1 w-32 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 rounded-full opacity-60" />
      </div>

      {/* --- Nouvelle Section Services --- */}
      <section className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Nos Services</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
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

      {/* --- Section Témoignages --- */}
      <section className="py-12 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Ce que disent nos clients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
              <div className="font-semibold">{testimonial.author}</div>
              <div className="text-sm text-gray-500">{testimonial.position}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à optimiser vos finances ?</h2>
        <p className="text-gray-600 mb-8">Rejoignez Profitum et commencez à économiser dès aujourd'hui.</p>
        <Link to="/create-account-client">
          <Button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-blue-700">
            Créer mon compte gratuitement
          </Button>
        </Link>
      </section>
    </div>
  );
}
