const CACHE_NAME = "m-esportes-v19";

const APP_SHELL = [
  "./",
  "./index.html",
  "./src.css",
  "./src.js",
  "./push.js",
  "./locutor.js",
  "./manifest.json",
  "./audio/gol-rpf.mp3"
];

/* =========================================================
   INSTALAÇÃO
========================================================= */

self.addEventListener(
  "install",
  event => {
    self.skipWaiting();

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(
            APP_SHELL
          )
        )
        .catch(error => {
          console.warn(
            "Falha ao criar cache inicial:",
            error
          );
        })
    );
  }
);


/* =========================================================
   ATIVAÇÃO
========================================================= */

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      Promise.all([
        caches
          .keys()
          .then(
            keys =>
              Promise.all(
                keys
                  .filter(
                    key =>
                      key !==
                      CACHE_NAME
                  )
                  .map(
                    key =>
                      caches.delete(
                        key
                      )
                  )
              )
          ),

        self.clients.claim()
      ])
    );
  }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  event => {
    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    /*
      Não interceptamos API externa.
    */
    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
      HTML:
      tenta rede primeiro.
    */
    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        fetch(request)
          .then(
            response => {
              const copy =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                );

              return response;
            }
          )
          .catch(
            () =>
              caches.match(
                "./index.html"
              )
          )
      );

      return;
    }

    /*
      Arquivos estáticos:
      cache primeiro.
    */
    event.respondWith(
      caches
        .match(request)
        .then(
          cached => {
            if (cached) {
              return cached;
            }

            return fetch(
              request
            )
              .then(
                response => {
                  if (
                    !response ||
                    response.status !==
                      200
                  ) {
                    return response;
                  }

                  const copy =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(
                      cache =>
                        cache.put(
                          request,
                          copy
                        )
                    );

                  return response;
                }
              );
          }
        )
    );
  }
);


/* =========================================================
   PUSH
========================================================= */

self.addEventListener(
  "push",
  event => {
    let data = {
      title:
        "M ESPORTES",

      body:
        "Nova atualização esportiva.",

      tag:
        "m-esportes",

      url:
        "./"
    };

    try {
      if (
        event.data
      ) {
        const parsed =
          event.data.json();

        data = {
          ...data,
          ...parsed
        };
      }
    } catch {
      try {
        data.body =
          event.data
            ? event.data.text()
            : data.body;
      } catch {
        /* mantém padrão */
      }
    }

    const options = {
      body:
        data.body,

      icon:
        data.icon ||
        "./icon-192.png",

      badge:
        data.badge ||
        "./icon-192.png",

      tag:
        data.tag ||
        "m-esportes",

      renotify:
        true,

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
      self.registration
        .showNotification(
          data.title ||
            "M ESPORTES",
          options
        )
    );
  }
);


/* =========================================================
   CLIQUE NA NOTIFICAÇÃO
========================================================= */

self.addEventListener(
  "notificationclick",
  event => {
    event.notification
      .close();

    const targetUrl =
      event.notification
        .data?.url ||
      "./";

    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",

          includeUncontrolled:
            true
        })
        .then(
          clients => {
            for (
              const client
              of clients
            ) {
              if (
                "focus"
                in client
              ) {
                try {
                  client.navigate(
                    targetUrl
                  );
                } catch {
                  /* ignora */
                }

                return client.focus();
              }
            }

            if (
              self.clients
                .openWindow
            ) {
              return self.clients
                .openWindow(
                  targetUrl
                );
            }

            return null;
          }
        )
    );
  }
);


/* =========================================================
   FECHAMENTO DA NOTIFICAÇÃO
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
