/* ──────────────────────────────────────────────
   data.js  –  ELEG 103 Medium-Wave Radio
   Project data store (Milestone 1 focus)
   ────────────────────────────────────────────── */

/* ---------- placeholder SVG helper ---------- */
function placeholder(w, h, text, c1 = '#0ea5e9', c2 = '#6366f1') {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" rx="8"/><text x="50%" y="50%" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,.85)" text-anchor="middle" dy="0.35em">${text}</text></svg>`)}`;
}

/* ═══════════════════════════════════════════════
   MILESTONES
   ═══════════════════════════════════════════════ */
const MILESTONES = [

  /* ────────── Milestone 1 — Tank Circuit & Detector ────────── */
  {
    id: 'milestone-1',
    number: 1,
    title: 'Tank Circuit & Detector',
    subtitle: 'LC Tank Circuit & Diode Envelope Detection',
    icon: 'rf-tank',
    accentColor: '#f59e0b',

    overview: {
      summary: 'Build and test the M1 front-end receiver stage: a signal generator drives a 5-turn test loop placed a few centimetres from the 75-turn hand-wound coil on a PVC form. The coil, together with a 20–280 pF variable capacitor, forms a parallel LC tank that selects the desired AM carrier. A 1N60P germanium diode rectifies the RF envelope, and a simple RC network (R₁ = 15 kΩ, C₂ = 3.3 nF) recovers the audio baseband signal at test point TP3.',
      objectives: [
        'Wind a 75-turn solenoid inductor on a PVC form using enamelled copper wire and measure its inductance',
        'Construct a 5-turn coupling/test loop driven by a signal generator to inject RF into the coil',
        'Implement a parallel LC tank with a 20–280 pF variable capacitor for frequency selection across the AM band',
        'Build a 1N60P germanium diode envelope detector and verify the demodulated output at TP3',
        'Compare predicted vs. measured resonant frequencies and evaluate selectivity of the tuned circuit'
      ]
    },

    schematic: {
      description: 'The signal generator feeds a 5-turn test loop positioned a few centimetres from the 75-turn main coil (M1). The coil is tuned by a 20–280 pF variable capacitor forming the LC tank. At TP1, the RF signal passes through a 1N60P germanium diode for envelope detection. The detector output is filtered by a 15 kΩ load resistor and 3.3 nF capacitor, delivering the recovered audio at TP3.',
      components: [
        { ref: 'GEN',        name: 'Signal Generator',       value: 'Sine / AM',     specs: 'Bench function generator, 50 Ω output',                    package: 'Bench' },
        { ref: 'Test Loop',  name: '5-Turn Coupling Loop',   value: '5 turns',        specs: 'Enamelled copper wire, loosely coupled to M1 coil',        package: 'Custom' },
        { ref: 'L₁ (M1)',    name: '75-Turn Solenoid Coil',  value: '~330 µH',        specs: 'Enamelled copper wire, 75 turns on PVC form',              package: 'Custom' },
        { ref: 'C₁',         name: 'Variable Tuning Capacitor', value: '20 – 280 pF', specs: 'Polyvaricon variable capacitor',                           package: 'Through-hole' },
        { ref: 'D₁',         name: 'Germanium Diode',        value: '1N60P',          specs: 'Vf ≈ 0.25 V, low-barrier point-contact',                   package: 'DO-35' },
        { ref: 'R₁',         name: 'Load Resistor',          value: '15 kΩ',          specs: '¼ W, 5 % tolerance, carbon film',                          package: 'Axial' },
        { ref: 'C₂',         name: 'Filter Capacitor',       value: '3.3 nF',         specs: 'Ceramic disc, 50 V',                                       package: 'Through-hole' },
        { ref: 'TP1',        name: 'Test Point 1',           value: '—',              specs: 'RF signal after tank, before diode',                        package: 'Wire' },
        { ref: 'TP3',        name: 'Test Point 3',           value: '—',              specs: 'Demodulated audio output',                                  package: 'Wire' }
      ]
    },

    formulas: [
      {
        title: 'LC Resonant Frequency',
        latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}',
        description: 'Determines which frequency the LC tank selects. With L₁ ≈ 330 µH and C₁ swept from 20–280 pF, the circuit tunes across the AM broadcast band.'
      },
      {
        title: "Wheeler's Inductance (Single-Layer Solenoid)",
        latex: 'L \\;(\\mu H) = \\frac{r^2 \\, N^2}{9r + 10\\ell}',
        description: 'Estimates the inductance of the 75-turn air-core solenoid wound on the PVC form. r = coil radius (inches), N = 75 turns, ℓ = winding length (inches).'
      },
      {
        title: 'Quality Factor',
        latex: 'Q = \\frac{f_0}{\\Delta f_{3\\text{dB}}} = \\frac{1}{R}\\sqrt{\\frac{L}{C}}',
        description: 'A higher Q provides better selectivity between adjacent AM stations, but narrows the audio bandwidth.'
      },
      {
        title: 'Detector Time-Constant Constraint',
        latex: '\\frac{1}{f_c} \\ll R_1 C_2 \\ll \\frac{1}{f_{m,\\max}}',
        description: 'The RC time constant (15 kΩ × 3.3 nF ≈ 49.5 µs) must be fast enough to follow the audio envelope but slow enough to reject the RF carrier.'
      }
    ],

    challenges: [
      {
        issue: 'Weak Mutual Coupling Between Test Loop and 75-Turn Tank Coil',
        description: 'When the 5-turn test loop was separated by more than 2–3 cm from the 75-turn resonant coil, or placed off-axis, the mutual inductance (M = k√(L₁L₂)) dropped sharply. The coupled RF magnetic flux into the tank was insufficient to produce an audible or measurable signal at TP1, collapsing the demodulated DC level at TP3 to near 0 mV.',
        solution: 'Positioned the test loop strictly coaxial with the central axis of the PVC pipe and maintained an optimal coupling distance of 2–3 cm. This stabilized the mutual coupling coefficient k, raising the induced RF carrier at TP1 above the 1N60P diode threshold and providing a stable ~42–260 mV DC output across the RC load.'
      }
    ],

    media: {
      videos: [
        { title: 'Milestone 1 Lab Demonstration Video', src: 'images/lab_demo_video.mp4', type: 'video' }
      ],
      images: [
        {
          title: 'Detector Circuit on Breadboard (Report Fig. 1)',
          alt: 'Resistor, capacitor and 1N60P diode assembled on breadboard with jumper wires',
          src: 'images/breadboard_detector.jpg'
        },
        {
          title: '75-Turn Coil & LC Tank Setup (Report Fig. 2)',
          alt: 'Hand-wound 75-turn coil on PVC form connected to the breadboard detector circuit',
          src: 'images/coil_and_breadboard.jpg'
        },
        {
          title: 'Full Hardware Breadboard Wiring (Report Fig. 3)',
          alt: 'Complete M1 detector circuit wired on breadboard with test leads',
          src: 'images/breadboard_wiring.jpg'
        },
        {
          title: 'Copper Coil Solenoid on PVC Form',
          alt: 'Close-up of 75 turns enamelled copper wire wound on PVC tube',
          src: 'images/copper_coil.jpg'
        },
        {
          title: 'Oscilloscope RF Waveform at TP1',
          alt: 'Scope trace showing tuned AM carrier signal at test point TP1',
          src: 'images/oscilloscope.jpg'
        },
        {
          title: 'Complete Lab Radio Workbench Assembly',
          alt: 'LC tuner and detector circuit assembled on breadboard with test instrumentation',
          src: 'images/radio_workbench.jpg'
        }
      ]
    }
  },

  /* ────────── Milestone 2 — Stub (CircuitDrawer preset only) ────────── */
  {
    id: 'milestone-2',
    number: 2,
    title: 'Audio Amplifier',
    subtitle: 'Transistor Audio Amplification Stage',
    icon: 'amp',
    accentColor: '#FF6B6B',
    overview:   { summary: '', objectives: [] },
    schematic:  { description: '', components: [] },
    formulas:   [],
    challenges: [],
    media:      { videos: [], images: [] }
  },

  /* ────────── Milestone 3 — Stub (CircuitDrawer preset only) ────────── */
  {
    id: 'milestone-3',
    number: 3,
    title: 'Power Supply',
    subtitle: 'Regulated DC Power Supply',
    icon: 'pwr',
    accentColor: '#4ECDC4',
    overview:   { summary: '', objectives: [] },
    schematic:  { description: '', components: [] },
    formulas:   [],
    challenges: [],
    media:      { videos: [], images: [] }
  },

  /* ────────── Milestone 4 — Stub (CircuitDrawer preset only) ────────── */
  {
    id: 'milestone-4',
    number: 4,
    title: 'Integration & Enclosure',
    subtitle: 'Final Assembly & Testing',
    icon: 'sys',
    accentColor: '#FFD93D',
    overview:   { summary: '', objectives: [] },
    schematic:  { description: '', components: [] },
    formulas:   [],
    challenges: [],
    media:      { videos: [], images: [] }
  }
];

/* ═══════════════════════════════════════════════
   Populate real images (Milestone 1 only)
   ═══════════════════════════════════════════════ */
(function populateImages() {
  const m1 = MILESTONES[0];
  if (!m1 || !m1.media || !m1.media.images) return;
  m1.media.images.forEach(img => {
    if (!img.src) {
      img.src = placeholder(480, 320, img.title);
    }
  });
})();
