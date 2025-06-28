import { Users, Folder, RefreshCw, BarChart, PhoneCall, TrendingUp, ShieldCheck, HelpCircle, Star, UserCircle } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Growth = () => {
  const location = useLocation();

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <p>Contenu de la page Growth</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default Growth;
