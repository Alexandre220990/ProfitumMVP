import React from 'react';

interface LoadingStateProps {
  title?: string;
  description?: string;
  showSpinner?: boolean;
  size?: 'small' | 'default' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  title = "Chargement en cours...", 
  description = "Veuillez patienter pendant que nous récupérons vos données.",
  showSpinner = true,
  size = "default"
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {showSpinner && (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${
          size === "small" ? "h-6 w-6" : size === "large" ? "h-16 w-16" : "h-12 w-12"
        }`} />
      )}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 text-center max-w-md">{description}</p>
    </div>
  );
};

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
    <div className="animate-fade-in">
      <div className="p-6 space-y-4">
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
      </div>
    </div>
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