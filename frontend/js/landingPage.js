const groupCards = document.querySelectorAll('[data-conversation-id]');
const groupsContainer = document.querySelector('.cards');
const addGroupCard = document.querySelector('.card-box.add');
const contactItems = document.querySelectorAll('.contact-list li');

function openGroupChat(conversationId, title, type) {
  const params = new URLSearchParams();
  params.set('conversationId', conversationId);
  if (title) params.set('title', title);
  if (type) params.set('type', type);
  window.location.href = `groupChat.html?${params.toString()}`;
}

groupCards.forEach((card) => {
  card.addEventListener('click', () => {
    const id = card.getAttribute('data-conversation-id');
    const titleElement = card.querySelector('h4');
    const title = titleElement ? titleElement.textContent.trim() : '';
    if (!id) return;
    openGroupChat(id, title, 'group');
  });
});

if (addGroupCard && groupsContainer) {
  addGroupCard.addEventListener('click', () => {
    const name = window.prompt('Nom du nouveau groupe :');
    if (!name) return;

    const id = `group-${Date.now()}`;
    const card = document.createElement('div');
    card.classList.add('card-box');
    card.setAttribute('data-conversation-id', id);
    card.innerHTML = `<h4>${name}</h4><p>1 membre</p>`;

    card.addEventListener('click', () => openGroupChat(id, name, 'group'));

    groupsContainer.insertBefore(card, addGroupCard);
  });
}

contactItems.forEach((item) => {
  item.addEventListener('click', () => {
    const name = item.textContent.replace(/\s+/g, ' ').trim();
    const displayName = name.replace(/^[^A-Za-zÀ-ÿ]*/, '');
    const id = `dm-${displayName.toLowerCase()}`;
    openGroupChat(id, displayName, 'dm');
  });
});

