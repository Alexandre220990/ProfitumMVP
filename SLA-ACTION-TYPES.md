# 📋 SLA ET RELANCES AUTOMATIQUES PAR ACTION TYPE

**Date de création :** 2025-01-XX  
**Objectif :** Définir les délais SLA et les seuils de relance automatique pour chaque type d'action urgente

---

## 🎯 HIÉRARCHIE DES ACTION TYPES AVEC SLA

### 1. 🔴 **expert_pending_acceptance** (PRIORITÉ CRITIQUE)

**Description :** Dossier assigné, expert doit accepter ou refuser

**SLA :**
- **Délai cible :** 24 heures (1 jour)
- **Délai acceptable :** 48 heures (2 jours)
- **Délai critique :** 72 heures (3 jours)

**Relances automatiques :**
- **J+1 (24h) :** Notification douce à l'expert
  - Type : `reminder`
  - Priorité : `high`
  - Message : "Vous avez un nouveau dossier à accepter ou refuser"
  
- **J+2 (48h) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Dossier en attente depuis 2 jours - Action requise"
  - Notification admin : Oui (copie)

- **J+3 (72h) :** Relance critique + Escalade
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "Dossier en attente depuis 3 jours - Action urgente requise"
  - Notification admin : Oui (obligatoire)
  - Action : Admin peut réassigner le dossier

**Couleur tuile :** Rouge (`border-red-500 bg-red-50`)

---

### 2. 🟠 **documents_pending_validation** (PRIORITÉ URGENTE)

**Description :** Documents reçus, en attente de validation par l'expert

**SLA :**
- **Délai cible :** 48 heures (2 jours)
- **Délai acceptable :** 5 jours
- **Délai critique :** 7 jours

**Relances automatiques :**
- **J+2 (48h) :** Rappel doux
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "X document(s) en attente de validation depuis 2 jours"
  
- **J+5 (5 jours) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "X document(s) en attente de validation depuis 5 jours - Action requise"
  - Notification client : Oui (copie) - "Votre expert examine vos documents"

- **J+7 (7 jours) :** Relance critique
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "X document(s) en attente de validation depuis 7 jours - Action urgente"
  - Notification admin : Oui (copie)
  - Notification client : Oui - "Votre expert finalise l'examen de vos documents"

**Couleur tuile :** Orange (`border-orange-400 bg-orange-50/30`)

---

### 3. 🔴 **client_no_response_critical** (PRIORITÉ CRITIQUE)

**Description :** Client sans réponse depuis > 15 jours

**SLA :**
- **Délai cible :** 0 jours (détection immédiate)
- **Délai acceptable :** N/A (déjà critique)
- **Délai critique :** 15 jours (seuil de déclenchement)

**Relances automatiques :**
- **J+15 (15 jours) :** Alerte critique
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "Client sans réponse depuis 15 jours - Risque d'abandon"
  - Notification expert : Oui
  - Notification admin : Oui (obligatoire)
  - Action suggérée : Relance téléphonique ou email personnalisé

- **J+20 (20 jours) :** Escalade maximale
  - Type : `reminder_escalation_max`
  - Priorité : `critical`
  - Message : "Client sans réponse depuis 20 jours - Décision requise"
  - Notification admin : Oui (obligatoire)
  - Action : Admin peut mettre le dossier en pause ou annuler

**Couleur tuile :** Rouge foncé (`border-red-700 bg-red-100`)

---

### 4. 🟣 **audit_to_complete** (PRIORITÉ IMPORTANTE)

**Description :** Audit technique en cours, à finaliser

**SLA :**
- **Délai cible :** 7 jours
- **Délai acceptable :** 14 jours
- **Délai critique :** 21 jours

**Relances automatiques :**
- **J+7 (7 jours) :** Rappel
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Audit technique en cours depuis 7 jours"
  
- **J+14 (14 jours) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Audit technique en cours depuis 14 jours - Finalisation requise"
  - Notification client : Oui (copie) - "Votre expert finalise l'audit"

- **J+21 (21 jours) :** Relance critique
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "Audit technique en cours depuis 21 jours - Action urgente"
  - Notification admin : Oui (copie)

**Couleur tuile :** Violet (`border-purple-400 bg-purple-50`)

---

### 5. 🔵 **documents_requested** (PRIORITÉ EN ATTENTE)

**Description :** Documents demandés au client, en attente de réception

**SLA :**
- **Délai cible :** 5 jours (client)
- **Délai acceptable :** 10 jours
- **Délai critique :** 15 jours

**Relances automatiques :**
- **J+5 (5 jours) :** Relance 1 au client
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Rappel : Documents complémentaires demandés il y a 5 jours"
  - Destinataire : Client uniquement
  
- **J+10 (10 jours) :** Relance 2 au client
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Relance : Documents complémentaires demandés il y a 10 jours"
  - Destinataire : Client + Expert (copie)
  
- **J+15 (15 jours) :** Relance 3 critique
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "Dernière relance : Documents complémentaires demandés il y a 15 jours. Si pas de retour dans 5 jours, l'expert se réserve le droit d'annuler la collaboration."
  - Destinataire : Client + Expert + Admin (copie)

**Couleur tuile :** Bleu (`border-blue-400 bg-blue-50/30`)

---

### 6. 🟡 **relance_needed** (PRIORITÉ MOYENNE)

**Description :** Dernier contact > 7 jours, relance nécessaire

**SLA :**
- **Délai cible :** 7 jours (détection)
- **Délai acceptable :** 10 jours
- **Délai critique :** 14 jours

**Relances automatiques :**
- **J+7 (7 jours) :** Suggestion de relance
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Aucun contact depuis 7 jours - Relance suggérée"
  - Action : Notification à l'expert uniquement
  
- **J+10 (10 jours) :** Relance recommandée
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Aucun contact depuis 10 jours - Relance recommandée"
  
- **J+14 (14 jours) :** Relance urgente
  - Type : `reminder_critical`
  - Priorité : `high`
  - Message : "Aucun contact depuis 14 jours - Relance urgente requise"

**Couleur tuile :** Jaune/Orange (`border-yellow-400 bg-yellow-50`)

---

### 7. 🔵 **complementary_docs_received** (PRIORITÉ RÉACTIVE)

**Description :** Documents complémentaires reçus récemment (< 24h)

**SLA :**
- **Délai cible :** 24 heures (1 jour)
- **Délai acceptable :** 48 heures (2 jours)
- **Délai critique :** 72 heures (3 jours)

**Relances automatiques :**
- **J+1 (24h) :** Rappel doux
  - Type : `reminder`
  - Priorité : `low`
  - Message : "Documents complémentaires reçus il y a 24h - À examiner"
  
- **J+2 (48h) :** Rappel
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Documents complémentaires reçus il y a 48h - Action requise"
  
- **J+3 (72h) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Documents complémentaires reçus il y a 3 jours - Examen requis"

**Couleur tuile :** Bleu clair (`border-blue-300 bg-blue-50`)

---

### 8. 🟢 **validation_final_pending** (PRIORITÉ FINALISATION)

**Description :** Documents validés, validation finale en attente

**SLA :**
- **Délai cible :** 3 jours
- **Délai acceptable :** 7 jours
- **Délai critique :** 10 jours

**Relances automatiques :**
- **J+3 (3 jours) :** Rappel
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Validation finale en attente depuis 3 jours"
  
- **J+7 (7 jours) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Validation finale en attente depuis 7 jours - Finalisation requise"
  - Notification client : Oui (copie)
  
- **J+10 (10 jours) :** Relance critique
  - Type : `reminder_critical`
  - Priorité : `critical`
  - Message : "Validation finale en attente depuis 10 jours - Action urgente"

**Couleur tuile :** Vert clair (`border-green-300 bg-green-50`)

---

### 9. 🔵 **first_review_needed** (PRIORITÉ NOUVEAU)

**Description :** Nouveau dossier assigné, première revue nécessaire

**SLA :**
- **Délai cible :** 24 heures (1 jour)
- **Délai acceptable :** 48 heures (2 jours)
- **Délai critique :** 72 heures (3 jours)

**Relances automatiques :**
- **J+1 (24h) :** Rappel doux
  - Type : `reminder`
  - Priorité : `low`
  - Message : "Nouveau dossier assigné - Première revue suggérée"
  
- **J+2 (48h) :** Rappel
  - Type : `reminder`
  - Priorité : `medium`
  - Message : "Nouveau dossier assigné depuis 2 jours - Première revue recommandée"
  
- **J+3 (72h) :** Relance importante
  - Type : `reminder_escalated`
  - Priorité : `high`
  - Message : "Nouveau dossier assigné depuis 3 jours - Première revue requise"

**Couleur tuile :** Bleu clair (`border-blue-300 bg-blue-50`)

---

### 10. ⚪ **other** (PRIORITÉ PAR DÉFAUT)

**Description :** Cas par défaut (pas d'action urgente spécifique)

**SLA :**
- **Délai cible :** N/A
- **Délai acceptable :** N/A
- **Délai critique :** N/A

**Relances automatiques :**
- Aucune relance automatique

**Couleur tuile :** Gris (`border-gray-200 bg-white`)

---

## 📊 TABLEAU RÉCAPITULATIF DES SLA

| Action Type | Priorité | Délai Cible | Délai Acceptable | Délai Critique | Relances | Escalade Admin |
|-------------|----------|-------------|------------------|----------------|----------|----------------|
| `expert_pending_acceptance` | 🔴 Critique | 24h | 48h | 72h | J+1, J+2, J+3 | J+3 |
| `documents_pending_validation` | 🟠 Urgente | 48h | 5j | 7j | J+2, J+5, J+7 | J+7 |
| `client_no_response_critical` | 🔴 Critique | 0j | N/A | 15j | J+15, J+20 | J+15 |
| `audit_to_complete` | 🟣 Important | 7j | 14j | 21j | J+7, J+14, J+21 | J+21 |
| `documents_requested` | 🔵 En attente | 5j | 10j | 15j | J+5, J+10, J+15 | J+15 |
| `relance_needed` | 🟡 Moyenne | 7j | 10j | 14j | J+7, J+10, J+14 | Non |
| `complementary_docs_received` | 🔵 Réactive | 24h | 48h | 72h | J+1, J+2, J+3 | Non |
| `validation_final_pending` | 🟢 Finalisation | 3j | 7j | 10j | J+3, J+7, J+10 | Non |
| `first_review_needed` | 🔵 Nouveau | 24h | 48h | 72h | J+1, J+2, J+3 | Non |
| `other` | ⚪ Par défaut | N/A | N/A | N/A | Aucune | Non |

---

## 🔔 TYPES DE NOTIFICATIONS

### Types de notifications pour les relances :

1. **`reminder`** : Rappel doux (priorité low/medium)
2. **`reminder_escalated`** : Relance importante (priorité high)
3. **`reminder_critical`** : Relance critique (priorité critical)
4. **`reminder_escalation_max`** : Escalade maximale (priorité critical + admin obligatoire)

### Destinataires selon le type :

- **Expert uniquement** : Actions nécessitant une action de l'expert
- **Client uniquement** : Actions nécessitant une action du client
- **Expert + Client** : Actions où les deux parties doivent être informées
- **Expert + Admin** : Escalade vers l'administration
- **Expert + Client + Admin** : Escalade maximale

---

## ⚙️ IMPLÉMENTATION TECHNIQUE

### Structure de données à créer :

```typescript
interface ActionTypeSLA {
  actionType: string;
  slaTarget: number; // Jours
  slaAcceptable: number; // Jours
  slaCritical: number; // Jours
  reminders: {
    days: number;
    type: 'reminder' | 'reminder_escalated' | 'reminder_critical' | 'reminder_escalation_max';
    priority: 'low' | 'medium' | 'high' | 'critical';
    notifyExpert: boolean;
    notifyClient: boolean;
    notifyAdmin: boolean;
    message: string;
  }[];
}
```

### Service de relance automatique :

Un service cron doit vérifier quotidiennement :
1. Les dossiers avec chaque `actionType`
2. Calculer les jours depuis la dernière action
3. Comparer avec les seuils SLA
4. Envoyer les relances appropriées
5. Mettre à jour les métadonnées pour éviter les doublons

---

## 📝 NOTES IMPORTANTES

1. **Éviter les doublons** : Chaque relance doit être marquée dans les métadonnées du dossier pour éviter les envois multiples
2. **Respecter les préférences** : Vérifier les préférences de notification de chaque utilisateur
3. **Logs** : Toutes les relances doivent être loggées pour audit
4. **Personnalisation** : Les messages peuvent être personnalisés selon le contexte du dossier
5. **Désactivation** : Possibilité de désactiver temporairement les relances pour un dossier spécifique

---

**Prochaine étape :** Implémenter le service de relance automatique avec ces SLA définis.

