# 📋 Système de Timeline/Commentaires pour Dossiers

## 🎯 Vue d'ensemble

Système complet de suivi commercial des dossiers avec timeline automatique et commentaires manuels. Permet un suivi optimal du processus de vente avec visibilité différenciée selon les rôles (Expert, Apporteur, Admin).

---

## 📊 Structure de la table `DossierComment`

### Colonnes principales

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `dossier_id` | UUID | Référence ClientProduitEligible |
| `comment_type` | TEXT | 'system' ou 'manual' |
| `category` | TEXT | Type de commentaire (voir ci-dessous) |
| `event_type` | TEXT | Événement précis |
| `content` | TEXT | Contenu du commentaire |
| `metadata` | JSONB | Données additionnelles |
| `priority` | TEXT | 'low', 'medium', 'high', 'critical' |
| `created_by` | UUID | Auteur (pour manuels) |
| `created_by_type` | TEXT | 'expert', 'admin', 'apporteur', 'system' |
| `visible_to_expert` | BOOLEAN | Visible pour expert |
| `visible_to_apporteur` | BOOLEAN | Visible pour apporteur |
| `visible_to_admin` | BOOLEAN | Visible pour admin |

### Catégories de commentaires

#### 🔴 **Alertes** (`alert`)
- Inactivité 7 jours (priorité: medium)
- Inactivité 14 jours (priorité: high)
- Inactivité 30 jours (priorité: critical)
- Documents manquants
- Relance nécessaire

#### 📅 **Événements RDV** (`rdv_event`)
- `rdv_created` - RDV créé
- `rdv_confirmed` - RDV confirmé
- `rdv_completed` - RDV complété
- `rdv_cancelled` - RDV annulé
- `rdv_rescheduled` - RDV reprogrammé

#### 📄 **Documents** (`document`)
- `document_uploaded` - Document uploadé
- `document_approved` - Document validé
- `document_rejected` - Document rejeté
- `document_requested` - Document demandé

#### 📊 **Changements de statut** (`status_change`)
- Tous les 20 statuts du cycle de vie (voir `statuts.ts`)
- Tracking automatique de chaque changement

#### 📞 **Actions commerciales Expert** (`expert_action`)
- Appel effectué
- Email envoyé
- Notes ajoutées
- Audit démarré/complété
- Validation effectuée

#### 🤝 **Actions commerciales Apporteur** (`apporteur_action`)
- Contact initial
- Appel effectué
- Email envoyé
- Présentation effectuée
- Négociation en cours

---

## 🔧 Utilisation Backend

### 1. Exécuter le script SQL

```bash
# Via psql
psql -h <host> -U <user> -d <database> -f server/scripts/create-dossier-comments-table.sql

# Ou via Supabase Dashboard SQL Editor
# Copier/coller le contenu du fichier
```

### 2. Routes API disponibles

#### GET `/api/dossier/:dossierId/comments`
Récupérer tous les commentaires d'un dossier

**Query params:**
- `category` (optional): Filtrer par catégorie
- `limit` (default: 50): Nombre de résultats
- `offset` (default: 0): Pagination

**Exemple:**
```typescript
const response = await get(`/api/dossier/${dossierId}/comments?category=alert&limit=20`);
```

#### POST `/api/dossier/:dossierId/comments`
Créer un commentaire manuel

**Body:**
```json
{
  "content": "Appel client effectué, bon retour",
  "category": "expert_action",
  "event_type": "phone_call",
  "metadata": {
    "duration": "15 minutes",
    "next_action": "Envoyer devis"
  }
}
```

#### PATCH `/api/dossier/:dossierId/comments/:commentId`
Modifier un commentaire manuel (uniquement l'auteur ou admin)

**Body:**
```json
{
  "content": "Texte modifié"
}
```

#### DELETE `/api/dossier/:dossierId/comments/:commentId`
Supprimer un commentaire manuel (soft delete)

#### GET `/api/dossier/:dossierId/comments/stats`
Obtenir les statistiques des commentaires

**Réponse:**
```json
{
  "success": true,
  "data": {
    "total_comments": 45,
    "system_comments": 30,
    "manual_comments": 15,
    "alerts_count": 2,
    "rdv_events_count": 8,
    "document_events_count": 12,
    "critical_alerts": 0,
    "high_alerts": 1,
    "last_comment_at": "2025-01-15T10:30:00Z"
  }
}
```

#### POST `/api/dossier/check-inactivity-alerts` (Admin only)
Déclencher la vérification des alertes d'inactivité

---

## 💻 Utilisation Frontend

### Intégrer le composant Timeline

```tsx
import DossierTimeline from '@/components/dossier/DossierTimeline';

function DossierSynthesePage() {
  const { dossierId } = useParams();
  const { user } = useAuth();

  return (
    <div>
      {/* Autres sections */}
      
      <DossierTimeline 
        dossierId={dossierId} 
        userType={user.type} 
      />
    </div>
  );
}
```

### Props du composant

| Prop | Type | Description |
|------|------|-------------|
| `dossierId` | string | ID du dossier (ClientProduitEligible) |
| `userType` | 'expert' \| 'admin' \| 'apporteur' | Type d'utilisateur connecté |

### Fonctionnalités du composant

✅ **Affichage chronologique** des commentaires (du plus récent au plus ancien)
✅ **Filtrage par catégorie** via dropdown
✅ **Badges visuels** pour priorité et type
✅ **Icônes colorées** par catégorie
✅ **Formulaire d'ajout** de commentaires manuels
✅ **Édition/suppression** des commentaires (auteur ou admin uniquement)
✅ **Timestamps relatifs** (ex: "il y a 2 heures")
✅ **Informations créateur** enrichies
✅ **Métadonnées détaillées** (repliables)
✅ **Stats rapides** en en-tête

---

## 🤖 Triggers Automatiques

### 1. Changement de statut
Déclenché automatiquement à chaque mise à jour du statut d'un dossier.

**Exemple:**
```sql
UPDATE "ClientProduitEligible" 
SET statut = 'audit_in_progress' 
WHERE id = '...';

-- Crée automatiquement:
-- Catégorie: status_change
-- Priorité: medium (selon statut)
-- Content: "Statut changé de 'expert_assigned' à 'audit_in_progress'"
```

### 2. Événements RDV
Déclenché à la création ou modification d'un RDV lié au dossier.

**Exemple:**
```sql
INSERT INTO "RDV" (...) VALUES (...);

-- Crée automatiquement:
-- Catégorie: rdv_event
-- Event: rdv_created
-- Content: "RDV créé: Audit initial le 15/01/2025 à 14:00"
```

### 3. Upload de documents
Déclenché à l'upload ou validation d'un document.

**Exemple:**
```sql
INSERT INTO "DocumentFile" (...) VALUES (...);

-- Crée automatiquement:
-- Catégorie: document
-- Event: document_uploaded
-- Content: "Document uploadé: bilan_2024.pdf"
```

---

## ⚠️ Système d'Alertes d'Inactivité

### Configuration

| Seuil | Priorité | Description |
|-------|----------|-------------|
| 7 jours | `medium` | Alerte faible - Relance recommandée |
| 14 jours | `high` | Alerte modérée - Relance urgente |
| 30 jours | `critical` | Alerte élevée - Action immédiate requise |

### Vérification automatique

À exécuter via **CRON** (recommandé : 1x/jour à 9h00) :

```typescript
// Dans cron job ou scheduler
await post('/api/dossier/check-inactivity-alerts');
```

Ou manuellement depuis l'interface admin.

### Logique de détection

1. Récupère tous les dossiers actifs (non archivés/annulés/terminés)
2. Calcule la dernière activité = MAX(dossier.updated_at, last_comment.created_at)
3. Compare avec les seuils (7j, 14j, 30j)
4. Crée une alerte si pas d'alerte similaire dans les dernières 24h

---

## 🔐 Permissions & Visibilité

### Matrice de visibilité

| Rôle | Voir commentaires | Ajouter | Modifier | Supprimer |
|------|-------------------|---------|----------|-----------|
| **Expert** | ✅ Si `visible_to_expert=true` | ✅ Expert actions | ✅ Ses commentaires | ✅ Ses commentaires |
| **Apporteur** | ✅ Si `visible_to_apporteur=true` | ✅ Apporteur actions | ✅ Ses commentaires | ✅ Ses commentaires |
| **Admin** | ✅ Tous | ✅ Tous types | ✅ Tous | ✅ Tous |
| **Client** | ❌ Jamais | ❌ | ❌ | ❌ |

### Créer un commentaire invisible pour un rôle

```typescript
await post(`/api/dossier/${dossierId}/comments`, {
  content: "Note confidentielle admin",
  category: "expert_action",
  event_type: "internal_note",
  visible_to_expert: false,  // ❌ Expert ne verra pas
  visible_to_apporteur: false  // ❌ Apporteur ne verra pas
});
```

---

## 📈 Statistiques & Vues

### Vue `DossierCommentStats`

Fournit des agrégations par dossier :

```sql
SELECT * FROM "DossierCommentStats" WHERE dossier_id = '...';
```

Utile pour :
- Dashboard admin (dossiers avec alertes critiques)
- Indicateurs de performance (ratio commentaires système/manuels)
- Détection de dossiers "froids" (peu d'activité)

---

## 🔧 Maintenance

### Nettoyer les commentaires supprimés

```sql
-- Supprimer définitivement les commentaires soft-deleted de plus de 90 jours
DELETE FROM "DossierComment"
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '90 days';
```

### Créer des commentaires initiaux pour dossiers existants

Le script SQL inclut déjà une section pour créer un commentaire initial pour les 100 premiers dossiers existants. Pour en créer plus :

```sql
INSERT INTO "DossierComment" (dossier_id, comment_type, category, event_type, content, ...)
SELECT 
  id,
  'system',
  'status_change',
  'dossier_created',
  'Dossier créé - Statut initial: ' || statut,
  ...
FROM "ClientProduitEligible"
WHERE NOT EXISTS (
  SELECT 1 FROM "DossierComment" WHERE dossier_id = "ClientProduitEligible".id
);
```

---

## 🎨 Personnalisation UI

### Modifier les couleurs des catégories

Dans `DossierTimeline.tsx` :

```typescript
const getCategoryColor = (category: CommentCategory) => {
  switch (category) {
    case 'alert':
      return 'text-red-600 bg-red-50';  // Modifier ici
    // ...
  }
};
```

### Ajouter un nouveau type d'événement

1. **Backend** : Ajouter dans le SQL ou via trigger
2. **Frontend** : Ajouter dans `event_type` et gérer l'affichage

---

## 📝 Exemples d'utilisation

### Cas 1: Expert ajoute une note après appel client

```typescript
await post(`/api/dossier/${dossierId}/comments`, {
  content: "Appel client: Très intéressé, demande devis sous 48h. Relancer vendredi.",
  category: "expert_action",
  event_type: "phone_call",
  metadata: {
    duration: "25 minutes",
    next_action: "Préparer devis",
    deadline: "2025-01-17"
  }
});
```

### Cas 2: Apporteur documente une négociation

```typescript
await post(`/api/dossier/${dossierId}/comments`, {
  content: "Négociation sur le montant: Client propose 80K€ au lieu de 100K€. À valider avec l'expert.",
  category: "apporteur_action",
  event_type: "negotiation",
  metadata: {
    proposed_amount: 80000,
    original_amount: 100000,
    needs_expert_approval: true
  }
});
```

### Cas 3: Admin crée une alerte manuelle

```typescript
await post(`/api/dossier/${dossierId}/comments`, {
  content: "URGENT: Documents manquants depuis 10 jours. Relancer le client immédiatement.",
  category: "alert",
  event_type: "missing_documents",
  priority: "critical"
});
```

---

## 🚀 Prochaines étapes (optionnel)

### Améliorations futures

- [ ] **Notifications push** lors de nouveaux commentaires
- [ ] **Mentions** (@user) dans les commentaires
- [ ] **Pièces jointes** aux commentaires manuels
- [ ] **Templates** de commentaires fréquents
- [ ] **Export PDF** de la timeline
- [ ] **Recherche full-text** dans les commentaires
- [ ] **Webhooks** sur événements critiques

---

## 🐛 Troubleshooting

### Les triggers ne se déclenchent pas

1. Vérifier que les triggers sont bien créés :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%comment%';
```

2. Vérifier les logs PostgreSQL pour erreurs

### Les commentaires n'apparaissent pas

1. Vérifier la visibilité selon le rôle
2. Vérifier que `deleted_at IS NULL`
3. Vérifier les permissions RLS si activées

### Performance lente

1. Vérifier les index :
```sql
SELECT * FROM pg_indexes WHERE tablename = 'DossierComment';
```

2. Paginer les résultats (limit/offset)
3. Utiliser la vue `DossierCommentStats` pour agrégations

---

## 📞 Support

Pour toute question ou problème :
- Documentation code : Voir commentaires dans les fichiers source
- Issues GitHub : [Créer une issue](https://github.com/...)

---

**Version:** 1.0.0  
**Dernière mise à jour:** 30 Octobre 2025  
**Auteur:** Équipe Profitum

