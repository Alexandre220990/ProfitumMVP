import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Briefcase, Calendar, MessageSquare, FileText, User, LogOut, Bell, Settings, ChevronDown, Users, Loader2, Clock, Shield, Menu, X } from "lucide-react";
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
  const notificationBadge = useNotificationBadge();
  const badgeUnreadCount = notificationBadge.unreadCount;
  const { hasNotifications } = notificationBadge;
  const { badgeText, shouldShowBadge } = useMessagingBadge();
  const supabaseNotifications = useSupabaseNotifications();
  const notifications = supabaseNotifications.notifications;
  const unreadNotifications = supabaseNotifications.unreadNotifications;
  const supabaseUnreadCount = supabaseNotifications.unreadCount;
  const loading = supabaseNotifications.loading;
  const markAsRead = supabaseNotifications.markAsRead;
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalUnread = supabaseUnreadCount ?? badgeUnreadCount ?? 0;

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

  const handleNotificationClick = async (notification: any) => {
    setNotifOpen(false);
    if (!notification) return;

    if (!notification.is_read && notification.id) {
      await markAsRead(notification.id);
    }

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

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center flex-shrink-0">
            <div 
              onClick={() => navigate(`/dashboard/client/${user?.id}`)} 
              className="cursor-pointer group"
            >
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent select-none">
                Profitum
              </span>
            </div>
          </div>
          {/* NAVIGATION PRINCIPALE - CENTRÉE (Desktop) */}
          <nav className="hidden lg:flex items-center justify-center space-x-1 flex-1 max-w-2xl mx-4 xl:mx-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(`/dashboard/client/${user?.id}`)}
              className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Briefcase className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation("/agenda-client")}
              className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Calendar className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Agenda</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation("/messagerie-client")}
              className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
            >
              <MessageSquare className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Messages</span>
              {shouldShowBadge && (
                <Badge variant="primary" className="absolute -top-1 -right-1 h-4 w-4 xl:h-5 xl:w-5 p-0 flex items-center justify-center text-[10px] xl:text-xs">
                  {badgeText}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation("/documents-client")}
              className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <FileText className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Documents</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation("/marketplace-experts")}
              className="flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Users className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Marketplace</span>
            </Button>
          </nav>
          {/* ACTIONS UTILISATEUR - Compactes */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              aria-label="Ouvrir le centre de notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {(hasNotifications || totalUnread > 0) && (
                <Badge variant="primary" className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </Badge>
              )}
            </Button>
            {/* Menu hamburger mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {/* Menu utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  <div className="w-7 h-7 xl:w-8 xl:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs xl:text-sm font-semibold flex-shrink-0">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:block">{user?.username || 'Utilisateur'}</span>
                  <ChevronDown className="h-3.5 w-3.5 xl:h-4 xl:w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuItem 
                  onClick={() => handleNavigation("/profile/client")}
                  className="cursor-pointer text-sm"
                >
                  <User className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Mon profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleNavigation("/settings")}
                  className="cursor-pointer text-sm"
                >
                  <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 top-[56px] sm:top-[64px] bg-white border-b border-slate-200 z-50 lg:hidden shadow-lg">
            <nav className="flex flex-col p-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(`/dashboard/client/${user?.id}`)}
                className="w-full justify-start text-sm"
              >
                <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/agenda-client")}
                className="w-full justify-start text-sm"
              >
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                Agenda
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/messagerie-client")}
                className="w-full justify-start text-sm relative"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                Messages
                {shouldShowBadge && (
                  <Badge variant="primary" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {badgeText}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/documents-client")}
                className="w-full justify-start text-sm"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                Documents
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/marketplace-experts")}
                className="w-full justify-start text-sm"
              >
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                Marketplace
              </Button>
              <div className="pt-2 border-t border-slate-200 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation("/profile/client")}
                  className="w-full justify-start text-sm"
                >
                  <User className="h-4 w-4 mr-2 flex-shrink-0" />
                  Mon profil
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-sm text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  Déconnexion
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* NOTIFICATIONS DROPDOWN */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-label="Fermer le centre de notifications" tabIndex={-1} />
          <div className="absolute top-full right-0 mt-2 w-[90vw] sm:w-96 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500 truncate">
                  {totalUnread > 0 ? `${totalUnread} notification${totalUnread > 1 ? "s" : ""} non lue${totalUnread > 1 ? "s" : ""}` : "Toutes vos notifications sont lues"}
                </p>
              </div>
              <Badge variant="base" className="text-xs flex-shrink-0 ml-2">
                {notifications.length} au total
              </Badge>
            </div>
            <ScrollArea className="max-h-[60vh] sm:max-h-96">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 sm:py-8 text-xs sm:text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                  <span>Chargement des notifications...</span>
                </div>
              ) : unreadNotifications.length === 0 ? (
                <div className="px-3 sm:px-4 py-4 sm:py-6 text-center text-xs sm:text-sm text-gray-500">
                  Pas encore de notification pour le moment, faites progresser vos dossiers pour optimiser vos finances.
                </div>
              ) : (
                <div className="py-2">
                  {unreadNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full px-3 sm:px-4 py-2 sm:py-3 flex items-start gap-2 sm:gap-3 text-left hover:bg-blue-50 transition-colors duration-150",
                        !notification.is_read ? "bg-blue-50/70" : "bg-white"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full flex-shrink-0",
                        !notification.is_read ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotifOpen(false);
                  navigate("/notification-center");
                }}
                className="w-full justify-start text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Voir toutes les notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
