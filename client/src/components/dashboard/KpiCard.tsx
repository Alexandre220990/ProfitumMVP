import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  value?: number | string | React.ReactNode;
  component?: React.ReactNode;
  label: string;
  color: string;
}

export function KpiCard({ icon: Icon, value, component, label, color }: KpiCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
      <Icon className={`h-8 w-8 ${color}`} />
      {component ? component : <h3 className="text-xl font-semibold mt-2">{value}</h3>}
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
} 