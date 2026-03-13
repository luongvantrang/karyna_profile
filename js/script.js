const USER_ID = "1013402592757420093";
const LANYARD_WS = "wss://api.lanyard.rest/socket";
const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1438870830913290461/kE8pAqVzfYH6vpdzO9Ayo5TemvbotKniw_lPE27O0g7Gc-kw-7W4VCqsd89dWYojZklt";

const STATUS_DOTS = {
  online: `<div class="status-dot online"><svg width="100%" height="100%" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#23a559" /></svg></div>`,
  idle: `<div class="status-dot idle"><svg width="100%" height="100%" viewBox="0 0 24 24"><mask id="msk-idle"><rect width="24" height="24" fill="white" /><circle cx="6" cy="6" r="9" fill="black" /></mask><circle cx="12" cy="12" r="12" fill="#ffc04e" mask="url(#msk-idle)" /></svg></div>`,
  dnd: `<div class="status-dot dnd"><svg width="100%" height="100%" viewBox="0 0 24 24"><mask id="msk-dnd"><rect width="24" height="24" fill="white" /><rect x="3" y="9" width="18" height="6" fill="black" rx="3" /></mask><circle cx="12" cy="12" r="12" fill="#f23f43" mask="url(#msk-dnd)" /></svg></div>`,
  offline: `<div class="status-dot offline"><svg width="100%" height="100%" viewBox="0 0 24 24"><mask id="msk-off"><rect width="24" height="24" fill="white" /><circle cx="12" cy="12" r="7" fill="black" /></mask><circle cx="12" cy="12" r="12" fill="#80848e" mask="url(#msk-off)" /></svg></div>`,
};

let ws,
  activityTimer = null,
  spotifyData = null;

function connectLanyard() {
  ws = new WebSocket(LANYARD_WS);
  ws.onopen = () =>
    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }));
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.t === "INIT_STATE" || d.t === "PRESENCE_UPDATE") updateProfile(d.d);
  };
  ws.onclose = () => setTimeout(connectLanyard, 5000);
}

function updateProfile(d) {
  const icon = document.getElementById("status-icon");
  if (icon)
    icon.innerHTML = STATUS_DOTS[d.discord_status] || STATUS_DOTS.offline;
  renderActivity(d.activities);
}

function renderActivity(acts) {
  const pCard = document.getElementById("activity-card");
  const lCard = document.getElementById("listening-card");
  if (!pCard || !lCard) return;
  if (activityTimer) clearInterval(activityTimer);
  if (window.gameTimerId) clearInterval(window.gameTimerId);
  spotifyData = null;

  const sp = acts.find((a) => a.id === "spotify:1" || a.name === "Spotify");
  const gm = acts.find(
    (a) => a.type !== 4 && a.id !== "spotify:1" && a.name !== "Spotify",
  );

  if (!gm) {
    pCard.innerHTML = `<div class="no-activity-text">NO ACTIVITY</div>`;
  } else {
    let lImg = `https://cdn.discordapp.com/embed/avatars/0.png`;
    let sImg = null;

    if (gm.assets && gm.assets.large_image) {
      lImg = gm.assets.large_image.startsWith("mp:")
        ? `https://media.discordapp.net/${gm.assets.large_image.replace("mp:", "")}`
        : `https://cdn.discordapp.com/app-assets/${gm.application_id}/${gm.assets.large_image}.png`;
    } else if (gm.application_id) {
      lImg = `https://dcdn.dstn.to/app-icons/${gm.application_id}.png`;
    }

    if (gm.assets && gm.assets.small_image) {
      sImg = gm.assets.small_image.startsWith("mp:")
        ? `https://media.discordapp.net/${gm.assets.small_image.replace("mp:", "")}`
        : `https://cdn.discordapp.com/app-assets/${gm.application_id}/${gm.assets.small_image}.png`;
    }

    let html = `<div class="activity-name">${gm.name}</div>`;
    if (gm.details) html += `<div class="activity-state">${gm.details}</div>`;
    if (gm.state) html += `<div class="activity-state">${gm.state}</div>`;
    if (gm.timestamps && gm.timestamps.start) {
      const st = gm.timestamps.start;
      const update = () => {
        const e = Date.now() - st;
        const h = Math.floor(e / 3600000);
        const m = Math.floor((e % 3600000) / 60000);
        const s = Math.floor((e % 60000) / 1000);
        const tEl = document.getElementById("game-timer");
        if (tEl) {
          tEl.innerText =
            h > 0
              ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
              : `${m}:${s.toString().padStart(2, "0")}`;
        }
      };
      html += `<div class="game-time-text" id="game-timer"></div>`;
      setTimeout(update, 0);
      window.gameTimerId = setInterval(update, 1000);
    }
    pCard.innerHTML = `<div class="activity-body"><div class="activity-image-wrapper"><img src="${lImg}" class="large-image">${sImg ? `<img src="${sImg}" class="small-image">` : ""}</div><div class="activity-details">${html}</div></div>`;
  }

  if (sp) {
    let img =
      sp.assets && sp.assets.large_image
        ? `https://i.scdn.co/image/${sp.assets.large_image.replace("spotify:", "")}`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
    localStorage.setItem(
      "last_spotify",
      JSON.stringify({
        t: sp.details || "Unknown",
        a: sp.state || "Unknown",
        i: img,
      }),
    );
    spotifyData = { s: sp.timestamps.start, e: sp.timestamps.end };
    lCard.innerHTML = `<div class="activity-body"><div class="activity-image-wrapper"><img src="${img}" class="large-image"></div><div class="activity-details"><div class="activity-name">${sp.details}</div><div class="activity-state">${sp.state}</div><div class="spotify-progress-row"><span class="spotify-time" id="sp-curr">00:00</span><div class="spotify-bar-bg"><div class="spotify-bar-fill" id="sp-fill" style="width:0%"></div></div><span class="spotify-time" id="sp-end">00:00</span></div></div></div>`;
    updateSp();
    activityTimer = setInterval(updateSp, 500);
  } else {
    const c = localStorage.getItem("last_spotify");
    if (c) {
      const d = JSON.parse(c);
      lCard.innerHTML = `<div class="activity-body"><div class="activity-image-wrapper"><img src="${d.i}" class="large-image" style="filter:grayscale(40%);opacity:0.8;"></div><div class="activity-details"><div class="activity-name" style="color:#949ba4;">${d.t}</div><div class="activity-state" style="color:#72767d;">${d.a}</div><div class="spotify-progress-row"><span style="font-size:11px;font-weight:700;color:#1db954;text-transform:uppercase;margin-top:5px;">Recently Played</span></div></div></div>`;
    } else {
      lCard.innerHTML = `<div class="activity-body"><div class="activity-image-wrapper" style="background:transparent;"><img src="empty.png" class="large-image" style="background:transparent;object-fit:contain;border-radius:0;"></div><div class="activity-details"><div class="activity-name" style="color:#f2f3f5;font-weight:600;font-size:14px;">Not Listening</div><div class="activity-state" style="color:#949ba4;font-size:13px;">No song currently playing.</div></div></div>`;
    }
  }
}

function updateSp() {
  if (!spotifyData) return;
  const t = spotifyData.e - spotifyData.s;
  const p = Date.now() - spotifyData.s;
  const pt = Math.min(100, Math.max(0, (p / t) * 100));
  const f = document.getElementById("sp-fill");
  const c = document.getElementById("sp-curr");
  const e = document.getElementById("sp-end");
  if (f) f.style.width = `${pt}%`;
  if (c)
    c.innerText = `${Math.floor(p / 60000)}:${Math.floor((p % 60000) / 1000)
      .toString()
      .padStart(2, "0")}`;
  if (e)
    e.innerText = `${Math.floor(t / 60000)}:${Math.floor((t % 60000) / 1000)
      .toString()
      .padStart(2, "0")}`;
}

setInterval(() => {
  const n = new Date();
  const c = document.getElementById("clock");
  const d = document.getElementById("date");
  if (c)
    c.innerHTML = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}<span>${String(n.getSeconds()).padStart(2, "0")}</span>`;
  if (d)
    d.innerText = n.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
}, 1000);

connectLanyard();

document.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  if (e.key === "F12" || e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
    e.preventDefault();
    return false;
  }
  if (e.ctrlKey && (e.key === "S" || e.key === "s")) {
    e.preventDefault();
    return false;
  }
});

document.addEventListener("copy", (e) => {
  e.preventDefault();
  return false;
});

const btn = document.getElementById("send-secret-btn");
const inp = document.getElementById("secret-msg");

if (btn && inp) {
  btn.addEventListener("click", async () => {
    const msg = inp.value.trim();
    if (!msg) return;
    const txt = btn.innerText;
    btn.innerText = "Sending...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `💌 **Tâm thư ẩn danh từ Website:**\n> ${msg}`,
        }),
      });
      if (res.ok) {
        btn.innerText = "Sent! ❤️";
        btn.style.backgroundColor = "#23a559";
        inp.value = "";
      } else {
        btn.innerText = "Failed! ❌";
        btn.style.backgroundColor = "#f23f43";
      }
    } catch {
      btn.innerText = "Error! ❌";
      btn.style.backgroundColor = "#f23f43";
    }
    setTimeout(() => {
      btn.innerText = txt;
      btn.style.backgroundColor = "";
      btn.style.opacity = "1";
      btn.disabled = false;
    }, 3000);
  });
}

// ===== RANDOM MUSIC PLAYER =====
const playlist = [
  'music/song1.webm',
  'music/song2.webm'
];

const musicAudio = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
let isPlaying = false;
let currentIndex = -1;

function getRandomIndex() {
  let idx;
  do { idx = Math.floor(Math.random() * playlist.length); }
  while (idx === currentIndex && playlist.length > 1);
  return idx;
}

function playRandom() {
  currentIndex = getRandomIndex();
  musicAudio.src = playlist[currentIndex];
  musicAudio.play().catch(() => {});
  isPlaying = true;
  musicBtn.classList.remove('paused');
}

function toggleMusic() {
  if (!isPlaying) {
    playRandom();
  } else {
    musicAudio.pause();
    musicAudio.src = '';
    isPlaying = false;
    musicBtn.classList.add('paused');
  }
}

musicAudio.addEventListener('ended', () => {
  playRandom();
});

