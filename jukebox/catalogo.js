'use strict';
/* arquivo editável: textos, links dos mp3s e bônus da jukebox lunar.
 * os caminhos songs/ funcionam no github pages se a pasta songs estiver na raiz.
 * links raw.githubusercontent.com entram em ação caso o arquivo local não exista.
 * não contém áudios. confirme que você tem permissão para distribuir as gravações.
 */
(() => {
  // ─── textos autorais fornecidos pelo autor: 11 canções + 1 surpresa ───
  // todas as gravações são carregadas da pasta songs/ com alternativa do github.
  const SPOTIFY_ALBUM_URL = 'https://open.spotify.com/intl-pt/album/4f1LldjG9vssrarr9GBIAF?si=i1LqFIKfT4SMrjZFRtBdeg';
  const BONUS_AUDIO = 'songs/Both%20Sides%20Now.mp3';
  const BONUS_AUDIO_REMOTO = 'https://raw.githubusercontent.com/dellsoares/disco/95088c2dfe3249781e10e9bcedf92c29ff702b5c/songs/Both%20Sides%20Now.mp3';
  const BONUS_MAX_SECONDS = 60;
  const SURPRISE_TEXTS = Object.freeze({
    correct: 'gente racional é outro papo. toma um minuto de both sides now pra alegrar seu dia!',
    wrong: 'signo não existe, marmota. toma um minuto de both sides now pra cair na real!'
  });
  const CANCOES = Object.freeze([
    {
      codigo: 'nnm', titulo: 'bad moon rising',
      texto: 'john forgety diz que vê uma lua ruim surgindo, problemas e relâmpagos. então fica em casa e dá play no álbum luas pra chorar ao invés de morrer.',
      audio: 'songs/Bad%20Moon%20Rising%20%28Acoustic%29.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Bad%20Moon%20Rising%20%28Acoustic%29.mp3'
    },
    {
      codigo: 'fff', titulo: 'eclipse', artista: 'pink floyd',
      texto: 'roger waters diz que não há um lado escuro da lua e que tudo é escuro. ele tem razão, então faz de conta que o álbum luas é pelo menos uma lanterna pra esses dias.',
      audio: 'songs/Eclipse.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Eclipse.mp3'
    },
    {
      codigo: 'mmf', titulo: 'tendo a lua',
      texto: 'faça hoje como herbert vianna pede e vá visitar a lua com alguém. pode começar com a trilha sonora do álbum luas e tudo vai dar certo.',
      audio: 'songs/Tendo%20A%20Lua.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Tendo%20A%20Lua.mp3'
    },
    {
      codigo: 'fnc', titulo: 'man on the moon',
      texto: 'michael stipe diz que vai te ver no céu se você entrar pra lista. coloque seu nome nela mas comece ouvindo o álbum luas.',
      audio: 'songs/Man%20On%20The%20Moon.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Man%20On%20The%20Moon.mp3'
    },
    {
      codigo: 'nnn', titulo: 'killing moon',
      texto: 'segundo ian mcculloch, só dará certo se você se entregar à lua. então começa ouvindo o álbum luas e atenda o pedido do moço.',
      audio: 'songs/The%20Killing%20Moon%20-%20MTV%20Unplugged.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/The%20Killing%20Moon%20-%20MTV%20Unplugged.mp3'
    },
    {
      codigo: 'cnm', titulo: 'moon river',
      texto: 'num mundo louco com tanto pra ser visto, não esqueça de dar play no álbum luas e ver com trilha sonora.',
      audio: 'songs/Moon%20River.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Moon%20River.mp3'
    },
    {
      codigo: 'mmm', titulo: 'a lua me traiu',
      texto: 'bem feito. foi aplaudir joelma e levou um par de chimbinha na fuça. cure a tristeza ouvindo o álbum luas.',
      audio: 'songs/A%20Lua%20Me%20Traiu.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/A%20Lua%20Me%20Traiu.mp3'
    },
    {
      codigo: 'fmm', titulo: 'moonchild', artista: 'iron maiden',
      texto: 'bruce nos lembra o tanto de 7 que nos permeia. mas ignora ele um tiquinho e vai nas 8 faixas do álbum luas e a chance de ir pro inferno ficará menor (ou não).',
      audio: 'songs/Moonchild%20-%202015%20Remaster.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Moonchild%20-%202015%20Remaster.mp3'
    },
    {
      codigo: 'cfc', titulo: 'a tal canção pra lua', artista: 'vitor kley e samuel rosa',
      texto: 'mirou na lua e acabou acertando as estrelas. mas não importa qual o céu, que tal ouvir o álbum luas pra inspirar?',
      audio: 'songs/A%20Tal%20Can%C3%A7%C3%A3o%20Pra%20Lua%20-%20Microfonado.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/A%20Tal%20Can%C3%A7%C3%A3o%20Pra%20Lua%20-%20Microfonado.mp3'
    },
    {
      codigo: 'ncf', titulo: 'a lua e eu', artista: 'cassiano',
      texto: 'sobrou você e a lua, então segue o conselho do cassiano se tá sentindo velho e acabado: aceite. mas ouça antes o álbum luas.',
      audio: 'songs/A%20%20lua%20e%20eu.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/A%20%20lua%20e%20eu.mp3'
    },
    {
      codigo: 'mcn', titulo: 'lua vai (recado à minha amada)', artista: 'katinguelê',
      texto: 'se sua paz depende de alguém, cê tá é fodido. então fique fodido mas com boa audição. ouve o álbum luas aqui, vai.',
      audio: 'songs/Recado%20a%20minha%20amada.mp3', audioRemoto: 'https://raw.githubusercontent.com/dellsoares/disco/2c9ea6964d3ab0059ff2d48f1f9206ea2eca745c/songs/Recado%20a%20minha%20amada.mp3'
    },
    { codigo: 'ccc', titulo: 'surpresa!', texto: 'responda certa e ganhe um bônus!', audio: '' }
  ]);
  // ───────────────────────────────────────────────────────────
  window.JUKEBOX_CATALOGO = Object.freeze({
    CANCOES, SPOTIFY_ALBUM_URL, BONUS_AUDIO, BONUS_AUDIO_REMOTO, BONUS_MAX_SECONDS, SURPRISE_TEXTS
  });
})();
