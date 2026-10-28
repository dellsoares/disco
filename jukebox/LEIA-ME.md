# jukebox lunar · revisão com músicas, textos e modo livre

versão de teste: 11 canções e 1 surpresa, com 11 mp3s e um áudio bônus informados pelo autor. interface em minúsculas.

## abrir

1. coloque os arquivos na mesma pasta que a pasta `songs/` do seu repositório.
2. abra por um servidor http (`python -m http.server 8080`) ou github pages; não use `file://`.
3. abra `index.html`: a caixa **digite seu nome para jogar** será mostrada imediatamente.
4. `alanis` (minúsculas, com ou sem espaços ao redor) entra em **modo livre** com rodadas ilimitadas; os demais nomes usam a regra pública.
5. `teste.html` mostra as **12 respostas** com tocadores sem usar jogadas, inclusive os dois resultados da surpresa.

## regra dos jogadores comuns

- uma jogada a cada 15 minutos, usando armazenamento local do navegador.
- primeira insistência antes de 15 minutos: “vá dar play em duas canções e após ouvi-la, você poderá jogar de novo.”
- segunda: “já expliquei, deixa de ser teimoso”
- terceira: “você poderá jogar de novo quando o brasil for hexa”, com bloqueio de **sete dias**.
- os limites públicos valem mesmo que a pessoa digite outro nome comum, pois compartilham `localStorage` no navegador.
- o modo livre guarda a sequência de músicas separadamente: não altera a última rodada nem a espera dos visitantes.
- o sorteio percorre os 12 resultados aleatoriamente antes de repetir uma combinação.

**cuidado:** `alanis` é uma chave visível no JavaScript público, não uma autenticação secreta. qualquer pessoa que saiba o nome pode entrar em modo livre. isso foi solicitado como solução simples de teste. para exclusividade verdadeira seria necessária autenticação no servidor.

## canções / códigos

| código | canção |
|---|---|
| nnm | bad moon rising |
| fff | eclipse |
| mmf | tendo a lua |
| fnc | man on the moon |
| nnn | killing moon |
| cnm | moon river |
| mmm | a lua me traiu |
| fmm | moonchild |
| cfc | a tal canção pra lua |
| ncf | a lua e eu |
| mcn | lua vai (recado à minha amada) |
| ccc | surpresa: quantos signos existem? |

## arquivos de áudio

Todas as músicas mantêm links de fallback do repositório do autor. O bônus **both sides now** aponta para `songs/Both%20Sides%20Now.mp3`, com fallback para o commit informado. O jogador escuta até **60 segundos** do bônus; não foi criado nem alterado o MP3 original. Verifique as permissões de compartilhamento dessas gravações.

O HTML usa `catalogo.js` para os textos, os links do Spotify e os MP3s. O texto de killing moon está completo e sua expressão **álbum luas** leva ao Spotify.

## antes de publicar

- remover `teste.html`, `teste.js`, `teste.css` e o link de teste no `index.html` se não quiser expor antecipadamente todos os resultados.
- confirmar que a pasta `songs/` está acessível pela mesma raiz e se os nomes dos arquivos batem (em **a lua e eu** há dois espaços após `A`).
- confirmar a reprodução dos MP3s e a autorização para hospedar/disponibilizar as gravações.
- como o bloqueio usa o navegador, limpar armazenamento / abrir outro navegador permite contorná-lo.
