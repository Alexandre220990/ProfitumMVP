import React, { useState } from 'react';
import { Filter, X, Tag, Users, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface ConversationFiltersProps {
  onFilterChange: (filters: ConversationFilters) => void;
  activeFilters: ConversationFilters;
}

export interface ConversationFilters {
  type?: 'expert_client' | 'admin_support' | 'internal';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'active' | 'archived' | 'blocked';
  category?: string;
  access_level?: 'public' | 'private' | 'restricted';
  hasClient?: boolean;
  hasExpert?: boolean;
  hasDossier?: boolean;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

export const ConversationFilters: React.FC<ConversationFiltersProps> = ({
  onFilterChange,
  activeFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = {
    type: [
      { value: 'expert_client', label: 'Expert-Client', icon: '💬' },
      { value: 'admin_support', label: 'Support Admin', icon: '🛠️' },
      { value: 'internal', label: 'Interne', icon: '🏢' }
    ],
    priority: [
      { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
      { value: 'high', label: 'Élevée', color: 'text-orange-600' },
      { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
      { value: 'low', label: 'Faible', color: 'text-green-600' }
    ],
    status: [
      { value: 'active', label: 'Active', color: 'text-green-600' },
      { value: 'archived', label: 'Archivée', color: 'text-gray-600' },
      { value: 'blocked', label: 'Bloquée', color: 'text-red-600' }
    ],
    access_level: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Privé' },
      { value: 'restricted', label: 'Restreint' }
    ],
    dateRange: [
      { value: 'today', label: 'Aujourd\'hui' },
      { value: 'week', label: 'Cette semaine' },
      { value: 'month', label: 'Ce mois' },
      { value: 'all', label: 'Tout' }
    ]
  };

  const handleFilterChange = (key: keyof ConversationFilters, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === 'all' || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(activeFilters).length;
  };

  const getFilterLabel = (key: keyof ConversationFilters, value: any): string => {
    switch (key) {
      case 'type':
        return filterOptions.type.find(opt => opt.value === value)?.label || value;
      case 'priority':
        return filterOptions.priority.find(opt => opt.value === value)?.label || value;
      case 'status':
        return filterOptions.status.find(opt => opt.value === value)?.label || value;
      case 'access_level':
        return filterOptions.access_level.find(opt => opt.value === value)?.label || value;
      case 'dateRange':
        return filterOptions.dateRange.find(opt => opt.value === value)?.label || value;
      default:
        return value;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bouton principal des filtres */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtres
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Filtres</span>
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Effacer
              </Button>
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Type de conversation */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Type de conversation
          </DropdownMenuLabel>
          {filterOptions.type.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('type', 
                activeFilters.type === option.value ? undefined : option.value
              )}
              className="flex items-center gap-2"
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {activeFilters.type === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Priorité */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Priorité
          </DropdownMenuLabel>
          {filterOptions.priority.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('priority', 
                activeFilters.priority === option.value ? undefined : option.value
              )}
              className="flex items-center gap-2"
            >
              <span className={option.color}>●</span>
              <span>{option.label}</span>
              {activeFilters.priority === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Statut */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Statut
          </DropdownMenuLabel>
          {filterOptions.status.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('status', 
                activeFilters.status === option.value ? undefined : option.value
              )}
              className="flex items-center gap-2"
            >
              <span className={option.color}>●</span>
              <span>{option.label}</span>
              {activeFilters.status === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Niveau d'accès */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Niveau d'accès
          </DropdownMenuLabel>
          {filterOptions.access_level.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('access_level', 
                activeFilters.access_level === option.value ? undefined : option.value
              )}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{option.label}</span>
              {activeFilters.access_level === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Période */}
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">
            Période
          </DropdownMenuLabel>
          {filterOptions.dateRange.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleFilterChange('dateRange', 
                activeFilters.dateRange === option.value ? undefined : option.value
              )}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{option.label}</span>
              {activeFilters.dateRange === option.value && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtres actifs affichés */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1 text-xs"
            >
              {getFilterLabel(key as keyof ConversationFilters, value)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange(key as keyof ConversationFilters, undefined)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}; 