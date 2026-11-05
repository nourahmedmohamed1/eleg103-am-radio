/**
 * AM Radio Project — Interactive Circuit Drawer & Schematic CAD Workbench
 * =======================================================================
 * Allows users to interactively draw, modify, simulate, and export circuit schematics.
 * Supports snap-to-grid, wire routing, standard electronic symbols,
 * pre-loaded milestone schematics, signal flow animations, and high-res export.
 */

/* global MILESTONES */

const CircuitDrawer = (function () {
  'use strict';

  // Canvas and state
  let canvas, ctx;
  let width = 800, height = 480;
  const GRID_SIZE = 20;

  // Active Tool: 'select', 'wire', 'erase', or component type ('resistor', 'inductor', etc.)
  let activeTool = 'select';

  // Data structures
  let components = [];
  let wires = [];
  let history = [];
  let historyStep = -1;

  // Interaction state
  let selectedItem = null; // { type: 'component' | 'wire', item: obj }
  let isDragging = null;
  let dragOffset = { x: 0, y: 0 };
  let currentWire = null; // in-progress wire points: [{x, y}, ...]
  let hoverNode = null;
  let animateSignal = false; // Calibrated static schematic without artificial moving current dots
  let animTime = 0;
  let animId = null;
  let activeProbe = null; // 'tp1' or 'tp3' inspector

  // Symbol definitions and defaults
  const SYMBOLS = {
    resistor: {
      name: 'Resistor',
      defRef: 'R',
      defVal: '10 kΩ',
      width: 60,
      height: 20,
      pins: [{ x: -30, y: 0 }, { x: 30, y: 0 }]
    },
    capacitor: {
      name: 'Capacitor',
      defRef: 'C',
      defVal: '100 nF',
      width: 40,
      height: 40,
      pins: [{ x: -20, y: 0 }, { x: 20, y: 0 }]
    },
    var_capacitor: {
      name: 'Var. Capacitor',
      defRef: 'Cvar',
      defVal: '10–365 pF',
      width: 50,
      height: 40,
      pins: [{ x: -20, y: 0 }, { x: 20, y: 0 }]
    },
    inductor: {
      name: 'Inductor',
      defRef: 'L',
      defVal: '250 µH',
      width: 60,
      height: 30,
      pins: [{ x: -30, y: 0 }, { x: 30, y: 0 }]
    },
    diode: {
      name: 'Diode',
      defRef: 'D',
      defVal: '1N34A',
      width: 50,
      height: 30,
      pins: [{ x: -25, y: 0 }, { x: 25, y: 0 }]
    },
    transistor: {
      name: 'NPN Transistor',
      defRef: 'Q',
      defVal: '2N3904',
      width: 50,
      height: 60,
      pins: [{ x: -20, y: 0 }, { x: 20, y: -20 }, { x: 20, y: 20 }] // Base, Collector, Emitter
    },
    ground: {
      name: 'Ground',
      defRef: 'GND',
      defVal: '0 V',
      width: 30,
      height: 30,
      pins: [{ x: 0, y: -15 }]
    },
    antenna: {
      name: 'Antenna',
      defRef: 'ANT',
      defVal: 'Long-Wire',
      width: 30,
      height: 40,
      pins: [{ x: 0, y: 20 }]
    },
    vcc: {
      name: '+9V VCC',
      defRef: 'VCC',
      defVal: '+9 V',
      width: 30,
      height: 30,
      pins: [{ x: 0, y: 15 }]
    },
    speaker: {
      name: 'Speaker',
      defRef: 'SPK',
      defVal: '8 Ω',
      width: 50,
      height: 50,
      pins: [{ x: -20, y: -10 }, { x: -20, y: 10 }]
    }
  };

  /** Helper: Snap value to grid */
  function snap(val) {
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }

  /* ────────────────────────────────────────────────────────
   *  INIT
   * ──────────────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById('circuit-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    bindEvents();
    recordState();

    // Start render & animation loop
    if (!animId) {
      animLoop();
    }

    // Load initial Milestone 1 schematic
    loadMilestonePreset(0);
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(rect.width || 760, 400);
    height = Math.max(rect.height || 420, 360);

    // Set display and internal sizes with high DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
  }

  /* ────────────────────────────────────────────────────────
   *  MILESTONE PRESETS
   * ──────────────────────────────────────────────────────── */
  function loadMilestonePreset(milestoneIndex) {
    components = [];
    wires = [];
    selectedItem = null;
    currentWire = null;

    if (milestoneIndex === 0) {
      // Milestone 1: Function Generator (GEN) → 5-Turn Test Loop --(Mutual M)--> 75-Turn Tank (L1 || C1) → 1N60P Diode → R1 || C2 Load
      components = [
        { id: 'gen1', type: 'vcc', x: 80, y: 160, rotation: 0, ref: 'GEN', val: '0.1V 819kHz' },
        { id: 'loop1', type: 'inductor', x: 80, y: 260, rotation: 90, ref: 'Test Loop', val: '5 turns' },
        { id: 'gnd_gen', type: 'ground', x: 80, y: 375, rotation: 0, ref: 'GND', val: '0 V' },

        { id: 'l1', type: 'inductor', x: 260, y: 260, rotation: 90, ref: 'L₁ (M1)', val: '75T (291µH)' },
        { id: 'c1', type: 'var_capacitor', x: 360, y: 260, rotation: 90, ref: 'C₁', val: '20–280 pF' },
        { id: 'gnd_tank', type: 'ground', x: 310, y: 375, rotation: 0, ref: 'GND', val: '0 V' },

        { id: 'd1', type: 'diode', x: 470, y: 160, rotation: 0, ref: 'D₁', val: '1N60P Ge' },

        { id: 'r1', type: 'resistor', x: 570, y: 260, rotation: 90, ref: 'R₁', val: '15 kΩ' },
        { id: 'c2', type: 'capacitor', x: 650, y: 260, rotation: 90, ref: 'C₂', val: '3.3 nF' },
        { id: 'gnd_load', type: 'ground', x: 610, y: 375, rotation: 0, ref: 'GND', val: '0 V' }
      ];

      wires = [
        // Primary Drive Loop: GEN to Test Loop to GND
        [{ x: 80, y: 175 }, { x: 80, y: 230 }],
        [{ x: 80, y: 290 }, { x: 80, y: 360 }],

        // Tank Top RF Rail & Diode Anode input
        [{ x: 260, y: 230 }, { x: 260, y: 160 }, { x: 360, y: 160 }, { x: 445, y: 160 }],
        [{ x: 360, y: 160 }, { x: 360, y: 240 }],

        // Tank Bottom Ground Rail
        [{ x: 260, y: 290 }, { x: 260, y: 360 }, { x: 360, y: 360 }],
        [{ x: 360, y: 280 }, { x: 360, y: 360 }],

        // Diode Cathode Output through R1 || C2 and line continuing past 3.3 nF capacitor to output
        [{ x: 495, y: 160 }, { x: 570, y: 160 }, { x: 650, y: 160 }, { x: 780, y: 160 }],
        [{ x: 570, y: 160 }, { x: 570, y: 230 }],
        [{ x: 650, y: 160 }, { x: 650, y: 240 }],

        // Demodulation Load Ground Rail continuing past 3.3 nF capacitor on the other hand
        [{ x: 570, y: 290 }, { x: 570, y: 360 }, { x: 650, y: 360 }, { x: 780, y: 360 }],
        [{ x: 650, y: 280 }, { x: 650, y: 360 }]
      ];
    } else if (milestoneIndex === 1) {
      // Milestone 2: Audio Amplifier
      components = [
        { id: 'vcc1', type: 'vcc', x: 360, y: 60, rotation: 0, ref: 'VCC', val: '+9 V' },
        { id: 'r1', type: 'resistor', x: 200, y: 120, rotation: 90, ref: 'R₁', val: '47 kΩ' },
        { id: 'r2', type: 'resistor', x: 320, y: 120, rotation: 90, ref: 'R₂', val: '4.7 kΩ' },
        { id: 'c1', type: 'capacitor', x: 120, y: 200, rotation: 0, ref: 'C₁', val: '10 µF' },
        { id: 'q1', type: 'transistor', x: 260, y: 200, rotation: 0, ref: 'Q₁', val: '2N3904' },
        { id: 'r3', type: 'resistor', x: 200, y: 280, rotation: 90, ref: 'R₃', val: '10 kΩ' },
        { id: 'r4', type: 'resistor', x: 280, y: 280, rotation: 90, ref: 'R₄', val: '1 kΩ' },
        { id: 'c2', type: 'capacitor', x: 420, y: 180, rotation: 0, ref: 'C₃', val: '10 µF' },
        { id: 'spk1', type: 'speaker', x: 560, y: 220, rotation: 0, ref: 'SPK', val: '8 Ω' },
        { id: 'gnd1', type: 'ground', x: 240, y: 360, rotation: 0, ref: 'GND', val: '0 V' }
      ];

      wires = [
        // Power rail
        [{ x: 360, y: 75 }, { x: 360, y: 90 }, { x: 200, y: 90 }],
        [{ x: 360, y: 90 }, { x: 320, y: 90 }],
        // Audio in
        [{ x: 60, y: 200 }, { x: 100, y: 200 }],
        [{ x: 140, y: 200 }, { x: 200, y: 200 }, { x: 240, y: 200 }],
        [{ x: 200, y: 150 }, { x: 200, y: 200 }, { x: 200, y: 250 }],
        // Collector to R2 & C2
        [{ x: 320, y: 150 }, { x: 280, y: 180 }, { x: 400, y: 180 }],
        // Emitter to R4
        [{ x: 280, y: 220 }, { x: 280, y: 250 }],
        // C3 to speaker
        [{ x: 440, y: 180 }, { x: 500, y: 180 }, { x: 540, y: 210 }],
        // Ground rail
        [{ x: 200, y: 310 }, { x: 200, y: 340 }, { x: 280, y: 340 }, { x: 280, y: 310 }],
        [{ x: 240, y: 340 }, { x: 240, y: 345 }],
        [{ x: 540, y: 230 }, { x: 540, y: 340 }, { x: 280, y: 340 }]
      ];
    } else if (milestoneIndex === 2) {
      // Milestone 3: Power Supply & 7809 Regulation
      components = [
        { id: 'd1', type: 'diode', x: 160, y: 140, rotation: 0, ref: 'D₁', val: '1N4007' },
        { id: 'c1', type: 'capacitor', x: 280, y: 220, rotation: 90, ref: 'C₁', val: '2200 µF' },
        { id: 'r1', type: 'resistor', x: 420, y: 140, rotation: 0, ref: 'IC₁', val: '7809 (+9V)' },
        { id: 'c2', type: 'capacitor', x: 560, y: 220, rotation: 90, ref: 'C₂', val: '470 µF' },
        { id: 'vcc1', type: 'vcc', x: 680, y: 125, rotation: 0, ref: 'OUT', val: '+9.0 V DC' },
        { id: 'gnd1', type: 'ground', x: 420, y: 340, rotation: 0, ref: 'GND', val: 'Chassis' }
      ];

      wires = [
        // AC In to Diode
        [{ x: 80, y: 140 }, { x: 135, y: 140 }],
        // Rectified DC bus
        [{ x: 185, y: 140 }, { x: 280, y: 140 }, { x: 390, y: 140 }],
        [{ x: 280, y: 140 }, { x: 280, y: 200 }],
        [{ x: 280, y: 240 }, { x: 280, y: 300 }],
        // Regulator out
        [{ x: 450, y: 140 }, { x: 560, y: 140 }, { x: 680, y: 140 }],
        [{ x: 560, y: 140 }, { x: 560, y: 200 }],
        [{ x: 560, y: 240 }, { x: 560, y: 300 }],
        // Ground bus
        [{ x: 280, y: 300 }, { x: 420, y: 300 }, { x: 560, y: 300 }, { x: 680, y: 300 }],
        [{ x: 420, y: 300 }, { x: 420, y: 325 }]
      ];
    } else {
      // Milestone 4: System Integration (Full AM Receiver Chain)
      components = [
        { id: 'ant', type: 'antenna', x: 60, y: 80, rotation: 0, ref: 'ANT', val: 'Ferrite/Wire' },
        { id: 'l1', type: 'inductor', x: 140, y: 180, rotation: 90, ref: 'L₁', val: '250 µH' },
        { id: 'c1', type: 'var_capacitor', x: 220, y: 180, rotation: 90, ref: 'C₁', val: 'Tuning Dial' },
        { id: 'd1', type: 'diode', x: 320, y: 120, rotation: 0, ref: 'D₁', val: '1N34A' },
        { id: 'q1', type: 'transistor', x: 440, y: 180, rotation: 0, ref: 'Q₁', val: 'Audio Preamp' },
        { id: 'q2', type: 'transistor', x: 560, y: 180, rotation: 0, ref: 'Q₂', val: 'Power Amp' },
        { id: 'spk', type: 'speaker', x: 680, y: 180, rotation: 0, ref: 'SPK', val: 'Loudspeaker' },
        { id: 'gnd', type: 'ground', x: 380, y: 320, rotation: 0, ref: 'GND', val: 'Star Ground' }
      ];

      wires = [
        [{ x: 60, y: 100 }, { x: 60, y: 120 }, { x: 140, y: 120 }, { x: 220, y: 120 }, { x: 295, y: 120 }],
        [{ x: 140, y: 120 }, { x: 140, y: 150 }],
        [{ x: 220, y: 120 }, { x: 220, y: 160 }],
        [{ x: 140, y: 210 }, { x: 140, y: 260 }, { x: 220, y: 260 }, { x: 220, y: 200 }],
        [{ x: 345, y: 120 }, { x: 400, y: 120 }, { x: 400, y: 180 }, { x: 420, y: 180 }],
        [{ x: 460, y: 160 }, { x: 500, y: 160 }, { x: 500, y: 180 }, { x: 540, y: 180 }],
        [{ x: 580, y: 160 }, { x: 640, y: 160 }, { x: 660, y: 170 }],
        [{ x: 660, y: 190 }, { x: 660, y: 260 }, { x: 380, y: 260 }, { x: 140, y: 260 }],
        [{ x: 380, y: 260 }, { x: 380, y: 305 }]
      ];
    }

    recordState();
    updateStatus(`Loaded Milestone ${milestoneIndex + 1} schematic preset.`);
  }

  /* ────────────────────────────────────────────────────────
   *  RENDER LOOP
   * ──────────────────────────────────────────────────────── */
  function animLoop() {
    animTime += 0.03;
    draw();
    animId = requestAnimationFrame(animLoop);
  }

  function draw() {
    if (!ctx) return;

    // Background - Engineering Slate
    ctx.fillStyle = '#0d111a';
    ctx.fillRect(0, 0, width, height);

    // Coordinate Blueprint Grid
    drawGrid();

    // Electrical Circuit Continuity & Node Analysis
    const analysis = analyzeCircuit();

    // Draw wireless mutual inductive coupling between coils
    drawMagneticCoupling(analysis);

    // Draw all wires
    drawWires();

    // Draw in-progress wire
    if (currentWire && currentWire.length > 1) {
      drawWire(currentWire, true);
    }

    // Draw all components
    components.forEach(c => drawComponent(c, selectedItem?.item === c));

    // Draw connection pins/nodes
    drawPins();

    // Draw output terminals (past the 3.3 nF capacitor)
    drawOutputTerminals();

    // Animated signal / electron pulse along active closed wires only
    if (animateSignal && analysis.activeWires.size > 0) {
      drawSignalFlow(analysis);
    }

    // Real-time circuit status HUD badge
    drawStatusBadge(analysis);
  }

  /** Draw blueprint grid lines */
  function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';

    ctx.beginPath();
    for (let x = 0; x < width; x += GRID_SIZE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = 0; y < height; y += GRID_SIZE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();

    // Major grid dots
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    for (let x = 0; x < width; x += GRID_SIZE * 2) {
      for (let y = 0; y < height; y += GRID_SIZE * 2) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  /**
   * Evaluates circuit continuity and identifies which wires form complete circuits.
   */
  function analyzeCircuit() {
    const activeWires = new Set();
    if (wires.length === 0) {
      return {
        activeWires,
        primaryClosed: false,
        tankResonant: false,
        detectorActive: false,
        statusMsg: 'Circuit Empty — Place components and connect terminals.',
        statusOk: false
      };
    }

    function touchesWire(p, w) {
      for (let i = 0; i < w.length; i++) {
        if (Math.hypot(p.x - w[i].x, p.y - w[i].y) <= 14) return true;
      }
      for (let i = 0; i < w.length - 1; i++) {
        if (distToSegment(p, w[i], w[i + 1]) <= 8) return true;
      }
      return false;
    }

    function wiresTouch(w1, w2) {
      for (let i = 0; i < w1.length; i++) {
        if (touchesWire(w1[i], w2)) return true;
      }
      return false;
    }

    // Form connected wire networks
    const wireGroups = [];
    const visited = new Set();
    wires.forEach(w => {
      if (visited.has(w)) return;
      const group = [];
      const queue = [w];
      visited.add(w);
      while (queue.length > 0) {
        const cur = queue.shift();
        group.push(cur);
        wires.forEach(other => {
          if (!visited.has(other) && wiresTouch(cur, other)) {
            visited.add(other);
            queue.push(other);
          }
        });
      }
      wireGroups.push(group);
    });

    function getGroupTouchingPin(pin) {
      for (const group of wireGroups) {
        for (const w of group) {
          if (touchesWire(pin, w)) return group;
        }
      }
      return null;
    }

    // Identify circuit landmarks
    const gen = components.find(c => c.type === 'vcc' || (c.ref && c.ref.toUpperCase().includes('GEN')));
    const loop = components.find(c => (c.ref && c.ref.toLowerCase().includes('loop')) || (c.type === 'inductor' && c.x < 180));
    const tankL = components.find(c => c.type === 'inductor' && c !== loop);
    const tankC = components.find(c => c.type === 'var_capacitor' || (c.type === 'capacitor' && c.x > 200 && c.x < 420));
    const diode = components.find(c => c.type === 'diode');
    const loadR = components.find(c => c.type === 'resistor' && c.x > 500);
    const loadC = components.find(c => c.type === 'capacitor' && c.x > 500);
    const grounds = components.filter(c => c.type === 'ground');

    let primaryClosed = false;
    let tankResonant = false;
    let detectorActive = false;
    let statusMsg = '';
    let statusOk = false;

    // 1. Check Primary Generator Loop
    if (gen && loop) {
      const genPins = getAbsolutePins(gen);
      const loopPins = getAbsolutePins(loop);
      if (genPins.length > 0 && loopPins.length >= 2) {
        const gGen = getGroupTouchingPin(genPins[0]);
        const connectsGenToLoop = gGen && loopPins.some(lp => gGen.some(w => touchesWire(lp, w)));
        const connectsLoopToGnd = grounds.some(gnd => {
          return getAbsolutePins(gnd).some(gp => {
            const grp = getGroupTouchingPin(gp);
            return grp && loopPins.some(lp => grp.some(w => touchesWire(lp, w)));
          });
        });

        if (connectsGenToLoop && connectsLoopToGnd) {
          primaryClosed = true;
          if (gGen) gGen.forEach(w => activeWires.add(w));
          grounds.forEach(gnd => {
            getAbsolutePins(gnd).forEach(gp => {
              const grp = getGroupTouchingPin(gp);
              if (grp && loopPins.some(lp => grp.some(w => touchesWire(lp, w)))) {
                grp.forEach(w => activeWires.add(w));
              }
            });
          });
        }
      }
    }

    // 2. Check Resonant Tank Loop
    const topTankPins = [];
    const botTankPins = [];
    if (tankL) {
      const lPins = getAbsolutePins(tankL);
      if (lPins.length >= 2) {
        topTankPins.push(lPins[0].y < lPins[1].y ? lPins[0] : lPins[1]);
        botTankPins.push(lPins[0].y < lPins[1].y ? lPins[1] : lPins[0]);
      }
    }
    if (tankC) {
      const cPins = getAbsolutePins(tankC);
      if (cPins.length >= 2) {
        topTankPins.push(cPins[0].y < cPins[1].y ? cPins[0] : cPins[1]);
        botTankPins.push(cPins[0].y < cPins[1].y ? cPins[1] : cPins[0]);
      }
    }

    if (primaryClosed && (tankL || tankC)) {
      const botConnectedGnd = grounds.some(gnd => {
        return getAbsolutePins(gnd).some(gp => {
          const grp = getGroupTouchingPin(gp);
          return grp && botTankPins.some(bp => grp.some(w => touchesWire(bp, w)));
        });
      });

      const topGroup = topTankPins.length > 0 ? getGroupTouchingPin(topTankPins[0]) : null;

      if (botConnectedGnd && topGroup) {
        tankResonant = true;
        if (topGroup) topGroup.forEach(w => activeWires.add(w));
        grounds.forEach(gnd => {
          getAbsolutePins(gnd).forEach(gp => {
            const grp = getGroupTouchingPin(gp);
            if (grp && botTankPins.some(bp => grp.some(w => touchesWire(bp, w)))) {
              grp.forEach(w => activeWires.add(w));
            }
          });
        });
      }
    }

    // 3. Check Diode Detector & Demodulation Load
    if (tankResonant && diode && (loadR || loadC)) {
      const dPins = getAbsolutePins(diode);
      if (dPins.length >= 2) {
        const anode = dPins[0].x < dPins[1].x ? dPins[0] : dPins[1];
        const cathode = dPins[0].x < dPins[1].x ? dPins[1] : dPins[0];

        const anodeGroup = getGroupTouchingPin(anode);
        const anodeOnTank = anodeGroup && topTankPins.some(tp => anodeGroup.some(w => touchesWire(tp, w)));

        const loadTopPins = [];
        const loadBotPins = [];
        if (loadR) {
          const rPins = getAbsolutePins(loadR);
          if (rPins.length >= 2) {
            loadTopPins.push(rPins[0].y < rPins[1].y ? rPins[0] : rPins[1]);
            loadBotPins.push(rPins[0].y < rPins[1].y ? rPins[1] : rPins[0]);
          }
        }
        if (loadC) {
          const cPins = getAbsolutePins(loadC);
          if (cPins.length >= 2) {
            loadTopPins.push(cPins[0].y < cPins[1].y ? cPins[0] : cPins[1]);
            loadBotPins.push(cPins[0].y < cPins[1].y ? cPins[1] : cPins[0]);
          }
        }

        const cathodeGroup = getGroupTouchingPin(cathode);
        const cathodeOnLoad = cathodeGroup && loadTopPins.some(lp => cathodeGroup.some(w => touchesWire(lp, w)));

        const loadOnGnd = grounds.some(gnd => {
          return getAbsolutePins(gnd).some(gp => {
            const grp = getGroupTouchingPin(gp);
            return grp && loadBotPins.some(bp => grp.some(w => touchesWire(bp, w)));
          });
        });

        if (anodeOnTank && cathodeOnLoad && loadOnGnd) {
          detectorActive = true;
          if (cathodeGroup) cathodeGroup.forEach(w => activeWires.add(w));
          grounds.forEach(gnd => {
            getAbsolutePins(gnd).forEach(gp => {
              const grp = getGroupTouchingPin(gp);
              if (grp && loadBotPins.some(bp => grp.some(w => touchesWire(bp, w)))) {
                grp.forEach(w => activeWires.add(w));
              }
            });
          });
        }
      }
    }

    if (primaryClosed && tankResonant && detectorActive) {
      statusOk = true;
      statusMsg = 'RF Resonance & Diode Detection Active — 819 kHz Tuned | TP1: 120 mV pk | TP3: 42 mV DC';
    } else if (!primaryClosed) {
      statusOk = false;
      statusMsg = 'Open Circuit: Primary drive loop is broken (GEN or 5-Turn Loop disconnected).';
    } else if (!tankResonant) {
      statusOk = false;
      statusMsg = 'Open Circuit: LC Tank is disconnected from Ground or TP1 rail. Resonance lost.';
    } else {
      statusOk = false;
      statusMsg = 'Open Circuit: Detector branch is disconnected (Diode D₁ or RC load missing ground return).';
    }

    return {
      activeWires,
      primaryClosed,
      tankResonant,
      detectorActive,
      statusMsg,
      statusOk
    };
  }

  /** Draw animated magnetic flux curves between Test Loop and Solenoid */
  function drawMagneticCoupling(analysis) {
    const loop = components.find(c => c.ref && c.ref.toLowerCase().includes('loop'));
    const l1 = components.find(c => c.type === 'inductor' && c !== loop);
    if (!loop || !l1) return;

    ctx.save();
    const x1 = loop.x + 24;
    const x2 = l1.x - 24;
    const midY = (loop.y + l1.y) / 2;
    const isActive = analysis && analysis.primaryClosed;

    ctx.strokeStyle = isActive
      ? `rgba(245, 158, 11, ${0.45 + 0.3 * Math.sin(animTime * 3)})`
      : 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      const cy = midY + i * 22;
      ctx.moveTo(x1, cy);
      const wave = isActive ? Math.sin(animTime * 2.5 + i) * 6 : 0;
      ctx.quadraticCurveTo((x1 + x2) / 2, cy - wave, x2, cy);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillStyle = isActive ? '#f59e0b' : '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(isActive ? 'Mutual Coupling M (k ≈ 0.12)' : 'Decoupled (GEN Loop Open)', (x1 + x2) / 2, midY - 26);
    ctx.restore();
  }

  /** Draw clean output terminals on the other hand of the 3.3 nF filter capacitor */
  function drawOutputTerminals() {
    ctx.save();
    // Top Output Terminal (Detected Audio / DC Level)
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = '#0b0f17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(780, 160, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AUDIO / DC OUT', 792, 164);

    // Bottom Output Terminal (Ground Return)
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(780, 360, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('GND', 792, 364);

    ctx.restore();
  }

  /** Draw real-time simulation status badge on canvas */
  function drawStatusBadge(analysis) {
    ctx.save();
    const isOk = analysis && analysis.statusOk;
    const bg = isOk ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    const stroke = isOk ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
    const textCol = isOk ? '#34d399' : '#f87171';
    const dotCol = isOk ? '#10b981' : '#ef4444';

    ctx.fillStyle = bg;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(width - 240, 14, 226, 28, 6);
    ctx.fill();
    ctx.stroke();

    // LED status indicator
    ctx.beginPath();
    ctx.arc(width - 226, 28, 4, 0, Math.PI * 2);
    ctx.fillStyle = dotCol;
    ctx.shadowColor = dotCol;
    ctx.shadowBlur = isOk ? 8 : 4;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = textCol;
    ctx.font = '600 10.5px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isOk ? 'SIM: 819 kHz Resonance OK' : 'SIM: Open Circuit Detected', width - 216, 32);
    ctx.restore();
  }

  /** Draw all completed wires */
  function drawWires() {
    wires.forEach(w => {
      const isSel = selectedItem?.item === w;
      drawWire(w, false, isSel);
    });
  }

  /** Draw a single wire path */
  function drawWire(pts, isTemp, isSelected) {
    if (pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    if (isSelected) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 8;
    } else if (isTemp) {
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
    } else {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
      ctx.shadowBlur = 4;
    }

    ctx.stroke();
    ctx.restore();

    // Junction solder dots at internal vertices
    if (!isTemp) {
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#f59e0b' : '#38bdf8';
        ctx.fill();
      });
    }
  }

  /** Draw animated current / signal flow pulses ONLY on active closed wires */
  function drawSignalFlow(analysis) {
    if (!analysis || !analysis.activeWires || analysis.activeWires.size === 0) return;

    ctx.save();
    ctx.fillStyle = '#00F2FE';
    ctx.shadowColor = '#00F2FE';
    ctx.shadowBlur = 6;

    let wi = 0;
    analysis.activeWires.forEach(w => {
      wi++;
      if (w.length < 2) return;
      for (let i = 0; i < w.length - 1; i++) {
        const p1 = w[i];
        const p2 = w[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist === 0) continue;

        const count = Math.max(1, Math.floor(dist / 40));
        for (let j = 0; j < count; j++) {
          const t = ((animTime * 1.5 + j / count + wi * 0.2) % 1 + 1) % 1;
          const px = p1.x + (p2.x - p1.x) * t;
          const py = p1.y + (p2.y - p1.y) * t;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    ctx.restore();
  }

  /** Draw connection pins on components */
  function drawPins() {
    components.forEach(c => {
      const def = SYMBOLS[c.type];
      if (!def) return;
      const pins = getAbsolutePins(c);
      pins.forEach(pin => {
        const isHover = hoverNode && Math.hypot(hoverNode.x - pin.x, hoverNode.y - pin.y) < 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, isHover ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? '#f59e0b' : '#00F2FE';
        ctx.shadowColor = isHover ? '#f59e0b' : '#00F2FE';
        ctx.shadowBlur = isHover ? 10 : 4;
        ctx.fill();
        ctx.restore();
      });
    });
  }

  /** Compute world coordinates for component pins */
  function getAbsolutePins(c) {
    const def = SYMBOLS[c.type];
    if (!def) return [];
    const rad = ((c.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return def.pins.map(p => ({
      x: snap(c.x + p.x * cos - p.y * sin),
      y: snap(c.y + p.x * sin + p.y * cos)
    }));
  }

  /* ────────────────────────────────────────────────────────
   *  DRAW SPECIFIC ELECTRONIC SYMBOLS
   * ──────────────────────────────────────────────────────── */
  function drawComponent(c, isSelected) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(((c.rotation || 0) * Math.PI) / 180);

    ctx.strokeStyle = isSelected ? '#f59e0b' : '#e2e8f0';
    ctx.fillStyle = isSelected ? '#f59e0b' : '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isSelected) {
      ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
      ctx.shadowBlur = 10;
    }

    switch (c.type) {
      case 'resistor':
        drawResistorSymbol();
        break;
      case 'capacitor':
        drawCapacitorSymbol(false);
        break;
      case 'var_capacitor':
        drawCapacitorSymbol(true);
        break;
      case 'inductor':
        drawInductorSymbol();
        break;
      case 'diode':
        drawDiodeSymbol();
        break;
      case 'transistor':
        drawTransistorSymbol();
        break;
      case 'ground':
        drawGroundSymbol();
        break;
      case 'antenna':
        drawAntennaSymbol();
        break;
      case 'vcc':
        drawVccSymbol();
        break;
      case 'speaker':
        drawSpeakerSymbol();
        break;
      default:
        ctx.strokeRect(-20, -15, 40, 30);
    }

    ctx.restore();

    // Draw reference & value labels
    drawLabels(c, isSelected);
  }

  function drawLabels(c, isSelected) {
    ctx.save();
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = isSelected ? '#f59e0b' : '#00F2FE';
    ctx.textAlign = 'center';

    const yOff = c.type === 'ground' ? 24 : -24;
    ctx.fillText(c.ref, c.x, c.y + yOff);

    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(c.val, c.x, c.y + yOff + 13);
    ctx.restore();
  }

  function drawResistorSymbol() {
    // Lead in
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-20, 0);
    // Zigzag
    const pts = [-20, 0, -15, -10, -5, 10, 5, -10, 15, 10, 20, 0];
    for (let i = 0; i < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    // Lead out
    ctx.lineTo(30, 0);
    ctx.stroke();
  }

  function drawCapacitorSymbol(isVariable) {
    // Leads
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-6, 0);
    ctx.moveTo(6, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Plates
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(-6, 18);
    ctx.moveTo(6, -18);
    ctx.lineTo(6, 18);
    ctx.stroke();

    // Arrow for variable cap
    if (isVariable) {
      ctx.save();
      ctx.strokeStyle = '#00F2FE';
      ctx.fillStyle = '#00F2FE';
      ctx.beginPath();
      ctx.moveTo(-16, 18);
      ctx.lineTo(16, -18);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(16, -18);
      ctx.lineTo(10, -18);
      ctx.lineTo(16, -12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawInductorSymbol() {
    // 4 Arcs
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-20, 0);

    const r = 5;
    for (let i = 0; i < 4; i++) {
      const cx = -15 + i * 10;
      ctx.arc(cx, 0, r, Math.PI, 0, false);
    }
    ctx.lineTo(30, 0);
    ctx.stroke();
  }

  function drawDiodeSymbol() {
    // Leads
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-12, 0);
    ctx.moveTo(12, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();

    // Triangle anode
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(12, 0);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.stroke();

    // Cathode bar
    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.lineTo(12, 14);
    ctx.stroke();
  }

  function drawTransistorSymbol() {
    // Base lead
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-6, 0);
    // Base vertical bar
    ctx.moveTo(-6, -16);
    ctx.lineTo(-6, 16);
    ctx.stroke();

    // Collector lead
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(14, -20);
    ctx.lineTo(20, -20);
    ctx.stroke();

    // Emitter lead with arrow
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(14, 20);
    ctx.lineTo(20, 20);
    ctx.stroke();

    // Emitter Arrow
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(8, 17);
    ctx.lineTo(15, 21);
    ctx.lineTo(13, 13);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  }

  function drawGroundSymbol() {
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 0);
    // 3 lines
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.moveTo(-10, 6);
    ctx.lineTo(10, 6);
    ctx.moveTo(-4, 12);
    ctx.lineTo(4, 12);
    ctx.stroke();
  }

  function drawAntennaSymbol() {
    // Triangle
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(12, -16);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.stroke();
  }

  function drawVccSymbol() {
    // Arrow pointing up
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(0, -6);
    ctx.moveTo(-8, -2);
    ctx.lineTo(0, -12);
    ctx.lineTo(8, -2);
    ctx.stroke();
  }

  function drawSpeakerSymbol() {
    // Coil box
    ctx.strokeRect(-20, -12, 10, 24);
    // Cone
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(15, -22);
    ctx.lineTo(15, 22);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.stroke();
  }

  /* ────────────────────────────────────────────────────────
   *  INTERACTION & EVENTS
   * ──────────────────────────────────────────────────────── */
  function bindEvents() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKeyDown);
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, snapX: snap(x), snapY: snap(y) };
  }

  function onMouseDown(e) {
    const pos = getMousePos(e);

    // 1. Tool: Place new component
    if (SYMBOLS[activeTool]) {
      const def = SYMBOLS[activeTool];
      const count = components.filter(c => c.type === activeTool).length + 1;
      const newComp = {
        id: activeTool + '_' + Date.now(),
        type: activeTool,
        x: pos.snapX,
        y: pos.snapY,
        rotation: 0,
        ref: def.defRef + count,
        val: def.defVal
      };
      components.push(newComp);
      selectedItem = { type: 'component', item: newComp };
      recordState();
      updateStatus(`Placed ${def.name} at (${pos.snapX}, ${pos.snapY})`);
      return;
    }

    // 2. Tool: Wire tool
    if (activeTool === 'wire') {
      const node = findNearestNode(pos.x, pos.y);
      const startPt = node || { x: pos.snapX, y: pos.snapY };

      if (!currentWire) {
        currentWire = [startPt, { x: pos.snapX, y: pos.snapY }];
      } else {
        // Add segment
        const last = currentWire[currentWire.length - 1];
        if (last.x !== pos.snapX || last.y !== pos.snapY) {
          currentWire[currentWire.length - 1] = { x: pos.snapX, y: pos.snapY };
          currentWire.push({ x: pos.snapX, y: pos.snapY });
        }
      }
      return;
    }

    // 3. Tool: Erase
    if (activeTool === 'erase') {
      const hit = findHit(pos.x, pos.y);
      if (hit) {
        if (hit.type === 'component') {
          components = components.filter(c => c !== hit.item);
        } else if (hit.type === 'wire') {
          wires = wires.filter(w => w !== hit.item);
        }
        selectedItem = null;
        recordState();
        updateStatus('Item deleted.');
      }
      return;
    }

    // 4. Tool: Select / Drag
    if (activeTool === 'select') {
      const hit = findHit(pos.x, pos.y);
      if (hit) {
        selectedItem = hit;
        if (hit.type === 'component') {
          isDragging = hit.item;
          dragOffset = { x: hit.item.x - pos.x, y: hit.item.y - pos.y };
        }
      } else {
        selectedItem = null;
      }
    }
  }

  function onMouseMove(e) {
    const pos = getMousePos(e);
    hoverNode = findNearestNode(pos.x, pos.y);

    if (isDragging) {
      isDragging.x = snap(pos.x + dragOffset.x);
      isDragging.y = snap(pos.y + dragOffset.y);
    } else if (currentWire && currentWire.length > 0) {
      // Orthogonal routing for in-progress wire
      const p0 = currentWire[currentWire.length - 2];
      const target = hoverNode || { x: pos.snapX, y: pos.snapY };

      // Snap orthogonally
      const dx = Math.abs(target.x - p0.x);
      const dy = Math.abs(target.y - p0.y);
      if (dx > dy) {
        currentWire[currentWire.length - 1] = { x: target.x, y: p0.y };
      } else {
        currentWire[currentWire.length - 1] = { x: p0.x, y: target.y };
      }
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = null;
      recordState();
    }
  }

  function onDoubleClick(e) {
    if (currentWire && currentWire.length >= 2) {
      // Finish drawing wire on double click
      wires.push([...currentWire]);
      currentWire = null;
      recordState();
      updateStatus('Wire connection complete.');
      return;
    }

    // Double click component to edit label
    const pos = getMousePos(e);
    const hit = findHit(pos.x, pos.y);
    if (hit && hit.type === 'component') {
      const newRef = prompt('Enter Component Reference Designator:', hit.item.ref);
      if (newRef !== null) hit.item.ref = newRef.trim() || hit.item.ref;

      const newVal = prompt('Enter Component Value / Specifications:', hit.item.val);
      if (newVal !== null) hit.item.val = newVal.trim() || hit.item.val;

      recordState();
    }
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedItem) {
        if (selectedItem.type === 'component') {
          components = components.filter(c => c !== selectedItem.item);
        } else if (selectedItem.type === 'wire') {
          wires = wires.filter(w => w !== selectedItem.item);
        }
        selectedItem = null;
        recordState();
        updateStatus('Deleted selection.');
      }
    } else if (e.key === 'r' || e.key === 'R') {
      rotateSelected();
    } else if (e.key === 'Escape') {
      currentWire = null;
      selectedItem = null;
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      undo();
    }
  }

  /** Find component or wire under cursor */
  function findHit(x, y) {
    // Check components
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < 30) return { type: 'component', item: c };
    }

    // Check wires
    for (let i = wires.length - 1; i >= 0; i--) {
      const w = wires[i];
      for (let j = 0; j < w.length - 1; j++) {
        if (distToSegment({ x, y }, w[j], w[j + 1]) < 8) {
          return { type: 'wire', item: w };
        }
      }
    }
    return null;
  }

  /** Find nearest pin of any component */
  function findNearestNode(x, y) {
    let nearest = null;
    let minDist = 16;
    components.forEach(c => {
      const pins = getAbsolutePins(c);
      pins.forEach(p => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      });
    });
    return nearest;
  }

  function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  /* ────────────────────────────────────────────────────────
   *  PUBLIC ACTIONS & CONTROLS
   * ──────────────────────────────────────────────────────── */
  function setTool(toolName) {
    activeTool = toolName;
    if (toolName !== 'wire') currentWire = null;

    // Update active toolbar button state
    document.querySelectorAll('.cad-tool-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === toolName);
    });

    updateStatus(`Active Tool: ${SYMBOLS[toolName]?.name || toolName.toUpperCase()}`);
  }

  function rotateSelected() {
    if (selectedItem && selectedItem.type === 'component') {
      selectedItem.item.rotation = ((selectedItem.item.rotation || 0) + 90) % 360;
      recordState();
      updateStatus(`Rotated ${selectedItem.item.ref} to ${selectedItem.item.rotation}°`);
    }
  }

  function clearCanvas() {
    if (confirm('Clear the entire circuit canvas?')) {
      components = [];
      wires = [];
      selectedItem = null;
      currentWire = null;
      recordState();
      updateStatus('Canvas cleared.');
    }
  }

  function toggleSignalFlow() {
    animateSignal = !animateSignal;
    const btn = document.getElementById('btn-cad-flow');
    if (btn) btn.classList.toggle('active', animateSignal);
    updateStatus(`Signal Flow Animation: ${animateSignal ? 'ON' : 'OFF'}`);
  }

  function exportImage() {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'am-radio-circuit-schematic.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    updateStatus('Schematic diagram exported as PNG.');
  }

  /* ────────────────────────────────────────────────────────
   *  UNDO / REDO
   * ──────────────────────────────────────────────────────── */
  function recordState() {
    history = history.slice(0, historyStep + 1);
    history.push(JSON.stringify({ components, wires }));
    if (history.length > 25) history.shift();
    historyStep = history.length - 1;
  }

  function undo() {
    if (historyStep > 0) {
      historyStep--;
      const state = JSON.parse(history[historyStep]);
      components = state.components;
      wires = state.wires;
      selectedItem = null;
      currentWire = null;
      updateStatus('Undo');
    }
  }

  function updateStatus(msg) {
    const el = document.getElementById('cad-status-msg');
    if (el) el.textContent = msg;
  }

  return {
    init,
    resize,
    setTool,
    rotateSelected,
    clearCanvas,
    toggleSignalFlow,
    exportImage,
    undo,
    loadMilestonePreset,
    inspectTP
  };
})();
