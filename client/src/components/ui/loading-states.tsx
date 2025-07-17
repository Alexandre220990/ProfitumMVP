import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from './design-system/Card';
import Button from './design-system/Button';

interface LoadingStateProps {
  title?: string;
  description?: string;
  showFallbackButton?: boolean;
  onFallbackClick?: () => void;
  variant?: 'default' | 'success' | 'error' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  title = "Chargement en cours...",
  description = "Veuillez patienter pendant que nous préparons vos données",
  showFallbackButton = false,
  onFallbackClick,
  variant = 'default',
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className={`${sizeClasses[size]} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${sizeClasses[size]} text-red-600`} />;
      case 'pulse':
        return <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
      <Card variant="glass" className="p-8 text-center animate-fade-in">
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold text-slate-900">
              {title}
            </CardTitle>
            <CardDescription className="text-slate-600 max-w-md">
              {description}
            </CardDescription>
          </div>

          {showFallbackButton && onFallbackClick && (
            <Button 
              variant="secondary" 
              onClick={onFallbackClick}
              className="mt-4 hover:shadow-md transition-all duration-300"
            >
              Utiliser des données de démonstration
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width = '100%', 
  height = '1rem' 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-200 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="circular" width="3rem" height="3rem" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <Skeleton variant="rectangular" height="2rem" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      ))}
    </div>
  );
} 