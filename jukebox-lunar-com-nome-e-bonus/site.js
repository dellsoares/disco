'use strict';
(() => {
  const PLAYER_KEY = 'jukebox-lunar:nome:v1';
  const openButton = document.getElementById('openGame');
  const closeButton = document.getElementById('closeGame');
  const overlay = document.getElementById('gameOverlay');
  const nameOverlay = document.getElementById('nameOverlay');
  const nameForm = document.getElementById('nameForm');
  const nameInput = document.getElementById('playerName');
  const frame = document.getElementById('gameFrame');
  const backdrop = document.getElementById('overlayBackdrop');
  const greeting = document.getElementById('greeting');
  let previouslyFocused = null;

  function normalizeName(name) {
    return String(name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR').slice(0, 32);
  }
  function nameIsSet() {
    try { return Boolean(normalizeName(sessionStorage.getItem(PLAYER_KEY))); }
    catch (_error) { return false; }
  }
  function showName() {
    nameOverlay.hidden = false;
    document.body.classList.add('modal-open');
    nameInput.focus();
  }
  function open() {
    if (!nameIsSet()) { showName(); return; }
    previouslyFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    frame.src = frame.dataset.src;
    closeButton.focus();
  }
  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
    frame.src = 'about:blank';
    (previouslyFocused || openButton).focus();
  }
  nameInput.addEventListener('input', () => { nameInput.value = nameInput.value.toLocaleLowerCase('pt-BR').slice(0,32); });
  nameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = normalizeName(nameInput.value);
    if (!name) { nameInput.focus(); return; }
    try { sessionStorage.setItem(PLAYER_KEY, name); }
    catch (_error) {
      nameForm.setAttribute('aria-invalid','true');
      nameInput.setCustomValidity('é necessário permitir o armazenamento do navegador para jogar.');
      nameInput.reportValidity();
      return;
    }
    nameOverlay.hidden = true;
    document.body.classList.remove('modal-open');
    if (greeting) greeting.textContent = `olá, ${name}.`; // nunca revela se o nome é especial.
    openButton.focus();
  });
  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (!nameOverlay.hidden) {
      if (event.key !== 'Tab') return; // nome é obrigatório; esc não dispensa a identificação.
      const els=[nameInput, nameForm.querySelector('button')];
      if (event.shiftKey && document.activeElement === els[0]) {event.preventDefault();els[1].focus();}
      else if (!event.shiftKey && document.activeElement === els[1]) {event.preventDefault();els[0].focus();}
      return;
    }
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === closeButton) {
      event.preventDefault(); frame.focus();
    } else if (!event.shiftKey && document.activeElement === frame) {
      event.preventDefault(); closeButton.focus();
    }
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data && event.data.type === 'JUKEBOX_LUNAR_CLOSE' && event.data.version === 1) close();
  });
  // Pergunta o nome toda vez que a página de entrada for aberta.
  // Não apaga a restrição pública salva em localStorage.
  try { sessionStorage.removeItem(PLAYER_KEY); } catch (_error) { /* verificação no envio */ }
  showName();
})();
