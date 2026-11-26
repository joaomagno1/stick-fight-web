# Stick Fight: Arena Web

Jogo de luta 2D leve inspirado em **Stick Fight: The Game**, desenvolvido inteiramente com **HTML5, CSS3 e JavaScript puro (Vanilla JS)** — sem bibliotecas externas, sem imagens pesadas e sem arquivos de áudio externos (todo o som é sintetizado em tempo real via **Web Audio API**).

Ideal para rodar instantaneamente no navegador através do **GitHub Pages** ou abrindo o arquivo `index.html` diretamente no computador.

 **[Jogar Online (GitHub Pages)](https://joaomagno1.github.io/stick-fight-web/)**

---

## Principais Recursos

- **Ultra Leve (~50 KB no total):** Carregamento imediato em qualquer computador ou navegador escolar.
- **2 Modos de Jogo:**
  - **1 Jogador (vs IA):** Enfrente o computador em 3 níveis de dificuldade (*Fácil*, *Normal* e *Insano*).
  - **2 Jogadores Local:** Duelo no mesmo teclado com amigos.
- **Física e Movimentação Dinâmica:**
  - Bonecos *stickman* articulados proceduralmente com faixa esvoaçante e física *ragdoll* no nocaute.
  - **Pulo Duplo**, **Wall Slide / Wall Jump** (pulo na parede), **Esquiva com Invencibilidade (Dash)** e **Parry** (bloqueio perfeito que reflete tiros e atordoa o inimigo!).
- **5 Arenas Interativas:**
  1. **Telhados Neon** — Arena clássica equilibrada sobre os prédios.
  2. **Fábrica de Lava** — Poço de magma fervente e torres laterais para escalada.
  3. **Ponte Explosiva** — Passarelas suspensas repletas de barris vermelhos em cadeia.
  4. **Torre Laser** — Feixe orbital periódico no centro e espinhos inferiores.
  5. **Céu Cibernético** — Plataformas móveis sobre o abismo.
- **Suprimentos Aéreos de Armas:**
  - *Punhos (Combo + Uppercut)*, *Katana Neon (reflete balas)*, *Pistola*, *Escopeta (com recuo físico)*, *Rifle Laser* e *Bazuca Explosiva*, além de **arremesso de armas**.

---

## Controles

| Ação | Jogador 1 (Ciano) | Jogador 2 (Coral) |
| :--- | :---: | :---: |
| **Mover** | `A` / `D` | `←` / `→` |
| **Pular / Pulo Duplo / Wall Jump** | `W` | `↑` |
| **Agachar / Descer Plataforma** | `S` | `↓` |
| **Atacar / Atirar** | `F` *(ou `Espaço` no modo 1P)* | `K` ou `Num 1` |
| **Bloquear / Parry (+ Mover = Dash)** | `G` | `L` ou `Num 2` |
| **Arremessar Arma** | `E` | `O` ou `Num 3` |
| **Pausar / Som / Dicas** | `ESC` ou `P` / `M` / `H` | `ESC` ou `P` / `M` / `H` |

---

## Estrutura do Projeto

```text
├── index.html       # Estrutura principal, Canvas 16:9 e telas de interface (Menu, HUD, Pausa, Vitória)
├── style.css        # Estilização responsiva e animações leves de UI
├── js/
│   ├── audio.js     # Sintetizador de efeitos sonoros procedurais (Web Audio API)
│   ├── arenas.js    # Geometria, plataformas móveis, perigos e caixas/barris destrutíveis
│   ├── weapons.js   # Catálogo de armas, drops de paraquedas, projéteis e arremessos
│   ├── fighter.js   # Física do lutador stickman, animações procedurais, ragdoll e IA
│   └── main.js      # Loop principal (requestAnimationFrame), câmera, partículas e estado da partida
└── README.md        # Documentação e guia de publicação no GitHub Pages
```
