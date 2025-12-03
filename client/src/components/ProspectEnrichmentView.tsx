import React, { useState } from 'react';
import { ProspectEnrichmentData } from '../types/prospects';
import { 
  CheckCircle2, 
  XCircle, 
  Building2, 
  TrendingUp, 
  Users, 
  Truck, 
  Flame, 
  MapPin,
  FileText,
  Edit2,
  Save,
  X as XIcon
} from 'lucide-react';

interface ProspectEnrichmentViewProps {
  enrichmentData: ProspectEnrichmentData | null;
  prospectId: string;
  onUpdate?: (updatedData: ProspectEnrichmentData) => void;
}

export const ProspectEnrichmentView: React.FC<ProspectEnrichmentViewProps> = ({
  enrichmentData,
  prospectId: _prospectId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ProspectEnrichmentData | null>(enrichmentData);

  if (!enrichmentData) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Aucun enrichissement disponible pour ce prospect.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    if (editedData && onUpdate) {
      onUpdate(editedData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedData(enrichmentData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Enrichissement du Prospect
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {new Date(enrichmentData.enriched_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
              <button
                onClick={handleCancel}
                className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
              >
                <XIcon className="h-4 w-4" />
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Résumé Stratégique */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Résumé Stratégique</h4>
            {isEditing ? (
              <textarea
                value={editedData?.resume_strategique || ''}
                onChange={(e) => setEditedData(prev => prev ? {...prev, resume_strategique: e.target.value} : null)}
                className="w-full text-sm text-blue-800 border-blue-300 rounded p-2"
                rows={3}
              />
            ) : (
              <p className="text-sm text-blue-800">{enrichmentData.resume_strategique}</p>
            )}
          </div>
        </div>
      </div>

      {/* Secteur d'Activité */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Secteur d'Activité</h4>
            <p className="text-sm text-gray-700 mb-3">
              {enrichmentData.secteur_activite.description}
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs font-medium text-green-900 mb-1">
                Opportunités Profitum
              </p>
              <p className="text-sm text-green-800">
                {enrichmentData.secteur_activite.tendances_profitum}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signaux Opérationnels */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Signaux Opérationnels</h4>
        <div className="grid grid-cols-2 gap-3">
          <SignalBadge
            icon={Users}
            label="Recrutements en cours"
            active={enrichmentData.signaux_operationnels.recrutements_en_cours}
          />
          <SignalBadge
            icon={MapPin}
            label="Locaux physiques"
            active={enrichmentData.signaux_operationnels.locaux_physiques}
          />
          <SignalBadge
            icon={Truck}
            label="Parc véhicules lourds (+7.5t)"
            active={enrichmentData.signaux_operationnels.parc_vehicules_lourds}
          />
          <SignalBadge
            icon={Flame}
            label="Consommation gaz importante"
            active={enrichmentData.signaux_operationnels.consommation_gaz_importante}
          />
        </div>
        {enrichmentData.signaux_operationnels.details && (
          <p className="mt-3 text-xs text-gray-600 italic">
            {enrichmentData.signaux_operationnels.details}
          </p>
        )}
      </div>

      {/* Profil d'Éligibilité */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Profil d'Éligibilité Produits</h4>
        <div className="space-y-3">
          <EligibilityCard
            title="TICPE (Taxe Carburants)"
            data={enrichmentData.profil_eligibilite.ticpe}
          />
          <EligibilityCard
            title="CEE (Certificats Économies d'Énergie)"
            data={enrichmentData.profil_eligibilite.cee}
          />
          <EligibilityCard
            title="Optimisation Sociale (URSSAF, DFS)"
            data={enrichmentData.profil_eligibilite.optimisation_sociale}
          />
        </div>
      </div>

      {/* Actualités */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Actualités & Contexte</h4>
        <ul className="space-y-2 mb-3">
          {enrichmentData.actualites_entreprise.recentes.map((actualite, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>{actualite}</span>
            </li>
          ))}
        </ul>
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <p className="text-xs font-medium text-purple-900 mb-1">
            Pertinence Profitum
          </p>
          <p className="text-sm text-purple-800">
            {enrichmentData.actualites_entreprise.pertinence_profitum}
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant helper pour les signaux
const SignalBadge: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}> = ({ icon: Icon, label, active }) => (
  <div
    className={`flex items-center gap-2 p-2 rounded text-sm ${
      active
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-50 text-gray-500 border border-gray-200'
    }`}
  >
    <Icon className="h-4 w-4 flex-shrink-0" />
    <span className="text-xs">{label}</span>
    {active ? (
      <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 ml-auto text-gray-400" />
    )}
  </div>
);

// Composant helper pour l'éligibilité
const EligibilityCard: React.FC<{
  title: string;
  data: {
    eligible: boolean;
    raison: string;
    potentiel_economie?: string;
  };
}> = ({ title, data }) => (
  <div
    className={`p-3 rounded border ${
      data.eligible
        ? 'bg-green-50 border-green-200'
        : 'bg-gray-50 border-gray-200'
    }`}
  >
    <div className="flex items-start justify-between mb-2">
      <h5 className={`text-sm font-medium ${
        data.eligible ? 'text-green-900' : 'text-gray-700'
      }`}>
        {title}
      </h5>
      {data.eligible ? (
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-gray-400" />
      )}
    </div>
    <p className={`text-xs mb-2 ${
      data.eligible ? 'text-green-800' : 'text-gray-600'
    }`}>
      {data.raison}
    </p>
    {data.potentiel_economie && (
      <div className={`text-xs font-medium ${
        data.eligible ? 'text-green-700' : 'text-gray-600'
      }`}>
        💰 {data.potentiel_economie}
      </div>
    )}
  </div>
);

export default ProspectEnrichmentView;

