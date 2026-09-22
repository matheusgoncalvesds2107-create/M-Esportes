/* =========================================================
   M ESPORTES - WEB PUSH REAL
   Recebe notificações mesmo com o site fechado
========================================================= */

const PUSH_API_BASE =
  "https://m-esportes-api.onrender.com";

/* =========================================================
   CONVERTER CHAVE VAPID
========================================================= */

function urlBase64ToUint8Array(
  base64String
) {
  const padding =
    "=".repeat(
      (
        4 -
        base64String.length % 4
      ) % 4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(
      base64
    );

  const outputArray =
    new Uint8Array(
      rawData.length
    );

  for (
    let i = 0;
    i < rawData.length;
    i++
  ) {
    outputArray[i] =
      rawData.charCodeAt(i);
  }

  return outputArray;
}

/* =========================================================
   BUSCAR CHAVE PÚBLICA
========================================================= */

async function getVapidPublicKey() {
  const response =
    await fetch(
      `${PUSH_API_BASE}/api/push/public-key`,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      `Falha ao buscar chave VAPID: ${response.status}`
    );
  }

  const data =
    await response.json();

  if (
    !data.ok ||
    !data.configured ||
    !data.publicKey
  ) {
    throw new Error(
      "Web Push não configurado no servidor."
    );
  }

  return data.publicKey;
}

/* =========================================================
   REGISTRAR SERVICE WORKER
========================================================= */

async function getPushRegistration() {
  if (
    !(
      "serviceWorker"
      in navigator
    )
  ) {
    throw new Error(
      "Service Worker não suportado."
    );
  }

  /*
    O src.js já registra o sw.js,
    mas aqui garantimos que esteja pronto.
  */

  let registration =
    await navigator
      .serviceWorker
      .getRegistration("./");

  if (!registration) {
    registration =
      await navigator
        .serviceWorker
        .register(
          "./sw.js",
          {
            scope: "./"
          }
        );
  }

  await navigator
    .serviceWorker
    .ready;

  return registration;
}

/* =========================================================
   ENVIAR ASSINATURA PARA O BACKEND
========================================================= */

async function savePushSubscription(
  subscription
) {
  const response =
    await fetch(
      `${PUSH_API_BASE}/api/push/subscribe`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            subscription:
              subscription.toJSON()
          })
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.error ||
      "Não foi possível registrar o push."
    );
  }

  return data;
}

/* =========================================================
   ATIVAR PUSH
========================================================= */

async function activateRealPush() {
  const button =
    document.getElementById(
      "notificationBtn"
    );

  try {
    if (
      !(
        "Notification"
        in window
      )
    ) {
      alert(
        "Este navegador não suporta notificações."
      );

      return;
    }

    if (
      !(
        "PushManager"
        in window
      )
    ) {
      alert(
        "Este navegador não suporta Web Push."
      );

      return;
    }

    if (button) {
      button.disabled = true;

      button.textContent =
        "ATIVANDO PUSH...";
    }

    let permission =
      Notification.permission;

    if (
      permission ===
      "default"
    ) {
      permission =
        await Notification
          .requestPermission();
    }

    if (
      permission !==
      "granted"
    ) {
      throw new Error(
        "Permissão de notificações não concedida."
      );
    }

    const registration =
      await getPushRegistration();

    /*
      Verifica se o celular já
      possui uma assinatura.
    */

    let subscription =
      await registration
        .pushManager
        .getSubscription();

    if (!subscription) {
      const publicKey =
        await getVapidPublicKey();

      subscription =
        await registration
          .pushManager
          .subscribe({
            userVisibleOnly:
              true,

            applicationServerKey:
              urlBase64ToUint8Array(
                publicKey
              )
          });
    }

    const result =
      await savePushSubscription(
        subscription
      );

    localStorage.setItem(
      "m-esportes-push-active",
      "1"
    );

    if (button) {
      button.textContent =
        "🔔 PUSH ATIVADO";
    }

    console.log(
      "M Esportes Push:",
      result
    );

    alert(
      "Push ativado! Agora o M Esportes pode receber notificações mesmo fechado."
    );

  } catch (error) {
    console.error(
      "Erro Web Push:",
      error
    );

    if (button) {
      button.textContent =
        "ATIVAR NOTIFICAÇÕES";
    }

    alert(
      `Não foi possível ativar o push: ${error.message}`
    );

  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

/* =========================================================
   RESTAURAR ESTADO DO BOTÃO
========================================================= */

async function restorePushButton() {
  const button =
    document.getElementById(
      "notificationBtn"
    );

  if (!button) {
    return;
  }

  if (
    Notification.permission !==
    "granted"
  ) {
    return;
  }

  try {
    const registration =
      await navigator
        .serviceWorker
        .getRegistration("./");

    const subscription =
      await registration
        ?.pushManager
        ?.getSubscription();

    if (subscription) {
      button.textContent =
        "🔔 PUSH ATIVADO";

      /*
        Reenvia a assinatura ao backend
        quando o site abrir.
      */

      await savePushSubscription(
        subscription
      );
    }

  } catch (error) {
    console.warn(
      "Restauração do push:",
      error
    );
  }
}

/* =========================================================
   BOTÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const button =
      document.getElementById(
        "notificationBtn"
      );

    if (button) {
      /*
        capture=true faz o nosso
        Web Push executar junto
        com a função antiga.
      */

      button.addEventListener(
        "click",
        activateRealPush,
        true
      );
    }

    restorePushButton();
  }
);
