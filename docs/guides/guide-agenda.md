# 📅 Guide Agenda - Gérer Mes Rendez-vous

**Version :** 1.0  
**Date :** Janvier 2025  
**Public :** Clients FinancialTracker  

---

## 📋 Sommaire

1. [Qu'est-ce que l'Agenda ?](#quest-ce-que-lagenda)
2. [Accès à l'Agenda](#accès-à-lagenda)
3. [Les Trois Vues Disponibles](#les-trois-vues-disponibles)
4. [Vue Mois](#vue-mois)
5. [Vue Agenda](#vue-agenda)
6. [Vue Liste](#vue-liste)
7. [Créer un Rendez-vous](#créer-un-rendez-vous)
8. [Gérer les Événements](#gérer-les-événements)
9. [Notifications et Rappels](#notifications-et-rappels)
10. [Dépannage](#dépannage)

---

## 🎯 Qu'est-ce que l'Agenda ?

### Définition
L'Agenda est votre **calendrier personnel** pour gérer tous vos rendez-vous et événements liés à vos produits financiers.

### Fonctionnalités Principales
- **Planification** : Créer et organiser vos RDV
- **Suivi** : Visualiser vos événements
- **Rappels** : Recevoir des notifications
- **Synchronisation** : Avec votre expert

---

## 🚪 Accès à l'Agenda

### Méthodes d'Accès

#### Depuis le Menu Principal
1. **Cliquez sur "Agenda"** dans la barre de navigation
2. **Vous accédez directement** à la vue par défaut

#### Depuis le Dashboard
1. **Cliquez sur "Mon Agenda"** dans les actions rapides
2. **Ou cliquez sur le chiffre** des rendez-vous dans les statistiques

#### Depuis un Produit
1. **Dans un workflow de produit**
2. **Cliquez sur "Planifier un RDV"**
3. **Vous êtes redirigé** vers l'agenda

---

## 👁️ Les Trois Vues Disponibles

### Sélecteur de Vue
En haut de l'agenda, vous trouvez trois onglets :
- **Mois** : Vue calendrier mensuelle
- **Agenda** : Vue semaine actuelle
- **Liste** : Vue liste chronologique

### Changement de Vue
1. **Cliquez sur l'onglet** souhaité
2. **L'affichage change** instantanément
3. **Les données** restent les mêmes

---

## 📅 Vue Mois

### Description
La vue Mois affiche un **calendrier complet** du mois en cours avec vos événements.

### Structure de la Vue

```
┌─────────────────────────────────────────────────────────┐
│ ← Janvier 2025 →                    [Mois][Agenda][Liste] │
├─────────────────────────────────────────────────────────┤
│ Lun  Mar  Mer  Jeu  Ven  Sam  Dim                      │
│  1    2    3    4    5    6    7                       │
│  8    9   10   11   12   13   14                       │
│ 15   16   17   18   19   20   21                       │
│ 22   23   24   25   26   27   28                       │
│ 29   30   31                                           │
└─────────────────────────────────────────────────────────┘
```

### Navigation dans le Mois

#### Changer de Mois
1. **Cliquez sur "←"** pour le mois précédent
2. **Cliquez sur "→"** pour le mois suivant
3. **Ou cliquez sur le nom** du mois pour un sélecteur

#### Retour au Mois Actuel
1. **Cliquez sur "Aujourd'hui"** (si disponible)
2. **Ou naviguez** jusqu'au mois actuel

### Interaction avec les Jours

#### Cliquer sur un Jour
1. **Cliquez sur une date**
2. **Les événements du jour** s'affichent à droite
3. **Pas de popup** de création automatique

#### Événements Visibles
- **Points colorés** : Indiquent des événements
- **Couleurs** : Différents types d'événements
- **Nombre** : Nombre d'événements par jour

### Panneau de Droite

#### Affichage des Événements
Quand vous cliquez sur un jour :
1. **Le panneau de droite** s'ouvre
2. **Liste des événements** du jour sélectionné
3. **Bouton "Nouvel événement"** en haut

#### Actions Disponibles
- **Voir les détails** : Cliquer sur un événement
- **Créer un événement** : Bouton "Nouvel événement"
- **Fermer le panneau** : Clic en dehors ou bouton X

---

## 📆 Vue Agenda

### Description
La vue Agenda affiche la **semaine actuelle** avec les 7 jours côte à côte.

### Structure de la Vue

```
┌─────────────────────────────────────────────────────────┐
│ ← Semaine du 6-12 janvier →        [Mois][Agenda][Liste] │
├─────────────────────────────────────────────────────────┤
│ Lun 6  │ Mar 7  │ Mer 8  │ Jeu 9  │ Ven 10 │ Sam 11 │ Dim 12 │
│        │        │        │        │        │        │        │
│ 9h     │ 9h     │ 9h     │ 9h     │ 9h     │ 9h     │ 9h     │
│ RDV    │        │        │        │        │        │        │
│ Expert │        │        │        │        │        │        │
│        │        │        │        │        │        │        │
│ 14h    │ 14h    │ 14h    │ 14h    │ 14h    │ 14h    │ 14h    │
│        │        │        │        │        │        │        │
└─────────────────────────────────────────────────────────┘
```

### Navigation dans la Semaine

#### Changer de Semaine
1. **Cliquez sur "←"** pour la semaine précédente
2. **Cliquez sur "→"** pour la semaine suivante
3. **Ou utilisez le sélecteur** de date

#### Retour à la Semaine Actuelle
1. **Cliquez sur "Cette semaine"** (si disponible)
2. **Ou naviguez** jusqu'à la semaine actuelle

### Affichage des Événements

#### Format des Événements
- **Heure** : Affichée en début d'événement
- **Titre** : Nom de l'événement
- **Durée** : Indiquée par la hauteur
- **Couleur** : Type d'événement

#### Types d'Événements
- **🔵 RDV Expert** : Rendez-vous avec votre expert
- **🟢 RDV Produit** : Rendez-vous lié à un produit
- **🟡 Rappel** : Rappel important
- **🔴 Urgent** : Événement urgent

### Interaction avec les Événements

#### Cliquer sur un Événement
1. **Cliquez sur un événement**
2. **Popup de détails** s'ouvre
3. **Actions disponibles** : Modifier, Supprimer, Fermer

#### Créer un Événement
1. **Cliquez sur un créneau** vide
2. **Ou cliquez sur "Nouvel événement"**
3. **Formulaire de création** s'ouvre

---

## 📋 Vue Liste

### Description
La vue Liste affiche tous vos événements **chronologiquement** dans une liste.

### Structure de la Vue

```
┌─────────────────────────────────────────────────────────┐
│ Liste des événements                    [Mois][Agenda][Liste] │
├─────────────────────────────────────────────────────────┤
│ 📅 Aujourd'hui - 8 janvier 2025                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 9h00 - RDV Expert TICPE                            │ │
│ │ Expert: Jean Dupont                                │ │
│ │ Durée: 1h00                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 📅 Demain - 9 janvier 2025                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 14h30 - Rappel Documents URSSAF                    │ │
│ │ Type: Rappel                                        │ │
│ │ Durée: 15min                                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Navigation dans la Liste

#### Filtres Disponibles
1. **"Tous les événements"** : Affiche tout
2. **"Cette semaine"** : Événements de la semaine
3. **"Ce mois"** : Événements du mois
4. **"À venir"** : Événements futurs

#### Tri
- **Par date** : Chronologique (défaut)
- **Par type** : Groupé par type d'événement
- **Par priorité** : Urgent en premier

### Actions sur les Événements

#### Voir les Détails
1. **Cliquez sur un événement**
2. **Popup de détails** s'ouvre
3. **Informations complètes** affichées

#### Actions Rapides
- **Modifier** : Clic sur l'icône ✏️
- **Supprimer** : Clic sur l'icône 🗑️
- **Dupliquer** : Clic sur l'icône 📋

---

## ➕ Créer un Rendez-vous

### Méthodes de Création

#### Méthode 1 : Depuis le Panneau de Droite (Vue Mois)
1. **Cliquez sur un jour** dans le calendrier
2. **Cliquez sur "Nouvel événement"** dans le panneau
3. **Remplissez le formulaire**

#### Méthode 2 : Depuis un Créneau (Vue Agenda)
1. **Cliquez sur un créneau** vide
2. **Formulaire de création** s'ouvre automatiquement
3. **Remplissez les informations**

#### Méthode 3 : Depuis la Vue Liste
1. **Cliquez sur "Nouvel événement"** en haut
2. **Sélectionnez la date** dans le formulaire
3. **Remplissez les détails**

### Formulaire de Création

#### Informations Obligatoires
- **Titre** : Nom de l'événement
- **Date** : Date du rendez-vous
- **Heure de début** : Heure de commencement
- **Durée** : Durée estimée

#### Informations Optionnelles
- **Description** : Détails de l'événement
- **Type** : RDV Expert, RDV Produit, Rappel, etc.
- **Couleur** : Couleur de l'événement
- **Rappels** : Notifications avant l'événement

#### Paramètres Avancés
- **Répétition** : Événement récurrent
- **Lieu** : Lieu du rendez-vous
- **Participants** : Personnes invitées
- **Pièces jointes** : Documents associés

### Validation et Sauvegarde

#### Avant de Sauvegarder
1. **Vérifiez les informations** saisies
2. **Contrôlez les conflits** (événements qui se chevauchent)
3. **Confirmez la date** et l'heure

#### Après Sauvegarde
1. **Message de confirmation** s'affiche
2. **L'événement apparaît** dans le calendrier
3. **Notifications** sont programmées

---

## ✏️ Gérer les Événements

### Modifier un Événement

#### Accès à la Modification
1. **Cliquez sur l'événement** dans le calendrier
2. **Cliquez sur "Modifier"** dans le popup
3. **Ou double-cliquez** sur l'événement

#### Formulaire de Modification
- **Même interface** que la création
- **Données pré-remplies** avec les valeurs actuelles
- **Sauvegarde** : Remplace l'ancien événement

### Supprimer un Événement

#### Méthode 1 : Depuis le Popup
1. **Cliquez sur l'événement**
2. **Cliquez sur "Supprimer"** dans le popup
3. **Confirmez la suppression**

#### Méthode 2 : Depuis la Vue Liste
1. **Cliquez sur l'icône 🗑️** à côté de l'événement
2. **Confirmez la suppression**

#### Confirmation de Suppression
- **Message d'avertissement** : "Êtes-vous sûr ?"
- **Événements récurrents** : Option de supprimer un seul ou tous
- **Annulation possible** : Bouton "Annuler"

### Dupliquer un Événement

#### Méthode
1. **Cliquez sur l'événement**
2. **Cliquez sur "Dupliquer"** dans le popup
3. **Nouvel événement** créé avec les mêmes paramètres
4. **Modifiez la date** et les détails

#### Utilisation
- **Événements récurrents** : Créer une série
- **Modèles** : Réutiliser des paramètres
- **Planification** : Préparer plusieurs RDV similaires

---

## 🔔 Notifications et Rappels

### Types de Notifications

#### Notifications Système
- **Création d'événement** : Confirmation
- **Modification d'événement** : Mise à jour
- **Suppression d'événement** : Confirmation

#### Rappels d'Événements
- **15 minutes avant** : Rappel court
- **1 heure avant** : Rappel standard
- **1 jour avant** : Rappel anticipé
- **1 semaine avant** : Rappel lointain

### Configuration des Rappels

#### Paramètres Globaux
1. **Allez dans votre profil** → "Paramètres"
2. **Section "Notifications"**
3. **Configurez les rappels** par défaut

#### Paramètres par Événement
1. **Lors de la création** d'un événement
2. **Section "Rappels"**
3. **Cochez les rappels** souhaités

### Gestion des Notifications

#### Recevoir les Notifications
- **Dans l'application** : Popup en temps réel
- **Par email** : Email de rappel
- **Par SMS** : SMS de rappel (optionnel)

#### Marquer comme Lu
1. **Cliquez sur la notification**
2. **Elle se marque** automatiquement comme lue
3. **Ou cliquez sur "Marquer comme lu"**

---

## 🔧 Dépannage

### Problèmes Courants

#### Événements Ne S'Affichent Pas
**Symptômes** : Calendrier vide, événements manquants
**Solutions** :
1. **Actualisez la page** : F5
2. **Vérifiez la vue** : Mois/Agenda/Liste
3. **Vérifiez les filtres** : Aucun filtre actif
4. **Contactez le support** : Problème technique

#### Impossible de Créer un Événement
**Symptômes** : Bouton inactif, formulaire ne s'ouvre pas
**Solutions** :
1. **Vérifiez votre connexion** : Internet
2. **Actualisez la page** : F5
3. **Essayez une autre vue** : Mois/Agenda/Liste
4. **Contactez le support** : Problème technique

#### Notifications Ne Fonctionnent Pas
**Symptômes** : Pas de rappels, notifications manquantes
**Solutions** :
1. **Vérifiez les paramètres** : Notifications activées
2. **Vérifiez votre navigateur** : Permissions
3. **Vérifiez votre email** : Spam
4. **Contactez le support** : Problème technique

#### Synchronisation Problématique
**Symptômes** : Événements décalés, doublons
**Solutions** :
1. **Actualisez la page** : Synchronisation
2. **Vérifiez l'heure** : Fuseau horaire
3. **Contactez votre expert** : Coordination
4. **Contactez le support** : Problème technique

### Messages d'Erreur

#### "Erreur de création"
- **Cause** : Données invalides ou conflit
- **Solution** : Vérifiez les informations et réessayez

#### "Événement en conflit"
- **Cause** : Deux événements à la même heure
- **Solution** : Choisissez une autre heure ou modifiez l'existant

#### "Date invalide"
- **Cause** : Date dans le passé ou format incorrect
- **Solution** : Choisissez une date future valide

---

## 💡 Conseils et Astuces

### Optimiser Votre Agenda

#### 1. Utilisez les Bonnes Vues
- **Vue Mois** : Vue d'ensemble, planification
- **Vue Agenda** : Détail semaine, gestion quotidienne
- **Vue Liste** : Recherche, organisation

#### 2. Configurez les Rappels
- **Rappels multiples** : 15min, 1h, 1j avant
- **Notifications email** : Pour les RDV importants
- **Rappels personnalisés** : Selon vos besoins

#### 3. Organisez par Couleurs
- **Couleurs par type** : Expert, Produit, Rappel
- **Couleurs par priorité** : Urgent, Normal, Faible
- **Couleurs par projet** : Par produit financier

### Bonnes Pratiques

#### 1. Planification Efficace
- **Planifiez à l'avance** : RDV importants
- **Laissez des marges** : Entre les RDV
- **Prévoyez les imprévus** : Créneaux libres

#### 2. Communication
- **Partagez votre agenda** : Avec votre expert
- **Confirmez les RDV** : La veille
- **Notez les détails** : Lieu, participants, documents

#### 3. Suivi Régulier
- **Consultez quotidiennement** : Votre agenda
- **Vérifiez les rappels** : Notifications
- **Mettez à jour** : Événements modifiés

---

## ✅ Checklist Agenda

- [ ] **Trois vues maîtrisées** : Mois, Agenda, Liste
- [ ] **Navigation fluide** : Changement de période
- [ ] **Création d'événements** : Toutes les méthodes
- [ ] **Modification d'événements** : Édition et suppression
- [ ] **Notifications configurées** : Rappels personnalisés
- [ ] **Organisation par couleurs** : Types d'événements
- [ ] **Synchronisation** : Avec votre expert

---

## 🎯 Prochaines Étapes

Maintenant que vous maîtrisez votre agenda :
1. **Guide Documents** : Organiser vos fichiers
2. **Guide Simulation** : Créer vos simulations
3. **Guide Profil** : Gérer vos paramètres

---

**💡 Conseil** : Votre agenda est votre outil de planification personnel. Prenez l'habitude de le consulter régulièrement et de planifier vos RDV à l'avance pour optimiser votre suivi !

---

*Dernière mise à jour : Janvier 2025*
