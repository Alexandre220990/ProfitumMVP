import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { get, post } from "@/lib/api";

interface CharterStatusResponse {
  signed: boolean;
}

export default function CharterSignature() { const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState(false);
  const auditType = window.location.pathname.split('/')[2];

  // Récupérer l'état de la charte (signée ou non)
  useEffect(() => {
    const fetchCharterStatus = async () => {
      try {
        const response = await get<CharterStatusResponse>(`/api/charter-status?auditType=${auditType}`);
        setSigned(response.data?.signed || false);
      } catch (error) { 
        console.error("Erreur lors de la récupération du statut de la charte: ", error);
        setSigned(false); 
      }
    };

    fetchCharterStatus();
  }, [auditType]);

  // Fonction pour signer la charte
  const handleSign = async () => { 
    try {
      await post("/api/sign-charter", { auditType });
      setSigned(true);
    } catch (error) { 
      console.error("Erreur lors de la signature de la charte: ", error); 
    }
  };

  // Fonction pour télécharger la charte signée en PDF
  const handleDownloadPDF = async () => { 
    try {
      const response = await get("/api/download-charter");
      const blob = new Blob([response.data as BlobPart]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "charte-engagement-profitum.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) { 
      console.error("Erreur lors du téléchargement: ", error); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Charte d'engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-blue">
              <p>Veuillez lire et accepter la charte d'engagement.</p>
            </div>

            { !signed ? (
              <>
                <div className="flex items-center space-x-2 pt-6 border-t">
                  <Checkbox 
                    id="accept" 
                    checked={accepted } 
                    onCheckedChange={ (checked) => setAccepted(checked as boolean) }
                  />
                  <Label htmlFor="accept">J'accepte les CGU</Label>
                </div>

                <div className="flex justify-between items-center">
                  <Link to={ window.location.pathname.replace('/sign-charter', '') }>
                    <Button variant="outline">Retour</Button>
                  </Link>
                  <Button 
                    onClick={ handleSign } 
                    disabled={ !accepted }
                  >
                    Valider
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Vous avez signé la charte avec succès! ✅</span>
                </div>
                <div className="flex gap-4">
                  <Link to={ window.location.pathname.replace('/sign-charter', '') }>
                    <Button variant="outline">Retour</Button>
                  </Link>
                  <Button 
                    onClick={ handleDownloadPDF }
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger la charte signée
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
