// ============================================================
//  EmpirePlay - app.js (v4 - Spotify style + glassmorphism)
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycby1S1mIBXdj4hLqc9RYv1ZJjL7d5ct6to18FNPmpJn1KOnZrYCKJKPNe2LP0dPW-G8HOg/exec";

let musicasDB = [];
let musicVideosDB = [];
let videosDB = [];
let currentTopicoId = null;
let currentCategoria = "musicas";
let forumAbaAtiva = "musicas";
let releasesAbaAtiva = "musicas";
let currentLyrics = "";

// ---------- NAVEGACAO ----------
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const section = item.dataset.section;
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
    document.getElementById(section).classList.add("active-section");
  });
});

function irParaForum(idTopico, categoria) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  document.querySelector('.nav-item[data-section="forum"]').classList.add("active");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
  document.getElementById("forum").classList.add("active-section");
  mudarAbaForum(categoria || "musicas");
  abrirTopicoForum(idTopico, categoria || "musicas");
}

// ---------- HELPERS DE LINK ----------
function extractDriveId(str) {
  if (!str) return null;
  const m = String(str).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(str).match(/id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (!/^https?:\/\//.test(str) && !str.includes("/")) return str.trim();
  return null;
}

function extractYoutubeId(str) {
  if (!str) return null;
  const m = String(str).match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function detectSource(str) {
  if (!str) return { type: "none" };
  const s = String(str);
  if (s.includes("youtube.com") || s.includes("youtu.be")) return { type: "youtube", id: extractYoutubeId(s) };
  if (s.includes("drive.google.com")) return { type: "drive", id: extractDriveId(s) };
  if (s.match(/\.(mp3|wav|ogg|aac)(\?|$)/i)) return { type: "direct", url: s };
  return { type: "drive", id: s.trim() };
}

// ---------- IMAGEM EM CASCATA (corrige capas quebradas) ----------
function buildImageCandidates(capa) {
  if (!capa) return [];
  const s = String(capa).trim();
  const candidates = [];
  if (s.startsWith("http") && !s.includes("drive.google.com")) {
    candidates.push(s);
    return candidates;
  }
  const id = extractDriveId(s);
  if (id) {
    candidates.push(`https://lh3.googleusercontent.com/d/${id}=w400`);
    candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w400`);
    candidates.push(`https://drive.google.com/uc?export=view&id=${id}`);
  }
  if (s.startsWith("http")) candidates.push(s);
  return candidates;
}

function imgWithFallback(capa, seed, cssClass) {
  const candidates = buildImageCandidates(capa);
  const finalFallback = `https://picsum.photos/seed/${encodeURIComponent(seed || Math.random())}/300/300`;
  const chain = [...candidates, finalFallback];
  const first = chain.shift();
  const errorChain = chain.map(u => u.replace(/'/g, "\\'")).join("|||");
  return `data-chain="${errorChain}" src="${first}" onerror="tryNextImg(this)" class="${cssClass||''}"`;
}

function tryNextImg(imgEl) {
  const chain = imgEl.dataset.chain ? imgEl.dataset.chain.split("|||") : [];
  if (chain.length === 0) { imgEl.onerror = null; imgEl.src = "https://via.placeholder.com/300x300?text=%E2%99%AB"; return; }
  const next = chain.shift();
  imgEl.dataset.chain = chain.join("|||");
  imgEl.src = next;
}
window.tryNextImg = tryNextImg;

// ---------- YOUTUBE IFRAME API ----------
let ytPlayer = null, ytReady = false, ytPendingId = null;

function onYouTubeIframeAPIReady() {
  ytReady = true;
  ytPlayer = new YT.Player('yt-player-container', {
    height: '1', width: '1',
    playerVars: { autoplay: 0, controls: 0 },
    events: {
      onReady: () => { if (ytPendingId) { playYoutubeId(ytPendingId); ytPendingId = null; } },
      onStateChange: onYtStateChange
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function onYtStateChange(event) {
  const icon = document.getElementById("controlIcon");
  if (event.data === YT.PlayerState.PLAYING) { icon.className = "fa-solid fa-pause"; startProgressLoop(); }
  else if (event.data === YT.PlayerState.PAUSED) { icon.className = "fa-solid fa-play"; }
  else if (event.data === YT.PlayerState.ENDED) { icon.className = "fa-solid fa-play"; }
}

function playYoutubeId(id) {
  if (!ytReady || !ytPlayer || !ytPlayer.loadVideoById) { ytPendingId = id; return; }
  stopAllPlayers();
  ytPlayer.loadVideoById(id);
  ytPlayer.playVideo();
}

let progressInterval;
function startProgressLoop() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime) {
      const dur = ytPlayer.getDuration(), cur = ytPlayer.getCurrentTime();
      const progress = document.getElementById("progress");
      if (dur) { progress.max = dur; progress.value = cur; }
      document.getElementById("time-current").textContent = formatTime(cur);
      document.getElementById("time-total").textContent = formatTime(dur);
    }
  }, 500);
}

function stopAllPlayers() {
  clearInterval(progressInterval);
  if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
  const driveIframe = document.getElementById("drive-audio-iframe");
  if (driveIframe) driveIframe.src = "";
  const directAudio = document.getElementById("direct-audio");
  if (directAudio) directAudio.pause();
}

// ---------- PLAYER ----------
let currentPlayerType = null;

function playSong(rawSource, title, artist, cover, lyrics) {
  const src = detectSource(rawSource);
  document.getElementById("bottom-player").classList.remove("hidden");
  document.getElementById("player-title").textContent = title || "-";
  document.getElementById("player-artist").textContent = artist || "-";

  const coverEl = document.getElementById("player-cover");
  const candidates = buildImageCandidates(cover);
  coverEl.dataset.chain = candidates.slice(1).join("|||");
  coverEl.onerror = () => tryNextImg(coverEl);
  coverEl.src = candidates[0] || `https://picsum.photos/seed/${encodeURIComponent(title||"x")}/300/300`;

  document.getElementById("controlIcon").className = "fa-solid fa-pause";
  currentLyrics = lyrics || "";
  document.getElementById("lyrics-panel").classList.add("hidden");

  if (src.type === "youtube" && src.id) { currentPlayerType = "youtube"; playYoutubeId(src.id); }
  else if (src.type === "drive" && src.id) {
    currentPlayerType = "drive"; stopAllPlayers();
    document.getElementById("drive-audio-iframe").src = `https://drive.google.com/file/d/${src.id}/preview`;
  } else if (src.type === "direct") {
    currentPlayerType = "direct"; stopAllPlayers();
    const audioEl = document.getElementById("direct-audio");
    audioEl.src = src.url; audioEl.play();
  } else {
    alert("Nao foi possivel identificar o link de reproducao.");
  }
}

function toggleLyrics() {
  const panel = document.getElementById("lyrics-panel");
  if (!currentLyrics) { document.getElementById("lyrics-text").textContent = "Letra nao disponivel para este item."; }
  else { document.getElementById("lyrics-text").textContent = currentLyrics; }
  panel.classList.toggle("hidden");
}

document.getElementById("play-pause-btn").addEventListener("click", () => {
  const icon = document.getElementById("controlIcon");
  if (currentPlayerType === "youtube" && ytPlayer) {
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); icon.className = "fa-solid fa-play"; }
    else { ytPlayer.playVideo(); icon.className = "fa-solid fa-pause"; }
  } else if (currentPlayerType === "direct") {
    const audioEl = document.getElementById("direct-audio");
    if (audioEl.paused) { audioEl.play(); icon.className = "fa-solid fa-pause"; }
    else { audioEl.pause(); icon.className = "fa-solid fa-play"; }
  } else if (currentPlayerType === "drive") {
    const iframe = document.getElementById("drive-audio-iframe");
    if (iframe.src) { iframe.src = ""; icon.className = "fa-solid fa-play"; }
    else { icon.className = "fa-solid fa-pause"; }
  }
});

document.getElementById("progress").addEventListener("input", function () {
  if (currentPlayerType === "youtube" && ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(this.value, true);
  else if (currentPlayerType === "direct") document.getElementById("direct-audio").currentTime = this.value;
});

// ---------- CARREGAR DADOS ----------
async function carregarTudo() {
  try {
    const [rMusicas, rMV, rVideos] = await Promise.all([
      fetch(`${API_URL}?action=conteudo&categoria=musicas`).then(r => r.json()),
      fetch(`${API_URL}?action=conteudo&categoria=musicvideos`).then(r => r.json()),
      fetch(`${API_URL}?action=conteudo&categoria=videos`).then(r => r.json())
    ]);
    musicasDB = rMusicas.data || [];
    musicVideosDB = rMV.data || [];
    videosDB = rVideos.data || [];

    renderRecentSongsFromSheet();
    renderAlbumsFromSheet();
    renderSwiperSlides();
    renderPlaylistsFromWeeks();
    renderMusicVideosFromSheet();
    renderTopVideosFromWeeks();
    renderForumTopicos();
    renderReleases();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

function parseDataLancamento(item) {
  const d = item.data_de_lancamento;
  if (!d) return 0;
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

function coverAttr(item, cssClass) {
  const capa = item.capa_da_musica || item.capa;
  return imgWithFallback(capa, item.id_do_topico || item.nome_da_musica, cssClass);
}

function renderRecentSongsFromSheet() {
  const el = document.getElementById("recent-songs");
  const ordenadas = [...musicasDB].sort((a,b) => parseDataLancamento(b) - parseDataLancamento(a)).slice(0, 8);
  el.innerHTML = ordenadas.map(m => `
    <div class="song" onclick="tocarMusica('${m.id_do_topico}')">
      <div class="song-img"><img ${coverAttr(m)} alt=""/></div>
      <div class="song-title"><h2>${m.nome_da_musica}</h2><p>${m.act_principal || ""}</p></div>
    </div>`).join("");
}

function renderAlbumsFromSheet() {
  const albunsMap = {};
  musicasDB.forEach(m => {
    if (m.album) albunsMap[m.album] = albunsMap[m.album] || { title: m.album, artist: m.act_principal, item: m };
  });
  document.getElementById("albums-grid").innerHTML = Object.values(albunsMap).map(a => `
    <div class="album">
      <div class="album-frame"><img ${coverAttr(a.item)} alt="${a.title}"/></div>
      <h2>${a.title}</h2><p>${a.artist}</p>
    </div>`).join("");
}

function renderSwiperSlides() {
  const wrapper = document.getElementById("swiper-wrapper");
  const destaques = musicasDB.slice(0, 5);
  wrapper.innerHTML = destaques.map(m => `
    <div class="swiper-slide">
      <img ${coverAttr(m)} />
      <div class="slide-overlay">
        <h2>${m.nome_da_musica}</h2>
        <button onclick="tocarMusica('${m.id_do_topico}')">Ouvir Agora <i class="fa-solid fa-circle-play"></i></button>
      </div>
    </div>`).join("");
  if (window.swiperInstance) window.swiperInstance.update();
}

function renderPlaylistsFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(b.weeks)||0) - (parseInt(a.weeks)||0)).slice(0, 12);
  document.getElementById("playlists-grid").innerHTML = ordenadas.map(m => `
    <div class="playlist-card" onclick="tocarMusica('${m.id_do_topico}')">
      <img ${coverAttr(m)} alt="${m.nome_da_musica}"/>
      <h3>${m.nome_da_musica}</h3>
      <p>${m.weeks || 0} semanas no topo</p>
    </div>`).join("");
}

function renderMusicVideosFromSheet() {
  document.getElementById("mv-grid").innerHTML = musicVideosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${v.id_do_topico}','musicvideos')">
      <div class="video-thumb"><img ${coverAttr(v)} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${v.tipo_de_clipe || "Music Video"}</h3><p>${v.genero || ""}</p></div>
    </div>`).join("");

  document.getElementById("my-video-list").innerHTML = videosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${v.id_do_topico}','videos')">
      <div class="video-thumb"><img ${coverAttr(v)} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${v.tipo || "Video"}</h3></div>
    </div>`).join("");
}

function renderTopVideosFromWeeks() {
  const ordenadas = [...musicVideosDB].sort((a,b) => (parseInt(b.weeks_video)||0) - (parseInt(a.weeks_video)||0)).slice(0, 12);
  document.getElementById("top-videos-grid").innerHTML = ordenadas.map(v => `
    <div class="video-card" onclick="tocarVideo('${v.id_do_topico}','musicvideos')">
      <div class="video-thumb"><img ${coverAttr(v)} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${v.tipo_de_clipe || "Music Video"}</h3><p>${v.weeks_video || 0} semanas video</p></div>
    </div>`).join("");
}

// ---------- ULTIMOS LANCAMENTOS (Home) ----------
function mudarAbaReleases(categoria) {
  releasesAbaAtiva = categoria;
  document.querySelectorAll(".releases-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.releases-tab[data-cat="${categoria}"]`).classList.add("active");
  renderReleases();
}

function renderReleases() {
  const el = document.getElementById("releases-grid");
  if (!el) return;
  let db, nomeCampo, clickFn;
  if (releasesAbaAtiva === "musicas") { db = musicasDB; nomeCampo = "nome_da_musica"; clickFn = (id) => `tocarMusica('${id}')`; }
  else if (releasesAbaAtiva === "musicvideos") { db = musicVideosDB; nomeCampo = "tipo_de_clipe"; clickFn = (id) => `tocarVideo('${id}','musicvideos')`; }
  else { db = videosDB; nomeCampo = "tipo"; clickFn = (id) => `tocarVideo('${id}','videos')`; }

  const ordenados = [...db].sort((a,b) => parseDataLancamento(b) - parseDataLancamento(a)).slice(0, 10);
  el.innerHTML = ordenados.map(item => `
    <div class="release-card" onclick="${clickFn(item.id_do_topico)}">
      <img ${coverAttr(item)} alt=""/>
      <h3>${item[nomeCampo] || "Sem titulo"}</h3>
      <p>${item.act_principal || item.genero || ""}</p>
      <div class="release-date">${item.data_de_lancamento ? new Date(item.data_de_lancamento).toLocaleDateString('pt-BR') : ""}</div>
    </div>`).join("") || "<p class='forum-empty'>Nenhum lancamento ainda.</p>";
}

// ---------- TOCAR MUSICA / VIDEO ----------
function tocarMusica(idTopico) {
  currentTopicoId = idTopico; currentCategoria = "musicas";
  const musica = musicasDB.find(m => String(m.id_do_topico) === String(idTopico));
  if (!musica) return;
  playSong(musica.id_do_arquivo, musica.nome_da_musica, musica.act_principal, musica.capa_da_musica, musica.letra);
  configurarBotaoForum(musica.id_do_topico, "musicas");
}

function tocarVideo(idTopico, categoria) {
  currentTopicoId = idTopico; currentCategoria = categoria;
  const db = categoria === "musicvideos" ? musicVideosDB : videosDB;
  const item = db.find(v => String(v.id_do_topico) === String(idTopico));
  if (!item) return;
  const titulo = item.tipo_de_clipe || item.tipo || "Video";
  playSong(item.id_do_arquivo, titulo, "", item.capa, null);
  configurarBotaoForum(item.id_do_topico, categoria);
}

function configurarBotaoForum(idTopico, categoria) {
  const btn = document.getElementById("btn-ir-forum-icon");
  btn.onclick = () => irParaForum(idTopico, categoria);
}

// ---------- FORUM ----------
function mudarAbaForum(categoria) {
  forumAbaAtiva = categoria;
  document.querySelectorAll(".forum-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.forum-tab[data-cat="${categoria}"]`).classList.add("active");
  renderForumTopicos();
}

function renderForumTopicos() {
  const el = document.getElementById("forum-topicos");
  if (!el) return;
  let db, nomeCampo, subCampo;
  if (forumAbaAtiva === "musicas") { db = musicasDB; nomeCampo = "nome_da_musica"; subCampo = "act_principal"; }
  else if (forumAbaAtiva === "musicvideos") { db = musicVideosDB; nomeCampo = "tipo_de_clipe"; subCampo = "genero"; }
  else { db = videosDB; nomeCampo = "tipo"; subCampo = ""; }

  el.innerHTML = db.map(item => `
    <div class="forum-topico-card" onclick="abrirTopicoForum('${item.id_do_topico}','${forumAbaAtiva}')">
      <img ${coverAttr(item)} alt=""/>
      <div><h3>${item[nomeCampo] || "Sem titulo"}</h3><p>${subCampo ? (item[subCampo] || "") : ""}</p></div>
      <i class="fa fa-chevron-right"></i>
    </div>`).join("") || "<p class='forum-empty'>Nenhum topico ainda.</p>";
}

async function abrirTopicoForum(idTopico, categoria) {
  currentTopicoId = idTopico; currentCategoria = categoria;
  let db, nomeCampo, subCampo, playFn;
  if (categoria === "musicas") { db = musicasDB; nomeCampo = "nome_da_musica"; subCampo = "act_principal"; playFn = `tocarMusica('${idTopico}')`; }
  else if (categoria === "musicvideos") { db = musicVideosDB; nomeCampo = "tipo_de_clipe"; subCampo = "genero"; playFn = `tocarVideo('${idTopico}','musicvideos')`; }
  else { db = videosDB; nomeCampo = "tipo"; subCampo = ""; playFn = `tocarVideo('${idTopico}','videos')`; }

  const item = db.find(m => String(m.id_do_topico) === String(idTopico));
  if (!item) return;

  document.getElementById("forum-topicos-view").classList.add("hidden");
  document.getElementById("forum-thread-view").classList.remove("hidden");
  document.getElementById("forum-thread-header").innerHTML = `
    <button class="forum-back" onclick="voltarListaForum()"><i class="fa fa-arrow-left"></i> Topicos</button>
    <img ${coverAttr(item)} alt=""/>
    <div><h2>${item[nomeCampo] || "Sem titulo"}</h2><p>${subCampo ? (item[subCampo] || "") : ""}</p></div>
    <button class="forum-play-btn" onclick="${playFn}"><i class="fa fa-play"></i> Tocar</button>
  `;

  const listEl = document.getElementById("forum-comment-list");
  listEl.innerHTML = "<p>Carregando comentarios...</p>";
  try {
    const res = await fetch(`${API_URL}?action=comentarios&categoria=${categoria}&idTopico=${idTopico}`);
    const json = await res.json();
    const comentarios = json.data || [];
    listEl.innerHTML = comentarios.length
      ? comentarios.map(c => `<div class="forum-comment"><strong>${c.nome_do_jogador}</strong><p>${c.comentario}</p></div>`).join("")
      : "<p class='forum-empty'>Nenhum comentario ainda. Seja o primeiro!</p>";
  } catch (err) {
    listEl.innerHTML = "<p class='forum-empty'>Erro ao carregar comentarios.</p>";
    console.error(err);
  }
}

function voltarListaForum() {
  document.getElementById("forum-thread-view").classList.add("hidden");
  document.getElementById("forum-topicos-view").classList.remove("hidden");
}

async function enviarComentario() {
  const nome = document.getElementById("forum-nome").value.trim() || "Anonimo";
  const texto = document.getElementById("forum-texto").value.trim();
  if (!texto || !currentTopicoId) return;
  await fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "novoComentario", categoria: currentCategoria, idTopico: currentTopicoId, nomeJogador: nome, comentario: texto })
  });
  document.getElementById("forum-texto").value = "";
  abrirTopicoForum(currentTopicoId, currentCategoria);
}

// ---------- SWIPER ----------
window.swiperInstance = new Swiper(".swiper", {
  effect: "coverflow", grabCursor: true, centeredSlides: true, loop: true, speed: 600, slidesPerView: "auto",
  coverflowEffect: { rotate: 10, stretch: 120, depth: 200, modifier: 1, slideShadows: false },
  on: { click(e) { window.swiperInstance.slideTo(this.clickedIndex); } },
  pagination: { el: ".swiper-pagination" },
});

// ---------- MINHAS MUSICAS ----------
let mySongs = [];
function renderMySongs() {
  const el = document.getElementById("my-song-list");
  if (!el) return;
  el.innerHTML = mySongs.map((s, i) => `
    <div class="song-row" onclick="playSong('${s.url}','${s.title}','${s.artist}')">
      <div class="type-icon"><i class="fa fa-music"></i></div>
      <div class="song-row-info"><h3>${s.title}</h3><p>${s.artist}</p></div>
      <button onclick="event.stopPropagation();mySongs.splice(${i},1);renderMySongs()" style="background:none;border:none;color:#ff6b6b;cursor:pointer;"><i class="fa fa-trash"></i></button>
    </div>`).join("");
}
function addSong() {
  const title = document.getElementById("song-title-input").value.trim();
  const artist = document.getElementById("song-artist-input").value.trim();
  const url = document.getElementById("song-url-input").value.trim();
  if (!url) return;
  mySongs.push({ title: title || "Sem titulo", artist: artist || "Desconhecido", url });
  renderMySongs();
  document.getElementById("song-title-input").value = "";
  document.getElementById("song-artist-input").value = "";
  document.getElementById("song-url-input").value = "";
}

// ---------- INIT ----------
carregarTudo();
renderMySongs();
