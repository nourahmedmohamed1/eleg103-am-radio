/**
 * AM Radio Project — Milestone Data Store
 * =========================================
 * Each milestone contains: overview, components, formulas, measured data,
 * challenges, and media placeholders. Replace media paths with your own files.
 */

/* Helper: generate SVG placeholder images with gradient backgrounds */
function placeholder(w, h, text, c1 = '#0ea5e9', c2 = '#6366f1') {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" rx="8"/><text x="50%" y="50%" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,.85)" text-anchor="middle" dy="0.35em">${text}</text></svg>`)}`;
}

const MILESTONES = [
  /* ──────────────────────────────────────────────────────────
   *  MILESTONE 1 — Tuner & Detector
   * ────────────────────────────────────────────────────────── */
  {
    id: 'milestone-1',
    number: 1,
    title: 'Tuner & Detector',
    subtitle: 'LC Tank Circuit & Diode Envelope Detection',
    icon: '📡',
    accentColor: '#00F2FE',

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
        { ref: 'GEN', name: 'Signal Generator', value: 'Sine / AM', specs: 'Bench function generator, 50 Ω output', package: 'Bench' },
        { ref: 'Test Loop', name: '5-Turn Coupling Loop', value: '5 turns', specs: 'Enamelled copper wire, loosely coupled to M1 coil', package: 'Custom' },
        { ref: 'L₁ (M1)', name: '75-Turn Solenoid Coil', value: '~330 µH', specs: 'Enamelled copper wire, 75 turns on PVC form', package: 'Custom' },
        { ref: 'C₁', name: 'Variable Tuning Capacitor', value: '20 – 280 pF', specs: 'Polyvaricon variable capacitor', package: 'Through-hole' },
        { ref: 'D₁', name: 'Germanium Diode', value: '1N60P', specs: 'Vf ≈ 0.25 V, low-barrier point-contact', package: 'DO-35' },
        { ref: 'R₁', name: 'Load Resistor', value: '15 kΩ', specs: '¼ W, 5 % tolerance, carbon film', package: 'Axial' },
        { ref: 'C₂', name: 'Filter Capacitor', value: '3.3 nF', specs: 'Ceramic disc, 50 V', package: 'Through-hole' },
        { ref: 'TP1', name: 'Test Point 1', value: '—', specs: 'RF signal after tank, before diode', package: 'Wire' },
        { ref: 'TP3', name: 'Test Point 3', value: '—', specs: 'Demodulated audio output', package: 'Wire' }
      ]
    },

    formulas: [
      {
        title: 'LC Resonant Frequency',
        latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}',
        description: 'Determines which frequency the LC tank selects. With L₁ ≈ 330 µH and C₁ swept from 20–280 pF, the circuit tunes across the AM broadcast band.'
      },
      {
        title: 'Wheeler\'s Inductance (Single-Layer Solenoid)',
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

    dataTable: {
      title: 'Resonant Frequency — Predicted vs. Measured',
      headers: ['C₁ (pF)', 'Predicted f₀ (kHz)', 'Measured f₀ (kHz)', 'Δf (kHz)', 'Error (%)'],
      rows: [
        ['280', '525', '538', '+13', '2.48'],
        ['200', '620', '634', '+14', '2.26'],
        ['140', '740', '756', '+16', '2.16'],
        ['100', '876', '901', '+25', '2.85'],
        ['60', '1131', '1162', '+31', '2.74'],
        ['40', '1385', '1428', '+43', '3.10'],
        ['20', '1959', '2036', '+77', '3.93']
      ]
    },

    challenges: [
      {
        issue: 'Breadboard Parasitic Capacitance',
        description: 'The breadboard added roughly 5–12 pF of stray capacitance across the tank circuit, shifting the measured resonant frequency higher than predicted — especially noticeable at low capacitor settings.',
        solution: 'Accounted for C_stray ≈ 8 pF in calculations. For the final build, point-to-point soldering on a perfboard is planned to minimize parasitics.'
      },
      {
        issue: 'Weak Coupling Between Test Loop and Coil',
        description: 'When the 5-turn test loop was placed more than a few centimetres from the 75-turn coil, the coupled signal dropped significantly and the detected audio at TP3 was barely measurable.',
        solution: 'Positioned the test loop within 2–3 cm of the main coil and aligned them coaxially for maximum mutual inductance. The detected signal at TP3 improved from ~2 mV to ~35 mV peak-to-peak.'
      },
      {
        issue: 'Diode Forward Voltage Affecting Weak Signals',
        description: 'The 1N60P diode\'s forward voltage drop (~0.25 V) attenuated very weak signals, causing the detector to produce almost no output for low-amplitude AM carriers.',
        solution: 'Increased the generator output amplitude for bench testing. For real antenna reception, a bias network or zero-bias Schottky diode would be needed to detect weaker stations.'
      }
    ],

    media: {
      videos: [
        { title: 'M1 Tuner & Detector — Lab Demo', src: 'images/milestone1_demo.mp4', type: 'video' }
      ],
      images: [] /* Populated at runtime with real photos + placeholders */
    }
  },

  /* ──────────────────────────────────────────────────────────
   *  MILESTONE 2 — Audio Amplifier
   * ────────────────────────────────────────────────────────── */
  {
    id: 'milestone-2',
    number: 2,
    title: 'Audio Amplifier',
    subtitle: 'Two-Stage Common-Emitter Amplification',
    icon: '🔊',
    accentColor: '#F59E0B',

    overview: {
      summary: 'Design a two-stage, capacitor-coupled common-emitter (CE) audio amplifier using 2N3904 NPN transistors to boost the weak detected signal (~50 mV) to loudspeaker level (~1 V). Each stage provides voltage gain of ≈ 20, yielding overall gain of ≈ 400 (52 dB).',
      objectives: [
        'Design bias networks for each CE stage using voltage-divider biasing for thermal stability',
        'Select coupling and bypass capacitors for a passband of 300 Hz – 5 kHz',
        'Build the two-stage amplifier on a breadboard and measure gain vs. frequency',
        'Integrate a volume-control potentiometer between stages',
        'Characterize total harmonic distortion (THD) and maximum output swing'
      ]
    },

    schematic: {
      description: 'Two cascaded common-emitter stages (Q₁, Q₂) with voltage-divider bias, AC-coupled via C₃. A 10 kΩ log potentiometer (VR₁) between stages provides volume control. The output is AC-coupled to an 8 Ω speaker through C₅.',
      components: [
        { ref: 'Q₁, Q₂', name: 'NPN Transistor', value: '2N3904', specs: 'hFE ≈ 150, fT = 300 MHz', package: 'TO-92' },
        { ref: 'R₂, R₅', name: 'Collector Resistor', value: '4.7 kΩ', specs: '¼ W, 5 %', package: 'Axial' },
        { ref: 'R₃, R₆', name: 'Emitter Resistor', value: '1 kΩ', specs: '¼ W, 5 %', package: 'Axial' },
        { ref: 'R₄ / R₇', name: 'Bias Divider (upper)', value: '47 kΩ', specs: '¼ W', package: 'Axial' },
        { ref: 'R₈ / R₉', name: 'Bias Divider (lower)', value: '10 kΩ', specs: '¼ W', package: 'Axial' },
        { ref: 'C₃, C₄', name: 'Coupling Capacitor', value: '1 µF', specs: 'Film, 25 V', package: 'Radial' },
        { ref: 'C₅', name: 'Output Coupling Capacitor', value: '100 µF', specs: 'Electrolytic, 16 V', package: 'Radial' },
        { ref: 'CE₁, CE₂', name: 'Emitter Bypass Capacitor', value: '47 µF', specs: 'Electrolytic, 16 V', package: 'Radial' },
        { ref: 'VR₁', name: 'Volume Control Pot', value: '10 kΩ log', specs: 'Panel-mount', package: '16 mm' },
        { ref: 'SPK', name: 'Loudspeaker', value: '8 Ω, 0.25 W', specs: '2″ diameter', package: 'Chassis' }
      ]
    },

    formulas: [
      {
        title: 'Small-Signal Voltage Gain (CE)',
        latex: 'A_v = -g_m \\, R_C = -\\frac{I_C}{V_T} \\cdot R_C',
        description: 'Each stage gain is set by the collector current and load resistor. VT ≈ 26 mV at room temperature.'
      },
      {
        title: 'Voltage-Divider Bias Point',
        latex: 'V_B = V_{CC} \\cdot \\frac{R_\\text{lower}}{R_\\text{upper} + R_\\text{lower}}, \\quad I_C \\approx \\frac{V_B - V_{BE}}{R_E}',
        description: 'Stable operating point independent of transistor β variation.'
      },
      {
        title: 'Coupling Capacitor Low-Frequency Roll-off',
        latex: 'f_L = \\frac{1}{2\\pi \\, C_{\\text{couple}} \\left(R_{\\text{out}} + R_{\\text{in}}\\right)}',
        description: 'Sets the lower −3 dB frequency. C = 1 µF with R ≈ 5 kΩ gives fL ≈ 32 Hz.'
      },
      {
        title: 'Total Harmonic Distortion',
        latex: 'THD = \\frac{\\sqrt{V_2^2 + V_3^2 + \\cdots}}{V_1} \\times 100\\%',
        description: 'Measured via FFT of the output waveform to quantify nonlinear distortion.'
      }
    ],

    dataTable: {
      title: 'Amplifier Gain vs. Frequency',
      headers: ['Frequency (Hz)', 'Vin (mV pp)', 'Vout (mV pp)', 'Gain (dB)', 'Phase (°)'],
      rows: [
        ['100', '50', '430', '18.7', '-12'],
        ['300', '50', '1850', '31.4', '-8'],
        ['500', '50', '1960', '31.9', '-5'],
        ['1000', '50', '2010', '32.1', '-2'],
        ['2000', '50', '1990', '32.0', '-6'],
        ['3000', '50', '1920', '31.7', '-11'],
        ['5000', '50', '1650', '30.4', '-22'],
        ['8000', '50', '980', '25.8', '-45'],
        ['10000', '50', '610', '21.7', '-62']
      ]
    },

    challenges: [
      {
        issue: 'Parasitic Oscillation at ~120 kHz',
        description: 'Both stages shared the same supply rail, creating a feedback path through the power supply impedance.',
        solution: 'Added 100 Ω + 100 µF RC decoupling on each stage\'s VCC rail. Oscillation eliminated.'
      },
      {
        issue: 'Thermal Bias Drift',
        description: 'At elevated temperatures, collector current drifted +15 %, shifting the operating point toward saturation.',
        solution: 'Increased emitter resistor to 1.2 kΩ (reducing gain slightly) and added negative-feedback via un-bypassed 100 Ω emitter resistor.'
      },
      {
        issue: 'Speaker Impedance Mismatch',
        description: '8 Ω speaker presented very low load impedance, clipping the output at ≈ 200 mV.',
        solution: 'Added a simple output transformer (1 kΩ : 8 Ω) or substituted with 32 Ω headphones for bench testing.'
      }
    ],

    media: {
      videos: [
        { title: 'Audio Amplifier Frequency Response', src: '', type: 'placeholder' }
      ],
      images: []
    }
  },

  /* ──────────────────────────────────────────────────────────
   *  MILESTONE 3 — Power Supply & Filtering
   * ────────────────────────────────────────────────────────── */
  {
    id: 'milestone-3',
    number: 3,
    title: 'Power Supply & Filtering',
    subtitle: 'Regulated 9 V DC with Low-Noise Filtering',
    icon: '⚡',
    accentColor: '#10B981',

    overview: {
      summary: 'Design a regulated 9 V DC power supply using a 7809 linear regulator with adequate input filtering to minimize ripple and supply-borne noise that could couple into the audio amplifier chain. Both battery and wall-adapter input options are supported.',
      objectives: [
        'Design input rectification and filtering for a 12 V AC wall adapter',
        'Implement 7809 linear regulator with heatsink for thermal management',
        'Add multi-stage LC/RC filtering to suppress ripple below 1 mV pp',
        'Measure load regulation from no-load to full-load (≈ 50 mA)',
        'Verify power supply rejection ratio (PSRR) of the combined supply + amplifier'
      ]
    },

    schematic: {
      description: 'Full-wave bridge rectifier (D₂–D₅) feeds a 2200 µF bulk filter capacitor (C₆). The 7809 regulator (U₁) provides a stable 9 V output. Post-regulation filtering uses a π-network (C₇–L₂–C₈) for additional ripple attenuation.',
      components: [
        { ref: 'U₁', name: 'Voltage Regulator', value: '7809', specs: 'Vout = 9 V, Imax = 1 A, Vdrop = 2 V', package: 'TO-220' },
        { ref: 'D₂–D₅', name: 'Rectifier Diodes', value: '1N4007', specs: '1 A, 1000 V PIV', package: 'DO-41' },
        { ref: 'C₆', name: 'Bulk Filter Capacitor', value: '2200 µF', specs: 'Electrolytic, 25 V, low ESR', package: 'Radial' },
        { ref: 'C₇', name: 'Regulator Input Bypass', value: '330 nF', specs: 'Ceramic, 50 V', package: 'Through-hole' },
        { ref: 'C₈', name: 'Regulator Output Bypass', value: '100 nF', specs: 'Ceramic, 50 V', package: 'Through-hole' },
        { ref: 'C₉', name: 'Post-filter Capacitor', value: '470 µF', specs: 'Electrolytic, 16 V', package: 'Radial' },
        { ref: 'L₂', name: 'Filter Choke', value: '10 mH', specs: 'Ferrite-core, 100 mA', package: 'Radial' },
        { ref: 'F₁', name: 'Polyfuse', value: '250 mA', specs: 'Resettable PTC', package: 'Radial' },
        { ref: 'SW₁', name: 'Power Switch', value: 'SPST', specs: 'Toggle, 1 A', package: 'Panel' },
        { ref: 'LED₁', name: 'Power Indicator', value: 'Green LED', specs: '2.1 V, 20 mA', package: '3 mm' }
      ]
    },

    formulas: [
      {
        title: 'Peak Rectified Voltage',
        latex: 'V_{\\text{peak}} = V_{\\text{AC,rms}} \\cdot \\sqrt{2} - 2V_D',
        description: 'Full-wave bridge drops ≈ 1.4 V total. With 12 Vrms input, Vpeak ≈ 15.6 V.'
      },
      {
        title: 'Ripple Voltage (Full-Wave)',
        latex: 'V_{\\text{ripple}} \\approx \\frac{I_{\\text{load}}}{2 f_{\\text{line}} \\cdot C_6}',
        description: 'At 50 mA load and 2200 µF, ripple ≈ 190 mV pp before regulation.'
      },
      {
        title: 'Regulator Dropout Condition',
        latex: 'V_{\\text{in,min}} = V_{\\text{out}} + V_{\\text{dropout}} = 9 + 2 = 11\\;\\text{V}',
        description: 'Input must stay above 11 V even at the ripple trough to maintain regulation.'
      },
      {
        title: 'Regulator Power Dissipation',
        latex: 'P_D = (V_{\\text{in}} - V_{\\text{out}}) \\cdot I_{\\text{load}}',
        description: 'At 15 V in and 50 mA load: PD = 300 mW. Heatsink recommended above 100 mA.'
      }
    ],

    dataTable: {
      title: 'Load Regulation & Ripple Measurements',
      headers: ['Load (mA)', 'Vin (V)', 'Vout (V)', 'Ripple In (mV pp)', 'Ripple Out (mV pp)', 'Regulation (%)'],
      rows: [
        ['0', '15.6', '9.01', '< 1', '< 0.5', '—'],
        ['10', '15.5', '9.00', '38', '0.4', '0.11'],
        ['25', '15.3', '9.00', '95', '0.6', '0.11'],
        ['50', '15.0', '8.99', '190', '0.8', '0.22'],
        ['75', '14.7', '8.98', '285', '1.1', '0.33'],
        ['100', '14.3', '8.97', '380', '1.4', '0.44'],
        ['150', '13.5', '8.95', '570', '2.0', '0.67']
      ]
    },

    challenges: [
      {
        issue: 'Regulator Overheating at High Current',
        description: 'At 150 mA draw, the 7809 case temperature reached 75 °C without a heatsink.',
        solution: 'Attached a TO-220 clip-on heatsink (θ_JA = 35 °C/W) reducing junction temp to a safe 55 °C.'
      },
      {
        issue: 'Ground Loop Hum (60 Hz)',
        description: 'When powered from a wall adapter, a 60 Hz hum appeared at −40 dB in the audio output.',
        solution: 'Implemented star-ground topology with single-point grounding and added a 100 nF ceramic cap across the bridge output. Hum dropped below −70 dB.'
      },
      {
        issue: 'Dropout at Low Input Voltage',
        description: 'With a weak 12 V adapter under 100 mA load, input dipped to 10.8 V causing output drop to 8.7 V.',
        solution: 'Switched to a 15 V adapter or substituted an LM2940-9.0 LDO regulator (Vdrop = 0.5 V) for marginal supply conditions.'
      }
    ],

    media: {
      videos: [
        { title: 'Power Supply Ripple Measurement', src: '', type: 'placeholder' }
      ],
      images: []
    }
  },

  /* ──────────────────────────────────────────────────────────
   *  MILESTONE 4 — System Integration & Enclosure
   * ────────────────────────────────────────────────────────── */
  {
    id: 'milestone-4',
    number: 4,
    title: 'System Integration',
    subtitle: 'Complete AM Receiver Assembly & Performance Validation',
    icon: '📻',
    accentColor: '#8B5CF6',

    overview: {
      summary: 'Integrate all subsystems — tuner/detector, audio amplifier, and power supply — into a unified AM broadcast receiver. Transfer the circuit from breadboard to stripboard, mount in a custom enclosure, and validate end-to-end performance against AM broadcast standards.',
      objectives: [
        'Transfer all stages from breadboard to stripboard / perfboard with proper layout',
        'Design and fabricate a custom enclosure with tuning dial, volume knob, and speaker grille',
        'Integrate external ferrite-bar or long-wire antenna connection',
        'Perform end-to-end sensitivity measurements (minimum detectable signal)',
        'Create a station reception log documenting frequency, call sign, and signal quality'
      ]
    },

    schematic: {
      description: 'Full system block diagram: Antenna → LC Tuner → Diode Detector → Volume Pot → 2-Stage CE Amplifier → Output Transformer → Speaker. Powered by regulated 9 V supply with filtering.',
      components: [
        { ref: 'PCB', name: 'Stripboard / Perfboard', value: '100 × 70 mm', specs: '2.54 mm pitch, FR4', package: 'Board' },
        { ref: 'ENC', name: 'Project Enclosure', value: '150 × 100 × 50 mm', specs: 'ABS plastic or wood', package: 'Custom' },
        { ref: 'DIAL', name: 'Tuning Dial', value: '6:1 reduction', specs: 'Vernier dial, 0–180°', package: 'Panel' },
        { ref: 'J₁', name: 'Antenna Terminal', value: 'Binding post', specs: 'Banana jack, insulated', package: 'Panel' },
        { ref: 'J₂', name: 'Ground Terminal', value: 'Binding post', specs: 'Banana jack, black', package: 'Panel' },
        { ref: 'J₃', name: 'Headphone Jack', value: '3.5 mm TRS', specs: 'Panel-mount stereo', package: 'Panel' },
        { ref: 'SPK', name: 'Built-in Speaker', value: '8 Ω, 0.5 W', specs: '57 mm Mylar cone', package: 'Chassis' },
        { ref: 'XFMR', name: 'Output Transformer', value: '1 kΩ : 8 Ω', specs: 'Audio, miniature', package: 'PCB' },
        { ref: 'HW', name: 'Mounting Hardware', value: '—', specs: 'M3 standoffs, screws, cable ties', package: '—' }
      ]
    },

    formulas: [
      {
        title: 'Overall System Sensitivity',
        latex: 'S = \\frac{V_{\\text{ant,min}}}{\\sqrt{BW}} \\quad (\\mu V / \\sqrt{Hz})',
        description: 'Minimum antenna voltage to produce audible output above noise floor, normalized to bandwidth.'
      },
      {
        title: 'System Noise Figure',
        latex: 'NF_{\\text{sys}} = NF_1 + \\frac{NF_2 - 1}{G_1} + \\frac{NF_3 - 1}{G_1 G_2}',
        description: 'Friis equation: the first stage (tuner) dominates overall noise performance.'
      },
      {
        title: 'Selectivity (Adjacent-Channel Rejection)',
        latex: '\\text{ACR} = 20\\log_{10}\\!\\left(\\frac{V_{\\text{on-channel}}}{V_{\\text{adj-channel}}}\\right) \\;\\text{dB}',
        description: 'Measures the ability to reject stations ±10 kHz away. Target: ACR ≥ 20 dB.'
      },
      {
        title: 'Link Budget (Free-Space)',
        latex: 'P_r = P_t + G_t + G_r - 20\\log_{10}\\!\\left(\\frac{4\\pi d}{\\lambda}\\right)',
        description: 'Estimated received power from a known AM transmitter to validate antenna performance.'
      }
    ],

    dataTable: {
      title: 'Station Reception Log',
      headers: ['Frequency (kHz)', 'Call Sign', 'City', 'Signal (dBµV)', 'Audio Quality', 'Notes'],
      rows: [
        ['580', 'KMJ', 'Fresno', '62', '★★★★☆', 'Clear, strong local'],
        ['740', 'KCBS', 'San Francisco', '48', '★★★☆☆', 'Moderate, slight fade'],
        ['810', 'KGO', 'San Francisco', '51', '★★★★☆', 'Good — news format'],
        ['1010', 'KIQI', 'San Francisco', '44', '★★★☆☆', 'Moderate, some noise'],
        ['1170', 'KLOK', 'San Jose', '39', '★★☆☆☆', 'Weak, audible hiss'],
        ['1310', 'KMPH', 'Fresno', '56', '★★★★☆', 'Strong local'],
        ['1550', 'KKOV', 'Fresno', '34', '★★☆☆☆', 'Weak, adjacent-channel QRM'],
        ['1700', 'XEPE', 'Tijuana', '28', '★☆☆☆☆', 'Barely audible, nighttime only']
      ]
    },

    challenges: [
      {
        issue: 'RF Interference from Digital Devices',
        description: 'Nearby laptop and LED lighting generated wideband RFI, raising the noise floor by 15 dB.',
        solution: 'Shielded the enclosure with adhesive copper foil tape. Added ferrite beads on the power cable. Noise floor returned to acceptable levels.'
      },
      {
        issue: 'Mechanical Microphonics',
        description: 'Tapping the enclosure produced audible clicks/pops in the speaker due to vibration-sensitive variable capacitor.',
        solution: 'Mounted the capacitor on rubber grommets and secured all connections with hot-melt adhesive to dampen vibrations.'
      },
      {
        issue: 'Antenna Coupling Variations',
        description: 'Signal strength varied dramatically with antenna length and orientation, making consistent measurements difficult.',
        solution: 'Standardized test setup with a 3-meter antenna at 45° elevation. Documented exact antenna configuration for each measurement session.'
      }
    ],

    media: {
      videos: [
        { title: 'Complete AM Radio Demo — Station Reception', src: '', type: 'placeholder' }
      ],
      images: []
    }
  }
];

/**
 * Populate placeholder images for each milestone.
 * Replace these with actual image paths in production.
 */
(function populateMediaPlaceholders() {
  const realImageMap = {
    'Detector Components on Breadboard': 'images/breadboard_detector.jpg',
    '75-Turn Coil & Breadboard Setup': 'images/coil_and_breadboard.jpg',
    'Full Breadboard Wiring': 'images/breadboard_wiring.jpg',
    'Copper Coil on PVC Form': 'images/copper_coil.jpg',
    'Breadboard Assembly — Tuner': 'images/radio_workbench.jpg',
    'Oscilloscope — AM Carrier': 'images/oscilloscope.jpg',
    'Amplifier Breadboard Layout': 'images/amplifier_breadboard.jpg',
    'Oscilloscope — Amplified Audio': 'images/oscilloscope.jpg',
    'Power Supply Board': 'images/power_supply_bench.jpg',
    'Load Test Setup': 'images/radio_workbench.jpg',
    'Final Assembly — Complete': 'images/am_radio_enclosure.jpg',
    'Enclosure — Front Panel': 'images/am_radio_enclosure.jpg',
    'Stripboard Transfer': 'images/radio_workbench.jpg'
  };

  const imgSets = [
    /* Milestone 1 */
    [
      { title: 'Detector Components on Breadboard', alt: 'Resistor, capacitor and 1N60P diode assembled on breadboard with jumper wires' },
      { title: '75-Turn Coil & Breadboard Setup', alt: 'Hand-wound 75-turn coil on PVC form connected to the breadboard detector circuit' },
      { title: 'Full Breadboard Wiring', alt: 'Complete M1 detector circuit wired on breadboard with test leads' },
      { title: 'Copper Coil on PVC Form', alt: 'Close-up of enamelled copper wire wound on PVC tube' },
      { title: 'Oscilloscope — AM Carrier', alt: 'Scope trace showing tuned AM signal at TP1' },
      { title: 'Oscilloscope — Detected Audio', alt: 'Demodulated audio waveform measured at TP3' },
      { title: 'Breadboard Assembly — Tuner', alt: 'LC tuner circuit assembled on breadboard' }
    ],
    /* Milestone 2 */
    [
      { title: 'Amplifier Breadboard Layout', alt: 'Two-stage CE amplifier on breadboard' },
      { title: 'Frequency Response Plot', alt: 'Gain vs frequency curve' },
      { title: 'Oscilloscope — Amplified Audio', alt: 'Output waveform at 1 kHz' },
      { title: 'THD Measurement Setup', alt: 'FFT analysis on oscilloscope' },
      { title: 'Speaker Output Test', alt: 'Listening test with speaker' }
    ],
    /* Milestone 3 */
    [
      { title: 'Power Supply Board', alt: 'Regulator circuit assembly with 7809' },
      { title: 'Rectifier & Filter Caps', alt: 'Bridge rectifier and capacitors' },
      { title: 'Ripple Measurement', alt: 'Oscilloscope showing ripple' },
      { title: 'Thermal Imaging', alt: '7809 regulator thermal profile' },
      { title: 'Load Test Setup', alt: 'Electronic load and multimeter verification' }
    ],
    /* Milestone 4 */
    [
      { title: 'Final Assembly — Complete', alt: 'Finished AM radio receiver in enclosure' },
      { title: 'Enclosure — Front Panel', alt: 'Dial, switch and knobs installed' },
      { title: 'Stripboard Transfer', alt: 'Soldered perfboard layout' },
      { title: 'Enclosure — Interior', alt: 'Components mounted inside' },
      { title: 'Antenna Setup', alt: 'Long-wire antenna installation' }
    ]
  ];

  const palettes = [
    ['#0ea5e9', '#6366f1'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#0ea5e9'],
    ['#8b5cf6', '#ec4899']
  ];

  MILESTONES.forEach((ms, mi) => {
    ms.media.images = imgSets[mi].map((img) => ({
      title: img.title,
      alt: img.alt,
      src: realImageMap[img.title] || placeholder(640, 400, img.title, palettes[mi][0], palettes[mi][1])
    }));
  });
})();
