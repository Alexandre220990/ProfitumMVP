import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cpu, Database, TrendingUp, Shield, ArrowRight, CheckCircle, Zap } from "lucide-react";

export default function ChronotachygraphesDigitaux() { return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
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
            <Link to="/a-propos">Contact</Link>
          </div>
        </div>
      </header>
      { /* Accroche *, / }
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Clock className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Chronotachygraphes digitaux</h1>
        <p className="text-xl text-blue-700 max-w-2xl mx-auto mb-6">
          La solution connectée pour la conformité, la sécurité et la performance de votre flotte professionnelle.
        </p>
      </section>
      { /* Pourquoi choisir */ }
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md: grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Cpu className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Conformité automatisée</div>
            <div className="text-blue-700 text-center">Respectez la réglementation sans effort grâce à la collecte automatique des données de conduite.</div>
          </div>
          <div className="flex flex-col items-center">
            <Database className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Suivi en temps réel</div>
            <div className="text-blue-700 text-center">Visualisez l'activité de vos véhicules et conducteurs à tout momen,t, où que vous soyez.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-blue-600 mb-2" />
            <div className="font-bold text-blue-900 mb-1">Performance & sécurité</div>
            <div className="text-blue-700 text-center">Optimisez la productivité, réduisez les risques et améliorez la sécurité de vos équipes.</div>
          </div>
        </div>
      </section>
      { /* Comment ça marche */ }
      <section className="py-12 bg-blue-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md: grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Installation rapide</div>
              <div className="text-blue-700 text-center text-sm">Mise en place sur site ou à distanc,e, sans immobiliser votre flotte.</div>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Collecte sécurisée</div>
              <div className="text-blue-700 text-center text-sm">Données cryptées et sauvegardées automatiquement.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Alertes & rapports</div>
              <div className="text-blue-700 text-center text-sm">Recevez des alertes en cas d'anomalie et des rapports personnalisés.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-semibold text-blue-900">Support expert</div>
              <div className="text-blue-700 text-center text-sm">Accompagnement dédié pour la prise en main et la conformité continue.</div>
            </div>
          </div>
        </div>
      </section>
      { /* Avantages */ }
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md: grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-blue-700">
              <li>✔️ Zéro paperass,e, zéro oubli réglementaire</li>
              <li>✔️ Réduction des risques d'amende</li>
              <li>✔️ Meilleure gestion du temps de conduite</li>
              <li>✔️ Valorisation de votre image auprès des clients et partenaires</li>
              <li>✔️ Données accessibles partout, tout le temps</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-blue-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-blue-700">
              <li><strong>Est-ce compatible avec tous les véhicules ?</strong><br />Oui, nos solutions s'adaptent à la majorité des poids lourds et utilitaires.</li>
              <li><strong>Mes données sont-elles sécurisées ?</strong><br />Oui, elles sont cryptées et stockées sur des serveurs sécurisés en France.</li>
              <li><strong>Quel accompagnement proposez-vous ?</strong><br />Un support expert dédié, de l'installation à la conformité continue.</li>
            </ul>
          </div>
        </div>
      </section>
      { /* CTA Contact */ }
      <section className="py-12 text-center bg-blue-50">
        <Link to="/a-propos">
          <Button className="bg-blue-600 text-white text-lg px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 