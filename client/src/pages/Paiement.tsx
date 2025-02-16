import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCircle, ChevronDown, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import axios from "axios";

export default function PaiementPage() {
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    axios.get("/api/plans")
      .then(response => {
        setPlans(response.data);
      })
      .catch(error => {
        console.error("Erreur lors du chargement des plans :", error);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
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

      {/* Main Content */}
      <div className="container mx-auto py-20 flex flex-col items-center">
        <h1 className="text-5xl font-bold mb-16 text-center font-sans w-full">
          Accédez à un univers d'opportunités !
        </h1>
        <div className="flex justify-center items-start space-x-16 w-full">
          {/* Plans */}
          <div className="w-1/2 flex flex-col space-y-6">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`cursor-pointer border px-6 py-7 rounded-lg text-left shadow-md transition-all duration-300 ${
                  selectedPlan?.id === plan.id ? "border-blue-600 bg-blue-100" : "border-gray-300 bg-white"
                }`}
                onClick={() => {
                  setSelectedPlan(plan);
                  setExpandedPlan(expandedPlan?.id === plan.id ? null : plan);
                }}
              >
                <div className="flex justify-between items-center text-xl font-semibold text-gray-800 font-sans">
                  <span>{plan.name}</span>
                  <span className="text-blue-600 font-bold">
                    {billingCycle === "monthly" ? `${plan.price} € / mois` : `${plan.annualPrice} € / an`}
                  </span>
                  <ChevronDown
                    className={`transition-transform ${expandedPlan?.id === plan.id ? "rotate-180" : ""}`}
                  />
                </div>
                {expandedPlan?.id === plan.id && (
                  <ul className="mt-3 text-left text-gray-700 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="text-green-500 mr-2">✔</span> {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="w-1/3 bg-white shadow-lg rounded-lg p-6 text-center border border-gray-300 sticky top-28 self-start">
            <h2 className="text-2xl font-bold mb-4 font-sans">Détails du paiement</h2>
            <div className="flex justify-center mb-4">
              <Button
                className={`mr-2 ${billingCycle === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setBillingCycle("monthly")}
              >
                Mensuel
              </Button>
              <Button
                className={`relative ${billingCycle === "annual" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setBillingCycle("annual")}
              >
                Annuel <span className="absolute top-0 right-0 text-red-600 text-xs">-1 mois offert</span>
              </Button>
            </div>
            <p className="text-xl font-semibold">
              Total : {selectedPlan ? `${billingCycle === "monthly" ? selectedPlan.price : selectedPlan.annualPrice} €` : "0 €"}
            </p>
            <p className="text-sm text-gray-600">
              Paiement sécurisé par <CreditCard /> Stripe / PayPal
            </p>
            <Button
              className="mt-6 bg-green-500 text-white px-6 py-3 text-lg font-medium rounded-lg hover:bg-green-600 w-full"
              disabled={!selectedPlan}
            >
              Procéder au paiement
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
