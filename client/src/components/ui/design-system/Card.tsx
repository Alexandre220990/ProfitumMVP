// import React from 'react';
import { cn } from '@/lib/utils';
import { getCardClass, CardVariant } from '@/config/design-system';

// ============================================================================
// TYPES
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glass?: boolean;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPOSANTS PRINCIPAUX
// ============================================================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'base', 
    padding = 'md',
    hover = true,
    glass = false,
    dark = false,
    children, 
    className,
    ...props 
  }, ref) => {
    
    // Déterminer la variante finale
    let finalVariant = variant;
    if (glass) finalVariant = 'glass';
    if (dark) finalVariant = 'dark';
    
    // Classes de base
    const baseClasses = getCardClass(finalVariant);
    
    // Classes de padding
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    };
    
    // Classes d'effet de survol
    const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';
    
    // Classes finales
    const cardClasses = cn(
      baseClasses,
      paddingClasses[padding],
      hoverClasses,
      className
    );
    
    return (
      <div
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, level = 3, ...props }, ref) => {
    const baseClasses = 'text-2xl font-semibold leading-none tracking-tight';
    const finalClasses = cn(baseClasses, className);
    
    switch (level) {
      case 1:
        return (
          <h1 ref={ref} className={finalClasses} {...props}>
            {children}
          </h1>
        );
      case 2:
        return (
          <h2 ref={ref} className={finalClasses} {...props}>
            {children}
          </h2>
        );
      case 3:
        return (
          <h3 ref={ref} className={finalClasses} {...props}>
            {children}
          </h3>
        );
      case 4:
        return (
          <h4 ref={ref} className={finalClasses} {...props}>
            {children}
          </h4>
        );
      case 5:
        return (
          <h5 ref={ref} className={finalClasses} {...props}>
            {children}
          </h5>
        );
      case 6:
        return (
          <h6 ref={ref} className={finalClasses} {...props}>
            {children}
          </h6>
        );
      default:
        return (
          <h3 ref={ref} className={finalClasses} {...props}>
            {children}
          </h3>
        );
    }
  }
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================================================
// COMPOSANTS SPÉCIALISÉS
// ============================================================================

// Carte avec image
export const ImageCard = React.forwardRef<HTMLDivElement, CardProps & { 
  image: string;
  imageAlt?: string;
  imageHeight?: string;
}>(
  ({ image, imageAlt = '', imageHeight = 'h-48', children, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <div className={`w-full ${imageHeight} overflow-hidden rounded-t-2xl`}>
        <img 
          src={image} 
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        {children}
      </div>
    </Card>
  )
);

ImageCard.displayName = 'ImageCard';

// Carte avec icône
export const IconCard = React.forwardRef<HTMLDivElement, CardProps & { 
  icon: React.ReactNode;
  iconColor?: string;
}>(
  ({ icon, iconColor = 'text-blue-600', children, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full bg-blue-50 ${iconColor}`}>
          {icon}
        </div>
      </div>
      {children}
    </Card>
  )
);

IconCard.displayName = 'IconCard';

// Carte de statistique
export const StatCard = React.forwardRef<HTMLDivElement, Omit<CardProps, 'children'> & {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}>(
  ({ title, value, change, trend, icon, ...props }, ref) => (
    <Card ref={ref} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <span className="text-2xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === 'up' && <span className="text-green-600">↗</span>}
            {trend === 'down' && <span className="text-red-600">↘</span>}
            {trend === 'neutral' && <span className="text-gray-600">→</span>}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
);

StatCard.displayName = 'StatCard';

// Carte de navigation
export const NavigationCard = React.forwardRef<HTMLDivElement, Omit<CardProps, 'children'> & {
  title: string;
  description?: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}>(
  ({ title, description, href, icon, onClick, ...props }, ref) => {
    const handleClick = () => {
      if (onClick) onClick();
      if (href) window.location.href = href;
    };
    
    return (
      <Card 
        ref={ref} 
        className="cursor-pointer group"
        onClick={handleClick}
        {...props}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            {icon && (
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                {icon}
              </div>
            )}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        {description && (
          <CardContent>
            <CardDescription>{description}</CardDescription>
          </CardContent>
        )}
      </Card>
    );
  }
);

NavigationCard.displayName = 'NavigationCard';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}; 