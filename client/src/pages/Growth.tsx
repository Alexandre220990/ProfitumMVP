import { Users, Folder, RefreshCw, BarChart, PhoneCall, TrendingUp, ShieldCheck, HelpCircle, Star, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Growth() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Bandeau de navigation global */}
      <div className="bg-blue-900 text-white py-3 px-6 flex justify-between items-center text-sm">
        <div className="flex space-x-6">
          <Link href="/">Accueil</Link>
          <Link href="/Nos-Services">Nos Services</Link>
          <Link href="/experts">Nos Experts</Link>
          <Link href="/tarifs">Tarifs</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-white text-blue-600 flex items-center">
              <UserCircle className="mr-2" /> Connexion
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/auth?type=client">Client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth?type=partner">Partenaire</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16 px-6 text-center">
        <h1 className="text-5xl font-extrabold">Développez votre activité avec l'offre Growth</h1>
        <p className="mt-4 text-xl max-w-3xl mx-auto">
          Plus de prospects, plus d’outils, plus de croissance. Sans engagement.
        </p>
        <Button
          className="mt-6 bg-green-500 text-white px-6 py-3 text-lg font-medium rounded-lg hover:bg-green-600"
          onClick={() => setLocation("/paiement")}
        >
          Je commence maintenant !
        </Button>
      </header>

      {/* Pourquoi choisir l'offre Growth ? */}
      <section className="py-16 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Pourquoi choisir l'offre Growth ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Users />, text: "Accès illimité à la base de prospects qualifiés" },
            { icon: <Folder />, text: "Gestion avancée des dossiers et contacts" },
            { icon: <RefreshCw />, text: "Automatisation complète des relances" },
            { icon: <BarChart />, text: "Outils d’analyse & KPI avancés" },
            { icon: <TrendingUp />, text: "Boost de visibilité dans l’annuaire" },
            { icon: <ShieldCheck />, text: "Support premium dédié" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white shadow-lg rounded-lg">
              <div className="text-green-500 text-4xl mb-4">{item.icon}</div>
              <p className="text-lg font-semibold">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Ils ont choisi Profitum</h2>
        <p className="text-lg mb-6">"Avec Growth, j’ai triplé mes conversions en 6 mois !" - Client satisfait</p>
        <div className="flex justify-center gap-4">
          {[...Array(5)].map((_, index) => (
            <Star key={index} className="text-yellow-500 text-2xl" />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Questions Fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { question: "Quelle est la différence entre Starter et Growth ?", answer: "Growth offre plus de prospects et des outils avancés." },
            { question: "Puis-je changer d’abonnement plus tard ?", answer: "Oui, vous pouvez passer à une offre supérieure à tout moment." },
            { question: "Quel est le niveau de support inclus ?", answer: "Un support premium dédié est inclus avec l’offre Growth." },
          ].map((faq, index) => (
            <div key={index} className="bg-white shadow-lg p-6 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center justify-center">
                <HelpCircle className="mr-2 text-blue-500" /> {faq.question}
              </h3>
              <p className="text-gray-600 mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <footer className="bg-gray-900 text-white py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à passer à la vitesse supérieure ?</h2>
        <Button
          className="bg-green-500 text-white px-6 py-3 text-lg font-medium rounded-lg hover:bg-green-600"
          onClick={() => setLocation("/inscription")}
        >
          Je commence maintenant !
        </Button>
      </footer>
    </div>
  );
}
