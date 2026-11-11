# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Application de gestion et de reporting de projet (référentiel PMP / PMBOK) pour la DSI de Dakar Mobilité. L'utilisateur travaille en français : interface, contenu de démo, commentaires de code et messages de commit en français ; identifiants en anglais.

## Commandes

```bash
npm install                 # à la racine (workspaces npm)
docker compose up -d db     # PostgreSQL 16 seul, port hôte 5433 (user/pwd/db = gdp)
docker compose up -d --build  # application complète en conteneurs → http://localhost:8080
npm run dev                 # API (tsx watch, :3001) + frontend (Vite, :5173) via concurrently
npm run typecheck           # tsc --noEmit sur backend puis frontend — la vérification de référence
npm run build               # backend via tsup, frontend via tsc + vite build
```

- Conteneurs : `docker/api.Dockerfile` (tsup puis `node dist/main.js`, `NODE_ENV=production`), `docker/web.Dockerfile` (build Vite servi par nginx, `docker/nginx.conf` relaie `/api` et `/health` vers `api:3001` ; `VITE_API_URL` vide → appels relatifs, même origine). L'API du conteneur lit `packages/backend/.env` (donc `JWT_SECRET`), le compose impose `DATABASE_URL` vers `db:5432` et `TRUST_PROXY=true`.
- Il n'y a **ni tests automatisés ni linter** : la vérification passe par `npm run typecheck` puis l'application lancée (aperçu navigateur).
- `packages/backend/.env` (copié de `.env.example`) : `DATABASE_URL` défini → PostgreSQL ; absent → persistance **en mémoire** (volatile). `JWT_SECRET` obligatoire en production.
- L'API lit `API_PORT` en priorité sur `PORT` : l'outil d'aperçu injecte `PORT=5173` dans tout le processus. `.claude/launch.json` (config `app`) lance `npm run dev` complet ; ne pas lancer le frontend seul, sinon l'API n'est pas démarrée.
- Au démarrage, la base est migrée (`postgres/migrate.ts`, `CREATE TABLE / ADD COLUMN IF NOT EXISTS`, pas de migrations versionnées) puis alimentée si vide (projets Alpha / Beta / Gamma, comptes `admin@dkm.sn`, `editor@dkm.sn`, `viewer@dkm.sn` — mots de passe dans `seed/users.seed.ts`).
- Piège `tsx watch` : si un fichier importé n'existe pas encore au rechargement, l'API plante (`ERR_MODULE_NOT_FOUND`) ; créer les fichiers importés avant de modifier le conteneur.
- Fins de ligne LF imposées par `.gitattributes` (le poste est en `core.autocrlf=true`) : un script qui écrit des fichiers doit écrire en LF.

## Architecture

Monorepo npm workspaces : `packages/backend`, `packages/frontend`, et `packages/shared` (pas un workspace : inclus par les deux `tsconfig` et l'alias `@shared/*`, résolu par tsup et Vite).

- **`shared/src/contracts`** : DTO et formes de saisie (`XxxInput` / `XxxDto`) partagés backend ⇄ frontend, réexportés par `shared/src/index.ts` — source de vérité unique des contrats.
- **Backend** (Fastify, architecture hexagonale, alias `@domain`, `@application`, `@infrastructure`) :
  - `domain/` : entités et objets-valeur sans dépendance externe ; constructeur privé + factory `of()` / `create()` qui valide et jette `DomainError`. Dates « jour » en UTC, sérialisées `YYYY-MM-DD`. Montants via `Money` en `XOF`, affichés « FCFA ».
  - `application/` : ports entrants (`ports/in`), ports sortants (`ports/out`, dépôts), services de cas d'usage (`use-cases`) et mappers domaine ⇄ DTO.
  - `infrastructure/` : `config/container.ts` est la racine de composition (câble tous les cas d'usage, choisit les dépôts PostgreSQL ou en mémoire, lance seed/migration) ; `http/server.ts` enregistre toutes les routes ; adaptateurs HTTP dans `adapters/in/http` (schémas Zod dans `schemas/`), persistance dans `adapters/out/persistence`.
- **Frontend** (React 18 + Vite, sans routeur ni bibliothèque de graphes) : `App.tsx` affiche une vue selon un état `AppView` ; `navigation/pmp.ts` déclare le menu (sorties PMBOK, adaptées à la méthodologie du projet : prédictive / hybride / agile) ; une vue = un `features/XxxFeature.tsx`, ses composants dans `components/<domaine>/`, son formatage dans `lib/<domaine>-format.ts`, ses appels dans `api/`. Graphiques en SVG pur.

### Le modèle « document de projet »

La plupart des fonctionnalités sont des **documents par projet** : un agrégat JSONB par projet (`project_id` clé primaire) dans une table listée dans `DocumentTable` / `DOCUMENT_TABLES` (`postgres/postgres-document.repository.ts`), qui suffit à créer la table à la migration. Ajouter un document touche généralement :

1. le contrat dans `shared/src/contracts` ;
2. le domaine / les services applicatifs (`project-document.services.ts` fournit les cas d'usage génériques get / save / delete) ;
3. la table dans `DocumentTable`, le dépôt dans `container.ts` (Postgres et en mémoire) et, le cas échéant, un seed ;
4. la route via `projectDocumentRoutes` dans `server.ts` (`segment`, `bodySchema` Zod, `table`) — sans `table` ni `save`, le document est **calculé** et en lecture seule ;
5. côté frontend : client dans `api/project-documents.ts`, hook `useProjectDocuments`, feature, entrée de `AppView` et de `navigation/pmp.ts`.

Mécanismes transverses à respecter :

- **Concurrence optimiste** : la version d'un document circule en `ETag` / `If-Match` (`If-None-Match: *` pour une création) ; `withDocumentScope` (`concurrency/document-scope.ts`, AsyncLocalStorage) porte la version attendue jusqu'au dépôt ; conflit → 409. Les versions passées sont listables et restaurables (`document-version.ts`).
- **Documents anciens** : `document-upgrades.ts` remet à niveau à la lecture les JSONB enregistrés dans un format antérieur (aucune réécriture en base) ; toute évolution de forme d'un contrat existant doit y être prise en compte.
- **Accès** : toute route `/api/v1/projects/:projectId/…` répond 404 si le projet n'existe pas ou si le compte n'est pas membre de son équipe ; le rôle appliqué (`request.projectRole`) est celui du compte dans le projet ; écriture protégée par `requireEditor`. Toutes les écritures alimentent le journal d'audit.
- **Références** : les personnes sont des identifiants du référentiel de ressources (identifiant inconnu → 422 ; suppression d'une ressource référencée → 409, cf. `reference-guard.ts`) ; une approbation par le circuit de validation fige une version de référence du document.

## Conventions d'interface

- Style SaaS épuré : ne pas afficher de bandeaux ni de libellés de méta-référentiel (numéros de processus PMBOK, « template PMI »…) dans l'UI.
- Charte Dakar Mobilité : jetons dans `frontend/src/styles/theme.css` (vert `#00884B` pour les actions, jaune `#FFCF00` en accent, gris `#3F3F3E` pour le texte) ; logo `components/brand/BrandLogo.tsx` à ne pas modifier ; police Gotham sinon Montserrat embarquée (aucun appel à un service externe).
- Formatage : `Intl` en `fr-FR` (dates avec `timeZone: 'UTC'`), montants en millions via `formatMillions` / `formatSignedMillions` (« 2 400 M FCFA »).
- Texte français : apostrophes et accents écrits tels quels ; une chaîne qui contient une apostrophe s'écrit entre guillemets doubles (pas d'échappement `\'` ni de séquence unicode).
