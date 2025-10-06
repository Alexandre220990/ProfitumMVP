import { useState } from 'react';
import { Search, Filter, Calendar, Users, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface SearchAndFiltersProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterState) => void;
  placeholder?: string;
}

interface FilterState {
  period: string;
  status: string[];
  type: string[];
}

export function SearchAndFilters({ 
  onSearch, 
  onFilter, 
  placeholder = "Rechercher..." 
}: SearchAndFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    period: 'all',
    status: [],
    type: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const toggleStatusFilter = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange('status', newStatus);
  };

  const toggleTypeFilter = (type: string) => {
    const newType = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];
    handleFilterChange('type', newType);
  };

  const clearFilters = () => {
    const clearedFilters = {
      period: 'all',
      status: [],
      type: []
    };
    setFilters(clearedFilters);
    onFilter?.(clearedFilters);
  };

  const activeFiltersCount = filters.status.length + filters.type.length + (filters.period !== 'all' ? 1 : 0);

  return (
    <div className="mb-6">
      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtre par période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Période
              </label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <div className="space-y-2">
                {['actif', 'inactif', 'en_attente', 'completed'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtre par type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Type
              </label>
              <div className="space-y-2">
                {['prospect', 'client', 'dossier', 'commission'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.type.includes(type)}
                      onChange={() => toggleTypeFilter(type)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions des filtres */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              Effacer les filtres
            </Button>
            <div className="text-sm text-gray-500">
              {activeFiltersCount} filtre(s) actif(s)
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.period !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Période: {filters.period}
              <button
                onClick={() => handleFilterChange('period', 'all')}
                className="ml-1 text-xs hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              {status}
              <button
                onClick={() => toggleStatusFilter(status)}
                className="ml-1 text-xs hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.type.map((type) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              {type}
              <button
                onClick={() => toggleTypeFilter(type)}
                className="ml-1 text-xs hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
