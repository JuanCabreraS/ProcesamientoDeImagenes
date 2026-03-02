import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const card = canvas?.closest(".player-card");

if (canvas && card) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.4, 3.0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 3, 2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-2, 2, 1);
  scene.add(fill);

  const loader = new GLTFLoader();
  let model = null;

  loader.load(MODEL_URL,(gltf) => {
      model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - center.y);
      model.position.z += (model.position.z - center.z);

      const targetHeight = 1.6;
      const scale = targetHeight / (size.y || 1);
      model.scale.setScalar(scale);

      const box2 = new THREE.Box3().setFromObject(model);
      const size2 = new THREE.Vector3();
      box2.getSize(size2);

      camera.position.set(0, 0, Math.max(2.2, size2.length() * 1.1));
      camera.lookAt(0, 0, 0);

      console.log("✅ GLB cargado:", MODEL_URL);
    },
    undefined,
    (err) => console.error("❌ Error cargando GLB:", MODEL_URL, err)
  );

  function resizeToCard() {
    const rect = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resizeToCard();
  window.addEventListener("resize", resizeToCard);

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    if (model) model.rotation.y += dt * 0.25;
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