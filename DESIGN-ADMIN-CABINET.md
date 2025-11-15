## Design Admin — Cabinets & Partenaires

### 1. Objectifs
- Offrir à l’admin un module complet pour gérer les cabinets partenaires, leurs utilisateurs (experts, responsables, apporteurs associés) et leurs produits éligibles.
- Fournir des vues synthétiques : fiche cabinet (KPIs, produits, clients, dossiers), fiche expert (performances, produits autorisés, tâches), suivi des apporteurs rattachés au cabinet.
- Préparer les API nécessaires pour alimenter ces interfaces et synchroniser les droits (cabinet_id, partages dossiers, disponibilités RDV).

### 2. Structures BDD requises (rappel)
- `Cabinet` (déjà créé, step17) : identifiant, nom, SIRET, contacts.
- `CabinetMember` : association `cabinet_id` ↔ user (expert ou apporteur), rôle (`responsable_cabinet`, `expert`, `apporteur`, `assistant_pro` si besoin).
- `CabinetProduitEligible` (à créer) : liste des produits autorisés pour le cabinet + paramètres financiers (commission, frais fixes).
- `CabinetMemberProduit` (optionnel) : sous-ensemble des produits accessibles pour un membre spécifique (sinon héritage total du cabinet).
- `ClientProduitEligibleShare` : partage explicite d’un dossier à d’autres experts du même cabinet (déjà introduit step18).

### 3. API Admin à implémenter

#### 3.1 Cabinets
| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/admin/cabinets` | GET | Liste paginée + filtres (nom, SIRET, statut). |
| `/api/admin/cabinets` | POST | Création cabinet (nom, SIRET, contacts, produits autorisés initiaux). |
| `/api/admin/cabinets/:id` | GET | Détails cabinet (inférences KPI, équipe, produits, clients). |
| `/api/admin/cabinets/:id` | PUT | Mise à jour infos générales. |
| `/api/admin/cabinets/:id/products` | PUT | Remplacement/ajout de produits autorisés + paramètres (commission, fee). |
| `/api/admin/cabinets/:id/members` | POST | Ajout d’un membre (user_id + rôle) / invitation. |
| `/api/admin/cabinets/:id/members/:memberId` | DELETE | Retrait d’un membre. |

#### 3.2 Experts / Membres
| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/admin/experts/:id` | GET | Vue synthèse expert : clients actifs, dossiers, RDV, tâches. |
| `/api/admin/experts/:id/products` | PUT | Restreindre l’expert à certains produits du cabinet. |
| `/api/admin/experts/:id/cabinets` | GET | Liste des cabinets auxquels l’expert est rattaché (multi-cabinets possible). |

#### 3.3 Apporteurs
| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/admin/apporteurs/:id/cabinets` | PUT | Définir les cabinets autorisés pour un apporteur (relation n-n). |
| `/api/admin/apporteurs/:id/clients` | GET | Liste des clients liés + cabinet entrant. |

#### 3.4 Partages dossiers
| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/admin/dossiers/:cpeId/share` | POST | Associer un dossier à un cabinet/ expert secondaire (insertion `ClientProduitEligibleShare`). |
| `/api/admin/dossiers/:cpeId/share/:shareId` | DELETE | Révoquer un partage. |

### 4. Données retournées (exemples)
#### CabinetDetailResponse
```jsonc
{
  "id": "...",
  "name": "Cabinet Durand",
  "siret": "12345678900011",
  "contact": { "email": "...", "phone": "..." },
  "kpis": {
    "clients_actifs": 42,
    "dossiers_en_cours": 18,
    "fees_mensuels": 12400,
    "rdv_30j": 27
  },
  "products": [
    { "produit_id": "...", "nom": "TICPE", "commission": 8, "fee": 250 },
    { "produit_id": "...", "nom": "MSA", "commission": 6, "fee": 180 }
  ],
  "members": [
    { "id": "...", "type": "responsable_cabinet", "name": "Claire Dupont", "email": "...", "produits_autorises": ["TICPE"] },
    { "id": "...", "type": "expert", "name": "Louis Martin", "clients": 12, "rdv_a_venir": 5 }
  ],
  "apporteurs": [
    { "id": "...", "name": "Réseau ABC", "clients": 8, "dossiers_actifs": 5 }
  ]
}
```

### 5. Front Office (admin)
- **Liste cabinets** : cartes listant les principaux KPIs (clients, dossiers, CA). Actions rapides (voir fiche, éditer, inviter membre).
- **Fiche cabinet** :
  - Onglet `Synthèse` : KPIs + graphiques (répartition produits, RDV récents, tasks).
  - Onglet `Équipe` : table membres (rôle, email, produits autorisés, statut). Bouton “Ajouter un membre”.
  - Onglet `Produits` : table paramétrage (commissions, fees, activation). Possibilité de dupliquer la config depuis un autre cabinet.
  - Onglet `Clients / Dossiers` : table filterable par expert/apporteur/produit, boutons de partage.
- **Fiche expert** :
  - Header : cabinet principal + switch si multi-cabinets.
  - Metrics personnels : RDV, dossiers, tasks, temps moyen de traitement.
  - Liste de ses produits autorisés + bouton “Restreindre / étendre”.

### 6. Sécurité / RLS
- Administrateur global : accès complet (nouvelle middleware `adminOnly` déjà existante).
- `CabinetMember` : RLS pour empêcher les non-admins d’écrire directement (uniquement via endpoints admin).
- `ClientProduitEligibleShare` : RLS déjà renforcée pour vérifier l’appartenance cabinet.
- Prévoir un middleware `requireAdmin` sur toutes les routes `/api/admin/cabinets/*`.

### 7. Roadmap technique
1. Scripts SQL :
   - `create-cabinet-produit-step24.sql` (table produits par cabinet).
   - `create-cabinet-member-prod-step25.sql` (si granularité par membre).
2. Routes backend :
   - Nouveau fichier `server/src/routes/admin/cabinets.ts` (Express router dédié).
   - Services utilitaires (agrégation KPI, calcul fees) dans `server/src/services/cabinetService.ts`.
3. Front admin :
   - Pages `client/src/pages/admin/cabinets/index.tsx` (liste) et `[id].tsx` (fiche).
   - Composants partagés (tables, KPI cards, modals assignation produit/membre).
4. Tests / scripts de vérification (compter partages, cohérence membres).

### 8. Points de vigilance
- Cohérence des IDs (utiliser `cabinet_id` existants pour prefill lors de la création RDV).
- Tracer tous les changements (audit log simple via `RDV_Timeline` ou nouvelle table `CabinetAudit` si besoin).
- Respecter la préférence IPv6 pour les liens configurés côté admin si l’UI le demande.

