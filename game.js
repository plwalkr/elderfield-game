
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const canvasWrap = document.getElementById("canvasWrap");
  const messageBox = document.getElementById("messageBox");
  const heartsValue = document.getElementById("heartsValue");
  const enemiesValue = document.getElementById("enemiesValue");
  const rupeesValue = document.getElementById("rupeesValue");
  const zoneValue = document.getElementById("zoneValue");
  const objectiveValue = document.getElementById("objectiveValue");
  const rewardsValue = document.getElementById("rewardsValue");
  const areaBanner = document.getElementById("areaBanner");
  const areaBannerTitle = document.getElementById("areaBannerTitle");
  const areaBannerOverline = document.getElementById("areaBannerOverline");
  const startCard = document.getElementById("startCard");
  const startTitle = startCard.querySelector("h2");
  const startText = startCard.querySelector("p");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const touchAttack = document.getElementById("touchAttack");
  const touchInteract = document.getElementById("touchInteract");
  const debugPanel = document.getElementById("debugPanel");
  const debugContent = document.getElementById("debugContent");
  const copyDebugButton = document.getElementById("copyDebugButton");
  const versionValue = document.getElementById("versionValue");
  const debugBuildValue = document.getElementById("debugBuildValue");
  const buildWatermark = document.getElementById("buildWatermark");
  const statusPill = document.getElementById("statusPill");
  const statusValue = document.getElementById("statusValue");
  const debugStatusBadge = document.getElementById("debugStatusBadge");

  const TILE = 24;
  const INVULN_TIME = 0.7;
  const ATTACK_COOLDOWN = 0.26;
  const ATTACK_TIME = 0.13;
  const GAME_VERSION = "v2.2.0";
  const BUILD_DATE = "2026-03-22";
  const BUILD_NAME = "Dungeon Pass";
  const START_ZONE = "South Meadow";

  const keys = Object.create(null);
  const touchState = { up: false, down: false, left: false, right: false };
  const pointerState = { x: 0, y: 0, active: false };

  const state = {
    running: false,
    victory: false,
    gameOver: false,
    logicalWidth: 768,
    logicalHeight: 432,
    camera: { x: 0, y: 0 },
    cameraShake: { power: 0, time: 0 },
    transition: { active: false, alpha: 0, stage: "idle", targetAreaId: null, targetSpawn: null, targetMessage: "" },
    areas: {},
    currentAreaId: "overworld",
    player: null,
    rupees: 0,
    zoneName: START_ZONE,
    objectiveText: "Clear the field or brave the Triune Gate.",
    areaBannerTimer: 0,
    message: "",
    messageTimer: 0,
    particles: [],
    strikeDust: [],
    rewardsOwned: [],
    dungeon: {
      started: false,
      cleared: false,
      keyOwned: false,
      sealUnlocked: false,
      rewardGranted: false,
      currentReward: null,
      roomClears: {},
      fieldCleared: false,
    },
    lastTime: 0,
    debug: {
      enabled: false,
      hitboxes: false,
      fps: 0,
      fpsFrames: 0,
      fpsTime: 0,
      status: "good",
      statusText: "GOOD",
      issues: [],
      lastAction: "boot",
      copyResult: "idle",
      errors: [],
    },
  };

  function currentArea() {
    return state.areas[state.currentAreaId];
  }

  function setMessage(text, time = 2.5) {
    state.message = text;
    state.messageTimer = time;
    messageBox.textContent = text;
  }

  function setDebugAction(text) {
    state.debug.lastAction = text;
  }

  function showAreaBanner(title, overline = "Region entered", time = 2.5) {
    areaBannerTitle.textContent = title;
    areaBannerOverline.textContent = overline;
    areaBanner.hidden = false;
    state.areaBannerTimer = time;
  }

  function addCameraShake(power = 5, time = 0.12) {
    state.cameraShake.power = Math.max(state.cameraShake.power, power);
    state.cameraShake.time = Math.max(state.cameraShake.time, time);
  }

  function formatRupees(value) {
    return String(value).padStart(3, "0");
  }

  function formatRewards() {
    return state.rewardsOwned.length ? state.rewardsOwned.length : 0;
  }

  function renderHearts(current, max) {
    heartsValue.innerHTML = "";
    for (let i = 0; i < max; i += 1) {
      const heart = document.createElement("span");
      const filled = i < current;
      heart.className = `heart-icon ${filled ? "full" : "empty"}`;
      if (filled && current <= 1) heart.classList.add("low");
      heartsValue.appendChild(heart);
    }
  }

  function syncBuildStamp() {
    versionValue.textContent = GAME_VERSION;
    debugBuildValue.textContent = GAME_VERSION;
    buildWatermark.textContent = `${GAME_VERSION} • ${BUILD_NAME}`;
  }

  function updateStatusUi() {
    statusPill.dataset.state = state.debug.status;
    debugStatusBadge.dataset.state = state.debug.status;
    statusValue.textContent = state.debug.statusText;
    debugStatusBadge.textContent = state.debug.statusText;
  }

  function recordRuntimeError(kind, value) {
    const safeValue = String(value || "unknown error").slice(0, 180);
    const entry = `${kind}: ${safeValue}`;
    if (!state.debug.errors.includes(entry)) {
      state.debug.errors.unshift(entry);
      state.debug.errors = state.debug.errors.slice(0, 6);
    }
    setDebugAction(`error-${kind}`);
  }

  function computeStatus() {
    const issues = [];
    let status = "good";

    if (canvas.width <= 0 || canvas.height <= 0) {
      status = "issue";
      issues.push("canvas size invalid");
    }

    if (state.debug.errors.length > 0) {
      status = "issue";
      issues.push("runtime error captured");
    }

    if (state.running && state.debug.fps > 0) {
      if (state.debug.fps < 36) {
        status = "issue";
        issues.push(`fps low (${state.debug.fps})`);
      } else if (state.debug.fps < 54 && status !== "issue") {
        status = "warn";
        issues.push(`fps dipped (${state.debug.fps})`);
      }
    }

    if (state.player) {
      if (state.player.health <= 1 && status !== "issue") {
        status = "warn";
        issues.push("player health critical");
      }
      if (state.player.health <= 0 || state.gameOver) {
        status = "issue";
        issues.push("player defeated");
      }
    }

    if (state.transition.active && state.debug.status !== "issue" && status === "good") {
      issues.push("transition in progress");
    }

    if (state.debug.copyResult === "failed" && status !== "issue") {
      status = "warn";
      issues.push("clipboard copy fallback needed");
    }

    if (issues.length === 0) issues.push("all systems stable");

    state.debug.status = status;
    state.debug.statusText = status === "good" ? "GOOD" : status === "warn" ? "WARN" : "ISSUE";
    state.debug.issues = issues;
    updateStatusUi();
  }

  function buildDebugReport() {
    const player = state.player || { x: 0, y: 0, health: 0, maxHealth: 0, attackTimer: 0, invuln: 0, lastDir: { x: 0, y: 0 } };
    const area = currentArea() || { width: 0, height: 0, enemies: [], pickups: [], name: "none" };
    const alive = area.enemies.filter((enemy) => !enemy.dead).length;
    const pointerText = `${Math.round(pointerState.x)}, ${Math.round(pointerState.y)} ${pointerState.active ? "(active)" : "(idle)"}`;
    return [
      `Elderfield Debug Report`,
      `Version: ${GAME_VERSION} • ${BUILD_DATE} • ${BUILD_NAME}`,
      `Status: ${state.debug.statusText} • Issues: ${state.debug.issues.join("; ")}`,
      ``,
      `Session`,
      `- Running=${state.running}`,
      `- Victory=${state.victory}`,
      `- GameOver=${state.gameOver}`,
      `- CurrentArea=${state.currentAreaId}`,
      `- Zone=${state.zoneName}`,
      `- Objective=${state.objectiveText}`,
      ``,
      `Viewport`,
      `- LogicalSize=${state.logicalWidth}x${state.logicalHeight}`,
      `- CanvasBacking=${canvas.width}x${canvas.height}`,
      `- Camera=${state.camera.x.toFixed(1)}, ${state.camera.y.toFixed(1)}`,
      `- CameraShake=${state.cameraShake.power.toFixed(2)} @ ${state.cameraShake.time.toFixed(3)}`,
      `- Transition=${state.transition.active ? `${state.transition.stage}@${state.transition.alpha.toFixed(2)}` : "idle"}`,
      ``,
      `Player`,
      `- Pos=${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
      `- Health=${player.health}/${player.maxHealth}`,
      `- SwordLevel=${player.swordLevel}`,
      `- SwordDamage=${player.damage}`,
      `- Rupees=${state.rupees}`,
      `- Facing=${player.lastDir.x.toFixed(2)}, ${player.lastDir.y.toFixed(2)}`,
      `- AttackTimer=${player.attackTimer.toFixed(3)}`,
      `- Invuln=${player.invuln.toFixed(3)}`,
      ``,
      `Area`,
      `- Name=${area.name}`,
      `- Size=${area.width}x${area.height}`,
      `- EnemiesAlive=${alive}`,
      `- Pickups=${area.pickups.length}`,
      `- Interactables=${area.interactables.length}`,
      `- Particles=${state.particles.length}`,
      `- StrikeDust=${state.strikeDust.length}`,
      ``,
      `Progress`,
      `- FieldCleared=${state.dungeon.fieldCleared}`,
      `- DungeonStarted=${state.dungeon.started}`,
      `- DungeonCleared=${state.dungeon.cleared}`,
      `- DungeonKey=${state.dungeon.keyOwned}`,
      `- SealUnlocked=${state.dungeon.sealUnlocked}`,
      `- RewardGranted=${state.dungeon.rewardGranted}`,
      `- CurrentReward=${state.dungeon.currentReward || "none"}`,
      `- RewardsOwned=${state.rewardsOwned.join(", ") || "none"}`,
      ``,
      `Input`,
      `- Pointer=${pointerText}`,
      `- Touch=${JSON.stringify(touchState)}`,
      `- DebugEnabled=${state.debug.enabled}`,
      `- Hitboxes=${state.debug.hitboxes}`,
      `- FPS=${state.debug.fps}`,
      `- LastAction=${state.debug.lastAction}`,
      `- CopyResult=${state.debug.copyResult}`,
      ``,
      `Errors`,
      ...(state.debug.errors.length ? state.debug.errors.map((error) => `- ${error}`) : [`- none`]),
    ].join("\n");
  }

  function refreshDebugPanel() {
    debugContent.textContent = buildDebugReport();
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }

  async function copyDebugReport() {
    const report = buildDebugReport();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(report);
      } else {
        const ok = fallbackCopyText(report);
        if (!ok) throw new Error("execCommand copy failed");
      }
      state.debug.copyResult = "copied";
      setDebugAction("copy-debug-report");
      setMessage("Debug report copied.", 1.6);
    } catch (error) {
      state.debug.copyResult = "failed";
      recordRuntimeError("copy", error && error.message ? error.message : error);
      setMessage("Copy failed. Open debug and copy manually.", 2.2);
    }
    computeStatus();
    refreshDebugPanel();
  }

  function toggleDebug() {
    state.debug.enabled = !state.debug.enabled;
    debugPanel.hidden = !state.debug.enabled;
    setDebugAction(state.debug.enabled ? "debug-open" : "debug-closed");
    refreshDebugPanel();
    setMessage(state.debug.enabled ? "Dev overlay opened." : "Dev overlay hidden.", 1.3);
  }

  function toggleHitboxes() {
    state.debug.hitboxes = !state.debug.hitboxes;
    setDebugAction(state.debug.hitboxes ? "hitboxes-on" : "hitboxes-off");
    setMessage(state.debug.hitboxes ? "Hitboxes enabled." : "Hitboxes hidden.", 1.3);
    refreshDebugPanel();
  }

  function healPlayer() {
    if (!state.player) return;
    state.player.health = state.player.maxHealth;
    updateHud();
    setDebugAction("heal-player");
    setMessage("Hearts restored.", 1.4);
  }

  function clearAllEnemies() {
    const area = currentArea();
    let changed = false;
    for (const enemy of area.enemies) {
      if (enemy.dead) continue;
      enemy.dead = true;
      changed = true;
      burst(enemy.x, enemy.y, enemy.type === "knight" ? ["#c5d7ff", "#ffffff"] : enemy.tint === "ember" ? ["#ffb25e", "#fff0c2"] : ["#98f58d", "#d7ffd0"]);
    }
    if (changed) {
      onAreaEnemiesCleared(area);
      updateHud();
      setDebugAction("clear-enemies");
      setMessage("All foes cleared for testing.", 2);
    }
  }

  function resetGame() {
    state.running = true;
    state.victory = false;
    state.gameOver = false;
    state.lastTime = 0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.cameraShake.power = 0;
    state.cameraShake.time = 0;
    state.transition = { active: false, alpha: 0, stage: "idle", targetAreaId: null, targetSpawn: null, targetMessage: "" };
    state.particles.length = 0;
    state.strikeDust.length = 0;
    state.debug.errors.length = 0;
    state.debug.copyResult = "idle";
    state.rewardsOwned = [];
    state.dungeon = {
      started: false,
      cleared: false,
      keyOwned: false,
      sealUnlocked: false,
      rewardGranted: false,
      currentReward: null,
      roomClears: {},
      fieldCleared: false,
    };
    state.rupees = 0;
    state.player = makePlayer();
    state.areas = buildAreas();
    setArea("overworld", "start", true);
    state.objectiveText = "Triune Gate found. Clear the field or dive into the dungeon.";
    startCard.hidden = true;
    startButton.hidden = false;
    restartButton.hidden = true;
    startTitle.textContent = "Elderfield";
    startText.textContent = "The Triune Gate has opened. Defeat the field creatures, dive through the mixed gate, and take a relic from the knight below.";
    setDebugAction("reset-game");
    updateHud();
    refreshDebugPanel();
    setMessage("Explore the field. Press Enter at signs, gates, doors, and the shrine.", 4);
    showAreaBanner(state.zoneName, "Region entered", 2.8);
  }

  function resizeCanvas() {
    const rect = canvasWrap.getBoundingClientRect();
    const targetAspect = 16 / 9;
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    let drawWidth = cssWidth;
    let drawHeight = drawWidth / targetAspect;
    if (drawHeight > cssHeight) {
      drawHeight = cssHeight;
      drawWidth = drawHeight * targetAspect;
    }

    canvas.style.width = `${Math.floor(drawWidth)}px`;
    canvas.style.height = `${Math.floor(drawHeight)}px`;
    canvas.style.margin = `${Math.max(0, (cssHeight - drawHeight) / 2)}px auto`;

    let base = 768;
    if (window.innerWidth <= 1400) base = 704;
    if (window.innerWidth <= 980) base = 608;
    if (window.innerWidth <= 700) base = 512;
    if (window.innerWidth <= 640) base = 432;
    state.logicalWidth = base;
    state.logicalHeight = Math.floor(base / targetAspect);

    canvas.width = state.logicalWidth;
    canvas.height = state.logicalHeight;
    ctx.imageSmoothingEnabled = false;
  }

  function make2DArray(w, h, fill) {
    return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
  }

  function seededNoise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  function makeArea(id, name, width, height, defaultFloor = 0) {
    return {
      id,
      name,
      width,
      height,
      world: make2DArray(width, height, defaultFloor),
      solids: make2DArray(width, height, false),
      interactables: [],
      enemies: [],
      pickups: [],
      spawns: {},
      theme: id.startsWith("dungeon") ? "dungeon" : "field",
    };
  }

  function fillRect(area, x, y, w, h, tile, solid) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        if (ix < 0 || iy < 0 || ix >= area.width || iy >= area.height) continue;
        area.world[iy][ix] = tile;
        area.solids[iy][ix] = solid;
      }
    }
  }

  function ring(area, x, y, w, h, tile, solid) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        const edge = ix === x || iy === y || ix === x + w - 1 || iy === y + h - 1;
        if (!edge) continue;
        if (ix < 0 || iy < 0 || ix >= area.width || iy >= area.height) continue;
        area.world[iy][ix] = tile;
        area.solids[iy][ix] = solid;
      }
    }
  }

  function clearRect(area, x, y, w, h, tile = 0) {
    fillRect(area, x, y, w, h, tile, false);
  }

  function carvePath(area, x1, y1, x2, y2, tile = 3) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        area.world[y][x] = tile;
        area.solids[y][x] = false;
      }
    }
  }

  function placeForestPatch(area, x, y, w, h) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        if (seededNoise(ix * 2, iy * 3) > 0.46) {
          area.world[iy][ix] = 1;
          area.solids[iy][ix] = true;
        }
      }
    }
  }

  function scatterStones(area, x, y, w, h, amount) {
    let placed = 0;
    let safety = 0;
    while (placed < amount && safety < amount * 30) {
      safety += 1;
      const ix = x + Math.floor(Math.random() * w);
      const iy = y + Math.floor(Math.random() * h);
      if (area.world[iy][ix] !== 0 && area.world[iy][ix] !== 5 && area.world[iy][ix] !== 6 && area.world[iy][ix] !== 3) continue;
      area.world[iy][ix] = 4;
      area.solids[iy][ix] = true;
      placed += 1;
    }
  }

  function placeWaterPatch(area, x, y, w, h) {
    fillRect(area, x, y, w, h, 2, true);
    clearRect(area, x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), 2);
    fillRect(area, x, y, w, h, 2, true);
  }

  function spawnEnemy(area, data) {
    area.enemies.push({
      id: `${area.id}-${area.enemies.length + 1}`,
      x: data.x,
      y: data.y,
      w: data.w || 18,
      h: data.h || 18,
      speed: data.speed || 60,
      dir: data.dir || randomDir(),
      changeTimer: data.changeTimer || 0.4 + Math.random() * 1.2,
      chaseRadius: data.chaseRadius || 150,
      health: data.health || 1,
      maxHealth: data.health || 1,
      hurt: 0,
      dead: false,
      tint: data.tint || "moss",
      kbX: 0,
      kbY: 0,
      stun: 0,
      type: data.type || "slime",
      damage: data.damage || 1,
      touchPush: data.touchPush || 18,
    });
  }

  function buildOverworld() {
    const area = makeArea("overworld", "South Meadow", 100, 60, 0);

    for (let y = 0; y < area.height; y += 1) {
      for (let x = 0; x < area.width; x += 1) {
        const border = x === 0 || y === 0 || x === area.width - 1 || y === area.height - 1;
        if (border) {
          area.world[y][x] = 1;
          area.solids[y][x] = true;
          continue;
        }
        const n = seededNoise(x, y);
        if (n > 0.95) area.world[y][x] = 5;
        else if (n < 0.035) area.world[y][x] = 6;
      }
    }

    fillRect(area, 30, 7, 12, 8, 2, true);
    fillRect(area, 66, 34, 10, 7, 2, true);
    fillRect(area, 12, 38, 9, 6, 2, true);

    ring(area, 29, 6, 14, 10, 1, true);
    ring(area, 65, 33, 12, 9, 1, true);
    ring(area, 11, 37, 11, 8, 1, true);

    placeForestPatch(area, 72, 8, 14, 11);
    placeForestPatch(area, 44, 38, 16, 12);
    placeForestPatch(area, 6, 8, 10, 13);
    placeForestPatch(area, 86, 40, 7, 10);

    scatterStones(area, 18, 18, 18, 8, 10);
    scatterStones(area, 50, 18, 14, 9, 10);
    scatterStones(area, 78, 24, 11, 10, 8);

    carvePath(area, 6, 28, 92, 28, 3);
    carvePath(area, 18, 10, 18, 48, 3);
    carvePath(area, 53, 10, 53, 45, 3);
    carvePath(area, 74, 12, 74, 36, 3);

    clearRect(area, 48, 23, 5, 5, 0);
    clearRect(area, 71, 11, 7, 7, 0);

    area.interactables.push({
      type: "shrine",
      x: 50 * TILE,
      y: 25 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      active: false,
    });

    area.interactables.push({
      type: "sign",
      x: 16 * TILE,
      y: 25 * TILE,
      w: TILE,
      h: TILE,
      text: "Three doors, one depth. The cave, the arch, and the hatch all fall into the same ancient heart below.",
    });

    area.interactables.push({
      type: "triuneGate",
      x: 72 * TILE,
      y: 12 * TILE,
      w: TILE * 4,
      h: TILE * 3,
      targetAreaId: "dungeon1",
      targetSpawn: "entry",
      text: "The Triune Gate hums with old power.",
    });

    area.spawns.start = { x: 8.5 * TILE, y: 28.5 * TILE };
    area.spawns.fromDungeon = { x: 77.5 * TILE, y: 16.5 * TILE };

    const enemySpots = [
      [23, 18], [31, 20], [44, 12], [58, 18], [67, 24], [49, 34], [26, 39], [15, 16], [70, 14], [21, 47], [83, 29], [88, 18]
    ];
    enemySpots.forEach((spot, index) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 54 + (index % 3) * 11,
        chaseRadius: 132 + Math.random() * 64,
        health: index % 4 === 0 ? 2 : 1,
        tint: index % 2 === 0 ? "moss" : "ember",
      });
    });

    return area;
  }

  function buildDungeonRoom1() {
    const area = makeArea("dungeon1", "Triune Descent", 34, 20, 7);
    area.spawns.entry = { x: 4.5 * TILE, y: 16.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 16.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, 7);

    fillRect(area, 4, 4, 7, 5, 8, false);
    fillRect(area, 13, 3, 7, 6, 7, false);
    fillRect(area, 22, 4, 8, 5, 8, false);
    fillRect(area, 8, 11, 18, 6, 7, false);

    fillRect(area, 14, 0, 6, 2, 10, false);
    area.solids[0][16] = false;
    area.solids[1][16] = false;

    fillRect(area, 4, 15, 2, 2, 10, false);
    clearRect(area, 1, 15, 4, 3, 10);

    scatterDungeonColumns(area, 10, 11, 2, 2);
    scatterDungeonColumns(area, 18, 11, 2, 2);

    area.interactables.push({
      type: "returnSigil",
      x: 2 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: "fromDungeon",
      title: "Return to the meadow",
    });
    area.interactables.push({
      type: "roomGate",
      x: 15 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: "dungeon2",
      targetSpawn: "entry",
      requireClear: true,
      requireKey: true,
      title: "Runed lift",
      closedText: "The lift is sealed. Clear the room and claim the key.",
      openText: "The runed lift groans awake.",
    });
    area.interactables.push({
      type: "dungeonKeyPedestal",
      x: 16 * TILE,
      y: 9 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      taken: false,
    });

    [
      [11, 6], [20, 6], [9, 14], [24, 14], [17, 12]
    ].forEach((spot, idx) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 58 + (idx % 2) * 10,
        chaseRadius: 150,
        health: idx === 4 ? 2 : 1,
        tint: idx % 2 === 0 ? "moss" : "ember",
      });
    });

    return area;
  }

  function buildDungeonRoom2() {
    const area = makeArea("dungeon2", "Broken Reliquary", 36, 20, 8);
    area.spawns.entry = { x: 4.5 * TILE, y: 16.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 16.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, 8);
    fillRect(area, 1, 8, area.width - 2, 4, 7, false);
    fillRect(area, 13, 4, 10, 12, 12, false);
    fillRect(area, 8, 3, 3, 5, 9, true);
    fillRect(area, 25, 3, 3, 5, 9, true);
    fillRect(area, 8, 12, 3, 5, 9, true);
    fillRect(area, 25, 12, 3, 5, 9, true);

    fillRect(area, 15, 0, 6, 2, 10, false);
    area.solids[0][17] = false;
    area.solids[1][17] = false;

    clearRect(area, 1, 15, 4, 3, 10);

    area.interactables.push({
      type: "roomGate",
      x: 2 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "dungeon1",
      targetSpawn: "back",
      title: "Descent return",
      openText: "You step back toward the triune descent.",
    });
    area.interactables.push({
      type: "lockedSeal",
      x: 16 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: "dungeon3",
      targetSpawn: "entry",
      title: "Knight seal",
      text: "The seal wants a key and a quiet room.",
    });

    [
      [7, 6], [13, 9], [21, 9], [28, 6], [10, 14], [25, 14]
    ].forEach((spot, idx) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 60 + (idx % 3) * 8,
        chaseRadius: 160,
        health: idx % 3 === 0 ? 2 : 1,
        tint: idx % 2 === 0 ? "ember" : "moss",
      });
    });

    return area;
  }

  function buildDungeonRoom3() {
    const area = makeArea("dungeon3", "Knight's Reliquary", 38, 22, 7);
    area.spawns.entry = { x: 5.5 * TILE, y: 18.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, 7);
    fillRect(area, 8, 4, 22, 13, 8, false);
    fillRect(area, 15, 7, 8, 7, 12, false);
    fillRect(area, 16, 0, 6, 2, 10, false);
    area.solids[0][18] = false;
    area.solids[1][18] = false;
    clearRect(area, 1, 17, 5, 3, 10);
    scatterDungeonColumns(area, 11, 6, 2, 2);
    scatterDungeonColumns(area, 25, 6, 2, 2);
    scatterDungeonColumns(area, 11, 14, 2, 2);
    scatterDungeonColumns(area, 25, 14, 2, 2);

    area.interactables.push({
      type: "roomGate",
      x: 2 * TILE,
      y: 17 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "dungeon2",
      targetSpawn: "back",
      title: "Sealed stairs",
      openText: "You retreat through the opened seal.",
    });
    area.interactables.push({
      type: "rewardChest",
      x: 18 * TILE,
      y: 5 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      opened: false,
    });
    area.interactables.push({
      type: "exitPortal",
      x: 17 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: "fromDungeon",
      visible: false,
      title: "Relic ascent",
    });

    spawnEnemy(area, {
      x: 19.5 * TILE,
      y: 13.5 * TILE,
      w: 22,
      h: 22,
      speed: 70,
      chaseRadius: 250,
      health: 8,
      tint: "steel",
      type: "knight",
      damage: 2,
      touchPush: 28,
    });

    return area;
  }

  function scatterDungeonColumns(area, x, y, w, h) {
    fillRect(area, x, y, w, h, 9, true);
  }

  function buildAreas() {
    return {
      overworld: buildOverworld(),
      dungeon1: buildDungeonRoom1(),
      dungeon2: buildDungeonRoom2(),
      dungeon3: buildDungeonRoom3(),
    };
  }

  function makePlayer() {
    return {
      x: 0,
      y: 0,
      w: 18,
      h: 18,
      speed: 130,
      lastDir: { x: 0, y: 1 },
      attackCooldown: 0,
      attackTimer: 0,
      attackDir: { x: 0, y: 1 },
      slashHitIds: new Set(),
      health: 5,
      maxHealth: 5,
      invuln: 0,
      swordLevel: 1,
      damage: 1,
    };
  }

  function setArea(areaId, spawnKey = "start", snapCamera = false) {
    state.currentAreaId = areaId;
    const area = currentArea();
    state.zoneName = area.name;
    const spawn = area.spawns[spawnKey] || area.spawns.entry || area.spawns.start || { x: 5 * TILE, y: 5 * TILE };
    state.player.x = spawn.x;
    state.player.y = spawn.y;
    state.player.attackTimer = 0;
    state.player.attackCooldown = 0;
    state.player.slashHitIds.clear();
    updateObjective();
    updateHud();
    if (snapCamera) {
      state.camera.x = clamp(state.player.x - state.logicalWidth / 2, 0, area.width * TILE - state.logicalWidth);
      state.camera.y = clamp(state.player.y - state.logicalHeight / 2, 0, area.height * TILE - state.logicalHeight);
    }
    refreshDebugPanel();
  }

  function beginTransition(areaId, spawnKey, message = "") {
    if (state.transition.active) return;
    state.transition.active = true;
    state.transition.stage = "out";
    state.transition.alpha = 0;
    state.transition.targetAreaId = areaId;
    state.transition.targetSpawn = spawnKey;
    state.transition.targetMessage = message;
    setDebugAction(`transition-${state.currentAreaId}-to-${areaId}`);
  }

  function updateTransition(dt) {
    if (!state.transition.active) return;
    const speed = 2.8;
    if (state.transition.stage === "out") {
      state.transition.alpha = Math.min(1, state.transition.alpha + dt * speed);
      if (state.transition.alpha >= 1) {
        setArea(state.transition.targetAreaId, state.transition.targetSpawn, true);
        if (state.transition.targetMessage) setMessage(state.transition.targetMessage, 2.2);
        showAreaBanner(state.zoneName, state.currentAreaId.startsWith("dungeon") ? "Depth entered" : "Region entered", 2.3);
        state.transition.stage = "in";
      }
    } else if (state.transition.stage === "in") {
      state.transition.alpha = Math.max(0, state.transition.alpha - dt * speed);
      if (state.transition.alpha <= 0) {
        state.transition.active = false;
        state.transition.stage = "idle";
      }
    }
  }

  function updateObjective() {
    if (state.victory) {
      state.objectiveText = "Shrine rekindled. More dungeons can rise later.";
      return;
    }
    if (!state.dungeon.started) {
      state.objectiveText = "Find the Triune Gate and enter if you dare.";
    } else if (!state.dungeon.cleared) {
      if (state.currentAreaId === "dungeon1") state.objectiveText = state.dungeon.keyOwned ? "Take the runed lift upward." : "Clear the room and take the dungeon key.";
      else if (state.currentAreaId === "dungeon2") state.objectiveText = state.dungeon.sealUnlocked ? "Push deeper toward the knight." : "Quiet this chamber and open the Knight Seal.";
      else if (state.currentAreaId === "dungeon3") state.objectiveText = state.dungeon.rewardGranted ? "Take the relic ascent back to the shrine." : "Defeat the knight and claim a relic.";
      else state.objectiveText = "Return to the Triune Gate or finish clearing the field.";
    } else if (!state.dungeon.fieldCleared) {
      state.objectiveText = "The relic is yours. Clear the remaining field foes.";
    } else {
      state.objectiveText = "Return to the shrine and press Enter.";
    }
  }

  function updateHud() {
    renderHearts(state.player.health, state.player.maxHealth);
    const area = currentArea();
    enemiesValue.textContent = area ? area.enemies.filter((e) => !e.dead).length : 0;
    rupeesValue.textContent = formatRupees(state.rupees);
    zoneValue.textContent = state.zoneName;
    objectiveValue.textContent = state.objectiveText;
    rewardsValue.textContent = formatRewards();
    computeStatus();
  }

  function getTile(tx, ty) {
    const area = currentArea();
    if (tx < 0 || ty < 0 || tx >= area.width || ty >= area.height) return 9;
    return area.world[ty][tx];
  }

  function isSolidAtPixel(px, py) {
    const area = currentArea();
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= area.width || ty >= area.height) return true;
    return area.solids[ty][tx];
  }

  function collides(entity) {
    const left = entity.x - entity.w / 2 + 2;
    const right = entity.x + entity.w / 2 - 2;
    const top = entity.y - entity.h / 2 + 4;
    const bottom = entity.y + entity.h / 2 - 2;
    return (
      isSolidAtPixel(left, top) ||
      isSolidAtPixel(right, top) ||
      isSolidAtPixel(left, bottom) ||
      isSolidAtPixel(right, bottom)
    );
  }

  function moveWithCollision(entity, dx, dy) {
    if (dx !== 0) {
      entity.x += dx;
      if (collides(entity)) entity.x -= dx;
    }
    if (dy !== 0) {
      entity.y += dy;
      if (collides(entity)) entity.y -= dy;
    }
  }

  function rectsOverlap(a, b) {
    return (
      a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2
    );
  }

  function normalize(vx, vy) {
    const len = Math.hypot(vx, vy) || 1;
    return { x: vx / len, y: vy / len };
  }

  function randomDir() {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    return { ...dirs[Math.floor(Math.random() * dirs.length)] };
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = state.logicalWidth / rect.width;
    const scaleY = state.logicalHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX + state.camera.x,
      y: (clientY - rect.top) * scaleY + state.camera.y,
    };
  }

  function spawnPickup(area, x, y, kind = "rupeeGreen", value = 1) {
    area.pickups.push({
      x,
      y,
      w: 12,
      h: 12,
      kind,
      value,
      bob: Math.random() * Math.PI * 2,
      life: 18,
      collectDelay: 0.15,
      vx: (Math.random() - 0.5) * 36,
      vy: -18 - Math.random() * 16,
    });
  }

  function spawnRupeeDrop(area, x, y) {
    const blue = Math.random() > 0.82;
    spawnPickup(area, x, y, blue ? "rupeeBlue" : "rupeeGreen", blue ? 5 : 1);
  }

  function doAttack(direction) {
    const player = state.player;
    if (!state.running || state.victory || state.gameOver || state.transition.active) return;
    if (player.attackCooldown > 0 || player.attackTimer > 0) return;

    const dir = normalize(direction.x, direction.y);
    player.attackDir = dir;
    player.lastDir = dir;
    player.attackTimer = ATTACK_TIME;
    player.attackCooldown = ATTACK_COOLDOWN;
    player.slashHitIds.clear();

    addCameraShake(2.5, 0.08);
    for (let i = 0; i < 3; i += 1) {
      state.strikeDust.push({
        x: player.x + dir.x * (16 + i * 5),
        y: player.y + dir.y * (16 + i * 5),
        life: 0.16 + i * 0.02,
        maxLife: 0.2,
        dir,
      });
    }
  }

  function currentSlashBox() {
    const p = state.player;
    if (p.attackTimer <= 0) return null;
    const reach = 30;
    return {
      x: p.x + p.attackDir.x * reach,
      y: p.y + p.attackDir.y * reach,
      w: 30 + Math.abs(p.attackDir.y) * 10,
      h: 30 + Math.abs(p.attackDir.x) * 10,
    };
  }

  function damageEnemy(area, enemy, player) {
    enemy.health -= player.damage;
    enemy.hurt = 0.18;
    enemy.stun = enemy.type === "knight" ? 0.08 : 0.14;
    const knock = normalize(enemy.x - player.x, enemy.y - player.y);
    const push = enemy.type === "knight" ? 88 : 122;
    enemy.kbX = knock.x * push;
    enemy.kbY = knock.y * push;
    addCameraShake(enemy.health <= 0 ? 5 : 3.6, enemy.health <= 0 ? 0.2 : 0.12);

    for (let i = 0; i < 4; i += 1) {
      spawnSpark(enemy.x + (Math.random() - 0.5) * 8, enemy.y + (Math.random() - 0.5) * 8, enemy.type === "knight" ? "#d7e8ff" : enemy.tint === "ember" ? "#ffb05a" : "#9df58e");
    }

    if (enemy.health <= 0) {
      enemy.dead = true;
      spawnRupeeDrop(area, enemy.x, enemy.y);
      if (enemy.type === "knight") {
        burst(enemy.x, enemy.y, ["#d7e8ff", "#ffffff", "#f6d86f"]);
      } else {
        burst(enemy.x, enemy.y, enemy.tint === "ember" ? ["#ffb25e", "#fff0c2", "#ffe1aa"] : ["#98f58d", "#d7ffd0", "#fff6c2"]);
      }
      onAreaEnemiesCleared(area);
    }
  }

  function onAreaEnemiesCleared(area) {
    if (area.enemies.some((enemy) => !enemy.dead)) return;

    if (area.id === "overworld" && !state.dungeon.fieldCleared) {
      state.dungeon.fieldCleared = true;
      showAreaBanner("Field Cleared", "South Meadow", 2.8);
      setMessage(state.dungeon.cleared ? "The meadow is quiet. Return to the shrine." : "The meadow is quiet. The shrine still waits for a relic from below.", 4);
      addCameraShake(4, 0.24);
    }

    if (area.id === "dungeon1" && !state.dungeon.roomClears.dungeon1) {
      state.dungeon.roomClears.dungeon1 = true;
      const pedestal = area.interactables.find((i) => i.type === "dungeonKeyPedestal");
      if (pedestal) pedestal.visible = true;
      showAreaBanner("Room Cleared", "Triune Descent", 2.2);
      setMessage("A key rises from the pedestal. Claim it.", 3.2);
    }

    if (area.id === "dungeon2" && !state.dungeon.roomClears.dungeon2) {
      state.dungeon.roomClears.dungeon2 = true;
      showAreaBanner("Reliquary Quieted", "Broken Reliquary", 2.2);
      setMessage("The Knight Seal can now be opened with your key.", 3.2);
    }

    if (area.id === "dungeon3" && !state.dungeon.roomClears.dungeon3) {
      state.dungeon.roomClears.dungeon3 = true;
      const chest = area.interactables.find((i) => i.type === "rewardChest");
      if (chest) chest.visible = true;
      showAreaBanner("Knight Fallen", "Knight's Reliquary", 2.6);
      setMessage("The chest has unsealed. Claim your relic.", 3.4);
    }

    updateObjective();
    updateHud();
  }

  function grantReward() {
    const rewardPool = ["Heart Vessel", "Blade Crest", "Ancient Gem"];
    const choices = rewardPool.filter((reward) => !state.rewardsOwned.includes(reward));
    const reward = choices[Math.floor(Math.random() * choices.length)] || rewardPool[Math.floor(Math.random() * rewardPool.length)];
    state.rewardsOwned.push(reward);
    state.dungeon.currentReward = reward;
    state.dungeon.rewardGranted = true;
    state.dungeon.cleared = true;

    if (reward === "Heart Vessel") {
      state.player.maxHealth += 1;
      state.player.health = state.player.maxHealth;
    } else if (reward === "Blade Crest") {
      state.player.swordLevel += 1;
      state.player.damage += 1;
    } else if (reward === "Ancient Gem") {
      state.rupees += 25;
    }

    const exitPortal = currentArea().interactables.find((i) => i.type === "exitPortal");
    if (exitPortal) exitPortal.visible = true;

    showAreaBanner("Relic Claimed", reward, 3);
    setMessage(`${reward} obtained. The ascent gate is now awake.`, 4);
    updateObjective();
    updateHud();
  }

  function interact() {
    if (!state.running || state.transition.active) return;
    const p = state.player;
    const area = currentArea();

    for (const item of area.interactables) {
      if (item.visible === false) continue;
      const box = { x: item.x + item.w / 2, y: item.y + item.h / 2, w: item.w + 20, h: item.h + 20 };
      if (!rectsOverlap(p, box)) continue;

      if (item.type === "sign") {
        setMessage(item.text, 3.5);
        return;
      }

      if (item.type === "shrine") {
        if (!state.dungeon.cleared) {
          setMessage("The shrine feels a missing relic. Something below still calls.", 3);
          return;
        }
        if (!state.dungeon.fieldCleared) {
          const alive = area.enemies.filter((e) => !e.dead).length;
          setMessage(`The shrine still hears ${alive} field foe${alive === 1 ? "" : "s"}.`, 3);
          return;
        }
        item.active = true;
        state.victory = true;
        state.running = false;
        addCameraShake(6, 0.35);
        showAreaBanner("Shrine Rekindled", "Victory", 3.4);
        burst(item.x + item.w / 2, item.y + item.h / 2, ["#d8ecff", "#93b9ff", "#fff3af"]);
        startCard.hidden = false;
        startButton.hidden = true;
        restartButton.hidden = false;
        startTitle.textContent = "Elderfield Rekindled";
        startText.textContent = `You cut down the meadow's threats, broke through the Triune Gate, defeated the knight below, and claimed ${state.dungeon.currentReward || "a relic"}.`;
        setMessage(`Victory. Relic: ${state.dungeon.currentReward || "unknown"} • Rupees: ${state.rupees}.`, 4.4);
        updateObjective();
        updateHud();
        return;
      }

      if (item.type === "triuneGate") {
        state.dungeon.started = true;
        updateObjective();
        beginTransition(item.targetAreaId, item.targetSpawn, "The mixed gate folds into a single ancient descent.");
        return;
      }

      if (item.type === "returnSigil") {
        beginTransition(item.targetAreaId, item.targetSpawn, "The sigil breathes you back into the meadow.");
        return;
      }

      if (item.type === "roomGate") {
        if (item.requireClear && area.enemies.some((enemy) => !enemy.dead)) {
          setMessage(item.closedText || "The way forward is still barred.", 2.6);
          return;
        }
        if (item.requireKey && !state.dungeon.keyOwned) {
          setMessage("The gate wants the dungeon key.", 2.4);
          return;
        }
        beginTransition(item.targetAreaId, item.targetSpawn, item.openText || "You push deeper into the ruins.");
        return;
      }

      if (item.type === "lockedSeal") {
        if (area.enemies.some((enemy) => !enemy.dead)) {
          setMessage("The room is too loud. The seal refuses to answer.", 2.6);
          return;
        }
        if (!state.dungeon.keyOwned && !state.dungeon.sealUnlocked) {
          setMessage("The Knight Seal needs the dungeon key.", 2.6);
          return;
        }
        state.dungeon.sealUnlocked = true;
        beginTransition(item.targetAreaId, item.targetSpawn, "The seal parts. Cold steel waits ahead.");
        return;
      }

      if (item.type === "dungeonKeyPedestal") {
        if (!item.visible || item.taken) return;
        item.taken = true;
        item.visible = false;
        state.dungeon.keyOwned = true;
        burst(item.x + item.w / 2, item.y + item.h / 2, ["#f6d86f", "#ffffff"]);
        showAreaBanner("Dungeon Key", "Triune Descent", 2.2);
        setMessage("Dungeon Key obtained. The runed lift can now answer you.", 3.2);
        updateObjective();
        updateHud();
        return;
      }

      if (item.type === "rewardChest") {
        if (!item.visible) {
          setMessage("The chest is sealed by the knight's presence.", 2.4);
          return;
        }
        if (item.opened) {
          setMessage(`The chest stands open. ${state.dungeon.currentReward || "The relic"} is already yours.`, 2.4);
          return;
        }
        item.opened = true;
        grantReward();
        return;
      }

      if (item.type === "exitPortal") {
        if (!item.visible) {
          setMessage("The ascent is still asleep.", 2.4);
          return;
        }
        beginTransition(item.targetAreaId, item.targetSpawn, "Relic in hand, you rise back to the field.");
        return;
      }
    }

    setMessage("Nothing here answers you.", 1.4);
  }

  function updatePlayer(dt) {
    const p = state.player;
    const area = currentArea();

    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.invuln = Math.max(0, p.invuln - dt);

    let mx = 0;
    let my = 0;
    if (keys.KeyA || keys.ArrowLeft || touchState.left) mx -= 1;
    if (keys.KeyD || keys.ArrowRight || touchState.right) mx += 1;
    if (keys.KeyW || keys.ArrowUp || touchState.up) my -= 1;
    if (keys.KeyS || keys.ArrowDown || touchState.down) my += 1;

    if (mx !== 0 || my !== 0) {
      const dir = normalize(mx, my);
      p.lastDir = dir;
      const speed = p.attackTimer > 0 ? p.speed * 0.62 : p.speed;
      moveWithCollision(p, dir.x * speed * dt, dir.y * speed * dt);
    }

    const slash = currentSlashBox();
    if (slash) {
      for (const enemy of area.enemies) {
        if (enemy.dead || p.slashHitIds.has(enemy.id)) continue;
        if (rectsOverlap({ ...slash }, enemy)) {
          p.slashHitIds.add(enemy.id);
          damageEnemy(area, enemy, p);
        }
      }
    }

    for (let i = area.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = area.pickups[i];
      if (pickup.collectDelay > 0) continue;
      if (!rectsOverlap(p, pickup)) continue;

      if (pickup.kind === "rupeeGreen" || pickup.kind === "rupeeBlue") {
        state.rupees += pickup.value;
        burst(pickup.x, pickup.y, pickup.kind === "rupeeBlue" ? ["#7ac8ff", "#d8f1ff"] : ["#7de46e", "#eaffd8"]);
        setDebugAction(`pickup-${pickup.kind}`);
      }

      area.pickups.splice(i, 1);
      addCameraShake(1.2, 0.06);
      updateHud();
    }

    for (const enemy of area.enemies) {
      if (enemy.dead) continue;
      if (rectsOverlap(p, enemy) && p.invuln <= 0) {
        p.health -= enemy.damage || 1;
        p.invuln = INVULN_TIME;
        const shove = normalize(p.x - enemy.x, p.y - enemy.y);
        moveWithCollision(p, shove.x * (enemy.touchPush || 18), shove.y * (enemy.touchPush || 18));
        addCameraShake(enemy.type === "knight" ? 5 : 4.2, 0.16);
        burst(p.x, p.y, enemy.type === "knight" ? ["#ffe1aa", "#ffe3e3"] : ["#ff8a8a", "#ffe3e3"]);
        if (p.health <= 0) {
          p.health = 0;
          state.gameOver = true;
          state.running = false;
          startCard.hidden = false;
          startButton.hidden = true;
          restartButton.hidden = false;
          startTitle.textContent = "Felled in Elderfield";
          startText.textContent = `You reached ${state.zoneName} and gathered ${state.rupees} rupee${state.rupees === 1 ? "" : "s"}. The knight will still be waiting.`;
          setMessage("You were overwhelmed. Reset and take a cleaner line.", 4);
        }
        updateHud();
      }
    }
  }

  function updateEnemies(dt) {
    const area = currentArea();
    const p = state.player;
    for (const enemy of area.enemies) {
      if (enemy.dead) continue;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.changeTimer -= dt;
      enemy.stun = Math.max(0, enemy.stun - dt);

      if (Math.abs(enemy.kbX) > 1 || Math.abs(enemy.kbY) > 1) {
        moveWithCollision(enemy, enemy.kbX * dt, enemy.kbY * dt);
        enemy.kbX *= 0.82;
        enemy.kbY *= 0.82;
      }

      if (enemy.stun > 0) continue;

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      let dir = enemy.dir;
      let speed = enemy.speed;

      if (enemy.type === "knight") {
        if (dist < enemy.chaseRadius) {
          if (dist > 48) {
            dir = normalize(dx, dy);
          } else {
            dir = normalize(-dy, dx);
          }
          speed *= dist < 120 ? 1.18 : 0.96;
        } else if (enemy.changeTimer <= 0) {
          enemy.dir = randomDir();
          enemy.changeTimer = 0.75 + Math.random() * 1.1;
          dir = enemy.dir;
        }
      } else if (dist < enemy.chaseRadius) {
        dir = normalize(dx, dy);
        speed *= 1.25;
      } else if (enemy.changeTimer <= 0) {
        enemy.dir = randomDir();
        enemy.changeTimer = 0.65 + Math.random() * 1.25;
        dir = enemy.dir;
      }

      moveWithCollision(enemy, dir.x * speed * dt, dir.y * speed * dt);
      if (collides(enemy)) enemy.dir = randomDir();
    }
  }

  function updatePickupsAndParticles(dt) {
    for (const bucket of [state.particles, state.strikeDust]) {
      for (let i = bucket.length - 1; i >= 0; i -= 1) {
        const p = bucket[i];
        p.life -= dt;
        if (p.dir) {
          p.x += p.dir.x * 48 * dt;
          p.y += p.dir.y * 48 * dt;
        }
        if (p.vx) p.x += p.vx * dt;
        if (p.vy) p.y += p.vy * dt;
        if (p.life <= 0) bucket.splice(i, 1);
      }
    }

    const area = currentArea();
    for (let i = area.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = area.pickups[i];
      pickup.life -= dt;
      pickup.collectDelay = Math.max(0, pickup.collectDelay - dt);
      pickup.bob += dt * 5;
      pickup.vx *= 0.92;
      pickup.vy += 40 * dt;
      pickup.vy *= 0.92;
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      if (pickup.life <= 0) area.pickups.splice(i, 1);
    }
  }

  function burst(x, y, palette) {
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.35;
      const speed = 26 + Math.random() * 42;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.28 + Math.random() * 0.16,
        maxLife: 0.42,
        color: palette[i % palette.length],
      });
    }
  }

  function spawnSpark(x, y, color) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 0.18,
      maxLife: 0.18,
      color,
    });
  }

  function updateCamera(dt) {
    const area = currentArea();
    const maxX = Math.max(0, area.width * TILE - state.logicalWidth);
    const maxY = Math.max(0, area.height * TILE - state.logicalHeight);
    const targetX = clamp(state.player.x - state.logicalWidth / 2, 0, maxX);
    const targetY = clamp(state.player.y - state.logicalHeight / 2, 0, maxY);
    const lerp = 1 - Math.pow(0.001, dt * 2.2);
    state.camera.x += (targetX - state.camera.x) * lerp;
    state.camera.y += (targetY - state.camera.y) * lerp;

    if (state.cameraShake.time > 0) {
      state.cameraShake.time = Math.max(0, state.cameraShake.time - dt);
      state.camera.x += (Math.random() - 0.5) * state.cameraShake.power;
      state.camera.y += (Math.random() - 0.5) * state.cameraShake.power;
      state.cameraShake.power *= 0.82;
    } else {
      state.cameraShake.power = 0;
    }

    state.camera.x = clamp(state.camera.x, 0, maxX);
    state.camera.y = clamp(state.camera.y, 0, maxY);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function updateDiagnostics(dt) {
    state.debug.fpsFrames += 1;
    state.debug.fpsTime += dt;
    if (state.debug.fpsTime >= 0.4) {
      state.debug.fps = Math.round(state.debug.fpsFrames / state.debug.fpsTime);
      state.debug.fpsFrames = 0;
      state.debug.fpsTime = 0;
    }
    computeStatus();
    if (state.debug.enabled) refreshDebugPanel();
  }

  function draw() {
    ctx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);
    drawGround();
    drawWorldObjects();
    drawInteractables();
    drawPickups();
    drawEnemies();
    drawPlayer();
    drawEffects();
    drawDebug();
    drawVignette();
    drawTransition();
  }

  function drawGround() {
    const area = currentArea();
    const startX = Math.floor(state.camera.x / TILE);
    const startY = Math.floor(state.camera.y / TILE);
    const endX = Math.ceil((state.camera.x + state.logicalWidth) / TILE) + 1;
    const endY = Math.ceil((state.camera.y + state.logicalHeight) / TILE) + 1;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        if (x < 0 || y < 0 || x >= area.width || y >= area.height) continue;
        const tile = area.world[y][x];
        const sx = x * TILE - state.camera.x;
        const sy = y * TILE - state.camera.y;
        drawTile(tile, sx, sy, x, y, area.theme);
      }
    }
  }

  function drawTile(tile, sx, sy, x, y, theme) {
    switch (tile) {
      case 0:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#5f9b49" : "#6aa952";
        ctx.fillRect(sx, sy, TILE, TILE);
        if (seededNoise(x * 4, y * 3) > 0.72) {
          ctx.fillStyle = "#80c661";
          ctx.fillRect(sx + 4, sy + 6, 2, 4);
          ctx.fillRect(sx + 10, sy + 9, 2, 5);
          ctx.fillRect(sx + 16, sy + 5, 2, 4);
        }
        break;
      case 1:
        ctx.fillStyle = "#2f6a35";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#1f4f29";
        ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = "#7b4d28";
        ctx.fillRect(sx + 10, sy + 14, 4, 8);
        ctx.fillStyle = "#4ea451";
        ctx.fillRect(sx + 5, sy + 4, 14, 10);
        ctx.fillRect(sx + 3, sy + 8, 18, 6);
        break;
      case 2:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#2e7fa4" : "#286f93";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#74bedb";
        ctx.fillRect(sx + 2, sy + 5, 8, 2);
        ctx.fillRect(sx + 12, sy + 11, 7, 2);
        ctx.fillRect(sx + 7, sy + 16, 10, 2);
        break;
      case 3:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#c5a86b" : "#b79558";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(105, 67, 32, 0.18)";
        ctx.fillRect(sx + 6, sy, 2, TILE);
        ctx.fillRect(sx + 14, sy, 2, TILE);
        break;
      case 4:
        ctx.fillStyle = "#5d666f";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#79848e";
        ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = "#bac5cf";
        ctx.fillRect(sx + 7, sy + 6, 4, 3);
        break;
      case 5:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#679f50" : "#73ac5b";
        ctx.fillRect(sx, sy, TILE, TILE);
        drawFlower(sx + 8, sy + 8, "#ffd86e");
        drawFlower(sx + 14, sy + 14, "#fff5a8");
        break;
      case 6:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#5e9949" : "#6ca853";
        ctx.fillRect(sx, sy, TILE, TILE);
        drawFlower(sx + 9, sy + 7, "#e9d3ff");
        drawFlower(sx + 15, sy + 13, "#ffd2ea");
        break;
      case 7:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#4e4a42" : "#585248";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(sx + 3, sy + 4, 5, 1);
        ctx.fillRect(sx + 12, sy + 10, 6, 1);
        break;
      case 8:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#61574a" : "#6b6154";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#928369";
        ctx.fillRect(sx + 6, sy + 6, 3, 3);
        ctx.fillRect(sx + 14, sy + 13, 3, 3);
        break;
      case 9:
        ctx.fillStyle = theme === "dungeon" ? "#272831" : "#314239";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = theme === "dungeon" ? "#3a3c47" : "#455a4d";
        ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(sx + 5, sy + 5, 4, 2);
        break;
      case 10:
        ctx.fillStyle = "#1c1f26";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#6fb7ff";
        ctx.fillRect(sx + 9, sy + 2, 6, TILE - 4);
        ctx.fillRect(sx + 3, sy + 9, TILE - 6, 6);
        ctx.fillStyle = "rgba(180,220,255,0.2)";
        ctx.fillRect(sx + 6, sy + 6, 12, 12);
        break;
      case 12:
        ctx.fillStyle = "#4a433d";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + 7);
        ctx.lineTo(sx + 11, sy + 13);
        ctx.lineTo(sx + 16, sy + 9);
        ctx.stroke();
        break;
      default:
        ctx.fillStyle = "magenta";
        ctx.fillRect(sx, sy, TILE, TILE);
    }
  }

  function drawFlower(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x, y + 4, 2, 2);
    ctx.fillStyle = "#3b7f34";
    ctx.fillRect(x + 1, y + 6, 2, 3);
  }

  function drawWorldObjects() {
    const area = currentArea();
    for (let y = 0; y < area.height; y += 1) {
      for (let x = 0; x < area.width; x += 1) {
        const tile = area.world[y][x];
        if (![1, 4, 9].includes(tile)) continue;
        const sx = x * TILE - state.camera.x;
        const sy = y * TILE - state.camera.y;
        if (sx < -TILE || sy < -TILE || sx > state.logicalWidth || sy > state.logicalHeight) continue;
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.fillRect(sx + 4, sy + 18, 16, 3);
      }
    }
  }

  function drawInteractables() {
    const area = currentArea();
    for (const item of area.interactables) {
      if (item.visible === false) continue;
      const sx = item.x - state.camera.x;
      const sy = item.y - state.camera.y;
      if (sx > state.logicalWidth + 40 || sy > state.logicalHeight + 40 || sx + item.w < -40 || sy + item.h < -40) continue;

      if (item.type === "sign") {
        ctx.fillStyle = "#8b5c31";
        ctx.fillRect(sx + 10, sy + 10, 4, 10);
        ctx.fillStyle = "#dcb97a";
        ctx.fillRect(sx + 6, sy + 3, 12, 9);
        ctx.fillStyle = "#6e4b2a";
        ctx.fillRect(sx + 8, sy + 5, 8, 2);
      } else if (item.type === "shrine") {
        const glow = state.dungeon.cleared && state.dungeon.fieldCleared || item.active;
        const pulse = 0.55 + Math.sin(performance.now() / 220) * 0.25;
        ctx.fillStyle = glow ? "#93b9ff" : "#7f857f";
        ctx.fillRect(sx + 6, sy + 6, 36, 8);
        ctx.fillRect(sx + 10, sy + 14, 28, 22);
        ctx.fillStyle = glow ? "#d8ecff" : "#adb4aa";
        ctx.fillRect(sx + 18, sy + 18, 12, 12);
        if (glow) {
          ctx.fillStyle = `rgba(150, 210, 255, ${0.18 + pulse * 0.25})`;
          ctx.fillRect(sx + 12, sy + 12, 24, 24);
          ctx.fillStyle = `rgba(255, 243, 176, ${0.08 + pulse * 0.12})`;
          ctx.fillRect(sx + 8, sy + 8, 32, 32);
        }
      } else if (item.type === "triuneGate") {
        const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.2;
        ctx.fillStyle = "#19140f";
        ctx.fillRect(sx + 2, sy + 16, 24, 16);
        ctx.fillStyle = "#3d3b37";
        ctx.fillRect(sx + 30, sy + 8, 18, 24);
        ctx.fillStyle = "#726a5c";
        ctx.fillRect(sx + 33, sy + 12, 12, 16);
        ctx.fillStyle = "#26374e";
        ctx.fillRect(sx + 56, sy + 16, 20, 14);
        ctx.fillStyle = "#5ca6e1";
        ctx.fillRect(sx + 60, sy + 18, 12, 10);
        ctx.fillStyle = `rgba(110, 190, 255, ${0.14 + pulse * 0.2})`;
        ctx.fillRect(sx + 26, sy + 8, 28, 24);
      } else if (item.type === "returnSigil" || item.type === "exitPortal") {
        const pulse = 0.4 + Math.sin(performance.now() / 200) * 0.2;
        ctx.fillStyle = "#18212f";
        ctx.fillRect(sx + 3, sy + 3, item.w - 6, item.h - 6);
        ctx.fillStyle = `rgba(120, 180, 255, ${0.2 + pulse * 0.25})`;
        ctx.fillRect(sx + 7, sy + 7, item.w - 14, item.h - 14);
      } else if (item.type === "roomGate" || item.type === "lockedSeal") {
        const isOpen = item.type === "roomGate"
          ? !item.requireClear || !area.enemies.some((enemy) => !enemy.dead)
          : state.dungeon.sealUnlocked || (state.dungeon.keyOwned && !area.enemies.some((enemy) => !enemy.dead));
        ctx.fillStyle = isOpen ? "#7ab7ff" : "#4f4d63";
        ctx.fillRect(sx + 4, sy + 4, item.w - 8, item.h - 4);
        ctx.fillStyle = isOpen ? "#d4e9ff" : "#8a8896";
        ctx.fillRect(sx + 8, sy + 8, item.w - 16, item.h - 12);
      } else if (item.type === "dungeonKeyPedestal") {
        ctx.fillStyle = "#5c5449";
        ctx.fillRect(sx + 8, sy + 12, 32, 12);
        ctx.fillStyle = "#f6d86f";
        ctx.fillRect(sx + 20, sy + 2, 8, 12);
        ctx.fillRect(sx + 28, sy + 6, 8, 4);
      } else if (item.type === "rewardChest") {
        ctx.fillStyle = "#5a3520";
        ctx.fillRect(sx + 6, sy + 10, 36, 16);
        ctx.fillStyle = "#d6b66f";
        ctx.fillRect(sx + 10, sy + 14, 28, 8);
        if (item.opened) {
          ctx.fillStyle = "#f6d86f";
          ctx.fillRect(sx + 14, sy + 6, 20, 4);
        }
      }
    }
  }

  function drawPickups() {
    const area = currentArea();
    for (const pickup of area.pickups) {
      const sx = pickup.x - state.camera.x;
      const sy = pickup.y - state.camera.y + Math.sin(pickup.bob) * 2;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx - 4, sy + 6, 8, 2);
      if (pickup.kind === "rupeeBlue") {
        ctx.fillStyle = "#67b8ff";
        ctx.fillRect(sx - 4, sy - 6, 8, 12);
        ctx.fillStyle = "#d8f1ff";
        ctx.fillRect(sx - 2, sy - 4, 4, 8);
      } else {
        ctx.fillStyle = "#67db58";
        ctx.fillRect(sx - 4, sy - 6, 8, 12);
        ctx.fillStyle = "#e6ffd8";
        ctx.fillRect(sx - 2, sy - 4, 4, 8);
      }
    }
  }

  function drawEnemies() {
    const area = currentArea();
    for (const enemy of area.enemies) {
      if (enemy.dead) continue;
      const sx = enemy.x - state.camera.x;
      const sy = enemy.y - state.camera.y;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx - 7, sy + 8, 14, 3);

      if (enemy.type === "knight") {
        const hurtFlash = enemy.hurt > 0 ? "#ffffff" : "#7684a8";
        ctx.fillStyle = hurtFlash;
        ctx.fillRect(sx - 9, sy - 8, 18, 18);
        ctx.fillStyle = "#c8d3ef";
        ctx.fillRect(sx - 6, sy - 5, 12, 8);
        ctx.fillStyle = "#2a3152";
        ctx.fillRect(sx - 7, sy + 3, 14, 7);
        ctx.fillStyle = "#f0d987";
        ctx.fillRect(sx - 2, sy - 12, 4, 4);
        ctx.fillStyle = "#161616";
        ctx.fillRect(sx - 4, sy - 3, 2, 2);
        ctx.fillRect(sx + 2, sy - 3, 2, 2);
        ctx.fillStyle = "#d7e8ff";
        ctx.fillRect(sx + 8, sy - 5, 3, 14);
      } else {
        const main = enemy.tint === "moss" ? "#67c364" : "#df8a49";
        const alt = enemy.tint === "moss" ? "#b3f29d" : "#ffd8a2";
        const hurtFlash = enemy.hurt > 0 ? "#ffffff" : main;
        ctx.fillStyle = hurtFlash;
        ctx.fillRect(sx - 8, sy - 6, 16, 14);
        ctx.fillStyle = alt;
        ctx.fillRect(sx - 5, sy - 3, 10, 7);
        ctx.fillStyle = "#161616";
        ctx.fillRect(sx - 4, sy - 1, 2, 2);
        ctx.fillRect(sx + 2, sy - 1, 2, 2);
        ctx.fillRect(sx - 6, sy + 4, 2, 3);
        ctx.fillRect(sx + 4, sy + 4, 2, 3);
      }

      if (enemy.health > 1) {
        ctx.fillStyle = "#fff6c2";
        const width = enemy.type === "knight" ? 14 : 4;
        ctx.fillRect(sx - Math.floor(width / 2), sy - 13, width, 3);
      }
    }
  }

  function drawPlayer() {
    const p = state.player;
    const sx = p.x - state.camera.x;
    const sy = p.y - state.camera.y;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;
    if (!blink) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx - 7, sy + 9, 14, 3);

      ctx.fillStyle = "#f2d3ab";
      ctx.fillRect(sx - 5, sy - 7, 10, 10);
      ctx.fillStyle = "#1f6d40";
      ctx.fillRect(sx - 7, sy - 11, 14, 6);
      ctx.fillRect(sx - 3, sy - 3, 10, 4);
      ctx.fillStyle = "#e7f0cb";
      ctx.fillRect(sx - 6, sy + 1, 12, 8);
      ctx.fillStyle = "#9d6c2e";
      ctx.fillRect(sx - 5, sy + 9, 4, 7);
      ctx.fillRect(sx + 1, sy + 9, 4, 7);
      ctx.fillStyle = "#523625";
      ctx.fillRect(sx - 4, sy - 2, 2, 2);
      ctx.fillRect(sx + 2, sy - 2, 2, 2);
    }

    if (p.attackTimer > 0) drawSlashEffect(sx, sy, p.attackDir, p.attackTimer / ATTACK_TIME);
  }

  function drawSlashEffect(sx, sy, dir, t) {
    const alpha = clamp(t, 0, 1);
    const reach = 16;
    const px = sx + dir.x * reach;
    const py = sy + dir.y * reach;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (Math.abs(dir.x) > Math.abs(dir.y)) {
      ctx.fillStyle = "#fff4ce";
      ctx.fillRect(px + (dir.x > 0 ? 0 : -20), py - 4, 20, 8);
      ctx.fillStyle = "#f6d86f";
      ctx.fillRect(px + (dir.x > 0 ? 2 : -18), py - 2, 16, 4);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px + (dir.x > 0 ? 17 : -22), py - 2, 6, 4);
    } else {
      ctx.fillStyle = "#fff4ce";
      ctx.fillRect(px - 4, py + (dir.y > 0 ? 0 : -20), 8, 20);
      ctx.fillStyle = "#f6d86f";
      ctx.fillRect(px - 2, py + (dir.y > 0 ? 2 : -18), 4, 16);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px - 2, py + (dir.y > 0 ? 17 : -22), 4, 6);
    }
    ctx.restore();
  }

  function drawEffects() {
    for (const dust of state.strikeDust) {
      const sx = dust.x - state.camera.x;
      const sy = dust.y - state.camera.y;
      ctx.save();
      ctx.globalAlpha = dust.life / dust.maxLife;
      ctx.fillStyle = "#fff8df";
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
      ctx.fillStyle = "#f6d86f";
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.restore();
    }

    for (const particle of state.particles) {
      const sx = particle.x - state.camera.x;
      const sy = particle.y - state.camera.y;
      ctx.save();
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color || "white";
      ctx.fillRect(sx, sy, 3, 3);
      ctx.restore();
    }
  }

  function drawDebug() {
    if (!state.debug.hitboxes || !state.player) return;
    const area = currentArea();
    ctx.save();
    ctx.lineWidth = 1;

    const p = state.player;
    ctx.strokeStyle = "#67e67f";
    ctx.strokeRect(Math.round(p.x - p.w / 2 - state.camera.x) + 0.5, Math.round(p.y - p.h / 2 - state.camera.y) + 0.5, p.w, p.h);

    const slash = currentSlashBox();
    if (slash) {
      ctx.strokeStyle = "#f4cf68";
      ctx.strokeRect(Math.round(slash.x - slash.w / 2 - state.camera.x) + 0.5, Math.round(slash.y - slash.h / 2 - state.camera.y) + 0.5, slash.w, slash.h);
    }

    for (const enemy of area.enemies) {
      if (enemy.dead) continue;
      const ex = enemy.x - state.camera.x;
      const ey = enemy.y - state.camera.y;
      ctx.strokeStyle = "#f57b7b";
      ctx.strokeRect(Math.round(ex - enemy.w / 2) + 0.5, Math.round(ey - enemy.h / 2) + 0.5, enemy.w, enemy.h);
      ctx.strokeStyle = "rgba(245, 207, 104, 0.3)";
      ctx.beginPath();
      ctx.arc(ex, ey, enemy.chaseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const item of area.interactables) {
      if (item.visible === false) continue;
      ctx.strokeStyle = "#7ab7ff";
      ctx.strokeRect(Math.round(item.x - state.camera.x) + 0.5, Math.round(item.y - state.camera.y) + 0.5, item.w, item.h);
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.min(state.logicalWidth, state.logicalHeight) * 0.28,
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.max(state.logicalWidth, state.logicalHeight) * 0.82,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  }

  function drawTransition() {
    if (!state.transition.active && state.transition.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(state.transition.alpha, 0, 1);
    ctx.fillStyle = "#040608";
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    ctx.restore();
  }

  function loop(ts) {
    if (!state.lastTime) state.lastTime = ts;
    let dt = (ts - state.lastTime) / 1000;
    state.lastTime = ts;
    dt = Math.min(dt, 0.033);

    if (state.areaBannerTimer > 0) {
      state.areaBannerTimer = Math.max(0, state.areaBannerTimer - dt);
      if (state.areaBannerTimer === 0) areaBanner.hidden = true;
    }

    if (state.messageTimer > 0) {
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      if (state.messageTimer === 0 && state.running && !state.victory && !state.gameOver) {
        messageBox.textContent = state.objectiveText;
      }
    }

    if (state.running && !state.transition.active) {
      updatePlayer(dt);
      updateEnemies(dt);
    }
    updatePickupsAndParticles(dt);
    updateTransition(dt);
    updateCamera(dt);
    updateDiagnostics(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function init() {
    syncBuildStamp();
    resizeCanvas();
    state.player = makePlayer();
    state.areas = buildAreas();
    setArea("overworld", "start", true);
    setMessage("Press Start, move with WASD, click or tap to slash, Enter to interact.", 999);
    computeStatus();
    refreshDebugPanel();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    computeStatus();
    refreshDebugPanel();
  });

  window.addEventListener("keydown", (event) => {
    const debugKeys = ["F3", "Backquote", "F4", "F6", "KeyH", "F8"];
    if (debugKeys.includes(event.code)) event.preventDefault();

    if (event.code === "F3" || event.code === "Backquote") {
      toggleDebug();
      return;
    }
    if (event.code === "F4") {
      toggleHitboxes();
      return;
    }
    if (event.code === "F6") {
      clearAllEnemies();
      return;
    }
    if (event.code === "KeyH") {
      healPlayer();
      return;
    }
    if (event.code === "F8") {
      resetGame();
      setMessage("Field reset.", 1.5);
      return;
    }

    keys[event.code] = true;
    if (event.code === "Enter") {
      event.preventDefault();
      if (!state.running) {
        resetGame();
      } else {
        interact();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  canvas.addEventListener("pointermove", (event) => {
    const worldPoint = screenToWorld(event.clientX, event.clientY);
    pointerState.x = worldPoint.x;
    pointerState.y = worldPoint.y;
    pointerState.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    pointerState.active = false;
  });

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!state.running) return;
    const worldPoint = screenToWorld(event.clientX, event.clientY);
    pointerState.x = worldPoint.x;
    pointerState.y = worldPoint.y;
    pointerState.active = true;
    doAttack({ x: worldPoint.x - state.player.x, y: worldPoint.y - state.player.y });
  });

  startButton.addEventListener("click", resetGame);
  restartButton.addEventListener("click", resetGame);
  copyDebugButton.addEventListener("click", () => copyDebugReport());

  window.addEventListener("error", (event) => {
    recordRuntimeError("window", event.message || event.error || "unknown");
    computeStatus();
    refreshDebugPanel();
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason && event.reason.message ? event.reason.message : event.reason;
    recordRuntimeError("promise", reason || "unhandled rejection");
    computeStatus();
    refreshDebugPanel();
  });

  function bindTouchDirection(button, key) {
    const press = (event) => { event.preventDefault(); touchState[key] = true; };
    const release = (event) => { event.preventDefault(); touchState[key] = false; };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  document.querySelectorAll("[data-touch-dir]").forEach((button) => bindTouchDirection(button, button.dataset.touchDir));

  touchAttack.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    doAttack(state.player.lastDir);
  });

  touchInteract.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!state.running) {
      resetGame();
      return;
    }
    interact();
  });

  init();
})();
