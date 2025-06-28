import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function EmptyEligibleProductsState() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openChatbot = () => {
    if (!user?.id) {
      console.warn('Client non identifié, redirection impossible vers le chatbot');
      return;
    }
    navigate(`/chatbot?client_id=${user.id}`);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Aucun produit éligible trouvé</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-center text-muted-foreground">
          Vous n'avez pas encore de produits éligibles. Pour commencer, vous pouvez :
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={openChatbot}
          >
            Discuter avec le chatbot
          </Button>
          <Button
            variant="default"
            onClick={() => navigate("/simulateur")}
          >
            Utiliser le simulateur
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 