import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Users, 
  Settings, 
  BarChart3,
  Shield,
  Activity,
  TrendingUp,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AgendaNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent?: () => void;
  stats?: {
    total_events?: number;
    pending_events?: number;
    completed_events?: number;
  };
}

export default function AgendaNavigation({ 
  currentDate, 
  onDateChange, 
  onCreateEvent,
  stats 
}: AgendaNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const getCreateButtonConfig = () => {
    switch (user?.type) {
      case 'client':
        return {
          label: 'Nouvel événement',
          icon: Plus,
          color: 'bg-blue-600 hover:bg-blue-700',
          onClick: onCreateEvent
        };
      case 'expert':
        return {
          label: 'Nouvelle consultation',
          icon: Plus,
          color: 'bg-green-600 hover:bg-green-700',
          onClick: onCreateEvent
        };
      case 'admin':
        return {
          label: 'Nouvel événement système',
          icon: Plus,
          color: 'bg-purple-600 hover:bg-purple-700',
          onClick: onCreateEvent
        };
      default:
        return {
          label: 'Nouvel événement',
          icon: Plus,
          color: 'bg-gray-600 hover:bg-gray-700',
          onClick: onCreateEvent
        };
    }
  };

  const getQuickStats = () => {
    if (!stats) return null;

    switch (user?.type) {
      case 'client':
        return (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{stats.total_events || 0} événements</span>
            </div>
            {stats.pending_events && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{stats.pending_events} en attente</span>
              </div>
            )}
          </div>
        );
      case 'expert':
        return (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{stats.total_events || 0} consultations</span>
            </div>
            {stats.completed_events && (
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>{stats.completed_events} terminées</span>
              </div>
            )}
          </div>
        );
      case 'admin':
        return (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>{stats.total_events || 0} événements système</span>
            </div>
            {stats.pending_events && (
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>{stats.pending_events} en attente</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getNavigationColor = () => {
    switch (user?.type) {
      case 'client':
        return 'text-blue-600 border-blue-200 hover:bg-blue-50';
      case 'expert':
        return 'text-green-600 border-green-200 hover:bg-green-50';
      case 'admin':
        return 'text-purple-600 border-purple-200 hover:bg-purple-50';
      default:
        return 'text-gray-600 border-gray-200 hover:bg-gray-50';
    }
  };

  const createButtonConfig = getCreateButtonConfig();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className={getNavigationColor()}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Aujourd'hui
            </Button>
          </div>

          {/* Navigation par date */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="hover:bg-gray-100"
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="hover:bg-gray-100"
            >
              →
            </Button>
          </div>

          {/* Stats rapides */}
          {getQuickStats()}
        </div>

        <div className="flex items-center space-x-3">
          {/* Bouton de création */}
          {createButtonConfig && (
            <Button 
              className={createButtonConfig.color}
              onClick={createButtonConfig.onClick}
            >
              <createButtonConfig.icon className="w-4 h-4 mr-2" />
              {createButtonConfig.label}
            </Button>
          )}

          {/* Bouton retour au dashboard */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              switch (user?.type) {
                case 'client':
                  navigate('/dashboard');
                  break;
                case 'expert':
                  navigate('/expert');
                  break;
                case 'admin':
                  navigate('/admin/dashboard-optimized');
                  break;
                default:
                  navigate('/');
              }
            }}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
} 