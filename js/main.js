/* ============================================================
   CATALOGUE MTPC — điều khiển sách lật trang
   Trang giấy được uốn cong khi lật: tờ giấy chia thành các dải
   dọc xoay lệch nhau quanh gáy. Mỗi dải có 2 lớp (mặt trước và
   mặt sau) nằm sẵn hai phía; trình duyệt tự chọn mặt hướng về
   người xem, nên không có lúc nào dải giấy bị trống.
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
  var DURATION = reduceMotion ? 60 : 650;   // ms — ngắn hơn để khung rơi ít thấy hơn
  var STRIP_LEVELS = [12, 6];    // số dải dọc: ít dải hơn → ít lớp raster hơn, vẫn cong mượt
  var level = 0;
  var STRIPS = STRIP_LEVELS[0];
  var BEND = 50;                 // độ cong tối đa của trang (độ)
  var SHADE_MAX = .12;           // độ tối tối đa của mặt giấy khi nghiêng (giảm bớt cho trang trắng)
  var CLIP_OVERLAP = 8;          // chồng mép giữa các dải (px) để không lộ mối nối

  var mqMobile = window.matchMedia("(max-width: 899px)");
  function isSingle() { return mqMobile.matches; }

  /* ---------- Bóng đổ xuống trang bên dưới ---------- */
  var castL = document.createElement("div");
  var castR = document.createElement("div");
  castL.className = "cast cast-left";
  castR.className = "cast cast-right";
  castL.style.zIndex = castR.style.zIndex = N + 1;
  book.insertBefore(castL, book.querySelector(".zone-left"));
  book.insertBefore(castR, book.querySelector(".zone-left"));

  function startCast(side) {
    var cast = side === "right" ? castR : castL;
    cast.style.animationDuration = DURATION + "ms";
    cast.classList.remove("on");
    void cast.offsetWidth;
    cast.classList.add("on");
  }
  function stopCast() {
    castL.classList.remove("on");
    castR.classList.remove("on");
  }

  /* ---------- Trang giấy uốn cong (dải dọc lồng nhau) ---------- */
  function makeClip(face, W, H, w, offset, isBack) {
    var clip = document.createElement("div");
    clip.className = "clip";
    clip.style.width = (w + CLIP_OVERLAP) + "px";
    var bg = window.getComputedStyle(face).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)") clip.style.backgroundColor = bg;
    if (isBack) {
      clip.style.transformOrigin = (w / 2) + "px 50%";
      clip.style.transform = "rotateY(180deg)";
    }
    var clone = face.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    clone.removeAttribute("id");
    clone.style.cssText =
      "position:absolute;top:0;left:" + offset + "px;width:" + W + "px;height:" + H + "px;" +
      "transform:none;backface-visibility:visible;-webkit-backface-visibility:visible;";
    var shade = document.createElement("div");
    shade.className = "cshade";
    // Chỉ phủ đúng phần dải (w px), KHÔNG tràn vào vùng chồng mép 8px —
    // nếu không bóng của 2 dải liền kề xếp chồng → vệt sọc đen lặp đều trên trang.
    shade.style.width = w + "px";
    clip.appendChild(clone);
    clip.appendChild(shade);
    return { el: clip, shade: shade };
  }

  function buildCurl(sheet) {
    var W = sheet.offsetWidth, H = sheet.offsetHeight;
    var w = W / STRIPS;
    var front = sheet.querySelector(".face.front");
    var back = sheet.querySelector(".face.back");
    var root = document.createElement("div");
    root.className = "curl";
    root.style.width = W + "px";
    root.style.height = H + "px";
    root.style.zIndex = N + 2;

    var strips = [];
    var parent = root;
    for (var k = 0; k < STRIPS; k++) {
      var s = document.createElement("div");
      s.className = "strip";
      s.style.width = w + "px";
      s.style.left = (k === 0 ? 0 : w) + "px";
      // Mặt trước và mặt sau của cùng một dải: luôn có một mặt hướng ra ngoài.
      var cf = makeClip(front, W, H, w, -k * w, false);
      var cb = makeClip(back, W, H, w, -(W - (k + 1) * w), true);
      s.appendChild(cf.el);
      s.appendChild(cb.el);
      parent.appendChild(s);
      parent = s;
      strips.push({ el: s, cf: cf, cb: cb });
    }
    // Bìa trước và bìa sau cứng hơn: chỉ cong nhẹ
    var idx = sheets.indexOf(sheet);
    var stiff = (idx === 0 || idx === N - 1) ? .18 : 1;
    return { root: root, strips: strips, bend: BEND * stiff };
  }

  // theta: 0 = trang nằm bên phải (chưa lật) · 180 = đã lật sang trái
  // Dải đầu (sát gáy) xoay theo góc nền, các dải sau cùng uốn thêm một chút,
  // nên mép ngoài đi trước gáy → trang cong như đang được nhấc lên.
  function setAngle(curl, theta) {
    var n = STRIPS;
    var c = curl.bend * Math.pow(Math.sin(theta * Math.PI / 180), .6);   // tổng độ cong
    // Độ tối tại TỪNG BIÊN dải, rồi nội suy gradient liên tục qua cả trang —
    // nếu tô mỗi dải một màu phẳng sẽ thành bậc thang → vệt sọc trên trang trắng.
    var edge = [0];
    var cum = 0;
    for (var k = 0; k < n; k++) {
      var r = k === 0 ? theta - c : c / (n - 1);
      cum += r;
      edge.push(SHADE_MAX * Math.abs(Math.sin(cum * Math.PI / 180)));
    }
    for (k = 0; k < n; k++) {
      var r2 = k === 0 ? theta - c : c / (n - 1);
      var st = curl.strips[k];
      st.el.style.transform = "rotateY(" + (-r2) + "deg)";
      // Gradient 90deg vẽ trong mặt sau tự bị lật theo clip rotateY(180) →
      // dùng chung một chuỗi cho cả 2 mặt là đúng chiều.
      var g = "linear-gradient(90deg, rgba(8,20,13," + edge[k].toFixed(3) + ") 0%, rgba(8,20,13," + edge[k + 1].toFixed(3) + ") 100%)";
      if (st.lastGrad !== g) {
        st.lastGrad = g;
        st.cf.shade.style.background = g;
        st.cb.shade.style.background = g;
      }
    }
  }

  function easeInOut(p) {
    return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  /* Dựng sẵn trang cong khi rảnh (tránh khựng lúc bấm lật) */
  var curls = [];
  var idleTimer = null;
  function getCurl(sheet) {
    var i = sheets.indexOf(sheet);
    if (!curls[i]) {
      var c = buildCurl(sheet);
      c.root.style.display = "none";
      book.insertBefore(c.root, book.querySelector(".zone-left"));
      curls[i] = c;
    }
    return curls[i];
  }
  function clearCurls() {
    curls.forEach(function (c) { if (c && c.root.parentNode) c.root.parentNode.removeChild(c.root); });
    curls = [];
    schedulePrefetch();
  }
  function schedulePrefetch() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () {
      if (isSingle() || animating) return;
      [flipped, flipped - 1].forEach(function (i) {
        if (i >= 0 && i < N) getCurl(sheets[i]);
      });
    }, 120);
  }
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(clearCurls, 250);
  });

  // Mức thấp nhất: lật bằng CSS thuần (nhẹ nhất)
  function runTurnSimple(sheet, side, toFlipped, done) {
    sheet.style.zIndex = N + 2;
    startCast(side);
    sheet.classList.toggle("flipped", toFlipped);
    window.setTimeout(function () { stopCast(); done(); }, DURATION);
  }

  function runTurn(sheet, side, from, to, toFlipped, done) {
    if (STRIPS === 0) { runTurnSimple(sheet, side, toFlipped, done); return; }
    var curl = getCurl(sheet);
    setAngle(curl, from);
    curl.root.style.display = "";
    sheet.style.visibility = "hidden";
    startCast(side);

    // Chờ đúng 1 khung hình để trình duyệt raster lớp trang cong ở thế nằm phẳng
    // (giống hệt trang thật) TRƯỚC khi bắt đầu xoay — khỏi khựng ở đầu cú lật.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(step);
    });

    var t0 = null, last = null, sum = 0, cnt = 0;
    function step(ts) {
      if (t0 === null) t0 = ts;
      if (last !== null) { sum += ts - last; cnt++; }
      last = ts;
      var p = Math.min(1, (ts - t0) / DURATION);
      setAngle(curl, from + (to - from) * easeInOut(p));
      if (p < 1) { window.requestAnimationFrame(step); return; }
      // Kết thúc: trả tờ giấy thật về đúng vị trí, không hoạt ảnh
      sheet.classList.add("no-anim");
      sheet.classList.toggle("flipped", toFlipped);
      void sheet.offsetWidth;
      sheet.classList.remove("no-anim");
      sheet.style.visibility = "";
      curl.root.style.display = "none";
      stopCast();
      // Máy quá yếu (dưới ~25fps) → giảm bớt dải nhưng vẫn giữ độ cong
      if (!reduceMotion && cnt > 6 && sum / cnt > 40 && level < STRIP_LEVELS.length - 1) {
        level++;
        STRIPS = STRIP_LEVELS[level];
        clearCurls();
      }
      done();
    }
  }

  /* ---------- Cập nhật giao diện ---------- */
  function update() {
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
      page++;
      hasFlipped = true;
      update();
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
    runTurn(sheets[flipped], "right", 0, 180, true, function () {
      flipped++;
      animating = false;
      update();
    });
  }

  function prev() {
    if (animating) return;
    if (isSingle()) {
      if (page <= 1) return;
      page--;
      update();
      return;
    }
    if (flipped <= 0) return;
    animating = true;
    if (flipped === 1) book.classList.add("at-start");
    if (flipped === N) book.classList.remove("at-end");
    runTurn(sheets[flipped - 1], "left", 180, 0, false, function () {
      flipped--;
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
  book.querySelector(".zone-left").addEventListener("click", prev);
  book.querySelector(".zone-right").addEventListener("click", next);

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);
  btnFirst.addEventListener("click", first);
  btnLast.addEventListener("click", last);

  btnFs.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault(); next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault(); prev();
    } else if (e.key === "Home") { first();
    } else if (e.key === "End") { last(); }
  });

  // Vuốt trên màn cảm ứng
  var touchX = null;
  book.addEventListener("touchstart", function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  book.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 42) { dx < 0 ? next() : prev(); }
    touchX = null;
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
      imgTimer = window.setTimeout(clearCurls, 400);
    };
    img.src = src;
  });

  update();
})();
