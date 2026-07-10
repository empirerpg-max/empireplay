const API_URL = "https://script.google.com/macros/s/AKfycby1S1mIBXdj4hLqc9RYv1ZJjL7d5ct6to18FNPmpJn1KOnZrYCKJKPNe2LP0dPW-G8HOg/exec";

let musicasDB = [];
let musicVideosDB = [];
let videosDB = [];
let currentTopicoId = null;
let currentCategoria = "musicas";
let forumAbaAtiva = "musicas";
let releasesAbaAtiva = "musicas";
let currentLyrics = "";

function norm(s) {
  return String(s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getField(item, ...aliases) {
  if (!item) return "";
  const keys = Object.keys(item);
  const normKeys = keys.map(k => ({ orig: k, norm: norm(k) }));
  for (const alias of aliases) {
    const target = norm(alias);
    const found = normKeys.find(k => k.norm === target);
    if (found && item[found.orig] !== undefined && item[found.orig] !== "" && item[found.orig] !== null) {
      return item[found.orig];
    }
  }
  return "";
}

const F = {
  data: (i) => getField(i, "data_de_lancamento", "datadelancamento", "data"),
  idTopico: (i) => getField(i, "id_do_topico", "idtopico", "id_topico"),
  idArquivo: (i) => getField(i, "id_do_arquivo", "idarquivo", "id_arquivo", "arquivo", "link", "url"),
  capa: (i) => getField(i, "capa_da_musica", "capadamusica", "capa", "cover"),
  letra: (i) => getField(i, "letra", "lyrics", "letra_da_musica"),
  comentariosPara: (i) => getField(i, "comentarios_para", "comentariospara"),
  idCriador: (i) => getField(i, "id_do_criador", "idcriador"),
  nomeMusica: (i) => getField(i, "nome_da_musica", "nomedamusica", "nome", "titulo"),
  tipoSingle: (i) => getField(i, "tipo_de_single", "tipodesingle"),
  tipoMusica: (i) => getField(i, "tipo_de_musica", "tipodemusica"),
  album: (i) => getField(i, "album"),
  weeks: (i) => getField(i, "weeks"),
  weeksVideo: (i) => getField(i, "weeks_video", "weeksvideo"),
  actPrincipal: (i) => getField(i, "act_principal", "actprincipal"),
  generoMusica: (i) => getField(i, "genero_da_musica", "generodamusica", "genero"),
  tipoClipe: (i) => getField(i, "tipo_de_clipe", "tipodeclipe"),
  generoVideo: (i) => getField(i, "genero"),
  tipo: (i) => getField(i, "tipo"),
};

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
  const s = String(str).trim();
  if (s.includes("youtube.com") || s.includes("youtu.be")) return { type: "youtube", id: extractYoutubeId(s) };
  if (s.includes("drive.google.com")) return { type: "drive", id: extractDriveId(s) };
  if (s.match(/\.(mp3|wav|ogg|aac)(\?|$)/i)) return { type: "direct", url: s };
  if (s.match(/^[a-zA-Z0-9_-]{20,}$/)) return { type: "drive", id: s };
  return { type: "none" };
}

function buildImageCandidates(capa) {
  if (!capa) return [];
  const s = String(capa).trim();
  const candidates = [];
  if (s.startsWith("http") && !s.includes("drive.google.com")) {
    candidates.push(s);
    return candidates;
  }
  const id = extractDriveId(s) || (s.match(/^[a-zA-Z0-9_-]{20,}$/) ? s : null);
  if (id) {
    candidates.push(`https://lh3.googleusercontent.com/d/${id}=w400`);
    candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w400`);
    candidates.push(`https://drive.google.com/uc?export=view&id=${id}`);
  }
  if (s.startsWith("http")) candidates.push(s);
  return candidates;
}

function imgWithFallback(capa, seed) {
  const candidates = buildImageCandidates(capa);
  const finalFallback = `https://picsum.photos/seed/${encodeURIComponent(seed || Math.random())}/300/300`;
  const chain = [...candidates, finalFallback];
  const first = chain.shift();
  const errorChain = chain.map(u => u.replace(/'/g, "\\'")).join("|||");
  return `data-chain="${errorChain}" src="${first}" onerror="tryNextImg(this)"`;
}

function tryNextImg(imgEl) {
  const chain = imgEl.dataset.chain ? imgEl.dataset.chain.split("|||") : [];
  if (chain.length === 0) { imgEl.onerror = null; imgEl.src = "https://via.placeholder.com/300x300?text=%E2%99%AB"; return; }
  const next = chain.shift();
  imgEl.dataset.chain = chain.join("|||");
  imgEl.src = next;
}
window.tryNextImg = tryNextImg;

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
  const directAudio = document.getElementById("direct-audio");
  if (directAudio) { directAudio.pause(); directAudio.src = ""; }
}

let currentPlayerType = null;

function playSong(rawSource, title, artist, cover, lyrics) {
  const src = detectSource(rawSource);
  console.log("Tentando tocar:", rawSource, "-> detectado como:", src);

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
    const audioEl = document.getElementById("direct-audio");
    audioEl.src = `https://drive.google.com/uc?export=download&id=${src.id}`;
    audioEl.play().catch(() => {
      alert("Este arquivo do Google Drive nao pode ser reproduzido.\n\nProvavel causa: o arquivo nao esta compartilhado como \"Qualquer pessoa com o link\".\n\nPeca para o dono do arquivo mudar a permissao de compartilhamento no Google Drive (clique direito no arquivo > Compartilhar > Qualquer pessoa com o link).");
    });
  } else if (src.type === "direct") {
    currentPlayerType = "direct"; stopAllPlayers();
    const audioEl = document.getElementById("direct-audio");
    audioEl.src = src.url; audioEl.play();
  } else {
    alert("Nao foi possivel identificar o link de reproducao. Valor recebido: " + rawSource);
  }
}

function toggleLyrics() {
  const panel = document.getElementById("lyrics-panel");
  document.getElementById("lyrics-text").textContent = currentLyrics || "Letra nao disponivel para este item.";
  panel.classList.toggle("hidden");
}

document.getElementById("play-pause-btn").addEventListener("click", () => {
  const icon = document.getElementById("controlIcon");
  if (currentPlayerType === "youtube" && ytPlayer) {
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); icon.className = "fa-solid fa-play"; }
    else { ytPlayer.playVideo(); icon.className = "fa-solid fa-pause"; }
  } else if (currentPlayerType === "direct" || currentPlayerType === "drive") {
    const audioEl = document.getElementById("direct-audio");
    if (audioEl.paused) { audioEl.play(); icon.className = "fa-solid fa-pause"; }
    else { audioEl.pause(); icon.className = "fa-solid fa-play"; }
  }
});

document.getElementById("progress").addEventListener("input", function () {
  if (currentPlayerType === "youtube" && ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(this.value, true);
  else if (currentPlayerType === "direct" || currentPlayerType === "drive") document.getElementById("direct-audio").currentTime = this.value;
});

document.getElementById("direct-audio").addEventListener("timeupdate", function () {
  if (currentPlayerType === "direct" || currentPlayerType === "drive") {
    const progress = document.getElementById("progress");
    if (this.duration) { progress.max = this.duration; progress.value = this.currentTime; }
    document.getElementById("time-current").textContent = formatTime(this.currentTime);
    document.getElementById("time-total").textContent = formatTime(this.duration);
  }
});
document.getElementById("direct-audio").addEventListener("ended", function () {
  document.getElementById("controlIcon").className = "fa-solid fa-play";
});

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

    console.log("Exemplo Musica:", musicasDB[0]);
    console.log("Exemplo MusicVideo:", musicVideosDB[0]);
    console.log("Exemplo Video:", videosDB[0]);

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
  const d = F.data(item);
  if (!d) return 0;
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

function renderRecentSongsFromSheet() {
  const el = document.getElementById("recent-songs");
  const ordenadas = [...musicasDB].sort((a,b) => parseDataLancamento(b) - parseDataLancamento(a)).slice(0, 8);
  el.innerHTML = ordenadas.map(m => `
    <div class="song" onclick="tocarMusica('${F.idTopico(m)}')">
      <div class="song-img"><img ${imgWithFallback(F.capa(m), F.idTopico(m))} alt=""/></div>
      <div class="song-title"><h2>${F.nomeMusica(m)}</h2><p>${F.actPrincipal(m)}</p></div>
    </div>`).join("");
}

function renderAlbumsFromSheet() {
  const albunsMap = {};
  musicasDB.forEach(m => {
    const album = F.album(m);
    if (album) albunsMap[album] = albunsMap[album] || { title: album, artist: F.actPrincipal(m), item: m };
  });
  document.getElementById("albums-grid").innerHTML = Object.values(albunsMap).map(a => `
    <div class="album">
      <div class="album-frame"><img ${imgWithFallback(F.capa(a.item), a.title)} alt="${a.title}"/></div>
      <h2>${a.title}</h2><p>${a.artist}</p>
    </div>`).join("");
}

function renderSwiperSlides() {
  const wrapper = document.getElementById("swiper-wrapper");
  const destaques = musicasDB.slice(0, 5);
  wrapper.innerHTML = destaques.map(m => `
    <div class="swiper-slide">
      <img ${imgWithFallback(F.capa(m), F.idTopico(m))} />
      <div class="slide-overlay">
        <h2>${F.nomeMusica(m)}</h2>
        <button onclick="tocarMusica('${F.idTopico(m)}')">Ouvir Agora <i class="fa-solid fa-circle-play"></i></button>
      </div>
    </div>`).join("");
  if (window.swiperInstance) window.swiperInstance.update();
}

function renderPlaylistsFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(F.weeks(b))||0) - (parseInt(F.weeks(a))||0)).slice(0, 12);
  document.getElementById("playlists-grid").innerHTML = ordenadas.map(m => `
    <div class="playlist-card" onclick="tocarMusica('${F.idTopico(m)}')">
      <img ${imgWithFallback(F.capa(m), F.idTopico(m))} alt="${F.nomeMusica(m)}"/>
      <h3>${F.nomeMusica(m)}</h3>
      <p>${F.weeks(m) || 0} semanas no topo</p>
    </div>`).join("");
}

function renderMusicVideosFromSheet() {
  document.getElementById("mv-grid").innerHTML = musicVideosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${F.idTopico(v)}','musicvideos')">
      <div class="video-thumb"><img ${imgWithFallback(F.capa(v), F.idTopico(v))} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${F.tipoClipe(v) || "Music Video"}</h3><p>${F.generoVideo(v)}</p></div>
    </div>`).join("");

  document.getElementById("my-video-list").innerHTML = videosDB.map(v => `
    <div class="video-card" onclick="tocarVideo('${F.idTopico(v)}','videos')">
      <div class="video-thumb"><img ${imgWithFallback(F.capa(v), F.idTopico(v))} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${F.tipo(v) || "Video"}</h3></div>
    </div>`).join("");
}

function renderTopVideosFromWeeks() {
  const ordenadas = [...musicVideosDB].sort((a,b) => (parseInt(F.weeksVideo(b))||0) - (parseInt(F.weeksVideo(a))||0)).slice(0, 12);
  document.getElementById("top-videos-grid").innerHTML = ordenadas.map(v => `
    <div class="video-card" onclick="tocarVideo('${F.idTopico(v)}','musicvideos')">
      <div class="video-thumb"><img ${imgWithFallback(F.capa(v), F.idTopico(v))} alt=""/><div class="play-overlay"><i class="fa fa-play"></i></div></div>
      <div class="video-info"><h3>${F.tipoClipe(v) || "Music Video"}</h3><p>${F.weeksVideo(v) || 0} semanas video</p></div>
    </div>`).join("");
}

function mudarAbaReleases(categoria) {
  releasesAbaAtiva = categoria;
  document.querySelectorAll(".releases-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.releases-tab[data-cat="${categoria}"]`).classList.add("active");
  renderReleases();
}

function renderReleases() {
  const el = document.getElementById("releases-grid");
  if (!el) return;
  let db, nomeFn, subFn, clickFn;
  if (releasesAbaAtiva === "musicas") {
    db = musicasDB; nomeFn = F.nomeMusica; subFn = F.actPrincipal;
    clickFn = (id) => `tocarMusica('${id}')`;
  } else if (releasesAbaAtiva === "musicvideos") {
    db = musicVideosDB; nomeFn = F.tipoClipe; subFn = F.generoVideo;
    clickFn = (id) => `tocarVideo('${id}','musicvideos')`;
  } else {
    db = videosDB; nomeFn = F.tipo; subFn = () => "";
    clickFn = (id) => `tocarVideo('${id}','videos')`;
  }

  const ordenados = [...db].sort((a,b) => parseDataLancamento(b) - parseDataLancamento(a)).slice(0, 10);
  el.innerHTML = ordenados.map(item => `
    <div class="release-card" onclick="${clickFn(F.idTopico(item))}">
      <img ${imgWithFallback(F.capa(item), F.idTopico(item))} alt=""/>
      <h3>${nomeFn(item) || "Sem titulo"}</h3>
      <p>${subFn(item) || ""}</p>
      <div class="release-date">${F.data(item) ? new Date(F.data(item)).toLocaleDateString('pt-BR') : ""}</div>
    </div>`).join("") || "<p class='forum-empty'>Nenhum lancamento ainda.</p>";
}

function tocarMusica(idTopico) {
  currentTopicoId = idTopico; currentCategoria = "musicas";
  const musica = musicasDB.find(m => String(F.idTopico(m)) === String(idTopico));
  if (!musica) return;
  playSong(F.idArquivo(musica), F.nomeMusica(musica), F.actPrincipal(musica), F.capa(musica), F.letra(musica));
  configurarBotaoForum(F.idTopico(musica), "musicas");
}

function tocarVideo(idTopico, categoria) {
  currentTopicoId = idTopico; currentCategoria = categoria;
  const db = categoria === "musicvideos" ? musicVideosDB : videosDB;
  const item = db.find(v => String(F.idTopico(v)) === String(idTopico));
  if (!item) return;
  const titulo = F.tipoClipe(item) || F.tipo(item) || "Video";
  playSong(F.idArquivo(item), titulo, "", F.capa(item), null);
  configurarBotaoForum(F.idTopico(item), categoria);
}

function configurarBotaoForum(idTopico, categoria) {
  const btn = document.getElementById("btn-ir-forum-icon");
  btn.onclick = () => irParaForum(idTopico, categoria);
}

function mudarAbaForum(categoria) {
  forumAbaAtiva = categoria;
  document.querySelectorAll(".forum-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.forum-tab[data-cat="${categoria}"]`).classList.add("active");
  renderForumTopicos();
}

function renderForumTopicos() {
  const el = document.getElementById("forum-topicos");
  if (!el) return;
  let db, nomeFn, subFn;
  if (forumAbaAtiva === "musicas") { db = musicasDB; nomeFn = F.nomeMusica; subFn = F.actPrincipal; }
  else if (forumAbaAtiva === "musicvideos") { db = musicVideosDB; nomeFn = F.tipoClipe; subFn = F.generoVideo; }
  else { db = videosDB; nomeFn = F.tipo; subFn = () => ""; }

  el.innerHTML = db.map(item => `
    <div class="forum-topico-card" onclick="abrirTopicoForum('${F.idTopico(item)}','${forumAbaAtiva}')">
      <img ${imgWithFallback(F.capa(item), F.idTopico(item))} alt=""/>
      <div><h3>${nomeFn(item) || "Sem titulo"}</h3><p>${subFn(item) || ""}</p></div>
      <i class="fa fa-chevron-right"></i>
    </div>`).join("") || "<p class='forum-empty'>Nenhum topico ainda.</p>";
}

async function abrirTopicoForum(idTopico, categoria) {
  currentTopicoId = idTopico; currentCategoria = categoria;
  let db, nomeFn, subFn, playFn, letraTxt;
  if (categoria === "musicas") {
    db = musicasDB; nomeFn = F.nomeMusica; subFn = F.actPrincipal;
    playFn = `tocarMusica('${idTopico}')`;
  } else if (categoria === "musicvideos") {
    db = musicVideosDB; nomeFn = F.tipoClipe; subFn = F.generoVideo;
    playFn = `tocarVideo('${idTopico}','musicvideos')`;
  } else {
    db = videosDB; nomeFn = F.tipo; subFn = () => "";
    playFn = `tocarVideo('${idTopico}','videos')`;
  }

  const item = db.find(m => String(F.idTopico(m)) === String(idTopico));
  if (!item) return;
  letraTxt = categoria === "musicas" ? F.letra(item) : "";

  document.getElementById("forum-topicos-view").classList.add("hidden");
  document.getElementById("forum-thread-view").classList.remove("hidden");

  document.getElementById("forum-thread-header").innerHTML = `
    <button class="forum-back" onclick="voltarListaForum()"><i class="fa fa-arrow-left"></i> Topicos</button>
    <div class="forum-thread-body">
      <div class="forum-topico-principal">
        <img class="forum-topico-capa" ${imgWithFallback(F.capa(item), F.idTopico(item))} alt=""/>
        <div class="forum-topico-info">
          <h2>${nomeFn(item) || "Sem titulo"}</h2>
          <p>${subFn(item) || ""}</p>
          <button class="forum-play-btn" onclick="${playFn}"><i class="fa fa-play"></i> Tocar</button>
        </div>
      </div>
      ${letraTxt ? `<div class="forum-letra-box"><h3><i class="fa fa-align-left"></i> Letra</h3><pre>${letraTxt}</pre></div>` : ""}
    </div>
  `;

  const listEl = document.getElementById("forum-comment-list");
  listEl.innerHTML = "<p>Carregando comentarios...</p>";
  try {
    const res = await fetch(`${API_URL}?action=comentarios&categoria=${categoria}&idTopico=${idTopico}`);
    const json = await res.json();
    const comentarios = json.data || [];
    listEl.innerHTML = comentarios.length
      ? comentarios.map(c => {
          const nome = getField(c, "nome_do_jogador", "nome") || "Anonimo";
          const texto = getField(c, "comentario", "texto");
          return `<div class="forum-comment"><strong>${nome}</strong><p>${texto}</p></div>`;
        }).join("")
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

window.swiperInstance = new Swiper(".swiper", {
  effect: "coverflow", grabCursor: true, centeredSlides: true, loop: true, speed: 600, slidesPerView: "auto",
  coverflowEffect: { rotate: 10, stretch: 120, depth: 200, modifier: 1, slideShadows: false },
  on: { click(e) { window.swiperInstance.slideTo(this.clickedIndex); } },
  pagination: { el: ".swiper-pagination" },
});

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

carregarTudo();
renderMySongs();
