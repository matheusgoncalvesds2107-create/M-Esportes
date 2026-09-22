const API_BASE = "https://radioplacar-api.onrender.com";

const state = {
  games: [],
  live: [],
  leagues: [],
  news: [],

  favorites: new Set(
    JSON.parse(
      localStorage.getItem("m-esportes-favorites") || "[]"
    )
  ),

  notified: JSON.parse(
    localStorage.getItem("m-esportes-notified") || "{}"
  ),

  clocks: {},
  previousScores: {},
  scoreSystemStarted: false,
  goalAudioUnlocked: false,

  serviceWorkerRegistration: null
};


/* =========================================================
   ÁUDIO DE GOL RPF
========================================================= */

const goalAudio = new Audio(
  "./audio/gol-rpf.mp3"
);

goalAudio.preload = "auto";
goalAudio.volume = 1;


/* =========================================================
   ELEMENTOS
========================================================= */

const els = {
  homeGames: document.getElementById("homeGames"),
  liveGames: document.getElementById("liveGames"),
  favoriteGames: document.getElementById("favoriteGames"),
  leaguesList: document.getElementById("leaguesList"),
  newsList: document.getElementById("newsList"),
  pregameCard: document.getElementById("pregameCard"),

  todayCount: document.getElementById("todayCount"),
  liveCount: document.getElementById("liveCount"),
  favoritesCount: document.getElementById("favoritesCount"),
  leaguesCount: document.getElementById("leaguesCount"),

  refreshBtn: document.getElementById("refreshBtn"),
  notificationBtn: document.getElementById("notificationBtn")
};


/* =========================================================
   SERVICE WORKER
========================================================= */

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "Service Worker não suportado neste navegador."
    );

    return null;
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        "./sw.js",
        {
          scope: "./"
        }
      );

    await navigator.serviceWorker.ready;

    state.serviceWorkerRegistration =
      registration;

    console.log(
      "M Esportes Service Worker ativo.",
      registration.scope
    );

    return registration;

  } catch (error) {
    console.error(
      "Erro ao registrar Service Worker:",
      error
    );

    return null;
  }
}


/* =========================================================
   AUXILIARES
========================================================= */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function first(...values) {
  for (const value of values) {
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
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}

function pad2(value) {
  return String(value).padStart(2, "0");
}


/* =========================================================
   HORÁRIO
========================================================= */

function formatMatchTime(dateRaw) {
  if (!dateRaw) {
    return "--:--";
  }

  try {
    const date = new Date(dateRaw);

    if (Number.isNaN(date.getTime())) {
      return "--:--";
    }

    return date.toLocaleTimeString(
      "pt-BR",
      {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
    );

  } catch {
    return "--:--";
  }
}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();

  if (
    value === "1h" ||
    value === "1st_half" ||
    value === "first_half" ||
    value === "live" ||
    value === "inprogress" ||
    value === "in_progress" ||
    value === "firsthalf"
  ) {
    return "1H";
  }

  if (
    value === "ht" ||
    value === "halftime" ||
    value === "half_time" ||
    value === "half-time" ||
    value.includes("interval")
  ) {
    return "HT";
  }

  if (
    value === "2h" ||
    value === "2nd_half" ||
    value === "second_half" ||
    value === "secondhalf"
  ) {
    return "2H";
  }

  if (
    value === "ft" ||
    value === "finished" ||
    value === "ended" ||
    value === "final" ||
    value === "fulltime" ||
    value.includes("encerr")
  ) {
    return "FT";
  }

  if (
    value === "ns" ||
    value === "scheduled" ||
    value === "not_started" ||
    value === "notstarted"
  ) {
    return "NS";
  }

  return "NS";
}


/* =========================================================
   NORMALIZAR JOGO
========================================================= */

function normalizeGame(game) {
  const homeId = first(
    game.teams?.home?.id,
    game.home?.id,
    game.home_team?.id,
    game.home_team_id
  );

  const awayId = first(
    game.teams?.away?.id,
    game.away?.id,
    game.away_team?.id,
    game.away_team_id
  );

  const rawStatus = first(
    game.status?.short,
    game.fixture?.status?.short,
    game.status,
    game.state,
    game.match_status
  );

  const dateRaw = first(
    game.event_date,
    game.fixture?.date,
    game.date,
    game.start_time,
    game.kickoff,
    game.datetime
  );

  let start = first(
    game.time,
    game.fixture?.time,
    game.hour,
    null
  );

  if (!start && dateRaw) {
    start = formatMatchTime(dateRaw);
  }

  return {
    id: String(
      first(
        game.id,
        game.fixture?.id,
        `${homeId || "h"}-${awayId || "a"}-${dateRaw || ""}`
      )
    ),

    league: first(
      game.league?.name,
      game.competition?.name,
      game.league_name,
      game.championship,
      game.league,
      "Campeonato"
    ),

    country: first(
      game.league?.country,
      game.country?.name,
      game.country,
      game.region,
      "Internacional"
    ),

    home: first(
      game.teams?.home?.name,
      game.home?.name,
      game.home_team?.name,
      game.home_team,
      "Mandante"
    ),

    away: first(
      game.teams?.away?.name,
      game.away?.name,
      game.away_team?.name,
      game.away_team,
      "Visitante"
    ),

    homeId,
    awayId,

    homeLogo: first(
      game.teams?.home?.logo,
      game.home?.logo,
      game.home_team?.logo,
      game.home_logo,
      homeId
        ? `${API_BASE}/api/team-logo/${homeId}`
        : null
    ),

    awayLogo: first(
      game.teams?.away?.logo,
      game.away?.logo,
      game.away_team?.logo,
      game.away_logo,
      awayId
        ? `${API_BASE}/api/team-logo/${awayId}`
        : null
    ),

    hs: first(
      game.goals?.home,
      game.score?.home,
      game.home_score,
      game.score_home
    ),

    as: first(
      game.goals?.away,
      game.score?.away,
      game.away_score,
      game.score_away
    ),

    minute: first(
      game.current_minute,
      game.minute,
      game.elapsed,
      game.status?.elapsed,
      game.fixture?.status?.elapsed
    ),

    status: normalizeStatus(rawStatus),

    start: start || "--:--",

    date: dateRaw,

    raw: game
  };
}


/* =========================================================
   EXTRAIR ARRAY
========================================================= */

function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of [
    "response",
    "matches",
    "games",
    "fixtures",
    "results",
    "data"
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}


/* =========================================================
   PARTIDAS
========================================================= */

function isLive(game) {
  return [
    "1H",
    "HT",
    "2H"
  ].includes(game.status);
}

function numericScore(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function scoreValue(value, game = null) {
  if (
    game &&
    game.status === "NS" &&
    (
      value === null ||
      value === undefined ||
      value === ""
    )
  ) {
    return 0;
  }

  return value === null ||
    value === undefined ||
    value === ""
    ? "-"
    : value;
}


/* =========================================================
   RELÓGIO
========================================================= */

function syncGameClock(game) {
  const id = String(game.id);

  if (
    game.status === "HT" ||
    game.status === "FT" ||
    game.status === "NS"
  ) {
    delete state.clocks[id];

    return;
  }

  if (
    !["1H", "2H"].includes(
      game.status
    )
  ) {
    return;
  }

  const minute =
    Number(game.minute);

  if (!Number.isFinite(minute)) {
    return;
  }

  const old =
    state.clocks[id];

  if (
    !old ||
    old.apiMinute !== minute ||
    old.status !== game.status
  ) {
    state.clocks[id] = {
      apiMinute: minute,
      status: game.status,
      syncedAt: Date.now()
    };
  }
}

function syncAllClocks() {
  for (const game of state.games) {
    syncGameClock(game);
  }
}

function getGameClock(game) {
  if (game.status === "HT") {
    return "INTERVALO";
  }

  if (game.status === "FT") {
    return "ENCERRADO";
  }

  if (game.status === "NS") {
    return game.start || "--:--";
  }

  if (
    !["1H", "2H"].includes(
      game.status
    )
  ) {
    return game.start || "--:--";
  }

  const clock =
    state.clocks[String(game.id)];

  if (!clock) {
    return game.status === "1H"
      ? "1º TEMPO"
      : "2º TEMPO";
  }

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          clock.syncedAt
        ) / 1000
      )
    );

  const totalSeconds =
    clock.apiMinute * 60 +
    elapsedSeconds;

  const minute =
    Math.floor(
      totalSeconds / 60
    );

  const second =
    totalSeconds % 60;

  return `${pad2(minute)}:${pad2(second)}`;
}

function periodText(game) {
  if (game.status === "1H") {
    return "1º TEMPO";
  }

  if (game.status === "HT") {
    return "INTERVALO";
  }

  if (game.status === "2H") {
    return "2º TEMPO";
  }

  if (game.status === "FT") {
    return "ENCERRADO";
  }

  return "PRÉ-JOGO";
}


/* =========================================================
   GOL RPF
========================================================= */

function unlockGoalAudio() {
  if (state.goalAudioUnlocked) {
    return;
  }

  try {
    const oldVolume =
      goalAudio.volume;

    goalAudio.volume = 0;
    goalAudio.currentTime = 0;

    const promise =
      goalAudio.play();

    if (promise) {
      promise
        .then(() => {
          goalAudio.pause();
          goalAudio.currentTime = 0;
          goalAudio.volume =
            oldVolume;

          state.goalAudioUnlocked =
            true;
        })
        .catch(() => {
          goalAudio.volume =
            oldVolume;
        });
    }

  } catch {
    // aguardando interação
  }
}

function playGoalRpf() {
  try {
    goalAudio.pause();
    goalAudio.currentTime = 0;
    goalAudio.volume = 1;

    goalAudio
      .play()
      .catch(error => {
        console.warn(
          "Áudio de gol bloqueado:",
          error
        );
      });

  } catch (error) {
    console.error(
      "Erro no gol RPF:",
      error
    );
  }
}


/* =========================================================
   DETECTOR DE GOL
========================================================= */

function initializeScoreMemory() {
  for (const game of state.games) {
    state.previousScores[
      String(game.id)
    ] = {
      home:
        numericScore(game.hs),

      away:
        numericScore(game.as)
    };
  }

  state.scoreSystemStarted =
    true;
}

function checkGoals() {
  for (const game of state.games) {
    const id =
      String(game.id);

    const home =
      numericScore(game.hs);

    const away =
      numericScore(game.as);

    const previous =
      state.previousScores[id];

    if (!previous) {
      state.previousScores[id] = {
        home,
        away
      };

      continue;
    }

    const homeGoal =
      home > previous.home;

    const awayGoal =
      away > previous.away;

    if (
      state.favorites.has(id) &&
      (
        homeGoal ||
        awayGoal
      )
    ) {
      playGoalRpf();

      const scoringTeam =
        homeGoal
          ? game.home
          : game.away;

      notify(
        "⚽ GOOOOOL!",
        `${scoringTeam} marcou! ${game.home} ${home} x ${away} ${game.away}`
      );
    }

    state.previousScores[id] = {
      home,
      away
    };
  }
}


/* =========================================================
   ESCUDOS
========================================================= */

function teamLogo(url, team) {
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
          team?.charAt(0) || "?"
        )}
      </span>
    `;
  }

  return `
    <span class="team-logo-fallback">
      ${escapeHtml(
        team?.charAt(0) || "?"
      )}
    </span>
  `;
}


/* =========================================================
   CARD
========================================================= */

function matchCard(game) {
  const favorite =
    state.favorites.has(
      String(game.id)
    );

  const live =
    ["1H", "2H"].includes(
      game.status
    );

  return `
    <div class="match-card">

      <div
        class="match-time ${live ? "live" : ""}"
      >
        ${
          live
            ? `
              <span
                class="status-pill"
                data-clock-id="${escapeHtml(game.id)}"
              >
                ${escapeHtml(
                  getGameClock(game)
                )}
              </span>
            `
            : escapeHtml(
                getGameClock(game)
              )
        }
      </div>

      <div class="teams">

        <div class="team">

          ${teamLogo(
            game.homeLogo,
            game.home
          )}

          <span class="team-name">
            ${escapeHtml(game.home)}
          </span>

        </div>

        <div class="team">

          ${teamLogo(
            game.awayLogo,
            game.away
          )}

          <span class="team-name">
            ${escapeHtml(game.away)}
          </span>

        </div>

      </div>

      <div class="score">

        <span>
          ${scoreValue(
            game.hs,
            game
          )}
        </span>

        <span>
          ${scoreValue(
            game.as,
            game
          )}
        </span>

      </div>

      <button
        class="favorite-btn ${favorite ? "active" : ""}"
        data-favorite="${escapeHtml(game.id)}"
        type="button"
      >
        ★
      </button>

    </div>
  `;
}


/* =========================================================
   AGRUPAMENTO
========================================================= */

function groupGames(games) {
  const map = new Map();

  for (const game of games) {
    const country =
      game.country ||
      "Internacional";

    const league =
      game.league ||
      "Campeonato";

    const key =
      `${country}|${league}`;

    if (!map.has(key)) {
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


/* =========================================================
   RENDER JOGOS
========================================================= */

function renderGames(
  container,
  games,
  emptyTitle,
  emptyText
) {
  if (!container) {
    return;
  }

  if (!games.length) {
    container.innerHTML = `
      <div class="empty-state">

        <strong>
          ${escapeHtml(emptyTitle)}
        </strong>

        <span>
          ${escapeHtml(emptyText)}
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    groupGames(games)
      .map(
        group => `
          <div class="league-group">

            <div class="league-header">

              <div class="league-name">

                <div class="league-country">
                  ${escapeHtml(group.country)}
                </div>

                <div class="league-title">
                  ${escapeHtml(group.league)}
                </div>

              </div>

              <span>
                ${group.games.length}
                jogo${group.games.length === 1 ? "" : "s"}
              </span>

            </div>

            ${group.games
              .map(matchCard)
              .join("")}

          </div>
        `
      )
      .join("");
}


/* =========================================================
   DESTAQUE
========================================================= */

function choosePregameGame() {
  if (!state.games.length) {
    return null;
  }

  return (
    state.games.find(
      game =>
        ["1H", "2H"].includes(
          game.status
        )
    ) ||

    state.games.find(
      game =>
        game.status === "HT"
    ) ||

    state.games.find(
      game =>
        game.status === "NS"
    ) ||

    state.games[0]
  );
}

function pregameLogo(url, team) {
  if (url) {
    return `
      <img
        src="${escapeHtml(url)}"
        alt="${escapeHtml(team)}"
        referrerpolicy="no-referrer"
      >
    `;
  }

  return `
    <div class="pregame-team-logo-fallback">
      ${escapeHtml(
        team?.charAt(0) || "?"
      )}
    </div>
  `;
}

function renderPregame() {
  if (!els.pregameCard) {
    return;
  }

  const game =
    choosePregameGame();

  if (!game) {
    els.pregameCard.innerHTML = `
      <div class="pregame-loading">
        Nenhum jogo disponível.
      </div>
    `;

    return;
  }

  const live =
    ["1H", "2H"].includes(
      game.status
    );

  let center = "";

  if (live) {
    center = `
      <div class="label">
        ${periodText(game)}
      </div>

      <div
        class="time"
        data-clock-id="${escapeHtml(game.id)}"
      >
        ${escapeHtml(
          getGameClock(game)
        )}
      </div>

      <div class="score-big">
        ${scoreValue(game.hs, game)}
        x
        ${scoreValue(game.as, game)}
      </div>
    `;

  } else if (
    game.status === "HT"
  ) {
    center = `
      <div class="label">
        INTERVALO
      </div>

      <div class="score-big">
        ${scoreValue(game.hs, game)}
        x
        ${scoreValue(game.as, game)}
      </div>
    `;

  } else if (
    game.status === "FT"
  ) {
    center = `
      <div class="label">
        ENCERRADO
      </div>

      <div class="score-big">
        ${scoreValue(game.hs, game)}
        x
        ${scoreValue(game.as, game)}
      </div>
    `;

  } else {
    center = `
      <div class="label">
        HORÁRIO
      </div>

      <div class="time">
        ${escapeHtml(game.start)}
      </div>

      <div class="score-big">
        0 x 0
      </div>
    `;
  }

  els.pregameCard.innerHTML = `
    <div class="pregame-top">

      <div>

        <div class="pregame-competition">
          ${escapeHtml(game.league)}
        </div>

        <div class="pregame-country">
          ${escapeHtml(game.country)}
        </div>

      </div>

      <div class="pregame-status">
        ${
          live
            ? "AO VIVO"
            : game.status === "HT"
              ? "INTERVALO"
              : game.status === "FT"
                ? "ENCERRADO"
                : "PRÉ-JOGO"
        }
      </div>

    </div>

    <div class="pregame-banner">
      M ESPORTES 3 MINUTOS • ESQUENTANDO O JOGO
    </div>

    <div class="pregame-match">

      <div class="pregame-team">

        ${pregameLogo(
          game.homeLogo,
          game.home
        )}

        <strong>
          ${escapeHtml(game.home)}
        </strong>

      </div>

      <div class="pregame-center">
        ${center}
      </div>

      <div class="pregame-team">

        ${pregameLogo(
          game.awayLogo,
          game.away
        )}

        <strong>
          ${escapeHtml(game.away)}
        </strong>

      </div>

    </div>
  `;
}


/* =========================================================
   M ESPORTES AGORA
========================================================= */

function createAutomaticNews() {
  const news = [];

  for (
    const game of state.games
      .filter(isLive)
      .slice(0, 3)
  ) {
    news.push({
      type: "AO VIVO AGORA",

      title:
        `${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`,

      summary:
        `${periodText(game)} • ${game.league}.`
    });
  }

  for (
    const game of state.games
      .filter(
        game =>
          game.status === "NS"
      )
      .slice(0, 3)
  ) {
    news.push({
      type: "PRÓXIMO JOGO",

      title:
        `${game.home} x ${game.away}`,

      summary:
        `${game.league} • começa às ${game.start}.`
    });
  }

  for (
    const game of state.games
      .filter(
        game =>
          game.status === "FT"
      )
      .slice(0, 3)
  ) {
    news.push({
      type: "FIM DE JOGO",

      title:
        `${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`,

      summary:
        `Partida encerrada por ${game.league}.`
    });
  }

  state.news =
    news.slice(0, 8);
}

function renderNews() {
  if (!els.newsList) {
    return;
  }

  els.newsList.innerHTML =
    state.news
      .map(
        item => `
          <article class="news-card">

            <div class="news-tag">
              🔴 ${escapeHtml(item.type)}
            </div>

            <h3>
              ${escapeHtml(item.title)}
            </h3>

            <p>
              ${escapeHtml(item.summary)}
            </p>

          </article>
        `
      )
      .join("");
}


/* =========================================================
   TELAS
========================================================= */

function renderHome() {
  if (els.todayCount) {
    els.todayCount.textContent =
      `${state.games.length} jogos`;
  }

  renderGames(
    els.homeGames,
    state.games,
    "Nenhum jogo",
    "Nenhuma partida disponível."
  );
}

function renderLive() {
  if (els.liveCount) {
    els.liveCount.textContent =
      `${state.live.length} partidas`;
  }

  renderGames(
    els.liveGames,
    state.live,
    "Nenhum jogo ao vivo",
    "Quando começar aparece aqui."
  );
}

function renderFavorites() {
  const games =
    state.games.filter(
      game =>
        state.favorites.has(
          String(game.id)
        )
    );

  if (els.favoritesCount) {
    els.favoritesCount.textContent =
      `${games.length} jogos`;
  }

  renderGames(
    els.favoriteGames,
    games,
    "Nenhum favorito",
    "Marque um jogo com ★."
  );
}

function renderLeagues() {
  const groups =
    groupGames(state.games);

  if (!els.leaguesList) {
    return;
  }

  els.leaguesList.innerHTML =
    groups
      .map(
        group => `
          <div class="league-card">

            <div>
              <strong>
                ${escapeHtml(group.league)}
              </strong>

              <small>
                ${escapeHtml(group.country)}
              </small>
            </div>

            <span class="count">
              ${group.games.length}
            </span>

          </div>
        `
      )
      .join("");
}

function renderAll() {
  renderPregame();
  renderHome();
  renderLive();
  renderFavorites();
  renderLeagues();
  renderNews();
}


/* =========================================================
   RELÓGIO VISUAL
========================================================= */

function updateVisibleClocks() {
  document
    .querySelectorAll(
      "[data-clock-id]"
    )
    .forEach(node => {
      const game =
        state.games.find(
          item =>
            String(item.id) ===
            String(
              node.dataset.clockId
            )
        );

      if (game) {
        node.textContent =
          getGameClock(game);
      }
    });
}


/* =========================================================
   API
========================================================= */

async function request(path) {
  const response =
    await fetch(
      `${API_BASE}${path}`
    );

  if (!response.ok) {
    throw new Error(
      `Erro ${response.status}`
    );
  }

  return response.json();
}

async function loadGames() {
  const date =
    todayBR();

  const data =
    await request(
      `/api/matches?date=${encodeURIComponent(date)}`
    );

  state.games =
    extractArray(data)
      .map(normalizeGame);

  state.live =
    state.games.filter(isLive);

  syncAllClocks();
}


/* =========================================================
   NOTIFICAÇÕES LOCAIS
========================================================= */

function notify(title, body) {
  if (
    !("Notification" in window)
  ) {
    return;
  }

  if (
    Notification.permission !==
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

function checkFavoriteNotifications() {
  /*
    Mantemos essa função por enquanto.

    No próximo passo, essas notificações
    vão sair do backend via PUSH.
  */
}


/* =========================================================
   ATUALIZAR
========================================================= */

async function refreshAll(
  showLoading = true
) {
  try {
    if (
      showLoading &&
      els.refreshBtn
    ) {
      els.refreshBtn.disabled =
        true;

      els.refreshBtn.textContent =
        "…";
    }

    await loadGames();

    if (
      !state.scoreSystemStarted
    ) {
      initializeScoreMemory();
    } else {
      checkGoals();
    }

    createAutomaticNews();

    renderAll();

  } catch (error) {
    console.error(error);

  } finally {
    if (els.refreshBtn) {
      els.refreshBtn.disabled =
        false;

      els.refreshBtn.textContent =
        "↻";
    }
  }
}


/* =========================================================
   FAVORITOS
========================================================= */

function saveFavorites() {
  localStorage.setItem(
    "m-esportes-favorites",
    JSON.stringify(
      [...state.favorites]
    )
  );
}

function toggleFavorite(id) {
  id = String(id);

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


/* =========================================================
   PERMISSÃO DE NOTIFICAÇÃO
========================================================= */

async function requestNotifications() {
  unlockGoalAudio();

  if (
    !("Notification" in window)
  ) {
    alert(
      "Seu navegador não suporta notificações."
    );

    return;
  }

  const permission =
    await Notification
      .requestPermission();

  if (
    permission === "granted"
  ) {
    if (
      !state.serviceWorkerRegistration
    ) {
      await registerServiceWorker();
    }

    if (els.notificationBtn) {
      els.notificationBtn.textContent =
        "NOTIFICAÇÕES ATIVADAS";
    }

    console.log(
      "Permissão concedida. Service Worker pronto para Push."
    );

  } else {
    if (els.notificationBtn) {
      els.notificationBtn.textContent =
        "NOTIFICAÇÕES BLOQUEADAS";
    }
  }
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {
  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          unlockGoalAudio();

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
            .add("active");

          document
            .getElementById(
              `page-${page}`
            )
            ?.classList
            .add("active");
        }
      );
    });
}


/* =========================================================
   CLIQUES
========================================================= */

document.addEventListener(
  "click",
  event => {
    unlockGoalAudio();

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

if (els.refreshBtn) {
  els.refreshBtn.addEventListener(
    "click",
    () =>
      refreshAll(true)
  );
}

if (els.notificationBtn) {
  els.notificationBtn.addEventListener(
    "click",
    requestNotifications
  );
}


/* =========================================================
   INICIAR
========================================================= */

setupNavigation();

/*
  Registra o sw.js assim que
  o M Esportes abre.
*/
registerServiceWorker();

refreshAll(true);


/*
  Relógio ao vivo.
*/
setInterval(
  updateVisibleClocks,
  1000
);


/*
  Atualização dos jogos.
*/
setInterval(
  () =>
    refreshAll(false),
  20000
);
