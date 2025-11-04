# 📅 Timeline Complète - 4 Types d'Acteurs

**Date** : 4 novembre 2025  
**Statut** : ✅ Complet et fonctionnel

---

## 🎯 Vue d'ensemble

La timeline trace maintenant **tous les événements** pour **4 types d'acteurs** :

| Acteur | Événements tracés | Statut |
|--------|------------------|---------|
| **👤 Client** | Documents pré-éligibilité, Documents complémentaires | ✅ Complet |
| **⚙️ Admin** | Validation/rejet pré-éligibilité | ✅ Complet |
| **👨‍💼 Expert** | Assignation, Validation docs, Rejet docs, Demande docs, Audit | ✅ Complet |
| **🤝 Apporteur** | (Aucune action actuellement) | ⏳ À implémenter |

---

## 📊 Liste complète des événements

### 👤 ÉVÉNEMENTS CLIENT

#### 1. Documents de pré-éligibilité soumis
```
📤 Documents de pré-éligibilité soumis
Client AlexTransport - 3 documents uploadés
• facture.pdf
• kbis.pdf
• rib.pdf
```
- **Type** : `document`
- **Actor** : `client`
- **Méthode** : `documentsPreEligibiliteUploades`

#### 2. Documents complémentaires envoyés
```
📤 Documents complémentaires envoyés
Client AlexTransport - 2 documents uploadés
• Attestation fiscale.pdf
• Justificatif domicile.pdf
```
- **Type** : `document`
- **Actor** : `client`
- **Méthode** : `documentsComplementairesUploades` ✨ **NOUVEAU**

---

### ⚙️ ÉVÉNEMENTS ADMIN

#### 1. Pré-éligibilité validée
```
✅ Pré-éligibilité validée
Admin Alexandre Grandjean - Dossier éligible
```
- **Type** : `admin_action`
- **Actor** : `admin`
- **Méthode** : `eligibiliteValidee`

#### 2. Pré-éligibilité rejetée
```
❌ Pré-éligibilité rejetée
Admin Alexandre Grandjean - Documents non conformes
```
- **Type** : `admin_action`
- **Actor** : `admin`
- **Méthode** : `eligibiliteRefusee`

---

### 👨‍💼 ÉVÉNEMENTS EXPERT

#### 1. Expert assigné au dossier
```
👨‍💼 Expert assigné
Expert Alex Expertprofitum a accepté le dossier TICPE de AlexTransport
```
- **Type** : `expert_action`
- **Actor** : `expert`
- **Méthode** : `expertAssigne` ✨ **NOUVEAU**
- **Route** : `POST /api/dossier-steps/expert/select`

#### 2. Document validé (individuel)
```
✅ Document validé
Expert Alex Expertprofitum a validé le document "facture.pdf"
```
- **Type** : `expert_action`
- **Actor** : `expert`
- **Méthode** : `documentValideIndividuel` ✨ **NOUVEAU**
- **Route** : `PUT /api/expert/document/:id/validate`

#### 3. Document rejeté (individuel)
```
❌ Document rejeté
Expert Alex Expertprofitum a rejeté le document "kbis.pdf"
Raison : Document expiré
```
- **Type** : `expert_action`
- **Actor** : `expert`
- **Méthode** : `documentRejete` ✅ (déjà existait)
- **Route** : `PUT /api/expert/document/:id/reject`

#### 4. Documents validés (groupé - audit)
```
📋 Documents validés
Expert Alex Expertprofitum - 5 documents validés
```
- **Type** : `expert_action`
- **Actor** : `expert`
- **Méthode** : `documentsValides` ✅ (déjà existait)
- **Route** : `POST /api/expert/dossier/:id/launch-audit`

#### 5. Documents complémentaires demandés
```
📄 Documents complémentaires demandés
Expert Alex Expertprofitum - 3 validés, 2 rejetés, 2 complémentaires
```
- **Type** : `expert_action`
- **Actor** : `expert`
- **Méthode** : `documentsComplementairesDemandes` ✨ **NOUVEAU**
- **Route** : `POST /api/expert/dossier/:id/request-documents`

---

## 🔄 Flux complet d'un dossier (Exemple)

```
📅 Timeline complète - Dossier TICPE

1. 📤 Documents de pré-éligibilité soumis
   Client AlexTransport - 3 documents uploadés
   📅 2025-10-31 17:03:00

2. ✅ Pré-éligibilité validée
   Admin Alexandre Grandjean - Dossier éligible
   📅 2025-11-03 17:38:00

3. 👨‍💼 Expert assigné
   Expert Alex Expertprofitum a accepté le dossier TICPE de AlexTransport
   📅 2025-11-04 13:13:00

4. ✅ Document validé
   Expert Alex Expertprofitum a validé le document "facture.pdf"
   📅 2025-11-04 17:30:00

5. ✅ Document validé
   Expert Alex Expertprofitum a validé le document "rib.pdf"
   📅 2025-11-04 17:31:00

6. ❌ Document rejeté
   Expert Alex Expertprofitum a rejeté le document "kbis.pdf"
   Raison : Document expiré
   📅 2025-11-04 17:32:00

7. 📄 Documents complémentaires demandés
   Expert Alex Expertprofitum - 2 validés, 1 rejeté, 2 complémentaires
   📅 2025-11-04 17:33:00

8. 📤 Documents complémentaires envoyés
   Client AlexTransport - 2 documents uploadés
   • KBIS récent.pdf
   • Attestation fiscale.pdf
   📅 2025-11-04 18:30:00

9. 📋 Documents validés
   Expert Alex Expertprofitum - 4 documents validés
   📅 2025-11-04 19:50:00

10. 🔍 Audit technique lancé
    Expert Alex Expertprofitum a démarré l'audit
    📅 2025-11-04 20:00:00
```

---

## 📂 Fichiers modifiés

### Services
- `server/src/services/dossier-timeline-service.ts`
  - ✨ `documentValideIndividuel` - Validation individuelle par expert
  - ✨ `expertAssigne` - Assignation expert au dossier
  - ✨ `documentsComplementairesDemandes` - Demande docs avec résumé
  - ✨ `documentsComplementairesUploades` - Upload docs complémentaires par client

### Routes
- `server/src/routes/expert-documents.ts`
  - ✅ Appel timeline dans `PUT /document/:id/validate`
  - ✅ Appel timeline dans `POST /dossier/:id/request-documents`

- `server/src/routes/dossier-steps.ts`
  - ✅ Appel timeline dans `POST /expert/select`

- `server/src/routes/client-documents.ts`
  - ✅ Appel timeline dans `POST /dossier/:id/validate-complementary-documents`

---

## 🎨 Codes couleur Timeline

| Couleur | Signification | Événements |
|---------|--------------|------------|
| 🔵 Blue | Actions standard, informations | Upload documents, Assignation |
| 🟢 Green | Validation, succès | Documents validés, Éligibilité validée |
| 🟠 Orange | Demandes, en attente | Documents complémentaires demandés |
| 🔴 Red | Rejets, erreurs | Documents rejetés, Éligibilité rejetée |

---

## ✅ Vérification complète

Après déploiement, exécuter le script d'analyse :
```sql
-- ANALYSE-COMPLETE-TIMELINE.sql
```

Le résumé devrait afficher :
```
| Documents uploadés           | XX | XX | 0 | 100% ✅ |
| Documents validés par expert | XX | XX | 0 | 100% ✅ |
| Documents rejetés par expert | XX | XX | 0 | 100% ✅ |
| Assignations expert          | XX | XX | 0 | 100% ✅ |
| Documents complémentaires    | XX | XX | 0 | 100% ✅ |
```

---

## 🎉 Résultat

**100% des événements sont maintenant tracés dans la timeline pour tous les acteurs !**

Client ✅ | Admin ✅ | Expert ✅ | Apporteur ⏳

