/**
 * AM Radio Project — Three.js 3D Scene Manager
 * ==============================================
 * Creates interactive 3D models for each milestone using procedural geometry.
 * Depends on THREE (global) from CDN and MILESTONES from data.js.
 */

/* global THREE, MILESTONES */

const SceneManager = (function () {
  'use strict';

  let renderer, scene, camera, controls;
  let container, canvas;
  let animId = null;
  let pins = [];                // interactive pin markers
  let hoverPin = null;
  let tooltipEl;
  let raycaster, mouse;
  let sceneGroup;               // holds milestone-specific objects
  let clock;

  /* ── Initialise ── */
  function init() {
    container = document.getElementById('three-container').querySelector('.card-body');
    canvas    = document.getElementById('three-canvas');
    tooltipEl = document.getElementById('pin-tooltip');

    const w = container.clientWidth  || 600;
    const h = container.clientHeight || 400;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(5, 3.5, 6);

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.target.set(0, 0.5, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0x8899bb, 0.6);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 8, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);

    const point = new THREE.PointLight(0x00f2fe, 0.6, 20);
    point.position.set(-3, 4, -2);
    scene.add(point);

    const hemi = new THREE.HemisphereLight(0x0a192f, 0x1e293b, 0.4);
    scene.add(hemi);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(20, 40, 0x1e293b, 0x1e293b);
    grid.material.transparent = true;
    grid.material.opacity = 0.4;
    scene.add(grid);

    // Raycaster for pin hover
    raycaster = new THREE.Raycaster();
    mouse     = new THREE.Vector2();
    canvas.addEventListener('mousemove', onMouseMove, false);

    // Resize
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    // Scene group
    sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    clock = new THREE.Clock();

    // Start render loop
    animate();
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Slow rotate the scene group
    if (sceneGroup) {
      sceneGroup.rotation.y += 0.002;
    }

    // Animate pins (pulse glow)
    pins.forEach(p => {
      const s = 1 + 0.15 * Math.sin(t * 3 + p.phase);
      p.mesh.scale.set(s, s, s);
    });

    controls.update();
    renderer.render(scene, camera);
    updatePinTooltip();
  }

  /* ── Pin Tooltip ── */
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  }

  function updatePinTooltip() {
    if (pins.length === 0) return;
    raycaster.setFromCamera(mouse, camera);
    const meshes = pins.map(p => p.mesh);
    const hits = raycaster.intersectObjects(meshes, false);

    if (hits.length > 0) {
      const pin = pins.find(p => p.mesh === hits[0].object);
      if (pin && pin !== hoverPin) {
        hoverPin = pin;
        tooltipEl.textContent = pin.label;
        tooltipEl.classList.add('visible');
      }
      // Position tooltip near the pin's screen projection
      if (hoverPin) {
        const v = hoverPin.mesh.position.clone().project(camera);
        const rect = canvas.getBoundingClientRect();
        const x = (v.x *  0.5 + 0.5) * rect.width;
        const y = (v.y * -0.5 + 0.5) * rect.height;
        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top  = (y - 36) + 'px';
      }
    } else {
      if (hoverPin) {
        hoverPin = null;
        tooltipEl.classList.remove('visible');
      }
    }
  }

  /* ── Add interactive pin ── */
  function addPin(x, y, z, label) {
    const geo = new THREE.SphereGeometry(0.1, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.4
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sceneGroup.add(mesh);

    // Outer glow ring
    const ringGeo = new THREE.TorusGeometry(0.16, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(mesh.position);
    ring.rotation.x = Math.PI / 2;
    sceneGroup.add(ring);

    pins.push({ mesh, label, phase: Math.random() * Math.PI * 2 });
  }

  /* ── Clear milestone objects ── */
  function clearScene() {
    pins = [];
    hoverPin = null;
    while (sceneGroup.children.length > 0) {
      const obj = sceneGroup.children[0];
      sceneGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    sceneGroup.rotation.y = 0;
  }

  /* ─────────────────────────────────────────────
   *  MILESTONE MODEL BUILDERS
   * ───────────────────────────────────────────── */

  /** Shared material palette */
  const MAT = {
    copper:   () => new THREE.MeshStandardMaterial({ color: 0xB87333, metalness: 0.85, roughness: 0.2 }),
    pvc:      () => new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0, transparent: true, opacity: 0.55 }),
    pcb:      () => new THREE.MeshStandardMaterial({ color: 0x1a5c2e, roughness: 0.7, metalness: 0.1 }),
    metal:    () => new THREE.MeshStandardMaterial({ color: 0xaab0b8, metalness: 0.9, roughness: 0.3 }),
    black:    () => new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 }),
    red:      () => new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.6 }),
    blue:     () => new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 }),
    amber:    () => new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.3, roughness: 0.5 }),
    breadboard: () => new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 }),
    ceramic:  () => new THREE.MeshStandardMaterial({ color: 0xc4a35a, roughness: 0.5 }),
    silicon:  () => new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.4, metalness: 0.2 }),
  };

  /** Helper: create an analytical helix (solenoid coil) */
  function createHelix(radius, height, turns, wireRadius, mat) {
    class HelixCurve extends THREE.Curve {
      getPoint(t, optionalTarget) {
        const point = optionalTarget || new THREE.Vector3();
        const angle = 2 * Math.PI * turns * t;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = (t - 0.5) * height;
        return point.set(x, y, z);
      }
    }

    const curve = new HelixCurve();
    const tubularSegments = Math.min(turns * 20, 360);
    const geo = new THREE.TubeGeometry(curve, tubularSegments, wireRadius, 8, false);
    return new THREE.Mesh(geo, mat);
  }

  /** Helper: create a resistor */
  function createResistor(x, y, z, rotation) {
    const g = new THREE.Group();
    // body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12),
      MAT.ceramic()
    );
    body.rotation.z = Math.PI / 2;
    g.add(body);
    // leads
    const leadGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6);
    const leadMat = MAT.metal();
    const l1 = new THREE.Mesh(leadGeo, leadMat);
    l1.position.x = -0.25;
    l1.rotation.z = Math.PI / 2;
    g.add(l1);
    const l2 = new THREE.Mesh(leadGeo, leadMat);
    l2.position.x = 0.25;
    l2.rotation.z = Math.PI / 2;
    g.add(l2);
    // color bands
    const bandColors = [0xcc3333, 0x9933cc, 0x333333];
    bandColors.forEach((c, i) => {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.062, 0.01, 6, 16),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })
      );
      band.position.x = -0.08 + i * 0.08;
      band.rotation.y = Math.PI / 2;
      g.add(band);
    });
    g.position.set(x, y, z);
    if (rotation) g.rotation.y = rotation;
    return g;
  }

  /** Helper: create a capacitor (electrolytic) */
  function createCapacitor(x, y, z, h, r, color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 16),
      new THREE.MeshStandardMaterial({ color: color || 0x1a3a5c, roughness: 0.5, metalness: 0.2 })
    );
    body.position.y = h / 2;
    g.add(body);
    // top marking
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.02, 16),
      MAT.metal()
    );
    top.position.y = h;
    g.add(top);
    // leads
    const leadGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.15, 6);
    const l1 = new THREE.Mesh(leadGeo, MAT.metal());
    l1.position.set(r * 0.3, -0.075, 0);
    g.add(l1);
    const l2 = new THREE.Mesh(leadGeo, MAT.metal());
    l2.position.set(-r * 0.3, -0.075, 0);
    g.add(l2);
    g.position.set(x, y, z);
    return g;
  }

  /* ── Milestone 1: Tuner & Detector ── */
  function buildMilestone1() {
    // PVC Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.55, 0.55, 3.2, 32, 1, true);
    const pipe = new THREE.Mesh(pipeGeo, MAT.pvc());
    pipe.position.y = 1.0;
    pipe.castShadow = true;
    sceneGroup.add(pipe);
    addPin(0, 2.8, 0, 'PVC Form — 1.5″ Diameter');

    // End caps
    const capGeo = new THREE.CircleGeometry(0.55, 32);
    const capMat = MAT.pvc();
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = 2.6;
    topCap.rotation.x = -Math.PI / 2;
    sceneGroup.add(topCap);

    // Copper coil
    const coil = createHelix(0.6, 2.4, 35, 0.025, MAT.copper());
    coil.position.y = 1.0;
    coil.castShadow = true;
    sceneGroup.add(coil);
    addPin(0.65, 1.8, 0, 'L₁ — 70 Turns, 28 AWG (~250 µH)');

    // Variable Capacitor (simplified)
    const capGroup = new THREE.Group();
    capGroup.position.set(2.2, 0.5, 0);
    // Base plate
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.6),
      MAT.metal()
    );
    capGroup.add(basePlate);
    // Stator plates
    for (let i = 0; i < 5; i++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.01, 0.4),
        MAT.metal()
      );
      plate.position.y = 0.1 + i * 0.08;
      capGroup.add(plate);
    }
    // Rotor plates
    for (let i = 0; i < 4; i++) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.01, 0.35),
        MAT.copper()
      );
      plate.position.y = 0.14 + i * 0.08;
      plate.position.x = 0.02;
      capGroup.add(plate);
    }
    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8),
      MAT.metal()
    );
    shaft.position.y = 0.35;
    capGroup.add(shaft);
    // Knob
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 0.1, 16),
      MAT.black()
    );
    knob.position.y = 0.7;
    capGroup.add(knob);

    sceneGroup.add(capGroup);
    addPin(2.2, 0.9, 0, 'C₁ — Variable 10–365 pF');

    // Diode (1N34A)
    const diodeGroup = new THREE.Group();
    diodeGroup.position.set(-1.8, 0.3, 1.0);
    const diodeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.5 })
    );
    diodeBody.rotation.z = Math.PI / 2;
    diodeGroup.add(diodeBody);
    // Cathode band
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.008, 6, 16),
      MAT.black()
    );
    band.position.x = 0.08;
    band.rotation.y = Math.PI / 2;
    diodeGroup.add(band);
    // Leads
    const dLeadGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6);
    const dLead1 = new THREE.Mesh(dLeadGeo, MAT.metal());
    dLead1.position.x = -0.22;
    dLead1.rotation.z = Math.PI / 2;
    diodeGroup.add(dLead1);
    const dLead2 = new THREE.Mesh(dLeadGeo, MAT.metal());
    dLead2.position.x = 0.22;
    dLead2.rotation.z = Math.PI / 2;
    diodeGroup.add(dLead2);
    sceneGroup.add(diodeGroup);
    addPin(-1.8, 0.5, 1.0, 'D₁ — 1N34A Germanium Diode');

    // Bypass capacitor (ceramic disc)
    const bypassCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16),
      MAT.ceramic()
    );
    bypassCap.position.set(-1.8, 0.3, -0.8);
    sceneGroup.add(bypassCap);
    addPin(-1.8, 0.5, -0.8, 'C₂ — 10 nF Bypass Capacitor');

    // Load Resistor
    const loadR = createResistor(0, 0.3, 1.8, 0);
    sceneGroup.add(loadR);
    addPin(0, 0.5, 1.8, 'R₁ — 47 kΩ Load Resistor');

    // Antenna wire (going up)
    const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 4, 6);
    const ant = new THREE.Mesh(antGeo, MAT.copper());
    ant.position.set(-0.5, 3.5, -0.3);
    ant.rotation.z = 0.15;
    sceneGroup.add(ant);
    addPin(-0.5, 5.5, -0.3, 'ANT — Long-Wire Antenna');
  }

  /* ── Milestone 2: Audio Amplifier ── */
  function buildMilestone2() {
    // Breadboard
    const bbGeo = new THREE.BoxGeometry(4.5, 0.15, 2.2);
    const bb = new THREE.Mesh(bbGeo, MAT.breadboard());
    bb.position.y = 0.075;
    bb.castShadow = true;
    bb.receiveShadow = true;
    sceneGroup.add(bb);

    // Breadboard holes (decorative)
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 30; col++) {
        const hole = new THREE.Mesh(
          new THREE.CircleGeometry(0.02, 8),
          new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        hole.position.set(-2.0 + col * 0.14, 0.16, -0.8 + row * 0.18);
        hole.rotation.x = -Math.PI / 2;
        sceneGroup.add(hole);
      }
    }

    // Center divider
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(4.3, 0.02, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 })
    );
    divider.position.y = 0.16;
    sceneGroup.add(divider);

    addPin(0, 0.3, 0, 'Solderless Breadboard');

    // Transistor Q1 (TO-92)
    const q1 = createTO92(-1.2, 0.15, -0.4);
    sceneGroup.add(q1);
    addPin(-1.2, 0.7, -0.4, 'Q₁ — 2N3904 (Stage 1)');

    // Transistor Q2 (TO-92)
    const q2 = createTO92(1.2, 0.15, -0.4);
    sceneGroup.add(q2);
    addPin(1.2, 0.7, -0.4, 'Q₂ — 2N3904 (Stage 2)');

    // Resistors
    sceneGroup.add(createResistor(-1.8, 0.3, 0.4, 0));
    addPin(-1.8, 0.5, 0.4, 'R₂ — 4.7 kΩ Collector');
    sceneGroup.add(createResistor(-0.6, 0.3, 0.4, 0));
    sceneGroup.add(createResistor(0.6, 0.3, 0.4, 0));
    sceneGroup.add(createResistor(1.8, 0.3, 0.4, 0));

    // Coupling capacitors (film type — box shape)
    const filmCapGeo = new THREE.BoxGeometry(0.2, 0.35, 0.1);
    const filmCapMat = new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.5 });
    const c3 = new THREE.Mesh(filmCapGeo, filmCapMat);
    c3.position.set(-0.2, 0.35, -0.3);
    sceneGroup.add(c3);
    addPin(-0.2, 0.6, -0.3, 'C₃ — 1 µF Coupling Cap');

    const c4 = new THREE.Mesh(filmCapGeo.clone(), filmCapMat.clone());
    c4.position.set(0.3, 0.35, -0.3);
    sceneGroup.add(c4);

    // Electrolytic bypass caps
    sceneGroup.add(createCapacitor(-1.5, 0.15, -0.6, 0.5, 0.12, 0x1a3a5c));
    addPin(-1.5, 0.8, -0.6, 'CE₁ — 47 µF Emitter Bypass');
    sceneGroup.add(createCapacitor(1.5, 0.15, -0.6, 0.5, 0.12, 0x1a3a5c));

    // Output capacitor (larger)
    sceneGroup.add(createCapacitor(2.0, 0.15, 0.5, 0.6, 0.18, 0x0d2b45));
    addPin(2.0, 0.9, 0.5, 'C₅ — 100 µF Output Coupling');

    // Volume pot
    const potGroup = new THREE.Group();
    potGroup.position.set(0, 0.15, 0.7);
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16),
      MAT.metal()
    );
    potBody.position.y = 0.06;
    potGroup.add(potBody);
    const potShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8),
      MAT.metal()
    );
    potShaft.position.y = 0.3;
    potGroup.add(potShaft);
    const potKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.15, 16),
      MAT.black()
    );
    potKnob.position.y = 0.52;
    potGroup.add(potKnob);
    sceneGroup.add(potGroup);
    addPin(0, 0.8, 0.7, 'VR₁ — 10 kΩ Volume Control');

    // Speaker (simplified cone)
    const spkGroup = new THREE.Group();
    spkGroup.position.set(3.2, 0.3, 0);
    const spkFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.15, 24),
      MAT.metal()
    );
    spkGroup.add(spkFrame);
    const spkCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.3, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8, side: THREE.DoubleSide })
    );
    spkCone.rotation.x = Math.PI;
    spkCone.position.y = -0.08;
    spkGroup.add(spkCone);
    const spkMagnet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16),
      MAT.black()
    );
    spkMagnet.position.y = -0.2;
    spkGroup.add(spkMagnet);
    sceneGroup.add(spkGroup);
    addPin(3.2, 0.8, 0, 'SPK — 8 Ω Speaker');
  }

  /** Helper: TO-92 transistor package */
  function createTO92(x, y, z) {
    const g = new THREE.Group();
    // Body (half cylinder)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16, 1, false, 0, Math.PI),
      MAT.black()
    );
    body.position.y = 0.25;
    g.add(body);
    // Flat face
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.35),
      MAT.silicon()
    );
    face.position.y = 0.25;
    face.rotation.y = Math.PI / 2;
    g.add(face);
    // Leads
    const leadGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6);
    [-0.06, 0, 0.06].forEach(offset => {
      const lead = new THREE.Mesh(leadGeo, MAT.metal());
      lead.position.set(0, 0, offset);
      g.add(lead);
    });
    g.position.set(x, y, z);
    return g;
  }

  /* ── Milestone 3: Power Supply ── */
  function buildMilestone3() {
    // PCB board
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.08, 2.5),
      MAT.pcb()
    );
    pcb.position.y = 0.04;
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    sceneGroup.add(pcb);

    // PCB traces (decorative copper lines)
    const traceGeo = new THREE.BoxGeometry(3.5, 0.005, 0.03);
    const traceMat = MAT.copper();
    for (let i = 0; i < 8; i++) {
      const trace = new THREE.Mesh(traceGeo, traceMat);
      trace.position.set(0, 0.085, -0.9 + i * 0.26);
      sceneGroup.add(trace);
    }
    addPin(0, 0.3, 0, 'FR4 PCB — Double-Sided');

    // Bridge rectifier (4 diodes)
    const rectGroup = new THREE.Group();
    rectGroup.position.set(-1.5, 0.08, 0.5);
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
        MAT.black()
      );
      d.rotation.z = Math.PI / 2;
      d.position.set(0, 0.15, -0.2 + i * 0.13);
      // White band
      const wb = new THREE.Mesh(
        new THREE.TorusGeometry(0.042, 0.008, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
      );
      wb.position.copy(d.position);
      wb.position.x += 0.1;
      wb.rotation.y = Math.PI / 2;
      rectGroup.add(d);
      rectGroup.add(wb);
    }
    sceneGroup.add(rectGroup);
    addPin(-1.5, 0.5, 0.5, 'D₂-D₅ — 1N4007 Bridge Rectifier');

    // Bulk filter cap (large electrolytic)
    sceneGroup.add(createCapacitor(-0.5, 0.08, 0.6, 1.0, 0.3, 0x0d2b45));
    addPin(-0.5, 1.2, 0.6, 'C₆ — 2200 µF Bulk Filter');

    // 7809 Regulator (TO-220)
    const regGroup = new THREE.Group();
    regGroup.position.set(0.5, 0.08, 0);
    // Tab
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.6, 0.04),
      MAT.metal()
    );
    tab.position.y = 0.35;
    regGroup.add(tab);
    // Body
    const regBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 0.15),
      MAT.black()
    );
    regBody.position.y = 0.22;
    regBody.position.z = 0.06;
    regGroup.add(regBody);
    // Mounting hole
    const hole = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.015, 8, 16),
      MAT.metal()
    );
    hole.position.y = 0.55;
    regGroup.add(hole);
    // Leads
    const regLeadGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6);
    [-0.08, 0, 0.08].forEach(offset => {
      const lead = new THREE.Mesh(regLeadGeo, MAT.metal());
      lead.position.set(offset, 0, 0.06);
      regGroup.add(lead);
    });
    // Heatsink fins
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.5, 0.3),
        MAT.metal()
      );
      fin.position.set(-0.12 + i * 0.06, 0.35, -0.15);
      regGroup.add(fin);
    }
    sceneGroup.add(regGroup);
    addPin(0.5, 0.8, 0, 'U₁ — 7809 Voltage Regulator');

    // Output filter caps
    sceneGroup.add(createCapacitor(1.2, 0.08, 0.3, 0.5, 0.12, 0x1a3a5c));
    sceneGroup.add(createCapacitor(1.6, 0.08, -0.3, 0.5, 0.12, 0x1a3a5c));
    addPin(1.4, 0.7, 0, 'C₇/C₈ — Bypass Capacitors');

    // Filter choke
    const chokeGroup = new THREE.Group();
    chokeGroup.position.set(1.0, 0.08, -0.7);
    const chokeCore = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.7 })
    );
    chokeCore.position.y = 0.25;
    chokeCore.rotation.x = Math.PI / 2;
    chokeGroup.add(chokeCore);
    // Winding
    const chokeWind = createHelix(0.22, 0.1, 8, 0.015, MAT.copper());
    chokeWind.position.y = 0.25;
    chokeWind.rotation.x = Math.PI / 2;
    chokeGroup.add(chokeWind);
    sceneGroup.add(chokeGroup);
    addPin(1.0, 0.5, -0.7, 'L₂ — 10 mH Filter Choke');

    // LED indicator
    const ledGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x22cc44,
      emissive: 0x22cc44,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(1.8, 0.2, 0.7);
    sceneGroup.add(led);
    addPin(1.8, 0.4, 0.7, 'LED₁ — Power Indicator');

    // Power switch
    const swGroup = new THREE.Group();
    swGroup.position.set(-1.5, 0.08, -0.7);
    const swBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.2),
      MAT.black()
    );
    swBase.position.y = 0.1;
    swGroup.add(swBase);
    const swToggle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      MAT.metal()
    );
    swToggle.position.y = 0.25;
    swToggle.rotation.z = 0.4;
    swGroup.add(swToggle);
    sceneGroup.add(swGroup);
    addPin(-1.5, 0.4, -0.7, 'SW₁ — SPST Power Switch');
  }

  /* ── Milestone 4: System Integration ── */
  function buildMilestone4() {
    // Enclosure (transparent box)
    const encGeo = new THREE.BoxGeometry(5, 2.2, 3);
    const encMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a1810,
      roughness: 0.4,
      metalness: 0,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const enc = new THREE.Mesh(encGeo, encMat);
    enc.position.y = 1.1;
    sceneGroup.add(enc);

    // Enclosure edges (wireframe)
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(encGeo),
      new THREE.LineBasicMaterial({ color: 0x8b6914, transparent: true, opacity: 0.5 })
    );
    wireframe.position.copy(enc.position);
    sceneGroup.add(wireframe);
    addPin(0, 2.4, 0, 'ENC — Custom ABS Enclosure');

    // Internal PCB
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.06, 2.2),
      MAT.pcb()
    );
    pcb.position.y = 0.35;
    sceneGroup.add(pcb);
    addPin(0, 0.55, 0, 'PCB — Stripboard Assembly');

    // Coil (smaller, inside enclosure)
    const miniCoil = createHelix(0.35, 1.2, 20, 0.018, MAT.copper());
    miniCoil.position.set(-1.5, 1.0, 0.3);
    sceneGroup.add(miniCoil);
    // Mini PVC
    const miniPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16, 1, true),
      MAT.pvc()
    );
    miniPipe.position.set(-1.5, 1.0, 0.3);
    sceneGroup.add(miniPipe);
    addPin(-1.5, 1.8, 0.3, 'Tuner Stage');

    // Transistors
    sceneGroup.add(createTO92(-0.3, 0.38, 0.2));
    sceneGroup.add(createTO92(0.3, 0.38, 0.2));
    addPin(0, 0.8, 0.2, 'Amplifier Stage');

    // Assorted capacitors
    sceneGroup.add(createCapacitor(0.8, 0.38, -0.4, 0.4, 0.1, 0x1a3a5c));
    sceneGroup.add(createCapacitor(1.2, 0.38, 0.5, 0.7, 0.2, 0x0d2b45));

    // Regulator
    const regSimple = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.4, 0.1),
      MAT.black()
    );
    regSimple.position.set(1.5, 0.6, -0.3);
    sceneGroup.add(regSimple);
    addPin(1.5, 0.9, -0.3, 'Power Supply Section');

    // Front panel — tuning dial
    const dialGroup = new THREE.Group();
    dialGroup.position.set(-1.0, 1.1, -1.52);
    const dialFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 32),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.5 })
    );
    dialGroup.add(dialFace);
    // Dial markings (simplified)
    const dialRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.02, 8, 32),
      MAT.metal()
    );
    dialGroup.add(dialRim);
    // Needle
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.35, 0.01),
      MAT.red()
    );
    needle.position.y = 0.05;
    needle.rotation.z = 0.5;
    dialGroup.add(needle);
    sceneGroup.add(dialGroup);
    addPin(-1.0, 1.5, -1.5, 'DIAL — 6:1 Vernier Tuning');

    // Volume knob
    const volKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.18, 0.15, 16),
      MAT.black()
    );
    volKnob.position.set(0.5, 1.1, -1.52);
    volKnob.rotation.x = Math.PI / 2;
    sceneGroup.add(volKnob);
    addPin(0.5, 1.3, -1.5, 'Volume Knob');

    // Speaker grille (front panel)
    const grilleGroup = new THREE.Group();
    grilleGroup.position.set(1.5, 1.1, -1.52);
    const grilleFrame = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
    );
    grilleGroup.add(grilleFrame);
    // Grille holes
    for (let r = 0; r < 4; r++) {
      for (let a = 0; a < 8 + r * 4; a++) {
        const angle = (a / (8 + r * 4)) * Math.PI * 2;
        const rad = 0.12 + r * 0.1;
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.02, 8),
          new THREE.MeshBasicMaterial({ color: 0x0a192f })
        );
        dot.position.set(Math.cos(angle) * rad, Math.sin(angle) * rad, 0.01);
        grilleGroup.add(dot);
      }
    }
    sceneGroup.add(grilleGroup);
    addPin(1.5, 1.7, -1.5, 'SPK — 57 mm Speaker Grille');

    // Antenna connector
    const antPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
      MAT.red()
    );
    antPost.position.set(-2.2, 2.3, -0.5);
    sceneGroup.add(antPost);
    const antTerminal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12),
      MAT.red()
    );
    antTerminal.position.set(-2.2, 2.5, -0.5);
    sceneGroup.add(antTerminal);

    // Antenna wire going up
    const antWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 3, 6),
      MAT.copper()
    );
    antWire.position.set(-2.2, 4.0, -0.5);
    antWire.rotation.z = 0.1;
    sceneGroup.add(antWire);
    addPin(-2.2, 5.5, -0.5, 'ANT — External Antenna Terminal');
  }

  /* ── Public API ── */
  function loadMilestone(index) {
    clearScene();
    camera.position.set(5, 3.5, 6);
    controls.target.set(0, 0.5, 0);

    // Set accent color for pin materials
    const accent = MILESTONES[index]?.accentColor || '#00F2FE';

    switch (index) {
      case 0: buildMilestone1(); break;
      case 1: buildMilestone2(); break;
      case 2: buildMilestone3(); break;
      case 3: buildMilestone4(); break;
      default: buildMilestone1();
    }
  }

  function dispose() {
    if (animId) cancelAnimationFrame(animId);
    clearScene();
    renderer.dispose();
  }

  return { init, loadMilestone, dispose };
})();
