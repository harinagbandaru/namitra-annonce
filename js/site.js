(function () {
  var root = document.documentElement;
  var prefsKey = "namitra-prefs";

  function readPrefs() {
    try { return JSON.parse(localStorage.getItem(prefsKey) || "{}") || {}; }
    catch (e) { return {}; }
  }

  function writePrefs(prefs) {
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }

  function reducedNow(prefs) {
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
    var reduce = reducedNow(prefs);
    root.setAttribute("data-motion", reduce ? "reduced" : "full");
    root.setAttribute("data-size", prefs.size || "m");
    root.setAttribute("data-grain", (prefs.grain === "off" || reduce) ? "off" : "on");
    root.setAttribute("data-cursor", prefs.cursor === "system" ? "system" : "studio");
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var cameraOn;
    if (reduce) cameraOn = false;
    else if (prefs.camera === "off") cameraOn = false;
    else if (prefs.camera === "on") cameraOn = true;
    else cameraOn = !coarse;
    root.setAttribute("data-camera", cameraOn ? "on" : "off");
    return reduce;
  }

  var reduce = applyPrefs(readPrefs());
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var entry = document.getElementById("entry");
  var page = document.getElementById("page");
  var skip = document.getElementById("skip-entry");
  var hero = document.getElementById("hero");
  var settingsEl = document.getElementById("settings");
  var orderBar = document.querySelector(".order-bar");
  var done = false;
  var timer = 0;
  var settingsOpener = null;

  function lockPage(locked) {
    if (page) page.inert = locked;
    if (settingsEl && settingsEl.hidden) settingsEl.inert = locked;
    if (orderBar) orderBar.inert = locked;
  }

  function finishEntry() {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    document.body.classList.remove("is-entering");
    lockPage(false);
    if (!entry) {
      if (hero) hero.focus();
      return;
    }
    entry.classList.add("is-leaving");
    entry.setAttribute("aria-hidden", "true");
    entry.inert = true;
    window.setTimeout(function () {
      entry.hidden = true;
      entry.dataset.diedAt = String(Math.round(performance.now()));
    }, reduce ? 0 : 360);
    if (hero) hero.focus();
  }

  if (reduce) {
    if (entry) {
      entry.hidden = true;
      entry.inert = true;
      entry.setAttribute("aria-hidden", "true");
    }
    lockPage(false);
  } else if (entry && page) {
    document.body.classList.add("is-entering");
    lockPage(true);
    if (settingsEl) settingsEl.inert = true;
    entry.dataset.armedAt = String(Math.round(performance.now()));
    timer = window.setTimeout(finishEntry, 2100);
    if (skip) {
      skip.addEventListener("click", finishEntry);
      skip.focus();
    }
    entry.addEventListener("keydown", function (event) {
      if (event.key === "Tab") {
        event.preventDefault();
        if (skip) skip.focus();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (settingsEl && !settingsEl.hidden) {
      event.preventDefault();
      closeSettings();
      return;
    }
    if (player && !player.hidden) {
      closeFilm();
      return;
    }
    if (!done) finishEntry();
  });

  var reveals = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }
  window.setTimeout(function () {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }, 5000);

  var cursor = document.getElementById("cursor");
  function studioCursor() {
    return fine && root.getAttribute("data-cursor") !== "system";
  }
  if (cursor) {
    if (studioCursor()) document.body.classList.add("use-cursor");
    window.addEventListener("mousemove", function (event) {
      if (!studioCursor()) {
        document.body.classList.remove("use-cursor");
        cursor.classList.remove("is-on");
        return;
      }
      document.body.classList.add("use-cursor");
      cursor.style.transform = "translate3d(" + event.clientX + "px," + event.clientY + "px,0)";
      cursor.classList.add("is-on");
      var target = event.target;
      var typing = target.closest && target.closest("input, textarea, .player, .settings");
      var hot = !typing && target.closest && target.closest("a, button");
      cursor.classList.toggle("is-hidden", Boolean(typing));
      cursor.classList.toggle("is-hot", Boolean(hot));
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      cursor.classList.remove("is-on");
    });
  }

  var rig = document.getElementById("rig");
  if (rig) {
    var tx = 0;
    var ty = 0;
    var cx = 0;
    var cy = 0;
    if (fine) {
      window.addEventListener("pointermove", function (event) {
        if (root.getAttribute("data-motion") === "reduced") return;
        if (root.getAttribute("data-camera") === "off") return;
        tx = (event.clientX / window.innerWidth - 0.5) * 20;
        ty = (event.clientY / window.innerHeight - 0.5) * -12;
      }, { passive: true });
    }
    function tick(now) {
      if (root.getAttribute("data-camera") === "off" || root.getAttribute("data-motion") === "reduced") {
        rig.style.transform = "none";
        window.requestAnimationFrame(tick);
        return;
      }
      if (fine) {
        cx += (tx - cx) * 0.075;
        cy += (ty - cy) * 0.075;
        rig.style.transform = "rotateX(" + (7 + cy).toFixed(3) + "deg) rotateY(" + cx.toFixed(3) + "deg)";
      } else {
        cx = Math.sin(now * 0.00045) * 4.5;
        rig.style.transform = "rotateX(7deg) rotateY(" + cx.toFixed(3) + "deg)";
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  var player = document.getElementById("player");
  var playerVideo = document.getElementById("player-video");
  var playerTitle = document.getElementById("player-title");
  var playerClose = document.getElementById("player-close");
  var filmOpener = null;

  function openFilm(button) {
    if (!player || !playerVideo) return;
    filmOpener = button;
    playerTitle.textContent = button.getAttribute("data-title") || "";
    playerVideo.poster = button.getAttribute("data-poster") || "";
    playerVideo.src = button.getAttribute("data-src") || "";
    player.hidden = false;
    document.body.classList.add("is-playing");
    playerVideo.play().catch(function () {});
    if (playerClose) playerClose.focus();
  }

  function closeFilm() {
    if (!player || !playerVideo || player.hidden) return;
    playerVideo.pause();
    player.hidden = true;
    document.body.classList.remove("is-playing");
    if (filmOpener) filmOpener.focus();
  }

  document.addEventListener("click", function (event) {
    var film = event.target.closest && event.target.closest("[data-film]");
    if (film) {
      event.preventDefault();
      openFilm(film);
      return;
    }
    if (event.target === player || event.target === playerClose) closeFilm();
  });

  document.querySelectorAll("[data-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      var format = button.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (peer) {
        peer.setAttribute("aria-pressed", peer === button ? "true" : "false");
      });
      document.querySelectorAll(".cut").forEach(function (cut) {
        var show = format === "all" || cut.getAttribute("data-format") === format;
        cut.classList.toggle("is-hidden", !show);
      });
    });
  });

  document.querySelectorAll("[data-order]").forEach(function (button) {
    button.addEventListener("click", function () {
      var line = document.getElementById("brief-line");
      if (line) {
        line.value = button.getAttribute("data-order") || "";
        line.removeAttribute("aria-invalid");
      }
      var contact = document.getElementById("contact");
      if (contact) contact.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var name = document.getElementById("brief-name");
      if (name) window.setTimeout(function () { name.focus(); }, reduce ? 0 : 350);
    });
  });

  if (orderBar && "IntersectionObserver" in window) {
    var barWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        orderBar.classList.toggle("is-hidden", en.isIntersecting);
      });
    });
    var contactEl = document.getElementById("contact");
    if (contactEl) barWatch.observe(contactEl);
  }

  function focusable(rootEl) {
    return Array.prototype.filter.call(
      rootEl.querySelectorAll("button, [href], input, select, textarea"),
      function (el) { return !el.disabled && !el.hidden; }
    );
  }

  function openSettings() {
    if (!settingsEl) return;
    settingsOpener = document.getElementById("settings-open");
    settingsEl.hidden = false;
    settingsEl.inert = false;
    if (settingsOpener) settingsOpener.setAttribute("aria-expanded", "true");
    var closeBtn = document.getElementById("settings-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeSettings() {
    if (!settingsEl || settingsEl.hidden) return;
    settingsEl.hidden = true;
    var opener = settingsOpener || document.getElementById("settings-open");
    if (opener) {
      opener.setAttribute("aria-expanded", "false");
      opener.focus();
    }
  }

  var settingsOpenBtn = document.getElementById("settings-open");
  if (settingsOpenBtn) settingsOpenBtn.addEventListener("click", openSettings);
  var settingsCloseBtn = document.getElementById("settings-close");
  if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", closeSettings);
  if (settingsEl) {
    settingsEl.addEventListener("click", function (event) {
      if (event.target === settingsEl) closeSettings();
    });
    settingsEl.addEventListener("keydown", function (event) {
      if (event.key !== "Tab" || settingsEl.hidden) return;
      var items = focusable(settingsEl);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    settingsEl.addEventListener("change", function () {
      var next = {
        theme: checked("theme") || "cinema",
        motion: checked("motion") || "auto",
        size: checked("size") || "m",
        contrast: checked("contrast") || "standard",
        cursor: checked("cursor") || "studio",
        grain: checked("grain") || "on",
        camera: checked("camera") || "on",
        lang: "en"
      };
      writePrefs(next);
      reduce = applyPrefs(next);
    });
  }

  function checked(name) {
    var el = document.querySelector('#settings input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function syncSettingsForm() {
    var prefs = readPrefs();
    function pick(name, value) {
      var el = document.querySelector('#settings input[name="' + name + '"][value="' + value + '"]');
      if (el) el.checked = true;
    }
    pick("theme", prefs.theme || "cinema");
    pick("motion", prefs.motion || "auto");
    pick("size", prefs.size || "m");
    pick("contrast", prefs.contrast || (root.getAttribute("data-contrast") === "high" ? "high" : "standard"));
    pick("cursor", prefs.cursor || "studio");
    pick("grain", prefs.grain || "on");
    pick("camera", prefs.camera || (root.getAttribute("data-camera") === "off" ? "off" : "on"));
    pick("lang", "en");
  }
  syncSettingsForm();

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
    if (readPrefs().theme === "system") reduce = applyPrefs(readPrefs());
  });
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function () {
    var motion = readPrefs().motion;
    if (!motion || motion === "auto") reduce = applyPrefs(readPrefs());
  });

  var form = document.getElementById("brief-form");
  var status = document.getElementById("form-status");
  if (!form) return;

  function clean(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function fieldError(input, message) {
    var err = document.getElementById(input.id + "-error");
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (err) err.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      if (err) err.textContent = "";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = clean(form.name.value);
    var area = clean(form.area.value);
    var brief = clean(form.brief.value);
    form.name.value = name;
    form.area.value = area;
    form.brief.value = brief;
    var bad = false;
    if (!name) { fieldError(form.name, "Enter your name."); bad = true; }
    else fieldError(form.name, "");
    if (!area) { fieldError(form.area, "Enter your area of Hyderabad."); bad = true; }
    else fieldError(form.area, "");
    if (!brief) { fieldError(form.brief, "Enter a one-line brief."); bad = true; }
    else fieldError(form.brief, "");
    if (bad) {
      if (status) status.textContent = "Add the missing lines, then send.";
      if (!name) form.name.focus();
      else if (!area) form.area.focus();
      else form.brief.focus();
      return;
    }
    var text = [
      "NĀMITRA Annonce — brief",
      "Name: " + name,
      "Area: " + area,
      "Brief: " + brief
    ].join("\n");
    var url = "https://wa.me/919703556947?text=" + encodeURIComponent(text);
    if (status) {
      status.textContent = "";
      var ready = document.createElement("a");
      ready.className = "link";
      ready.href = url;
      ready.target = "_blank";
      ready.rel = "noopener noreferrer";
      ready.setAttribute("aria-label", "WhatsApp brief is ready, opens WhatsApp");
      ready.textContent = "WhatsApp brief is ready.";
      status.appendChild(ready);
    }
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) {
      window.location.href = url;
      return;
    }
    var opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    else window.location.href = url;
  });
})();
