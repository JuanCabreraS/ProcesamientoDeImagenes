const canvas = document.getElementById("arCanvas");
const stage = document.querySelector(".ar-stage");
const statusEl = document.getElementById("photoStatus");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

if (!canvas || !stage) {
  console.warn("AR.js: no encontré #arCanvas o .ar-stage");
} else {
  const ctx = canvas.getContext("2d");

  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
  }

  function draw() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // rectángulo rojo translúcido
    ctx.fillStyle = "rgba(255, 0, 0, 0.35)";
    ctx.fillRect(canvas.width * 0.18, canvas.height * 0.22, canvas.width * 0.32, canvas.height * 0.32);

    // círculo azul
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 150, 255, 0.55)";
    ctx.arc(canvas.width * 0.66, canvas.height * 0.42, Math.min(canvas.width, canvas.height) * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // texto
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(18, canvas.width * 0.035)}px system-ui, sans-serif`;
    ctx.fillText("TEST CANVAS", canvas.width * 0.26, canvas.height * 0.62);

    requestAnimationFrame(draw);
  }

  resize();
  setStatus("Probando canvas…");
  draw();

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener("resize", resize);
  }
}