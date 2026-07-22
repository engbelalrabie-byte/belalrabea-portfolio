/* ==========================================================================
   Bilal Rabea — Portfolio interactions
   Vanilla JS, no dependencies. Respects prefers-reduced-motion throughout.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------- Theme toggle ---------------------------- */
  var THEME_KEY = "portfolio-theme";
  var root = document.documentElement;
  var toggleBtn = document.querySelector("[data-theme-toggle]");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (toggleBtn) toggleBtn.setAttribute("aria-pressed", theme === "dark");
  }

  var storedTheme = localStorage.getItem(THEME_KEY);
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(storedTheme || (prefersDark ? "dark" : "light"));

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* ---------------------------- Mobile menu ------------------------------ */
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  var menuClose = document.querySelector("[data-menu-close]");

  function openMenu() {
    mobileMenu.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }
  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    menuToggle.focus();
  }
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", closeMenu);
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
    });
  }

  /* ---------------------------- Scroll trace ------------------------------
     The left-edge "trace" is both a scroll-progress indicator AND a
     section-jump nav — a literal circuit trace connecting each part of
     the page, tying the engineering metaphor to a genuinely useful control.
  -------------------------------------------------------------------------- */
  var trace = document.querySelector("[data-trace]");
  if (trace) {
    var fill = trace.querySelector(".trace-fill");
    var nodesWrap = trace.querySelector("[data-trace-nodes]");
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));
    var nodes = [];

    sections.forEach(function (sec) {
      var node = document.createElement("button");
      node.type = "button";
      node.className = "trace-node";
      node.setAttribute("aria-label", "Jump to " + sec.getAttribute("data-section-label"));
      var label = document.createElement("span");
      label.className = "trace-label";
      label.textContent = sec.getAttribute("data-section-label");
      node.appendChild(label);
      node.addEventListener("click", function () {
        sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
      nodesWrap.appendChild(node);
      nodes.push({ el: node, target: sec });
    });

    function positionNodes() {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      nodes.forEach(function (n) {
        var pct = (n.target.offsetTop / document.documentElement.scrollHeight) * 100;
        n.el.style.top = pct + "%";
      });
    }

    function updateTrace() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.height = Math.min(100, Math.max(0, pct)) + "%";

      var mid = scrollTop + window.innerHeight * 0.4;
      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec.offsetTop <= mid) activeIndex = i;
      });
      nodes.forEach(function (n, i) {
        n.el.classList.toggle("is-active", i === activeIndex);
      });
    }

    window.addEventListener("resize", positionNodes);
    window.addEventListener("load", function () {
      positionNodes();
      updateTrace();
    });
    window.addEventListener("scroll", updateTrace, { passive: true });
    positionNodes();
    updateTrace();
  }

/* ---------------------------- Reveal on scroll -------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------- Scroll hint (tall screen) ----------------------------- */
  // ضَع هذا الجزء الجديد هنا تماماً بعد نهاية القوس الإغلاقي للـ Reveal على السطر التالي:
  var scrollHintFrames = document.querySelectorAll("[data-scroll-hint]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scrollHintFrames.length && "IntersectionObserver" in window && !reduceMotion) {
    scrollHintFrames.forEach(function (frame) {
      var hand = frame.parentElement.querySelector(".scroll-hand");
      if (!hand) return;
      var hintIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              hand.classList.remove("is-animating");
              void hand.offsetWidth; // يجبر المتصفح على إعادة تشغيل الأنيميشن فوراً
              hand.classList.add("is-animating");
            } else {
              hand.classList.remove("is-animating");
            }
          });
        },
        { threshold: 0.5 }
      );
      hintIO.observe(frame);
    });
  }

  /* ---------------------------- Lightbox for Explorations ----------------- */
  var lightbox = document.querySelector("[data-lightbox]");
  if (lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    var lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
    var closeBtn = lightbox.querySelector("[data-lightbox-close]");
    var lastFocused = null;

    document.querySelectorAll("[data-lightbox-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var img = trigger.querySelector("img");
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = trigger.getAttribute("data-caption") || img.alt;
        lastFocused = trigger;
        lightbox.classList.add("is-open");
        closeBtn.focus();
        document.body.style.overflow = "hidden";
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
  }

  /* ---------------------------- Current year ------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* ---------------------------- Copy Email & Show Toast ----------------- */
var emailBtn = document.getElementById("emailLink");
var toast = document.getElementById("toast");

if (emailBtn && toast) {
  emailBtn.addEventListener("click", function (e) {
    e.preventDefault(); // منع الانتقال لأعلى الصفحة عند الضغط
    
    var emailText = "engineerbelal@gmail.com";
    
    // نسخ النص للحافظة
    navigator.clipboard.writeText(emailText).then(function () {
      // إظهار التنبيه
      toast.classList.add("show");
      
      // إخفاء التنبيه تلقائياً بعد 3 ثواني
      setTimeout(function () {
        toast.classList.remove("show");
      }, 3000);
    });
  });
}