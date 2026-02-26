$(document).ready(function () {
  const currentPath = window.location.pathname;

  /* ===============================
     RESET (ONLY ON LOAD)
  =============================== */
  $(".sidebar-link").removeClass("active");
  $(".sidebar-item").removeClass("selected open-only");
  $(".collapse").removeClass("show");
  $(".sidebar-link.has-arrow").attr("aria-expanded", "false");

  /* ===============================
     PAGE LOAD → ACTIVE PAGE
  =============================== */
  $(".sidebar-link").each(function () {
    const href = $(this).attr("href");

    if (href && href !== "javascript:void(0)" && href === currentPath) {
      $(this).addClass("active");

      const parent = $(this).closest(".collapse").length
        ? $(this).closest(".collapse").closest(".sidebar-item")
        : $(this).closest(".sidebar-item");

      parent.addClass("selected");
      parent.children(".collapse").addClass("show");
      parent.children(".sidebar-link.has-arrow").attr("aria-expanded", "true");
    }
  });

  /* ===============================
     DROPDOWN CLICK
     =============================== */
  $(".sidebar-link.has-arrow").on("click", function (e) {
    e.preventDefault();

      $(this).removeClass("active");
    const parent = $(this).closest(".sidebar-item");
    const collapse = $(this).next(".collapse");

    /*  HARD BLOCK: if active child exists */
    if (parent.find(".collapse .sidebar-link.active").length > 0) {
      collapse.addClass("show");
      $(this).attr("aria-expanded", "true");
      parent.addClass("selected").removeClass("open-only");
      return;
    }

    /*  SAFE TO TOGGLE */
    const isOpen = collapse.hasClass("show");
    collapse.collapse("toggle");
    $(this).attr("aria-expanded", !isOpen);
    parent.toggleClass("open-only", !isOpen);
  });

  /* ===============================
     CHILD CLICK
  =============================== */
  $(".collapse .sidebar-link").on("click", function () {
    $(".sidebar-link").removeClass("active");
    $(".sidebar-item").removeClass("selected open-only");
    $(".collapse").removeClass("show");
    $(".sidebar-link.has-arrow").attr("aria-expanded", "false");

    $(this).addClass("active");

    const parent = $(this).closest(".collapse").closest(".sidebar-item");
    parent.addClass("selected");
    parent.children(".collapse").addClass("show");
    parent.children(".sidebar-link.has-arrow").attr("aria-expanded", "true");
  });

  /* ===============================
      BOOTSTRAP FINAL SAFETY LOCK
  =============================== */
  $(".collapse").on("hide.bs.collapse", function (e) {
    const parent = $(this).closest(".sidebar-item");

    if (parent.find(".sidebar-link.active").length > 0) {
      e.preventDefault();
      $(this).addClass("show");
      parent
        .addClass("selected")
        .children(".sidebar-link.has-arrow")
        .attr("aria-expanded", "true");
    }
  });
});
