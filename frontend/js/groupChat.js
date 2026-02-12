
let CURRENT_USERNAME = localStorage.getItem('username');
let CURRENT_USER_ID = null;

if (!CURRENT_USERNAME) {
  CURRENT_USERNAME = prompt('Choisis un pseudo pour ce chat :', 'Moi') || 'Moi';
  localStorage.setItem('username', CURRENT_USERNAME);
}

const params = new URLSearchParams(window.location.search);
const conversationId = params.get('conversationId') || null;
const chatTitleParam = params.get('title');
const chatType = params.get('type') || 'group';

const messagesContainer = document.querySelector('.chat-messages');
const input = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');
const usernameLabel = document.querySelector('#current-username');
const statusBadge = document.querySelector('#connection-status');
const chatTitleElement = document.querySelector('#chat-title');
const chatSubtitleElement = document.querySelector('#chat-subtitle');

if (usernameLabel) {
  usernameLabel.textContent = CURRENT_USERNAME;
}

if (chatTitleElement && chatTitleParam) {
  chatTitleElement.textContent = chatTitleParam;
}

if (chatSubtitleElement) {
  if (chatType === 'dm' && chatTitleParam) {
    chatSubtitleElement.textContent = `Conversation privée avec ${chatTitleParam}`;
  } else {
    chatSubtitleElement.textContent = 'Conversation de groupe';
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addMessage({ author, text, type = 'sent', createdAt = new Date() }) {
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);

  if (type === 'received') {
    const authorP = document.createElement('p');
    authorP.classList.add('author');
    authorP.textContent = author || 'Inconnu';
    messageDiv.appendChild(authorP);
  }

  const textP = document.createElement('p');
  textP.textContent = text;
  messageDiv.appendChild(textP);

  const timeSpan = document.createElement('span');
  timeSpan.classList.add('time');
  timeSpan.textContent = formatTime(new Date(createdAt));
  messageDiv.appendChild(timeSpan);

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

let socket = null;

async function fetchCurrentUser() {
  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      credentials: 'include',
    });
    if (!res.ok) return;
    const user = await res.json();
    CURRENT_USER_ID = user.id || null;
    if (user.pseudo && !localStorage.getItem('username')) {
      CURRENT_USERNAME = user.pseudo;
      localStorage.setItem('username', CURRENT_USERNAME);
      if (usernameLabel) usernameLabel.textContent = CURRENT_USERNAME;
    }
  } catch (err) {
    console.error('Impossible de récupérer le profil utilisateur:', err);
  }
}

function initSocket() {
  if (typeof io === 'undefined') {
    console.warn('Socket.io client non chargé');
    return;
  }

  const options = { transports: ['websocket'] };
  if (CURRENT_USER_ID) {
    options.query = { userId: CURRENT_USER_ID };
  }

  socket = io('http://localhost:4000', options);

  socket.on('connect', () => {
    if (statusBadge) {
      statusBadge.textContent = 'En ligne';
      statusBadge.classList.add('online');
      statusBadge.classList.remove('offline');
    }

    if (conversationId) {
      socket.emit('joinConversation', { conversationId });
      socket.emit('getHistory', { conversationId });
    }
  });

  socket.on('newMessage', (payload) => {
    const isMe =
      (CURRENT_USER_ID && payload.senderId === CURRENT_USER_ID) ||
      payload.senderSocketId === socket.id;
    addMessage({
      author: isMe ? CURRENT_USERNAME : 'Autre',
      text: payload.content,
      type: isMe ? 'sent' : 'received',
    });
  });

  socket.on('history', (messages) => {
    if (!Array.isArray(messages)) return;
    messages.forEach((message) => {
      const isMe = CURRENT_USER_ID && message.senderId === CURRENT_USER_ID;
      addMessage({
        author: isMe ? CURRENT_USERNAME : 'Autre',
        text: message.content,
        type: isMe ? 'sent' : 'received',
        createdAt: message.createdAt,
      });
    });
  });

  socket.on('disconnect', () => {
    if (statusBadge) {
      statusBadge.textContent = 'Hors ligne';
      statusBadge.classList.add('offline');
      statusBadge.classList.remove('online');
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Erreur Socket.io :', err);
    if (statusBadge) {
      statusBadge.textContent = 'Hors ligne';
      statusBadge.classList.add('offline');
      statusBadge.classList.remove('online');
    }
  });
}

function handleSendMessage() {
  const text = input.value.trim();
  if (!text) return;

  if (socket && socket.connected) {
    socket.emit('sendMessage', {
      conversationId,
      senderId: CURRENT_USER_ID,
      content: text,
    });
  } else {
    addMessage({ author: CURRENT_USERNAME, text, type: 'sent' });
  }

  input.value = '';
  input.focus();
}

if (sendButton && input) {
  sendButton.addEventListener('click', handleSendMessage);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  });
}

window.addEventListener('load', async () => {
  await fetchCurrentUser();
  initSocket();
});
