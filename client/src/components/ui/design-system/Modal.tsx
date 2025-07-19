// import React from 'react';
import { cn } from '@/lib/utils';
import Button from './Button';
import { CancelButton, SubmitButton } from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export interface ModalHeaderProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children?: React.ReactNode;
  className?: string;
  showCancelButton?: boolean;
  showSubmitButton?: boolean;
  cancelText?: string;
  submitText?: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
}

// ============================================================================
// COMPOSANTS PRINCIPAUX
// ============================================================================

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    title, 
    description, 
    children, 
    size = 'md',
    variant = 'default',
    showCloseButton = true,
    closeOnOverlayClick = true,
    className,
    ...props 
  }, ref) => {
    
    if (!isOpen) return null;
    
    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    };
    
    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      >
        <div
          ref={ref}
          className={cn(
            'w-full',
            sizeClasses[size],
            'animate-scale-in',
            className
          )}
          {...props}
        >
          <Card className="relative">
            {title && (
              <ModalHeader
                title={title}
                description={description}
                variant={variant}
                onClose={onClose}
                showCloseButton={showCloseButton}
              />
            )}
            
            <ModalContent>
              {children}
            </ModalContent>
          </Card>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ 
    title, 
    description, 
    variant = 'default',
    onClose, 
    showCloseButton = true,
    children,
    ...props 
  }, ref) => {
    
    const variantConfig = {
      default: { icon: null, color: 'text-slate-900' },
      success: { icon: CheckCircle, color: 'text-green-600' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600' },
      error: { icon: AlertCircle, color: 'text-red-600' },
      info: { icon: Info, color: 'text-blue-600' },
    };
    
    const config = variantConfig[variant];
    const IconComponent = config.icon;
    
    return (
      <CardHeader ref={ref} className="pb-4" {...props}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {IconComponent && (
              <IconComponent className={cn('w-5 h-5 mt-1 flex-shrink-0', config.color)} />
            )}
            <div className="flex-1">
              <CardTitle className={cn('text-lg', config.color)}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {children}
      </CardHeader>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, ...props }, ref) => (
    <CardContent ref={ref} className={cn('pt-0', className)} {...props}>
      {children}
    </CardContent>
  )
);

ModalContent.displayName = 'ModalContent';

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ 
    children, 
    className,
    showCancelButton = true,
    showSubmitButton = true,
    cancelText = 'Annuler',
    submitText = 'Confirmer',
    onCancel,
    onSubmit,
    loading = false,
    ...props 
  }, ref) => {
    
    return (
      <CardFooter ref={ref} className={cn('flex justify-end gap-3 pt-4', className)} {...props}>
        {children || (
          <>
            {showCancelButton && (
              <CancelButton onClick={onCancel}>
                {cancelText}
              </CancelButton>
            )}
            {showSubmitButton && (
              <SubmitButton onClick={onSubmit} loading={loading}>
                {submitText}
              </SubmitButton>
            )}
          </>
        )}
      </CardFooter>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

// Modal de confirmation
export const ConfirmModal = React.forwardRef<HTMLDivElement, ModalProps & {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'error';
}>(
  ({ 
    onConfirm, 
    confirmText = 'Confirmer', 
    cancelText = 'Annuler',
    variant = 'default',
    onClose,
    ...props 
  }, ref) => {
    
    const handleConfirm = () => {
      onConfirm();
      onClose();
    };
    
    return (
      <Modal
        ref={ref}
        variant={variant}
        onClose={onClose}
        {...props}
      >
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleConfirm}
          cancelText={cancelText}
          submitText={confirmText}
        />
      </Modal>
    );
  }
);

ConfirmModal.displayName = 'ConfirmModal';

// Modal de suppression
export const DeleteModal = React.forwardRef<HTMLDivElement, ModalProps & {
  onDelete: () => void;
  itemName?: string;
}>(
  ({ onDelete, itemName = 'cet élément', onClose, ...props }, ref) => {
    
    return (
      <Modal
        ref={ref}
        variant="error"
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`}
        onClose={onClose}
        {...props}
      >
        <ModalFooter
          onCancel={onClose}
          onSubmit={onDelete}
          cancelText="Annuler"
          submitText="Supprimer"
          loading={false}
        />
      </Modal>
    );
  }
);

DeleteModal.displayName = 'DeleteModal';

// Modal de succès
export const SuccessModal = React.forwardRef<HTMLDivElement, ModalProps & {
  onContinue?: () => void;
  continueText?: string;
}>(
  ({ onContinue, continueText = 'Continuer', onClose, ...props }, ref) => {
    
    const handleContinue = () => {
      if (onContinue) onContinue();
      onClose();
    };
    
    return (
      <Modal
        ref={ref}
        variant="success"
        onClose={onClose}
        {...props}
      >
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleContinue}
          cancelText="Fermer"
          submitText={continueText}
        />
      </Modal>
    );
  }
);

SuccessModal.displayName = 'SuccessModal';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
}; 