# Funbike — Site + Backend GraphQL + Dashboard

Site vitrine Funbike Madagascar (motos Sherco, Fantic & TVS, pièces et équipements),
avec un **backend GraphQL** qui alimente le site et un **dashboard d'administration**
accessible sur [`/admin`](http://localhost:5173/admin).

## Architecture

```
┌──────────────────────────┐        ┌────────────────────────────────────┐
│  Front (Vite + React)    │        │  Backend (Node + GraphQL Yoga)     │
│  http://localhost:5173   │        │  http://localhost:4000             │
│                          │        │                                    │
│  /        → site public  │ /graphql│  API GraphQL (lecture publique     │
│  /admin   → dashboard    │ ◄─────►│  + mutations admin par jeton JWT)  │
│                          │ /uploads│  Upload d'images + statiques       │
└──────────────────────────┘        │  MySQL (phpMyAdmin) — repli SQLite │
      proxy Vite (vite.config.ts)   └────────────────────────────────────┘
```

- **Toutes les données du site** (motos, produits, marques, catégories, revendeurs,
  textes de l'accueil, paramètres) sont lues via `POST /graphql` — plus aucune
  donnée statique dans le frontend.
- **Base de données MySQL** (voir `.env` → `DATABASE_URL`), avec des tables
  réelles consultables/éditables dans **phpMyAdmin** (schéma :
  `server/sql/schema.mysql.sql`). Si MySQL est injoignable, le backend bascule
  automatiquement sur un stockage **SQLite local** (journalisé) pour le dev.
- `src/data.ts` et `src/constants/content.ts` ne servent qu'à **générer le seed**
  du backend (schéma + données initiales) : `npm run build-seed`.
- Le dashboard `/admin` partage le même serveur Vite que le site.

## Configuration (`.env`)

Copier `.env.example` en `.env` à la racine du projet :

| Variable                 | Rôle                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`           | Connexion MySQL `mysql://user:pass@hôte:3306/base` (phpMyAdmin) |
| `API_PORT`               | Port de l'API GraphQL (défaut `4000`)                       |
| `API_PROXY_TARGET`       | Cible du proxy Vite (`http://127.0.0.1:4000`)               |
| `JWT_SECRET`             | Signature des jetons du dashboard                           |
| `JWT_EXPIRES_IN`         | Durée des jetons (défaut `8h`)                              |
| `INITIAL_ADMIN_EMAIL`    | Compte admin créé au premier démarrage (login `/admin`)     |
| `INITIAL_ADMIN_PASSWORD` | Mot de passe de ce compte (modifiable dans `/admin`)        |

## Démarrage

```bash
# 0. MySQL : créer la base (ou importer server/sql/schema.mysql.sql dans phpMyAdmin)
#    CREATE DATABASE funbike CHARACTER SET utf8mb4;

# 1. Backend (port 4000)
cd server && npm install && npm start

# 2. Front (port 5173) — dans un autre terminal
npm install && npm run dev
```

- Site : http://localhost:5173/
- Dashboard : http://localhost:5173/admin
  (compte initial : `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` du `.env`)
- GraphiQL : http://localhost:4000/graphql
- phpMyAdmin : ouvrir la base `funbike` pour voir les tables
  (`bikes`, `parts`, `hero_slides`, `home_content`, `settings`, `admin_users`…)

## Dashboard (`/admin`)

| Section        | Contenu                                                            |
| -------------- | ------------------------------------------------------------------ |
| Tableau de bord| Statistiques et produits mis en avant                               |
| **Accueil**    | Textes de la grande image, **produits présentés sur le site** (carrousel), nouveautés, sections |
| Motos          | CRUD du catalogue motos (fiches, specs, galerie)                    |
| Produits       | CRUD des pièces & équipements                                       |
| Revendeurs     | CRUD du réseau (carte, coordonnées)                                 |
| Paramètres     | Identité, logo, coordonnées (footer & contact)                      |

Le bloc **« Produits mis en avant »** de la section Accueil permet de choisir
librement les produits qui présentent le site (grande image + bouton + grille
« Motos ») : sélectionnez un produit du catalogue, les champs (nom court, image,
etc.) se pré-remplissent et restent modifiables ; l'ordre se règle avec ↑ / ↓.

## API GraphQL (extraits)

```graphql
query {
  home { hero { titreLigne1 } heroSlides { short brand image enabled } }
  bikes { id name brand family price image }
  parts { id name kind price image }
  dealers { id name city phone }
  siteSettings { email phoneDisplay hours }
}

mutation { login(email: "admin@funbike.local", password: "…") { token email } }
mutation { changeAdminPassword(currentPassword: "…", newPassword: "…") }
mutation { updateHome(input: HomeInput!) { … } }      # accueil complet
mutation { upsertBike(input: BikeInput!) { … } }
mutation { upsertPart(input: PartInput!) { … } }
```

Les mutations exigent l'en-tête `Authorization: Bearer <token>` (JWT, obtenu via `login`).
Upload d'images : `POST /api/upload` (mêmes images servies sous `/uploads/…`).

## Données initiales

```bash
npm run build-seed   # régénère server/data/seed.json depuis src/data.ts + content.ts
npm run seed         # ré-initialise la base (MySQL ou SQLite) depuis seed.json
```
