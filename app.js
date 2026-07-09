// ============================================================
//  EmpirePlay - app.js
//  Integrado com Google Sheets via Apps Script Web App
// ============================================================

const API_URL = "COLE_AQUI_A_URL_DO_SEU_DEPLOY/exec";

let musicasDB = [];
let currentTopicoId = null;
let currentSongIndex = 0;
let rotating = false, currentRotation = 0, rotationInterval;

const audioEl = document.getElementById("song");
const progress = document.getElementById("progress");
const controlIcon = document.getElementById("controlIcon");
const rotatingImage = document.getElementById("rotatingImage");

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

// ---------- LINK DETECTOR ----------
function detectType(url) {
  if (!url) return "unknown";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("drive.google.com")) return "drive";
  if (url.match(/\.(mp3|wav|ogg|aac)(\?|$)/i)) return "audio";
  return "unknown";
}

function getEmbedUrl(url) {
  const type = detectType(url);
  if (type === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
  }
  if (type === "drive") {
    const m = url.match(/\/d\/([^/]+)/);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
  }
  return null;
}

function getYoutubeThumbnail(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : "https://picsum.photos/seed/default/320/180";
}

function driveFileToUrl(fileId) {
  if (!fileId) return "";
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// ---------- PLAYER ----------
function playSong(url, type, title, artist, cover) {
  const t = type || detectType(url);
  if (t === "audio") {
    showAudioPlayer();
    audioEl.src = url;
    document.getElementById("player-title").textContent = title || "-";
    document.getElementById("player-artist").textContent = artist || "-";
    if (cover) rotatingImage.src = cover;
    audioEl.play();
    controlIcon.className = "fa-solid fa-pause";
    startRotation();
  } else {
    const embed = getEmbedUrl(url);
    if (!embed) return alert("Link nao reconhecido.");
    showVideoPlayer(embed, title);
  }
}

function showAudioPlayer() {
  document.getElementById("audio-player").classList.remove("hidden");
  document.getElementById("video-player").classList.add("hidden");
}
function showVideoPlayer(embedUrl, title) {
  document.getElementById("video-player").classList.remove("hidden");
  document.getElementById("audio-player").classList.add("hidden");
  document.getElementById("video-iframe").src = embedUrl;
  if (title) document.getElementById("video-title").textContent = title;
}
function closeVideoPlayer() {
  document.getElementById("video-player").classList.add("hidden");
  document.getElementById("video-iframe").src = "";
}

document.querySelector(".play-pause-btn").addEventListener("click", () => {
  if (audioEl.paused) { audioEl.play(); controlIcon.className = "fa-solid fa-pause"; startRotation(); }
  else { audioEl.pause(); controlIcon.className = "fa-solid fa-play"; pauseRotation(); }
});
document.querySelector(".forward").addEventListener("click", () => {
  if (!musicasDB.length) return;
  currentSongIndex = (currentSongIndex + 1) % musicasDB.length;
  const m = musicasDB[currentSongIndex];
  abrirMusica(m.id_do_topico);
});
document.querySelector(".backward").addEventListener("click", () => {
  if (!musicasDB.length) return;
  currentSongIndex = (currentSongIndex - 1 + musicasDB.length) % musicasDB.length;
  const m = musicasDB[currentSongIndex];
  abrirMusica(m.id_do_topico);
});
audioEl.addEventListener("timeupdate", () => { if (!audioEl.paused) progress.value = audioEl.currentTime; });
audioEl.addEventListener("loadedmetadata", () => { progress.max = audioEl.duration; });
progress.addEventListener("input", () => { audioEl.currentTime = progress.value; });

function startRotation() {
  if (!rotating) { rotating = true; rotationInterval = setInterval(() => { currentRotation += 1; rotatingImage.style.transform = `rotate(${currentRotation}deg)`; }, 50); }
}
function pauseRotation() { clearInterval(rotationInterval); rotating = false; }

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
  } catch (err) {
    console.error("Erro ao carregar musicas:", err);
  }
}

function renderRecentSongsFromSheet() {
  const el = document.getElementById("recent-songs");
  el.innerHTML = musicasDB.slice(0, 8).map(m => `
    <div class="song" onclick="abrirMusica('${m.id_do_topico}')">
      <div class="song-img"><img src="${m.capa_da_musica || 'https://picsum.photos/seed/'+m.id_do_arquivo+'/50/50'}" alt=""/></div>
      <div class="song-title"><h2>${m.nome_da_musica}</h2><p>${m.act_principal || ""}</p></div>
    </div>`).join("");
}

function renderAlbumsFromSheet() {
  const albunsMap = {};
  musicasDB.forEach(m => {
    if (m.album) {
      albunsMap[m.album] = albunsMap[m.album] || { title: m.album, artist: m.act_principal, cover: m.capa_da_musica };
    }
  });
  const el = document.getElementById("albums-grid");
  el.innerHTML = Object.values(albunsMap).map(a => `
    <div class="album">
      <div class="album-frame"><img src="${a.cover || 'https://picsum.photos/seed/'+a.title+'/160/160'}" alt="${a.title}"/></div>
      <h2>${a.title}</h2><p>${a.artist}</p>
    </div>`).join("");
}

function renderSwiperSlides() {
  const wrapper = document.getElementById("swiper-wrapper");
  const destaques = musicasDB.slice(0, 5);
  wrapper.innerHTML = destaques.map(m => `
    <div class="swiper-slide">
      <img src="${m.capa_da_musica || 'https://picsum.photos/seed/'+m.id_do_arquivo+'/600/300'}" />
      <div class="slide-overlay">
        <h2>${m.nome_da_musica}</h2>
        <button onclick="abrirMusica('${m.id_do_topico}')">Ouvir Agora <i class="fa-solid fa-circle-play"></i></button>
      </div>
    </div>`).join("");
  if (window.swiperInstance) window.swiperInstance.update();
}

function renderPlaylistsFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(b.weeks)||0) - (parseInt(a.weeks)||0)).slice(0, 12);
  const el = document.getElementById("playlists-grid");
  el.innerHTML = ordenadas.map(m => `
    <div class="playlist-card" onclick="abrirMusica('${m.id_do_topico}')">
      <img src="${m.capa_da_musica || 'https://picsum.photos/seed/'+m.id_do_arquivo+'/200/200'}" alt="${m.nome_da_musica}"/>
      <h3>${m.nome_da_musica}</h3>
      <p>${m.weeks || 0} semanas no topo</p>
    </div>`).join("");
}

function renderMusicVideosFromSheet() {
  const comVideo = musicasDB.filter(m => m.id_do_arquivo && detectType(driveFileToUrl(m.id_do_arquivo)) !== "unknown");
  document.getElementById("mv-grid").innerHTML = comVideo.map(m => `
    <div class="video-card" onclick="abrirMusica('${m.id_do_topico}')">
      <div class="video-thumb">
        <img src="${m.capa_da_musica || 'https://picsum.photos/seed/'+m.id_do_arquivo+'/320/180'}" alt="${m.nome_da_musica}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info"><h3>${m.nome_da_musica}</h3><p>${m.act_principal || ""}</p></div>
    </div>`).join("");
}

function renderTopVideosFromWeeks() {
  const ordenadas = [...musicasDB].sort((a,b) => (parseInt(b.weeks_video)||0) - (parseInt(a.weeks_video)||0)).slice(0, 12);
  document.getElementById("top-videos-grid").innerHTML = ordenadas.map(m => `
    <div class="video-card" onclick="abrirMusica('${m.id_do_topico}')">
      <div class="video-thumb">
        <img src="${m.capa_da_musica || 'https://picsum.photos/seed/'+m.id_do_arquivo+'/320/180'}" alt="${m.nome_da_musica}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info"><h3>${m.nome_da_musica}</h3><p>${m.weeks_video || 0} semanas video</p></div>
    </div>`).join("");
}

// ---------- FORUM / COMENTARIOS ----------
async function abrirMusica(idTopico) {
  currentTopicoId = idTopico;
  const musica = musicasDB.find(m => String(m.id_do_topico) === String(idTopico));
  if (!musica) return;

  playSong(driveFileToUrl(musica.id_do_arquivo), "audio", musica.nome_da_musica, musica.act_principal, musica.capa_da_musica);

  try {
    const res = await fetch(`${API_URL}?action=comentarios&idTopico=${idTopico}`);
    const json = await res.json();
    renderForum(musica, json.data || []);
  } catch (err) {
    console.error("Erro ao carregar comentarios:", err);
  }
}

function renderForum(musica, comentarios) {
  const container = document.getElementById("forum-container");
  container.innerHTML = `
    <h2>${musica.nome_da_musica} - Comentarios</h2>
    <div class="forum-list">
      ${comentarios.map(c => `
        <div class="forum-comment">
          <strong>${c.nome_do_jogador}</strong>
          <p>${c.comentario}</p>
        </div>`).join("") || "<p>Nenhum comentario ainda.</p>"}
    </div>
    <div class="forum-add">
      <input type="text" id="forum-nome" placeholder="Seu nome"/>
      <textarea id="forum-texto" placeholder="Escreva um comentario..."></textarea>
      <button onclick="enviarComentario()">Comentar</button>
    </div>`;
  document.getElementById("forum-panel").classList.remove("hidden");
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

  abrirMusica(currentTopicoId);
}

// ---------- MINHAS MUSICAS / VIDEOS (locais, sem planilha) ----------
let mySongs = [];
let myVideos = [];

function renderMySongs() {
  const el = document.getElementById("my-song-list");
  el.innerHTML = mySongs.map((s, i) => `
    <div class="song-row" onclick="playSong('${s.url}','${s.type}','${s.title}','${s.artist}')">
      <div class="type-icon ${s.type==='audio'?'type-audio':'type-video'}">
        <i class="fa ${s.type==='audio'?'fa-music':'fa-play'}"></i>
      </div>
      <div class="song-row-info"><h3>${s.title}</h3><p>${s.artist}</p></div>
      <span style="opacity:0.5;font-size:0.75rem">${s.type.toUpperCase()}</span>
      <button onclick="event.stopPropagation();removeSong(${i})" style="background:none;border:none;color:#ff6b6b;cursor:pointer;"><i class="fa fa-trash"></i></button>
    </div>`).join("");
}

function addSong() {
  const title = document.getElementById("song-title-input").value.trim();
  const artist = document.getElementById("song-artist-input").value.trim();
  const url = document.getElementById("song-url-input").value.trim();
  if (!url) return;
  const type = detectType(url) === "audio" ? "audio" : "video";
  mySongs.push({ title: title || "Sem titulo", artist: artist || "Desconhecido", url, type });
  renderMySongs();
  document.getElementById("song-title-input").value = "";
  document.getElementById("song-artist-input").value = "";
  document.getElementById("song-url-input").value = "";
}
function removeSong(i) { mySongs.splice(i, 1); renderMySongs(); }

function renderVideoGrid(containerId, videos) {
  document.getElementById(containerId).innerHTML = videos.map(v => `
    <div class="video-card" onclick="playSong('${v.url}','video','${v.title}')">
      <div class="video-thumb">
        <img src="${v.thumb || getYoutubeThumbnail(v.url)}" alt="${v.title}"/>
        <div class="play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <div class="video-info"><h3>${v.title}</h3></div>
    </div>`).join("");
}

function addVideo() {
  const title = document.getElementById("video-title-input").value.trim();
  const url = document.getElementById("video-url-input").value.trim();
  if (!url) return;
  myVideos.push({ title: title || "Sem titulo", url });
  renderVideoGrid("my-video-list", myVideos);
  document.getElementById("video-title-input").value = "";
  document.getElementById("video-url-input").value = "";
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
renderMySongs();
renderVideoGrid("my-video-list", myVideos);
