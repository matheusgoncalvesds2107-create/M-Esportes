const API_BASE =
  window.M_ESPORTES_API ||
  "https://SEU-BACKEND-AQUI.onrender.com";

const state = {
  games: [],
  live: [],
  leagues: [],
  news: [],
  favorites: new Set(
    JSON.parse(localStorage.getItem("m-esportes-favorites") || "[]")
  ),
  notified: JSON.parse(
    localStorage.getItem("m-esportes-notified") || "{}"
  )
};

const els = {
  homeGames: document.getElementById("homeGames"),
  liveGames: document.getElementById("liveGames"),
  favoriteGames: document.getElementById("favoriteGames"),
  leaguesList: document.getElementById("leaguesList"),
  newsList: document.getElementById("newsList"),

  todayCount: document.getElementById("todayCount"),
  liveCount: document.getElementById("liveCount"),
  favoritesCount: document.getElementById("favoritesCount"),
  leaguesCount: document.getElementById("leaguesCount"),

  refreshBtn: document.getElementById("refreshBtn"),
  notificationBtn: document.getElementById("notificationBtn")
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isLive(game) {
  return ["1H", "HT", "2H"].includes(game.status);
}

function statusText(game) {
  if (game.status === "1H") {
    return game.minute ? `${game.minute}'` : "1º TEMPO";
  }

  if (game.status === "HT") {
    return "INTERVALO";
  }

  if (game.status === "2H") {
    return game.minute ? `${game.minute}'` : "2º TEMPO";
  }

  if (game.status === "FT") {
    return "ENCERRADO";
  }

  return game.start || "--:--";
}

function scoreValue(value) {
  return value === null || value === undefined || value === ""
    ? "-"
    : value;
}

function teamLogo(url, team) {
  if (url) {
    return `
      <img
        class="team-logo"
        src="${escapeHtml(url)}"
        alt="${escapeHtml(team)}"
        loading="lazy"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='grid';
        "
      />

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

function matchCard(game) {
  const favorite = state.favorites.has(String(game.id));

  return `
    <div class="match-card">

      <div
        class="match-time ${isLive(game) ? "live" : ""}"
      >
        ${
          isLive(game)
            ? `<span class="status-pill">${escapeHtml(
                statusText(game)
              )}</span>`
            : escapeHtml(statusText(game))
        }
      </div>

      <div class="teams">

        <div class="team">
          ${teamLogo(game.homeLogo, game.home)}

          <span class="team-name">
            ${escapeHtml(game.home)}
          </span>
        </div>

        <div class="team">
          ${teamLogo(game.awayLogo, game.away)}

          <span class="team-name">
            ${escapeHtml(game.away)}
          </span>
        </div>

      </div>

      <div class="score">
        <span>${scoreValue(game.hs)}</span>
        <span>${scoreValue(game.as)}</span>
      </div>

      <button
        class="favorite-btn ${favorite ? "active" : ""}"
        data-favorite="${escapeHtml(game.id)}"
        type="button"
        aria-label="Favoritar"
      >
        ★
      </button>

    </div>
  `;
}

function groupGames(games) {
  const map = new Map();

  for (const game of games) {
    const country = game.country || "Internacional";
    const league = game.league || "Campeonato";
    const key = `${country}|${league}`;

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

function renderGames(container, games, emptyTitle, emptyText) {
  if (!games.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>${escapeHtml(emptyTitle)}</strong>
        <span>${escapeHtml(emptyText)}</span>
      </div>
    `;

    return;
  }

  const groups = groupGames(games);

  container.innerHTML = groups
    .map(
      (group) => `
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
              ${group.games.length} jogo${
                group.games.length === 1 ? "" : "s"
              }
            </span>
          </div>

          ${group.games.map(matchCard).join("")}

        </div>
      `
    )
    .join("");
}

function renderHome() {
  els.todayCount.textContent =
    `${state.games.length} jogo${state.games.length === 1 ? "" : "s"}`;

  renderGames(
    els.homeGames,
    state.games,
    "Nenhum jogo encontrado",
    "Ainda não há partidas disponíveis para hoje."
  );
}

function renderLive() {
  els.liveCount.textContent =
    `${state.live.length} partida${state.live.length === 1 ? "" : "s"}`;

  renderGames(
    els.liveGames,
    state.live,
    "Nenhuma partida ao vivo",
    "Quando algum jogo começar, ele aparece aqui."
  );
}

function renderFavorites() {
  const games = state.games.filter((game) =>
    state.favorites.has(String(game.id))
  );

  els.favoritesCount.textContent =
    `${games.length} jogo${games.length === 1 ? "" : "s"}`;

  renderGames(
    els.favoriteGames,
    games,
    "Nenhum favorito ainda",
    "Toque na estrela de uma partida para acompanhar."
  );
}

function renderLeagues() {
  els.leaguesCount.textContent =
    `${state.leagues.length} liga${state.leagues.length === 1 ? "" : "s"}`;

  if (!state.leagues.length) {
    els.leaguesList.innerHTML = `
      <div class="empty-state">
        <strong>Nenhuma liga encontrada</strong>
        <span>
          As competições aparecerão aqui quando houver jogos.
        </span>
      </div>
    `;

    return;
  }

  els.leaguesList.innerHTML = state.leagues
    .map(
      (league) => `
        <div class="league-card">
          <div>
            <strong>
              ${escapeHtml(league.name || "Campeonato")}
            </strong>

            <small>
              ${escapeHtml(league.country || "Internacional")}
            </small>
          </div>

          <span class="count">
            ${Number(league.games || 0)}
          </span>
        </div>
      `
    )
    .join("");
}

function renderNews() {
  if (!state.news.length) {
    els.newsList.innerHTML = `
      <div class="empty-state">
        <strong>Notícias ainda não configuradas</strong>
        <span>
          Os resultados já funcionam. Depois vamos ligar as notícias.
        </span>
      </div>
    `;

    return;
  }

  els.newsList.innerHTML = state.news
    .map(
      (item) => `
        <article class="news-card">

          <div class="news-tag">
            ${escapeHtml(item.tag || "M ESPORTES")}
          </div>

          <h3>
            ${escapeHtml(item.title || "")}
          </h3>

          ${
            item.summary
              ? `
                <p>
                  ${escapeHtml(item.summary)}
                </p>
              `
              : ""
          }

          ${
            item.link
              ? `
                <a
                  href="${escapeHtml(item.link)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ler notícia
                </a>
              `
              : ""
          }

        </article>
      `
    )
    .join("");
}

function renderAll() {
  renderHome();
  renderLive();
  renderFavorites();
  renderLeagues();
  renderNews();
}

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(
      `Erro ${response.status} ao acessar ${path}`
    );
  }

  return response.json();
}

async function loadGames() {
  const data = await request("/api/games/today");

  state.games = Array.isArray(data.response)
    ? data.response
    : [];
}

async function loadLive() {
  try {
    const data = await request("/api/live");

    state.live = Array.isArray(data.response)
      ? data.response
      : [];
  } catch {
    state.live = state.games.filter(isLive);
  }
}

async function loadLeagues() {
  try {
    const data = await request("/api/leagues");

    state.leagues = Array.isArray(data.response)
      ? data.response
      : [];
  } catch {
    const groups =
