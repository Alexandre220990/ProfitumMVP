import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import HeaderClient from "@/components/HeaderClient";
import { FolderOpen, Calendar, User, Briefcase, FileText, Phone } from "lucide-react";
import { get } from "@/lib/api"; // Utilisation de la fonction get depuis lib/api.ts

export default function DetailsDossier() { const { id } = useParams();
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Récupération du dossier
  useEffect(() => { const fetchDossier = async () => {
      try {
        const response = await get(`/api/dossiers/${id }`);
        setDossier(response);
      } catch (error) { console.error("Erreur lors de la récupération du dossier: ", error); } finally { setLoading(false); }
    };

    fetchDossier();
  }, [id]);

  if (loading) { return <p className="text-center text-gray-600 mt-10">Chargement...</p>; }

  if (!dossier) { return <p className="text-center text-red-500 mt-10">❌ Dossier introuvable.</p>; }

  const progressionPourcentage = dossier.progression?.length
    ? (dossier.progression.filter((e: any) => e.completed).length / dossier.progression.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderClient />
      <div className="container mx-auto px-6 py-10">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Détails du dossier #{ id }</CardTitle>
              <Badge variant="default">En cours</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{ dossier.client?.nom || "Non renseigné" }</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">{ dossier.date }</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type d'audit</p>
                <p className="font-medium">{ dossier.typeAudit || "Non renseigné" }</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant estimé</p>
                <p className="font-medium">{ dossier.montantEstime || "Non renseigné" }</p>
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

        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">📂 Détails de votre dossier</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg bg-white rounded-xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-7 h-7 text-blue-600" />
                <h2 className="text-2xl font-semibold">{ dossier.nom }</h2>
              </div>
              <div className="text-gray-600 space-y-2">
                <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-500" /> Date de création: { dossier.date }</p>
                <p className="flex items-center gap-2"><User className="w-5 h-5 text-gray-500" /> Expert: { dossier.expert }</p>
                <p className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-500" /> Produit: { dossier.produit }</p>
                <p className="flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500" /> Documents: { dossier.documents?.join(", ") || "Aucun document disponible" }</p>
                <p className="flex items-center gap-2"><Phone className="w-5 h-5 text-gray-500" /> Contact: <a href={ `mailto:${dossier.contact?.email }`} className="text-blue-600 font-medium">{ dossier.contact?.email || "Non renseigné" }</a> | { dossier.contact?.tel || "Non renseigné" }</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-white rounded-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">📊 Progression du dossier</h2>
              <Progress value={ progressionPourcentage } className="mb-6 h-4 bg-gray-200 rounded-full" />
              <ul className="space-y-3">
                { dossier.progression?.length > 0 ? (
                  dossier.progression.map((step: any, index: number) => (
                    <li key={index } className="flex items-center space-x-3">
                      <div className={ `w-5 h-5 rounded-full ${step.completed ? "bg-green-500" : "bg-gray-300" }`} />
                      <p className={ `${step.completed ? "text-gray-900 font-semibold" : "text-gray-500" }`}>{ step.étape }</p>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">Aucune progression disponible.</p>
                )}
              </ul>
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
