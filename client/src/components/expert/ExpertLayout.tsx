import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useMessagingBadge } from '@/hooks/use-messaging-badge';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { useFCMNotifications } from '@/hooks/useFCMNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Badge } from '@/components/ui/badge';
import { TypeSwitcher } from '@/components/TypeSwitcher';
import { 
  LayoutDashboard,
  Briefcase,
  Calendar,
  MessageSquare,
  TrendingUp,
  User,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Target
} from 'lucide-react';

interface ExpertLayoutProps {
  children?: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
  badge?: number;
}

export default function ExpertLayout({ children }: ExpertLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { badgeCount } = useMessagingBadge();
  const { unreadCount: notificationsCount } = useSupabaseNotifications();

  // 🔔 Activer les notifications en temps réel avec toasts
  useFCMNotifications();
  useRealtimeNotifications();

  // États pour les badges dynamiques
  const [pendingAffaires] = useState(0);
  const [todayMeetings] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navigation: NavigationItem[] = [
    // Principal
    {
      name: 'Dashboard',
      href: `/dashboard/expert/${user?.id || ''}`,
      icon: LayoutDashboard,
      current: location.pathname.includes('/dashboard/expert') || location.pathname.includes('/expert/dashboard')
    },
    {
      name: 'Mes Affaires',
      href: '/expert/mes-affaires',
      icon: Briefcase,
      current: location.pathname === '/expert/mes-affaires',
      badge: pendingAffaires
    },
    {
      name: 'Agenda',
      href: '/expert/agenda',
      icon: Calendar,
      current: location.pathname.includes('/expert/agenda'),
      badge: todayMeetings
    },
    
    // Outils
    {
      name: 'Messagerie',
      href: '/expert/messagerie',
      icon: MessageSquare,
      current: location.pathname.includes('/expert/messagerie'),
      badge: badgeCount > 0 ? badgeCount : undefined
    },
    {
      name: 'Notifications',
      href: '/notification-center',
      icon: Bell,
      current: location.pathname === '/notification-center',
      badge: notificationsCount > 0 ? notificationsCount : undefined
    },
    {
      name: 'Analytics',
      href: '/expert/analytics',
      icon: TrendingUp,
      current: location.pathname === '/expert/analytics'
    },
    
    // Compte
    {
      name: 'Profil',
      href: '/expert/profile/expert',
      icon: User,
      current: location.pathname === '/expert/profile/expert'
    },
    {
      name: 'Aide',
      href: '/expert/aide-expert',
      icon: HelpCircle,
      current: location.pathname === '/expert/aide-expert'
    },
    {
      name: 'Ajouter un lead',
      href: '/expert/ajouter-lead',
      icon: Target,
      current: location.pathname === '/expert/ajouter-lead'
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Espace Expert</p>
                  </div>
                </div>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`${
                        item.current
                          ? 'bg-purple-100 text-purple-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md w-full text-left relative`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-4 h-6 w-6" />
                        {item.name}
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1.5">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:z-40">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-screen flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Espace Expert</p>
                  </div>
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`${
                        item.current
                          ? 'bg-purple-100 text-purple-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full text-left relative`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="sr-only">Rechercher</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              {/* TypeSwitcher */}
              <TypeSwitcher />

              {/* Notifications */}
              <button
                type="button"
                className="relative bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Bell className="h-6 w-6" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {user?.name || `${user?.first_name} ${user?.last_name}`}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.name || `${user?.first_name} ${user?.last_name}`}</p>
                      <p className="text-gray-500">{user?.email}</p>
                      <Badge className="mt-1 bg-purple-100 text-purple-800">Expert</Badge>
                    </div>
                    <button
                      onClick={() => navigate('/expert/profile/expert')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Paramètres
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

