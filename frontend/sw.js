const CACHE_NAME = "m-esportes-v1";

const DEFAULT_ICON = "./icons/icon-192.png";
const DEFAULT_BADGE = "./icons/icon-192.png";


/* =========================================================
   INSTALAÇÃO
========================================================= */

self.addEventListener("install", event => {
  self.skipWaiting();
});


/* =========================================================
   ATIVAÇÃO
========================================================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    self.clients.claim()
  );
});


/* =========================================================
   RECEBER PUSH
========================================================= */

self.addEventListener("push", event => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    data = {
      title: "M ESPORTES",
      body: event.data
        ? event.data.text()
        : "Nova atualização esportiva."
    };
  }

  const title =
    data.title ||
    "M ESPORTES";

  const options = {
    body:
      data.body ||
      "Nova atualização esportiva.",

    icon:
      data.icon ||
      DEFAULT_ICON,

    badge:
      data.badge ||
      DEFAULT_BADGE,

    tag:
      data.tag ||
      "m-esportes",

    renotify: true,

    vibrate: [
      300,
      150,
      300,
      150,
      500
    ],

    data: {
      url:
        data.url ||
        "./",

      gameId:
        data.gameId ||
        null,

      event:
        data.event ||
        null
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


/* =========================================================
   CLICOU NA NOTIFICAÇÃO
========================================================= */

self.addEventListener(
  "notificationclick",
  event => {
    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "./";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(clients => {
          for (const client of clients) {
            if (
              "focus" in client
            ) {
              client.navigate(
                targetUrl
              );

              return client.focus();
            }
          }

          if (
            self.clients.openWindow
          ) {
            return self.clients.openWindow(
              targetUrl
            );
          }
        })
    );
  }
);


/* =========================================================
   FECHAR NOTIFICAÇÃO
========================================================= */

self.addEventListener(
  "notificationclose",
  event => {
    console.log(
      "Notificação fechada:",
      event.notification.tag
    );
  }
);
