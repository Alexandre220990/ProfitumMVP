import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserCircle, Menu, X } from "lucide-react";

export default function PublicHeader() { 
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔥 Gestion du scroll vers les sections avec hash
  const handleNavClick = (path: string, hash?: string) => {
    navigate(path);
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200/60 shadow-sm backdrop-blur-sm sticky top-0 z-50">
      {/* Container principal avec padding responsive */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
          {/* Logo - Toujours visible */}
          <Link to="/home" className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0 z-50">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Profitum
            </span>
          </Link>

          {/* Navigation Desktop - Masquée sur mobile */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <button
              onClick={() => handleNavClick('/home', 'services')}
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group whitespace-nowrap"
            >
              Nos Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <Link 
              to="/experts-verifies" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group whitespace-nowrap"
            >
              Nos Experts
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/become-apporteur" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group whitespace-nowrap"
            >
              Devenir apporteur
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/contact" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group whitespace-nowrap"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Bouton Connexion Desktop - Masqué sur mobile */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 flex items-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md whitespace-nowrap">
                  <UserCircle className="mr-2 w-4 h-4" /> Connexion
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => navigate("/connexion-client")}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  Client
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/connexion-expert")}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  Partenaire
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/connexion-apporteur")}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  Apporteur d'affaires
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bouton Menu Burger - Visible uniquement sur mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors z-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Menu Mobile - Slide down avec animation */}
          {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-6 space-y-4">
              <button
                onClick={() => handleNavClick('/home', 'services')}
                className="block w-full text-left py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Nos Services
              </button>
              <Link 
                to="/experts-verifies" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Nos Experts
              </Link>
              <Link 
                to="/become-apporteur" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Devenir apporteur
              </Link>
              <Link 
                to="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                Contact
              </Link>
              
              {/* Boutons de connexion en mobile */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <button 
                  onClick={() => { navigate("/connexion-client"); setMobileMenuOpen(false); }}
                  className="w-full py-3 px-4 text-center bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
                >
                  Connexion Client
                </button>
                <button 
                  onClick={() => { navigate("/connexion-expert"); setMobileMenuOpen(false); }}
                  className="w-full py-3 px-4 text-center bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  Connexion Partenaire
                </button>
                <button 
                  onClick={() => { navigate("/connexion-apporteur"); setMobileMenuOpen(false); }}
                  className="w-full py-3 px-4 text-center bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all duration-200"
                >
                  Connexion Apporteur
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 