function setupHomeButtons() {
  document.querySelectorAll("[data-home]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = encodeURI("index.html");
    });
  });
}

const TRIVIA_PLAYERS = [
  {
    id: "messi",
    name: "Lionel Messi",
    shortName: "Messi",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿En qué País nació Lionel Messi?",
        options: ["Japón", "Rusia", "Argentina", "Francia"],
        correctIndex: 2
      },
      {
        text: "¿Cuál es el número del jersey de Lionel Messi?",
        options: ["10", "33", "28", "16"],
        correctIndex: 0
      }
    ]
  },
  {
    id: "dimaria",
    name: "Ángel Di María",
    shortName: "Ángel Di María",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "Además de Rosario Central, ¿en cuántos equipos jugó Di María?",
        options: ["4", "5", "6", "7"],
        correctIndex: 1
      },
      {
        text: "¿Contra qué equipo debutó Di María en Central?",
        options: ["Quilmes", "Talleres", "Independiente", "River Plate"],
        correctIndex: 2
      }
    ]
  },
  {
    id: "julian",
    name: "Julián Álvarez",
    shortName: "Julián Álvarez",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿Cuándo nació Julián Álvarez?",
        options: [
          "29 de enero del 2000",
          "31 de enero del 2000",
          "4 de marzo del 1999",
          "9 de enero del 2000"
        ],
        correctIndex: 1
      },
      {
        text: "¿En qué equipo juega actualmente?",
        options: ["River Plate", "Manchester City", "Boca Junior", "Real Madrid"],
        correctIndex: 1
      }
    ]
  },
  {
    id: "mbappe",
    name: "Kylian Mbappé",
    shortName: "Kylian Mbappé",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿Qué posición juega Mbappé?",
        options: ["Delantero", "Medio campo", "Lateral", "Portero"],
        correctIndex: 0
      },
      {
        text: "¿Dónde nació Mbappé?",
        options: ["Yaounde", "Marseille", "Macon", "Paris"],
        correctIndex: 3
      }
    ]
  },
  {
    id: "giroud",
    name: "Olivier Giroud",
    shortName: "Olivier Giroud",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿Cuándo inicio su carrera profesional?",
        options: ["2004", "2005", "2006", "2007"],
        correctIndex: 1
      },
      {
        text: "¿Cuánto mide Olivier Giroud?",
        options: ["1.90 m", "1.92 m", "1.94 m", "1.96 m"],
        correctIndex: 1
      }
    ]
  },
  {
    id: "neymar",
    name: "Neymar JR",
    shortName: "Neymar JR",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿En qué club brasileño comenzó Neymar su carrera profesional?",
        options: ["Flamengo", "Santos", "Fluminense", "Palmeiras"],
        correctIndex: 1
      },
      {
        text: "¿Cuántos goles ha marcado en Champions Neymar hasta la fecha?",
        options: ["23", "33", "43", "53"],
        correctIndex: 2
      }
    ]
  },
  {
    id: "vinicius",
    name: "Vinicius JR",
    shortName: "Vinicius JR",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿Cuántos años tiene?",
        options: ["22", "25", "24", "28"],
        correctIndex: 2
      },
      {
        text: "¿En qué equipo inicio su carrera?",
        options: ["Vasco", "Sao Paulo", "Flamengo", "Real Madrid"],
        correctIndex: 2
      }
    ]
  },
  {
    id: "amrabat",
    name: "Sofyan Amrabat",
    shortName: "Sofyan Amrabat",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿En qué posición juega Amrabat?",
        options: ["Centrocampista", "Portero", "Delantero", "Lateral"],
        correctIndex: 0
      },
      {
        text: "¿Con que club inglés gano la FA Cup en 2023/2024?",
        options: ["Liver", "Sunderland", "Manchester United", "Manchester City"],
        correctIndex: 2
      }
    ]
  },
  {
    id: "hakimi",
    name: "Achraf Hakimi",
    shortName: "Achraf Hakimi",
    meta: "Jugador desbloqueado",
    questions: [
      {
        text: "¿Dónde nació Achraf Hakimi?",
        options: ["Marruecos", "Emiratos Árabes Unidos", "España", "Portugal"],
        correctIndex: 2
      },
      {
        text: "¿Con que club jugó antes de unirse al PSG?",
        options: ["Inter de Milán", "Wydad", "Raja Casablanca", "RSB Berkane"],
        correctIndex: 0
      }
    ]
  }
];

const PLAYER_PROFILES = {
  messi: {
    jersey: 10,
    meta: "Argentina • Delantero",
    rating: 95,
    stats: {
      goals: 820,
      assists: 360,
      matches: 1050,
      trophies: 44
    },
    facts: [
      "Ganó la Copa del Mundo con Argentina en 2022.",
      "Debutó profesionalmente con el FC Barcelona.",
      "Es reconocido por su visión, regate y definición."
    ]
  },

  dimaria: {
    jersey: 11,
    meta: "Argentina • Extremo derecho",
    rating: 87,
    stats: {
      goals: 180,
      assists: 260,
      matches: 720,
      trophies: 31
    },
    facts: [
      "Fue campeón olímpico con Argentina en 2008.",
      "Marcó goles importantes en finales con su selección.",
      "Jugó en clubes como Benfica, Real Madrid, PSG y Juventus."
    ]
  },

  julian: {
    jersey: 9,
    meta: "Argentina • Delantero",
    rating: 86,
    stats: {
      goals: 140,
      assists: 55,
      matches: 260,
      trophies: 12
    },
    facts: [
      "Su apodo es 'La Araña'.",
      "Se formó y brilló con River Plate.",
      "Fue campeón del mundo con Argentina siendo muy joven."
    ]
  },

  mbappe: {
    jersey: 7,
    meta: "Francia • Delantero",
    rating: 92,
    stats: {
      goals: 320,
      assists: 140,
      matches: 430,
      trophies: 18
    },
    facts: [
      "Fue campeón del mundo con Francia en 2018.",
      "Destaca por su gran velocidad y definición.",
      "Debutó profesionalmente con el AS Monaco."
    ]
  },

  giroud: {
    jersey: 9,
    meta: "Francia • Delantero",
    rating: 84,
    stats: {
      goals: 280,
      assists: 95,
      matches: 690,
      trophies: 14
    },
    facts: [
      "Es un delantero conocido por su juego aéreo.",
      "Ha jugado en ligas como la francesa, inglesa e italiana.",
      "Destaca por su remate de cabeza y juego de espaldas."
    ]
  },

  neymar: {
    jersey: 10,
    meta: "Brasil • Delantero",
    rating: 91,
    stats: {
      goals: 440,
      assists: 220,
      matches: 710,
      trophies: 28
    },
    facts: [
      "Comenzó su carrera profesional en Santos.",
      "Ganó el oro olímpico con Brasil en 2016.",
      "Es famoso por su regate, creatividad y técnica."
    ]
  },

  vinicius: {
    jersey: 7,
    meta: "Brasil • Extremo",
    rating: 89,
    stats: {
      goals: 110,
      assists: 75,
      matches: 320,
      trophies: 10
    },
    facts: [
      "Inició su carrera en Flamengo.",
      "Es uno de los jugadores más explosivos por banda.",
      "Destaca por su velocidad y desborde."
    ]
  },

  amrabat: {
    jersey: 4,
    meta: "Marruecos • Mediocampista",
    rating: 82,
    stats: {
      goals: 12,
      assists: 18,
      matches: 310,
      trophies: 3
    },
    facts: [
      "Juega como mediocampista de recuperación.",
      "Destacó mucho con Marruecos en el Mundial 2022.",
      "Es conocido por su intensidad y fortaleza física."
    ]
  },

  hakimi: {
    jersey: 2,
    meta: "Marruecos • Lateral derecho",
    rating: 86,
    stats: {
      goals: 45,
      assists: 70,
      matches: 390,
      trophies: 12
    },
    facts: [
      "Se desempeña como lateral o carrilero derecho.",
      "Es reconocido por su velocidad en ataque.",
      "Antes de consolidarse en Europa pasó por la cantera del Real Madrid."
    ]
  }
};

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

function pickRandomTriviaPlayer() {
  const randomIndex = Math.floor(Math.random() * TRIVIA_PLAYERS.length);
  const player = JSON.parse(JSON.stringify(TRIVIA_PLAYERS[randomIndex]));
  saveSelectedTriviaPlayer(player);
  return player;
}

function clearTriviaResult() {
  sessionStorage.removeItem("triviaResult");
}

const TEAM_CONFIG = {
  mexico: {
    label: "México",
    texture: "NewTextures/Mexico.png",
    targetIndex: 0,
    defaultAnimation: "Victory"
  },
  argentina: {
    label: "Argentina",
    texture: "NewTextures/Argentina.png",
    targetIndex: 1,
    animation: "Victory"
  },
  brasil: {
    label: "Brasil",
    texture: "NewTextures/Brasil.png",
    targetIndex: 2,
    animation: "Victory"
  }
};

function saveSelectedTeam(teamId) {
  sessionStorage.setItem("selectedTeamId", teamId);
}

function readSelectedTeam() {
  return sessionStorage.getItem("selectedTeamId") || "mexico";
}

function applyTeamTextureToObject3D(object3D, teamId) {
  const cfg = TEAM_CONFIG[teamId];
  if (!cfg || !object3D || !window.THREE) return;

  const texture = new THREE.TextureLoader().load(cfg.texture);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  object3D.traverse((node) => {
    if (!node.isMesh || !node.material) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const nextMaterials = materials.map((mat) => {
      if (!mat) return mat;

      const matName = (mat.name || "").toLowerCase();

      // Ajusta aquí las partes del uniforme
      if (!matName.includes("outfit_top") && !matName.includes("outfit_bottom")) {
        return mat;
      }

      const clone = mat.clone();
      clone.map = texture;
      clone.needsUpdate = true;
      return clone;
    });

    node.material = Array.isArray(node.material) ? nextMaterials : nextMaterials[0];
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

      this.el.addEventListener("model-loaded", () => {
        this.model = this.el.getObject3D("mesh");
        if (!this.model) return;

        this.setupAnimations();
        this.setTeam(this.data.teamId);
      });
    },

    tick(time, delta) {
      if (this.mixer) {
        this.mixer.update(delta / 1000);
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

      const idle =
        this.findAction("dance") ||
        this.findAction("loop") ||
        this.actions[0]?.action ||
        null;

      if (idle) {
        idle.reset();
        idle.enabled = true;
        idle.setLoop(THREE.LoopRepeat, Infinity);
        idle.play();
        this.activeAction = idle;
      }
    },

    findAction(keyword) {
      const found = this.actions.find((item) => item.name.includes(keyword.toLowerCase()));
      return found?.action || null;
    },

    setTeam(teamId) {
      this.data.teamId = teamId;
      if (!this.model) return;

      applyTeamTextureToObject3D(this.model, teamId);
    },

    playClip(clipName = "Victory") {
      if (!this.mixer || !this.actions.length) return;

      const key = clipName.toLowerCase();

      let nextAction =
        this.findAction(key) ||
        this.findAction("victory") ||
        this.findAction("yes") ||
        this.findAction("dance");

      if (!nextAction) return;

      this.actions.forEach(({ action }) => {
        if (action !== nextAction) {
          action.fadeOut(0.15);
        }
      });

      nextAction.reset();
      nextAction.enabled = true;

      const isLoop = key.includes("dance") || key.includes("loop");

      if (isLoop) {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
      } else {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
      }

      nextAction.fadeIn(0.15);
      nextAction.play();
      this.activeAction = nextAction;

      if (!isLoop) {
        setTimeout(() => {
          const idle = this.findAction("dance") || this.findAction("loop");
          if (idle && idle !== nextAction) {
            nextAction.fadeOut(0.15);
            idle.reset();
            idle.fadeIn(0.15);
            idle.play();
            this.activeAction = idle;
          }
        }, 1400);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHomeButtons();
  setupLandingPage();
  setupTriviaPage();
  setupPlayerPage();
  setupVideoGalleryPage();
  setupPhotoPage();
  setupCapturedPage();
});

// -------------------------------------
// Pantalla principal / index
// -------------------------------------
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

  scanBtn?.addEventListener("click", () => {
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
  const statusEl = document.getElementById("qrStatus");
  const frame = document.getElementById("markerFrame") || document.querySelector(".scan-frame");
  const target = document.getElementById("markerTarget");
  const bgVideo = document.getElementById("markerBgVideo");
  const playArAnimBtn = document.getElementById("playArAnimBtn");
  const markerPlayerModel = document.getElementById("markerPlayerModel");

  let unlocked = false;
  let previewRetryTimer = null;

  function applyActiveTeamToMarker(teamId) {
    saveSelectedTeam(teamId);

    const controller = markerPlayerModel?.components?.["team-model-controller"];
    if (controller) {
      controller.setTeam(teamId);
    }

    playArAnimBtn?.removeAttribute("disabled");
  }

  playArAnimBtn?.addEventListener("click", () => {
    const controller = markerPlayerModel?.components?.["team-model-controller"];
    if (!controller) return;

    controller.playClip("Victory");
  });

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
    setStatus("Jugador detectado. Ya puedes continuar a la trivia.");
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

  switchBtn?.setAttribute("disabled", "disabled");

  if (sessionStorage.getItem("markerUnlocked") === "1") {
    unlockTrivia();
  } else {
    setStatus("Inicializando cámara AR…");
  }

  markerScene.addEventListener("loaded", () => {
    prepareSceneVisuals();
    schedulePreviewAttach();
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
      setStatus("AR listo. Apunta al marcador para desbloquear al jugador.");
    }

    setTimeout(forcePreviewRecovery, 800);
    setTimeout(forcePreviewRecovery, 1800);
  });

  markerScene.addEventListener("arError", (event) => {
    console.error("MindAR arError:", event);
    setStatus("No se pudo iniciar AR. Verifica permisos de cámara y HTTPS.");
  });

  target?.addEventListener("targetFound", () => {
    schedulePreviewAttach();

    const teamId = target.dataset.teamId || "mexico";
    applyActiveTeamToMarker(teamId);

    unlockTrivia();
  });

  target?.addEventListener("targetLost", () => {
    if (unlocked) {
      setStatus("Jugador desbloqueado. Puedes seguir aunque el marcador ya no esté en cuadro.");
      return;
    }

    frame?.classList.remove("is-detected");
    setStatus("Marcador fuera de cuadro. Vuelve a apuntar al marcador.");
  });

  scanBtn?.addEventListener("click", () => {
    if (!unlocked) {
      alert("Primero detecta el marcador para desbloquear la trivia.");
      return;
    }

    pickRandomTriviaPlayer();
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

// -------------------------------------
// Pantalla Trivia
// -------------------------------------
function setupTriviaPage() {
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

  const currentPlayer = readSelectedTriviaPlayer() || pickRandomTriviaPlayer();
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

// -------------------------------------
// Pantalla Jugador
// -------------------------------------
function setupPlayerPage() {
  const currentPlayer = readSelectedTriviaPlayer();
  const profile = currentPlayer ? PLAYER_PROFILES[currentPlayer.id] : null;

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

  if (currentPlayer) {
    if (playerNameEl) playerNameEl.textContent = currentPlayer.name;
  }

  if (profile) {
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
  }

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
// -------------------------------------
// Pantalla Galeria
// -------------------------------------
function setupVideoGalleryPage() {
  const gallery = document.querySelector(".video-gallery");
  if (!gallery) return;

  const backBtn = document.getElementById("backToPlayerBtn");
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("closeVideoBtn");
  const player = document.getElementById("galleryVideoPlayer");
  const title = document.getElementById("videoModalTitle");
  const cards = Array.from(document.querySelectorAll(".video-card"));

  if (!modal || !closeBtn || !player || !title || cards.length === 0) return;

  function closeVideo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    player.pause();
    player.removeAttribute("src");
    player.load();
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

// -------------------------------------
// Utilidades de captura
// -------------------------------------
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

function takeCompositePhoto(videoEl, outCanvas, stageEl, overlayCanvas, options = {}) {
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

  if (emote) {
    drawEmoteSticker(ctx, width, height, emote);
  }

  return outCanvas.toDataURL("image/png");
}

// -------------------------------------
// Pantalla Foto
// -------------------------------------
function setupPhotoPage() {
  const shutterBtn = document.getElementById("shutterBtn");
  if (!shutterBtn) return;

  const video = document.getElementById("photoVideo");
  const overlayCanvas = document.getElementById("arCanvas");
  const outCanvas = document.getElementById("photoCanvas");
  const stage = document.querySelector(".ar-stage");
  const switchBtn = document.getElementById("switchCamBtn");
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

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const stop = () => {
    window.CameraUtils.stopCamera(video);
    setStatus("Cámara detenida");
  };

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

    const label = button.dataset.label || "Emote";
    const emoji = button.dataset.emoji || "⚽";
    const svg = button.querySelector("svg");

    activeEmote = { label, emoji };

    clearEmoteUI();
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");

    if (emotePill && emotePillIcon && emotePillText) {
      emotePillIcon.innerHTML = svg ? svg.outerHTML : "";
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

    window.ARPhoto?.playEmote?.(label);
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
      const selectedTeamId = sessionStorage.getItem("selectedTeamId") || "mexico";
      window.ARPhoto?.setTeam?.(selectedTeamId);
      setStatus("Cámara lista");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la cámara (permiso/HTTPS).");
    }
  }

  startPreview("enviroment");

  setTimeout(() => {
    const selectedTeamId = sessionStorage.getItem("selectedTeamId") || "mexico";
    window.ARPhoto?.setTeam?.(selectedTeamId);
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

  shutterBtn.addEventListener("click", () => {
    if (!video.videoWidth) {
      alert("Espera a que la cámara esté lista.");
      return;
    }

    const dataUrl = takeCompositePhoto(video, outCanvas, stage, overlayCanvas, {
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

// -------------------------------------
// Pantalla Foto Capturada
// -------------------------------------
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