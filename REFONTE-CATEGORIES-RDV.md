# Refonte Système de Catégories RDV

## 🎯 Objectif
Transformer les catégories RDV de "types d'utilisateurs" vers "étapes du processus commercial" pour un meilleur suivi du cycle de vente.

## 📋 Catégories Proposées

### Phase 1: Prospection & Découverte
- `premier_contact` - Premier contact
- `qualification_besoin` - Qualification du besoin

### Phase 2: Analyse & Proposition
- `analyse_situation` - Analyse de la situation
- `presentation_expert` - Présentation expert
- `proposition_commerciale` - Proposition commerciale

### Phase 3: Négociation & Closing
- `negociation` - Négociation
- `validation_signature` - Validation et signature

### Phase 4: Delivery & Suivi
- `remise_rapport_expert` - Remise rapport expert
- `suivi_dossier` - Suivi de dossier
- `cloture_dossier` - Clôture de dossier

### Autres
- `relance` - Relance / Follow-up
- `autre` - Autre

## 🎨 Couleurs par Étape

```javascript
const CATEGORY_COLORS = {
  premier_contact: '#3B82F6',         // Bleu
  qualification_besoin: '#8B5CF6',    // Violet
  analyse_situation: '#EC4899',       // Rose
  presentation_expert: '#F59E0B',     // Orange
  proposition_commerciale: '#10B981', // Vert
  negociation: '#F97316',             // Orange foncé
  validation_signature: '#22C55E',    // Vert vif
  remise_rapport_expert: '#06B6D4',   // Cyan
  suivi_dossier: '#84CC16',           // Lime
  cloture_dossier: '#6B7280',         // Gris
  relance: '#EF4444',                 // Rouge
  autre: '#9CA3AF'                    // Gris clair
};
```

## 📊 Utilisation dans l'Application

### Dashboards
1. **Apporteur**
   - Pipeline commercial par étape
   - Taux de conversion étape par étape
   - Durée moyenne par étape
   - RDV à venir par catégorie

2. **Admin**
   - Funnel de vente global
   - Performance par apporteur/étape
   - Identification des blocages
   - Analytics détaillées

3. **Expert**
   - RDV filtrés par type d'intervention
   - Préparation selon l'étape

### Calendrier
- Code couleur automatique selon l'étape
- Filtres par catégorie
- Vue pipeline intégrée

## 🔧 Modifications à Apporter

### Backend
- [ ] Mettre à jour validation Joi dans `calendar.ts`
- [ ] Mettre à jour transformation `transformCalendarEventToRDV()`
- [ ] Mettre à jour valeur par défaut
- [ ] Créer constantes CATEGORY_* dans types

### Frontend
- [ ] Mettre à jour options Select dans formulaire
- [ ] Ajouter code couleur dans calendrier
- [ ] Implémenter filtres par catégorie
- [ ] Créer visualisations dashboards

### Base de Données
- [ ] Migration données existantes (optionnel)
- [ ] Documentation schéma

## 📈 Bénéfices Attendus

1. **Suivi Commercial Précis**
   - Vision claire de l'avancement des dossiers
   - Identification des étapes bloquantes
   - Optimisation du processus de vente

2. **Analytics Avancées**
   - Taux de conversion par étape
   - Durée moyenne par étape
   - Prédiction de closing

3. **Productivité**
   - Priorisation des actions
   - Préparation adaptée par étape
   - Automatisation rappels selon étape

## 🚀 Mise en Œuvre

### Phase 1 (Immédiat)
- Mise à jour backend et frontend
- Migration données RDV existants → 'autre'

### Phase 2 (Court terme)
- Implémentation dashboards avec nouvelles catégories
- Code couleur calendrier

### Phase 3 (Moyen terme)
- Analytics avancées
- Automatisations selon étapes
- Notifications intelligentes

