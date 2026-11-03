# Funbike — Site + Backend GraphQL + Dashboard

Site vitrine Funbike Madagascar (motos Sherco, Fantic & TVS, pièces et équipements),
avec un **backend GraphQL** qui alimente le site et un **dashboard d'administration**
accessible sur [`/admin`](http://localhost:5173/admin).

## Architecture

```
┌──────────────────────────┐        ┌───────────────────────────────┐
│  Front (Vite + React)    │        │  Backend (Node + GraphQL Yoga)│
│  http://localhost:5173   │        │  http://localhost:4000        │
│                          │        │                               │
│  /        → site public  │ /graphql│  API GraphQL (lecture publique│
│  /admin   → dashboard    │ ◄─────►│  + mutations admin par jeton) │
│                          │ /uploads│  Upload d'images + statiques  │
└──────────────────────────┘        │  SQLite (node:sqlite)         │
      proxy Vite (vite.config.ts)   └───────────────────────────────┘
```

- **Toutes les données du site** (motos, produits, marques, catégories, revendeurs,
  textes de l'accueil, paramètres) sont lues via `POST /graphql` — plus aucune
  donnée statique dans le frontend.
- `src/data.ts` et `src/constants/content.ts` ne servent qu'à **générer le seed**
  du backend (schéma + données initiales) : `npm run build-seed`.
- Le dashboard `/admin` partage le même serveur Vite que le site.

## Démarrage

```bash
# 1. Backend (port 4000)
cd server && npm install && npm start

# 2. Front (port 5173) — dans un autre terminal
npm install && npm run dev
```

- Site : http://localhost:5173/
- Dashboard : http://localhost:5173/admin
  (identifiants par défaut : `admin` / `funbike2026` — variables d'environnement
  `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET` côté serveur)
- GraphiQL : http://localhost:4000/graphql

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

mutation { login(username: "admin", password: "…") { token } }
mutation { updateHome(input: HomeInput!) { … } }      # accueil complet
mutation { upsertBike(input: BikeInput!) { … } }
mutation { upsertPart(input: PartInput!) { … } }
```

Les mutations exigent l'en-tête `Authorization: Bearer <token>` (obtenu via `login`).
Upload d'images : `POST /api/upload` (mêmes images servies sous `/uploads/…`).

## Données initiales

```bash
npm run build-seed   # régénère server/data/seed.json depuis src/data.ts + content.ts
npm run seed         # ré-initialise la base SQLite depuis seed.json
```
