import { BarChart3, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  return (
    <>
      <div className="flex items-center justify-between w-full p-4 shadow-md bg-white">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-2xl font-bold text-blue-600">Profitum</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/create-account-client">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
              S'inscrire
            </button>
          </Link>
          <Link href="/experts">
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">Nos experts</span>
          </Link>
        </nav>

        <Link href="/connexion-client">
          <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition">
            Se connecter
          </button>
        </Link>
      </div>

      {/* Espacement sous le header */}
      <div className="h-8"></div>
    </>
  );
}
