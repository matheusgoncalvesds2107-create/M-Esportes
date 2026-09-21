<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, viewport-fit=cover"
  >

  <meta name="theme-color" content="#050505">

  <title>M Esportes</title>

  <link rel="stylesheet" href="./src.css">
</head>

<body>

<div class="app">

  <!-- TOPO -->
  <header class="topbar">

    <div>
      <div class="brand">
        ⚽ M ESPORTES
      </div>

      <div class="subtitle">
        FUTEBOL • PLACAR • NOTÍCIAS
      </div>
    </div>

    <button
      id="refreshBtn"
      class="icon-btn"
      type="button"
      aria-label="Atualizar"
    >
      ↻
    </button>

  </header>


  <main class="content">


    <!-- ========================= -->
    <!-- HOME -->
    <!-- ========================= -->

    <section
      id="page-home"
      class="page active"
    >


      <!-- M ESPORTES 3 MINUTOS -->

      <div class="hero">

        <div>

          <div class="hero-label">
            🔴 M ESPORTES 3 MINUTOS
          </div>

          <h1>
            JORNAL ESPORTIVO
          </h1>

          <p>
            Futebol do Brasil e do mundo em um só lugar.
          </p>

        </div>

      </div>


      <!-- PRÉ-JOGO -->

      <div class="section-head">

        <div>

          <span class="news-tag">
            M ESPORTES 3 MINUTOS APRESENTA
          </span>

          <h2>
            ESQUENTANDO O JOGO
          </h2>

        </div>

        <span>
          PRÉ-JOGO
        </span>

      </div>


      <div class="news-card">

        <div class="news-tag">
          ⚽ DESTAQUE M ESPORTES
        </div>

        <h3>
          Futebol em tempo real
        </h3>

        <p>
          Pré-jogo, informações, escalações,
          resultados e os principais acontecimentos
          das partidas do dia.
        </p>

      </div>


      <!-- ========================= -->
      <!-- M ESPORTES AGORA -->
      <!-- ========================= -->

      <div class="section-head">

        <div>

          <span class="news-tag">
            CENTRAL DE NOTÍCIAS
          </span>

          <h2>
            M ESPORTES AGORA
          </h2>

        </div>

        <span>
          ATUALIZAÇÃO
        </span>

      </div>


      <div
        id="newsList"
        class="news-list"
      ></div>


      <!-- ========================= -->
      <!-- JOGOS -->
      <!-- ========================= -->

      <div class="section-head">

        <h2>
          Jogos de hoje
        </h2>

        <span id="todayCount">
          0 jogos
        </span>

      </div>


      <div
        id="homeGames"
        class="games-list"
      ></div>


    </section>



    <!-- ========================= -->
    <!-- AO VIVO -->
    <!-- ========================= -->

    <section
      id="page-live"
      class="page"
    >

      <div class="section-head page-title">

        <h2>
          🔴 Ao vivo
        </h2>

        <span id="liveCount">
          0 partidas
        </span>

      </div>


      <div
        id="liveGames"
        class="games-list"
      ></div>

    </section>



    <!-- ========================= -->
    <!-- FAVORITOS -->
    <!-- ========================= -->

    <section
      id="page-favorites"
      class="page"
    >

      <div class="section-head page-title">

        <h2>
          ⭐ Favoritos
        </h2>

        <span id="favoritesCount">
          0 jogos
        </span>

      </div>


      <div class="info-card">

        <strong>
          Notificações dos jogos escolhidos
        </strong>

        <p>
          Marque a estrela somente nos jogos que
          você quer acompanhar.
        </p>

        <p>
          O M Esportes avisa apenas esses jogos no:
          início, intervalo e fim.
        </p>

        <button
          id="notificationBtn"
          class="primary-btn"
          type="button"
        >
          ATIVAR NOTIFICAÇÕES
        </button>

      </div>


      <div
        id="favoriteGames"
        class="games-list"
      ></div>

    </section>



    <!-- ========================= -->
    <!-- LIGAS -->
    <!-- ========================= -->

    <section
      id="page-leagues"
      class="page"
    >

      <div class="section-head page-title">

        <h2>
          🏆 Tabelas e Ligas
        </h2>

        <span id="leaguesCount">
          0 ligas
        </span>

      </div>


      <div
        id="leaguesList"
        class="leagues-list"
      ></div>

    </section>


  </main>



  <!-- ========================= -->
  <!-- MENU INFERIOR -->
  <!-- ========================= -->

  <nav class="bottom-nav">


    <button
      class="nav-item active"
      data-page="home"
      type="button"
    >

      <span class="nav-icon">
        ⌂
      </span>

      <span>
        Home
      </span>

    </button>


    <button
      class="nav-item"
      data-page="live"
      type="button"
    >

      <span class="nav-icon live-dot">
        ●
      </span>

      <span>
        Ao vivo
      </span>

    </button>


    <button
      class="nav-item"
      data-page="favorites"
      type="button"
    >

      <span class="nav-icon">
        ★
      </span>

      <span>
        Favoritos
      </span>

    </button>


    <button
      class="nav-item"
      data-page="leagues"
      type="button"
    >

      <span class="nav-icon">
        ▦
      </span>

      <span>
        Ligas
      </span>

    </button>


  </nav>

</div>


<script
  type="module"
  src="./src.js"
></script>

</body>
</html>
