import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { get } from "@/lib/api";

interface Expert { id: number;
  name: string;
  company: string;
  specializations: string[];
  experience: string;
  rating: number;
  compensation: number; }

const ExpertSelection = () => { const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await get('/experts');
        if (response.success && response.data) {
          setExperts(response.data as Expert[]); 
        } else { 
          setError('Erreur lors de la récupération des experts'); 
        }
      } catch (error) { 
        setError('Erreur lors de la récupération des experts'); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchExperts();
  }, []);

  if (loading) { return <div>Chargement...</div>; }

  if (error) { return <div>{error }</div>; }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      { experts.map((expert) => (
        <Card key={expert.id }>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{ expert.name }</h3>
            <p className="text-sm text-gray-500">{ expert.company }</p>
            <p className="text-sm">{ expert.experience }</p>
            <p className="text-sm">Note: { expert.rating }/5</p>
            <p className="text-sm">Tarif: { expert.compensation }€/h</p>
            <div className="mt-4">
              <Button>Choisir cet expert</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExpertSelection;
