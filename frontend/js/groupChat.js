
let CURRENT_USERNAME = localStorage.getItem('username');
if (!CURRENT_USERNAME) {
  CURRENT_USERNAME = prompt('Choisis un pseudo pour ce chat :', 'Moi') || 'Moi';
  localStorage.setItem('username', CURRENT_USERNAME);
}

const params = new URLSearchParams(window.location.search);
const conversationId = params.get('conversationId') || null;

const messagesContainer = document.querySelector('.chat-messages');
const input = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.chat-input button');

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

function initSocket() {
  if (typeof io === 'undefined') {
    console.warn('Socket.io client non chargé');
    return;
  }

  socket = io('http://localhost:4000', {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    if (conversationId) {
      socket.emit('getHistory', { conversationId });
    }

    addMessage({
      author: 'Système',
      text: 'Connecté au serveur de chat ✅',
      type: 'received',
    });
  });

  socket.on('newMessage', (payload) => {
    const isMe = payload.senderSocketId === socket.id;
    addMessage({
      author: isMe ? CURRENT_USERNAME : 'Autre',
      text: payload.content,
      type: isMe ? 'sent' : 'received',
    });
  });

  socket.on('history', (messages) => {
    if (!Array.isArray(messages)) return;
    messages.forEach((message) => {
      addMessage({
        author: 'Historique',
        text: message.content,
        type: 'received',
        createdAt: message.createdAt,
      });
    });
  });

  socket.on('disconnect', () => {
    addMessage({
      author: 'Système',
      text: 'Déconnecté du serveur de chat.',
      type: 'received',
    });
  });

  socket.on('connect_error', (err) => {
    console.error('Erreur Socket.io :', err);
    addMessage({
      author: 'Système',
      text: 'Impossible de se connecter au serveur de chat.',
      type: 'received',
    });
  });
}

function handleSendMessage() {
  const text = input.value.trim();
  if (!text) return;

  if (socket && socket.connected) {
    socket.emit('sendMessage', { content: text });
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

window.addEventListener('load', initSocket);
