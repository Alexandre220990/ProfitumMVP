import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="text-gray-600 text-sm">
            © 2025 Tous droits réservés
          </div>
          <div className="mt-4 flex space-x-6">
            <Link href="/conditions-utilisation">
              <a className="text-gray-600 hover:text-gray-800 text-sm">Conditions d'utilisation</a>
            </Link>
            <Link href="/mentions-legales">
              <a className="text-gray-600 hover:text-gray-800 text-sm">Mentions légales</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-600 hover:text-gray-800 text-sm">Contact</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
