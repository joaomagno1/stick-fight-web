/* ==========================================================================
   STICK FIGHT: ARENA WEB — Loop Principal, Câmera, Partículas, HUD e Menus
   ========================================================================== */

window.StickGame = window.StickGame || {};

(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Referências de UI
  const ui = {
    hud: document.getElementById('hud'),
    p1Name: document.getElementById('p1-name'),
    p1Weapon: document.getElementById('p1-weapon'),
    p1HpGhost: document.getElementById('p1-hp-ghost'),
    p1HpFill: document.getElementById('p1-hp-fill'),
    p1Score: document.getElementById('p1-score'),

    p2Name: document.getElementById('p2-name'),
    p2Weapon: document.getElementById('p2-weapon'),
    p2HpGhost: document.getElementById('p2-hp-ghost'),
    p2HpFill: document.getElementById('p2-hp-fill'),
    p2Score: document.getElementById('p2-score'),

    roundBadge: document.getElementById('round-badge'),
    arenaBadge: document.getElementById('arena-badge'),
    btnSound: document.getElementById('btn-sound'),
    btnFps: document.getElementById('btn-fps'),
    btnPause: document.getElementById('btn-pause'),
    fpsCounter: document.getElementById('fps-counter'),

    centerBanner: document.getElementById('center-banner'),
    bannerMain: document.getElementById('banner-main'),
    bannerSub: document.getElementById('banner-sub'),

    controlsBar: document.getElementById('controls-bar'),
    p2Hint: document.getElementById('p2-hint'),
    hintSep: document.getElementById('hint-sep'),

    menuScreen: document.getElementById('menu-screen'),
    modeSelect: document.getElementById('mode-select'),
    aiRow: document.getElementById('ai-row'),
    aiSelect: document.getElementById('ai-select'),
    winsSelect: document.getElementById('wins-select'),
    arenaSelect: document.getElementById('arena-select'),
    btnStart: document.getElementById('btn-start'),
    btnControls: document.getElementById('btn-controls'),

    controlsModal: document.getElementById('controls-modal'),
    btnCloseControls: document.getElementById('btn-close-controls'),

    pauseScreen: document.getElementById('pause-screen'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartMatch: document.getElementById('btn-restart-match'),
    btnBackMenu: document.getElementById('btn-back-menu'),

    victoryScreen: document.getElementById('victory-screen'),
    winnerTitle: document.getElementById('winner-title'),
    winnerScoreLine: document.getElementById('winner-score-line'),
    winnerStats: document.getElementById('winner-stats'),
    btnRematch: document.getElementById('btn-rematch'),
    btnVictoryMenu: document.getElementById('btn-victory-menu')
  };

  // Configuração escolhida no menu
  const config = {
    mode: '1p',        // '1p' ou '2p'
    aiDiff: 'normal',  // 'easy', 'normal', 'insane'
    targetWins: 5,
    arenaChoice: 'random',
    showFps: false,
    showHints: true
  };

  // Estado global da partida
  let gameState = 'menu'; // 'menu' | 'intro' | 'fighting' | 'round_over' | 'paused' | 'victory'
  let stateBeforePause = 'fighting';
  let roundNumber = 1;
  let lastArenaIdx = -1;
  let stateTimer = 0;
  let roundDecisionPending = false;
  let roundDecisionDelay = 0;

  let arena = null;
  let weaponState = null;
  let fighters = [];
  let particles = [];
  let floatingTexts = [];
  let shockwaves = [];

  // Efeitos de câmera e impacto (Juice)
  let shakeAmount = 0;
  let hitStopTimer = 0;
  let slowMoTimer = 0;

  // Medidor de FPS leve
  let fpsAccum = 0;
  let fpsFrames = 0;

  // Mapa de teclas pressionadas (usando KeyboardEvent.code)
  const keys = Object.create(null);

  const GAME_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyE',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'KeyK', 'KeyL', 'KeyO', 'Numpad1', 'Numpad2', 'Numpad3', 'Space'
  ]);

  window.addEventListener('keydown', (e) => {
    StickGame.Audio.unlock();
    keys[e.code] = true;

    if (gameState !== 'menu' && GAME_KEYS.has(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyM') {
      toggleSound();
    } else if (e.code === 'KeyH' && (gameState === 'fighting' || gameState === 'intro')) {
      config.showHints = !config.showHints;
      ui.controlsBar.classList.toggle('hidden', !config.showHints);
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!ui.controlsModal.classList.contains('hidden')) {
        ui.controlsModal.classList.add('hidden');
      } else if (gameState === 'fighting' || gameState === 'intro' || gameState === 'round_over') {
        pauseGame();
      } else if (gameState === 'paused') {
        resumeGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
  });

  // ==========================================================================
  // EFEITOS VISUAIS E EXPLOSÕES (CALLBACKS DO MUNDO)
  // ==========================================================================
  const worldCallbacks = {
    spawnParticles(x, y, color, count = 10, speed = 220) {
      if (particles.length > 260) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.25 + Math.random() * 0.85);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 40,
          size: 2 + Math.random() * 3.5,
          color,
          life: 0.25 + Math.random() * 0.3,
          maxLife: 0.55
        });
      }
    },

    spawnText(x, y, text, color = '#ffffff') {
      if (gameState === 'menu') return;
      floatingTexts.push({
        x,
        y,
        vy: -55,
        text,
        color,
        life: 0.75,
        maxLife: 0.75
      });
    },

    addShake(amount) {
      if (gameState === 'menu') return;
      shakeAmount = Math.min(20, Math.max(shakeAmount, amount));
    },

    addHitStop(duration) {
      if (gameState === 'menu') return;
      hitStopTimer = Math.max(hitStopTimer, duration);
    },

    onExplosion(x, y, radius, maxDamage, attacker) {
      if (gameState !== 'menu') {
        StickGame.Audio.explosion();
      }
      this.addShake(15);
      this.addHitStop(0.05);

      shockwaves.push({
        x,
        y,
        r: 12,
        maxR: radius,
        life: 0.28,
        maxLife: 0.28
      });

      this.spawnParticles(x, y, '#ffbe0b', 18, 420);
      this.spawnParticles(x, y, '#ff4769', 14, 320);

      // Aplica dano e impulso radial nos lutadores
      for (const f of fighters) {
        if (f.dead) continue;
        const fy = f.y - 32;
        const dx = f.x - x;
        const dy = fy - y;
        const dist = Math.hypot(dx, dy);
        if (dist <= radius + 18) {
          const factor = Math.max(0.35, 1 - dist / (radius + 18));
          const dirX = dist > 1 ? dx / dist : (Math.random() < 0.5 ? -1 : 1);
          const dmg = Math.round(maxDamage * factor);
          StickGame.Fighter.applyDamage(
            f,
            dmg,
            dirX * 760 * factor,
            -540 * factor - 120,
            attacker,
            this,
            true
          );
        }
      }

      // Reação em cadeia com caixas e outros barris próximos!
      for (const prop of arena.props) {
        if (prop.destroyed) continue;
        const px = prop.x + prop.w * 0.5;
        const py = prop.y + prop.h * 0.5;
        const dist = Math.hypot(px - x, py - y);
        if (dist <= radius) {
          const pushX = px >= x ? 360 : -360;
          StickGame.Arenas.damageProp(prop, maxDamage, pushX, -260, this);
        }
      }
    }
  };

  // ==========================================================================
  // LEITURA DE ENTRADA DOS JOGADORES
  // ==========================================================================
  function getPlayer1Input() {
    const allowSpaceAttack = config.mode === '1p' && !!keys['Space'];
    return {
      left: !!keys['KeyA'],
      right: !!keys['KeyD'],
      jump: !!keys['KeyW'],
      down: !!keys['KeyS'],
      attack: !!keys['KeyF'] || allowSpaceAttack,
      block: !!keys['KeyG'],
      throwWeapon: !!keys['KeyE']
    };
  }

  function getPlayer2Input() {
    return {
      left: !!keys['ArrowLeft'],
      right: !!keys['ArrowRight'],
      jump: !!keys['ArrowUp'],
      down: !!keys['ArrowDown'],
      attack: !!keys['KeyK'] || !!keys['Numpad1'],
      block: !!keys['KeyL'] || !!keys['Numpad2'],
      throwWeapon: !!keys['KeyO'] || !!keys['Numpad3']
    };
  }

  function emptyInput() {
    return {
      left: false,
      right: false,
      jump: false,
      down: false,
      attack: false,
      block: false,
      throwWeapon: false
    };
  }

  // ==========================================================================
  // FLUXO DE PARTIDAS, ROUNDS E MODO DEMONSTRAÇÃO
  // ==========================================================================
  function pickArenaIndex() {
    if (config.arenaChoice !== 'random') {
      return parseInt(config.arenaChoice, 10) || 0;
    }
    let idx = Math.floor(Math.random() * StickGame.Arenas.count);
    if (idx === lastArenaIdx) {
      idx = (idx + 1) % StickGame.Arenas.count;
    }
    lastArenaIdx = idx;
    return idx;
  }

  function startDemoBackground() {
    gameState = 'menu';
    StickGame.Audio.setSuppressed(true);
    arena = StickGame.Arenas.createInstance(0);
    weaponState = StickGame.Weapons.createState();
    particles = [];
    floatingTexts = [];
    shockwaves = [];

    const f1 = StickGame.Fighter.createFighter({
      id: 1,
      name: 'DEMO 1',
      color: '#00e5ff',
      isAI: true,
      aiDiff: 'normal',
      x: arena.spawns[0].x,
      y: arena.spawns[0].y,
      dir: 1
    });
    const f2 = StickGame.Fighter.createFighter({
      id: 2,
      name: 'DEMO 2',
      color: '#ff4769',
      isAI: true,
      aiDiff: 'normal',
      x: arena.spawns[1].x,
      y: arena.spawns[1].y,
      dir: -1
    });
    fighters = [f1, f2];
    stateTimer = 0;
  }

  function showBanner(mainText, subText) {
    ui.bannerMain.textContent = mainText;
    ui.bannerSub.textContent = subText || '';
    ui.centerBanner.classList.remove('hidden');
    // Reinicia animação CSS
    ui.centerBanner.style.animation = 'none';
    void ui.centerBanner.offsetWidth;
    ui.centerBanner.style.animation = '';
  }

  function hideBanner() {
    ui.centerBanner.classList.add('hidden');
  }

  function buildScorePips() {
    ui.p1Score.innerHTML = '';
    ui.p2Score.innerHTML = '';
    for (let i = 0; i < config.targetWins; i++) {
      const pip1 = document.createElement('span');
      pip1.className = 'pip' + (i < fighters[0].wins ? ' won-p1' : '');
      ui.p1Score.appendChild(pip1);

      const pip2 = document.createElement('span');
      pip2.className = 'pip' + (i < fighters[1].wins ? ' won-p2' : '');
      ui.p2Score.appendChild(pip2);
    }
  }

  function updateHudDOM() {
    if (fighters.length < 2) return;
    const p1 = fighters[0];
    const p2 = fighters[1];

    ui.p1HpFill.style.width = `${Math.max(0, (p1.hp / p1.maxHp) * 100)}%`;
    ui.p1HpGhost.style.width = `${Math.max(0, (p1.ghostHp / p1.maxHp) * 100)}%`;

    ui.p2HpFill.style.width = `${Math.max(0, (p2.hp / p2.maxHp) * 100)}%`;
    ui.p2HpGhost.style.width = `${Math.max(0, (p2.ghostHp / p2.maxHp) * 100)}%`;

    const w1 = StickGame.Weapons.CATALOG[p1.weaponId];
    const w2 = StickGame.Weapons.CATALOG[p2.weaponId];
    ui.p1Weapon.textContent = Number.isFinite(p1.ammo) ? `${w1.name} [${p1.ammo}]` : w1.name;
    ui.p2Weapon.textContent = Number.isFinite(p2.ammo) ? `${w2.name} [${p2.ammo}]` : w2.name;
  }

  function startMatch() {
    StickGame.Audio.setSuppressed(false);
    roundNumber = 1;
    lastArenaIdx = -1;

    const diffLabels = { easy: 'FÁCIL', normal: 'NORMAL', insane: 'INSANO' };
    const p2Title = config.mode === '1p' ? `CPU (${diffLabels[config.aiDiff]})` : 'JOGADOR 2';

    const p1 = StickGame.Fighter.createFighter({
      id: 1,
      name: 'JOGADOR 1',
      color: '#00e5ff',
      isAI: false
    });

    const p2 = StickGame.Fighter.createFighter({
      id: 2,
      name: p2Title,
      color: '#ff4769',
      isAI: config.mode === '1p',
      aiDiff: config.aiDiff
    });

    fighters = [p1, p2];

    ui.p1Name.textContent = p1.name;
    ui.p2Name.textContent = p2.name;

    ui.p2Hint.classList.toggle('hidden', config.mode === '1p');
    ui.hintSep.classList.toggle('hidden', config.mode === '1p');

    ui.menuScreen.classList.add('hidden');
    ui.victoryScreen.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    ui.controlsBar.classList.toggle('hidden', !config.showHints);

    buildScorePips();
    startRound();
  }

  function startRound() {
    const arenaIdx = pickArenaIndex();
    arena = StickGame.Arenas.createInstance(arenaIdx);
    weaponState = StickGame.Weapons.createState();
    particles = [];
    floatingTexts = [];
    shockwaves = [];
    shakeAmount = 0;
    hitStopTimer = 0;
    slowMoTimer = 0;

    StickGame.Fighter.resetForRound(fighters[0], arena.spawns[0].x, arena.spawns[0].y, 1);
    StickGame.Fighter.resetForRound(fighters[1], arena.spawns[1].x, arena.spawns[1].y, -1);

    ui.roundBadge.textContent = `ROUND ${roundNumber}`;
    ui.arenaBadge.textContent = arena.name;
    updateHudDOM();

    gameState = 'intro';
    stateTimer = 0.85;
    roundDecisionPending = false;
    StickGame.Audio.roundStart();
    showBanner(`ROUND ${roundNumber}`, arena.name.toUpperCase());
  }

  function finalizeRoundWinner() {
    const p1Dead = fighters[0].dead;
    const p2Dead = fighters[1].dead;

    if (p1Dead && p2Dead) {
      showBanner('EMPATE!', 'NOCAUTE DUPLO');
    } else if (p2Dead) {
      fighters[0].wins += 1;
      buildScorePips();
      showBanner('NOCAUTE!', `${fighters[0].name} VENCEU O ROUND`);
    } else if (p1Dead) {
      fighters[1].wins += 1;
      buildScorePips();
      showBanner('NOCAUTE!', `${fighters[1].name} VENCEU O ROUND`);
    }

    gameState = 'round_over';
    stateTimer = 1.85;
  }

  function showVictoryScreen() {
    gameState = 'victory';
    hideBanner();
    ui.controlsBar.classList.add('hidden');
    StickGame.Audio.victory();

    const p1 = fighters[0];
    const p2 = fighters[1];
    const winner = p1.wins >= p2.wins ? p1 : p2;

    ui.winnerTitle.textContent = `${winner.name} VENCEU!`;
    ui.winnerTitle.style.color = winner.color;
    ui.winnerScoreLine.textContent = `Placar Final: ${p1.wins} × ${p2.wins} (${roundNumber} Rounds)`;

    ui.winnerStats.innerHTML = `
      <div class="stat-card">
        <h4 style="color:${p1.color}">${p1.name}</h4>
        <div>Rounds Vencidos: <strong>${p1.wins}</strong></div>
        <div>Nocautes Aplicados: <strong>${p1.kos}</strong></div>
        <div>Dano Total Causado: <strong>${Math.round(p1.totalDamageDealt)}</strong></div>
      </div>
      <div class="stat-card">
        <h4 style="color:${p2.color}">${p2.name}</h4>
        <div>Rounds Vencidos: <strong>${p2.wins}</strong></div>
        <div>Nocautes Aplicados: <strong>${p2.kos}</strong></div>
        <div>Dano Total Causado: <strong>${Math.round(p2.totalDamageDealt)}</strong></div>
      </div>
    `;

    ui.victoryScreen.classList.remove('hidden');
  }

  function pauseGame() {
    if (gameState === 'paused') return;
    stateBeforePause = gameState;
    gameState = 'paused';
    ui.pauseScreen.classList.remove('hidden');
  }

  function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = stateBeforePause;
    ui.pauseScreen.classList.add('hidden');
  }

  function returnToMenu() {
    hideBanner();
    ui.hud.classList.add('hidden');
    ui.controlsBar.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');
    ui.victoryScreen.classList.add('hidden');
    ui.menuScreen.classList.remove('hidden');
    startDemoBackground();
  }

  function toggleSound() {
    const on = StickGame.Audio.toggle();
    ui.btnSound.textContent = on ? '🔊' : '🔇';
  }

  // ==========================================================================
  // EVENTOS DOS BOTÕES DE INTERFACE
  // ==========================================================================
  function bindSegmented(container, attr, onSelect) {
    const buttons = container.querySelectorAll('.seg-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        StickGame.Audio.click();
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        btn.blur();
        onSelect(btn.getAttribute(attr));
      });
    });
  }

  bindSegmented(ui.modeSelect, 'data-mode', (val) => {
    config.mode = val;
    ui.aiRow.classList.toggle('hidden', val === '2p');
  });

  bindSegmented(ui.aiSelect, 'data-ai', (val) => {
    config.aiDiff = val;
  });

  bindSegmented(ui.winsSelect, 'data-wins', (val) => {
    config.targetWins = parseInt(val, 10) || 5;
  });

  ui.arenaSelect.addEventListener('change', () => {
    StickGame.Audio.click();
    config.arenaChoice = ui.arenaSelect.value;
    ui.arenaSelect.blur();
  });

  ui.btnStart.addEventListener('click', () => {
    ui.btnStart.blur();
    StickGame.Audio.click();
    startMatch();
  });

  ui.btnControls.addEventListener('click', () => {
    ui.btnControls.blur();
    StickGame.Audio.click();
    ui.controlsModal.classList.remove('hidden');
  });

  ui.btnCloseControls.addEventListener('click', () => {
    ui.btnCloseControls.blur();
    StickGame.Audio.click();
    ui.controlsModal.classList.add('hidden');
  });

  ui.btnSound.addEventListener('click', () => {
    ui.btnSound.blur();
    toggleSound();
  });

  ui.btnFps.addEventListener('click', () => {
    ui.btnFps.blur();
    StickGame.Audio.click();
    config.showFps = !config.showFps;
    ui.fpsCounter.classList.toggle('hidden', !config.showFps);
  });

  ui.btnPause.addEventListener('click', () => {
    ui.btnPause.blur();
    StickGame.Audio.click();
    if (gameState === 'paused') resumeGame();
    else if (gameState === 'fighting' || gameState === 'intro' || gameState === 'round_over') pauseGame();
  });

  ui.btnResume.addEventListener('click', () => {
    ui.btnResume.blur();
    StickGame.Audio.click();
    resumeGame();
  });

  ui.btnRestartMatch.addEventListener('click', () => {
    ui.btnRestartMatch.blur();
    StickGame.Audio.click();
    startMatch();
  });

  ui.btnBackMenu.addEventListener('click', () => {
    ui.btnBackMenu.blur();
    StickGame.Audio.click();
    returnToMenu();
  });

  ui.btnRematch.addEventListener('click', () => {
    ui.btnRematch.blur();
    StickGame.Audio.click();
    startMatch();
  });

  ui.btnVictoryMenu.addEventListener('click', () => {
    ui.btnVictoryMenu.blur();
    StickGame.Audio.click();
    returnToMenu();
  });

  // ==========================================================================
  // ATUALIZAÇÃO FÍSICA E RENDERIZAÇÃO DO FRAME
  // ==========================================================================
  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.vy += 620 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.life -= dt;
      const progress = 1 - Math.max(0, sw.life / sw.maxLife);
      sw.r = 12 + (sw.maxR - 12) * progress;
      if (sw.life <= 0) shockwaves.splice(i, 1);
    }
  }

  function updateSimulation(rawDt) {
    if (gameState === 'paused' || gameState === 'victory') return;

    // Hit-stop (pausa dramática de milissegundos em golpes pesados)
    if (hitStopTimer > 0) {
      hitStopTimer -= rawDt;
      shakeAmount = Math.max(0, shakeAmount - 30 * rawDt);
      return;
    }

    // Câmera lenta dramática no nocaute!
    let timeScale = 1;
    if (slowMoTimer > 0) {
      slowMoTimer = Math.max(0, slowMoTimer - rawDt);
      timeScale = 0.28;
    }

    const dt = rawDt * timeScale;
    shakeAmount = Math.max(0, shakeAmount - 34 * rawDt);

    StickGame.Arenas.updateArena(arena, dt, worldCallbacks);

    // Transição da abertura do Round -> Luta!
    if (gameState === 'intro') {
      stateTimer -= rawDt;
      if (stateTimer <= 0.28 && ui.bannerMain.textContent !== 'LUTEM!') {
        showBanner('LUTEM!', '');
      }
      if (stateTimer <= 0) {
        hideBanner();
        gameState = 'fighting';
      }
    }

    // Entradas dos dois lutadores
    const f1 = fighters[0];
    const f2 = fighters[1];
    let in1 = emptyInput();
    let in2 = emptyInput();

    if (gameState === 'fighting' || gameState === 'round_over' || gameState === 'menu') {
      in1 = f1.isAI
        ? StickGame.Fighter.computeAIInput(f1, f2, arena, weaponState, dt)
        : getPlayer1Input();
      in2 = f2.isAI
        ? StickGame.Fighter.computeAIInput(f2, f1, arena, weaponState, dt)
        : getPlayer2Input();
    }

    StickGame.Fighter.updateFighter(f1, in1, [f2], arena, weaponState, dt, worldCallbacks);
    StickGame.Fighter.updateFighter(f2, in2, [f1], arena, weaponState, dt, worldCallbacks);
    StickGame.Weapons.update(weaponState, fighters, arena, dt, worldCallbacks);
    updateEffects(dt);

    if (gameState === 'menu') {
      // Reinicia silenciosamente a luta de demonstração ao fundo quando alguém cai
      if (f1.dead || f2.dead) {
        stateTimer += rawDt;
        if (stateTimer > 2.0) {
          const nextIdx = (arena.id + 1) % StickGame.Arenas.count;
          arena = StickGame.Arenas.createInstance(nextIdx);
          weaponState = StickGame.Weapons.createState();
          StickGame.Fighter.resetForRound(f1, arena.spawns[0].x, arena.spawns[0].y, 1);
          StickGame.Fighter.resetForRound(f2, arena.spawns[1].x, arena.spawns[1].y, -1);
          stateTimer = 0;
        }
      }
      return;
    }

    updateHudDOM();

    // Verifica Nocaute durante a luta (com janela curta de 0.35s para Nocaute Duplo!)
    if (gameState === 'fighting') {
      if (!roundDecisionPending && (f1.dead || f2.dead)) {
        roundDecisionPending = true;
        roundDecisionDelay = 0.38;
        slowMoTimer = 0.72;
      }
      if (roundDecisionPending) {
        roundDecisionDelay -= rawDt;
        if (roundDecisionDelay <= 0) {
          finalizeRoundWinner();
        }
      }
    } else if (gameState === 'round_over') {
      stateTimer -= rawDt;
      if (stateTimer <= 0) {
        if (f1.wins >= config.targetWins || f2.wins >= config.targetWins) {
          showVictoryScreen();
        } else {
          roundNumber += 1;
          startRound();
        }
      }
    }
  }

  function renderScene() {
    ctx.save();
    if (shakeAmount > 0.2) {
      const sx = (Math.random() - 0.5) * shakeAmount * 2;
      const sy = (Math.random() - 0.5) * shakeAmount * 2;
      ctx.translate(sx, sy);
    }

    StickGame.Arenas.drawArena(ctx, arena);
    StickGame.Weapons.draw(ctx, weaponState);

    for (const f of fighters) {
      StickGame.Fighter.drawFighter(ctx, f);
    }

    // Ondas de choque de explosões
    for (const sw of shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 190, 11, ${alpha * 0.85})`;
      ctx.lineWidth = 6 * alpha + 1;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Partículas
    for (const pt of particles) {
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Textos flutuantes de impacto / coleta / parry
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // ==========================================================================
  // LOOP DE ANIMAÇÃO (60+ FPS COM DELTA TIME LIMITADO)
  // ==========================================================================
  let lastTime = performance.now();

  function loop(now) {
    const elapsed = (now - lastTime) / 1000;
    lastTime = now;
    const clampedDt = Math.min(0.04, Math.max(0.001, elapsed));

    if (config.showFps) {
      fpsAccum += elapsed;
      fpsFrames += 1;
      if (fpsAccum >= 0.4) {
        const fps = Math.round(fpsFrames / fpsAccum);
        ui.fpsCounter.textContent = `${fps} FPS`;
        fpsAccum = 0;
        fpsFrames = 0;
      }
    }

    updateSimulation(clampedDt);
    renderScene();
    requestAnimationFrame(loop);
  }

  // Inicializa luta de demonstração ao fundo do menu e dispara o loop!
  startDemoBackground();
  requestAnimationFrame(loop);
})();
