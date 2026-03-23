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
  console.warn("AR.js: no encontré #arCanvas o .ar-stage");
} else {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x607089, 0.9);
  hemi.position.set(0, 5, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(3, 5, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce8ff, 0.35);
  fill.position.set(-3, 2.5, 3);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const modelRoot = new THREE.Group();
  world.add(modelRoot);

  const testBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshNormalMaterial()
  );

  // Lo ponemos al centro del cuadro, un poco arriba del suelo
  testBox.position.set(0.36, 1.0, 0);
  scene.add(testBox);

  function createShadowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 18, size / 2, size / 2, size / 2);

    g.addColorStop(0, "rgba(0,0,0,0.34)");
    g.addColorStop(0.55, "rgba(0,0,0,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(c);
  }

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.2),
    new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.95
    })
  );

  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.015, 0);
  world.add(shadowPlane);

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();

  let mixer = null;
  let actions = [];
  let defaultAction = null;
  let activeEmote = "";
  let emoteEndAt = 0;
  let modelReady = false;
  let finalHeight = 1.8;
  let finalWidth = 1.0;
  let finalDepth = 0.6;
  let isPortrait = true;

  const restPose = new THREE.Vector3(0.38, -0.90, 0);

  function resizeTo() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    isPortrait = rect.height >= rect.width;

    restPose.set(isPortrait ? 0.36 : 0.70, isPortrait ? -0.88 : -0.74, 0);
    world.position.copy(restPose);

    const maxDim = Math.max(finalWidth, finalHeight, finalDepth);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = ((maxDim / 2) / Math.tan(fov / 2)) * 1.65;

    camera.position.set(restPose.x, finalHeight * 0.58, dist + 0.8);
    camera.lookAt(restPose.x, finalHeight * 0.48, 0);
    camera.updateProjectionMatrix();

    return true;
  }

  function fitModelToView(object3D) {
    object3D.position.set(0, 0, 0);
    object3D.rotation.set(0, 0, 0);
    object3D.scale.setScalar(1);

    let box = new THREE.Box3().setFromObject(object3D);
    const center = box.getCenter(new THREE.Vector3());

    object3D.position.x -= center.x;
    object3D.position.z -= center.z;
    object3D.position.y -= box.min.y;

    box = new THREE.Box3().setFromObject(object3D);
    const size = box.getSize(new THREE.Vector3());

    const targetHeight = 1.85;
    const scale = targetHeight / Math.max(size.y, 0.001);
    object3D.scale.setScalar(scale);

    box = new THREE.Box3().setFromObject(object3D);
    const center2 = box.getCenter(new THREE.Vector3());

    object3D.position.x -= center2.x;
    object3D.position.z -= center2.z;
    object3D.position.y -= box.min.y;

    box = new THREE.Box3().setFromObject(object3D);
    const finalSize = box.getSize(new THREE.Vector3());

    finalWidth = finalSize.x;
    finalHeight = finalSize.y;
    finalDepth = finalSize.z;

    shadowPlane.scale.set(
      Math.max(1.05, finalWidth * 1.08),
      Math.max(1.0, finalDepth * 3.0),
      1
    );
  }

  function buildActions(clips, root) {
    if (!clips?.length) return;

    mixer = new THREE.AnimationMixer(root);
    actions = clips.map((clip) => ({
      name: (clip.name || "").toLowerCase(),
      action: mixer.clipAction(clip)
    }));

    const idle =
      actions.find((a) => a.name.includes("idle")) ||
      actions.find((a) => a.name.includes("pose")) ||
      actions[0] ||
      null;

    defaultAction = idle?.action || null;

    if (defaultAction) {
      defaultAction.reset();
      defaultAction.enabled = true;
      defaultAction.setLoop(THREE.LoopRepeat, Infinity);
      defaultAction.fadeIn(0.2);
      defaultAction.play();
    }
  }

  function playAction(nextAction, once = false) {
    if (!nextAction) return;

    actions.forEach(({ action }) => {
      if (action !== nextAction) action.fadeOut(0.18);
    });

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    if (once) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    nextAction.fadeIn(0.18);
    nextAction.play();
  }

  function findActionByLabel(label) {
    const key = (label || "").toLowerCase();

    let found = actions.find((a) => a.name.includes(key));

    if (!found && key.includes("cele")) {
      found = actions.find((a) =>
        a.name.includes("cele") ||
        a.name.includes("vict") ||
        a.name.includes("goal") ||
        a.name.includes("dance") ||
        a.name.includes("win")
      );
    }

    if (!found && key.includes("sonr")) {
      found = actions.find((a) =>
        a.name.includes("idle") ||
        a.name.includes("pose") ||
        a.name.includes("smile")
      );
    }

    if (!found && key.includes("energ")) {
      found = actions.find((a) =>
        a.name.includes("run") ||
        a.name.includes("jump") ||
        a.name.includes("kick") ||
        a.name.includes("power")
      );
    }

    if (!found && key.includes("cor")) {
      found = actions.find((a) =>
        a.name.includes("pose") ||
        a.name.includes("idle") ||
        a.name.includes("heart")
      );
    }

    return found?.action || defaultAction || null;
  }

  setStatus("Cargando jugador…");

  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((node) => {
        if (node.isMesh) {
          node.frustumCulled = false;
          if (node.material) node.material.needsUpdate = true;
        }
      });

      modelRoot.add(model);
      fitModelToView(model);
      buildActions(gltf.animations || [], model);
      resizeTo();

      modelReady = true;
      setStatus("Jugador listo");
      console.log("GLB cargado", gltf);
      console.log("Animaciones:", (gltf.animations || []).map((a) => a.name));
    },
    undefined,
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

    if (mixer) mixer.update(dt);

    const baseX = isPortrait ? 0.36 : 0.70;
    const baseY = isPortrait ? -0.88 : -0.74;
    const bob = Math.sin(t * 1.65) * 0.025;

    world.position.set(baseX, baseY + bob, 0);

    if (modelReady) {
      modelRoot.rotation.set(0, Math.sin(t * 0.65) * 0.05, 0);

      if (performance.now() < emoteEndAt) {
        if (activeEmote === "Celebración") {
          world.position.y = baseY + Math.abs(Math.sin(t * 3.8)) * 0.10;
        } else if (activeEmote === "Sonrisa") {
          modelRoot.rotation.y = Math.sin(t * 2.3) * 0.12;
        } else if (activeEmote === "Energía") {
          const pulse = 1 + Math.sin(t * 7.2) * 0.035;
          modelRoot.scale.setScalar(pulse);
        } else if (activeEmote === "Corazón") {
          modelRoot.rotation.y = Math.sin(t * 2.0) * 0.12;
          modelRoot.rotation.z = Math.sin(t * 2.0) * 0.03;
        } else {
          modelRoot.scale.set(1, 1, 1);
          modelRoot.rotation.z = 0;
        }
      } else {
        activeEmote = "";
        modelRoot.scale.set(1, 1, 1);
        modelRoot.rotation.z = 0;
      }
    }

    testBox.rotation.x += 0.01;
    testBox.rotation.y += 0.02;

    renderer.render(scene, camera);
  }

  animate();

  window.ARPhoto = {
    canvas: renderer.domElement,
    resizeTo,
    renderOnce() {
      resizeTo();
      renderer.render(scene, camera);
    },
    playEmote(label) {
      activeEmote = label || "";
      emoteEndAt = performance.now() + 1800;

      const action = findActionByLabel(label || "");
      if (action) {
        playAction(action, action !== defaultAction);
      }
    },
    resetEmote() {
      activeEmote = "";
      emoteEndAt = 0;
      modelRoot.scale.set(1, 1, 1);
      modelRoot.rotation.set(0, 0, 0);

      if (defaultAction) {
        playAction(defaultAction, false);
      }
    }
  };
}