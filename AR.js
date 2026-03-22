import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");
const statusEl = document.getElementById("photoStatus");

function setPhotoStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function makeDebugBadge(container) {
  const badge = document.createElement("div");
  badge.style.position = "absolute";
  badge.style.left = "12px";
  badge.style.top = "12px";
  badge.style.zIndex = "4";
  badge.style.padding = "6px 8px";
  badge.style.borderRadius = "10px";
  badge.style.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  badge.style.fontWeight = "800";
  badge.style.color = "#fff";
  badge.style.background = "rgba(0,0,0,.40)";
  badge.style.backdropFilter = "blur(6px)";
  badge.style.pointerEvents = "none";
  badge.textContent = "Jugador AR: iniciando…";
  container.appendChild(badge);

  return (message, { hide = false } = {}) => {
    badge.textContent = message;
    badge.style.display = hide ? "none" : "block";
  };
}

function makeShadowPlane() {
  const geometry = new THREE.CircleGeometry(1, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  return shadow;
}

if (!canvas || !card) {
  console.warn("AR.js: No encontré #arCanvas o .player-card");
} else {
  const debug = makeDebugBadge(card);
  debug("Jugador AR: preparando renderer…");
  setPhotoStatus("Cargando jugador…");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
  } catch (error) {
    debug("WebGL no disponible");
    setPhotoStatus("Tu navegador no pudo iniciar WebGL.");
    console.error(error);
    throw error;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  scene.add(camera);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.25);
  hemi.position.set(0, 3, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(2.6, 4.0, 3.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.65);
  fill.position.set(-2.2, 2.6, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0.8, 2.2, -3.0);
  scene.add(rim);

  const shadow = makeShadowPlane();
  scene.add(shadow);

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();

  let model = null;
  let mixer = null;
  let clips = [];
  let activeAction = null;
  let defaultAction = null;
  const lookTarget = new THREE.Vector3(0, 1.0, 0);

  function resizeToCard() {
    const rect = card.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();

    if (model) {
      frameModel(model);
    }

    return true;
  }

  function prepareModelMaterials(root) {
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = false;

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        if (!material) return;
        material.transparent = material.transparent || false;
        if ("needsUpdate" in material) material.needsUpdate = true;
      });
    });
  }

  function frameModel(root) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);

    const distanceForHeight = (size.y * 0.5) / Math.tan(verticalFov / 2);
    const distanceForWidth = (size.x * 0.5) / Math.tan(horizontalFov / 2);
    const distance = Math.max(distanceForHeight, distanceForWidth) * 1.12;

    const eyeY = box.min.y + size.y * 0.62;

    lookTarget.set(center.x, eyeY, center.z);
    camera.position.set(center.x, eyeY, distance + size.z * 0.7);
    camera.near = Math.max(0.01, distance / 100);
    camera.far = Math.max(50, distance * 100);
    camera.updateProjectionMatrix();

    shadow.scale.set(Math.max(0.65, size.x * 0.52), Math.max(0.65, size.z * 1.6), 1);
    shadow.position.set(center.x, box.min.y + 0.01, center.z);
  }

  function normalizeAndPlaceModel(root) {
    const initialBox = new THREE.Box3().setFromObject(root);
    const initialCenter = initialBox.getCenter(new THREE.Vector3());

    root.position.x -= initialCenter.x;
    root.position.z -= initialCenter.z;
    root.position.y -= initialBox.min.y;

    const groundedBox = new THREE.Box3().setFromObject(root);
    const groundedSize = groundedBox.getSize(new THREE.Vector3());

    const targetHeight = 2.15;
    const scale = targetHeight / Math.max(groundedSize.y, 0.01);
    root.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

    root.position.x -= scaledCenter.x;
    root.position.z -= scaledCenter.z;
    root.position.y -= scaledBox.min.y;

    frameModel(root);
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

    const groups = [
      { keys: ["celebr", "victor", "goal", "trophy", "win"], regex: /celebr|victor|goal|win|trophy/i },
      { keys: ["sonrisa", "smile", "happy"], regex: /smile|happy|idle|pose/i },
      { keys: ["energ", "power", "run", "jump"], regex: /power|run|jump|dash/i },
      { keys: ["coraz", "heart", "love"], regex: /heart|love|pose/i }
    ];

    for (const group of groups) {
      if (!group.keys.some((key) => normalized.includes(key))) continue;
      const match = clips.findIndex((clip) => group.regex.test(clip.name));
      if (match >= 0) return match;
    }

    return clips.length > 1 ? 1 % clips.length : 0;
  }

  function resetEmote() {
    if (!defaultAction) return false;
    return playClipByIndex(0);
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resizeToCard()).observe(card);
  } else {
    window.addEventListener("resize", resizeToCard);
  }

  let tries = 0;
  const ensureSize = () => {
    tries += 1;
    const ok = resizeToCard();
    if (!ok && tries < 30) requestAnimationFrame(ensureSize);
  };
  ensureSize();

  debug("Jugador AR: cargando GLB…");
  setPhotoStatus("Cargando modelo del jugador…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      prepareModelMaterials(model);
      scene.add(model);

      normalizeAndPlaceModel(model);

      clips = Array.isArray(gltf.animations) ? gltf.animations : [];
      if (clips.length) {
        mixer = new THREE.AnimationMixer(model);
        defaultAction = mixer.clipAction(clips[0]);
        playClipByIndex(0);
      }

      debug("Jugador AR listo", { hide: true });
      setPhotoStatus("Jugador listo");
      card.classList.add("is-live");
    },
    undefined,
    (error) => {
      debug("No pude cargar Futbolista.glb");
      setPhotoStatus("No pude cargar Futbolista.glb");
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
