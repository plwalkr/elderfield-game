
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const canvasWrap = document.getElementById("canvasWrap");
  const messageBox = document.getElementById("messageBox");
  const heartsValue = document.getElementById("heartsValue");
  const rupeesValue = document.getElementById("rupeesValue");
  const zoneValue = document.getElementById("zoneValue");
  const objectiveValue = document.getElementById("objectiveValue");
  const rewardsValue = document.getElementById("rewardsValue");
  const weaponHud = document.getElementById("weaponHud");
  const dungeonHud = document.getElementById("dungeonHud");
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
  const debugBuildValue = document.getElementById("debugBuildValue");
  const buildWatermark = document.getElementById("buildWatermark");
  const statusPill = document.getElementById("statusPill");
  const statusValue = document.getElementById("statusValue");
  const debugStatusBadge = document.getElementById("debugStatusBadge");
  const bossHud = document.getElementById("bossHud");
  const bossNameValue = document.getElementById("bossNameValue");
  const bossFill = document.getElementById("bossFill");
  const bossHealthValue = document.getElementById("bossHealthValue");

  const TILE = 24;
  const INVULN_TIME = 0.7;
  const BASE_ATTACK_COOLDOWN = 0.26;
  const BASE_ATTACK_TIME = 0.13;
  const GAME_VERSION = "v2.4.0";
  const BUILD_DATE = "2026-03-22";
  const BUILD_NAME = "Boss & Arsenal Pass";
  const START_ZONE = "South Meadow";

  const DUNGEONS = {
    ruins: {
      id: "ruins",
      name: "Ancient Ruins",
      overline: "North Ruins",
      reward: "Blade Crest",
      rewardType: "sword",
      entranceText: "The old arch answers with cold blue fire.",
      names: ["Threshold of Kings", "Archivist Walk", "Crown Sepulcher"],
      theme: "ruins",
      bossTint: "stone",
    },
    rootwood: {
      id: "rootwood",
      name: "Rootwood Cavern",
      overline: "East Woods",
      reward: "Wind Spear",
      rewardType: "spear",
      entranceText: "The cave breathes sap-scent and root-song.",
      names: ["Hollow Root", "Spore Hall", "Verdant Keep"],
      theme: "rootwood",
      bossTint: "vine",
    },
    ember: {
      id: "ember",
      name: "Ember Vault",
      overline: "Ashen Reach",
      reward: "Ember Wand",
      rewardType: "wand",
      entranceText: "Heat shivers through the hatch below.",
      names: ["Ashen Mouth", "Forge Gallery", "Molten Reliquary"],
      theme: "ember",
      bossTint: "embersteel",
    },
  };

  const WEAPONS = {
    sword: { id: "sword", name: "Sword", iconClass: "weapon-sword", damage: 1, reach: 30, cooldown: 0.24, attackTime: 0.13, narrow: false },
    spear: { id: "spear", name: "Wind Spear", iconClass: "weapon-spear", damage: 2, reach: 48, cooldown: 0.17, attackTime: 0.09, narrow: true, rapid: true },
    wand: { id: "wand", name: "Ember Wand", iconClass: "weapon-wand", damage: 1, reach: 0, cooldown: 0.15, attackTime: 0.04, projectile: true, rapid: true, projectileSpeed: 330, projectileLife: 1.05 },
  };

  const keys = Object.create(null);
  const touchState = { up: false, down: false, left: false, right: false, attack: false };
  const pointerState = { x: 0, y: 0, active: false, attackHeld: false };

  const state = {
    running: false,
    victory: false,
    gameOver: false,
    logicalWidth: 960,
    logicalHeight: 540,
    camera: { x: 0, y: 0 },
    cameraShake: { power: 0, time: 0 },
    transition: { active: false, alpha: 0, stage: "idle", targetAreaId: null, targetSpawn: null, targetMessage: "" },
    areas: {},
    currentAreaId: "overworld",
    player: null,
    rupees: 0,
    zoneName: START_ZONE,
    objectiveText: "Find the three dungeon paths across Elderfield.",
    areaBannerTimer: 0,
    message: "",
    messageTimer: 0,
    particles: [],
    strikeDust: [],
    projectiles: [],
    rewardsOwned: [],
    overworld: { fieldCleared: false },
    dungeons: {},
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
    return `${state.rewardsOwned.length}/3`;
  }

  function currentDungeonId() {
    const area = currentArea();
    return area && area.dungeonId ? area.dungeonId : null;
  }

  function dungeonProgress(dungeonId = currentDungeonId()) {
    return dungeonId ? state.dungeons[dungeonId] : null;
  }

  function totalDungeonsCleared() {
    return Object.values(state.dungeons).filter((d) => d.cleared).length;
  }

  function allDungeonsCleared() {
    return totalDungeonsCleared() === Object.keys(DUNGEONS).length;
  }

  function getWeaponOrder() {
    return ["sword", "spear", "wand"];
  }

  function activeWeaponData() {
    return WEAPONS[state.player?.activeWeapon || "sword"];
  }

  function currentAttackWeaponData() {
    return WEAPONS[state.player?.attackWeaponId || state.player?.activeWeapon || "sword"];
  }

  function currentBoss() {
    const area = currentArea();
    if (!area) return null;
    return area.enemies.find((enemy) => enemy.isBoss && !enemy.dead) || null;
  }

  function updateBossHud() {
    const boss = currentBoss();
    if (!boss) {
      bossHud.hidden = true;
      return;
    }
    bossHud.hidden = false;
    bossNameValue.textContent = boss.bossName || "Dungeon Boss";
    const ratio = clamp(boss.health / Math.max(1, boss.maxHealth), 0, 1);
    bossFill.style.width = `${Math.round(ratio * 100)}%`;
    bossHealthValue.textContent = `${Math.max(0, boss.health)} / ${boss.maxHealth}`;
  }

  function renderWeaponHud() {
    if (!state.player) return;
    weaponHud.innerHTML = "";
    for (const id of getWeaponOrder()) {
      const slot = document.createElement("span");
      const owned = state.player.weaponsOwned.includes(id);
      slot.className = `slot ${WEAPONS[id].iconClass} ${owned ? "" : "locked"} ${state.player.activeWeapon === id ? "active" : ""}`.trim();
      slot.title = owned ? WEAPONS[id].name : `${WEAPONS[id].name} locked`;
      weaponHud.appendChild(slot);
    }
  }

  function renderDungeonHud() {
    dungeonHud.innerHTML = "";
    for (const id of ["ruins", "rootwood", "ember"]) {
      const progress = state.dungeons[id];
      const slot = document.createElement("span");
      slot.className = `slot dungeon-slot dungeon-${id} ${progress.cleared ? "cleared" : ""}`;
      if (!progress.started && !progress.cleared) slot.classList.add("locked");
      slot.title = `${DUNGEONS[id].name} — ${progress.cleared ? "cleared" : progress.started ? "in progress" : "waiting"}`;
      dungeonHud.appendChild(slot);
    }
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
    const player = state.player || {
      x: 0, y: 0, health: 0, maxHealth: 0, attackTimer: 0, invuln: 0, lastDir: { x: 0, y: 0 },
      swordLevel: 1, activeWeapon: "sword", weaponsOwned: ["sword"],
    };
    const area = currentArea() || { width: 0, height: 0, enemies: [], pickups: [], interactables: [], name: "none" };
    const alive = area.enemies.filter((enemy) => !enemy.dead).length;
    const pointerText = `${Math.round(pointerState.x)}, ${Math.round(pointerState.y)} ${pointerState.active ? "(active)" : "(idle)"}`;
    const dungeonLines = Object.keys(DUNGEONS).map((id) => {
      const p = state.dungeons[id] || {};
      return `- ${id}: started=${!!p.started}, cleared=${!!p.cleared}, key=${!!p.keyOwned}, seal=${!!p.sealUnlocked}, reward=${p.currentReward || "none"}`;
    });
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
      `- ActiveWeapon=${player.activeWeapon}`,
      `- WeaponsOwned=${player.weaponsOwned.join(", ")}`,
      `- Sprinting=${!!player.isRunning}`,
      `- RunHeld=${!!player.runHeld}`,
      `- Rupees=${state.rupees}`,
      `- Facing=${player.lastDir.x.toFixed(2)}, ${player.lastDir.y.toFixed(2)}`,
      `- AttackTimer=${player.attackTimer.toFixed(3)}`,
      `- Invuln=${player.invuln.toFixed(3)}`,
      ``,
      `Area`,
      `- Name=${area.name}`,
      `- Theme=${area.theme || "none"}`,
      `- DungeonId=${area.dungeonId || "none"}`,
      `- Size=${area.width}x${area.height}`,
      `- EnemiesAlive=${alive}`,
      `- Pickups=${area.pickups.length}`,
      `- Interactables=${area.interactables.length}`,
      `- Particles=${state.particles.length}`,
      `- StrikeDust=${state.strikeDust.length}`,
      `- Projectiles=${state.projectiles.length}`,
      `- Boss=${currentBoss() ? `${currentBoss().bossName || "boss"} ${currentBoss().health}/${currentBoss().maxHealth}` : "none"}`,
      ``,
      `Progress`,
      `- FieldCleared=${state.overworld.fieldCleared}`,
      `- DungeonsCleared=${totalDungeonsCleared()}/${Object.keys(DUNGEONS).length}`,
      `- RewardsOwned=${state.rewardsOwned.join(", ") || "none"}`,
      ...dungeonLines,
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

  function emptyDungeonProgress() {
    return {
      started: false,
      cleared: false,
      keyOwned: false,
      sealUnlocked: false,
      rewardGranted: false,
      currentReward: null,
      roomClears: {},
    };
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
    state.projectiles.length = 0;
    state.debug.errors.length = 0;
    state.debug.copyResult = "idle";
    state.rewardsOwned = [];
    state.overworld = { fieldCleared: false };
    state.dungeons = {
      ruins: emptyDungeonProgress(),
      rootwood: emptyDungeonProgress(),
      ember: emptyDungeonProgress(),
    };
    state.rupees = 0;
    state.player = makePlayer();
    state.areas = buildAreas();
    setArea("overworld", "start", true);
    state.objectiveText = "Travel the field. Find the three dungeon paths and claim their relics.";
    startCard.hidden = true;
    startButton.hidden = false;
    restartButton.hidden = true;
    startTitle.textContent = "Elderfield";
    startText.textContent = "Three dungeon roads now cut across the land. Claim every relic, unlock new weapons, and return to the shrine.";
    setDebugAction("reset-game");
    updateHud();
    refreshDebugPanel();
    setMessage("Explore the larger field. Press Enter near signs, gates, and the shrine.", 4);
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

    let base = 960;
    if (window.innerWidth <= 1500) base = 896;
    if (window.innerWidth <= 1180) base = 800;
    if (window.innerWidth <= 900) base = 688;
    if (window.innerWidth <= 700) base = 560;
    if (window.innerWidth <= 560) base = 448;
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

  function makeArea(id, name, width, height, defaultFloor = 0, theme = "field", dungeonId = null, roomIndex = 0) {
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
      theme,
      dungeonId,
      roomIndex,
      regions: [],
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
      isBoss: !!data.isBoss,
      bossName: data.bossName || null,
      dashCooldown: data.dashCooldown || 1.8 + Math.random() * 0.6,
      fireCooldown: data.fireCooldown || 1.4 + Math.random() * 0.6,
    });
  }

  function zoneForOverworldPosition(area, x, y) {
    const tx = x / TILE;
    const ty = y / TILE;
    for (const region of area.regions || []) {
      if (tx >= region.x && tx <= region.x + region.w && ty >= region.y && ty <= region.y + region.h) return region.name;
    }
    return area.name;
  }

  function paintGround(area, x, y, w, h, tile) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        if (ix < 1 || iy < 1 || ix >= area.width - 1 || iy >= area.height - 1) continue;
        if (area.solids[iy][ix]) continue;
        area.world[iy][ix] = tile;
      }
    }
  }

  function buildOverworld() {
    const area = makeArea("overworld", "South Meadow", 160, 96, 0, "field");
    area.regions = [
      { name: "South Meadow", x: 40, y: 58, w: 80, h: 32 },
      { name: "North Ruins", x: 54, y: 8, w: 48, h: 28 },
      { name: "East Woods", x: 114, y: 20, w: 34, h: 34 },
      { name: "Ashen Reach", x: 10, y: 22, w: 36, h: 34 },
    ];

    for (let y = 0; y < area.height; y += 1) {
      for (let x = 0; x < area.width; x += 1) {
        const border = x === 0 || y === 0 || x === area.width - 1 || y === area.height - 1;
        if (border) {
          area.world[y][x] = 1;
          area.solids[y][x] = true;
          continue;
        }
        const n = seededNoise(x, y);
        if (n > 0.968) area.world[y][x] = 5;
        else if (n < 0.025) area.world[y][x] = 6;
      }
    }

    paintGround(area, 54, 8, 48, 28, 14);
    paintGround(area, 114, 20, 34, 34, 13);
    paintGround(area, 10, 22, 36, 34, 15);

    fillRect(area, 70, 66, 14, 9, 2, true);
    fillRect(area, 118, 62, 12, 8, 2, true);
    ring(area, 69, 65, 16, 11, 1, true);
    ring(area, 117, 61, 14, 10, 1, true);

    placeForestPatch(area, 120, 22, 22, 24);
    placeForestPatch(area, 132, 18, 12, 12);
    placeForestPatch(area, 14, 66, 16, 10);
    placeForestPatch(area, 44, 18, 8, 10);

    scatterStones(area, 60, 12, 36, 20, 28);
    scatterStones(area, 14, 26, 20, 22, 18);
    scatterStones(area, 100, 34, 16, 16, 12);

    carvePath(area, 18, 48, 142, 48, 3);
    carvePath(area, 78, 10, 78, 88, 3);
    carvePath(area, 128, 33, 128, 49, 3);
    carvePath(area, 26, 33, 26, 49, 3);

    clearRect(area, 75, 78, 7, 6, 0);
    clearRect(area, 75, 46, 7, 5, 3);
    clearRect(area, 124, 30, 7, 6, 13);
    clearRect(area, 23, 30, 7, 6, 15);
    clearRect(area, 72, 14, 11, 8, 14);

    area.interactables.push({
      type: "shrine",
      x: 78 * TILE,
      y: 80 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      active: false,
    });

    area.interactables.push({
      type: "sign",
      x: 76 * TILE,
      y: 53 * TILE,
      w: TILE,
      h: TILE,
      text: "North lies old stone, east lies root and shadow, west lies ash and fire. Bring every relic home.",
    });

    area.interactables.push({
      type: "dungeonEntrance",
      dungeonId: "ruins",
      entranceStyle: "arch",
      x: 74 * TILE,
      y: 14 * TILE,
      w: TILE * 4,
      h: TILE * 3,
      targetAreaId: "ruins_1",
      targetSpawn: "entry",
      text: DUNGEONS.ruins.entranceText,
    });

    area.interactables.push({
      type: "dungeonEntrance",
      dungeonId: "rootwood",
      entranceStyle: "cave",
      x: 124 * TILE,
      y: 30 * TILE,
      w: TILE * 4,
      h: TILE * 3,
      targetAreaId: "rootwood_1",
      targetSpawn: "entry",
      text: DUNGEONS.rootwood.entranceText,
    });

    area.interactables.push({
      type: "dungeonEntrance",
      dungeonId: "ember",
      entranceStyle: "hatch",
      x: 22 * TILE,
      y: 30 * TILE,
      w: TILE * 4,
      h: TILE * 3,
      targetAreaId: "ember_1",
      targetSpawn: "entry",
      text: DUNGEONS.ember.entranceText,
    });

    area.spawns.start = { x: 80.5 * TILE, y: 88.5 * TILE };
    area.spawns.fromRuins = { x: 78.5 * TILE, y: 18.5 * TILE };
    area.spawns.fromRootwood = { x: 128.5 * TILE, y: 35.5 * TILE };
    area.spawns.fromEmber = { x: 26.5 * TILE, y: 35.5 * TILE };

    const enemySpots = [
      [42, 65], [54, 58], [62, 74], [95, 63], [107, 79], [117, 42], [131, 26], [134, 47],
      [22, 39], [34, 31], [20, 51], [68, 20], [88, 26], [100, 18], [143, 48], [122, 69], [53, 44], [85, 48]
    ];
    enemySpots.forEach((spot, index) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 54 + (index % 3) * 11,
        chaseRadius: 132 + Math.random() * 64,
        health: index % 5 === 0 ? 2 : 1,
        tint: index % 4 === 0 ? "stone" : index % 2 === 0 ? "moss" : "ember",
      });
    });

    return area;
  }

  function applyDungeonSkin(area, dungeonId) {
    const meta = DUNGEONS[dungeonId];
    area.theme = meta.theme;
  }

  function buildDungeonRoom1(dungeonId) {
    const meta = DUNGEONS[dungeonId];
    const area = makeArea(`${dungeonId}_1`, meta.names[0], 34, 20, dungeonId === "ember" ? 16 : 7, meta.theme, dungeonId, 1);
    area.spawns.entry = { x: 4.5 * TILE, y: 16.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 16.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, dungeonId === "rootwood" ? 13 : dungeonId === "ember" ? 16 : 7);

    fillRect(area, 4, 4, 7, 5, dungeonId === "rootwood" ? 13 : 8, false);
    fillRect(area, 13, 3, 7, 6, dungeonId === "ember" ? 16 : 7, false);
    fillRect(area, 22, 4, 8, 5, dungeonId === "ruins" ? 14 : 8, false);
    fillRect(area, 8, 11, 18, 6, dungeonId === "ember" ? 16 : 7, false);

    fillRect(area, 14, 0, 6, 2, 10, false);
    area.solids[0][16] = false;
    area.solids[1][16] = false;

    fillRect(area, 4, 15, 2, 2, 10, false);
    clearRect(area, 1, 15, 4, 3, 10);

    scatterDungeonColumns(area, 10, 11, 2, 2);
    scatterDungeonColumns(area, 18, 11, 2, 2);

    area.interactables.push({
      type: "returnSigil",
      dungeonId,
      x: 2 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: dungeonId === "ruins" ? "fromRuins" : dungeonId === "rootwood" ? "fromRootwood" : "fromEmber",
      title: "Return to the field",
    });
    area.interactables.push({
      type: "roomGate",
      dungeonId,
      x: 15 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: `${dungeonId}_2`,
      targetSpawn: "entry",
      requireClear: true,
      requireKey: true,
      title: "Depth gate",
      closedText: "The first chamber must be cleared and the key claimed.",
      openText: "The first gate wakes and opens.",
    });
    area.interactables.push({
      type: "dungeonKeyPedestal",
      dungeonId,
      x: 16 * TILE,
      y: 9 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      taken: false,
    });

    [[11, 6], [20, 6], [9, 14], [24, 14], [17, 12]].forEach((spot, idx) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 58 + (idx % 2) * 10,
        chaseRadius: 150,
        health: idx === 4 ? 2 : 1,
        tint: dungeonId === "ruins" ? "stone" : dungeonId === "rootwood" ? "moss" : "ember",
      });
    });

    return area;
  }

  function buildDungeonRoom2(dungeonId) {
    const meta = DUNGEONS[dungeonId];
    const area = makeArea(`${dungeonId}_2`, meta.names[1], 36, 20, dungeonId === "ember" ? 16 : 8, meta.theme, dungeonId, 2);
    area.spawns.entry = { x: 4.5 * TILE, y: 16.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 16.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, dungeonId === "rootwood" ? 13 : dungeonId === "ember" ? 16 : 8);
    fillRect(area, 1, 8, area.width - 2, 4, dungeonId === "rootwood" ? 13 : 7, false);
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
      dungeonId,
      x: 2 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: `${dungeonId}_1`,
      targetSpawn: "back",
      title: "Return stair",
      openText: "You step back toward the entry chamber.",
    });
    area.interactables.push({
      type: "lockedSeal",
      dungeonId,
      x: 16 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: `${dungeonId}_3`,
      targetSpawn: "entry",
      title: "Knight seal",
      text: "The deeper seal wants a key and a quiet room.",
    });

    [[7, 6], [13, 9], [21, 9], [28, 6], [10, 14], [25, 14]].forEach((spot, idx) => {
      spawnEnemy(area, {
        x: (spot[0] + 0.5) * TILE,
        y: (spot[1] + 0.5) * TILE,
        speed: 60 + (idx % 3) * 8,
        chaseRadius: 160,
        health: idx % 3 === 0 ? 2 : 1,
        tint: dungeonId === "ruins" ? "stone" : dungeonId === "rootwood" ? "moss" : "ember",
      });
    });

    return area;
  }

  function buildDungeonRoom3(dungeonId) {
    const meta = DUNGEONS[dungeonId];
    const area = makeArea(`${dungeonId}_3`, meta.names[2], 38, 22, dungeonId === "ember" ? 16 : 7, meta.theme, dungeonId, 3);
    area.spawns.entry = { x: 5.5 * TILE, y: 18.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, dungeonId === "rootwood" ? 13 : dungeonId === "ember" ? 16 : 7);
    fillRect(area, 8, 4, 22, 13, dungeonId === "ruins" ? 14 : 8, false);
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
      dungeonId,
      x: 2 * TILE,
      y: 17 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: `${dungeonId}_2`,
      targetSpawn: "back",
      title: "Return stair",
      openText: "You retreat through the opened seal.",
    });
    area.interactables.push({
      type: "rewardChest",
      dungeonId,
      x: 18 * TILE,
      y: 5 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      opened: false,
    });
    area.interactables.push({
      type: "exitPortal",
      dungeonId,
      x: 17 * TILE,
      y: 0,
      w: TILE * 3,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: dungeonId === "ruins" ? "fromRuins" : dungeonId === "rootwood" ? "fromRootwood" : "fromEmber",
      visible: false,
      title: "Relic ascent",
    });

    spawnEnemy(area, {
      x: 19.5 * TILE,
      y: 13.5 * TILE,
      w: 22,
      h: 22,
      speed: dungeonId === "ember" ? 78 : dungeonId === "rootwood" ? 72 : 70,
      chaseRadius: 250,
      health: dungeonId === "ruins" ? 8 : dungeonId === "rootwood" ? 9 : 10,
      tint: DUNGEONS[dungeonId].bossTint,
      type: "knight",
      isBoss: true,
      bossName: dungeonId === "ruins" ? "Stone Warden" : dungeonId === "rootwood" ? "Rootbound Knight" : "Ashen Knight",
      damage: dungeonId === "ember" ? 3 : 2,
      touchPush: 28,
      dashCooldown: dungeonId === "ruins" ? 1.4 : 1.9,
      fireCooldown: dungeonId === "ruins" ? 99 : dungeonId === "rootwood" ? 1.9 : 1.5,
    });

    return area;
  }

  function scatterDungeonColumns(area, x, y, w, h) {
    fillRect(area, x, y, w, h, 9, true);
  }

  function buildAreas() {
    return {
      overworld: buildOverworld(),
      ruins_1: buildDungeonRoom1("ruins"),
      ruins_2: buildDungeonRoom2("ruins"),
      ruins_3: buildDungeonRoom3("ruins"),
      rootwood_1: buildDungeonRoom1("rootwood"),
      rootwood_2: buildDungeonRoom2("rootwood"),
      rootwood_3: buildDungeonRoom3("rootwood"),
      ember_1: buildDungeonRoom1("ember"),
      ember_2: buildDungeonRoom2("ember"),
      ember_3: buildDungeonRoom3("ember"),
    };
  }  function makePlayer() {
    return {
      x: 0,
      y: 0,
      w: 18,
      h: 18,
      speed: 130,
      runMultiplier: 1.62,
      lastDir: { x: 0, y: 1 },
      attackCooldown: 0,
      attackTimer: 0,
      attackDir: { x: 0, y: 1 },
      slashHitIds: new Set(),
      attackWeaponId: "sword",
      isRunning: false,
      runHeld: false,
      runFx: 0,
      health: 5,
      maxHealth: 5,
      invuln: 0,
      swordLevel: 1,
      activeWeapon: "sword",
      weaponsOwned: ["sword"],
    };
  }

  function setArea(areaId, spawnKey = "start", snapCamera = false) {
    state.currentAreaId = areaId;
    const area = currentArea();
    const spawn = area.spawns[spawnKey] || area.spawns.entry || area.spawns.start || { x: 5 * TILE, y: 5 * TILE };
    state.player.x = spawn.x;
    state.player.y = spawn.y;
    state.player.attackTimer = 0;
    state.player.attackCooldown = 0;
    state.player.slashHitIds.clear();
    if (area.id === "overworld") {
      state.zoneName = zoneForOverworldPosition(area, state.player.x, state.player.y);
    } else {
      state.zoneName = area.name;
    }
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
        showAreaBanner(state.zoneName, currentArea().dungeonId ? `${DUNGEONS[currentArea().dungeonId].name}` : "Region entered", 2.3);
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
    const area = currentArea();
    const dungeonId = currentDungeonId();
    const progress = dungeonProgress(dungeonId);

    if (state.victory) {
      state.objectiveText = "Shrine rekindled. Elderfield is awake.";
      return;
    }

    if (dungeonId && progress) {
      if (area.roomIndex === 1) state.objectiveText = progress.keyOwned ? "Take the depth gate upward." : "Clear the chamber and claim the dungeon key.";
      else if (area.roomIndex === 2) state.objectiveText = progress.sealUnlocked ? "Push deeper toward the knight." : "Quiet this hall and open the Knight Seal.";
      else if (area.roomIndex === 3) state.objectiveText = progress.rewardGranted ? "Take the ascent and return to the field." : "Defeat the knight and claim the relic chest.";
      return;
    }

    if (!allDungeonsCleared()) {
      state.objectiveText = `Relics ${state.rewardsOwned.length}/3 — seek the remaining dungeon paths.`;
    } else if (!state.overworld.fieldCleared) {
      state.objectiveText = "All relics claimed. Clear the field and return to the shrine.";
    } else {
      state.objectiveText = "Return to the shrine and press Enter.";
    }
  }

  function updateHud() {
    renderHearts(state.player.health, state.player.maxHealth);
    rupeesValue.textContent = formatRupees(state.rupees);
    if (currentArea().id === "overworld") {
      state.zoneName = zoneForOverworldPosition(currentArea(), state.player.x, state.player.y);
    }
    zoneValue.textContent = state.zoneName;
    objectiveValue.textContent = state.objectiveText;
    rewardsValue.textContent = formatRewards();
    renderWeaponHud();
    renderDungeonHud();
    updateBossHud();
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

  function setActiveWeapon(id) {
    if (!state.player || !state.player.weaponsOwned.includes(id) || state.player.activeWeapon === id) return;
    state.player.activeWeapon = id;
    setDebugAction(`weapon-${id}`);
    setMessage(`${WEAPONS[id].name} equipped.`, 1.5);
    updateHud();
  }

  function cycleWeapon(step = 1) {
    const owned = getWeaponOrder().filter((id) => state.player.weaponsOwned.includes(id));
    const current = owned.indexOf(state.player.activeWeapon);
    if (current === -1 || owned.length <= 1) return;
    const next = owned[(current + step + owned.length) % owned.length];
    setActiveWeapon(next);
  }

  function rotateVector(dir, radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c };
  }

  function spawnEnemyProjectile(enemy, direction, kind = "ember") {
    const dir = normalize(direction.x, direction.y);
    const thorn = kind === "thorn";
    state.projectiles.push({
      owner: "enemy",
      kind,
      x: enemy.x + dir.x * 18,
      y: enemy.y + dir.y * 18,
      vx: dir.x * (thorn ? 220 : 250),
      vy: dir.y * (thorn ? 220 : 250),
      life: thorn ? 1.3 : 1.0,
      damage: thorn ? 1 : 2,
      r: thorn ? 4 : 5,
      color: thorn ? "#b9f091" : "#ff9e62",
      hitIds: new Set(),
    });
  }

  function spawnPlayerProjectile(direction, weaponId) {
    const dir = normalize(direction.x, direction.y);
    const weapon = WEAPONS[weaponId] || WEAPONS.wand;
    state.projectiles.push({
      owner: "player",
      weaponId,
      x: state.player.x + dir.x * 18,
      y: state.player.y + dir.y * 18,
      vx: dir.x * (weapon.projectileSpeed || 280),
      vy: dir.y * (weapon.projectileSpeed || 280),
      life: weapon.projectileLife || 0.9,
      damage: weapon.damage || 1,
      r: 5,
      color: weaponId === "wand" ? "#ffb45c" : "#d8e8ff",
      hitIds: new Set(),
    });
  }

  function doAttack(direction) {
    const player = state.player;
    if (!state.running || state.victory || state.gameOver || state.transition.active) return;
    if (player.attackCooldown > 0 || player.attackTimer > 0) return;

    const dir = normalize(direction.x, direction.y);
    const weapon = activeWeaponData();
    player.attackDir = dir;
    player.lastDir = dir;
    player.attackWeaponId = weapon.id;
    player.attackTimer = weapon.attackTime;
    player.attackCooldown = weapon.cooldown;
    player.slashHitIds.clear();

    if (weapon.projectile) {
      spawnPlayerProjectile(dir, weapon.id);
      addCameraShake(1.8, 0.06);
      for (let i = 0; i < 4; i += 1) spawnSpark(player.x + dir.x * 16, player.y + dir.y * 16, i % 2 ? "#ffd67a" : "#ff9d49");
      return;
    }

    addCameraShake(weapon.id === "spear" ? 3.4 : 2.6, 0.08);
    for (let i = 0; i < 3; i += 1) {
      state.strikeDust.push({
        x: player.x + dir.x * (16 + i * 5),
        y: player.y + dir.y * (16 + i * 5),
        life: 0.16 + i * 0.02,
        maxLife: 0.2,
        dir,
        weaponId: weapon.id,
      });
    }
  }

  function currentSlashBox() {
    const p = state.player;
    const weapon = currentAttackWeaponData();
    if (p.attackTimer <= 0 || weapon.projectile) return null;
    const reach = weapon.reach;
    return {
      x: p.x + p.attackDir.x * reach,
      y: p.y + p.attackDir.y * reach,
      w: weapon.narrow ? 20 + Math.abs(p.attackDir.y) * 12 : 30 + Math.abs(p.attackDir.y) * 10,
      h: weapon.narrow ? 20 + Math.abs(p.attackDir.x) * 12 : 30 + Math.abs(p.attackDir.x) * 10,
      damage: weapon.damage + (weapon.id === "sword" ? state.player.swordLevel - 1 : 0),
      weaponId: weapon.id,
    };
  }


function damageEnemy(area, enemy, attack, source) {
  const damage = attack.damage || 1;
  enemy.health -= damage;
  enemy.hurt = 0.18;
  enemy.stun = enemy.type === "knight" ? 0.08 : 0.14;
  const knock = normalize(enemy.x - source.x, enemy.y - source.y);
  const push = attack.weaponId === "spear" ? 132 : attack.weaponId === "wand" ? 88 : 102;
  enemy.kbX += knock.x * push;
  enemy.kbY += knock.y * push;
  addCameraShake(enemy.isBoss ? 4.8 : 2.4, enemy.isBoss ? 0.12 : 0.08);
  burst(enemy.x, enemy.y, enemy.isBoss ? ["#fff1b0", "#ffd278", "#ffffff"] : attack.weaponId === "wand" ? ["#ffb45c", "#ffe5a8"] : ["#fff6d1", "#f6d86f"]);
  if (enemy.health <= 0) {
    enemy.dead = true;
    enemy.health = 0;
    burst(enemy.x, enemy.y, enemy.isBoss ? ["#fff0c4", "#ffb078", "#f6d86f"] : ["#fff0c4", "#ff8d68"]);
    if (!enemy.isBoss) spawnRupeeDrop(area, enemy.x, enemy.y);
    else {
      for (let i = 0; i < 4; i += 1) spawnRupeeDrop(area, enemy.x + (Math.random() - 0.5) * 18, enemy.y + (Math.random() - 0.5) * 18);
      showAreaBanner(`${enemy.bossName || "Knight"} fallen`, DUNGEONS[area.dungeonId]?.name || area.name, 2.2);
    }
    onAreaEnemiesCleared(area);
  }
  updateBossHud();
}

function onAreaEnemiesCleared(area) {
    if (area.enemies.some((enemy) => !enemy.dead)) return;

    if (area.id === "overworld" && !state.overworld.fieldCleared) {
      state.overworld.fieldCleared = true;
      showAreaBanner("Field Cleared", "Elderfield", 2.8);
      setMessage(allDungeonsCleared() ? "The field is quiet. Return to the shrine." : "The field is quiet. Three relic paths still remain.", 4);
      addCameraShake(4, 0.24);
    }

    if (area.dungeonId) {
      const progress = dungeonProgress(area.dungeonId);
      if (area.roomIndex === 1 && !progress.roomClears.r1) {
        progress.roomClears.r1 = true;
        const pedestal = area.interactables.find((i) => i.type === "dungeonKeyPedestal");
        if (pedestal) pedestal.visible = true;
        showAreaBanner("Room Cleared", area.name, 2.2);
        setMessage("A key rises from the pedestal. Claim it.", 3.2);
      }

      if (area.roomIndex === 2 && !progress.roomClears.r2) {
        progress.roomClears.r2 = true;
        showAreaBanner("Hall Quieted", area.name, 2.2);
        setMessage("The Knight Seal can now be opened with your key.", 3.2);
      }

      if (area.roomIndex === 3 && !progress.roomClears.r3) {
        progress.roomClears.r3 = true;
        const chest = area.interactables.find((i) => i.type === "rewardChest");
        if (chest) chest.visible = true;
        showAreaBanner("Knight Fallen", area.name, 2.6);
        setMessage("The relic chest has unsealed. Claim your reward.", 3.4);
      }
    }

    updateObjective();
    updateHud();
  }

  function grantReward(dungeonId) {
    const progress = dungeonProgress(dungeonId);
    const meta = DUNGEONS[dungeonId];
    const reward = meta.reward;
    if (!state.rewardsOwned.includes(reward)) state.rewardsOwned.push(reward);
    progress.currentReward = reward;
    progress.rewardGranted = true;
    progress.cleared = true;

    if (meta.rewardType === "sword") {
      state.player.swordLevel += 1;
    } else if (meta.rewardType === "spear") {
      if (!state.player.weaponsOwned.includes("spear")) state.player.weaponsOwned.push("spear");
      setActiveWeapon("spear");
    } else if (meta.rewardType === "wand") {
      if (!state.player.weaponsOwned.includes("wand")) state.player.weaponsOwned.push("wand");
      setActiveWeapon("wand");
      state.rupees += 15;
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
        setMessage(item.text, 3.8);
        return;
      }

      if (item.type === "shrine") {
        if (!allDungeonsCleared()) {
          setMessage(`The shrine is still missing ${3 - state.rewardsOwned.length} relic${3 - state.rewardsOwned.length === 1 ? "" : "s"}.`, 3);
          return;
        }
        if (!state.overworld.fieldCleared) {
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
        startText.textContent = `You reclaimed all three relics — ${state.rewardsOwned.join(", ")} — and brought them home.`;
        setMessage(`Victory. Relics: ${state.rewardsOwned.join(", ")} • Rupees: ${state.rupees}.`, 4.4);
        updateObjective();
        updateHud();
        return;
      }

      if (item.type === "dungeonEntrance") {
        const progress = dungeonProgress(item.dungeonId);
        progress.started = true;
        updateObjective();
        beginTransition(item.targetAreaId, item.targetSpawn, item.text || "The dungeon answers.");
        return;
      }

      if (item.type === "returnSigil") {
        beginTransition(item.targetAreaId, item.targetSpawn, "The sigil breathes you back into the field.");
        return;
      }

      if (item.type === "roomGate") {
        const progress = dungeonProgress(item.dungeonId);
        if (item.requireClear && area.enemies.some((enemy) => !enemy.dead)) {
          setMessage(item.closedText || "The way forward is still barred.", 2.6);
          return;
        }
        if (item.requireKey && !progress.keyOwned) {
          setMessage("The gate wants the dungeon key.", 2.4);
          return;
        }
        beginTransition(item.targetAreaId, item.targetSpawn, item.openText || "You push deeper into the dungeon.");
        return;
      }

      if (item.type === "lockedSeal") {
        const progress = dungeonProgress(item.dungeonId);
        if (area.enemies.some((enemy) => !enemy.dead)) {
          setMessage("The room is too loud. The seal refuses to answer.", 2.6);
          return;
        }
        if (!progress.keyOwned && !progress.sealUnlocked) {
          setMessage("The Knight Seal needs the dungeon key.", 2.6);
          return;
        }
        progress.sealUnlocked = true;
        beginTransition(item.targetAreaId, item.targetSpawn, "The seal parts. A knight waits ahead.");
        return;
      }

      if (item.type === "dungeonKeyPedestal") {
        const progress = dungeonProgress(item.dungeonId);
        if (!item.visible || item.taken) return;
        item.taken = true;
        item.visible = false;
        progress.keyOwned = true;
        burst(item.x + item.w / 2, item.y + item.h / 2, ["#f6d86f", "#ffffff"]);
        showAreaBanner("Dungeon Key", area.name, 2.2);
        setMessage("Dungeon Key obtained. The depth gate can now answer you.", 3.2);
        updateObjective();
        updateHud();
        return;
      }

      if (item.type === "rewardChest") {
        const progress = dungeonProgress(item.dungeonId);
        if (!item.visible) {
          setMessage("The chest is sealed by the knight's presence.", 2.4);
          return;
        }
        if (item.opened) {
          setMessage(`The chest stands open. ${progress.currentReward || "The relic"} is already yours.`, 2.4);
          return;
        }
        item.opened = true;
        grantReward(item.dungeonId);
        return;
      }

      if (item.type === "exitPortal") {
        if (!item.visible) {
          setMessage("The ascent is still asleep.", 2.4);
          return;
        }
        beginTransition(item.targetAreaId, item.targetSpawn, "Relic in hand, you rise back into Elderfield.");
        return;
      }
    }

    setMessage("Nothing here answers you.", 1.4);
  }


function damagePlayer(amount, source, push = 18, burstPalette = ["#ff8a8a", "#ffe3e3"], cause = "hit") {
  const p = state.player;
  if (!p || p.invuln > 0 || state.gameOver) return;
  p.health -= amount;
  p.invuln = INVULN_TIME;
  const shove = normalize(p.x - source.x, p.y - source.y);
  moveWithCollision(p, shove.x * push, shove.y * push);
  addCameraShake(amount >= 2 ? 5.2 : 4.1, 0.16);
  burst(p.x, p.y, burstPalette);
  setDebugAction(`player-${cause}`);
  if (p.health <= 0) {
    p.health = 0;
    state.gameOver = true;
    state.running = false;
    startCard.hidden = false;
    startButton.hidden = true;
    restartButton.hidden = false;
    startTitle.textContent = "Felled in Elderfield";
    startText.textContent = `You reached ${state.zoneName} and gathered ${state.rupees} rupee${state.rupees === 1 ? "" : "s"}. The knights still wait below.`;
    setMessage("You were overwhelmed. Reset and take a cleaner line.", 4);
  }
  updateHud();
}


function updatePlayer(dt) {
  const p = state.player;
  const area = currentArea();

  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.attackTimer = Math.max(0, p.attackTimer - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.runFx = Math.max(0, p.runFx - dt);

  let mx = 0;
  let my = 0;
  if (keys.KeyA || keys.ArrowLeft || touchState.left) mx -= 1;
  if (keys.KeyD || keys.ArrowRight || touchState.right) mx += 1;
  if (keys.KeyW || keys.ArrowUp || touchState.up) my -= 1;
  if (keys.KeyS || keys.ArrowDown || touchState.down) my += 1;

  p.runHeld = !!(keys.ShiftLeft || keys.ShiftRight || keys.ControlLeft || keys.ControlRight);
  p.isRunning = p.runHeld && (mx !== 0 || my !== 0) && p.attackTimer <= 0;

  if (mx !== 0 || my !== 0) {
    const dir = normalize(mx, my);
    p.lastDir = dir;
    const speed = p.speed * (p.isRunning ? p.runMultiplier : 1) * (p.attackTimer > 0 ? 0.72 : 1);
    moveWithCollision(p, dir.x * speed * dt, dir.y * speed * dt);
    if (p.isRunning && p.runFx <= 0) {
      p.runFx = 0.04;
      state.particles.push({
        x: p.x - dir.x * 8 + (Math.random() - 0.5) * 4,
        y: p.y - dir.y * 8 + 6,
        vx: -dir.x * 24 + (Math.random() - 0.5) * 10,
        vy: -dir.y * 24 + (Math.random() - 0.5) * 10,
        life: 0.16,
        maxLife: 0.16,
        color: "rgba(240, 235, 186, 0.85)",
      });
    }
  } else {
    p.isRunning = false;
  }

  if ((pointerState.attackHeld || touchState.attack) && activeWeaponData().rapid && p.attackCooldown <= 0 && p.attackTimer <= 0 && state.running && !state.transition.active) {
    const aim = pointerState.active ? { x: pointerState.x - p.x, y: pointerState.y - p.y } : p.lastDir;
    doAttack(aim);
  }

  if (area.id === "overworld") {
    const nextZone = zoneForOverworldPosition(area, p.x, p.y);
    if (nextZone !== state.zoneName) {
      state.zoneName = nextZone;
      showAreaBanner(nextZone, "Region entered", 1.8);
    }
  }

  const slash = currentSlashBox();
  if (slash) {
    for (const enemy of area.enemies) {
      if (enemy.dead || p.slashHitIds.has(enemy.id)) continue;
      if (rectsOverlap({ ...slash }, enemy)) {
        p.slashHitIds.add(enemy.id);
        damageEnemy(area, enemy, slash, p);
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
      damagePlayer(enemy.damage || 1, enemy, enemy.touchPush || 18, enemy.type === "knight" ? ["#ffe1aa", "#ffe3e3"] : ["#ff8a8a", "#ffe3e3"], enemy.type === "knight" ? "knight-touch" : "enemy-touch");
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
    enemy.dashCooldown = Math.max(0, enemy.dashCooldown - dt);
    enemy.fireCooldown = Math.max(0, enemy.fireCooldown - dt);

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
      if (enemy.isBoss && dist < enemy.chaseRadius) {
        if (enemy.tint === "stone" && enemy.dashCooldown <= 0) {
          const rush = normalize(dx, dy);
          enemy.kbX += rush.x * 250;
          enemy.kbY += rush.y * 250;
          enemy.dashCooldown = 2.35;
          enemy.stun = 0.12;
          burst(enemy.x, enemy.y, ["#d6dbe1", "#f6d86f"]);
        } else if (enemy.tint === "vine" && enemy.fireCooldown <= 0) {
          const base = normalize(dx, dy);
          for (const angle of [-0.3, 0, 0.3]) spawnEnemyProjectile(enemy, rotateVector(base, angle), "thorn");
          enemy.fireCooldown = 2.15;
          burst(enemy.x, enemy.y, ["#9fe17a", "#e4ffd0"]);
        } else if (enemy.tint === "embersteel" && enemy.fireCooldown <= 0) {
          const base = normalize(dx, dy);
          for (const angle of [-0.22, 0, 0.22]) spawnEnemyProjectile(enemy, rotateVector(base, angle), "ember");
          enemy.fireCooldown = 1.55;
          burst(enemy.x, enemy.y, ["#ff9d49", "#ffe3a8"]);
        }
      }

      if (dist < enemy.chaseRadius) {
        if (dist > 54) dir = normalize(dx, dy);
        else dir = normalize(-dy, dx);
        speed *= enemy.isBoss ? (dist < 130 ? 1.22 : 1.02) : (dist < 120 ? 1.18 : 0.96);
        if (enemy.isBoss && enemy.health <= Math.ceil(enemy.maxHealth * 0.45)) speed *= 1.08;
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

  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = state.projectiles[i];
    projectile.life -= dt;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.life <= 0 || isSolidAtPixel(projectile.x, projectile.y)) {
      burst(projectile.x, projectile.y, projectile.owner === "enemy" ? ["#ffd3a6", "#fff0c2"] : ["#ffbf6b", "#fff0c2"]);
      state.projectiles.splice(i, 1);
      continue;
    }
    const area = currentArea();
    if (projectile.owner === "player") {
      for (const enemy of area.enemies) {
        if (enemy.dead || projectile.hitIds.has(enemy.id)) continue;
        if (rectsOverlap({ x: projectile.x, y: projectile.y, w: projectile.r * 2, h: projectile.r * 2 }, enemy)) {
          projectile.hitIds.add(enemy.id);
          damageEnemy(area, enemy, { damage: projectile.damage, weaponId: projectile.weaponId }, { x: projectile.x, y: projectile.y });
          burst(projectile.x, projectile.y, ["#ffbf6b", "#ffe7b8"]);
          state.projectiles.splice(i, 1);
          break;
        }
      }
    } else if (state.player && state.player.invuln <= 0) {
      if (rectsOverlap({ x: projectile.x, y: projectile.y, w: projectile.r * 2, h: projectile.r * 2 }, state.player)) {
        damagePlayer(projectile.damage || 1, { x: projectile.x, y: projectile.y }, 22, projectile.kind === "thorn" ? ["#bdf09f", "#f0ffd8"] : ["#ffb07a", "#fff0d2"], projectile.kind === "thorn" ? "thorn-shot" : "ember-shot");
        burst(projectile.x, projectile.y, projectile.kind === "thorn" ? ["#b9f091", "#efffd9"] : ["#ff9e62", "#fff0c2"]);
        state.projectiles.splice(i, 1);
      }
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
    updateBossHud();
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
      case 0: {
        const a = (x + y) % 2 === 0 ? "#5e9948" : "#69a851";
        const b = theme === "field" && seededNoise(x * 3, y * 5) > 0.78 ? "#7fbe63" : a;
        ctx.fillStyle = b;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = (x + y) % 3 === 0 ? "rgba(122, 180, 90, 0.20)" : "rgba(25, 64, 25, 0.10)";
        ctx.fillRect(sx + 2, sy + 2, 5, 2);
        ctx.fillRect(sx + 14, sy + 5, 4, 2);
        ctx.fillStyle = "#3f7e35";
        ctx.fillRect(sx + 3, sy + 18, 4, 2);
        ctx.fillRect(sx + 11, sy + 14, 3, 2);
        ctx.fillRect(sx + 17, sy + 9, 2, 3);
        ctx.fillRect(sx + 7, sy + 11, 2, 4);
        break;
      }
      case 1:
        ctx.fillStyle = "#25552e";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#1a3e23";
        ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = "#7b4d28";
        ctx.fillRect(sx + 10, sy + 14, 4, 8);
        ctx.fillStyle = "#4ea451";
        ctx.fillRect(sx + 4, sy + 4, 16, 7);
        ctx.fillRect(sx + 2, sy + 8, 20, 6);
        ctx.fillStyle = "#85d670";
        ctx.fillRect(sx + 6, sy + 6, 4, 2);
        break;
      case 2:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#2d7ca0" : "#276d90";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "#7cd1ef";
        ctx.fillRect(sx + 2, sy + 5, 8, 2);
        ctx.fillRect(sx + 12, sy + 11, 7, 2);
        ctx.fillRect(sx + 7, sy + 16, 10, 2);
        ctx.fillStyle = "rgba(200,240,255,0.18)";
        ctx.fillRect(sx + 4, sy + 3, 5, 1);
        break;
      case 3:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#c5a86b" : "#b79558";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(105, 67, 32, 0.16)";
        ctx.fillRect(sx + 6, sy, 2, TILE);
        ctx.fillRect(sx + 14, sy, 2, TILE);
        ctx.fillStyle = "rgba(255, 237, 184, 0.18)";
        ctx.fillRect(sx + 2, sy + 4, 4, 1);
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
        ctx.fillStyle = theme === "ember" ? "#54443a" : "#4e4a42";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(sx + 3, sy + 4, 5, 1);
        ctx.fillRect(sx + 12, sy + 10, 6, 1);
        break;
      case 8:
        ctx.fillStyle = theme === "ruins" ? "#6e6658" : theme === "rootwood" ? "#4e5642" : "#6b6154";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = theme === "ember" ? "#ac7d5f" : "#928369";
        ctx.fillRect(sx + 6, sy + 6, 3, 3);
        ctx.fillRect(sx + 14, sy + 13, 3, 3);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(sx + 4, sy + 4, 2, 1);
        ctx.fillRect(sx + 16, sy + 8, 2, 1);
        break;
      case 9:
        ctx.fillStyle = theme === "rootwood" ? "#2b3d28" : theme === "ember" ? "#3d2b27" : "#272831";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = theme === "rootwood" ? "#3e5a3a" : theme === "ember" ? "#614033" : "#3a3c47";
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
      case 13:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#47693e" : "#537645";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(184, 227, 146, 0.12)";
        ctx.fillRect(sx + 3, sy + 3, 6, 2);
        ctx.fillStyle = "#2d4d2b";
        ctx.fillRect(sx + 5, sy + 6, 2, 10);
        ctx.fillRect(sx + 12, sy + 10, 2, 7);
        ctx.fillRect(sx + 16, sy + 5, 2, 8);
        break;
      case 14:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#7b7566" : "#8a8373";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(54,46,35,0.18)";
        ctx.fillRect(sx + 2, sy + 12, 8, 1);
        ctx.fillStyle = "#c7bda2";
        ctx.fillRect(sx + 4, sy + 4, 4, 2);
        ctx.fillRect(sx + 12, sy + 12, 5, 2);
        break;
      case 15:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#764732" : "#8a5234";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(255, 165, 88, 0.12)";
        ctx.fillRect(sx + 2, sy + 3, 5, 2);
        ctx.fillStyle = "#d28b4a";
        ctx.fillRect(sx + 6, sy + 5, 2, 2);
        ctx.fillRect(sx + 13, sy + 11, 3, 2);
        ctx.fillStyle = "#341d14";
        ctx.fillRect(sx + 17, sy + 16, 3, 2);
        break;
      case 16:
        ctx.fillStyle = (x + y) % 2 === 0 ? "#492920" : "#592f23";
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = "rgba(255, 118, 56, 0.18)";
        ctx.fillRect(sx + 3, sy + 14, 6, 2);
        ctx.fillStyle = "#b55c2e";
        ctx.fillRect(sx + 8, sy + 7, 3, 3);
        ctx.fillRect(sx + 15, sy + 13, 2, 2);
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
        const glow = allDungeonsCleared() && state.overworld.fieldCleared || item.active;
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
      } else if (item.type === "dungeonEntrance") {
        const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.2;
        if (item.entranceStyle === "arch") {
          ctx.fillStyle = "#6c6557";
          ctx.fillRect(sx + 8, sy + 8, 56, 24);
          ctx.fillStyle = "#31354a";
          ctx.fillRect(sx + 16, sy + 12, 40, 18);
          ctx.fillStyle = `rgba(110,190,255,${0.12 + pulse * 0.2})`;
          ctx.fillRect(sx + 20, sy + 16, 32, 10);
        } else if (item.entranceStyle === "cave") {
          ctx.fillStyle = "#34251d";
          ctx.fillRect(sx + 6, sy + 14, 56, 18);
          ctx.fillStyle = "#0b0d0d";
          ctx.fillRect(sx + 18, sy + 10, 34, 18);
          ctx.fillStyle = `rgba(91, 181, 112, ${0.1 + pulse * 0.16})`;
          ctx.fillRect(sx + 22, sy + 14, 26, 10);
        } else {
          ctx.fillStyle = "#645d50";
          ctx.fillRect(sx + 10, sy + 16, 40, 10);
          ctx.fillStyle = "#2b1d18";
          ctx.fillRect(sx + 16, sy + 12, 28, 14);
          ctx.fillStyle = "#b45b31";
          ctx.fillRect(sx + 20, sy + 16, 20, 6);
          ctx.fillStyle = `rgba(255,160,80,${0.12 + pulse * 0.16})`;
          ctx.fillRect(sx + 18, sy + 12, 24, 10);
        }
      } else if (item.type === "returnSigil" || item.type === "exitPortal") {
        const pulse = 0.4 + Math.sin(performance.now() / 200) * 0.2;
        ctx.fillStyle = "#18212f";
        ctx.fillRect(sx + 3, sy + 3, item.w - 6, item.h - 6);
        ctx.fillStyle = `rgba(120, 180, 255, ${0.2 + pulse * 0.25})`;
        ctx.fillRect(sx + 7, sy + 7, item.w - 14, item.h - 14);
      } else if (item.type === "roomGate" || item.type === "lockedSeal") {
        const progress = dungeonProgress(item.dungeonId);
        const isOpen = item.type === "roomGate"
          ? !item.requireClear || !area.enemies.some((enemy) => !enemy.dead)
          : progress.sealUnlocked || (progress.keyOwned && !area.enemies.some((enemy) => !enemy.dead));
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
        ctx.fillStyle = item.dungeonId === "ember" ? "#72381d" : item.dungeonId === "rootwood" ? "#4f3920" : "#5a3520";
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
        const hurtFlash = enemy.hurt > 0 ? "#ffffff" : enemy.tint === "embersteel" ? "#9f4f31" : enemy.tint === "vine" ? "#557f4b" : "#7684a8";
        ctx.fillStyle = hurtFlash;
        ctx.fillRect(sx - 9, sy - 8, 18, 18);
        ctx.fillStyle = enemy.tint === "embersteel" ? "#e3ad73" : enemy.tint === "vine" ? "#b4df9a" : "#c8d3ef";
        ctx.fillRect(sx - 6, sy - 5, 12, 8);
        ctx.fillStyle = enemy.tint === "embersteel" ? "#5e2916" : enemy.tint === "vine" ? "#254220" : "#2a3152";
        ctx.fillRect(sx - 7, sy + 3, 14, 7);
        ctx.fillStyle = "#f0d987";
        ctx.fillRect(sx - 2, sy - 12, 4, 4);
        ctx.fillStyle = "#161616";
        ctx.fillRect(sx - 4, sy - 3, 2, 2);
        ctx.fillRect(sx + 2, sy - 3, 2, 2);
        ctx.fillStyle = enemy.tint === "embersteel" ? "#ffbf6c" : enemy.tint === "vine" ? "#d6f4b8" : "#d7e8ff";
        ctx.fillRect(sx + 8, sy - 5, 3, 14);
      } else {
        const main = enemy.tint === "moss" ? "#67c364" : enemy.tint === "stone" ? "#a59f93" : "#df8a49";
        const alt = enemy.tint === "moss" ? "#b3f29d" : enemy.tint === "stone" ? "#d8d0c1" : "#ffd8a2";
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
        const ratio = clamp(enemy.health / Math.max(1, enemy.maxHealth), 0, 1);
        const width = enemy.isBoss ? 26 : enemy.type === "knight" ? 14 : 8;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(sx - Math.floor(width / 2), sy - (enemy.isBoss ? 18 : 13), width, 4);
        ctx.fillStyle = enemy.isBoss ? "#ffb25f" : "#fff6c2";
        ctx.fillRect(sx - Math.floor(width / 2), sy - (enemy.isBoss ? 18 : 13), Math.max(1, Math.floor(width * ratio)), 4);
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

      const weapon = activeWeaponData();
      if (p.isRunning) {
        ctx.fillStyle = "rgba(255, 248, 202, 0.35)";
        ctx.fillRect(sx - 9, sy + 2, 18, 3);
      }
      ctx.fillStyle = weapon.id === "wand" ? "#ffbf6c" : "#d7e8ff";
      if (Math.abs(p.lastDir.x) > Math.abs(p.lastDir.y)) {
        ctx.fillRect(sx + (p.lastDir.x > 0 ? 7 : -10), sy - 1, weapon.id === "spear" ? 10 : 7, 3);
      } else {
        ctx.fillRect(sx - 1, sy + (p.lastDir.y > 0 ? 8 : -12), 3, weapon.id === "spear" ? 12 : 8);
      }
    }

    if (p.attackTimer > 0) drawSlashEffect(sx, sy, p.attackDir, p.attackTimer / currentAttackWeaponData().attackTime);
  }

  function drawSlashEffect(sx, sy, dir, t) {
    const alpha = clamp(t, 0, 1);
    const weapon = currentAttackWeaponData();
    if (weapon.projectile) return;
    const reach = weapon.id === "spear" ? 22 : 16;
    const px = sx + dir.x * reach;
    const py = sy + dir.y * reach;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (Math.abs(dir.x) > Math.abs(dir.y)) {
      ctx.fillStyle = weapon.id === "spear" ? "#d8e8ff" : "#fff4ce";
      ctx.fillRect(px + (dir.x > 0 ? 0 : -(weapon.id === "spear" ? 28 : 20)), py - 4, weapon.id === "spear" ? 28 : 20, 8);
      ctx.fillStyle = weapon.id === "spear" ? "#f6d86f" : "#f6d86f";
      ctx.fillRect(px + (dir.x > 0 ? 2 : -(weapon.id === "spear" ? 26 : 18)), py - 2, weapon.id === "spear" ? 24 : 16, 4);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px + (dir.x > 0 ? (weapon.id === "spear" ? 25 : 17) : -(weapon.id === "spear" ? 30 : 22)), py - 2, 6, 4);
    } else {
      ctx.fillStyle = weapon.id === "spear" ? "#d8e8ff" : "#fff4ce";
      ctx.fillRect(px - 4, py + (dir.y > 0 ? 0 : -(weapon.id === "spear" ? 28 : 20)), 8, weapon.id === "spear" ? 28 : 20);
      ctx.fillStyle = "#f6d86f";
      ctx.fillRect(px - 2, py + (dir.y > 0 ? 2 : -(weapon.id === "spear" ? 26 : 18)), 4, weapon.id === "spear" ? 24 : 16);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px - 2, py + (dir.y > 0 ? (weapon.id === "spear" ? 25 : 17) : -(weapon.id === "spear" ? 30 : 22)), 4, 6);
    }
    ctx.restore();
  }

  function drawEffects() {
    for (const projectile of state.projectiles) {
      const sx = projectile.x - state.camera.x;
      const sy = projectile.y - state.camera.y;
      ctx.fillStyle = projectile.color;
      ctx.fillRect(sx - projectile.r, sy - projectile.r, projectile.r * 2, projectile.r * 2);
      ctx.fillStyle = "#fff6d1";
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }

    for (const dust of state.strikeDust) {
      const sx = dust.x - state.camera.x;
      const sy = dust.y - state.camera.y;
      ctx.save();
      ctx.globalAlpha = dust.life / dust.maxLife;
      ctx.fillStyle = dust.weaponId === "spear" ? "#d8e8ff" : "#fff8df";
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
    state.dungeons = {
      ruins: emptyDungeonProgress(),
      rootwood: emptyDungeonProgress(),
      ember: emptyDungeonProgress(),
    };
    state.areas = buildAreas();
    setArea("overworld", "start", true);
    setMessage("Press Start, move with WASD, click or tap to attack, Enter to interact.", 999);
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
    if (event.code === "KeyQ") {
      cycleWeapon(-1);
      return;
    }
    if (event.code === "KeyE") {
      cycleWeapon(1);
      return;
    }
    if (event.code === "Digit1") {
      setActiveWeapon("sword");
      return;
    }
    if (event.code === "Digit2") {
      setActiveWeapon("spear");
      return;
    }
    if (event.code === "Digit3") {
      setActiveWeapon("wand");
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
    pointerState.attackHeld = false;
  });

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!state.running) return;
    const worldPoint = screenToWorld(event.clientX, event.clientY);
    pointerState.x = worldPoint.x;
    pointerState.y = worldPoint.y;
    pointerState.active = true;
    pointerState.attackHeld = true;
    doAttack({ x: worldPoint.x - state.player.x, y: worldPoint.y - state.player.y });
  });

  canvas.addEventListener("pointerup", () => {
    pointerState.attackHeld = false;
  });

  canvas.addEventListener("pointercancel", () => {
    pointerState.attackHeld = false;
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
    touchState.attack = true;
    doAttack(state.player.lastDir);
  });
  const releaseTouchAttack = (event) => { event.preventDefault(); touchState.attack = false; };
  touchAttack.addEventListener("pointerup", releaseTouchAttack);
  touchAttack.addEventListener("pointercancel", releaseTouchAttack);
  touchAttack.addEventListener("pointerleave", releaseTouchAttack);

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
