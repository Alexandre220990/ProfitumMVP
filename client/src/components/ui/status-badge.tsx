import { Badge } from './badge';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function StatusBadge({ status, variant, className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'actif':
      case 'active':
      case 'completed':
      case 'paid':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          label: status
        };
      case 'inactif':
      case 'inactive':
      case 'pending':
      case 'en_attente':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: status
        };
      case 'high':
      case 'urgent':
      case 'critical':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          label: status
        };
      case 'medium':
      case 'warning':
        return {
          variant: 'default' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          label: status
        };
      case 'low':
      case 'info':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          label: status
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={variant || config.variant}
      className={`text-xs font-semibold ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
