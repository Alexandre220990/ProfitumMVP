import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ExcelFileData, EntityType, MappingConfig, MappingRule, TransformationConfig } from '@/types/import';
import { toast } from 'sonner';

interface ColumnMapperProps {
  fileData: ExcelFileData;
  entityType: EntityType;
  onMappingConfigured: (mappingConfig: MappingConfig) => void;
  initialMapping?: MappingConfig;
}

// Champs disponibles par type d'entité
const AVAILABLE_FIELDS: Record<EntityType, Array<{ value: string; label: string; required?: boolean }>> = {
  client: [
    { value: 'email', label: 'Email', required: true },
    { value: 'first_name', label: 'Prénom' },
    { value: 'last_name', label: 'Nom' },
    { value: 'name', label: 'Nom complet' },
    { value: 'company_name', label: 'Nom de l\'entreprise', required: true },
    { value: 'phone_number', label: 'Téléphone' },
    { value: 'address', label: 'Adresse' },
    { value: 'city', label: 'Ville' },
    { value: 'postal_code', label: 'Code postal' },
    { value: 'siren', label: 'SIREN' },
    { value: 'secteurActivite', label: 'Secteur d\'activité' },
    { value: 'nombreEmployes', label: 'Nombre d\'employés' },
    { value: 'revenuAnnuel', label: 'Revenu annuel' },
    { value: 'username', label: 'Nom d\'utilisateur' }
  ],
  expert: [
    { value: 'email', label: 'Email', required: true },
    { value: 'first_name', label: 'Prénom' },
    { value: 'last_name', label: 'Nom' },
    { value: 'name', label: 'Nom complet' },
    { value: 'company_name', label: 'Nom de l\'entreprise', required: true },
    { value: 'siren', label: 'SIREN', required: true },
    { value: 'phone', label: 'Téléphone' },
    { value: 'specializations', label: 'Spécialisations' },
    { value: 'experience', label: 'Expérience' },
    { value: 'description', label: 'Description' },
    { value: 'location', label: 'Localisation' },
    { value: 'website', label: 'Site web' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'languages', label: 'Langues' },
    { value: 'cabinet_id', label: 'Cabinet (ID)' }
  ],
  apporteur: [
    { value: 'email', label: 'Email', required: true },
    { value: 'first_name', label: 'Prénom' },
    { value: 'last_name', label: 'Nom' },
    { value: 'company_name', label: 'Nom de l\'entreprise' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'siren', label: 'SIREN' },
    { value: 'company_type', label: 'Type d\'entreprise' }
  ]
};

const TRANSFORMATION_TYPES: Array<{ value: string; label: string }> = [
  { value: 'direct', label: 'Direct (aucune transformation)' },
  { value: 'format', label: 'Format (date, téléphone, nombre)' },
  { value: 'lookup', label: 'Recherche (expert, cabinet, produit)' },
  { value: 'split', label: 'Diviser (nom complet → prénom/nom)' }
];

export default function ColumnMapper({
  fileData,
  entityType,
  onMappingConfigured,
  initialMapping
}: ColumnMapperProps) {
  const [partnerName, setPartnerName] = useState(initialMapping?.partnerName || 'Prospection_Interne');
  const [rules, setRules] = useState<MappingRule[]>(
    initialMapping?.rules || fileData.columns.map(col => ({
      excelColumn: col,
      databaseField: '',
      isRequired: false,
      transformation: { type: 'direct' }
    }))
  );

  // Suggestions automatiques basées sur similarité
  useEffect(() => {
    if (!initialMapping) {
      const suggestedRules = rules.map(rule => {
        const excelCol = rule.excelColumn.toLowerCase();
        const availableFields = AVAILABLE_FIELDS[entityType];

        // Chercher une correspondance approximative
        for (const field of availableFields) {
          const fieldLabel = field.label.toLowerCase();
          const fieldValue = field.value.toLowerCase();

          if (
            excelCol.includes(fieldValue) ||
            fieldValue.includes(excelCol) ||
            excelCol.includes(fieldLabel) ||
            fieldLabel.includes(excelCol)
          ) {
            return {
              ...rule,
              databaseField: field.value,
              isRequired: field.required || false
            };
          }
        }

        return rule;
      });

      setRules(suggestedRules);
    }
  }, []);

  const handleFieldChange = (index: number, field: string) => {
    const newRules = [...rules];
    newRules[index].databaseField = field;
    
    // Marquer comme requis si le champ l'est
    const availableFields = AVAILABLE_FIELDS[entityType];
    const fieldDef = availableFields.find(f => f.value === field);
    newRules[index].isRequired = fieldDef?.required || false;
    
    setRules(newRules);
  };

  const handleTransformationChange = (index: number, transformationType: string) => {
    const newRules = [...rules];
    newRules[index].transformation = {
      type: transformationType as any,
      params: {}
    };
    setRules(newRules);
  };

  const handleRequiredChange = (index: number, checked: boolean) => {
    const newRules = [...rules];
    newRules[index].isRequired = checked;
    setRules(newRules);
  };

  const handleDefaultValueChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index].defaultValue = value || undefined;
    setRules(newRules);
  };

  const handleSave = () => {
    // Valider qu'au moins les champs requis sont mappés
    const requiredFields = AVAILABLE_FIELDS[entityType].filter(f => f.required);
    const mappedFields = rules.filter(r => r.databaseField).map(r => r.databaseField);
    
    const missingRequired = requiredFields.filter(
      req => !mappedFields.includes(req.value)
    );

    if (missingRequired.length > 0) {
      toast.error(
        `Champs requis manquants: ${missingRequired.map(f => f.label).join(', ')}`
      );
      return;
    }

    const mappingConfig: MappingConfig = {
      partnerName,
      entityType,
      rules: rules.filter(r => r.databaseField) // Ne garder que les règles avec un champ mappé
    };

    onMappingConfigured(mappingConfig);
    toast.success('Mapping configuré avec succès');
  };

  const availableFields = AVAILABLE_FIELDS[entityType];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Mapping des colonnes</h2>
        <p className="text-sm text-gray-600">
          Associez chaque colonne Excel à un champ de la base de données
        </p>
      </div>

      <div>
        <Label htmlFor="partner-name">Nom du partenaire / source</Label>
        <Input
          id="partner-name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="ex: CRM_Partenaire_1"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Ce nom permet d'identifier la source des données et de réutiliser le mapping
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Colonne Excel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Champ BDD
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transformation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requis
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valeur par défaut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {rule.excelColumn}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={rule.databaseField}
                      onValueChange={(value) => handleFieldChange(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un champ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Ignorer cette colonne --</SelectItem>
                        {availableFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {rule.databaseField && (
                      <Select
                        value={rule.transformation?.type || 'direct'}
                        onValueChange={(value) => handleTransformationChange(index, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSFORMATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={rule.isRequired}
                      onCheckedChange={(checked) => handleRequiredChange(index, checked as boolean)}
                      disabled={availableFields.find(f => f.value === rule.databaseField)?.required}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="text"
                      value={rule.defaultValue || ''}
                      onChange={(e) => handleDefaultValueChange(index, e.target.value)}
                      placeholder="Optionnel"
                      className="w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
          Continuer
        </Button>
      </div>
    </div>
  );
}

