import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import HeaderClient from "@/components/HeaderClient";
import { FolderOpen, Calendar, User, Briefcase, FileText, Phone } from "lucide-react";
import { get } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Dossier } from "@/types/dossier";

interface DossierDetails extends Dossier {
  client?: string;
  date?: string;
  montantEstime?: number;
  nom?: string;
  expert?: string;
  produit?: string;
  contact?: {
    email: string;
    tel: string;
  };
  progression?: Array<{
    étape: string;
    completed: boolean;
  }>;
}

export default function DetailsDossier() {
  const { id } = useParams();
  const [dossier, setDossier] = useState<DossierDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération du dossier
  useEffect(() => {
    const fetchDossier = async () => {
      if (!id) return;
      
      try {
        const response = await get<DossierDetails>(`/api/dossiers/${id}`);
        if (response.success && response.data) {
          setDossier(response.data);
        } else {
          setError(response.message || "Erreur lors de la récupération du dossier");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du dossier: ", error);
        setError("Une erreur est survenue lors de la récupération du dossier");
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <HeaderClient />
        <div className="container mx-auto px-6 py-10">
          <p className="text-center text-gray-600 mt-10">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-gray-100">
        <HeaderClient />
        <div className="container mx-auto px-6 py-10">
          <p className="text-center text-red-500 mt-10">
            ❌ {error || "Dossier introuvable."}
          </p>
        </div>
      </div>
    );
  }

  const progressionPourcentage = dossier.progression && dossier.progression.length > 0
    ? (dossier.progression.filter((e) => e.completed).length / dossier.progression.length) * 100
    : dossier.progress || 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderClient />
      <div className="container mx-auto px-6 py-10">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Détails du dossier #{id}</CardTitle>
              <Badge variant="default">{dossier.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{dossier.client || dossier.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">
                  {dossier.date || dossier.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type d'audit</p>
                <p className="font-medium">{dossier.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant estimé</p>
                <p className="font-medium">{dossier.montantEstime || dossier.montant || 0} €</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard/partner">Retour au tableau de bord</Link>
              </Button>
              <div className="space-x-2">
                <Button variant="default">Dossier en cours</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
          📂 Détails de votre dossier
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg bg-white rounded-xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-7 h-7 text-blue-600" />
                <h2 className="text-2xl font-semibold">{dossier.nom || `Dossier ${dossier.id}`}</h2>
              </div>
              <div className="text-gray-600 space-y-2">
                <p className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  Date de création: {dossier.date || dossier.createdAt.toLocaleDateString("fr-FR")}
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Expert: {dossier.expert || "Non assigné"}
                </p>
                <p className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  Produit: {dossier.produit || dossier.type}
                </p>
                <p className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Documents: {dossier.documents ? Object.keys(dossier.documents).join(", ") : "Aucun document"}
                </p>
                {dossier.contact && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    Contact:{" "}
                    <a href={`mailto:${dossier.contact.email}`} className="text-blue-600 font-medium">
                      {dossier.contact.email}
                    </a>{" "}
                    | {dossier.contact.tel}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">📊 Progression du dossier</h2>
              <Progress value={progressionPourcentage} className="mb-6 h-4 bg-gray-200 rounded-full" />
              {dossier.progression && dossier.progression.length > 0 ? (
                <ul className="space-y-3">
                  {dossier.progression.map((step, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full ${
                          step.completed ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <p
                        className={`${
                          step.completed ? "text-gray-900 font-semibold" : "text-gray-500"
                        }`}
                      >
                        {step.étape}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune étape de progression définie</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-6 mt-12">
          <Link to="/marketplace-experts">
            <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg rounded-lg shadow-md">
              🚀 Accéder à la Marketplace des Experts
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
