import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, MessageCircle, FileText, Briefcase, HelpCircle, Users, Menu, X } from "lucide-react";

export default function HeaderPartner() { 
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => { 
    await logout();
    navigate("/"); // Redirection vers la page d'accueil après déconnexion 
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-md py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center fixed top-0 left-0 right-0 w-full z-50">
        { /* LOGO PROFITUM */ }
        <div onClick={ () => handleNavigation(`/dashboard/expert/${user?.id || "" }`)} className="cursor-pointer flex-shrink-0">
          <img src="/profitum_logo_texte.png" alt="Logo Profitum" className="h-10 sm:h-12 lg:h-14 cursor-pointer transition-transform hover:scale-105" />
        </div>

        { /* NAVIGATION EXPERT (Desktop) */ }
        <nav className="hidden lg:flex space-x-4 xl:space-x-10 text-gray-700 font-semibold text-base xl:text-lg">
          <div onClick={ () => handleNavigation(`/dashboard/expert/${user?.id || "" }`)} 
            className="flex items-center space-x-1 xl:space-x-2 hover:text-blue-600 transition-colors cursor-pointer relative group whitespace-nowrap">
            <Briefcase className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" /> <span>Tableau de bord</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </div>
          <div onClick={ () => handleNavigation(`/messagerie-expert/${user?.id || "" }`)} 
            className="flex items-center space-x-1 xl:space-x-2 hover:text-blue-600 transition-colors cursor-pointer relative group whitespace-nowrap">
            <MessageCircle className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" /> <span>Messagerie</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </div>
          <div onClick={ () => handleNavigation("/documents-expert") } 
            className="flex items-center space-x-1 xl:space-x-2 hover:text-blue-600 transition-colors cursor-pointer relative group whitespace-nowrap">
            <FileText className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" /> <span>Documents</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </div>
          <div onClick={ () => handleNavigation("/demandes-en-attente") } 
            className="flex items-center space-x-1 xl:space-x-2 hover:text-blue-600 transition-colors cursor-pointer relative group whitespace-nowrap">
            <Users className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" /> <span>Demandes</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </div>
          <div onClick={ () => handleNavigation("/aide-expert") } 
            className="flex items-center space-x-1 xl:space-x-2 hover:text-blue-600 transition-colors cursor-pointer relative group whitespace-nowrap">
            <HelpCircle className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" /> <span>Aide</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          </div>
        </nav>

        { /* BOUTON PROFIL INTERACTIF */ }
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Menu hamburger mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="relative rounded-full p-0.5 sm:p-1 border-none shadow-md bg-gray-100 hover:bg-gray-200 transition-all">
                { /* Contour lumineux au hover */ }
                <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-blue-500 transition"></div>
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 transition-transform hover:scale-105">
                  <AvatarImage src="/avatar.png" className="rounded-full object-cover" />
                  <AvatarFallback className="flex items-center justify-center bg-blue-500 text-white font-bold text-sm sm:text-base lg:text-lg">
                    { user?.username?.slice(0, 2).toUpperCase() || "?" }
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            { /* MENU DÉROULANT */ }
            <DropdownMenuContent align="end" className="w-48 sm:w-56 shadow-lg border rounded-lg">
              <div className="px-3 sm:px-4 py-2 text-gray-900 font-semibold text-sm sm:text-base truncate">👋 Bonjour, { user?.username || "Expert" } !</div>
              <DropdownMenuItem onClick={ () => handleNavigation(`/profile/expert`) } 
                className="flex items-center px-3 sm:px-4 py-2 hover:bg-gray-100 transition cursor-pointer text-sm sm:text-base">
                <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={ () => handleNavigation("/settings") } 
                className="flex items-center px-3 sm:px-4 py-2 hover:bg-gray-100 transition cursor-pointer text-sm sm:text-base">
                <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={ handleLogout } 
                className="flex items-center px-3 sm:px-4 py-2 text-red-600 hover:bg-red-100 transition cursor-pointer text-sm sm:text-base">
                <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[52px] sm:top-[60px] bg-white shadow-lg z-40 lg:hidden border-t">
          <nav className="flex flex-col p-4 space-y-2">
            <div onClick={() => handleNavigation(`/dashboard/expert/${user?.id || "" }`)} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
              <Briefcase className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-700">Tableau de bord</span>
            </div>
            <div onClick={() => handleNavigation(`/messagerie-expert/${user?.id || "" }`)} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
              <MessageCircle className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-700">Messagerie</span>
            </div>
            <div onClick={() => handleNavigation("/documents-expert")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
              <FileText className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-700">Documents</span>
            </div>
            <div onClick={() => handleNavigation("/demandes-en-attente")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
              <Users className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-700">Demandes</span>
            </div>
            <div onClick={() => handleNavigation("/aide-expert")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
              <HelpCircle className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-700">Aide</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
