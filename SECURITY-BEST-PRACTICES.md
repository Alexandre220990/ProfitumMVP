# 🛡️ Guide de Sécurité - Bonnes Pratiques

## 🚨 **DONNÉES CRITIQUEMENT SENSIBLES**

### **❌ JAMAIS exposer ces données :**

#### **1. Clés d'API et Secrets**
```
GOOGLE_CLIENT_SECRET=GOCSPX-...
JWT_SECRET=+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS...
SESSION_SECRET=profitum_session_...
WEBHOOK_SECRET=profitum_webhook_...
```

#### **2. Clés de Base de Données**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DB_PASSWORD=EhAhS26BXDsowVPe
```

#### **3. URLs de Production**
```
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co
REDIS_URL=redis://localhost:6379
```

---

## 🔒 **BONNES PRATIQUES DE SÉCURITÉ**

### **1️⃣ Gestion des Variables d'Environnement**

#### **✅ Fichier .env (local uniquement)**
```bash
# ✅ CORRECT - Utiliser des placeholders
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
DB_PASSWORD=your-db-password-here
```

#### **❌ Fichiers à NE JAMAIS commiter**
```
.env
.env.local
.env.production
.env.secrets
```

#### **✅ Fichiers sécurisés à commiter**
```
.env.example
.env.template
```

### **2️⃣ Configuration Git**

#### **✅ .gitignore obligatoire**
```gitignore
# Variables d'environnement
.env
.env.local
.env.production
.env.secrets
.env.*.local

# Logs
*.log
logs/

# Clés et certificats
*.pem
*.key
*.crt
*.p12

# Base de données
*.db
*.sqlite
*.sqlite3

# Cache
.cache/
.temp/
```

### **3️⃣ Génération de Secrets Sécurisés**

#### **✅ JWT Secret (256 bits)**
```bash
# Générer un secret JWT sécurisé
openssl rand -base64 32
```

#### **✅ Session Secret (256 bits)**
```bash
# Générer un secret de session sécurisé
openssl rand -hex 32
```

#### **✅ Webhook Secret (256 bits)**
```bash
# Générer un secret webhook sécurisé
openssl rand -hex 32
```

---

## 🔍 **VÉRIFICATIONS DE SÉCURITÉ**

### **1️⃣ Audit Git**
```bash
# Vérifier si des secrets ont été commités
git log --all --full-history -- .env*
git log --all --full-history -- "*.key"
git log --all --full-history -- "*.secret"
```

### **2️⃣ Audit des Fichiers**
```bash
# Chercher des patterns sensibles
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
grep -r "GOCSPX-" .
grep -r "profitum_" .
grep -r "EhAhS26BXDsowVPe" .
```

### **3️⃣ Audit des Logs**
```bash
# Vérifier les logs pour des secrets exposés
grep -r "password\|secret\|key" logs/
```

---

## 🚨 **EN CAS D'EXPOSITION**

### **1️⃣ Actions Immédiates**
1. **Régénérer TOUTES les clés exposées**
2. **Révoquer les accès compromis**
3. **Auditer les logs d'accès**
4. **Notifier l'équipe**

### **2️⃣ Régénération des Clés**

#### **Google OAuth2**
1. Aller sur Google Cloud Console
2. APIs & Services > Credentials
3. Régénérer le Client Secret

#### **Supabase**
1. Aller sur Supabase Dashboard
2. Settings > API
3. Régénérer les clés

#### **Base de Données**
1. Changer le mot de passe utilisateur
2. Révoquer les connexions actives
3. Mettre à jour les variables d'environnement

---

## 📋 **CHECKLIST DE SÉCURITÉ**

### **✅ Avant chaque commit :**
- [ ] Vérifier .gitignore
- [ ] Pas de .env dans le commit
- [ ] Pas de secrets dans le code
- [ ] Pas de clés dans les commentaires

### **✅ Avant chaque déploiement :**
- [ ] Variables d'environnement configurées
- [ ] Secrets régénérés si nécessaire
- [ ] Accès limités aux seules personnes autorisées
- [ ] Logs de sécurité activés

### **✅ Surveillance continue :**
- [ ] Monitoring des accès
- [ ] Audit des logs
- [ ] Vérification des permissions
- [ ] Tests de sécurité

---

## 🎯 **EXEMPLES SÉCURISÉS**

### **✅ Configuration Sécurisée**
```bash
# .env.example (à commiter)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
DB_PASSWORD=your-db-password-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### **✅ Code Sécurisé**
```typescript
// ✅ CORRECT - Utiliser les variables d'environnement
const jwtSecret = process.env.JWT_SECRET;
const dbPassword = process.env.DB_PASSWORD;

// ❌ INCORRECT - Clés en dur
const jwtSecret = "+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS...";
const dbPassword = "EhAhS26BXDsowVPe";
```

---

## 🎉 **RÉSULTAT**

Avec ces bonnes pratiques :
- ✅ **Aucune clé sensible exposée**
- ✅ **Sécurité maximale**
- ✅ **Conformité aux standards**
- ✅ **Protection des données utilisateurs**

**Votre application est maintenant irréprochable niveau sécurité !** 🛡️ 