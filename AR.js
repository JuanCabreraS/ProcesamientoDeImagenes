import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "./Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");

function makeDebug(cardElement) {
  const badge = document.createElement("div");
  badge.style.position = "absolute";
  badge.style.left = "12px";
  badge.style.top = "60px";
  badge.style.zIndex = "4";
  badge.style.padding = "6px 8px";
  badge.style.borderRadius = "10px";
  badge.style.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  badge.style.fontWeight = "800";
  badge.style.color = "#fff";
  badge.style.background = "rgba(0,0,0,.45)";
  badge.style.backdropFilter = "blur(6px)";
  badge.textContent = "Jugador AR: cargando…";
  cardElement.appendChild(badge);

  return (message, hide = false) => {
    badge.textContent = message;
    badge.style.display = hide ? "none" : "block";
  };
}

function createShadow() {
  const geometry = new THREE.CircleGeometry(0.65, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.14,
    transparent: true,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.5, 0.01, 0.1);
  return mesh;
}

if (!canvas || !card) {
  console.warn("AR.js: No encontré #arCanvas o .player-card");
} else {
  const debug = makeDebug(card);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
  } catch (error) {
    debug("AR: WebGL no disponible");
    console.error(error);
    throw error;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.15, 4.25);
  scene.add(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.1);
  hemi.position.set(0, 2, 0);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
  keyLight.position.set(2.4, 4.8, 3.2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.65);
  fillLight.position.set(-2, 2.2, 2);
  scene.add(fillLight);

  scene.add(createShadow());

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();

  let model = null;
  let mixer = null;
  let activeAction = null;
  let defaultAction = null;
  let clips = [];
  const lookTarget = new THREE.Vector3(0.5, 1.0, 0);

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
    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    modelRoot.position.sub(center);
    modelRoot.position.y -= box.min.y;
    modelRoot.position.x += 0.55;

    const groundedBox = new THREE.Box3().setFromObject(modelRoot);
    const groundedSize = groundedBox.getSize(new THREE.Vector3());

    const targetHeight = 2.25;
    const targetWidth = 1.35;
    const heightScale = targetHeight / Math.max(groundedSize.y, 0.01);
    const widthScale = targetWidth / Math.max(groundedSize.x, 0.01);
    const scale = Math.min(heightScale, widthScale);

    modelRoot.scale.setScalar(scale);
  }

  function playClipByIndex(index, { loopOnce = false } = {}) {
    if (!mixer || !clips[index]) return false;

    const nextAction = mixer.clipAction(clips[index]);
    nextAction.reset();
    nextAction.enabled = true;
    nextAction.fadeIn(0.2);

    if (loopOnce) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    if (activeAction && activeAction !== nextAction) {
      activeAction.fadeOut(0.2);
    }

    nextAction.play();
    activeAction = nextAction;
    return true;
  }

  function chooseClipIndexByLabel(label) {
    if (!clips.length) return -1;

    const normalized = String(label || "").toLowerCase();

    const matchers = [
      { keys: ["celebr", "trophy", "victory", "goal", "win"], index: /celebr|trophy|victory|goal|win/i },
      { keys: ["sonrisa", "smile", "happy"], index: /smile|happy|idle|pose/i },
      { keys: ["energ", "power", "run", "jump"], index: /power|run|jump|dash/i },
      { keys: ["coraz", "heart", "love"], index: /heart|love|pose/i }
    ];

    for (const matcher of matchers) {
      if (matcher.keys.some((key) => normalized.includes(key))) {
        const foundIndex = clips.findIndex((clip) => matcher.index.test(clip.name));
        if (foundIndex >= 0) return foundIndex;
      }
    }

    return clips.length > 1 ? 1 % clips.length : 0;
  }

  function resetEmote() {
    if (defaultAction) {
      playClipByIndex(0);
      return true;
    }
    return false;
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resizeToCard()).observe(card);
  } else {
    window.addEventListener("resize", resizeToCard);
  }

  resizeToCard();

  debug("AR: cargando Futbolista.glb…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      fitModel(model);

      clips = Array.isArray(gltf.animations) ? gltf.animations : [];
      if (clips.length) {
        mixer = new THREE.AnimationMixer(model);
        defaultAction = mixer.clipAction(clips[0]);
        playClipByIndex(0);
      }

      debug("Jugador AR listo", true);
    },
    undefined,
    (error) => {
      debug("No encontré Futbolista.glb");
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
      return playClipByIndex(index >= 0 ? index : 0, { loopOnce: clips.length > 1 });
    },
    resetEmote,
    get isReady() {
      return Boolean(model);
    }
  };
}
