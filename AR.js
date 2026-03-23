import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "./Futbolista.glb";

const canvas = document.getElementById("arCanvas");
const stage = document.querySelector(".ar-stage");
const statusEl = document.getElementById("photoStatus");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

if (!canvas || !stage) {
  console.warn("AR.js: No se encontró .ar-stage o #arCanvas");
} else {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.6, 8.6);
  camera.lookAt(0, 1.5, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.55));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x52607a, 1.15);
  hemi.position.set(0, 8, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3.6, 7.2, 4.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 25;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd8ebff, 0.45);
  fill.position.set(-4, 3.5, 4);
  scene.add(fill);

  const anchor = new THREE.Group();
  scene.add(anchor);

  const modelRoot = new THREE.Group();
  anchor.add(modelRoot);

  function createShadowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;

    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,0.42)");
    g.addColorStop(0.55, "rgba(0,0,0,0.20)");
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.55),
    new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.9
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  shadowPlane.renderOrder = 0;
  anchor.add(shadowPlane);

  let mixer = null;
  let actions = [];
  let activeAction = null;
  let activeEmote = "";
  let emoteEndAt = 0;
  let modelReady = false;
  const clock = new THREE.Clock();

  function resizeTo() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();

    const portrait = rect.height >= rect.width;
    anchor.position.set(portrait ? 1.35 : 1.8, portrait ? -2.2 : -1.95, 0);
    shadowPlane.scale.setScalar(portrait ? 1 : 1.15);

    return true;
  }

  function stopAllActions() {
    actions.forEach((action) => {
      action.stop();
      action.enabled = false;
    });
    activeAction = null;
  }

  function findActionByHint(hints) {
    const lowered = hints.map((hint) => hint.toLowerCase());
    return actions.find((action) => {
      const name = (action.getClip().name || "").toLowerCase();
      return lowered.some((hint) => name.includes(hint));
    }) || null;
  }

  function playClipForEmote(label) {
    if (!mixer || actions.length === 0) return false;

    let action = null;

    if (label === "Celebración") {
      action = findActionByHint(["cele", "vict", "goal", "dance", "win"]);
    } else if (label === "Sonrisa") {
      action = findActionByHint(["idle", "pose", "breath"]);
    } else if (label === "Energía") {
      action = findActionByHint(["run", "power", "jump", "kick"]);
    } else if (label === "Corazón") {
      action = findActionByHint(["pose", "idle"]);
    }

    if (!action) {
      action = actions[0] || null;
    }

    if (!action) return false;

    if (activeAction && activeAction !== action) {
      activeAction.fadeOut(0.18);
    }

    action.reset();
    action.enabled = true;
    action.fadeIn(0.18);
    action.play();
    activeAction = action;
    return true;
  }

  const loader = new GLTFLoader();
  setStatus("Cargando jugador…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;
      modelRoot.add(model);

      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          if (node.material) {
            node.material.depthWrite = true;
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const currentHeight = Math.max(fittedSize.y, 0.001);
      const targetHeight = 4.2;
      const scale = targetHeight / currentHeight;
      model.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());

      shadowPlane.scale.set(scaledSize.x * 0.50, Math.max(1, scaledSize.z * 0.52), 1);

      mixer = gltf.animations?.length ? new THREE.AnimationMixer(model) : null;
      actions = mixer ? gltf.animations.map((clip) => mixer.clipAction(clip)) : [];
      playClipForEmote("Sonrisa");

      modelReady = true;
      setStatus("Jugador listo");
      setTimeout(() => {
        if (statusEl && statusEl.textContent === "Jugador listo") {
          statusEl.textContent = "Listo para la foto";
        }
      }, 1200);
    },
    () => {
      setStatus("Cargando jugador…");
    },
    (error) => {
      console.error("Error cargando Futbolista.glb", error);
      setStatus("No se pudo cargar el jugador");
    }
  );

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => resizeTo()).observe(stage);
  } else {
    window.addEventListener("resize", resizeTo);
  }
  resizeTo();

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (mixer) {
      mixer.update(dt);
    }

    if (modelReady) {
      const baseX = anchor.position.x;
      const baseY = anchor.position.y;
      const bob = Math.sin(t * 1.65) * 0.06;

      anchor.position.x = baseX;
      anchor.position.y = baseY + bob;

      modelRoot.rotation.set(0, Math.sin(t * 0.45) * 0.08, 0);
      modelRoot.position.set(0, 0, 0);
      modelRoot.scale.set(1, 1, 1);

      if (performance.now() < emoteEndAt) {
        if (activeEmote === "Celebración") {
          anchor.position.y = baseY + Math.abs(Math.sin(t * 4.0)) * 0.34;
          modelRoot.rotation.z = Math.sin(t * 4.0) * 0.08;
          modelRoot.rotation.y += Math.sin(t * 3.0) * 0.22;
        } else if (activeEmote === "Sonrisa") {
          modelRoot.rotation.y += Math.sin(t * 2.4) * 0.18;
        } else if (activeEmote === "Energía") {
          const pulse = 1 + Math.sin(t * 7.5) * 0.05;
          modelRoot.scale.setScalar(pulse);
          modelRoot.rotation.y += Math.sin(t * 5.0) * 0.16;
        } else if (activeEmote === "Corazón") {
          modelRoot.rotation.y += Math.sin(t * 2.2) * 0.28;
          modelRoot.rotation.z = Math.sin(t * 2.2) * 0.06;
        }
      } else {
        activeEmote = "";
      }
    }

    renderer.render(scene, camera);
  }

  animate();

  window.ARPhoto = {
    resizeTo,
    renderOnce() {
      resizeTo();
      renderer.render(scene, camera);
    },
    playEmote(label) {
      activeEmote = label || "";
      emoteEndAt = performance.now() + 1800;
      playClipForEmote(label || "");
    },
    resetEmote() {
      activeEmote = "";
      emoteEndAt = 0;
      stopAllActions();
      playClipForEmote("Sonrisa");
    }
  };
}
