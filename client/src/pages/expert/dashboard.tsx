import { ExpertDashboardOptimized } from "@/components/ui/expert-dashboard-optimized";
import { ExpertProvider } from "@/contexts/ExpertContext";

const ExpertDashboardPage: React.FC = () => { 
  return (
    <ExpertProvider>
      <ExpertDashboardOptimized />
    </ExpertProvider>
  ) 
};

export default ExpertDashboardPage; 