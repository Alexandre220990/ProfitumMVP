import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, Building, DollarSign, Home, Users, Lightbulb, FileText, Loader2 } from "lucide-react";

// Types pour les produits
interface Product { id: string;
  nom: string;
  description: string;
  conditions: string;
  tauxFinal?: number;
  montantFinal?: number;
  dureeFinale?: number; }

// Mapping entre les identifiants pe_X et les noms des pages statiques
const productIdMapping: Record<string, string> = { 
  "pe_1": "ticpe", 
  "pe_2": "msa", 
  "pe_3": "dfs", 
  "pe_4": "audit_energetique", 
  "pe_5": "foncier", 
  "pe_6": "social" 
};

export default function ProductPage() { const { productId, userId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const fetchProductDetails = async () => {
      try {
        // Vérifier si productId est défini
        if (!productId) {
          setError("Identifiant de produit manquant");
          setLoading(false);
          return; }

        // Vérifier si c'est un identifiant de type pe_X et le mapper vers une page statique
        if (productId.startsWith("pe_") && productIdMapping[productId] && userId) { const productName = productIdMapping[productId];
          
          // Vérifier si un audit existe déjà pour ce client et ce produit
          try {
            const auditResponse = await fetch(`/api/audits/client/${userId }`);
            const auditData = await auditResponse.json();
            
            if (auditResponse.ok && auditData.success && auditData.data) { // Chercher l'audit correspondant au produit
              const auditType = productName.toUpperCase();
              const existingAudit = auditData.data.find((audit: any) => 
                audit.audit_type === auditType || 
                audit.audit_type.toLowerCase() === productName.toLowerCase()
              );
              
              if (existingAudit && existingAudit.id) {
                console.log(`Audit existant trouvé pour ${productName }:`, existingAudit);
                // Rediriger vers la nouvelle URL incluant l'UUID de l'audit
                navigate(`/produits/${ productName }/${ userId }/${ existingAudit.id }`);
                return;
              }
            }
          } catch (auditError) { 
            console.error("Erreur lors de la vérification des audits existants: ", auditError);
            // En cas d'erreur, on continue avec le comportement normal 
          }
          
          // Si aucun audit n'est trouvé ou en cas d'erreur, utiliser l'ancienne URL
          if (productName === "ticpe") { navigate(`/produits/${productName }/${ userId }`);
          } else { navigate(`/produits/${productName }`);
          }
          return;
        }

        // On vérifie d'abord si c'est un produit statique (comme ticpe, msa, etc.)
        if (["ticpe", "msa", "dfs", "audit_energetique", "foncier", "social"].includes(productId)) { // Rediriger vers la page statique correspondante
          navigate(`/produits/${productId }`);
          return;
        }

        // Fetch du produit éligible depuis l'API
        const response = await fetch(`/api/produits-eligibles/details/${ productId }`);
        const data = await response.json();

        if (!response.ok) { throw new Error(data.error || "Erreur lors du chargement du produit"); }

        if (data.success && data.data) { setProduct(data.data); } else { throw new Error("Produit non trouvé"); }
      } catch (err) { 
        console.error("Erreur: ", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        // Afficher une notification d'erreur
        alert("Erreur : " + (err instanceof Error ? err.message : "Une erreur est survenue lors du chargement du produit")); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchProductDetails();
  }, [productId, userId, navigate]);

  // Fonction pour obtenir l'icône appropriée
  const getIcon = () => { if (!product) return <FileText className="h-10 w-10 text-blue-600" />;

    const productName = product.nom?.toLowerCase() || "";

    if (productName.includes("ticpe")) {
      return <Truck className="h-10 w-10 text-blue-600" />; 
    } else if (productName.includes("msa") || productName.includes("urssaf")) { 
      return <Building className="h-10 w-10 text-blue-600" />; 
    } else if (productName.includes("dfs") || productName.includes("fiscal")) { 
      return <DollarSign className="h-10 w-10 text-blue-600" />; 
    } else if (productName.includes("foncier")) { 
      return <Home className="h-10 w-10 text-blue-600" />; 
    } else if (productName.includes("social")) { 
      return <Users className="h-10 w-10 text-blue-600" />; 
    } else if (productName.includes("audit") || productName.includes("energie")) { 
      return <Lightbulb className="h-10 w-10 text-blue-600" />; 
    } else { 
      return <FileText className="h-10 w-10 text-blue-600" />; 
    }
  };

  if (loading) { return (
      <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Chargement du produit...</span>
        </div>
        <div className="bg-gray-100 py-6 text-center text-gray-600">
          <p>© {new Date().getFullYear() } Financial Tracker. Tous droits réservés.</p>
        </div>
      </div>
    );
  }

  if (error || !product) { return (
      <div className="flex-grow container mx-auto px-4 py-12">
          <Link to="/dashboard/client">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
            </Button>
          </Link>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Erreur</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Produit non trouvé" }</p>
              <p className="mt-4">Il semble qu'il y ait un problème avec ce produit. Veuillez retourner au tableau de bord et réessayer.</p>
              
              <div className="mt-6">
                <Link to="/dashboard/client">
                  <Button>Retour au tableau de bord</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="bg-gray-100 py-6 text-center text-gray-600">
          <p>© { new Date().getFullYear() } Financial Tracker. Tous droits réservés.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow container mx-auto px-4 py-12">
        <Link to="/dashboard/client">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <div className="flex items-center space-x-4">
                { getIcon() }
                <div>
                  <CardTitle className="text-2xl">{ product.nom }</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">
                    Produit Éligible
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700">{ product.description }</p>
              </div>

              { product.conditions && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Conditions d'éligibilité</h3>
                  <p className="text-gray-700">{product.conditions }</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                { product.montantFinal && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Montant potentiel</h4>
                    <p className="text-xl font-semibold">{product.montantFinal.toLocaleString() } €</p>
                  </div>
                )}
                
                { product.tauxFinal && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Taux d'intérêt</h4>
                    <p className="text-xl font-semibold">{product.tauxFinal } %</p>
                  </div>
                )}
                
                { product.dureeFinale && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Durée</h4>
                    <p className="text-xl font-semibold">{product.dureeFinale } mois</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Commencer le processus
                </Button>
                <Button variant="outline">
                  Demander plus d'informations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="bg-gray-100 py-6 text-center text-gray-600">
        <p>© { new Date().getFullYear() } Financial Tracker. Tous droits réservés.</p>
      </div>
    </div>
  );
} 