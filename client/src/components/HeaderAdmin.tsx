import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Users, FileText, HelpCircle, BarChart, MessageSquare, Bell } from "lucide-react";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";

export default function HeaderAdmin() { 
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, hasNotifications } = useNotificationBadge();

  const handleLogout = async () => { 
    await logout();
    navigate("/"); 
  };

  return (
    <header className="bg-white shadow-md py-4 px-8 flex justify-between items-center fixed top-0 left-0 right-0 w-full z-50">
      {/* LOGO PROFITUM */}
      <div onClick={() => navigate("/admin")} className="cursor-pointer">
        <img src="/profitum_logo_texte.png" alt="Logo Profitum" className="h-14 cursor-pointer transition-transform hover:scale-105" />
      </div>
      {/* NAVIGATION ADMIN */}
      <nav className="flex space-x-10 text-gray-700 font-semibold text-lg">
        <div onClick={() => navigate("/admin")} className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
          <BarChart className="h-5 w-5" /> <span>Tableau de bord</span>
        </div>
        <div onClick={() => navigate("/admin/gestion-clients")} className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
          <Users className="h-5 w-5" /> <span>Utilisateurs</span>
        </div>
        <div onClick={() => navigate("/admin/gestion-dossiers")} className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
          <FileText className="h-5 w-5" /> <span>Documents</span>
        </div>
        <div onClick={() => navigate("/admin/monitoring")} className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
          <HelpCircle className="h-5 w-5" /> <span>Monitoring</span>
        </div>
        <div onClick={() => navigate("/admin/messagerie-admin")} className="flex items-center space-x-2 hover:text-blue-600 transition-colors cursor-pointer">
          <MessageSquare className="h-5 w-5" /> <span>Messagerie</span>
        </div>
      </nav>
      {/* BOUTON PROFIL INTERACTIF + NOTIFICATIONS */}
      <div className="flex items-center space-x-4">
        {/* Centre de notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/notification-center')}
          className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          aria-label="Ouvrir le centre de notifications"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="relative rounded-full p-1 border-none shadow-md bg-gray-100 hover:bg-gray-200 transition-all">
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
            <div className="px-4 py-2 text-gray-900 font-semibold">👋 Bonjour, {user?.username || "Admin"} !</div>
            <DropdownMenuItem onClick={() => navigate("/admin/gestion-experts")} className="flex items-center px-4 py-2 hover:bg-gray-100 transition cursor-pointer">
              <User className="mr-2 h-5 w-5" /> <span>Gestion Experts</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/validation-dashboard")} className="flex items-center px-4 py-2 hover:bg-gray-100 transition cursor-pointer">
              <Settings className="mr-2 h-5 w-5" /> <span>Validation</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="flex items-center px-4 py-2 text-red-600 hover:bg-red-100 transition cursor-pointer">
              <LogOut className="mr-2 h-5 w-5" /> <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
} 