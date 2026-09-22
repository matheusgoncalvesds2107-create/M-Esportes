import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================================================
   FONTES
========================================================= */

const RPF_BASE = (
  process.env.RPF_API_BASE ||
  'https://radioplacar-api.onrender.com'
).replace(/\/$/, '');

const FGF_BASE = 'https://fgf.com.br';

/*
  Competições profissionais da FGF.

  23 = Gauchão
  24 = Gauchão Série A2
  25 = Gauchão Série B
  26 = Copa FGF
*/

const FGF_COMPETITIONS = {
  gauchao: {
    id: 23,
    name: 'Gauchão',
    url: `${FGF_BASE}/competicoes/profissional/23/2026`
  },

  a2: {
    id: 24,
    name: 'Gauchão Série A2',
    url: `${FGF_BASE}/competicoes/profissional/24/2026`
  },

  serieB: {
    id: 25,
    name: 'Gauchão Série B',
    url: `${FGF_BASE}/competicoes/profissional/25/2026`
  },

  copaFgf: {
    id: 26,
    name: 'Copa FGF',
    url: `${FGF_BASE}/competicoes/profissional/26/2026`
  }
};

const cache = new Map();

/* =========================================================
   CACHE
========================================================= */

async function cached(key, ttl, fn) {
  const hit = cache.get(key);

  if (
    hit &&
    Date.now() - hit.t < ttl
  ) {
    return hit.v;
  }

  const value = await fn();

  cache.set(key, {
    t: Date.now(),
    v: value
  });

  return value;
}

/* =========================================================
   DATA / HORA BRASIL
========================================================= */

function todayBR() {
  return new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).format(new Date());
}

function dateBRFromISO(value) {
  if (!value) return null;

  const d = new Date(value);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).format(d);
}

/* =========================================================
   AUXILIARES
========================================================= */

function first(v, ...keys) {
  for (const k of keys) {
    const parts = k.split('.');

    let x = v;

    for (const p of parts) {
      x = x?.[p];
    }

    if (
      x !== undefined &&
      x !== null &&
      x !== ''
    ) {
      return x;
    }
  }

  return null;
}

function normalizeString(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ''
    );
}

/* =========================================================
   STATUS RPF
========================================================= */

function normalizeStatus(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();

  if (!s) return 'NS';

  if (
    [
      '1h',
      '1st_half',
      'first_half',
      'primeiro tempo',
      '1ºt',
      '1t',
      'live',
      'inprogress',
      'in_progress'
    ].includes(s)
  ) {
    return '1H';
  }

  if (
    [
      'ht',
      'halftime',
      'half_time',
      'interval',
      'intervalo'
    ].includes(s)
  ) {
    return 'HT';
  }

  if (
    [
      '2h',
      '2nd_half',
      'second_half',
      'segundo tempo',
      '2ºt',
      '2t'
    ].includes(s)
  ) {
    return '2H';
  }

  if (
    [
      'ft',
      'finished',
      'final',
      'encerrado',
      'ended',
      'fulltime',
      'full_time'
    ].includes(s)
  ) {
    return 'FT';
  }

  if (
    [
      'ns',
      'notstarted',
      'not_started',
      'scheduled',
      'agendado',
      'pending'
    ].includes(s)
  ) {
    return 'NS';
  }

  if (
    s.includes('interval')
  ) {
    return 'HT';
  }

  if (
    s.includes('finish') ||
    s.includes('encerr')
  ) {
    return 'FT';
  }

  if (
    s.includes('2nd') ||
    s.includes('second')
  ) {
    return '2H';
  }

  if (
    s.includes('1st') ||
    s.includes('first')
  ) {
    return '1H';
  }

  return String(raw)
    .toUpperCase();
}

/* =========================================================
   NORMALIZAR JOGO RPF
========================================================= */

function normalizeGame(m) {
  const id = String(
    first(
      m,
      'id',
      'fixture.id',
      'match_id',
      'game_id'
    ) ??
      `${first(
        m,
        'home_team_id',
        'teams.home.id',
        'home.id',
        'home_team'
      )}-${first(
        m,
        'away_team_id',
        'teams.away.id',
        'away.id',
        'away_team'
      )}-${first(
        m,
        'event_date',
        'date',
        'fixture.date',
        'start_time'
      )}`
  );

  const dateRaw = first(
    m,
    'event_date',
    'date',
    'fixture.date',
    'start_time',
    'kickoff',
    'datetime'
  );

  let start = first(
    m,
    'time',
    'fixture.time',
    'hour'
  );

  if (
    !start &&
    dateRaw
  ) {
    try {
      start = new Date(
        dateRaw
      ).toLocaleTimeString(
        'pt-BR',
        {
          timeZone:
            'America/Sao_Paulo',

          hour:
            '2-digit',

          minute:
            '2-digit',

          hour12:
            false
        }
      );
    } catch {}
  }

  const rawStatus = first(
    m,
    'status.short',
    'fixture.status.short',
    'status',
    'state',
    'match_status'
  );

  const minute = first(
    m,
    'current_minute',
    'minute',
    'elapsed',
    'status.elapsed',
    'fixture.status.elapsed'
  );

  const homeId = first(
    m,
    'teams.home.id',
    'home.id',
    'home_team.id',
    'home_team_id'
  );

  const awayId = first(
    m,
    'teams.away.id',
    'away.id',
    'away_team.id',
    'away_team_id'
  );

  return {
    id,

    source:
      m.source ||
      'RPF',

    league:
      first(
        m,
        'league.name',
        'competition.name',
        'league_name',
        'championship',
        'league',
        'competition'
      ) ||
      'Campeonato',

    league_id: first(
      m,
      'league.id',
      'competition.id',
      'league_id'
    ),

    country:
      first(
        m,
        'league.country',
        'country.name',
        'country',
        'region'
      ) ||
      '',

    home:
      first(
        m,
        'teams.home.name',
        'home.name',
        'home_team.name',
        'home_team',
        'home'
      ) ||
      'Mandante',

    away:
      first(
        m,
        'teams.away.name',
        'away.name',
        'away_team.name',
        'away_team',
        'away'
      ) ||
      'Visitante',

    home_team_id:
      homeId,

    away_team_id:
      awayId,

    homeLogo:
      first(
        m,
        'teams.home.logo',
        'home.logo',
        'home_team.logo',
        'home_logo',
        'home_team_logo'
      ) ||
      (
        homeId
          ? `${RPF_BASE}/api/team-logo/${homeId}`
          : null
      ),

    awayLogo:
      first(
        m,
        'teams.away.logo',
        'away.logo',
        'away_team.logo',
        'away_logo',
        'away_team_logo'
      ) ||
      (
        awayId
          ? `${RPF_BASE}/api/team-logo/${awayId}`
          : null
      ),

    hs: first(
      m,
      'goals.home',
      'score.home',
      'home_score',
      'scores.home',
      'score_home'
    ),

    as: first(
      m,
      'goals.away',
      'score.away',
      'away_score',
      'scores.away',
      'score_away'
    ),

    status:
      normalizeStatus(
        rawStatus
      ),

    minute:
      minute == null
        ? null
        : Number(minute),

    start:
      start ||
      '--:--',

    date:
      dateRaw ||
      null,

    event_date:
      dateRaw ||
      null,

    venue:
      first(
        m,
        'venue.name',
        'venue',
        'stadium'
      ),

    rawStatus
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
      'response',
      'matches',
      'games',
      'fixtures',
      'data',
      'results'
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

  if (
    Array.isArray(
      data?.response?.data
    )
  ) {
    return data.response.data;
  }

  return [];
}

/* =========================================================
   RPF
========================================================= */

async function rpf(path) {
  const url =
    `${RPF_BASE}${path}`;

  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
            'application/json',

          'User-Agent':
            'M-Esportes/2.0'
        }
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `RPF API respondeu ${response.status} em ${path}`
    );
  }

  return response.json();
}

/* =========================================================
   PARTIDAS RPF
========================================================= */

async function getRpfMatches(date) {
  const paths = [
    `/api/matches?date=${encodeURIComponent(date)}`,

    `/api/rpf/candidatos?date=${encodeURIComponent(date)}`
  ];

  let lastError;

  for (
    const path
    of paths
  ) {
    try {
      const data =
        await rpf(path);

      const arr =
        extractArray(data);

      if (
        arr.length ||
        data?.ok
      ) {
        return arr.map(
          normalizeGame
        );
      }

    } catch (e) {
      lastError = e;
    }
  }

  throw (
    lastError ||
    new Error(
      'Nenhuma rota de partidas da RPF respondeu'
    )
  );
}

/* =========================================================
   FGF - DECODIFICAR HTML
========================================================= */

function decodeHtml(value = '') {
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&ordm;': 'º',
    '&ordf;': 'ª',
    '&ccedil;': 'ç',
    '&Ccedil;': 'Ç',
    '&atilde;': 'ã',
    '&otilde;': 'õ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú'
  };

  let text =
    String(value);

  for (
    const [
      entity,
      decoded
    ] of Object.entries(
      entities
    )
  ) {
    text =
      text.split(entity)
        .join(decoded);
  }

  text = text.replace(
    /&#(\d+);/g,
    (_, code) => {
      try {
        return String.fromCharCode(
          Number(code)
        );
      } catch {
        return '';
      }
    }
  );

  return text;
}

/* =========================================================
   FGF - HTML PARA LINHAS
========================================================= */

function fgfHtmlToLines(html) {
  let text =
    String(html || '');

  /*
    Remove partes que só atrapalham.
  */

  text = text
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      '\n'
    )

    .replace(
      /<style[\s\S]*?<\/style>/gi,
      '\n'
    )

    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      '\n'
    );

  /*
    Aproveita ALT dos escudos.
    Normalmente contém o nome
    do clube.
  */

  text = text.replace(
    /<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/gi,
    '\n$1\n'
  );

  /*
    Tags que devem virar quebra.
  */

  text = text.replace(
    /<(br|\/div|\/p|\/li|\/h1|\/h2|\/h3|\/h4|\/section|\/article|\/tr|\/td)[^>]*>/gi,
    '\n'
  );

  /*
    Remove as demais tags.
  */

  text = text.replace(
    /<[^>]+>/g,
    ' '
  );

  text =
    decodeHtml(text);

  return text
    .split(/\r?\n/)
    .map(
      line =>
        line
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);
}

/* =========================================================
   FGF - LINHA É DATA DE JOGO?
========================================================= */

function parseFgfDateLine(
  line,
  year = 2026
) {
  const cleaned =
    String(line)
      .replace(/\s+/g, ' ')
      .trim();

  /*
    Exemplos FGF:
    Sáb, 01/08 15:00 - Plátanos
    Dom, 06/09 15:00 - Cristo Rei
  */

  const match =
    cleaned.match(
      /^(?:Dom|Seg|Ter|Qua|Qui|Sex|Sáb|Sab),?\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})\s*(?:-\s*(.+))?$/i
    );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const hour =
    Number(match[3]);

  const minute =
    Number(match[4]);

  const venue =
    match[5]
      ? match[5].trim()
      : null;

  const yyyy =
    String(year);

  const mm =
    String(month)
      .padStart(2, '0');

  const dd =
    String(day)
      .padStart(2, '0');

  const hh =
    String(hour)
      .padStart(2, '0');

  const min =
    String(minute)
      .padStart(2, '0');

  return {
    date:
      `${yyyy}-${mm}-${dd}`,

    time:
      `${hh}:${min}`,

    iso:
      `${yyyy}-${mm}-${dd}T${hh}:${min}:00-03:00`,

    venue
  };
}

/* =========================================================
   FGF - LINHA É PLACAR?
========================================================= */

function parseFgfScore(line) {
  const text =
    String(line)
      .trim();

  /*
    Também aceita placar
    com pênaltis:

    (4) 2 X 1 (5)
  */

  const match =
    text.match(
      /^(?:\(\d+\)\s*)?(\d+)\s*[xX]\s*(\d+)(?:\s*\(\d+\))?$/
    );

  if (!match) {
    /*
      Jogo ainda sem placar:
      somente X
    */

    if (
      /^x$/i.test(text)
    ) {
      return {
        home: null,
        away: null
      };
    }

    return null;
  }

  return {
    home:
      Number(match[1]),

    away:
      Number(match[2])
  };
}

/* =========================================================
   FGF - IDENTIFICAR LINHA DE CLUBE
========================================================= */

function isIgnoredFgfLine(line) {
  const x =
    String(line)
      .trim();

  if (!x) return true;

  if (
    /^(sobre o jogo|sobre o Jogo)$/i
      .test(x)
  ) {
    return true;
  }

  if (
    /^\d+\s+altera/i
      .test(x)
  ) {
    return true;
  }

  if (
    /^rodada\s+\d+/i
      .test(x)
  ) {
    return true;
  }

  if (
    /^(classificat[oó]ria|semifinal|final|quartas|artilheiros)$/i
      .test(x)
  ) {
    return true;
  }

  if (
    /^[A-ZÁÉÍÓÚÇ]{2,4}$/
      .test(x)
  ) {
    return true;
  }

  if (
    parseFgfDateLine(x)
  ) {
    return true;
  }

  if (
    parseFgfScore(x)
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   FGF - STATUS
========================================================= */

function getFgfStatus(
  iso
) {
  const kickoff =
    new Date(iso)
      .getTime();

  if (
    Number.isNaN(kickoff)
  ) {
    return 'NS';
  }

  const now =
    Date.now();

  /*
    Antes do horário:
    não iniciado.
  */

  if (
    now < kickoff
  ) {
    return 'NS';
  }

  /*
    Dentro de 2h45 após
    o horário, consideramos
    janela de jogo.

    A página pública da FGF
    não fornece minuto de jogo
    de forma confiável.
  */

  const liveLimit =
    kickoff +
    (
      165 *
      60 *
      1000
    );

  if (
    now <= liveLimit
  ) {
    return '1H';
  }

  return 'FT';
}

/* =========================================================
   FGF - PARSER DOS JOGOS
========================================================= */

function parseFgfGames(
  html,
  competition
) {
  const lines =
    fgfHtmlToLines(html);

  const games = [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const dateInfo =
      parseFgfDateLine(
        lines[i],
        2026
      );

    if (!dateInfo) {
      continue;
    }

    /*
      Procura o placar nas
      próximas linhas.
    */

    let scoreIndex = -1;
    let score = null;

    for (
      let s = i + 1;
      s < Math.min(
        i + 15,
        lines.length
      );
      s++
    ) {
      const candidate =
        parseFgfScore(
          lines[s]
        );

      if (candidate) {
        scoreIndex = s;
        score = candidate;
        break;
      }

      /*
        Se chegou na data
        da próxima partida,
        cancela esta busca.
      */

      if (
        s > i + 1 &&
        parseFgfDateLine(
          lines[s],
          2026
        )
      ) {
        break;
      }
    }

    if (
      scoreIndex === -1
    ) {
      continue;
    }

    /*
      Mandante:
      primeira linha útil
      entre a data e o placar.
    */

    let home = null;

    for (
      let h = i + 1;
      h < scoreIndex;
      h++
    ) {
      if (
        !isIgnoredFgfLine(
          lines[h]
        )
      ) {
        home =
          lines[h];
        break;
      }
    }

    /*
      Visitante:
      primeira linha útil
      depois do placar.
    */

    let away = null;

    for (
      let a =
        scoreIndex + 1;

      a <
      Math.min(
        scoreIndex + 10,
        lines.length
      );

      a++
    ) {
      if (
        parseFgfDateLine(
          lines[a],
          2026
        )
      ) {
        break;
      }

      if (
        !isIgnoredFgfLine(
          lines[a]
        )
      ) {
        away =
          lines[a];
        break;
      }
    }

    if (
      !home ||
      !away
    ) {
      continue;
    }

    /*
      Proteção contra textos
      que não sejam clubes.
    */

    if (
      home.length > 100 ||
      away.length > 100
    ) {
      continue;
    }

    const idBase =
      [
        competition.id,
        dateInfo.date,
        dateInfo.time,
        normalizeString(home),
        normalizeString(away)
      ].join('-');

    games.push({
      id:
        `fgf-${idBase}`,

      source:
        'FGF',

      source_url:
        competition.url,

      league:
        competition.name,

      league_id:
        `fgf-${competition.id}`,

      country:
        'Brasil',

      state:
        'Rio Grande do Sul',

      home,

      away,

      home_team:
        home,

      away_team:
        away,

      home_team_id:
        null,

      away_team_id:
        null,

      homeLogo:
        null,

      awayLogo:
        null,

      home_team_logo:
        null,

      away_team_logo:
        null,

      hs:
        score.home,

      as:
        score.away,

      home_score:
        score.home,

      away_score:
        score.away,

      status:
        getFgfStatus(
          dateInfo.iso
        ),

      current_minute:
        null,

      minute:
        null,

      start:
        dateInfo.time,

      date:
        dateInfo.iso,

      event_date:
        dateInfo.iso,

      date_br:
        dateInfo.date,

      venue:
        dateInfo.venue,

      rawStatus:
        null
    });
  }

  /*
    Remove eventual partida
    duplicada da página.
  */

  const unique =
    new Map();

  for (
    const game
    of games
  ) {
    unique.set(
      game.id,
      game
    );
  }

  return [
    ...unique.values()
  ];
}

/* =========================================================
   FGF - DOWNLOAD DA COMPETIÇÃO
========================================================= */

async function fetchFgfCompetition(
  competition
) {
  const response =
    await fetch(
      competition.url,
      {
        headers: {
          Accept:
            'text/html,application/xhtml+xml',

          'Accept-Language':
            'pt-BR,pt;q=0.9',

          'User-Agent':
            'Mozilla/5.0 M-Esportes/2.0'
        }
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `FGF respondeu ${response.status} em ${competition.name}`
    );
  }

  const html =
    await response.text();

  return parseFgfGames(
    html,
    competition
  );
}

/* =========================================================
   FGF - BUSCAR UMA COMPETIÇÃO
========================================================= */

async function getFgfCompetition(
  key
) {
  const competition =
    FGF_COMPETITIONS[key];

  if (!competition) {
    throw new Error(
      'Competição FGF inválida'
    );
  }

  return cached(
    `fgf:${key}`,
    120000,
    () =>
      fetchFgfCompetition(
        competition
      )
  );
}

/* =========================================================
   FGF - TODAS
========================================================= */

async function getAllFgfGames() {
  const keys =
    Object.keys(
      FGF_COMPETITIONS
    );

  const results =
    await Promise.allSettled(
      keys.map(
        key =>
          getFgfCompetition(
            key
          )
      )
    );

  const games = [];

  results.forEach(
    result => {
      if (
        result.status ===
        'fulfilled'
      ) {
        games.push(
          ...result.value
        );
      }
    }
  );

  return games;
}

/* =========================================================
   FGF - FILTRAR DIA
========================================================= */

async function getFgfGamesByDate(
  date
) {
  const games =
    await getAllFgfGames();

  return games.filter(
    game =>
      game.date_br ===
      date
  );
}

/* =========================================================
   MESCLAR SEM DUPLICAR
========================================================= */

function gameIdentity(game) {
  const date =
    dateBRFromISO(
      game.event_date ||
      game.date
    ) ||
    '';

  return [
    date,
    normalizeString(
      game.home ||
      game.home_team
    ),
    normalizeString(
      game.away ||
      game.away_team
    )
  ].join('|');
}

function mergeGames(
  primary,
  extra
) {
  const map =
    new Map();

  /*
    RPF entra primeiro.
    Caso a mesma partida
    também esteja na FGF,
    preservamos a RPF.
  */

  for (
    const game
    of primary
  ) {
    map.set(
      gameIdentity(game),
      game
    );
  }

  for (
    const game
    of extra
  ) {
    const key =
      gameIdentity(game);

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        game
      );
    }
  }

  return [
    ...map.values()
  ].sort(
    (a, b) => {
      const da =
        new Date(
          a.event_date ||
          a.date ||
          0
        ).getTime();

      const db =
        new Date(
          b.event_date ||
          b.date ||
          0
        ).getTime();

      return da - db;
    }
  );
}

/* =========================================================
   JOGOS COMPLETOS
   RPF + FGF
========================================================= */

async function getMatches(date) {
  let rpfGames = [];
  let fgfGames = [];

  /*
    Se uma fonte falhar,
    a outra continua funcionando.
  */

  const [
    rpfResult,
    fgfResult
  ] =
    await Promise.allSettled([
      getRpfMatches(date),
      getFgfGamesByDate(date)
    ]);

  if (
    rpfResult.status ===
    'fulfilled'
  ) {
    rpfGames =
      rpfResult.value;
  } else {
    console.error(
      'RPF:',
      rpfResult.reason?.message
    );
  }

  if (
    fgfResult.status ===
    'fulfilled'
  ) {
    fgfGames =
      fgfResult.value;
  } else {
    console.error(
      'FGF:',
      fgfResult.reason?.message
    );
  }

  if (
    !rpfGames.length &&
    !fgfGames.length &&
    rpfResult.status ===
      'rejected' &&
    fgfResult.status ===
      'rejected'
  ) {
    throw new Error(
      'RPF e FGF não responderam'
    );
  }

  return mergeGames(
    rpfGames,
    fgfGames
  );
}

/* =========================================================
   HEALTH
========================================================= */

app.get(
  '/api/health',
  async (
    req,
    res
  ) => {
    res.json({
      ok: true,

      service:
        'm-esportes',

      providers: [
        'RPF PLACAR',
        'FGF'
      ],

      rpfBase:
        RPF_BASE,

      fgfBase:
        FGF_BASE,

      fgfCompetitions: [
        'Gauchão',
        'Gauchão Série A2',
        'Gauchão Série B',
        'Copa FGF'
      ],

      cache: {
        today:
          '60s',

        live:
          '20s',

        fgf:
          '120s'
      }
    });
  }
);

/* =========================================================
   JOGOS DO DIA
   RPF + FGF
========================================================= */

app.get(
  '/api/games/today',
  async (
    req,
    res
  ) => {
    const date =
      req.query.date ||
      todayBR();

    try {
      const response =
        await cached(
          `games:${date}`,
          60000,
          () =>
            getMatches(
              date
            )
        );

      res.json({
        ok: true,
        date,
        count:
          response.length,
        providers: [
          'RPF',
          'FGF'
        ],
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          error:
            e.message,
          date,
          response: []
        });
    }
  }
);

/* =========================================================
   AO VIVO
========================================================= */

app.get(
  '/api/live',
  async (
    req,
    res
  ) => {
    const date =
      req.query.date ||
      todayBR();

    try {
      const all =
        await cached(
          `live:${date}`,
          20000,
          () =>
            getMatches(
              date
            )
        );

      const response =
        all.filter(
          game =>
            [
              '1H',
              'HT',
              '2H'
            ].includes(
              game.status
            )
        );

      res.json({
        ok: true,
        date,
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          error:
            e.message,
          date,
          response: []
        });
    }
  }
);

/* =========================================================
   LIGAS
========================================================= */

app.get(
  '/api/leagues',
  async (
    req,
    res
  ) => {
    const date =
      req.query.date ||
      todayBR();

    try {
      const games =
        await cached(
          `games:${date}`,
          60000,
          () =>
            getMatches(
              date
            )
        );

      const map =
        new Map();

      for (
        const game
        of games
      ) {
        const key =
          `${game.country}|${game.league}`;

        if (
          !map.has(key)
        ) {
          map.set(
            key,
            {
              id:
                game.league_id,

              name:
                game.league,

              country:
                game.country,

              games:
                0
            }
          );
        }

        map.get(key)
          .games++;
      }

      const response =
        [
          ...map.values()
        ].sort(
          (a, b) =>
            (
              a.country +
              a.name
            ).localeCompare(
              b.country +
              b.name,
              'pt-BR'
            )
        );

      res.json({
        ok: true,
        date,
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   FGF - GAUCHÃO
========================================================= */

app.get(
  '/api/fgf/gauchao',
  async (
    req,
    res
  ) => {
    try {
      const response =
        await getFgfCompetition(
          'gauchao'
        );

      res.json({
        ok: true,
        provider:
          'FGF',
        competition:
          'Gauchão',
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          provider:
            'FGF',
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   FGF - SÉRIE A2
========================================================= */

app.get(
  '/api/fgf/a2',
  async (
    req,
    res
  ) => {
    try {
      const response =
        await getFgfCompetition(
          'a2'
        );

      res.json({
        ok: true,
        provider:
          'FGF',
        competition:
          'Gauchão Série A2',
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          provider:
            'FGF',
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   FGF - SÉRIE B
========================================================= */

app.get(
  '/api/fgf/serie-b',
  async (
    req,
    res
  ) => {
    try {
      const response =
        await getFgfCompetition(
          'serieB'
        );

      res.json({
        ok: true,
        provider:
          'FGF',
        competition:
          'Gauchão Série B',
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          provider:
            'FGF',
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   FGF - COPA FGF
========================================================= */

app.get(
  '/api/fgf/copa-fgf',
  async (
    req,
    res
  ) => {
    try {
      const response =
        await getFgfCompetition(
          'copaFgf'
        );

      res.json({
        ok: true,
        provider:
          'FGF',
        competition:
          'Copa FGF',
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          provider:
            'FGF',
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   FGF - TODOS OS JOGOS

   Pode usar:
   /api/fgf/jogos
   /api/fgf/jogos?date=2026-09-22
========================================================= */

app.get(
  '/api/fgf/jogos',
  async (
    req,
    res
  ) => {
    try {
      let response =
        await getAllFgfGames();

      const date =
        req.query.date;

      if (date) {
        response =
          response.filter(
            game =>
              game.date_br ===
              date
          );
      }

      response.sort(
        (a, b) =>
          new Date(
            a.event_date
          ) -
          new Date(
            b.event_date
          )
      );

      res.json({
        ok: true,
        provider:
          'FGF',
        date:
          date ||
          null,
        count:
          response.length,
        response
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          provider:
            'FGF',
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   NOTÍCIAS
========================================================= */

app.get(
  '/api/news',
  async (
    req,
    res
  ) => {
    const feeds = (
      process.env.NEWS_RSS ||
      ''
    )
      .split(',')
      .map(
        s =>
          s.trim()
      )
      .filter(
        Boolean
      );

    if (
      !feeds.length
    ) {
      return res.json({
        ok: true,
        response: []
      });
    }

    try {
      const items = [];

      for (
        const url
        of feeds
      ) {
        const feed =
          await parser.parseURL(
            url
          );

        for (
          const item
          of feed.items.slice(
            0,
            10
          )
        ) {
          items.push({
            tag:
              'M ESPORTES NOTÍCIAS',

            title:
              item.title,

            summary:
              (
                item.contentSnippet ||
                ''
              ).slice(
                0,
                280
              ),

            link:
              item.link,

            pubDate:
              item.pubDate
          });
        }
      }

      items.sort(
        (a, b) =>
          new Date(
            b.pubDate
          ) -
          new Date(
            a.pubDate
          )
      );

      res.json({
        ok: true,
        response:
          items.slice(
            0,
            30
          )
      });

    } catch (e) {
      res.status(502)
        .json({
          ok: false,
          error:
            e.message,
          response: []
        });
    }
  }
);

/* =========================================================
   RAIZ
========================================================= */

app.get(
  '/',
  (
    req,
    res
  ) => {
    res.json({
      ok: true,

      service:
        'M Esportes',

      providers: [
        'RPF PLACAR',
        'FGF'
      ],

      endpoints: [
        '/api/health',
        '/api/games/today',
        '/api/live',
        '/api/leagues',
        '/api/fgf/jogos',
        '/api/fgf/gauchao',
        '/api/fgf/a2',
        '/api/fgf/serie-b',
        '/api/fgf/copa-fgf',
        '/api/news'
      ]
    });
  }
);

/* =========================================================
   INICIAR
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `M Esportes + RPF + FGF rodando na porta ${PORT}`
    );
  }
);
