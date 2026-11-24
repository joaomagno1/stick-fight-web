/* ==========================================================================
   STICK FIGHT: ARENA WEB — Física Procedural Stickman, Combate, Ragdoll e IA
   ========================================================================== */

window.StickGame = window.StickGame || {};

(function () {
  const GRAVITY = 1750;
  const MOVE_SPEED = 395;
  const JUMP_VEL = -655;

  function createScarf(x, y) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      pts.push({ x: x - i * 6, y });
    }
    return pts;
  }

  function createFighter(cfg) {
    return {
      id: cfg.id,
      name: cfg.name,
      color: cfg.color,
      isAI: !!cfg.isAI,
      aiDiff: cfg.aiDiff || 'normal',

      x: cfg.x || 300,
      y: cfg.y || 400,
      vx: 0,
      vy: 0,
      dir: cfg.dir || 1,

      hp: 100,
      maxHp: 100,
      ghostHp: 100,
      dead: false,

      onGround: false,
      groundPlat: null,
      wallTouch: 0, // -1 parede à esquerda, +1 parede à direita
      jumpsLeft: 2,
      crouching: false,
      dropTimer: 0,

      weaponId: 'fists',
      ammo: Infinity,

      attackCooldown: 0,
      attackAnim: 0,
      comboCount: 0,
      comboTimer: 0,

      blocking: false,
      parryTimer: 0,
      parryCooldown: 0,

      dashTimer: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      stunTimer: 0,
      hitFlash: 0,
      lavaTick: 0,

      walkPhase: 0,
      ragdollAngle: 0,
      ragdollSpin: 0,
      scarf: createScarf(cfg.x || 300, (cfg.y || 400) - 54),
      afterimages: [],

      // Estatísticas da partida
      wins: 0,
      totalDamageDealt: 0,
      kos: 0,

      // Memória de decisão da IA
      aiState: {
        thinkTimer: 0,
        moveDir: 0,
        wantJump: false,
        wantDrop: false,
        wantAttack: false,
        wantBlock: false,
        wantThrow: false
      },

      // Controle de borda de teclas (edge-trigger)
      prevJump: false,
      prevAttack: false,
      prevBlock: false,
      prevThrow: false
    };
  }

  function resetForRound(f, x, y, dir) {
    f.x = x;
    f.y = y;
    f.vx = 0;
    f.vy = 0;
    f.dir = dir;
    f.hp = f.maxHp;
    f.ghostHp = f.maxHp;
    f.dead = false;
    f.onGround = false;
    f.groundPlat = null;
    f.wallTouch = 0;
    f.jumpsLeft = 2;
    f.crouching = false;
    f.dropTimer = 0;
    f.weaponId = 'fists';
    f.ammo = Infinity;
    f.attackCooldown = 0;
    f.attackAnim = 0;
    f.comboCount = 0;
    f.comboTimer = 0;
    f.blocking = false;
    f.parryTimer = 0;
    f.parryCooldown = 0;
    f.dashTimer = 0;
    f.dashCooldown = 0;
    f.invulnTimer = 0;
    f.stunTimer = 0;
    f.hitFlash = 0;
    f.lavaTick = 0;
    f.ragdollAngle = 0;
    f.ragdollSpin = 0;
    f.scarf = createScarf(x, y - 54);
    f.afterimages = [];
    f.prevJump = false;
    f.prevAttack = false;
    f.prevBlock = false;
    f.prevThrow = false;
  }

  function applyDamage(target, amount, kbX, kbY, attacker, callbacks, bypassBlock) {
    if (target.dead || target.invulnTimer > 0) return;

    let finalDmg = amount;
    let finalKbX = kbX;
    let finalKbY = kbY;

    const incomingFromFront = (kbX > 0 && target.dir < 0) || (kbX < 0 && target.dir > 0);

    if (!bypassBlock && incomingFromFront) {
      if (target.parryTimer > 0) {
        // Parry corpo a corpo ou impacto direto!
        StickGame.Audio.parry();
        callbacks.addHitStop(0.06);
        callbacks.spawnText(target.x, target.y - 78, 'PARRY!', '#00f5d4');
        callbacks.spawnParticles(target.x + target.dir * 16, target.y - 40, '#00f5d4', 14, 280);
        if (attacker && attacker !== target) {
          attacker.stunTimer = 0.42;
          attacker.vx = -target.dir * -340;
          attacker.vy = -180;
        }
        return;
      } else if (target.blocking) {
        finalDmg = Math.max(2, Math.round(amount * 0.28));
        finalKbX *= 0.38;
        finalKbY *= 0.35;
        StickGame.Audio.hit(false);
        callbacks.spawnText(target.x, target.y - 74, 'BLOQUEIO', '#90caf9');
        callbacks.spawnParticles(target.x + target.dir * 14, target.y - 38, '#90caf9', 7, 170);
      }
    }

    target.hp = Math.max(0, target.hp - finalDmg);
    target.vx += finalKbX;
    target.vy = Math.min(target.vy, 0) + finalKbY;
    target.onGround = false;
    target.hitFlash = 0.12;
    target.stunTimer = Math.max(target.stunTimer, finalDmg >= 20 ? 0.2 : 0.09);

    if (attacker && attacker !== target) {
      attacker.totalDamageDealt += finalDmg;
    }

    const heavy = finalDmg >= 18 || target.hp <= 0;
    StickGame.Audio.hit(heavy);
    callbacks.addShake(heavy ? 8 : 3.5);
    if (heavy) callbacks.addHitStop(0.045);

    callbacks.spawnParticles(target.x, target.y - 36, target.color, heavy ? 16 : 8, heavy ? 340 : 210);
    callbacks.spawnText(target.x, target.y - 72, `-${Math.round(finalDmg)}`, heavy ? '#ffbe0b' : '#ffffff');

    if (target.hp <= 0 && !target.dead) {
      target.dead = true;
      target.ragdollSpin = (finalKbX >= 0 ? 1 : -1) * (10 + Math.random() * 6);
      if (attacker && attacker !== target) {
        attacker.kos += 1;
      }
      StickGame.Audio.ko();
      callbacks.addShake(14);
      callbacks.addHitStop(0.09);
      callbacks.spawnParticles(target.x, target.y - 36, target.color, 28, 440);
    }
  }

  function performAttack(f, enemies, arena, weaponState, callbacks) {
    const spec = StickGame.Weapons.CATALOG[f.weaponId];
    f.attackCooldown = spec.cooldown;
    f.attackAnim = 0.22;

    if (!spec.melee) {
      StickGame.Weapons.fireRanged(weaponState, f, enemies, arena, callbacks);
      return;
    }

    // Ataque Corpo a Corpo (Punhos com Combo ou Katana)
    const isSword = f.weaponId === 'katana';
    StickGame.Audio.swing(isSword);

    if (!isSword) {
      if (f.comboTimer > 0) {
        f.comboCount = (f.comboCount + 1) % 3;
      } else {
        f.comboCount = 0;
      }
      f.comboTimer = 0.65;
    }

    const isFinisher = !isSword && f.comboCount === 2;
    const dmg = isFinisher ? 16 : spec.damage;
    const kb = isFinisher ? 620 : spec.knockback;
    const reach = spec.range;

    // Pequeno avanço ao golpear
    f.vx += f.dir * (isSword ? 170 : 120);

    const hitCenterX = f.x + f.dir * (reach * 0.52);
    const hitHalfW = reach * 0.55;
    const hitTop = f.y - 68;
    const hitBottom = f.y + 6;

    // Golpeia inimigos no alcance
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (
        Math.abs(enemy.x - hitCenterX) <= hitHalfW + 14 &&
        enemy.y >= hitTop &&
        enemy.y - 60 <= hitBottom
      ) {
        if (isSword) StickGame.Audio.swordHit();
        applyDamage(
          enemy,
          dmg,
          f.dir * kb,
          isFinisher ? -330 : -210,
          f,
          callbacks,
          false
        );
        if (isFinisher) {
          callbacks.spawnText(enemy.x, enemy.y - 88, 'UPPERCUT!', '#ffbe0b');
        }
      }
    }

    // Golpeia caixas e barris no alcance
    for (const prop of arena.props) {
      if (prop.destroyed) continue;
      const px = prop.x + prop.w * 0.5;
      const py = prop.y + prop.h * 0.5;
      if (Math.abs(px - hitCenterX) <= hitHalfW + prop.w * 0.45 && py >= hitTop && py <= hitBottom) {
        StickGame.Arenas.damageProp(prop, dmg, f.dir * 320, -150, callbacks);
      }
    }

    if (isSword) {
      f.ammo -= 1;
      if (f.ammo <= 0) {
        f.weaponId = 'fists';
        f.ammo = Infinity;
        callbacks.spawnText(f.x, f.y - 76, 'KATANA QUEBROU!', '#00f5d4');
      }
    }
  }

  function updateScarf(f, dt) {
    const headX = f.x - f.dir * 5;
    const headY = f.y - (f.crouching ? 38 : 54);
    f.scarf[0].x = headX;
    f.scarf[0].y = headY;

    for (let i = 1; i < f.scarf.length; i++) {
      const prev = f.scarf[i - 1];
      const cur = f.scarf[i];
      cur.y += 90 * dt;
      cur.x -= f.dir * 35 * dt;

      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const targetDist = 6.5;
      if (dist > targetDist) {
        cur.x = prev.x + (dx / dist) * targetDist;
        cur.y = prev.y + (dy / dist) * targetDist;
      }
    }
  }

  function updateFighter(f, input, enemies, arena, weaponState, dt, callbacks) {
    // Barra fantasma de dano suave
    if (f.ghostHp > f.hp) {
      f.ghostHp = Math.max(f.hp, f.ghostHp - 55 * dt);
    }

    // Atualiza timers
    if (f.attackCooldown > 0) f.attackCooldown = Math.max(0, f.attackCooldown - dt);
    if (f.attackAnim > 0) f.attackAnim = Math.max(0, f.attackAnim - dt);
    if (f.comboTimer > 0) f.comboTimer = Math.max(0, f.comboTimer - dt);
    if (f.parryTimer > 0) f.parryTimer = Math.max(0, f.parryTimer - dt);
    if (f.parryCooldown > 0) f.parryCooldown = Math.max(0, f.parryCooldown - dt);
    if (f.dashTimer > 0) f.dashTimer = Math.max(0, f.dashTimer - dt);
    if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);
    if (f.invulnTimer > 0) f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    if (f.stunTimer > 0) f.stunTimer = Math.max(0, f.stunTimer - dt);
    if (f.hitFlash > 0) f.hitFlash = Math.max(0, f.hitFlash - dt);
    if (f.dropTimer > 0) f.dropTimer = Math.max(0, f.dropTimer - dt);
    if (f.lavaTick > 0) f.lavaTick = Math.max(0, f.lavaTick - dt);

    for (let i = f.afterimages.length - 1; i >= 0; i--) {
      f.afterimages[i].life -= dt;
      if (f.afterimages[i].life <= 0) f.afterimages.splice(i, 1);
    }

    // Se nocauteado: física ragdoll
    if (f.dead) {
      const prevY = f.y;
      f.vy += GRAVITY * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= Math.pow(0.25, dt);
      f.ragdollAngle += f.ragdollSpin * dt;

      for (const p of arena.platforms) {
        if (f.x >= p.x && f.x <= p.x + p.w && prevY <= p.y + 12 && f.y >= p.y && f.vy > 0) {
          f.y = p.y;
          f.vy = -f.vy * 0.38;
          f.vx *= 0.7;
          f.ragdollSpin *= 0.65;
        }
      }
      updateScarf(f, dt);
      return;
    }

    // Leitura de transições de botões (pressionado neste frame)
    const jumpPressed = input.jump && !f.prevJump;
    const attackPressed = input.attack && !f.prevAttack;
    const blockPressed = input.block && !f.prevBlock;
    const throwPressed = input.throwWeapon && !f.prevThrow;

    f.prevJump = !!input.jump;
    f.prevAttack = !!input.attack;
    f.prevBlock = !!input.block;
    f.prevThrow = !!input.throwWeapon;

    const canAct = f.stunTimer <= 0;
    const moveAxis = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    // Esquiva rápida (Dash) ou Bloqueio / Parry
    if (canAct && blockPressed) {
      if (moveAxis !== 0 && f.dashCooldown <= 0) {
        f.dir = moveAxis;
        f.dashTimer = 0.16;
        f.dashCooldown = 0.68;
        f.invulnTimer = 0.16;
        f.vx = moveAxis * 690;
        f.vy *= 0.25;
        f.blocking = false;
        StickGame.Audio.dash();
        callbacks.spawnParticles(f.x, f.y - 24, f.color, 8, 170);
      } else if (f.parryCooldown <= 0) {
        f.parryTimer = 0.16;
        f.parryCooldown = 0.45;
      }
    }

    f.blocking = canAct && !!input.block && f.dashTimer <= 0 && f.attackAnim <= 0;

    // Agachar ou atravessar plataforma fina
    f.crouching = canAct && !!input.down && f.onGround;
    if (canAct && input.down && f.onGround && f.groundPlat && f.groundPlat.oneWay) {
      f.dropTimer = 0.22;
      f.onGround = false;
      f.groundPlat = null;
      f.y += 4;
    }

    // Movimento horizontal
    if (f.dashTimer > 0) {
      if (Math.random() < 0.65) {
        f.afterimages.push({ x: f.x, y: f.y, dir: f.dir, life: 0.14 });
      }
    } else if (canAct) {
      if (moveAxis !== 0) {
        f.dir = moveAxis;
        const speedMult = f.blocking ? 0.42 : f.crouching ? 0.5 : 1;
        const targetVx = moveAxis * MOVE_SPEED * speedMult;
        const accel = f.onGround ? 14 : 9;
        f.vx += (targetVx - f.vx) * Math.min(1, accel * dt);
        if (f.onGround) f.walkPhase += dt * 15;
      } else {
        const friction = f.onGround ? 0.0006 : 0.12;
        f.vx *= Math.pow(friction, dt);
      }
    } else {
      f.vx *= Math.pow(0.15, dt);
    }

    // Pulo, Pulo Duplo e Wall Jump
    if (canAct && jumpPressed) {
      if (f.onGround) {
        f.vy = JUMP_VEL;
        f.onGround = false;
        f.jumpsLeft = 1;
        StickGame.Audio.jump();
        callbacks.spawnParticles(f.x, f.y, '#ffffff', 6, 130);
      } else if (f.wallTouch !== 0) {
        // Impulso na parede oposta!
        f.vx = -f.wallTouch * 470;
        f.vy = JUMP_VEL * 0.94;
        f.dir = -f.wallTouch;
        f.jumpsLeft = 1;
        StickGame.Audio.jump();
        callbacks.spawnParticles(f.x + f.wallTouch * 14, f.y - 30, f.color, 9, 180);
      } else if (f.jumpsLeft > 0) {
        f.vy = JUMP_VEL * 0.9;
        f.jumpsLeft -= 1;
        StickGame.Audio.jump();
        callbacks.spawnParticles(f.x, f.y, f.color, 8, 160);
      }
    }

    // Ataque e Arremesso de Arma
    if (canAct && throwPressed && f.weaponId !== 'fists') {
      StickGame.Weapons.throwWeapon(weaponState, f, callbacks);
    } else if (canAct && attackPressed && f.attackCooldown <= 0 && !f.blocking) {
      performAttack(f, enemies, arena, weaponState, callbacks);
    }

    // Gravidade + Deslizamento na Parede (Wall Slide)
    const fastFall = input.down && !f.onGround ? 1.35 : 1;
    f.vy += GRAVITY * fastFall * dt;
    if (f.wallTouch !== 0 && !f.onGround && f.vy > 185) {
      f.vy = 185;
    }

    const prevX = f.x;
    const prevY = f.y;

    // Acompanha plataforma móvel se estiver em cima dela
    if (f.onGround && f.groundPlat && f.groundPlat.moving) {
      f.x += f.groundPlat.vx * dt;
      f.y += f.groundPlat.vy * dt;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Colisão com Plataformas e Paredes
    f.onGround = false;
    f.groundPlat = null;
    f.wallTouch = 0;

    const halfW = 13;
    const height = f.crouching ? 44 : 62;

    for (const p of arena.platforms) {
      if (p.oneWay) {
        if (f.dropTimer > 0) continue;
        if (
          f.x + halfW > p.x &&
          f.x - halfW < p.x + p.w &&
          prevY <= p.y + 10 &&
          f.y >= p.y &&
          f.vy >= 0
        ) {
          f.y = p.y;
          f.vy = 0;
          f.onGround = true;
          f.groundPlat = p;
          f.jumpsLeft = 2;
        }
      } else {
        // Bloco sólido completo (topo, fundo e paredes laterais)
        const overlapX = f.x + halfW > p.x && f.x - halfW < p.x + p.w;
        const overlapY = f.y > p.y && f.y - height < p.y + p.h;

        if (overlapX && prevY <= p.y + 12 && f.y >= p.y && f.vy >= 0) {
          f.y = p.y;
          f.vy = 0;
          f.onGround = true;
          f.groundPlat = p;
          f.jumpsLeft = 2;
        } else if (overlapX && prevY - height >= p.y + p.h - 10 && f.y - height <= p.y + p.h && f.vy < 0) {
          f.y = p.y + p.h + height;
          f.vy = 20;
        } else if (overlapY && overlapX) {
          if (prevX <= p.x) {
            f.x = p.x - halfW;
            if (f.vx > 0) f.vx = 0;
            f.wallTouch = 1;
          } else if (prevX >= p.x + p.w) {
            f.x = p.x + p.w + halfW;
            if (f.vx < 0) f.vx = 0;
            f.wallTouch = -1;
          }
        }
      }
    }

    // Colisão com Perigos da Arena (Lava, Espinhos, Laser Orbital, Abismo)
    for (const h of arena.hazards) {
      if (h.type === 'lava' && f.y >= h.y + 4 && f.lavaTick <= 0) {
        f.lavaTick = 0.25;
        applyDamage(f, 28, (f.x < 640 ? 1 : -1) * 180, -680, null, callbacks, true);
        callbacks.spawnText(f.x, f.y - 76, 'QUEIMOU!', '#ff6d00');
      } else if (h.type === 'spikes') {
        if (f.x + halfW > h.x && f.x - halfW < h.x + h.w && f.y >= h.y && f.y - height <= h.y + h.h) {
          applyDamage(f, 35, -f.dir * 260, -620, null, callbacks, true);
        }
      } else if (h.type === 'laser' && h.state === 'firing' && f.lavaTick <= 0) {
        if (f.x + halfW > h.x && f.x - halfW < h.x + h.w) {
          f.lavaTick = 0.22;
          const pushDir = f.x < h.x + h.w * 0.5 ? -1 : 1;
          applyDamage(f, 34, pushDir * 520, -280, null, callbacks, true);
        }
      }
    }

    // Queda para fora do mapa (Ring Out!)
    if (f.y > StickGame.Arenas.WORLD_H + 95 || f.x < -140 || f.x > StickGame.Arenas.WORLD_W + 140) {
      const lastEnemy = enemies.find((e) => !e.dead) || null;
      applyDamage(f, 999, 0, -200, lastEnemy, callbacks, true);
    }

    updateScarf(f, dt);
  }

  // ==========================================================================
  // INTELIGÊNCIA ARTIFICIAL (3 Níveis + Modo Demonstração no Menu)
  // ==========================================================================
  function hasFloorBelow(x, y, arena) {
    for (const p of arena.platforms) {
      if (x >= p.x + 14 && x <= p.x + p.w - 14 && p.y >= y - 10) {
        return true;
      }
    }
    return false;
  }

  function computeAIInput(ai, enemy, arena, weaponState, dt) {
    const out = {
      left: false,
      right: false,
      jump: false,
      down: false,
      attack: false,
      block: false,
      throwWeapon: false
    };

    if (ai.dead || !enemy) return out;

    const intervals = { easy: 0.24, normal: 0.1, insane: 0.035 };
    const reactDelay = intervals[ai.aiDiff] || 0.1;
    const st = ai.aiState;

    st.thinkTimer -= dt;
    if (st.thinkTimer <= 0) {
      st.thinkTimer = reactDelay * (0.8 + Math.random() * 0.4);
      st.wantJump = false;
      st.wantDrop = false;
      st.wantAttack = false;
      st.wantBlock = false;
      st.wantThrow = false;

      // 1. Sobrevivência: evita abismo e laser prestes a disparar
      let safeCenterX = 640;
      const mainPlat = arena.platforms[0];
      if (mainPlat) safeCenterX = mainPlat.x + mainPlat.w * 0.5;

      const overVoid = !hasFloorBelow(ai.x, ai.y, arena);
      let inLaserDanger = false;
      for (const h of arena.hazards) {
        if (h.type === 'laser' && h.state !== 'idle' && Math.abs(ai.x - (h.x + h.w * 0.5)) < 68) {
          inLaserDanger = true;
          safeCenterX = ai.x < h.x + h.w * 0.5 ? h.x - 140 : h.x + h.w + 140;
        }
      }

      if (overVoid || ai.y > 590 || inLaserDanger) {
        st.moveDir = ai.x < safeCenterX ? 1 : -1;
        if ((overVoid && ai.vy > -40) || ai.wallTouch !== 0) {
          st.wantJump = true;
        }
      } else {
        // 2. Busca caixa de arma próxima se estiver desarmado
        let targetX = enemy.x;
        let targetY = enemy.y;
        let chasingDrop = false;

        if (ai.weaponId === 'fists' && weaponState.drops.length > 0 && ai.aiDiff !== 'easy') {
          let bestDrop = null;
          let bestDist = 420;
          for (const d of weaponState.drops) {
            if (!d.landed) continue;
            const dist = Math.hypot(d.x - ai.x, d.y - ai.y);
            if (dist < bestDist && hasFloorBelow(d.x, d.y, arena)) {
              bestDist = dist;
              bestDrop = d;
            }
          }
          if (bestDrop) {
            targetX = bestDrop.x;
            targetY = bestDrop.y;
            chasingDrop = true;
          }
        }

        const dx = targetX - ai.x;
        const dy = targetY - ai.y;
        const absDx = Math.abs(dx);
        const spec = StickGame.Weapons.CATALOG[ai.weaponId];

        if (chasingDrop) {
          st.moveDir = dx > 10 ? 1 : dx < -10 ? -1 : 0;
          if (dy < -45 && ai.onGround) st.wantJump = true;
          if (dy > 55 && ai.onGround && ai.groundPlat && ai.groundPlat.oneWay) st.wantDrop = true;
        } else if (spec.melee) {
          // Aproxima para combate corpo a corpo
          const desiredDist = spec.range * 0.72;
          if (absDx > desiredDist) {
            st.moveDir = dx > 0 ? 1 : -1;
          } else {
            st.moveDir = 0;
            ai.dir = dx >= 0 ? 1 : -1;
          }

          if (dy < -48 && (ai.onGround || ai.wallTouch !== 0)) st.wantJump = true;
          if (dy > 60 && ai.onGround && ai.groundPlat && ai.groundPlat.oneWay) st.wantDrop = true;

          if (absDx <= spec.range + 12 && Math.abs(dy) < 58 && !enemy.dead) {
            st.wantAttack = true;
          }
        } else {
          // Combate à distância (Pistola, Escopeta, Laser, Bazuca)
          const idealMin = ai.weaponId === 'bazooka' ? 210 : ai.weaponId === 'shotgun' ? 95 : 165;
          const idealMax = ai.weaponId === 'shotgun' ? 230 : 480;

          if (absDx < idealMin) {
            st.moveDir = dx > 0 ? -1 : 1;
          } else if (absDx > idealMax) {
            st.moveDir = dx > 0 ? 1 : -1;
          } else {
            st.moveDir = 0;
          }

          // Alinha altura e mira no oponente
          if (dy < -42 && ai.onGround) st.wantJump = true;
          if (dy > 58 && ai.onGround && ai.groundPlat && ai.groundPlat.oneWay) st.wantDrop = true;

          const alignedY = Math.abs(dy) < (ai.weaponId === 'bazooka' ? 95 : 46);
          if (alignedY && absDx < 680 && !enemy.dead) {
            ai.dir = dx >= 0 ? 1 : -1;
            if (ai.ammo === 1 && ai.aiDiff === 'insane' && absDx < 280 && Math.random() < 0.25) {
              st.wantThrow = true;
            } else {
              st.wantAttack = true;
            }
          }
        }

        // 3. Reação defensiva (Bloqueio / Parry / Esquiva)
        const blockChance = ai.aiDiff === 'insane' ? 0.72 : ai.aiDiff === 'normal' ? 0.35 : 0.1;
        if (enemy.attackAnim > 0.05 && Math.abs(enemy.x - ai.x) < 95 && Math.random() < blockChance) {
          ai.dir = enemy.x >= ai.x ? 1 : -1;
          st.wantBlock = true;
        }
        for (const pr of weaponState.projectiles) {
          if (pr.owner !== ai && Math.abs(pr.x - ai.x) < 150 && Math.abs(pr.y - (ai.y - 34)) < 45) {
            if (Math.random() < blockChance) {
              ai.dir = pr.vx >= 0 ? -1 : 1;
              st.wantBlock = true;
            }
          }
        }
      }

      // Evita correr para fora da borda quando não precisa
      const nextX = ai.x + st.moveDir * 38;
      if (ai.onGround && !hasFloorBelow(nextX, ai.y, arena) && Math.abs(enemy.x - ai.x) > 120) {
        if (enemy.y < ai.y - 20 || Math.abs(enemy.x - ai.x) > 180) {
          st.wantJump = true;
        } else {
          st.moveDir = 0;
        }
      }
    }

    out.left = st.moveDir < 0;
    out.right = st.moveDir > 0;
    out.jump = st.wantJump;
    out.down = st.wantDrop;
    out.attack = st.wantAttack;
    out.block = st.wantBlock;
    out.throwWeapon = st.wantThrow;

    // Reseta gatilhos de pulso para que os edge-triggers funcionem a cada decisão
    st.wantJump = false;
    st.wantAttack = false;
    st.wantThrow = false;

    return out;
  }

  // ==========================================================================
  // RENDERIZAÇÃO PROCEDURAL DO LUTADOR STICKMAN
  // ==========================================================================
  function drawFighter(ctx, f) {
    // Sombras de esquiva (Afterimages)
    for (const img of f.afterimages) {
      ctx.save();
      ctx.globalAlpha = (img.life / 0.14) * 0.32;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(img.x, img.y - 18);
      ctx.lineTo(img.x, img.y - 44);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(img.x, img.y - 53, 9, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.restore();
    }

    // Faixa ninja física esvoaçante
    if (f.scarf && f.scarf.length > 1) {
      ctx.save();
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(f.scarf[0].x, f.scarf[0].y);
      for (let i = 1; i < f.scarf.length; i++) {
        ctx.lineTo(f.scarf[i].x, f.scarf[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(f.x, f.y);

    if (f.dead) {
      ctx.translate(0, -28);
      ctx.rotate(f.ragdollAngle);
      ctx.translate(0, 28);
    }

    const strokeColor = f.hitFlash > 0 ? '#ffffff' : f.color;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const crouch = f.crouching ? 14 : 0;
    const lean = f.dead ? 0 : Math.max(-6, Math.min(6, f.vx * 0.014));

    const hipX = 0;
    const hipY = -22 + crouch * 0.55;
    const shoulderX = lean;
    const shoulderY = -44 + crouch;
    const headX = lean * 1.25;
    const headY = -55 + crouch;

    // Pernas animadas
    let foot1X = -9;
    let foot1Y = 0;
    let foot2X = 9;
    let foot2Y = 0;

    if (!f.onGround && !f.dead) {
      foot1X = -10 - f.dir * 3;
      foot1Y = -5;
      foot2X = 10 + f.dir * 3;
      foot2Y = -10;
    } else if (Math.abs(f.vx) > 25 && !f.dead) {
      const s = Math.sin(f.walkPhase);
      const c = Math.cos(f.walkPhase);
      foot1X = s * 13;
      foot1Y = Math.min(0, c * 5);
      foot2X = -s * 13;
      foot2Y = Math.min(0, -c * 5);
    }

    // Desenha pernas com joelhos articulados
    const knee1X = (hipX + foot1X) * 0.5 + f.dir * 4;
    const knee1Y = (hipY + foot1Y) * 0.5;
    const knee2X = (hipX + foot2X) * 0.5 + f.dir * 4;
    const knee2Y = (hipY + foot2Y) * 0.5;

    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(knee1X, knee1Y);
    ctx.lineTo(foot1X, foot1Y);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(knee2X, knee2Y);
    ctx.lineTo(foot2X, foot2Y);
    // Tronco
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // Braços e postura de combate
    const punchProgress = f.attackAnim > 0 ? Math.sin((f.attackAnim / 0.22) * Math.PI) : 0;
    let frontHandX = shoulderX + f.dir * 15;
    let frontHandY = shoulderY + 6;
    let backHandX = shoulderX - f.dir * 9;
    let backHandY = shoulderY + 10;

    if (f.blocking) {
      frontHandX = shoulderX + f.dir * 13;
      frontHandY = shoulderY - 6;
      backHandX = shoulderX + f.dir * 8;
      backHandY = shoulderY + 4;
    } else if (f.weaponId === 'fists' && punchProgress > 0) {
      frontHandX = shoulderX + f.dir * (14 + punchProgress * 26);
      frontHandY = shoulderY + (f.comboCount === 2 ? -punchProgress * 18 : 2);
    } else if (f.weaponId === 'katana' && punchProgress > 0) {
      frontHandX = shoulderX + f.dir * (16 + punchProgress * 14);
      frontHandY = shoulderY - 8 + punchProgress * 18;
    } else if (f.weaponId !== 'fists') {
      frontHandX = shoulderX + f.dir * 18;
      frontHandY = shoulderY + 3;
      backHandX = shoulderX + f.dir * 8;
      backHandY = shoulderY + 6;
    }

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(backHandX, backHandY);
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(frontHandX, frontHandY);
    ctx.stroke();

    // Cabeça + olhos expressivos
    ctx.beginPath();
    ctx.arc(headX, headY, 9.5, 0, Math.PI * 2);
    ctx.fill();

    if (!f.dead) {
      ctx.fillStyle = '#090b14';
      ctx.beginPath();
      ctx.arc(headX + f.dir * 4, headY - 1, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arma equipada na mão da frente
    if (f.weaponId !== 'fists') {
      let wAngle = 0;
      if (f.weaponId === 'katana') {
        wAngle = punchProgress > 0 ? f.dir * (-0.9 + punchProgress * 2.1) : f.dir * -0.55;
      } else if (punchProgress > 0) {
        wAngle = -f.dir * punchProgress * 0.25;
      }
      StickGame.Weapons.drawWeaponIcon(ctx, f.weaponId, frontHandX, frontHandY, f.dir, wAngle);
    }

    // Arco luminoso de golpe corpo a corpo
    if (punchProgress > 0.15 && (f.weaponId === 'fists' || f.weaponId === 'katana')) {
      ctx.save();
      ctx.strokeStyle = f.weaponId === 'katana' ? '#00f5d4' : '#ffffff';
      ctx.globalAlpha = punchProgress * 0.75;
      ctx.lineWidth = f.weaponId === 'katana' ? 5 : 3.5;
      const arcR = f.weaponId === 'katana' ? 48 : 28;
      ctx.beginPath();
      if (f.dir > 0) {
        ctx.arc(shoulderX + 10, shoulderY + 2, arcR, -0.85, 0.85);
      } else {
        ctx.arc(shoulderX - 10, shoulderY + 2, arcR, Math.PI - 0.85, Math.PI + 0.85);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Escudo energético de Bloqueio / Parry
    if (f.blocking || f.parryTimer > 0) {
      ctx.save();
      const isParry = f.parryTimer > 0;
      ctx.strokeStyle = isParry ? '#00f5d4' : '#90caf9';
      ctx.lineWidth = isParry ? 4 : 2.5;
      ctx.globalAlpha = isParry ? 0.95 : 0.65;
      ctx.beginPath();
      if (f.dir > 0) {
        ctx.arc(4, shoulderY + 6, 26, -0.95, 0.95);
      } else {
        ctx.arc(-4, shoulderY + 6, 26, Math.PI - 0.95, Math.PI + 0.95);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Indicador compacto de munição acima da cabeça
    if (!f.dead && f.weaponId !== 'fists' && Number.isFinite(f.ammo)) {
      const maxAmmo = StickGame.Weapons.CATALOG[f.weaponId].ammo;
      const ratio = Math.max(0, Math.min(1, f.ammo / maxAmmo));
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-16, headY - 19, 32, 4);
      ctx.fillStyle = StickGame.Weapons.CATALOG[f.weaponId].color;
      ctx.fillRect(-16, headY - 19, 32 * ratio, 4);
    }

    ctx.restore();
  }

  StickGame.Fighter = {
    createFighter,
    resetForRound,
    applyDamage,
    performAttack,
    updateFighter,
    computeAIInput,
    drawFighter
  };
})();
