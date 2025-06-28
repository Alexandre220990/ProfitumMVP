import { useState } from 'react';
import { useAudit } from '@/hooks/use-audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { User } from '@/types/user';

interface AuditTableProps {
  activeTab: 'opportunities' | 'pending' | 'completed';
  user: User;
}

export function AuditTable({ activeTab, user }: AuditTableProps) {
  const { audits, isLoadingAudits } = useAudit();
  const navigate = useNavigate();

  // Filtrer les audits en fonction de l'onglet actif
  const filteredAudits = audits?.filter((audit: Audit) => {
    if (activeTab === 'opportunities') return audit.status === 'not_initiated';
    if (activeTab === 'pending') return audit.status === 'pending';
    if (activeTab === 'completed') return audit.status === 'completed';
    return false;
  });

  if (isLoadingAudits) {
    return (
      <Card className="shadow-lg rounded-lg mt-8">
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  // Si aucun audit n'existe, afficher un message et un bouton pour commencer la simulation
  if (!filteredAudits?.length) {
    return (
      <Card className="shadow-lg rounded-lg mt-8">
        <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
          <Rocket className="h-12 w-12 text-blue-500" />
          <p className="text-gray-500 text-center">
            {activeTab === 'opportunities' 
              ? "Commencez par effectuer une simulation pour découvrir vos opportunités d'optimisation."
              : "Aucun dossier disponible."}
          </p>
          <Button
            onClick={() => navigate(`/pages/simulateur/${user.id}`)}
            className="flex items-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            Commencer une simulation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-lg mt-8">
      <CardHeader>
        <CardTitle className="text-gray-800 text-lg font-semibold">Mes Dossiers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-800 text-sm font-semibold">
                <th className="p-3 text-left">Nom du dossier</th>
                <th className="p-3 text-left">Statut</th>
                <th className="p-3 text-left">Étape en cours</th>
                <th className="p-3 text-left">Gains Potentiels</th>
                {activeTab === 'completed' && (
                  <>
                    <th className="p-3 text-left">Gains Obtenus</th>
                    <th className="p-3 text-left">Fiabilité</th>
                  </>
                )}
                <th className="p-3 text-left">Avancement</th>
                <th className="p-3 text-left">Créé le</th>
                <th className="p-3 text-left">Mis à jour</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.map((audit) => (
                <tr
                  key={audit.id}
                  className="border-b hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="p-3 font-medium text-gray-900">
                    <a href={`/dossier-client/${audit.audit_type}/${audit.id}`} className="hover:underline">
                      {`Audit ${audit.audit_type.toUpperCase()}`}
                    </a>
                  </td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${audit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        audit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>
                      {audit.status === 'completed' ? 'Terminé' : audit.status === 'pending' ? 'En cours' : 'Non initié'}
                    </span>
                  </td>
                  <td className="p-3">{`Étape ${audit.current_step}`}</td>
                  <td className="p-3 font-semibold text-red-600">
                    {audit.potential_gain.toLocaleString()} €
                  </td>
                  {activeTab === 'completed' && (
                    <>
                      <td className="p-3 font-semibold text-green-600">
                        {audit.obtained_gain?.toLocaleString()} €
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12">
                            <CircularProgressbar
                              value={((audit.obtained_gain || 0) / audit.potential_gain) * 100}
                              text={`${Math.round((audit.obtained_gain || 0) / audit.potential_gain * 100)}%`}
                              styles={buildStyles({
                                textSize: '28px',
                                pathColor: `${((audit.obtained_gain || 0) / audit.potential_gain) >= 1 ? '#10B981' : '#3B82F6'}`,
                                textColor: '#1E293B',
                                trailColor: '#E5E7EB',
                              })}
                            />
                          </div>
                        </div>
                      </td>
                    </>
                  )}
                  <td className="p-3 text-center">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <CircularProgressbar
                        value={audit.progress}
                        strokeWidth={10}
                        styles={buildStyles({
                          pathColor: audit.progress === 100 ? '#10B981' : '#3B82F6',
                          trailColor: '#E5E7EB',
                          textColor: '#1E293B',
                          textSize: '32px',
                        })}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-gray-500 text-sm">
                    {format(new Date(audit.createdAt), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="p-3 text-gray-500 text-sm">
                    {format(new Date(audit.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 