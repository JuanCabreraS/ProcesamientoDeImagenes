import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");

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
  const geometry = new THREE.CircleGeometry(0.62, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.4, 0.01, 0.05);
  return mesh;
}

if (!canvas || !card) {
  console.warn("AR.js: no encontré #arCanvas o .player-card");
} else {
  const debug = makeBadge(card);

  canvas.style.pointerEvents = "none";
  canvas.style.background = "transparent";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  camera.position.set(0, 1.15, 4.4);
  scene.add(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 1.15);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8fa0b9, 1.05);
  hemi.position.set(0, 3, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(2.8, 4.6, 3.5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-2.3, 2.1, 2.2);
  scene.add(fill);

  scene.add(createGroundShadow());

  const clock = new THREE.Clock();
  const loader = new GLTFLoader();

  let model = null;
  let mixer = null;
  let clips = [];
  let activeAction = null;
  let defaultAction = null;
  const lookTarget = new THREE.Vector3(0.4, 1.05, 0);

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

  function fitModel(modelRoot) {
    const box1 = new THREE.Box3().setFromObject(modelRoot);
    const center1 = box1.getCenter(new THREE.Vector3());
    modelRoot.position.sub(center1);

    const box2 = new THREE.Box3().setFromObject(modelRoot);
    const size2 = box2.getSize(new THREE.Vector3());

    const targetHeight = 2.18;
    const targetWidth = 1.28;

    const scaleByHeight = targetHeight / Math.max(size2.y, 0.001);
    const scaleByWidth = targetWidth / Math.max(size2.x, 0.001);
    const scale = Math.min(scaleByHeight, scaleByWidth);

    modelRoot.scale.setScalar(scale);

    const box3 = new THREE.Box3().setFromObject(modelRoot);
    modelRoot.position.y -= box3.min.y;
    modelRoot.position.x += 0.48;
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

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      fitModel(model);

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

      resizeToCard();
      renderer.render(scene, camera);
      debug("Jugador AR: listo", true);
    },
    undefined,
    (error) => {
      debug("No se pudo cargar Futbolista.glb");
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
