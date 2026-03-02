(() => {
  async function ensurePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
    } catch (_) {
    }
  }

  async function listVideoDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === "videoinput");
  }

  function stopCamera(videoEl) {
    const stream = videoEl?.srcObject;
    if (stream?.getTracks) stream.getTracks().forEach(t => t.stop());
    if (videoEl) videoEl.srcObject = null;
  }

  async function startCamera(videoEl, {
    facingMode = "environment",
    deviceId = null,
    idealWidth = 1280,
    idealHeight = 720
  } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Este navegador no soporta getUserMedia.");
    }

    stopCamera(videoEl);

    const videoConstraints = deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: idealWidth }, height: { ideal: idealHeight } }
      : { facingMode: { ideal: facingMode }, width: { ideal: idealWidth }, height: { ideal: idealHeight } };

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints
    });

    videoEl.srcObject = stream;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.dataset.facing = facingMode;

    await videoEl.play();
    return stream;
  }

  async function switchCamera(videoEl) {
    const current = videoEl.dataset.facing || "environment";
    const nextFacing = current === "user" ? "environment" : "user";

    try {
      await startCamera(videoEl, { facingMode: nextFacing });
      return { mode: "facingMode", facing: nextFacing };
    } catch (e) {
      await ensurePermission();
      const cams = await listVideoDevices();
      if (cams.length <= 1) throw e;

      const currentId = videoEl.srcObject?.getVideoTracks?.()[0]?.getSettings?.().deviceId;
      let idx = cams.findIndex(d => d.deviceId === currentId);
      idx = (idx + 1) % cams.length;

      await startCamera(videoEl, { deviceId: cams[idx].deviceId, facingMode: nextFacing });
      return { mode: "deviceId", deviceId: cams[idx].deviceId };
    }
  }

  function takeSnapshot(videoEl, canvasEl, { mime = "image/png", quality } = {}) {
    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    if (!w || !h) throw new Error("El video aún no está listo.");

    canvasEl.width = w;
    canvasEl.height = h;

    const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(videoEl, 0, 0, w, h);
    return canvasEl.toDataURL(mime, quality);
  }

  function dataURLToBlob(dataURL) {
    const [head, body] = dataURL.split(",");
    const mime = head.match(/:(.*?);/)?.[1] || "image/png";
    const bin = atob(body);
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  function downloadDataURL(dataURL, filename = "foto.png") {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.CameraUtils = {
    startCamera,
    stopCamera,
    switchCamera,
    takeSnapshot,
    dataURLToBlob,
    downloadDataURL,
    listVideoDevices
  };
})();