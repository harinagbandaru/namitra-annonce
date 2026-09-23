/**
 * NĀMITRA ANNONCE · STATE-OF-THE-ART DIGITAL ENGINE
 * AI Advertising & Creative Studio · Hyderabad
 * Three.js 3D WebGL Visualization, Cinematic Entries & Telemetry Engine
 */

(function () {
  "use strict";

  var root = document.documentElement;
  var prefsKey = "namitra-prefs";

  /* ==========================================================================
     01. Preferences Management & State
     ========================================================================== */
  function readPrefs() {
    try {
      return JSON.parse(localStorage.getItem(prefsKey) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writePrefs(prefs) {
    try {
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
    } catch (e) {}
  }

  function isReducedMotion(prefs) {
    if (prefs.motion === "reduced") return true;
    if (prefs.motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function applyPrefs(prefs) {
    var theme = prefs.theme || "cinema";
    if (theme === "system") {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "paper" : "cinema";
    }
    root.setAttribute("data-theme", theme === "paper" ? "paper" : "cinema");

    var contrast = prefs.contrast;
    if (contrast !== "high" && contrast !== "standard") {
      contrast = window.matchMedia("(prefers-contrast: more)").matches ? "high" : "standard";
    }
    root.setAttribute("data-contrast", contrast);

    var reduce = isReducedMotion(prefs);
    root.setAttribute("data-motion", reduce ? "reduced" : "full");
    root.setAttribute("data-size", prefs.size || "m");
    root.setAttribute("data-grain", (prefs.grain === "off" || reduce) ? "off" : "on");
    root.setAttribute("data-cursor", prefs.cursor === "system" ? "system" : "studio");

    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var cameraOn = !reduce && (prefs.camera !== "off");
    root.setAttribute("data-camera", cameraOn ? "on" : "off");

    var soundOn = prefs.sound === "on";
    root.setAttribute("data-sound", soundOn ? "on" : "off");

    return reduce;
  }

  var currentPrefs = readPrefs();
  var reduceMotion = applyPrefs(currentPrefs);
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ==========================================================================
     02. Synthetic Audio Engine (Web Audio API - Zero External Files)
     ========================================================================== */
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      var AudioConstructor = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioConstructor();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playAcousticClick() {
    if (root.getAttribute("data-sound") !== "on") return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function playCinematicDrone() {
    if (root.getAttribute("data-sound") !== "on") return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(75, ctx.currentTime + 1.8);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {}
  }

  /* ==========================================================================
     03. Live Telemetry HUD: Hyderabad IST Clock
     ========================================================================== */
  function initTelemetryClock() {
    var istEl = document.getElementById("ist-clock");
    if (!istEl) return;

    function updateTime() {
      var now = new Date();
      // Compute IST: UTC + 5 hours 30 mins
      var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      var ist = new Date(utc + (3600000 * 5.5));
      var h = String(ist.getHours()).padStart(2, "0");
      var m = String(ist.getMinutes()).padStart(2, "0");
      var s = String(ist.getSeconds()).padStart(2, "0");
      istEl.textContent = h + ":" + m + ":" + s;
    }
    updateTime();
    window.setInterval(updateTime, 1000);

    var yearEl = document.getElementById("year-copy");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }
  initTelemetryClock();

  /* ==========================================================================
     04. Hollywood Cinematic Entry Sequence (#entry)
     ========================================================================== */
  var entryEl = document.getElementById("entry");
  var pageEl = document.getElementById("page");
  var skipBtn = document.getElementById("skip-entry");
  var soundBtn = document.getElementById("entry-sound-btn");
  var hudSoundBtn = document.getElementById("hud-sound-btn");
  var soundStateLabel = document.getElementById("sound-state-label");
  var entryTimecode = document.getElementById("entry-timecode");
  var entryDone = false;
  var entryTimer = 0;

  function updateSoundUI() {
    var soundOn = root.getAttribute("data-sound") === "on";
    if (soundStateLabel) {
      soundStateLabel.textContent = soundOn ? "ACTIVE" : "MUTED";
    }
    if (hudSoundBtn) {
      hudSoundBtn.setAttribute("aria-label", soundOn ? "Sound active (click to mute)" : "Sound muted (click to enable)");
      hudSoundBtn.innerHTML = '<svg class="icon-audio" aria-hidden="true"><use href="#' + (soundOn ? "icon-sound-on" : "icon-sound-off") + '"></use></svg>';
    }
  }

  function toggleSound() {
    var next = root.getAttribute("data-sound") === "on" ? "off" : "on";
    var p = readPrefs();
    p.sound = next;
    writePrefs(p);
    root.setAttribute("data-sound", next);
    updateSoundUI();
    if (next === "on") playAcousticClick();
  }

  if (soundBtn) soundBtn.addEventListener("click", toggleSound);
  if (hudSoundBtn) hudSoundBtn.addEventListener("click", toggleSound);
  updateSoundUI();

  // SMPTE Timecode counter simulation in entry
  var tcFrame = 14;
  var tcSec = 1;
  var tcTimer = 0;
  if (entryTimecode) {
    tcTimer = window.setInterval(function () {
      tcFrame = (tcFrame + 1) % 24;
      if (tcFrame === 0) tcSec = (tcSec + 1) % 60;
      entryTimecode.textContent = "00:00:" + String(tcSec).padStart(2, "0") + ":" + String(tcFrame).padStart(2, "0");
    }, 41.6);
  }

  function finishCinematicEntry() {
    if (entryDone) return;
    entryDone = true;
    window.clearTimeout(entryTimer);
    window.clearInterval(tcTimer);
    document.body.classList.remove("is-entering");
    if (pageEl) pageEl.inert = false;

    if (!entryEl) return;
    entryEl.classList.add("is-leaving");
    entryEl.setAttribute("aria-hidden", "true");
    entryEl.inert = true;

    playAcousticClick();

    window.setTimeout(function () {
      entryEl.hidden = true;
      var hero = document.getElementById("hero");
      if (hero) hero.focus();
    }, reduceMotion ? 0 : 550);
  }

  if (reduceMotion) {
    if (entryEl) {
      entryEl.hidden = true;
      entryEl.inert = true;
    }
    if (pageEl) pageEl.inert = false;
  } else if (entryEl && pageEl) {
    document.body.classList.add("is-entering");
    pageEl.inert = true;
    playCinematicDrone();
    entryTimer = window.setTimeout(finishCinematicEntry, 2800);

    if (skipBtn) skipBtn.addEventListener("click", finishCinematicEntry);
  }

  window.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === " ") && !entryDone) {
      finishCinematicEntry();
    }
  });

  /* ==========================================================================
     05. SOTA Viewfinder Magnetic Cursor
     ========================================================================== */
  var cursorEl = document.getElementById("cursor");
  if (cursorEl && isFinePointer) {
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var curX = mouseX;
    var curY = mouseY;
    var cursorActive = false;

    if (root.getAttribute("data-cursor") !== "system") {
      document.body.classList.add("use-cursor");
    }

    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursorActive) {
        cursorActive = true;
        cursorEl.classList.add("is-on");
      }

      var target = e.target;
      var isTyping = target.closest && target.closest("input, textarea, select");
      var isHot = target.closest && target.closest("a, button, .frame, .pack-card, [data-film]");

      cursorEl.classList.toggle("is-hidden", Boolean(isTyping));
      cursorEl.classList.toggle("is-hot", Boolean(isHot));
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", function () {
      cursorEl.classList.remove("is-on");
      cursorActive = false;
    });

    function renderCursor() {
      if (cursorActive && root.getAttribute("data-cursor") !== "system") {
        curX += (mouseX - curX) * 0.22;
        curY += (mouseY - curY) * 0.22;
        cursorEl.style.transform = "translate3d(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px,0)";
      }
      window.requestAnimationFrame(renderCursor);
    }
    window.requestAnimationFrame(renderCursor);
  }

  /* ==========================================================================
     06. Real-Time Three.js 3D WebGL Visualization
     ========================================================================== */
  function initThreeJsStage() {
    var container = document.getElementById("canvas-container");
    var canvas = document.getElementById("webgl-canvas");
    var loader = document.getElementById("canvas-loader");
    if (!container || !canvas || typeof THREE === "undefined") {
      if (loader) loader.classList.add("is-hidden");
      return;
    }

    if (root.getAttribute("data-camera") === "off" || root.getAttribute("data-motion") === "reduced") {
      if (loader) loader.classList.add("is-hidden");
      return;
    }

    var renderer, scene, camera;
    var mainGroup = new THREE.Group();
    var irisGroup = new THREE.Group();
    var particlesGroup = new THREE.Group();
    var anamorphicStreak;
    var isVisible = true;
    var width = container.clientWidth || 400;
    var height = container.clientHeight || 400;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 8.5);
    } catch (err) {
      console.warn("WebGL initialization failed:", err);
      if (loader) loader.classList.add("is-hidden");
      return;
    }

    // Lights
    var ambLight = new THREE.AmbientLight(0x2a1018, 1.2);
    scene.add(ambLight);

    var goldKeyLight = new THREE.DirectionalLight(0xF4E7C8, 3.2);
    goldKeyLight.position.set(4, 5, 6);
    scene.add(goldKeyLight);

    var rimLight = new THREE.DirectionalLight(0x45D6E5, 2.4);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    var velvetFill = new THREE.PointLight(0x8C2036, 3.0, 15);
    velvetFill.position.set(0, -3, 3);
    scene.add(velvetFill);

    // Metallic Materials
    var goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xDFC282,
      metalness: 0.92,
      roughness: 0.22
    });

    var darkTitanium = new THREE.MeshStandardMaterial({
      color: 0x140E12,
      metalness: 0.85,
      roughness: 0.35
    });

    var glassFrontMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xF6F1E8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 1.2,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    // Outer Cine-Lens Barrel
    var barrelGeo = new THREE.CylinderGeometry(2.1, 2.3, 2.2, 48, 1, true);
    var barrel = new THREE.Mesh(barrelGeo, darkTitanium);
    barrel.rotation.x = Math.PI / 2;
    mainGroup.add(barrel);

    // Knurled Gold Aperture & Focus Rings
    var ring1Geo = new THREE.TorusGeometry(2.18, 0.08, 16, 48);
    var ring1 = new THREE.Mesh(ring1Geo, goldMaterial);
    ring1.position.z = 0.5;
    mainGroup.add(ring1);

    var ring2Geo = new THREE.TorusGeometry(2.26, 0.09, 16, 48);
    var ring2 = new THREE.Mesh(ring2Geo, goldMaterial);
    ring2.position.z = -0.4;
    mainGroup.add(ring2);

    // Front Optical Bezel
    var frontRimGeo = new THREE.TorusGeometry(2.05, 0.12, 16, 48);
    var frontRim = new THREE.Mesh(frontRimGeo, goldMaterial);
    frontRim.position.z = 1.08;
    mainGroup.add(frontRim);

    // Curved Optical Glass Front Element
    var glassGeo = new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.32);
    var frontGlass = new THREE.Mesh(glassGeo, glassFrontMaterial);
    frontGlass.position.z = 0.4;
    mainGroup.add(frontGlass);

    // Internal Iris Aperture Mechanism
    var bladeCount = 9;
    var bladeShape = new THREE.BoxGeometry(0.7, 0.04, 1.2);
    var bladeMat = new THREE.MeshStandardMaterial({
      color: 0xC4A35A,
      metalness: 0.95,
      roughness: 0.28
    });

    for (var b = 0; b < bladeCount; b++) {
      var angle = (b / bladeCount) * Math.PI * 2;
      var blade = new THREE.Mesh(bladeShape, bladeMat);
      blade.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0);
      blade.rotation.z = angle + 0.45;
      irisGroup.add(blade);
    }
    irisGroup.position.z = -0.2;
    mainGroup.add(irisGroup);

    // Anamorphic Horizontal Blue/Gold Light Streak Plane
    var streakGeo = new THREE.PlaneGeometry(6.5, 0.18);
    var streakMat = new THREE.MeshBasicMaterial({
      color: 0x45D6E5,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    anamorphicStreak = new THREE.Mesh(streakGeo, streakMat);
    anamorphicStreak.position.z = 1.15;
    mainGroup.add(anamorphicStreak);

    // Swarm of Neural AI Embers / Toroidal Particles
    var particleCount = 320;
    var particleGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    var colors = new Float32Array(particleCount * 3);
    var cGold = new THREE.Color(0xDFC282);
    var cCyan = new THREE.Color(0x45D6E5);
    var cRuby = new THREE.Color(0xF4E7C8);

    for (var p = 0; p < particleCount; p++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = (Math.random() - 0.5) * Math.PI;
      var rad = 1.2 + Math.random() * 2.2;

      positions[p * 3] = Math.cos(theta) * Math.cos(phi) * rad;
      positions[p * 3 + 1] = Math.sin(phi) * rad;
      positions[p * 3 + 2] = Math.sin(theta) * Math.cos(phi) * rad;

      var mixColor = Math.random() > 0.4 ? cGold : (Math.random() > 0.5 ? cCyan : cRuby);
      colors[p * 3] = mixColor.r;
      colors[p * 3 + 1] = mixColor.g;
      colors[p * 3 + 2] = mixColor.b;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    var particleMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    particlesGroup.add(particles);
    mainGroup.add(particlesGroup);

    scene.add(mainGroup);

    // Remove loading screen
    if (loader) loader.classList.add("is-hidden");

    // Interaction & Target Variables
    var targetRotX = 0.2;
    var targetRotY = -0.35;
    var curRotX = 0.2;
    var curRotY = -0.35;
    var currentMode = "anamorphic";
    var targetCameraZ = 8.5;
    var curCameraZ = 8.5;

    // Mode Switching Logic
    var modeButtons = document.querySelectorAll(".stage-mode-btn");
    modeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        modeButtons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        currentMode = btn.getAttribute("data-mode");
        playAcousticClick();

        if (currentMode === "anamorphic") {
          targetCameraZ = 8.5;
          targetRotX = 0.2;
          targetRotY = -0.35;
        } else if (currentMode === "neural") {
          targetCameraZ = 5.2;
          targetRotX = 0.4;
          targetRotY = 0.6;
        } else if (currentMode === "shutter") {
          targetCameraZ = 7.0;
          targetRotX = 0.0;
          targetRotY = 0.0;
          // Pulse iris animation
          irisGroup.scale.set(0.4, 0.4, 0.4);
        }
      });
    });

    // Mouse Tracking on Window
    if (isFinePointer) {
      window.addEventListener("mousemove", function (e) {
        var nx = (e.clientX / window.innerWidth) - 0.5;
        var ny = (e.clientY / window.innerHeight) - 0.5;
        if (currentMode === "anamorphic") {
          targetRotY = -0.35 + (nx * 0.9);
          targetRotX = 0.2 + (ny * 0.6);
        } else if (currentMode === "neural") {
          targetRotY = 0.6 + (nx * 1.4);
          targetRotX = 0.4 + (ny * 0.8);
        } else {
          targetRotY = nx * 0.4;
          targetRotX = ny * 0.4;
        }
      }, { passive: true });
    }

    // Touch Interaction
    var touchStartX = 0;
    var touchStartY = 0;
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener("touchmove", function (e) {
      if (e.touches.length === 1) {
        var dx = e.touches[0].clientX - touchStartX;
        var dy = e.touches[0].clientY - touchStartY;
        targetRotY += dx * 0.005;
        targetRotX += dy * 0.005;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    // Responsive Resize Handler
    function handleResize() {
      if (!container || !renderer || !camera) return;
      var w = container.clientWidth;
      var h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    }
    window.addEventListener("resize", handleResize, { passive: true });

    // Viewport Intersection Watcher (Pause off-screen)
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    // Render Animation Loop
    var clock = new THREE.Clock();
    function animate() {
      window.requestAnimationFrame(animate);
      if (!isVisible) return;

      var delta = clock.getDelta();
      var elapsed = clock.getElapsedTime();

      // Smooth camera lerp
      curCameraZ += (targetCameraZ - curCameraZ) * 0.06;
      camera.position.z = curCameraZ;

      // Rotation Lerp
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;

      mainGroup.rotation.x = curRotX;
      mainGroup.rotation.y = curRotY;

      // Idle continuous mechanical drift
      particlesGroup.rotation.y += delta * (currentMode === "neural" ? 0.45 : 0.12);
      particlesGroup.rotation.z += delta * 0.05;

      // Iris recovery
      irisGroup.scale.x += (1.0 - irisGroup.scale.x) * 0.08;
      irisGroup.scale.y += (1.0 - irisGroup.scale.y) * 0.08;
      irisGroup.rotation.z = Math.sin(elapsed * 0.6) * 0.15;

      // Anamorphic beam shimmer
      if (anamorphicStreak) {
        anamorphicStreak.material.opacity = 0.25 + Math.sin(elapsed * 2.5) * 0.15;
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  // Initialize Three.js when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThreeJsStage);
  } else {
    initThreeJsStage();
  }

  /* ==========================================================================
     07. Instant Video Hover Previews & Theatre Player
     ========================================================================== */
  var player = document.getElementById("player");
  var playerVideo = document.getElementById("player-video");
  var playerTitle = document.getElementById("player-title");
  var playerNote = document.getElementById("player-note");
  var playerClose = document.getElementById("player-close");
  var playerAspectBadge = document.getElementById("player-aspect-badge");
  var playerCommissionBtn = document.getElementById("player-commission-btn");
  var filmOpener = null;

  // Desktop Hover Video Preview
  var cuts = document.querySelectorAll(".cut");
  cuts.forEach(function (cut) {
    var hoverVideo = cut.querySelector(".hover-preview");
    if (!hoverVideo || !isFinePointer) return;

    cut.addEventListener("mouseenter", function () {
      hoverVideo.classList.add("is-playing");
      hoverVideo.play().catch(function () {});
    });

    cut.addEventListener("mouseleave", function () {
      hoverVideo.classList.remove("is-playing");
      hoverVideo.pause();
      hoverVideo.currentTime = 0;
    });
  });

  function openFilm(button) {
    if (!player || !playerVideo) return;
    filmOpener = button;
    var title = button.getAttribute("data-title") || "NĀMITRA Commercial";
    var note = button.getAttribute("data-note") || "";
    var poster = button.getAttribute("data-poster") || "";
    var src = button.getAttribute("data-src") || "";

    playerTitle.textContent = title;
    if (playerNote) playerNote.textContent = note;
    playerVideo.poster = poster;
    playerVideo.src = src;

    // Detect aspect ratio for badge
    var isTall = button.classList.contains("tall");
    if (playerAspectBadge) {
      playerAspectBadge.textContent = isTall ? "9:16 VERTICAL" : "16:9 WIDESCREEN";
    }

    if (playerCommissionBtn) {
      playerCommissionBtn.setAttribute("href", "#contact");
    }

    player.hidden = false;
    document.body.classList.add("is-playing");
    playAcousticClick();
    playerVideo.play().catch(function () {});
    if (playerClose) playerClose.focus();
  }

  function closeFilm() {
    if (!player || !playerVideo || player.hidden) return;
    playerVideo.pause();
    player.hidden = true;
    document.body.classList.remove("is-playing");
    playAcousticClick();
    if (filmOpener) filmOpener.focus();
  }

  document.addEventListener("click", function (e) {
    var filmBtn = e.target.closest && e.target.closest("[data-film]");
    if (filmBtn) {
      e.preventDefault();
      openFilm(filmBtn);
      return;
    }
    if (e.target === player || (e.target && e.target.id === "player-close")) {
      closeFilm();
    }
  });

  /* ==========================================================================
     08. Interactive Package & Commission Calculator
     ========================================================================== */
  var packButtons = document.querySelectorAll(".pack-select-btn");
  var summaryPackTitle = document.getElementById("summary-pack-title");
  var summaryPackNote = document.getElementById("summary-pack-note");
  var summaryWaLink = document.getElementById("summary-whatsapp-link");

  var packNotesMap = {
    "Rs 2,000": "Engineered for single-product sales or rapid promotions. Ready in 48 hours.",
    "Rs 5,000": "Most popular choice. Tests 3 distinct customer hooks to uncover your lowest cost-per-lead.",
    "Rs 10,000": "Complete growth funnel with 5 commercial cuts plus active Meta and WhatsApp campaign setup.",
    "Rs 20,000+": "Comprehensive brand architecture: 60s flagship film, 10x social reels, and director advisory."
  };

  packButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var budget = btn.getAttribute("data-budget") || "Rs 5,000";
      var orderText = btn.getAttribute("data-order") || "";
      var card = btn.closest(".pack-card");
      var title = card ? (card.getAttribute("data-pack-title") || orderText) : orderText;

      playAcousticClick();

      // Update Summary Card
      if (summaryPackTitle) {
        summaryPackTitle.textContent = title + " (" + budget + ")";
      }
      if (summaryPackNote && packNotesMap[budget]) {
        summaryPackNote.textContent = packNotesMap[budget];
      }

      var waText = "Hi NĀMITRA, I want to book the " + budget + " (" + title + ") package for my business.\n\nBusiness:\nLocation:\nWhat I sell:";
      if (summaryWaLink) {
        summaryWaLink.href = "https://wa.me/919703556947?text=" + encodeURIComponent(waText);
      }

      // Pre-fill Brief Form Inputs
      var sellField = document.getElementById("brief-sell");
      var budgetField = document.getElementById("brief-budget");
      if (sellField) sellField.value = orderText;
      if (budgetField) budgetField.value = budget + " (" + title + ")";

      // Scroll smoothly down to brief
      var contactSec = document.getElementById("contact");
      if (contactSec) {
        contactSec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        var nameInput = document.getElementById("brief-name");
        if (nameInput) {
          window.setTimeout(function () { nameInput.focus(); }, reduceMotion ? 0 : 400);
        }
      }
    });
  });

  /* ==========================================================================
     09. Commission Brief Form Validation & WhatsApp Dispatch
     ========================================================================== */
  var briefForm = document.getElementById("brief-form");
  var formStatus = document.getElementById("form-status");

  function cleanInput(val) {
    return (val || "").replace(/\s+/g, " ").trim();
  }

  function setFieldError(field, message) {
    var errEl = document.getElementById(field.id + "-error");
    if (message) {
      field.setAttribute("aria-invalid", "true");
      if (errEl) errEl.textContent = message;
    } else {
      field.removeAttribute("aria-invalid");
      if (errEl) errEl.textContent = "";
    }
  }

  if (briefForm) {
    briefForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = cleanInput(briefForm.name.value);
      var business = cleanInput(briefForm.business.value);
      var location = cleanInput(briefForm.location.value);
      var sell = cleanInput(briefForm.sell.value);
      var budget = cleanInput(briefForm.budget.value);

      briefForm.name.value = name;
      briefForm.business.value = business;
      briefForm.location.value = location;
      briefForm.sell.value = sell;
      briefForm.budget.value = budget;

      var hasErrors = false;
      if (!name) { setFieldError(briefForm.name, "Enter your name."); hasErrors = true; }
      else setFieldError(briefForm.name, "");

      if (!business) { setFieldError(briefForm.business, "Enter your business name."); hasErrors = true; }
      else setFieldError(briefForm.business, "");

      if (!location) { setFieldError(briefForm.location, "Specify your location/city."); hasErrors = true; }
      else setFieldError(briefForm.location, "");

      if (!sell) { setFieldError(briefForm.sell, "Describe what you sell."); hasErrors = true; }
      else setFieldError(briefForm.sell, "");

      if (hasErrors) {
        if (formStatus) formStatus.textContent = "Please fill in all required fields before sending.";
        return;
      }

      var textLines = [
        "★ NEW COMMISSION BRIEF · NĀMITRA ANNONCE ★",
        "Name: " + name,
        "Business: " + business,
        "Location: " + location,
        "Offering: " + sell,
        "Target Package / Budget: " + (budget || "Standard Evaluation")
      ];
      var waUrl = "https://wa.me/919703556947?text=" + encodeURIComponent(textLines.join("\n"));

      playAcousticClick();

      if (formStatus) {
        formStatus.innerHTML = '<span style="color:#34D399">✓ Brief compiled. Opening WhatsApp...</span>';
      }

      window.setTimeout(function () {
        window.open(waUrl, "_blank");
      }, 350);
    });
  }

  /* ==========================================================================
     10. Settings Drawer & Keyboard Trap (#settings)
     ========================================================================== */
  var settingsEl = document.getElementById("settings");
  var settingsOpenBtn = document.getElementById("settings-open");
  var settingsCloseBtn = document.getElementById("settings-close");

  function openSettings() {
    if (!settingsEl) return;
    settingsEl.hidden = false;
    if (settingsOpenBtn) settingsOpenBtn.setAttribute("aria-expanded", "true");
    playAcousticClick();
    if (settingsCloseBtn) settingsCloseBtn.focus();
  }

  function closeSettings() {
    if (!settingsEl || settingsEl.hidden) return;
    settingsEl.hidden = true;
    if (settingsOpenBtn) {
      settingsOpenBtn.setAttribute("aria-expanded", "false");
      settingsOpenBtn.focus();
    }
    playAcousticClick();
  }

  if (settingsOpenBtn) settingsOpenBtn.addEventListener("click", openSettings);
  if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", closeSettings);

  if (settingsEl) {
    settingsEl.addEventListener("click", function (e) {
      if (e.target === settingsEl) closeSettings();
    });

    settingsEl.addEventListener("change", function () {
      function checkedVal(name) {
        var el = document.querySelector('#settings input[name="' + name + '"]:checked');
        return el ? el.value : "";
      }

      var next = {
        theme: checkedVal("theme") || "cinema",
        motion: checkedVal("motion") || "auto",
        size: checkedVal("size") || "m",
        camera: checkedVal("camera") || "on",
        sound: checkedVal("sound") || "off",
        cursor: checkedVal("cursor") || "studio",
        grain: checkedVal("grain") || "on"
      };

      writePrefs(next);
      reduceMotion = applyPrefs(next);
      updateSoundUI();
      playAcousticClick();
    });
  }

  function syncSettingsValues() {
    var p = readPrefs();
    function checkRadio(name, val) {
      var el = document.querySelector('#settings input[name="' + name + '"][value="' + val + '"]');
      if (el) el.checked = true;
    }
    checkRadio("theme", p.theme || "cinema");
    checkRadio("motion", p.motion || "auto");
    checkRadio("size", p.size || "m");
    checkRadio("camera", p.camera || "on");
    checkRadio("sound", p.sound || "off");
    checkRadio("cursor", p.cursor || "studio");
    checkRadio("grain", p.grain || "on");
  }
  syncSettingsValues();

  // Escape key global listener
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (settingsEl && !settingsEl.hidden) {
        e.preventDefault();
        closeSettings();
        return;
      }
      if (player && !player.hidden) {
        e.preventDefault();
        closeFilm();
        return;
      }
    }
  });

  /* ==========================================================================
     11. Intersection Observer for Scroll Reveals
     ========================================================================== */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

})();
