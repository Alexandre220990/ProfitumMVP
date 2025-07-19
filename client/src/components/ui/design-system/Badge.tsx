import React from 'react';
import { cn } from '@/lib/utils';
import { getBadgeClass, BadgeVariant } from '@/config/design-system';

// ============================================================================
// TYPES
// ============================================================================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    variant = 'primary', 
    size = 'md',
    icon, 
    iconPosition = 'left',
    children, 
    className,
    removable = false,
    onRemove,
    ...props 
  }, ref) => {
    
    // Classes de base
    const baseClasses = getBadgeClass(variant);
    
    // Classes de taille
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };
    
    // Classes finales
    const badgeClasses = cn(
      baseClasses,
      sizeClasses[size],
      removable && 'pr-2',
      className
    );
    
    // Gestion de la suppression
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRemove) onRemove();
    };
    
    return (
      <span
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0 mr-1">{icon}</span>
        )}
        <span className="flex-shrink-0">{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0 ml-1">{icon}</span>
        )}
        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Supprimer"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

// Badge avec icône
export const BadgeWithIcon = React.forwardRef<HTMLSpanElement, BadgeProps & { icon: React.ReactNode }>(
  ({ icon, children, ...props }, ref) => (
    <Badge ref={ref} icon={icon} iconPosition="left" {...props}>
      {children}
    </Badge>
  )
);

BadgeWithIcon.displayName = 'BadgeWithIcon';

// Badge de statut
export const StatusBadge = React.forwardRef<HTMLSpanElement, BadgeProps & {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'completed' | 'failed';
}>(
  ({ status, children, ...props }, ref) => {
    const statusConfig = {
      online: { variant: 'success' as const, icon: '🟢' },
      offline: { variant: 'error' as const, icon: '🔴' },
      away: { variant: 'warning' as const, icon: '🟡' },
      busy: { variant: 'error' as const, icon: '🔴' },
      pending: { variant: 'warning' as const, icon: '⏳' },
      completed: { variant: 'success' as const, icon: '✅' },
      failed: { variant: 'error' as const, icon: '❌' },
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge ref={ref} variant={config.variant} icon={config.icon} {...props}>
        {children || status}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Badge de notification
export const NotificationBadge = React.forwardRef<HTMLSpanElement, Omit<BadgeProps, 'children'> & {
  count: number;
  maxCount?: number;
}>(
  ({ count, maxCount = 99, ...props }, ref) => {
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
    
    return (
      <Badge ref={ref} variant="error" {...props}>
        {displayCount}
      </Badge>
    );
  }
);

NotificationBadge.displayName = 'NotificationBadge';

// Badge de catégorie
export const CategoryBadge = React.forwardRef<HTMLSpanElement, BadgeProps & {
  category: string;
  color?: string;
}>(
  ({ category, color, children, ...props }, ref) => {
    const categoryColors: Record<string, string> = {
      finance: 'bg-blue-50 text-blue-700 border-blue-200',
      legal: 'bg-purple-50 text-purple-700 border-purple-200',
      marketing: 'bg-green-50 text-green-700 border-green-200',
      technology: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      health: 'bg-red-50 text-red-700 border-red-200',
      education: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };
    
    const customClasses = color || categoryColors[category.toLowerCase()] || categoryColors.finance;
    
    return (
      <Badge 
        ref={ref} 
        className={cn('px-3 py-1 text-sm font-medium border', customClasses)}
        {...props}
      >
        {children || category}
      </Badge>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';

// Badge de priorité
export const PriorityBadge = React.forwardRef<HTMLSpanElement, BadgeProps & {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}>(
  ({ priority, children, ...props }, ref) => {
    const priorityConfig = {
      low: { variant: 'success' as const, icon: '🔵' },
      medium: { variant: 'warning' as const, icon: '🟡' },
      high: { variant: 'error' as const, icon: '🟠' },
      urgent: { variant: 'error' as const, icon: '🔴' },
    };
    
    const config = priorityConfig[priority];
    
    return (
      <Badge ref={ref} variant={config.variant} icon={config.icon} {...props}>
        {children || priority}
      </Badge>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';

// Badge de version
export const VersionBadge = React.forwardRef<HTMLSpanElement, BadgeProps & {
  version: string;
  type?: 'stable' | 'beta' | 'alpha' | 'dev';
}>(
  ({ version, type = 'stable', children, ...props }, ref) => {
    const typeConfig = {
      stable: { variant: 'success' as const },
      beta: { variant: 'warning' as const },
      alpha: { variant: 'error' as const },
      dev: { variant: 'primary' as const },
    };
    
    const config = typeConfig[type];
    
    return (
      <Badge ref={ref} variant={config.variant} {...props}>
        {children || `v${version}`}
      </Badge>
    );
  }
);

VersionBadge.displayName = 'VersionBadge';

// ============================================================================
// COMPOSANT DE GROUPE DE BADGES
// ============================================================================

export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  wrap?: boolean;
  className?: string;
}

export const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ children, gap = 'md', wrap = true, className, ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    };
    
    const groupClasses = cn(
      'flex items-center',
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    );
    
    return (
      <div ref={ref} className={groupClasses} {...props}>
        {children}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

// ============================================================================
// EXPORTS
// ============================================================================

export default Badge; 