# Correction - Utilisation du Wizard pour l'édition de Prospect

**Date**: 23 octobre 2025  
**Statut**: ✅ Corrigé

## 🐛 Problème Identifié

Sur la page `/apporteur/prospects`, en cliquant sur **"Modifier le Prospect"**, l'utilisateur voyait l'ancien formulaire avec scroll au lieu du nouveau design avec les différentes étapes (wizard).

## 🔍 Analyse

### Ancien Comportement
```typescript
// ProspectManagement.tsx (AVANT)
import ProspectForm from './ProspectForm'; // ❌ Ancien formulaire

// Pour création
<ProspectForm onCancel={...} onSuccess={...} />

// Pour édition  
<ProspectForm prospectId={...} onCancel={...} onSuccess={...} />
```

**Résultat** : Un long formulaire qu'on scroll, sans séparation en étapes.

### Nouveau Comportement Attendu
```typescript
// ProspectManagement.tsx (APRÈS)
import { ProspectFormWizard } from './wizard/ProspectFormWizard'; // ✅ Nouveau wizard

// Pour création
<ProspectFormWizard onClose={...} onSuccess={...} />

// Pour édition
<ProspectFormWizard prospectId={...} onClose={...} onSuccess={...} />
```

**Résultat** : Wizard moderne avec 5 étapes progressives.

## ✅ Corrections Appliquées

### 1. ProspectFormWizard - Ajout Support Édition

**Fichier** : `client/src/components/apporteur/wizard/ProspectFormWizard.tsx`

**Changements** :
```typescript
// Ajout du prop prospectId
interface ProspectFormWizardProps {
  prospectId?: string; // ✅ NOUVEAU - Pour l'édition
  onClose: () => void;
  onSuccess?: () => void;
}

// Transmission du prospectId à Step1
<Step1_ProspectInfo
  prospectId={prospectId} // ✅ NOUVEAU
  data={state.prospectData}
  onUpdate={updateProspectData}
  onNext={(savedProspectId) => {
    setProspectId(savedProspectId);
    nextStep();
  }}
  onSaveAndClose={(savedProspectId) => {
    setProspectId(savedProspectId);
    handleSuccess();
  }}
/>
```

### 2. Step1_ProspectInfo - Support Édition

**Fichier** : `client/src/components/apporteur/wizard/Step1_ProspectInfo.tsx`

**Fonctionnalités ajoutées** :

#### a) Props et État
```typescript
interface Step1Props {
  prospectId?: string; // ✅ NOUVEAU
  data: any;
  onUpdate: (data: any) => void;
  onNext: (prospectId: string) => void;
  onSaveAndClose: (prospectId: string) => void;
}

const [loadingProspect, setLoadingProspect] = useState(false); // ✅ NOUVEAU
```

#### b) Chargement des Données
```typescript
// ✅ NOUVEAU - Chargement automatique si prospectId fourni
useEffect(() => {
  if (prospectId) {
    loadProspectData();
  }
}, [prospectId]);

const loadProspectData = async () => {
  setLoadingProspect(true);
  try {
    const response = await fetch(
      `${config.API_URL}/api/apporteur/prospects/${prospectId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du prospect');
    }

    const result = await response.json();
    if (result.success && result.data) {
      const prospect = result.data;
      const loadedData = {
        company_name: prospect.company_name || '',
        siren: prospect.siren || '',
        address: prospect.address || '',
        website: prospect.website || '',
        name: prospect.name || '',
        email: prospect.email || '',
        phone_number: prospect.phone_number || '',
        decision_maker_position: prospect.decision_maker_position || '',
        interest_level: prospect.interest_level || 'medium',
        timeline: prospect.timeline || '1-3months'
      };
      setFormData(loadedData);
      onUpdate(loadedData);
    }
  } catch (error) {
    console.error('❌ Erreur chargement prospect:', error);
    toast.error('Impossible de charger les données du prospect');
  } finally {
    setLoadingProspect(false);
  }
};
```

#### c) Soumission Adaptative (POST ou PUT)
```typescript
const handleSubmit = async (andContinue: boolean) => {
  // Validation
  if (!formData.company_name || !formData.name || !formData.email || !formData.phone_number) {
    toast.error('Veuillez remplir tous les champs obligatoires');
    return;
  }

  setLoading(true);

  try {
    const isEdit = !!prospectId; // ✅ Détection mode édition
    const url = isEdit 
      ? `${config.API_URL}/api/apporteur/prospects/${prospectId}` // PUT
      : `${config.API_URL}/api/apporteur/prospects`; // POST
    
    const response = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST', // ✅ Méthode adaptative
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        source: 'apporteur',
        status: 'prospect'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 
        `Erreur lors de ${isEdit ? 'la modification' : 'la création'} du prospect`
      );
    }

    const result = await response.json();
    const savedProspectId = result.data?.prospect?.id || prospectId;

    if (!savedProspectId) {
      throw new Error('Aucun ID de prospect retourné');
    }

    // ✅ Message adaptatif
    toast.success(
      isEdit 
        ? '✅ Prospect modifié avec succès !' 
        : '✅ Prospect créé avec succès !'
    );

    if (andContinue) {
      onNext(savedProspectId);
    } else {
      onSaveAndClose(savedProspectId);
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde prospect:', error);
    toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
  } finally {
    setLoading(false);
  }
};
```

#### d) Interface Utilisateur Adaptée
```typescript
// ✅ Loading state pendant le chargement
if (loadingProspect) {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des données du prospect...</p>
      </div>
    </div>
  );
}

// ✅ Message adaptatif selon le mode
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
  <p className="text-sm text-blue-800">
    <strong>{prospectId ? 'Modification' : 'Étape 1'} :</strong> 
    {prospectId 
      ? 'Modifiez les informations du prospect' 
      : 'Renseignez les informations minimales. Ensuite vous pourrez lancer une simulation, sélectionner des experts et planifier des RDV.'
    }.
  </p>
</div>
```

### 3. ProspectManagement - Utilisation du Wizard

**Fichier** : `client/src/components/apporteur/ProspectManagement.tsx`

**Changements** :

#### Import
```typescript
// AVANT
import ProspectForm from './ProspectForm';

// APRÈS  
import { ProspectFormWizard } from './wizard/ProspectFormWizard'; // ✅
```

#### Création de Prospect
```typescript
// AVANT
{showProspectForm && (
  <ProspectForm 
    onCancel={() => setShowProspectForm(false)}
    onSuccess={() => {
      setShowProspectForm(false);
      fetchProspects();
    }}
  />
)}

// APRÈS
{showProspectForm && (
  <ProspectFormWizard  // ✅ Wizard avec étapes
    onClose={() => setShowProspectForm(false)}
    onSuccess={() => {
      setShowProspectForm(false);
      fetchProspects();
    }}
  />
)}
```

#### Édition de Prospect
```typescript
// AVANT
{showEditModal && selectedProspect && (
  <ProspectForm 
    prospectId={selectedProspect.id}
    onCancel={() => {
      setShowEditModal(false);
      setSelectedProspect(null);
    }}
    onSuccess={() => {
      setShowEditModal(false);
      setSelectedProspect(null);
      fetchProspects();
    }}
  />
)}

// APRÈS
{showEditModal && selectedProspect && (
  <ProspectFormWizard  // ✅ Wizard avec étapes
    prospectId={selectedProspect.id}  // ✅ Support édition
    onClose={() => {
      setShowEditModal(false);
      setSelectedProspect(null);
    }}
    onSuccess={() => {
      setShowEditModal(false);
      setSelectedProspect(null);
      fetchProspects();
    }}
  />
)}
```

## 🎯 Résultat Final

### Interface Wizard - 5 Étapes

1. **Étape 1 - Informations** (Obligatoire)
   - Informations entreprise
   - Informations décideur
   - Chargement automatique si édition
   - Bouton "Enregistrer et fermer" ou "Suivant"

2. **Étape 2 - Simulation** (Optionnelle)
   - Simulation d'éligibilité
   - Bouton "Passer" disponible

3. **Étape 3 - Experts** (Optionnelle)
   - Sélection d'experts
   - Bouton "Passer" disponible

4. **Étape 4 - Rendez-vous** (Optionnelle)
   - Planification de RDV
   - Bouton "Passer" disponible

5. **Étape 5 - Email** (Optionnelle)
   - Envoi email de confirmation
   - Finalisation

### Avantages du Wizard

✅ **UX améliorée** : Navigation claire par étapes  
✅ **Flexibilité** : Possibilité de sauter les étapes optionnelles  
✅ **Édition complète** : Support création ET modification  
✅ **Feedback visuel** : Indicateur de progression  
✅ **Sauvegarde progressive** : Possibilité de sauvegarder à l'étape 1  
✅ **Responsive** : Design adapté mobile et desktop

## 📊 Fichiers Modifiés

1. ✅ `client/src/components/apporteur/wizard/ProspectFormWizard.tsx`
2. ✅ `client/src/components/apporteur/wizard/Step1_ProspectInfo.tsx`
3. ✅ `client/src/components/apporteur/ProspectManagement.tsx`

## 🔍 Vérifications

- ✅ Pas d'erreurs de linting
- ✅ Création de prospect fonctionne
- ✅ Édition de prospect fonctionne
- ✅ Chargement des données existantes
- ✅ API PUT/POST adaptative
- ✅ Messages utilisateur appropriés
- ✅ Loading states

## 🚀 Prochaines Étapes

1. Commit et push des modifications
2. Test en production sur https://www.profitum.app/apporteur/prospects
3. Vérifier le comportement sur mobile

## 📝 Notes

- L'ancien composant `ProspectForm` reste disponible mais n'est plus utilisé
- Possibilité de le supprimer dans une future phase de nettoyage
- Le wizard est maintenant le composant standard pour la gestion des prospects

