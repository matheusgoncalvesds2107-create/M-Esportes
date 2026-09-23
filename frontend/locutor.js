/* =========================================================
   M ESPORTES - LOCUTOR AUTOMÁTICO
   Pré-jogo T-30 + botão de teste
========================================================= */

const LOCUTOR = {
  enabled: true,
  lastMessageId: null
};

/* =========================================================
   ESCOLHER VOZ
========================================================= */

function getLocutorVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices =
    window.speechSynthesis.getVoices();

  const ptBR =
    voices.filter(
      voice =>
        String(voice.lang || "")
          .toLowerCase()
          .startsWith("pt-br")
    );

  return (
    ptBR.find(
      voice =>
        /natural|premium|neural/i.test(
          voice.name || ""
        )
    ) ||
    ptBR[0] ||
    voices.find(
      voice =>
        String(voice.lang || "")
          .toLowerCase()
          .startsWith("pt")
    ) ||
    null
  );
}

/* =========================================================
   FALAR
========================================================= */

function falar(texto) {
  if (!("speechSynthesis" in window)) {
    alert(
      "Este navegador não liberou o locutor."
    );
    return;
  }

  window.speechSynthesis.cancel();

  const fala =
    new SpeechSynthesisUtterance(
      texto
    );

  const voice =
    getLocutorVoice();

  if (voice) {
    fala.voice = voice;
  }

  fala.lang = "pt-BR";
  fala.rate = 0.92;
  fala.pitch = 0.95;
  fala.volume = 1;

  window.speechSynthesis.resume();
  window.speechSynthesis.speak(fala);
}

/* =========================================================
   PEGAR JOGO DE DESTAQUE
========================================================= */

function pegarJogoDoLocutor() {
  try {
    if (
      typeof choosePregameGame ===
      "function"
    ) {
      return choosePregameGame();
    }
  } catch (error) {
    console.warn(
      "Erro escolhendo jogo:",
      error
    );
  }

  return null;
}

/* =========================================================
   TEXTO DE TESTE
========================================================= */

function criarTextoAgora(game) {
  if (!game) {
    return (
      "Teste do locutor do M Esportes. " +
      "O sistema de voz está funcionando. " +
      "Quando houver um jogo selecionado para o pré-jogo, " +
      "eu apresentarei automaticamente as informações da partida."
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
    `Você está ouvindo o M Esportes Pré-Jogo. ` +
    `O destaque é ${casa} contra ${fora}, ` +
    `por ${campeonato}. `;

  if (horario) {
    texto +=
      `A partida está marcada para ${horario}. `;
  }

  texto +=
    `Acompanhe o aquecimento, as informações e a contagem regressiva para a bola rolar.`;

  return texto;
}

/* =========================================================
   BOTÃO OUVIR PRÉ-JOGO
========================================================= */

function ativarBotaoLocutor() {
  const botao =
    document.getElementById(
      "locutorBtn"
    );

  if (!botao) {
    console.warn(
      "Botão locutorBtn não encontrado."
    );
    return;
  }

  botao.addEventListener(
    "click",
    () => {
      const game =
        pegarJogoDoLocutor();

      const texto =
        criarTextoAgora(game);

      falar(texto);

      botao.textContent =
        "🔊 LOCUTOR NO AR";

      setTimeout(
        () => {
          botao.textContent =
            "🎙️ OUVIR PRÉ-JOGO";
        },
        4000
      );
    }
  );
}

/* =========================================================
   BOLETIM AUTOMÁTICO T-30
========================================================= */

function atualizarLocutorAutomatico() {
  try {
    const game =
      pegarJogoDoLocutor();

    if (!game) {
      return;
    }

    if (
      typeof minutesToKickoff !==
      "function"
    ) {
      return;
    }

    const minutos =
      minutesToKickoff(game);

    if (
      minutos === null ||
      minutos < 0 ||
      minutos > 30
    ) {
      return;
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

    let faixa = null;
    let texto = null;

    if (
      minutos <= 30 &&
      minutos >= 26
    ) {
      faixa = "t30";

      texto =
        `Está começando o M Esportes Pré-Jogo. ` +
        `Daqui a cerca de trinta minutos, ` +
        `${casa} e ${fora} entram em campo.`;
    }

    if (
      minutos <= 20 &&
      minutos >= 16
    ) {
      faixa = "t20";

      texto =
        `Faltam aproximadamente vinte minutos. ` +
        `${casa} contra ${fora}. ` +
        `Seguimos no aquecimento do M Esportes.`;
    }

    if (
      minutos <= 10 &&
      minutos >= 7
    ) {
      faixa = "t10";

      texto =
        `Entramos nos dez minutos finais antes da partida. ` +
        `${casa} contra ${fora}.`;
    }

    if (
      minutos <= 5 &&
      minutos >= 3
    ) {
      faixa = "t5";

      texto =
        `Falta muito pouco para a bola rolar. ` +
        `${casa} e ${fora}.`;
    }

    if (
      minutos <= 1 &&
      minutos >= 0
    ) {
      faixa = "t1";

      texto =
        `Tudo pronto. ` +
        `${casa} contra ${fora}. ` +
        `Vai começar.`;
    }

    if (
      !faixa ||
      !texto
    ) {
      return;
    }

    const id =
      `${game.id || casa + fora}-${faixa}`;

    if (
      LOCUTOR.lastMessageId === id
    ) {
      return;
    }

    LOCUTOR.lastMessageId = id;

    falar(texto);

  } catch (error) {
    console.warn(
      "Locutor automático:",
      error
    );
  }
}

/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    ativarBotaoLocutor();

    /*
      Carrega as vozes do aparelho.
    */
    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.getVoices();
    }
  }
);

setInterval(
  atualizarLocutorAutomatico,
  30000
);
