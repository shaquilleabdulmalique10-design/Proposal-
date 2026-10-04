const STORAGE_PREFIX = "love-note-v1";

// Hide all panels immediately — showPanel() reveals the correct one after routing
document.querySelectorAll(".panel").forEach(p => p.style.display = "none");
const SPOTIFY_FALLBACK_PLAYLIST_ID = "37i9dQZF1DX3Z99viCDp7Q";
const SPOTIFY_EMBED_SRC = `https://open.spotify.com/embed/playlist/${SPOTIFY_FALLBACK_PLAYLIST_ID}?utm_source=generator&theme=0`;

// ── Spotify OAuth (PKCE) ──────────────────────────────────────────────────────
const SPOTIFY_CLIENT_ID = "46f32d141ffa433ca3d9931c1e7c6fe3";
const SPOTIFY_REDIRECT_URI = window.location.origin + window.location.pathname;
const SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative";
const SPOTIFY_TOKEN_KEY = "spotify_access_token";
const SPOTIFY_VERIFIER_KEY = "spotify_pkce_verifier";

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function startSpotifyLogin() {
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

async function exchangeSpotifyCode(code) {
  const verifier = sessionStorage.getItem(SPOTIFY_VERIFIER_KEY);
  if (!verifier) return null;

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: verifier,
  });

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();
    if (data.access_token) {
      sessionStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
      sessionStorage.removeItem(SPOTIFY_VERIFIER_KEY);
      // Clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
      return data.access_token;
    }
  } catch (err) {
    console.warn("Spotify token exchange failed", err);
  }
  return null;
}

function getSpotifyToken() {
  return sessionStorage.getItem(SPOTIFY_TOKEN_KEY);
}

async function fetchSpotifyPlaylists(accessToken) {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.warn("Failed to fetch Spotify playlists", err);
    return null;
  }
}

function buildSpotifyEmbedUrl(playlistId, autoplay = false) {
  const base = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
  return autoplay ? `${base}&autoplay=1` : base;
}
// ─────────────────────────────────────────────────────────────────────────────

const SONG_OPTIONS = [
  {
    label: "Love Playlist - Spotify",
    url: SPOTIFY_EMBED_SRC,
  },
];

const PROMPT_BANK = {
  male: [
    "Hey handsome, would you go on a date with me?",
    "Can I take you out for a lovely dinner sometime?",
    "I'd love to spend a cozy evening with you. Will you go out with me?",
    "You make my heart smile. Would you let me take you out?",
  ],
  female: [
    "Hey beautiful, would you go on a date with me?",
    "I’d love to take you out for a sweet evening. Will you come with me?",
    "You’ve been on my mind a lot, and I’d love to take you out sometime.",
    "Can I steal a little time with you for a date?",
  ],
};

const APPRECIATION_MESSAGES = [
  "Aww, this made my whole heart smile. I can already picture us sharing the sweetest memories together.",
  "You just made my whole day brighter. I’m already counting down the minutes until we get to spend time together.",
  "This is honestly the best kind of surprise. I’m so happy and excited to make beautiful memories with you.",
  "You’ve made this moment feel extra special, and I’m smiling like a fool just thinking about it.",
  "This is exactly the kind of joy I wanted to feel today. I can’t wait for our time together.",
  "My heart is so full right now. You’ve made me feel unbelievably lucky, and I’m excited for what’s ahead.",
];

const FALLBACK_IMAGE = "image/love2.jpeg";

// ── Proposal design catalogue ─────────────────────────────────────────────────
// Each entry defines which image to use, where the clear card zone sits
// (as % from each edge of the image), and the best text/button color for that zone.
const DESIGNS = [
  {
    id: "love1",
    label: "Scrapbook",
    image: "image/love1.jpeg",
    top: "36%", left: "8%", right: "8%", bottom: "32%",
    textColor: "#8b2020",
    btnBg: "#8b2020",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#8b2020",
  },
  {
    id: "love4",
    label: "Vintage Rose",
    image: "image/love4.jpeg",
    top: "15%", left: "5%", right: "45%", bottom: "18%",
    textColor: "#4a2000",
    btnBg: "#6b3a1f",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#6b3a1f",
  },
  {
    id: "love6",
    label: "Teddy & Books",
    image: "image/love6.jpeg",
    top: "18%", left: "10%", right: "12%", bottom: "38%",
    textColor: "#4a2c0a",
    btnBg: "#5c3a1e",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#5c3a1e",
  },
  {
    id: "love7",
    label: "Ornate Frame",
    image: "image/love7.jpeg",
    top: "22%", left: "18%", right: "18%", bottom: "30%",
    textColor: "#6b0a2e",
    btnBg: "#6b0a2e",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#6b0a2e",
  },
  {
    id: "love8",
    label: "Dark Roses",
    image: "image/love8.jpeg",
    top: "32%", left: "10%", right: "10%", bottom: "22%",
    textColor: "#fde8f0",
    btnBg: "#fde8f0",
    btnColor: "#5b0a1e",
    noBtnBg: "rgba(253,232,240,0.2)",
    noBtnColor: "#fde8f0",
  },
  {
    id: "love9",
    label: "Polaroid",
    image: "image/love9.jpeg",
    top: "28%", left: "22%", right: "22%", bottom: "35%",
    textColor: "#8b2020",
    btnBg: "#8b2020",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#8b2020",
  },
  {
    id: "love10",
    label: "Carpet & Paper",
    image: "image/love10.jpeg",
    top: "18%", left: "12%", right: "12%", bottom: "30%",
    textColor: "#5c3a1e",
    btnBg: "#6b2020",
    btnColor: "#fff",
    noBtnBg: "rgba(255,255,255,0.55)",
    noBtnColor: "#6b2020",
  },
  {
    id: "love11",
    label: "Lipstick Kiss",
    image: "image/love11.jpeg",
    top: "18%", left: "10%", right: "10%", bottom: "28%",
    textColor: "#fde8f0",
    btnBg: "#fde8f0",
    btnColor: "#5b0a1e",
    noBtnBg: "rgba(253,232,240,0.2)",
    noBtnColor: "#fde8f0",
  },
];

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function buildShareUrl(token) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?token=${token}`;
}

function buildOwnerUrl(token, ownerToken) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?token=${token}&owner=${ownerToken}`;
}

function getStorageKeyForToken(token) {
  return `${STORAGE_PREFIX}:${token}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "your chosen date";
  const parsedDate = new Date(`${dateValue}T00:00:00`);
  return parsedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeValue) {
  if (!timeValue) return "the time you picked";
  const [hours, minutes] = timeValue.split(":").map(Number);
  const formatted = new Date();
  formatted.setHours(hours, minutes, 0, 0);
  return formatted.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSongMeta(songLabelOrUrl) {
  if (!songLabelOrUrl) return SONG_OPTIONS[0];
  const byLabel = SONG_OPTIONS.find(
    (option) => option.label === songLabelOrUrl,
  );
  if (byLabel) return byLabel;
  // If the caller passed a URL directly, return it as a meta object
  if (typeof songLabelOrUrl === "string" && songLabelOrUrl.startsWith("http")) {
    return { label: songLabelOrUrl, url: songLabelOrUrl };
  }
  return SONG_OPTIONS[0];
}

function playBackgroundSong(songLabel) {
  const iframe = document.getElementById("spotifyPlayerInline");
  const audio = document.getElementById("backgroundAudio");
  const songMeta = getSongMeta(songLabel);

  if (
    iframe &&
    songMeta.url &&
    songMeta.url.includes("spotify.com/embed/playlist/")
  ) {
    iframe.src = songMeta.url;
    iframe.classList.remove("hidden");
    return;
  }

  if (!audio) return;
  audio.src = songMeta.url;
  audio.loop = true;
  audio.volume = 0.45;
  audio.play().catch(() => {
    window.addEventListener("pointerdown", () => audio.play().catch(() => {}), {
      once: true,
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerHTML = message;
  toast.classList.add("visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 5000);
}

function saveProposalData(token, payload) {
  localStorage.setItem(getStorageKeyForToken(token), JSON.stringify(payload));
}

function readProposalData(token) {
  const raw = localStorage.getItem(getStorageKeyForToken(token));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function showPanel(panelId) {
  document.querySelectorAll(".panel").forEach((panel) => {
    const isActive = panel.id === panelId;
    panel.classList.toggle("active", isActive);
    if (isActive) {
      // receiverSection and responseSection are flex containers
      const flexPanels = ["receiverSection", "responseSection"];
      panel.style.display = flexPanels.includes(panel.id) ? "flex" : "block";
    } else {
      panel.style.display = "none";
    }
  });
}

async function createProposalInBackend(payload) {
  try {
    const response = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Server rejected proposal");
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchProposalFromBackend(token) {
  try {
    const response = await fetch(`/api/proposal/${encodeURIComponent(token)}`);
    if (!response.ok) {
      return readProposalData(token);
    }

    const data = await response.json();
    if (data && data.token) {
      saveProposalData(data.token, data);
      return data;
    }
  } catch (error) {
    console.warn("Backend fetch failed, using local storage fallback.", error);
  }

  return readProposalData(token);
}

async function submitResponseToBackend(token, response) {
  try {
    const responseFromServer = await fetch(
      `/api/proposal/${encodeURIComponent(token)}/response`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      },
    );

    return responseFromServer.ok;
  } catch (error) {
    console.warn("Response submission to backend failed.", error);
    return false;
  }
}

function createFloatingHeart(x, y) {
  const heart = document.createElement("span");
  heart.className = "floating-heart";
  heart.textContent = "❤";
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  document.body.appendChild(heart);

  window.setTimeout(() => heart.remove(), 1800);
}

function createSparkleTrail(event) {
  const sparkle = document.createElement("span");
  sparkle.className = "sparkle-trail";
  sparkle.style.left = `${event.clientX}px`;
  sparkle.style.top = `${event.clientY}px`;
  document.body.appendChild(sparkle);

  window.setTimeout(() => sparkle.remove(), 700);
}

async function initSenderFlow() {
  const setupSection = document.getElementById("setupSection");
  const promptSection = document.getElementById("promptSection");
  const promptList = document.getElementById("promptList");
  const generateLinkBtn = document.getElementById("generateLinkBtn");
  const shareBox = document.getElementById("shareBox");
  const customSection = document.getElementById("customSection");
  const shareLinkInput = document.getElementById("shareLink");
  const customMessage = document.getElementById("customMessage");
  const songSection = document.getElementById("songSection");

  let selectedGender = "female";
  let selectedPrompt = PROMPT_BANK.female[0];

  // ── Design picker ──────────────────────────────────────────────────────────
  let selectedDesign = DESIGNS[0]; // default: love1 scrapbook

  const designGrid = document.getElementById("designGrid");
  DESIGNS.forEach((design) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "design-card" + (design.id === selectedDesign.id ? " selected" : "");
    btn.dataset.id = design.id;
    btn.innerHTML = `
      <img src="${design.image}" alt="${design.label}" loading="lazy" />
      <span>${design.label}</span>
    `;
    btn.addEventListener("click", () => {
      designGrid.querySelectorAll(".design-card").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      selectedDesign = design;
    });
    designGrid.appendChild(btn);
  });

  // ── Spotify playlist picker state ─────────────────────────────────────────
  let selectedPlaylistId = SPOTIFY_FALLBACK_PLAYLIST_ID;
  let selectedPlaylistName = "Love Playlist";
  let selectedPlaylistEmbedUrl = SPOTIFY_EMBED_SRC;

  // Replace the plain <select> in songSection with a Spotify connect UI
  songSection.innerHTML = `
    <label>Pick a playlist</label>
    <div id="spotifyConnectWrap">
      <button id="spotifyConnectBtn" class="spotify-connect-btn" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.293a.75.75 0 01-1.032.244c-2.827-1.727-6.39-2.118-10.59-1.16a.75.75 0 11-.334-1.463c4.593-1.048 8.537-.597 11.712 1.347a.75.75 0 01.244 1.032zm1.472-3.27a.937.937 0 01-1.29.308c-3.233-1.988-8.163-2.563-11.99-1.403a.938.938 0 01-.543-1.794c4.37-1.325 9.8-.682 13.515 1.599a.937.937 0 01.308 1.29zm.127-3.405C15.28 8.46 9.205 8.25 5.857 9.28a1.125 1.125 0 11-.652-2.154c3.89-1.177 10.355-.95 14.437 1.618a1.125 1.125 0 01-1.127 1.875z"/></svg>
        Connect Spotify to browse playlists
      </button>
    </div>
    <div id="playlistPickerWrap" class="playlist-picker-wrap hidden">
      <div id="playlistGrid" class="playlist-grid"></div>
      <p id="selectedPlaylistLabel" class="selected-playlist-label"></p>
    </div>
    <div id="spotifyPreviewWrap" class="spotify-preview-wrap hidden">
      <iframe id="spotifyPlayerPreview"
        title="Spotify playlist preview"
        src=""
        width="100%" height="152" frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style="border-radius:14px;margin-top:10px;"></iframe>
    </div>
  `;

  // Connect button
  document.getElementById("spotifyConnectBtn").addEventListener("click", () => {
    startSpotifyLogin();
  });

  // If we already have a token (returned from OAuth redirect), load playlists
  const spotifyToken = getSpotifyToken();
  if (spotifyToken) {
    await loadAndRenderPlaylists(spotifyToken);
  }

  function renderPlaylistPicker(playlists) {
    const wrap = document.getElementById("playlistPickerWrap");
    const grid = document.getElementById("playlistGrid");
    const connectWrap = document.getElementById("spotifyConnectWrap");

    connectWrap.classList.add("hidden");
    wrap.classList.remove("hidden");
    grid.innerHTML = "";

    playlists.forEach((pl) => {
      const img = pl.images && pl.images[0] ? pl.images[0].url : "";
      const card = document.createElement("button");
      card.type = "button";
      card.className = "playlist-card";
      if (pl.id === selectedPlaylistId) card.classList.add("selected");
      card.dataset.id = pl.id;
      card.dataset.name = pl.name;
      card.innerHTML = `
        ${img ? `<img src="${img}" alt="${pl.name}" loading="lazy" />` : '<div class="playlist-card-placeholder">🎵</div>'}
        <span>${pl.name}</span>
      `;
      card.addEventListener("click", () => {
        grid.querySelectorAll(".playlist-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPlaylistId = pl.id;
        selectedPlaylistName = pl.name;
        selectedPlaylistEmbedUrl = buildSpotifyEmbedUrl(pl.id);

        document.getElementById("selectedPlaylistLabel").textContent =
          `Selected: ${pl.name}`;

        // Show mini preview (no autoplay for sender)
        const previewWrap = document.getElementById("spotifyPreviewWrap");
        const previewIframe = document.getElementById("spotifyPlayerPreview");
        previewIframe.src = buildSpotifyEmbedUrl(pl.id, false);
        previewWrap.classList.remove("hidden");
      });
      grid.appendChild(card);
    });

    // Show current selection label
    document.getElementById("selectedPlaylistLabel").textContent =
      `Selected: ${selectedPlaylistName}`;
  }

  async function loadAndRenderPlaylists(token) {
    const connectBtn = document.getElementById("spotifyConnectBtn");
    if (connectBtn) connectBtn.textContent = "Loading your playlists…";

    const playlists = await fetchSpotifyPlaylists(token);
    if (!playlists) {
      if (connectBtn) {
        connectBtn.textContent = "Connect Spotify to browse playlists";
        connectBtn.disabled = false;
      }
      showToast("Could not load playlists. Try reconnecting Spotify.");
      return;
    }
    renderPlaylistPicker(playlists);
  }

  // ── Prompt rendering ───────────────────────────────────────────────────────
  function renderPrompts(gender) {
    promptList.innerHTML = "";
    PROMPT_BANK[gender].forEach((prompt) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt-card";
      if (prompt === selectedPrompt) button.classList.add("selected");
      button.textContent = prompt;
      button.addEventListener("click", () => {
        selectedPrompt = prompt;
        renderPrompts(selectedGender);
      });
      promptList.appendChild(button);
    });
  }

  document.querySelectorAll(".choice-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".choice-btn").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
      selectedGender = button.dataset.gender;
      selectedPrompt = PROMPT_BANK[selectedGender][0];
      renderPrompts(selectedGender);
      promptSection.classList.remove("hidden");
      customSection.classList.remove("hidden");
      songSection.classList.remove("hidden");
      generateLinkBtn.classList.remove("hidden");
    });
  });

  renderPrompts(selectedGender);

  // Show all sections immediately since female is pre-selected
  promptSection.classList.remove("hidden");
  customSection.classList.remove("hidden");
  songSection.classList.remove("hidden");
  generateLinkBtn.classList.remove("hidden");

  // ── Generate link ──────────────────────────────────────────────────────────
  generateLinkBtn.addEventListener("click", async () => {
    const message = customMessage.value.trim() || selectedPrompt;
    const chosenImage = "love2.jpeg";
    const ownerToken = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      gender: selectedGender,
      prompt: message,
      song: selectedPlaylistName,
      songUrl: buildSpotifyEmbedUrl(selectedPlaylistId, true),
      image: chosenImage,
      design: selectedDesign.id,
      createdAt: new Date().toISOString(),
      ownerToken,
    };

    const backendResult = await createProposalInBackend(payload);

    const token =
      backendResult && backendResult.token
        ? backendResult.token
        : `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const returnedOwner =
      backendResult && backendResult.ownerToken
        ? backendResult.ownerToken
        : ownerToken;

    saveProposalData(token, { ...payload, token, ownerToken: returnedOwner });

    const shareUrl =
      backendResult && backendResult.url
        ? backendResult.url
        : buildShareUrl(token);
    const ownerUrl = buildOwnerUrl(token, returnedOwner);

    shareLinkInput.value = shareUrl;
    document.getElementById("ownerLink").value = ownerUrl;
    shareBox.classList.remove("hidden");
    document.getElementById("ownerBox").classList.remove("hidden");

    const copyOwnerBtn = document.getElementById("copyOwnerBtn");
    if (copyOwnerBtn) {
      copyOwnerBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(ownerUrl);
          showToast("Owner link copied. Keep it private.");
        } catch (err) {
          const ownerInput = document.getElementById("ownerLink");
          if (ownerInput) { ownerInput.select(); document.execCommand("copy"); }
          showToast("Owner link copied. Keep it private.");
        }
      };
    }

    const copyBtn = document.getElementById("copyLinkBtn");
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied. Send it to your crush 💌");
      } catch (error) {
        shareLinkInput.select();
        document.execCommand("copy");
        showToast("Link copied. Send it to your crush 💌");
      }
    };

    window.history.replaceState({}, "", ownerUrl);
    setupSection.classList.add("is-shared");
    showToast("Your proposal link is ready.");
  });
}

// helper: check owner param
function getOwnerFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("owner");
}

async function initReceiverFlow() {
  const token = getTokenFromUrl();
  if (!token) return;

  const receiverSection = document.getElementById("receiverSection");
  const receiverPrompt = document.getElementById("receiverPrompt");
  const receiverMessage = document.getElementById("receiverMessage");
  const successMessage = document.getElementById("successMessage");
  const receiverEyebrow = document.getElementById("receiverEyebrow");
  const thankYouText = document.getElementById("thankYouText");
  const thankYouModal = document.getElementById("thankYouModal");
  const closeThankYouBtn = document.getElementById("closeThankYouBtn");

  closeThankYouBtn.addEventListener("click", () => {
    thankYouModal.classList.add("hidden");

    // Mark link as consumed in localStorage so it can't be reopened
    const consumed = { ...proposal, consumed: true };
    saveProposalData(token, consumed);

    // Wipe the URL so back/refresh doesn't reload the proposal
    window.history.replaceState({}, "", window.location.pathname);

    // Fade out and show a gentle closed screen
    document.body.style.transition = "opacity 0.6s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
      document.body.innerHTML = `
        <div style="
          min-height:100vh;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          font-family:'Inter',sans-serif;
          background:linear-gradient(160deg,#1a0a0f 0%,#3d1a2e 45%,#1f0d1a 100%);
          color:#fde8f0;
          text-align:center;
          padding:32px;
          gap:16px;
        ">
          <div style="font-size:3rem;">💖</div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2.6rem;margin:0;color:#fde8f0;">
            This moment is sealed
          </h2>
          <p style="color:rgba(253,232,240,0.65);max-width:340px;line-height:1.8;margin:0;font-size:0.95rem;">
            Your answer has been sent. Something beautiful is about to begin.
          </p>
        </div>
      `;
      document.body.style.opacity = "1";
    }, 620);
  });

  thankYouModal.addEventListener("click", (event) => {
    if (event.target === thankYouModal) {
      thankYouModal.classList.add("hidden");
    }
  });

  const proposal = await fetchProposalFromBackend(token);
  if (!proposal) {
    receiverPrompt.textContent = "This link has expired or is invalid.";
    receiverMessage.textContent =
      "Please ask for a fresh invitation from the sender.";
    showPanel("receiverSection");
    return;
  }

  // Block reopening if already consumed or locked
  if (proposal.consumed || (proposal.locked && proposal.response)) {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        font-family:'Inter',sans-serif;
        background:linear-gradient(160deg,#1a0a0f 0%,#3d1a2e 45%,#1f0d1a 100%);
        color:#fde8f0;
        text-align:center;
        padding:32px;
        gap:16px;
      ">
        <div style="font-size:3rem;">💖</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:2.6rem;margin:0;color:#fde8f0;">
          This moment is sealed
        </h2>
        <p style="color:rgba(253,232,240,0.65);max-width:340px;line-height:1.8;margin:0;font-size:0.95rem;">
          This invitation has already been answered. Something beautiful is in the works.
        </p>
      </div>
    `;
    return;
  }

  // Background is handled by CSS (love1.jpeg) — no dynamic setting needed
  receiverEyebrow.textContent =
    proposal.gender === "male" ? "For him" : "For her";
  receiverPrompt.textContent = proposal.prompt;
  receiverMessage.textContent = ""; // avoid duplicating the prompt text

  // ── Apply chosen design ────────────────────────────────────────────────────
  const design = DESIGNS.find(d => d.id === proposal.design) || DESIGNS[0];
  const receiverBg = document.querySelector(".receiver-bg");
  const receiverCard = document.querySelector(".receiver-card");

  // Set data-design attribute — CSS uses this to pick the right background image
  receiverBg.setAttribute("data-design", design.id);

  // Position the card zone over the clear space in this design
  receiverCard.style.top = design.top;
  receiverCard.style.left = design.left;
  receiverCard.style.right = design.right;
  receiverCard.style.bottom = design.bottom;

  // Apply text and button colors for this design
  receiverCard.style.setProperty("--text-color", design.textColor);
  document.querySelector(".eyebrow-dark").style.color = design.textColor;
  document.querySelector(".receiver-heading").style.color = design.textColor;

  const yesBtn = document.querySelector(".yes-btn-card");
  const noBtn = document.querySelector(".no-btn-card");
  yesBtn.style.background = design.btnBg;
  yesBtn.style.color = design.btnColor;
  noBtn.style.background = design.noBtnBg;
  noBtn.style.color = design.noBtnColor;
  noBtn.style.borderColor = design.noBtnColor;

  // ── Invisible Spotify autoplay — set up URL, play after panel is shown ────
  const preferredSongUrl = proposal.songUrl || SPOTIFY_EMBED_SRC;
  const autoplayUrl = preferredSongUrl.includes("?")
    ? preferredSongUrl.replace(/([?&])autoplay=\d/, "") + "&autoplay=1"
    : preferredSongUrl + "?autoplay=1";

  const btnRow = document.querySelector(".receiver-btn-row");

  // Throttle so it can't move more than once every 400ms
  let lastMove = 0;

  function moveNoButton() {
    const now = Date.now();
    if (now - lastMove < 700) return;
    lastMove = now;

    if (!btnRow || !noBtn) return;
    const rowRect = btnRow.getBoundingClientRect();
    const btnW = noBtn.offsetWidth || 80;
    const btnH = noBtn.offsetHeight || 36;
    const padding = 6;

    // Yes is pinned bottom-left — keep No out of that zone
    const yesZoneW = 140;
    const yesZoneH = 50;

    const maxX = rowRect.width - btnW - padding;
    const maxY = rowRect.height - btnH - padding;

    let newX, newY, attempts = 0;
    do {
      newX = Math.random() * (maxX - padding) + padding;
      newY = Math.random() * (maxY - padding) + padding;
      attempts++;
      const inYesZone = newX < yesZoneW && newY > rowRect.height - yesZoneH - padding;
      if (!inYesZone) break;
    } while (attempts < 15);

    // Hard clamp — never let it escape the row
    newX = Math.max(padding, Math.min(newX, maxX));
    newY = Math.max(padding, Math.min(newY, maxY));

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
    noBtn.style.right = "auto";
    noBtn.style.transform = "none";
  }

  noBtn.addEventListener("mouseenter", moveNoButton);
  noBtn.addEventListener("mouseover", moveNoButton);
  noBtn.addEventListener("pointerenter", moveNoButton);
  noBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    noBtn.textContent = "Nice try 🙃😊";
    moveNoButton();
  });

  document.addEventListener("pointermove", (event) => {
    const buttonRect = noBtn.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    const distance = Math.hypot(
      event.clientX - centerX,
      event.clientY - centerY,
    );
    if (distance < 60) moveNoButton();
  });

  yesBtn.addEventListener("click", () => {
    // if already responded, do nothing
    if (proposal.response && proposal.response.submittedAt) {
      showToast("This invitation has already been answered.");
      return;
    }

    successMessage.classList.add("visible");
    const modal = document.getElementById("dateModal");
    modal.classList.remove("hidden");

    const dateInput = document.getElementById("dateInput");
    const timeInput = document.getElementById("timeInput");
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    dateInput.min = today;
    dateInput.value = today;
    timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  document
    .getElementById("dateForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const dateInput = document.getElementById("dateInput");
      const timeInput = document.getElementById("timeInput");
      const preference = document.getElementById("datePreference");
      const response = {
        date: dateInput.value,
        time: timeInput.value,
        preference: preference.value,
        song: proposal.song,
        songUrl: proposal.songUrl,
        prompt: proposal.prompt,
      };

      // persist response and mark receiver as locked
      const locked = true;
      const stored = { ...proposal, response, locked };
      saveProposalData(token, stored);
      await submitResponseToBackend(token, response);

      // Stop the invisible music
      const musicIframe = document.getElementById("spotifyPlayerInline");
      if (musicIframe) musicIframe.src = "";

      document.getElementById("dateModal").classList.add("hidden");
      const randomMessage =
        APPRECIATION_MESSAGES[
          Math.floor(Math.random() * APPRECIATION_MESSAGES.length)
        ];
      thankYouText.textContent = randomMessage;
      thankYouModal.classList.remove("hidden");
      thankYouModal.classList.add("showing");

      try {
        window.history.replaceState(
          {},
          "",
          window.location.pathname + "?responded=true",
        );
      } catch (e) {
        // ignore
      }
    }); // end dateForm submit

  showPanel("receiverSection");

  // ── Spotify autoplay ──────────────────────────────────────────────────────
  // Set src on first user interaction (touch/click/scroll) — this satisfies
  // the browser's autoplay policy and starts the music immediately.
  const iframe = document.getElementById("spotifyPlayerInline");
  if (iframe) {
    let played = false;
    const fallbackUrl = `https://open.spotify.com/embed/playlist/37i9dQZF1DX3Z99viCDp7Q?utm_source=generator&theme=0&autoplay=1`;

    function playOnFirstInteraction() {
      if (played) return;
      played = true;
      iframe.src = autoplayUrl;
      // If the chosen playlist fails, fall back to the working one after 4s
      setTimeout(() => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.title && doc.title.toLowerCase().includes("not found")) {
            iframe.src = fallbackUrl;
          }
        } catch (e) {
          // cross-origin — can't read, assume it's fine
        }
      }, 4000);
      document.removeEventListener("pointerdown", playOnFirstInteraction);
      document.removeEventListener("touchstart", playOnFirstInteraction);
      document.removeEventListener("scroll", playOnFirstInteraction);
    }
    document.addEventListener("pointerdown", playOnFirstInteraction);
    document.addEventListener("touchstart", playOnFirstInteraction);
    document.addEventListener("scroll", playOnFirstInteraction);
  }
} // end initReceiverFlow

async function initSenderResponseViewer() {
  const token = getTokenFromUrl();
  if (!token) return;

  console.log("[VIEWER] fetching token:", token);
  let data = null;
  try {
    const res = await fetch(`/api/proposal/${encodeURIComponent(token)}`);
    if (res.ok) data = await res.json();
  } catch (e) {
    data = readProposalData(token);
  }
  if (!data) data = readProposalData(token);
  console.log("[VIEWER] data.response:", !!data?.response, "| date:", data?.response?.date, "| pref:", data?.response?.preference);
  if (!data || !data.response) return;

  const responseSection = document.getElementById("responseSection");

  const response = data.response;
  const selectedSong = response.song || data.song || SONG_OPTIONS[0].label;

  document.getElementById("resultSong").textContent = selectedSong;
  document.getElementById("resultDate").textContent = formatDate(response.date);
  document.getElementById("resultTime").textContent = formatTime(response.time);
  document.getElementById("resultPreference").textContent = response.preference;

  document.getElementById("responseSummary").innerHTML = "";

  // No music on the sender's side — music is only for the receiver
  showPanel("responseSection");
}

function initSparkleEffects() {
  window.addEventListener("pointermove", (event) => {
    if (Math.random() > 0.42) {
      createSparkleTrail(event);
    }
  });

  window.addEventListener("click", (event) => {
    for (let i = 0; i < 8; i += 1) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      createFloatingHeart(event.clientX + offsetX, event.clientY + offsetY);
    }
  });
}

async function initApp() {
  const audio = document.getElementById("backgroundAudio");
  initSparkleEffects();

  // ── Handle Spotify OAuth callback ─────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const spotifyCode = urlParams.get("code");
  const spotifyError = urlParams.get("error");

  if (spotifyError) {
    // User denied Spotify access — just go to sender flow
    window.history.replaceState({}, "", window.location.pathname);
    await initSenderFlow();
    showPanel("setupSection");
    showToast("Spotify connection cancelled. You can still use the default playlist.");
    return;
  }

  if (spotifyCode && sessionStorage.getItem(SPOTIFY_VERIFIER_KEY)) {
    // Exchange code for token, then go to sender flow
    await exchangeSpotifyCode(spotifyCode);
    await initSenderFlow();
    showPanel("setupSection");
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const token = getTokenFromUrl();
  const ownerParam = getOwnerFromUrl();

  console.log("[ROUTING] token:", token, "| ownerParam:", ownerParam);

  if (token) {
    let savedData = null;
    try {
      const res = await fetch(`/api/proposal/${encodeURIComponent(token)}`);
      if (res.ok) {
        savedData = await res.json();
        if (savedData && savedData.token) {
          saveProposalData(savedData.token, savedData);
        }
      } else {
        console.warn("[ROUTING] API returned", res.status, "— are you running on the correct port? Open via http://localhost:3000");
        savedData = readProposalData(token);
      }
    } catch (e) {
      console.warn("[ROUTING] Fetch failed — open via http://localhost:3000, not Live Server", e.message);
      savedData = readProposalData(token);
    }
    if (!savedData) savedData = readProposalData(token);

    console.log("[ROUTING] savedData.response:", !!savedData?.response, "| savedData.ownerToken:", savedData?.ownerToken);

    if (savedData && savedData.response) {
      const ownerMatches = ownerParam && (
        !savedData.ownerToken || ownerParam === savedData.ownerToken
      );
      console.log("[ROUTING] ownerMatches:", ownerMatches);
      if (ownerMatches) {
        console.log("[ROUTING] → initSenderResponseViewer");
        initSenderResponseViewer();
        return;
      }
      // Receiver or anyone else opening the share link after it was answered
      document.body.innerHTML = `
        <div style="
          min-height:100vh;display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          font-family:'Inter',sans-serif;
          background:linear-gradient(160deg,#1a0a0f 0%,#3d1a2e 45%,#1f0d1a 100%);
          color:#fde8f0;text-align:center;padding:32px;gap:16px;">
          <div style="font-size:3rem;">💖</div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2.6rem;margin:0;color:#fde8f0;">
            This moment is sealed
          </h2>
          <p style="color:rgba(253,232,240,0.65);max-width:340px;line-height:1.8;margin:0;font-size:0.95rem;">
            This invitation has already been answered. Something beautiful is in the works.
          </p>
        </div>`;
      return;
    }

    // No response yet — if this is the owner, show a waiting screen
    if (ownerParam) {
      document.body.innerHTML = `
        <div style="
          min-height:100vh;display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          font-family:'Inter',sans-serif;
          background:linear-gradient(160deg,#1a0a0f 0%,#3d1a2e 45%,#1f0d1a 100%);
          color:#fde8f0;text-align:center;padding:32px;gap:20px;">
          <div style="font-size:3rem;animation:pulse 1.8s ease-in-out infinite;">💌</div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2.4rem;margin:0;color:#fde8f0;">
            Waiting for their answer
          </h2>
          <p style="color:rgba(253,232,240,0.65);max-width:340px;line-height:1.8;margin:0;font-size:0.95rem;">
            Your crush hasn't responded yet. Come back here once they've replied to see their chosen date, time, and kind of date.
          </p>
          <button onclick="window.location.reload()" style="
            margin-top:8px;padding:14px 32px;border:none;border-radius:999px;
            background:linear-gradient(135deg,#d4a843,#c9748a);
            color:#fff;font-weight:800;font-size:0.95rem;cursor:pointer;">
            Check for reply
          </button>
          <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>
        </div>`;
      return;
    }

    // No response yet — show the receiver's proposal page
    initReceiverFlow();
    return;
  }

  await initSenderFlow();
  showPanel("setupSection");
}

// script.js is loaded at end of <body> so DOM is ready.
// Catch any error so a failure never leaves a blank page.
initApp().catch((err) => {
  console.error("initApp failed:", err);
  showPanel("setupSection");
  initSenderFlow().catch(() => {});
});
