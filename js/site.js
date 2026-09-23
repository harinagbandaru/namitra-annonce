(function () {
  var root = document.documentElement;
  var key = "namitra-prefs";

  function read() {
    try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function write(prefs) { localStorage.setItem(key, JSON.stringify(prefs)); }
  function reduced(prefs) {
    if (prefs.motion === "reduced") return true;
    if (prefs.motion === "full") return false;
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function apply(prefs) {
    var theme = prefs.theme || "cinema";
    if (theme === "system") theme = matchMedia("(prefers-color-scheme: light)").matches ? "paper" : "cinema";
    root.setAttribute("data-theme", theme === "paper" ? "paper" : "cinema");
    var contrast = prefs.contrast === "high" || prefs.contrast === "standard"
      ? prefs.contrast
      : (matchMedia("(prefers-contrast: more)").matches ? "high" : "standard");
    root.setAttribute("data-contrast", contrast);
    var reduce = reduced(prefs);
    root.setAttribute("data-motion", reduce ? "reduced" : "full");
    root.setAttribute("data-size", prefs.size || "m");
    root.setAttribute("data-grain", prefs.grain === "off" || reduce ? "off" : "on");
    root.setAttribute("data-cursor", prefs.cursor === "system" ? "system" : "studio");
    var camera = reduce ? false : prefs.camera !== "off";
    root.setAttribute("data-camera", camera ? "on" : "off");
    return reduce;
  }

  var reduce = apply(read());
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var entry = document.getElementById("entry");
  var page = document.getElementById("page");
  var dock = document.querySelector(".dock");
  var skip = document.getElementById("skip-entry");
  var hero = document.getElementById("hero");
  var settingsEl = document.getElementById("settings");
  var player = document.getElementById("player");
  var done = false;
  var opener = null;

  function behind(locked) {
    if (page) page.inert = locked;
    if (dock) dock.inert = locked;
    if (settingsEl && settingsEl.hidden) settingsEl.inert = locked;
  }
  function finishEntry() {
    if (done) return;
    done = true;
    document.body.classList.remove("is-entering");
    behind(false);
    if (!entry) { if (hero) hero.focus(); return; }
    entry.classList.add("is-leaving");
    entry.setAttribute("aria-hidden", "true");
    entry.inert = true;
    setTimeout(function () { entry.hidden = true; }, reduce ? 0 : 360);
    if (hero) hero.focus();
  }

  if (reduce) {
    if (entry) { entry.hidden = true; entry.inert = true; entry.setAttribute("aria-hidden", "true"); }
    behind(false);
  } else if (entry) {
    document.body.classList.add("is-entering");
    behind(true);
    if (settingsEl) settingsEl.inert = true;
    var timer = setTimeout(finishEntry, 2100);
    if (skip) {
      skip.addEventListener("click", function () { clearTimeout(timer); finishEntry(); });
      skip.focus();
    }
    entry.addEventListener("keydown", function (event) {
      if (event.key === "Tab") { event.preventDefault(); if (skip) skip.focus(); }
    });
  }

  var cursor = document.getElementById("cursor");
  if (cursor && fine) {
    window.addEventListener("pointermove", function (event) {
      if (root.getAttribute("data-cursor") === "system") {
        document.body.classList.remove("use-cursor");
        cursor.classList.remove("is-on");
        return;
      }
      document.body.classList.add("use-cursor");
      cursor.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0)";
      cursor.classList.add("is-on");
      var hot = event.target.closest && event.target.closest("a, button");
      var typing = event.target.closest && event.target.closest("input, textarea");
      cursor.classList.toggle("is-hot", Boolean(hot) && !typing);
      cursor.classList.toggle("is-hidden", Boolean(typing));
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { cursor.classList.remove("is-on"); });
  }

  var rig = document.getElementById("rig");
  if (rig) {
    var tx = 0, ty = 0, cx = 0, cy = 0;
    if (fine) {
      window.addEventListener("pointermove", function (event) {
        if (root.getAttribute("data-camera") !== "on" || root.getAttribute("data-motion") === "reduced") return;
        tx = (event.clientX / innerWidth - 0.5) * 10;
        ty = (event.clientY / innerHeight - 0.5) * -6;
      }, { passive: true });
    }
    (function tick(now) {
      if (root.getAttribute("data-camera") !== "on" || root.getAttribute("data-motion") === "reduced") {
        rig.style.transform = "none";
      } else if (fine) {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        rig.style.transform = "rotateX(" + (4 + cy).toFixed(2) + "deg) rotateY(" + cx.toFixed(2) + "deg)";
      } else {
        rig.style.transform = "rotateX(4deg) rotateY(" + (Math.sin(now * 0.0004) * 4).toFixed(2) + "deg)";
      }
      requestAnimationFrame(tick);
    })(0);
  }

  var video = document.getElementById("player-video");
  var title = document.getElementById("player-title");
  var note = document.getElementById("player-note");
  var closeBtn = document.getElementById("player-close");
  var filmOpener = null;

  function openFilm(button) {
    if (!player || !video) return;
    filmOpener = button;
    title.textContent = button.getAttribute("data-title") || "";
    if (note) note.textContent = button.getAttribute("data-note") || "";
    video.poster = button.getAttribute("data-poster") || "";
    video.src = button.getAttribute("data-src") || "";
    player.hidden = false;
    document.body.classList.add("is-playing");
    behind(true);
    if (settingsEl) settingsEl.inert = true;
    video.play().catch(function () {});
    if (closeBtn) closeBtn.focus();
  }
  function closeFilm() {
    if (!player || player.hidden) return;
    video.pause();
    player.hidden = true;
    document.body.classList.remove("is-playing");
    behind(false);
    if (settingsEl && settingsEl.hidden) settingsEl.inert = false;
    if (filmOpener) filmOpener.focus();
  }

  document.addEventListener("click", function (event) {
    var film = event.target.closest && event.target.closest("[data-film]");
    if (film) { event.preventDefault(); openFilm(film); return; }
    if (event.target === player || event.target === closeBtn) closeFilm();
  });

  document.querySelectorAll("[data-order]").forEach(function (button) {
    button.addEventListener("click", function () {
      var sell = document.getElementById("brief-sell");
      var budget = document.getElementById("brief-budget");
      if (sell) sell.value = button.getAttribute("data-order") || "";
      if (budget) budget.value = button.getAttribute("data-budget") || "";
      var contact = document.getElementById("contact");
      if (contact) contact.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var name = document.getElementById("brief-name");
      setTimeout(function () { if (name) name.focus(); }, reduce ? 0 : 300);
    });
  });

  function items(rootEl) {
    return Array.prototype.filter.call(
      rootEl.querySelectorAll("button, [href], input, select, textarea, video"),
      function (el) { return !el.disabled && !el.closest("[hidden]"); }
    );
  }
  function trap(box, event) {
    if (event.key !== "Tab" || box.hidden) return;
    var list = items(box);
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  var menuToggle = document.getElementById("menu-toggle");
  var menuPanel = document.getElementById("menu-panel");
  function closeMenu() {
    if (!menuPanel) return;
    menuPanel.classList.remove("is-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function () {
      var open = menuPanel.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", open);
    });
    menuPanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  function openSettings() {
    if (!done && entry && !entry.hidden) finishEntry();
    closeMenu();
    opener = document.getElementById("settings-open");
    settingsEl.hidden = false;
    settingsEl.inert = false;
    if (page) page.inert = false;
    if (opener) opener.setAttribute("aria-expanded", "true");
    var close = document.getElementById("settings-close");
    if (close) close.focus();
  }
  function closeSettings() {
    if (!settingsEl || settingsEl.hidden) return;
    settingsEl.hidden = true;
    if (opener) { opener.setAttribute("aria-expanded", "false"); opener.focus(); }
  }
  var openBtn = document.getElementById("settings-open");
  if (openBtn) openBtn.addEventListener("click", openSettings);
  var shut = document.getElementById("settings-close");
  if (shut) shut.addEventListener("click", closeSettings);
  if (settingsEl) {
    settingsEl.addEventListener("click", function (event) { if (event.target === settingsEl) closeSettings(); });
    settingsEl.addEventListener("keydown", function (event) { trap(settingsEl, event); });
    settingsEl.addEventListener("change", function () {
      function val(name) {
        var el = settingsEl.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : "";
      }
      var next = {
        theme: val("theme") || "cinema",
        motion: val("motion") || "auto",
        size: val("size") || "m",
        contrast: val("contrast") || "standard",
        cursor: val("cursor") || "studio",
        grain: val("grain") || "on",
        camera: val("camera") || "on",
        lang: "en"
      };
      write(next);
      reduce = apply(next);
    });
  }
  if (player) player.addEventListener("keydown", function (event) { trap(player, event); });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (menuPanel && menuPanel.classList.contains("is-open")) { closeMenu(); return; }
    if (settingsEl && !settingsEl.hidden) { event.preventDefault(); closeSettings(); return; }
    if (player && !player.hidden) { closeFilm(); return; }
    if (!done) finishEntry();
  });

  (function sync() {
    var prefs = read();
    function pick(name, value) {
      var el = document.querySelector('#settings input[name="' + name + '"][value="' + value + '"]');
      if (el) el.checked = true;
    }
    pick("theme", prefs.theme || "cinema");
    pick("motion", prefs.motion || "auto");
    pick("size", prefs.size || "m");
    pick("contrast", prefs.contrast || "standard");
    pick("cursor", prefs.cursor || "studio");
    pick("grain", prefs.grain || "on");
    pick("camera", prefs.camera || (root.getAttribute("data-camera") === "on" ? "on" : "off"));
    pick("lang", "en");
  })();

  matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
    if (read().theme === "system") reduce = apply(read());
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function () {
    var motion = read().motion;
    if (!motion || motion === "auto") reduce = apply(read());
  });

  var form = document.getElementById("brief-form");
  var status = document.getElementById("form-status");
  if (!form) return;
  function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function mark(input, message) {
    var err = document.getElementById(input.id + "-error");
    if (message) { input.setAttribute("aria-invalid", "true"); if (err) err.textContent = message; }
    else { input.removeAttribute("aria-invalid"); if (err) err.textContent = ""; }
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = clean(document.getElementById("brief-name").value);
    var business = clean(document.getElementById("brief-business").value);
    var place = clean(document.getElementById("brief-location").value);
    var sell = clean(document.getElementById("brief-sell").value);
    var budget = clean(document.getElementById("brief-budget").value);
    document.getElementById("brief-name").value = name;
    document.getElementById("brief-business").value = business;
    document.getElementById("brief-location").value = place;
    document.getElementById("brief-sell").value = sell;
    document.getElementById("brief-budget").value = budget;
    var bad = false;
    var nameEl = document.getElementById("brief-name");
    var businessEl = document.getElementById("brief-business");
    var placeEl = document.getElementById("brief-location");
    var sellEl = document.getElementById("brief-sell");
    if (!name) { mark(nameEl, "Enter your name."); bad = true; } else mark(nameEl, "");
    if (!business) { mark(businessEl, "Enter the business name."); bad = true; } else mark(businessEl, "");
    if (!place) { mark(placeEl, "Enter the location."); bad = true; } else mark(placeEl, "");
    if (!sell) { mark(sellEl, "Say what you sell."); bad = true; } else mark(sellEl, "");
    if (bad) {
      if (status) status.textContent = "Add the missing lines, then send.";
      if (!name) nameEl.focus();
      else if (!business) businessEl.focus();
      else if (!place) placeEl.focus();
      else sellEl.focus();
      return;
    }
    var text = [
      "Hi NĀMITRA, I want an ad for my business.",
      "Business: " + business,
      "Location: " + place,
      "What I sell: " + sell,
      "Budget: " + budget,
      "Name: " + name
    ].join("\n");
    var url = "https://wa.me/919703556947?text=" + encodeURIComponent(text);
    if (status) {
      status.textContent = "";
      var ready = document.createElement("a");
      ready.href = url; ready.target = "_blank"; ready.rel = "noopener noreferrer";
      ready.setAttribute("aria-label", "WhatsApp brief is ready, opens WhatsApp");
      ready.textContent = "WhatsApp brief is ready.";
      status.appendChild(ready);
    }
    if (matchMedia("(pointer: coarse)").matches) { window.location.href = url; return; }
    var opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    else window.location.href = url;
  });

  var rises = document.querySelectorAll(".rise");
  if (reduce || !("IntersectionObserver" in window)) {
    rises.forEach(function (node) { node.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rises.forEach(function (node) { io.observe(node); });
  }

  var stage = document.getElementById("stage");
  var sculpture = document.querySelector(".sculpture");
  if (stage && sculpture && window.THREE) {
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: stage, alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      var scene = new THREE.Scene();
      var cam3 = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
      cam3.position.set(0, 0.15, 8.4);
      var goldMat = new THREE.MeshStandardMaterial({ color: 0xE8D5A3, metalness: 0.72, roughness: 0.28 });
      var darkMat = new THREE.MeshStandardMaterial({ color: 0x14080C, metalness: 0.5, roughness: 0.4 });
      var group = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.75, 1.45), goldMat);
      group.add(body);
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 0.85, 40), darkMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(-0.35, 0.02, 1.05);
      group.add(lens);
      var bezel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.055, 14, 40), goldMat);
      bezel.position.set(-0.35, 0.02, 1.42);
      group.add(bezel);
      var glass = new THREE.Mesh(new THREE.CircleGeometry(0.36, 28), new THREE.MeshStandardMaterial({ color: 0x0B0708, metalness: 0.85, roughness: 0.12 }));
      glass.position.set(-0.35, 0.02, 1.48);
      group.add(glass);
      var top = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 0.85), goldMat);
      top.position.set(-0.15, 1.02, 0);
      group.add(top);
      var finder = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.28), darkMat);
      finder.position.set(0.85, 0.15, 0.78);
      group.add(finder);
      var foot = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.85), goldMat);
      foot.position.set(0, -1.55, 0);
      group.add(foot);
      var neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.62, 0.32), new THREE.MeshStandardMaterial({ color: 0x6B1322, metalness: 0.3, roughness: 0.5 }));
      neck.position.set(0, -1.15, 0);
      group.add(neck);
      scene.add(group);
      scene.add(new THREE.AmbientLight(0xfff6e4, 0.55));
      var keyLight = new THREE.DirectionalLight(0xfff3d2, 1.25);
      keyLight.position.set(4, 5, 6);
      scene.add(keyLight);
      var fill = new THREE.DirectionalLight(0x6B1322, 0.35);
      fill.position.set(-4, 1, 2);
      scene.add(fill);
      sculpture.classList.add("is-webgl");
      var webglOn = true;
      var aimX = 0, aimY = 0, curX = 0, curY = 0;
      function fit() {
        var w = stage.clientWidth || 420;
        var h = stage.clientHeight || 280;
        renderer.setSize(w, h, false);
        cam3.aspect = w / h;
        cam3.updateProjectionMatrix();
      }
      fit();
      window.addEventListener("resize", fit);
      if (fine) {
        window.addEventListener("pointermove", function (event) {
          aimX = (event.clientX / window.innerWidth - 0.5) * 0.7;
          aimY = (event.clientY / window.innerHeight - 0.5) * -0.35;
        }, { passive: true });
      }
      (function draw(now) {
        var on = root.getAttribute("data-camera") === "on" && root.getAttribute("data-motion") !== "reduced";
        if (on !== webglOn) {
          webglOn = on;
          sculpture.classList.toggle("is-webgl", on);
        }
        if (!on) { requestAnimationFrame(draw); return; }
        if (fine) {
          curX += (aimX - curX) * 0.06;
          curY += (aimY - curY) * 0.06;
        } else {
          curX = Math.sin(now * 0.00035) * 0.35;
          curY = 0.08;
        }
        group.rotation.y = curX;
        group.rotation.x = 0.08 + curY;
        renderer.render(scene, cam3);
        requestAnimationFrame(draw);
      })(0);
    } catch (err) {
      sculpture.classList.remove("is-webgl");
    }
  }
})();
