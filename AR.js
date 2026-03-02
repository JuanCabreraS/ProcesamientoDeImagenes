import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");

if (!canvas || !card) {
  console.warn("AR.js: No se encontró #arCanvas o .player-card");
} else {
  canvas.style.outline = "2px solid rgba(0,255,255,0.6)";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 3, 2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-2, 2, 1);
  scene.add(fill);

  function resizeToCard() {
    const rect = card.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(() => resizeToCard()).observe(card);
  requestAnimationFrame(() => resizeToCard());

  const loader = new GLTFLoader();

  let model = null;
  let mixer = null;

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      model.position.sub(center);

      const targetHeight = 1.6;
      const scale = targetHeight / (size.y || 1);
      model.scale.setScalar(scale);

      const box2 = new THREE.Box3().setFromObject(model);
      const size2 = new THREE.Vector3();
      box2.getSize(size2);

      camera.position.set(0, 0, Math.max(2.2, size2.length() * 1.1));
      camera.lookAt(0, 0, 0);

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        console.log("🎬 Animación:", gltf.animations[0].name || "(sin nombre)");
      }

      console.log("✅ GLB cargado:", MODEL_URL);
    },
    undefined,
    (err) => console.error("❌ Error cargando GLB:", MODEL_URL, err)
  );

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
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