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
git clone https://github.com/gwenael9/chat-interactif
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

### API pour le frontend

Toutes les routes ci‑dessous sont préfixées par l’URL du backend, par défaut :

- **Base URL** : `http://localhost:4000`

#### Authentification (`/auth`)

- **POST** `/auth/register`
  - **Body JSON** : `{ "email": string, "password": string, "pseudo": string }`
  - **Réponse** : `{ "message": "Votre compte a bien été créé <pseudo>" }`

- **POST** `/auth/login`
  - **Body JSON** : `{ "email": string, "password": string }`
  - **Effet** : pose un cookie `authToken` (HttpOnly) contenant le JWT.
  - **Réponse** : `{ "message": "Bienvenue <pseudo> !" }`

- **GET** `/auth/me`
  - **Headers** : cookie `authToken` (JWT).
  - **Réponse** : l’utilisateur connecté, au format `UserResponseDto` (id, email, pseudo, etc.).

#### Utilisateurs & amis (`/user`)

- **GET** `/user?search=<query>`
  - **Description** : liste les utilisateurs, éventuellement filtrés par `search` (pseudo / email…).
  - **Réponse** : tableau de `UserResponseDto`.

- **GET** `/user/friends/all`
  - **Headers** : cookie `authToken`.
  - **Description** : récupère toute la liste d’amis de l’utilisateur connecté.
  - **Réponse** : tableau de `UserResponseDto`.

- **POST** `/user/friends/:friendId`
  - **Headers** : cookie `authToken`.
  - **Description** : ajoute un utilisateur à la liste d’amis de l’utilisateur connecté.
  - **Réponse** : `{ "message": "L'utilisateur <pseudo> a bien été ajouté." }`

- **DELETE** `/user/friends/:friendId`
  - **Headers** : cookie `authToken`.
  - **Description** : supprime un utilisateur de la liste d’amis de l’utilisateur connecté.
  - **Réponse** : `{ "message": "L'utilisateur <pseudo> a bien été supprimé de votre liste d'amis." }`

#### Chat REST (`/chat`)

- **POST** `/chat/conversations`
  - **Headers** : cookie `authToken`.
  - **Body JSON** : `{ "participantIds": string[], "name": string }` (ids des autres participants, le backend ajoute automatiquement l’utilisateur connecté).
  - **Réponse** : `ConversationEntity` avec :
    - `id: string`
    - `isGroup: boolean`
    - `createdAt: string`
    - `participants: { conversationId, userId, lastReadMessageId? }[]`
    - `name: string`

- **GET** `/chat/conversations`
  - **Description** : récupère les informations des conversations.
  - **Réponse** : `ConversationEntity` avec :
    - `id: string`
    - `isGroup: boolean`
    - `createdAt: string`
    - `participants: { conversationId, userId, lastReadMessageId? }[]`
    - `name: string`.

- **GET** `/chat/conversations/:id`
  - **Description** : récupère les informations d'une seul conversation.
  - **Réponse** : `ConversationEntity` avec :
    - `id: string`
    - `isGroup: boolean`
    - `createdAt: string`
    - `participants: { conversationId, userId, lastReadMessageId? }[]`
    - `name: string`.

- **GET** `/chat/conversations/:id/messages`
  - **Description** : récupère l’historique des messages d’une conversation (ordonnés du plus ancien au plus récent).
  - **Réponse** : `MessageEntity[]` (structure à voir dans le backend : `id`, `conversationId`, `senderId`, `content`, `createdAt`, …).

- **POST** `/chat/read`
  - **Headers** : cookie `authToken`.
  - **Body JSON** : `{ "conversationId": string, "messageId": string }`
  - **Description** : marque un message comme lu pour l’utilisateur courant (met à jour `lastReadMessageId` dans `conversation_user`).

> **Note** : l’envoi de messages se fait principalement via WebSocket (voir ci‑dessous), pas par endpoint REST.

### WebSocket / Socket.IO pour le frontend

Le backend expose deux gateways Socket.IO : `ChatGateway` et `FriendGateway`.  
L’URL de base Socket.IO est la même que l’URL HTTP : `http://localhost:4000`.

#### Gateway de chat (`ChatGateway`)

- **Connexion Socket.IO**
  - Exemple côté front :
    ```ts
    const socket = io('http://localhost:4000', {
      query: { userId: '<ID_UTILISATEUR>' },
    });
    ```
  - Le serveur utilise `query.userId` pour rattacher le socket à la room personnelle `user:<userId>`.

- **Événement** `joinConversation`
  - **Type** : `socket.emit('joinConversation', { conversationId })`
  - **Effet** : le client rejoint la room `conversation:<conversationId>` pour recevoir les messages en temps réel.

- **Événement** `leaveConversation`
  - **Type** : `socket.emit('leaveConversation', { conversationId })`
  - **Effet** : le client quitte la room de la conversation.

- **Événement** `sendMessage`
  - **Type** :
    ```ts
    socket.emit('sendMessage', {
      conversationId: '<uuid>',
      senderId: '<userId>',
      content: 'Texte du message',
    });
    ```
  - **Effet** : le backend enregistre le message en base, puis émet un événement `newMessage` sur la room de la conversation.

- **Événement serveur** `newMessage`
  - **Type** : `socket.on('newMessage', (message) => { ... })`
  - **Payload** : un `MessageEntity` (id, conversationId, senderId, content, createdAt, …).

- **Événement** `getHistory`
  - **Type** :
    ```ts
    socket.emit('getHistory', { conversationId: '<uuid>' });
    ```
  - **Réponse serveur** : événement `history`
    - `socket.on('history', (messages) => { ... })`
    - `messages` : tableau de `MessageEntity` (même format que le `GET /chat/conversations/:id/messages`).

#### Gateway d’amis (`FriendGateway`)

- **Événement** `registerUser`
  - **Type** :
    ```ts
    socket.emit('registerUser', { userId: '<ID_UTILISATEUR>' });
    ```
  - **Effet** : associe le socket courant à l’utilisateur dans la gateway, pour permettre les notifications.

- **Événement serveur** `friendRequest`
  - **Type** : `socket.on('friendRequest', (payload) => { ... })`
  - **Payload** :
    ```ts
    {
      fromUserId: string;   // id de l’utilisateur qui a envoyé la demande
      fromPseudo: string;   // pseudo de l’utilisateur qui a envoyé la demande
    }
    ```
  - **Usage prévu** : affichage de notifications en temps réel lorsqu’un ami est ajouté / envoie une demande (émis via `notifyFriendRequest` côté backend).

