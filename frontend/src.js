const API_BASE =
  "https://radioplacar-api.onrender.com";


const state = {

  games: [],

  live: [],

  leagues: [],

  news: [],

  favorites: new Set(
    JSON.parse(
      localStorage.getItem(
        "m-esportes-favorites"
      ) || "[]"
    )
  ),

  notified: JSON.parse(
    localStorage.getItem(
      "m-esportes-notified"
    ) || "{}"
  )

};


const els = {

  homeGames:
    document.getElementById(
      "homeGames"
    ),

  liveGames:
    document.getElementById(
      "liveGames"
    ),

  favoriteGames:
    document.getElementById(
      "favoriteGames"
    ),

  leaguesList:
    document.getElementById(
      "leaguesList"
    ),

  newsList:
    document.getElementById(
      "newsList"
    ),

  pregameCard:
    document.getElementById(
      "pregameCard"
    ),

  todayCount:
    document.getElementById(
      "todayCount"
    ),

  liveCount:
    document.getElementById(
      "liveCount"
    ),

  favoritesCount:
    document.getElementById(
      "favoritesCount"
    ),

  leaguesCount:
    document.getElementById(
      "leaguesCount"
    ),

  refreshBtn:
    document.getElementById(
      "refreshBtn"
    ),

  notificationBtn:
    document.getElementById(
      "notificationBtn"
    )

};


/* =========================
   AUXILIARES
========================= */

function escapeHtml(value = "") {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function first(...values) {

  for (
    const value of values
  ) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {

      return value;

    }

  }

  return null;

}


function todayBR() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {

      timeZone:
        "America/Sao_Paulo",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit"

    }
  ).format(
    new Date()
  );

}


/* =========================
   STATUS
========================= */

function normalizeStatus(raw) {

  const value =
    String(
      raw || ""
    )
      .trim()
      .toLowerCase();


  if (
    value.includes(
      "1st_half"
    ) ||
    value.includes(
      "first_half"
    ) ||
    value === "1h" ||
    value === "live" ||
    value === "inprogress" ||
    value === "in_progress"
  ) {

    return "1H";

  }


  if (
    value.includes(
      "interval"
    ) ||
    value === "ht" ||
    value === "halftime"
  ) {

    return "HT";

  }


  if (
    value.includes(
      "2nd_half"
    ) ||
    value.includes(
      "second_half"
    ) ||
    value === "2h"
  ) {

    return "2H";

  }


  if (
    value.includes(
      "finish"
    ) ||
    value.includes(
      "ended"
    ) ||
    value.includes(
      "encerr"
    ) ||
    value === "ft"
  ) {

    return "FT";

  }


  return "NS";

}


/* =========================
   NORMALIZAR JOGO
========================= */

function normalizeGame(game) {

  const homeId =
    first(

      game.teams?.home?.id,

      game.home?.id,

      game.home_team?.id,

      game.home_team_id

    );


  const awayId =
    first(

      game.teams?.away?.id,

      game.away?.id,

      game.away_team?.id,

      game.away_team_id

    );


  return {

    id:
      String(
        first(

          game.id,

          game.fixture?.id,

          `${homeId || "h"}-${awayId || "a"}-${game.date || ""}`

        )
      ),


    league:
      first(

        game.league?.name,

        game.competition?.name,

        game.championship,

        game.league,

        "Campeonato"

      ),


    country:
      first(

        game.league?.country,

        game.country?.name,

        game.country,

        game.region,

        "Internacional"

      ),


    home:
      first(

        game.teams?.home?.name,

        game.home?.name,

        game.home_team?.name,

        game.home_team,

        "Mandante"

      ),


    away:
      first(

        game.teams?.away?.name,

        game.away?.name,

        game.away_team?.name,

        game.away_team,

        "Visitante"

      ),


    homeLogo:
      first(

        game.teams?.home?.logo,

        game.home?.logo,

        game.home_team?.logo,

        game.home_logo,

        game.team_home_logo,

        game.logo_home,

        game.home_team_logo

      ),


    awayLogo:
      first(

        game.teams?.away?.logo,

        game.away?.logo,

        game.away_team?.logo,

        game.away_logo,

        game.team_away_logo,

        game.logo_away,

        game.away_team_logo

      ),


    hs:
      first(

        game.goals?.home,

        game.score?.home,

        game.home_score,

        game.score_home

      ),


    as:
      first(

        game.goals?.away,

        game.score?.away,

        game.away_score,

        game.score_away

      ),


    minute:
      first(

        game.minute,

        game.elapsed,

        game.status?.elapsed,

        game.fixture?.status?.elapsed

      ),


    status:
      normalizeStatus(

        first(

          game.status?.short,

          game.fixture?.status?.short,

          game.status,

          game.state,

          game.match_status

        )

      ),


    start:
      first(

        game.time,

        game.fixture?.time,

        game.hour,

        "--:--"

      )

  };

}


/* =========================
   EXTRAIR LISTA
========================= */

function extractArray(data) {

  if (
    Array.isArray(data)
  ) {

    return data;

  }


  const keys = [

    "response",

    "matches",

    "games",

    "fixtures",

    "results",

    "data",

    "news",

    "noticias"

  ];


  for (
    const key of keys
  ) {

    if (
      Array.isArray(
        data?.[key]
      )
    ) {

      return data[key];

    }

  }


  if (
    Array.isArray(
      data?.response?.data
    )
  ) {

    return data.response.data;

  }


  return [];

}


/* =========================
   PARTIDA
========================= */

function isLive(game) {

  return [
    "1H",
    "HT",
    "2H"
  ].includes(
    game.status
  );

}


function statusText(game) {

  if (
    game.status === "1H"
  ) {

    return game.minute
      ? `${game.minute}'`
      : "1º TEMPO";

  }


  if (
    game.status === "HT"
  ) {

    return "INTERVALO";

  }


  if (
    game.status === "2H"
  ) {

    return game.minute
      ? `${game.minute}'`
      : "2º TEMPO";

  }


  if (
    game.status === "FT"
  ) {

    return "ENCERRADO";

  }


  return (
    game.start ||
    "--:--"
  );

}


function scoreValue(value) {

  return (
    value === null ||
    value === undefined ||
    value === ""
  )
    ? "-"
    : value;

}


/* =========================
   ESCUDOS
========================= */

function teamLogo(
  url,
  team
) {

  if (url) {

    return `
      <img
        class="team-logo"
        src="${escapeHtml(url)}"
        alt="${escapeHtml(team)}"
        loading="lazy"
        referrerpolicy="no-referrer"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='grid';
        "
      >

      <span
        class="team-logo-fallback"
        style="display:none"
      >
        ${escapeHtml(
          team?.charAt(0) ||
          "?"
        )}
      </span>
    `;

  }


  return `
    <span
      class="team-logo-fallback"
    >
      ${escapeHtml(
        team?.charAt(0) ||
        "?"
      )}
    </span>
  `;

}


/* =========================
   CARD PARTIDA
========================= */

function matchCard(game) {

  const favorite =
    state.favorites.has(
      String(game.id)
    );


  return `
    <div
      class="match-card"
    >

      <div
        class="match-time ${
          isLive(game)
            ? "live"
            : ""
        }"
      >

        ${
          isLive(game)

            ? `
              <span
                class="status-pill"
              >
                ${escapeHtml(
                  statusText(game)
                )}
              </span>
            `

            : escapeHtml(
                statusText(game)
              )
        }

      </div>


      <div
        class="teams"
      >

        <div
          class="team"
        >

          ${teamLogo(
            game.homeLogo,
            game.home
          )}

          <span
            class="team-name"
          >
            ${escapeHtml(
              game.home
            )}
          </span>

        </div>


        <div
          class="team"
        >

          ${teamLogo(
            game.awayLogo,
            game.away
          )}

          <span
            class="team-name"
          >
            ${escapeHtml(
              game.away
            )}
          </span>

        </div>

      </div>


      <div
        class="score"
      >

        <span>
          ${scoreValue(
            game.hs
          )}
        </span>

        <span>
          ${scoreValue(
            game.as
          )}
        </span>

      </div>


      <button

        class="
          favorite-btn
          ${
            favorite
              ? "active"
              : ""
          }
        "

        data-favorite="${
          escapeHtml(
            game.id
          )
        }"

        type="button"

      >
        ★
      </button>

    </div>
  `;

}


/* =========================
   AGRUPAR CAMPEONATO
========================= */

function groupGames(games) {

  const map =
    new Map();


  for (
    const game of games
  ) {

    const country =
      game.country ||
      "Internacional";


    const league =
      game.league ||
      "Campeonato";


    const key =
      `${country}|${league}`;


    if (
      !map.has(key)
    ) {

      map.set(
        key,
        {

          country,

          league,

          games: []

        }
      );

    }


    map
      .get(key)
      .games
      .push(game);

  }


  return [
    ...map.values()
  ];

}


/* =========================
   RENDER JOGOS
========================= */

function renderGames(
  container,
  games,
  emptyTitle,
  emptyText
) {

  if (
    !games.length
  ) {

    container.innerHTML = `
      <div
        class="empty-state"
      >

        <strong>
          ${escapeHtml(
            emptyTitle
          )}
        </strong>

        <span>
          ${escapeHtml(
            emptyText
          )}
        </span>

      </div>
    `;

    return;

  }


  const groups =
    groupGames(games);


  container.innerHTML =
    groups

      .map(
        group => `
          <div
            class="league-group"
          >

            <div
              class="league-header"
            >

              <div
                class="league-name"
              >

                <div
                  class="league-country"
                >
                  ${escapeHtml(
                    group.country
                  )}
                </div>

                <div
                  class="league-title"
                >
                  ${escapeHtml(
                    group.league
                  )}
                </div>

              </div>


              <span>

                ${
                  group.games.length
                }

                jogo${
                  group.games.length === 1
                    ? ""
                    : "s"
                }

              </span>

            </div>


            ${
              group.games
                .map(
                  matchCard
                )
                .join("")
            }

          </div>
        `
      )

      .join("");

}


/* =========================
   ESQUENTANDO O JOGO
========================= */

function choosePregameGame() {

  if (
    !state.games.length
  ) {

    return null;

  }


  const liveGame =
    state.games.find(
      game =>
        isLive(game)
    );


  if (liveGame) {

    return liveGame;

  }


  const upcoming =
    state.games.find(
      game =>
        game.status === "NS"
    );


  if (upcoming) {

    return upcoming;

  }


  return state.games[0];

}


function pregameLogo(
  url,
  team
) {

  if (url) {

    return `
      <img

        src="${
          escapeHtml(url)
        }"

        alt="${
          escapeHtml(team)
        }"

        referrerpolicy="
          no-referrer
        "

        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='grid';
        "

      >

      <div

        class="
          pregame-team-logo-fallback
        "

        style="
          display:none
        "

      >

        ${
          escapeHtml(
            team?.charAt(0) ||
            "?"
          )
        }

      </div>
    `;

  }


  return `
    <div
      class="
        pregame-team-logo-fallback
      "
    >

      ${
        escapeHtml(
          team?.charAt(0) ||
          "?"
        )
      }

    </div>
  `;

}


function renderPregame() {

  const game =
    choosePregameGame();


  if (!game) {

    els.pregameCard.innerHTML = `
      <div
        class="pregame-loading"
      >

        Nenhum jogo disponível
        para destaque.

      </div>
    `;

    return;

  }


  const live =
    isLive(game);


  const finished =
    game.status === "FT";


  let center = "";


  if (
    live ||
    finished
  ) {

    center = `

      <div
        class="label"
      >

        ${escapeHtml(
          statusText(game)
        )}

      </div>


      <div
        class="score-big"
      >

        ${scoreValue(
          game.hs
        )}

        x

        ${scoreValue(
          game.as
        )}

      </div>
    `;

  } else {

    center = `

      <div
        class="label"
      >
        AGENDADO
      </div>


      <div
        class="time"
      >

        ${escapeHtml(
          game.start ||
          "--:--"
        )}

      </div>


      <div
        class="pregame-country"
      >

        HORÁRIO DO JOGO

      </div>
    `;

  }


  els.pregameCard.innerHTML = `

    <div
      class="pregame-top"
    >

      <div>

        <div
          class="
            pregame-competition
          "
        >

          ${escapeHtml(
            game.league
          )}

        </div>


        <div
          class="
            pregame-country
          "
        >

          ${escapeHtml(
            game.country
          )}

        </div>

      </div>


      <div
        class="pregame-status"
      >

        ${
          live
            ? "AO VIVO"
            : finished
              ? "ENCERRADO"
              : "PRÉ-JOGO"
        }

      </div>

    </div>


    <div
      class="pregame-banner"
    >

      M ESPORTES 3 MINUTOS
      • ESQUENTANDO O JOGO

    </div>


    <div
      class="pregame-match"
    >

      <div
        class="pregame-team"
      >

        ${pregameLogo(
          game.homeLogo,
          game.home
        )}

        <strong>

          ${escapeHtml(
            game.home
          )}

        </strong>

      </div>


      <div
        class="pregame-center"
      >

        ${center}

      </div>


      <div
        class="pregame-team"
      >

        ${pregameLogo(
          game.awayLogo,
          game.away
        )}

        <strong>

          ${escapeHtml(
            game.away
          )}

        </strong>

      </div>

    </div>


    <div
      class="pregame-highlight"
    >

      <small>
        DESTAQUE M ESPORTES
      </small>


      <h3>

        ${escapeHtml(
          game.home
        )}

        x

        ${escapeHtml(
          game.away
        )}

      </h3>


      <p>

        ${escapeHtml(
          game.league
        )}

        • acompanhe placar,
        status e principais
        atualizações da partida.

      </p>

    </div>
  `;

}


/* =========================
   NOTÍCIAS
========================= */

function normalizeNews(item) {

  return {

    title:
      first(

        item.title,

        item.titulo,

        item.headline,

        item.name,

        "Notícia esportiva"

      ),


    summary:
      first(

        item.summary,

        item.description,

        item.descricao,

        item.content,

        item.text,

        item.snippet,

        ""

      ),


    source:
      first(

        item.source?.name,

        item.source,

        item.fonte,

        item.provider,

        "M Esportes"

      ),


    link:
      first(

        item.url,

        item.link,

        item.href,

        null

      ),


    image:
      first(

        item.image,

        item.image_url,

        item.thumbnail,

        item.photo,

        item.img,

        null

      )

  };

}


function renderNews() {

  if (
    !state.news.length
  ) {

    els.newsList.innerHTML = `
      <div
        class="news-card"
      >

        <div
          class="news-tag"
        >
          🔴 M ESPORTES AGORA
        </div>

        <h3>
          Central de notícias
          em atualização
        </h3>

        <p>
          O M Esportes está
          conectado ao projeto
          RPF PLACAR e pronto
          para receber as notícias.
        </p>

      </div>
    `;

    return;

  }


  els.newsList.innerHTML =
    state.news

      .slice(
        0,
        8
      )

      .map(
        item => `
          <article
            class="news-card"
          >

            <div
              class="news-tag"
            >
              🔴 M ESPORTES AGORA
            </div>


            ${
              item.image

                ? `
                  <img

                    src="${
                      escapeHtml(
                        item.image
                      )
                    }"

                    alt=""

                    loading="lazy"

                  >
                `

                : ""
            }


            <h3>

              ${escapeHtml(
                item.title
              )}

            </h3>


            ${
              item.summary

                ? `
                  <p>

                    ${
                      escapeHtml(
                        String(
                          item.summary
                        ).slice(
                          0,
                          300
                        )
                      )
                    }

                  </p>
                `

                : ""
            }


            ${
              item.link

                ? `
                  <a

                    href="${
                      escapeHtml(
                        item.link
                      )
                    }"

                    target="_blank"

                    rel="
                      noopener noreferrer
                    "

                  >

                    LER NOTÍCIA

                  </a>
                `

                : ""
            }

          </article>
        `
      )

      .join("");

}


/* =========================
   HOME
========================= */

function renderHome() {

  els.todayCount.textContent =
    `${state.games.length} jogo${
      state.games.length === 1
        ? ""
        : "s"
    }`;


  renderGames(

    els.homeGames,

    state.games,

    "Nenhum jogo encontrado",

    "Ainda não há partidas disponíveis para hoje."

  );

}


/* =========================
   AO VIVO
========================= */

function renderLive() {

  els.liveCount.textContent =
    `${state.live.length} partida${
      state.live.length === 1
        ? ""
        : "s"
    }`;


  renderGames(

    els.liveGames,

    state.live,

    "Nenhuma partida ao vivo",

    "Quando algum jogo começar ele aparece aqui."

  );

}


/* =========================
   FAVORITOS
========================= */

function renderFavorites() {

  const games =
    state.games.filter(
      game =>
        state.favorites.has(
          String(
            game.id
          )
        )
    );


  els.favoritesCount.textContent =
    `${games.length} jogo${
      games.length === 1
        ? ""
        : "s"
    }`;


  renderGames(

    els.favoriteGames,

    games,

    "Nenhum jogo escolhido",

    "Toque na estrela para acompanhar somente os jogos escolhidos."

  );

}


/* =========================
   LIGAS
========================= */

function renderLeagues() {

  const groups =
    groupGames(
      state.games
    );


  state.leagues =
    groups.map(
      group => ({

        name:
          group.league,

        country:
          group.country,

        games:
          group.games.length

      })
    );


  els.leaguesCount.textContent =
    `${state.leagues.length} liga${
      state.leagues.length === 1
        ? ""
        : "s"
    }`;


  if (
    !state.leagues.length
  ) {

    els.leaguesList.innerHTML = `
      <div
        class="empty-state"
      >

        <strong>
          Nenhuma liga encontrada
        </strong>

      </div>
    `;

    return;

  }


  els.leaguesList.innerHTML =
    state.leagues

      .map(
        league => `
          <div
            class="league-card"
          >

            <div>

              <strong>
                ${escapeHtml(
                  league.name
                )}
              </strong>

              <small>
                ${escapeHtml(
                  league.country
                )}
              </small>

            </div>


            <span
              class="count"
            >

              ${league.games}

            </span>

          </div>
        `
      )

      .join("");

}


/* =========================
   RENDER GERAL
========================= */

function renderAll() {

  renderPregame();

  renderHome();

  renderLive();

  renderFavorites();

  renderLeagues();

  renderNews();

}


/* =========================
   API
========================= */

async function request(path) {

  const response =
    await fetch(
      `${API_BASE}${path}`,
      {

        headers: {

          Accept:
            "application/json"

        }

      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Erro ${response.status}`
    );

  }


  return response.json();

}


/* =========================
   CARREGAR JOGOS
========================= */

async function loadGames() {

  const date =
    todayBR();


  const paths = [

    `/api/matches?date=${
      encodeURIComponent(date)
    }`,

    `/api/rpf/candidatos?date=${
      encodeURIComponent(date)
    }`

  ];


  let lastError =
    null;


  for (
    const path of paths
  ) {

    try {

      const data =
        await request(path);


      const array =
        extractArray(data);


      if (
        array.length
      ) {

        state.games =
          array.map(
            normalizeGame
          );


        state.live =
          state.games.filter(
            isLive
          );


        return;

      }

    } catch (error) {

      lastError =
        error;

    }

  }


  state.games = [];

  state.live = [];


  if (lastError) {

    throw lastError;

  }

}


/* =========================
   CARREGAR NOTÍCIAS
========================= */

async function loadNews() {

  const paths = [

    "/api/rpf/noticias",

    "/api/noticias",

    "/api/news",

    "/api/rpf/agora"

  ];


  for (
    const path of paths
  ) {

    try {

      const data =
        await request(path);


      const array =
        extractArray(data);


      if (
        array.length
      ) {

        state.news =
          array.map(
            normalizeNews
          );


        return;

      }

    } catch {}

  }


  state.news = [];

}


/* =========================
   ATUALIZAÇÃO
========================= */

async function refreshAll(
  showLoading = true
) {

  try {

    if (
      showLoading
    ) {

      els.refreshBtn.textContent =
        "…";


      els.refreshBtn.disabled =
        true;

    }


    await Promise.all([

      loadGames(),

      loadNews()

    ]);


    renderAll();


    checkFavoriteNotifications();

  } catch (error) {

    console.error(
      error
    );


    els.homeGames.innerHTML = `
      <div
        class="empty-state"
      >

        <strong>
          Não foi possível carregar os jogos
        </strong>

        <span>
          ${escapeHtml(
            error.message
          )}
        </span>

      </div>
    `;

  } finally {

    els.refreshBtn.textContent =
      "↻";


    els.refreshBtn.disabled =
      false;

  }

}


/* =========================
   FAVORITOS
========================= */

function saveFavorites() {

  localStorage.setItem(

    "m-esportes-favorites",

    JSON.stringify(
      [
        ...state.favorites
      ]
    )

  );

}


function toggleFavorite(id) {

  id =
    String(id);


  if (
    state.favorites.has(id)
  ) {

    state.favorites.delete(id);

  } else {

    state.favorites.add(id);

  }


  saveFavorites();


  renderAll();

}


/* =========================
   NOTIFICAÇÕES
========================= */

function saveNotified() {

  localStorage.setItem(

    "m-esportes-notified",

    JSON.stringify(
      state.notified
    )

  );

}


function notificationKey(
  game,
  event
) {

  return `${game.id}:${event}`;

}


function alreadyNotified(
  game,
  event
) {

  return Boolean(

    state.notified[
      notificationKey(
        game,
        event
      )
    ]

  );

}


function markNotified(
  game,
  event
) {

  state.notified[
    notificationKey(
      game,
      event
    )
  ] = Date.now();


  saveNotified();

}


function notify(
  title,
  body
) {

  if (
    !(
      "Notification"
      in window
    )
  ) {

    return;

  }


  if (
    Notification.permission
    !==
    "granted"
  ) {

    return;

  }


  new Notification(
    title,
    {
      body
    }
  );

}


/* SOMENTE FAVORITOS */

function checkFavoriteNotifications() {

  for (
    const game of state.games
  ) {

    if (
      !state.favorites.has(
        String(
          game.id
        )
      )
    ) {

      continue;

    }


    const fixture =
      `${game.home} x ${game.away}`;


    if (

      game.status === "1H"

      &&

      !alreadyNotified(
        game,
        "start"
      )

    ) {

      notify(

        "⚽ JOGO INICIADO",

        fixture

      );


      markNotified(
        game,
        "start"
      );

    }


    if (

      game.status === "HT"

      &&

      !alreadyNotified(
        game,
        "halftime"
      )

    ) {

      notify(

        "⏸️ INTERVALO",

        `${fixture} • ${
          scoreValue(
            game.hs
          )
        } x ${
          scoreValue(
            game.as
          )
        }`

      );


      markNotified(
        game,
        "halftime"
      );

    }


    if (

      game.status === "FT"

      &&

      !alreadyNotified(
        game,
        "finish"
      )

    ) {

      notify(

        "🏁 FIM DE JOGO",

        `${fixture} • ${
          scoreValue(
            game.hs
          )
        } x ${
          scoreValue(
            game.as
          )
        }`

      );


      markNotified(
        game,
        "finish"
      );

    }

  }

}


async function requestNotifications() {

  if (
    !(
      "Notification"
      in window
    )
  ) {

    alert(
      "Este navegador não oferece notificações."
    );

    return;

  }


  const permission =
    await Notification
      .requestPermission();


  if (
    permission ===
    "granted"
  ) {

    els.notificationBtn.textContent =
      "NOTIFICAÇÕES ATIVADAS";

  } else {

    els.notificationBtn.textContent =
      "PERMISSÃO NÃO CONCEDIDA";

  }

}


/* =========================
   NAVEGAÇÃO
========================= */

function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      ".nav-item"
    );


  for (
    const button of buttons
  ) {

    button.addEventListener(

      "click",

      () => {

        const page =
          button.dataset.page;


        document
          .querySelectorAll(
            ".nav-item"
          )
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


        document
          .querySelectorAll(
            ".page"
          )
          .forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


        button
          .classList
          .add(
            "active"
          );


        document
          .getElementById(
            `page-${page}`
          )
          ?.classList
          .add(
            "active"
          );

      }

    );

  }

}


/* =========================
   CLIQUES
========================= */

document.addEventListener(

  "click",

  event => {

    const button =
      event.target.closest(
        "[data-favorite]"
      );


    if (button) {

      toggleFavorite(
        button.dataset.favorite
      );

    }

  }

);


els.refreshBtn
  .addEventListener(

    "click",

    () =>
      refreshAll(true)

  );


els.notificationBtn
  .addEventListener(

    "click",

    requestNotifications

  );


/* =========================
   INICIAR
========================= */

setupNavigation();


refreshAll(true);


setInterval(

  () =>
    refreshAll(false),

  20000

);
