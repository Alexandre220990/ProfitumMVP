import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { DocumentFilters } from "@/types/client-documents";

interface DocumentSearchProps { 
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  onClearFilters: () => void 
}

export default function DocumentSearch({ filters, onFiltersChange, onClearFilters }: DocumentSearchProps) { 
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => { 
    onFiltersChange({ ...filters, status: value === 'all' ? undefined : value });
  };

  const handleDateFromChange = (value: string) => { 
    onFiltersChange({ ...filters, dateFrom: value });
  };

  const handleDateToChange = (value: string) => { 
    onFiltersChange({ ...filters, dateTo: value });
  };

  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher dans vos documents..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtres avancés */}
      {isExpanded && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Filtres avancés</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="signée">Signée</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="finalisé">Finalisé</SelectItem>
                  <SelectItem value="validé">Validé</SelectItem>
                  <SelectItem value="complétée">Complétée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filtre par date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 