/* =========================================================
   M ESPORTES
   FRONTEND PRINCIPAL
========================================================= */

const API_BASE = "https://radioplacar-api.onrender.com";

/* =========================================================
   ESTADO
========================================================= */

const state = {
  games: [],
  live: [],
  news: [],

  favorites: new Set(
    JSON.parse(
      localStorage.getItem("m-esportes-favorites") || "[]"
    )
  ),

  previousScores: {},

  scoreSystemStarted: false,

  clocks: {},

  goalAudioUnlocked: false,

  serviceWorkerRegistration: null,

  currentRadio: null
};


/* =========================================================
   PREFERÊNCIAS DE ALERTA
========================================================= */

const alertDefaults = {
  goal: true,
  start: true,
  halftime: true,
  final: true
};

function loadAlertSettings() {
  try {
    return {
      ...alertDefaults,
      ...JSON.parse(
        localStorage.getItem("m-esportes-alerts") || "{}"
      )
    };
  } catch {
    return { ...alertDefaults };
  }
}

const alertSettings = loadAlertSettings();


/* =========================================================
   ELEMENTOS
========================================================= */

const els = {
  homeGames:
    document.getElementById("homeGames"),

  liveGames:
    document.getElementById("liveGames"),

  favoriteGames:
    document.getElementById("favoriteGames"),

  leaguesList:
    document.getElementById("leaguesList"),

  newsList:
    document.getElementById("newsList"),

  pregameCard:
    document.getElementById("pregameCard"),

  todayCount:
    document.getElementById("todayCount"),

  liveCount:
    document.getElementById("liveCount"),

  favoritesCount:
    document.getElementById("favoritesCount"),

  leaguesCount:
    document.getElementById("leaguesCount"),

  refreshBtn:
    document.getElementById("refreshBtn"),

  notificationBtn:
    document.getElementById("notificationBtn"),

  tickerTrack:
    document.getElementById("tickerTrack"),

  radioList:
    document.getElementById("radioList"),

  radioAudio:
    document.getElementById("radioAudio"),

  radioNowPlaying:
    document.getElementById("radioNowPlaying"),

  radioNowName:
    document.getElementById("radioNowName"),

  radioNowCity:
    document.getElementById("radioNowCity"),

  radioPauseBtn:
    document.getElementById("radioPauseBtn"),

  alertGoal:
    document.getElementById("alertGoal"),

  alertStart:
    document.getElementById("alertStart"),

  alertHalftime:
    document.getElementById("alertHalftime"),

  alertFinal:
    document.getElementById("alertFinal")
};


/* =========================================================
   ÁUDIO DE GOL
========================================================= */

const goalAudio =
  new Audio("./audio/gol-rpf.mp3");

goalAudio.preload = "auto";
goalAudio.volume = 1;


/* =========================================================
   RÁDIOS

   Nesta etapa nenhuma rádio abre página externa.
   As que ainda não têm stream direto ficam desativadas.
========================================================= */

const radios = [
  {
    name: "Rádio Gaúcha",
    city: "Porto Alegre - RS",
    stream: null
  },
  {
    name: "Rádio Grenal",
    city: "Porto Alegre - RS",
    stream: null
  },
  {
    name: "Rádio Guaíba",
    city: "Porto Alegre - RS",
    stream: null
  },
  {
    name: "Band RS",
    city: "Porto Alegre - RS",
    stream: null
  },
  {
    name: "Rádio Caxias",
    city: "Caxias do Sul - RS",
    stream: null
  },
  {
    name: "Rádio Bandeirantes",
    city: "São Paulo - SP",
    stream: null
  },
  {
    name: "Jovem Pan News",
    city: "São Paulo - SP",
    stream: null
  },
  {
    name: "Energia 97",
    city: "São Paulo - SP",
    stream: null
  },
  {
    name: "CBN São Paulo",
    city: "São Paulo - SP",
    stream: null
  },
  {
    name: "Transamérica",
    city: "São Paulo - SP",
    stream: null
  },
  {
    name: "Super Rádio Tupi",
    city: "Rio de Janeiro - RJ",
    stream: null
  },
  {
    name: "CBN Rio",
    city: "Rio de Janeiro - RJ",
    stream: null
  },
  {
    name: "BandNews FM Rio",
    city: "Rio de Janeiro - RJ",
    stream: null
  },
  {
    name: "Rádio Globo",
    city: "Rio de Janeiro - RJ",
    stream: null
  },
  {
    name: "Rádio Itatiaia",
    city: "Belo Horizonte - MG",
    stream: null
  },
  {
    name: "98 FM",
    city: "Belo Horizonte - MG",
    stream: null
  },
  {
    name: "Rádio Super",
    city: "Belo Horizonte - MG",
    stream: null
  },
  {
    name: "Rádio Jornal",
    city: "Recife - PE",
    stream: null
  },
  {
    name: "CBN Recife",
    city: "Recife - PE",
    stream: null
  },
  {
    name: "Transamérica Recife",
    city: "Recife - PE",
    stream: null
  },
  {
    name: "Verdinha",
    city: "Fortaleza - CE",
    stream: null
  },
  {
    name: "Jovem Pan Fortaleza",
    city: "Fortaleza - CE",
    stream: null
  },
  {
    name: "Rádio Assunção",
    city: "Fortaleza - CE",
    stream: null
  },
  {
    name: "CBN Salvador",
    city: "Salvador - BA",
    stream: null
  },
  {
    name: "Rádio Sociedade",
    city: "Salvador - BA",
    stream: null
  },
  {
    name: "CBN Brasília",
    city: "Brasília - DF",
    stream: null
  },
  {
    name: "Rádio Nacional",
    city: "Brasília - DF",
    stream: null
  },
  {
    name: "CBN Goiânia",
    city: "Goiânia - GO",
    stream: null
  },
  {
    name: "Sagres",
    city: "Goiânia - GO",
    stream: null
  },
  {
    name: "Rádio Clube",
    city: "Curitiba - PR",
    stream: null
  },
  {
    name: "CBN Curitiba",
    city: "Curitiba - PR",
    stream: null
  },
  {
    name: "Rádio Transamérica Curitiba",
    city: "Curitiba - PR",
    stream: null
  },
  {
    name: "CBN Florianópolis",
    city: "Florianópolis - SC",
    stream: null
  },
  {
    name: "Rádio Guarujá",
    city: "Florianópolis - SC",
    stream: null
  },
  {
    name: "Mirante News",
    city: "São Luís - MA",
    stream: null
  },
  {
    name: "Clube do Pará",
    city: "Belém - PA",
    stream: null
  },
  {
    name: "CBN Amazônia",
    city: "Manaus - AM",
    stream: null
  },
  {
    name: "Rádio Clube",
    city: "Teresina - PI",
    stream: null
  },
  {
    name: "Rádio 98",
    city: "Natal - RN",
    stream: null
  },
  {
    name: "Rádio Correio",
    city: "João Pessoa - PB",
    stream: null
  }
];


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

function pad2(value) {
  return String(value)
    .padStart(2, "0");
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

function formatMatchTime(value) {
  if (!value) {
    return "--:--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "--:--";
  }

  return date.toLocaleTimeString(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false
    }
  );
}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(raw) {
  const value =
    String(raw || "")
      .trim()
      .toLowerCase();

  if (
    value === "1h" ||
    value === "1st_half" ||
    value === "first_half" ||
    value === "firsthalf" ||
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
    value === "notstarted" ||
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

  const rawStatus =
    first(
      game.status?.short,
      game.fixture?.status?.short,
      game.status,
      game.state,
      game.match_status
    );

  const dateRaw =
    first(
      game.event_date,
      game.fixture?.date,
      game.date,
      game.start_time,
      game.kickoff,
      game.datetime
    );

  const start =
    first(
      game.time,
      game.fixture?.time,
      game.hour,
      formatMatchTime(dateRaw)
    );

  const home =
    first(
      game.teams?.home?.name,
      game.home?.name,
      game.home_team?.name,
      game.home_team,
      "Mandante"
    );

  const away =
    first(
      game.teams?.away?.name,
      game.away?.name,
      game.away_team?.name,
      game.away_team,
      "Visitante"
    );

  return {
    id:
      String(
        first(
          game.id,
          game.fixture?.id,
          `${homeId || "h"}-${awayId || "a"}-${dateRaw || ""}`
        )
      ),

    home,
    away,

    homeId,
    awayId,

    homeLogo:
      first(
        game.teams?.home?.logo,
        game.home?.logo,
        game.home_logo,
        homeId
          ? `${API_BASE}/api/team-logo/${homeId}`
          : null
      ),

    awayLogo:
      first(
        game.teams?.away?.logo,
        game.away?.logo,
        game.away_logo,
        awayId
          ? `${API_BASE}/api/team-logo/${awayId}`
          : null
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
        game.current_minute,
        game.minute,
        game.elapsed,
        game.status?.elapsed,
        game.fixture?.status?.elapsed
      ),

    status:
      normalizeStatus(
        rawStatus
      ),

    league:
      first(
        game.league?.name,
        game.competition?.name,
        game.league_name,
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

    start:
      start || "--:--",

    date:
      dateRaw,

    raw:
      game
  };
}


/* =========================================================
   EXTRAIR ARRAY
========================================================= */

function extractArray(data) {
  if (
    Array.isArray(data)
  ) {
    return data;
  }

  for (
    const key
    of [
      "response",
      "matches",
      "games",
      "fixtures",
      "results",
      "data"
    ]
  ) {
    if (
      Array.isArray(
        data?.[key]
      )
    ) {
      return data[key];
    }
  }

  return [];
}


/* =========================================================
   PARTIDA
========================================================= */

function isLive(game) {
  return [
    "1H",
    "HT",
    "2H"
  ].includes(
    game.status
  );
}

function numericScore(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/*
  PRÉ-JOGO:
  se a API ainda não mandou placar,
  exibimos 0 x 0.
*/
function scoreValue(
  value,
  game
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  return value;
}


/* =========================================================
   RELÓGIO
========================================================= */

function syncClock(game) {
  const id =
    String(game.id);

  if (
    ![
      "1H",
      "2H"
    ].includes(
      game.status
    )
  ) {
    delete state.clocks[id];
    return;
  }

  const minute =
    Number(game.minute);

  if (
    !Number.isFinite(
      minute
    )
  ) {
    return;
  }

  const old =
    state.clocks[id];

  if (
    !old ||
    old.minute !== minute ||
    old.status !== game.status
  ) {
    state.clocks[id] = {
      minute,
      status:
        game.status,

      syncedAt:
        Date.now()
    };
  }
}

function syncAllClocks() {
  state.games
    .forEach(
      syncClock
    );
}

function getGameClock(game) {
  if (
    game.status === "HT"
  ) {
    return "INTERVALO";
  }

  if (
    game.status === "FT"
  ) {
    return "ENCERRADO";
  }

  if (
    game.status === "NS"
  ) {
    return game.start;
  }

  const clock =
    state.clocks[
      String(game.id)
    ];

  if (!clock) {
    return game.status === "1H"
      ? "1º TEMPO"
      : "2º TEMPO";
  }

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          clock.syncedAt
        ) / 1000
      )
    );

  const total =
    clock.minute * 60 +
    seconds;

  const minute =
    Math.floor(
      total / 60
    );

  const second =
    total % 60;

  return (
    `${pad2(minute)}:${pad2(second)}`
  );
}

function periodText(game) {
  switch (
    game.status
  ) {
    case "1H":
      return "1º TEMPO";

    case "HT":
      return "INTERVALO";

    case "2H":
      return "2º TEMPO";

    case "FT":
      return "ENCERRADO";

    default:
      return "PRÉ-JOGO";
  }
}


/* =========================================================
   ÁUDIO DE GOL
========================================================= */

function unlockGoalAudio() {
  if (
    state.goalAudioUnlocked
  ) {
    return;
  }

  try {
    const volume =
      goalAudio.volume;

    goalAudio.volume = 0;

    const promise =
      goalAudio.play();

    if (promise) {
      promise
        .then(() => {
          goalAudio.pause();

          goalAudio.currentTime = 0;
          goalAudio.volume = volume;

          state.goalAudioUnlocked = true;
        })
        .catch(() => {
          goalAudio.volume = volume;
        });
    }
  } catch {
    /* aguardando interação */
  }
}

function playGoalRpf() {
  if (
    !alertSettings.goal
  ) {
    return;
  }

  try {
    goalAudio.pause();
    goalAudio.currentTime = 0;
    goalAudio.volume = 1;

    goalAudio
      .play()
      .catch(
        console.warn
      );
  } catch (
    error
  ) {
    console.error(
      error
    );
  }
}


/* =========================================================
   DETECTOR DE GOL
========================================================= */

function initializeScoreMemory() {
  state.games
    .forEach(
      game => {
        state.previousScores[
          String(game.id)
        ] = {
          home:
            numericScore(
              game.hs
            ),

          away:
            numericScore(
              game.as
            )
        };
      }
    );

  state.scoreSystemStarted = true;
}

function checkGoals() {
  state.games
    .forEach(
      game => {
        const id =
          String(game.id);

        const current = {
          home:
            numericScore(
              game.hs
            ),

          away:
            numericScore(
              game.as
            )
        };

        const previous =
          state.previousScores[id];

        if (!previous) {
          state.previousScores[id] =
            current;

          return;
        }

        const homeGoal =
          current.home >
          previous.home;

        const awayGoal =
          current.away >
          previous.away;

        if (
          state.favorites.has(id) &&
          (
            homeGoal ||
            awayGoal
          )
        ) {
          const scoringTeam =
            homeGoal
              ? game.home
              : game.away;

          playGoalRpf();

          notify(
            "⚽ GOOOOOL!",
            `${scoringTeam} marcou! ${game.home} ${current.home} x ${current.away} ${game.away}`
          );
        }

        state.previousScores[id] =
          current;
      }
    );
}


/* =========================================================
   ESCUDOS
========================================================= */

function teamLogo(
  url,
  team
) {
  if (!url) {
    return `
      <span class="team-logo-fallback">
        ${escapeHtml(
          team?.charAt(0) || "?"
        )}
      </span>
    `;
  }

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


/* =========================================================
   CARD DE JOGO
========================================================= */

function matchCard(game) {
  const favorite =
    state.favorites.has(
      String(game.id)
    );

  const live =
    [
      "1H",
      "2H"
    ].includes(
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
            ${escapeHtml(
              game.home
            )}
          </span>

        </div>

        <div class="team">

          ${teamLogo(
            game.awayLogo,
            game.away
          )}

          <span class="team-name">
            ${escapeHtml(
              game.away
            )}
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
        title="Acompanhar jogo"
      >
        ★
      </button>

    </div>
  `;
}


/* =========================================================
   AGRUPAMENTO
========================================================= */

function groupGames(
  games
) {
  const map =
    new Map();

  games.forEach(
    game => {
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
  );

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

  if (
    !games.length
  ) {
    container.innerHTML = `
      <div class="empty-state">

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

  container.innerHTML =
    groupGames(games)
      .map(
        group => `
          <div class="league-group">

            <div class="league-header">

              <div>

                <div class="league-country">
                  ${escapeHtml(
                    group.country
                  )}
                </div>

                <div class="league-title">
                  ${escapeHtml(
                    group.league
                  )}
                </div>

              </div>

              <span>
                ${group.games.length}
                jogo${group.games.length === 1 ? "" : "s"}
              </span>

            </div>

            ${
              group.games
                .map(matchCard)
                .join("")
            }

          </div>
        `
      )
      .join("");
}


/* =========================================================
   DESTAQUE
========================================================= */

function choosePregameGame() {
  return (
    state.games.find(
      game =>
        [
          "1H",
          "2H"
        ].includes(
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

    state.games[0] ||

    null
  );
}

function pregameLogo(
  url,
  team
) {
  if (url) {
    return `
      <img
        src="${escapeHtml(url)}"
        alt="${escapeHtml(team)}"
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
  if (
    !els.pregameCard
  ) {
    return;
  }

  const game =
    choosePregameGame();

  if (!game) {
    els.pregameCard.innerHTML = `
      <div class="pregame-loading">
        Nenhum jogo disponível agora.
      </div>
    `;

    return;
  }

  const live =
    [
      "1H",
      "2H"
    ].includes(
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
        ${escapeHtml(
          game.start
        )}
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
          ${escapeHtml(
            game.league
          )}
        </div>

        <div class="pregame-country">
          ${escapeHtml(
            game.country
          )}
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
          ${escapeHtml(
            game.home
          )}
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
          ${escapeHtml(
            game.away
          )}
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

  state.games
    .filter(isLive)
    .slice(0, 4)
    .forEach(
      game => {
        news.push({
          type:
            "AO VIVO",

          title:
            `${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`,

          summary:
            `${periodText(game)} • ${game.league}`
        });
      }
    );

  state.games
    .filter(
      game =>
        game.status === "HT"
    )
    .slice(0, 2)
    .forEach(
      game => {
        news.push({
          type:
            "INTERVALO",

          title:
            `${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`,

          summary:
            `${game.league}`
        });
      }
    );

  state.games
    .filter(
      game =>
        game.status === "NS"
    )
    .slice(0, 4)
    .forEach(
      game => {
        news.push({
          type:
            "PRÓXIMO JOGO",

          title:
            `${game.home} x ${game.away}`,

          summary:
            `${game.league} • ${game.start}`
        });
      }
    );

  state.games
    .filter(
      game =>
        game.status === "FT"
    )
    .slice(0, 4)
    .forEach(
      game => {
        news.push({
          type:
            "FIM DE JOGO",

          title:
            `${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`,

          summary:
            `${game.league}`
        });
      }
    );

  state.news =
    news.slice(0, 10);
}


/* =========================================================
   NOTÍCIAS
========================================================= */

function renderNews() {
  if (
    !els.newsList
  ) {
    return;
  }

  if (
    !state.news.length
  ) {
    els.newsList.innerHTML = `
      <div class="empty-state">

        <strong>
          M Esportes Agora
        </strong>

        <span>
          Aguardando atualizações das partidas.
        </span>

      </div>
    `;

    return;
  }

  els.newsList.innerHTML =
    state.news
      .map(
        item => `
          <article class="news-card">

            <div class="news-tag">
              🔴 ${escapeHtml(
                item.type
              )}
            </div>

            <h3>
              ${escapeHtml(
                item.title
              )}
            </h3>

            <p>
              ${escapeHtml(
                item.summary
              )}
            </p>

          </article>
        `
      )
      .join("");
}


/* =========================================================
   TICKER
========================================================= */

function renderTicker() {
  if (
    !els.tickerTrack
  ) {
    return;
  }

  const parts = [];

  state.games
    .filter(isLive)
    .slice(0, 5)
    .forEach(
      game => {
        parts.push(
          `🔴 AO VIVO: ${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`
        );
      }
    );

  state.games
    .filter(
      game =>
        game.status === "FT"
    )
    .slice(0, 5)
    .forEach(
      game => {
        parts.push(
          `🏁 FIM: ${game.home} ${scoreValue(game.hs, game)} x ${scoreValue(game.as, game)} ${game.away}`
        );
      }
    );

  state.games
    .filter(
      game =>
        game.status === "NS"
    )
    .slice(0, 5)
    .forEach(
      game => {
        parts.push(
          `⚽ ${game.home} x ${game.away} às ${game.start}`
        );
      }
    );

  if (
    !parts.length
  ) {
    parts.push(
      "M ESPORTES • Futebol do Brasil e do mundo"
    );
  }

  els.tickerTrack.textContent =
    parts.join(
      "   •   "
    );
}


/* =========================================================
   HOME
========================================================= */

function renderHome() {
  if (
    els.todayCount
  ) {
    els.todayCount.textContent =
      `${state.games.length} jogos`;
  }

  renderGames(
    els.homeGames,
    state.games,
    "Nenhum jogo",
    "Nenhuma partida disponível para hoje."
  );
}


/* =========================================================
   AO VIVO
========================================================= */

function renderLive() {
  if (
    els.liveCount
  ) {
    els.liveCount.textContent =
      `${state.live.length} partidas`;
  }

  renderGames(
    els.liveGames,
    state.live,
    "Nenhum jogo ao vivo",
    "Quando uma partida começar ela aparecerá aqui."
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

  if (
    els.favoritesCount
  ) {
    els.favoritesCount.textContent =
      `${games.length} jogos`;
  }

  renderGames(
    els.favoriteGames,
    games,
    "Nenhum jogo acompanhado",
    "Marque ★ em uma partida para receber seus alertas."
  );
}


/* =========================================================
   LIGAS
========================================================= */

function renderLeagues() {
  if (
    !els.leaguesList
  ) {
    return;
  }

  const groups =
    groupGames(
      state.games
    );

  if (
    els.leaguesCount
  ) {
    els.leaguesCount.textContent =
      groups.length;
  }

  els.leaguesList.innerHTML =
    groups
      .map(
        group => `
          <div class="league-card">

            <div>

              <strong>
                ${escapeHtml(
                  group.league
                )}
              </strong>

              <small>
                ${escapeHtml(
                  group.country
                )}
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


/* =========================================================
   RÁDIOS
========================================================= */

function renderRadios() {
  if (
    !els.radioList
  ) {
    return;
  }

  els.radioList.innerHTML =
    radios
      .map(
        (radio, index) => {
          const available =
            Boolean(
              radio.stream
            );

          return `
            <div class="radio-card">

              <div class="radio-logo-fallback">
                📻
              </div>

              <div class="radio-info">

                <strong>
                  ${escapeHtml(
                    radio.name
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    radio.city
                  )}
                </span>

              </div>

              <button
                class="radio-play ${available ? "" : "source"}"
                type="button"
                data-radio-index="${index}"
                ${available ? "" : "disabled"}
              >
                ${
                  available
                    ? "▶ OUVIR"
                    : "EM BREVE"
                }
              </button>

            </div>
          `;
        }
      )
      .join("");
}

async function playRadio(
  index
) {
  const radio =
    radios[index];

  if (
    !radio ||
    !radio.stream
  ) {
    return;
  }

  try {
    els.radioAudio.pause();

    els.radioAudio.src =
      radio.stream;

    await els.radioAudio.play();

    state.currentRadio =
      radio;

    if (
      els.radioNowPlaying
    ) {
      els.radioNowPlaying
        .classList
        .remove(
          "hidden"
        );
    }

    if (
      els.radioNowName
    ) {
      els.radioNowName.textContent =
        radio.name;
    }

    if (
      els.radioNowCity
    ) {
      els.radioNowCity.textContent =
        radio.city;
    }

    if (
      els.radioPauseBtn
    ) {
      els.radioPauseBtn.textContent =
        "⏸";
    }

  } catch (
    error
  ) {
    console.error(
      "Erro ao tocar rádio:",
      error
    );

    alert(
      "Esta transmissão não respondeu."
    );
  }
}

function toggleRadioPause() {
  if (
    !els.radioAudio ||
    !state.currentRadio
  ) {
    return;
  }

  if (
    els.radioAudio.paused
  ) {
    els.radioAudio
      .play()
      .catch(
        console.error
      );

    els.radioPauseBtn.textContent =
      "⏸";
  } else {
    els.radioAudio.pause();

    els.radioPauseBtn.textContent =
      "▶";
  }
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
  renderTicker();
  renderRadios();
}


/* =========================================================
   RELÓGIOS VISÍVEIS
========================================================= */

function updateVisibleClocks() {
  document
    .querySelectorAll(
      "[data-clock-id]"
    )
    .forEach(
      node => {
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
      }
    );
}


/* =========================================================
   API
========================================================= */

async function request(path) {
  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        cache:
          "no-store"
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `API respondeu ${response.status}`
    );
  }

  return response.json();
}

async function loadGames() {
  const date =
    todayBR();

  let data = null;

  try {
    data =
      await request(
        `/api/matches?date=${encodeURIComponent(date)}`
      );
  } catch (
    error
  ) {
    console.warn(
      "Endpoint principal falhou. Tentando candidatos.",
      error
    );

    data =
      await request(
        `/api/rpf/candidatos?date=${encodeURIComponent(date)}`
      );
  }

  state.games =
    extractArray(data)
      .map(
        normalizeGame
      );

  state.live =
    state.games.filter(
      isLive
    );

  syncAllClocks();
}


/* =========================================================
   FAVORITOS
========================================================= */

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


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

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
    Notification.permission !==
    "granted"
  ) {
    return;
  }

  try {
    new Notification(
      title,
      {
        body,
        icon:
          "./icon-192.png"
      }
    );
  } catch (
    error
  ) {
    console.warn(
      error
    );
  }
}

async function requestNotifications() {
  unlockGoalAudio();

  if (
    !(
      "Notification"
      in window
    )
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
    permission ===
    "granted"
  ) {
    if (
      els.notificationBtn
    ) {
      els.notificationBtn.textContent =
        "NOTIFICAÇÕES ATIVADAS";
    }
  } else {
    if (
      els.notificationBtn
    ) {
      els.notificationBtn.textContent =
        "NOTIFICAÇÕES BLOQUEADAS";
    }
  }
}


/* =========================================================
   ALERTAS
========================================================= */

function saveAlertSettings() {
  alertSettings.goal =
    Boolean(
      els.alertGoal?.checked
    );

  alertSettings.start =
    Boolean(
      els.alertStart?.checked
    );

  alertSettings.halftime =
    Boolean(
      els.alertHalftime?.checked
    );

  alertSettings.final =
    Boolean(
      els.alertFinal?.checked
    );

  localStorage.setItem(
    "m-esportes-alerts",
    JSON.stringify(
      alertSettings
    )
  );
}

function loadAlertControls() {
  if (
    els.alertGoal
  ) {
    els.alertGoal.checked =
      alertSettings.goal;
  }

  if (
    els.alertStart
  ) {
    els.alertStart.checked =
      alertSettings.start;
  }

  if (
    els.alertHalftime
  ) {
    els.alertHalftime.checked =
      alertSettings.halftime;
  }

  if (
    els.alertFinal
  ) {
    els.alertFinal.checked =
      alertSettings.final;
  }
}


/* =========================================================
   SERVICE WORKER
========================================================= */

async function registerServiceWorker() {
  if (
    !(
      "serviceWorker"
      in navigator
    )
  ) {
    return null;
  }

  try {
    const registration =
      await navigator
        .serviceWorker
        .register(
          "./sw.js",
          {
            scope:
              "./"
          }
        );

    state.serviceWorkerRegistration =
      registration;

    return registration;

  } catch (
    error
  ) {
    console.warn(
      "Service Worker:",
      error
    );

    return null;
  }
}


/* =========================================================
   ATUALIZAÇÃO
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

  } catch (
    error
  ) {
    console.error(
      "Erro ao atualizar M Esportes:",
      error
    );

    if (
      els.tickerTrack
    ) {
      els.tickerTrack.textContent =
        "M ESPORTES • Não foi possível atualizar os jogos agora.";
    }

  } finally {
    if (
      els.refreshBtn
    ) {
      els.refreshBtn.disabled =
        false;

      els.refreshBtn.textContent =
        "↻";
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
    .forEach(
      button => {
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

            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        );
      }
    );
}


/* =========================================================
   CLIQUES
========================================================= */

document.addEventListener(
  "click",
  event => {
    unlockGoalAudio();

    const favoriteButton =
      event.target.closest(
        "[data-favorite]"
      );

    if (
      favoriteButton
    ) {
      toggleFavorite(
        favoriteButton
          .dataset
          .favorite
      );

      return;
    }

    const radioButton =
      event.target.closest(
        "[data-radio-index]"
      );

    if (
      radioButton &&
      !radioButton.disabled
    ) {
      playRadio(
        Number(
          radioButton
            .dataset
            .radioIndex
        )
      );
    }
  }
);


/* =========================================================
   BOTÕES
========================================================= */

if (
  els.refreshBtn
) {
  els.refreshBtn.addEventListener(
    "click",
    () =>
      refreshAll(true)
  );
}

if (
  els.notificationBtn
) {
  els.notificationBtn.addEventListener(
    "click",
    requestNotifications
  );
}

if (
  els.radioPauseBtn
) {
  els.radioPauseBtn.addEventListener(
    "click",
    toggleRadioPause
  );
}


/* =========================================================
   CHECKBOXES
========================================================= */

[
  els.alertGoal,
  els.alertStart,
  els.alertHalftime,
  els.alertFinal
]
  .filter(Boolean)
  .forEach(
    input => {
      input.addEventListener(
        "change",
        saveAlertSettings
      );
    }
  );


/* =========================================================
   INICIAR
========================================================= */

loadAlertControls();

setupNavigation();

registerServiceWorker();

renderRadios();

refreshAll(true);


/* relógio visual */

setInterval(
  updateVisibleClocks,
  1000
);


/* atualização dos dados */

setInterval(
  () =>
    refreshAll(false),
  20000
);
