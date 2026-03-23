function setupHomeButtons() {
  document.querySelectorAll("[data-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = encodeURI("index.html");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHomeButtons();

  setupLandingPage();
  setupTriviaPage();
  setupPlayerPage();
  setupPhotoPage();
  setupCapturedPage();
});

// -------------------------------------
// Pantalla principal
// -------------------------------------
function setupLandingPage() {
  const markerScene = document.getElementById("markerScene");
  if (markerScene) {
    setupMarkerLandingPage(markerScene);
    return;
  }

  const video = document.getElementById("qrVideo");
  if (video) {
    setupLegacyQRPage(video);
  }
}

function setupLegacyQRPage(video) {
  const scanBtn = document.getElementById("scanBtn");
  const switchBtn = document.getElementById("switchQrCamBtn");
  const statusEl = document.getElementById("qrStatus");
  const frame = document.querySelector(".scan-frame");

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const stop = () => {
    frame?.classList.remove("is-live");
    window.CameraUtils?.stopCamera(video);
  };

  async function startPreview() {
    try {
      setStatus("Activando cámara...");
      await window.CameraUtils.startCamera(video, { facingMode: "environment" });
      frame?.classList.add("is-live");
      setStatus("Cámara lista");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la cámara (permiso/HTTPS).");
    }
  }

  startPreview();

  scanBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Trivia.html");
  });

  switchBtn?.addEventListener("click", async () => {
    try {
      if (!video.srcObject) {
        await startPreview();
        return;
      }

      await window.CameraUtils.switchCamera(video);
      setStatus("Cámara cambiada");
    } catch (error) {
      console.error(error);
      setStatus("No hay otra cámara disponible.");
    }
  });

  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

function setupMarkerLandingPage(markerScene) {
  const scanBtn = document.getElementById("scanBtn");
  const switchBtn = document.getElementById("switchQrCamBtn");
  const statusEl = document.getElementById("qrStatus");
  const frame = document.getElementById("markerFrame");
  const target = document.getElementById("markerTarget");
  const bgVideo = document.getElementById("markerBgVideo");

  let unlocked = false;
  let previewBound = false;
  let previewRetryTimer = null;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const unlockTrivia = () => {
    unlocked = true;
    frame?.classList.add("is-detected");
    scanBtn?.removeAttribute("disabled");
    if (scanBtn) {
      scanBtn.innerHTML = '<span class="bolt" aria-hidden="true">⚡</span> Comenzar trivia';
    }
    sessionStorage.setItem("markerUnlocked", "1");
    setStatus("Jugador detectado. Ya puedes continuar a la trivia.");
  };

  const prepareSceneVisuals = () => {
    markerScene.style.background = "transparent";

    const canvas = markerScene.canvas;
    if (canvas) {
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.background = "transparent";
      canvas.style.pointerEvents = "none";
    }

    const renderer = markerScene.renderer;
    if (renderer) {
      renderer.setClearColor(0x000000, 0);
      if (typeof renderer.setClearAlpha === "function") {
        renderer.setClearAlpha(0);
      }
    }
  };

  const attachMindARPreview = () => {
    if (previewBound || !bgVideo) return previewBound;

    const arSystem = markerScene.systems && markerScene.systems["mindar-image-system"];
    const srcVideo = arSystem && arSystem.video;

    if (!srcVideo) return false;

    const syncStream = () => {
      const stream = srcVideo.srcObject;
      if (!stream) return false;

      if (bgVideo.srcObject !== stream) {
        bgVideo.srcObject = stream;
      }

      bgVideo.muted = true;
      bgVideo.setAttribute("playsinline", "");
      bgVideo.play().catch(() => {});
      frame?.classList.add("is-live");
      previewBound = true;
      return true;
    };

    if (syncStream()) return true;

    srcVideo.addEventListener("loadedmetadata", syncStream, { once: true });
    srcVideo.addEventListener("canplay", syncStream, { once: true });

    return false;
  };

  const schedulePreviewAttach = (attempt = 0) => {
    if (attachMindARPreview()) return;
    if (attempt > 30) return;

    clearTimeout(previewRetryTimer);
    previewRetryTimer = setTimeout(() => {
      prepareSceneVisuals();
      schedulePreviewAttach(attempt + 1);
    }, 180);
  };

  switchBtn?.setAttribute("disabled", "disabled");

  if (sessionStorage.getItem("markerUnlocked") === "1") {
    unlockTrivia();
  } else {
    setStatus("Inicializando cámara AR…");
  }

  markerScene.addEventListener("loaded", prepareSceneVisuals);
  markerScene.addEventListener("renderstart", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();
  });

  markerScene.addEventListener("arReady", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();

    frame?.classList.add("is-live");
    if (!unlocked) {
      setStatus("AR listo. Apunta al marcadorweb para desbloquear al jugador.");
    }
  });

  markerScene.addEventListener("arError", () => {
    setStatus("No se pudo iniciar AR. Verifica permisos de cámara y HTTPS.");
  });

  target?.addEventListener("targetFound", () => {
    schedulePreviewAttach();
    unlockTrivia();
  });

  target?.addEventListener("targetLost", () => {
    if (unlocked) {
      setStatus("Jugador desbloqueado. Puedes seguir aunque el marcador ya no esté en cuadro.");
      return;
    }
    frame?.classList.remove("is-detected");
    setStatus("Marcador fuera de cuadro. Vuelve a apuntar al marcadorweb.");
  });

  scanBtn?.addEventListener("click", () => {
    if (!unlocked) {
      alert("Primero detecta el marcadorweb para desbloquear la trivia.");
      return;
    }

    window.location.href = encodeURI("Pantalla Trivia.html");
  });
}

// -------------------------------------
// Pantalla Trivia
// -------------------------------------
function setupTriviaPage() {
  const confirmBtn = document.querySelector(".confirm");
  const answers = Array.from(document.querySelectorAll(".answer"));
  if (!confirmBtn || answers.length === 0) return;

  let selected = null;

  function updateConfirm() {
    confirmBtn.disabled = !selected;
  }

  answers.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (selected === btn) {
        btn.classList.remove("is-selected");
        selected = null;
        updateConfirm();
        return;
      }

      answers.forEach((button) => button.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      selected = btn;
      updateConfirm();
    });
  });

  confirmBtn.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Jugador.html");
  });

  updateConfirm();
}

// -------------------------------------
// Pantalla Jugador
// -------------------------------------
function setupPlayerPage() {
  const cta = document.querySelector(".cta-btn");
  if (!cta) return;

  cta.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Foto.html");
  });
}

// -------------------------------------
// Utilidades de captura
// -------------------------------------
const PHOTO_FILTERS = [
  { label: "Normal", canvasFilter: "none" },
  { label: "Frío", canvasFilter: "saturate(1.15) contrast(1.05) hue-rotate(12deg)" },
  { label: "B&N", canvasFilter: "grayscale(1) contrast(1.12)" },
  { label: "Cálido", canvasFilter: "sepia(0.28) saturate(1.18) hue-rotate(-10deg)" }
];

function getSourceSize(source) {
  const width = source.videoWidth || source.naturalWidth || source.width || 0;
  const height = source.videoHeight || source.naturalHeight || source.height || 0;
  return { width, height };
}

function drawSourceCover(ctx, source, outWidth, outHeight, options = {}) {
  const { mirror = false, filter = "none" } = options;
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
  if (!sourceWidth || !sourceHeight) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const canvasRatio = outWidth / outHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > canvasRatio) {
    sw = sourceHeight * canvasRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / canvasRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.save();
  ctx.filter = filter;

  if (mirror) {
    ctx.translate(outWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawEmoteSticker(ctx, outWidth, outHeight, emote) {
  if (!emote || !emote.label) return;

  const stickerWidth = Math.round(outWidth * 0.34);
  const stickerHeight = Math.round(outHeight * 0.10);
  const x = Math.round(outWidth * 0.05);
  const y = Math.round(outHeight * 0.04);
  const radius = Math.round(stickerHeight / 2);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  drawRoundedRect(ctx, x, y, stickerWidth, stickerHeight, radius);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(stickerHeight * 0.40)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(emote.emoji || "⚽", x + stickerHeight * 0.32, y + stickerHeight / 2);

  ctx.font = `900 ${Math.round(stickerHeight * 0.24)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(emote.label, x + stickerHeight * 0.78, y + stickerHeight / 2);
  ctx.restore();
}

function takeCompositePhoto(videoEl, outCanvas, cardEl, overlayCanvas, options = {}) {
  const { mirror = false, filter = "none", emote = null } = options;
  const rect = cardEl.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  outCanvas.width = width;
  outCanvas.height = height;

  const ctx = outCanvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);

  drawSourceCover(ctx, videoEl, width, height, { mirror, filter });

  if (overlayCanvas && getSourceSize(overlayCanvas).width) {
    window.ARPhoto?.resizeTo?.();
    window.ARPhoto?.renderOnce?.();
    drawSourceCover(ctx, overlayCanvas, width, height, { mirror, filter });
  }

  if (emote) {
    drawEmoteSticker(ctx, width, height, emote);
  }

  return outCanvas.toDataURL("image/png");
}

// -------------------------------------
// Pantalla Foto
// -------------------------------------
function setupPhotoPage() {
  const shutterBtn = document.getElementById("shutterBtn");
  if (!shutterBtn) return;

  const video = document.getElementById("photoVideo");
  const overlayCanvas = document.getElementById("arCanvas");
  const outCanvas = document.getElementById("photoCanvas");
  const card = document.querySelector(".player-card");
  const switchBtn = document.getElementById("switchCamBtn");
  const statusEl = document.getElementById("photoStatus");
  const backBtn = document.getElementById("backBtn");
  const effectsBtn = document.getElementById("effectsBtn");
  const effectsLabel = document.getElementById("effectsLabel");
  const emoteButtons = Array.from(document.querySelectorAll(".emote-btn"));
  const emotePill = document.getElementById("emotePill");
  const emotePillIcon = emotePill?.querySelector(".emote-pill__icon");
  const emotePillText = emotePill?.querySelector(".emote-pill__text");
  const emoteSticker = document.getElementById("emoteSticker");
  const emoteStickerEmoji = emoteSticker?.querySelector(".emote-sticker__emoji");
  const emoteStickerLabel = emoteSticker?.querySelector(".emote-sticker__label");

  if (!video || !card || !outCanvas) return;

  let currentFacing = "user";
  let currentFilterIndex = 0;
  let activeEmote = null;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const syncFacingUI = () => {
    card.classList.toggle("is-selfie", currentFacing === "user");
  };

  const stop = () => {
    window.CameraUtils.stopCamera(video);
    card.classList.remove("is-live");
    setStatus("Cámara detenida");
  };

  function applyFilter(index) {
    currentFilterIndex = (index + PHOTO_FILTERS.length) % PHOTO_FILTERS.length;
    const preset = PHOTO_FILTERS[currentFilterIndex];

    video.style.filter = preset.canvasFilter;
    if (overlayCanvas) overlayCanvas.style.filter = preset.canvasFilter;

    document.body.dataset.filterIndex = String(currentFilterIndex);
    effectsLabel.textContent = `Filtro: ${preset.label}`;
    effectsBtn?.classList.toggle("is-active", currentFilterIndex > 0);
    effectsBtn?.setAttribute("aria-pressed", String(currentFilterIndex > 0));
  }

  function clearEmoteUI() {
    emoteButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });

    if (emotePill) {
      emotePill.classList.remove("is-visible");
      emotePill.setAttribute("aria-hidden", "true");
    }

    if (emoteSticker) {
      emoteSticker.classList.remove("is-visible");
      emoteSticker.setAttribute("aria-hidden", "true");
    }
  }

  function setActiveEmote(button) {
    if (!button) {
      activeEmote = null;
      clearEmoteUI();
      window.ARPhoto?.resetEmote?.();
      return;
    }

    const label = button.dataset.label || "Emote";
    const emoji = button.dataset.emoji || "⚽";
    const svg = button.querySelector("svg");

    activeEmote = { label, emoji };

    clearEmoteUI();
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");

    if (emotePill && emotePillIcon && emotePillText) {
      emotePillIcon.innerHTML = svg ? svg.outerHTML : "";
      emotePillText.textContent = label;
      emotePill.classList.add("is-visible");
      emotePill.setAttribute("aria-hidden", "false");
    }

    if (emoteSticker && emoteStickerEmoji && emoteStickerLabel) {
      emoteStickerEmoji.textContent = emoji;
      emoteStickerLabel.textContent = label;
      emoteSticker.classList.add("is-visible");
      emoteSticker.setAttribute("aria-hidden", "false");
    }

    window.ARPhoto?.playEmote?.(label);
  }

  async function startPreview(facingMode = "user") {
    try {
      setStatus("Activando cámara...");
      await window.CameraUtils.startCamera(video, {
        facingMode,
        idealWidth: 1280,
        idealHeight: 720
      });

      currentFacing = video.dataset.facing || facingMode;
      syncFacingUI();
      card.classList.add("is-live");
      setStatus("Cámara lista");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la cámara (permiso/HTTPS).");
    }
  }

  applyFilter(0);
  startPreview("user");

  effectsBtn?.addEventListener("click", () => {
    applyFilter(currentFilterIndex + 1);
  });

  emoteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = button.classList.contains("is-active");
      setActiveEmote(isActive ? null : button);
    });
  });

  switchBtn?.addEventListener("click", async () => {
    try {
      setStatus("Cambiando cámara...");
      await window.CameraUtils.switchCamera(video);
      currentFacing = video.dataset.facing || (currentFacing === "user" ? "environment" : "user");
      syncFacingUI();
      card.classList.add("is-live");
      setStatus("Cámara cambiada");
    } catch (error) {
      console.error(error);
      setStatus("No hay otra cámara disponible.");
    }
  });

  shutterBtn.addEventListener("click", () => {
    if (!video.videoWidth) {
      alert("Espera a que la cámara esté lista.");
      return;
    }

    const filter = PHOTO_FILTERS[currentFilterIndex]?.canvasFilter || "none";

    const dataUrl = takeCompositePhoto(video, outCanvas, card, overlayCanvas, {
      mirror: currentFacing === "user",
      filter,
      emote: activeEmote
    });

    sessionStorage.setItem("capturedPhoto", dataUrl);
    window.location.href = encodeURI("Pantalla Foto Capturada.html");
  });

  backBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Jugador.html");
  });

  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

// -------------------------------------
// Pantalla Foto Capturada
// -------------------------------------
function setupCapturedPage() {
  const imgEl = document.getElementById("resultImg");
  if (!imgEl) return;

  const retakeBtn = document.getElementById("retakeBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const shareFb = document.getElementById("shareFacebook");
  const shareWa = document.getElementById("shareWhatsApp");
  const shareIg = document.getElementById("shareInstagram");
  const shareTw = document.getElementById("shareTwitter");

  const dataUrl = sessionStorage.getItem("capturedPhoto");
  const placeholderCard = document.querySelector(".photo-inner .player-card");
  const miniBtn = document.querySelector(".photo-inner .mini-btn");

  if (dataUrl) {
    imgEl.src = dataUrl;
    placeholderCard?.remove();
    miniBtn?.remove();
  } else {
    window.location.href = encodeURI("Pantalla Foto.html");
    return;
  }

  retakeBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Foto.html");
  });

  downloadBtn?.addEventListener("click", () => {
    window.CameraUtils.downloadDataURL(dataUrl, "foto_fifar.png");
  });

  [shareFb, shareWa, shareIg, shareTw]
    .filter(Boolean)
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });
}