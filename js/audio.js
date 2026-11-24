/* ==========================================================================
   STICK FIGHT: ARENA WEB — Sintetizador de Áudio Procedural (Web Audio API)
   Zero arquivos MP3/WAV externos: super leve e carregamento instantâneo!
   ========================================================================== */

window.StickGame = window.StickGame || {};

(function () {
  let ctx = null;
  let noiseBuffer = null;
  let enabled = true;
  let sfxSuppressed = false;

  function ensureContext() {
    if (!enabled) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        ctx = new AudioCtx();
        // Pré-gera buffer curto de ruído branco para impactos, tiros e explosões
        const length = ctx.sampleRate * 0.5;
        noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freqStart, freqEnd, duration, type = 'sine', gainVal = 0.18, delay = 0, allowInMenu = false) {
    if (sfxSuppressed && !allowInMenu) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function playNoise(duration, filterFreq = 1200, filterType = 'lowpass', gainVal = 0.2, delay = 0) {
    if (sfxSuppressed) return;
    const ac = ensureContext();
    if (!ac || !noiseBuffer) return;
    const now = ac.currentTime + delay;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = ac.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFreq * 0.25), now + duration);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(now);
    src.stop(now + duration + 0.01);
  }

  StickGame.Audio = {
    unlock: ensureContext,

    isEnabled() {
      return enabled;
    },

    toggle() {
      enabled = !enabled;
      if (enabled) {
        ensureContext();
        this.click();
      }
      return enabled;
    },

    setSuppressed(flag) {
      sfxSuppressed = !!flag;
    },

    click() {
      playTone(620, 880, 0.055, 'triangle', 0.1, 0, true);
    },

    jump() {
      playTone(190, 460, 0.11, 'sine', 0.12);
    },

    dash() {
      playNoise(0.1, 1800, 'bandpass', 0.14);
      playTone(320, 140, 0.09, 'triangle', 0.08);
    },

    swing(isSword = false) {
      if (isSword) {
        playNoise(0.11, 3200, 'bandpass', 0.16);
        playTone(680, 220, 0.11, 'sawtooth', 0.08);
      } else {
        playNoise(0.075, 1100, 'bandpass', 0.12);
        playTone(260, 110, 0.07, 'sine', 0.09);
      }
    },

    hit(heavy = false) {
      if (heavy) {
        playTone(165, 38, 0.18, 'triangle', 0.28);
        playNoise(0.14, 950, 'lowpass', 0.24);
      } else {
        playTone(195, 55, 0.11, 'triangle', 0.2);
        playNoise(0.08, 1200, 'lowpass', 0.16);
      }
    },

    swordHit() {
      playTone(920, 290, 0.14, 'sawtooth', 0.16);
      playNoise(0.1, 2800, 'highpass', 0.18);
    },

    parry() {
      playTone(1150, 1760, 0.14, 'triangle', 0.2);
      playTone(1760, 2350, 0.18, 'sine', 0.15, 0.03);
    },

    shoot(kind) {
      if (kind === 'pistol') {
        playNoise(0.1, 2200, 'lowpass', 0.22);
        playTone(380, 90, 0.09, 'sawtooth', 0.15);
      } else if (kind === 'shotgun') {
        playNoise(0.22, 1400, 'lowpass', 0.34);
        playTone(180, 42, 0.2, 'sawtooth', 0.24);
      } else if (kind === 'laser') {
        playTone(1450, 240, 0.18, 'sawtooth', 0.18);
        playTone(980, 180, 0.18, 'square', 0.1);
      } else if (kind === 'grenade') {
        playTone(240, 95, 0.15, 'triangle', 0.22);
        playNoise(0.1, 700, 'lowpass', 0.15);
      }
    },

    explosion() {
      playNoise(0.45, 650, 'lowpass', 0.42);
      playTone(120, 26, 0.42, 'sawtooth', 0.3);
    },

    pickup() {
      playTone(520, 740, 0.08, 'triangle', 0.14);
      playTone(740, 1040, 0.11, 'triangle', 0.14, 0.06);
    },

    roundStart() {
      playTone(330, 440, 0.12, 'triangle', 0.15);
      playTone(440, 660, 0.2, 'triangle', 0.18, 0.11);
    },

    ko() {
      playNoise(0.32, 900, 'lowpass', 0.32);
      playTone(220, 45, 0.45, 'sawtooth', 0.28);
    },

    victory() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        playTone(n, n * 1.01, 0.22, 'triangle', 0.16, idx * 0.09);
      });
    }
  };
})();
