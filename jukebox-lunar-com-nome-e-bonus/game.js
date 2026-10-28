'use strict';
/*
 * jukebox lunar | textos e mp3s em catalogo.js.
 * Não use conteúdo HTML nos textos: eles entram com textContent, sem executar código.
 * O armazenamento local funciona como protótipo; uma restrição impossível de burlar
 * exige validação em um servidor (ver LEIA-ME.md).
 */
(() => {
  const {CANCOES, SPOTIFY_ALBUM_URL, BONUS_AUDIO, BONUS_AUDIO_REMOTO, BONUS_MAX_SECONDS, SURPRISE_TEXTS} = window.JUKEBOX_CATALOGO;


  const PUBLIC_STORAGE_KEY = 'jukebox-lunar:v1'; // mantém os bloqueios da versão anterior
  const ADMIN_STORAGE_KEY = 'jukebox-lunar:modo-livre:v1'; // histórico separado, sem esgotar o jogo público
  const NAME_KEY = 'jukebox-lunar:nome:v1';
  let playerName = '';
  let adminMode = false;
  let STORAGE_KEY = PUBLIC_STORAGE_KEY;
  const CATALOG_VERSION = 2; // atualiza o conjunto sorteável ao incluir novas músicas
  const COOLDOWN_MS = 15 * 60 * 1000;
  const PENALTY_MS = 7 * 24 * 60 * 60 * 1000;
  const PHASES = Object.freeze({ n: 'nova', f: 'cheia', c: 'crescente', m: 'minguante' });
  const VALID_CODES = new Set(CANCOES.map(item => item.codigo));
  const byId = id => document.getElementById(id);
  const gameContent = byId('gameContent');
  const closedState = byId('closedState');
  const notice = byId('notice');
  const noticeText = byId('noticeText');
  const resultCard = byId('resultCard');
  const spinButton = byId('spinButton');
  const lever = byId('pullLever');
  const player = byId('songPlayer');
  const surpriseOverlay = byId('surpriseOverlay');
  const surpriseInput = byId('surpriseInput');
  const surpriseForm = byId('surpriseForm');
  const surpriseFeedback = byId('surpriseFeedback');
  let surpriseFocusBeforeOpen = null;
  const strips = [byId('reel0'), byId('reel1'), byId('reel2')];
  let busy = false;
  let draggingFromY = null;
  let suppressClickUntil = 0;
  let storeAvailable = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const directNameOverlay = byId('directNameOverlay');
  const directNameInput = byId('directPlayerName');
  const directNameForm = byId('directNameForm');
  function normalizeName(value) {
    return String(value || '').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR').slice(0,32);
  }
  function configurePlayer(value) {
    playerName = normalizeName(value);
    adminMode = playerName === 'alanis';
    STORAGE_KEY = adminMode ? ADMIN_STORAGE_KEY : PUBLIC_STORAGE_KEY;
  }
  function requestNameIfMissing() {
    try { configurePlayer(sessionStorage.getItem(NAME_KEY)); } catch (_error) { configurePlayer(''); }
    if (playerName) return;
    directNameOverlay.hidden = false;
    spinButton.disabled = true;
    lever.disabled = true;
    directNameInput.focus();
  }

  function defaultState() {
    return { version: 1, catalogVersion: CATALOG_VERSION, lastSpinAt: 0, cooldownUntil: 0, penaltyUntil: 0,
      blockedAttempts: 0, lastObservedAt: 0, lastResult: '', surpriseAnswer: '', bag: [] };
  }
  function cleanTimestamp(value) {
    return Number.isSafeInteger(value) && value >= 0 && value < 4102444800000 ? value : 0;
  }
  function readState() {
    const empty = defaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.version !== 1 || typeof saved !== 'object') return empty;
      const lastResult = VALID_CODES.has(saved.lastResult) ? saved.lastResult : '';
      const validBag = Array.isArray(saved.bag) && saved.bag.length <= CANCOES.length &&
        saved.bag.every(code => VALID_CODES.has(code)) && new Set(saved.bag).size === saved.bag.length;
      // Atualiza o sorteio antigo, mas PRESERVA os 15 minutos e os 7 dias já aplicados.
      const bag = saved.catalogVersion === CATALOG_VERSION
        ? (validBag ? [...saved.bag] : [])
        : shuffledCodes().filter(code => code !== lastResult);
      return {
        version: 1,
        catalogVersion: CATALOG_VERSION,
        lastSpinAt: cleanTimestamp(saved.lastSpinAt),
        cooldownUntil: cleanTimestamp(saved.cooldownUntil),
        penaltyUntil: cleanTimestamp(saved.penaltyUntil),
        lastObservedAt: cleanTimestamp(saved.lastObservedAt),
        blockedAttempts: Number.isInteger(saved.blockedAttempts) ? Math.min(3,Math.max(0,saved.blockedAttempts)) : 0,
        lastResult,
        surpriseAnswer: lastResult === 'ccc' && ['correct', 'wrong'].includes(saved.surpriseAnswer) ? saved.surpriseAnswer : '',
        bag
      };
    } catch (_error) { return empty; }
  }
  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function trustedNow(state) {
    // Não recua o relógio registrado: evita liberar apenas voltando a hora do aparelho.
    const now = Math.max(Date.now(), state.lastObservedAt);
    state.lastObservedAt = now;
    return now;
  }
  function randomInt(max) {
    if (max <= 1) return 0;
    if (window.crypto && window.crypto.getRandomValues) {
      const box = new Uint32Array(1);
      const limit = Math.floor(4294967296 / max) * max;
      do { window.crypto.getRandomValues(box); } while (box[0] >= limit);
      return box[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffledCodes() {
    const codes = CANCOES.map(song => song.codigo);
    for (let i = codes.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
    return codes;
  }
  function drawCode(state) {
    if (!state.bag.length) state.bag = shuffledCodes();
    return state.bag.pop();
  }
  function showNotice(message) {
    noticeText.textContent = message;
    notice.hidden = false;
  }
  function hideNotice() { notice.hidden = true; noticeText.textContent = ''; }
  function createMoon(phase) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'moon-icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#moon-' + phase);
    svg.append(use);
    return svg;
  }
  function createTile(phase) {
    const tile = document.createElement('div');
    tile.className = 'reel-tile';
    tile.append(createMoon(phase));
    return tile;
  }
  function setReels(code) {
    [...code].forEach((phase, idx) => {
      strips[idx].replaceChildren(createTile(phase));
      strips[idx].style.transform = '';
      strips[idx].getAnimations().forEach(anim => anim.cancel());
      strips[idx].parentElement.setAttribute('aria-label', `rolo ${idx + 1}: lua ${PHASES[phase]}`);
    });
  }
  function formatRemaining(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateStatus() {
    if (!storeAvailable || busy || !playerName) return;
    const st = readState();
    const now = Math.max(Date.now(), st.lastObservedAt);
    const status = byId('eligibility');
    if (adminMode) {
      status.textContent = 'modo livre · a alavanca está pronta.';
    } else if (st.penaltyUntil > now) {
      status.textContent = `bloqueio de 7 dias · restam ${formatRemaining(st.penaltyUntil - now)}`;
    } else if (st.cooldownUntil > now) {
      status.textContent = `próxima rodada em ${formatRemaining(st.cooldownUntil - now)}`;
    } else {
      status.textContent = 'a alavanca está pronta. boa sorte!';
    }
  }
  function safeAudioUrl(input) {
    if (typeof input !== 'string' || !input.trim()) return '';
    try {
      const parsed = new URL(input, window.location.href);
      if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(parsed.hostname))) return '';
      return parsed.href;
    } catch (_error) { return ''; }
  }
  // cria o link somente para as palavras “álbum luas”, sem usar innerHTML.
  function renderLinkedText(element, text) {
    const parts = String(text).split(/(álbum luas)/g);
    const nodes = parts.map(part => {
      if (part === 'álbum luas') {
        const link = document.createElement('a');
        link.href = SPOTIFY_ALBUM_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = part;
        link.setAttribute('aria-label', 'álbum luas no spotify (abre em nova aba)');
        return link;
      }
      return document.createTextNode(part);
    });
    element.replaceChildren(...nodes);
  }
  let alternateAudio = '';
  let usedAlternate = false;
  function setAudio(url, fallbackUrl = '') {
    const audioUrl = safeAudioUrl(url);
    alternateAudio = safeAudioUrl(fallbackUrl);
    usedAlternate = false;
    player.pause();
    player.removeAttribute('src');
    player.load();
    if (audioUrl) {
      player.src = audioUrl;
      player.hidden = false;
      byId('audioPending').hidden = true;
    } else {
      player.hidden = true;
      byId('audioPending').hidden = false;
      byId('audioPending').textContent = 'o áudio será adicionado em breve.';
    }
  }
  player.addEventListener('error', () => {
    if (!usedAlternate && alternateAudio) {
      usedAlternate = true;
      player.src = alternateAudio;
      player.load();
      byId('audioPending').hidden = true;
      return;
    }
    if (player.getAttribute('src')) {
      byId('audioPending').hidden = false;
      byId('audioPending').textContent = 'não foi possível carregar a música. confira a pasta songs e o acesso ao github.';
    }
  });
  function showResult(code) {
    const song = CANCOES.find(item => item.codigo === code);
    if (!song) return;
    byId('combinationText').textContent = [...code].map(char => PHASES[char]).join(' · ');
    byId('songTitle').textContent = song.titulo;
    const artistNode = byId('songArtist');
    artistNode.textContent = song.artista || '';
    artistNode.hidden = !song.artista;
    if (code === 'ccc') {
      const answer = readState().surpriseAnswer;
      byId('surpriseOpen').hidden = Boolean(answer);
      renderLinkedText(byId('songText'), answer ? SURPRISE_TEXTS[answer] : 'responda certa e ganhe um bônus!');
      if (answer) {
        setAudio(BONUS_AUDIO, BONUS_AUDIO_REMOTO);
        if (!BONUS_AUDIO) byId('audioPending').textContent = 'o minuto de both sides now será adicionado em breve.';
      } else {
        player.pause();
        player.removeAttribute('src');
        player.load();
        player.hidden = true;
        byId('audioPending').hidden = true;
      }
    } else {
      byId('surpriseOpen').hidden = true;
      renderLinkedText(byId('songText'), song.texto);
      setAudio(song.audio, song.audioRemoto);
    }
    resultCard.hidden = false;
  }
  function openSurprise() {
    const st = readState();
    if (st.lastResult !== 'ccc' || st.surpriseAnswer || surpriseOverlay.hidden === false) return;
    surpriseFocusBeforeOpen = document.activeElement;
    surpriseFeedback.hidden = true;
    byId('surpriseContinue').hidden = true;
    surpriseForm.hidden = false;
    surpriseInput.value = '';
    surpriseOverlay.hidden = false;
    surpriseInput.focus();
  }
  function closeSurprise() {
    surpriseOverlay.hidden = true;
    (surpriseFocusBeforeOpen && surpriseFocusBeforeOpen.isConnected ? surpriseFocusBeforeOpen : byId('surpriseOpen')).focus();
  }
  function submitSurprise(event) {
    event.preventDefault();
    const submitted = surpriseInput.value.trim().toLowerCase().slice(0, 7);
    if (!submitted) { surpriseInput.focus(); return; }
    // registra a resposta antes de exibi-la; recarregar não dá uma nova tentativa.
    const st = readState();
    if (st.lastResult !== 'ccc') { closeSurprise(); return; }
    if (!st.surpriseAnswer) {
      st.surpriseAnswer = submitted === 'nenhum' ? 'correct' : 'wrong';
      try { writeState(st); } catch (_error) {
        showNotice('não foi possível guardar a resposta. tente novamente.');
        return;
      }
    }
    surpriseForm.hidden = true;
    surpriseFeedback.textContent = SURPRISE_TEXTS[st.surpriseAnswer];
    surpriseFeedback.hidden = false;
    byId('surpriseContinue').hidden = false;
    showResult('ccc');
    byId('surpriseContinue').focus();
  }
  function clearResult() {
    player.pause();
    resultCard.hidden = true;
  }
  function animateOneReel(strip, endPhase, index) {
    const count = 17 + index * 4;
    const phases = Object.keys(PHASES);
    const tiles = [];
    // O primeiro desenho mantém a fase que estava visível ao iniciar o giro.
    const oldPhase = strip.parentElement.getAttribute('aria-label');
    tiles.push(createTile(oldPhase?.includes('nova') ? 'n' : oldPhase?.includes('cheia') ? 'f' : oldPhase?.includes('crescente') ? 'c' : oldPhase?.includes('minguante') ? 'm' : 'f'));
    for (let i = 1; i < count - 1; i += 1) tiles.push(createTile(phases[randomInt(phases.length)]));
    tiles.push(createTile(endPhase));
    strip.replaceChildren(...tiles);
    strip.style.transform = 'translateY(0px)';
    if (reducedMotion.matches || !strip.animate) {
      strip.replaceChildren(createTile(endPhase));
      return Promise.resolve();
    }
    const cellSize = strip.parentElement.getBoundingClientRect().height;
    const animation = strip.animate([
      {transform: 'translateY(0px)'},
      {transform: `translateY(-${(count - 1) * cellSize}px)`}
    ], {
      duration: 1350 + 370 * index,
      easing: 'cubic-bezier(.15,.67,.17,1)',
      fill: 'forwards'
    });
    return animation.finished.catch(() => {}).then(() => {
      animation.cancel();
      strip.replaceChildren(createTile(endPhase));
      strip.style.transform = '';
    });
  }
  async function animateSpin(code) {
    busy = true;
    spinButton.disabled = true;
    lever.disabled = true;
    spinButton.textContent = 'as luas estão girando…';
    hideNotice();
    clearResult();
    lever.classList.add('pulled');
    const rebound = setTimeout(() => lever.classList.remove('pulled'), 500);
    try {
      await Promise.all([...code].map((char, index) => animateOneReel(strips[index], char, index)));
      setReels(code);
      showResult(code);
      if (code === 'ccc') openSurprise();
    } finally {
      clearTimeout(rebound);
      lever.classList.remove('pulled');
      spinButton.disabled = false;
      lever.disabled = false;
      spinButton.textContent = '✧ puxar a alavanca ✧';
      busy = false;
      updateStatus();
    }
  }
  // Web Locks serializa as tentativas nas abas do mesmo navegador, se disponível.
  async function serialized(task) {
    if (navigator.locks && typeof navigator.locks.request === 'function') {
      return navigator.locks.request('jukebox-lunar-rodada', { mode: 'exclusive' }, task);
    }
    return task();
  }
  async function tryPlay() {
    if (busy || !storeAvailable || !playerName || !directNameOverlay.hidden || gameContent.hidden) return;
    busy = true;
    spinButton.disabled = true;
    lever.disabled = true;
    let action;
    try {
      action = await serialized(() => {
        const state = readState();
        const now = trustedNow(state);
        if (!adminMode && state.penaltyUntil > now) {
          writeState(state);
          return {type: 'blocked', message: 'você poderá jogar de novo quando o brasil for hexa'};
        }
        if (!adminMode && state.cooldownUntil > now) {
          state.blockedAttempts += 1;
          let message;
          if (state.blockedAttempts === 1) {
            message = 'vá dar play em duas canções e após ouvi-la, você poderá jogar de novo.';
          } else if (state.blockedAttempts === 2) {
            message = 'já expliquei, deixa de ser teimoso';
          } else {
            message = 'você poderá jogar de novo quando o brasil for hexa';
            state.penaltyUntil = now + PENALTY_MS;
            state.blockedAttempts = 3;
          }
          writeState(state);
          return {type: 'blocked', message};
        }
        // A concessão e o resultado são salvos ANTES da animação.
        const code = drawCode(state);
        state.lastSpinAt = now;
        state.cooldownUntil = adminMode ? 0 : now + COOLDOWN_MS;
        state.penaltyUntil = 0;
        state.blockedAttempts = 0;
        state.lastResult = code;
        state.surpriseAnswer = '';
        writeState(state);
        return {type: 'play', code};
      });
    } catch (_error) {
      showNotice('não foi possível salvar seu jogo neste navegador. ative o armazenamento local e tente novamente.');
      spinButton.disabled = true;
      lever.disabled = true;
      return;
    } finally {
      busy = false;
    }
    if (action.type === 'play') {
      await animateSpin(action.code);
    } else {
      spinButton.disabled = false;
      lever.disabled = false;
      showNotice(action.message);
      updateStatus();
    }
  }

  function closeInside() {
    if (window.parent !== window) {
      // Só um hospedeiro da mesma origem recebe esta mensagem.
      window.parent.postMessage({type:'JUKEBOX_LUNAR_CLOSE', version:1}, window.location.origin);
    }
    player.pause();
    surpriseOverlay.hidden = true;
    gameContent.hidden = true;
    closedState.hidden = false;
    byId('reopenInside').focus();
  }
  function reopenInside() {
    gameContent.hidden = false;
    closedState.hidden = true;
    const last = readState().lastResult;
    if (last) { setReels(last); showResult(last); }
    updateStatus();
    spinButton.focus();
  }

  function initialize() {
    try {
      const testKey = `${STORAGE_KEY}:storage-check`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      storeAvailable = true;
    } catch (_error) {
      spinButton.disabled = true;
      lever.disabled = true;
      showNotice('este navegador bloqueou o armazenamento local. para garantir a espera entre jogadas, libere o armazenamento e recarregue a página.');
    }
    requestNameIfMissing();
    const state = readState();
    if (state.lastResult) {
      setReels(state.lastResult);
      showResult(state.lastResult);
    } else {
      setReels('fcm');
    }
    updateStatus();
    spinButton.addEventListener('click', tryPlay);
    lever.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      tryPlay();
    });
    lever.addEventListener('pointerdown', e => {
      if (lever.disabled) return;
      draggingFromY = e.clientY;
    });
    lever.addEventListener('pointerup', e => {
      if (draggingFromY === null) return;
      const moved = e.clientY - draggingFromY;
      draggingFromY = null;
      if (moved > 27) {
        suppressClickUntil = performance.now() + 650;
        tryPlay();
      }
    });
    lever.addEventListener('pointercancel', () => { draggingFromY = null; });
    byId('surpriseOpen').addEventListener('click', openSurprise);
    surpriseForm.addEventListener('submit', submitSurprise);
    byId('surpriseClose').addEventListener('click', closeSurprise);
    byId('surpriseContinue').addEventListener('click', closeSurprise);
    surpriseInput.addEventListener('input', () => {
      // minúsculas e somente até 7 caracteres, também após colar um texto.
      surpriseInput.value = surpriseInput.value.toLowerCase().slice(0, 7);
    });
    surpriseOverlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeSurprise(); }
      if (event.key !== 'Tab') return;
      const elements = [...surpriseOverlay.querySelectorAll('button:not([hidden]), input:not([hidden])')]
        .filter(el => el.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    const enforceBonusLimit = () => {
      if (readState().lastResult === 'ccc' && player.currentTime >= BONUS_MAX_SECONDS) {
        player.pause();
        player.currentTime = BONUS_MAX_SECONDS;
      }
    };
    player.addEventListener('timeupdate', enforceBonusLimit);
    player.addEventListener('seeked', enforceBonusLimit);
    directNameInput.addEventListener('input', () => { directNameInput.value = directNameInput.value.toLocaleLowerCase('pt-BR').slice(0,32); });
    directNameForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = normalizeName(directNameInput.value);
      if (!name) return;
      try { sessionStorage.setItem(NAME_KEY, name); } catch (_error) { showNotice('não foi possível guardar o seu nome. libere o armazenamento local.'); return; }
      configurePlayer(name);
      directNameOverlay.hidden = true;
      spinButton.disabled = !storeAvailable;
      lever.disabled = !storeAvailable;
      const state = readState();
      if (state.lastResult) { setReels(state.lastResult); showResult(state.lastResult); } else { setReels('fcm'); clearResult(); }
      updateStatus();
      spinButton.focus();
    });
    directNameOverlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [directNameInput, directNameForm.querySelector('button')];
      if (event.shiftKey && document.activeElement === controls[0]) {event.preventDefault(); controls[1].focus();}
      else if (!event.shiftKey && document.activeElement === controls[1]) {event.preventDefault(); controls[0].focus();}
    });
    byId('closeInside').addEventListener('click', closeInside);
    byId('reopenInside').addEventListener('click', reopenInside);
    window.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY || busy) return;
      const st = readState();
      if (st.lastResult) { setReels(st.lastResult); showResult(st.lastResult); }
      updateStatus();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateStatus(); });
    setInterval(updateStatus, 1000);
  }
  initialize();
})();
