# 📚 Guide d'utilisation - GED Admin Améliorée

## 🎯 Vue d'ensemble

La page GED (Gestion Électronique Documentaire) admin a été entièrement modernisée avec des fonctionnalités de ciblage avancé, permettant à l'administrateur de créer et gérer des documents avec un contrôle granulaire des accès.

---

## ✨ Nouvelles fonctionnalités

### 🎯 Ciblage avancé
- **Documents pour tous** : Accès public à tous les utilisateurs
- **Documents pour clients spécifiques** : Ciblage individuel ou multiple
- **Documents pour experts spécifiques** : Ciblage individuel ou multiple  
- **Documents pour groupes** : Création et gestion de groupes mixtes (clients + experts)
- **Documents pour l'admin uniquement** : Accès restreint

### 🔐 Niveaux d'accès
- **Public** : Visible par tous les utilisateurs
- **Private** : Visible uniquement par les cibles spécifiées
- **Restricted** : Accès limité avec restrictions supplémentaires
- **Confidential** : Accès hautement sécurisé

### 👥 Gestion des groupes
- Création de groupes personnalisés
- Ajout/suppression de membres (clients et experts)
- Gestion des descriptions et métadonnées
- Activation/désactivation des groupes

---

## 🚀 Utilisation

### 1. Création d'un nouveau document

1. **Accéder à la page GED** : `/admin/ged-management`
2. **Cliquer sur "Nouveau Document"**
3. **Remplir les informations de base** :
   - Titre du document
   - Catégorie (Métier ou Technique)
   - Description
   - Temps de lecture estimé
   - Version

### 2. Configuration du ciblage

1. **Sélectionner le niveau d'accès** :
   - Choisir entre Public, Private, Restricted, Confidential
   - L'icône change selon le niveau sélectionné

2. **Sélectionner les cibles** :
   - **Onglet Clients** : Rechercher et sélectionner des clients
   - **Onglet Experts** : Rechercher et sélectionner des experts
   - **Onglet Groupes** : Sélectionner des groupes existants ou en créer de nouveaux

3. **Recherche avancée** :
   - Barre de recherche globale pour tous les types de cibles
   - Filtrage automatique par nom, email, entreprise
   - Sélection multiple avec cases à cocher

### 3. Gestion des groupes

#### Création d'un groupe
1. **Onglet Groupes** → **"Nouveau groupe"**
2. **Remplir les informations** :
   - Nom du groupe
   - Description
   - Sélectionner les membres (clients et experts)
3. **Sauvegarder**

#### Modification d'un groupe
1. **Cliquer sur l'icône d'édition** du groupe
2. **Modifier les informations** :
   - Ajouter/supprimer des membres
   - Modifier la description
   - Activer/désactiver le groupe

### 4. Contenu du document

- **Support HTML** : Le contenu supporte le HTML pour une mise en forme avancée
- **Éditeur en pleine largeur** : Interface optimisée pour la rédaction
- **Aperçu en temps réel** : Visualisation des cibles sélectionnées

---

## 🎨 Interface utilisateur

### Design moderne
- **Cards organisées** : Informations clairement séparées
- **Icônes intuitives** : Navigation facilitée par des icônes explicites
- **Couleurs cohérentes** : Code couleur pour les différents types de cibles
- **Responsive design** : Adaptation automatique aux différentes tailles d'écran

### Affichage des cibles
- **Badges colorés** : Différenciation visuelle des types de cibles
- **Compteurs** : Nombre de cibles sélectionnées
- **Aperçu compact** : Affichage des cibles dans les cartes de documents
- **Actions rapides** : Suppression directe des cibles

### Filtres et recherche
- **Recherche globale** : Recherche dans tous les types de cibles
- **Filtres par type** : Onglets séparés pour clients, experts, groupes
- **Tri intelligent** : Tri par nom, date, type
- **Favoris** : Système de favoris pour les documents importants

---

## 🔧 Fonctionnalités techniques

### Permissions granulaires
- **Lecture** : Accès en lecture seule
- **Écriture** : Modification des documents
- **Suppression** : Suppression des documents
- **Gestion des permissions** : Configuration des droits d'accès

### Sécurité
- **Validation des accès** : Vérification automatique des permissions
- **Audit trail** : Traçabilité des actions
- **Chiffrement** : Protection des documents sensibles
- **Expiration** : Gestion des dates d'expiration

### Performance
- **Chargement optimisé** : Pagination et lazy loading
- **Cache intelligent** : Mise en cache des données fréquemment utilisées
- **Recherche rapide** : Indexation pour des recherches instantanées

---

## 📊 Statistiques et métriques

### Tableau de bord
- **Documents accessibles** : Nombre total de documents visibles
- **Favoris** : Documents marqués comme favoris
- **Labels** : Nombre de labels disponibles
- **Rôle utilisateur** : Type d'utilisateur connecté

### Métriques avancées
- **Utilisation par cible** : Statistiques d'accès par client/expert/groupe
- **Documents populaires** : Documents les plus consultés
- **Temps de lecture** : Métriques d'engagement
- **Taux de conversion** : Efficacité des documents

---

## 🛠️ Maintenance et administration

### Gestion des labels
- **Création de labels** : Organisation des documents par tags
- **Couleurs personnalisées** : Personnalisation visuelle
- **Hiérarchie** : Organisation en catégories et sous-catégories

### Sauvegarde et restauration
- **Sauvegarde automatique** : Protection contre la perte de données
- **Versioning** : Gestion des versions de documents
- **Restauration** : Récupération en cas d'incident

### Monitoring
- **Logs d'accès** : Traçabilité des consultations
- **Alertes** : Notifications en cas d'anomalie
- **Rapports** : Génération de rapports d'utilisation

---

## 🎯 Bonnes pratiques

### Organisation des documents
1. **Utiliser des catégories claires** : Métier vs Technique
2. **Créer des groupes logiques** : Regrouper les utilisateurs par projet ou domaine
3. **Documenter les cibles** : Ajouter des descriptions aux groupes
4. **Réviser régulièrement** : Mettre à jour les accès selon les besoins

### Sécurité
1. **Principe du moindre privilège** : Donner le minimum d'accès nécessaire
2. **Révision périodique** : Vérifier régulièrement les permissions
3. **Audit des accès** : Surveiller les accès inhabituels
4. **Formation des utilisateurs** : Sensibiliser aux bonnes pratiques

### Performance
1. **Optimiser les groupes** : Éviter les groupes trop larges
2. **Archiver les anciens documents** : Maintenir une base propre
3. **Utiliser les labels** : Faciliter la recherche et l'organisation
4. **Monitorer l'utilisation** : Identifier les documents peu utilisés

---

## 🆘 Support et assistance

### Problèmes courants
- **Document non visible** : Vérifier les cibles et le niveau d'accès
- **Groupe non trouvé** : Vérifier l'activation du groupe
- **Permissions insuffisantes** : Contacter l'administrateur

### Contact
- **Support technique** : support@profitum.fr
- **Documentation** : `/admin/documentation`
- **Formation** : Sessions de formation disponibles

---

## 📈 Évolutions futures

### Fonctionnalités prévues
- **Workflow d'approbation** : Validation en plusieurs étapes
- **Notifications automatiques** : Alertes lors de nouveaux documents
- **Intégration API** : Connexion avec d'autres systèmes
- **Analytics avancés** : Métriques détaillées d'utilisation

### Améliorations UX
- **Mode sombre** : Interface adaptée aux préférences
- **Raccourcis clavier** : Navigation plus rapide
- **Drag & drop** : Interface plus intuitive
- **Prévisualisation** : Aperçu des documents avant ouverture

---

*Dernière mise à jour : Juillet 2025*  
*Version : 2.0 - Ciblage avancé* 