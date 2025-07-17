import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Shield, ArrowRight, Users, CheckCircle, Zap } from "lucide-react";

export default function GestionFlotteAutomobile() { return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header home page */ }
      <header className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/home">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>
          <div className="flex space-x-6">
            <a href="#services" className="hover: text-blue-200 transition-colors">Nos Services</a>
            <Link to="/experts">Nos Experts</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </header>

      { /* Accroche */ }
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Car className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-green-900 mb-4">Gestion de flotte automobile</h1>
        <p className="text-xl text-green-700 max-w-2xl mx-auto mb-6">
          Pilotez votre parc de véhicules avec des outils digitaux, gagnez en rentabilité et simplifiez la vie de vos équipes.
        </p>
      </section>

      { /* Pourquoi choisir */ }
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md: grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Shield className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Gestion centralisée</div>
            <div className="text-green-700 text-center">Un seul outil pour suivr,e, planifier et optimiser l'ensemble de votre flotte.</div>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Collaboration facilitée</div>
            <div className="text-green-700 text-center">Partagez l'information avec vos équipes et partenaires en temps réel.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Performance accrue</div>
            <div className="text-green-700 text-center">Réduisez les coûts, améliorez la disponibilité et la rentabilité de vos véhicules.</div>
          </div>
        </div>
      </section>

      { /* Comment ça marche */ }
      <section className="py-12 bg-green-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md: grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Mise en place rapide</div>
              <div className="text-green-700 text-center text-sm">Importez votre parc et paramétrez vos règles en quelques clics.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Suivi automatisé</div>
              <div className="text-green-700 text-center text-sm">Alerte,s, rappels et rapports générés sans effort.</div>
            </div>
            <div className="flex flex-col items-center">
              <Car className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Optimisation continue</div>
              <div className="text-green-700 text-center text-sm">Analysez les données pour améliorer vos performances.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Support expert</div>
              <div className="text-green-700 text-center text-sm">Accompagnement dédié pour tirer le meilleur de votre flotte.</div>
            </div>
          </div>
        </div>
      </section>

      { /* Avantages */ }
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md: grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-green-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-green-700">
              <li>✔️ Réduction des coûts de gestion</li>
              <li>✔️ Meilleure disponibilité des véhicules</li>
              <li>✔️ Collaboration et partage facilités</li>
              <li>✔️ Suivi en temps réel</li>
              <li>✔️ Décisions pilotées par la donnée</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-green-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-green-700">
              <li><strong>Est-ce adapté à toutes les tailles de flotte ?</strong><br />Ou,i, de quelques véhicules à plusieurs centaines.</li>
              <li><strong>Peut-on connecter d'autres outils ?</strong><br />Oui, notre solution s'intègre avec vos logiciels métiers.</li>
              <li><strong>Quel accompagnement proposez-vous ?</strong><br />Un support expert dédié, de la mise en place à l'optimisation continue.</li>
            </ul>
          </div>
        </div>
      </section>
      
      { /* CTA Contact */ }
      <section className="py-12 text-center bg-green-50">
        <Link to="/contact">
          <Button className="bg-green-600 text-white text-lg px-8 py-4 rounded-lg font-bold hover: bg-green-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 