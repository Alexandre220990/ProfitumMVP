import React from 'react';
import { cn } from '@/lib/utils';
import { getButtonClass, ButtonVariant } from '@/config/design-system';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon, 
    iconPosition = 'left',
    children, 
    className,
    disabled,
    ...props 
  }, ref) => {
    
    // Classes de base
    const baseClasses = getButtonClass(variant);
    
    // Classes de taille
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };
    
    // Classes d'état
    const stateClasses = {
      disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
      loading: 'cursor-wait',
    };
    
    // Classes finales
    const buttonClasses = cn(
      baseClasses,
      sizeClasses[size],
      loading && stateClasses.loading,
      (disabled || loading) && stateClasses.disabled,
      className
    );
    
    // Contenu du bouton
    const buttonContent = (
      <>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        <span className="flex-shrink-0">{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </>
    );
    
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

// Bouton avec icône à gauche
export const ButtonWithIcon = React.forwardRef<HTMLButtonElement, ButtonProps & { icon: React.ReactNode }>(
  ({ icon, children, ...props }, ref) => (
    <Button ref={ref} icon={icon} iconPosition="left" {...props}>
      {children}
    </Button>
  )
);

ButtonWithIcon.displayName = 'ButtonWithIcon';

// Bouton de chargement
export const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Button ref={ref} loading={true} {...props}>
      {children}
    </Button>
  )
);

LoadingButton.displayName = 'LoadingButton';

// Bouton de soumission
export const SubmitButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = 'Soumettre', ...props }, ref) => (
    <Button ref={ref} type="submit" {...props}>
      {children}
    </Button>
  )
);

SubmitButton.displayName = 'SubmitButton';

// Bouton d'annulation
export const CancelButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = 'Annuler', ...props }, ref) => (
    <Button ref={ref} variant="secondary" {...props}>
      {children}
    </Button>
  )
);

CancelButton.displayName = 'CancelButton';

// Bouton de suppression
export const DeleteButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = 'Supprimer', ...props }, ref) => (
    <Button ref={ref} variant="error" {...props}>
      {children}
    </Button>
  )
);

DeleteButton.displayName = 'DeleteButton';

// Bouton de succès
export const SuccessButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Button ref={ref} variant="success" {...props}>
      {children}
    </Button>
  )
);

SuccessButton.displayName = 'SuccessButton';

export default Button; 