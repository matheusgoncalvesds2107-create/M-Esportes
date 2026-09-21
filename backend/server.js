import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const RPF_BASE = (
  process.env.RPF_API_BASE ||
  'https://radioplacar-api.onrender.com'
).replace(/\/$/, '');

const cache = new Map();

/* =========================
   CACHE
========================= */

async function cached(key, ttl, fn) {
  const hit = cache.get(key);

  if (hit && Date.now() - hit.t < ttl) {
    return hit.v;
  }

  const value = await fn();

  cache.set(key, {
    t: Date.now(),
    v: value
  });

  return value;
}

/* =========================
   DATA BRASIL
========================= */

function todayBR() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/* =========================
   AUXILIAR
========================= */

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

/* =========================
   STATUS
========================= */

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
      'not_started',
      'scheduled',
      'agendado',
      'pending'
    ].includes(s)
  ) {
    return 'NS';
  }

  if (s.includes('interval')) return 'HT';

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

  return String(raw).toUpperCase();
}

/* =========================
   NORMALIZAR JOGO
========================= */

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
        'date',
        'fixture.date',
        'start_time'
      )}`
  );

  const dateRaw = first(
    m,
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

  if (!start && dateRaw) {
    try {
      start = new Date(dateRaw).toLocaleTimeString(
        'pt-BR',
        {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit'
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
    'minute',
    'elapsed',
    'status.elapsed',
    'fixture.status.elapsed'
  );

  return {
    id,

    league:
      first(
        m,
        'league.name',
        'competition.name',
        'championship',
        'league',
        'competition'
      ) || 'Campeonato',

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
      ) || '',

    home:
      first(
        m,
        'teams.home.name',
        'home.name',
        'home_team.name',
        'home_team',
        'home'
      ) || 'Mandante',

    away:
      first(
        m,
        'teams.away.name',
        'away.name',
        'away_team.name',
        'away_team',
        'away'
      ) || 'Visitante',

    homeLogo: first(
      m,
      'teams.home.logo',
      'home.logo',
      'home_team.logo',
      'home_logo'
    ),

    awayLogo: first(
      m,
      'teams.away.logo',
      'away.logo',
      'away_team.logo',
      'away_logo'
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

    status: normalizeStatus(rawStatus),

    minute:
      minute == null
        ? null
        : Number(minute),

    start: start || '--:--',

    date: dateRaw || null,

    rawStatus
  };
}

/* =========================
   EXTRAIR ARRAY
========================= */

function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of [
    'response',
    'matches',
    'games',
    'fixtures',
    'data',
    'results'
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (
    Array.isArray(data?.response?.data)
  ) {
    return data.response.data;
  }

  return [];
}

/* =========================
   ACESSO RPF PLACAR
========================= */

async function rpf(path) {
  const url = `${RPF_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'M-Esportes/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(
      `RPF API respondeu ${response.status} em ${path}`
    );
  }

  return response.json();
}

/* =========================
   BUSCAR PARTIDAS
========================= */

async function getMatches(date) {
  const paths = [
    `/api/matches?date=${encodeURIComponent(date)}`,
    `/api/rpf/candidatos?date=${encodeURIComponent(
      date
    )}`
  ];

  let lastError;

  for (const path of paths) {
    try {
      const data = await rpf(path);

      const arr = extractArray(data);

      if (
        arr.length ||
        data?.ok
      ) {
        return arr.map(normalizeGame);
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

/* =========================
   HEALTH
========================= */

app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    service: 'm-esportes',
    provider: 'RPF PLACAR',
    rpfBase: RPF_BASE,
    cache: {
      today: '60s',
      live: '20s'
    }
  });
});

/* =========================
   JOGOS DO DIA
========================= */

app.get('/api/games/today', async (req, res) => {
  const date =
    req.query.date ||
    todayBR();

  try {
    const response = await cached(
      `games:${date}`,
      60000,
      () => getMatches(date)
    );

    res.json({
      ok: true,
      date,
      count: response.length,
      response
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      provider: 'RPF PLACAR',
      error: e.message,
      date,
      response: []
    });
  }
});

/* =========================
   AO VIVO
========================= */

app.get('/api/live', async (req, res) => {
  const date =
    req.query.date ||
    todayBR();

  try {
    const all = await cached(
      `live:${date}`,
      20000,
      () => getMatches(date)
    );

    const response = all.filter((g) =>
      ['1H', 'HT', '2H'].includes(g.status)
    );

    res.json({
      ok: true,
      date,
      count: response.length,
      response
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      provider: 'RPF PLACAR',
      error: e.message,
      date,
      response: []
    });
  }
});

/* =========================
   LIGAS
========================= */

app.get('/api/leagues', async (req, res) => {
  const date =
    req.query.date ||
    todayBR();

  try {
    const games = await cached(
      `games:${date}`,
      60000,
      () => getMatches(date)
    );

    const map = new Map();

    for (const g of games) {
      const key =
        `${g.country}|${g.league}`;

      if (!map.has(key)) {
        map.set(key, {
          id: g.league_id,
          name: g.league,
          country: g.country,
          games: 0
        });
      }

      map.get(key).games++;
    }

    const response = [
      ...map.values()
    ].sort((a, b) =>
      (a.country + a.name).localeCompare(
        b.country + b.name,
        'pt-BR'
      )
    );

    res.json({
      ok: true,
      date,
      count: response.length,
      response
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e.message,
      response: []
    });
  }
});

/* =========================
   NOTÍCIAS
========================= */

app.get('/api/news', async (req, res) => {
  const feeds = (
    process.env.NEWS_RSS || ''
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!feeds.length) {
    return res.json({
      ok: true,
      response: []
    });
  }

  try {
    const items = [];

    for (const url of feeds) {
      const feed =
        await parser.parseURL(url);

      for (
        const item of feed.items.slice(
          0,
          10
        )
      ) {
        items.push({
          tag: 'M ESPORTES NOTÍCIAS',
          title: item.title,
          summary:
            (
              item.contentSnippet || ''
            ).slice(0, 280),

          link: item.link,
          pubDate: item.pubDate
        });
      }
    }

    items.sort(
      (a, b) =>
        new Date(b.pubDate) -
        new Date(a.pubDate)
    );

    res.json({
      ok: true,
      response: items.slice(0, 30)
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e.message,
      response: []
    });
  }
});

/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(PORT, () => {
  console.log(
    `M Esportes + RPF PLACAR rodando na porta ${PORT}`
  );
});
