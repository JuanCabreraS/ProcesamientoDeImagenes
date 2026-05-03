import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = new URL("Futbolista.glb", import.meta.url).href;

const TEAM_LIST = [
  { id: "alemania", texture: "NewTextures/Alemania.png" },
  { id: "arabia_saudita", texture: "NewTextures/Saudi_Arabia.png" },
  { id: "argelia", texture: "NewTextures/Argelia.png" },
  { id: "argentina", texture: "NewTextures/Argentina.png" },
  { id: "australia", texture: "NewTextures/Australia.png" },
  { id: "belgica", texture: "NewTextures/Belgica.png" },
  { id: "brasil", texture: "NewTextures/Brasil.png" },
  { id: "canada", texture: "NewTextures/Canada.png" },
  { id: "catar", texture: "NewTextures/Catar.png" },
  { id: "colombia", texture: "NewTextures/Colombia.png" },
  { id: "costa_de_marfil", texture: "NewTextures/Costa_de_Marfil.png" },
  { id: "croacia", texture: "NewTextures/Croacia.png" },
  { id: "curacao", texture: "NewTextures/Curazao.png" },
  { id: "ecuador", texture: "NewTextures/Ecuador.png" },
  { id: "estados_unidos", texture: "NewTextures/EEUU.png" },
  { id: "egipto", texture: "NewTextures/Egipto.png" },
  { id: "escocia", texture: "NewTextures/Escocia.png" },
  { id: "espana", texture: "NewTextures/España.png" },
  { id: "francia", texture: "NewTextures/Francia.png" },
  { id: "ghana", texture: "NewTextures/Ghana.png" },
  { id: "haiti", texture: "NewTextures/Haiti.png" },
  { id: "inglaterra", texture: "NewTextures/Inglaterra.png" },
  { id: "iran", texture: "NewTextures/Iran.png" },
  { id: "islas_del_cabo_verde", texture: "NewTextures/Islas_del_Cabo_Verde.png" },
  { id: "japon", texture: "NewTextures/Japon.png" },
  { id: "jordania", texture: "NewTextures/Jordania.png" },
  { id: "korea", texture: "NewTextures/Corea.png" },
  { id: "marruecos", texture: "NewTextures/Marruecos.png" },
  { id: "mexico", texture: "NewTextures/Mexico.png" },
  { id: "noruega", texture: "NewTextures/Noruega.png" },
  { id: "nueva_zelanda", texture: "NewTextures/Nueva_Zelanda.png" },
  { id: "paises_bajos", texture: "NewTextures/Paises_Bajos.png" },
  { id: "panama", texture: "NewTextures/Panama.png" },
  { id: "paraguay", texture: "NewTextures/Paraguay.png" },
  { id: "portugal", texture: "NewTextures/Portugal.png" },
  { id: "senegal", texture: "NewTextures/Senegal.png" },
  { id: "sudafrica", texture: "NewTextures/Sudafrica.png" },
  { id: "suiza", texture: "NewTextures/Suiza.png" },
  { id: "tunez", texture: "NewTextures/Tunez.png" },
  { id: "uruguay", texture: "NewTextures/Uruguay.png" },
  { id: "uzbekistan", texture: "NewTextures/Uzbekistan.png" }
];

if (TEAM_LIST.length !== 41) {
  console.warn("AR.js: TEAM_LIST debe tener 41 equipos según la lista actual.");
}

const PHOTO_TEAM_TEXTURES = Object.fromEntries(
  TEAM_LIST.map((team) => [team.id, new URL(team.texture, import.meta.url).href])
);

const teamTextureCache = new Map();

let modelSceneRef = null;
let currentTeamId = sessionStorage.getItem("selectedTeamId") || "mexico";
let pendingTeamId = currentTeamId;

function getMaterialList(material) {
  return Array.isArray(material) ? material : [material];
}

function shouldReplaceMaterial(material) {
  const name = (material?.name || "").toLowerCase();
  return (
    name.includes("outfit_top") ||
    name.includes("outfit_bottom") ||
    name.includes("outfit_shoes")
  );
}

function loadTeamTexture(teamId) {
  const textureUrl = PHOTO_TEAM_TEXTURES[teamId];
  if (!textureUrl) return null;

  if (teamTextureCache.has(teamId)) {
    return teamTextureCache.get(teamId);
  }

  const texture = new THREE.TextureLoader().load(textureUrl);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  teamTextureCache.set(teamId, texture);
  return texture;
}

function applyTeamTextureToModel(object3D, teamId) {
  if (!object3D) return;

  const texture = loadTeamTexture(teamId);
  if (!texture) {
    console.warn("No encontré textura para teamId:", teamId);
    return;
  }

  object3D.traverse((node) => {
    if (!node.isMesh || !node.material) return;

    const materialList = getMaterialList(node.material);
    const nextMaterials = materialList.map((mat) => {
      if (!mat) return mat;
      if (!shouldReplaceMaterial(mat)) return mat;

      const clone = mat.clone();
      clone.map = texture;
      clone.needsUpdate = true;
      return clone;
    });

    node.material = Array.isArray(node.material) ? nextMaterials : nextMaterials[0];
  });

  currentTeamId = teamId;
}

function applyPendingTeamTexture() {
  if (!modelSceneRef) return;
  applyTeamTextureToModel(modelSceneRef, pendingTeamId || currentTeamId || "mexico");
}

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

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const hemi = new THREE.HemisphereLight(0xffffff, 0x607089, 0.95);
  hemi.position.set(0, 5, 0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(3, 5, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce8ff, 0.45);
  fill.position.set(-3, 2.5, 3);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const modelRoot = new THREE.Group();
  world.add(modelRoot);

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

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.3),
    new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.95
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.01, 0);
  world.add(shadowPlane);

  const loader = new GLTFLoader();
  const clock = new THREE.Clock();

  let mixer = null;
  let actions = [];
  let defaultAction = null;
  let activeEmote = "";
  let emoteEndAt = 0;
  let modelReady = false;

  let isPortrait = true;
  let currentFacing = "environment";

  let finalWidth = 1.0;
  let finalHeight = 1.8;
  let finalDepth = 0.6;
  let baseShadowX = 1.2;
  let baseShadowY = 1.0;

  const restPose = new THREE.Vector3(0, 0, 0);

  function getViewConfig() {
    if (currentFacing === "user") {
      return {
        x: isPortrait ? 0.58 : 0.72,
        y: isPortrait ? -2.55 : -1.12,
        scale: isPortrait ? 0.90 : 0.86,
        distanceFactor: isPortrait ? 2.20 : 2.30,
        distanceOffset: isPortrait ? 1.55 : 1.70,
        lookOffsetX: isPortrait ? -0.08 : -0.06
      };
    }

    return {
      x: 0,
      y: isPortrait ? -1.92 : -0.78,
      scale: isPortrait ? 0.50 : 0.46,
      distanceFactor: isPortrait ? 3.20 : 3.35,
      distanceOffset: isPortrait ? 2.95 : 3.15,
      lookOffsetX: 0
    };
  }

  function updateViewPose() {
    const cfg = getViewConfig();

    restPose.set(cfg.x, cfg.y, 0);
    world.position.copy(restPose);

    const scaledW = finalWidth * cfg.scale;
    const scaledH = finalHeight * cfg.scale;
    const scaledD = finalDepth * cfg.scale;
    const maxDim = Math.max(scaledW, scaledH, scaledD);

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = ((maxDim / 2) / Math.tan(fov / 2)) * cfg.distanceFactor;

    camera.position.set(
      cfg.x,
      scaledH * (currentFacing === "user" ? 0.62 : 0.55),
      dist + cfg.distanceOffset
    );

    camera.lookAt(
      cfg.x + cfg.lookOffsetX,
      scaledH * (currentFacing === "user" ? 0.50 : 0.46),
      0
    );

    camera.updateProjectionMatrix();

    shadowPlane.position.x = cfg.x;
    shadowPlane.scale.set(
      baseShadowX * cfg.scale,
      baseShadowY * cfg.scale,
      1
    );
  }

  function resizeTo() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);

    camera.aspect = rect.width / rect.height;
    isPortrait = rect.height >= rect.width;

    updateViewPose();
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

    baseShadowX = Math.max(1.1, finalWidth * 1.08);
    baseShadowY = Math.max(1.0, finalDepth * 3.0);

    updateViewPose();
  }

  function buildActions(clips, root) {
    if (!clips?.length) return;

    mixer = new THREE.AnimationMixer(root);
    actions = clips.map((clip) => ({
      name: (clip.name || "").toLowerCase(),
      action: mixer.clipAction(clip)
    }));

    defaultAction = null;
  }

  function findActionByClipName(clipName) {
    const key = (clipName || "").toLowerCase();
    const found = actions.find((a) => a.name === key || a.name.includes(key));
    return found?.action || null;
  }

  function stopAllActions() {
    if (!actions.length) return;

    actions.forEach(({ action }) => {
      action.stop();
      action.reset();
      action.enabled = false;
    });
  }

  function returnToStaticPose() {
    activeEmote = "";
    emoteEndAt = 0;

    stopAllActions();

    world.position.copy(restPose);
    modelRoot.rotation.set(0, 0, 0);
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
    return findActionByClipName(label);
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
      modelSceneRef = model;

      applyPendingTeamTexture();

      fitModelToView(model);
      buildActions(gltf.animations || [], model);

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

    if (mixer) {
      mixer.update(dt);
    }

    if (modelReady && emoteEndAt > 0 && performance.now() >= emoteEndAt) {
      returnToStaticPose();
    }

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
    setTeam(teamId) {
      pendingTeamId = teamId || "mexico";
      applyPendingTeamTexture();
    },
    setFacingMode(mode) {
      currentFacing = mode === "user" ? "user" : "environment";
      updateViewPose();

      if (currentFacing === "user") {
        setStatus("Jugador listo · selfie");
      } else {
        setStatus("Jugador listo · cámara trasera");
      }
    },
    playEmote(clipName) {
      activeEmote = clipName || "";

      const action = findActionByClipName(clipName || "");
      if (!action) return;

      stopAllActions();

      const durationMs = Math.max(
        1200,
        Math.round(((action.getClip?.().duration || 1.5) * 1000) + 100)
      );

      emoteEndAt = performance.now() + durationMs;
      playAction(action, true);
    },
    resetEmote() {
      returnToStaticPose();
    }
  };
}