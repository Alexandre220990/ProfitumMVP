import { Users, Folder, RefreshCw, BarChart, PhoneCall, Star, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Starter() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16 px-6 text-center">
        <h1 className="text-5xl font-extrabold">Un avant-goût de réussite avec l'offre Starter</h1>
        <p className="mt-4 text-xl max-w-3xl mx-auto">
          Un accès simple et efficace à des prospects qualifiés. 49€, sans engagement.
        </p>
        <Button
          className="mt-6 bg-green-500 text-white px-6 py-3 text-lg font-medium rounded-lg hover:bg-green-600"
          onClick={() => setLocation("/paiement")}
        >
          Commencez maintenant !
        </Button>
      </header>

      {/* Pourquoi choisir l'offre Starter ? */}
      <section className="py-16 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Pourquoi choisir l'offre Starter ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Users className="text-green-500 w-12 h-12 mb-4" />, text: "Accès à la base de prospects qualifiés" },
            { icon: <Folder className="text-green-500 w-12 h-12 mb-4" />, text: "Gestion centralisée des dossiers" },
            { icon: <RefreshCw className="text-green-500 w-12 h-12 mb-4" />, text: "Automatisation des relances" },
            { icon: <BarChart className="text-green-500 w-12 h-12 mb-4" />, text: "Accès aux outils d’analyse & KPI" },
            { icon: <PhoneCall className="text-green-500 w-12 h-12 mb-4" />, text: "3 prises de contact prospects" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white shadow-lg rounded-lg">
              {item.icon}
              <p className="text-lg font-semibold">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Ils ont choisi Profitum</h2>
        <p className="text-lg mb-6">"Grâce à Profitum, j’ai gagné 30% de CA supplémentaire !" - Client satisfait</p>
        <div className="flex justify-center gap-4">
          {[...Array(5)].map((_, index) => (
            <Star key={index} className="text-yellow-500 w-8 h-8" />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Questions Fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { question: "L’abonnement est-il sans engagement ?", answer: "Oui, vous pouvez annuler à tout moment." },
            { question: "Quel type de prospects vais-je recevoir ?", answer: "Des leads qualifiés selon votre expertise." },
            { question: "Comment contacter le support ?", answer: "Par email, avec une réponse sous 24h." },
          ].map((faq, index) => (
            <div key={index} className="bg-white shadow-lg p-6 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center justify-center">
                <HelpCircle className="mr-2 text-blue-500 w-6 h-6" /> {faq.question}
              </h3>
              <p className="text-gray-600 mt-2">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <footer className="bg-gray-900 text-white py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à démarrer ?</h2>
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
