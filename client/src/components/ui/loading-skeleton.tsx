/**
 * Composants Skeleton pour états de chargement
 */

import { Card, CardContent, CardHeader } from './card';

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonMeetingCard() {
  return (
    <Card className="animate-pulse border-l-4 border-gray-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-gray-600 animate-pulse">{message}</p>}
    </div>
  );
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

