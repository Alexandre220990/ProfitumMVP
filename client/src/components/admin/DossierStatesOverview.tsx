import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  FileX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Search,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { config } from "@/config/env";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { motion } from "framer-motion";

interface DossierState {
  id: string;
  count: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
  data?: any[];
  loading?: boolean;
}

export function DossierStatesOverview() {
  const navigate = useNavigate();
  const [states, setStates] = useState<DossierState[]>([
    {
      id: 'avec-documents-en-attente',
      count: 0,
      label: 'Documents en attente',
      description: 'Dossiers avec documents à valider',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
      route: '/api/admin/dossiers/avec-documents-en-attente',
      loading: true
    },
    {
      id: 'sans-documents',
      count: 0,
      label: 'Sans documents',
      description: 'Dossiers sans documents uploadés',
      icon: <FileX className="w-4 h-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      route: '/api/admin/dossiers/sans-documents',
      loading: true
    },
    {
      id: 'en-attente-validation-expert',
      count: 0,
      label: 'En attente expert',
      description: 'En attente de validation par l\'expert',
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      route: '/api/admin/dossiers/en-attente-validation-expert',
      loading: true
    },
    {
      id: 'valides-par-expert',
      count: 0,
      label: 'Validés/Refusés',
      description: 'Dossiers validés ou refusés par expert',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      route: '/api/admin/dossiers/valides-par-expert',
      loading: true
    },
    {
      id: 'documents-valides',
      count: 0,
      label: 'Documents validés',
      description: 'Documents validés par les experts',
      icon: <FileCheck className="w-4 h-4" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      route: '/api/admin/documents/valides-par-expert',
      loading: true
    },
    {
      id: 'audits-en-cours',
      count: 0,
      label: 'Audits en cours',
      description: 'Audits actuellement en cours',
      icon: <Search className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      route: '/api/admin/audits/en-cours',
      loading: true
    },
    {
      id: 'audits-termines',
      count: 0,
      label: 'Audits terminés',
      description: 'Audits terminés avec rapport disponible',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      route: '/api/admin/audits/termines-avec-rapport',
      loading: true
    }
  ]);

  const [expandedState, setExpandedState] = useState<string | null>(null);

  useEffect(() => {
    fetchAllStates();
  }, []);

  const fetchAllStates = async () => {
    const token = await getSupabaseToken();
    if (!token) return;

    const updatedStates = await Promise.all(
      states.map(async (state) => {
        try {
          const response = await fetch(`${config.API_URL}${state.route}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) throw new Error('Erreur de récupération');

          const result = await response.json();
          const data = result.data || [];
          
          return {
            ...state,
            count: data.length,
            data: data,
            loading: false
          };
        } catch (error) {
          console.error(`Erreur chargement ${state.label}:`, error);
          return {
            ...state,
            count: 0,
            data: [],
            loading: false
          };
        }
      })
    );

    setStates(updatedStates);
  };

  const handleStateClick = (state: DossierState) => {
    if (state.count === 0) return;
    
    // Naviguer vers la page gestion-dossiers avec le filtre approprié
    navigate(`/admin/gestion-dossiers?filter=${state.id}`);
  };

  const handleExpand = (stateId: string) => {
    setExpandedState(expandedState === stateId ? null : stateId);
  };

  const formatClientName = (dossier: any) => {
    if (dossier.Client) {
      return dossier.Client.company_name || 
             `${dossier.Client.name || ''}`.trim() || 
             dossier.Client.email?.split('@')[0] || 
             'Client inconnu';
    }
    return 'Client inconnu';
  };

  const formatProductName = (dossier: any) => {
    return dossier.ProduitEligible?.nom || 
           dossier.ProduitEligible?.description || 
           'Produit inconnu';
  };

  return (
    <div className="space-y-3">
      {/* Grille compacte des états */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
        {states.map((state, index) => (
          <motion.div
            key={state.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={`
                ${state.bgColor} 
                cursor-pointer 
                transition-all 
                hover:shadow-md 
                hover:scale-105
                border
                ${state.count > 0 ? 'hover:border-opacity-60' : 'opacity-60'}
              `}
              onClick={() => handleStateClick(state)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`${state.color} flex items-center justify-center w-8 h-8 rounded-full bg-white/60`}>
                    {state.icon}
                  </div>
                  <div className="space-y-1">
                    <div className={`text-2xl font-bold ${state.color}`}>
                      {state.loading ? (
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        state.count
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-700 leading-tight">
                      {state.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Détails expandables pour chaque état */}
      {states.filter(s => s.count > 0).map((state) => (
        <motion.div
          key={`details-${state.id}`}
          initial={false}
          animate={{ 
            height: expandedState === state.id ? 'auto' : 0,
            opacity: expandedState === state.id ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {expandedState === state.id && (
            <Card className={`${state.bgColor} border`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className={state.color}>
                      {state.icon}
                    </div>
                    {state.label} ({state.count})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpand(state.id)}
                    className="h-7 px-2"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">{state.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {state.data && state.data.length > 0 ? (
                    state.data.slice(0, 5).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/dossiers/${item.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {formatClientName(item)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {formatProductName(item)}
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-4">
                      Aucun élément
                    </div>
                  )}
                  {state.data && state.data.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleStateClick(state)}
                    >
                      Voir tous ({state.data.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      ))}

      {/* Bouton pour expander/collapser tous */}
      {states.some(s => s.count > 0) && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const firstWithData = states.find(s => s.count > 0);
              if (firstWithData) {
                setExpandedState(expandedState ? null : firstWithData.id);
              }
            }}
            className="text-xs"
          >
            {expandedState ? 'Réduire' : 'Voir les détails'}
          </Button>
        </div>
      )}
    </div>
  );
}
