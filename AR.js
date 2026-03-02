import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "./Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");

function makeDebug(cardEl) {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = "8px";
  el.style.top = "8px";
  el.style.zIndex = "999";
  el.style.padding = "6px 8px";
  el.style.borderRadius = "10px";
  el.style.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  el.style.fontWeight = "800";
  el.style.color = "#fff";
  el.style.background = "rgba(0,0,0,.45)";
  el.style.backdropFilter = "blur(6px)";
  el.textContent = "AR: iniciando…";
  cardEl.appendChild(el);
  return (msg) => (el.textContent = msg);
}

if (!canvas || !card) {
  console.warn("AR.js: No encontré #arCanvas o .player-card");
} else {
  const debug = makeDebug(card);

  canvas.style.outline = "2px solid rgba(0,255,255,0.6)";

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
  } catch (e) {
    debug("AR: WebGL no disponible");
    console.error(e);
    throw e;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 3, 2);
  scene.add(key);

  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  scene.add(testCube);

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

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resizeToCard()).observe(card);
  } else {
    setInterval(() => resizeToCard(), 300);
  }

  let tries = 0;
  const ensureSize = () => {
    tries++;
    const ok = resizeToCard();
    if (!ok && tries < 30) requestAnimationFrame(ensureSize);
  };
  ensureSize();

  const loader = new GLTFLoader();
  let model = null;
  let mixer = null;

  debug("AR: cargando GLB…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      debug("AR: GLB cargado");

      // 1) agregar modelo
      model = gltf.scene;
      scene.add(model);

      // 2) centrar el modelo en (0,0,0)
      {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
      }

      // 3) escala (ajusta targetHeight para más grande/chico)
      const targetHeight = 0.1; // <-- cambia: 2.2 más grande, 1.2 más chico
      {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = targetHeight / (size.y || 1);
        model.scale.setScalar(scale);
      }

      // 4) RE-centrar después de escalar (clave para que quede centrado)
      {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
      }

      // 5) encuadrar cámara para que el modelo quede centrado y visible
      {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const fov = THREE.MathUtils.degToRad(camera.fov);
        let distance = (maxDim / 2) / Math.tan(fov / 2);

        distance *= 5.0; // margen (sube a 1.3 si lo recorta, baja a 1.0 si lo quieres más grande)

        camera.position.set(0, 0, distance);
        camera.near = Math.max(0.01, distance / 100);
        camera.far  = distance * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
      }

      //model.position.y += 0.10; // sube
      model.position.y -= 0.004; // baja

      scene.remove(testCube);

      if (gltf.animations?.length) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        debug("AR: animación ON 🎬");
      }
    },
    undefined,
    (err) => {
      debug("AR: error cargando GLB");
      console.error("Error cargando GLB:", MODEL_URL, err);
    }
  );

  const clock = new THREE.Clock();

  function tick() {
    const dt = clock.getDelta();

    if (!model) testCube.rotation.y += dt * 1.2;

    if (mixer) mixer.update(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();

  window.ARPhoto = {
    canvas: renderer.domElement,
    resizeTo: resizeToCard,
    renderOnce: () => renderer.render(scene, camera)
  };
}