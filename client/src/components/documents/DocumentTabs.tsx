import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileSignature, BarChart3, BookOpen, Clock } from "lucide-react";
import { DocumentStats } from "@/types/client-documents";

interface DocumentTabsProps { activeTab: string;
  onTabChange: (value: string) => void;
  stats?: DocumentStats }

const tabConfig = [
  { value: 'all', label: 'Tous', icon: FileSignature, color: 'bg-blue-100 text-blue-800' },
  { value: 'charte', label: 'Chartes', icon: FileSignature, color: 'bg-green-100 text-green-800' },
  { value: 'audit', label: 'Audits', icon: BarChart3, color: 'bg-purple-100 text-purple-800' },
  { value: 'simulation', label: 'Simulations', icon: Clock, color: 'bg-orange-100 text-orange-800' },
  { value: 'guide', label: 'Guides', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800' }
];

export default function DocumentTabs({ activeTab, onTabChange, stats }: DocumentTabsProps) { 
  const getCount = (type: string) => {
    if (!stats) return 0;
    switch (type) {
      case 'all':
        return stats.total;
      case 'charte':
        return stats.chartes;
      case 'audit':
        return stats.audits;
      case 'simulation':
        return stats.simulations;
      case 'guide':
        return stats.guides;
      default: 
        return 0; 
    }
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const count = getCount(tab.value);
            
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count && count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${tab.color} border-0`}
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
} 