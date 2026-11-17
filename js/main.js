/* ============================================================
   CATALOGUE MTPC — điều khiển sách lật trang
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
  var DURATION = 1150;            // khớp với transition CSS

  var mqMobile = window.matchMedia("(max-width: 899px)");
  function isSingle() { return mqMobile.matches; }

  /* ---------- Cập nhật giao diện ---------- */
  function update() {
    var single = isSingle();
    book.classList.toggle("single", single);

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
    var s = sheets[flipped];
    s.style.zIndex = N + 1;
    s.classList.add("flipped");
    window.setTimeout(function () {
      flipped++;
      animating = false;
      update();
    }, DURATION);
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
    var s = sheets[flipped - 1];
    s.style.zIndex = N + 1;
    s.classList.remove("flipped");
    window.setTimeout(function () {
      flipped--;
      animating = false;
      update();
    }, DURATION);
  }

  /* ---------- Nhảy nhanh (không hoạt ảnh) ---------- */
  function jumpToSheet(targetFlipped) {
    targetFlipped = Math.max(0, Math.min(N, targetFlipped));
    if (targetFlipped === flipped) return;
    sheets.forEach(function (s) { s.classList.add("no-anim"); });
    flipped = targetFlipped;
    page = Math.max(1, flipped * 2); // đồng bộ cho chế độ 1 trang
    update();
    // Buột trình duyệt tính toán lại trước khi bật lại hoạt ảnh
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
      // đang ở spread (flipped) → quy đổi ra trang
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
  document.querySelectorAll(".ph[data-img]").forEach(function (el) {
    var src = el.getAttribute("data-img");
    if (!el.getAttribute("data-label") && src) {
      el.setAttribute("data-label", src.split("/").pop());
    }
    var img = new Image();
    img.onload = function () {
      el.style.backgroundImage = "url('" + src + "')";
      el.classList.add("has-img");
    };
    img.src = src;
  });

  update();
})();
