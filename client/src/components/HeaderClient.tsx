import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, MessageCircle, FileText, Briefcase, HelpCircle } from "lucide-react";

export default function HeaderClient() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/"); // Redirection vers la page d'accueil après déconnexion
  };

  return (
    <header className="bg-white shadow-md py-4 px-8 flex justify-between items-center fixed top-0 w-full z-50">

      {/* LOGO PROFITUM */}
        <Link href={`/dashboard/client/${user?.id || ""}`}>        <img src="/profitum_logo_texte.png" alt="Logo Profitum" className="h-14 cursor-pointer transition-transform hover:scale-105" />
      </Link>

      {/* NAVIGATION PRINCIPALE */}
      <nav className="flex space-x-10 text-gray-700 font-semibold text-lg">
          <Link href={`/messagerie-client/${user?.id}`} 
            className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
            Messagerie
          </Link>
        <Link href="/documents-client" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
          <FileText className="h-5 w-5" /> <span>Mes documents</span>
        </Link>
        <Link href="/marketplace-experts" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
          <Briefcase className="h-5 w-5" /> <span>Experts</span>
        </Link>
        <Link href="/faq-client" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
          <HelpCircle className="h-5 w-5" /> <span>FAQ</span>
        </Link>
      </nav>

      {/* BOUTON PROFIL INTERACTIF */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="relative rounded-full p-1 border-none shadow-md bg-gray-100 hover:bg-gray-200 transition-all">
            {/* Contour lumineux au hover */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-blue-500 transition"></div>
            <Avatar className="h-12 w-12 transition-transform hover:scale-105">
              <AvatarImage src="/avatar.png" className="rounded-full object-cover" />
              <AvatarFallback className="flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
                {user?.username?.slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        {/* MENU DÉROULANT */}
        <DropdownMenuContent align="end" className="w-56 shadow-lg border rounded-lg">
          <div className="px-4 py-2 text-gray-900 font-semibold">👋 Bonjour, {user?.username || "Utilisateur"} !</div>
          <DropdownMenuItem asChild>
            <Link href="/MonProfil" className="flex items-center px-4 py-2 hover:bg-gray-100 transition">
              <User className="mr-2 h-5 w-5" /> <span>Mon profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center px-4 py-2 hover:bg-gray-100 transition">
              <Settings className="mr-2 h-5 w-5" /> <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="flex items-center px-4 py-2 text-red-600 hover:bg-red-100 transition cursor-pointer">
            <LogOut className="mr-2 h-5 w-5" /> <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </header>
  );
}
