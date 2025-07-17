import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fuel, CreditCard, TrendingUp, Shield, ArrowRight, CheckCircle, Zap } from "lucide-react";

export default function GestionCarburantCartesPro() { return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
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
      { /* Accroche *, / }
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Fuel className="w-16 h-16 text-yellow-600" />
        </div>
        <h1 className="text-4xl font-bold text-yellow-900 mb-4">Gestion de carburant & cartes pro</h1>
        <p className="text-xl text-yellow-700 max-w-2xl mx-auto mb-6">
          Maîtrisez vos dépenses carburant et simplifiez la gestion de vos pleins grâce à nos solutions connectées et nos cartes professionnelles.
        </p>
      </section>
      { /* Pourquoi choisir */ }
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md: grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <CreditCard className="w-10 h-10 text-yellow-600 mb-2" />
            <div className="font-bold text-yellow-900 mb-1">Suivi centralisé</div>
            <div className="text-yellow-700 text-center">Toutes vos dépenses carburant et péages en un seul tableau de bord.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-yellow-600 mb-2" />
            <div className="font-bold text-yellow-900 mb-1">Optimisation des coûts</div>
            <div className="text-yellow-700 text-center">Analysez la consommatio,n, détectez les anomalies et réduisez les gaspillages.</div>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-10 h-10 text-yellow-600 mb-2" />
            <div className="font-bold text-yellow-900 mb-1">Sécurité & contrôle</div>
            <div className="text-yellow-700 text-center">Limitez les fraudes, paramétrez les plafonds et sécurisez vos transactions.</div>
          </div>
        </div>
      </section>
      { /* Comment ça marche */ }
      <section className="py-12 bg-yellow-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-yellow-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md: grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-yellow-600 mb-2" />
              <div className="font-semibold text-yellow-900">Commande rapide</div>
              <div className="text-yellow-700 text-center text-sm">Commandez vos cartes en lign,e, livraison express.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-yellow-600 mb-2" />
              <div className="font-semibold text-yellow-900">Activation immédiate</div>
              <div className="text-yellow-700 text-center text-sm">Activez et paramétrez vos cartes en quelques clics.</div>
            </div>
            <div className="flex flex-col items-center">
              <Fuel className="w-8 h-8 text-yellow-600 mb-2" />
              <div className="font-semibold text-yellow-900">Suivi automatisé</div>
              <div className="text-yellow-700 text-center text-sm">Toutes les transactions sont remontées en temps réel.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-yellow-600 mb-2" />
              <div className="font-semibold text-yellow-900">Analyse & optimisation</div>
              <div className="text-yellow-700 text-center text-sm">Rapports détaillés pour piloter vos coûts et anticiper les besoins.</div>
            </div>
          </div>
        </div>
      </section>
      { /* Avantages */ }
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md: grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-yellow-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-yellow-700">
              <li>✔️ Suivi précis des dépenses carburant</li>
              <li>✔️ Réduction des gaspillages et fraudes</li>
              <li>✔️ Gain de temps administratif</li>
              <li>✔️ Optimisation des coûts de flotte</li>
              <li>✔️ Accès à des tarifs négociés</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-yellow-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-yellow-700">
              <li><strong>Peut-on utiliser les cartes partout ?</strong><br />Ou,i, elles sont acceptées dans la majorité des stations-service et réseaux partenaires.</li>
              <li><strong>Comment suivre la consommation ?</strong><br />Un tableau de bord en ligne vous permet de tout piloter en temps réel.</li>
              <li><strong>Est-ce sécurisé ?</strong><br />Oui, chaque transaction est contrôlée et paramétrable selon vos besoins.</li>
            </ul>
          </div>
        </div>
      </section>
      { /* CTA Contact */ }
      <section className="py-12 text-center bg-yellow-50">
        <Link to="/contact">
          <Button className="bg-yellow-600 text-white text-lg px-8 py-4 rounded-lg font-bold hover: bg-yellow-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 