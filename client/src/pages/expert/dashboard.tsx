// React import removed 'react';
import { ExpertDashboard } from "@/components/ui/expert-dashboard";
import { ExpertProvider } from "@/contexts/ExpertContext";

const ExpertDashboardPage: React.FC = () => { return (
    <ExpertProvider>
      <div className="container mx-auto px-4 py-8">
        <ExpertDashboard />
      </div>
    </ExpertProvider>
  ) };

export default ExpertDashboardPage; 