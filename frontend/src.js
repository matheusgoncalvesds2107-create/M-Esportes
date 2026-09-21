const API_BASE = "https://radioplacar-api.onrender.com";

const state = {
  games: [],
  live: [],
  leagues: [],
  news: [],
  journeys: [],

  favorites: new Set(
    JSON.parse(
      localStorage.getItem("m-esportes-favorites") || "[]"
    )
  ),

  notified: JSON.parse(
    localStorage.getItem("m-esportes-notified") || "{}"
  ),

  /*
    Relógio local entre uma atualização
    da API e outra.

    Exemplo:
    API envia minuto 68.
    O app começa em 68:00 e corre
    68:01, 68:02...
  */
  clocks: {}
};


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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function pad2(value) {
  return String(value).padStart(2, "0");
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
    value === "in_progress"
  ) {
    return "1H";
  }

  if (
    value === "ht" ||
    value === "halftime" ||
    value === "half_time" ||
    value.includes("interval")
  ) {
    return "HT";
  }

  if (
    value === "2h" ||
    value === "2nd_half" ||
    value === "second_half"
  ) {
    return "2H";
  }

  if (
    value === "ft" ||
    value === "finished" ||
    value === "ended" ||
    value === "final" ||
    value.includes("encerr")
  ) {
    return "FT";
  }

  if (
    value === "ns" ||
    value === "scheduled" ||
    value === "not_started"
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

  let start = first(
    game.time,
    game.fixture?.time,
    game.hour,
    null
  );

  /*
    Se a API entregar data completa,
    tenta converter para horário do Brasil.
  */
  const dateRaw = first(
    game.date,
    game.fixture?.date,
    game.start_time,
    game.kickoff,
    game.datetime
  );

  if (!start && dateRaw) {
    try {
      start = new Date(dateRaw)
        .toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit"
        });
    } catch {
      start = "--:--";
    }
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

    homeLogo: first(
      game.teams?.home?.logo,
      game.home?.logo,
      game.home_team?.logo,
      game.home_logo,
      game.team_home_logo,
      game.logo_home,
      game.home_team_logo
    ),

    awayLogo: first(
      game.teams?.away?.logo,
      game.away?.logo,
      game.away_team?.logo,
      game.away_logo,
      game.team_away_logo,
      game.logo_away,
      game.away_team_logo
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
    "data",
    "news",
    "noticias"
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.response?.data)) {
    return data.response.data;
  }

  return [];
}


/* =========================================================
   PARTIDAS
========================================================= */

function isLive(game) {
  return ["1H", "HT", "2H"].includes(game.status);
}

function scoreValue(value) {
  return value === null ||
    value === undefined ||
    value === ""
    ? "-"
    : value;
}


/* =========================================================
   RELÓGIO AO VIVO
========================================================= */

function syncGameClock(game) {
  const id = String(game.id);

  /*
    Intervalo / encerrado não precisam
    de relógio correndo.
  */
  if (
    game.status === "HT" ||
    game.status === "FT" ||
    game.status === "NS"
  ) {
    delete state.clocks[id];
    return;
  }

  if (!["1H", "2H"].includes(game.status)) {
    return;
  }

  const minute = Number(game.minute);

  /*
    Se a API não trouxe minuto real,
    não inventamos a contagem.
  */
  if (!Number.isFinite(minute)) {
    return;
  }

  const old = state.clocks[id];

  /*
    Se mudou minuto ou status,
    sincroniza de novo com a API.
  */
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

  if (!["1H", "2H"].includes(game.status)) {
    return game.start || "--:--";
  }

  const clock =
    state.clocks[String(game.id)];

  /*
    Sem minuto real da API:
    mostra período, não cria relógio falso.
  */
  if (!clock) {
    return game.status === "1H"
      ? "1º TEMPO"
      : "2º TEMPO";
  }

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() - clock.syncedAt) / 1000
      )
    );

  const totalSeconds =
    clock.apiMinute * 60 +
    elapsedSeconds;

  const minute =
    Math.floor(totalSeconds / 60);

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

  return "AGENDADO";
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
        ${escapeHtml(team?.charAt(0) || "?")}
      </span>
    `;
  }

  return `
    <span class="team-logo-fallback">
      ${escapeHtml(team?.charAt(0) || "?")}
    </span>
  `;
}


/* =========================================================
   CARD JOGO
========================================================= */

function matchCard(game) {
  const favorite =
    state.favorites.has(
      String(game.id)
    );

  const live =
    ["1H", "2H"].includes(game.status);

  return `
    <div
      class="match-card"
      data-game-id="${escapeHtml(game.id)}"
    >

      <div
        class="match-time ${live ? "live" : ""}"
      >

        ${
          live
            ? `
              <span
                class="status-pill live-clock"
                data-clock-id="${escapeHtml(game.id)}"
              >
                ${escapeHtml(getGameClock(game))}
              </span>
            `
            : escapeHtml(getGameClock(game))
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
          ${scoreValue(game.hs)}
        </span>

        <span>
          ${scoreValue(game.as)}
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
   AGRUPAR POR CAMPEONATO
========================================================= */

function groupGames(games) {
  const map = new Map();

  for (const game of games) {
    const country =
      game.country || "Internacional";

    const league =
      game.league || "Campeonato";

    const key =
      `${country}|${league}`;

    if (!map.has(key)) {
      map.set(key, {
        country,
        league,
        games: []
      });
    }

    map.get(key).games.push(game);
  }

  return [...map.values()];
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

            ${group.games.map(matchCard).join("")}

          </div>
        `
      )
      .join("");
}


/* =========================================================
   ESQUENTANDO O JOGO
========================================================= */

function choosePregameGame() {
  if (!state.games.length) {
    return null;
  }

  const liveGame =
    state.games.find(game =>
      ["1H", "2H"].includes(game.status)
    );

  if (liveGame) {
    return liveGame;
  }

  const halftime =
    state.games.find(game =>
      game.status === "HT"
    );

  if (halftime) {
    return halftime;
  }

  const upcoming =
    state.games.find(game =>
      game.status === "NS"
    );

  if (upcoming) {
    return upcoming;
  }

  return state.games[0];
}

function pregameLogo(url, team) {
  if (url) {
    return `
      <img
        src="${escapeHtml(url)}"
        alt="${escapeHtml(team)}"
        referrerpolicy="no-referrer"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='grid';
        "
      >

      <div
        class="pregame-team-logo-fallback"
        style="display:none"
      >
        ${escapeHtml(team?.charAt(0) || "?")}
      </div>
    `;
  }

  return `
    <div class="pregame-team-logo-fallback">
      ${escapeHtml(team?.charAt(0) || "?")}
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
        Nenhum jogo disponível para destaque.
      </div>
    `;

    return;
  }

  const live =
    ["1H", "2H"].includes(game.status);

  const halftime =
    game.status === "HT";

  const finished =
    game.status === "FT";

  let center = "";

  if (live) {
    center = `
      <div class="label">
        ${escapeHtml(periodText(game))}
      </div>

      <div
        class="time live-clock"
        data-clock-id="${escapeHtml(game.id)}"
      >
        ${escapeHtml(getGameClock(game))}
      </div>

      <div class="score-big">
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
      </div>
    `;
  } else if (halftime) {
    center = `
      <div class="label">
        INTERVALO
      </div>

      <div class="score-big">
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
      </div>
    `;
  } else if (finished) {
    center = `
      <div class="label">
        ENCERRADO
      </div>

      <div class="score-big">
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
      </div>
    `;
  } else {
    center = `
      <div class="label">
        HORÁRIO
      </div>

      <div class="time">
        ${escapeHtml(game.start || "--:--")}
      </div>

      <div class="pregame-country">
        INÍCIO DA PARTIDA
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
            : halftime
              ? "INTERVALO"
              : finished
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

    <div class="pregame-highlight">

      <small>
        DESTAQUE M ESPORTES
      </small>

      <h3>
        ${escapeHtml(game.home)}
        x
        ${escapeHtml(game.away)}
      </h3>

      <p>
        ${escapeHtml(game.league)}
        • acompanhe horário, relógio,
        placar e status da partida.
      </p>

    </div>
  `;
}


/* =========================================================
   M ESPORTES AGORA
========================================================= */

function createAutomaticNews() {
  const news = [];

  /*
    JORNADAS RPF
  */

  for (
    const journey of state.journeys.slice(0, 2)
  ) {
    const title = first(
      journey.title,
      journey.name,
      journey.match,
      journey.fixture,
      "Jornada esportiva RPF ativa"
    );

    news.push({
      type: "JORNADA RPF",
      title,
      summary:
        "O Motor RPF está com uma jornada esportiva ativa neste momento."
    });
  }


  /*
    AO VIVO
  */

  const liveGames =
    state.games.filter(game =>
      ["1H", "2H"].includes(game.status)
    );

  for (
    const game of liveGames.slice(0, 3)
  ) {
    news.push({
      type: "AO VIVO AGORA",

      title:
        `${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`,

      summary:
        `${periodText(game)} • ${game.league}.`
    });
  }


  /*
    INTERVALO
  */

  const halftimeGames =
    state.games.filter(
      game =>
        game.status === "HT"
    );

  for (
    const game of halftimeGames.slice(0, 2)
  ) {
    news.push({
      type: "INTERVALO",

      title:
        `${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`,

      summary:
        `Fim do primeiro tempo em ${game.league}.`
    });
  }


  /*
    PRÓXIMOS
  */

  const upcomingGames =
    state.games.filter(
      game =>
        game.status === "NS"
    );

  for (
    const game of upcomingGames.slice(0, 3)
  ) {
    news.push({
      type: "PRÓXIMO JOGO",

      title:
        `${game.home} x ${game.away}`,

      summary:
        `${game.league} • começa às ${game.start || "--:--"}.`
    });
  }


  /*
    ENCERRADOS
  */

  const finishedGames =
    state.games.filter(
      game =>
        game.status === "FT"
    );

  for (
    const game of finishedGames.slice(0, 3)
  ) {
    news.push({
      type: "FIM DE JOGO",

      title:
        `${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`,

      summary:
        `Partida encerrada por ${game.league}.`
    });
  }


  /*
    GIRO DO DIA
  */

  if (state.games.length) {
    const championships =
      groupGames(state.games).length;

    news.push({
      type: "GIRO DO DIA",

      title:
        `${state.games.length} jogos no M Esportes hoje`,

      summary:
        `${championships} campeonato${championships === 1 ? "" : "s"} com partidas disponíveis no placar.`
    });
  }


  if (!news.length) {
    news.push({
      type: "M ESPORTES AGORA",

      title:
        "Plantão esportivo em atualização",

      summary:
        "Assim que houver partidas ou jornadas do RPF, as informações aparecem aqui automaticamente."
    });
  }

  state.news =
    news.slice(0, 8);
}


/* =========================================================
   RENDER NOTÍCIAS
========================================================= */

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
   HOME
========================================================= */

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


/* =========================================================
   AO VIVO
========================================================= */

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


/* =========================================================
   FAVORITOS
========================================================= */

function renderFavorites() {
  const games =
    state.games.filter(
      game =>
        state.favorites.has(
          String(game.id)
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


/* =========================================================
   LIGAS
========================================================= */

function renderLeagues() {
  const groups =
    groupGames(state.games);

  state.leagues =
    groups.map(
      group => ({
        name: group.league,
        country: group.country,
        games: group.games.length
      })
    );

  els.leaguesCount.textContent =
    `${state.leagues.length} liga${
      state.leagues.length === 1
        ? ""
        : "s"
    }`;

  if (!state.leagues.length) {
    els.leaguesList.innerHTML = `
      <div class="empty-state">
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
          <div class="league-card">

            <div>

              <strong>
                ${escapeHtml(league.name)}
              </strong>

              <small>
                ${escapeHtml(league.country)}
              </small>

            </div>

            <span class="count">
              ${league.games}
            </span>

          </div>
        `
      )
      .join("");
}


/* =========================================================
   RENDER GERAL
========================================================= */

function renderAll() {
  renderPregame();
  renderHome();
  renderLive();
  renderFavorites();
  renderLeagues();
  renderNews();
}


/* =========================================================
   ATUALIZAR SOMENTE RELÓGIOS
========================================================= */

function updateVisibleClocks() {
  const nodes =
    document.querySelectorAll(
      "[data-clock-id]"
    );

  for (const node of nodes) {
    const id =
      node.dataset.clockId;

    const game =
      state.games.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (!game) {
      continue;
    }

    node.textContent =
      getGameClock(game);
  }
}


/* =========================================================
   API
========================================================= */

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

  if (!response.ok) {
    throw new Error(
      `Erro ${response.status}`
    );
  }

  return response.json();
}


/* =========================================================
   CARREGAR JOGOS
========================================================= */

async function loadGames() {
  const date =
    todayBR();

  const paths = [
    `/api/matches?date=${encodeURIComponent(date)}`,
    `/api/rpf/candidatos?date=${encodeURIComponent(date)}`
  ];

  let lastError = null;

  for (const path of paths) {
    try {
      const data =
        await request(path);

      const array =
        extractArray(data);

      if (array.length) {
        state.games =
          array.map(
            normalizeGame
          );

        state.live =
          state.games.filter(
            isLive
          );

        /*
          Sincroniza os relógios com
          o minuto real recebido.
        */
        syncAllClocks();

        return;
      }
    } catch (error) {
      lastError = error;
    }
  }

  state.games = [];
  state.live = [];

  if (lastError) {
    throw lastError;
  }
}


/* =========================================================
   CARREGAR JORNADAS
========================================================= */

async function loadJourneys() {
  try {
    const data =
      await request(
        "/api/rpf/jornadas"
      );

    state.journeys =
      extractArray(data);
  } catch {
    state.journeys = [];
  }
}


/* =========================================================
   ATUALIZAÇÃO
========================================================= */

async function refreshAll(
  showLoading = true
) {
  try {
    if (showLoading) {
      els.refreshBtn.textContent =
        "…";

      els.refreshBtn.disabled =
        true;
    }

    await Promise.all([
      loadGames(),
      loadJourneys()
    ]);

    createAutomaticNews();

    renderAll();

    checkFavoriteNotifications();
  } catch (error) {
    console.error(error);

    els.homeGames.innerHTML = `
      <div class="empty-state">

        <strong>
          Não foi possível carregar os jogos
        </strong>

        <span>
          ${escapeHtml(error.message)}
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


/* =========================================================
   NOTIFICAÇÕES
   SOMENTE FAVORITOS
========================================================= */

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
  for (
    const game of state.games
  ) {
    /*
      Se não está marcado com estrela,
      NÃO NOTIFICA.
    */

    if (
      !state.favorites.has(
        String(game.id)
      )
    ) {
      continue;
    }

    const fixture =
      `${game.home} x ${game.away}`;

    /*
      INÍCIO
    */

    if (
      game.status === "1H" &&
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


    /*
      INTERVALO
    */

    if (
      game.status === "HT" &&
      !alreadyNotified(
        game,
        "halftime"
      )
    ) {
      notify(
        "⏸️ INTERVALO",
        `${fixture} • ${scoreValue(game.hs)} x ${scoreValue(game.as)}`
      );

      markNotified(
        game,
        "halftime"
      );
    }


    /*
      FIM
    */

    if (
      game.status === "FT" &&
      !alreadyNotified(
        game,
        "finish"
      )
    ) {
      notify(
        "🏁 FIM DE JOGO",
        `${fixture} • ${scoreValue(game.hs)} x ${scoreValue(game.as)}`
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
    !("Notification" in window)
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
    permission === "granted"
  ) {
    els.notificationBtn.textContent =
      "NOTIFICAÇÕES ATIVADAS";
  } else {
    els.notificationBtn.textContent =
      "PERMISSÃO NÃO CONCEDIDA";
  }
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

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


/* =========================================================
   CLIQUES
========================================================= */

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

els.refreshBtn.addEventListener(
  "click",
  () =>
    refreshAll(true)
);

els.notificationBtn.addEventListener(
  "click",
  requestNotifications
);


/* =========================================================
   INICIAR
========================================================= */

setupNavigation();

refreshAll(true);


/*
  Atualiza APENAS o relógio visual
  uma vez por segundo.
*/
setInterval(
  updateVisibleClocks,
  1000
);


/*
  A cada 20 segundos consulta o RPF
  de novo e sincroniza minuto,
  placar e status reais.
*/
setInterval(
  () =>
    refreshAll(false),
  20000
);
