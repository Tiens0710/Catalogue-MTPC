(function () {
  "use strict";
  var library = document.querySelector(".ebook-library");
  var summary = library.querySelector("summary");
  var narrow = window.matchMedia("(max-width: 899px)");

  function syncLibrary() {
    library.open = !narrow.matches;
  }

  syncLibrary();
  if (narrow.addEventListener) narrow.addEventListener("change", syncLibrary);
  else narrow.addListener(syncLibrary);

  library.addEventListener("keydown", function (event) {
    // Phím dùng trong thư viện không điều khiển trang sách.
    event.stopPropagation();
    if (event.key === "Escape" && narrow.matches && library.open) {
      library.open = false;
      summary.focus();
    }
  });
})();
