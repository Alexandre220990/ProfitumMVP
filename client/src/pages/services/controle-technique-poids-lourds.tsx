import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Calendar, Wrench, CheckCircle, Zap, ArrowRight } from "lucide-react";

export default function ControleTechniquePoidsLourds() { 
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header home page */}
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
      {/* Accroche */}
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Wrench className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Contrôles techniques poids lourds</h1>
        <p className="text-xl text-blue-700 max-w-2xl mx-auto mb-6">
          Restez conforme et évitez les sanctions grâce à un suivi rigoureux et des rappels automatisés pour tous vos véhicules lourds.
        </p>
      </section>
      {/* Pourquoi choisir */}
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md: grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Calendar className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Rappels automatisés</div>
            <div className="text-blue-700 text-center">Ne ratez plus jamais une échéance grâce à nos alertes personnalisées.</div>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Conformité garantie</div>
            <div className="text-blue-700 text-center">Respectez la réglementation et évitez les amendes et immobilisations.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Gestion optimisée</div>
            <div className="text-blue-700 text-center">Centralisez le suivi de tous vos contrôles techniques sur une seule plateforme.</div>
          </div>
        </div>
      </section>
      
      {/* Comment ça marche */}
      <section className="py-12 bg-blue-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md: grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Enregistrement facile</div>
              <div className="text-blue-700 text-center text-sm">Ajoutez vos véhicules et dates de contrôle en quelques clics.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Alertes automatiques</div>
              <div className="text-blue-700 text-center text-sm">Recevez des notifications avant chaque échéance.</div>
            </div>
            <div className="flex flex-col items-center">
              <Wrench className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Suivi centralisé</div>
              <div className="text-blue-700 text-center text-sm">Visualisez l'état de conformité de toute votre flotte en temps réel.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Support dédié</div>
              <div className="text-blue-700 text-center text-sm">Assistance pour la gestion documentaire et les démarches administratives.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md: grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-blue-700">
              <li>✔️ Zéro oubl,i, zéro sanction</li>
              <li>✔️ Conformité réglementaire assurée</li>
              <li>✔️ Gain de temps administratif</li>
              <li>✔️ Suivi centralisé et accessible</li>
              <li>✔️ Accompagnement personnalisé</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-blue-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-blue-700">
              <li><strong>Est-ce adapté à toutes les marques ?</strong><br />Oui, notre solution est compatible avec tous les véhicules poids lourds.</li>
              <li><strong>Peut-on recevoir les alertes par email ?</strong><br />Oui, notifications par email et SMS selon vos préférences.</li>
              <li><strong>Comment ajouter un nouveau véhicule ?</strong><br />En quelques clics depuis votre espace client sécurisé.</li>
            </ul>
          </div>
        </div>
      </section>
      {/* CTA Contact */}
      <section className="py-12 text-center bg-blue-50">
        <Link to="/contact">
          <Button className="bg-blue-600 text-white text-lg px-8 py-4 rounded-lg font-bold hover: bg-blue-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 