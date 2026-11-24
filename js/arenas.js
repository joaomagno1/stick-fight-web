/* ==========================================================================
   STICK FIGHT: ARENA WEB — Definição de Arenas, Plataformas, Perigos e Caixas
   Resolução base do mundo: 1280 x 720
   ========================================================================== */

window.StickGame = window.StickGame || {};

(function () {
  const WORLD_W = 1280;
  const WORLD_H = 720;

  const ARENA_TEMPLATES = [
    // 0: Telhados Neon
    {
      id: 0,
      name: 'Telhados Neon',
      skyTop: '#090d1e',
      skyBottom: '#1a1438',
      accent: '#00e5ff',
      spawns: [
        { x: 330, y: 460 },
        { x: 950, y: 460 }
      ],
      platforms: [
        { x: 200, y: 545, w: 880, h: 46, oneWay: false, color: '#1b2238', border: '#00e5ff' },
        { x: 120, y: 400, w: 265, h: 16, oneWay: true, color: '#242e4d', border: '#7b61ff' },
        { x: 895, y: 400, w: 265, h: 16, oneWay: true, color: '#242e4d', border: '#7b61ff' },
        { x: 485, y: 275, w: 310, h: 16, oneWay: true, color: '#242e4d', border: '#00e5ff' }
      ],
      hazards: [],
      props: [
        { type: 'crate', x: 565, y: 503 },
        { type: 'crate', x: 675, y: 503 },
        { type: 'barrel', x: 622, y: 231 }
      ],
      theme: 'rooftop'
    },

    // 1: Fábrica de Lava
    {
      id: 1,
      name: 'Fábrica de Lava',
      skyTop: '#180909',
      skyBottom: '#38120a',
      accent: '#ff6d00',
      spawns: [
        { x: 230, y: 410 },
        { x: 1050, y: 410 }
      ],
      platforms: [
        { x: 95, y: 490, w: 295, h: 40, oneWay: false, color: '#2b1b19', border: '#ff8f00' },
        { x: 890, y: 490, w: 295, h: 40, oneWay: false, color: '#2b1b19', border: '#ff8f00' },
        { x: 455, y: 555, w: 370, h: 16, oneWay: true, color: '#3b2420', border: '#ff5252' },
        { x: 380, y: 350, w: 520, h: 16, oneWay: true, color: '#3b2420', border: '#ffab40' },
        // Torres laterais para Wall Jump
        { x: 38, y: 190, w: 34, h: 340, oneWay: false, color: '#241715', border: '#ff6d00' },
        { x: 1208, y: 190, w: 34, h: 340, oneWay: false, color: '#241715', border: '#ff6d00' }
      ],
      hazards: [
        { type: 'lava', x: 0, y: 658, w: 1280, h: 62 }
      ],
      props: [
        { type: 'barrel', x: 620, y: 306 },
        { type: 'crate', x: 220, y: 448 },
        { type: 'crate', x: 1020, y: 448 }
      ],
      theme: 'lava'
    },

    // 2: Ponte Explosiva
    {
      id: 2,
      name: 'Ponte Explosiva',
      skyTop: '#0b1420',
      skyBottom: '#1d2f3a',
      accent: '#ffbe0b',
      spawns: [
        { x: 175, y: 400 },
        { x: 1105, y: 400 }
      ],
      platforms: [
        { x: 55, y: 485, w: 255, h: 235, oneWay: false, color: '#1b2631', border: '#ffbe0b' },
        { x: 970, y: 485, w: 255, h: 235, oneWay: false, color: '#1b2631', border: '#ffbe0b' },
        // Ponte suspensa atravessável
        { x: 325, y: 495, w: 200, h: 16, oneWay: true, color: '#3b2f24', border: '#ffbe0b' },
        { x: 540, y: 505, w: 200, h: 16, oneWay: true, color: '#3b2f24', border: '#ffbe0b' },
        { x: 755, y: 495, w: 200, h: 16, oneWay: true, color: '#3b2f24', border: '#ffbe0b' },
        // Plataformas superiores
        { x: 215, y: 335, w: 230, h: 16, oneWay: true, color: '#243442', border: '#4dd0e1' },
        { x: 835, y: 335, w: 230, h: 16, oneWay: true, color: '#243442', border: '#4dd0e1' },
        { x: 520, y: 225, w: 240, h: 16, oneWay: true, color: '#243442', border: '#ffbe0b' }
      ],
      hazards: [],
      props: [
        { type: 'barrel', x: 410, y: 451 },
        { type: 'barrel', x: 622, y: 461 },
        { type: 'barrel', x: 835, y: 451 },
        { type: 'crate', x: 580, y: 183 },
        { type: 'crate', x: 660, y: 183 }
      ],
      theme: 'bridge'
    },

    // 3: Torre Laser
    {
      id: 3,
      name: 'Torre Laser',
      skyTop: '#070b17',
      skyBottom: '#0f2236',
      accent: '#ff1744',
      spawns: [
        { x: 300, y: 480 },
        { x: 980, y: 480 }
      ],
      platforms: [
        { x: 145, y: 560, w: 390, h: 42, oneWay: false, color: '#141e30', border: '#00e676' },
        { x: 745, y: 560, w: 390, h: 42, oneWay: false, color: '#141e30', border: '#00e676' },
        { x: 255, y: 410, w: 245, h: 16, oneWay: true, color: '#1c2b42', border: '#00b0ff' },
        { x: 780, y: 410, w: 245, h: 16, oneWay: true, color: '#1c2b42', border: '#00b0ff' },
        { x: 490, y: 280, w: 300, h: 16, oneWay: true, color: '#1c2b42', border: '#ff1744' },
        // Pilares altos laterais para escalar no Wall Jump
        { x: 105, y: 170, w: 36, h: 432, oneWay: false, color: '#111927', border: '#00b0ff' },
        { x: 1139, y: 170, w: 36, h: 432, oneWay: false, color: '#111927', border: '#00b0ff' }
      ],
      hazards: [
        {
          type: 'laser',
          x: 622,
          y: 0,
          w: 36,
          h: 720,
          cycle: 5.8,
          warnStart: 3.6,
          fireStart: 4.8
        },
        {
          type: 'spikes',
          x: 545,
          y: 690,
          w: 190,
          h: 30
        }
      ],
      props: [
        { type: 'crate', x: 355, y: 368 },
        { type: 'crate', x: 880, y: 368 }
      ],
      theme: 'laser'
    },

    // 4: Céu Cibernético (Plataformas Móveis)
    {
      id: 4,
      name: 'Céu Cibernético',
      skyTop: '#120826',
      skyBottom: '#2d124d',
      accent: '#e040fb',
      spawns: [
        { x: 560, y: 440 },
        { x: 720, y: 440 }
      ],
      platforms: [
        { x: 470, y: 530, w: 340, h: 36, oneWay: false, color: '#23133d', border: '#e040fb' },
        {
          x: 160,
          y: 440,
          w: 230,
          h: 18,
          oneWay: true,
          color: '#2c194d',
          border: '#00e5ff',
          moving: { ax: 110, ay: 470, bx: 230, by: 310, speed: 1.35, phase: 0 }
        },
        {
          x: 890,
          y: 440,
          w: 230,
          h: 18,
          oneWay: true,
          color: '#2c194d',
          border: '#00e5ff',
          moving: { ax: 940, ay: 470, bx: 820, by: 310, speed: 1.35, phase: Math.PI }
        },
        {
          x: 515,
          y: 255,
          w: 250,
          h: 16,
          oneWay: true,
          color: '#2c194d',
          border: '#ffbe0b',
          moving: { ax: 390, ay: 245, bx: 640, by: 245, speed: 1.6, phase: 0.7 }
        }
      ],
      hazards: [],
      props: [
        { type: 'barrel', x: 622, y: 486 }
      ],
      theme: 'cyber'
    }
  ];

  // Decorações de fundo geradas uma vez por arena
  function buildBackdrop(template) {
    const stars = [];
    for (let i = 0; i < 42; i++) {
      stars.push({
        x: (i * 197 + 53) % WORLD_W,
        y: (i * 113 + 29) % 520,
        r: (i % 3) * 0.7 + 0.8,
        alpha: 0.25 + (i % 5) * 0.12
      });
    }
    const buildings = [];
    if (template.theme === 'rooftop' || template.theme === 'cyber' || template.theme === 'laser') {
      for (let x = -20; x < WORLD_W + 40; x += 92) {
        const h = 150 + ((x * 37) % 230);
        buildings.push({ x, w: 78, h });
      }
    }
    return { stars, buildings };
  }

  function createInstance(index) {
    const tpl = ARENA_TEMPLATES[index % ARENA_TEMPLATES.length];
    const platforms = tpl.platforms.map((p) => ({
      ...p,
      vx: 0,
      vy: 0,
      moving: p.moving ? { ...p.moving } : null
    }));

    const hazards = tpl.hazards.map((h) => ({
      ...h,
      timer: 0,
      state: 'idle'
    }));

    const props = tpl.props.map((pr) => ({
      type: pr.type,
      x: pr.x,
      y: pr.y,
      w: pr.type === 'barrel' ? 34 : 40,
      h: pr.type === 'barrel' ? 44 : 40,
      vx: 0,
      vy: 0,
      hp: pr.type === 'barrel' ? 22 : 38,
      maxHp: pr.type === 'barrel' ? 22 : 38,
      flash: 0,
      destroyed: false
    }));

    return {
      id: tpl.id,
      name: tpl.name,
      skyTop: tpl.skyTop,
      skyBottom: tpl.skyBottom,
      accent: tpl.accent,
      theme: tpl.theme,
      spawns: tpl.spawns.map((s) => ({ ...s })),
      platforms,
      hazards,
      props,
      time: 0,
      backdrop: buildBackdrop(tpl)
    };
  }

  function updateArena(arena, dt, gameCallbacks) {
    arena.time += dt;

    // Atualiza plataformas móveis e calcula deslocamento (vx, vy)
    for (const p of arena.platforms) {
      if (p.moving) {
        const prevX = p.x;
        const prevY = p.y;
        const t = 0.5 + 0.5 * Math.sin(arena.time * p.moving.speed + p.moving.phase);
        p.x = p.moving.ax + (p.moving.bx - p.moving.ax) * t;
        p.y = p.moving.ay + (p.moving.by - p.moving.ay) * t;
        p.vx = dt > 0 ? (p.x - prevX) / dt : 0;
        p.vy = dt > 0 ? (p.y - prevY) / dt : 0;
      }
    }

    // Atualiza perigos dinâmicos (ex: feixe de laser periódico)
    for (const h of arena.hazards) {
      if (h.type === 'laser') {
        const t = arena.time % h.cycle;
        if (t >= h.fireStart) {
          if (h.state !== 'firing') {
            h.state = 'firing';
            StickGame.Audio.shoot('laser');
          }
        } else if (t >= h.warnStart) {
          h.state = 'warn';
        } else {
          h.state = 'idle';
        }
      }
    }

    // Física simples para caixas e barris explosivos
    for (const prop of arena.props) {
      if (prop.destroyed) continue;
      if (prop.flash > 0) prop.flash = Math.max(0, prop.flash - dt);

      const prevBottom = prop.y + prop.h;
      prop.vy += 1500 * dt;
      prop.x += prop.vx * dt;
      prop.y += prop.vy * dt;
      prop.vx *= Math.pow(0.04, dt);

      // Colisão com plataformas
      for (const p of arena.platforms) {
        if (
          prop.x + prop.w > p.x &&
          prop.x < p.x + p.w &&
          prevBottom <= p.y + 14 &&
          prop.y + prop.h >= p.y &&
          prop.vy >= 0
        ) {
          prop.y = p.y - prop.h;
          prop.vy = 0;
          prop.x += p.vx * dt;
        }
      }

      // Colisão com lava ou queda no abismo
      for (const h of arena.hazards) {
        if (h.type === 'lava' && prop.y + prop.h >= h.y) {
          damageProp(prop, 999, 0, -200, gameCallbacks);
        } else if (h.type === 'laser' && h.state === 'firing') {
          if (prop.x + prop.w > h.x && prop.x < h.x + h.w) {
            damageProp(prop, 999, 0, 0, gameCallbacks);
          }
        }
      }

      if (prop.y > WORLD_H + 120) {
        prop.destroyed = true;
      }
    }
  }

  function damageProp(prop, dmg, impulseX, impulseY, gameCallbacks) {
    if (prop.destroyed) return;
    prop.hp -= dmg;
    prop.vx += impulseX;
    prop.vy += impulseY;
    prop.flash = 0.1;

    if (prop.hp <= 0) {
      prop.destroyed = true;
      const cx = prop.x + prop.w * 0.5;
      const cy = prop.y + prop.h * 0.5;
      if (prop.type === 'barrel') {
        if (gameCallbacks && gameCallbacks.onExplosion) {
          gameCallbacks.onExplosion(cx, cy, 135, 42, null);
        }
      } else {
        StickGame.Audio.hit(false);
        if (gameCallbacks && gameCallbacks.spawnParticles) {
          gameCallbacks.spawnParticles(cx, cy, '#c58b43', 14, 280);
        }
      }
    }
  }

  function drawArena(ctx, arena) {
    // Céu gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grad.addColorStop(0, arena.skyTop);
    grad.addColorStop(1, arena.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Estrelas / partículas sutis de fundo
    for (const s of arena.backdrop.stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grade synthwave para o Céu Cibernético
    if (arena.theme === 'cyber') {
      ctx.save();
      ctx.strokeStyle = 'rgba(224, 64, 251, 0.14)';
      ctx.lineWidth = 1;
      for (let y = 460; y <= WORLD_H; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Silhuetas urbanas ao fundo
    if (arena.backdrop.buildings.length > 0) {
      ctx.fillStyle = 'rgba(6, 9, 18, 0.55)';
      for (const b of arena.backdrop.buildings) {
        ctx.fillRect(b.x, WORLD_H - b.h, b.w, b.h);
      }
    }

    // Perigos de fundo (Laser / Espinhos)
    for (const h of arena.hazards) {
      if (h.type === 'laser') {
        if (h.state === 'warn') {
          const blink = 0.35 + 0.35 * Math.sin(arena.time * 28);
          ctx.save();
          ctx.fillStyle = `rgba(255, 23, 68, ${blink * 0.28})`;
          ctx.fillRect(h.x, h.y, h.w, h.h);
          ctx.strokeStyle = `rgba(255, 82, 82, ${blink + 0.2})`;
          ctx.setLineDash([10, 10]);
          ctx.lineWidth = 2;
          ctx.strokeRect(h.x + h.w * 0.5 - 1, 0, 2, WORLD_H);
          ctx.restore();
        } else if (h.state === 'firing') {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 23, 68, 0.45)';
          ctx.fillRect(h.x - 10, h.y, h.w + 20, h.h);
          ctx.fillStyle = '#ff1744';
          ctx.fillRect(h.x, h.y, h.w, h.h);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(h.x + h.w * 0.28, h.y, h.w * 0.44, h.h);
          ctx.restore();
        }
      } else if (h.type === 'spikes') {
        ctx.save();
        ctx.fillStyle = '#cfd8dc';
        const count = Math.floor(h.w / 18);
        const step = h.w / count;
        for (let i = 0; i < count; i++) {
          const sx = h.x + i * step;
          ctx.beginPath();
          ctx.moveTo(sx, h.y + h.h);
          ctx.lineTo(sx + step * 0.5, h.y);
          ctx.lineTo(sx + step, h.y + h.h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Plataformas
    for (const p of arena.platforms) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;

      if (p.oneWay) {
        // Plataforma atravessável (barra superior iluminada + treliça leve)
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = p.border;
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      }
      ctx.restore();
    }

    // Caixas e barris explosivos
    for (const prop of arena.props) {
      if (prop.destroyed) continue;
      ctx.save();
      if (prop.flash > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
      } else if (prop.type === 'crate') {
        ctx.fillStyle = '#8d5b2d';
        ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
        ctx.strokeStyle = '#d7995b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(prop.x + 2, prop.y + 2, prop.w - 4, prop.h - 4);
        ctx.beginPath();
        ctx.moveTo(prop.x + 4, prop.y + 4);
        ctx.lineTo(prop.x + prop.w - 4, prop.y + prop.h - 4);
        ctx.stroke();
      } else if (prop.type === 'barrel') {
        ctx.fillStyle = '#d50000';
        ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
        ctx.fillStyle = '#ffbe0b';
        ctx.fillRect(prop.x, prop.y + 10, prop.w, 6);
        ctx.fillRect(prop.x, prop.y + prop.h - 15, prop.w, 6);
        ctx.strokeStyle = '#ff8a80';
        ctx.lineWidth = 2;
        ctx.strokeRect(prop.x + 1, prop.y + 1, prop.w - 2, prop.h - 2);
      }
      ctx.restore();
    }

    // Lava em primeiro plano
    for (const h of arena.hazards) {
      if (h.type === 'lava') {
        ctx.save();
        const lavaGrad = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
        lavaGrad.addColorStop(0, '#ffab00');
        lavaGrad.addColorStop(0.35, '#ff3d00');
        lavaGrad.addColorStop(1, '#870000');
        ctx.fillStyle = lavaGrad;

        ctx.beginPath();
        ctx.moveTo(h.x, h.y + h.h);
        for (let x = h.x; x <= h.x + h.w; x += 24) {
          const wave = Math.sin(x * 0.03 + arena.time * 4.5) * 4.5;
          ctx.lineTo(x, h.y + wave);
        }
        ctx.lineTo(h.x + h.w, h.y + h.h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  StickGame.Arenas = {
    WORLD_W,
    WORLD_H,
    count: ARENA_TEMPLATES.length,
    createInstance,
    updateArena,
    damageProp,
    drawArena
  };
})();
