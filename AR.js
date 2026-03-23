import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");
const statusEl = document.getElementById("photoStatus");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function makeBadge(host) {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "12px";
  el.style.top = "12px";
  el.style.zIndex = "5";
  el.style.padding = "6px 8px";
  el.style.borderRadius = "10px";
  el.style.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  el.style.fontWeight = "800";
  el.style.color = "#fff";
  el.style.background = "rgba(0,0,0,.45)";
  el.style.backdropFilter = "blur(6px)";
  el.textContent = "Jugador AR: cargando…";
  host.appendChild(el);
  return (message, hide = false) => {
    el.textContent = message;
    el.style.display = hide ? "none" : "block";
  };
}

function createGroundShadow() {
  const geometry = new THREE.CircleGeometry(0.78, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.01, 0.05);
  return mesh;
}

if (!canvas || !card) {
  console.warn("AR.js: no encontré #arCanvas o .player-card");
  setStatus("No encontré el lienzo AR.");
} else {
  const debug = makeBadge(card);

  canvas.style.pointerEvents = "none";
  canvas.style.background = "transparent";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
  camera.position.set(0, 1.0, 4.0);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8fa0b9, 1.15);
  hemi.position.set(0, 3, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(2.4, 4.6, 3.5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.75);
  fill.position.set(-2.2, 2.0, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.45);
  rim.position.set(0.8, 2.8, -2.2);
  scene.add(rim);

  const shadow = createGroundShadow();
  scene.add(shadow);

  const helperBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.1, 0.3),
    new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.35 })
  );
  helperBox.position.set(0, 0.55, 0);
  scene.add(helperBox);

  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  let model = null;
  let mixer = null;
  let clips = [];
  let activeAction = null;
  let defaultAction = null;
  const lookTarget = new THREE.Vector3(0, 0.95, 0);

  function resizeToCard() {
    const rect = card.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();

    return true;
  }

  function frameModel(modelRoot) {
    const initialBox = new THREE.Box3().setFromObject(modelRoot);
    const initialCenter = initialBox.getCenter(new THREE.Vector3());
    modelRoot.position.sub(initialCenter);

    const size = initialBox.getSize(new THREE.Vector3());
    const baseScale = 0.9;
    const targetHeight = 2.0;
    const scaleFromHeight = targetHeight / Math.max(size.y, 0.001);

    modelRoot.scale.setScalar(scaleFromHeight * baseScale);

    const box = new THREE.Box3().setFromObject(modelRoot);
    modelRoot.position.y -= box.min.y;
    modelRoot.position.x = 0;
    modelRoot.position.z = 0;
    modelRoot.rotation.y = -0.12;

    shadow.position.x = 0;
    shadow.position.z = 0.03;

    const framedBox = new THREE.Box3().setFromObject(modelRoot);
    const framedSize = framedBox.getSize(new THREE.Vector3());
    const framedCenter = framedBox.getCenter(new THREE.Vector3());

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);

    const distV = (framedSize.y * 0.55) / Math.tan(vFov / 2);
    const distH = (framedSize.x * 0.60) / Math.tan(hFov / 2);
    const distance = Math.max(distV, distH) * 1.1;

    camera.position.set(0, Math.max(0.95, framedCenter.y * 0.95), distance);
    camera.near = Math.max(0.05, distance / 100);
    camera.far = distance * 20;
    camera.updateProjectionMatrix();

    lookTarget.set(0, Math.max(0.9, framedCenter.y * 0.95), 0);
  }

  function playClip(index, { loopOnce = false } = {}) {
    if (!mixer || !clips[index]) return false;

    const next = mixer.clipAction(clips[index]);
    next.reset();
    next.enabled = true;
    next.fadeIn(0.18);

    if (loopOnce) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }

    if (activeAction && activeAction !== next) {
      activeAction.fadeOut(0.18);
    }

    next.play();
    activeAction = next;
    return true;
  }

  function chooseClipIndexByLabel(label) {
    if (!clips.length) return -1;

    const normalized = String(label || "").toLowerCase();
    const matchers = [
      { keys: ["celebr", "trophy", "victory", "goal", "win"], regex: /celebr|trophy|victory|goal|win/i },
      { keys: ["sonrisa", "smile", "happy"], regex: /smile|happy|idle|pose/i },
      { keys: ["energ", "power", "run", "jump"], regex: /power|run|jump|dash/i },
      { keys: ["coraz", "heart", "love"], regex: /heart|love|pose/i }
    ];

    for (const matcher of matchers) {
      if (matcher.keys.some((key) => normalized.includes(key))) {
        const found = clips.findIndex((clip) => matcher.regex.test(clip.name));
        if (found >= 0) return found;
      }
    }

    return clips.length > 1 ? 1 : 0;
  }

  function resetEmote() {
    if (defaultAction) return playClip(0);
    return false;
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resizeToCard()).observe(card);
  } else {
    window.addEventListener("resize", resizeToCard);
  }

  let tries = 0;
  const ensureSize = () => {
    tries += 1;
    if (!resizeToCard() && tries < 30) {
      requestAnimationFrame(ensureSize);
    }
  };
  ensureSize();

  debug("Jugador AR: cargando modelo…");
  setStatus("Cámara lista. Cargando jugador AR…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      frameModel(model);

      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
          if (node.material) {
            node.material.transparent = true;
            node.material.needsUpdate = true;
          }
        }
      });

      clips = Array.isArray(gltf.animations) ? gltf.animations : [];
      if (clips.length) {
        mixer = new THREE.AnimationMixer(model);
        defaultAction = mixer.clipAction(clips[0]);
        playClip(0);
      }

      card.classList.add("is-live");
      scene.remove(helperBox);

      resizeToCard();
      renderer.render(scene, camera);
      debug("Jugador AR: listo", true);
      setStatus("Jugador AR listo");
    },
    undefined,
    (error) => {
      debug("No se pudo cargar Futbolista.glb");
      setStatus("No se pudo cargar el jugador AR.");
      console.error("Error cargando GLB:", MODEL_URL, error);
    }
  );

  function tick() {
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();

  window.ARPhoto = {
    canvas: renderer.domElement,
    resizeTo: resizeToCard,
    renderOnce: () => renderer.render(scene, camera),
    playEmote(label) {
      if (!clips.length) return false;
      const index = chooseClipIndexByLabel(label);
      return playClip(index >= 0 ? index : 0, { loopOnce: clips.length > 1 });
    },
    resetEmote,
    get isReady() {
      return Boolean(model);
    }
  };
}
