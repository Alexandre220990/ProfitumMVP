import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Database,
  Users,
  UserCheck,
  FolderOpen,
  Package,
  CheckCircle,
  Monitor,
  BookOpen,
  UserPlus,
  FileUp,
  Terminal,
  Zap,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  User,
  Shield
} from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
  badge?: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // États pour les badges dynamiques
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingValidations, setPendingValidations] = useState(0);
  const [pendingExperts, setPendingExperts] = useState(0);
  const [blockedDossiers, setBlockedDossiers] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Charger les compteurs de badges
  useEffect(() => {
    loadBadgeCounts();
  }, []);

  const loadBadgeCounts = async () => {
    try {
      // TODO: Implémenter les appels API réels
      // Pour l'instant, simulation
      setUnreadMessages(12);
      setPendingValidations(7);
      setPendingExperts(4);
      setBlockedDossiers(2);
      setNotificationsCount(10);
    } catch (error) {
      console.error('Erreur chargement badges:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navigation: NavigationItem[] = [
    // Principal
    {
      name: 'Dashboard',
      href: '/admin/dashboard-optimized',
      icon: LayoutDashboard,
      current: location.pathname.includes('/admin/dashboard')
    },
    {
      name: 'Agenda',
      href: '/admin/agenda-admin',
      icon: Calendar,
      current: location.pathname.includes('/admin/agenda')
    },
    {
      name: 'Messagerie',
      href: '/admin/messagerie-admin',
      icon: MessageSquare,
      current: location.pathname.includes('/admin/messagerie'),
      badge: unreadMessages
    },
    {
      name: 'Documents & GED',
      href: '/admin/documents-ged',
      icon: Database,
      current: location.pathname.includes('/admin/documents-ged')
    },
    
    // Gestion
    {
      name: 'Produits',
      href: '/admin/gestion-produits',
      icon: Package,
      current: location.pathname === '/admin/gestion-produits'
    },
    
    // Outils
    {
      name: 'Validation',
      href: '/admin/validation-dashboard',
      icon: CheckCircle,
      current: location.pathname === '/admin/validation-dashboard',
      badge: pendingValidations
    },
    {
      name: 'Monitoring',
      href: '/admin/monitoring',
      icon: Monitor,
      current: location.pathname === '/admin/monitoring'
    },
    {
      name: 'Formulaire Expert',
      href: '/admin/formulaire-expert',
      icon: UserPlus,
      current: location.pathname === '/admin/formulaire-expert'
    },
    
    // Système / Dev
    {
      name: 'Terminal Tests',
      href: '/admin/terminal-tests',
      icon: Terminal,
      current: location.pathname === '/admin/terminal-tests'
    },
    {
      name: 'Tests',
      href: '/admin/tests',
      icon: Zap,
      current: location.pathname === '/admin/tests'
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
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Administration</p>
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
                          ? 'bg-red-100 text-red-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md w-full text-left relative`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto min-w-[20px] h-[20px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1.5 flex-shrink-0">
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
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Administration</p>
                  </div>
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`${
                        item.current
                          ? 'bg-red-100 text-red-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full text-left relative`}
                    >
                      <div className="flex items-center min-w-0">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs text-white flex items-center justify-center px-1 flex-shrink-0">
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
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 lg:hidden"
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
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <button
                type="button"
                className="relative bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                      <p className="text-gray-500">{user?.email}</p>
                      <Badge className="mt-1 bg-red-100 text-red-800">Administrateur</Badge>
                    </div>
                    <button
                      onClick={() => navigate('/settings')}
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

