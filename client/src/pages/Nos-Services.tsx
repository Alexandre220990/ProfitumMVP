import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserCircle, Leaf, Tractor, Lightbulb, ShieldCheck, Briefcase, Users, Landmark, PiggyBank, Gavel, Clock, BarChart, Layers, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const services = [{ name: "Audit Énergétique", description: "Optimisez votre consommation d'énergie et réduisez vos coûts.", icon: Leaf },
  { name: "Audit Social", description: "Analysez et améliorez la gestion sociale de votre entreprise.", icon: Users },
  { name: "Audit Foncier", description: "Optimisez la gestion de votre patrimoine immobilier.", icon: Landmark },
  { name: "Audit MSA", description: "Expertise spécifique pour les entreprises du secteur agricole.", icon: Tractor },
  { name: "Audit DFS", description: "Diagnostic et conseil pour une meilleure performance financière.", icon: Briefcase },
  { name: "Audit Patrimoine", description: "Valorisez et sécurisez votre patrimoine financier.", icon: PiggyBank },
  { name: "Avocats et Juristes", description: "Accédez à des experts en droit pour vous accompagner.", icon: Gavel }];

const advantages = [{ icon: Lightbulb, title: "L'Ultra-Sélection", description: "Nous sélectionnons les meilleurs experts pour vous. Fini les mauvaises surprises, place aux résultats concrets." },
  { icon: Clock, title: "L'Expertise Instantanée", description: "Accédez aux bons experts en un clic, sans attente. Un réseau qualifié, accessible immédiatement." },
  { icon: ShieldCheck, title: "La Transparence Absolue", description: "Comparez, sélectionnez et collaborez en toute sérénité, avec une vision claire des coûts et prestations." },
  { icon: Layers, title: "Un Suivi Intelligent", description: "Documents centralisés, tableau de bord intuitif, alertes stratégiques : tout est automatisé pour vous." },
  { icon: BarChart, title: "L'Optimisation Financière", description: "Ne payez que ce qui est nécessaire. Benchmark des tarifs, négociation efficace, gain de temps et d'argent." },
  { icon: TrendingUp, title: "Votre Business, Sans Limite", description: "Prenez de l'avance. Moins de paperasse, plus de décisions stratégiques et rentables." }];

export default function NosServices() { return (
    <div className="p-6 space-y-6">
      {/* Bandeau de navigation */ }
      <div className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>
          <div className="flex space-x-6">
            <Link to="/Nos-Services">Nos Services</Link>
            <Link to="/experts">Nos Experts</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/a-propos">À Propos</Link>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-white text-blue-600 flex items-center">
              <UserCircle className="mr-2" /> Connexion
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/connexion-client">Client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/connexion-expert">Partenaire</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      { /* Section Avantages */ }
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900 text-white text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold mb-6 animate-fade-in">
            🚀 Révolutionnez votre gestion avec <span className="text-yellow-400">Profitum</span> !
          </h2>
          <p className="text-lg mb-10 opacity-90 animate-fade-in delay-200">
            L'expertise simplifiée, la transparence garantie et l'efficacité au bout des doigts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            { advantages.map((adv, index) => (
              <div key={index } className="p-6 bg-white text-gray-900 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col items-center">
                <adv.icon className="w-14 h-14 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{ adv.title }</h3>
                <p className="text-gray-600 text-sm text-center">{ adv.description }</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      { /* Section Services */ }
      <section className="py-6 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Des compétences dans de nombreux domaines :</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          { services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index } className="p-6 border-2 border-blue-600 shadow-md rounded-lg flex flex-col items-center transition-transform transform hover:shadow-xl hover:-translate-y-1 bg-white">
                <IconComponent className="text-blue-600 w-14 h-14 mb-4" />
                <h3 className="text-xl font-semibold">{ service.name }</h3>
                <p className="text-gray-700 mt-2 text-center">{ service.description }</p>
                <Button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  En savoir plus
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <header className="relative flex flex-col justify-center items-center text-gray-900 p-10 w-full text-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow-md">
            Nos solutions pour un esprit tranquille.
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Accès instantané, sécurité des données et suivi des dossiers en toute simplicité.
          </p>
          <Link to="/create-account-client">
            <Button className="mt-7 bg-yellow-400 text-black font-bold px-6 py-6 rounded-lg hover:bg-yellow-500 transition-all duration-300">
              Accédez à la Marketplace des Experts
            </Button>
          </Link>
        </div>
      </header>

      { /* Footer */ }
            <footer className="bg-gray-800 text-white rounded-lg py-6">
              <div className="container mx-auto text-center">
                <p className="text-sm">Copyright © { new Date().getFullYear() } Profitum. Tous droits réservés.</p>
              </div>
            </footer>
          </div>
        );
      }
