/* ============================================================
   CATALOGUE MTPC — điều khiển sách lật trang
   Tờ giấy đang lật là một mặt phẳng 3D duy nhất (leaf) mang bản
   sao cả hai mặt, xoay quanh gáy. Độ cong của giấy được gợi bằng
   bóng đổ lên trang bên dưới + dải sáng chạy trên mặt trang,
   thay vì chia nhiều dải dọc (gây vệt sọc và rất nặng khi render).
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

  var N = sheets.length;          // số tờ giấy
  var TOTAL = N * 2;              // số trang (mặt)
  var flipped = 0;                // số tờ đã lật (chế độ 2 trang)
  var page = 1;                   // trang hiện tại (chế độ 1 trang)
  var animating = false;
  var hasFlipped = false;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DURATION = reduceMotion ? 60 : 620;   // ms

  var SHADE_MAX = .46;      // độ tối của mặt trang khi quay cạnh vào trong
  var GLOSS_MAX = .15;      // dải sáng chạy trên mặt trang giữa cú lật
  var EDGE_MAX = .34;       // nét sáng ở mép ngoài của tờ đang lật
  var CAST_MAX = .8;        // bóng của tờ đang lật đổ xuống trang bên dưới

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
    Array.prototype.forEach.call(c.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    c.removeAttribute("id");
    return c;
  }

  var leaves = [];
  function getLeaf(sheet) {
    var i = sheets.indexOf(sheet);
    if (!leaves[i]) {
      var el = document.createElement("div");
      el.className = "leaf";
      el.style.zIndex = N + 3;
      el.appendChild(cloneFace(sheet.querySelector(".face.front")));
      el.appendChild(cloneFace(sheet.querySelector(".face.back")));
      var shF = document.createElement("div"); shF.className = "leaf-shade front";
      var shB = document.createElement("div"); shB.className = "leaf-shade back";
      el.appendChild(shF);
      el.appendChild(shB);
      el.style.display = "none";
      book.insertBefore(el, book.querySelector(".zone-left"));
      leaves[i] = { el: el, shF: shF, shB: shB };
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
    var facing = Math.abs(Math.cos(rad));   // 1 khi trang phẳng, 0 khi quay cạnh
    var s = Math.sin(rad);                  // 0 → 1 → 0 trong suốt cú lật
    lf.el.style.transform = "rotateY(" + (-theta) + "deg)";

    var dark = SHADE_MAX * (1 - facing);
    var gloss = GLOSS_MAX * s;
    var edge = EDGE_MAX * s;
    lf.shF.style.background = shadeGrad(dark, gloss, edge, false);
    lf.shB.style.background = shadeGrad(dark, gloss, edge, true);

    var cast = (CAST_MAX * s).toFixed(3);
    if (theta <= 90) { castR.style.opacity = cast; castL.style.opacity = "0"; }
    else { castL.style.opacity = cast; castR.style.opacity = "0"; }
  }

  // Ba lớp phủ cho một mặt trang, vẽ theo hướng gáy → mép ngoài:
  //   1) tối dần về phía gáy (nơi giấy bị bẻ xuống trang bên dưới)
  //   2) dải sáng broaden giữa trang khi tờ giấy nghiêng về phía người xem
  //   3) nét sáng mảnh sát mép ngoài — nhìn ra là mép giấy, không phải card
  // Mặt sau được gương lại vì bản sao của nó đã xoay 180° trong leaf.
  function shadeGrad(dark, gloss, edge, mirror) {
    var dir = mirror ? "270deg" : "90deg";
    var a = dark.toFixed(3), b = (dark * .5).toFixed(3), c = (dark * .12).toFixed(3);
    var g = gloss.toFixed(3), g2 = (gloss * .3).toFixed(3), e = edge.toFixed(3);
    return "linear-gradient(" + dir + ", rgba(6,22,16," + a + ") 0%, rgba(6,22,16," + b +
      ") 46%, rgba(6,22,16," + c + ") 100%), linear-gradient(" + (mirror ? "100deg" : "80deg") +
      ", rgba(255,255,255,0) 4%, rgba(255,255,255," + g + ") 40%, rgba(255,255,255," + g2 +
      ") 60%, rgba(255,255,255,0) 90%), linear-gradient(" + dir +
      ", rgba(255,255,255,0) 88%, rgba(255,255,255," + e + ") 98%, rgba(255,255,255,0) 100%)";
  }

  /* Trộn smoothstep (giữ đà giữa và cuối cú lật) với ease-out (trang bật
     lên ngay khi bấm) → không còn khoảng trơ ở đầu, cũng không "áp" hẳn
     vào giữa rồi nằm lại quá lâu. */
  function ease(p) {
    return .55 * (p * p * (3 - 2 * p)) + .45 * (1 - Math.pow(1 - p, 1.6));
  }

  /* Dựng sẵn tờ lật khi rảnh (tránh khựng lúc bấm lật) */
  var idleTimer = null;
  function schedulePrefetch() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () {
      if (animating) return;
      if (isSingle()) {
        var s0 = Math.floor((page - 1) / 2);
        [s0 + 1, s0 - 1].forEach(function (i) { if (i >= 0 && i < N) getLeaf(sheets[i]); });
        return;
      }
      [flipped, flipped - 1].forEach(function (i) { if (i >= 0 && i < N) getLeaf(sheets[i]); });
    }, 120);
  }
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(clearLeaves, 250);
  });

  // Mức thấp nhất (prefers-reduced-motion): lật bằng CSS thuần
  function runTurnSimple(sheet, toFlipped, done) {
    sheet.style.zIndex = N + 2;
    sheet.classList.toggle("flipped", toFlipped);
    window.setTimeout(done, DURATION);
  }

  function runTurn(sheet, from, to, toFlipped, done) {
    if (reduceMotion) { runTurnSimple(sheet, toFlipped, done); return; }
    var lf = getLeaf(sheet);
    setLeaf(lf, from);
    lf.el.style.display = "block";
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
    book.classList.toggle("single", single);
    book.classList.toggle("at-start", !single && flipped === 0);
    book.classList.toggle("at-end", !single && flipped === N);
    book.classList.remove("opening");

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
    if (flipped === 0) {
      book.classList.add("opening");
      book.classList.remove("at-start");
    }
    if (flipped === N - 1) book.classList.add("at-end");
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
    if (flipped === 1) book.classList.add("at-start");
    if (flipped === N) book.classList.remove("at-end");
    runTurn(sheets[flipped - 1], 180, 0, false, function () {
      flipped--;
      animating = false;
      update();
    });
  }

  /* ---------- Lật trang ở chế độ 1 trang (mobile) ----------
     Tờ lật chỉ quét trong khoang 0°→90° quanh cạnh gáy trái: ngoài khoảng
     này trang quay ra ngoài khung (màn hình dọc không có nửa trái).
     Quy tắc: trang nào nằm ngửa được thì nhấc nó lên (0°→90°) và để trang
     đích hiện ra tĩnh bên dưới; trang nằm úp thì cho nó áp xuống (90°→0°)
     trên trang hiện tại — nhờ vậy không bao giờ loá nhầm trang khác. */
  var underFlip = null;
  function makeUnder(face) {
    if (!underFlip) {
      underFlip = document.createElement("div");
      underFlip.className = "under-flip";
      underFlip.style.zIndex = N + 1;
      book.insertBefore(underFlip, book.querySelector(".zone-left"));
    }
    underFlip.innerHTML = "";
    underFlip.appendChild(cloneFace(face));
    underFlip.style.display = "block";
  }
  function hideUnder() { if (underFlip) underFlip.style.display = "none"; }

  function faceOf(sheet, side) { return sheet.querySelector(".face." + side); }

  function singleTurn(delta) {
    if (animating) return;
    var target = page + delta;
    if (target < 1 || target > TOTAL) return;
    var s = Math.floor((page - 1) / 2);
    var showingFront = page % 2 === 1;
    var turned, from, to, underFace;

    if (delta > 0) {
      if (showingFront) {
        turned = sheets[s]; from = 0; to = 90;
        underFace = faceOf(sheets[s], "back");
      } else {
        turned = sheets[s + 1]; from = 90; to = 0;
        underFace = faceOf(sheets[s], "back");
      }
    } else {
      if (showingFront) {
        turned = sheets[s]; from = 0; to = 90;
        underFace = faceOf(sheets[s - 1], "back");
      } else {
        turned = sheets[s]; from = 90; to = 0;
        underFace = faceOf(sheets[s], "back");
      }
    }

    animating = true;
    hasFlipped = true;
    makeUnder(underFace);
    runTurn(turned, from, to, from < to, function () {
      hideUnder();
      page = target;
      animating = false;
      update();
    });
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
    if (isSingle()) { page = 1; update(); } else { jumpToSheet(0); }
  }
  function last() {
    if (isSingle()) { page = TOTAL; hasFlipped = true; update(); }
    else { jumpToSheet(N); hasFlipped = true; update(); }
  }

  /* ---------- Chuyển giữa 2 trang / 1 trang khi đổi cỡ màn ---------- */
  function syncMode() {
    if (isSingle()) {
      page = flipped === 0 ? 1 : flipped * 2;
    } else {
      flipped = Math.min(N, Math.floor(page / 2));
    }
    update();
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

  // Liên kết "xem ngành" ở trang tổng quan
  book.querySelectorAll(".major-row[data-goto]").forEach(function (row) {
    row.addEventListener("click", function (e) {
      e.preventDefault();
      var target = parseInt(row.getAttribute("data-goto"), 10);
      if (isSingle()) { page = target; hasFlipped = true; update(); }
      else { jumpToSheet(Math.floor(target / 2)); hasFlipped = true; update(); }
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
