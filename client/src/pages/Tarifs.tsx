import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, TrendingUp, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PublicHeader from '@/components/PublicHeader';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Parfait pour les petites entreprises",
    monthlyPrice: 49,
    yearlyPrice: 39,
    icon: Star,
    features: [
      "Accès aux experts certifiés",
      "Bénéficiez d'outils de pilotage performants",
      "Suivez l'avancée de vos dossiers avec des notifications en temps réel",
      "Accès à la messagerie instantanée avec vos experts",
    ]
  },
  {
    id: "professional",
    name: "Professional",
    description: "Pour les entreprises en croissance",
    monthlyPrice: 99,
    yearlyPrice: 79,
    icon: TrendingUp,
    popular: true,
    features: [
      "Tous les avantages Starter",
      "Audit énergétique complet",
      "Récupération DFS jusqu'à 2000€",
      "Support téléphonique",
      "Accompagnement expert",
      "Rapport détaillé",
      "Optimisation fiscale"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Solution complète pour grandes entreprises",
    monthlyPrice: 199,
    yearlyPrice: 159,
    icon: Crown,
    features: [
      "Tous les avantages Professional",
      "Audit énergétique premium",
      "Récupération DFS illimitée",
      "Support prioritaire 24/7",
      "Expert dédié",
      "Rapport personnalisé",
      "Optimisation fiscale avancée",
      "Formation équipe",
      "Suivi personnalisé"
    ]
  }
];

const TarifsPage = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const getPrice = (plan: PricingPlan) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: PricingPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlyTotal = plan.yearlyPrice * 12;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Tarifs transparents
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Choisissez votre plan
            </h1>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              Des solutions adaptées à tous les besoins. Commencez gratuitement et évoluez selon vos objectifs.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-6 p-1 bg-slate-100 rounded-full mb-16">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  billingCycle === "monthly" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative",
                  billingCycle === "yearly" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Annuel
                {billingCycle === "yearly" && (
                  <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    -20%
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={cn(
                  "relative border-0 shadow-sm hover:shadow-md transition-all duration-300 group",
                  plan.popular 
                    ? "ring-1 ring-slate-200 shadow-lg bg-gradient-to-b from-white to-slate-50/50" 
                    : "bg-white"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-slate-900 text-white px-4 py-2 text-sm font-medium">
                      Recommandé
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-12">
                  <div className="flex justify-center mb-6">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                      plan.popular 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    )}>
                      <plan.icon className="w-8 h-8" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-3">{plan.name}</CardTitle>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-8 px-8 pb-8">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-slate-900 mb-2">
                      {getPrice(plan)}€
                      <span className="text-lg text-slate-500 font-normal ml-1">
                        /mois
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-emerald-600 font-medium">
                        Économisez {getSavings(plan)}% par rapport au mensuel
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={cn(
                      "w-full h-12 text-sm font-medium transition-all duration-200",
                      plan.popular 
                        ? "bg-slate-900 hover:bg-slate-800 text-white" 
                        : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {plan.popular ? "Commencer maintenant" : "Choisir ce plan"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50/50 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Questions fréquentes
              </h2>
              <p className="text-slate-600 text-lg">
                Tout ce que vous devez savoir sur nos tarifs
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-lg">
                    Puis-je changer de plan à tout moment ?
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                    Les ajustements sont appliqués au prorata.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-lg">
                    Y a-t-il des frais cachés ?
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Non, nos tarifs sont transparents. Le prix affiché est le prix final, 
                    sans frais cachés ni surprises.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-lg">
                    Comment fonctionne la garantie de récupération ?
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Nous garantissons une récupération minimale selon votre plan. 
                    Si nous ne l'atteignons pas, nous vous remboursons la différence.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-lg">
                    Puis-je annuler à tout moment ?
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Oui, vous pouvez annuler votre abonnement à tout moment 
                    sans frais de résiliation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardContent className="p-12">
                <h3 className="text-3xl font-bold mb-4">
                  Besoin d'une solution personnalisée ?
                </h3>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                  Contactez notre équipe pour discuter de vos besoins spécifiques 
                  et obtenir une offre sur mesure.
                </p>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 h-12 px-8 font-medium">
                  Contactez-nous
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarifsPage;