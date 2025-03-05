import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, Zap, Bell, FileText, BarChart, Users, Rocket, Globe, Code, CreditCard, Clock, TrendingUp, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const plans = [
  {
    id: 1,
    name: "Starter",
    price: 39,
    annualPrice: 399,
    description: "Démarrez votre activité avec les outils essentiels.",
    features: [
      { text: "5 demandes directes / mois", icon: Bell },
      { text: "Documents centralisés", icon: FileText },
      { text: "Référencement basic", icon: Globe },
      { text: "Outils analytiques", icon: ShieldCheck },
    ],
    recommended: false,
  },
  {
    id: 2,
    name: "Growth 🚀",
    price: 119,
    annualPrice: 1190,
    description: "Développez votre business avec des outils avancés.",
    features: [
      { text: "25 demandes directes / mois", icon: Bell },
      { text: "Outils analytiques avancés", icon: BarChart },
      { text: "Mise en avant boostée", icon: Rocket },
      { text: "Relances clients automatisées", icon: Zap },
    ],
    recommended: true,
  },
  {
    id: 3,
    name: "Scale 💎",
    price: 349,
    annualPrice: 3490,
    description: "Dominez votre marché avec des outils exclusifs.",
    features: [
      { text: "Demandes directes illimités", icon: Users },
      { text: "API & intégrations", icon: Code },
      { text: "Mise en avant ultime", icon: Star },
      { text: "Dashboard avancé avec KPIs", icon: BarChart },
    ],
    recommended: false,
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Gain de temps exceptionnel",
    description: "Automatisez vos relances et accédez aux meilleurs prospects en un clic.",
  },
  {
    icon: TrendingUp,
    title: "Visibilité maximisée",
    description: "Profitez d'une mise en avant stratégique et boostez votre attractivité.",
  },
  {
    icon: BarChart,
    title: "Analyse et insights avancés",
    description: "Pilotez vos performances avec un tableau de bord analytique puissant.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité et confidentialité",
    description: "Données protégées et transactions sécurisées pour une tranquillité absolue.",
  },
];

export default function PaiementPage() {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-blue-900 text-white py-3 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
            </Link>
            <div className="flex space-x-6">
              <Link href="/nos-services">
                <span className="hover:text-blue-200 cursor-pointer">Nos Services</span>
              </Link>
              <Link href="/experts">
                <span className="hover:text-blue-200 cursor-pointer">Nos Experts</span>
              </Link>
              <Link href="/tarifs">
                <span className="hover:text-blue-200 cursor-pointer">Tarifs</span>
              </Link>
              <Link href="/contact">
                <span className="hover:text-blue-200 cursor-pointer">Contact</span>
              </Link>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white text-blue-600 flex items-center">
                <UserCircle className="mr-2" /> Connexion
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/connexion-client">
                  <span className="w-full">Client</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/connexion-partner">
                  <span className="w-full">Partenaire</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="flex-1 w-full mt-16">
        {/* Hero Section */}
        <header className="w-full py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-2">Vous êtes expert et souhaitez</h1>
          <h1 className="text-5xl font-extrabold tracking-tight">optimiser votre croissance ?</h1>
          <p className="mt-4 text-lg opacity-90 max-w-3xl mx-auto">
            Que vous soyez auditeur, courtier, gestionnaire de patrimoine ou toute autre profession d'accompagnement aux entreprises, nous avons les outils pour accélérer votre business.
          </p>
        </header>

        {/* Plans Section */}
        <section className="w-full py-16 px-4">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative p-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
                  selectedPlan.id === plan.id ? "border-2 border-blue-500 bg-blue-50" : "border border-gray-200 bg-white"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-0 bg-yellow-400 text-black px-3 py-1 rounded-tr-lg rounded-bl-lg font-bold">
                    ⭐ Recommandé
                  </div>
                )}
                <h3 className="text-3xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <p className="text-4xl font-bold mt-4">
                  {billingCycle === "monthly" ? `${plan.price} € / mois` : `${plan.annualPrice} € / an`}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <feature.icon className="text-blue-600 mr-2 w-5 h-5 flex-shrink-0" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-10">Pourquoi choisir Profitum ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-start">
                    <benefit.icon className="text-blue-600 w-12 h-12 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-4 z-50">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <p className="text-lg font-semibold">
              Plan sélectionné : <span className="text-blue-600">{selectedPlan.name}</span>
            </p>
            <p className="text-gray-600">
              {billingCycle === "monthly" ? `${selectedPlan.price} € / mois` : `${selectedPlan.annualPrice} € / an`}
            </p>
          </div>
          <Link href="/paiement">
            <Button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg flex items-center justify-center">
              <CreditCard className="mr-2" />
              <span>Payer maintenant</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}