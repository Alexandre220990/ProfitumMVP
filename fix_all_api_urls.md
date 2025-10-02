# 🔧 CORRECTION MANUELLE DES URLs API

## 🎯 **PROBLÈME**
Les appels API utilisent des URLs relatives `/api/...` au lieu de `https://profitummvp-production.up.railway.app/api/...`

## ✅ **FICHIERS À CORRIGER**

### 1. ✅ **DÉJÀ CORRIGÉS**
- `client/src/components/TICPEUploadInline.tsx` ✅
- `client/src/pages/dashboard/client.tsx` ✅
- `client/src/components/DocumentUpload.tsx` ✅

### 2. 🔧 **À CORRIGER MANUELLEMENT**

#### **A. Fichiers critiques (priorité haute)**
```
client/src/services/messaging-document-integration.ts
- Ligne 51: fetch('/api/client-documents/upload' → config.API_URL + '/api/client-documents/upload'

client/src/hooks/use-document-storage.ts  
- Ligne 132: fetch('/api/client-documents/upload' → config.API_URL + '/api/client-documents/upload'

client/src/pages/welcome-expert.tsx
- Ligne 279: fetch('/api/expert/demo-request' → config.API_URL + '/api/expert/demo-request'
```

#### **B. Fichiers admin (priorité moyenne)**
```
client/src/pages/admin/gestion-dossiers.tsx
- Ligne 156: fetch('/api/admin/dossiers/stats' → config.API_URL + '/api/admin/dossiers/stats'
- Ligne 175: fetch('/api/admin/produits' → config.API_URL + '/api/admin/produits'
- Ligne 234: fetch('/api/admin/produits' → config.API_URL + '/api/admin/produits'
- Ligne 254: fetch('/api/admin/dossiers' → config.API_URL + '/api/admin/dossiers'

client/src/pages/admin/gestion-clients.tsx
- Ligne 254: fetch('/api/admin/clients' → config.API_URL + '/api/admin/clients'
```

#### **C. Fichiers composants (priorité basse)**
```
client/src/components/collaborative-events/CollaborativeEventManager.tsx
- Ligne 135: fetch('/api/collaborative-events' → config.API_URL + '/api/collaborative-events'
- Ligne 162: fetch('/api/collaborative-events/stats' → config.API_URL + '/api/collaborative-events/stats'
- Ligne 207: fetch('/api/collaborative-events' → config.API_URL + '/api/collaborative-events'

client/src/components/documents/UnifiedDocumentSystem.tsx
- Ligne 83: fetch('/api/unified-documents/upload' → config.API_URL + '/api/unified-documents/upload'

client/src/components/ProgressiveMigrationFlow.tsx
- Ligne 82: fetch('/api/session-migration/migrate' → config.API_URL + '/api/session-migration/migrate'
- Ligne 99: fetch('/api/auth/login' → config.API_URL + '/api/auth/login'

client/src/components/admin/DocumentationManager.tsx
- Ligne 67: fetch('/api/admin/documents' → config.API_URL + '/api/admin/documents'
- Ligne 88: fetch('/api/admin/documents/stats' → config.API_URL + '/api/admin/documents/stats'

client/src/components/admin/ComplianceDashboard.tsx
- Ligne 73: fetch('/api/compliance/stats' → config.API_URL + '/api/compliance/stats'
- Ligne 82: fetch('/api/compliance/controls' → config.API_URL + '/api/compliance/controls'
- Ligne 91: fetch('/api/workflow/templates' → config.API_URL + '/api/workflow/templates'
- Ligne 100: fetch('/api/compliance/incidents' → config.API_URL + '/api/compliance/incidents'
```

#### **D. Fichiers utilitaires**
```
client/src/utils/debug-logger.ts
- Ligne 112: fetch('/api/logs' → config.API_URL + '/api/logs'
```

## 🔧 **MÉTHODE DE CORRECTION**

### **Étape 1 : Ajouter l'import config**
```typescript
import { config } from '@/config/env';
```

### **Étape 2 : Remplacer les URLs**
```typescript
// AVANT
const response = await fetch('/api/endpoint', {

// APRÈS  
const response = await fetch(`${config.API_URL}/api/endpoint`, {
```

## 🎯 **PRIORITÉS**

1. **🔥 URGENT** : Fichiers critiques (documents, client)
2. **⚡ IMPORTANT** : Fichiers admin
3. **📝 NORMAL** : Composants et utilitaires

## ✅ **VÉRIFICATION**

Après correction, tester :
- Upload de documents
- Sélection d'expert
- Dashboard client
- Fonctionnalités admin
