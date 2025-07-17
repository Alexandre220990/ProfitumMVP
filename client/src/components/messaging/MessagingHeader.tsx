import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Settings, 
  MessageSquare, 
  Filter 
} from "lucide-react";

interface MessagingHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSettingsClick: () => void;
  unreadCount?: number;
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

// Optimisation : Composant de filtre optimisé avec React.memo
const FilterButton = React.memo(({ 
  label, 
  isActive, 
  onClick, 
  icon 
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <Button 
    variant={isActive ? "default" : "ghost"} 
    size="sm" 
    className="h-7 text-xs"
    onClick={onClick}
  >
    {icon}
    {label}
  </Button>
));

FilterButton.displayName = 'FilterButton';

export const MessagingHeader: React.FC<MessagingHeaderProps> = React.memo(({ 
  searchQuery, 
  onSearchChange, 
  onSettingsClick, 
  unreadCount = 0,
  onFilterChange,
  activeFilter = 'all'
}) => {
  // Optimisation : Gestion de la recherche avec useCallback
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // Optimisation : Gestion des filtres avec useCallback
  const handleFilterClick = useCallback((filter: string) => {
    onFilterChange?.(filter);
  }, [onFilterChange]);

  // Optimisation : Filtres avec useMemo
  const filters = useMemo(() => [
    { id: 'all', label: 'Tous', icon: <Filter className="h-3 w-3 mr-1" /> },
    { id: 'unread', label: 'Non lus', icon: null },
    { id: 'favorites', label: 'Favoris', icon: null }
  ], []);

  // Optimisation : Badge unread avec useMemo
  const unreadBadge = useMemo(() => {
    if (unreadCount <= 0) return null;
    
    return (
      <Badge variant="destructive" className="ml-2">
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    );
  }, [unreadCount]);

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {/* Titre et actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Messagerie</h2>
          {unreadBadge}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="h-8 w-8 p-0"
            aria-label="Paramètres de messagerie"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Rechercher des conversations..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4 h-9"
          aria-label="Rechercher des conversations"
        />
      </div>

      {/* Filtres rapides */}
      <div className="flex items-center space-x-2 mt-3">
        {filters.map((filter) => (
          <FilterButton
            key={filter.id}
            label={filter.label}
            isActive={activeFilter === filter.id}
            onClick={() => handleFilterClick(filter.id)}
            icon={filter.icon}
          />
        ))}
      </div>
    </div>
  );
});

MessagingHeader.displayName = 'MessagingHeader'; 