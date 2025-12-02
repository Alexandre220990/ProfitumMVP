# 🔧 Résolution Erreur OAuth2 Gmail : invalid_grant

**Date** : 2 décembre 2025  
**Problème** : Le refresh token Gmail n'est plus valide (erreur 400 invalid_grant)  
**Solution** : Régénération d'un nouveau refresh token via OAuth2

---

## 🚨 Symptômes

```
error: 'invalid_grant', 
error_description: 'Bad Request',
code: 400
```

Cette erreur se produit lors de l'appel `POST /api/gmail/check-replies`.

---

## ✅ Solution Complète

### **Option A : Via l'API (Recommandé)**

#### **1. Générer l'URL d'autorisation**

```bash
curl http://localhost:3001/api/gmail/auth-url \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "instructions": [...]
  }
}
```

#### **2. Suivre le processus OAuth2**

1. **Ouvrez** l'URL `auth_url` dans votre navigateur
2. **Connectez-vous** avec le compte Gmail utilisé pour la prospection
3. **Acceptez** toutes les permissions demandées :
   - Lire les emails Gmail
   - Modifier les labels Gmail
   - Envoyer des emails
4. **Vous serez redirigé** automatiquement vers `/api/gmail/auth-callback`
5. **Copiez** le `GMAIL_REFRESH_TOKEN` affiché à l'écran

#### **3. Mettre à jour le fichier .env**

```bash
# Dans /Users/alex/Desktop/FinancialTracker/server/.env
GMAIL_REFRESH_TOKEN=1//NOUVEAU_REFRESH_TOKEN_ICI
```

#### **4. Redémarrer le serveur**

```bash
# Si le serveur est en production (Docker)
docker-compose restart server

# Si le serveur est en développement local
cd server
npm run dev
```

#### **5. Vérifier la connexion**

```bash
curl http://localhost:3001/api/gmail/test-connection \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "email": "votre-email@gmail.com"
  }
}
```

---

### **Option B : Via le code d'autorisation manuel**

Si le redirect automatique ne fonctionne pas :

#### **1. Générer l'URL**

```bash
curl http://localhost:3001/api/gmail/auth-url \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### **2. Ouvrir l'URL et copier le code**

Après avoir autorisé l'application, Google affichera un **code d'autorisation** (si le redirect échoue).

#### **3. Échanger le code contre un refresh token**

```bash
curl -X POST http://localhost:3001/api/gmail/auth-callback \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "CODE_RECU_DE_GOOGLE"}'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "refresh_token": "1//NOUVEAU_TOKEN",
    "instructions": [...]
  }
}
```

#### **4-5. Même processus que l'Option A**

---

## 🔍 Routes API Disponibles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/gmail/test-connection` | GET | Tester la validité du token actuel |
| `/api/gmail/auth-url` | GET | Générer l'URL d'autorisation OAuth2 |
| `/api/gmail/auth-callback` | GET | Callback automatique (redirect) |
| `/api/gmail/auth-callback` | POST | Échanger un code manuellement |
| `/api/gmail/check-replies` | POST | Vérifier les réponses Gmail |

---

## 📋 Variables d'Environnement Requises

```bash
# Dans server/.env
GMAIL_CLIENT_ID=286815018966-u8a22sk6g9gh2mqhv606u37qgpjuo8oh
GMAIL_CLIENT_SECRET=VOTRE_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=1//VOTRE_NOUVEAU_REFRESH_TOKEN
GMAIL_USER_EMAIL=votre-email@gmail.com

# Optionnel : URL de redirect personnalisée
GMAIL_OAUTH_REDIRECT_URI=https://votre-domaine.com/api/gmail/auth-callback
SERVER_URL=https://votre-domaine.com
```

---

## ⚠️ Causes Fréquentes de l'Erreur

1. **Token révoqué manuellement** dans les paramètres Google
2. **Token expiré** après 6 mois d'inactivité
3. **Mot de passe changé** du compte Google
4. **Permissions révoquées** manuellement
5. **Client ID/Secret ne correspondent pas** au token

---

## 🧪 Test de Diagnostic

Exécutez ce test pour identifier le problème exact :

```bash
curl http://localhost:3001/api/gmail/test-connection \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Si `success: false` avec erreur `invalid_grant`** → Suivez la solution ci-dessus

---

## 📝 Notes Importantes

- Le **refresh token** ne doit **jamais expirer** tant qu'il est utilisé régulièrement
- Google peut révoquer un refresh token après **6 mois d'inactivité**
- Il est recommandé de **sauvegarder** le nouveau refresh token dans un gestionnaire de secrets sécurisé
- Le job CRON `gmail-checker` continuera à utiliser le nouveau token après redémarrage

---

## 🔐 Sécurité

⚠️ **Ne jamais commit** le fichier `.env` dans Git  
⚠️ **Ne jamais partager** le `GMAIL_REFRESH_TOKEN` publiquement  
⚠️ Le refresh token donne un **accès complet** au compte Gmail

---

## ✨ Améliorations Implémentées

- ✅ Route de test de connexion (`/test-connection`)
- ✅ Génération automatique de l'URL OAuth2 (`/auth-url`)
- ✅ Callback automatique avec affichage HTML du token (`GET /auth-callback`)
- ✅ Callback manuel pour échanger un code (`POST /auth-callback`)
- ✅ Gestion des erreurs OAuth2 détaillées
- ✅ Instructions pas-à-pas intégrées dans les réponses API

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez que `GMAIL_CLIENT_ID` et `GMAIL_CLIENT_SECRET` sont corrects
2. Vérifiez que le projet Google Cloud a les APIs activées :
   - Gmail API
3. Vérifiez que l'écran de consentement OAuth2 est configuré
4. Consultez les logs du serveur pour plus de détails : `docker logs server-container`

---

**Créé automatiquement le 2 décembre 2025**

