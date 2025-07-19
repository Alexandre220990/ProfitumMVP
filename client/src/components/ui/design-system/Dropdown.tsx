import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Button from './Button';
import { Card, CardContent } from './Card';
import Badge from './Badge';
import { ChevronDown, Check, Search, Filter } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
  description?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiSelect?: boolean;
  maxHeight?: string;
  className?: string;
  trigger?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export interface DropdownItemProps {
  option: DropdownOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  className?: string;
}

// ============================================================================
// COMPOSANTS PRINCIPAUX
// ============================================================================

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ 
    options, 
    value, 
    onValueChange, 
    placeholder = 'Sélectionner...',
    disabled = false,
    searchable = false,
    multiSelect = false,
    maxHeight = '300px',
    className,
    trigger,
    variant = 'primary',
    size = 'md',
    ...props 
  }) => {
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Fermer le dropdown quand on clique à l'extérieur
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Filtrer les options selon la recherche
    const filteredOptions = searchable 
      ? options.filter(option => 
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;
    
    // Trouver l'option sélectionnée
    const selectedOption = options.find(option => option.value === value);
    
    const handleSelect = (optionValue: string) => {
      if (onValueChange) {
        onValueChange(optionValue);
      }
      if (!multiSelect) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    
    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setSearchQuery('');
        }
      }
    };
    
    return (
      <div ref={dropdownRef} className={cn('relative', className)} {...props}>
        {/* Trigger */}
        {trigger ? (
          <div onClick={handleToggle} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
          <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            disabled={disabled}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              {selectedOption?.icon}
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} />
          </Button>
        )}
        
        {/* Menu */}
        <DropdownMenu 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          maxHeight={maxHeight}
        >
          {searchable && (
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <DropdownItem
                  key={option.value}
                  option={option}
                  isSelected={option.value === value}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">
                Aucune option trouvée
              </div>
            )}
          </div>
        </DropdownMenu>
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ isOpen, onClose, children, className, maxHeight, ...props }, ref) => {
    
    if (!isOpen) return null;
    
    return (
      <Card
        ref={ref}
        className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border border-slate-200',
          'animate-scale-in',
          className
        )}
        {...props}
      >
        <CardContent className="p-0" style={{ maxHeight }}>
          <div className="overflow-y-auto">
            {children}
          </div>
        </CardContent>
      </Card>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ option, isSelected, onSelect, className, ...props }, ref) => {
    
    const handleClick = () => {
      if (!option.disabled) {
        onSelect(option.value);
      }
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'px-3 py-2 cursor-pointer transition-colors duration-150',
          'hover:bg-slate-50',
          isSelected && 'bg-blue-50 text-blue-700',
          option.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {option.icon && (
              <span className="flex-shrink-0">{option.icon}</span>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{option.label}</span>
                {option.badge && (
                  <Badge variant="primary" className="text-xs">
                    {option.badge}
                  </Badge>
                )}
              </div>
              
              {option.description && (
                <p className="text-xs text-slate-500 truncate mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
          
          {isSelected && (
            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

// Dropdown de filtres
export const FilterDropdown = React.forwardRef<HTMLDivElement, DropdownProps & {
  filters: Array<{
    key: string;
    label: string;
    options: DropdownOption[];
  }>;
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}>(
  ({ filters, activeFilters, onFilterChange, ...props }) => {
    
    return (
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Dropdown
            key={filter.key}
            value={activeFilters[filter.key]}
            onValueChange={(value: string) => onFilterChange(filter.key, value)}
            placeholder={filter.label}
            size="sm"
            variant="secondary"
            trigger={
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {filter.label}
                {activeFilters[filter.key] && (
                  <Badge variant="primary" className="text-xs">
                    {activeFilters[filter.key]}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3" />
              </Button>
            }
            {...props}
          />
        ))}
      </div>
    );
  }
);

FilterDropdown.displayName = 'FilterDropdown';

// Dropdown de sélection multiple
export const MultiSelectDropdown = React.forwardRef<HTMLDivElement, DropdownProps & {
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  maxSelected?: number;
}>(
  ({ 
    selectedValues, 
    onSelectionChange, 
    maxSelected,
    placeholder = 'Sélectionner...',
    ...props 
  }, ref) => {
    
    const handleSelect = (value: string) => {
      const newSelection = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : maxSelected && selectedValues.length >= maxSelected
        ? [...selectedValues.slice(1), value]
        : [...selectedValues, value];
      
      onSelectionChange(newSelection);
    };
    
    const selectedOptions = props.options.filter(option => selectedValues.includes(option.value));
    const displayText = selectedOptions.length > 0
      ? `${selectedOptions.length} sélectionné(s)`
      : placeholder;
    
    return (
      <Dropdown
        ref={ref}
        value={selectedValues[0]} // Pour l'affichage, on prend le premier
        onValueChange={handleSelect}
        placeholder={displayText}
        multiSelect={true}
        trigger={
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2">
              {selectedOptions.length > 0 && (
                <Badge variant="primary" className="text-xs">
                  {selectedOptions.length}
                </Badge>
              )}
              {displayText}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        }
        {...props}
      />
    );
  }
);

MultiSelectDropdown.displayName = 'MultiSelectDropdown';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Dropdown,
  DropdownMenu,
  DropdownItem,
}; 