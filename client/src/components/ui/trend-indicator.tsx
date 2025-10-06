import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, previousValue, label, className = '' }: TrendIndicatorProps) {
  if (!previousValue) {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        <Minus className="h-3 w-3 mr-1" />
        <span className="text-xs">Pas de données précédentes</span>
      </div>
    );
  }

  const percentage = ((value - previousValue) / previousValue) * 100;
  const isPositive = percentage > 0;
  const isNegative = percentage < 0;

  const getColorClass = () => {
    if (isPositive) return 'text-green-600 bg-green-50';
    if (isNegative) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getIcon = () => {
    if (isPositive) return <TrendingUp className="h-3 w-3" />;
    if (isNegative) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getColorClass()} ${className}`}>
      {getIcon()}
      <span className="ml-1 font-semibold">
        {isPositive ? '+' : ''}{percentage.toFixed(1)}%
      </span>
      {label && <span className="ml-1">{label}</span>}
    </div>
  );
}
