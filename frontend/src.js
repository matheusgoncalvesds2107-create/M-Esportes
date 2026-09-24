/* =========================================================
   M ESPORTES
   PLACAR + 40 RÁDIOS + ALERTAS
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

  currentRadio: null,
  currentRadioIndex: null,
  radioResolving: new Set()
};

/* =========================================================
   ALERTAS
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
  notificationBtn: document.getElementById("notificationBtn"),

  tickerTrack: document.getElementById("tickerTrack"),

  radioList: document.getElementById("radioList"),
  radioAudio: document.getElementById("radioAudio"),
  radioNowPlaying: document.getElementById("radioNowPlaying"),
  radioNowName: document.getElementById("radioNowName"),
  radioNowCity: document.getElementById("radioNowCity"),
  radioPauseBtn: document.getElementById("radioPauseBtn"),

  alertGoal: document.getElementById("alertGoal"),
  alertStart: document.getElementById("alertStart"),
  alertHalftime: document.getElementById("alertHalftime"),
  alertFinal: document.getElementById("alertFinal")
};

/* =========================================================
   GOL RPF
========================================================= */

const goalAudio = new Audio("./audio/gol-rpf.mp3");

goalAudio.preload = "auto";
goalAudio.volume = 1;

/* =========================================================
   40 RÁDIOS

   IMPORTANTE:
   - As 15 que funcionaram foram mantidas.
   - As 25 antigas que falharam foram substituídas.
   - Nenhuma abre site externo.
========================================================= */

const radios = [

  /* =======================================================
     15 QUE JÁ FUNCIONARAM - NÃO MEXER
  ======================================================= */

  {
    name: "Rádio Grenal",
    city: "Porto Alegre - RS",
    search: "Radio Grenal",
    aliases: ["grenal"],
    stream: "https://grenal.audiostream.com.br:20000/aac"
  },

  {
    name: "Rádio Gaúcha",
    city: "Porto Alegre - RS",
    search: "Radio Gaucha",
    aliases: ["gaucha", "radio gaucha"],
    stream: "https://1132747t.ha.azioncdn.net/primary/gaucha_rbs.sdp/playlist.m3u8"
  },

  {
    name: "Rádio Bandeirantes",
    city: "São Paulo - SP",
    search: "Radio Bandeirantes",
    aliases: ["bandeirantes"],
    stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/RadioBandeirantesAAC_SC"
  },

  {
    name: "Jovem Pan News",
    city: "São Paulo - SP",
    search: "Jovem Pan News",
    aliases: ["jovem pan news", "jovem pan"],
    stream: null
  },

  {
    name: "Energia 97",
    city: "São Paulo - SP",
    search: "Energia 97 FM",
    aliases: ["energia 97", "energia fm"],
    stream: "https://streaming.inweb.com.br/energia"
  },

  {
    name: "CBN São Paulo",
    city: "São Paulo - SP",
    search: "CBN Sao Paulo",
    aliases: ["cbn sao paulo", "cbn sp"],
    stream: null
  },

  {
    name: "Super Rádio Tupi",
    city: "Rio de Janeiro - RJ",
    search: "Super Radio Tupi",
    aliases: ["super radio tupi", "radio tupi"],
    stream: "https://8923.brasilstream.com.br/stream"
  },

  {
    name: "CBN Rio",
    city: "Rio de Janeiro - RJ",
    search: "CBN Rio de Janeiro",
    aliases: ["cbn rio"],
    stream: null
  },

  {
    name: "BandNews FM",
    city: "São Paulo - SP",
    search: "BandNews FM",
    aliases: ["bandnews", "band news"],
    stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC_SC"
  },

  {
    name: "Rádio Globo",
    city: "Rio de Janeiro - RJ",
    search: "Radio Globo Rio",
    aliases: ["radio globo", "globo rio"],
    stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_GLOBO_RJAAC_SC"
  },

  {
    name: "Rádio Itatiaia",
    city: "Belo Horizonte - MG",
    search: "Radio Itatiaia",
    aliases: ["itatiaia"],
    stream: "https://8903.brasilstream.com.br/stream"
  },

  {
    name: "98 FM",
    city: "Belo Horizonte - MG",
    search: "98 FM Belo Horizonte",
    aliases: ["98 fm belo horizonte", "98 live"],
    stream: "https://9554.brasilstream.com.br/stream"
  },

  {
    name: "CBN Salvador",
    city: "Salvador - BA",
    search: "CBN Salvador",
    aliases: ["cbn salvador"],
    stream: null
  },

  {
    name: "Rádio Nacional",
    city: "Brasília - DF",
    search: "Radio Nacional Brasilia",
    aliases: ["nacional brasilia"],
    stream: "https://radionacionalbrasilia-stream.ebc.com.br/index.m3u8"
  },

  {
    name: "Rádio Clube do Pará",
    city: "Belém - PA",
    search: "Radio Clube do Para",
    aliases: ["clube do para", "radio clube para"],
    stream: null
  },


  /* =======================================================
     25 NOVAS - FUTEBOL / A-B-C / FUTEBOL GAÚCHO
  ======================================================= */

  {
    name: "Gaúcha Serra",
    city: "Caxias do Sul - RS",
    search: "Gaucha Serra",
    aliases: [
      "gaucha serra",
      "gaucha caxias"
    ],
    stream: null
  },
{
  name: "Rádio Pelotense 99.5",
  city: "Pelotas - RS",
  search: "Radio Pelotense 99.5 Pelotas",
  aliases: [
    "radio pelotense",
    "pelotense 99.5",
    "pelotense pelotas",
    "pelotense fm"
  ],
  stream: null
},
  {
    name: "Planalto News",
    city: "Passo Fundo - RS",
    search: "Planalto News Passo Fundo",
    aliases: [
      "planalto news",
      "planalto passo fundo"
    ],
    stream: null
  },

  {
    name: "Tua Rádio Veranense",
    city: "Veranópolis - RS",
    search: "Tua Radio Veranense",
    aliases: [
      "veranense",
      "tua radio veranense"
    ],
    stream: null
  },

  {
    name: "Rádio Difusora",
    city: "Bento Gonçalves - RS",
    search: "Radio Difusora Bento Goncalves",
    aliases: [
      "difusora bento goncalves",
      "difusora serra gaucha"
    ],
    stream: null
  },

  {
    name: "Rádio Progresso",
    city: "Ijuí - RS",
    search: "Radio Progresso Ijui",
    aliases: [
      "progresso ijui",
      "radio progresso de ijui"
    ],
    stream: null
  },

  {
    name: "Banda B",
    city: "Curitiba - PR",
    search: "Banda B Curitiba",
    aliases: [
      "banda b",
      "banda b curitiba"
    ],
    stream: null
  },

  {
    name: "TMC Curitiba",
    city: "Curitiba - PR",
    search: "TMC Curitiba",
    aliases: [
      "tmc curitiba"
    ],
    stream: null
  },

  {
    name: "Paiquerê",
    city: "Londrina - PR",
    search: "Paiquere Londrina",
    aliases: [
      "paiquere",
      "paiquere londrina"
    ],
    stream: null
  },

  {
    name: "Rádio Colmeia",
    city: "Paraná",
    search: "Radio Colmeia Parana",
    aliases: [
      "radio colmeia",
      "colmeia parana"
    ],
    stream: null
  },

  {
    name: "Rádio Clube Recife",
    city: "Recife - PE",
    search: "Radio Clube Recife",
    aliases: [
      "clube recife",
      "radio clube pernambuco"
    ],
    stream: null
  },

  {
    name: "TMC Recife",
    city: "Recife - PE",
    search: "TMC Recife",
    aliases: [
      "tmc recife"
    ],
    stream: null
  },

  {
    name: "Rádio Jornal Caruaru",
    city: "Caruaru - PE",
    search: "Radio Jornal Caruaru",
    aliases: [
      "jornal caruaru",
      "radio jornal caruaru"
    ],
    stream: null
  },

  {
    name: "O POVO CBN",
    city: "Fortaleza - CE",
    search: "O Povo CBN Fortaleza",
    aliases: [
      "o povo cbn",
      "opovo cbn",
      "cbn fortaleza"
    ],
    stream: null
  },

  {
    name: "BandNews FM Ceará",
    city: "Fortaleza - CE",
    search: "BandNews Fortaleza",
    aliases: [
      "bandnews fortaleza",
      "bandnews fm fortaleza"
    ],
    stream: null
  },

  {
    name: "Vale FM",
    city: "Ceará",
    search: "Vale FM Ceara",
    aliases: [
      "vale fm"
    ],
    stream: null
  },

  {
    name: "Rádio Bandeirantes Goiás",
    city: "Goiânia - GO",
    search: "Bandeirantes Goiania",
    aliases: [
      "bandeirantes goiania",
      "band goiania"
    ],
    stream: null
  },

  {
    name: "Rádio Difusora",
    city: "Goiânia - GO",
    search: "Radio Difusora Goiania",
    aliases: [
      "difusora goiania",
      "radio difusora goias"
    ],
    stream: null
  },

  {
    name: "89 FM",
    city: "Joinville - SC",
    search: "89 FM Joinville",
    aliases: [
      "89 fm joinville",
      "radio 89 joinville"
    ],
    stream: null
  },

  {
    name: "Oeste Capital FM",
    city: "Chapecó - SC",
    search: "Oeste Capital FM Chapeco",
    aliases: [
      "oeste capital",
      "oeste capital chapeco"
    ],
    stream: null
  },

  {
    name: "Rádio Clube",
    city: "Lages - SC",
    search: "Radio Clube Lages",
    aliases: [
      "radio clube lages",
      "clube lages"
    ],
    stream: null
  },

  {
    name: "Vang FM",
    city: "Santa Catarina",
    search: "Vang FM Santa Catarina",
    aliases: [
      "vang fm",
      "radio vang"
    ],
    stream: null
  },

  {
    name: "Amanda FM",
    city: "Santa Catarina",
    search: "Amanda FM Santa Catarina",
    aliases: [
      "amanda fm"
    ],
    stream: null
  },

  {
    name: "TMC Rio",
    city: "Rio de Janeiro - RJ",
    search: "TMC Rio de Janeiro",
    aliases: [
      "tmc rio",
      "tmc rio de janeiro"
    ],
    stream: null
  },

  {
    name: "Rádio 94 FM",
    city: "Rio de Janeiro - RJ",
    search: "94 FM Rio de Janeiro",
    aliases: [
      "94 fm rio",
      "radio 94 rio"
    ],
    stream: null
  }
];

/* =========================================================
   RADIO BROWSER
========================================================= */

const RADIO_BROWSER_SERVERS = [
  "https://de1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info"
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

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  return String(value).padStart(2, "0");
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

  const date = new Date(value);

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
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  );
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

  const start = first(
    game.time,
    game.fixture?.time,
    game.hour,
    formatMatchTime(dateRaw)
  );

  const home = first(
    game.teams?.home?.name,
    game.home?.name,
    game.home_team?.name,
    game.home_team,
    "Mandante"
  );

  const away = first(
    game.teams?.away?.name,
    game.away?.name,
    game.away_team?.name,
    game.away_team,
    "Visitante"
  );

  return {
    id: String(
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

    homeLogo: first(
      game.teams?.home?.logo,
      game.home?.logo,
      game.home_logo,
      homeId
        ? `${API_BASE}/api/team-logo/${homeId}`
        : null
    ),

    awayLogo: first(
      game.teams?.away?.logo,
      game.away?.logo,
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

    start: start || "--:--",

    date: dateRaw,

    raw: game
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
    const key of [
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

function scoreValue(value) {
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
  const id = String(game.id);

  if (
    ![
      "1H",
      "2H"
    ].includes(game.status)
  ) {
    delete state.clocks[id];

    return;
  }

  const minute = Number(game.minute);

  if (
    !Number.isFinite(minute)
  ) {
    return;
  }

  const old = state.clocks[id];

  if (
    !old ||
    old.minute !== minute ||
    old.status !== game.status
  ) {
    state.clocks[id] = {
      minute,
      status: game.status,
      syncedAt: Date.now()
    };
  }
}

function syncAllClocks() {
  state.games.forEach(syncClock);
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

  return `${pad2(minute)}:${pad2(second)}`;
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
   SOM DE GOL
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
    console.error(error);
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
    ].includes(game.status);

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
   AGRUPAMENTO
========================================================= */

function groupGames(games) {
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
   PRÉ-JOGO AUTOMÁTICO T-30
========================================================= */

const PRE_GAME_SPECIAL_TEAMS = [
  "chelsea",
  "como"
];
const PRE_GAME_SERIE_B_TEAMS = [
  "america mineiro",
  "athletic",
  "atletico goianiense",
  "avai",
  "botafogo sp",
  "ceara",
  "crb",
  "criciuma",
  "cuiaba",
  "fortaleza",
  "goias",
  "juventude",
  "londrina",
  "nautico",
  "novorizontino",
  "operario pr",
  "ponte preta",
  "sao bernardo",
  "sport",
  "vila nova"
];
const PRE_GAME_BIG_TEAMS = [
  "flamengo",
  "palmeiras",
  "corinthians",
  "sao paulo",
  "santos",
  "gremio",
  "internacional",
  "atletico mineiro",
  "cruzeiro",
  "vasco",
  "fluminense",
  "botafogo",
  "bahia",
  "vitoria",
  "athletico paranaense",
  "coritiba",
  "arsenal",
  "liverpool",
  "manchester city",
  "manchester united",
  "tottenham",
  "inter",
  "milan",
  "juventus",
  "napoli",
  "roma",
  "lazio"
];

const PRE_GAME_BRAZIL_CLASSICS = [
  ["gremio", "internacional"],
  ["flamengo", "fluminense"],
  ["flamengo", "vasco"],
  ["flamengo", "botafogo"],
  ["vasco", "fluminense"],
  ["vasco", "botafogo"],
  ["fluminense", "botafogo"],
  ["corinthians", "palmeiras"],
  ["corinthians", "sao paulo"],
  ["corinthians", "santos"],
  ["palmeiras", "sao paulo"],
  ["palmeiras", "santos"],
  ["sao paulo", "santos"],
  ["atletico mineiro", "cruzeiro"],
  ["bahia", "vitoria"],
  ["athletico paranaense", "coritiba"],
  ["sport", "nautico"],
  ["sport", "santa cruz"],
  ["nautico", "santa cruz"],
  ["ceara", "fortaleza"],
  ["paysandu", "remo"],
  ["goias", "vila nova"],
  ["avai", "figueirense"],
  ["ponte preta", "guarani"],
  ["juventude", "caxias"],
  ["brasil de pelotas", "pelotas"]
];

function teamKey(name = "") {
  return normalizeText(name)
    .replace(/\bfc\b/g, "")
    .replace(/\bec\b/g, "")
    .replace(/\bsc\b/g, "")
    .replace(/\bclube\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function teamMatches(name, target) {
  const a = teamKey(name);
  const b = teamKey(target);

  return (
    a === b ||
    a.includes(b) ||
    b.includes(a)
  );
}

function isBrazilianClassic(game) {
  return PRE_GAME_BRAZIL_CLASSICS.some(
    pair => {
      return (
        (
          teamMatches(game.home, pair[0]) &&
          teamMatches(game.away, pair[1])
        ) ||
        (
          teamMatches(game.home, pair[1]) &&
          teamMatches(game.away, pair[0])
        )
      );
    }
  );
}

function competitionImportance(game) {
  const league = normalizeText(game.league);
  const country = normalizeText(game.country);

  let points = 0;

  if (
    league.includes("brasileirao") ||
    (
      league.includes("serie a") &&
      country.includes("brasil")
    )
  ) {
    points += 120;
  }

  if (league.includes("libertadores")) {
    points += 118;
  }

  if (league.includes("champions")) {
    points += 116;
  }

  if (league.includes("copa do brasil")) {
    points += 112;
  }

  if (league.includes("premier league")) {
    points += 110;
  }

  if (
    league.includes("serie a") &&
    country.includes("ital")
  ) {
    points += 106;
  }

  if (
    league.includes("la liga") ||
    league.includes("laliga")
  ) {
    points += 103;
  }

  if (league.includes("bundesliga")) {
    points += 101;
  }

  if (league.includes("ligue 1")) {
    points += 99;
  }

  if (
    league.includes("sudamericana") ||
    league.includes("sul americana")
  ) {
    points += 96;
  }

  if (
    league.includes("serie b") &&
    country.includes("brasil")
  ) {
    points += 82;
  }

  if (
    league.includes("serie c") &&
    country.includes("brasil")
  ) {
    points += 72;
  }

  if (league.includes("gauchao")) {
    points += 68;
  }

  return points;
}

function gameImportance(game) {
  let points =
    competitionImportance(game);

  const league =
    normalizeText(game.league);

  const country =
    normalizeText(game.country);

  const home =
    normalizeText(game.home);

  const away =
    normalizeText(game.away);

  const teams = [
    game.home,
    game.away
  ];

  /* Chelsea e Como */
  for (const team of teams) {
    if (
      PRE_GAME_SPECIAL_TEAMS.some(
        target =>
          teamMatches(team, target)
      )
    ) {
      points += 200;
    }

    if (
      PRE_GAME_BIG_TEAMS.some(
        target =>
          teamMatches(team, target)
      )
    ) {
      points += 35;
    }

    if (
      PRE_GAME_SERIE_B_TEAMS.some(
        target =>
          teamMatches(team, target)
      )
    ) {
      points += 90;
    }
  }

  /* Clássico brasileiro */
  if (
    isBrazilianClassic(game)
  ) {
    points += 250;
  }

  /* Qualquer jogo brasileiro */
  if (
    country.includes("brasil") ||
    league.includes("brasil") ||
    league.includes("brasileirao") ||
    league.includes("serie b") ||
    league.includes("serie c") ||
    league.includes("gauchao")
  ) {
    points += 70;
  }

  /* Evita liga inglesa pequena como destaque */
  if (
    (
      country.includes("inglaterra") ||
      country.includes("england")
    ) &&
    !league.includes("premier")
  ) {
    points -= 120;
  }

  /* Bloqueia clubes ingleses pequenos que apareceram */
  const weakEnglish =
    [
      "dorking",
      "southall",
      "crowborough",
      "hampton",
      "richmond"
    ];

  if (
    weakEnglish.some(
      name =>
        home.includes(name) ||
        away.includes(name)
    )
  ) {
    points -= 300;
  }

  return points;
}

function gameKickoffMs(game) {
  if (game.date) {
    const parsed =
      new Date(game.date).getTime();

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (
    /^\d{2}:\d{2}$/.test(
      String(game.start || "")
    )
  ) {
    const [
      hour,
      minute
    ] =
      String(game.start)
        .split(":")
        .map(Number);

    const today =
      todayBR();

    const parsed =
      new Date(
        `${today}T${pad2(hour)}:${pad2(minute)}:00-03:00`
      ).getTime();

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function minutesToKickoff(game) {
  const kickoff =
    gameKickoffMs(game);

  if (!Number.isFinite(kickoff)) {
    return null;
  }

  return Math.ceil(
    (
      kickoff -
      Date.now()
    ) / 60000
  );
}

function compareImportantGames(a, b) {
  const difference =
    gameImportance(b) -
    gameImportance(a);

  if (difference !== 0) {
    return difference;
  }

  const aTime =
    gameKickoffMs(a) ??
    Number.MAX_SAFE_INTEGER;

  const bTime =
    gameKickoffMs(b) ??
    Number.MAX_SAFE_INTEGER;

  return aTime - bTime;
}

function choosePregameGame() {
  const upcoming =
    state.games.filter(
      game =>
        game.status === "NS"
    );

  const live =
    state.games.filter(
      game =>
        isLive(game)
    );

  /* T-30 de jogo importante */
  const importantT30 =
    upcoming
      .filter(
        game => {
          const minutes =
            minutesToKickoff(game);

          return (
            minutes !== null &&
            minutes >= 0 &&
            minutes <= 30 &&
            gameImportance(game) >= 70
          );
        }
      )
      .sort(compareImportantGames);

  if (importantT30.length) {
    return importantT30[0];
  }

  /* jogo ao vivo só entra se for importante */
  const importantLive =
    live
      .filter(
        game =>
          gameImportance(game) >= 70
      )
      .sort(compareImportantGames);

  if (importantLive.length) {
    return importantLive[0];
  }

  /* próximo jogo importante */
  const importantFuture =
    upcoming
      .filter(
        game => {
          const minutes =
            minutesToKickoff(game);

          return (
            (
              minutes === null ||
              minutes >= 0
            ) &&
            gameImportance(game) >= 70
          );
        }
      )
      .sort(compareImportantGames);

  if (importantFuture.length) {
    return importantFuture[0];
  }

  /* preferência por qualquer jogo brasileiro */
  const brazilGame =
    state.games
      .filter(
        game => {
          const text =
            normalizeText(
              `${game.country} ${game.league}`
            );

          return (
            text.includes("brasil") ||
            text.includes("brasileirao") ||
            text.includes("serie b") ||
            text.includes("serie c") ||
            text.includes("gauchao")
          );
        }
      )
      .sort(compareImportantGames);

  if (brazilGame.length) {
    return brazilGame[0];
  }

  /*
    Só se realmente não houver
    nenhum destaque melhor.
  */
  return (
    upcoming
      .slice()
      .sort(compareImportantGames)[0] ||
    live
      .slice()
      .sort(compareImportantGames)[0] ||
    null
  );
}

function chooseRoundupGame(mainGame) {
  if (!mainGame) {
    return null;
  }

  const mainTime =
    gameKickoffMs(mainGame);

  return (
    state.games
      .filter(
        game =>
          String(game.id) !==
          String(mainGame.id)
      )
      .filter(
        game =>
          game.status === "NS" ||
          isLive(game)
      )
      .filter(
        game => {
          if (
            !Number.isFinite(mainTime)
          ) {
            return true;
          }

          const time =
            gameKickoffMs(game);

          if (!Number.isFinite(time)) {
            return false;
          }

          return (
            Math.abs(
              time -
              mainTime
            ) <=
            45 * 60000
          );
        }
      )
      .sort(compareImportantGames)[0] ||
    null
  );
}

function pregamePhase(game) {
  if (isLive(game)) {
    return {
      tag: "🔴 AO VIVO",
      title: "A BOLA ESTÁ ROLANDO",
      text:
        "Acompanhe o placar e as atualizações."
    };
  }

  if (game.status === "HT") {
    return {
      tag: "⏸ INTERVALO",
      title: "INTERVALO",
      text:
        "Confira o placar da partida."
    };
  }

  if (game.status === "FT") {
    return {
      tag: "🏁 ENCERRADO",
      title: "FIM DE JOGO",
      text:
        "Partida encerrada."
    };
  }

  const minutes =
    minutesToKickoff(game);

  if (
    minutes === null ||
    minutes > 30
  ) {
    return {
      tag: "📺 PRÓXIMO PRÉ-JOGO",
      title: "M ESPORTES T-30",
      text:
        "O programa começa 30 minutos antes."
    };
  }

  if (minutes >= 21) {
    return {
      tag: `🔴 T-${minutes}`,
      title: "ABERTURA DO PRÉ-JOGO",
      text:
        "Confronto, campeonato e primeiras informações."
    };
  }

  if (minutes >= 11) {
    return {
      tag: `🔴 T-${minutes}`,
      title: "RAIO-X DO CONFRONTO",
      text:
        "Informações dos dois times antes da bola rolar."
    };
  }

  if (minutes >= 6) {
    return {
      tag: `🔴 T-${minutes}`,
      title: "INFORMAÇÕES FINAIS",
      text:
        "Últimos boletins antes do jogo."
    };
  }

  return {
    tag:
      minutes > 0
        ? `🔴 T-${minutes}`
        : "🔴 VAI COMEÇAR",

    title:
      "CONTAGEM REGRESSIVA",

    text:
      "Tudo pronto para a partida."
  };
}

function pregameLogo(url, team) {
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
  if (!els.pregameCard) {
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

  const phase =
    pregamePhase(game);

  const roundup =
    chooseRoundupGame(game);

  const live =
    isLive(game);

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
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
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
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
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
        ${scoreValue(game.hs)}
        x
        ${scoreValue(game.as)}
      </div>
    `;

  } else {
    center = `
      <div class="label">
        ${escapeHtml(phase.tag)}
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
        ${escapeHtml(phase.tag)}
      </div>

    </div>

    <div class="pregame-banner">
      M ESPORTES • PRÉ-JOGO AUTOMÁTICO T-30
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

    <div class="pregame-banner">
      ${escapeHtml(phase.title)}
      •
      ${escapeHtml(phase.text)}
    </div>

    ${
      roundup
        ? `
          <div class="pregame-banner">
            GIRO DA RODADA •
            ${escapeHtml(roundup.home)}
            x
            ${escapeHtml(roundup.away)}
            •
            ${escapeHtml(roundup.start)}
          </div>
        `
        : ""
    }
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
          type: "AO VIVO",

          title:
            `${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`,

          summary:
            `${periodText(game)} • ${game.league}`
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
          type: "PRÓXIMO JOGO",

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
          type: "FIM DE JOGO",

          title:
            `${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`,

          summary:
            game.league
        });
      }
    );

  state.news =
    news.slice(
      0,
      10
    );
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
          `🔴 AO VIVO: ${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`
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
          `🏁 FIM: ${game.home} ${scoreValue(game.hs)} x ${scoreValue(game.as)} ${game.away}`
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
   HOME / AO VIVO / FAVORITOS / LIGAS
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

/* =========================================================
   BUSCA DE STREAM
========================================================= */

function stationScore(
  station,
  radio
) {
  const stationName =
    normalizeText(
      station.name
    );

  let score = 0;

  const targets = [
    radio.name,
    radio.search,
    ...(radio.aliases || [])
  ]
    .map(
      normalizeText
    );

  for (
    const target of targets
  ) {
    if (
      !target
    ) {
      continue;
    }

    if (
      stationName === target
    ) {
      score += 120;
    }

    if (
      stationName.includes(target)
    ) {
      score += 60;
    }

    const words =
      target
        .split(" ")
        .filter(
          word =>
            word.length > 2
        );

    for (
      const word of words
    ) {
      if (
        stationName.includes(word)
      ) {
        score += 7;
      }
    }
  }

  const codec =
    String(
      station.codec || ""
    )
      .toLowerCase();

  if (
    codec.includes("mp3") ||
    codec.includes("aac")
  ) {
    score += 15;
  }

  if (
    station.lastcheckok === 1
  ) {
    score += 25;
  }

  if (
    station.url_resolved &&
    String(
      station.url_resolved
    ).startsWith(
      "https://"
    )
  ) {
    score += 20;
  }

  if (
    station.votes
  ) {
    score +=
      Math.min(
        Number(
          station.votes
        ),
        25
      );
  }

  return score;
}

async function searchRadioBrowser(
  radio
) {
  const searches = [
    radio.search,
    ...(radio.aliases || [])
  ]
    .filter(Boolean);

  let lastError = null;

  for (
    const server
    of RADIO_BROWSER_SERVERS
  ) {
    for (
      const search
      of searches
    ) {
      try {
        const query =
          encodeURIComponent(
            search
          );

        const url =
          `${server}/json/stations/search?name=${query}&countrycode=BR&hidebroken=true&order=votes&reverse=true&limit=30`;

        const response =
          await fetch(
            url,
            {
              cache: "no-store"
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Radio Browser ${response.status}`
          );
        }

        const list =
          await response.json();

        if (
          !Array.isArray(list) ||
          !list.length
        ) {
          continue;
        }

        const candidates =
          list
            .filter(
              item => {
                const stream =
                  item.url_resolved ||
                  item.url;

                return (
                  stream &&
                  String(stream)
                    .startsWith(
                      "https://"
                    )
                );
              }
            )
            .sort(
              (a, b) =>
                stationScore(
                  b,
                  radio
                ) -
                stationScore(
                  a,
                  radio
                )
            );

        const best =
          candidates[0];

        if (!best) {
          continue;
        }

        /*
          Evita pegar uma rádio
          completamente diferente.
        */

        if (
          stationScore(
            best,
            radio
          ) < 20
        ) {
          continue;
        }

        return {
          stream:
            best.url_resolved ||
            best.url,

          name:
            best.name ||
            radio.name
        };

      } catch (
        error
      ) {
        lastError =
          error;
      }
    }
  }

  throw (
    lastError ||
    new Error(
      "Stream não encontrado"
    )
  );
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
        (
          radio,
          index
        ) => {
          const playing =
            state.currentRadioIndex === index &&
            els.radioAudio &&
            !els.radioAudio.paused;

          const loading =
            state.radioResolving.has(
              index
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
                class="radio-play"
                type="button"
                data-radio-index="${index}"
                ${loading ? "disabled" : ""}
              >
                ${
                  loading
                    ? "BUSCANDO..."
                    : playing
                      ? "⏸ PAUSAR"
                      : "▶ OUVIR"
                }
              </button>

            </div>
          `;
        }
      )
      .join("");
}

function setNowPlaying(
  radio
) {
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
}

async function resolveRadioStream(
  index
) {
  const radio =
    radios[index];

  if (!radio) {
    throw new Error(
      "Rádio inválida"
    );
  }

  /*
    Stream fixo das rádios
    que já funcionaram.
  */

  if (
    radio.stream
  ) {
    return radio.stream;
  }

  /*
    Stream descoberto antes.
  */

  const saved =
    localStorage.getItem(
      `m-radio-v2-${index}-${normalizeText(radio.name)}`
    );

  if (saved) {
    return saved;
  }

  const result =
    await searchRadioBrowser(
      radio
    );

  localStorage.setItem(
    `m-radio-v2-${index}-${normalizeText(radio.name)}`,
    result.stream
  );

  return result.stream;
}

async function playRadio(
  index
) {
  const radio =
    radios[index];

  if (
    !radio ||
    !els.radioAudio
  ) {
    return;
  }

  /*
    Pausar se clicar na
    mesma rádio tocando.
  */

  if (
    state.currentRadioIndex === index &&
    !els.radioAudio.paused
  ) {
    els.radioAudio.pause();

    if (
      els.radioPauseBtn
    ) {
      els.radioPauseBtn.textContent =
        "▶";
    }

    renderRadios();

    return;
  }

  state.radioResolving.add(
    index
  );

  renderRadios();

  try {
    const stream =
      await resolveRadioStream(
        index
      );

    els.radioAudio.pause();

    els.radioAudio.src =
      stream;

    els.radioAudio.load();

    await els.radioAudio.play();

    state.currentRadio =
      radio;

    state.currentRadioIndex =
      index;

    setNowPlaying(
      radio
    );

  } catch (
    error
  ) {
    console.error(
      "Erro na rádio:",
      radio.name,
      error
    );

    /*
      Apaga somente o
      stream automático.
      Nunca mexe nos streams
      fixos das 15 que funcionaram.
    */

    if (
      !radio.stream
    ) {
      localStorage.removeItem(
        `m-radio-v2-${index}-${normalizeText(radio.name)}`
      );
    }

    alert(
      `A transmissão da ${radio.name} não respondeu agora.`
    );

  } finally {
    state.radioResolving.delete(
      index
    );

    renderRadios();
  }
}

function toggleRadioPause() {
  if (
    !els.radioAudio ||
    state.currentRadioIndex === null
  ) {
    return;
  }

  if (
    els.radioAudio.paused
  ) {
    els.radioAudio
      .play()
      .then(
        () => {
          if (
            els.radioPauseBtn
          ) {
            els.radioPauseBtn.textContent =
              "⏸";
          }

          renderRadios();
        }
      )
      .catch(
        console.error
      );

  } else {
    els.radioAudio.pause();

    if (
      els.radioPauseBtn
    ) {
      els.radioPauseBtn.textContent =
        "▶";
    }

    renderRadios();
  }
}

/* =========================================================
   EVENTOS DO PLAYER
========================================================= */

if (
  els.radioAudio
) {
  els.radioAudio.addEventListener(
    "playing",
    () => {
      if (
        els.radioPauseBtn
      ) {
        els.radioPauseBtn.textContent =
          "⏸";
      }

      renderRadios();
    }
  );

  els.radioAudio.addEventListener(
    "pause",
    () => {
      if (
        els.radioPauseBtn
      ) {
        els.radioPauseBtn.textContent =
          "▶";
      }

      renderRadios();
    }
  );
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
  renderSerieA();
  renderNews();
  renderTicker();
  renderRadios();
  loadSerieAStandings();
       }

/* =========================================================
   RELÓGIO VISUAL
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
              String(
                item.id
              ) ===
              String(
                node.dataset.clockId
              )
          );

        if (game) {
          node.textContent =
            getGameClock(
              game
            );
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
        cache: "no-store"
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
    console.warn(error);
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
            scope: "./"
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

/* relógio */

setInterval(
  updateVisibleClocks,
  1000
);

/* placares */

setInterval(
  () =>
    refreshAll(false),
  20000
);
/* =========================================================
   BRASILEIRÃO SÉRIE A - ABAS
========================================================= */

function setupSerieATabs() {
  const buttons =
    document.querySelectorAll(
      "[data-seriea-tab]"
    );

  if (!buttons.length) {
    return;
  }

  const panels = {
    classificacao:
      document.getElementById(
        "serieAClassificacao"
      ),

    rodada:
      document.getElementById(
        "serieARodada"
      ),

    proximos:
      document.getElementById(
        "serieAProximos"
      ),

    resultados:
      document.getElementById(
        "serieAResultados"
      )
  };

  buttons.forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          const tab =
            button.dataset
              .serieaTab;

          /*
            Tirar ativo de todos
          */

          buttons.forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );

          /*
            Esconder todos os painéis
          */

          Object
            .values(panels)
            .forEach(
              panel => {
                if (panel) {
                  panel.classList.add(
                    "hidden"
                  );
                }
              }
            );

          /*
            Ativar botão clicado
          */

          button.classList.add(
            "active"
          );

          /*
            Mostrar painel escolhido
          */

          if (panels[tab]) {
            panels[tab]
              .classList
              .remove(
                "hidden"
              );
          }
        }
      );
    }
  );
}


/* =========================================================
   INICIAR ABAS DA SÉRIE A
========================================================= */

setupSerieATabs();
/* =========================================================
   BRASILEIRÃO SÉRIE A - JOGOS REAIS
========================================================= */

function isSerieAGame(game) {
  const league =
    normalizeText(
      game?.league || ""
    );

  const country =
    normalizeText(
      game?.country || ""
    );

  return (
    country.includes("brasil") &&
    (
      league.includes("serie a") ||
      league.includes("brasileirao") ||
      league.includes(
        "campeonato brasileiro"
      )
    )
  );
}


/* =========================================================
   CARD SIMPLES DA SÉRIE A
========================================================= */

function serieAGameCard(game) {
  const homeScore =
    scoreValue(game.hs);

  const awayScore =
    scoreValue(game.as);

  let status =
    game.start;

  if (isLive(game)) {
    status =
      getGameClock(game);
  }

  if (game.status === "FT") {
    status =
      "ENCERRADO";
  }

  return `
    <div class="match-card">

      <div class="match-time">
        ${escapeHtml(status)}
      </div>

      <div class="teams">

        <div class="team">

          ${
            game.homeLogo
              ? `
                <img
                  class="team-logo"
                  src="${escapeHtml(
                    game.homeLogo
                  )}"
                  alt=""
                />
              `
              : `
                <div class="team-logo-fallback">
                  ⚽
                </div>
              `
          }

          <span class="team-name">
            ${escapeHtml(game.home)}
          </span>

        </div>


        <div class="team">

          ${
            game.awayLogo
              ? `
                <img
                  class="team-logo"
                  src="${escapeHtml(
                    game.awayLogo
                  )}"
                  alt=""
                />
              `
              : `
                <div class="team-logo-fallback">
                  ⚽
                </div>
              `
          }

          <span class="team-name">
            ${escapeHtml(game.away)}
          </span>

        </div>

      </div>


      <div class="score">

        <span>
          ${homeScore}
        </span>

        <span>
          ${awayScore}
        </span>

      </div>

    </div>
  `;
}


/* =========================================================
   RENDER SÉRIE A
========================================================= */

function renderSerieA() {
  const rodada =
    document.getElementById(
      "serieAJogosRodada"
    );

  const proximos =
    document.getElementById(
      "serieAProximosJogos"
    );

  const resultados =
    document.getElementById(
      "serieAResultadosJogos"
    );

  const tabela =
    document.getElementById(
      "serieATabela"
    );

  const jogos =
    state.games.filter(
      isSerieAGame
    );


  /* RODADA */

  if (rodada) {
    rodada.innerHTML =
      jogos.length
        ? jogos
            .map(
              serieAGameCard
            )
            .join("")
        : `
          <div class="empty-state">
            <strong>
              Sem jogos da Série A hoje
            </strong>

            <span>
              Nenhuma partida encontrada
              para esta data.
            </span>
          </div>
        `;
  }


  /* PRÓXIMOS */

  const proximosJogos =
    jogos.filter(
      game =>
        game.status === "NS"
    );

  if (proximos) {
    proximos.innerHTML =
      proximosJogos.length
        ? proximosJogos
            .map(
              serieAGameCard
            )
            .join("")
        : `
          <div class="empty-state">
            <strong>
              Nenhum próximo jogo hoje
            </strong>
          </div>
        `;
  }


  /* RESULTADOS */

  const encerrados =
    jogos.filter(
      game =>
        game.status === "FT"
    );

  if (resultados) {
    resultados.innerHTML =
      encerrados.length
        ? encerrados
            .map(
              serieAGameCard
            )
            .join("")
        : `
          <div class="empty-state">
            <strong>
              Nenhum resultado hoje
            </strong>
          </div>
        `;
  }


  /* CLASSIFICAÇÃO */

  if (tabela) {
    tabela.innerHTML = `
      <strong>
        Classificação da Série A
      </strong>

      <div
        style="
          margin-top:8px;
          color:#8e9b92;
        "
      >
        Próxima etapa:
        carregar a tabela completa
        e atualizada do Brasileirão.
      </div>
    `;
  }
     }

/* =========================================================
   BRASILEIRÃO SÉRIE A - CLASSIFICAÇÃO REAL
========================================================= */

const M_ESPORTES_API =
  "https://m-esportes-api.onrender.com";

async function loadSerieAStandings() {
  const tabela =
    document.getElementById(
      "serieATabela"
    );

  if (!tabela) {
    return;
  }

  tabela.innerHTML =
    "Carregando classificação...";

  try {
    const response =
      await fetch(
        "https://m-esportes-api.onrender.com/api/serie-a/classificacao"
      );

    const data =
      await response.json();

    console.log(
      "Série A:",
      data
    );

    if (
      !response.ok ||
      data.ok === false
    ) {
      throw new Error(
        data.error ||
        `Erro ${response.status}`
      );
    }

    const rows =
      data.table ||
      data.tabela ||
      data.response ||
      [];

    if (
      !Array.isArray(rows) ||
      !rows.length
    ) {
      tabela.innerHTML = `
        <div class="empty-state">
          <strong>
            Classificação ainda vazia
          </strong>

          <span>
            O backend respondeu,
            mas não retornou clubes.
          </span>
        </div>
      `;

      return;
    }

    tabela.innerHTML = `
      <div class="standings-table">

        <div class="standings-head">
          <span>#</span>
          <span>Time</span>
          <span>J</span>
          <span>V</span>
          <span>E</span>
          <span>D</span>
          <span>SG</span>
          <span>PTS</span>
        </div>

        ${rows.map(
          row => `
            <div class="standings-row">

              <span>
                ${row.position ?? "-"}
              </span>

              <span class="standings-team">
                ${escapeHtml(
                  row.shortName ||
                  row.team ||
                  row.name ||
                  "Time"
                )}
              </span>

              <span>
                ${row.matches ?? 0}
              </span>

              <span>
                ${row.wins ?? 0}
              </span>

              <span>
                ${row.draws ?? 0}
              </span>

              <span>
                ${row.losses ?? 0}
              </span>

              <span>
                ${row.goalDifference ?? 0}
              </span>

              <strong>
                ${row.points ?? 0}
              </strong>

            </div>
          `
        ).join("")}

      </div>
    `;

  } catch (error) {
    console.error(
      "Classificação Série A:",
      error
    );

    tabela.innerHTML = `
      <div class="empty-state">
        <strong>
          Não foi possível carregar
        </strong>

        <span>
          ${escapeHtml(
            error.message ||
            "Erro desconhecido"
          )}
        </span>
      </div>
    `;
  }
                  }
