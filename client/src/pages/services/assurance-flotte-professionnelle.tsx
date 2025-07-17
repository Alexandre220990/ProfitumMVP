import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Car, Briefcase, TrendingUp, ArrowRight, CheckCircle, Users, Zap } from "lucide-react";

export default function AssuranceFlotteProfessionnelle() { return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header home page */ }
      <header className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/home">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>
          <div className="flex space-x-6">
            <a href="#services" className="hover:text-blue-200 transition-colors">Nos Services</a>
            <Link to="/experts">Nos Experts</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </header>
      { /* Accroche */ }
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Shield className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-green-900 mb-4">Assurance flotte professionnelle</h1>
        <p className="text-xl text-green-700 max-w-2xl mx-auto mb-6">
          Protégez votre parc automobile avec des solutions d'assurance sur-mesure, négociées pour les pros du transport, du BTP et des métiers à forte mobilité.
        </p>
      </section>
      { /* Pourquoi choisir */ }
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Car className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Protection complète</div>
            <div className="text-green-700 text-center">Garanties adaptées à chaque véhicule, conducteur et usage professionnel.</div>
          </div>
          <div className="flex flex-col items-center">
            <Briefcase className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Tarifs négociés</div>
            <div className="text-green-700 text-center">Bénéficiez de conditions exclusives grâce à nos partenariats avec des assureurs spécialisés.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-green-600 mb-2" />
            <div className="font-bold text-green-900 mb-1">Gestion simplifiée</div>
            <div className="text-green-700 text-center">Un seul interlocuteur pour toute votre flotte, gestion centralisée et réactive.</div>
          </div>
        </div>
      </section>
      { /* Comment ça marche */ }
      <section className="py-12 bg-green-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Analyse personnalisée</div>
              <div className="text-green-700 text-center text-sm">Étude de vos besoins et de votre parc pour une couverture optimale.</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Négociation</div>
              <div className="text-green-700 text-center text-sm">Mise en concurrence des assureurs partenaires pour obtenir le meilleur tarif.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Souscription rapide</div>
              <div className="text-green-700 text-center text-sm">Démarches simplifiées, gestion 100% digitale et accompagnement dédié.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-semibold text-green-900">Suivi & gestion</div>
              <div className="text-green-700 text-center text-sm">Gestion des sinistres, avenants et évolutions de flotte en temps réel.</div>
            </div>
          </div>
        </div>
      </section>
      { /* Avantages */ }
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-green-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-green-700">
              <li>✔️ Couverture sur-mesure pour chaque véhicule</li>
              <li>✔️ Réduction des coûts d'assurance</li>
              <li>✔️ Gestion centralisée et simplifiée</li>
              <li>✔️ Accompagnement en cas de sinistre</li>
              <li>✔️ Réactivité et transparence</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-green-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-green-700">
              <li><strong>Peut-on assurer tous types de véhicules ?</strong><br />Oui, de la voiture de société au poids lourd, en passant par les utilitaires.</li>
              <li><strong>Quels sont les délais de souscription ?</strong><br />La souscription est rapide, souvent en moins de 48h après validation du dossier.</li>
              <li><strong>Comment gérer un sinistre ?</strong><br />Un gestionnaire dédié vous accompagne à chaque étape, de la déclaration à l'indemnisation.</li>
            </ul>
          </div>
        </div>
      </section>
      { /* CTA Contact */ }
      <section className="py-12 text-center bg-green-50">
        <Link to="/contact">
          <Button className="bg-green-600 text-white text-lg px-8 py-4 rounded-lg font-bold hover:bg-green-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 