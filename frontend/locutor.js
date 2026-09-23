document.addEventListener("DOMContentLoaded", () => {
  const botao =
    document.getElementById("locutorBtn");

  if (!botao) {
    return;
  }

  const audio =
    new Audio("./audio/locutor-teste.mp3");

  audio.preload = "auto";

  botao.addEventListener(
    "click",
    async () => {
      try {
        audio.currentTime = 0;

        await audio.play();

        botao.textContent =
          "🔊 LOCUTOR NO AR";
      } catch (error) {
        alert(
          "Não consegui tocar o áudio."
        );
      }
    }
  );

  audio.addEventListener(
    "ended",
    () => {
      botao.textContent =
        "🎙️ OUVIR PRÉ-JOGO";
    }
  );
});
