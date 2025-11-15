## Design BDD — Partage multi-experts par cabinet

### 1. Hypothèses de départ
- Les experts et apporteurs sont déjà liés à des utilisateurs authentifiés (table `Expert`, `ApporteurAffaires`).
- Aucun identifiant de cabinet unique n’est stocké actuellement ; vérifier via `information_schema.tables` avant exécution.
- La table `Client` reste l’entité historique à préserver (pas de modification directe).

### 2. Nouvelles structures proposées
#### Table `Cabinet`
| Colonne        | Type    | Contraintes                                |
| -------------- | ------- | ------------------------------------------ |
| id             | UUID    | PK, défaut `gen_random_uuid()`             |
| name           | text    | NOT NULL                                   |
| siret          | text    | NULL, index unique optionnel               |
| created_at     | timestamptz | défaut `now()`                        |
| updated_at     | timestamptz | défaut `now()` via trigger             |

#### Table `CabinetMember`
(à créer uniquement si un utilisateur peut appartenir à plusieurs cabinets ; sinon, ajouter `cabinet_id` directement aux tables `Expert` et `ApporteurAffaires`)
| Colonne    | Type  | Contraintes                                                  |
| ---------- | ----- | ------------------------------------------------------------ |
| id         | UUID  | PK                                                          |
| cabinet_id | UUID  | FK → `Cabinet(id)` ON DELETE CASCADE                         |
| user_id    | UUID  | Référence vers `Expert.id` ou `ApporteurAffaires.id`         |
| role       | text  | ENUM logique : `expert`, `apporteur`, `assistant`, etc.     |
| created_at | timestamptz | défaut `now()`                                        |

#### Colonne `cabinet_id` sur `RDV`
- Type UUID, nullable.
- Remplie automatiquement selon le créateur :
  - Expert : `cabinet_id = Expert.cabinet_id`.
  - Apporteur : `cabinet_id =` cabinet principal ou via table `CabinetMember`.
- Index recommandé : `CREATE INDEX idx_rdv_cabinet_date ON "RDV"(cabinet_id, scheduled_date);`

#### Table de partage `ClientProduitEligibleShare`
| Colonne                   | Type    | Contraintes                                                  |
| ------------------------- | ------- | ------------------------------------------------------------ |
| id                        | UUID    | PK                                                           |
| client_produit_eligible_id| UUID    | FK → `ClientProduitEligible(id)` ON DELETE CASCADE           |
| expert_id                 | UUID    | FK → `Expert(id)`                                            |
| cabinet_id                | UUID    | FK → `Cabinet(id)`                                           |
| permissions               | jsonb   | ex: `{"read": true, "write": false}`                         |
| granted_by                | UUID    | utilisateur qui accorde le partage                           |
| created_at                | timestamptz | défaut `now()`                                            |
| expires_at                | timestamptz | NULL si partage permanent                                  |

### 3. Règles fonctionnelles
- Tout expert d’un même cabinet hérite des partages automatiques : insertion d’une ligne `ClientProduitEligibleShare` lors de l’affectation d’un dossier à un cabinet.
- Les réunions internes (`category = reunion_interne`) doivent porter `cabinet_id` et ne sont visibles que par les membres de ce cabinet.
- Les RDV dossiers (`suivi_dossier`) héritent de `cabinet_id` depuis l’expert principal ou depuis la ligne de partage si un autre expert du cabinet intervient.
- Lorsqu’un apporteur crée un RDV pour un client d’un cabinet donné, on renseigne `cabinet_id` pour permettre aux experts associés de suivre l’événement.

### 4. Impacts RLS / API
- Politiques Supabase sur `RDV`, `RDV_Report`, `Task`, `ClientProduitEligibleShare` :
  - Autoriser l’accès si l’utilisateur est participant direct (client/expert/apporteur) ou membre du même cabinet référencé.
  - Restreindre `metadata.additional_participants` aux `CabinetMember` du même cabinet.
- API `/api/rdv` :
  - Renseigner `cabinet_id` à la création.
  - Vérifier les droits lors de la lecture/mise à jour via partages.
- API timeline/documents : filtrer par `cabinet_id` pour exposer les dossiers partagés.

### 5. Étapes SQL prévues
1. Script `create-cabinet-structures-step17.sql`
   - Créer `Cabinet`, `CabinetMember` (si nécessaire) et ajouter `cabinet_id` aux tables `Expert`, `ApporteurAffaires`.
2. Script `add-rdv-cabinet-and-share-step18.sql`
   - Ajouter `cabinet_id` + index à `RDV`.
   - Créer `ClientProduitEligibleShare`.
3. Script `rls-update-cabinet-sharing-step19.sql`
   - Mettre à jour/ajouter les politiques RLS.

Chaque script sera autonome, documenté et pourra être exécuté séquentiellement.

