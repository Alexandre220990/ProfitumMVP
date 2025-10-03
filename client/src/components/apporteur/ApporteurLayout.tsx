import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import ApporteurAuthGuard from './ApporteurAuthGuard';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  Building,
  User,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

interface ApporteurLayoutProps {
  children?: React.ReactNode;
}

export default function ApporteurLayout({ children }: ApporteurLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Utiliser le contexte d'authentification au lieu de localStorage
  const { user } = useAuth();
  const userData = user || {} as any;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    navigate('/apporteur/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/apporteur/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/apporteur/dashboard'
    },
    {
      name: 'Prospects',
      href: '/apporteur/prospects',
      icon: Users,
      current: location.pathname.startsWith('/apporteur/prospects')
    },
    {
      name: 'Pipeline',
      href: '/apporteur/kanban',
      icon: BarChart3,
      current: location.pathname.startsWith('/apporteur/kanban')
    },
    {
      name: 'Rendez-vous',
      href: '/apporteur/meetings',
      icon: Calendar,
      current: location.pathname.startsWith('/apporteur/meetings')
    },
    {
      name: 'Experts',
      href: '/apporteur/experts',
      icon: Building,
      current: location.pathname.startsWith('/apporteur/experts')
    },
    {
      name: 'Produits',
      href: '/apporteur/products',
      icon: DollarSign,
      current: location.pathname.startsWith('/apporteur/products')
    },
    {
      name: 'Messagerie',
      href: '/apporteur/messaging',
      icon: MessageSquare,
      current: location.pathname.startsWith('/apporteur/messaging')
    },
    {
      name: 'Agenda',
      href: '/apporteur/agenda',
      icon: Calendar,
      current: location.pathname.startsWith('/apporteur/agenda')
    },
    {
      name: 'Commissions',
      href: '/apporteur/commissions',
      icon: DollarSign,
      current: location.pathname.startsWith('/apporteur/commissions')
    },
    {
      name: 'Statistiques',
      href: '/apporteur/statistics',
      icon: BarChart3,
      current: location.pathname.startsWith('/apporteur/statistics')
    },
    {
      name: 'Notifications',
      href: '/apporteur/notifications',
      icon: Bell,
      current: location.pathname.startsWith('/apporteur/notifications')
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  return (
    <ApporteurAuthGuard>
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
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Apporteur d'Affaires</p>
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
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left`}
                    >
                      <Icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900">Profitum</p>
                    <p className="text-sm text-gray-500">Apporteur d'Affaires</p>
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
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
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
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* User Menu */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {userData.first_name} {userData.last_name}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{userData.first_name} {userData.last_name}</p>
                      <p className="text-gray-500">{userData.email}</p>
                      <Badge className="mt-1 bg-blue-100 text-blue-800">Apporteur d'Affaires</Badge>
                    </div>
                    <button
                      onClick={() => navigate('/apporteur/settings')}
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
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
    </ApporteurAuthGuard>
  );
}
