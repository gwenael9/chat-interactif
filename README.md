## Chat interactif

Application de chat interactive composée d'un backend NestJS et d'une base de données PostgreSQL.

### Structure du projet

- **backend** : API NestJS (authentification, utilisateurs)
- **docker-compose.yml** : services PostgreSQL et pgAdmin

### Prérequis

- **Node.js** (version LTS recommandée)
- **npm**
- **Docker** et **Docker Compose**

### Installation

- **Cloner le dépôt** :

```bash
git clone <url-du-repo>
cd chat-interactif
```

- **Installer les dépendances du backend** :

```bash
cd backend
npm install
```

### Configuration

- **Fichier `.env` à la racine du projet** (utilisé par Docker et le backend via `config.ts`) :

```bash
cp .env.example .env
```

Adapte ces valeurs selon ton environnement (mot de passe, nom de base, etc.).

Pour générer un JWT_SECRET, lancer le script `./generate-hwt.sh` :

```bash
./generate-jwt.sh
```

### Lancer l'environnement de développement

- **Démarrer PostgreSQL** :

```bash
docker compose up --build
```

- **Démarrer le backend NestJS** :

```bash
cd backend
npm run start:dev
```

Le backend écoute par défaut sur le port **4000**.

### Authentification & JWT

- **Inscription / connexion** : gérées par le module `auth` du backend.
- Le backend génère un **JWT signé avec `JWT_SECRET`**.
- Tu peux utiliser le script `generate-jwt.sh` (après lui avoir donné les droits d’exécution) pour générer un token de test :

```bash
chmod +x generate-jwt.sh
./generate-jwt.sh
```

### Commandes utiles (backend)

- **Démarrer en développement** :

```bash
cd backend
npm run start:dev
```
