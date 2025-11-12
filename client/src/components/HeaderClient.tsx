import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MessageSquare, FileText, User, LogOut, Bell, Settings, ChevronDown, Users, Loader2, Clock, Shield } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import Badge from "@/components/ui/design-system/Badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import { useMessagingBadge } from "@/hooks/use-messaging-badge";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { cn } from "@/lib/utils";

interface HeaderClientProps {
  onLogout?: () => void;
}

export default function HeaderClient({ onLogout }: HeaderClientProps) { 
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, hasNotifications } = useNotificationBadge();
  const { badgeText, shouldShowBadge } = useMessagingBadge();
  const { notifications, loading } = useSupabaseNotifications();
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

  const handleNotificationClick = (notification: any) => {
    setNotifOpen(false);
    if (!notification) return;

    const actionUrl = notification.action_url || "/notification-center";
    navigate(actionUrl);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "calendar_event_created":
      case "calendar_event_updated":
      case "calendar_event_reminder":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "message_received":
      case "message_urgent":
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case "deadline_reminder":
      case "validation_reminder":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "document_uploaded":
      case "document_validated":
      case "document_rejected":
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case "expert_assignment":
      case "expert_approved":
        return <Users className="h-4 w-4 text-green-600" />;
      case "system_alert":
      case "security_alert":
        return <Shield className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatNotificationDate = (date: string) => {
    try {
      return new Date(date).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
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
            {shouldShowBadge && (
              <Badge variant="primary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {badgeText}
              </Badge>
            )}
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
                {unreadCount > 99 ? "99+" : unreadCount}
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
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-label="Fermer le centre de notifications" tabIndex={-1} />
          <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes vos notifications sont lues"}
                </p>
              </div>
              <Badge variant="base" className="text-xs">
                {notifications.length} au total
              </Badge>
            </div>
            <ScrollArea className="max-h-96">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Pas encore de notification pour le moment, faites progresser vos dossiers pour optimiser vos finances.
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-blue-50 transition-colors duration-150",
                        !notification.is_read ? "bg-blue-50/70" : "bg-white"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        !notification.is_read ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotifOpen(false);
                  navigate("/notification-center");
                }}
                className="w-full justify-start text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Voir toutes les notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
