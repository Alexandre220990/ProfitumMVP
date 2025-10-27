import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Eye, Camera, CheckCircle, Zap, ArrowRight } from "lucide-react";

export default function DashcamSecurite() { return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

      { /* Accroche */ }
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <Camera className="w-16 h-16 text-gray-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Dashcam et sécurité</h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-6">
          Sécurisez vos trajets, protégez vos conducteurs et valorisez votre flotte grâce à la vidéo embarquée intelligente.
        </p>
      </section>
      { /* Pourquoi choisir */ }
      <section className="py-8 bg-white">
        <div className="container mx-auto grid md: grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <Shield className="w-10 h-10 text-gray-600 mb-2" />
            <div className="font-bold text-gray-900 mb-1">Sécurité renforcée</div>
            <div className="text-gray-700 text-center">Réduisez les risques d'accident et de litige grâce à la preuve vidéo.</div>
          </div>
          <div className="flex flex-col items-center">
            <Eye className="w-10 h-10 text-gray-600 mb-2" />
            <div className="font-bold text-gray-900 mb-1">Surveillance intelligente</div>
            <div className="text-gray-700 text-center">Analysez les comportements de conduite et anticipez les incidents.</div>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="w-10 h-10 text-gray-600 mb-2" />
            <div className="font-bold text-gray-900 mb-1">Valorisation de la flotte</div>
            <div className="text-gray-700 text-center">Rassurez vos clients et partenaires avec une flotte équipée des dernières technologies.</div>
          </div>
        </div>
      </section>

      { /* Comment ça marche */ }
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Comment ça marche&nbsp;?</h2>
          <div className="grid md: grid-cols-4 gap-6">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-gray-600 mb-2" />
              <div className="font-semibold text-gray-900">Installation rapide</div>
              <div className="text-gray-700 text-center text-sm">Pose sur site ou en atelie,r, sans immobilisation longue.</div>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 text-gray-600 mb-2" />
              <div className="font-semibold text-gray-900">Enregistrement automatique</div>
              <div className="text-gray-700 text-center text-sm">Captation continue ou sur événement, stockage sécurisé.</div>
            </div>
            <div className="flex flex-col items-center">
              <Camera className="w-8 h-8 text-gray-600 mb-2" />
              <div className="font-semibold text-gray-900">Accès à distance</div>
              <div className="text-gray-700 text-center text-sm">Visualisation des vidéos et alertes depuis votre espace client.</div>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-gray-600 mb-2" />
              <div className="font-semibold text-gray-900">Support expert</div>
              <div className="text-gray-700 text-center text-sm">Assistance technique et conseils pour exploiter tout le potentiel.</div>
            </div>
          </div>
        </div>
      </section>
      
      { /* Avantages */ }
      <section className="py-12 bg-white">
        <div className="container mx-auto grid md: grid-cols-2 gap-8">
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Les bénéfices pour votre entreprise</h3>
            <ul className="space-y-3 text-gray-700">
              <li>✔️ Réduction des litiges et des coûts d'assurance</li>
              <li>✔️ Amélioration de la sécurité des conducteurs</li>
              <li>✔️ Valorisation de l'image de marque</li>
              <li>✔️ Suivi des incidents et des comportements</li>
              <li>✔️ Preuve vidéo en cas de sinistre</li>
            </ul>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold text-gray-900 mb-4">FAQ rapide</h3>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Est-ce légal en France ?</strong><br />Ou,i, nos solutions respectent la réglementation sur la vie privée et la protection des données.</li>
              <li><strong>Combien de temps sont conservées les vidéos ?</strong><br />La durée est paramétrable selon vos besoins et obligations.</li>
              <li><strong>Peut-on accéder aux vidéos à distance ?</strong><br />Oui, via un espace client sécurisé accessible 24/7.</li>
            </ul>
          </div>
        </div>
      </section>
      { /* CTA Contact */ }
      <section className="py-12 text-center bg-gray-50">
        <Link to="/a-propos">
          <Button className="bg-gray-900 text-white text-lg px-8 py-4 rounded-lg font-bold hover:bg-gray-700 transition">
            Contactez-nous
          </Button>
        </Link>
      </section>
    </div>
  )
} 