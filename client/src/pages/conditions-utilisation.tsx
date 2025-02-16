import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navigation */}
      <nav className="bg-blue-900 text-white py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-12 cursor-pointer" />
          </Link>
          <div className="flex space-x-6 font-medium">
            <Link href="/Nos-Services" className="hover:text-yellow-400">Nos Services</Link>
            <Link href="/experts" className="hover:text-yellow-400">Nos Experts</Link>
            <Link href="/tarifs" className="hover:text-yellow-400">Tarifs</Link>
            <Link href="/contact" className="hover:text-yellow-400">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="text-center py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h1 className="text-5xl font-extrabold">Conditions d’Utilisation</h1>
        <p className="mt-4 text-lg opacity-90">Mise à jour : {new Date().toLocaleDateString()}</p>
      </header>

      {/* Contenu */}
      <div className="container mx-auto max-w-4xl py-16 px-6">

        {/* Sommaire */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-10">
          <h2 className="text-2xl font-bold mb-4">Sommaire</h2>
          <ul className="space-y-2 text-blue-600">
            {[
              { id: "introduction", title: "Introduction" },
              { id: "eligibilite", title: "Éligibilité" },
              { id: "obligations", title: "Obligations des utilisateurs" },
              { id: "confidentialite", title: "Confidentialité et protection des données" },
              { id: "paiements", title: "Paiements et abonnements" },
              { id: "resiliation", title: "Résiliation et suspension" },
              { id: "limitation", title: "Limitation de responsabilité" },
              { id: "modifications", title: "Modifications des conditions" },
              { id: "contact", title: "Contact" },
            ].map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Sections des conditions */}
        <section id="introduction" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Bienvenue sur Profitum ! En utilisant notre plateforme, vous acceptez les présentes Conditions d’Utilisation. 
            Nous vous encourageons à les lire attentivement avant de continuer à utiliser nos services.
          </p>
        </section>

        <section id="eligibilite" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">2. Éligibilité</h2>
          <p className="text-gray-700 leading-relaxed">
            Nos services sont destinés aux professionnels et entreprises légalement constitués. Vous devez être 
            âgé d’au moins 18 ans et disposer de l’autorité légale pour conclure des accords avec Profitum.
          </p>
        </section>

        <section id="obligations" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">3. Obligations des utilisateurs</h2>
          <p className="text-gray-700 leading-relaxed">
            En utilisant Profitum, vous vous engagez à fournir des informations exactes et à respecter 
            les lois en vigueur. Toute utilisation frauduleuse ou abusive entraînera la suspension de votre compte.
          </p>
        </section>

        <section id="confidentialite" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">4. Confidentialité et protection des données</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous nous engageons à protéger vos données personnelles conformément à notre 
            <Link href="/politique-confidentialite" className="text-blue-600 hover:underline"> Politique de Confidentialité</Link>.
          </p>
        </section>

        <section id="paiements" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">5. Paiements et abonnements</h2>
          <p className="text-gray-700 leading-relaxed">
            Les paiements sont effectués de manière sécurisée via nos partenaires. Vous acceptez 
            que les abonnements soient facturés périodiquement en fonction de votre plan choisi.
          </p>
        </section>

        <section id="resiliation" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">6. Résiliation et suspension</h2>
          <p className="text-gray-700 leading-relaxed">
            Profitum se réserve le droit de suspendre ou résilier un compte en cas de non-respect des conditions d’utilisation.
          </p>
        </section>

        <section id="limitation" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">7. Limitation de responsabilité</h2>
          <p className="text-gray-700 leading-relaxed">
            Nous ne garantissons pas une disponibilité ininterrompue de nos services et déclinons toute responsabilité 
            en cas de pertes liées à une indisponibilité temporaire.
          </p>
        </section>

        <section id="modifications" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">8. Modifications des conditions</h2>
          <p className="text-gray-700 leading-relaxed">
            Profitum peut modifier ces Conditions d’Utilisation à tout moment. Les utilisateurs seront informés de tout changement.
          </p>
        </section>

        <section id="contact" className="mb-10">
          <h2 className="text-2xl font-bold mb-4">9. Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            Pour toute question concernant ces conditions, contactez-nous à{" "}
            <a href="mailto:support@profitum.com" className="text-blue-600 hover:underline">support@profitum.com</a>.
          </p>
        </section>

        {/* CTA Retour */}
        <div className="text-center mt-10">
          <Link href="/inscription-client">
            <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Retour à l'inscription
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
