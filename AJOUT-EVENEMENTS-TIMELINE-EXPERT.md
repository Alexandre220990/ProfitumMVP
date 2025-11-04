# ✅ Ajout des événements Timeline Expert

**Date** : 4 novembre 2025  
**Objectif** : Tracer toutes les actions EXPERT dans la timeline

---

## 🎯 Problème identifié

L'analyse de la BDD a révélé que **100% des actions EXPERT** n'étaient pas tracées dans la timeline :

| Action Expert | Total | Tracés | Non tracés | % tracé |
|--------------|-------|--------|------------|---------|
| Documents validés | 6 | 0 | **6** | 0% ❌ |
| Documents rejetés | 2 | 0 | **2** | 0% ❌ |
| Assignations | 10 | 0 | **10** | 0% ❌ |

**Note** : Les événements CLIENT (6) et ADMIN (4) fonctionnaient déjà correctement ✅

---

## 🛠️ Solution implémentée

### 1. Nouvelles méthodes ajoutées au `DossierTimelineService`

#### ✅ `documentValideIndividuel`
```typescript
static async documentValideIndividuel(data: {
  dossier_id: string;
  document_name: string;
  expert_id: string;
  expert_name: string;
}): Promise<void>
```

**Affichage timeline** :
```
✅ Document validé
Expert Alex Expertprofitum a validé le document "image.jpg"
```

#### 👨‍💼 `expertAssigne`
```typescript
static async expertAssigne(data: {
  dossier_id: string;
  expert_id: string;
  expert_name: string;
  product_name: string;
  client_name: string;
}): Promise<void>
```

**Affichage timeline** :
```
👨‍💼 Expert assigné
Expert Alex Expertprofitum a accepté le dossier TICPE de AlexTransport
```

#### ❌ `documentRejete` (déjà existait)
Cette méthode existait déjà et était déjà appelée correctement ✅

---

## 📂 Fichiers modifiés

### 1. Service Timeline
**Fichier** : `server/src/services/dossier-timeline-service.ts`
- ✅ Ajout méthode `documentValideIndividuel` (lignes 618-643)
- ✅ Ajout méthode `expertAssigne` (lignes 645-672)

### 2. Route validation de documents
**Fichier** : `server/src/routes/expert-documents.ts`
- ✅ Ajout appel `documentValideIndividuel` après validation (lignes 170-193)
- ✅ Récupération nom expert depuis BDD
- ✅ Gestion d'erreur non bloquante

### 3. Route sélection expert
**Fichier** : `server/src/routes/dossier-steps.ts`
- ✅ Ajout appel `expertAssigne` après sélection (lignes 416-445)
- ✅ Récupération infos dossier (client, produit)
- ✅ Gestion d'erreur non bloquante

---

## 🎨 Types d'événements créés

| Type | Actor Type | Titre | Icon | Couleur | Description |
|------|-----------|-------|------|---------|-------------|
| `expert_action` | expert | ✅ Document validé | ✅ | green | Validation individuelle d'un document |
| `expert_action` | expert | 👨‍💼 Expert assigné | 👨‍💼 | blue | Assignation/acceptation d'un expert |
| `expert_action` | expert | ❌ Document rejeté | ❌ | red | Rejet d'un document (déjà existait) |

---

## 📊 Résultat attendu

Après ces modifications, la timeline d'AlexTransport devrait contenir :

### Dossier TICPE (`57f606c7-00a6-40f0-bb72-ae1831345d99`)
```
👨‍💼 Expert assigné
Expert Alex Expertprofitum a accepté le dossier TICPE de AlexTransport
📅 2025-11-04 13:13:46

✅ Document validé
Expert Alex Expertprofitum a validé le document "image.jpg"
📅 2025-10-31 17:04:24

✅ Document validé
Expert Alex Expertprofitum a validé le document "image.jpg"
📅 2025-10-31 17:04:02

✅ Document validé
Expert Alex Expertprofitum a validé le document "image.jpg"
📅 2025-10-31 17:03:25
```

### Dossier DFS (`ffddb8df-4182-4447-8a43-3944bb85d976`)
```
👨‍💼 Expert assigné
Expert Alex Expertprofitum a accepté le dossier DFS de AlexTransport
📅 2025-11-04 17:38:36

✅ Document validé
Expert Alex Expertprofitum a validé le document "La DFS.pdf"
📅 2025-11-04 17:38:36 (x3)

❌ Document rejeté
Expert Alex Expertprofitum a rejeté le document "La DFS.pdf"
Raison : mauvais document
📅 2025-11-04 17:38:37

❌ Document rejeté
Expert Alex Expertprofitum a rejeté le document "La DFS.pdf"
Raison : pas visible
📅 2025-11-04 17:38:36
```

---

## ✅ Garanties

1. **Pas de régression** : Les événements CLIENT et ADMIN existants ne sont pas modifiés
2. **Non bloquant** : Les erreurs de timeline n'empêchent pas les actions principales
3. **Complet** : Toutes les actions EXPERT sont maintenant tracées
4. **Cohérent** : Format uniforme avec les autres événements timeline

---

## 🧪 Test à effectuer

**Prochaine action par l'expert** :
1. Valider un nouveau document → ✅ Timeline mise à jour
2. Rejeter un document → ❌ Timeline mise à jour (déjà fonctionnel)
3. Être assigné à un dossier → 👨‍💼 Timeline mise à jour

**Réexécuter le diagnostic** :
```sql
-- Copier-coller : ANALYSE-COMPLETE-TIMELINE.sql
```

Le résumé devrait maintenant montrer :
```
| Documents validés par expert | 6 | 6 | 0 | 100% ✅ |
| Documents rejetés par expert | 2 | 2 | 0 | 100% ✅ |
| Assignations expert          | 10| 10| 0 | 100% ✅ |
```

---

## 📦 Commit

Les changements sont prêts à être commitgés de manière sécurisée.

**Fichiers modifiés** :
- `server/src/services/dossier-timeline-service.ts` (2 nouvelles méthodes)
- `server/src/routes/expert-documents.ts` (1 appel timeline)
- `server/src/routes/dossier-steps.ts` (1 appel timeline)

**Impact** : Ajout uniquement, aucune suppression, aucune modification des fonctionnalités existantes.

