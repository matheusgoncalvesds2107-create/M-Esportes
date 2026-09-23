/* =========================================================
   M ESPORTES - LOCUTOR DO PRÉ-JOGO
   Usa o backend /api/locutor
========================================================= */

const LOCUTOR_API =
  "https://m-esportes-api.onrender.com/api/locutor";

let locutorAudio = null;

/* =========================================================
   PEGAR JOGO ESCOLHIDO PELO PRÉ-JOGO
========================================================= */

function pegarJogoLocutor() {
  try {
    if (
      typeof choosePregameGame ===
      "function"
    ) {
      return choosePregameGame();
    }
  } catch (error) {
    console.warn(
      "Erro ao escolher jogo:",
      error
    );
  }

  return null;
}

/* =========================================================
   MONTAR TEXTO DA APRESENTADORA
========================================================= */

function montarTextoLocutor(game) {
  if (!game) {
    return (
      "Você está ouvindo o M Esportes. " +
      "No momento não há uma partida selecionada para o pré-jogo. " +
      "Assim que um novo destaque for escolhido, " +
      "o M Esportes traz todas as informações antes da bola rolar."
    );
  }

  const casa =
    game.home ||
    game.home_team ||
    game.homeTeam ||
    "time da casa";

  const fora =
    game.away ||
    game.away_team ||
    game.awayTeam ||
    "time visitante";

  const campeonato =
    game.league ||
    game.competition ||
    game.championship ||
    "campeonato";

  const horario =
    game.start ||
    game.time ||
    game.hour ||
    "";

  let texto =
    "Olá, está no ar o M Esportes Pré-Jogo. " +
    `O nosso destaque é ${casa} contra ${fora}, ` +
    `pela competição ${campeonato}. `;

  if (horario) {
    texto +=
      `A partida está marcada para ${horario}. `;
  }

  texto +=
    "A partir de agora você acompanha o aquecimento, " +
    "as principais informações e a preparação para a bola rolar.";

  return texto;
}

/* =========================================================
   TOCAR LOCUÇÃO
========================================================= */

async function tocarLocucao(texto) {
  const botao =
    document.getElementById(
      "locutorBtn"
    );

  try {
    if (locutorAudio) {
      locutorAudio.pause();
      locutorAudio = null;
    }

    if (botao) {
      botao.textContent =
        "⏳ PREPARANDO LOCUÇÃO...";
    }

    const url =
      LOCUTOR_API +
      "?texto=" +
      encodeURIComponent(texto);

    locutorAudio =
      new Audio(url);

    locutorAudio.preload =
      "auto";

    locutorAudio.addEventListener(
      "playing",
      () => {
        if (botao) {
          botao.textContent =
            "🔊 LOCUTOR NO AR";
        }
      }
    );

    locutorAudio.addEventListener(
      "ended",
      () => {
        if (botao) {
          botao.textContent =
            "🎙️ OUVIR PRÉ-JOGO";
        }

        locutorAudio = null;
      }
    );

    locutorAudio.addEventListener(
      "error",
      () => {
        if (botao) {
          botao.textContent =
            "🎙️ OUVIR PRÉ-JOGO";
        }

        alert(
          "Não consegui carregar a locução."
        );
      }
    );

    await locutorAudio.play();

  } catch (error) {
    console.error(
      "Erro no locutor:",
      error
    );

    if (botao) {
      botao.textContent =
        "🎙️ OUVIR PRÉ-JOGO";
    }

    alert(
      "Erro ao iniciar o locutor."
    );
  }
}

/* =========================================================
   BOTÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const botao =
      document.getElementById(
        "locutorBtn"
      );

    if (!botao) {
      return;
    }

    botao.addEventListener(
      "click",
      () => {
        const game =
          pegarJogoLocutor();

        const texto =
          montarTextoLocutor(game);

        tocarLocucao(texto);
      }
    );
  }
);
