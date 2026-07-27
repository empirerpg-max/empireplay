// ============================================================
//  EmpirePlay - app.js (v9 - Mapeamento definitivo por aba)
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycby1S1mIBXdj4hLqc9RYv1ZJjL7d5ct6to18FNPmpJn1KOnZrYCKJKPNe2LP0dPW-G8HOg/exec";

// ============================================================
//  MAPEAMENTO DEFINITIVO DE CAMPOS POR ABA
//  Baseado na estrutura real da planilha Empire Hub
// ============================================================

// Normaliza string para comparação sem acento/espaço/maiúsculas
function norm(s) {
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Busca campo em objeto pelo nome normalizado (suporta múltiplos aliases)
function gf(item, ...aliases) {
  if (!item) return "";
  const normKeys = Object.keys(item).map(k => ({ orig: k, n: norm(k) }));
  for (const alias of aliases) {
    const target = norm(alias);
    const found = normKeys.find(k => k.n === target);
    if (found && item[found.orig] !== undefined && item[found.orig] !== "" && item[found.orig] !== null) {
      return item[found.orig];
    }
  }
  return "";
}

// ── ABA MUSICAS ──────────────────────────────────────────────
// Colunas: Data de lançamento, ID do tópico, ID do arquivo,
//          Capa da música, Letra, Comentários para, ID do Criador,
//          Nome da música, TIPO DE SINGLE, TIPO DE MÚSICA, ALBUM,
//          WEEKS, WEEKS VIDEO, ACT PRINCIPAL, ARTISTA 2..6, GÊNERO, Ordem
const FM = {
  data:         (i) => gf(i, "Data de lançamento", "datadelancamento", "data"),
  idTopico:     (i) => gf(i, "ID do tópico", "idtopico", "id_topico"),
  idArquivo:    (i) => gf(i, "ID do arquivo", "idarquivo", "id_arquivo", "arquivo"),
  capa:         (i) => gf(i, "Capa da música", "capadamusica", "capa"),
  letra:        (i) => gf(i, "Letra", "letra_da_musica", "lyrics"),
  comentariosPara: (i) => gf(i, "Comentários para", "comentariospara"),
  idCriador:    (i) => gf(i, "ID do Criador", "idcriador", "id_do_criador"),
  nome:         (i) => gf(i, "Nome da música", "nomedamusica", "nome_da_musica", "nome"),
  tipoSingle:   (i) => gf(i, "TIPO DE SINGLE", "tipodesingle", "tipo_de_single"),
  tipoMusica:   (i) => gf(i, "TIPO DE MÚSICA", "tipodemusica", "tipo_de_musica"),
  album:        (i) => gf(i, "ALBUM", "album"),
  weeks:        (i) => gf(i, "WEEKS", "weeks"),
  weeksVideo:   (i) => gf(i, "WEEKS VIDEO", "weeksvideo", "weeks_video"),
  actPrincipal: (i) => gf(i, "ACT PRINCIPAL", "actprincipal", "act_principal"),
  artista2:     (i) => gf(i, "ARTISTA 2", "artista2"),
  artista3:     (i) => gf(i, "ARTISTA 3", "artista3"),
  artista4:     (i) => gf(i, "ARTISTA 4", "artista4"),
  artista5:     (i) => gf(i, "ARTISTA 5", "artista5"),
  artista6:     (i) => gf(i, "ARTISTA 6", "artista6"),
  genero:       (i) => gf(i, "GÊNERO", "genero", "generodamusica"),
  ordem:        (i) => gf(i, "Ordem", "ordem"),
  // Artistas combinados (act principal + feat)
  artistas:     (i) => {
    const arr = [FM.actPrincipal(i), FM.artista2(i), FM.artista3(i), FM.artista4(i), FM.artista5(i), FM.artista6(i)].filter(Boolean);
    return arr.join(", ");
  }
};

// ── ABA ALBUNS ───────────────────────────────────────────────
// Colunas: Data de lançamento, ID do tópico, Capa,
//          Comentários para, ID do Criador, Nome do criador, Nome
const FA = {
  data:           (i) => gf(i, "Data de lançamento", "datadelancamento", "data"),
  idTopico:       (i) => gf(i, "ID do tópico", "idtopico", "id_topico"),
  capa:           (i) => gf(i, "Capa", "capa"),
  comentariosPara:(i) => gf(i, "Comentários para", "comentariospara"),
  idCriador:      (i) => gf(i, "ID do Criador", "idcriador"),
  nomeCriador:    (i) => gf(i, "Nome do criador", "nomecriador", "nome_do_criador"),
  nome:           (i) => gf(i, "Nome", "nome"),
};

// ── ABA MUSIC VIDEOS ─────────────────────────────────────────
// Colunas: Data de lançamento, ID do tópico, ID do arquivo,
//          Thumb, Comentários para, ID do Criador, Nome, Nome do criador, Tipo
const FV = {
  data:           (i) => gf(i, "Data de lançamento", "datadelancamento", "data"),
  idTopico:       (i) => gf(i, "ID do tópico", "idtopico", "id_topico"),
  idArquivo:      (i) => gf(i, "ID do arquivo", "idarquivo", "id_arquivo", "arquivo", "link", "url"),
  thumb:          (i) => gf(i, "Thumb", "thumb", "capa", "Capa da música", "capadamusica"),
  comentariosPara:(i) => gf(i, "Comentários para", "comentariospara"),
  idCriador:      (i) => gf(i, "ID do Criador", "idcriador"),
  nome:           (i) => gf(i, "Nome", "nome", "nome_da_musica", "titulo"),
  nomeCriador:    (i) => gf(i, "Nome do criador", "nomecriador"),
  tipo:           (i) => gf(i, "Tipo", "tipo"),
};

// ── COMENTARIOS_ALBUNS (padrão músicas/álbuns) ───────────────
// Colunas: ID do tópico, ID do jogador, Nome do jogador, Comentário, Data
const FC_A = {
  idTopico:    (i) => gf(i, "ID do tópico", "idtopico"),
  idJogador:   (i) => gf(i, "ID do jogador", "idjogador"),
  nomeJogador: (i) => gf(i, "Nome do jogador", "nomejogador", "nome_do_jogador", "nome"),
  comentario:  (i) => gf(i, "Comentário", "comentario", "texto"),
  data:        (i) => gf(i, "Data", "data"),
};

// ── COMENTARIOS_VIDEOS (nomenclatura Telegram) ───────────────
// Colunas: telegram_topic_id, telegram_message_id, texto, autor,
//          id_usuario, data, reacoes
const FC_V = {
  idTopico:   (i) => gf(i, "telegram_topic_id", "idtopico", "id_topico"),
  msgId:      (i) => gf(i, "telegram_message_id"),
  texto:      (i) => gf(i, "texto", "comentario"),
  autor:      (i) => gf(i, "autor", "nome", "nomejogador"),
  idUsuario:  (i) => gf(i, "id_usuario"),
  data:       (i) => gf(i, "data"),
  reacoes:    (i) => gf(i, "reacoes"),
};

// ── CHARTS ───────────────────────────────────────────────────
// Top_50_Spotify / Top_Songs_Apple_Music:
//   Capa da música, ID do tópico, Link do áudio, ID do criador, Nome da música, Posição
// Top_Videos_YT:
//   Thumb, ID do tópico, Link do áudio, ID do criador, Nome do vídeo, Posição
const FC_CHART = {
  capa:      (i) => gf(i, "Capa da música", "capadamusica", "Thumb", "thumb"),
  idTopico:  (i) => gf(i, "ID do tópico", "idtopico"),
  linkAudio: (i) => gf(i, "Link do áudio", "linkdoaudio", "link_do_audio", "idarquivo", "id_arquivo"),
  idCriador: (i) => gf(i, "ID do criador", "idcriador"),
  nome:      (i) => gf(i, "Nome da música", "nomedamusica", "Nome do vídeo", "nomedomusica", "nome"),
  posicao:   (i) => gf(i, "Posição", "posicao"),
};

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let musicasDB     = [];
let musicVideosDB = [];
let videosDB      = [];
let albumsDB      = [];
let currentTopicoId  = null;
let currentCategoria = "musicas";
let forumAbaAtiva    = "musicas";
let releasesAbaAtiva = "musicas";
let currentLyrics    = "";

// ============================================================
//  UTILITÁRIOS DE IMAGEM
// ============================================================
function extractDriveId(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/) || s.match(/id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (!/^https?:\/\//.test(s) && !s.includes("/") && s.length > 10) return s;
  return null;
}

function buildImageCandidates(capa) {
  if (!capa) return [];
  const s = String(capa).trim();
  if (!s) return [];
  // URL direta não-Drive → usa direto
  if (s.startsWith("http") && !s.includes("drive.google.com")) return [s];
  const id = extractDriveId(s) || (s.match(/^[a-zA-Z0-9_-]{20,}$/) ? s : null);
  if (!id) return s.startsWith("http") ? [s] : [];
  return [
    `https://lh3.googleusercontent.com/d/${id}=w400`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ];
}

function imgWithFallback(capa, seed) {
  const candidates = buildImageCandidates(capa);
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(seed || "x")}/300/300`;
  const chain = [...candidates, fallback];
  const first = chain.shift();
  const errorChain = chain.map(u => String(u).replace(/'/g, "\\'")).join("|||");
  return `data-chain="${errorChain}" src="${first}" onerror="tryNextImg(this)"`;
}

function tryNextImg(imgEl) {
  const chain = imgEl.dataset.chain ? imgEl.dataset.chain.split("|||") : [];
  if (!chain.length) { imgEl.onerror = null; imgEl.src = "https://picsum.photos/seed/empire/300/300"; return; }
  const next = chain.shift();
  imgEl.dataset.chain = chain.join("|||");
  imgEl.src = next;
}
window.tryNextImg = tryNextImg;

// ============================================================
//  UTILITÁRIOS DE ÁUDIO/VÍDEO
// ============================================================
function extractYoutubeId(str) {
  if (!str) return null;
  const m = String(str).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function detectSource(str) {
  if (!str || String(str).trim() === "") return { type: "none" };
  const s = String(str).trim();
  if (s.includes("youtube.com") || s.includes("youtu.be")) return { type: "youtube", id: extractYoutubeId(s) };
  if (s.includes("drive.google.com")) return { type: "drive", id: extractDriveId(s) };
  if (s.match(/\.(mp3|wav|ogg|aac)(\?|$)/i)) return { type: "direct", url: s };
  if (s.match(/^[a-zA-Z0-9_-]{25,}$/)) return { type: "drive", id: s };
  return { type: "none" };
}

// ============================================================
//  PLAYER YOUTUBE
// ============================================================
let ytPlayer = null, ytReady = false, ytPendingId = null;

function onYouTubeIframeAPIReady() {
  ytReady = true;
  ytPlayer = new YT.Player("yt-player-container", {
    height: "1", width: "1",
    playerVars: { autoplay: 0, controls: 0 },
    events: {
      onReady: () => { if (ytPendingId) { playYoutubeId(ytPendingId); ytPendingId = null; } },
      onStateChange: onYtStateChange,
    },
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function onYtStateChange(event) {
  const icon = document.getElementById("controlIcon");
  if (!icon) return;
  if (event.data === YT.PlayerState.PLAYING)  { icon.className = "fa-solid fa-pause"; startProgressLoop(); }
  else if (event.data === YT.PlayerState.PAUSED) { icon.className = "fa-solid fa-play"; }
  else if (event.data === YT.PlayerState.ENDED)  { icon.className = "fa-solid fa-play"; }
}

function playYoutubeId(id) {
  if (!ytReady || !ytPlayer || !ytPlayer.loadVideoById) { ytPendingId = id; return; }
  stopAllPlayers();
  ytPlayer.loadVideoById(id);
  ytPlayer.playVideo();
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

let progressInterval;
function startProgressLoop() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime) {
      const dur = ytPlayer.getDuration(), cur = ytPlayer.getCurrentTime();
      const prog = document.getElementById("progress");
      if (prog && dur) { prog.max = dur; prog.value = cur; }
      const tc = document.getElementById("time-current");
      const tt = document.getElementById("time-total");
      if (tc) tc.textContent = formatTime(cur);
      if (tt) tt.textContent = formatTime(dur);
    }
  }, 500);
}

function stopAllPlayers() {
  clearInterval(progressInterval);
  if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
  const audio = document.getElementById("direct-audio");
  if (audio) { audio.pause(); audio.src = ""; }
  const wrap = document.getElementById("drive-iframe-wrap");
  const iframe = document.getElementById("drive-iframe");
  if (wrap) wrap.classList.add("hidden");
  if (iframe) iframe.src = "";
}

let currentPlayerType = null;

function playSong(rawSource, title, artist, cover, lyrics) {
  const src = detectSource(rawSource);
  if (src.type === "none") {
    console.warn("EmpirePlay: fonte não identificada →", rawSource);
    showToast("Não foi possível identificar a fonte de reprodução.");
    return;
  }

  document.getElementById("bottom-player").classList.remove("hidden");
  document.getElementById("player-title").textContent  = title  || "-";
  document.getElementById("player-artist").textContent = artist || "-";

  const coverEl = document.getElementById("player-cover");
  const cands = buildImageCandidates(cover);
  coverEl.onerror = () => tryNextImg(coverEl);
  coverEl.dataset.chain = cands.slice(1).join("|||");
  coverEl.src = cands[0] || `https://picsum.photos/seed/${encodeURIComponent(title||"x")}/300/300`;

  document.getElementById("controlIcon").className = "fa-solid fa-pause";
  currentLyrics = lyrics || "";
  const lp = document.getElementById("lyrics-panel");
  if (lp) lp.classList.add("hidden");

  if (src.type === "youtube") {
    currentPlayerType = "youtube";
    document.getElementById("drive-iframe-wrap").classList.add("hidden");
    document.getElementById("drive-iframe").src = "";
    playYoutubeId(src.id);
  } else if (src.type === "drive") {
    currentPlayerType = "drive";
    stopAllPlayers();
    document.getElementById("drive-iframe-wrap").classList.remove("hidden");
    document.getElementById("drive-iframe").src = `https://drive.google.com/file/d/${src.id}/preview`;
  } else if (src.type === "direct") {
    currentPlayerType = "direct";
    stopAllPlayers();
    document.getElementById("drive-iframe-wrap").classList.add("hidden");
    const audioEl = document.getElementById("direct-audio");
    audioEl.src = src.url;
    audioEl.play().catch(e => console.error("Audio play error:", e));
  }
}

function toggleLyrics() {
  const panel = document.getElementById("lyrics-panel");
  const txt   = document.getElementById("lyrics-text");
  if (txt) txt.textContent = currentLyrics || "Letra não disponível para este item.";
  if (panel) panel.classList.toggle("hidden");
}

document.getElementById("play-pause-btn").addEventListener("click", () => {
  const icon = document.getElementById("controlIcon");
  if (currentPlayerType === "youtube" && ytPlayer) {
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); icon.className = "fa-solid fa-play"; }
    else { ytPlayer.playVideo(); icon.className = "fa-solid fa-pause"; }
  } else if (currentPlayerType === "direct") {
    const audio = document.getElementById("direct-audio");
    if (audio.paused) { audio.play(); icon.className = "fa-solid fa-pause"; }
    else { audio.pause(); icon.className = "fa-solid fa-play"; }
  }
});

document.getElementById("progress").addEventListener("input", function () {
  if (currentPlayerType === "youtube" && ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(this.value, true);
  else if (currentPlayerType === "direct") {
    const a = document.getElementById("direct-audio");
    a.currentTime = this.value;
  }
});

document.getElementById("direct-audio").addEventListener("timeupdate", function () {
  if (currentPlayerType !== "direct") return;
  const prog = document.getElementById("progress");
  if (this.duration) { prog.max = this.duration; prog.value = this.currentTime; }
  document.getElementById("time-current").textContent = formatTime(this.currentTime);
  document.getElementById("time-total").textContent   = formatTime(this.duration);
});

document.getElementById("direct-audio").addEventListener("ended", () => {
  const icon = document.getElementById("controlIcon");
  if (icon) icon.className = "fa-solid fa-play";
});

// ============================================================
//  NAVEGAÇÃO
// ============================================================
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const section = item.dataset.section;
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
    const el = document.getElementById(section);
    if (el) el.classList.add("active-section");
  });
});

function irParaForum(idTopico, categoria) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  const navForum = document.querySelector('.nav-item[data-section="forum"]');
  if (navForum) navForum.classList.add("active");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
  const forumEl = document.getElementById("forum");
  if (forumEl) forumEl.classList.add("active-section");
  mudarAbaForum(categoria || "musicas");
  abrirTopicoForum(idTopico, categoria || "musicas");
}

// ============================================================
//  TOAST FEEDBACK
// ============================================================
function showToast(msg) {
  let t = document.getElementById("empire-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "empire-toast";
    t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.style.opacity = "0"; }, 2800);
}

// ============================================================
//  CARREGAMENTO DE DADOS
// ============================================================
let _carregando = false;

async function carregarTudo() {
  if (_carregando) return;
  _carregando = true;
  showLoading(true);
  try {
    const [rMusicas, rMV, rVideos, rAlbuns] = await Promise.all([
      fetch(`${API_URL}?action=conteudo&categoria=musicas`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}?action=conteudo&categoria=musicvideos`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}?action=conteudo&categoria=videos`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}?action=conteudo&categoria=albuns`).then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    musicasDB     = rMusicas.data  || [];
    musicVideosDB = rMV.data       || [];
    videosDB      = rVideos.data   || [];
    albumsDB      = rAlbuns.data   || [];

    renderRecentSongs();
    renderAlbuns();
    renderSwiperSlides();
    renderTopPlaylists();
    renderMusicVideos();
    renderVideos();
    renderTopVideos();
    renderForumTopicos();
    renderReleases();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    showToast("Erro ao carregar conteúdo. Tente recarregar a página.");
  } finally {
    _carregando = false;
    showLoading(false);
  }
}

function showLoading(show) {
  let overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:8888;";
    overlay.innerHTML = '<div style="color:#fff;font-size:18px;"><i class="fa fa-spinner fa-spin"></i> Carregando...</div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? "flex" : "none";
}

function parseData(item, mapFn) {
  const d = mapFn.data(item);
  if (!d) return 0;
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

// ============================================================
//  RENDERS
// ============================================================

// Músicas recentes (coluna lateral)
function renderRecentSongs() {
  const el = document.getElementById("recent-songs");
  if (!el) return;
  const sorted = [...musicasDB].sort((a, b) => parseData(b, FM) - parseData(a, FM)).slice(0, 8);
  el.innerHTML = sorted.map(m => `
    <div class="song" onclick="tocarMusica('${escAttr(FM.idTopico(m))}')">
      <div class="song-img"><img ${imgWithFallback(FM.capa(m), FM.idTopico(m))} alt="${escHtml(FM.nome(m))}"/></div>
      <div class="song-title">
        <h2>${escHtml(FM.nome(m))}</h2>
        <p>${escHtml(FM.actPrincipal(m))}</p>
      </div>
    </div>`).join("") || "<p class='forum-empty'>Nenhuma música ainda.</p>";
}

// Álbuns na Home
function renderAlbuns() {
  // Prioriza aba Álbuns se disponível, fallback para agrupamento por Músicas
  let albunsData = albumsDB.length ? albumsDB.map(a => ({
    title:  FA.nome(a),
    artist: FA.nomeCriador(a),
    capa:   FA.capa(a),
    id:     FA.idTopico(a),
  })) : [];

  if (!albunsData.length) {
    const map = {};
    musicasDB.forEach(m => {
      const al = FM.album(m);
      if (al && !map[al]) map[al] = { title: al, artist: FM.actPrincipal(m), capa: FM.capa(m), id: al };
    });
    albunsData = Object.values(map);
  }

  const html = albunsData.map(a => `
    <div class="album">
      <div class="album-frame"><img ${imgWithFallback(a.capa, a.id)} alt="${escHtml(a.title)}"/></div>
      <h2>${escHtml(a.title)}</h2>
      <p>${escHtml(a.artist)}</p>
    </div>`).join("") || "<p class='forum-empty'>Nenhum álbum ainda.</p>";

  const g1 = document.getElementById("albums-grid");
  const g2 = document.getElementById("albums-grid-page");
  if (g1) g1.innerHTML = html;
  if (g2) g2.innerHTML = html;
}

// Swiper destaques
function renderSwiperSlides() {
  const wrapper = document.getElementById("swiper-wrapper");
  if (!wrapper) return;
  const destaques = [...musicasDB].sort((a, b) => parseData(b, FM) - parseData(a, FM)).slice(0, 5);
  wrapper.innerHTML = destaques.map(m => `
    <div class="swiper-slide">
      <img ${imgWithFallback(FM.capa(m), FM.idTopico(m))} alt="${escHtml(FM.nome(m))}"/>
      <div class="slide-overlay">
        <h2>${escHtml(FM.nome(m))}</h2>
        <p>${escHtml(FM.artistas(m))}</p>
        <button onclick="tocarMusica('${escAttr(FM.idTopico(m))}')">Ouvir Agora <i class="fa-solid fa-circle-play"></i></button>
      </div>
    </div>`).join("");
  if (window.swiperInstance) window.swiperInstance.update();
}

// Top Playlists (por WEEKS)
function renderTopPlaylists() {
  const el = document.getElementById("playlists-grid");
  if (!el) return;
  const sorted = [...musicasDB].sort((a, b) => (parseInt(FM.weeks(b)) || 0) - (parseInt(FM.weeks(a)) || 0)).slice(0, 12);
  el.innerHTML = sorted.map(m => `
    <div class="playlist-card" onclick="tocarMusica('${escAttr(FM.idTopico(m))}')">
      <img ${imgWithFallback(FM.capa(m), FM.idTopico(m))} alt="${escHtml(FM.nome(m))}"/>
      <h3>${escHtml(FM.nome(m))}</h3>
      <p>${escHtml(FM.actPrincipal(m))}</p>
      <span class="weeks-badge">${FM.weeks(m) || 0} sem. no topo</span>
    </div>`).join("") || "<p class='forum-empty'>Sem dados de chart ainda.</p>";
}

// Music Videos
function renderMusicVideos() {
  const el = document.getElementById("mv-grid");
  if (!el) return;
  el.innerHTML = musicVideosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${escAttr(FV.idTopico(v))}','musicvideos')">
      <div class="video-thumb">
        <img ${imgWithFallback(FV.thumb(v), FV.idTopico(v))} alt="${escHtml(FV.nome(v))}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info">
        <h3>${escHtml(FV.nome(v) || "Music Video")}</h3>
        <p>${escHtml(FV.tipo(v) || "")}</p>
        <p class="video-criador">${escHtml(FV.nomeCriador(v) || "")}</p>
      </div>
    </div>`).join("") || "<p class='forum-empty'>Nenhum Music Video ainda.</p>";
}

// Vídeos gerais
function renderVideos() {
  const el = document.getElementById("my-video-list");
  if (!el) return;
  el.innerHTML = videosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${escAttr(FV.idTopico(v))}','videos')">
      <div class="video-thumb">
        <img ${imgWithFallback(FV.thumb(v), FV.idTopico(v))} alt="${escHtml(FV.nome(v))}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info">
        <h3>${escHtml(FV.nome(v) || "Vídeo")}</h3>
        <p>${escHtml(FV.tipo(v) || "")}</p>
        <p class="video-criador">${escHtml(FV.nomeCriador(v) || "")}</p>
      </div>
    </div>`).join("") || "<p class='forum-empty'>Nenhum vídeo ainda.</p>";
}

// Top Vídeos (por WEEKS VIDEO)
function renderTopVideos() {
  const el = document.getElementById("top-videos-grid");
  if (!el) return;
  const sorted = [...musicVideosDB].sort((a, b) => (parseInt(FM.weeksVideo(b)) || 0) - (parseInt(FM.weeksVideo(a)) || 0)).slice(0, 12);
  el.innerHTML = sorted.map(v => `
    <div class="video-card" onclick="tocarVideo('${escAttr(FV.idTopico(v))}','musicvideos')">
      <div class="video-thumb">
        <img ${imgWithFallback(FV.thumb(v), FV.idTopico(v))} alt="${escHtml(FV.nome(v))}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info">
        <h3>${escHtml(FV.nome(v) || "Music Video")}</h3>
        <p>${escHtml(FV.nomeCriador(v) || "")}</p>
        <span class="weeks-badge">${FM.weeksVideo(v) || 0} sem. em vídeo</span>
      </div>
    </div>`).join("") || "<p class='forum-empty'>Sem dados de chart ainda.</p>";
}

// Releases recentes (abas: músicas / musicvideos / videos)
function mudarAbaReleases(categoria) {
  releasesAbaAtiva = categoria;
  document.querySelectorAll(".releases-tab").forEach(t => t.classList.remove("active"));
  const tab = document.querySelector(`.releases-tab[data-cat="${categoria}"]`);
  if (tab) tab.classList.add("active");
  renderReleases();
}

function renderReleases() {
  const el = document.getElementById("releases-grid");
  if (!el) return;
  let items, nomeFn, subFn, clickFn, capaFn;
  if (releasesAbaAtiva === "musicas") {
    items = [...musicasDB].sort((a, b) => parseData(b, FM) - parseData(a, FM)).slice(0, 10);
    nomeFn  = m => FM.nome(m);
    subFn   = m => FM.artistas(m);
    capaFn  = m => FM.capa(m);
    clickFn = m => `tocarMusica('${escAttr(FM.idTopico(m))}')`;
  } else if (releasesAbaAtiva === "musicvideos") {
    items = [...musicVideosDB].sort((a, b) => parseData(b, FV) - parseData(a, FV)).slice(0, 10);
    nomeFn  = v => FV.nome(v) || "Music Video";
    subFn   = v => FV.tipo(v) || "";
    capaFn  = v => FV.thumb(v);
    clickFn = v => `tocarVideo('${escAttr(FV.idTopico(v))}','musicvideos')`;
  } else {
    items = [...videosDB].sort((a, b) => parseData(b, FV) - parseData(a, FV)).slice(0, 10);
    nomeFn  = v => FV.nome(v) || "Vídeo";
    subFn   = v => FV.nomeCriador(v) || "";
    capaFn  = v => FV.thumb(v);
    clickFn = v => `tocarVideo('${escAttr(FV.idTopico(v))}','videos')`;
  }
  const mapFn = releasesAbaAtiva === "musicas" ? FM : FV;
  el.innerHTML = items.map(item => `
    <div class="release-card" onclick="${clickFn(item)}">
      <img ${imgWithFallback(capaFn(item), mapFn.idTopico(item))} alt=""/>
      <h3>${escHtml(nomeFn(item))}</h3>
      <p>${escHtml(subFn(item))}</p>
      <div class="release-date">${mapFn.data(item) ? new Date(mapFn.data(item)).toLocaleDateString("pt-BR") : ""}</div>
    </div>`).join("") || "<p class='forum-empty'>Nenhum lançamento ainda.</p>";
}

// ============================================================
//  TOCAR
// ============================================================
function tocarMusica(idTopico) {
  currentTopicoId  = idTopico;
  currentCategoria = "musicas";
  const m = musicasDB.find(x => String(FM.idTopico(x)) === String(idTopico));
  if (!m) { console.warn("Música não encontrada:", idTopico); return; }
  playSong(FM.idArquivo(m), FM.nome(m), FM.artistas(m), FM.capa(m), FM.letra(m));
  configurarBotaoForum(idTopico, "musicas");
}

function tocarVideo(idTopico, categoria) {
  currentTopicoId  = idTopico;
  currentCategoria = categoria;
  const db   = categoria === "musicvideos" ? musicVideosDB : videosDB;
  const item = db.find(x => String(FV.idTopico(x)) === String(idTopico));
  if (!item) { console.warn("Vídeo não encontrado:", idTopico, categoria); return; }
  playSong(FV.idArquivo(item), FV.nome(item) || "Vídeo", FV.nomeCriador(item) || "", FV.thumb(item), null);
  configurarBotaoForum(idTopico, categoria);
}

function configurarBotaoForum(idTopico, categoria) {
  const btn = document.getElementById("btn-ir-forum-icon");
  if (btn) btn.onclick = () => irParaForum(idTopico, categoria);
}

// ============================================================
//  FÓRUM
// ============================================================
function mudarAbaForum(categoria) {
  forumAbaAtiva = categoria;
  document.querySelectorAll(".forum-tab").forEach(t => t.classList.remove("active"));
  const tab = document.querySelector(`.forum-tab[data-cat="${categoria}"]`);
  if (tab) tab.classList.add("active");
  renderForumTopicos();
}

function renderForumTopicos() {
  const el = document.getElementById("forum-topicos");
  if (!el) return;
  let db, nomeFn, subFn, capaFn, idFn;
  if (forumAbaAtiva === "musicas") {
    db = musicasDB; nomeFn = m => FM.nome(m); subFn = m => FM.artistas(m); capaFn = m => FM.capa(m); idFn = m => FM.idTopico(m);
  } else if (forumAbaAtiva === "musicvideos") {
    db = musicVideosDB; nomeFn = v => FV.nome(v) || "Music Video"; subFn = v => FV.tipo(v) || ""; capaFn = v => FV.thumb(v); idFn = v => FV.idTopico(v);
  } else {
    db = videosDB; nomeFn = v => FV.nome(v) || "Vídeo"; subFn = v => FV.nomeCriador(v) || ""; capaFn = v => FV.thumb(v); idFn = v => FV.idTopico(v);
  }
  el.innerHTML = db.map(item => `
    <div class="forum-topico-card" onclick="abrirTopicoForum('${escAttr(idFn(item))}','${forumAbaAtiva}')">
      <img ${imgWithFallback(capaFn(item), idFn(item))} alt=""/>
      <div>
        <h3>${escHtml(nomeFn(item))}</h3>
        <p>${escHtml(subFn(item))}</p>
      </div>
      <i class="fa fa-chevron-right"></i>
    </div>`).join("") || "<p class='forum-empty'>Nenhum tópico ainda.</p>";
}

async function abrirTopicoForum(idTopico, categoria) {
  currentTopicoId  = idTopico;
  currentCategoria = categoria;

  let item, nomeFn, subFn, capaFn, playFn, letraHtml = "";

  if (categoria === "musicas") {
    item   = musicasDB.find(x => String(FM.idTopico(x)) === String(idTopico));
    nomeFn = () => FM.nome(item);
    subFn  = () => FM.artistas(item);
    capaFn = () => FM.capa(item);
    playFn = `tocarMusica('${escAttr(idTopico)}')`;
    if (item && FM.letra(item)) {
      letraHtml = `<div class="forum-letra-box"><h3><i class="fa fa-align-left"></i> Letra</h3><pre>${escHtml(FM.letra(item))}</pre></div>`;
    }
  } else if (categoria === "musicvideos") {
    item   = musicVideosDB.find(x => String(FV.idTopico(x)) === String(idTopico));
    nomeFn = () => FV.nome(item) || "Music Video";
    subFn  = () => FV.tipo(item) || "";
    capaFn = () => FV.thumb(item);
    playFn = `tocarVideo('${escAttr(idTopico)}','musicvideos')`;
  } else {
    item   = videosDB.find(x => String(FV.idTopico(x)) === String(idTopico));
    nomeFn = () => FV.nome(item) || "Vídeo";
    subFn  = () => FV.nomeCriador(item) || "";
    capaFn = () => FV.thumb(item);
    playFn = `tocarVideo('${escAttr(idTopico)}','videos')`;
  }

  if (!item) { console.warn("Item não encontrado no fórum:", idTopico, categoria); return; }

  document.getElementById("forum-topicos-view").classList.add("hidden");
  document.getElementById("forum-thread-view").classList.remove("hidden");

  document.getElementById("forum-thread-header").innerHTML = `
    <button class="forum-back" onclick="voltarListaForum()"><i class="fa fa-arrow-left"></i> Tópicos</button>
    <div class="forum-thread-body">
      <div class="forum-topico-principal">
        <img class="forum-topico-capa" ${imgWithFallback(capaFn(), idTopico)} alt=""/>
        <div class="forum-topico-info">
          <h2>${escHtml(nomeFn())}</h2>
          <p>${escHtml(subFn())}</p>
          <button class="forum-play-btn" onclick="${playFn}"><i class="fa fa-play"></i> Tocar</button>
        </div>
      </div>
      ${letraHtml}
    </div>`;

  await carregarComentariosForum(idTopico, categoria);
}

async function carregarComentariosForum(idTopico, categoria) {
  const listEl = document.getElementById("forum-comment-list");
  if (!listEl) return;
  listEl.innerHTML = "<p class='forum-loading'><i class='fa fa-spinner fa-spin'></i> Carregando...</p>";
  try {
    const res  = await fetch(`${API_URL}?action=comentarios&categoria=${categoria}&idTopico=${idTopico}`);
    const json = await res.json();
    const comentarios = json.data || [];
    // Suporte às duas nomenclaturas: Comentarios_Albuns e Comentarios_Videos
    listEl.innerHTML = comentarios.length
      ? comentarios.map(c => {
          const isVideo = categoria === "videos";
          const nome    = isVideo ? FC_V.autor(c) : FC_A.nomeJogador(c);
          const texto   = isVideo ? FC_V.texto(c) : FC_A.comentario(c);
          const reacoes = isVideo ? FC_V.reacoes(c) : "";
          const data    = (isVideo ? FC_V.data(c) : FC_A.data(c)) || "";
          return `
            <div class="forum-comment">
              <div class="forum-comment-header">
                <strong>${escHtml(nome || "Anônimo")}</strong>
                ${data ? `<span class="comment-date">${new Date(data).toLocaleDateString("pt-BR")}</span>` : ""}
              </div>
              <p>${escHtml(texto || "")}</p>
              ${reacoes ? `<div class="forum-reacoes">${escHtml(reacoes)}</div>` : ""}
            </div>`;
        }).join("")
      : "<p class='forum-empty'>Nenhum comentário ainda. Seja o primeiro! 🎵</p>";
  } catch (err) {
    listEl.innerHTML = "<p class='forum-empty'>Erro ao carregar comentários.</p>";
    console.error("Erro comentários:", err);
  }
}

function voltarListaForum() {
  document.getElementById("forum-thread-view").classList.add("hidden");
  document.getElementById("forum-topicos-view").classList.remove("hidden");
}

async function enviarComentario() {
  const nomeEl  = document.getElementById("forum-nome");
  const textoEl = document.getElementById("forum-texto");
  const nome    = nomeEl.value.trim() || "Anônimo";
  const texto   = textoEl.value.trim();
  if (!texto || !currentTopicoId) return;

  const btn = document.querySelector(".forum-add-inline button");
  if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action:      "novoComentario",
        categoria:   currentCategoria,
        idTopico:    currentTopicoId,
        nomeJogador: nome,
        comentario:  texto,
      }),
    });
    textoEl.value = "";
    showToast("Comentário enviado! 🎉");
    await carregarComentariosForum(currentTopicoId, currentCategoria);
  } catch (err) {
    showToast("Erro ao enviar comentário.");
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Comentar"; }
  }
}

// ============================================================
//  SWIPER
// ============================================================
window.swiperInstance = new Swiper(".swiper", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  loop: true,
  speed: 600,
  slidesPerView: "auto",
  coverflowEffect: { rotate: 10, stretch: 120, depth: 200, modifier: 1, slideShadows: false },
  on: { click() { window.swiperInstance.slideTo(this.clickedIndex); } },
  pagination: { el: ".swiper-pagination" },
});

// ============================================================
//  MINHAS MÚSICAS (local)
// ============================================================
let mySongs = [];
function renderMySongs() {
  const el = document.getElementById("my-song-list");
  if (!el) return;
  el.innerHTML = mySongs.map((s, i) => `
    <div class="song-row" onclick="playSong('${escAttr(s.url)}','${escAttr(s.title)}','${escAttr(s.artist)}','','')">
      <div class="type-icon"><i class="fa fa-music"></i></div>
      <div class="song-row-info"><h3>${escHtml(s.title)}</h3><p>${escHtml(s.artist)}</p></div>
      <button onclick="event.stopPropagation();mySongs.splice(${i},1);renderMySongs()" style="background:none;border:none;color:#ff6b6b;cursor:pointer;"><i class="fa fa-trash"></i></button>
    </div>`).join("") || "<p class='forum-empty'>Nenhuma música adicionada.</p>";
}

function addSong() {
  const title  = document.getElementById("song-title-input").value.trim();
  const artist = document.getElementById("song-artist-input").value.trim();
  const url    = document.getElementById("song-url-input").value.trim();
  if (!url) { showToast("Informe o link do áudio."); return; }
  mySongs.push({ title: title || "Sem título", artist: artist || "Desconhecido", url });
  renderMySongs();
  document.getElementById("song-title-input").value = "";
  document.getElementById("song-artist-input").value = "";
  document.getElementById("song-url-input").value = "";
}

// ============================================================
//  ESCAPE HELPERS (prevenção XSS)
// ============================================================
function escHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function escAttr(str) {
  return String(str || "").replace(/'/g, "\\'");
}

// ============================================================
//  INIT
// ============================================================
carregarTudo();
renderMySongs();
