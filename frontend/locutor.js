document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("locutorBtn");

  if (!botao) {
    return;
  }

  botao.addEventListener("click", () => {

    if (!("speechSynthesis" in window)) {
      alert("Este navegador não suporta voz automática.");
      return;
    }

    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(
      "Teste de áudio. Você está ouvindo o M Esportes."
    );

    fala.lang = "pt-BR";
    fala.volume = 1;
    fala.rate = 0.9;
    fala.pitch = 1;

    fala.onstart = () => {
      botao.textContent = "🔊 FALANDO";
    };

    fala.onend = () => {
      botao.textContent = "🎙️ OUVIR PRÉ-JOGO";
    };

    fala.onerror = event => {
      alert(
        "Erro na voz: " +
        (event.error || "desconhecido")
      );

      botao.textContent =
        "🎙️ OUVIR PRÉ-JOGO";
    };

    window.speechSynthesis.speak(fala);
  });
});
