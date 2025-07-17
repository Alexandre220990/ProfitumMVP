# Guide d'Utilisation - Dashboard Admin FinancialTracker

## 🎯 Vue d'Ensemble

Le Dashboard Admin FinancialTracker est l'interface de gestion principale pour administrer les assignations expert/client, la messagerie et les produits éligibles.

**URL d'accès :** http://localhost:5173/admin  
**Version :** 1.0  
**Date :** 3 Janvier 2025  

---

## 🔐 Connexion

### Identifiants Admin
```
Email : admin@profitum.fr
Mot de passe : admin123
```

### Sécurité
- ✅ Authentification JWT sécurisée
- ✅ RLS (Row Level Security) activé
- ✅ Sessions sécurisées
- ✅ Logs d'accès

---

## 📊 Tableau de Bord Principal

### Métriques Clés
1. **Assignations Totales** - Nombre total d'assignations
2. **Assignations en Cours** - Assignations avec statut 'pending'
3. **Experts Actifs** - Nombre d'experts disponibles
4. **Clients Actifs** - Nombre de clients actifs
5. **Produits Éligibles** - Nombre de produits disponibles

### Graphiques
- **Répartition par Statut** - Pie chart des assignations
- **Évolution Mensuelle** - Line chart des assignations
- **Top Experts** - Bar chart des experts les plus actifs
- **Top Produits** - Bar chart des produits les plus demandés

---

## 👥 Gestion des Assignations

### Vue d'Ensemble
- **Liste des assignations** avec filtres avancés
- **Statuts disponibles :** pending, accepted, rejected, completed, cancelled
- **Actions rapides :** Accepter, Rejeter, Marquer comme terminé

### Filtres Disponibles
- **Par statut** - pending, accepted, rejected, completed, cancelled
- **Par expert** - Sélection d'un expert spécifique
- **Par client** - Sélection d'un client spécifique
- **Par produit** - Sélection d'un produit spécifique
- **Par date** - Période personnalisée

### Actions sur les Assignations
1. **Voir les détails** - Informations complètes
2. **Accepter** - Changer le statut vers 'accepted'
3. **Rejeter** - Changer le statut vers 'rejected'
4. **Marquer comme terminé** - Changer le statut vers 'completed'
5. **Annuler** - Changer le statut vers 'cancelled'

---

## 💬 Messagerie

### Interface de Messagerie
- **Conversations** - Liste des conversations actives
- **Messages** - Historique des messages par conversation
- **Nouveau message** - Créer une nouvelle conversation

### Fonctionnalités
- **Messagerie temps réel** - Messages instantanés
- **Notifications** - Alertes pour nouveaux messages
- **Pièces jointes** - Support des fichiers
- **Statuts de lecture** - Suivi des messages lus

### Types d'Utilisateurs
- **Experts** - Consultants spécialisés
- **Clients** - Entreprises utilisatrices
- **Admin** - Administrateurs système

---

## 🏷️ Gestion des Produits

### Catalogue de Produits
- **Liste des produits** avec catégories
- **Statut actif/inactif** - Gestion de la disponibilité
- **Catégories** - TICPE, CEE, Audit, DFS, etc.

### Actions sur les Produits
1. **Ajouter un produit** - Créer un nouveau produit
2. **Modifier** - Éditer les informations
3. **Activer/Désactiver** - Changer le statut
4. **Supprimer** - Retirer du catalogue

### Catégories Disponibles
- **TICPE** - Taxe Intérieure de Consommation sur les Produits Énergétiques
- **CEE** - Certificats d'Économies d'Énergie
- **Audit** - Audits énergétiques
- **DFS** - Défiscalisation
- **Général** - Autres produits

---

## 📈 Rapports et Statistiques

### Rapports Disponibles
1. **Rapport Mensuel** - Assignations par mois
2. **Rapport par Catégorie** - Répartition par produit
3. **Rapport par Expert** - Performance des experts
4. **Rapport par Client** - Activité des clients

### Statistiques Avancées
- **Taux de conversion** - Assignations acceptées vs total
- **Temps de réponse** - Délai moyen de traitement
- **Satisfaction client** - Notes et retours
- **Performance expert** - Nombre d'assignations réussies

### Export de Données
- **Format CSV** - Données tabulaires
- **Format PDF** - Rapports formatés
- **Format Excel** - Données avec graphiques
- **API REST** - Accès programmatique

---

## ⚙️ Configuration Système

### Paramètres Généraux
- **Nom de l'organisation** - Personnalisation
- **Logo** - Upload du logo
- **Thème** - Couleurs et style
- **Langue** - Français/English

### Paramètres de Sécurité
- **Durée de session** - Timeout automatique
- **Complexité des mots de passe** - Règles de sécurité
- **Authentification à deux facteurs** - 2FA
- **Logs d'audit** - Traçabilité

### Paramètres de Notification
- **Email** - Notifications par email
- **Push** - Notifications navigateur
- **SMS** - Notifications par SMS
- **Webhook** - Intégrations externes

---

## 🔧 Maintenance

### Tâches Régulières
1. **Sauvegarde** - Backup quotidien de la base
2. **Nettoyage** - Suppression des données obsolètes
3. **Monitoring** - Surveillance des performances
4. **Mise à jour** - Mises à jour de sécurité

### Logs et Monitoring
- **Logs d'accès** - Connexions utilisateurs
- **Logs d'erreur** - Erreurs système
- **Logs de performance** - Temps de réponse
- **Logs d'audit** - Actions administratives

---

## 🆘 Support et Aide

### Problèmes Courants
1. **Connexion impossible** - Vérifier les identifiants
2. **Données manquantes** - Vérifier les permissions
3. **Performance lente** - Contacter l'équipe technique
4. **Erreurs système** - Consulter les logs

### Contact Support
- **Email :** support@profitum.fr
- **Téléphone :** +33 1 23 45 67 89
- **Chat :** Support en ligne
- **Documentation :** Guides techniques

### Formation
- **Vidéos tutorielles** - Guides pas à pas
- **Webinaires** - Sessions de formation
- **Documentation** - Guides détaillés
- **Support personnalisé** - Accompagnement

---

## 📱 Accessibilité

### Compatibilité
- **Navigateurs** - Chrome, Firefox, Safari, Edge
- **Responsive** - Mobile, tablette, desktop
- **Accessibilité** - WCAG 2.1 AA
- **Performance** - Optimisé pour tous les appareils

### Fonctionnalités Avancées
- **Raccourcis clavier** - Navigation rapide
- **Mode sombre** - Interface adaptée
- **Zoom** - Adaptation visuelle
- **Lecteur d'écran** - Support handicap

---

## 🎉 Conclusion

Le Dashboard Admin FinancialTracker offre une interface complète et intuitive pour gérer efficacement les assignations expert/client, la messagerie et les produits éligibles.

**Fonctionnalités clés :**
- ✅ Gestion complète des assignations
- ✅ Messagerie temps réel
- ✅ Rapports et statistiques
- ✅ Gestion des produits
- ✅ Sécurité avancée

**Prêt pour la production !** 🚀

---

**Document généré le :** 3 Janvier 2025  
**Version :** 1.0  
**Statut :** ✅ APPROUVÉ 