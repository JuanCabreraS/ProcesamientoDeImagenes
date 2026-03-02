function setupHomeButtons() {
  document.querySelectorAll("[data-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = encodeURI("index.html");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHomeButtons();

  setupQRPage();
  setupTriviaPage();
  setupPlayerPage();

  setupPhotoPage();
  setupCapturedPage();
});

//Pagina QR
function setupQRPage() {
  const video = document.getElementById("qrVideo");
  if (!video) return;

  const scanBtn = document.getElementById("scanBtn");
  const switchBtn = document.getElementById("switchQrCamBtn");
  const statusEl = document.getElementById("qrStatus");
  const frame = document.querySelector(".scan-frame");

  const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };

  const stop = () => {
    frame?.classList.remove("is-live");
    window.CameraUtils.stopCamera(video);
  };

  async function startPreview() {
    try {
      setStatus("Activando cámara...");
      await window.CameraUtils.startCamera(video, { facingMode: "environment" });
      frame?.classList.add("is-live");
      setStatus("Cámara lista");
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
      setStatus("No hay otra cámara disponible.");
    }
  });

  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

// Pantalla Trivia
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

      answers.forEach(b => b.classList.remove("is-selected"));
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

//Pantalla Jugador
function setupPlayerPage() {
  const cta = document.querySelector(".cta-btn");
  if (!cta) return;

  cta.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Foto.html");
  });
}

//Pantalla Foto
function setupPhotoPage() {
  const video = document.getElementById("photoVideo");
  if (!video) return;

  const canvas = document.getElementById("photoCanvas");
  const shutter = document.getElementById("shutterBtn");
  const switchBtn = document.getElementById("switchCamBtn");
  const card = document.querySelector(".player-card");

  let started = false;

  async function start(mode = "user") {
    try {
      await window.CameraUtils.startCamera(video, { facingMode: mode });
      card?.classList.add("is-live");
      started = true;
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir la cámara. Usa HTTPS/localhost y revisa permisos.");
    }
  }

  start("user");

  switchBtn?.addEventListener("click", async () => {
    try {
      if (!started) {
        await start("user");
        return;
      }
      await window.CameraUtils.switchCamera(video);
    } catch (e) {
      console.error(e);
      alert("No hay otra cámara disponible.");
    }
  });

  shutter?.addEventListener("click", () => {
    try {
      const dataUrl = window.CameraUtils.takeSnapshot(video, canvas, { mime: "image/png" });
      sessionStorage.setItem("capturedPhoto", dataUrl);
      window.location.href = encodeURI("Pantalla Foto Capturada.html");
    } catch (e) {
      console.error(e);
      alert("Aún no está lista la cámara, intenta de nuevo.");
    }
  });

  const stop = () => window.CameraUtils.stopCamera(video);
  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

//Pantalla Foto Capturada
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

  if (dataUrl) {
    imgEl.src = dataUrl;
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

  const shareButtons = [shareFb, shareWa, shareIg, shareTw].filter(Boolean);

  shareButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
}