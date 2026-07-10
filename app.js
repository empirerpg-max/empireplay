// ============================================================
//  EmpirePlay - app.js (v2 - correcao de player e forum)
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycby1S1mIBXdj4hLqc9RYv1ZJjL7d5ct6to18FNPmpJn1KOnZrYCKJKPNe2LP0dPW-G8HOg/exec";

let musicasDB = [];
let currentTopicoId = null;

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

function irParaForum(idTopico) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  document.querySelector('.nav-item[data-section="forum"]').classList.add("active");
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active-section"));
  document.getElementById("forum").classList.add("active-section");
  abrirTopicoForum(idTopico);
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
  if (s.includes("youtube.com") || s.includes("youtu.be")) {
    return { type: "youtube", id: extractYoutubeId(s) };
  }
  if (s.includes("drive.google.com")) {
    return { type: "drive", id: extractDriveId(s) };
  }
  if (s.match(/\.(mp3|wav|ogg|aac)(\?|$)/i)) {
    return { type: "direct", url: s };
  }
  return { type: "drive", id: s.trim() };
}

function getImageUrl(capa) {
  if (!capa) return null;
  const s = String(capa);
  if (s.includes("drive.google.com") || (!s.includes("/") && !s.startsWith("http"))) {
    const id = extractDriveId(s);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
  }
  return s;
}

// ---------- PLAYER ----------
function playSong(rawSource, title, artist, cover) {
  const src = detectSource(rawSource);
  const player = document.getElementById("video-player");
  const iframe = document.getElementById("video-iframe");
  const titleEl = document.getElementById("video-title");
  const artistEl = document.getElementById("video-artist");
  const coverImg = document.getElementById("video-cover");

  let embedUrl = null;
  if (src.type === "youtube" && src.id) {
    embedUrl = `https://www.youtube.com/embed/${src.id}?autoplay=1`;
  } else if (src.type === "drive" && src.id) {
    embedUrl = `https://drive.google.com/file/d/${src.id}/preview`;
  } else if (src.type === "direct") {
    playDirectAudio(src.url, title, artist, cover);
    return;
  }

  if (!embedUrl) {
    alert("Nao foi possivel identificar o link de reproducao.");
    return;
  }

  player.classList.remove("hidden");
  document.getElementById("audio-player").classList.add("hidden");
  iframe.src = embedUrl;
  titleEl.textContent = title || "-";
  if (artistEl) artistEl.textContent = artist || "";
  if (coverImg) coverImg.src = getImageUrl(cover) || "https://via.placeholder.com/60x60?text=%E2%99%AB";
}

function playDirectAudio(url, title, artist, cover) {
  document.getElementById("video-player").classList.add("hidden");
  const audioPlayer = document.getElementById("audio-player");
  audioPlayer.classList.remove("hidden");
  const audioEl = document.getElementById("song");
  audioEl.src = url;
  audioEl.play();
  document.getElementById("player-title").textContent = title || "-";
  document.getElementById("player-artist").textContent = artist || "-";
  const img = document.getElementById("rotatingImage");
  if (img) img.src = getImageUrl(cover) || img.src;
  document.getElementById("controlIcon").className = "fa-solid fa-pause";
}

function closeVideoPlayer() {
  document.getElementById("video-player").classList.add("hidden");
  document.getElementById("video-iframe").src = "";
}

const audioEl = document.getElementById("song");
const progress = document.getElementById("progress");
const controlIcon = document.getElementById("controlIcon");
if (audioEl) {
  document.querySelector(".play-pause-btn")?.addEventListener("click", () => {
    if (audioEl.paused) { audioEl.play(); controlIcon.className = "fa-solid fa-pause"; }
    else { audioEl.pause(); controlIcon.className = "fa-solid fa-play"; }
  });
  audioEl.addEventListener("timeupdate", () => { if (!audioEl.paused) progress.value = audioEl.currentTime; });
  audioEl.addEventListener("loadedmetadata", () => { progress.max = audioEl.duration; });
  progress?.addEventListener("input", () => { audioEl.currentTime = progress.value; });
}

// ---------- CARREGAR DADOS DA PLANILHA ----------
async function carregarMusicas() {
  try {
    const res = await fetch(`${API_URL}?action=musicas`);
    const json = await res.json();
    musicasDB = json.data || [];
    renderRecentSongsFromSheet();
    renderAlbumsFromSheet();
    renderSwiperSlides();
    renderPlaylistsFromWeeks();
    renderMusicVideosFromSheet();
    renderTopVideosFromWeeks();
    renderForumTopicos();
  } catch (err) {
    console.error("Erro ao carregar musicas:", err);
  }
}

function coverOrFallback(m) {
  return getImageUrl(m.capa_da_musica) || `https://picsum.photos/seed/${encodeURIComponent(m.id_do_topico || m.nome_da_musica)}/300/300`;
}

function renderRecentSongsFromSheet() {
  const el = document.getElementById("recent-songs");
  el.innerHTML = musicasDB.slice(0, 8).map(m => `
    <div class="song" onclick="tocarMusica('${m.id_do_topico}')">
      <div class="song-img"><img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/50x50?text=%E2%99%AB'" alt=""/></div>
      <div class="song-title"><h2>${m.nome_da_musica}</h2><p>${m.act_principal || ""}</p></div>
    </div>`).join("");
}

function renderAlbumsFromSheet() {
  const albunsMap = {};
  musicasDB.forEach(m => {
    if (m.album) {
      albunsMap[m.album] = albunsMap[m.album] || { title: m.album, artist: m.act_principal, cover: coverOrFallback(m) };
    }
  });
  const el = document.getElementById("albums-grid");
  el.innerHTML = Object.values(albunsMap).map(a => `
    <div class="album">
      <div class="album-frame"><img src="${a.cover}" onerror="this.src='https://via.placeholder.com/160x160?text=%E2%99%AB'" alt="${a.title}"/></div>
      <h2>${a.title}</h2><p>${a.artist}</p>
    </div>`).join("");
}

function renderSwiperSlides() {
  const wrapper = document.getElementById("swiper-wrapper");
  const destaques = musicasDB.slice(0, 5);
  wrapper.innerHTML = destaques.map(m => `
    <div class="swiper-slide">
      <img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/600x300?text=%E2%99%AB'" />
      <div class="slide-overlay">
        <h2>${m.nome_da_musica}</h2>
        <button onclick="tocarMusica('${m.id_do_topico}')">Ouvir Agora <i class="fa-solid fa-circle-play"></i></button>
      </div>
    </div>`).join("");
  if (window.swiperInstance) window.swiperInstance.update();
}

function renderPlaylistsFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(b.weeks)||0) - (parseInt(a.weeks)||0)).slice(0, 12);
  const el = document.getElementById("playlists-grid");
  el.innerHTML = ordenadas.map(m => `
    <div class="playlist-card" onclick="tocarMusica('${m.id_do_topico}')">
      <img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/200x200?text=%E2%99%AB'" alt="${m.nome_da_musica}"/>
      <h3>${m.nome_da_musica}</h3>
      <p>${m.weeks || 0} semanas no topo</p>
    </div>`).join("");
}

function renderMusicVideosFromSheet() {
  document.getElementById("mv-grid").innerHTML = musicasDB.map(m => `
    <div class="video-card" onclick="tocarMusica('${m.id_do_topico}')">
      <div class="video-thumb">
        <img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/320x180?text=%E2%99%AB'" alt="${m.nome_da_musica}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info"><h3>${m.nome_da_musica}</h3><p>${m.act_principal || ""}</p></div>
    </div>`).join("");
}

function renderTopVideosFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(b.weeks_video)||0) - (parseInt(a.weeks_video)||0)).slice(0, 12);
  document.getElementById("top-videos-grid").innerHTML = ordenadas.map(m => `
    <div class="video-card" onclick="tocarMusica('${m.id_do_topico}')">
      <div class="video-thumb">
        <img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/320x180?text=%E2%99%AB'" alt="${m.nome_da_musica}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info"><h3>${m.nome_da_musica}</h3><p>${m.weeks_video || 0} semanas video</p></div>
    </div>`).join("");
}

// ---------- TOCAR MUSICA ----------
function tocarMusica(idTopico) {
  currentTopicoId = idTopico;
  const musica = musicasDB.find(m => String(m.id_do_topico) === String(idTopico));
  if (!musica) return;
  playSong(musica.id_do_arquivo, musica.nome_da_musica, musica.act_principal, musica.capa_da_musica);
  mostrarBotaoForum(musica);
}

function mostrarBotaoForum(musica) {
  let btn = document.getElementById("btn-ir-forum");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "btn-ir-forum";
    btn.className = "btn-forum-link";
    document.querySelector(".right-content").appendChild(btn);
  }
  btn.innerHTML = `<i class="fa fa-comments"></i> Ver comentarios de "${musica.nome_da_musica}"`;
  btn.onclick = () => irParaForum(musica.id_do_topico);
  btn.style.display = "flex";
}

// ---------- FORUM ----------
function renderForumTopicos() {
  const el = document.getElementById("forum-topicos");
  if (!el) return;
  el.innerHTML = musicasDB.map(m => `
    <div class="forum-topico-card" onclick="abrirTopicoForum('${m.id_do_topico}')">
      <img src="${coverOrFallback(m)}" onerror="this.src='https://via.placeholder.com/60x60?text=%E2%99%AB'" alt=""/>
      <div>
        <h3>${m.nome_da_musica}</h3>
        <p>${m.act_principal || ""}</p>
      </div>
      <i class="fa fa-chevron-right"></i>
    </div>`).join("");
}

async function abrirTopicoForum(idTopico) {
  currentTopicoId = idTopico;
  const musica = musicasDB.find(m => String(m.id_do_topico) === String(idTopico));
  if (!musica) return;

  document.getElementById("forum-topicos-view").classList.add("hidden");
  document.getElementById("forum-thread-view").classList.remove("hidden");

  document.getElementById("forum-thread-header").innerHTML = `
    <button class="forum-back" onclick="voltarListaForum()"><i class="fa fa-arrow-left"></i> Topicos</button>
    <img src="${coverOrFallback(musica)}" onerror="this.src='https://via.placeholder.com/60x60?text=%E2%99%AB'" alt=""/>
    <div><h2>${musica.nome_da_musica}</h2><p>${musica.act_principal || ""}</p></div>
    <button class="forum-play-btn" onclick="tocarMusica('${musica.id_do_topico}')"><i class="fa fa-play"></i> Tocar</button>
  `;

  const listEl = document.getElementById("forum-comment-list");
  listEl.innerHTML = "<p>Carregando comentarios...</p>";

  try {
    const res = await fetch(`${API_URL}?action=comentarios&idTopico=${idTopico}`);
    const json = await res.json();
    const comentarios = json.data || [];
    listEl.innerHTML = comentarios.length
      ? comentarios.map(c => `
          <div class="forum-comment">
            <strong>${c.nome_do_jogador}</strong>
            <p>${c.comentario}</p>
          </div>`).join("")
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
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "novoComentario",
      idTopico: currentTopicoId,
      nomeJogador: nome,
      comentario: texto
    })
  });

  document.getElementById("forum-texto").value = "";
  abrirTopicoForum(currentTopicoId);
}

// ---------- SWIPER ----------
window.swiperInstance = new Swiper(".swiper", {
  effect: "coverflow",
  grabCursor: true, centeredSlides: true, loop: true, speed: 600, slidesPerView: "auto",
  coverflowEffect: { rotate: 10, stretch: 120, depth: 200, modifier: 1, slideShadows: false },
  on: { click(e) { window.swiperInstance.slideTo(this.clickedIndex); } },
  pagination: { el: ".swiper-pagination" },
});

// ---------- INIT ----------
carregarMusicas();
