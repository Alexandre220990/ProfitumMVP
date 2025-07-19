import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useMessagingBadge } from '@/hooks/use-messaging-badge';
import { 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Home,
  BarChart3,
  FolderOpen,
  Globe
} from 'lucide-react';
import Button from '@/components/ui/design-system/Button';
import Badge from '@/components/ui/design-system/Badge';

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  category: 'main' | 'tools' | 'account';
}

export default function ClientNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { badgeText } = useMessagingBadge();
  const [isExpanded, setIsExpanded] = useState(false);

  const navigationItems: NavigationItem[] = [
    // Navigation principale
    {
      label: 'Tableau de bord',
      path: `/dashboard/client/${user?.id}`,
      icon: Home,
      description: 'Vue d\'ensemble de vos dossiers',
      category: 'main'
    },
    {
      label: 'Mes Audits',
      path: '/dashboard/client-assignments',
      icon: BarChart3,
      description: 'Suivi de vos audits en cours',
      category: 'main'
    },
    {
      label: 'Agenda',
      path: '/agenda-client',
      icon: Calendar,
      description: 'Gérez vos rendez-vous',
      category: 'main'
    },
    {
      label: 'Google Calendar',
      path: '/google-calendar-integration',
      icon: Globe,
      description: 'Synchronisez avec Google Calendar',
      category: 'main'
    },
    
    // Outils
    {
      label: 'Messagerie',
      path: '/messagerie',
      icon: MessageSquare,
      badge: badgeText || undefined, // Nombre de messages non lus dynamique
      description: 'Communiquez avec vos experts',
      category: 'tools'
    },
    {
      label: 'Documents',
      path: '/documents-client',
      icon: FileText,
      description: 'Accédez à vos documents',
      category: 'tools'
    },
    {
      label: 'Dossiers',
      path: '/dossier-client',
      icon: FolderOpen,
      description: 'Gérez vos dossiers',
      category: 'tools'
    },
    
    // Compte
    {
      label: 'Profil',
      path: '/profile/client',
      icon: User,
      description: 'Gérez vos informations',
      category: 'account'
    },
    {
      label: 'Paramètres',
      path: '/settings',
      icon: Settings,
      description: 'Configurez vos préférences',
      category: 'account'
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getCategoryItems = (category: NavigationItem['category']) => {
    return navigationItems.filter(item => item.category === category);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const IconComponent = item.icon;
    const active = isActive(item.path);
    
    return (
      <div
        key={item.path}
        className={`group relative transition-all duration-300 ${
          active ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'
        } border-l-4 rounded-r-lg`}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(item.path)}
          className={`w-full justify-start gap-3 p-4 h-auto text-left transition-all duration-300 ${
            active 
              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' 
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <IconComponent className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
          }`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="primary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className={`text-xs mt-1 truncate transition-colors duration-200 ${
                active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
              }`}>
                {item.description}
              </p>
            )}
          </div>
        </Button>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Espace Client</h2>
            <p className="text-sm text-slate-500">Bienvenue, {user?.username}</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-slate-600 hover:text-slate-900"
        >
          <span className="text-sm">Navigation</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} />
        </Button>
      </div>

      {/* Navigation principale */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section principale */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            Navigation principale
          </h3>
          <div className="space-y-1">
            {getCategoryItems('main').map(renderNavigationItem)}
          </div>
        </div>

        {/* Section outils */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            Outils
          </h3>
          <div className="space-y-1">
            {getCategoryItems('tools').map(renderNavigationItem)}
          </div>
        </div>

        {/* Section compte */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            Compte
          </h3>
          <div className="space-y-1">
            {getCategoryItems('account').map(renderNavigationItem)}
          </div>
        </div>
      </div>

      {/* Footer avec déconnexion */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span>Se déconnecter</span>
        </Button>
      </div>
    </div>
  );
} 