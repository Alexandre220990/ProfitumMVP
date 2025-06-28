import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import HeaderClient from "@/components/HeaderClient";
import { ArrowLeft, Star, Search, Briefcase, LineChart, Building, FileText, Coins, Filter, MapPin } from "lucide-react";
import { get } from "@/lib/api";
import { Expert } from "@/types/expert";
import { useToast } from "@/hooks/use-toast";

const AUDITS = [
  { id: "ticpe", name: "Audit TICPE", description: "Optimisez votre fiscalité sur les taxes carburant." },
  { id: "msa", name: "Audit MSA", description: "Maîtrisez vos obligations sociales agricoles." },
  { id: "dfs", name: "Audit DFS", description: "Optimisez vos déclarations fiscales et sociales." },
  { id: "foncier", name: "Audit Foncier", description: "Maximisez la rentabilité de votre patrimoine immobilier." },
  { id: "fiscal", name: "Audit Fiscal", description: "Bénéficiez d'une fiscalité optimisée et conforme." },
];

export default function Marketplace() {
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("commission-asc");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await get<Expert[]>("/api/experts");
        setExperts(response);
      } catch (error) {
        console.error("Erreur lors du chargement des experts:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la liste des experts"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [toast]);

  const filteredExperts = experts.filter(expert => 
    selectedAudit ? expert.specializations.includes(AUDITS.find(a => a.id === selectedAudit)?.name || "") : true
  );

  const sortedExperts = [...filteredExperts].sort((a, b) => {
    if (sortBy === "commission-asc") return a.compensation - b.compensation;
    if (sortBy === "commission-desc") return b.compensation - a.compensation;
    if (sortBy === "rating-asc") return a.rating - b.rating;
    if (sortBy === "rating-desc") return b.rating - a.rating;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-xl">Chargement des experts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderClient />
      <div className="container mx-auto px-6 py-16">
        <div className="mb-10">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-5xl font-extrabold text-center mb-12">🚀 Sélectionnez votre audit et trouvez l'expert idéal</h1>

        <div className="flex gap-4 justify-center mb-6">
          <Input
            type="text"
            placeholder="Rechercher un audit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 pl-10"
          />
          <select
            onChange={(e) => setSortBy(e.target.value)}
            value={sortBy}
            className="border rounded p-2"
            id="sort-select"
            name="sort-select"
          >
            <option value="commission-asc">Commission (ordre croissant)</option>
            <option value="commission-desc">Commission (ordre décroissant)</option>
            <option value="rating-asc">Note (ordre croissant)</option>
            <option value="rating-desc">Note (ordre décroissant)</option>
          </select>
        </div>

        {!selectedAudit ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDITS.filter(audit => 
              audit.name.toLowerCase().includes(search.toLowerCase())
            ).map((audit) => (
              <Card
                key={audit.id}
                className="shadow-md bg-white rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedAudit(audit.id)}
              >
                <CardContent className="text-left space-y-3">
                  <h2 className="text-xl font-semibold">{audit.name}</h2>
                  <p className="text-gray-600 text-sm w-full">{audit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <Button
              variant="ghost"
              className="mb-6 flex items-center gap-2 text-gray-700 hover:text-blue-600"
              onClick={() => setSelectedAudit(null)}
            >
              <ArrowLeft className="w-5 h-5" /> Retour aux audits
            </Button>
            <h2 className="text-3xl font-bold text-center mb-6">
              🔎 Experts en {AUDITS.find((a) => a.id === selectedAudit)?.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedExperts.map((expert) => (
                <Card
                  key={expert.id}
                  className="shadow-md bg-white rounded-lg p-5 hover:shadow-xl transition-all"
                >
                  <CardContent className="space-y-2 text-left">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> {expert.name}
                    </h3>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" /> {expert.company}
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Coins className="w-5 h-5 text-green-600" /> Commission : {expert.compensation}%
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" /> {expert.location}
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-purple-600" /> {expert.experience}
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> Note : {expert.rating}/5
                    </p>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Spécialisations :</h4>
                      <div className="flex flex-wrap gap-2">
                        {expert.specializations.map((spec, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
