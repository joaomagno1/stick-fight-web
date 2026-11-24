/* ==========================================================================
   STICK FIGHT: ARENA WEB — Arsenal de Armas, Drops, Projéteis e Arremessos
   ========================================================================== */

window.StickGame = window.StickGame || {};

(function () {
  const CATALOG = {
    fists: {
      id: 'fists',
      name: 'Punhos',
      melee: true,
      cooldown: 0.23,
      damage: 10,
      knockback: 370,
      range: 56,
      ammo: Infinity,
      color: '#ffffff'
    },
    katana: {
      id: 'katana',
      name: 'Katana',
      melee: true,
      cooldown: 0.27,
      damage: 22,
      knockback: 540,
      range: 86,
      ammo: 14,
      color: '#00f5d4',
      deflects: true
    },
    pistol: {
      id: 'pistol',
      name: 'Pistola',
      melee: false,
      cooldown: 0.22,
      damage: 13,
      knockback: 310,
      recoil: 115,
      speed: 1160,
      spread: 0.03,
      pellets: 1,
      ammo: 12,
      color: '#ffd166'
    },
    shotgun: {
      id: 'shotgun',
      name: 'Escopeta',
      melee: false,
      cooldown: 0.62,
      damage: 8,
      knockback: 215,
      recoil: 470,
      speed: 1020,
      spread: 0.25,
      pellets: 5,
      ammo: 5,
      color: '#ff9f1c'
    },
    laser: {
      id: 'laser',
      name: 'Rifle Laser',
      melee: false,
      hitscan: true,
      cooldown: 0.72,
      damage: 28,
      knockback: 590,
      recoil: 240,
      ammo: 4,
      color: '#00e5ff'
    },
    bazooka: {
      id: 'bazooka',
      name: 'Bazuca',
      melee: false,
      explosive: true,
      cooldown: 0.88,
      damage: 38,
      knockback: 740,
      recoil: 430,
      speed: 770,
      spread: 0.02,
      pellets: 1,
      ammo: 3,
      color: '#ff4769'
    }
  };

  const DROP_POOL = ['katana', 'pistol', 'shotgun', 'laser', 'bazooka'];

  function createState() {
    return {
      drops: [],
      projectiles: [],
      beams: [],
      thrown: [],
      spawnTimer: 2.8
    };
  }

  function spawnDrop(state, arena) {
    if (state.drops.length >= 3) return;
    // Escolhe uma plataforma horizontal para soltar a arma acima dela
    const candidates = arena.platforms.filter((p) => p.w >= 140);
    if (candidates.length === 0) return;
    const plat = candidates[Math.floor(Math.random() * candidates.length)];
    const margin = 36;
    const x = plat.x + margin + Math.random() * Math.max(20, plat.w - margin * 2);
    const weaponId = DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];
    const spec = CATALOG[weaponId];

    state.drops.push({
      x,
      y: -30,
      vx: 0,
      vy: 150,
      weaponId,
      ammo: spec.ammo,
      landed: false,
      bob: Math.random() * Math.PI * 2,
      life: 18
    });
  }

  function fireRanged(state, shooter, enemies, arena, callbacks) {
    const spec = CATALOG[shooter.weaponId];
    if (!spec || spec.melee) return;

    const muzzleX = shooter.x + shooter.dir * 26;
    const muzzleY = shooter.y - (shooter.crouching ? 25 : 38);

    // Recuo físico no atirador (clássico do Stick Fight!)
    shooter.vx -= shooter.dir * (spec.recoil || 0);
    if (!shooter.onGround && spec.id === 'shotgun') {
      shooter.vy -= 95;
    }

    if (spec.hitscan) {
      StickGame.Audio.shoot('laser');
      let endX = shooter.dir > 0 ? 1320 : -40;
      const beamY = muzzleY;

      // Verifica bloqueio por plataformas sólidas e caixas
      for (const p of arena.platforms) {
        if (!p.oneWay && beamY >= p.y && beamY <= p.y + p.h) {
          if (shooter.dir > 0 && p.x > muzzleX && p.x < endX) endX = p.x;
          if (shooter.dir < 0 && p.x + p.w < muzzleX && p.x + p.w > endX) endX = p.x + p.w;
        }
      }

      for (const prop of arena.props) {
        if (prop.destroyed) continue;
        if (beamY >= prop.y && beamY <= prop.y + prop.h) {
          if (shooter.dir > 0 && prop.x > muzzleX && prop.x < endX) {
            endX = prop.x;
            StickGame.Arenas.damageProp(prop, spec.damage, shooter.dir * 320, -120, callbacks);
          } else if (shooter.dir < 0 && prop.x + prop.w < muzzleX && prop.x + prop.w > endX) {
            endX = prop.x + prop.w;
            StickGame.Arenas.damageProp(prop, spec.damage, shooter.dir * 320, -120, callbacks);
          }
        }
      }

      // Verifica acerto nos inimigos ao longo do raio
      for (const enemy of enemies) {
        if (enemy.dead || enemy.invulnTimer > 0) continue;
        const top = enemy.y - (enemy.crouching ? 44 : 64);
        if (beamY >= top - 6 && beamY <= enemy.y) {
          const inPath =
            (shooter.dir > 0 && enemy.x >= muzzleX && enemy.x <= endX + 14) ||
            (shooter.dir < 0 && enemy.x <= muzzleX && enemy.x >= endX - 14);
          if (inPath) {
            StickGame.Fighter.applyDamage(
              enemy,
              spec.damage,
              shooter.dir * spec.knockback,
              -210,
              shooter,
              callbacks,
              false
            );
            callbacks.spawnParticles(enemy.x, beamY, spec.color, 14, 340);
          }
        }
      }

      state.beams.push({
        x1: muzzleX,
        y1: beamY,
        x2: endX,
        y2: beamY,
        color: spec.color,
        life: 0.18,
        maxLife: 0.18
      });
      callbacks.addShake(7);
      callbacks.spawnParticles(muzzleX, muzzleY, spec.color, 8, 220);
    } else {
      // Projéteis físicos (Pistola, Escopeta, Bazuca)
      StickGame.Audio.shoot(spec.explosive ? 'grenade' : spec.id);
      const count = spec.pellets || 1;
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * (spec.spread || 0);
        const speed = spec.speed * (0.94 + Math.random() * 0.12);
        const vx = Math.cos(angle) * speed * shooter.dir;
        const vy = Math.sin(angle) * speed - (spec.explosive ? 135 : 0);

        state.projectiles.push({
          x: muzzleX,
          y: muzzleY,
          prevX: muzzleX,
          prevY: muzzleY,
          vx,
          vy,
          owner: shooter,
          damage: spec.damage,
          knockback: spec.knockback,
          color: spec.color,
          radius: spec.explosive ? 7 : 4,
          gravity: spec.explosive ? 680 : 0,
          explosive: !!spec.explosive,
          life: 1.8
        });
      }
      callbacks.addShake(spec.id === 'shotgun' || spec.explosive ? 6.5 : 2.5);
      callbacks.spawnParticles(muzzleX, muzzleY, '#fff3b0', count > 1 ? 10 : 5, 210);
    }

    shooter.ammo -= 1;
    if (shooter.ammo <= 0) {
      shooter.weaponId = 'fists';
      shooter.ammo = Infinity;
      callbacks.spawnText(shooter.x, shooter.y - 74, 'SEM MUNIÇÃO', '#ffd166');
    }
  }

  function throwWeapon(state, shooter, callbacks) {
    if (shooter.weaponId === 'fists') return false;
    const wid = shooter.weaponId;
    const remAmmo = shooter.ammo;

    shooter.weaponId = 'fists';
    shooter.ammo = Infinity;
    shooter.attackAnim = 0.2;
    StickGame.Audio.swing(false);

    state.thrown.push({
      x: shooter.x + shooter.dir * 20,
      y: shooter.y - 38,
      vx: shooter.dir * 760 + shooter.vx * 0.3,
      vy: -190,
      rot: 0,
      weaponId: wid,
      ammo: remAmmo,
      owner: shooter,
      life: 2.5
    });

    callbacks.spawnParticles(shooter.x + shooter.dir * 16, shooter.y - 38, '#ffffff', 5, 140);
    return true;
  }

  function segmentHitsBox(x1, y1, x2, y2, bx, by, bw, bh) {
    // Amostragem rápida de 4 subpassos para evitar projéteis atravessando alvos finos
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
        return { x: px, y: py };
      }
    }
    return null;
  }

  function update(state, fighters, arena, dt, callbacks) {
    // Gerador periódico de caixas de armas caindo do céu
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnDrop(state, arena);
      state.spawnTimer = 5.2 + Math.random() * 2.8;
    }

    // Atualiza drops de armas
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const d = state.drops[i];
      d.bob += dt * 4;
      d.life -= dt;

      if (!d.landed) {
        const prevY = d.y;
        d.vy = Math.min(260, d.vy + 280 * dt);
        d.y += d.vy * dt;

        for (const p of arena.platforms) {
          if (d.x >= p.x + 10 && d.x <= p.x + p.w - 10 && prevY <= p.y - 10 && d.y >= p.y - 14) {
            d.y = p.y - 14;
            d.vy = 0;
            d.landed = true;
            d.plat = p;
            break;
          }
        }
      } else if (d.plat && d.plat.moving) {
        d.x += d.plat.vx * dt;
        d.y = d.plat.y - 14;
      }

      // Coleta automática ao encostar (se estiver de Punhos, ou se for a mesma arma recarrega)
      let picked = false;
      for (const f of fighters) {
        if (f.dead) continue;
        if (Math.abs(f.x - d.x) < 30 && Math.abs((f.y - 28) - d.y) < 38) {
          if (f.weaponId === 'fists' || f.weaponId === d.weaponId) {
            f.weaponId = d.weaponId;
            f.ammo = d.ammo;
            StickGame.Audio.pickup();
            callbacks.spawnText(f.x, f.y - 76, CATALOG[d.weaponId].name.toUpperCase(), CATALOG[d.weaponId].color);
            callbacks.spawnParticles(d.x, d.y, CATALOG[d.weaponId].color, 12, 200);
            picked = true;
            break;
          }
        }
      }

      if (picked || d.life <= 0 || d.y > StickGame.Arenas.WORLD_H + 80) {
        state.drops.splice(i, 1);
      }
    }

    // Atualiza projéteis
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const pr = state.projectiles[i];
      pr.prevX = pr.x;
      pr.prevY = pr.y;
      pr.vy += pr.gravity * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;

      let remove = pr.life <= 0 || pr.x < -80 || pr.x > 1360 || pr.y > 780;
      let hitPos = null;

      // Colisão com plataformas sólidas (ou todas se for granada caindo)
      if (!remove) {
        for (const p of arena.platforms) {
          if (p.oneWay && (!pr.explosive || pr.vy < 0)) continue;
          const hit = segmentHitsBox(pr.prevX, pr.prevY, pr.x, pr.y, p.x, p.y, p.w, p.h);
          if (hit) {
            hitPos = hit;
            remove = true;
            break;
          }
        }
      }

      // Colisão com caixas / barris
      if (!remove) {
        for (const prop of arena.props) {
          if (prop.destroyed) continue;
          const hit = segmentHitsBox(pr.prevX, pr.prevY, pr.x, pr.y, prop.x, prop.y, prop.w, prop.h);
          if (hit) {
            hitPos = hit;
            const dir = pr.vx >= 0 ? 1 : -1;
            StickGame.Arenas.damageProp(prop, pr.damage, dir * 240, -90, callbacks);
            remove = true;
            break;
          }
        }
      }

      // Colisão com lutadores
      if (!remove) {
        for (const f of fighters) {
          if (f === pr.owner || f.dead || f.invulnTimer > 0) continue;
          const fh = f.crouching ? 44 : 64;
          const hit = segmentHitsBox(pr.prevX, pr.prevY, pr.x, pr.y, f.x - 15, f.y - fh, 30, fh);
          if (hit) {
            const bulletDir = pr.vx >= 0 ? 1 : -1;
            const facingBullet = f.dir === -bulletDir;
            const canDeflect =
              !pr.explosive &&
              facingBullet &&
              (f.parryTimer > 0 || (f.attackAnim > 0.08 && f.weaponId === 'katana'));

            if (canDeflect) {
              // Reflete o tiro de volta!
              pr.owner = f;
              pr.vx = -pr.vx * 1.18;
              pr.vy = (Math.random() - 0.5) * 90;
              pr.x = hit.x + f.dir * 12;
              pr.color = '#ffffff';
              StickGame.Audio.parry();
              callbacks.addHitStop(0.045);
              callbacks.spawnText(f.x, f.y - 76, 'PARRY!', '#00f5d4');
              callbacks.spawnParticles(hit.x, hit.y, '#00f5d4', 12, 280);
            } else {
              hitPos = hit;
              if (!pr.explosive) {
                StickGame.Fighter.applyDamage(
                  f,
                  pr.damage,
                  bulletDir * pr.knockback,
                  -165,
                  pr.owner,
                  callbacks,
                  false
                );
              }
              remove = true;
            }
            break;
          }
        }
      }

      if (remove) {
        if (pr.explosive && hitPos) {
          callbacks.onExplosion(hitPos.x, hitPos.y, 130, pr.damage, pr.owner);
        } else if (hitPos) {
          callbacks.spawnParticles(hitPos.x, hitPos.y, pr.color, 6, 180);
        }
        state.projectiles.splice(i, 1);
      }
    }

    // Atualiza armas arremessadas
    for (let i = state.thrown.length - 1; i >= 0; i--) {
      const tw = state.thrown[i];
      tw.vy += 1200 * dt;
      tw.x += tw.vx * dt;
      tw.y += tw.vy * dt;
      tw.rot += (tw.vx >= 0 ? 1 : -1) * 18 * dt;
      tw.life -= dt;

      let done = tw.life <= 0 || tw.y > 780;

      // Acerta inimigo?
      for (const f of fighters) {
        if (f === tw.owner || f.dead || f.invulnTimer > 0) continue;
        const fh = f.crouching ? 44 : 64;
        if (tw.x >= f.x - 18 && tw.x <= f.x + 18 && tw.y >= f.y - fh && tw.y <= f.y) {
          const dir = tw.vx >= 0 ? 1 : -1;
          StickGame.Fighter.applyDamage(f, 15, dir * 480, -240, tw.owner, callbacks, false);
          f.stunTimer = Math.max(f.stunTimer, 0.25);
          callbacks.spawnText(f.x, f.y - 76, 'BONK!', '#ffbe0b');
          done = true;
          break;
        }
      }

      // Acerta barril/caixa?
      if (!done) {
        for (const prop of arena.props) {
          if (prop.destroyed) continue;
          if (tw.x >= prop.x && tw.x <= prop.x + prop.w && tw.y >= prop.y && tw.y <= prop.y + prop.h) {
            StickGame.Arenas.damageProp(prop, 18, (tw.vx >= 0 ? 1 : -1) * 280, -120, callbacks);
            done = true;
            break;
          }
        }
      }

      if (done) {
        state.thrown.splice(i, 1);
      }
    }

    // Atualiza feixes de laser
    for (let i = state.beams.length - 1; i >= 0; i--) {
      state.beams[i].life -= dt;
      if (state.beams[i].life <= 0) state.beams.splice(i, 1);
    }
  }

  function drawWeaponIcon(ctx, weaponId, x, y, dir = 1, angle = 0) {
    if (weaponId === 'fists') return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(dir, 1);

    if (weaponId === 'katana') {
      // Cabo + guarda + lâmina neon
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();

      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(38, -3);
      ctx.stroke();

      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(0, -5, 3, 10);
    } else if (weaponId === 'pistol') {
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(0, -5, 16, 6);
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-2, -1, 6, 9);
    } else if (weaponId === 'shotgun') {
      ctx.fillStyle = '#8d5b2d';
      ctx.fillRect(-8, -2, 11, 6);
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(2, -5, 24, 5);
      ctx.fillStyle = '#ff9f1c';
      ctx.fillRect(8, 0, 10, 4);
    } else if (weaponId === 'laser') {
      ctx.fillStyle = '#263238';
      ctx.fillRect(-6, -5, 28, 8);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(2, -3, 18, 3);
    } else if (weaponId === 'bazooka') {
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-14, -7, 36, 11);
      ctx.fillStyle = '#ff4769';
      ctx.fillRect(16, -8, 6, 13);
    }

    ctx.restore();
  }

  function draw(ctx, state) {
    // Drops flutuantes / paraquedas
    for (const d of state.drops) {
      const spec = CATALOG[d.weaponId];
      const bobY = d.landed ? Math.sin(d.bob) * 4 : 0;
      const dy = d.y + bobY;

      ctx.save();
      if (!d.landed) {
        // Paraquedas energético
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x - 16, dy - 24);
        ctx.lineTo(d.x, dy - 4);
        ctx.moveTo(d.x + 16, dy - 24);
        ctx.lineTo(d.x, dy - 4);
        ctx.stroke();

        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(d.x, dy - 24, 17, Math.PI, 0);
        ctx.fill();
      }

      // Cápsula brilhante da arma
      ctx.fillStyle = 'rgba(12, 16, 30, 0.85)';
      ctx.strokeStyle = spec.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(d.x - 22, dy - 14, 44, 24, 7);
      } else {
        ctx.rect(d.x - 22, dy - 14, 44, 24);
      }
      ctx.fill();
      ctx.stroke();

      drawWeaponIcon(ctx, d.weaponId, d.x - 6, dy - 1, 1, 0);
      ctx.restore();
    }

    // Feixes Laser
    for (const b of state.beams) {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = alpha * 0.45;
      ctx.lineWidth = 16 * alpha;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Projéteis
    for (const pr of state.projectiles) {
      ctx.save();
      ctx.strokeStyle = pr.color;
      ctx.lineWidth = pr.radius * 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pr.prevX, pr.prevY);
      ctx.lineTo(pr.x, pr.y);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Armas arremessadas girando
    for (const tw of state.thrown) {
      drawWeaponIcon(ctx, tw.weaponId, tw.x, tw.y, 1, tw.rot);
    }
  }

  StickGame.Weapons = {
    CATALOG,
    createState,
    spawnDrop,
    fireRanged,
    throwWeapon,
    drawWeaponIcon,
    update,
    draw
  };
})();
