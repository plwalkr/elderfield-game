
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;

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
  const newGameButton = document.getElementById("newGameButton");
  const clearSaveButton = document.getElementById("clearSaveButton");
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
  const GAME_VERSION = "v3.4.0";
  const BUILD_DATE = "2026-03-22";
  const BUILD_NAME = "Character, Culture & Interiors Pass";
  const SAVE_KEY = "elderfield-save-v2_7";
  const HEART_FRAGMENTS_PER_VESSEL = 2;
  const AUTOSAVE_INTERVAL = 8.5;
  const START_ZONE = "Greenhollow";
  const WORLD_AREA_NAME = "Kingdom of Elderfield";
  const RENDER_STYLE = "Elderfield Storybook Culture 3/4D";
  const STORY = {
    kingdom: "Elderfield",
    princess: "Princess Elaria Vale",
    evil: "the Briar King",
    order: "the Dawn Wardens",
    bloodline: "the Aurel line",
    wiseDragon: "Vaelor the High Wyrm",
    fallenDragon: "Cindervane",
    shrine: "Dawn Shrine",
  };

  const DUNGEONS = {
    ruins: {
      id: "ruins",
      name: "Crownfall Archive",
      overline: "Crownfall Ruins",
      reward: "Aurel Crest",
      rewardType: "sword",
      entranceText: "Cold blue fire wakes in the arch as if it remembers your hand.",
      names: ["Gate of Fallen Crowns", "Hall of Quiet Oaths", "Sepulcher of the First Warden"],
      theme: "ruins",
      bossTint: "stone",
    },
    rootwood: {
      id: "rootwood",
      name: "Thornroot Hollow",
      overline: "Rootwood March",
      reward: "Galespine Spear",
      rewardType: "spear",
      entranceText: "The hollow breathes sap-song, as if the roots still know your name.",
      names: ["Rootwake Mouth", "Lantern Spoor", "Verdant Oathhall"],
      theme: "rootwood",
      bossTint: "vine",
    },
    ember: {
      id: "ember",
      name: "Cinderwake Vault",
      overline: "Cinderreach",
      reward: "Cinderwake Wand",
      rewardType: "wand",
      entranceText: "Heat shivers through the hatch below like a sealed vow trying to breathe.",
      names: ["Ashwake Descent", "Forge of Sleeping Oaths", "Reliquary of Fire"],
      theme: "ember",
      bossTint: "embersteel",
    },
  };

  const WEAPONS = {
    sword: { id: "sword", name: "Warden Blade", iconClass: "weapon-sword", damage: 1, reach: 30, cooldown: 0.24, attackTime: 0.13, narrow: false },
    spear: { id: "spear", name: "Galespine Spear", iconClass: "weapon-spear", damage: 2, reach: 48, cooldown: 0.17, attackTime: 0.09, narrow: true, rapid: true },
    wand: { id: "wand", name: "Cinderwake Wand", iconClass: "weapon-wand", damage: 1, reach: 0, cooldown: 0.15, attackTime: 0.04, projectile: true, rapid: true, projectileSpeed: 330, projectileLife: 1.05 },
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
    objectiveText: "Walk the relic roads of the Dawn Wardens and learn why Princess Elaria was hidden away.",
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
    save: {
      available: false,
      hasSave: false,
      lastSavedAt: null,
      checkpoint: null,
      lastReason: "none",
      autosaveTimer: 0,
    },
    secrets: {
      heartFragments: 0,
      crownfallWall: false,
      greenhollowWall: false,
      whisperPlateSolved: false,
      whisperHeartClaimed: false,
      bridgeBlockSolved: false,
      silverTokenClaimed: false,
      silverTokenDelivered: false,
    },
    renderCache: {
      vignette: null,
      sizeKey: "",
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

    if (!state.save.available && status === "good") {
      status = "warn";
      issues.push("save storage unavailable");
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
      `- Region=${state.zoneName}`,
      `- Objective=${state.objectiveText}`,
      ``,
      `Lore`,
      `- Princess=${STORY.princess}`,
      `- AncientEvil=${STORY.evil}`,
      `- Order=${STORY.order}`,
      `- Bloodline=${STORY.bloodline}`,
      ``,
      `Viewport`,
      `- LogicalSize=${state.logicalWidth}x${state.logicalHeight}`,
      `- CanvasBacking=${canvas.width}x${canvas.height}`,
      `- Render=${RENDER_STYLE}`,
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
      `Secrets`,
      `- HeartFragments=${state.secrets.heartFragments}/${HEART_FRAGMENTS_PER_VESSEL}`,
      `- CrownfallWall=${!!state.secrets.crownfallWall}`,
      `- GreenhollowWall=${!!state.secrets.greenhollowWall}`,
      `- WhisperPlateSolved=${!!state.secrets.whisperPlateSolved}`,
      `- WhisperHeartClaimed=${!!state.secrets.whisperHeartClaimed}`,
      `- BridgeBlockSolved=${!!state.secrets.bridgeBlockSolved}`,
      `- SilverTokenClaimed=${!!state.secrets.silverTokenClaimed}`,
      `- SilverTokenDelivered=${!!state.secrets.silverTokenDelivered}`,
      ``,
      `Save`,
      `- Available=${state.save.available}`,
      `- HasSave=${state.save.hasSave}`,
      `- LastSaved=${state.save.lastSavedAt ? formatSaveTime(state.save.lastSavedAt) : "none"}`,
      `- SaveReason=${state.save.lastReason}`,
      `- Checkpoint=${state.save.checkpoint ? `${state.save.checkpoint.label} @ ${state.save.checkpoint.areaId}` : "none"}`,
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

  function emptySecrets() {
    return {
      heartFragments: 0,
      crownfallWall: false,
      greenhollowWall: false,
      whisperPlateSolved: false,
      whisperHeartClaimed: false,
      bridgeBlockSolved: false,
      silverTokenClaimed: false,
      silverTokenDelivered: false,
    };
  }

  function storageAvailable() {
    try {
      const probe = "__elderfield_save_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function formatSaveTime(value) {
    try {
      return new Date(value).toLocaleString();
    } catch (error) {
      return String(value);
    }
  }

  function checkpointLabel() {
    const area = currentArea();
    if (!area) return state.zoneName || STORY.kingdom;
    return area.id === "overworld" ? state.zoneName : area.name;
  }

  function setCheckpoint(areaId = state.currentAreaId, x = state.player?.x || 0, y = state.player?.y || 0, label = checkpointLabel()) {
    state.save.checkpoint = { areaId, x, y, label };
  }

  function updateStartScreenText() {
    if (state.save.hasSave && state.save.checkpoint) {
      startTitle.textContent = "Elderfield";
      startText.textContent = `A saved road waits in ${state.save.checkpoint.label}. Last saved ${state.save.lastSavedAt ? formatSaveTime(state.save.lastSavedAt) : "recently"}. Princess Elaria still sleeps beneath the Thorn Veil.`;
    } else {
      startTitle.textContent = "Elderfield";
      startText.textContent = "Princess Elaria sleeps beneath the Thorn Veil while the Briar King gathers strength in the old places. Walk the three relic roads, claim what the Dawn Wardens hid, and discover why the blood of Aurel was called again.";
    }
  }

  function updateStartButtons() {
    startButton.textContent = state.save.hasSave ? "Continue Adventure" : "Start Adventure";
    clearSaveButton.hidden = !state.save.hasSave;
    newGameButton.hidden = false;
    updateStartScreenText();
  }

  function serializeSave() {
    return {
      saveKey: SAVE_KEY,
      version: GAME_VERSION,
      build: BUILD_NAME,
      savedAt: new Date().toISOString(),
      currentAreaId: state.currentAreaId,
      zoneName: state.zoneName,
      position: { x: state.player.x, y: state.player.y },
      checkpoint: state.save.checkpoint || { areaId: state.currentAreaId, x: state.player.x, y: state.player.y, label: checkpointLabel() },
      player: {
        health: state.player.health,
        maxHealth: state.player.maxHealth,
        swordLevel: state.player.swordLevel,
        activeWeapon: state.player.activeWeapon,
        weaponsOwned: [...state.player.weaponsOwned],
      },
      rupees: state.rupees,
      rewardsOwned: [...state.rewardsOwned],
      overworld: { fieldCleared: !!state.overworld.fieldCleared },
      dungeons: JSON.parse(JSON.stringify(state.dungeons)),
      secrets: JSON.parse(JSON.stringify(state.secrets)),
    };
  }

  function saveGame(reason = "autosave", silent = true) {
    if (!state.save.available || !state.player) return false;
    try {
      setCheckpoint();
      const payload = serializeSave();
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      state.save.hasSave = true;
      state.save.lastSavedAt = payload.savedAt;
      state.save.lastReason = reason;
      state.save.autosaveTimer = 0;
      if (!silent) setMessage(`Progress saved at ${payload.checkpoint.label}.`, 1.8);
      updateStartButtons();
      refreshDebugPanel();
      return true;
    } catch (error) {
      recordRuntimeError("save", error && error.message ? error.message : error);
      computeStatus();
      refreshDebugPanel();
      return false;
    }
  }

  function clearSavedProgress(showMessage = true) {
    if (!state.save.available) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      recordRuntimeError("save-clear", error && error.message ? error.message : error);
    }
    state.save.hasSave = false;
    state.save.lastSavedAt = null;
    state.save.checkpoint = null;
    state.save.lastReason = "cleared";
    updateStartButtons();
    if (showMessage) setMessage("Saved progress cleared.", 1.6);
  }

  function killAreaEnemies(area) {
    for (const enemy of area.enemies) {
      enemy.dead = true;
      enemy.health = 0;
    }
  }

  function applyPersistentWorldState() {
    if (state.overworld.fieldCleared) killAreaEnemies(state.areas.overworld);

    for (const id of Object.keys(DUNGEONS)) {
      const progress = state.dungeons[id];
      const room1 = state.areas[`${id}_1`];
      const room2 = state.areas[`${id}_2`];
      const room3 = state.areas[`${id}_3`];
      if (!progress || !room1 || !room2 || !room3) continue;

      if (progress.roomClears?.r1 || progress.keyOwned) killAreaEnemies(room1);
      if (progress.roomClears?.r2 || progress.sealUnlocked) killAreaEnemies(room2);
      if (progress.roomClears?.r3 || progress.rewardGranted || progress.cleared) killAreaEnemies(room3);

      const pedestal = room1.interactables.find((item) => item.type === "dungeonKeyPedestal");
      if (pedestal && progress.keyOwned) {
        pedestal.taken = true;
        pedestal.visible = false;
      }

      const chest = room3.interactables.find((item) => item.type === "rewardChest");
      if (chest && (progress.roomClears?.r3 || progress.rewardGranted || progress.cleared)) {
        chest.visible = true;
      }
      if (chest && progress.rewardGranted) {
        chest.opened = true;
      }

      const exitPortal = room3.interactables.find((item) => item.type === "exitPortal");
      if (exitPortal && progress.rewardGranted) {
        exitPortal.visible = true;
      }
    }

    const crownWall = getInteractable("overworld", (item) => item.type === "crackedWall" && item.revealKey === "crownfallWall");
    const crownDoor = getInteractable("overworld", (item) => item.type === "secretEntrance" && item.secretId === "whisper");
    if (crownWall) crownWall.visible = !state.secrets.crownfallWall;
    if (crownDoor) crownDoor.visible = !!state.secrets.crownfallWall;

    const greenWall = getInteractable("overworld", (item) => item.type === "crackedWall" && item.revealKey === "greenhollowWall");
    const greenDoor = getInteractable("overworld", (item) => item.type === "secretEntrance" && item.secretId === "bridge");
    if (greenWall) greenWall.visible = !state.secrets.greenhollowWall;
    if (greenDoor) greenDoor.visible = !!state.secrets.greenhollowWall;

    const whisperPlate = getInteractable("whisper_grotto", (item) => item.type === "runePlate" && item.secretId === "whisperPlate");
    const whisperChest = getInteractable("whisper_grotto", (item) => item.type === "secretChest" && item.secretId === "whisperHeart");
    if (whisperPlate) whisperPlate.active = !!state.secrets.whisperPlateSolved;
    if (whisperChest) {
      whisperChest.visible = !!state.secrets.whisperPlateSolved || !!state.secrets.whisperHeartClaimed;
      whisperChest.opened = !!state.secrets.whisperHeartClaimed;
    }

    const bridgeArea = state.areas.bridge_cache;
    const bridgePlate = getInteractable("bridge_cache", (item) => item.type === "runePlate" && item.secretId === "bridgePlate");
    const bridgeChest = getInteractable("bridge_cache", (item) => item.type === "secretChest" && item.secretId === "bridgeToken");
    const bridgeBlock = getInteractable("bridge_cache", (item) => item.type === "pushBlock" && item.secretId === "bridgeBlock");
    if (bridgePlate) bridgePlate.active = !!state.secrets.bridgeBlockSolved;
    if (bridgeChest) {
      bridgeChest.visible = !!state.secrets.bridgeBlockSolved || !!state.secrets.silverTokenClaimed;
      bridgeChest.opened = !!state.secrets.silverTokenClaimed;
    }
    if (bridgeArea && bridgeBlock) {
      if (Number.isInteger(bridgeBlock.startX) && Number.isInteger(bridgeBlock.startY) && bridgeArea.solids[bridgeBlock.startY]) bridgeArea.solids[bridgeBlock.startY][bridgeBlock.startX] = false;
      if (Number.isInteger(bridgeBlock.targetY) && bridgeArea.solids[bridgeBlock.targetY]) bridgeArea.solids[bridgeBlock.targetY][bridgeBlock.targetX] = false;
      if (state.secrets.bridgeBlockSolved) {
        bridgeBlock.tileX = bridgeBlock.targetX;
        bridgeBlock.tileY = bridgeBlock.targetY;
        bridgeBlock.x = bridgeBlock.tileX * TILE;
        bridgeBlock.y = bridgeBlock.tileY * TILE;
        bridgeBlock.locked = true;
      } else {
        bridgeBlock.tileX = bridgeBlock.startX;
        bridgeBlock.tileY = bridgeBlock.startY;
        bridgeBlock.x = bridgeBlock.tileX * TILE;
        bridgeBlock.y = bridgeBlock.tileY * TILE;
        bridgeBlock.locked = false;
      }
      bridgeArea.solids[bridgeBlock.tileY][bridgeBlock.tileX] = true;
    }

    syncElowenDialogue();
  }

  function loadSavePayload(payload, silent = false) {
    resetGame({ autosave: false });

    state.rewardsOwned = Array.isArray(payload.rewardsOwned) ? [...payload.rewardsOwned] : [];
    state.overworld = { fieldCleared: !!payload.overworld?.fieldCleared };
    state.secrets = Object.assign(emptySecrets(), payload.secrets || {});
    state.dungeons = {
      ruins: Object.assign(emptyDungeonProgress(), payload.dungeons?.ruins || {}),
      rootwood: Object.assign(emptyDungeonProgress(), payload.dungeons?.rootwood || {}),
      ember: Object.assign(emptyDungeonProgress(), payload.dungeons?.ember || {}),
    };
    state.rupees = Number.isFinite(payload.rupees) ? payload.rupees : 0;
    state.player = Object.assign(makePlayer(), payload.player || {});
    state.player.weaponsOwned = Array.isArray(payload.player?.weaponsOwned) && payload.player.weaponsOwned.length ? [...new Set(payload.player.weaponsOwned)] : ["sword"];
    if (!state.player.weaponsOwned.includes("sword")) state.player.weaponsOwned.unshift("sword");
    if (!state.player.weaponsOwned.includes(state.player.activeWeapon)) state.player.activeWeapon = "sword";
    state.areas = buildAreas();
    applyPersistentWorldState();

    const loadAreaId = payload.currentAreaId && state.areas[payload.currentAreaId] ? payload.currentAreaId : payload.checkpoint?.areaId && state.areas[payload.checkpoint.areaId] ? payload.checkpoint.areaId : "overworld";
    setArea(loadAreaId, "start", true);
    const area = currentArea();
    const pos = payload.position || payload.checkpoint;
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
      state.player.x = clamp(pos.x, 12, area.width * TILE - 12);
      state.player.y = clamp(pos.y, 12, area.height * TILE - 12);
    }

    state.save.hasSave = true;
    state.save.lastSavedAt = payload.savedAt || null;
    state.save.lastReason = "loaded";
    state.save.checkpoint = payload.checkpoint || { areaId: loadAreaId, x: state.player.x, y: state.player.y, label: checkpointLabel() };

    updateObjective();
    updateHud();
    startCard.hidden = true;
    startButton.hidden = false;
    restartButton.hidden = true;
    showAreaBanner(state.zoneName, "Journey Restored", 2.1);
    setDebugAction("load-save");
    if (!silent) setMessage(`Progress restored in ${state.save.checkpoint?.label || state.zoneName}.`, 2.1);
    refreshDebugPanel();
    return true;
  }

  function tryLoadSavedGame(silent = false) {
    if (!state.save.available) return false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        state.save.hasSave = false;
        updateStartButtons();
        return false;
      }
      const payload = JSON.parse(raw);
      return loadSavePayload(payload, silent);
    } catch (error) {
      recordRuntimeError("load", error && error.message ? error.message : error);
      state.save.hasSave = false;
      updateStartButtons();
      computeStatus();
      refreshDebugPanel();
      return false;
    }
  }

  function resetGame(options = {}) {
    const { autosave = true } = options;
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
    state.save.autosaveTimer = 0;
    state.rewardsOwned = [];
    state.overworld = { fieldCleared: false };
    state.secrets = emptySecrets();
    state.dungeons = {
      ruins: emptyDungeonProgress(),
      rootwood: emptyDungeonProgress(),
      ember: emptyDungeonProgress(),
    };
    state.rupees = 0;
    state.player = makePlayer();
    state.areas = buildAreas();
    applyPersistentWorldState();
    setArea("overworld", "start", true);
    state.objectiveText = "Walk the relic roads of the Dawn Wardens. Read the old stones and learn why Princess Elaria was hidden away.";
    startCard.hidden = true;
    startButton.hidden = false;
    restartButton.hidden = true;
    updateStartButtons();
    setDebugAction("reset-game");
    updateHud();
    refreshDebugPanel();
    setMessage("Explore the kingdom. Press Enter near tablets, gates, signs, and the Dawn Shrine. The old stones remember more than men do.", 4.4);
    showAreaBanner(state.zoneName, "Region entered", 2.8);
    setCheckpoint();
    if (autosave) saveGame("new-journey", true);
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

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(state.logicalWidth * dpr);
    canvas.height = Math.floor(state.logicalHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
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
      groundCanvas: null,
      groundReady: false,
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

  function decorateInteriorWalls(area, x, y, w, h, theme = "home") {
    ring(area, x, y, w, h, theme === "shop" ? 14 : 8, true);
    clearRect(area, x + 1, y + 1, w - 2, h - 2, theme === "shop" ? 3 : 7);
    for (let ix = x + 1; ix < x + w - 1; ix += 1) {
      if (ix % 2 === 0) area.world[y + 1][ix] = theme === "shop" ? 14 : 12;
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
    const area = makeArea("overworld", WORLD_AREA_NAME, 160, 96, 0, "field");
    area.regions = [
      { name: "Crownfall Ruins", x: 50, y: 2, w: 56, h: 34 },
      { name: "Rootwood March", x: 108, y: 12, w: 50, h: 42 },
      { name: "Cinderreach", x: 2, y: 16, w: 48, h: 42 },
      { name: "Dawnrest", x: 92, y: 66, w: 34, h: 20 },
      { name: "Greenhollow", x: 18, y: 50, w: 126, h: 44 },
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

    clearRect(area, 92, 66, 34, 20, 0);
    paintGround(area, 92, 66, 34, 20, 0);
    fillRect(area, 102, 71, 13, 10, 3, false);
    carvePath(area, 81, 80, 108, 80, 3);
    carvePath(area, 108, 75, 108, 80, 3);
    carvePath(area, 98, 75, 120, 75, 3);
    placeWaterPatch(area, 117, 83, 6, 3);
    fillRect(area, 95, 69, 10, 7, 4, true);
    fillRect(area, 111, 69, 11, 8, 4, true);
    fillRect(area, 97, 79, 9, 5, 4, true);
    fillRect(area, 114, 79, 9, 5, 4, true);

    area.interactables.push({
      type: "townSign",
      x: 92 * TILE,
      y: 79 * TILE,
      w: TILE,
      h: TILE,
      text: "Dawnrest — lantern refuge of the old Warden road. Keep peace within the stones.",
    });

    area.interactables.push({
      type: "house",
      x: 95 * TILE,
      y: 68 * TILE,
      w: TILE * 10,
      h: TILE * 8,
      label: "Lantern Market",
      text: "Warm light and road dust cling to the little market house. Someone here still trades like the old kingdom might return.",
      roof: "green",
    });

    area.interactables.push({
      type: "house",
      x: 111 * TILE,
      y: 68 * TILE,
      w: TILE * 11,
      h: TILE * 9,
      label: "Warden Hall",
      text: "The hall is small, but the old crest still hangs above its door. Dawnrest remembers who kept the roads once.",
      roof: "slate",
    });

    area.interactables.push({
      type: "house",
      x: 97 * TILE,
      y: 78 * TILE,
      w: TILE * 9,
      h: TILE * 6,
      label: "Baker's Hearth",
      text: "Fresh bread, cedar smoke, and rain-dried herbs. It feels like the sort of place legends would miss when they leave.",
      roof: "amber",
    });

    area.interactables.push({
      type: "house",
      x: 114 * TILE,
      y: 78 * TILE,
      w: TILE * 9,
      h: TILE * 6,
      label: "Scholar's Loft",
      text: "Pages, charcoal, and old maps cover the scholar's loft. The roads of Elderfield are still being remembered here.",
      roof: "green",
    });

    area.interactables.push({
      type: "well",
      x: 107 * TILE,
      y: 78 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "The old well water is cold and clear. Coins glitter below. Someone whispers that wishes sink deeper than water in Dawnrest.",
    });

    area.interactables.push({
      type: "npc",
      x: 101 * TILE,
      y: 77 * TILE,
      w: TILE,
      h: TILE,
      name: "Mara of the Lantern Market",
      role: "Merchant",
      text: "Mara: Trade is thin, but not dead. Bring me fifteen bright rupees when you can, and I'll start gathering better road-gear for you. The kingdom will need merchants again.",
      palette: "merchant",
    });

    area.interactables.push({
      type: "npc",
      x: 117 * TILE,
      y: 77 * TILE,
      w: TILE,
      h: TILE,
      name: "Oren Valewright",
      role: "Scholar",
      text: "Oren: Crownfall names Vaelor in silver ink and Cindervane in ash. Dragons are not beasts in these records. They were treaties, warnings, and kings unto themselves.",
      palette: "scholar",
    });

    area.interactables.push({
      type: "npc",
      x: 109 * TILE,
      y: 73 * TILE,
      w: TILE,
      h: TILE,
      name: "Ser Rowan Ashmere",
      role: "Guard",
      text: "Rowan: If Dawnrest stands, the roads are not lost. Bring peace to the wilds and the Warden bells may ring again. Until then, we hold a little line against a great dark.",
      palette: "guard",
    });

    area.interactables.push({
      type: "npc",
      x: 98 * TILE,
      y: 82 * TILE,
      w: TILE,
      h: TILE,
      name: "Elowen",
      role: "Villager",
      text: "Elowen: My boy hid grandfather's crest near the old bridge stones and now he swears the briar shadows won't let him fetch it. If you ever search Greenhollow thoroughly, keep an eye open for a silver token.",
      palette: "villager",
    });

    area.interactables.push({
      type: "npc",
      x: 121 * TILE,
      y: 82 * TILE,
      w: TILE,
      h: TILE,
      name: "Cael the Roadwalker",
      role: "Traveler",
      text: "Cael: I saw black wings over Cinderreach where no bird should live. If Cindervane stirs, even rumor is dangerous. Still... rumor often knows the road before kings do.",
      palette: "traveler",
    });

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
      text: "North waits Crownfall, east waits Rootwood, west waits Cinderreach. Walk every relic road and bring their light home to the Dawn Shrine.",
    });


area.interactables.push({
  type: "loreTablet",
  x: 88 * TILE,
  y: 18 * TILE,
  w: TILE * 2,
  h: TILE * 2,
  text: "Tablet of Crowns: When the Briar King first rose, the Dawn Wardens sealed three roads beneath stone, root, and ember and hid the crown-heir from his grasp.",
});

area.interactables.push({
  type: "loreTablet",
  x: 137 * TILE,
  y: 36 * TILE,
  w: TILE * 2,
  h: TILE * 2,
  text: "Tablet of Roots: The green road answered only the old blood of Aurel. Even now the roots turn toward a forgotten heir and away from oathbreakers.",
});

area.interactables.push({
  type: "loreTablet",
  x: 17 * TILE,
  y: 41 * TILE,
  w: TILE * 2,
  h: TILE * 2,
  text: "Tablet of Ash: Beneath the western stone, fire was chained to oath. The wand of Cinderwake would guard the princess should shadow breach the gates.",
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

    area.interactables.push({
      type: "loreTablet",
      x: 72 * TILE,
      y: 72 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "Shrine Stone: Let the hand of Aurel walk the relic roads. Let the Dawn Shrine remain dark until Princess Elaria can be named in safety.",
    });

    area.interactables.push({
      type: "loreTablet",
      x: 100 * TILE,
      y: 60 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "Waystone of Vaelor: In the elder years the high wyrm Vaelor circled these roads in silver dawnfire. Only one black wing answered him and was not forgiven.",
    });

    area.interactables.push({
      type: "crackedWall",
      secretId: "whisper",
      revealKey: "crownfallWall",
      x: 63 * TILE,
      y: 10 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      revealTitle: "Whisperroot Grotto",
      revealText: "Your blow opens a pale break in Crownfall stone. A forgotten grotto answers beyond.",
    });

    area.interactables.push({
      type: "secretEntrance",
      secretId: "whisper",
      x: 63 * TILE,
      y: 10 * TILE,
      w: TILE * 3,
      h: TILE * 3,
      visible: false,
      targetAreaId: "whisper_grotto",
      targetSpawn: "entry",
      text: "You slip through the broken stone into a quiet hidden grotto.",
    });

    area.interactables.push({
      type: "crackedWall",
      secretId: "bridge",
      revealKey: "greenhollowWall",
      x: 36 * TILE,
      y: 72 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      revealTitle: "Bridge-Stone Cache",
      revealText: "Loose bridge-stones collapse inward and a narrow cache opens beneath Greenhollow.",
    });

    area.interactables.push({
      type: "secretEntrance",
      secretId: "bridge",
      x: 36 * TILE,
      y: 72 * TILE,
      w: TILE * 3,
      h: TILE * 3,
      visible: false,
      targetAreaId: "bridge_cache",
      targetSpawn: "entry",
      text: "An old stair curls down beneath the bridge stones into a hidden cache.",
    });

    area.interactables.push({
      type: "loreTablet",
      x: 58 * TILE,
      y: 24 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "Hidden Stone: Where the wardens feared thieves or kings, they hid small mercies in the walls — silver, heart-stone, and songs of return.",
    });

    const marketHouse = area.interactables.find((item) => item.type === "house" && item.label === "Lantern Market");
    if (marketHouse) {
      marketHouse.targetAreaId = "lantern_market_int";
      marketHouse.targetSpawn = "entry";
      marketHouse.enterText = "You duck beneath warm lantern light and enter the market house.";
    }
    const hallHouse = area.interactables.find((item) => item.type === "house" && item.label === "Warden Hall");
    if (hallHouse) {
      hallHouse.targetAreaId = "wardens_hall_int";
      hallHouse.targetSpawn = "entry";
      hallHouse.enterText = "The old Warden Hall door opens with a stern creak.";
    }
    const bakerHouse = area.interactables.find((item) => item.type === "house" && item.label === "Baker's Hearth");
    if (bakerHouse) {
      bakerHouse.targetAreaId = "bakers_hearth_int";
      bakerHouse.targetSpawn = "entry";
      bakerHouse.enterText = "You step into the heat and bread-scent of the baker's hearth.";
    }
    const scholarHouse = area.interactables.find((item) => item.type === "house" && item.label === "Scholar's Loft");
    if (scholarHouse) {
      scholarHouse.targetAreaId = "scholars_loft_int";
      scholarHouse.targetSpawn = "entry";
      scholarHouse.enterText = "The scholar's loft smells of vellum, candle smoke, and old roads.";
    }

    area.spawns.start = { x: 80.5 * TILE, y: 88.5 * TILE };
    area.spawns.fromRuins = { x: 78.5 * TILE, y: 18.5 * TILE };
    area.spawns.fromRootwood = { x: 128.5 * TILE, y: 35.5 * TILE };
    area.spawns.fromEmber = { x: 26.5 * TILE, y: 35.5 * TILE };
    area.spawns.dawnrestMarketDoor = { x: 100.5 * TILE, y: 77.6 * TILE };
    area.spawns.dawnrestHallDoor = { x: 116.5 * TILE, y: 77.8 * TILE };
    area.spawns.dawnrestBakerDoor = { x: 101.5 * TILE, y: 84.0 * TILE };
    area.spawns.dawnrestScholarDoor = { x: 118.0 * TILE, y: 84.0 * TILE };

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


  function buildWhisperGrotto() {
    const area = makeArea("whisper_grotto", "Whisperroot Grotto", 26, 18, 13, "rootwood");
    area.spawns.entry = { x: 4.5 * TILE, y: 14.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 14.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, 13);
    fillRect(area, 1, 13, 4, 4, 10, false);
    clearRect(area, 1, 13, 4, 4, 10);
    fillRect(area, 6, 3, 5, 4, 14, false);
    fillRect(area, 14, 4, 6, 5, 14, false);
    fillRect(area, 10, 10, 10, 4, 12, false);
    fillRect(area, 20, 11, 3, 3, 2, true);
    scatterDungeonColumns(area, 8, 10, 2, 2);
    scatterDungeonColumns(area, 18, 9, 2, 2);

    area.interactables.push({
      type: "returnSigil",
      x: 2 * TILE,
      y: 13 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: "fromRuins",
      title: "Return to Crownfall",
    });
    area.interactables.push({
      type: "loreTablet",
      x: 6 * TILE,
      y: 4 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "Whisperroot Inscription: Not every mercy was made for kings. Some were hidden for the lost, the hunted, and the children of the wardens when night grew too sharp.",
    });
    area.interactables.push({
      type: "runePlate",
      secretId: "whisperPlate",
      x: 12 * TILE,
      y: 10 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      active: false,
    });
    area.interactables.push({
      type: "secretChest",
      secretId: "whisperHeart",
      x: 19 * TILE,
      y: 5 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      opened: false,
      rewardKind: "heartFragment",
      rewardName: "Whisperroot Heart Fragment",
    });
    return area;
  }

  function buildBridgeCache() {
    const area = makeArea("bridge_cache", "Bridge-Stone Cache", 28, 18, 14, "ruins");
    area.spawns.entry = { x: 4.5 * TILE, y: 14.5 * TILE };
    area.spawns.back = { x: 4.5 * TILE, y: 14.5 * TILE };

    ring(area, 0, 0, area.width, area.height, 9, true);
    clearRect(area, 1, 1, area.width - 2, area.height - 2, 14);
    fillRect(area, 1, 13, 4, 4, 10, false);
    clearRect(area, 1, 13, 4, 4, 10);
    fillRect(area, 8, 4, 12, 8, 7, false);
    fillRect(area, 12, 12, 10, 3, 8, false);
    scatterDungeonColumns(area, 7, 7, 2, 2);
    scatterDungeonColumns(area, 18, 7, 2, 2);

    area.interactables.push({
      type: "returnSigil",
      x: 2 * TILE,
      y: 13 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      targetAreaId: "overworld",
      targetSpawn: "start",
      title: "Return to Greenhollow",
    });
    area.interactables.push({
      type: "loreTablet",
      x: 8 * TILE,
      y: 4 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: "Bridge Cache Mark: When flood or war broke the south road, the wardens hid silver for ferrymen, healers, and hungry households beneath the bridge stones.",
    });
    area.interactables.push({
      type: "runePlate",
      secretId: "bridgePlate",
      x: 15 * TILE,
      y: 11 * TILE,
      w: TILE,
      h: TILE,
      active: false,
    });
    area.interactables.push({
      type: "pushBlock",
      secretId: "bridgeBlock",
      x: 10 * TILE,
      y: 11 * TILE,
      w: TILE,
      h: TILE,
      tileX: 10,
      tileY: 11,
      startX: 10,
      startY: 11,
      targetX: 15,
      targetY: 11,
      locked: false,
    });
    area.solids[11][10] = true;
    area.interactables.push({
      type: "secretChest",
      secretId: "bridgeToken",
      x: 21 * TILE,
      y: 10 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      visible: false,
      opened: false,
      rewardKind: "silverToken",
      rewardName: "Silver Token",
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
      type: "loreTablet",
      x: 27 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: dungeonId === "ruins"
        ? "Inscription: Here the Dawn Wardens swore that the Aurel line would keep the crown roads sealed until thorn returned."
        : dungeonId === "rootwood"
          ? "Moss script: Vaelor once watched these woods and answered only wardens who carried the old oath in their blood."
          : "Forge mark: In the red years, smith-priests chained sleeping flame to oath and named it Cinderwake.",
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
      type: "loreTablet",
      x: 30 * TILE,
      y: 15 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: dungeonId === "ruins"
        ? "Inscription: Princess Elaria was hidden not from death, but from waking shadow. The seal would hold only while the relic roads slept."
        : dungeonId === "rootwood"
          ? "Moss script: The roots know true names. They bent aside from oathbreakers and toward the lost heir when the Briar King came."
          : "Forge mark: When the Briar King sought the princess, the last wardens sent her beneath sleeping flame and swore no tyrant would wake her.",
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
      type: "loreTablet",
      x: 30 * TILE,
      y: 17 * TILE,
      w: TILE * 2,
      h: TILE * 2,
      text: dungeonId === "ruins"
        ? "Inscription: Should dragonfire fail and wardens fall, let the crest choose the hand that remembers."
        : dungeonId === "rootwood"
          ? "Moss script: The spear was cut for the road between worlds, to pierce bramble, veil, and spell."
          : "Forge mark: Beware the black-wing Cindervane, for dragonfire may guard a kingdom or ruin it alike.",
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
      bossName: dungeonId === "ruins" ? "Caldris, Stone Warden" : dungeonId === "rootwood" ? "Mirethorn Knight" : "Ashen Castellan",
      damage: dungeonId === "ember" ? 3 : 2,
      touchPush: 28,
      dashCooldown: dungeonId === "ruins" ? 1.4 : 1.9,
      fireCooldown: dungeonId === "ruins" ? 99 : dungeonId === "rootwood" ? 1.9 : 1.5,
    });

    return area;
  }

function buildLanternMarketInterior() {
  const area = makeArea("lantern_market_int", "Lantern Market", 24, 16, 7, "ruins");
  decorateInteriorWalls(area, 0, 0, area.width, area.height, "shop");
  carvePath(area, 10, 13, 13, 15, 3);
  area.solids[15][11] = false;
  area.solids[15][12] = false;
  area.interactables.push(
    { type: "interiorExit", x: 10 * TILE, y: 14 * TILE, w: TILE * 3, h: TILE * 2, targetAreaId: "overworld", targetSpawn: "dawnrestMarketDoor", text: "You step back into the lantern-lit street of Dawnrest." },
    { type: "counter", x: 5 * TILE, y: 4 * TILE, w: TILE * 8, h: TILE * 2, label: "Trader's Counter" },
    { type: "shelf", x: 15 * TILE, y: 3 * TILE, w: TILE * 3, h: TILE * 6, label: "Lantern Shelves" },
    { type: "lantern", x: 6 * TILE, y: 2 * TILE, w: TILE, h: TILE },
    { type: "lantern", x: 17 * TILE, y: 2 * TILE, w: TILE, h: TILE },
    { type: "weaponChest", x: 17 * TILE, y: 10 * TILE, w: TILE * 2, h: TILE * 2, chestId: "marketChest", rewardName: "Roadwarden Buckler", text: "Inside lies a roadwarden's buckler with oak-and-star engraving. It is mostly a story prize now, but it looks like it belonged to someone worth remembering." },
    { type: "npc", x: 8 * TILE, y: 9 * TILE, w: TILE, h: TILE, name: "Mara of the Lantern Market", role: "Merchant", palette: "merchant", text: "Mara: Lantern oil, field hooks, patched cloaks, a few knives, and one very bad joke for every customer. Elderfield may be half-ruin, but commerce still has a pulse." },
    { type: "npc", x: 15 * TILE, y: 11 * TILE, w: TILE, h: TILE, name: "Tob", role: "Porter", palette: "villager", text: "Tob: Mara says this crate is spice. I say it smells like a dwarf punched a pine tree and called it soup." },
  );
  area.spawns.entry = { x: 11.5 * TILE, y: 13.2 * TILE };
  return area;
}

function buildBakersHearthInterior() {
  const area = makeArea("bakers_hearth_int", "Baker's Hearth", 20, 14, 7, "ruins");
  decorateInteriorWalls(area, 0, 0, area.width, area.height, "home");
  carvePath(area, 8, 11, 11, 13, 3);
  area.solids[13][9] = false;
  area.solids[13][10] = false;
  area.interactables.push(
    { type: "interiorExit", x: 8 * TILE, y: 12 * TILE, w: TILE * 3, h: TILE * 2, targetAreaId: "overworld", targetSpawn: "dawnrestBakerDoor", text: "Warm bread-smoke follows you out into Dawnrest." },
    { type: "table", x: 12 * TILE, y: 6 * TILE, w: TILE * 4, h: TILE * 3, label: "Old Table" },
    { type: "lantern", x: 4 * TILE, y: 2 * TILE, w: TILE, h: TILE },
    { type: "npc", x: 6 * TILE, y: 8 * TILE, w: TILE, h: TILE, name: "Bram", role: "Baker", palette: "villager", text: "Bram: The kingdom may be flirting with doom, but bread still rises. That's either hope or stubbornness. I bake in both philosophies." },
    { type: "npc", x: 13 * TILE, y: 9 * TILE, w: TILE, h: TILE, name: "Lysa", role: "Neighbor", palette: "traveler", text: "Lysa: Rowan acts like a wall with a beard. Good wall, though. Better than some kings, from what my mother says." },
  );
  area.spawns.entry = { x: 9.5 * TILE, y: 11.3 * TILE };
  return area;
}

function buildScholarsLoftInterior() {
  const area = makeArea("scholars_loft_int", "Scholar's Loft", 22, 15, 7, "ruins");
  decorateInteriorWalls(area, 0, 0, area.width, area.height, "home");
  carvePath(area, 9, 12, 12, 14, 3);
  area.solids[14][10] = false;
  area.solids[14][11] = false;
  area.interactables.push(
    { type: "interiorExit", x: 9 * TILE, y: 13 * TILE, w: TILE * 3, h: TILE * 2, targetAreaId: "overworld", targetSpawn: "dawnrestScholarDoor", text: "Ink and dust cling to you as you step back outside." },
    { type: "shelf", x: 3 * TILE, y: 3 * TILE, w: TILE * 3, h: TILE * 7, label: "Book Shelves" },
    { type: "shelf", x: 16 * TILE, y: 3 * TILE, w: TILE * 3, h: TILE * 7, label: "Map Shelves" },
    { type: "table", x: 8 * TILE, y: 5 * TILE, w: TILE * 6, h: TILE * 3, label: "Map Table" },
    { type: "lantern", x: 10 * TILE, y: 2 * TILE, w: TILE, h: TILE },
    { type: "npc", x: 10 * TILE, y: 9 * TILE, w: TILE, h: TILE, name: "Oren Valewright", role: "Scholar", palette: "scholar", text: "Oren: The wardens built roads like promises. Strong at first, then expensive, then forgotten. Kingdoms rot exactly the way doors do — from neglect at the hinge." },
    { type: "loreTablet", x: 6 * TILE, y: 10 * TILE, w: TILE * 2, h: TILE * 2, text: "Map Scrap: Greenhollow once sat beneath silver banners. The people there still nail lanterns to old hooks as if wardens might ride home by dusk." },
  );
  area.spawns.entry = { x: 10.5 * TILE, y: 12.3 * TILE };
  return area;
}

function buildWardensHallInterior() {
  const area = makeArea("wardens_hall_int", "Warden Hall", 26, 16, 8, "ruins");
  decorateInteriorWalls(area, 0, 0, area.width, area.height, "home");
  carvePath(area, 11, 13, 14, 15, 3);
  area.solids[15][12] = false;
  area.solids[15][13] = false;
  area.interactables.push(
    { type: "interiorExit", x: 11 * TILE, y: 14 * TILE, w: TILE * 3, h: TILE * 2, targetAreaId: "overworld", targetSpawn: "dawnrestHallDoor", text: "You leave the old hall, and the lantern wind of Dawnrest greets you again." },
    { type: "banner", x: 5 * TILE, y: 2 * TILE, w: TILE * 2, h: TILE * 4, label: "Warden Banner" },
    { type: "banner", x: 18 * TILE, y: 2 * TILE, w: TILE * 2, h: TILE * 4, label: "Warden Banner" },
    { type: "table", x: 8 * TILE, y: 7 * TILE, w: TILE * 10, h: TILE * 3, label: "War Table" },
    { type: "lantern", x: 7 * TILE, y: 3 * TILE, w: TILE, h: TILE },
    { type: "lantern", x: 18 * TILE, y: 3 * TILE, w: TILE, h: TILE },
    { type: "npc", x: 13 * TILE, y: 10 * TILE, w: TILE, h: TILE, name: "Ser Rowan Ashmere", role: "Guard", palette: "guard", text: "Rowan: A roadwarden carried shield, bell, and oath. Only one of those still hangs easy on the arm. The other two grow heavier by the year." },
    { type: "weaponChest", x: 20 * TILE, y: 11 * TILE, w: TILE * 2, h: TILE * 2, chestId: "hallChest", rewardName: "Ashmere's Practice Blade", text: "A blunted practice blade rests in velvet dust. Rowan snorts and says it taught three pages humility and one nobleman mercy." },
  );
  area.spawns.entry = { x: 12.5 * TILE, y: 13.2 * TILE };
  return area;
}


  function scatterDungeonColumns(area, x, y, w, h) {
    fillRect(area, x, y, w, h, 9, true);
  }

  function buildAreas() {
    return {
      overworld: buildOverworld(),
      lantern_market_int: buildLanternMarketInterior(),
      bakers_hearth_int: buildBakersHearthInterior(),
      scholars_loft_int: buildScholarsLoftInterior(),
      wardens_hall_int: buildWardensHallInterior(),
      whisper_grotto: buildWhisperGrotto(),
      bridge_cache: buildBridgeCache(),
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
    updateSecretTriggers();

  if (area.id === "overworld") {
      state.zoneName = zoneForOverworldPosition(area, state.player.x, state.player.y);
    } else {
      state.zoneName = area.name;
    }
    updateObjective();
    updateHud();
    setCheckpoint(areaId, state.player.x, state.player.y, state.zoneName);
    if (snapCamera) {
      state.camera.x = clamp(state.player.x - state.logicalWidth / 2, 0, area.width * TILE - state.logicalWidth);
      state.camera.y = clamp(state.player.y - state.logicalHeight / 2, 0, area.height * TILE - state.logicalHeight);
    }
    refreshDebugPanel();
  }



  function itemBox(item, pad = 0) {
    return { x: item.x + item.w / 2, y: item.y + item.h / 2, w: item.w + pad, h: item.h + pad };
  }

  function getInteractable(areaId, predicate) {
    const area = state.areas[areaId];
    if (!area) return null;
    return area.interactables.find(predicate) || null;
  }

  function syncElowenDialogue() {
    const elowen = getInteractable("overworld", (item) => item.type === "npc" && item.name === "Elowen");
    if (!elowen) return;
    if (state.secrets.silverTokenDelivered) {
      elowen.text = "Elowen: Grandfather's silver token hangs above our hearth again. The road feels kinder for it. Dawnrest will remember what you did.";
    } else if (state.secrets.silverTokenClaimed) {
      elowen.text = "Elowen: You found it? Grandfather's token? Oh, please... if you've really brought it back from the bridge stones, let me see it.";
    } else {
      elowen.text = "Elowen: My boy hid grandfather's crest near the old bridge stones and now he swears the briar shadows won't let him fetch it. If you ever search Greenhollow thoroughly, keep an eye open for a silver token.";
    }
  }

  function grantHeartFragment(sourceName = "Heart Fragment") {
    state.secrets.heartFragments += 1;
    if (state.secrets.heartFragments >= HEART_FRAGMENTS_PER_VESSEL) {
      state.secrets.heartFragments = 0;
      state.player.maxHealth += 1;
      state.player.health = state.player.maxHealth;
      showAreaBanner("Heart Vessel", `Max health ${state.player.maxHealth}`, 2.4);
      setMessage(`${sourceName} completes a Heart Vessel. Your life rises to ${state.player.maxHealth}.`, 3.8);
    } else {
      showAreaBanner("Heart Fragment", `${state.secrets.heartFragments}/${HEART_FRAGMENTS_PER_VESSEL}`, 2.2);
      setMessage(`${sourceName} claimed. ${state.secrets.heartFragments}/${HEART_FRAGMENTS_PER_VESSEL} fragments toward a new Heart Vessel.`, 3.2);
    }
    burst(state.player.x, state.player.y - 12, ["#ff8f9d", "#ffd9dd", "#fff0f3"]);
    updateHud();
    saveGame("heart-fragment", true);
  }

  function revealCrackedWall(item) {
    if (!item || item.visible === false) return false;
    item.visible = false;
    state.secrets[item.revealKey] = true;
    const hiddenDoor = currentArea().interactables.find((candidate) => candidate.type === "secretEntrance" && candidate.secretId === item.secretId);
    if (hiddenDoor) hiddenDoor.visible = true;
    burst(item.x + item.w / 2, item.y + item.h / 2, ["#d9d0c4", "#f4dd98", "#f7f1ea"]);
    addCameraShake(3.4, 0.12);
    showAreaBanner("Hidden Way Revealed", item.revealTitle || "Secret found", 2.1);
    setMessage(item.revealText || "Cracked stone gives way to an older path.", 3.3);
    updateHud();
    saveGame(`secret-${item.secretId}`, true);
    return true;
  }

  function tryBreakCrackedWalls(hitBox) {
    const area = currentArea();
    for (const item of area.interactables) {
      if (item.type !== "crackedWall" || item.visible === false) continue;
      if (rectsOverlap(hitBox, itemBox(item))) {
        return revealCrackedWall(item);
      }
    }
    return false;
  }

  function openSecretChest(item) {
    if (!item || item.opened) return;
    item.opened = true;
    if (item.rewardKind === "heartFragment") {
      state.secrets.whisperHeartClaimed = true;
      grantHeartFragment("Whisperroot Heart Fragment");
    } else if (item.rewardKind === "silverToken") {
      state.secrets.silverTokenClaimed = true;
      showAreaBanner("Silver Token", "Heirloom found", 2.2);
      setMessage("You found the silver token Elowen spoke of. Return it in Dawnrest and see what old gratitude remembers.", 4.4);
      burst(item.x + item.w / 2, item.y + item.h / 2, ["#dce9f7", "#fff9d6", "#eef1f4"]);
      syncElowenDialogue();
      updateHud();
      saveGame("silver-token", true);
    }
  }

  function updateSecretTriggers() {
    const area = currentArea();
    const p = state.player;
    for (const item of area.interactables) {
      if (item.visible === false) continue;
      if (item.type === "runePlate" && !item.active && rectsOverlap(p, itemBox(item, -6))) {
        item.active = true;
        if (item.secretId === "whisperPlate") {
          state.secrets.whisperPlateSolved = true;
          const chest = area.interactables.find((candidate) => candidate.type === "secretChest" && candidate.secretId === "whisperHeart");
          if (chest) chest.visible = true;
          burst(item.x + item.w / 2, item.y + item.h / 2, ["#9de28a", "#e9ffd9", "#fff2ba"]);
          showAreaBanner("Rune Answered", area.name, 2.0);
          setMessage("Ancient stone answers your step. A hidden chest rises in the grotto.", 3.5);
          updateHud();
          saveGame("whisper-plate", true);
        }
      }
    }
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
      state.objectiveText = "The Dawn Shrine blazes again. Elderfield remembers its name.";
      return;
    }

    if (area && area.id === "whisper_grotto") {
      state.objectiveText = state.secrets.whisperHeartClaimed ? "The grotto has yielded its hidden heart. Return to the kingdom road." : state.secrets.whisperPlateSolved ? "A secret chest has risen. Claim what the grotto guarded." : "Walk the living rune and listen for what the grotto hides.";
      return;
    }

    if (area && area.id === "bridge_cache") {
      if (state.secrets.silverTokenDelivered) state.objectiveText = "Elowen's heirloom is home again. Return to the kingdom road.";
      else if (state.secrets.silverTokenClaimed) state.objectiveText = "Carry the silver token back to Elowen in Dawnrest.";
      else if (state.secrets.bridgeBlockSolved) state.objectiveText = "The old chest is free. Claim the hidden heirloom.";
      else state.objectiveText = "Push the Warden stone onto the rune plate.";
      return;
    }

    if (dungeonId && progress) {
      if (area.roomIndex === 1) state.objectiveText = progress.keyOwned ? "Take the depth gate and follow the Warden road inward." : "Clear the chamber and claim the Warden key.";
      else if (area.roomIndex === 2) state.objectiveText = progress.sealUnlocked ? "Push deeper toward the guardian knight." : "Quiet this hall and wake the Knight Seal.";
      else if (area.roomIndex === 3) state.objectiveText = progress.rewardGranted ? "Take the ascent and carry the relic back into daylight." : "Defeat the guardian and claim the sacred relic.";
      return;
    }

    if (!allDungeonsCleared()) {
      state.objectiveText = `Relics ${state.rewardsOwned.length}/3 — seek the remaining Warden roads before the Briar King wakes fully.`;
    } else if (!state.overworld.fieldCleared) {
      state.objectiveText = "All relics claimed. Quiet the kingdom road and return to the Dawn Shrine.";
    } else {
      state.objectiveText = "Return to the Dawn Shrine and press Enter.";
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
    saveGame(area.dungeonId ? `clear-${area.dungeonId}-r${area.roomIndex}` : "field-cleared", true);
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

    showAreaBanner("Sacred Relic Claimed", reward, 3);
    setMessage(dungeonId === "ruins"
      ? `${reward} obtained. The Warden Blade remembers an older edge, and the crown-road answers your hand.`
      : dungeonId === "rootwood"
        ? `${reward} obtained. Wind, root, and hidden roads now answer your stride.`
        : `${reward} obtained. Sleeping flame bends to your hand, and ember-sealed doors stir awake.`, 4.2);
    updateObjective();
    updateHud();
    saveGame(`reward-${dungeonId}`, true);
  }

  function interact() {
    if (!state.running || state.transition.active) return;
    const p = state.player;
    const area = currentArea();

    for (const item of area.interactables) {
      if (item.visible === false) continue;
      const box = { x: item.x + item.w / 2, y: item.y + item.h / 2, w: item.w + 20, h: item.h + 20 };
      if (!rectsOverlap(p, box)) continue;

      if (item.type === "sign" || item.type === "loreTablet" || item.type === "townSign") {
        setMessage(item.text, item.type === "loreTablet" ? 4.4 : 3.8);
        return;
      }

      if (item.type === "npc") {
        if (item.name === "Elowen" && state.secrets.silverTokenClaimed && !state.secrets.silverTokenDelivered) {
          state.secrets.silverTokenDelivered = true;
          state.rupees += 10;
          syncElowenDialogue();
          grantHeartFragment("Elowen's Family Heirloom");
          showAreaBanner("Heirloom Returned", "Elowen", 2.4);
          setMessage("Elowen: You found it... Grandfather's token. Please, take this heart-shard we kept for road-wardens, and ten rupees besides. Dawnrest won't forget.", 5.4);
          updateHud();
          saveGame("elowen-heirloom", true);
          return;
        }
        setMessage(`${item.role ? item.role + " • " : ""}${item.text}`, 5.2);
        showAreaBanner(item.name || "Traveler", item.role || "Townfolk", 1.6);
        return;
      }

      if (item.type === "house") {
        if (item.targetAreaId) {
          beginTransition(item.targetAreaId, item.targetSpawn || "entry", item.enterText || item.text || "You step inside.");
          return;
        }
        setMessage(item.text || item.label || "An old place of the road.", 4.2);
        return;
      }

      if (item.type === "well") {
        setMessage(item.text || item.label || "An old place of the road.", 4.2);
        return;
      }

      if (item.type === "interiorExit") {
        beginTransition(item.targetAreaId, item.targetSpawn || "start", item.text || "You step outside.");
        return;
      }

      if (item.type === "weaponChest") {
        if (item.opened) {
          setMessage(`${item.rewardName || "The old prize"} is already claimed.`, 2.2);
          return;
        }
        item.opened = true;
        state.rupees += 6;
        burst(item.x + item.w / 2, item.y + item.h / 2, ["#f4d28a", "#fff4d8", "#b1d9ff"]);
        showAreaBanner(item.rewardName || "Old Weapon", currentArea().name, 2.0);
        setMessage(item.text || `You claim ${item.rewardName || "an old roadward weapon"} and a few forgotten rupees.`, 4.8);
        updateHud();
        saveGame("weapon-chest", true);
        return;
      }

      if (item.type === "counter" || item.type === "shelf" || item.type === "table" || item.type === "lantern" || item.type === "banner") {
        setMessage(item.label || item.text || "A detail from an older, gentler age.", 3.0);
        return;
      }

      if (item.type === "shrine") {
        if (!allDungeonsCleared()) {
          saveGame("shrine", false);
          setMessage(`The Dawn Shrine keeps your road for later. ${3 - state.rewardsOwned.length} relic${3 - state.rewardsOwned.length === 1 ? "" : "s"} still answer in shadow.`, 3.5);
          return;
        }
        if (!state.overworld.fieldCleared) {
          const alive = area.enemies.filter((e) => !e.dead).length;
          setMessage(`The Dawn Shrine still hears ${alive} field foe${alive === 1 ? "" : "s"}. Peace the road before you call its fire.`, 3.2);
          return;
        }
        item.active = true;
        state.victory = true;
        state.running = false;
        addCameraShake(6, 0.35);
        showAreaBanner("Dawn Shrine Rekindled", "Victory", 3.4);
        burst(item.x + item.w / 2, item.y + item.h / 2, ["#d8ecff", "#93b9ff", "#fff3af"]);
        startCard.hidden = false;
        startButton.hidden = true;
        restartButton.hidden = false;
        startTitle.textContent = "The First Dawn Rekindled";
        startText.textContent = `You reclaimed all three relics — ${state.rewardsOwned.join(", ")} — and rekindled the first hope of Elderfield against the Briar King.`;
        setMessage(`Victory. The Dawn Shrine burns again. Relics: ${state.rewardsOwned.join(", ")} • Rupees: ${state.rupees}.`, 4.4);
        updateObjective();
        updateHud();
        saveGame("victory", true);
        return;
      }

      if (item.type === "dungeonEntrance") {
        const progress = dungeonProgress(item.dungeonId);
        progress.started = true;
        updateObjective();
        beginTransition(item.targetAreaId, item.targetSpawn, item.text || "The dungeon answers.");
        return;
      }

      if (item.type === "secretEntrance") {
        beginTransition(item.targetAreaId, item.targetSpawn, item.text || "A hidden path answers your touch.");
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

      if (item.type === "pushBlock") {
        if (item.locked) {
          setMessage("The old Warden stone is settled into its rune.", 2.0);
          return;
        }
        const dirX = Math.abs(p.lastDir.x) > Math.abs(p.lastDir.y) ? Math.sign(p.lastDir.x) : 0;
        const dirY = dirX === 0 ? Math.sign(p.lastDir.y) : 0;
        if (!dirX && !dirY) {
          setMessage("Set your shoulder and choose a direction first.", 1.8);
          return;
        }
        const tx = item.tileX + dirX;
        const ty = item.tileY + dirY;
        if (tx < 1 || ty < 1 || tx >= area.width - 1 || ty >= area.height - 1 || area.solids[ty][tx]) {
          setMessage("The stone grinds, but that way is blocked.", 1.9);
          return;
        }
        area.solids[item.tileY][item.tileX] = false;
        item.tileX = tx;
        item.tileY = ty;
        item.x = tx * TILE;
        item.y = ty * TILE;
        area.solids[item.tileY][item.tileX] = true;
        addCameraShake(2.1, 0.08);
        if (tx === item.targetX && ty === item.targetY) {
          item.locked = true;
          state.secrets.bridgeBlockSolved = true;
          const plate = area.interactables.find((candidate) => candidate.type === "runePlate" && candidate.secretId === "bridgePlate");
          if (plate) plate.active = true;
          const chest = area.interactables.find((candidate) => candidate.type === "secretChest" && candidate.secretId === "bridgeToken");
          if (chest) chest.visible = true;
          burst(item.x + TILE / 2, item.y + TILE / 2, ["#f0d88d", "#e6eef8", "#d8e3c9"]);
          showAreaBanner("Stone Settled", area.name, 2.1);
          setMessage("The rune takes the stone's weight. A hidden chest rises from the floor.", 3.5);
          updateHud();
          saveGame("bridge-block", true);
        } else {
          setMessage("The old stone grinds one space.", 1.6);
        }
        return;
      }

      if (item.type === "secretChest") {
        if (!item.visible) {
          setMessage("The hidden chest has not risen yet.", 2.0);
          return;
        }
        if (item.opened) {
          setMessage(`${item.rewardName || "The hidden prize"} is already claimed.`, 2.0);
          return;
        }
        openSecretChest(item);
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
    startButton.hidden = state.save.hasSave ? false : true;
    newGameButton.hidden = false;
    clearSaveButton.hidden = !state.save.hasSave;
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

  updateSecretTriggers();

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
    tryBreakCrackedWalls({ x: slash.x, y: slash.y, w: slash.w, h: slash.h });
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
    const area = currentArea();
    if (projectile.owner === "player" && tryBreakCrackedWalls({ x: projectile.x, y: projectile.y, w: projectile.r * 2, h: projectile.r * 2 })) {
      burst(projectile.x, projectile.y, ["#ffbf6b", "#fff0c2"]);
      state.projectiles.splice(i, 1);
      continue;
    }
    if (projectile.life <= 0 || isSolidAtPixel(projectile.x, projectile.y)) {
      burst(projectile.x, projectile.y, projectile.owner === "enemy" ? ["#ffd3a6", "#fff0c2"] : ["#ffbf6b", "#fff0c2"]);
      state.projectiles.splice(i, 1);
      continue;
    }
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
    drawAtmosphere();
    drawWorldObjects();
    drawInteractables();
    drawPickups();
    drawEnemies();
    drawPlayer();
    drawForegroundOccluders();
    drawEffects();
    drawDebug();
    drawVignette();
    drawTransition();
  }



function drawAtmosphere() {
  const area = currentArea();
  ctx.save();
  updateSecretTriggers();

  if (area.id === "overworld") {
    if (state.zoneName === "Rootwood March") {
      ctx.fillStyle = "rgba(62, 104, 58, 0.08)";
      ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    } else if (state.zoneName === "Crownfall Ruins") {
      ctx.fillStyle = "rgba(150, 132, 96, 0.07)";
      ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    } else if (state.zoneName === "Cinderreach") {
      ctx.fillStyle = "rgba(144, 88, 52, 0.08)";
      ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    } else if (state.zoneName === "Dawnrest") {
      ctx.fillStyle = "rgba(236, 198, 132, 0.06)";
      ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    }
  } else if (area.theme === "rootwood") {
    ctx.fillStyle = "rgba(60, 106, 58, 0.08)";
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  } else if (area.theme === "ember") {
    ctx.fillStyle = "rgba(140, 78, 42, 0.08)";
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  } else if (area.theme === "ruins") {
    ctx.fillStyle = "rgba(152, 138, 104, 0.06)";
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  }
  ctx.restore();
}


  function getCacheCanvas(width, height) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }

  function cacheFillRoundedRect(targetCtx, x, y, w, h, r = 4, color = "#fff") {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    targetCtx.fillStyle = color;
    targetCtx.beginPath();
    targetCtx.moveTo(x + rr, y);
    targetCtx.arcTo(x + w, y, x + w, y + h, rr);
    targetCtx.arcTo(x + w, y + h, x, y + h, rr);
    targetCtx.arcTo(x, y + h, x, y, rr);
    targetCtx.arcTo(x, y, x + w, y, rr);
    targetCtx.closePath();
    targetCtx.fill();
  }

  function cacheSoftLine(targetCtx, x1, y1, x2, y2, color, width = 1.2, alpha = 1) {
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = width;
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(x1, y1);
    targetCtx.lineTo(x2, y2);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function drawFlowerCached(targetCtx, x, y, color) {
    targetCtx.fillStyle = color;
    targetCtx.beginPath();
    targetCtx.arc(x + 2, y + 2, 1.4, 0, Math.PI * 2);
    targetCtx.arc(x + 5, y + 3.2, 1.4, 0, Math.PI * 2);
    targetCtx.arc(x + 2.6, y + 5.6, 1.3, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = "#3b7f34";
    targetCtx.lineWidth = 1;
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(x + 3.2, y + 6.2);
    targetCtx.lineTo(x + 3.4, y + 9.4);
    targetCtx.stroke();
  }

  function drawCachedTile(targetCtx, tile, sx, sy, x, y, theme) {
    const palette = themeColors(theme);
    const n1 = seededNoise(Math.floor(x / 2), Math.floor(y / 2));
    const n2 = seededNoise(x * 13 + 7, y * 17 + 11);
    const n3 = seededNoise(x * 23 + 13, y * 29 + 5);
    const grassBase = n1 > 0.52 ? palette.grassB : palette.grassA;

    if (tile === 0 || tile === 1 || tile === 4 || tile === 5 || tile === 6 || tile === 13) {
      targetCtx.fillStyle = grassBase;
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = palette.mid;
      for (let py = 2; py < TILE; py += 6) {
        for (let px = 1; px < TILE; px += 6) {
          const wobble = seededNoise(x * 41 + px, y * 37 + py);
          if (wobble > 0.52) targetCtx.fillRect(sx + px, sy + py, 2, 1);
        }
      }
      targetCtx.fillStyle = "rgba(255,255,255,0.05)";
      targetCtx.fillRect(sx, sy, TILE, 2);
      targetCtx.fillStyle = "rgba(0,0,0,0.05)";
      targetCtx.fillRect(sx, sy + TILE - 2, TILE, 2);
      if (n2 > 0.72) {
        targetCtx.fillStyle = "rgba(32,66,24,0.18)";
        targetCtx.fillRect(sx + 5, sy + 12, 2, 1);
        targetCtx.fillRect(sx + 14, sy + 8, 2, 1);
        targetCtx.fillRect(sx + 18, sy + 16, 1, 1);
      }
      if (tile === 5) {
        drawFlowerCached(targetCtx, sx + 7, sy + 7, "#ffd86e");
        drawFlowerCached(targetCtx, sx + 15, sy + 14, "#fff5a8");
      } else if (tile === 6) {
        drawFlowerCached(targetCtx, sx + 8, sy + 6, "#e9d3ff");
        drawFlowerCached(targetCtx, sx + 14, sy + 14, "#ffd2ea");
      } else if (tile === 13) {
        targetCtx.fillStyle = "#345b2b";
        targetCtx.fillRect(sx + 5, sy + 7, 2, 10);
        targetCtx.fillRect(sx + 12, sy + 9, 2, 8);
        targetCtx.fillRect(sx + 17, sy + 6, 2, 9);
      }
      return;
    }
    if (tile === 2) {
      targetCtx.fillStyle = (x + y) % 2 === 0 ? palette.waterA : palette.waterB;
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "rgba(255,255,255,0.10)";
      targetCtx.fillRect(sx + 2, sy + 3, 10, 1);
      targetCtx.fillRect(sx + 11, sy + 9, 8, 1);
      targetCtx.fillRect(sx + 5, sy + 16, 12, 1);
      targetCtx.fillStyle = "rgba(0,0,0,0.10)";
      targetCtx.fillRect(sx, sy + TILE - 3, TILE, 3);
      return;
    }
    if (tile === 3) {
      const a = palette.pathA, b = palette.pathB;
      targetCtx.fillStyle = a;
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = b;
      targetCtx.fillRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
      targetCtx.fillStyle = "rgba(124,146,120,0.55)";
      targetCtx.fillRect(sx + 0, sy + 0, TILE, 1);
      targetCtx.fillRect(sx + 0, sy + 0, 1, TILE);
      targetCtx.fillStyle = "rgba(101,122,96,0.35)";
      targetCtx.fillRect(sx + TILE - 1, sy + 1, 1, TILE - 1);
      targetCtx.fillRect(sx + 1, sy + TILE - 1, TILE - 1, 1);
      targetCtx.strokeStyle = "rgba(145,170,139,0.55)";
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(sx + 8.5, sy + 1);
      targetCtx.lineTo(sx + 8.5, sy + TILE - 1);
      targetCtx.moveTo(sx + 16.5, sy + 1);
      targetCtx.lineTo(sx + 16.5, sy + TILE - 1);
      targetCtx.moveTo(sx + 1, sy + 8.5);
      targetCtx.lineTo(sx + TILE - 1, sy + 8.5);
      targetCtx.moveTo(sx + 1, sy + 16.5);
      targetCtx.lineTo(sx + TILE - 1, sy + 16.5);
      targetCtx.stroke();
      if (n3 > 0.58) {
        targetCtx.fillStyle = "rgba(255,255,255,0.18)";
        targetCtx.fillRect(sx + 4, sy + 4, 3, 2);
        targetCtx.fillRect(sx + 13, sy + 13, 3, 2);
      }
      return;
    }
    if (tile === 7 || tile === 8 || tile === 12 || tile === 14) {
      const stoneTheme = tile === 14 ? themeColors("ruins") : palette;
      const topColor = seededNoise(x * 3, y * 5) > 0.5 ? stoneTheme.stoneA : stoneTheme.stoneB;
      targetCtx.fillStyle = topColor;
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "rgba(255,255,255,0.12)";
      targetCtx.fillRect(sx, sy, TILE, 2);
      targetCtx.fillStyle = "rgba(0,0,0,0.10)";
      targetCtx.fillRect(sx, sy + TILE - 2, TILE, 2);
      targetCtx.strokeStyle = "rgba(95,88,77,0.40)";
      targetCtx.lineWidth = 1;
      targetCtx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
      if (tile === 8 || tile === 14) {
        targetCtx.fillStyle = "rgba(255,255,255,0.08)";
        targetCtx.fillRect(sx + 5, sy + 5, 10, 3);
      }
      if (tile === 12) {
        targetCtx.strokeStyle = "rgba(255,255,255,0.10)";
        targetCtx.beginPath();
        targetCtx.moveTo(sx + 4.5, sy + 7.5);
        targetCtx.lineTo(sx + 11.5, sy + 13.5);
        targetCtx.lineTo(sx + 17.5, sy + 9.5);
        targetCtx.stroke();
      }
      return;
    }
    if (tile === 9) {
      targetCtx.fillStyle = theme === "rootwood" ? "#435d41" : theme === "ember" ? "#5e4036" : "#6e786d";
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "rgba(255,255,255,0.10)";
      targetCtx.fillRect(sx, sy, TILE, 2);
      targetCtx.fillStyle = "rgba(0,0,0,0.12)";
      targetCtx.fillRect(sx, sy + TILE - 4, TILE, 4);
      for (let bx = 2; bx < TILE - 2; bx += 7) {
        targetCtx.fillStyle = "rgba(255,255,255,0.08)";
        targetCtx.fillRect(sx + bx, sy + 5, 5, 4);
        targetCtx.fillStyle = "rgba(0,0,0,0.08)";
        targetCtx.fillRect(sx + bx + 1, sy + 13, 5, 4);
      }
      return;
    }
    if (tile === 10) {
      targetCtx.fillStyle = "#1a2231";
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "#6fb7ff";
      targetCtx.fillRect(sx + 9, sy + 2, 6, TILE - 4);
      targetCtx.fillRect(sx + 3, sy + 9, TILE - 6, 6);
      targetCtx.fillStyle = "rgba(180,220,255,0.20)";
      targetCtx.fillRect(sx + 6, sy + 6, 12, 12);
      return;
    }
    if (tile === 15) {
      targetCtx.fillStyle = (x + y) % 2 === 0 ? "#7e4b32" : "#92553a";
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "rgba(255,178,110,0.10)";
      targetCtx.fillRect(sx + 3, sy + 4, 6, 2);
      targetCtx.fillRect(sx + 12, sy + 10, 5, 2);
      targetCtx.fillStyle = "rgba(0,0,0,0.12)";
      targetCtx.fillRect(sx, sy + TILE - 2, TILE, 2);
      return;
    }
    if (tile === 16) {
      targetCtx.fillStyle = seededNoise(Math.floor(x / 2), Math.floor(y / 2)) > 0.5 ? "#6a3a2a" : "#7b4330";
      targetCtx.fillRect(sx, sy, TILE, TILE);
      targetCtx.fillStyle = "rgba(255,210,146,0.08)";
      targetCtx.fillRect(sx + 5, sy + 14, 10, 2);
      targetCtx.fillRect(sx + 12, sy + 6, 7, 1);
      return;
    }
    targetCtx.fillStyle = "magenta";
    targetCtx.fillRect(sx, sy, TILE, TILE);
  }

  function drawCachedWorldObject(targetCtx, tile, sx, sy) {
    if (tile === 1) {
      targetCtx.fillStyle = "rgba(0,0,0,0.18)";
      targetCtx.fillRect(sx + 2, sy + 20, 20, 3);
      targetCtx.fillStyle = "#7d8780";
      targetCtx.fillRect(sx, sy + 17, TILE, 5);
      for (let bx = 0; bx < TILE; bx += 6) {
        targetCtx.fillStyle = bx % 12 === 0 ? "#93a098" : "#6d7770";
        targetCtx.fillRect(sx + bx, sy + 17, 5, 4);
      }
      targetCtx.fillStyle = "#2f5a24";
      targetCtx.fillRect(sx, sy + 7, TILE, 10);
      targetCtx.fillStyle = "#4e823a";
      targetCtx.fillRect(sx + 1, sy + 5, TILE - 2, 8);
      targetCtx.fillStyle = "#73b24f";
      targetCtx.fillRect(sx + 3, sy + 7, 6, 2);
      targetCtx.fillRect(sx + 11, sy + 6, 5, 2);
      targetCtx.fillRect(sx + 17, sy + 8, 4, 2);
      targetCtx.fillStyle = "rgba(0,0,0,0.12)";
      targetCtx.fillRect(sx, sy + 13, TILE, 2);
    } else if (tile === 4) {
      targetCtx.fillStyle = "rgba(0,0,0,0.16)";
      targetCtx.fillRect(sx + 5, sy + 17, 14, 3);
      targetCtx.fillStyle = "#818b83";
      targetCtx.fillRect(sx + 4, sy + 8, 16, 10);
      targetCtx.fillStyle = "#a8b0aa";
      targetCtx.fillRect(sx + 6, sy + 6, 12, 6);
      targetCtx.fillStyle = "rgba(255,255,255,0.20)";
      targetCtx.fillRect(sx + 9, sy + 8, 4, 2);
    } else if (tile === 9) {
      targetCtx.fillStyle = "rgba(0,0,0,0.16)";
      targetCtx.fillRect(sx + 3, sy + 20, 18, 3);
      targetCtx.fillStyle = "rgba(255,255,255,0.08)";
      targetCtx.fillRect(sx + 4, sy + 3, 16, 2);
    }
  }

  function drawReliefEdges(targetCtx, area, x, y, sx, sy) {
    const tile = area.world[y][x];
    const north = y > 0 ? area.world[y - 1][x] : tile;
    const south = y < area.height - 1 ? area.world[y + 1][x] : tile;
    const west = x > 0 ? area.world[y][x - 1] : tile;
    const east = x < area.width - 1 ? area.world[y][x + 1] : tile;
    const palette = themeColors(area.theme);
    const groundish = new Set([0,3,5,6,13,1,4]);
    const raised = new Set([7,8,9,12,14,15,16]);

    if (groundish.has(tile) && south === 2) {
      targetCtx.fillStyle = palette.bank;
      targetCtx.fillRect(sx, sy + TILE - 5, TILE, 3);
      targetCtx.fillStyle = "rgba(255,255,255,0.18)";
      targetCtx.fillRect(sx + 1, sy + TILE - 5, TILE - 2, 1);
      targetCtx.fillStyle = "rgba(0,0,0,0.14)";
      targetCtx.fillRect(sx, sy + TILE - 2, TILE, 2);
    }
    if (groundish.has(tile) && north === 2) {
      targetCtx.fillStyle = "rgba(233,245,218,0.10)";
      targetCtx.fillRect(sx + 1, sy, TILE - 2, 2);
    }
    if (groundish.has(tile) && (east === 2 || west === 2)) {
      targetCtx.fillStyle = "rgba(121,161,99,0.28)";
      if (east === 2) targetCtx.fillRect(sx + TILE - 3, sy + 1, 3, TILE - 2);
      if (west === 2) targetCtx.fillRect(sx, sy + 1, 3, TILE - 2);
    }

    if (raised.has(tile) && groundish.has(south)) {
      targetCtx.fillStyle = palette.cliffA || "#5a7b42";
      targetCtx.fillRect(sx, sy + TILE - 7, TILE, 7);
      targetCtx.fillStyle = "rgba(255,255,255,0.18)";
      targetCtx.fillRect(sx, sy + TILE - 8, TILE, 1);
      targetCtx.fillStyle = palette.cliffB || "#3d592d";
      targetCtx.fillRect(sx, sy + TILE - 3, TILE, 3);
      for (let bx = 2; bx < TILE - 2; bx += 6) {
        targetCtx.fillStyle = "rgba(255,255,255,0.07)";
        targetCtx.fillRect(sx + bx, sy + TILE - 7, 3, 2);
      }
    }
    if (raised.has(tile) && groundish.has(east)) {
      targetCtx.fillStyle = "rgba(0,0,0,0.10)";
      targetCtx.fillRect(sx + TILE - 3, sy, 3, TILE);
    }
    if (raised.has(tile) && groundish.has(west)) {
      targetCtx.fillStyle = "rgba(255,255,255,0.06)";
      targetCtx.fillRect(sx, sy, 2, TILE);
    }
  }

  function drawMacroRelief(targetCtx, area) {
    const width = area.width * TILE;
    const height = area.height * TILE;
    const passes = Math.max(16, Math.floor((area.width * area.height) / 210));
    for (let i = 0; i < passes; i += 1) {
      const px = seededNoise(i * 59, i * 61) * width;
      const py = seededNoise(i * 67, i * 71) * height;
      const rx = 60 + seededNoise(i * 73, i * 79) * 160;
      const ry = 28 + seededNoise(i * 83, i * 89) * 80;
      targetCtx.save();
      targetCtx.translate(px, py);
      targetCtx.rotate((seededNoise(i * 97, i * 101) - 0.5) * 0.8);
      targetCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.022)';
      targetCtx.beginPath();
      targetCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
    const grad = targetCtx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(255,255,255,0.04)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.00)');
    grad.addColorStop(1, 'rgba(0,0,0,0.06)');
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, width, height);
  }

  function ensureAreaGroundCache(area) {
    if (!area || area.groundReady && area.groundCanvas) return;
    const canvas = getCacheCanvas(area.width * TILE, area.height * TILE);
    const targetCtx = canvas.getContext("2d");
    targetCtx.imageSmoothingEnabled = false;
    for (let y = 0; y < area.height; y += 1) {
      for (let x = 0; x < area.width; x += 1) {
        const sx = x * TILE;
        const sy = y * TILE;
        const tile = area.world[y][x];
        drawCachedTile(targetCtx, tile, sx, sy, x, y, area.theme);
        drawReliefEdges(targetCtx, area, x, y, sx, sy);
        if (tile === 1 || tile === 4 || tile === 9) drawCachedWorldObject(targetCtx, tile, sx, sy);
      }
    }
    drawMacroRelief(targetCtx, area);
    area.groundCanvas = canvas;
    area.groundReady = true;
  }

  function ensureVignetteCache() {
    const key = `${state.logicalWidth}x${state.logicalHeight}`;
    if (state.renderCache.vignette && state.renderCache.sizeKey === key) return;
    const canvas = getCacheCanvas(state.logicalWidth, state.logicalHeight);
    const targetCtx = canvas.getContext("2d");
    const gradient = targetCtx.createRadialGradient(
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.min(state.logicalWidth, state.logicalHeight) * 0.28,
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.max(state.logicalWidth, state.logicalHeight) * 0.82,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.2)");
    targetCtx.fillStyle = gradient;
    targetCtx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
    state.renderCache.vignette = canvas;
    state.renderCache.sizeKey = key;
  }

  function drawGround() {
    const area = currentArea();
    ensureAreaGroundCache(area);
    ctx.drawImage(
      area.groundCanvas,
      state.camera.x,
      state.camera.y,
      state.logicalWidth,
      state.logicalHeight,
      0,
      0,
      state.logicalWidth,
      state.logicalHeight,
    );
  }



function themeColors(theme) {
  if (theme === "rootwood") {
    return {
      grassA: "#5f7b48", grassB: "#75955a", dark: "#304126", mid: "#9fbe7a", light: "#d7e9af",
      stoneA: "#6b7461", stoneB: "#87907a", pathA: "#8b8d78", pathB: "#a4a78d",
      waterA: "#29586b", waterB: "#3b7f8b", accent: "#d3efaf", bank: "#90b06a", cliffA: "#4a5c3a", cliffB: "#314126"
    };
  }
  if (theme === "ember") {
    return {
      grassA: "#87553d", grassB: "#9f6548", dark: "#4b291d", mid: "#cc8e58", light: "#f4c07f",
      stoneA: "#7b6157", stoneB: "#9a7c6f", pathA: "#a27958", pathB: "#be9370",
      waterA: "#8e5d37", waterB: "#b87745", accent: "#ffd7ad", bank: "#b57f57", cliffA: "#6c4734", cliffB: "#4d2d21"
    };
  }
  if (theme === "ruins") {
    return {
      grassA: "#6e8b52", grassB: "#80a25f", dark: "#334028", mid: "#b4c78c", light: "#e7f0c6",
      stoneA: "#9a8c6c", stoneB: "#b8a98b", pathA: "#c5d7bc", pathB: "#d7e6cf",
      waterA: "#4a7287", waterB: "#6995a7", accent: "#fff2cb", bank: "#98bb7c", cliffA: "#786a4e", cliffB: "#61553f"
    };
  }
  return {
    grassA: "#5fa24d", grassB: "#68ab55", dark: "#2c5424", mid: "#8fcf73", light: "#dbf3ba",
    stoneA: "#86907b", stoneB: "#a2ab98", pathA: "#caeccf", pathB: "#dff7df",
    waterA: "#406e95", waterB: "#5f8eb1", accent: "#fff2ba", bank: "#96c675", cliffA: "#5a7b42", cliffB: "#3d592d"
  };
}

function px(x, y, w = 1, h = 1, color = "#fff") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function roundedRectPath(x, y, w, h, r = 4) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillRoundedRect(x, y, w, h, r = 4, color = "#fff") {
  ctx.fillStyle = color;
  roundedRectPath(x, y, w, h, r);
  ctx.fill();
}

function softLine(x1, y1, x2, y2, color, width = 1.25, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawGrassTile(sx, sy, x, y, palette) {
  const base = seededNoise(x * 2, y * 3) > 0.56 ? palette.grassB : palette.grassA;
  ctx.fillStyle = base;
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(sx, sy, TILE, 8);
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(sx, sy + 15, TILE, 9);
  ctx.fillStyle = palette.mid;
  ctx.beginPath();
  ctx.ellipse(sx + 7, sy + 16, 5, 3, -0.25, 0, Math.PI * 2);
  ctx.ellipse(sx + 17, sy + 9, 4, 2.5, 0.35, 0, Math.PI * 2);
  ctx.fill();
  softLine(sx + 5, sy + 18, sx + 6, sy + 10, palette.dark, 1.3, 0.7);
  softLine(sx + 10, sy + 17, sx + 12, sy + 7, palette.dark, 1.1, 0.62);
  softLine(sx + 16, sy + 18, sx + 19, sy + 8, palette.light, 1.2, 0.58);
  if (seededNoise(x * 13, y * 17) > 0.78) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.arc(sx + 15, sy + 6, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPathTile(sx, sy, x, y, palette) {
  ctx.fillStyle = (x + y) % 2 === 0 ? palette.pathA : palette.pathB;
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = "rgba(255,246,214,0.10)";
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 7, 5, 2.5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(sx + 17, sy + 15, 4, 2.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  softLine(sx + 4, sy + 19, sx + 18, sy + 6, "rgba(116,86,49,0.26)", 1.2, 1);
  if (seededNoise(x * 5, y * 9) > 0.65) {
    ctx.fillStyle = "rgba(105,74,44,0.22)";
    ctx.beginPath();
    ctx.arc(sx + 13, sy + 12, 1.6, 0, Math.PI * 2);
    ctx.arc(sx + 8, sy + 17, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWaterTile(sx, sy, x, y, palette) {
  ctx.fillStyle = (x + y) % 2 === 0 ? palette.waterA : palette.waterB;
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.ellipse(sx + 7, sy + 6, 5, 1.6, 0, 0, Math.PI * 2);
  ctx.ellipse(sx + 16, sy + 13, 6, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  softLine(sx + 3, sy + 18, sx + 10, sy + 18, "rgba(220,245,255,0.18)", 1.2, 1);
  softLine(sx + 14, sy + 8, sx + 20, sy + 8, "rgba(220,245,255,0.20)", 1.2, 1);
}

function drawStoneTile(sx, sy, x, y, palette, major = false) {
  const stone = seededNoise(x * 3, y * 5) > 0.5 ? palette.stoneA : palette.stoneB;
  fillRoundedRect(sx + 1, sy + 1, TILE - 2, TILE - 2, 5, stone);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(sx + 9, sy + 7, 6, 2, -0.15, 0, Math.PI * 2);
  ctx.ellipse(sx + 15, sy + 16, 4.5, 1.8, 0.15, 0, Math.PI * 2);
  ctx.fill();
  softLine(sx + 6, sy + 8, sx + 12, sy + 13, major ? "rgba(90,72,56,0.32)" : "rgba(54,48,42,0.26)", 1.3, 1);
  softLine(sx + 12, sy + 13, sx + 17, sy + 10, major ? "rgba(90,72,56,0.32)" : "rgba(54,48,42,0.26)", 1.3, 1);
  if (major) fillRoundedRect(sx + 3, sy + 17, 18, 3, 2, "rgba(58,47,39,0.14)");
}

function drawAshTile(sx, sy, x, y, palette) {
  ctx.fillStyle = seededNoise(x * 2, y * 3) > 0.5 ? "#5a2d23" : "#6b3527";
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = "rgba(255,190,120,0.10)";
  ctx.beginPath();
  ctx.ellipse(sx + 9, sy + 15, 6, 2.4, -0.25, 0, Math.PI * 2);
  ctx.ellipse(sx + 18, sy + 7, 4, 1.8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  softLine(sx + 5, sy + 17, sx + 11, sy + 11, "rgba(255,146,79,0.32)", 1.4, 1);
  softLine(sx + 15, sy + 12, sx + 18, sy + 6, palette.light, 1.1, 0.7);
}

function drawTile(tile, sx, sy, x, y, theme) {
  const palette = themeColors(theme);
  switch (tile) {
    case 0:
      drawGrassTile(sx, sy, x, y, palette);
      break;
    case 1:
      drawGrassTile(sx, sy, x, y, palette);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx + 2, sy + 19, 20, 3);
      ctx.fillStyle = "#6b4728";
      ctx.fillRect(sx + 10, sy + 13, 4, 9);
      ctx.fillStyle = theme === "rootwood" ? "#2d5a2f" : "#336b32";
      ctx.fillRect(sx + 3, sy + 6, 18, 7);
      ctx.fillStyle = theme === "rootwood" ? "#477a40" : "#4b8a44";
      ctx.fillRect(sx + 1, sy + 10, 22, 5);
      ctx.fillStyle = theme === "rootwood" ? "#7dc272" : "#88d875";
      ctx.fillRect(sx + 5, sy + 7, 5, 2);
      ctx.fillRect(sx + 15, sy + 9, 4, 2);
      break;
    case 2:
      drawWaterTile(sx, sy, x, y, palette);
      break;
    case 3:
      drawPathTile(sx, sy, x, y, palette);
      break;
    case 4:
      drawGrassTile(sx, sy, x, y, palette);
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(sx + 3, sy + 18, 18, 3);
      ctx.fillStyle = "#606870";
      ctx.fillRect(sx + 4, sy + 6, 16, 11);
      ctx.fillStyle = "#8d99a4";
      ctx.fillRect(sx + 6, sy + 7, 11, 6);
      px(sx + 11, sy + 9, 3, 2, "#dfe8ef");
      break;
    case 5:
      drawGrassTile(sx, sy, x, y, palette);
      drawFlower(sx + 8, sy + 8, "#ffd86e");
      drawFlower(sx + 14, sy + 14, "#fff5a8");
      break;
    case 6:
      drawGrassTile(sx, sy, x, y, palette);
      drawFlower(sx + 9, sy + 7, "#e9d3ff");
      drawFlower(sx + 15, sy + 13, "#ffd2ea");
      break;
    case 7:
      drawStoneTile(sx, sy, x, y, palette, false);
      break;
    case 8:
      drawStoneTile(sx, sy, x, y, palette, true);
      break;
    case 9:
      ctx.fillStyle = theme === "rootwood" ? "#283c29" : theme === "ember" ? "#34231f" : "#2b2c31";
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme === "rootwood" ? "#3f5940" : theme === "ember" ? "#5b3c31" : "#494a52";
      ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
      px(sx + 5, sy + 5, 4, 2, "rgba(255,255,255,0.08)");
      px(sx + 8, sy + 16, 8, 2, "rgba(0,0,0,0.16)");
      break;
    case 10:
      ctx.fillStyle = "#1a2231";
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = "#6fb7ff";
      ctx.fillRect(sx + 9, sy + 2, 6, TILE - 4);
      ctx.fillRect(sx + 3, sy + 9, TILE - 6, 6);
      ctx.fillStyle = "rgba(180,220,255,0.22)";
      ctx.fillRect(sx + 6, sy + 6, 12, 12);
      break;
    case 12:
      drawStoneTile(sx, sy, x, y, palette, false);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + 7);
      ctx.lineTo(sx + 11, sy + 13);
      ctx.lineTo(sx + 16, sy + 9);
      ctx.stroke();
      break;
    case 13:
      drawGrassTile(sx, sy, x, y, themeColors("rootwood"));
      px(sx + 5, sy + 6, 2, 10, "#2d4d2b");
      px(sx + 12, sy + 10, 2, 7, "#2d4d2b");
      px(sx + 16, sy + 5, 2, 8, "#2d4d2b");
      break;
    case 14:
      drawStoneTile(sx, sy, x, y, themeColors("ruins"), true);
      break;
    case 15:
      ctx.fillStyle = (x + y) % 2 === 0 ? "#764732" : "#8a5234";
      ctx.fillRect(sx, sy, TILE, TILE);
      px(sx + 2, sy + 3, 5, 2, "rgba(255, 165, 88, 0.12)");
      px(sx + 6, sy + 5, 2, 2, "#d28b4a");
      px(sx + 13, sy + 11, 3, 2, "#d28b4a");
      px(sx + 17, sy + 16, 3, 2, "#341d14");
      break;
    case 16:
      drawAshTile(sx, sy, x, y, themeColors("ember"));
      break;
    default:
      ctx.fillStyle = "magenta";
      ctx.fillRect(sx, sy, TILE, TILE);
  }
}

function drawFlower(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 3.5, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 2.5, y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    softLine(x + 3, y + 6, x + 3.4, y + 10, "#3b7f34", 1.2, 1);
  }

function drawWorldObjects() {
  // Static tree/stone highlights are baked into the area ground cache for performance.
}

function drawInteractables() {
    const area = currentArea();
    for (const item of area.interactables) {
      if (item.visible === false) continue;
      const sx = item.x - state.camera.x;
      const sy = item.y - state.camera.y;
      if (sx > state.logicalWidth + 40 || sy > state.logicalHeight + 40 || sx + item.w < -40 || sy + item.h < -40) continue;

      if (item.type === "sign" || item.type === "townSign") {
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.beginPath(); ctx.ellipse(sx + 12, sy + 20, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        fillRoundedRect(sx + 10, sy + 10, 4, 10, 2, item.type === "townSign" ? "#7d5935" : "#926238");
        fillRoundedRect(sx + 5, sy + 3, 14, 10, 3, item.type === "townSign" ? "#f1ddb1" : "#ddbf82");
        softLine(sx + 8, sy + 7, sx + 16, sy + 7, "rgba(120,82,42,0.40)", 1.4, 1);

} else if (item.type === "house") {
  const roof = item.roof === "slate" ? ["#6e604b", "#ccb184", "#534230", "#2f2418"] : item.roof === "amber" ? ["#8d7148", "#d6b27f", "#6f5637", "#3d2d1a"] : ["#68714b", "#c8ae77", "#596235", "#324123"];
  const wall = ["#c3a47b", "#e9d4ae", "#9c7d58", "#735a3e"];
  const roofY = sy + 10;
  const wallY = sy + 31;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(sx + 10, sy + item.h - 5, item.w - 20, 5);
  ctx.fillStyle = roof[3];
  ctx.beginPath();
  ctx.moveTo(sx + 12, wallY + 1);
  ctx.lineTo(sx + 22, roofY + 3);
  ctx.lineTo(sx + item.w / 2, roofY - 8);
  ctx.lineTo(sx + item.w - 22, roofY + 3);
  ctx.lineTo(sx + item.w - 12, wallY + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = roof[0];
  ctx.beginPath();
  ctx.moveTo(sx + 14, wallY - 2);
  ctx.lineTo(sx + 26, roofY + 7);
  ctx.lineTo(sx + item.w / 2, roofY - 3);
  ctx.lineTo(sx + item.w - 26, roofY + 7);
  ctx.lineTo(sx + item.w - 14, wallY - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = roof[1];
  ctx.fillRect(sx + 22, roofY + 9, item.w - 44, 3);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  for (let ry = roofY + 13; ry < wallY - 2; ry += 4) ctx.fillRect(sx + 20, ry, item.w - 40, 1);
  ctx.fillStyle = wall[0];
  ctx.fillRect(sx + 14, wallY, item.w - 28, item.h - (wallY - sy) - 10);
  ctx.fillStyle = wall[1];
  ctx.fillRect(sx + 18, wallY + 4, item.w - 36, item.h - (wallY - sy) - 16);
  ctx.fillStyle = wall[3];
  ctx.fillRect(sx + 14, sy + item.h - 12, item.w - 28, 7);
  const doorX = sx + item.w / 2 - 11;
  ctx.fillStyle = wall[2];
  ctx.fillRect(doorX, sy + item.h - 29, 22, 23);
  ctx.fillStyle = "#1d2118";
  ctx.fillRect(doorX + 3, sy + item.h - 25, 16, 19);
  ctx.fillStyle = "rgba(255,227,179,0.18)";
  ctx.fillRect(doorX + 8, sy + item.h - 18, 2, 5);
  ctx.fillStyle = roof[2];
  ctx.fillRect(sx + 18, wallY - 2, item.w - 36, 4);
  ctx.fillStyle = wall[2];
  ctx.fillRect(sx + 19, wallY + 6, 15, 13);
  ctx.fillRect(sx + item.w - 34, wallY + 6, 15, 13);
  ctx.fillStyle = "#252b21";
  ctx.fillRect(sx + 22, wallY + 8, 9, 9);
  ctx.fillRect(sx + item.w - 31, wallY + 8, 9, 9);
  ctx.fillStyle = "rgba(255,236,187,0.20)";
  ctx.fillRect(sx + 23, wallY + 9, 3, 2);
  ctx.fillRect(sx + item.w - 30, wallY + 9, 3, 2);
  if (item.targetAreaId) {
    ctx.fillStyle = "rgba(255,214,124,0.38)";
    ctx.beginPath(); ctx.ellipse(sx + item.w / 2, sy + item.h - 4, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (item.label) {
    ctx.fillStyle = "#6f5135";
    ctx.fillRect(sx + 8, sy + item.h - 22, 10, 6);
    ctx.fillStyle = "#c9b37f";
    ctx.fillRect(sx + 9, sy + item.h - 21, 8, 4);
  }
} else if (item.type === "well") {

        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath(); ctx.ellipse(sx + item.w / 2, sy + item.h - 3, (item.w - 8) / 2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
        fillRoundedRect(sx + 3, sy + 7, item.w - 6, item.h - 10, 7, "#8d958d");
        fillRoundedRect(sx + 5, sy + 9, item.w - 10, item.h - 14, 6, "#6c726c");
        fillRoundedRect(sx + 7, sy + 11, item.w - 14, item.h - 18, 6, "#cfe6f2");
        fillRoundedRect(sx + 5, sy + 2, 3, 11, 2, "#6b4728");
        fillRoundedRect(sx + item.w - 8, sy + 2, 3, 11, 2, "#6b4728");
        fillRoundedRect(sx + 6, sy + 2, item.w - 12, 3, 2, "#87633b");
        softLine(sx + 7, sy + 12, sx + item.w - 7, sy + 12, "rgba(255,255,255,0.16)", 1.3, 0.85);

} else if (item.type === "npc") {
  const palettes = {
    merchant: { cloak: "#6b4a2b", tunic: "#4c7a47", trim: "#d8c18d", hair: "#714628" },
    scholar: { cloak: "#4b5e77", tunic: "#9f8b69", trim: "#d7e5ef", hair: "#6c6043" },
    guard: { cloak: "#33486a", tunic: "#6f7f8f", trim: "#d8e0ef", hair: "#7d6c51" },
    traveler: { cloak: "#5c4c73", tunic: "#6e5c46", trim: "#e4d7ef", hair: "#87553d" },
    villager: { cloak: "#586249", tunic: "#8d7758", trim: "#eadbb9", hair: "#705138" },
  };
  const colors = palettes[item.palette || "villager"] || palettes.villager;
  ctx.fillStyle = "rgba(0,0,0,0.19)";
  ctx.beginPath(); ctx.ellipse(sx + 12, sy + 21, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.cloak;
  ctx.beginPath();
  ctx.moveTo(sx + 4, sy + 20);
  ctx.lineTo(sx + 7, sy + 10);
  ctx.lineTo(sx + 17, sy + 10);
  ctx.lineTo(sx + 20, sy + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.tunic;
  fillRoundedRect(sx + 7, sy + 11, 10, 10, 4, colors.tunic);
  ctx.fillStyle = colors.trim;
  fillRoundedRect(sx + 9, sy + 13, 6, 5, 2, colors.trim);
  ctx.fillStyle = "#f0d8bb";
  ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 4.7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.hair;
  ctx.beginPath(); ctx.arc(sx + 12, sy + 6.3, 4.9, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2a201a";
  ctx.beginPath(); ctx.arc(sx + 10.5, sy + 8, 0.8, 0, Math.PI * 2); ctx.arc(sx + 13.5, sy + 8, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(sx + 7, sy + 12, 2, 7);
  if (item.role === "Guard") fillRoundedRect(sx + 17, sy + 10, 3, 12, 2, "#c9d7ef");
  if (item.role === "Merchant") fillRoundedRect(sx + 4, sy + 14, 3, 7, 2, "#a37a49");
} else if (item.type === "crackedWall") {

        fillRoundedRect(sx + 4, sy + 5, item.w - 8, item.h - 10, 5, "#7f7468");
        softLine(sx + 10, sy + 10, sx + item.w - 10, sy + item.h - 10, "#ded3bf", 1.3, 1);
        softLine(sx + item.w - 12, sy + 11, sx + 11, sy + item.h - 12, "#c8b48d", 1.1, 1);
        softLine(sx + 14, sy + 8, sx + 20, sy + 18, "#fff4d4", 1.0, 1);
      } else if (item.type === "secretEntrance") {
        const pulse = 0.44 + Math.sin(performance.now() / 220) * 0.18;
        fillRoundedRect(sx + 6, sy + 7, item.w - 12, item.h - 10, 8, "#1c1a20");
        fillRoundedRect(sx + 10, sy + 11, item.w - 20, item.h - 18, 7, `rgba(156, 205, 163, ${0.18 + pulse * 0.18})`);
      } else if (item.type === "loreTablet") {
        const pulse = 0.5 + Math.sin(performance.now() / 260) * 0.16;
        fillRoundedRect(sx + 6, sy + 8, 36, 26, 6, "#7d7567");
        fillRoundedRect(sx + 10, sy + 10, 28, 20, 5, "#a79a84");
        fillRoundedRect(sx + 12, sy + 12, 24, 16, 4, `rgba(214, 191, 130, ${0.11 + pulse * 0.06})`);
        softLine(sx + 16, sy + 16, sx + 32, sy + 16, "#cfbb84", 1.3, 1);
        softLine(sx + 15, sy + 21, sx + 33, sy + 21, "#cfbb84", 1.3, 1);
        softLine(sx + 17, sy + 26, sx + 31, sy + 26, "#cfbb84", 1.3, 1);
      } else if (item.type === "runePlate") {
        const glow = item.active ? 0.34 : 0.10;
        fillRoundedRect(sx + 2, sy + 2, item.w - 4, item.h - 4, 5, item.active ? "#d1d8b1" : "#7c7f74");
        fillRoundedRect(sx + 5, sy + 5, item.w - 10, item.h - 10, 4, `rgba(134, 210, 126, ${glow})`);
        softLine(sx + 7, sy + item.h / 2, sx + item.w - 7, sy + item.h / 2, item.active ? "#eaffcc" : "#b7bcad", 1.2, 1);
      } else if (item.type === "shrine") {
        const glow = allDungeonsCleared() && state.overworld.fieldCleared || item.active;
        const pulse = 0.55 + Math.sin(performance.now() / 220) * 0.25;
        fillRoundedRect(sx + 6, sy + 6, 36, 9, 4, glow ? "#98c0ff" : "#8a918b");
        fillRoundedRect(sx + 10, sy + 14, 28, 22, 8, glow ? "#9eadb0" : "#858a85");
        fillRoundedRect(sx + 18, sy + 18, 12, 12, 5, glow ? "#e5f0ff" : "#c0c5bf");
        if (glow) {
          ctx.fillStyle = `rgba(150, 210, 255, ${0.18 + pulse * 0.25})`;
          ctx.beginPath(); ctx.ellipse(sx + 24, sy + 22, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255, 243, 176, ${0.08 + pulse * 0.12})`;
          ctx.beginPath(); ctx.ellipse(sx + 24, sy + 22, 21, 16, 0, 0, Math.PI * 2); ctx.fill();
        }
      } else if (item.type === "dungeonEntrance") {
        const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.2;
        if (item.entranceStyle === "arch") {
          fillRoundedRect(sx + 8, sy + 8, 56, 25, 7, "#7a7264");
          fillRoundedRect(sx + 16, sy + 12, 40, 18, 8, "#31354a");
          fillRoundedRect(sx + 20, sy + 16, 32, 10, 6, `rgba(110,190,255,${0.14 + pulse * 0.2})`);
        } else if (item.entranceStyle === "cave") {
          fillRoundedRect(sx + 6, sy + 14, 56, 18, 9, "#34251d");
          ctx.fillStyle = "#0b0d0d";
          ctx.beginPath(); ctx.ellipse(sx + 35, sy + 20, 18, 10, 0, Math.PI, Math.PI * 2); ctx.fill();
          fillRoundedRect(sx + 22, sy + 14, 26, 10, 5, `rgba(91, 181, 112, ${0.11 + pulse * 0.16})`);
        } else {
          fillRoundedRect(sx + 10, sy + 16, 40, 10, 5, "#6c6558");
          fillRoundedRect(sx + 16, sy + 12, 28, 14, 6, "#2b1d18");
          fillRoundedRect(sx + 20, sy + 16, 20, 6, 4, "#b45b31");
          fillRoundedRect(sx + 18, sy + 12, 24, 10, 5, `rgba(255,160,80,${0.12 + pulse * 0.16})`);
        }
      } else if (item.type === "pushBlock") {
        ctx.fillStyle = "rgba(0,0,0,0.16)";
        ctx.beginPath(); ctx.ellipse(sx + item.w / 2, sy + item.h - 1, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        fillRoundedRect(sx + 2, sy + 2, item.w - 4, item.h - 4, 5, "#8b8479");
        fillRoundedRect(sx + 5, sy + 5, item.w - 10, item.h - 10, 4, "#b9b09e");
        softLine(sx + 7, sy + 7, sx + item.w - 7, sy + item.h - 7, "rgba(255,255,255,0.18)", 1.0, 1);
      } else if (item.type === "returnSigil" || item.type === "exitPortal") {
        const pulse = 0.4 + Math.sin(performance.now() / 200) * 0.2;
        fillRoundedRect(sx + 3, sy + 3, item.w - 6, item.h - 6, 8, "#18212f");
        fillRoundedRect(sx + 7, sy + 7, item.w - 14, item.h - 14, 7, `rgba(120, 180, 255, ${0.22 + pulse * 0.25})`);
      } else if (item.type === "roomGate" || item.type === "lockedSeal") {
        const progress = dungeonProgress(item.dungeonId);
        const isOpen = item.type === "roomGate"
          ? !item.requireClear || !area.enemies.some((enemy) => !enemy.dead)
          : progress.sealUnlocked || (progress.keyOwned && !area.enemies.some((enemy) => !enemy.dead));
        fillRoundedRect(sx + 4, sy + 4, item.w - 8, item.h - 4, 6, isOpen ? "#7ab7ff" : "#4f4d63");
        fillRoundedRect(sx + 8, sy + 8, item.w - 16, item.h - 12, 5, isOpen ? "#d4e9ff" : "#8a8896");
      } else if (item.type === "dungeonKeyPedestal") {
        fillRoundedRect(sx + 8, sy + 12, 32, 12, 5, "#675e52");
        fillRoundedRect(sx + 20, sy + 2, 8, 12, 4, "#f6d86f");
        fillRoundedRect(sx + 28, sy + 6, 8, 4, 3, "#f6d86f");
      } else if (item.type === "secretChest") {
        fillRoundedRect(sx + 6, sy + 10, 36, 16, 6, item.rewardKind === "silverToken" ? "#5a4632" : "#6f3a44");
        fillRoundedRect(sx + 10, sy + 14, 28, 8, 4, item.rewardKind === "silverToken" ? "#d7dfe7" : "#ffd6dd");
        if (item.opened) fillRoundedRect(sx + 14, sy + 6, 20, 4, 3, item.rewardKind === "silverToken" ? "#eef4fb" : "#fff0f3");
      } else if (item.type === "rewardChest") {
        const wood = item.dungeonId === "ember" ? "#7b4023" : item.dungeonId === "rootwood" ? "#5a4327" : "#6a3d24";
        fillRoundedRect(sx + 6, sy + 10, 36, 16, 6, wood);
        fillRoundedRect(sx + 10, sy + 14, 28, 8, 4, "#d6b66f");
        if (item.opened) fillRoundedRect(sx + 14, sy + 6, 20, 4, 3, "#f6d86f");
      }
    }
  }

  function drawPickups() {
    const area = currentArea();
    for (const pickup of area.pickups) {
      const sx = pickup.x - state.camera.x;
      const sy = pickup.y - state.camera.y + Math.sin(pickup.bob) * 2;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath(); ctx.ellipse(sx, sy + 7, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
      if (pickup.kind === "rupeeBlue") {
        fillRoundedRect(sx - 4, sy - 6, 8, 12, 4, "#6ec4ff");
        fillRoundedRect(sx - 2, sy - 3, 4, 7, 3, "#e8f7ff");
      } else {
        fillRoundedRect(sx - 4, sy - 6, 8, 12, 4, "#74e364");
        fillRoundedRect(sx - 2, sy - 3, 4, 7, 3, "#eeffe1");
      }
    }
  }


function drawEnemies() {
  const area = currentArea();
  for (const enemy of area.enemies) {
    if (enemy.dead) continue;
    const sx = enemy.x - state.camera.x;
    const sy = enemy.y - state.camera.y;
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(sx, sy + 11, enemy.isBoss ? 12 : 9, enemy.isBoss ? 4 : 3, 0, 0, Math.PI * 2); ctx.fill();

    if (enemy.type === "knight") {
      const armor = enemy.hurt > 0 ? "#ffffff" : enemy.tint === "embersteel" ? "#8d4f30" : enemy.tint === "vine" ? "#4a6a3c" : "#65759a";
      const trim = enemy.tint === "embersteel" ? "#dfbb86" : enemy.tint === "vine" ? "#cae7aa" : "#e4efff";
      const cloak = enemy.tint === "embersteel" ? "#5c2f20" : enemy.tint === "vine" ? "#2d4427" : "#2f3e66";
      fillRoundedRect(sx - 8, sy - 9, 16, 18, 5, armor);
      fillRoundedRect(sx - 6, sy - 6, 12, 8, 3, trim);
      fillRoundedRect(sx - 7, sy + 4, 14, 8, 4, cloak);
      ctx.fillStyle = "#ecd5b0";
      ctx.beginPath(); ctx.arc(sx, sy - 10, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2a2118";
      ctx.beginPath(); ctx.arc(sx - 1.5, sy - 10, 0.7, 0, Math.PI * 2); ctx.arc(sx + 1.5, sy - 10, 0.7, 0, Math.PI * 2); ctx.fill();
      fillRoundedRect(sx + 8, sy - 5, 3, 15, 2, trim);
      fillRoundedRect(sx - 11, sy - 3, 4, 12, 3, "#b6c8df");
    } else if (enemy.tint === "moss") {
      fillRoundedRect(sx - 8, sy - 5, 16, 12, 5, enemy.hurt > 0 ? "#ffffff" : "#4c7f43");
      fillRoundedRect(sx - 6, sy - 8, 12, 6, 4, "#7fbf6c");
      fillRoundedRect(sx - 4, sy - 1, 8, 6, 3, "#d4efb3");
      ctx.fillStyle = "#191511";
      ctx.beginPath(); ctx.arc(sx - 2, sy - 1, 0.9, 0, Math.PI * 2); ctx.arc(sx + 2, sy - 1, 0.9, 0, Math.PI * 2); ctx.fill();
      softLine(sx - 8, sy + 2, sx - 11, sy + 8, "#274120", 1.4, 1);
      softLine(sx + 8, sy + 1, sx + 11, sy + 8, "#274120", 1.4, 1);
    } else if (enemy.tint === "stone") {
      fillRoundedRect(sx - 8, sy - 6, 16, 14, 5, enemy.hurt > 0 ? "#ffffff" : "#918a7c");
      fillRoundedRect(sx - 5, sy - 4, 10, 7, 4, "#d8ccbb");
      ctx.fillStyle = "#2a2118";
      ctx.beginPath(); ctx.arc(sx - 2, sy - 1, 0.8, 0, Math.PI * 2); ctx.arc(sx + 2, sy - 1, 0.8, 0, Math.PI * 2); ctx.fill();
      fillRoundedRect(sx - 7, sy + 4, 3, 4, 1, "#4c4238");
      fillRoundedRect(sx + 4, sy + 4, 3, 4, 1, "#4c4238");
    } else {
      fillRoundedRect(sx - 8, sy - 6, 16, 14, 5, enemy.hurt > 0 ? "#ffffff" : "#8e4c31");
      fillRoundedRect(sx - 6, sy - 4, 12, 7, 4, "#ffc693");
      ctx.fillStyle = "#2a2118";
      ctx.beginPath(); ctx.arc(sx - 2, sy - 1, 0.8, 0, Math.PI * 2); ctx.arc(sx + 2, sy - 1, 0.8, 0, Math.PI * 2); ctx.fill();
      softLine(sx - 7, sy - 6, sx - 10, sy - 10, "#ff9d52", 1.2, 1);
      softLine(sx + 7, sy - 6, sx + 10, sy - 10, "#ff9d52", 1.2, 1);
    }

    if (enemy.health > 1) {
      const ratio = clamp(enemy.health / Math.max(1, enemy.maxHealth), 0, 1);
      const width = enemy.isBoss ? 28 : enemy.type === "knight" ? 16 : 10;
      fillRoundedRect(sx - Math.floor(width / 2), sy - (enemy.isBoss ? 20 : 13), width, 4, 2, "rgba(0,0,0,0.40)");
      fillRoundedRect(sx - Math.floor(width / 2), sy - (enemy.isBoss ? 20 : 13), Math.max(1, Math.floor(width * ratio)), 4, 2, enemy.isBoss ? "#ffb25f" : "#fff6c2");
    }
  }
}

function drawPlayer() {
  const p = state.player;
  const sx = p.x - state.camera.x;
  const sy = p.y - state.camera.y;
  const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;
  if (!blink) {
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath(); ctx.ellipse(sx, sy + 11, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#ebd2b3";
    ctx.beginPath(); ctx.arc(sx, sy - 3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7d5d36";
    ctx.beginPath(); ctx.arc(sx, sy - 5.4, 5.4, Math.PI, Math.PI * 2); ctx.fill();
    fillRoundedRect(sx - 8, sy - 12, 16, 6, 4, "#517042");
    fillRoundedRect(sx - 7, sy - 2, 14, 10, 4, "#dfebc7");
    fillRoundedRect(sx - 8, sy + 1, 16, 9, 5, "#406f43");
    fillRoundedRect(sx - 9, sy + 1, 3, 8, 2, "#d8e3f2");
    fillRoundedRect(sx - 6, sy + 9, 4, 8, 2, "#8d6a39");
    fillRoundedRect(sx + 2, sy + 9, 4, 8, 2, "#8d6a39");
    ctx.fillStyle = "#2b2118";
    ctx.beginPath(); ctx.arc(sx - 1.6, sy - 3.1, 0.8, 0, Math.PI * 2); ctx.arc(sx + 1.6, sy - 3.1, 0.8, 0, Math.PI * 2); ctx.fill();
    fillRoundedRect(sx + 6, sy - 1, 3, 12, 2, "#9c7a46");

    const weapon = activeWeaponData();
    if (p.isRunning) {
      ctx.fillStyle = "rgba(255, 248, 202, 0.28)";
      ctx.beginPath(); ctx.ellipse(sx, sy + 3, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    const weaponColor = weapon.id === "wand" ? "#ffbf6c" : "#d7e8ff";
    if (Math.abs(p.lastDir.x) > Math.abs(p.lastDir.y)) {
      fillRoundedRect(sx + (p.lastDir.x > 0 ? 8 : -11), sy - 1, weapon.id === "spear" ? 10 : 7, 3, 2, weaponColor);
    } else {
      fillRoundedRect(sx - 1, sy + (p.lastDir.y > 0 ? 9 : -12), 3, weapon.id === "spear" ? 12 : 8, 2, weaponColor);
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
    const angle = Math.atan2(dir.y, dir.x);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.strokeStyle = weapon.id === "spear" ? "#d8e8ff" : "#fff4ce";
    ctx.lineWidth = weapon.id === "spear" ? 8 : 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, weapon.id === "spear" ? 18 : 12, -0.7, 0.7);
    ctx.stroke();
    ctx.strokeStyle = "#f6d86f";
    ctx.lineWidth = weapon.id === "spear" ? 3 : 4;
    ctx.beginPath();
    ctx.arc(0, 0, weapon.id === "spear" ? 18 : 12, -0.58, 0.58);
    ctx.stroke();
    ctx.restore();
  }

function drawForegroundOccluders() {
  const area = currentArea();
  const p = state.player;
  if (!area || !p) return;
  for (let y = Math.max(0, Math.floor(state.camera.y / TILE) - 1); y < Math.min(area.height, Math.ceil((state.camera.y + state.logicalHeight) / TILE) + 1); y += 1) {
    for (let x = Math.max(0, Math.floor(state.camera.x / TILE) - 1); x < Math.min(area.width, Math.ceil((state.camera.x + state.logicalWidth) / TILE) + 1); x += 1) {
      if (area.world[y][x] !== 1) continue;
      const wx = x * TILE; const wy = y * TILE;
      if (p.x > wx - 4 && p.x < wx + TILE + 4 && p.y < wy + 15 && p.y > wy + 2) {
        const sx = wx - state.camera.x;
        const sy = wy - state.camera.y;
        ctx.fillStyle = 'rgba(47,90,36,0.88)';
        ctx.fillRect(sx, sy + 6, TILE, 5);
        ctx.fillStyle = 'rgba(115,178,79,0.65)';
        ctx.fillRect(sx + 3, sy + 7, 5, 1);
        ctx.fillRect(sx + 12, sy + 6, 4, 1);
      }
    }
  }
  for (const item of area.interactables) {
    if (item.type !== 'house' || item.visible === false) continue;
    if (p.x < item.x || p.x > item.x + item.w || p.y > item.y + 34 || p.y < item.y + 8) continue;
    const sx = item.x - state.camera.x;
    const sy = item.y - state.camera.y;
    ctx.fillStyle = 'rgba(60,44,23,0.92)';
    ctx.beginPath();
    ctx.moveTo(sx + 14, sy + 28);
    ctx.lineTo(sx + 22, sy + 16);
    ctx.lineTo(sx + item.w - 22, sy + 16);
    ctx.lineTo(sx + item.w - 14, sy + 28);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEffects() {
  for (const projectile of state.projectiles) {
    const sx = projectile.x - state.camera.x;
    const sy = projectile.y - state.camera.y;
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(sx - projectile.r, sy + projectile.r + 1, projectile.r * 2, 2);
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
    ctx.fillRect(sx - 5, sy - 5, 10, 10);
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
    ensureVignetteCache();
    ctx.drawImage(state.renderCache.vignette, 0, 0);
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
      state.save.autosaveTimer += dt;
      if (state.save.autosaveTimer >= AUTOSAVE_INTERVAL) {
        saveGame("autosave", true);
      }
    }
    updatePickupsAndParticles(dt);
    updateTransition(dt);
    updateCamera(dt);
    updateDiagnostics(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function init() {
    state.save.available = storageAvailable();
    syncBuildStamp();
    resizeCanvas();
    state.secrets = emptySecrets();
    state.player = makePlayer();
    state.dungeons = {
      ruins: emptyDungeonProgress(),
      rootwood: emptyDungeonProgress(),
      ember: emptyDungeonProgress(),
    };
    state.areas = buildAreas();
    applyPersistentWorldState();
    setArea("overworld", "start", true);
    updateStartButtons();
    if (state.save.available) {
      tryLoadSavedGame(true);
      startCard.hidden = false;
      state.running = false;
      updateStartButtons();
      setMessage(state.save.hasSave ? "Continue your road or begin a new one." : "Press Start to begin your road through Elderfield.", 999);
    } else {
      setMessage("Press Start, move with WASD, click or tap to attack, and Enter to speak, read stones, and rest your road in Dawnrest.", 999);
    }
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
        if (state.save.hasSave) {
          const loaded = tryLoadSavedGame(false);
          if (!loaded) resetGame();
        } else {
          resetGame();
        }
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

  startButton.addEventListener("click", () => {
    if (state.save.hasSave) {
      const loaded = tryLoadSavedGame(false);
      if (!loaded) resetGame();
    } else {
      resetGame();
    }
  });
  newGameButton.addEventListener("click", () => {
    clearSavedProgress(false);
    resetGame();
  });
  clearSaveButton.addEventListener("click", () => {
    clearSavedProgress(true);
    updateStartButtons();
  });
  restartButton.addEventListener("click", () => {
    clearSavedProgress(false);
    resetGame();
  });
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
      if (state.save.hasSave) {
        const loaded = tryLoadSavedGame(false);
        if (!loaded) resetGame();
      } else {
        resetGame();
      }
      return;
    }
    interact();
  });

  init();
})();
