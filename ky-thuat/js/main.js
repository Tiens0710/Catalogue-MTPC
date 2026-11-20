/* ============================================================
   CATALOGUE MTPC — điều khiển sách lật trang
   Desktop xoay một tờ giấy hai mặt quanh gáy. Mobile lật từng
   mặt trang để chuyển động nhất quán trên màn hình hẹp.
   ============================================================ */
(function () {
  "use strict";

  var book = document.getElementById("book");
  var sheets = Array.prototype.slice.call(book.querySelectorAll(".sheet"));
  var indicator = document.getElementById("indicator");
  var hint = document.getElementById("hint");
  var btnFirst = document.getElementById("btnFirst");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var btnLast = document.getElementById("btnLast");
  var btnFs = document.getElementById("btnFs");
  var pages = sheets.flatMap(function (sheet) {
    return Array.from(sheet.querySelectorAll(".face"));
  });

  var N = sheets.length;          // số tờ giấy
  var TOTAL = N * 2;              // số trang (mặt)
  var flipped = 0;                // số tờ đã lật (chế độ 2 trang)
  var page = 1;                   // trang hiện tại (chế độ 1 trang)
  var animating = false;
  var hasFlipped = false;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DURATION = 680;                         // ms

  var CAST_MAX = .52;       // bóng của tờ đang lật đổ xuống trang bên dưới

  var mqMobile = window.matchMedia("(max-width: 899px)");
  function isSingle() { return mqMobile.matches; }

  /* ---------- Bóng đổ xuống trang bên dưới ---------- */
  var castL = document.createElement("div");
  var castR = document.createElement("div");
  castL.className = "cast cast-left";
  castR.className = "cast cast-right";
  castL.style.zIndex = castR.style.zIndex = N + 2;
  book.insertBefore(castL, book.querySelector(".zone-left"));
  book.insertBefore(castR, book.querySelector(".zone-left"));

  function hideCast() {
    castL.style.opacity = castR.style.opacity = "";
  }

  /* ---------- Tờ lật (leaf) ---------- */
  function cloneFace(face) {
    var c = face.cloneNode(true);
    c.inert = true;
    Array.prototype.forEach.call(c.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    c.removeAttribute("id");
    return c;
  }

  var leaves = [];
  var PANEL_COUNT = 3;
  function getLeaf(sheet) {
    var i = sheets.indexOf(sheet);
    if (!leaves[i]) {
      var cover = i === 0 ? -1 : i === N - 1 ? 1 : 0;
      var panelCount = cover ? 1 : PANEL_COUNT;
      var el = document.createElement("div");
      el.className = "leaf";
      el.classList.toggle("hardcover-leaf", Boolean(cover));
      el.style.zIndex = N + 3;
      el.style.setProperty("--leaf-width", book.clientWidth / 2 + "px");
      el.style.setProperty("--leaf-panels", panelCount);
      var sourceFaces = Array.from(sheet.querySelectorAll(".face"));
      var panels = [];
      var copies = [];
      var parent = el;
      for (var index = 0; index < panelCount; index++) {
        var panel = document.createElement("div");
        panel.className = "leaf-panel";
        sourceFaces.forEach(function (face, side) {
          var surface = document.createElement("div");
          surface.className = "leaf-surface " + (side ? "back" : "front");
          var column = side ? panelCount - index - 1 : index;
          var copy = cloneFace(face);
          surface.style.setProperty("--column", column);
          surface.appendChild(copy);
          panel.appendChild(surface);
          copies.push({ source: face, element: copy });
        });
        parent.appendChild(panel);
        panels.push(panel);
        parent = panel;
      }
      el.style.display = "none";
      book.insertBefore(el, book.querySelector(".zone-left"));
      leaves[i] = { el: el, panels: panels, copies: copies, cover: cover };
    }
    return leaves[i];
  }
  var pendingClear = false;
  function clearLeaves() {
    if (animating) { pendingClear = true; return; }   // đang lật — hoãn tới khi xong
    pendingClear = false;
    leaves.forEach(function (l) { if (l && l.el.parentNode) l.el.parentNode.removeChild(l.el); });
    leaves = [];
    schedulePrefetch();
  }

  // theta: 0 = trang nằm bên phải (chưa lật) · 180 = đã lật sang trái
  function setLeaf(lf, theta) {
    var rad = theta * Math.PI / 180;
    var lift = Math.sin(rad);
    var side = Math.cos(rad);
    if (lf.cover) {
      lf.panels[0].style.transform = "rotateY(" + (-theta) + "deg)";

      // Chỉ mở phần đế nằm dưới hình chiếu của bìa đang lật.
      var reveal = Math.max(0, lf.cover * side);
      var missing = 1 - ease(reveal);
      book.style.setProperty("--cover-offset", (lf.cover * 25 * missing) + "%");
      book.style.setProperty("--cover-tilt", (lf.cover * 4 * missing) + "deg");
      book.style.setProperty("--cover-reveal", (100 * reveal) + "%");
    } else {
      // Mép ngoài gập nhiều hơn phần gần gáy, rồi tờ giấy phẳng dần khi hạ xuống.
      var curl = 34 * Math.pow(lift, .85);
      lf.panels[0].style.transform = "rotateY(" + (-theta + .42 * curl) + "deg)";
      lf.panels[1].style.transform = "rotateY(" + (-.36 * curl) + "deg)";
      lf.panels[2].style.transform = "rotateY(" + (-.64 * curl) + "deg)";
    }
    lf.el.style.setProperty("--fold-light", lift * (lf.cover ? .65 : 1));

    // Hai bóng giao nhau ở gáy để độ sáng không đổi đột ngột giữa cú lật.
    var cast = CAST_MAX * lift;
    castR.style.opacity = cast * (1 + side) / 2;
    castL.style.opacity = cast * (1 - side) / 2;
  }

  function ease(p) {
    return p * p * (3 - 2 * p);
  }

  /* Dựng sẵn tờ lật khi rảnh (tránh khựng lúc bấm lật) */
  var idleTimer = null;
  function schedulePrefetch() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () {
      if (animating || isSingle() || reduceMotion) return;
      [flipped, flipped - 1].forEach(function (i) { if (i >= 0 && i < N) getLeaf(sheets[i]); });
    }, 120);
  }
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(clearLeaves, 250);
  });

  function runTurn(sheet, from, to, toFlipped, done) {
    if (reduceMotion) { done(); return; }
    var lf = getLeaf(sheet);
    var coverClass = lf.cover < 0 ? "cover-turn-front" : "cover-turn-back";
    if (lf.cover) book.classList.add("cover-turn", coverClass);
    setLeaf(lf, from);
    lf.el.style.display = "block";
    lf.copies.forEach(function (copy) {
      copy.element.scrollTop = copy.source.scrollTop;
    });
    sheet.style.visibility = "hidden";

    // Chờ đúng 1 khung hình để trình duyệt raster tờ lật ở thế phẳng
    // (giống hệt trang thật) TRƯỚC khi bắt đầu xoay — khỏi khựng đầu cú lật.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(step);
    });

    var t0 = null;
    var finished = false;
    // Bảo hiểm: nếu rAF bị ngưng giữa chừng (tab bị ẩn, máy quá tải),
    // vẫn phải kết thúc cú lật đúng trạng thái — không để trang kẹt lơ lửng.
    var guard = window.setTimeout(finish, DURATION * 3 + 1200);
    function finish() {
      if (finished) return;
      finished = true;
      window.clearTimeout(guard);
      sheet.classList.add("no-anim");
      sheet.classList.toggle("flipped", toFlipped);
      void sheet.offsetWidth;
      sheet.classList.remove("no-anim");
      sheet.style.visibility = "";
      lf.el.style.display = "none";
      hideCast();
      done();
      if (lf.cover) {
        book.classList.remove("cover-turn", coverClass);
        book.style.removeProperty("--cover-offset");
        book.style.removeProperty("--cover-tilt");
        book.style.removeProperty("--cover-reveal");
      }
    }
    function step(ts) {
      if (finished) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / DURATION);
      setLeaf(lf, from + (to - from) * ease(p));
      if (p < 1) { window.requestAnimationFrame(step); return; }
      finish();
    }
  }

  /* ---------- Cập nhật giao diện ---------- */
  function update() {
    if (pendingClear) clearLeaves();   // dọn tờ lật bị hoãn (animating đã false)
    var single = isSingle();
    if (single !== book.classList.contains("single")) {
      if (single) page = Math.max(1, flipped * 2);
      else flipped = Math.floor(page / 2);
    }
    book.classList.toggle("single", single);
    book.classList.toggle("at-start", !single && flipped === 0);
    book.classList.toggle("at-end", !single && flipped === N);

    sheets.forEach(function (s, i) {
      var isFlipped = single ? (i < Math.floor(page / 2)) : (i < flipped);
      s.classList.toggle("flipped", isFlipped);
      s.style.zIndex = isFlipped ? (i + 1) : (N - i);

      if (single) {
        var active = i === Math.floor((page - 1) / 2);
        s.classList.toggle("active", active);
        s.classList.toggle("show-back", active && page % 2 === 0);
      } else {
        s.classList.remove("active", "show-back");
      }
    });

    // Chỉ số trang
    var label;
    if (single) {
      label = page + " / " + TOTAL;
    } else if (flipped === 0) {
      label = "1 / " + TOTAL;
    } else if (flipped === N) {
      label = TOTAL + " / " + TOTAL;
    } else {
      label = (flipped * 2) + "–" + (flipped * 2 + 1) + " / " + TOTAL;
    }
    indicator.textContent = label;

    // Trạng thái nút
    var atStart = single ? page <= 1 : flipped <= 0;
    var atEnd = single ? page >= TOTAL : flipped >= N;
    var firstVisible = single ? page : Math.max(1, flipped * 2);
    var lastVisible = single || atStart || atEnd ? firstVisible : firstVisible + 1;
    pages.forEach(function (face, i) {
      var visible = i + 1 >= firstVisible && i + 1 <= lastVisible;
      if (!visible && !face.inert) face.scrollTop = 0;
      face.inert = !visible;
    });
    btnFirst.disabled = atStart;
    btnPrev.disabled = atStart;
    btnNext.disabled = atEnd;
    btnLast.disabled = atEnd;

    // Gợi ý lật trang
    hint.hidden = hasFlipped || !atStart;
    schedulePrefetch();
  }

  /* ---------- Lật có hoạt ảnh ---------- */
  function next() {
    if (animating) return;
    if (isSingle()) {
      if (page >= TOTAL) return;
      singleTurn(1);
      return;
    }
    if (flipped >= N) return;
    animating = true;
    hasFlipped = true;
    runTurn(sheets[flipped], 0, 180, true, function () {
      flipped++;
      animating = false;
      update();
    });
  }

  function prev() {
    if (animating) return;
    if (isSingle()) {
      if (page <= 1) return;
      singleTurn(-1);
      return;
    }
    if (flipped <= 0) return;
    animating = true;
    runTurn(sheets[flipped - 1], 180, 0, false, function () {
      flipped--;
      animating = false;
      update();
    });
  }

  /* ---------- Lật trang ở chế độ 1 trang (mobile) ---------- */
  var underFlip = null;
  function makeUnder(face) {
    if (!underFlip) {
      underFlip = document.createElement("div");
      underFlip.className = "under-flip";
      underFlip.style.zIndex = N + 1;
      book.insertBefore(underFlip, book.querySelector(".zone-left"));
    }
    underFlip.innerHTML = "";
    var copy = cloneFace(face);
    underFlip.appendChild(copy);
    underFlip.style.display = "block";
    copy.scrollTop = face.scrollTop;
  }

  function curlFrames() {
    var frames = { page: [], fold: [], shadow: [] };
    for (var step = 0; step <= 20; step++) {
      var progress = step / 20;
      var lift = Math.sin(Math.PI * progress);
      var edge = 110 - 137 * progress;
      var lip = 15 * lift;
      var line = Array.from({ length: 11 }, function (_, i) {
        var y = i * 10;
        var bow = 7 * Math.sin(Math.PI * i / 10);
        return [edge + (bow + .18 * (50 - y)) * lift, y];
      });
      var points = function (amount) {
        return line.map(function (point) {
          return (point[0] + amount).toFixed(2) + "% " + point[1] + "%";
        });
      };
      var edgePoints = points(0);
      frames.page.push({ clipPath: "polygon(0% 0%, " + edgePoints.join(", ") + ", 0% 100%)" });
      frames.fold.push({
        clipPath: "polygon(" + edgePoints.concat(points(-lip).reverse()).join(", ") + ")",
        backgroundPosition: ((edge - lip - 6) / .68) + "% 0%",
        opacity: Math.min(1, lift * 4)
      });
      frames.shadow.push({
        clipPath: "polygon(" + edgePoints.concat(points(5 * lift).reverse()).join(", ") + ")",
        opacity: .22 * lift
      });
    }
    return frames;
  }

  var mobileCurl = curlFrames();

  function singleTurn(delta) {
    var target = page + delta;
    hasFlipped = true;
    if (reduceMotion || !book.animate) {
      page = target;
      update();
      return;
    }

    animating = true;
    var movingFace = pages[(delta > 0 ? page : target) - 1];
    makeUnder(pages[(delta > 0 ? target : page) - 1]);

    var layer = document.createElement("div");
    layer.className = "single-turn";
    var copy = cloneFace(movingFace);
    var shadow = document.createElement("div");
    shadow.className = "single-turn-shadow";
    var fold = document.createElement("div");
    fold.className = "single-turn-fold";
    layer.append(copy, shadow, fold);
    book.insertBefore(layer, underFlip);
    copy.scrollTop = movingFace.scrollTop;

    var timing = { duration: 560, easing: "cubic-bezier(.4, .05, .32, 1)",
      direction: delta > 0 ? "normal" : "reverse", fill: "both" };
    fold.animate(mobileCurl.fold, timing);
    shadow.animate(mobileCurl.shadow, timing);
    var turn = copy.animate(mobileCurl.page, timing);
    turn.onfinish = function () {
      layer.remove();
      underFlip.style.display = "none";
      underFlip.replaceChildren();
      page = target;
      animating = false;
      update();
    };
  }

  /* ---------- Nhảy nhanh (không hoạt ảnh) ---------- */
  function jumpToSheet(targetFlipped) {
    if (animating) return;
    targetFlipped = Math.max(0, Math.min(N, targetFlipped));
    if (targetFlipped === flipped) return;
    sheets.forEach(function (s) { s.classList.add("no-anim"); });
    flipped = targetFlipped;
    page = Math.max(1, flipped * 2);
    update();
    void book.offsetWidth;
    sheets.forEach(function (s) { s.classList.remove("no-anim"); });
  }

  function first() {
    if (animating) return;
    if (isSingle()) { page = 1; update(); } else { jumpToSheet(0); }
  }
  function last() {
    if (animating) return;
    if (isSingle()) { page = TOTAL; hasFlipped = true; update(); }
    else { jumpToSheet(N); hasFlipped = true; update(); }
  }

  /* ---------- Chuyển giữa 2 trang / 1 trang khi đổi cỡ màn ---------- */
  function syncMode() {
    if (!animating) update();
  }
  mqMobile.addEventListener ? mqMobile.addEventListener("change", syncMode)
                            : mqMobile.addListener(syncMode);

  /* ---------- Sự kiện ---------- */
  // Hai nút .zone chỉ còn là mốc chèn lớp (pointer-events: none trong CSS).
  // Chia trái/phải ngay trên .book, và bỏ qua những bấm vào form/link/nút.
  var INTERACTIVE = "a, input, select, textarea, button, label, form";

  book.addEventListener("click", function (e) {
    if (e.target.closest(INTERACTIVE)) return;                 // bấm form/link thì không lật
    if (window.getSelection().toString()) return;              // đang bôi đen chữ thì không lật
    var r = book.getBoundingClientRect();
    (e.clientX - r.left < r.width / 2) ? prev() : next();
  });

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);
  btnFirst.addEventListener("click", first);
  btnLast.addEventListener("click", last);

  btnFs.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });

  // iOS Safari không có Fullscreen API — ẩn nút thay vì để nút chết
  if (!document.fullscreenEnabled) {
    btnFs.style.display = "none";
    if (btnFs.previousElementSibling) btnFs.previousElementSibling.style.display = "none"; // vạch ngăn .tb-sep
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, select, textarea, [contenteditable]")) return;
    if (e.key === " " && e.target.closest("button, a")) return;   // Space đang bấm nút thanh công cụ
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault(); next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault(); prev();
    } else if (e.key === "Home") { first();
    } else if (e.key === "End") { last(); }
  });

  // Vuốt trên màn cảm ứng — bỏ qua khi người dùng đang cuộn dọc
  var touchX = null, touchY = null;
  book.addEventListener("touchstart", function (e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  book.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); }
    touchX = touchY = null;
  }, { passive: true });

  // Mục lục và các liên kết chuyển đến một trang cụ thể.
  book.querySelectorAll("[data-goto]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      if (animating) return;
      if (link.classList.contains("cover-open")) { next(); return; }
      var target = Number(link.dataset.goto);
      if (isSingle()) { page = target; hasFlipped = true; update(); }
      else { jumpToSheet(Math.floor(target / 2)); hasFlipped = true; update(); }
      var destination = pages[target - 1];
      destination.scrollTop = 0;
      var heading = destination.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  });

  /* ---------- Ảnh thật: tự động thay placeholder nếu có file ---------- */
  var imgTimer = null;
  document.querySelectorAll(".ph[data-img]").forEach(function (el) {
    var src = el.getAttribute("data-img");
    if (!el.getAttribute("data-label") && src) {
      el.setAttribute("data-label", src.split("/").pop());
    }
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = "url('" + src + "')";
      el.classList.add("has-img");
      window.clearTimeout(imgTimer);
      imgTimer = window.setTimeout(clearLeaves, 400);
    };
    img.src = src;
  });

  /* ---------- Form đăng ký tư vấn ---------- */
  // ENDPOINT: URL Google Apps Script (hoặc Formspree). Khi chưa thay URL thật
  // (vẫn còn "XXXXXXXX"), form không gửi đi mà hiện lời nhắn gọi hotline.
  var ENDPOINT = "https://script.google.com/macros/s/XXXXXXXX/exec";
  var regForm = document.getElementById("regForm");
  var regMsg = document.getElementById("regMsg");
  if (regForm && regMsg) {
    regForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!regForm.reportValidity()) return;
      var btn = regForm.querySelector("button[type=submit]");
      if (/XXXXXXXX/.test(ENDPOINT)) {
        regMsg.textContent = "Gửi trực tuyến chưa kích hoạt — vui lòng gọi 0934 790 790.";
        return;
      }
      btn.disabled = true; regMsg.textContent = "Đang gửi…";
      fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(new FormData(regForm)) })
        .then(function () { regMsg.textContent = "Đã nhận thông tin. Nhà trường sẽ liên hệ sớm!"; regForm.reset(); })
        .catch(function () { regMsg.textContent = "Chưa gửi được, vui lòng gọi 0934 790 790."; })
        .then(function () { btn.disabled = false; });
    });
  }

  update();
})();
