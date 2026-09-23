/* =========================================================
   M ESPORTES - LOCUTOR AUTOMÁTICO
   Pré-jogo T-30
========================================================= */

const LOCUTOR = {
  enabled: true,
  lastMessageId: null,
  lastGameId: null
};

/* =========================================================
   ESCOLHER MELHOR VOZ PT-BR
========================================================= */

function getLocutorVoice() {
  const voices =
    speechSynthesis.getVoices();

  const ptBR =
    voices.filter(
      voice =>
        String(voice.lang)
          .toLowerCase()
          .startsWith("pt-br")
    );

  if (ptBR.length) {
    return (
      ptBR.find(
        voice =>
          /natural|premium|neural/i.test(
            voice.name
          )
      ) ||
      ptBR[0]
    );
  }

  return (
    voices.find(
      voice =>
        String(voice.lang)
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
  if (
    !LOCUTOR.enabled ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  speechSynthesis.cancel();

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

  speechSynthesis.speak(
    fala
  );
}

/* =========================================================
   TEXTO DO CAMPEONATO
========================================================= */

function nomeCampeonato(game) {
  return (
    game?.league ||
    "campeonato"
  );
}

/* =========================================================
   MONTAR BOLETIM
========================================================= */

function criarBoletimPregame(
  game
) {
  if (!game) {
    return null;
  }

  const minutos =
    minutesToKickoff(game);

  const casa =
    game.home;

  const fora =
    game.away;

  const campeonato =
    nomeCampeonato(game);

  const horario =
    game.start;

  /*
    JOGO JÁ COMEÇOU
  */

  if (
    isLive(game)
  ) {
    return {
      id:
        `${game.id}-live`,

      texto:
        `A bola está rolando. 
        ${casa} e ${fora} estão em campo por ${campeonato}.`
    };
  }

  /*
    MAIS DE 30 MINUTOS
    Não fala ainda.
  */

  if (
  minutos === null ||
  minutos > 30
) {
  return {
    id:
      `${game.id}-teste`,

    texto:
      `Teste do M Esportes Pré-Jogo.
      O destaque selecionado é
      ${casa} contra ${fora},
      por ${campeonato}.
      A partida está marcada para ${horario}.`
  };
}

  /*
    T-30
  */

  if (
    minutos <= 30 &&
    minutos >= 26
  ) {
    return {
      id:
        `${game.id}-t30`,

      texto:
        `Boa noite. Está começando o M Esportes Pré-Jogo. 
        Daqui a cerca de trinta minutos, 
        ${casa} e ${fora} entram em campo por ${campeonato}. 
        A partida está marcada para ${horario}. 
        A partir de agora, acompanhe as principais informações antes da bola rolar.`
    };
  }

  /*
    T-20
  */

  if (
    minutos <= 20 &&
    minutos >= 16
  ) {
    return {
      id:
        `${game.id}-t20`,

      texto:
        `Faltam aproximadamente vinte minutos para ${casa} e ${fora}. 
        O M Esportes segue no aquecimento para esta partida de ${campeonato}. 
        Em instantes, novas informações do confronto.`
    };
  }

  /*
    T-10
  */

  if (
    minutos <= 10 &&
    minutos >= 7
  ) {
    return {
      id:
        `${game.id}-t10`,

      texto:
        `Entramos nos dez minutos finais antes da partida. 
        ${casa} contra ${fora}. 
        Assim que houver escalações confirmadas, 
        o M Esportes atualiza automaticamente o pré-jogo.`
    };
  }

  /*
    T-5
  */

  if (
    minutos <= 5 &&
    minutos >= 3
  ) {
    return {
      id:
        `${game.id}-t5`,

      texto:
        `Falta muito pouco. 
        ${casa} e ${fora} já estão perto da hora do jogo. 
        O placar começa em zero a zero.`
    };
  }

  /*
    T-1
  */

  if (
    minutos <= 1 &&
    minutos >= 0
  ) {
    return {
      id:
        `${game.id}-t1`,

      texto:
        `Tudo pronto. 
        ${casa} contra ${fora}. 
        Vai começar.`
    };
  }

  return null;
}

/* =========================================================
   EXECUTAR LOCUTOR
========================================================= */

function atualizarLocutor() {
  try {
    const game =
      choosePregameGame();

    if (!game) {
      return;
    }

    const boletim =
      criarBoletimPregame(
        game
      );

    if (!boletim) {
      return;
    }

    /*
      Evita repetir o mesmo
      boletim várias vezes.
    */

    if (
      LOCUTOR.lastMessageId ===
      boletim.id
    ) {
      return;
    }

    LOCUTOR.lastMessageId =
      boletim.id;

    LOCUTOR.lastGameId =
      String(game.id);

    falar(
      boletim.texto
    );

  } catch (error) {
    console.warn(
      "Locutor M Esportes:",
      error
    );
  }
}

/* =========================================================
   ATIVAR ÁUDIO NO PRIMEIRO TOQUE
========================================================= */

document.addEventListener(
  "click",
  () => {
    if (
      "speechSynthesis"
      in window
    ) {
      speechSynthesis.resume();
    }
  },
  {
    once: true
  }
);

/* =========================================================
   INICIAR
========================================================= */

setTimeout(
  atualizarLocutor,
  4000
);

/*
  Confere o T-30,
  T-20, T-10 e T-5
  automaticamente.
*/

setInterval(
  atualizarLocutor,
  30000
);
