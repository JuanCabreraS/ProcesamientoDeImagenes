function setupHomeButtons() {
  document.querySelectorAll("[data-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = encodeURI("index.html");
    });
  });
}

let confettiStylesInjected = false;

function ensureConfettiStyles() {
  if (confettiStylesInjected) return;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fifaConfettiFall {
      0% {
        transform: translate3d(0, -12px, 0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translate3d(var(--drift, 0px), 105vh, 0) rotate(720deg);
        opacity: 0;
      }
    }

    .fifa-confetti-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 2147483647;
    }

    .fifa-confetti-piece {
      position: absolute;
      top: -16px;
      width: 10px;
      height: 16px;
      border-radius: 2px;
      animation-name: fifaConfettiFall;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
  confettiStylesInjected = true;
}

function launchConfetti(count = 36) {
  ensureConfettiStyles();

  const layer = document.createElement("div");
  layer.className = "fifa-confetti-layer";

  const colors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ffffff", "#fde047"];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "fifa-confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.opacity = "1";
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.18}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;

    if (Math.random() > 0.5) {
      piece.style.width = "8px";
      piece.style.height = "8px";
      piece.style.borderRadius = "999px";
    }

    layer.appendChild(piece);
  }

  document.body.appendChild(layer);

  setTimeout(() => {
    layer.remove();
  }, 3200);
}

let TRIVIA_PLAYERS = [];
let TRIVIA_PLAYERS_BY_TEAM = {};
let triviaLoadPromise = null;

let PLAYER_PROFILES = {};

const PLAYER_PROFILE_OVERRIDES = {
  lionel_messi: {
    jersey: 10,
    rating: 95,
    meta: "Argentina • Delantero"
  },
  kylian_mbappe: {
    jersey: 10,
    rating: 92,
    meta: "Francia • Delantero"
  },
  achraf_hakimi: {
    jersey: 2,
    rating: 86,
    meta: "Marruecos • Lateral derecho"
  },
  erling_haaland: {
    jersey: 9,
    rating: 92,
    meta: "Noruega • Delantero"
  },
  mohamed_salah: {
    jersey: 10,
    rating: 91,
    meta: "Egipto • Delantero"
  },
  joshua_kimmich: {
    jersey: 6,
    rating: 89,
    meta: "Alemania • Mediocampista"
  },
  kevin_de_bruyne: {
    jersey: 7,
    rating: 91,
    meta: "Bélgica • Mediocampista"
  },
  luka_modric: {
    jersey: 10,
    rating: 89,
    meta: "Croacia • Mediocampista"
  },
  cristiano_ronaldo: {
    jersey: 7,
    rating: 90,
    meta: "Portugal • Delantero"
  },
  bruno_miguel_borges_fernandes: {
    jersey: 8,
    rating: 88,
    meta: "Portugal • Mediocampista"
  },
  christian_pulisic: {
    jersey: 10,
    rating: 85,
    meta: "Estados Unidos • Extremo"
  },
  guillermo_ochoa: {
    jersey: 13,
    rating: 82,
    meta: "México • Portero"
  },
  emiliano_martinez: {
    jersey: 23,
    rating: 86,
    meta: "Argentina • Portero"
  },
  moises_caicedo: {
    jersey: 23,
    rating: 86,
    meta: "Ecuador • Mediocampista"
  },
  jude_bellingham: {
    jersey: 10,
    rating: 90,
    meta: "Inglaterra • Mediocampista"
  },
  vinicius_junior: {
    jersey: 7,
    rating: 89,
    meta: "Brasil • Extremo"
  },
  luis_diaz: {
    jersey: 7,
    rating: 86,
    meta: "Colombia • Extremo"
  },
  federico_valverde: {
    jersey: 15,
    rating: 88,
    meta: "Uruguay • Mediocampista"
  },
  son_heung_min: {
    jersey: 7,
    rating: 89,
    meta: "Corea • Delantero"
  },
  alphonso_davies: {
    jersey: 19,
    rating: 85,
    meta: "Canadá • Lateral izquierdo"
  }
};

function hashName(name = "") {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function inferPositionFromQuestionText(text = "") {
  const t = text.toLowerCase();

  if (t.includes("portero")) return "Portero";
  if (t.includes("lateral izquierdo")) return "Lateral izquierdo";
  if (t.includes("lateral derecho")) return "Lateral derecho";
  if (t.includes("defensa central")) return "Defensa central";
  if (t.includes("defensor")) return "Defensa";
  if (t.includes("extremo")) return "Extremo";
  if (t.includes("mediocampista")) return "Mediocampista";
  if (t.includes("delantero")) return "Delantero";
  if (t.includes("goleador")) return "Delantero";

  return "Jugador";
}

function defaultRatingForPosition(position) {
  switch (position) {
    case "Portero":
      return 82;
    case "Defensa central":
    case "Defensa":
      return 81;
    case "Lateral izquierdo":
    case "Lateral derecho":
      return 82;
    case "Mediocampista":
      return 84;
    case "Extremo":
      return 84;
    case "Delantero":
      return 85;
    default:
      return 80;
  }
}

function inferJersey(playerId, position) {
  const known = {
    jonathan_david: 20,
    christian_pulisic: 10,
    tim_ream: 13,
    carlos_acevedo: 1,
    florian_wirtz: 17,
    riyad_mahrez: 7,
    ismael_bennacer: 22,
    jordan_bos: 3,
    david_alaba: 8,
    jeremy_doku: 22,
    akram_afif: 11,
    james_rodriguez: 10,
    luka_modric: 10,
    mohamed_salah: 10,
    andrew_robertson: 3,
    pedri: 8,
    michael_olise: 11,
    inaki_williams: 9,
    kaoru_mitoma: 7,
    achraf_hakimi: 2,
    erling_haaland: 9,
    virgil_van_dijk: 4,
    cristiano_ronaldo: 7,
    sadio_mane: 10,
    granit_xhaka: 10,
    breel_embolo: 7,
    arda_guler: 8,
    eldor_shomurodov: 14
  };

  if (known[playerId]) return known[playerId];

  if (position === "Portero") return 1;
  if (position.includes("Lateral")) return 2;
  if (position.includes("Defensa")) return 4;
  if (position === "Mediocampista") return 8;
  if (position === "Extremo") return 11;
  if (position === "Delantero") return 9;

  return "--";
}

function buildStatsForPlayer(playerId, position, rating, name) {
  const seed = hashName(playerId + name);
  const matches = 140 + (seed % 420);
  const trophies = 1 + (seed % 18);

  let goals = 0;
  let assists = 0;

  if (position === "Portero") {
    goals = seed % 2;
    assists = seed % 6;
  } else if (position.includes("Defensa")) {
    goals = 5 + (seed % 18);
    assists = 8 + (seed % 20);
  } else if (position.includes("Lateral")) {
    goals = 8 + (seed % 16);
    assists = 18 + (seed % 26);
  } else if (position === "Mediocampista") {
    goals = 18 + (seed % 40);
    assists = 20 + (seed % 45);
  } else if (position === "Extremo") {
    goals = 35 + (seed % 70);
    assists = 22 + (seed % 50);
  } else if (position === "Delantero") {
    goals = 55 + (seed % 180);
    assists = 15 + (seed % 45);
  } else {
    goals = 10 + (seed % 30);
    assists = 8 + (seed % 25);
  }

  return {
    goals,
    assists,
    matches,
    trophies
  };
}

function buildFactsForPlayer(player, teamLabel, position) {
  return [
    `${player.name} representa a ${teamLabel} en el mundial.`,
    `Su posicion es ${position.toLowerCase()}.`,
    `El escudo de ${teamLabel} representa su equipo y nacionalidad.`
  ];
}

function buildAutoPlayerProfile(player) {
  const teamLabel = TEAM_CONFIG[player.teamId]?.label || player.meta || "Selección";
  const firstQuestionText = player.questions?.[0]?.text || "";
  const position = inferPositionFromQuestionText(firstQuestionText);
  const rating = defaultRatingForPosition(position);
  const jersey = inferJersey(player.id, position);

  return {
    jersey,
    meta: `${teamLabel} • ${position}`,
    rating,
    stats: buildStatsForPlayer(player.id, position, rating, player.name),
    facts: buildFactsForPlayer(player, teamLabel, position)
  };
}

function rebuildPlayerProfiles() {
  PLAYER_PROFILES = Object.fromEntries(
    TRIVIA_PLAYERS.map((player) => {
      const autoProfile = buildAutoPlayerProfile(player);
      const override = PLAYER_PROFILE_OVERRIDES[player.id] || {};

      return [
        player.id,
        {
          ...autoProfile,
          ...override,
          stats: override.stats || autoProfile.stats,
          facts: override.facts || autoProfile.facts
        }
      ];
    })
  );
}

function saveSelectedTriviaPlayer(player) {
  sessionStorage.setItem("selectedTriviaPlayer", JSON.stringify(player));
}

function readSelectedTriviaPlayer() {
  const raw = sessionStorage.getItem("selectedTriviaPlayer");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("No se pudo leer selectedTriviaPlayer:", error);
    return null;
  }
}

function clearTriviaResult() {
  sessionStorage.removeItem("triviaResult");
}

const TEAM_LIST = [
  { id: "alemania", label: "Alemania", texture: "NewTextures/Alemania.png" },
  { id: "arabia_saudita", label: "Arabia Saudita", texture: "NewTextures/Saudi_Arabia.png" },
  { id: "argelia", label: "Argelia", texture: "NewTextures/Argelia.png" },
  { id: "argentina", label: "Argentina", texture: "NewTextures/Argentina.png" },
  { id: "australia", label: "Australia", texture: "NewTextures/Australia.png" },
  { id: "belgica", label: "Bélgica", texture: "NewTextures/Belgica.png" },
  { id: "brasil", label: "Brasil", texture: "NewTextures/Brasil.png" },
  { id: "canada", label: "Canadá", texture: "NewTextures/Canada.png" },
  { id: "catar", label: "Catar", texture: "NewTextures/Catar.png" },
  { id: "colombia", label: "Colombia", texture: "NewTextures/Colombia.png" },
  { id: "costa_de_marfil", label: "Costa de Marfil", texture: "NewTextures/Costa_de_Marfil.png" },
  { id: "croacia", label: "Croacia", texture: "NewTextures/Croacia.png" },
  { id: "curacao", label: "Curacao", texture: "NewTextures/Curazao.png" },
  { id: "ecuador", label: "Ecuador", texture: "NewTextures/Ecuador.png" },
  { id: "estados_unidos", label: "Estados Unidos", texture: "NewTextures/EEUU.png" },
  { id: "egipto", label: "Egipto", texture: "NewTextures/Egipto.png" },
  { id: "escocia", label: "Escocia", texture: "NewTextures/Escocia.png" },
  { id: "espana", label: "España", texture: "NewTextures/España.png" },
  { id: "francia", label: "Francia", texture: "NewTextures/Francia.png" },
  { id: "ghana", label: "Ghana", texture: "NewTextures/Ghana.png" },
  { id: "haiti", label: "Haití", texture: "NewTextures/Haiti.png" },
  { id: "inglaterra", label: "Inglaterra", texture: "NewTextures/Inglaterra.png" },
  { id: "iran", label: "Irán", texture: "NewTextures/Iran.png" },
  { id: "islas_del_cabo_verde", label: "Islas del Cabo Verde", texture: "NewTextures/Islas_del_Cabo_Verde.png" },
  { id: "japon", label: "Japón", texture: "NewTextures/Japon.png" },
  { id: "jordania", label: "Jordania", texture: "NewTextures/Jordania.png" },
  { id: "korea", label: "Korea", texture: "NewTextures/Corea.png" },
  { id: "marruecos", label: "Marruecos", texture: "NewTextures/Marruecos.png" },
  { id: "mexico", label: "México", texture: "NewTextures/Mexico.png" },
  { id: "noruega", label: "Noruega", texture: "NewTextures/Noruega.png" },
  { id: "nueva_zelanda", label: "Nueva Zelanda", texture: "NewTextures/Nueva_Zelanda.png" },
  { id: "paises_bajos", label: "Países Bajos", texture: "NewTextures/Paises_Bajos.png" },
  { id: "panama", label: "Panamá", texture: "NewTextures/Panama.png" },
  { id: "paraguay", label: "Paraguay", texture: "NewTextures/Paraguay.png" },
  { id: "portugal", label: "Portugal", texture: "NewTextures/Portugal.png" },
  { id: "senegal", label: "Senegal", texture: "NewTextures/Senegal.png" },
  { id: "sudafrica", label: "Sudáfrica", texture: "NewTextures/Sudafrica.png" },
  { id: "suiza", label: "Suiza", texture: "NewTextures/Suiza.png" },
  { id: "tunez", label: "Túnez", texture: "NewTextures/Tunez.png" },
  { id: "uruguay", label: "Uruguay", texture: "NewTextures/Uruguay.png" },
  { id: "uzbekistan", label: "Uzbekistan", texture: "NewTextures/Uzbekistan.png" }
];

if (TEAM_LIST.length !== 41) {
  console.warn("Camaras.js: TEAM_LIST debe tener 41 equipos según la lista actual.");
}

const TEAM_CONFIG = Object.fromEntries(
  TEAM_LIST.map((team, index) => [
    team.id,
    {
      ...team,
      targetIndex: index,
      defaultAnimation: "Victory"
    }
  ])
);

const TEAM_NAME_TO_ID = {
  "Canada": "canada",
  "EE. UU.": "estados_unidos",
  "México": "mexico",
  "Alemania": "alemania",
  "Arabia Saudí": "arabia_saudita",
  "Argelia": "argelia",
  "Argentina": "argentina",
  "Australia": "australia",
  "Bélgica": "belgica",
  "Brasil": "brasil",
  "Catar": "catar",
  "Colombia": "colombia",
  "Costa de Marfil": "costa_de_marfil",
  "Croacia": "croacia",
  "Curazao": "curacao",
  "Ecuador": "ecuador",
  "Egipto": "egipto",
  "Escocia": "escocia",
  "España": "espana",
  "Francia": "francia",
  "Ghana": "ghana",
  "Haití": "haiti",
  "Inglaterra": "inglaterra",
  "RI de Irán": "iran",
  "Islas de Cabo Verde": "islas_del_cabo_verde",
  "Japón": "japon",
  "Jordania": "jordania",
  "Marruecos": "marruecos",
  "Noruega": "noruega",
  "Nueva Zelanda": "nueva_zelanda",
  "Países Bajos": "paises_bajos",
  "Panamá": "panama",
  "Paraguay": "paraguay",
  "Portugal": "portugal",
  "República de Corea": "korea",
  "Senegal": "senegal",
  "Sudáfrica": "sudafrica",
  "Suiza": "suiza",
  "Túnez": "tunez",
  "Uruguay": "uruguay",
  "Uzbekistán": "uzbekistan"
};

function normalizePlayerId(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildSecondQuestion(playerName, teamId) {
  const correctLabel = TEAM_CONFIG[teamId]?.label || teamId;
  const allLabels = TEAM_LIST
    .map((team) => team.label)
    .filter((label) => label !== correctLabel);

  const seed = Array.from(playerName).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const distractors = [];
  let step = 0;

  while (distractors.length < 3 && step < allLabels.length * 2) {
    const candidate = allLabels[(seed + step * 7) % allLabels.length];
    if (!distractors.includes(candidate) && candidate !== correctLabel) {
      distractors.push(candidate);
    }
    step += 1;
  }

  const correctIndex = seed % 4;
  const options = [...distractors];
  options.splice(correctIndex, 0, correctLabel);

  return {
    text: `¿Qué selección representa ${playerName}?`,
    options,
    correctIndex
  };
}

function parseTriviaTxt(rawText) {
  const sections = rawText
    .split(/\n(?=\*)/)
    .map((section) => section.trim())
    .filter(Boolean);

  const players = [];

  sections.forEach((section) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const header = lines.shift();
    if (!header) return;

    const teamName = header.replace(/^\*/, "").replace(/:$/, "").trim();
    const teamId = TEAM_NAME_TO_ID[teamName];
    if (!teamId) return;

    let i = 0;

    while (i < lines.length) {
      const name = lines[i++];
      if (!name || name.startsWith("¿") || name.startsWith("Opciones")) continue;

      const text = lines[i++] || "";

      if (lines[i] === "Opciones:" || lines[i] === "Opciones") {
        i += 1;
      }

      const options = [];
      let correctIndex = 0;

      while (i < lines.length && /^[A-D]\)/.test(lines[i])) {
        const rawOption = lines[i++];
        const isCorrect = rawOption.includes("✅");

        const optionText = rawOption
          .replace(/^[A-D]\)\s*/, "")
          .replace("✅", "")
          .trim();

        options.push(optionText);

        if (isCorrect) {
          correctIndex = options.length - 1;
        }
      }

      players.push({
        id: normalizePlayerId(name),
        teamId,
        name,
        shortName: name,
        meta: TEAM_CONFIG[teamId]?.label || teamName,
        questions: [
          {
            text,
            options,
            correctIndex
          },
          buildSecondQuestion(name, teamId)
        ]
      });
    }
  });

  TRIVIA_PLAYERS = players;

  TRIVIA_PLAYERS_BY_TEAM = players.reduce((acc, player) => {
    if (!acc[player.teamId]) {
      acc[player.teamId] = [];
    }
    acc[player.teamId].push(player);
    return acc;
  }, {});

  rebuildPlayerProfiles();
}

async function ensureTriviaLoaded() {
  if (TRIVIA_PLAYERS.length) return;
  if (triviaLoadPromise) return triviaLoadPromise;

  triviaLoadPromise = fetch("PREGUNTAS.txt?v=2")
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar PREGUNTAS.txt");
      }
      return response.text();
    })
    .then((text) => {
      parseTriviaTxt(text);
    })
    .catch((error) => {
      console.error("Error cargando trivia:", error);
      TRIVIA_PLAYERS = [];
      TRIVIA_PLAYERS_BY_TEAM = {};
    });

  return triviaLoadPromise;
}

async function pickRandomTriviaPlayer() {
  await ensureTriviaLoaded();

  const randomIndex = Math.floor(Math.random() * TRIVIA_PLAYERS.length);
  const player = JSON.parse(JSON.stringify(TRIVIA_PLAYERS[randomIndex]));
  saveSelectedTriviaPlayer(player);
  return player;
}

async function pickTriviaPlayerForTeam(teamId) {
  await ensureTriviaLoaded();

  const pool = TRIVIA_PLAYERS_BY_TEAM[teamId] || [];
  if (!pool.length) {
    return pickRandomTriviaPlayer();
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const player = JSON.parse(JSON.stringify(pool[randomIndex]));
  saveSelectedTriviaPlayer(player);
  return player;
}

function buildFallbackProfile(currentPlayer) {
  const teamLabel =
    TEAM_CONFIG[currentPlayer.teamId]?.label ||
    currentPlayer.meta ||
    "Selección";

  return {
    jersey: "--",
    meta: `${teamLabel} • Jugador`,
    rating: 80,
    stats: {
      goals: 0,
      assists: 0,
      matches: 0,
      trophies: 0
    },
    facts: [
      `${currentPlayer.name} pertenece a la selección de ${teamLabel}.`,
      "Las curiosidades específicas de este jugador se pueden completar después.",
      "Las estadísticas detalladas de este jugador se pueden completar después."
    ]
  };
}

const arIndexTextureCache = new Map();

function saveSelectedTeam(teamId) {
  sessionStorage.setItem("selectedTeamId", teamId);
}

function readSelectedTeam() {
  return sessionStorage.getItem("selectedTeamId") || "mexico";
}

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

function loadIndexTeamTexture(teamId) {
  const cfg = TEAM_CONFIG[teamId];
  if (!cfg?.texture || !window.THREE) return null;

  if (arIndexTextureCache.has(teamId)) {
    return arIndexTextureCache.get(teamId);
  }

  const texture = new THREE.TextureLoader().load(cfg.texture);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  arIndexTextureCache.set(teamId, texture);
  return texture;
}

function applyTeamTextureToObject3D(object3D, teamId) {
  if (!object3D || !window.THREE) return;

  const texture = loadIndexTeamTexture(teamId);
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
}

function buildDynamicMindTargets() {
  const root = document.getElementById("dynamicTargets");
  if (!root) return;

  root.innerHTML = "";

  TEAM_LIST.forEach((team, index) => {
    const targetEl = document.createElement("a-entity");
    targetEl.setAttribute("mindar-image-target", `targetIndex: ${index}`);
    targetEl.dataset.teamId = team.id;

    const wrapEl = document.createElement("a-entity");
    wrapEl.setAttribute("position", "0 -0.18 0");
    wrapEl.setAttribute("rotation", "0 0 0");
    wrapEl.setAttribute("scale", "1 1 1");

    const modelEl = document.createElement("a-gltf-model");
    modelEl.setAttribute("src", "#modeloGLB");
    modelEl.setAttribute("team-model-controller", `teamId: ${team.id}`);
    modelEl.dataset.role = "team-model";

    wrapEl.appendChild(modelEl);
    targetEl.appendChild(wrapEl);
    root.appendChild(targetEl);
  });
}

if (window.AFRAME && !AFRAME.components["team-model-controller"]) {
  AFRAME.registerComponent("team-model-controller", {
    schema: {
      teamId: { type: "string", default: "mexico" }
    },

    init() {
      this.model = null;
      this.mixer = null;
      this.actions = [];
      this.activeAction = null;
      this.returnTimer = null;

      this.spinActive = false;
      this.spinElapsed = 0;
      this.spinDuration = 2200;
      this.spinFrom = 0;

      this.el.addEventListener("model-loaded", () => {
        this.model = this.el.getObject3D("mesh");
        if (!this.model) return;

        this.model.traverse((node) => {
          if (!node.isMesh) return;

          node.frustumCulled = false;
          node.visible = true;

          if (node.material) {
            node.material.needsUpdate = true;
          }
        });

        this.setupAnimations();
        this.setTeam(this.data.teamId);
        this.stopAllActions();
      });
    },

    tick(time, delta) {
      if (this.mixer) {
        this.mixer.update(delta / 1000);
      }

      if (this.spinActive && this.model) {
        this.spinElapsed += delta;

        const progress = Math.min(this.spinElapsed / this.spinDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        this.model.rotation.y = this.spinFrom + (Math.PI * 2 * eased);

        if (progress >= 1) {
          this.spinActive = false;
          this.spinElapsed = 0;
          this.model.rotation.y = 0;
        }
      }
    },

    setupAnimations() {
      if (!this.model) return;

      const animations = this.model.animations || [];
      if (!animations.length) return;

      this.mixer = new THREE.AnimationMixer(this.model);
      this.actions = animations.map((clip) => ({
        name: (clip.name || "").toLowerCase(),
        action: this.mixer.clipAction(clip)
      }));
    },

    findAction(keyword) {
      const key = (keyword || "").toLowerCase();
      const found = this.actions.find((item) =>
        item.name === key || item.name.includes(key)
      );
      return found?.action || null;
    },

    stopAllActions() {
      clearTimeout(this.returnTimer);

      this.actions.forEach(({ action }) => {
        action.stop();
        action.reset();
        action.enabled = false;
      });

      this.activeAction = null;
    },

    setTeam(teamId) {
      this.data.teamId = teamId || "mexico";
      if (!this.model) return;

      applyTeamTextureToObject3D(this.model, this.data.teamId);

      this.model.traverse((node) => {
        if (node.isMesh) {
          node.visible = true;
          node.frustumCulled = false;
          if (node.material) node.material.needsUpdate = true;
        }
      });
    },

    playClip(clipName) {
      if (!this.mixer || !this.actions.length) return;

      const nextAction = this.findAction(clipName);
      if (!nextAction) return;

      this.stopAllActions();

      nextAction.reset();
      nextAction.enabled = true;
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
      nextAction.play();

      this.activeAction = nextAction;

      const durationMs = Math.max(
        1200,
        Math.round(((nextAction.getClip?.().duration || 1.5) * 1000) + 100)
      );

      this.returnTimer = setTimeout(() => {
        this.stopAllActions();
      }, durationMs);
    },

    rotate360(durationMs = 2200) {
      if (!this.model) return;

      this.spinActive = false;
      this.spinElapsed = 0;
      this.spinDuration = durationMs;
      this.spinFrom = 0;
      this.model.rotation.y = 0;

      requestAnimationFrame(() => {
        this.spinActive = true;
      });
    },
  });
}

const SCREEN_TUTORIALS = {
  "page-marker": {
    title: "Tutorial: Escáner AR",
    text: "En esta pantalla debes apuntar la cámara al escudo o marcador para que aparezca el jugador en realidad aumentada. Cuando el equipo sea detectado, podrás interactuar con el modelo y continuar a la trivia.",
    steps: [
      "Apunta la cámara al escudo hasta que aparezca el jugador.",
      "Cuando se detecte el marcador, se desbloqueará el botón para comenzar la trivia.",
      "Usa esta pantalla para explorar al jugador antes de continuar."
    ],
    buttons: [
      "Busca el marcador: avanza a la trivia cuando el equipo ya fue detectado.",
      "Dance: reproduce la animación Dance_Loop.",
      "Victory: reproduce la animación Victory.",
      "Yes: reproduce la animación Yes.",
      "Rotar 360°: gira al jugador una sola vuelta.",
      "Confeti: activa el efecto visual de celebración."
    ]
  },

  "page-trivia": {
    title: "Tutorial: Trivia",
    text: "En esta pantalla responderás dos preguntas del jugador o equipo desbloqueado. Debes seleccionar una respuesta y confirmarla para avanzar.",
    steps: [
      "Toca una respuesta para seleccionarla.",
      "Presiona Confirmar Respuesta para validar tu elección.",
      "Debes acertar al menos una para continuar a la ficha del jugador."
    ],
    buttons: [
      "Respuestas: seleccionan tu opción.",
      "Confirmar Respuesta: revisa la elección y avanza a la siguiente pregunta."
    ]
  },

  "page-player": {
    title: "Tutorial: Pantalla del jugador",
    text: "Aquí puedes consultar la ficha del jugador desbloqueado, con sus estadísticas y curiosidades principales.",
    steps: [
      "Revisa el nombre, el número, el rating y la información del jugador.",
      "Consulta las estadísticas y curiosidades mostradas en pantalla.",
      "Desde aquí puedes ir a la galería de videos o tomar una foto con el jugador."
    ],
    buttons: [
      "Ver Galería de Videos: abre la pantalla de videos.",
      "Tomar Foto con Jugador: abre la experiencia de foto AR.",
      "Inicio: regresa a la pantalla principal."
    ]
  },

  "page-videos": {
    title: "Tutorial: Galería de videos",
    text: "En esta pantalla puedes abrir videos temáticos de los países y aplicar filtros visuales durante la reproducción.",
    steps: [
      "Toca una miniatura para abrir el video.",
      "Acepta el mensaje de reproducción para comenzar.",
      "Dentro del modal puedes probar distintos filtros."
    ],
    buttons: [
      "Miniaturas de video: abren el reproductor.",
      "Filtros: cambian el aspecto del video.",
      "✕: cierra el video actual.",
      "Regresar: vuelve a la pantalla del jugador.",
      "Inicio: vuelve al inicio."
    ]
  },

  "page-foto": {
    title: "Tutorial: Foto con jugador",
    text: "En esta pantalla puedes verte con el jugador en AR, cambiar la cámara, activar animaciones y tomar una foto final.",
    steps: [
      "Colócate frente a la cámara con el jugador en cuadro.",
      "Si quieres, cambia de cámara antes de capturar.",
      "Puedes activar una animación o lanzar confeti antes de tomar la foto."
    ],
    buttons: [
      "Cambiar cámara: alterna entre cámara frontal y trasera.",
      "Confeti: activa el efecto visual y también puede salir en la foto.",
      "D / V / Y: reproducen las tres animaciones del jugador.",
      "Botón central de cámara: toma la foto final.",
      "Regresar: vuelve a la pantalla anterior.",
      "Inicio: vuelve al inicio."
    ]
  },

  "page-capturada": {
    title: "Tutorial: Foto capturada",
    text: "Aquí verás el resultado final de la foto tomada con el jugador. Desde esta pantalla puedes descargarla o repetirla.",
    steps: [
      "Revisa la imagen final capturada.",
      "Si no te gustó, puedes volver a tomarla.",
      "Si quedó bien, puedes descargarla o compartirla."
    ],
    buttons: [
      "Tomar Otra Foto: regresa a la cámara para repetir la captura.",
      "Descargar: guarda la imagen en tu dispositivo.",
      "Botones de compartir: preparan el envío a redes o apps.",
      "Inicio: vuelve al inicio."
    ]
  }
};

function getCurrentTutorialConfig() {
  const body = document.body;
  if (!body) return null;

  for (const pageClass of Object.keys(SCREEN_TUTORIALS)) {
    if (body.classList.contains(pageClass)) {
      return SCREEN_TUTORIALS[pageClass];
    }
  }

  return null;
}

function setupTutorialOverlay() {
  const config = getCurrentTutorialConfig();
  if (!config) return;

  const overlay = document.createElement("div");
  overlay.className = "tutorial-overlay";
  overlay.id = "tutorialOverlay";

  const stepsHtml = (config.steps || [])
    .map((item) => `<li>${item}</li>`)
    .join("");

  const buttonsHtml = (config.buttons || [])
    .map((item) => `<li>${item}</li>`)
    .join("");

  overlay.innerHTML = `
    <div class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
      <h2 id="tutorialTitle" class="tutorial-card__title">${config.title}</h2>
      <p class="tutorial-card__text">${config.text}</p>

      <section class="tutorial-card__section">
        <h3 class="tutorial-card__section-title">Qué debes hacer</h3>
        <ul class="tutorial-card__list">${stepsHtml}</ul>
      </section>

      <section class="tutorial-card__section">
        <h3 class="tutorial-card__section-title">Botones y controles</h3>
        <ul class="tutorial-card__list">${buttonsHtml}</ul>
      </section>

      <div class="tutorial-card__actions">
        <button id="tutorialAcceptBtn" class="tutorial-card__btn" type="button">Aceptar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add("tutorial-lock");

  const acceptBtn = overlay.querySelector("#tutorialAcceptBtn");
  acceptBtn?.addEventListener("click", () => {
    overlay.remove();
    document.body.classList.remove("tutorial-lock");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupTutorialOverlay();
  setupHomeButtons();
  setupLandingPage();
  setupTriviaPage();
  setupPlayerPage();
  setupVideoGalleryPage();
  setupPhotoPage();
  setupCapturedPage();
});

function setupLandingPage() {
  const markerScene = document.getElementById("markerScene");
  if (markerScene) {
    setupMarkerLandingPage(markerScene);
    return;
  }

  const video = document.getElementById("qrVideo");
  if (video) {
    setupLegacyQRPage(video);
  }
}

function setupLegacyQRPage(video) {
  const scanBtn = document.getElementById("scanBtn");
  const switchBtn = document.getElementById("switchQrCamBtn");
  const statusEl = document.getElementById("qrStatus");
  const frame = document.querySelector(".scan-frame");

  const setStatus = (t) => {
    if (statusEl) statusEl.textContent = t;
  };

  const stop = () => {
    frame?.classList.remove("is-live");
    window.CameraUtils.stopCamera(video);
  };

  async function startPreview() {
    try {
      setStatus("Activando cámara...");
      await window.CameraUtils.startCamera(video, { facingMode: "environment" });
      frame?.classList.add("is-live");
      setStatus("Cámara lista");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la cámara");
    }
  }

  startPreview();

  scanBtn?.addEventListener("click", async () => {
    await pickRandomTriviaPlayer();
    window.location.href = encodeURI("Pantalla Trivia.html");
  });

  switchBtn?.addEventListener("click", async () => {
    try {
      if (!video.srcObject) {
        await startPreview();
        return;
      }

      await window.CameraUtils.switchCamera(video);
      setStatus("Cámara cambiada");
    } catch (error) {
      console.error(error);
      setStatus("No hay otra cámara disponible");
    }
  });

  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

function setupMarkerLandingPage(markerScene) {
  const scanBtn = document.getElementById("scanBtn");
  const switchBtn = document.getElementById("switchQrCamBtn");
  const animDanceBtn = document.getElementById("animDanceBtn");
  const animVictoryBtn = document.getElementById("animVictoryBtn");
  const animYesBtn = document.getElementById("animYesBtn");
  const rotate360Btn = document.getElementById("rotate360Btn");
  const confettiBtn = document.getElementById("confettiBtn");

  const statusEl = document.getElementById("qrStatus");
  const frame = document.getElementById("markerFrame") || document.querySelector(".scan-frame");
  const bgVideo = document.getElementById("markerBgVideo");

  let unlocked = false;
  let previewRetryTimer = null;
  let targetsBound = false;
  let activeMarkerModelEl = null;

  buildDynamicMindTargets();

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const unlockTrivia = () => {
    unlocked = true;
    frame?.classList.add("is-detected");
    scanBtn?.removeAttribute("disabled");

    if (scanBtn) {
      scanBtn.innerHTML = '<span class="bolt" aria-hidden="true">⚡</span> Comenzar trivia';
    }

    sessionStorage.setItem("markerUnlocked", "1");
  };

  const prepareSceneVisuals = () => {
    markerScene.style.background = "transparent";

    const canvas = markerScene.canvas;
    if (canvas) {
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.background = "transparent";
      canvas.style.pointerEvents = "none";
    }

    const renderer = markerScene.renderer;
    if (renderer) {
      renderer.setClearColor(0x000000, 0);
      if (typeof renderer.setClearAlpha === "function") {
        renderer.setClearAlpha(0);
      }
    }
  };

  const attachMindARPreview = () => {
    if (!bgVideo) return false;

    const arSystem = markerScene.systems && markerScene.systems["mindar-image-system"];
    const srcVideo = arSystem && arSystem.video;
    if (!srcVideo) return false;

    const stream = srcVideo.srcObject;
    if (!stream) return false;

    if (bgVideo.srcObject !== stream) {
      bgVideo.srcObject = stream;
    }

    bgVideo.muted = true;
    bgVideo.defaultMuted = true;
    bgVideo.setAttribute("muted", "");
    bgVideo.setAttribute("autoplay", "");
    bgVideo.setAttribute("playsinline", "");
    bgVideo.playsInline = true;

    const playPromise = bgVideo.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }

    frame?.classList.add("is-live");
    return true;
  };

  const schedulePreviewAttach = (attempt = 0) => {
    if (attachMindARPreview()) return;

    clearTimeout(previewRetryTimer);
    previewRetryTimer = setTimeout(() => {
      prepareSceneVisuals();
      schedulePreviewAttach(attempt + 1);
    }, attempt < 30 ? 180 : 500);
  };

  const forcePreviewRecovery = () => {
    prepareSceneVisuals();
    schedulePreviewAttach();
  };

  function bindAllTeamTargets() {
    if (targetsBound) return;

    const allTargets = Array.from(
      document.querySelectorAll("#dynamicTargets [mindar-image-target][data-team-id]")
    );

    allTargets.forEach((targetEl) => {
      const modelEl = targetEl.querySelector('[data-role="team-model"]');

      targetEl.addEventListener("targetFound", () => {
        schedulePreviewAttach();

        const teamId = targetEl.dataset.teamId || "mexico";
        activeMarkerModelEl = modelEl;

        if (modelEl?.object3D) {
          modelEl.object3D.visible = true;
        }

        const mesh = modelEl?.getObject3D?.("mesh");
        if (mesh) {
          mesh.visible = true;
          mesh.traverse((node) => {
            if (node.isMesh) {
              node.visible = true;
              node.frustumCulled = false;
              if (node.material) node.material.needsUpdate = true;
            }
          });
        }

        const controller = modelEl?.components?.["team-model-controller"];
        if (controller) {
          controller.setTeam(teamId);
        }

        saveSelectedTeam(teamId);
        unlockTrivia();
        animDanceBtn?.removeAttribute("disabled");
        animVictoryBtn?.removeAttribute("disabled");
        animYesBtn?.removeAttribute("disabled");
        rotate360Btn?.removeAttribute("disabled");
        confettiBtn?.removeAttribute("disabled");

        const label = TEAM_CONFIG[teamId]?.label || teamId;
        setStatus(`Jugador detectado: ${label}. Ya puedes continuar a la trivia.`);
      });

      targetEl.addEventListener("targetLost", () => {
        if (modelEl?.object3D) {
          modelEl.object3D.visible = false;
        }

        if (activeMarkerModelEl === modelEl) {
          activeMarkerModelEl = null;
        }

        if (unlocked) {
          setStatus("Jugador desbloqueado. Puedes seguir aunque el marcador ya no esté en cuadro.");
          return;
        }

        frame?.classList.remove("is-detected");
        setStatus("Marcador fuera de cuadro. Vuelve a apuntar al marcador.");
      });
    });

    targetsBound = true;
  }

  switchBtn?.setAttribute("disabled", "disabled");
  animDanceBtn?.setAttribute("disabled", "disabled");
  animVictoryBtn?.setAttribute("disabled", "disabled");
  animYesBtn?.setAttribute("disabled", "disabled");
  rotate360Btn?.setAttribute("disabled", "disabled");
  confettiBtn?.setAttribute("disabled", "disabled");

  if (sessionStorage.getItem("markerUnlocked") === "1") {
    unlockTrivia();
  } else {
    setStatus("Inicializando cámara AR…");
  }

  bindAllTeamTargets();

  markerScene.addEventListener("loaded", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();
    bindAllTeamTargets();
  });

  markerScene.addEventListener("renderstart", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();
  });

  markerScene.addEventListener("arReady", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();

    frame?.classList.add("is-live");

    if (!unlocked) {
      setStatus("AR listo. Apunta al escudo para desbloquear al jugador.");
    }

    setTimeout(forcePreviewRecovery, 800);
    setTimeout(forcePreviewRecovery, 1800);
  });

  markerScene.addEventListener("arError", (event) => {
    console.error("MindAR arError:", event);
    setStatus("No se pudo iniciar AR. Verifica permisos de cámara y HTTPS.");
  });

  animDanceBtn?.addEventListener("click", () => {
    const controller = activeMarkerModelEl?.components?.["team-model-controller"];
    if (!controller) return;
    controller.playClip("Dance_Loop");
  });

  animVictoryBtn?.addEventListener("click", () => {
    const controller = activeMarkerModelEl?.components?.["team-model-controller"];
    if (!controller) return;
    controller.playClip("Victory");
  });

  animYesBtn?.addEventListener("click", () => {
    const controller = activeMarkerModelEl?.components?.["team-model-controller"];
    if (!controller) return;
    controller.playClip("Yes");
  });

  rotate360Btn?.addEventListener("click", () => {
    const controller = activeMarkerModelEl?.components?.["team-model-controller"];
    if (!controller) return;

    controller.rotate360(2200);
  });

  confettiBtn?.addEventListener("click", () => {
    launchConfetti(42);
  });

  scanBtn?.addEventListener("click", async () => {
    if (!unlocked) {
      alert("Primero detecta el marcador para desbloquear la trivia.");
      return;
    }

    await pickTriviaPlayerForTeam(readSelectedTeam());
    clearTriviaResult();
    window.location.href = encodeURI("Pantalla Trivia.html");
  });

  window.addEventListener("pageshow", forcePreviewRecovery);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      forcePreviewRecovery();
    }
  });

  bgVideo?.addEventListener("emptied", forcePreviewRecovery);
  bgVideo?.addEventListener("stalled", forcePreviewRecovery);
  bgVideo?.addEventListener("suspend", forcePreviewRecovery);
}

async function setupTriviaPage() {
  const confirmBtn = document.querySelector(".confirm");
  const answers = Array.from(document.querySelectorAll(".answer"));
  const scoreNumber = document.querySelector(".score-number");
  const playerName = document.querySelector(".player__name");
  const playerCountry = document.querySelector(".player__country");
  const questionMeta = document.querySelector(".card__meta");
  const questionText = document.querySelector(".card__question");
  const dots = Array.from(document.querySelectorAll(".dot"));

  if (
    !confirmBtn ||
    answers.length === 0 ||
    !scoreNumber ||
    !playerName ||
    !playerCountry ||
    !questionMeta ||
    !questionText
  ) {
    return;
  }

  await ensureTriviaLoaded();

  const currentPlayer =
    readSelectedTriviaPlayer() || await pickRandomTriviaPlayer();

  const questions = currentPlayer.questions || [];

  let currentQuestionIndex = 0;
  let selectedAnswerIndex = null;
  let correctAnswers = 0;
  let locked = false;

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle("dot--active", index === currentQuestionIndex);
    });
  }

  function clearAnswerStates() {
    answers.forEach((btn) => {
      btn.classList.remove("is-selected", "is-correct", "is-wrong", "is-disabled");
      btn.disabled = false;
    });
  }

  function renderQuestion() {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    selectedAnswerIndex = null;
    locked = false;

    scoreNumber.textContent = String(currentQuestionIndex + 1);
    playerName.textContent = currentPlayer.shortName || currentPlayer.name;
    playerCountry.textContent = currentPlayer.meta || "Jugador desbloqueado";
    questionMeta.textContent = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`;
    questionText.textContent = question.text;

    answers.forEach((btn, index) => {
      btn.textContent = question.options[index] || "";
      btn.disabled = !question.options[index];
    });

    clearAnswerStates();
    confirmBtn.disabled = true;
    updateDots();
  }

  function finishTrivia() {
    const result = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      hits: correctAnswers,
      total: questions.length
    };

    sessionStorage.setItem("triviaResult", JSON.stringify(result));

    if (correctAnswers >= 1) {
      window.location.href = encodeURI("Pantalla Jugador.html");
    } else {
      window.location.href = encodeURI("index.html");
    }
  }

  answers.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      if (locked) return;

      answers.forEach((button) => button.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      selectedAnswerIndex = index;
      confirmBtn.disabled = false;
    });
  });

  confirmBtn.addEventListener("click", () => {
    if (locked || selectedAnswerIndex === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    locked = true;
    confirmBtn.disabled = true;

    answers.forEach((btn) => {
      btn.classList.add("is-disabled");
      btn.disabled = true;
    });

    const correctIndex = currentQuestion.correctIndex;
    const isCorrect = selectedAnswerIndex === correctIndex;

    if (isCorrect) {
      correctAnswers += 1;
      answers[selectedAnswerIndex].classList.remove("is-selected");
      answers[selectedAnswerIndex].classList.add("is-correct");
    } else {
      answers[selectedAnswerIndex].classList.remove("is-selected");
      answers[selectedAnswerIndex].classList.add("is-wrong");

      if (answers[correctIndex]) {
        answers[correctIndex].classList.add("is-correct");
      }
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex += 1;
        renderQuestion();
      } else {
        finishTrivia();
      }
    }, 1000);
  });

  renderQuestion();
}

async function setupPlayerPage() {
  const playerNameEl = document.querySelector(".player-name");
  const playerMetaEl = document.querySelector(".player-meta");
  const jerseyEl = document.getElementById("playerJerseyNumber");
  const ratingEl = document.getElementById("playerRatingText");

  const statGoalsEl = document.getElementById("statGoals");
  const statAssistsEl = document.getElementById("statAssists");
  const statMatchesEl = document.getElementById("statMatches");
  const statTrophiesEl = document.getElementById("statTrophies");

  const factEls = Array.from(document.querySelectorAll(".fact-text"));

  const photoBtn =
    document.getElementById("photoBtn") ||
    Array.from(document.querySelectorAll(".cta-btn")).find((btn) =>
      btn.textContent.toLowerCase().includes("foto")
    );

  const videoBtn =
    document.getElementById("videoGalleryBtn") ||
    Array.from(document.querySelectorAll(".cta-btn")).find((btn) =>
      btn.textContent.toLowerCase().includes("galería") ||
      btn.textContent.toLowerCase().includes("galeria")
    );

  // Si no es la pantalla de jugador, salir
  if (
    !playerNameEl &&
    !playerMetaEl &&
    !jerseyEl &&
    !ratingEl &&
    !statGoalsEl &&
    !factEls.length
  ) {
    return;
  }

  // IMPORTANTE: esperar a que se cargue PREGUNTAS.txt
  await ensureTriviaLoaded();

  const currentPlayer = readSelectedTriviaPlayer();
  if (!currentPlayer) return;

  const profile =
    PLAYER_PROFILES[currentPlayer.id] || buildFallbackProfile(currentPlayer);

  if (playerNameEl) playerNameEl.textContent = currentPlayer.name;
  if (playerMetaEl) playerMetaEl.textContent = profile.meta;
  if (jerseyEl) jerseyEl.textContent = profile.jersey;
  if (ratingEl) ratingEl.textContent = `Rating: ${profile.rating}`;

  if (statGoalsEl) statGoalsEl.textContent = profile.stats.goals;
  if (statAssistsEl) statAssistsEl.textContent = profile.stats.assists;
  if (statMatchesEl) statMatchesEl.textContent = profile.stats.matches;
  if (statTrophiesEl) statTrophiesEl.textContent = profile.stats.trophies;

  if (factEls[0]) factEls[0].textContent = profile.facts[0] || "";
  if (factEls[1]) factEls[1].textContent = profile.facts[1] || "";
  if (factEls[2]) factEls[2].textContent = profile.facts[2] || "";

  if (photoBtn) {
    photoBtn.addEventListener("click", () => {
      window.location.href = encodeURI("Pantalla Foto.html");
    });
  }

  if (videoBtn) {
    videoBtn.addEventListener("click", () => {
      window.location.href = encodeURI("Pantalla Videos.html");
    });
  }
}

function setupVideoGalleryPage() {
  const gallery = document.querySelector(".video-gallery");
  if (!gallery) return;

  const backBtn = document.getElementById("backToPlayerBtn");
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("closeVideoBtn");
  const player = document.getElementById("galleryVideoPlayer");
  const playerWrap = document.querySelector(".gallery-player-wrap");
  const playerFxCanvas = document.getElementById("galleryVideoFx");
  const title = document.getElementById("videoModalTitle");
  const cards = Array.from(document.querySelectorAll(".video-card"));
  const filterButtons = Array.from(document.querySelectorAll("[data-video-filter]"));

  if (!modal || !closeBtn || !player || !title || cards.length === 0) return;

  let currentVideoFilter = "normal";

  let pixelRaf = 0;
  let pixelEnabled = false;

  const pixelBuffer = document.createElement("canvas");
  const pixelBufferCtx = pixelBuffer.getContext("2d", { willReadFrequently: true });
  const playerFxCtx = playerFxCanvas?.getContext("2d", { willReadFrequently: true });

  function resizePixelCanvas() {
    if (!playerFxCanvas || !playerWrap) return;

    const rect = playerWrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const controlBarHeight = 44;

    playerFxCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    playerFxCanvas.height = Math.max(1, Math.floor((rect.height - controlBarHeight) * dpr));
  }

  function stopPixelFilter() {
    pixelEnabled = false;

    if (pixelRaf) {
      cancelAnimationFrame(pixelRaf);
      pixelRaf = 0;
    }

    playerWrap?.classList.remove("is-pixelated");

    if (playerFxCanvas && playerFxCtx) {
      playerFxCtx.clearRect(0, 0, playerFxCanvas.width, playerFxCanvas.height);
    }
  }

  function renderPixelFilter() {
    if (!pixelEnabled || !playerFxCanvas || !playerFxCtx) return;

    resizePixelCanvas();

    const outW = playerFxCanvas.width;
    const outH = playerFxCanvas.height;

    if (player.readyState >= 2 && outW > 0 && outH > 0) {
      const pixelScale = 0.10;
      const sampleW = Math.max(1, Math.floor(outW * pixelScale));
      const sampleH = Math.max(1, Math.floor(outH * pixelScale));

      pixelBuffer.width = sampleW;
      pixelBuffer.height = sampleH;

      pixelBufferCtx.clearRect(0, 0, sampleW, sampleH);
      pixelBufferCtx.drawImage(player, 0, 0, sampleW, sampleH);

      playerFxCtx.clearRect(0, 0, outW, outH);
      playerFxCtx.imageSmoothingEnabled = false;
      playerFxCtx.drawImage(pixelBuffer, 0, 0, sampleW, sampleH, 0, 0, outW, outH);
    }

    pixelRaf = requestAnimationFrame(renderPixelFilter);
  }

  function startPixelFilter() {
    if (!playerFxCanvas || !playerFxCtx || !playerWrap) return;

    stopPixelFilter();
    pixelEnabled = true;
    playerWrap.classList.add("is-pixelated");
    renderPixelFilter();
  }

  function applyVideoFilter(filterName = "normal") {
    currentVideoFilter = filterName;

    stopPixelFilter();

    player.classList.remove(
      "filter-normal",
      "filter-blur",
      "filter-thermal",
      "filter-vivid",
      "filter-stadium"
    );

    if (filterName === "pixel") {
      startPixelFilter();
    } else {
      player.classList.add(`filter-${filterName}`);
    }

    filterButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.videoFilter === filterName);
    });
  }

  function closeVideo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    player.pause();
    player.removeAttribute("src");
    player.load();
    applyVideoFilter("normal");
  }

  function openVideo(card) {
    const src = card.dataset.video;
    const poster = card.dataset.poster || "";
    const videoTitle = card.dataset.title || "Video";

    if (!src) {
      alert("No se encontró el archivo del video.");
      return;
    }

    const accepted = window.confirm("¿Reproducir video?");
    if (!accepted) return;

    title.textContent = videoTitle;
    player.src = src;
    player.poster = poster;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    applyVideoFilter(currentVideoFilter);

    const playPromise = player.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  }

  backBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Jugador.html");
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => openVideo(card));
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyVideoFilter(btn.dataset.videoFilter || "normal");
    });
  });

  applyVideoFilter("normal");

  window.addEventListener("resize", () => {
    if (currentVideoFilter === "pixel") {
      resizePixelCanvas();
    }
  });

  closeBtn.addEventListener("click", closeVideo);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.classList.contains("video-modal__backdrop")) {
      closeVideo();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeVideo();
    }
  });
}

const PHOTO_FILTERS = [
  { label: "Normal", canvasFilter: "none" },
  { label: "Frío", canvasFilter: "saturate(1.15) contrast(1.05) hue-rotate(12deg)" },
  { label: "B&N", canvasFilter: "grayscale(1) contrast(1.12)" },
  { label: "Cálido", canvasFilter: "sepia(0.28) saturate(1.18) hue-rotate(-10deg)" }
];

function drawSourceCover(ctx, source, outWidth, outHeight, options = {}) {
  const { mirror = false, filter = "none" } = options;

  const sourceWidth = source.videoWidth || source.width || source.naturalWidth || 0;
  const sourceHeight = source.videoHeight || source.height || source.naturalHeight || 0;
  if (!sourceWidth || !sourceHeight) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const canvasRatio = outWidth / outHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > canvasRatio) {
    sw = sourceHeight * canvasRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / canvasRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.save();
  ctx.filter = filter;

  if (mirror) {
    ctx.translate(outWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawEmoteSticker(ctx, outWidth, outHeight, emote) {
  if (!emote || !emote.label) return;

  const stickerWidth = Math.round(outWidth * 0.34);
  const stickerHeight = Math.round(outHeight * 0.10);
  const x = Math.round(outWidth * 0.05);
  const y = Math.round(outHeight * 0.04);
  const radius = Math.round(stickerHeight / 2);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  drawRoundedRect(ctx, x, y, stickerWidth, stickerHeight, radius);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(stickerHeight * 0.40)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(emote.emoji || "⚽", x + stickerHeight * 0.32, y + stickerHeight / 2);

  ctx.font = `900 ${Math.round(stickerHeight * 0.24)}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(emote.label, x + stickerHeight * 0.78, y + stickerHeight / 2);
  ctx.restore();
}

function takeCompositePhoto(videoEl, outCanvas, stageEl, overlayCanvas, fxCanvas, options = {}) {
  const { mirror = false, filter = "none", emote = null } = options;
  const rect = stageEl.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  outCanvas.width = width;
  outCanvas.height = height;

  const ctx = outCanvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);

  drawSourceCover(ctx, videoEl, width, height, { mirror, filter });

  if (overlayCanvas && overlayCanvas.width && overlayCanvas.height) {
    window.ARPhoto?.resizeTo?.();
    window.ARPhoto?.renderOnce?.();
    drawSourceCover(ctx, overlayCanvas, width, height, { mirror, filter });
  }

  if (fxCanvas && fxCanvas.width && fxCanvas.height) {
    drawSourceCover(ctx, fxCanvas, width, height, { mirror: false, filter: "none" });
  }

  if (emote) {
    drawEmoteSticker(ctx, width, height, emote);
  }

  return outCanvas.toDataURL("image/png");
}

function setupPhotoPage() {
  const shutterBtn = document.getElementById("shutterBtn");
  if (!shutterBtn) return;

  const video = document.getElementById("photoVideo");
  const overlayCanvas = document.getElementById("arCanvas");
  const fxCanvas = document.getElementById("fxCanvas");
  const outCanvas = document.getElementById("photoCanvas");
  const stage = document.querySelector(".ar-stage");
  const switchBtn = document.getElementById("switchCamBtn");
  const photoConfettiBtn = document.getElementById("photoConfettiBtn");
  const statusEl = document.getElementById("photoStatus");
  const backBtn = document.getElementById("backBtn");
  const emoteButtons = Array.from(document.querySelectorAll(".emote-btn"));
  const emotePill = document.getElementById("emotePill");
  const emotePillIcon = emotePill?.querySelector(".emote-pill__icon");
  const emotePillText = emotePill?.querySelector(".emote-pill__text");
  const emoteSticker = document.getElementById("emoteSticker");
  const emoteStickerEmoji = emoteSticker?.querySelector(".emote-sticker__emoji");
  const emoteStickerLabel = emoteSticker?.querySelector(".emote-sticker__label");

  if (!video || !stage || !outCanvas) return;

  let currentFacing = "user";
  let activeEmote = null;

  let confettiPieces = [];
  let confettiUntil = 0;
  let confettiRaf = 0;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const stop = () => {
    window.CameraUtils.stopCamera(video);
    setStatus("Cámara detenida");

    if (confettiRaf) {
      cancelAnimationFrame(confettiRaf);
      confettiRaf = 0;
    }

    confettiPieces = [];

    if (fxCanvas) {
      const ctx = fxCanvas.getContext("2d");
      ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
  };

  function ensureFxCanvasSize() {
    if (!fxCanvas || !stage) return false;

    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (fxCanvas.width !== width || fxCanvas.height !== height) {
      fxCanvas.width = width;
      fxCanvas.height = height;
    }

    return true;
  }

  function buildConfettiPieces(count = 42) {
    if (!ensureFxCanvasSize()) return [];

    const width = fxCanvas.width;
    const height = fxCanvas.height;
    const colors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ffffff", "#fde047"];

    return Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.25,
      w: 8 + Math.random() * 10,
      h: 8 + Math.random() * 14,
      vx: (-1.5 + Math.random() * 3.0) * (width / 420),
      vy: (3.0 + Math.random() * 4.5) * (height / 740),
      rot: Math.random() * Math.PI * 2,
      vr: -0.18 + Math.random() * 0.36,
      color: colors[i % colors.length],
      circle: Math.random() > 0.6
    }));
  }

  function drawConfettiFrame(now = performance.now()) {
    if (!fxCanvas) return;

    ensureFxCanvasSize();

    const ctx = fxCanvas.getContext("2d");
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    if (!confettiPieces.length || now >= confettiUntil) {
      confettiPieces = [];
      if (confettiRaf) {
        cancelAnimationFrame(confettiRaf);
        confettiRaf = 0;
      }
      return;
    }

    confettiPieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rot += piece.vr;
      piece.vy += 0.015;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = piece.color;

      if (piece.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, piece.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      }

      ctx.restore();
    });

    confettiRaf = requestAnimationFrame(drawConfettiFrame);
  }

  function launchPhotoConfetti() {
    confettiPieces = buildConfettiPieces(42);
    confettiUntil = performance.now() + 2600;

    if (confettiRaf) {
      cancelAnimationFrame(confettiRaf);
    }

    confettiRaf = requestAnimationFrame(drawConfettiFrame);
  }

  function clearEmoteUI() {
    emoteButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });

    if (emotePill) {
      emotePill.classList.remove("is-visible");
      emotePill.setAttribute("aria-hidden", "true");
    }

    if (emoteSticker) {
      emoteSticker.classList.remove("is-visible");
      emoteSticker.setAttribute("aria-hidden", "true");
    }
  }

  function setActiveEmote(button) {
    if (!button) {
      activeEmote = null;
      clearEmoteUI();
      window.ARPhoto?.resetEmote?.();
      return;
    }

    const animName = button.dataset.anim || "";
    const label = button.dataset.label || animName || "Animación";
    const emoji = button.dataset.emoji || "⚽";

    activeEmote = { label, emoji, animName };

    clearEmoteUI();
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");

    if (emotePill && emotePillIcon && emotePillText) {
      emotePillIcon.textContent = emoji;
      emotePillText.textContent = label;
      emotePill.classList.add("is-visible");
      emotePill.setAttribute("aria-hidden", "false");
    }

    if (emoteSticker && emoteStickerEmoji && emoteStickerLabel) {
      emoteStickerEmoji.textContent = emoji;
      emoteStickerLabel.textContent = label;
      emoteSticker.classList.add("is-visible");
      emoteSticker.setAttribute("aria-hidden", "false");
    }

    window.ARPhoto?.playEmote?.(animName);
  }

  async function startPreview(facingMode = "user") {
    try {
      setStatus("Activando cámara...");
      await window.CameraUtils.startCamera(video, {
        facingMode,
        idealWidth: 1280,
        idealHeight: 720
      });

      currentFacing = video.dataset.facing || facingMode;
      window.ARPhoto?.setFacingMode?.(currentFacing);
      window.ARPhoto?.setTeam?.(readSelectedTeam());

      setStatus("Cámara lista");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la cámara (permiso/HTTPS).");
    }
  }

  startPreview("environment");

  setTimeout(() => {
    window.ARPhoto?.setTeam?.(readSelectedTeam());
  }, 500);

  emoteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const isActive = button.classList.contains("is-active");
      setActiveEmote(isActive ? null : button);
    });
  });

  switchBtn?.addEventListener("click", async () => {
    try {
      setStatus("Cambiando cámara...");
      await window.CameraUtils.switchCamera(video);
      currentFacing = video.dataset.facing || (currentFacing === "user" ? "environment" : "user");
      window.ARPhoto?.setFacingMode?.(currentFacing);
      setStatus("Cámara cambiada");
    } catch (error) {
      console.error(error);
      setStatus("No hay otra cámara disponible.");
    }
  });

  photoConfettiBtn?.addEventListener("click", () => {
    launchPhotoConfetti();
  });

  shutterBtn.addEventListener("click", () => {
    if (!video.videoWidth) {
      alert("Espera a que la cámara esté lista.");
      return;
    }

    const dataUrl = takeCompositePhoto(video, outCanvas, stage, overlayCanvas, fxCanvas, {
      mirror: currentFacing === "user",
      filter: "none",
      emote: activeEmote
    });

    sessionStorage.setItem("capturedPhoto", dataUrl);
    window.location.href = encodeURI("Pantalla Foto Capturada.html");
  });

  backBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Jugador.html");
  });

  window.addEventListener("beforeunload", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
}

function setupCapturedPage() {
  const imgEl = document.getElementById("resultImg");
  if (!imgEl) return;

  const retakeBtn = document.getElementById("retakeBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const shareFb = document.getElementById("shareFacebook");
  const shareWa = document.getElementById("shareWhatsApp");
  const shareIg = document.getElementById("shareInstagram");
  const shareTw = document.getElementById("shareTwitter");

  const dataUrl = sessionStorage.getItem("capturedPhoto");
  const placeholderCard = document.querySelector(".photo-inner .player-card");
  const miniBtn = document.querySelector(".photo-inner .mini-btn");

  if (dataUrl) {
    imgEl.src = dataUrl;
    placeholderCard?.remove();
    miniBtn?.remove();
  } else {
    window.location.href = encodeURI("Pantalla Foto.html");
    return;
  }

  retakeBtn?.addEventListener("click", () => {
    window.location.href = encodeURI("Pantalla Foto.html");
  });

  downloadBtn?.addEventListener("click", () => {
    window.CameraUtils.downloadDataURL(dataUrl, "foto_fifar.png");
  });

  [shareFb, shareWa, shareIg, shareTw]
    .filter(Boolean)
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });
}