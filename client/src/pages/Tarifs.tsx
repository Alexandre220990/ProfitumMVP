import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const Tarifs = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(plans[1]); // Plan recommandé par défaut
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handlePaymentClick = () => {
    // Sauvegarder le plan sélectionné dans le localStorage
    localStorage.setItem("selectedPlan", JSON.stringify({
      ...selectedPlan,
      price: billingCycle === "monthly" ? selectedPlan.price : selectedPlan.annualPrice
    }));
    // Rediriger vers la page de paiement
    navigate("/paiement");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">

      {/* Bandeau de navigation */}
      <div className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/">
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
            <DropdownMenuItem asChild>
              <Link to="/connexion-client">Client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/connexion-partner">Partenaire</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer */}
      <div className="h-12"></div>

      {/* Hero Section */}
      <header className="text-center py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h1 className="text-5xl font-extrabold tracking-tight">Vous êtes expert et souhaitez</h1>
        <h1 className="text-5xl font-extrabold tracking-tight">optimiser votre croissance ? </h1>
        <p className="mt-4 text-lg opacity-90">Que vous soyez auditeur, courtier, gestionnaire de patrimoine ou toute autre profession d'accompagnement aux entreprises, nous avons les outils pour accélérer votre business.</p>
      </header>

      {/* Plans Section */}
      <section className="container mx-auto py-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-8 max-w-7xl">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative p-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border ${
            selectedPlan.id === plan.id ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-300 bg-white"
          }`} onClick={() => setSelectedPlan(plan)}>
            {plan.recommended && (
              <div className="absolute top-0 left-0 bg-yellow-400 text-black px-3 py-1 rounded-tr-lg rounded-bl-lg font-bold">
                ⭐ Recommandé
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">{billingCycle === "monthly" ? `${plan.price} € / mois` : `${plan.annualPrice} € / an`}</p>
              <p className="text-gray-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <feature.icon className="text-blue-600 mr-2 w-6 h-6" />
                    {feature.text}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full mt-6">
                <Link to={`/paiement?plan=${plan.id}`}>Choisir ce plan</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
      
      {/* Benefits Section */}
      <section className="py-16 px-6 text-center bg-gray-100">
        <h2 className="text-4xl font-bold mb-10">Pourquoi choisir Profitum ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-8 bg-white rounded-lg flex items-center shadow-md hover:scale-105 transition">
              <benefit.icon className="text-blue-600 w-14 h-14 mr-6" />
              <div>
                <h3 className="text-2xl font-semibold">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Fixé en bas */}
      <div className="sticky bottom-0 bg-white text-gray-900 py-4 shadow-lg border-t">
        <div className="container mx-auto flex justify-between items-center px-8">
          <p className="text-lg font-semibold">
            Plan sélectionné : <span className="text-blue-600">{selectedPlan.name}</span> - {billingCycle === "monthly" ? `${selectedPlan.price} € / mois` : `${selectedPlan.annualPrice} € / an`}
          </p>
          <Button 
            onClick={handlePaymentClick}
            className="bg-green-500 text-white px-6 py-3 text-lg font-medium rounded-lg hover:bg-green-600 flex items-center"
          >
            <CreditCard className="mr-2" /> Payer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tarifs;