import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MessageSquare, FileText, User, LogOut, Bell, Settings, ChevronDown, Users } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import Badge from "@/components/ui/design-system/Badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";

interface HeaderClientProps {
  onLogout?: () => void;
}

export default function HeaderClient({ onLogout }: HeaderClientProps) { 
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, hasNotifications } = useNotificationBadge();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => { 
    try {
      await logout();
      if (onLogout) {
        onLogout(); 
      } else { 
        navigate("/"); 
      }
    } catch (error) {}
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center">
          <div 
            onClick={() => navigate(`/dashboard/client/${user?.id}`)} 
            className="cursor-pointer group"
          >
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent select-none">
              Profitum
            </span>
          </div>
        </div>
        {/* NAVIGATION PRINCIPALE - CENTRÉE */}
        <nav className="hidden md:flex items-center justify-center space-x-1 flex-1 max-w-2xl mx-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/dashboard/client/${user?.id}`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Briefcase className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/agenda-client")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Calendar className="h-4 w-4" />
            <span>Agenda</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/messagerie-client")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
            <Badge variant="primary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/documents-client")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/marketplace-experts")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span>Marketplace</span>
          </Button>
        </nav>
        {/* ACTIONS UTILISATEUR - Compactes */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            aria-label="Ouvrir le centre de notifications"
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <Badge variant="primary" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{user?.username || 'Utilisateur'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => handleNavigation("/profile/client")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigation("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setNotifOpen(false)} aria-label="Fermer le centre de notifications" tabIndex={-1} />
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notifications</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Aucune nouvelle notification'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/notification-center');
                  }}
                  className="w-full justify-start"
                >
                  Voir toutes les notifications
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
