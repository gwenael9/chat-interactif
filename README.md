## Chat interactif

Application de chat interactive composée d'un backend NestJS et d'une base de données PostgreSQL.

### Structure du projet

- **backend** : API NestJS (authentification, utilisateurs)
- **frontend** : Interface web HTML/CSS/JS avec Socket.IO
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

Accéder à l'application : `http://localhost:5500/html/login.html`

### Authentification & JWT

- **Inscription / connexion** : gérées par le module `auth` du backend.
- Le backend génère un **JWT signé avec `JWT_SECRET`**.
- Tu peux utiliser le script `generate-jwt.sh` (après lui avoir donné les droits d’exécution) pour générer un token de test :

```bash
chmod +x generate-jwt.sh
./generate-jwt.sh
```

### Architecture du chat temps réel

L'application utilise une architecture hybride HTTP + WebSocket pour optimiser la sécurité et les performances :

#### Flux d'envoi de message
```
Frontend → HTTP POST /chat → Backend Controller (AuthGuard)
                                    ↓
                              Service sauvegarde en BDD
                                    ↓
                              EventEmitter ('chat.message.created')
                                    ↓
                              ChatGateway écoute l'event
                                    ↓
                              WebSocket broadcast → Tous les clients de la conversation
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

**Important** : L'authentification WebSocket se fait via le cookie `authToken` automatiquement transmis si `withCredentials: true` est configuré.

#### Connexion Socket.IO (Frontend)

```javascript
const socket = io('http://localhost:4000', {
  withCredentials: true, // Envoie automatiquement le cookie authToken
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('Connecté au serveur WebSocket');
});

socket.on('disconnect', () => {
  console.log('Déconnecté du serveur WebSocket');
});
```

#### Gateway de chat (`ChatGateway`)

Le `ChatGateway` gère les notifications temps réel pour les messages de chat. **Les messages ne sont PAS envoyés via WebSocket**, ils sont envoyés via HTTP POST (voir `/chat` ci-dessus).

##### Rejoindre une conversation

- **Événement** : `joinConversation`
  - **Usage** :
```javascript
    socket.emit('joinConversation', { conversationId: '' });
```
  - **Effet** : Le client rejoint la room `conversation:<conversationId>` et recevra tous les nouveaux messages de cette conversation.
  - **Sécurité** : Le backend vérifie que l'utilisateur est membre de la conversation avant de l'autoriser à rejoindre.

##### Quitter une conversation

- **Événement** : `leaveConversation`
  - **Usage** :
```javascript
    socket.emit('leaveConversation', { conversationId: '' });
```
  - **Effet** : Le client quitte la room de la conversation et ne recevra plus de notifications.

##### Recevoir les nouveaux messages

- **Événement serveur** : `newMessage`
  - **Usage** :
```javascript
    socket.on('newMessage', (message) => {
      console.log('Nouveau message reçu:', message);
      // message contient: id, conversationId, senderId, content, createdAt
      afficherMessage(message);
    });
```
  - **Déclenchement** : Émis automatiquement par le serveur quand un message est créé via `POST /chat`. Tous les clients dans la room `conversation:<conversationId>` reçoivent la notification.
  - **Payload** : `MessageEntity` complet

##### Récupérer l'historique (optionnel)

- **Événement** : `getHistory`
  - **Usage** :
```javascript
    socket.emit('getHistory', { conversationId: '' });
    
    socket.on('history', (messages) => {
      console.log('Historique reçu:', messages);
      messages.forEach(msg => afficherMessage(msg));
    });
```
  - **Note** : Il est généralement préférable d'utiliser l'endpoint HTTP `GET /chat/conversations/:id/messages` pour récupérer l'historique initial.

##### Flux complet d'envoi/réception de message

```javascript
// 1. Envoyer un message via HTTP POST
async function envoyerMessage(conversationId, content) {
  const response = await fetch('http://localhost:4000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Envoie le cookie authToken
    body: JSON.stringify({ conversationId, content })
  });
  
  if (response.ok) {
    console.log('Message envoyé avec succès');
    // Pas besoin d'afficher le message ici, on le recevra via WebSocket
  }
}

// 2. Recevoir la notification via WebSocket
socket.on('newMessage', (message) => {
  if (message.conversationId === currentConversationId) {
    afficherMessage(message);
  }
});
```

#### Gateway d'amis (`FriendGateway`)

- **Connexion automatique** : Le serveur associe automatiquement le socket à l'utilisateur via le cookie JWT.

- **Événement serveur** : `friendRequest`
  - **Usage** :
```javascript
    socket.on('friendRequest', (payload) => {
      console.log(`${payload.fromPseudo} vous a ajouté en ami !`);
      // Afficher une notification
      afficherNotification(payload);
    });
```
  - **Payload** :
```javascript
    {
      fromUserId: string,   // ID de l'utilisateur qui a envoyé la demande
      fromPseudo: string    // Pseudo de l'utilisateur
    }
```
  - **Déclenchement** : Émis automatiquement quand quelqu'un vous ajoute en ami via `POST /user/friends/:friendId`

