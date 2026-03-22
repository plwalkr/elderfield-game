(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const canvasWrap = document.getElementById("canvasWrap");
  const messageBox = document.getElementById("messageBox");
  const heartsValue = document.getElementById("heartsValue");
  const enemiesValue = document.getElementById("enemiesValue");
  const startCard = document.getElementById("startCard");
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
  const WORLD_W = 84;
  const WORLD_H = 50;
  const INVULN_TIME = 0.7;
  const ATTACK_COOLDOWN = 0.25;
  const ATTACK_TIME = 0.13;
  const ENEMY_TOUCH_DAMAGE = 1;
  const GAME_VERSION = "v2.0.0";
  const BUILD_DATE = "2026-03-22";
  const BUILD_NAME = "Diagnostics Pass";

  const keys = Object.create(null);
  const touchState = { up: false, down: false, left: false, right: false };
  const pointerState = { x: 0, y: 0, active: false };

  const state = {
    running: false,
    victory: false,
    gameOver: false,
    logicalWidth: 480,
    logicalHeight: 270,
    camera: { x: 0, y: 0 },
    world: [],
    solids: [],
    decorations: [],
    interactables: [],
    enemies: [],
    particles: [],
    strikeDust: [],
    player: null,
    lastTime: 0,
    message: "",
    messageTimer: 0,
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

  function setMessage(text, time = 2.5) {
    state.message = text;
    state.messageTimer = time;
    messageBox.textContent = text;
  }

  function setDebugAction(text) {
    state.debug.lastAction = text;
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
      if (state.debug.fps < 38) {
        status = "issue";
        issues.push(`fps low (${state.debug.fps})`);
      } else if (state.debug.fps < 55 && status !== "issue") {
        status = "warn";
        issues.push(`fps dipped (${state.debug.fps})`);
      }
    }

    if (state.player) {
      if (state.player.health <= 1 && status !== "issue") {
        status = "warn";
        issues.push("player health critical");
      }
      if (state.gameOver) {
        status = "issue";
        issues.push("player defeated");
      }
    }

    if (state.debug.copyResult === "failed" && status !== "issue") {
      status = "warn";
      issues.push("clipboard copy fallback needed");
    }

    if (issues.length === 0) {
      issues.push("all systems stable");
    }

    state.debug.status = status;
    state.debug.statusText = status === "good" ? "GOOD" : status === "warn" ? "WARN" : "ISSUE";
    state.debug.issues = issues;
    updateStatusUi();
  }

  function buildDebugReport() {
    const player = state.player || { x: 0, y: 0, health: 0, maxHealth: 0, attackTimer: 0, invuln: 0, lastDir: { x: 0, y: 0 } };
    const enemyCount = state.enemies.filter((enemy) => !enemy.dead).length;
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
      ``,
      `Viewport`,
      `- LogicalSize=${state.logicalWidth}x${state.logicalHeight}`,
      `- CanvasBacking=${canvas.width}x${canvas.height}`,
      `- Camera=${state.camera.x.toFixed(1)}, ${state.camera.y.toFixed(1)}`,
      ``,
      `Player`,
      `- Pos=${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
      `- Health=${player.health}/${player.maxHealth}`,
      `- Facing=${player.lastDir.x.toFixed(2)}, ${player.lastDir.y.toFixed(2)}`,
      `- AttackTimer=${player.attackTimer.toFixed(3)}`,
      `- Invuln=${player.invuln.toFixed(3)}`,
      ``,
      `World`,
      `- EnemiesAlive=${enemyCount}`,
      `- Particles=${state.particles.length}`,
      `- StrikeDust=${state.strikeDust.length}`,
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
    setMessage(state.debug.enabled ? "Dev overlay opened." : "Dev overlay hidden.", 1.4);
  }

  function toggleHitboxes() {
    state.debug.hitboxes = !state.debug.hitboxes;
    setDebugAction(state.debug.hitboxes ? "hitboxes-on" : "hitboxes-off");
    setMessage(state.debug.hitboxes ? "Hitboxes enabled." : "Hitboxes hidden.", 1.4);
    refreshDebugPanel();
  }

  function clearAllEnemies() {
    let changed = false;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      enemy.dead = true;
      burst(enemy.x, enemy.y, enemy.tint === "moss" ? ["#98f58d", "#d7ffd0"] : ["#ffb25e", "#fff0c2"]);
      changed = true;
    }
    if (changed) {
      updateHud();
      setDebugAction("clear-enemies");
      setMessage("All field enemies cleared for testing.", 2.2);
      refreshDebugPanel();
    }
  }

  function healPlayer() {
    if (!state.player) return;
    state.player.health = state.player.maxHealth;
    updateHud();
    setDebugAction("heal-player");
    setMessage("Hearts restored.", 1.6);
    refreshDebugPanel();
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
    if (state.debug.enabled) {
      refreshDebugPanel();
    }
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

    const base = window.innerWidth <= 640 ? 384 : window.innerWidth <= 1000 ? 480 : 640;
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

  function buildWorld() {
    state.world = make2DArray(WORLD_W, WORLD_H, 0);
    state.solids = make2DArray(WORLD_W, WORLD_H, false);
    state.decorations = [];
    state.interactables = [];

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        const isBorder = x === 0 || y === 0 || x === WORLD_W - 1 || y === WORLD_H - 1;
        if (isBorder) {
          state.world[y][x] = 1;
          state.solids[y][x] = true;
          continue;
        }

        const n = seededNoise(x, y);
        if (n > 0.94) state.world[y][x] = 5;
        else if (n < 0.04) state.world[y][x] = 6;
      }
    }

    fillRect(28, 7, 12, 8, 2, true);
    fillRect(57, 29, 10, 7, 2, true);
    fillRect(10, 31, 9, 6, 2, true);

    ringTrees(28, 7, 12, 8);
    ringTrees(57, 29, 10, 7);
    ringTrees(10, 31, 9, 6);

    placeForestPatch(63, 8, 10, 9);
    placeForestPatch(35, 33, 12, 10);
    placeForestPatch(6, 7, 8, 10);

    scatterStones(14, 16, 18, 7, 10);
    scatterStones(46, 16, 16, 9, 13);
    scatterStones(63, 22, 9, 7, 8);

    carvePath(6, 26, 74, 26, 3);
    carvePath(18, 8, 18, 40, 3);
    carvePath(52, 10, 52, 36, 3);

    clearRect(40, 21, 5, 5, 0, false);
    placeShrine(42, 23);
    placeSign(16, 23);

    state.player = {
      x: 7.5 * TILE,
      y: 25.5 * TILE,
      w: 18,
      h: 18,
      speed: 122,
      lastDir: { x: 0, y: 1 },
      attackCooldown: 0,
      attackTimer: 0,
      attackDir: { x: 0, y: 1 },
      slashHitIds: new Set(),
      health: 5,
      maxHealth: 5,
      invuln: 0,
      facingBob: 0,
    };

    spawnEnemies();
    updateHud();
  }

  function carvePath(x1, y1, x2, y2, tile) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        state.world[y][x] = tile;
        state.solids[y][x] = false;
      }
    }
  }

  function fillRect(x, y, w, h, tile, solid) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        if (ix < 1 || iy < 1 || ix >= WORLD_W - 1 || iy >= WORLD_H - 1) continue;
        state.world[iy][ix] = tile;
        state.solids[iy][ix] = solid;
      }
    }
  }

  function clearRect(x, y, w, h, tile, solid) {
    fillRect(x, y, w, h, tile, solid);
  }

  function ringTrees(x, y, w, h) {
    for (let iy = y - 1; iy <= y + h; iy += 1) {
      for (let ix = x - 1; ix <= x + w; ix += 1) {
        const onEdge = iy === y - 1 || iy === y + h || ix === x - 1 || ix === x + w;
        if (!onEdge) continue;
        if (ix < 1 || iy < 1 || ix >= WORLD_W - 1 || iy >= WORLD_H - 1) continue;
        state.world[iy][ix] = 1;
        state.solids[iy][ix] = true;
      }
    }
  }

  function placeForestPatch(x, y, w, h) {
    for (let iy = y; iy < y + h; iy += 1) {
      for (let ix = x; ix < x + w; ix += 1) {
        if (seededNoise(ix * 2, iy * 3) > 0.44) {
          state.world[iy][ix] = 1;
          state.solids[iy][ix] = true;
        }
      }
    }
  }

  function scatterStones(x, y, w, h, amount) {
    let placed = 0;
    while (placed < amount) {
      const ix = x + Math.floor(Math.random() * w);
      const iy = y + Math.floor(Math.random() * h);
      if (state.world[iy][ix] !== 0 && state.world[iy][ix] !== 5 && state.world[iy][ix] !== 6) continue;
      state.world[iy][ix] = 4;
      state.solids[iy][ix] = true;
      placed += 1;
    }
  }

  function placeShrine(tileX, tileY) {
    state.interactables.push({
      type: "shrine",
      x: tileX * TILE,
      y: tileY * TILE,
      w: TILE * 2,
      h: TILE * 2,
      active: false,
    });
  }

  function placeSign(tileX, tileY) {
    state.interactables.push({
      type: "sign",
      x: tileX * TILE,
      y: tileY * TILE,
      w: TILE,
      h: TILE,
      text: "The old shrine wakes only after every creature falls.",
    });
  }

  function spawnEnemies() {
    const enemySpots = [
      [23, 18], [31, 20], [44, 12], [58, 18], [67, 24], [49, 32], [26, 36], [15, 15], [70, 12], [21, 43],
    ];

    state.enemies = enemySpots.map((spot, index) => ({
      id: index + 1,
      x: (spot[0] + 0.5) * TILE,
      y: (spot[1] + 0.5) * TILE,
      w: 18,
      h: 18,
      speed: 54 + (index % 3) * 10,
      dir: randomDir(),
      changeTimer: 0.5 + Math.random() * 1.5,
      chaseRadius: 130 + Math.random() * 60,
      health: index % 4 === 0 ? 2 : 1,
      hurt: 0,
      dead: false,
      tint: index % 2 === 0 ? "moss" : "ember",
    }));
  }

  function randomDir() {
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    return { ...dirs[Math.floor(Math.random() * dirs.length)] };
  }

  function updateHud() {
    heartsValue.textContent = `${state.player.health}/${state.player.maxHealth}`;
    enemiesValue.textContent = state.enemies.filter((e) => !e.dead).length;
    computeStatus();
  }

  function getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return 1;
    return state.world[ty][tx];
  }

  function isSolidAtPixel(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
    return state.solids[ty][tx];
  }

  function moveWithCollision(entity, dx, dy) {
    if (dx !== 0) {
      entity.x += dx;
      if (collides(entity)) {
        entity.x -= dx;
      }
    }
    if (dy !== 0) {
      entity.y += dy;
      if (collides(entity)) {
        entity.y -= dy;
      }
    }
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

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = state.logicalWidth / rect.width;
    const scaleY = state.logicalHeight / rect.height;
    const x = (clientX - rect.left) * scaleX + state.camera.x;
    const y = (clientY - rect.top) * scaleY + state.camera.y;
    return { x, y };
  }

  function doAttack(direction) {
    const player = state.player;
    if (!state.running || state.victory || state.gameOver) return;
    if (player.attackCooldown > 0 || player.attackTimer > 0) return;

    const dir = normalize(direction.x, direction.y);
    player.attackDir = dir;
    player.lastDir = dir;
    player.attackTimer = ATTACK_TIME;
    player.attackCooldown = ATTACK_COOLDOWN;
    player.slashHitIds.clear();

    state.strikeDust.push({
      x: player.x + dir.x * 18,
      y: player.y + dir.y * 18,
      life: 0.18,
      maxLife: 0.18,
      dir,
    });
  }

  function currentSlashBox() {
    const p = state.player;
    if (p.attackTimer <= 0) return null;
    const reach = 28;
    return {
      x: p.x + p.attackDir.x * reach,
      y: p.y + p.attackDir.y * reach,
      w: 30 + Math.abs(p.attackDir.y) * 8,
      h: 30 + Math.abs(p.attackDir.x) * 8,
    };
  }

  function interact() {
    if (!state.running) return;
    const p = state.player;
    for (const item of state.interactables) {
      const box = { x: item.x + item.w / 2, y: item.y + item.h / 2, w: item.w + 18, h: item.h + 18 };
      if (!rectsOverlap(p, box)) continue;

      if (item.type === "sign") {
        setMessage(item.text, 3.4);
        return;
      }

      if (item.type === "shrine") {
        const alive = state.enemies.filter((e) => !e.dead).length;
        if (alive > 0) {
          setMessage(`The shrine is dormant. ${alive} foe${alive === 1 ? "" : "s"} still roam the field.`, 3);
          return;
        }
        item.active = true;
        state.victory = true;
        restartButton.hidden = false;
        startCard.hidden = false;
        startButton.hidden = true;
        setMessage("The shrine answers your courage. Elderfield is safe.", 4.5);
        startCard.querySelector("h2").textContent = "Field Cleansed";
        startCard.querySelector("p").textContent = "You cut down every creature in the meadow and rekindled the shrine. Next we can add items, dungeons, NPCs, and more.";
        return;
      }
    }

    setMessage("Nothing here answers you.", 1.6);
  }

  function updatePlayer(dt) {
    const p = state.player;

    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.facingBob += dt * 8;

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
      for (const enemy of state.enemies) {
        if (enemy.dead || p.slashHitIds.has(enemy.id)) continue;
        if (rectsOverlap({ ...slash, w: slash.w, h: slash.h }, enemy)) {
          p.slashHitIds.add(enemy.id);
          enemy.health -= 1;
          enemy.hurt = 0.16;
          const knock = normalize(enemy.x - p.x, enemy.y - p.y);
          moveWithCollision(enemy, knock.x * 10, knock.y * 10);
          spawnSpark(enemy.x, enemy.y, enemy.tint === "moss" ? "#9df58e" : "#ffb05a");
          if (enemy.health <= 0) {
            enemy.dead = true;
            burst(enemy.x, enemy.y, enemy.tint === "moss" ? ["#98f58d", "#d7ffd0"] : ["#ffb25e", "#fff0c2"]);
            updateHud();
            const alive = state.enemies.filter((e) => !e.dead).length;
            if (alive === 0) {
              setMessage("Every foe has fallen. Return to the shrine and press Enter.", 4);
            }
          }
        }
      }
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (rectsOverlap(p, enemy) && p.invuln <= 0) {
        p.health -= ENEMY_TOUCH_DAMAGE;
        p.invuln = INVULN_TIME;
        const shove = normalize(p.x - enemy.x, p.y - enemy.y);
        moveWithCollision(p, shove.x * 18, shove.y * 18);
        burst(p.x, p.y, ["#ff8a8a", "#ffe3e3"]);
        updateHud();
        if (p.health <= 0) {
          p.health = 0;
          state.gameOver = true;
          state.running = false;
          startCard.hidden = false;
          startButton.hidden = true;
          restartButton.hidden = false;
          startCard.querySelector("h2").textContent = "Felled in the Field";
          startCard.querySelector("p").textContent = "The meadow won this round. Start again and cut a cleaner path.";
          setMessage("You were overwhelmed. Try a sharper route through the field.", 4);
        }
      }
    }
  }

  function updateEnemies(dt) {
    const p = state.player;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.changeTimer -= dt;

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      let dir = enemy.dir;
      let speed = enemy.speed;

      if (dist < enemy.chaseRadius) {
        dir = normalize(dx, dy);
        speed *= 1.25;
      } else if (enemy.changeTimer <= 0) {
        enemy.dir = randomDir();
        enemy.changeTimer = 0.65 + Math.random() * 1.25;
        dir = enemy.dir;
      }

      moveWithCollision(enemy, dir.x * speed * dt, dir.y * speed * dt);

      if (collides(enemy)) {
        enemy.dir = randomDir();
      }
    }
  }

  function updateParticles(dt) {
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
    const targetX = clamp(state.player.x - state.logicalWidth / 2, 0, WORLD_W * TILE - state.logicalWidth);
    const targetY = clamp(state.player.y - state.logicalHeight / 2, 0, WORLD_H * TILE - state.logicalHeight);
    const lerpFactor = 1 - Math.pow(0.001, dt * 2.2);
    state.camera.x += (targetX - state.camera.x) * lerpFactor;
    state.camera.y += (targetY - state.camera.y) * lerpFactor;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function draw() {
    ctx.clearRect(0, 0, state.logicalWidth, state.logicalHeight);
    drawGround();
    drawWorldObjects();
    drawInteractables();
    drawEnemies();
    drawPlayer();
    drawEffects();
    drawDebug();
    drawVignette();
  }

  function drawGround() {
    const startX = Math.floor(state.camera.x / TILE);
    const startY = Math.floor(state.camera.y / TILE);
    const endX = Math.ceil((state.camera.x + state.logicalWidth) / TILE) + 1;
    const endY = Math.ceil((state.camera.y + state.logicalHeight) / TILE) + 1;

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const tile = getTile(x, y);
        const sx = x * TILE - state.camera.x;
        const sy = y * TILE - state.camera.y;
        drawTile(tile, sx, sy, x, y);
      }
    }
  }

  function drawTile(tile, sx, sy, x, y) {
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
    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        const tile = getTile(x, y);
        if (![1, 4].includes(tile)) continue;
        const sx = x * TILE - state.camera.x;
        const sy = y * TILE - state.camera.y;
        if (sx < -TILE || sy < -TILE || sx > state.logicalWidth || sy > state.logicalHeight) continue;
        if (tile === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.16)";
          ctx.fillRect(sx + 4, sy + 18, 16, 4);
        }
        if (tile === 4) {
          ctx.fillStyle = "rgba(0,0,0,0.16)";
          ctx.fillRect(sx + 3, sy + 18, 16, 3);
        }
      }
    }
  }

  function drawInteractables() {
    for (const item of state.interactables) {
      const sx = item.x - state.camera.x;
      const sy = item.y - state.camera.y;
      if (item.type === "sign") {
        ctx.fillStyle = "#8b5c31";
        ctx.fillRect(sx + 10, sy + 10, 4, 10);
        ctx.fillStyle = "#dcb97a";
        ctx.fillRect(sx + 6, sy + 3, 12, 9);
        ctx.fillStyle = "#6e4b2a";
        ctx.fillRect(sx + 8, sy + 5, 8, 2);
      } else if (item.type === "shrine") {
        const alive = state.enemies.filter((e) => !e.dead).length;
        const glow = alive === 0 || item.active;
        ctx.fillStyle = glow ? "#93b9ff" : "#7f857f";
        ctx.fillRect(sx + 6, sy + 6, 36, 8);
        ctx.fillRect(sx + 10, sy + 14, 28, 22);
        ctx.fillStyle = glow ? "#d8ecff" : "#adb4aa";
        ctx.fillRect(sx + 18, sy + 18, 12, 12);
        if (glow) {
          ctx.fillStyle = "rgba(150, 210, 255, 0.28)";
          ctx.fillRect(sx + 14, sy + 14, 20, 20);
        }
      }
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const sx = enemy.x - state.camera.x;
      const sy = enemy.y - state.camera.y;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx - 7, sy + 8, 14, 3);

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
      if (enemy.health > 1) {
        ctx.fillStyle = "#fff6c2";
        ctx.fillRect(sx - 2, sy - 11, 4, 3);
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

    if (p.attackTimer > 0) {
      drawSlashEffect(sx, sy, p.attackDir, p.attackTimer / ATTACK_TIME);
    }
  }

  function drawSlashEffect(sx, sy, dir, t) {
    const alpha = clamp(t, 0, 1);
    const reach = 16;
    const px = sx + dir.x * reach;
    const py = sy + dir.y * reach;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (Math.abs(dir.x) > Math.abs(dir.y)) {
      ctx.fillStyle = "#f8f1d4";
      ctx.fillRect(px + (dir.x > 0 ? 0 : -18), py - 3, 18, 6);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px + (dir.x > 0 ? 16 : -20), py - 2, 6, 4);
    } else {
      ctx.fillStyle = "#f8f1d4";
      ctx.fillRect(px - 3, py + (dir.y > 0 ? 0 : -18), 6, 18);
      ctx.fillStyle = "#cfd8e9";
      ctx.fillRect(px - 2, py + (dir.y > 0 ? 16 : -20), 4, 6);
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

    ctx.save();
    ctx.lineWidth = 1;

    const p = state.player;
    ctx.strokeStyle = "#67e67f";
    ctx.strokeRect(
      Math.round(p.x - p.w / 2 - state.camera.x) + 0.5,
      Math.round(p.y - p.h / 2 - state.camera.y) + 0.5,
      p.w,
      p.h,
    );

    const slash = currentSlashBox();
    if (slash) {
      ctx.strokeStyle = "#f4cf68";
      ctx.strokeRect(
        Math.round(slash.x - slash.w / 2 - state.camera.x) + 0.5,
        Math.round(slash.y - slash.h / 2 - state.camera.y) + 0.5,
        slash.w,
        slash.h,
      );
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const ex = enemy.x - state.camera.x;
      const ey = enemy.y - state.camera.y;
      ctx.strokeStyle = "#f57b7b";
      ctx.strokeRect(
        Math.round(ex - enemy.w / 2) + 0.5,
        Math.round(ey - enemy.h / 2) + 0.5,
        enemy.w,
        enemy.h,
      );
      ctx.strokeStyle = "rgba(245, 207, 104, 0.35)";
      ctx.beginPath();
      ctx.arc(ex, ey, enemy.chaseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.min(state.logicalWidth, state.logicalHeight) * 0.25,
      state.logicalWidth / 2,
      state.logicalHeight / 2,
      Math.max(state.logicalWidth, state.logicalHeight) * 0.78,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.logicalWidth, state.logicalHeight);
  }

  function loop(ts) {
    if (!state.lastTime) state.lastTime = ts;
    let dt = (ts - state.lastTime) / 1000;
    state.lastTime = ts;
    dt = Math.min(dt, 0.033);

    if (state.messageTimer > 0) {
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      if (state.messageTimer === 0 && !state.victory && !state.gameOver) {
        messageBox.textContent = "Clear the field, then approach the shrine and press Enter.";
      }
    }

    if (state.running) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateParticles(dt);
      updateCamera(dt);
    } else {
      updateParticles(dt);
    }

    updateDiagnostics(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    state.running = true;
    state.victory = false;
    state.gameOver = false;
    state.lastTime = 0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.particles.length = 0;
    state.strikeDust.length = 0;
    state.debug.errors.length = 0;
    state.debug.copyResult = "idle";
    setDebugAction("reset-game");
    buildWorld();
    startCard.hidden = true;
    startButton.hidden = false;
    restartButton.hidden = true;
    setMessage("Clear the field, then approach the shrine and press Enter.", 4);
    refreshDebugPanel();
  }

  function init() {
    syncBuildStamp();
    resizeCanvas();
    buildWorld();
    setMessage("Press Start, move with WASD, click or tap to slash.", 999);
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
    if (debugKeys.includes(event.code)) {
      event.preventDefault();
    }

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
      if (!state.running && (state.victory || state.gameOver)) {
        resetGame();
      } else if (!state.running) {
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
  copyDebugButton.addEventListener("click", () => {
    copyDebugReport();
  });

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
    const press = (event) => {
      event.preventDefault();
      touchState[key] = true;
    };
    const release = (event) => {
      event.preventDefault();
      touchState[key] = false;
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  document.querySelectorAll("[data-touch-dir]").forEach((button) => {
    bindTouchDirection(button, button.dataset.touchDir);
  });

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
