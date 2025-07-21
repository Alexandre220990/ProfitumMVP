import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";

export default function PublicHeader() { 
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-slate-200/60 shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        <div className="flex items-center space-x-8">
          <Link to="/home" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Profitum
            </span>
          </Link>
          <div className="flex space-x-8">
            <Link 
              to="/home#services" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group"
            >
              Nos Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/experts-verifies" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group"
            >
              Nos Experts
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/tarifs" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group"
            >
              Tarifs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/contact" 
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200 font-medium relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 flex items-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 