'use strict';
(() => {
  const {CANCOES, SPOTIFY_ALBUM_URL, SURPRISE_TEXTS, BONUS_AUDIO, BONUS_AUDIO_REMOTO, BONUS_MAX_SECONDS} = window.JUKEBOX_CATALOGO;
  const phases = {n:'nova', f:'cheia', c:'crescente', m:'minguante'};
  const symbols = {n:'🌑', f:'🌕', c:'🌒', m:'🌘'};
  const cards = document.getElementById('cards');
  function node(tag, klass, content) {
    const el = document.createElement(tag);
    if (klass) el.className = klass;
    if (content != null) el.textContent = content;
    return el;
  }
  function textWithLinks(text) {
    const p = node('p','text');
    for (const part of String(text).split(/(álbum luas)/g)) {
      if (part === 'álbum luas') {
        const a = node('a','',part);a.href=SPOTIFY_ALBUM_URL;a.target='_blank';a.rel='noopener noreferrer';p.append(a);
      } else p.append(document.createTextNode(part));
    }
    return p;
  }
  function addAudio(card, song) {
    if (!song.audio) {
      card.append(node('p','warn',song.codigo==='ccc' ? 'áudio do bônus pendente: both sides now (até 1 minuto).' : 'mp3 pendente.'));
      return;
    }
    const p=node('p','warn','áudio fornecido no github. caso não carregue, confira o arquivo e a permissão de acesso.');
    const audio=node('audio','audio');
    audio.controls=true;
    audio.preload='none';
    audio.src=song.audio;
    audio.setAttribute('aria-label','ouvir '+song.titulo);
    let tried=false;
    audio.addEventListener('error',()=>{
      if (!tried && song.audioRemoto) {
        tried=true; audio.src=song.audioRemoto;audio.load();
      } else {p.textContent='não foi possível carregar este mp3 no navegador.';}
    });
    if (song.codigo === 'ccc') {
      const limit = () => {
        if (audio.currentTime >= BONUS_MAX_SECONDS) { audio.pause(); audio.currentTime = BONUS_MAX_SECONDS; }
      };
      audio.addEventListener('timeupdate', limit);
      audio.addEventListener('seeked', limit);
    }
    audio.addEventListener('play',()=>{
      for(const other of document.querySelectorAll('audio')) if(other!==audio) other.pause();
    });
    card.append(audio,p);
  }
  CANCOES.forEach((song,index)=>{
    const card=node('article','card');card.dataset.code=song.codigo;
    const header=node('div','card-head');header.append(node('span','code',song.codigo),node('span','number',String(index+1).padStart(2,'0')+' / 12'));card.append(header);
    card.append(node('div','phases',[...song.codigo].map(c=>symbols[c]).join(' ')));
    card.append(node('h2','',song.titulo));
    card.append(node('p','artist',song.artista || [...song.codigo].map(c=>phases[c]).join(' · ')));
    if (song.codigo !== 'ccc') {
      card.append(textWithLinks(song.texto));
      addAudio(card,song);
    } else {
      card.append(node('p','text','responda certa e ganhe um bônus! quantos signos existem?'));
      const quiz=node('form','quiz');quiz.setAttribute('autocomplete','off');
      const label=node('label','', 'digite até 7 caracteres em minúsculas:');label.htmlFor='testerQuiz';
      const input=node('input');input.id='testerQuiz';input.maxLength=7;input.minLength=1;input.required=true;input.setAttribute('autocapitalize','off');input.autocomplete='off';input.spellcheck=false;
      const b=node('button','', 'ver resultado');b.type='submit';
      const answer=node('p','answer','');answer.setAttribute('role','status');answer.hidden=true;
      quiz.append(label,input,b,answer);
      quiz.addEventListener('submit',e=>{
        e.preventDefault(); const v=input.value.trim().toLowerCase().slice(0,7); if(!v)return;
        answer.textContent=v==='nenhum' ? SURPRISE_TEXTS.correct : SURPRISE_TEXTS.wrong;answer.hidden=false;
      });
      input.addEventListener('input',()=>{input.value=input.value.toLowerCase().slice(0,7)});
      card.append(quiz);
      const example=node('div','example');
      example.append(node('p','', '✓ resposta certa: "nenhum" → '+SURPRISE_TEXTS.correct));
      example.append(node('p','', '✕ outra resposta → '+SURPRISE_TEXTS.wrong));
      card.append(example);
      addAudio(card,{codigo:'ccc', titulo:'both sides now', audio:BONUS_AUDIO, audioRemoto:BONUS_AUDIO_REMOTO});
    }
    cards.append(card);
  });
  document.getElementById('stopAudios').addEventListener('click',()=>{
    for (const audio of document.querySelectorAll('audio')) audio.pause();
  });
})();