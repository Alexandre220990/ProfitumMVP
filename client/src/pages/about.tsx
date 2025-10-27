import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserCircle, Target, Shield, Users, Award, TrendingUp, CheckCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link to="/">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>
          <div className="flex space-x-6">
            <Link to="/a-propos" className="font-medium">À Propos</Link>
            <Link to="/experts">Nos Experts</Link>
            <Link to="/simulateur">Simulateur</Link>
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
              <Link to="/connexion-expert">Partenaire</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/connexion-apporteur">Apporteur d'affaires</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">À propos de Profitum</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Votre partenaire de confiance pour optimiser vos aides et subventions d'entreprise
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Profitum est né d'une conviction simple : toute entreprise mérite d'accéder facilement aux aides et optimisations fiscales qui lui sont destinées.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Notre plateforme connecte les entreprises avec des experts certifiés pour maximiser leurs opportunités d'optimisation fiscale et sociale, tout en garantissant une conformité totale.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Simplicité</h3>
                  <p className="text-gray-600">Un processus intuitif et guidé pour identifier vos opportunités</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Expertise</h3>
                  <p className="text-gray-600">Un réseau d'experts certifiés et spécialisés à votre service</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Transparence</h3>
                  <p className="text-gray-600">Une visibilité totale sur vos dossiers et leur avancement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valeurs Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-4">
                <Shield className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sécurité & Conformité</h3>
              <p className="text-gray-600">
                Nous garantissons la protection de vos données et une conformité totale avec les réglementations en vigueur.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Accompagnement Personnalisé</h3>
              <p className="text-gray-600">
                Chaque entreprise est unique. Nos experts vous accompagnent avec des solutions sur mesure.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-4">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance & Résultats</h3>
              <p className="text-gray-600">
                Notre objectif : maximiser vos retombées financières et optimiser votre trésorerie.
              </p>
            </div>
          </div>
        </div>

        {/* Notre Expertise Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-12 mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-xl mb-6">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Notre Expertise</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Profitum couvre l'ensemble des dispositifs d'optimisation fiscale et sociale pour les entreprises françaises
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Crédit d'Impôt Recherche (CIR)",
              "Certificats d'Économies d'Énergie (CEE)",
              "Remboursement TICPE",
              "Optimisation URSSAF",
              "Optimisation MSA",
              "Déficit Foncier Stratégique",
              "Audit énergétique",
              "Optimisation comptable",
              "Accompagnement social"
            ].map((expertise, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-200">{expertise}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Prêt à optimiser votre entreprise ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Découvrez vos opportunités en quelques minutes avec notre simulateur gratuit
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/simulateur">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                Lancer le simulateur
              </Button>
            </Link>
            <Link to="/experts">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                Voir nos experts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/Logo-Profitum.png" alt="Profitum" className="h-10 mb-4" />
              <p className="text-gray-400 text-sm">
                Votre partenaire pour optimiser vos aides et subventions d'entreprise
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plateforme</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/simulateur" className="hover:text-white">Simulateur</Link></li>
                <li><Link to="/experts" className="hover:text-white">Nos Experts</Link></li>
                <li><Link to="/a-propos" className="hover:text-white">À Propos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Espace</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/connexion-client" className="hover:text-white">Espace Client</Link></li>
                <li><Link to="/connexion-expert" className="hover:text-white">Espace Partenaire</Link></li>
                <li><Link to="/connexion-apporteur" className="hover:text-white">Espace Apporteur</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-white">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Profitum. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

