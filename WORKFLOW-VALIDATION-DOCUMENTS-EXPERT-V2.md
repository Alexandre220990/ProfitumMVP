# 📋 Workflow Validation Documents Expert - Version 2

**Date** : 4 novembre 2025  
**Objectif** : Système complet de validation avec persistance et 3 flows différents

---

## 🎯 Vue d'ensemble

L'expert dispose de **3 façons** de traiter les documents :
1. **Validation individuelle immédiate** (action directe)
2. **Lancer l'audit** (validation groupée, tous OK)
3. **Demander documents complémentaires** (validation groupée avec rejets)

---

## 💾 Persistance des choix (État temporaire)

### Stockage dans `ClientProduitEligible.metadata`

```typescript
metadata: {
  expert_validations: {
    "doc-uuid-1": { 
      status: "valid", 
      reason: "",
      checked_at: "2025-11-04T10:30:00Z"
    },
    "doc-uuid-2": { 
      status: "invalid", 
      reason: "Document illisible",
      checked_at: "2025-11-04T10:31:00Z"
    },
    "doc-uuid-3": { 
      status: "pending", 
      reason: "",
      checked_at: null
    }
  }
}
```

### Avantages
✅ L'expert peut se déconnecter et revenir → ses choix sont sauvegardés  
✅ Pas de modification des documents tant qu'il n'a pas validé définitivement  
✅ Affichage de l'état en cours dans l'UI

---

## 🔄 Flow 1 : Validation individuelle immédiate

### Déclencheur
Expert clique sur **"Valider"** directement sur UN document

### Actions
```
1. Document → status: 'validated' en BDD
2. Suppression de l'entrée dans metadata.expert_validations
3. Timeline : "✅ Document validé - filename.pdf"
```

### Route
`PUT /api/expert/document/:id/validate`

### Événement Timeline
```typescript
DossierTimelineService.documentValideIndividuel({
  dossier_id: "...",
  document_name: "facture.pdf",
  expert_id: "...",
  expert_name: "Alex Expertprofitum"
})
```

### Affichage Timeline
```
✅ Document validé
Expert Alex Expertprofitum a validé le document "facture.pdf"
📅 2025-11-04 10:35:00
```

---

## 🔄 Flow 2A : Lancer l'audit (Tous documents OK)

### Déclencheur
Expert coche plusieurs docs ✅ → Clique sur **"Lancer l'audit"**

### Conditions préalables
- Tous les documents sont cochés ✅ (ou déjà validés)
- Aucun document ❌
- Aucune demande de documents complémentaires

### Actions
```
1. Tous les docs cochés ✅ → status: 'validated'
2. Nettoyage metadata.expert_validations
3. Dossier → statut: 'audit_en_cours', current_step: 4
4. Timeline : "🔍 Audit lancé - X validés"
```

### Route
`POST /api/expert/dossier/:id/launch-audit`

### Événement Timeline
```typescript
DossierTimelineService.documentsValides({
  dossier_id: "...",
  expert_name: "Alex Expertprofitum",
  validated_count: 5,
  rejected_count: 0,
  total_count: 5
})
```

### Affichage Timeline
```
📋 Documents validés
Expert Alex Expertprofitum - 5 documents validés
📅 2025-11-04 17:38:00
```

### État Expert après validation
```
✅ Audit en cours
Vous pouvez maintenant effectuer l'audit technique du dossier.
```

---

## 🔄 Flow 2B : Demander documents complémentaires (Rejets + Demandes)

### Déclencheur
Expert coche plusieurs docs ✅/❌ → Clique sur **"Demander documents complémentaires"**

### UI - Modal qui s'ouvre

```
┌─────────────────────────────────────────────────────┐
│ 📄 Demander des documents complémentaires          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Documents rejetés (ajoutés automatiquement) :      │
│                                                     │
│ ❌ facture.pdf                                      │
│    Raison : Document illisible                     │
│                                                     │
│ ❌ kbis.pdf                                         │
│    Raison : Date expirée                           │
│                                                     │
│ ─────────────────────────────────────────────────  │
│                                                     │
│ Documents complémentaires à demander :             │
│                                                     │
│ [+ Ajouter un document]                            │
│                                                     │
│ 📄 Attestation fiscale [Obligatoire ✓]             │
│ 📄 Justificatif domicile [Obligatoire ✓]           │
│                                                     │
│ ─────────────────────────────────────────────────  │
│                                                     │
│ Message pour le client :                           │
│ ┌─────────────────────────────────────────────┐    │
│ │ Merci de fournir les documents manquants   │    │
│ │ dans les plus brefs délais...              │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│              [Annuler]  [Envoyer la demande]       │
└─────────────────────────────────────────────────────┘
```

### Actions lors de l'envoi
```
1. Tous les docs cochés ✅ → status: 'validated'
2. Tous les docs cochés ❌ → status: 'rejected'
3. Création document_request en BDD
4. Dossier → statut: 'documents_manquants', current_step: 3
5. Timeline : "📄 Documents complémentaires demandés"
6. Notification client
7. Nettoyage metadata.expert_validations
```

### Route
`POST /api/expert/dossier/:id/request-documents` (existante, à compléter)

### Événement Timeline
```typescript
DossierTimelineService.documentsComplementairesDemandes({
  dossier_id: "...",
  expert_name: "Alex Expertprofitum",
  validated_count: 3,
  rejected_count: 2,
  requested_count: 2,
  requested_documents: ["Attestation fiscale", "Justificatif domicile"]
})
```

### Affichage Timeline
```
📄 Documents complémentaires demandés
Expert Alex Expertprofitum - 3 validés, 2 rejetés, 2 complémentaires
📅 2025-11-04 17:38:00
```

### État Expert après demande
```
⏳ En attente des documents du client
Le client a été notifié. Vous serez averti dès l'upload des documents.
```

---

## 📤 Flow 3 : Client répond avec documents complémentaires

### Déclencheur
Client upload les documents demandés via l'interface `ClientDocumentUploadComplementary`

### Actions
```
1. Documents uploadés → status: 'pending'
2. Dossier reste en statut: 'documents_manquants'
3. Timeline : "📤 Documents complémentaires envoyés"
4. Notification expert
```

### Route (existante)
`POST /api/documents/upload` avec `category: 'document_complementaire'`

### Événement Timeline (à ajouter dans cette route)
```typescript
DossierTimelineService.documentsComplementairesUploades({
  dossier_id: "...",
  client_name: "AlexTransport",
  documents_count: 2,
  documents: ["Attestation fiscale.pdf", "Justificatif domicile.pdf"]
})
```

### Affichage Timeline
```
📤 Documents complémentaires envoyés
Client AlexTransport - 2 documents uploadés

• Attestation fiscale.pdf
• Justificatif domicile.pdf

📅 2025-11-04 18:30:00
```

### État Expert après upload client
```
🔔 Nouveaux documents reçus
Le client a envoyé 2 documents. Vous pouvez les examiner.
[Voir les documents]
```

---

## 📊 Tableau récapitulatif des événements Timeline

| Flow | Événement | Acteur | Icône | Couleur | Méthode |
|------|-----------|--------|-------|---------|---------|
| Flow 1 | Document validé (individuel) | Expert | ✅ | green | `documentValideIndividuel` |
| Flow 1 | Document rejeté (individuel) | Expert | ❌ | red | `documentRejete` |
| Flow 2A | Documents validés (groupé, audit) | Expert | 📋 | green | `documentsValides` |
| Flow 2B | Documents complémentaires demandés | Expert | 📄 | orange | `documentsComplementairesDemandes` ✨ |
| Flow 3 | Documents complémentaires envoyés | Client | 📤 | blue | `documentsComplementairesUploades` ✨ |

✨ = **Nouvellement ajoutés**

---

## 🗂️ Structure BDD

### `ClientProduitEligible.metadata`
```typescript
{
  // Choix temporaires de l'expert (avant validation définitive)
  expert_validations: {
    [documentId: string]: {
      status: 'valid' | 'invalid' | 'pending',
      reason: string,
      checked_at: string | null
    }
  },
  
  // Autres metadata existants
  documents_missing: boolean,
  last_document_rejection: { ... },
  // ...
}
```

### `ClientProcessDocument.status`
```typescript
'pending'    // Upload initial ou en attente de validation
'validated'  // ✅ Validé par expert
'rejected'   // ❌ Rejeté par expert
```

### `document_request` (table existante)
```typescript
{
  id: uuid,
  dossier_id: uuid,
  expert_id: uuid,
  client_id: uuid,
  requested_documents: [
    {
      id: string,
      name: string,
      mandatory: boolean,
      uploaded: boolean,
      document_id: uuid | null
    }
  ],
  status: 'pending' | 'in_progress' | 'completed',
  notes: string,
  created_at: timestamp
}
```

---

## 🎨 Interface Expert - États UI

### 1. Documents en attente d'analyse
```
┌─────────────────────────────────────────────┐
│ 📄 facture.pdf                              │
│ [☐ Valider]  [☐ Refuser]  [Voir]          │
└─────────────────────────────────────────────┘
```

### 2. Documents cochés (temporaire)
```
┌─────────────────────────────────────────────┐
│ ✅ facture.pdf                              │
│ Coché valide (non définitif)               │
│ [↩️ Annuler]  [Voir]                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ❌ kbis.pdf                                 │
│ Coché invalide : "Date expirée"            │
│ [↩️ Annuler]  [Voir]                       │
└─────────────────────────────────────────────┘
```

### 3. Actions groupées disponibles
```
┌─────────────────────────────────────────────┐
│ 3 documents cochés ✅, 2 documents cochés ❌│
│                                             │
│ [🔍 Lancer l'audit]                        │
│ [📄 Demander documents complémentaires]    │
└─────────────────────────────────────────────┘
```

---

## ✅ Garanties du système

1. **Persistance** : L'expert peut se déconnecter, ses choix sont sauvegardés
2. **Flexibilité** : 3 flows possibles selon le besoin
3. **Traçabilité** : Tous les événements dans la timeline
4. **Cohérence** : Status BDD mis à jour uniquement lors de la validation définitive
5. **UX optimale** : L'expert voit clairement où il en est

---

## 🚀 Prochaines étapes d'implémentation

### À faire côté Backend
1. ✅ Méthodes timeline créées
2. ⏳ Ajouter appel `documentsComplementairesDemandes` dans route request-documents
3. ⏳ Ajouter appel `documentsComplementairesUploades` dans route upload (pour documents complémentaires)
4. ⏳ Implémenter sauvegarde/récupération de `metadata.expert_validations`

### À faire côté Frontend
1. ⏳ UI pour cocher ✅/❌ les documents
2. ⏳ Sauvegarde des choix dans metadata (via API)
3. ⏳ Affichage de l'état temporaire (documents cochés)
4. ⏳ Modal "Demander documents complémentaires" avec auto-ajout des docs rejetés
5. ⏳ Gestion des 3 boutons d'action groupée

---

## 📦 Fichiers modifiés

- `server/src/services/dossier-timeline-service.ts` (+2 méthodes)
  - `documentsComplementairesDemandes`
  - `documentsComplementairesUploades`

---

**Ce workflow couvre maintenant tous les scénarios possibles de validation de documents par l'expert !** 🎯

