import { Link } from 'react-router-dom';
import { useClientId } from '@/hooks/useClientId';
import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Rocket } from "lucide-react";

interface EmptyAuditStateProps {
  hasRecentSimulation: boolean;
}

export function EmptyAuditState({ hasRecentSimulation }: EmptyAuditStateProps) {
  const clientId = useClientId();

  const redirectUrl = useMemo(() => {
    return `/simulateur?clientId=${clientId}${hasRecentSimulation ? '&useLast=true' : ''}`;
  }, [clientId, hasRecentSimulation]);

  return (
    <div className="text-center py-10">
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Bienvenue sur votre tableau de bord
      </h3>
      <p className="mt-2 text-gray-600 max-w-2xl mx-auto mb-8">
        Pour découvrir les opportunités d'optimisation adaptées à votre entreprise, 
        vous pouvez soit discuter avec notre chatbot, soit lancer une simulation complète.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/chatbot">
          <Button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <MessageSquare className="w-5 h-5" />
            Discuter avec le chatbot
          </Button>
        </Link>
        <Link to={redirectUrl}>
          <Button
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Rocket className="w-5 h-5" />
            {hasRecentSimulation ? "Reprendre la simulation" : "Lancer une simulation"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
