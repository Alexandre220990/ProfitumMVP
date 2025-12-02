# 📧 Récapitulatif des Notifications Mails/Push en Temps Réel

**Date de mise à jour :** 2025-01-XX  
**Objectif :** Documenter toutes les notifications envoyées en temps réel (immédiatement, pas groupées)

---

## 🎯 Vue d'ensemble

Les notifications en temps réel sont envoyées **immédiatement** lors d'un événement, sans groupement ni délai. Elles complètent les notifications in-app et les rapports groupés (matinal/soir).

---

## ✅ NOTIFICATIONS EMAIL EN TEMPS RÉEL

### 1. 🔔 Notifications via NotificationTriggers.ts

**Service :** `server/src/services/NotificationTriggers.ts`  
**Méthode :** `sendNotificationEmail()` (ligne 297)  
**Fréquence :** Immédiate lors de chaque événement métier

**Types de notifications concernés :**
- Toutes les notifications créées via `NotificationTriggers` (événements système, métier, etc.)
- Envoi automatique d'email pour chaque notification créée
- Respecte les préférences utilisateur (email activé/désactivé)

**Destinataires :**
- Admin
- Expert
- Client
- Apporteur

**Exemples d'événements :**
- Création de dossier
- Assignation d'expert
- Demande de documents
- Validation de dossier
- Paiement reçu
- Commission calculée
- etc.

---

### 2. 🚀 RDV démarre maintenant

**Service :** `server/src/services/rdv-sla-reminder-service.ts`  
**Méthode :** `sendRdvStartNotification()` (ligne 662)  
**Fréquence :** Immédiate quand un RDV démarre (scheduled_date + scheduled_time = maintenant)

**Destinataires :**
- ✅ **Admin** : Email + Notification in-app
- ✅ **Client** : Email
- ✅ **Expert** : Email

**Contenu de l'email :**
- Titre du RDV
- Date et heure
- Informations client/expert/apporteur
- Lien vers le RDV

**Note :** Cette notification est **conservée en temps réel** (ligne 731) - pas de modification

---

### 3. 💬 Messages de messagerie aux admins

**Service :** `server/src/routes/unified-messaging.ts`  
**Méthode :** POST `/api/unified-messaging/conversations/:id/messages` (ligne 893)  
**Fréquence :** Immédiate quand un admin reçoit un message

**Destinataires :**
- ✅ **Admin** uniquement (quand il reçoit un message)

**Contenu de l'email :**
- Nom de l'expéditeur (client/expert/apporteur)
- Aperçu du message (100 premiers caractères)
- Lien vers la conversation

**Note :** **NOUVEAU** - Ajouté dans cette refactorisation

---

### 4. 📅 Rappel calendrier 15 minutes avant

**Service :** `server/src/services/calendar-reminder-service.ts`  
**Méthode :** `sendReminderEmail()` (ligne 341)  
**Fréquence :** 15 minutes avant l'événement

**Destinataires :**
- Admin
- Expert
- Client
- Apporteur

**Contenu de l'email :**
- Titre de l'événement
- Date, heure, durée
- Lieu (si renseigné)
- Lien de réunion (si renseigné)
- Lien vers l'événement

**Note :** **MODIFIÉ** - Uniquement 15 minutes avant (suppression des rappels 1h et 24h)

---

## ✅ NOTIFICATIONS PUSH EN TEMPS RÉEL

### 1. 🔔 Notifications via NotificationTriggers.ts

**Service :** `server/src/services/NotificationTriggers.ts`  
**Méthode :** `sendNotificationPush()` (ligne 362)  
**Fréquence :** Immédiate lors de chaque événement métier

**Types de notifications concernés :**
- Toutes les notifications créées via `NotificationTriggers`
- Envoi automatique de push pour chaque notification créée
- Nécessite un device enregistré et actif

**Destinataires :**
- Admin
- Expert
- Client
- Apporteur

**Prérequis :**
- Device enregistré dans `UserDevices`
- Device actif (`active = true`)
- Device type `web`
- Clés VAPID configurées

---

### 2. 📱 Notifications Browser Native

**Service :** Frontend via `Notification API`  
**Fréquence :** Immédiate quand une notification in-app est créée

**Mécanisme :**
- Les notifications in-app sont synchronisées via Supabase Realtime
- Le frontend affiche une notification browser native
- Nécessite l'autorisation de l'utilisateur

**Destinataires :**
- Tous les utilisateurs avec autorisation accordée

---

## ❌ NOTIFICATIONS GROUPÉS DÉSACTIVÉES

Les notifications suivantes **ne sont plus envoyées par email groupé à 9h** (intégrées au rapport matinal) :

### 1. Rappels SLA RDV
- **Ancien :** Email groupé à 9h pour RDV en retard (24h, 48h, 120h)
- **Nouveau :** Intégré au rapport matinal (section "RDV en retard")
- **Service :** `rdv-sla-reminder-service.ts` (ligne 305)

### 2. Relances actionType
- **Ancien :** Email groupé à 9h pour dossiers avec actions en attente
- **Nouveau :** Intégré au rapport matinal (section "Dossiers nécessitant une action")
- **Service :** `action-type-reminder-service.ts` (ligne 822)

### 3. Rappels contact/lead
- **Ancien :** Email groupé à 9h pour contacts/leads non traités
- **Nouveau :** Intégré au rapport matinal (section "Contacts/Leads en attente")
- **Service :** `contact-lead-reminder-service.ts` (ligne 278)

### 4. Escalade notifications
- **Ancien :** Email groupé à 9h pour notifications escaladées
- **Nouveau :** Intégré au rapport matinal (section "Notifications escaladées")
- **Service :** `NotificationEscalationService.ts`

**Note :** Les notifications **in-app** sont toujours créées pour tous ces rappels.

---

## 📊 RAPPORTS GROUPÉS

### Rapport Matinal (7h)
**Service :** `morning-report-service.ts`  
**Contenu :**
- RDV du jour
- Notifications non lues
- Notifications lues récentes
- **RDV en retard** (24h, 48h, 120h) ← NOUVEAU
- **Dossiers nécessitant une action** ← NOUVEAU
- **Contacts/Leads en attente** ← NOUVEAU
- **Notifications escaladées** ← NOUVEAU

### Rapport Quotidien (18h15)
**Service :** `daily-activity-report-service-v2.ts`  
**Contenu :**
- Récap des RDV de la journée
- Récap des notifications archivées
- Récap des RDV du lendemain

---

## 🔧 CONFIGURATION DES PRÉFÉRENCES

Les utilisateurs peuvent activer/désactiver les notifications email et push via :

**Page :** `/admin/profil` → Onglet "Notifications"  
**Composant :** `NotificationPreferencesPanel`

**Options disponibles :**
- ✅ Activer/Désactiver notifications email
- ✅ Activer/Désactiver notifications push
- ✅ Configurer par type de notification
- ✅ Configurer par niveau SLA (target, acceptable, critical)

---

## 📝 RÉSUMÉ DES MODIFICATIONS

### ✅ Ajouts
1. **Email en temps réel pour messages de messagerie aux admins** (unified-messaging.ts)
2. **4 nouvelles sections au rapport matinal** (morning-report-service.ts)

### 🔄 Modifications
1. **Rappels calendrier** : Uniquement 15 minutes avant (suppression 1h et 24h)
2. **Emails groupés à 9h** : Désactivés, intégrés au rapport matinal

### ❌ Suppressions
1. **Emails groupés à 9h** pour :
   - Rappels SLA RDV
   - Relances actionType
   - Rappels contact/lead
   - Escalade notifications

### ✅ Conservations
1. **Notification RDV démarre maintenant** : En temps réel (ligne 731)
2. **Notifications via NotificationTriggers** : En temps réel (lignes 351 et 475)
3. **Notifications in-app** : Toujours créées pour tous les rappels

---

## 🎯 PRINCIPE GÉNÉRAL

**Règle :** 
- **Temps réel** = Événements urgents/importants qui nécessitent une action immédiate
- **Groupé** = Rappels/relances qui peuvent être consolidés dans un rapport quotidien

**Avantages :**
- Réduction du nombre d'emails (moins de spam)
- Meilleure organisation (tout dans un rapport structuré)
- Notifications urgentes toujours en temps réel
- Meilleure expérience utilisateur

---

## 📞 SUPPORT

Pour toute question sur les notifications :
- Vérifier les préférences utilisateur dans `/admin/profil`
- Consulter les logs serveur pour le diagnostic
- Vérifier la configuration SMTP pour les emails
- Vérifier les clés VAPID pour les push notifications

