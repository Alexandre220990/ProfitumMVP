import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/"); // Redirection vers la page d'accueil après déconnexion
  };

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">

      {/* LOGO PROFITUM */}
      <Link href="/">
        <img src="/profitum_logo_texte.png" alt="Logo Profitum" className="h-14 cursor-pointer" />
      </Link>

      {/* TITRES CENTRÉS AVEC EXPERTS AVANT FAQ */}
      <nav className="flex space-x-8 text-gray-700 font-medium text-xl">
        <Link href="/messagerie" className="hover:text-blue-600 font-bold transition-colors">Messagerie</Link>
        <Link href="/documents-client" className="hover:text-blue-600 font-bold transition-colors">Mes documents</Link>
        <Link href="/marketplace-experts" className="hover:text-blue-600 font-bold transition-colors">Experts</Link>
        <Link href="/faq-client" className="hover:text-blue-600 font-bold transition-colors">FAQ</Link>
      </nav>

      {/* BOUTON PROFIL ROND AMÉLIORÉ */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="relative rounded-full p-1 border-none shadow-md bg-gray-100 hover:bg-gray-200 transition-all">
            {/* Ajout d’un contour lumineux */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-green-500 transition"></div>
            <Avatar className="h-12 w-12 transition-transform hover:scale-105">
              <AvatarImage src="/avatar.png" className="rounded-full object-cover" />
              <AvatarFallback className="flex items-center justify-center bg-green-500 text-white font-bold text-lg">
                {user?.username?.slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        {/* MENU DÉROULANT */}
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/MonProfil" className="flex items-center">
              <User className="mr-2 h-5 w-5" /> Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              <Settings className="mr-2 h-5 w-5" /> Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-5 w-5" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </header>
  );
}
