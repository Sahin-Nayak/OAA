/* ONE ABOVE ALL — site interactions */
(function () {
  "use strict";

  /* ---------------- Helpers ---------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

  function waLink(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }

  /* ---------------- Body scroll lock ----------------
     Plain `overflow:hidden` on <body> doesn't reliably stop touch-scroll
     of the background on mobile. Pinning the body with position:fixed
     (and restoring the exact scroll position on unlock) is the technique
     that actually works across browsers/devices. Counter-based so nested
     opens (e.g. drawer opened while nav is open) don't unlock too early. */
  let scrollLockCount = 0;
  let savedScrollY = 0;
  function lockScroll() {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = -savedScrollY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    }
    scrollLockCount++;
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, savedScrollY);
    }
  }

  /* ---------------- Footer year ---------------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------------- Active nav link ---------------- */
  (function activeNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a, .mobile-nav a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  })();

  /* ---------------- Header scroll state + back to top ---------------- */
  const header = $(".site-header");
  const backTop = $(".back-top");
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (header) header.classList.toggle("scrolled", y > 10);
        if (backTop) backTop.classList.toggle("show", y > 500);
        ticking = false;
      });
      ticking = true;
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (backTop) {
    backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------------- Mobile nav ---------------- */
  const menuToggle = $(".menu-toggle");
  const mobileNav = $(".mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.classList.toggle("open");
      mobileNav.classList.toggle("open", open);
      if (open) lockScroll();
      else unlockScroll();
    });
    $$(".mobile-nav a").forEach((a) =>
      a.addEventListener("click", () => {
        if (menuToggle.classList.contains("open")) unlockScroll();
        menuToggle.classList.remove("open");
        mobileNav.classList.remove("open");
      })
    );
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = $$(".reveal, .reveal-scale");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el, i) => {
      el.style.setProperty("--i", el.closest(".stagger") ? i % 8 : 0);
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------------- Counters ---------------- */
  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(animateCounter);
  }
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-suffix") || "";
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target % 1 === 0 ? Math.floor(target * eased) : (target * eased).toFixed(1);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- Toasts ---------------- */
  let toastWrap = $(".toast-wrap");
  if (!toastWrap) {
    toastWrap = document.createElement("div");
    toastWrap.className = "toast-wrap";
    document.body.appendChild(toastWrap);
  }
  window.showToast = function (msg, icon) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<i class="fa-solid ' + (icon || "fa-circle-check") + '"></i><span>' + msg + "</span>";
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 350);
    }, 2800);
  };

  /* ---------------- FAQ accordion ---------------- */
  $$(".acc-item").forEach((item) => {
    const head = $(".acc-head", item);
    const body = $(".acc-body", item);
    if (!head || !body) return;
    head.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      $$(".acc-item.open").forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
          $(".acc-body", other).style.maxHeight = 0;
        }
      });
      item.classList.toggle("open", !isOpen);
      body.style.maxHeight = !isOpen ? body.scrollHeight + "px" : 0;
    });
  });

  /* ---------------- Custom select (native <select> options can't be
     restyled consistently across browsers, so swap in our own dropdown) ---------------- */
  function closeAllSelects(except) {
    $$(".cs-wrap.open").forEach((w) => {
      if (w !== except) w.classList.remove("open");
    });
  }

  function enhanceSelect(select) {
    if (select.dataset.csEnhanced) return;
    select.dataset.csEnhanced = "1";

    const wrap = document.createElement("div");
    wrap.className = "cs-wrap cs-block";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cs-trigger " + select.className;
    if (select.hasAttribute("aria-label")) trigger.setAttribute("aria-label", select.getAttribute("aria-label"));

    const label = document.createElement("span");
    label.className = "cs-trigger-label";
    trigger.appendChild(label);
    trigger.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-chevron-down"></i>');

    const panel = document.createElement("div");
    panel.className = "cs-panel";
    panel.setAttribute("role", "listbox");

    function buildOptions() {
      panel.innerHTML = "";
      Array.from(select.options).forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cs-option" + (opt.selected ? " selected" : "");
        btn.setAttribute("role", "option");
        btn.dataset.value = opt.value;
        btn.textContent = opt.textContent;
        btn.addEventListener("click", () => {
          select.value = opt.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          syncLabel();
          $$(".cs-option", panel).forEach((o) => o.classList.toggle("selected", o === btn));
          wrap.classList.remove("open");
        });
        panel.appendChild(btn);
      });
    }

    function syncLabel() {
      const opt = select.options[select.selectedIndex];
      label.textContent = opt ? opt.textContent : "";
    }

    select.parentNode.insertBefore(wrap, select);
    select.classList.add("cs-native");
    select.setAttribute("tabindex", "-1");
    wrap.appendChild(select);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    buildOptions();
    syncLabel();

    trigger.addEventListener("click", () => {
      const willOpen = !wrap.classList.contains("open");
      closeAllSelects();
      wrap.classList.toggle("open", willOpen);
    });
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Escape") wrap.classList.remove("open");
    });
  }

  $$("select").forEach(enhanceSelect);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cs-wrap")) closeAllSelects();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllSelects();
  });

  /* ---------------- Generic carousel ---------------- */
  $$(".carousel").forEach((carousel) => {
    const track = $(".carousel-slides", carousel);
    const slides = $$(".t-slide", carousel);
    const dotsWrap = $(".carousel-dots", carousel);
    if (!track || !slides.length) return;
    let index = 0;
    let timer;

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(b);
      });
    }

    function render() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      if (dotsWrap) {
        $$("button", dotsWrap).forEach((d, i) => d.classList.toggle("active", i === index));
      }
    }
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
      restart();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    const nextBtn = $(".carousel-arrow.next", carousel);
    const prevBtn = $(".carousel-arrow.prev", carousel);
    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);

    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", restart);

    render();
    restart();
  });

  /* ---------------- Mouse drag-to-scroll ----------------
     overflow-x:auto only responds to real touch gestures, a trackpad, or
     a visible scrollbar out of the box — a plain mouse click-drag does
     nothing, and we hide the scrollbar for a cleaner look. This adds
     click-and-drag scrolling so these rows work with a mouse too
     (desktop, or a DevTools device emulator without touch simulation). */
  function enableDragScroll(row) {
    if (!row) return;
    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startScroll = 0;

    row.addEventListener("mousedown", (e) => {
      isDown = true;
      dragged = false;
      startX = e.pageX;
      startScroll = row.scrollLeft;
      row.classList.add("dragging");
    });
    window.addEventListener("mouseup", () => {
      isDown = false;
      row.classList.remove("dragging");
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const delta = e.pageX - startX;
      if (Math.abs(delta) > 4) dragged = true;
      row.scrollLeft = startScroll - delta;
    });
    // suppress the click on a card (e.g. navigating a link) right after an
    // actual drag, so dragging doesn't accidentally trigger navigation
    row.addEventListener(
      "click",
      (e) => {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  }

  /* ---------------- Auto-scroll for a horizontal card row ---------------- */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function initAutoScrollRow(row, intervalMs) {
    if (!row || prefersReducedMotion) return;
    let timer = null;
    let paused = false;

    function step() {
      if (paused) return;
      // nothing to scroll (desktop grid layout, or content fits) — skip quietly
      if (row.scrollWidth <= row.clientWidth + 4) return;
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      if (atEnd) {
        row.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const card = row.children[0];
        const advance = card ? card.getBoundingClientRect().width + 16 : row.clientWidth * 0.8;
        row.scrollBy({ left: advance, behavior: "smooth" });
      }
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(step, intervalMs);
    }
    function pauseAwhile() {
      paused = true;
      clearInterval(timer);
      clearTimeout(row._resumeTimer);
      row._resumeTimer = setTimeout(() => {
        paused = false;
        restart();
      }, intervalMs * 1.6);
    }

    row.addEventListener("pointerdown", pauseAwhile, { passive: true });
    row.addEventListener("wheel", pauseAwhile, { passive: true });

    // only run while the row is actually visible on screen
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? restart() : clearInterval(timer))),
        { threshold: 0.3 }
      );
      io.observe(row);
    } else {
      restart();
    }
  }

  /* ---------------- Inquiry basket ---------------- */
  const BASKET_KEY = "oaa_inquiry";
  function getBasket() {
    try {
      return JSON.parse(localStorage.getItem(BASKET_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveBasket(basket) {
    localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    updateBasketBadge();
  }
  function updateBasketBadge() {
    const count = getBasket().reduce((s, i) => s + i.qty, 0);
    $$(".icon-badge[data-basket-badge]").forEach((b) => {
      b.textContent = count;
      b.classList.toggle("show", count > 0);
    });
  }
  function addToBasket(id, qty) {
    qty = qty || 1;
    const basket = getBasket();
    const existing = basket.find((i) => i.id === id);
    if (existing) existing.qty += qty;
    else basket.push({ id, qty });
    saveBasket(basket);
    renderDrawer();
    const p = DemoData.getAllProducts().find((pp) => pp.id === id);
    showToast((p ? p.name : "Item") + " added to your inquiry list", "fa-bag-shopping");
    const badge = $(".icon-badge[data-basket-badge]");
    if (badge) {
      badge.classList.remove("show");
      void badge.offsetWidth;
      badge.classList.add("show");
    }
  }
  function removeFromBasket(id) {
    saveBasket(getBasket().filter((i) => i.id !== id));
    renderDrawer();
  }
  function setQty(id, qty) {
    const basket = getBasket();
    const item = basket.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveBasket(basket);
    renderDrawer();
  }
  window.OAA_addToBasket = addToBasket;

  const drawer = $(".drawer");
  const drawerOverlay = $(".drawer-overlay");
  const drawerBody = $(".drawer-body");
  const drawerFoot = $(".drawer-foot");

  function openDrawer() {
    if (!drawer || drawer.classList.contains("open")) return;
    renderDrawer();
    drawer.classList.add("open");
    drawerOverlay.classList.add("open");
    lockScroll();
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("open");
    unlockScroll();
  }
  $$("[data-basket-open]").forEach((btn) => btn.addEventListener("click", openDrawer));
  $$(".drawer-close").forEach((btn) => btn.addEventListener("click", closeDrawer));
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  function renderDrawer() {
    if (!drawerBody) return;
    const basket = getBasket();
    if (!basket.length) {
      drawerBody.innerHTML =
        '<div class="drawer-empty"><i class="fa-regular fa-face-smile-beam"></i><p>Your inquiry list is empty.<br>Add a few pouches you love!</p></div>';
      if (drawerFoot) drawerFoot.style.display = "none";
      return;
    }
    if (drawerFoot) drawerFoot.style.display = "block";
    let total = 0;
    drawerBody.innerHTML = basket
      .map((item) => {
        const p = DemoData.getAllProducts().find((pp) => pp.id === item.id);
        if (!p) return "";
        const unitPrice = item.qty >= 50 ? p.bulkPrice : p.price;
        total += unitPrice * item.qty;
        return (
          '<div class="drawer-item" data-row="' + p.id + '">' +
          '<img src="' + p.image + '" alt="' + p.name + '">' +
          '<div class="info"><strong>' + p.name + "</strong>" +
          "<span>" + fmtINR(unitPrice) + " / " + p.unit + "</span></div>" +
          '<div class="drawer-qty">' +
          '<button data-dec><i class="fa-solid fa-minus"></i></button>' +
          '<span>' + item.qty + "</span>" +
          '<button data-inc><i class="fa-solid fa-plus"></i></button>' +
          "</div>" +
          '<button class="drawer-remove" data-remove><i class="fa-solid fa-trash"></i></button>' +
          "</div>"
        );
      })
      .join("");

    $$("[data-dec]", drawerBody).forEach((btn, i) =>
      btn.addEventListener("click", () => setQty(basket[i].id, basket[i].qty - 1))
    );
    $$("[data-inc]", drawerBody).forEach((btn, i) =>
      btn.addEventListener("click", () => setQty(basket[i].id, basket[i].qty + 1))
    );
    $$("[data-remove]", drawerBody).forEach((btn, i) =>
      btn.addEventListener("click", () => removeFromBasket(basket[i].id))
    );

    if (drawerFoot) {
      drawerFoot.innerHTML =
        '<div class="sum-row"><span>Estimated total</span><strong>' +
        fmtINR(total) +
        '</strong></div>' +
        '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' +
        waLink(buildBasketMessage(basket)) +
        '"><i class="fa-brands fa-whatsapp"></i> Send Inquiry on WhatsApp</a>';
    }
  }

  function buildBasketMessage(basket) {
    let msg = "Hi ONE ABOVE ALL! I'd like to enquire about:\n";
    basket.forEach((item) => {
      const p = DemoData.getAllProducts().find((pp) => pp.id === item.id);
      if (p) msg += "- " + p.name + " x " + item.qty + "\n";
    });
    msg += "\nPlease share availability and final pricing. Thank you!";
    return msg;
  }

  updateBasketBadge();

  /* ---------------- Cart badge + account menu (demo auth) ---------------- */
  function updateCartBadge() {
    if (!window.DemoData) return;
    const count = DemoData.cartCount();
    $$(".icon-badge[data-cart-badge]").forEach((b) => {
      b.textContent = count;
      b.classList.toggle("show", count > 0);
    });
  }
  window.updateCartBadge = updateCartBadge;

  function renderAccountMenu() {
    if (!window.DemoData) return;
    const user = DemoData.getCurrentUser();
    $$("[data-account-panel]").forEach((panel) => {
      panel.innerHTML = user
        ? '<div class="who"><strong>' + user.name + '</strong><span>' + user.email + "</span></div>" +
          '<a href="orders.html"><i class="fa-solid fa-box"></i> My Orders</a>' +
          '<a href="cart.html"><i class="fa-solid fa-cart-shopping"></i> My Cart</a>' +
          '<button type="button" data-logout><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>'
        : '<a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Log In</a>' +
          '<a href="signup.html"><i class="fa-solid fa-user-plus"></i> Sign Up</a>';
      $$("[data-logout]", panel).forEach((btn) =>
        btn.addEventListener("click", () => {
          DemoData.logout();
          showToast("Logged out", "fa-circle-check");
          renderAccountMenu();
          panel.closest(".account-menu").classList.remove("open");
        })
      );
    });

    $$("[data-mobile-account]").forEach((slot) => {
      slot.innerHTML = user
        ? '<a href="orders.html">My Orders (' + user.name.split(" ")[0] + ")</a>" +
          '<a href="#" data-mobile-logout>Log Out</a>'
        : '<a href="login.html">Log In</a><a href="signup.html">Sign Up</a>';
      $$("[data-mobile-logout]", slot).forEach((a) =>
        a.addEventListener("click", (e) => {
          e.preventDefault();
          DemoData.logout();
          showToast("Logged out", "fa-circle-check");
          renderAccountMenu();
        })
      );
    });
  }

  $$("[data-account-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = trigger.closest(".account-menu");
      const willOpen = !menu.classList.contains("open");
      $$(".account-menu.open").forEach((m) => m.classList.remove("open"));
      menu.classList.toggle("open", willOpen);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".account-menu")) $$(".account-menu.open").forEach((m) => m.classList.remove("open"));
  });

  if (window.DemoData) {
    // these only read localStorage (session/cart), not the fetched seed
    // accounts — render immediately so the account panel is never empty
    // while waiting on a slow/unreachable network request.
    updateCartBadge();
    renderAccountMenu();
  }

  /* ---------------- Product grid rendering ---------------- */
  function starString(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let s = "";
    for (let i = 0; i < full; i++) s += '<i class="fa-solid fa-star"></i>';
    if (half) s += '<i class="fa-solid fa-star-half-stroke"></i>';
    for (let i = full + (half ? 1 : 0); i < 5; i++) s += '<i class="fa-regular fa-star"></i>';
    return s;
  }

  function productCardHTML(p, i) {
    return (
      '<article class="product-card reveal" style="--i:' + (i % 6) + '" data-id="' + p.id + '" data-category="' + p.category + '" data-color="' + p.color + '">' +
      '<div class="product-media">' +
      (p.tag ? '<span class="product-tag' + (p.tag === "Bestseller" ? " bestseller" : "") + '">' + p.tag + "</span>" : "") +
      '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
      '<div class="product-quick">' +
      '<button title="Quick view" data-quickview><i class="fa-regular fa-eye"></i></button>' +
      '<button title="Add to inquiry" data-addbasket><i class="fa-solid fa-bag-shopping"></i></button>' +
      "</div></div>" +
      '<div class="product-info">' +
      '<span class="product-cat">' + p.categoryLabel + "</span>" +
      "<h3>" + p.name + "</h3>" +
      '<div class="product-stars">' + starString(p.rating) + ' <span style="color:var(--ink-faint);margin-left:4px;">(' + p.reviews + ")</span></div>" +
      '<div class="product-price-row"><span class="product-price">' + fmtINR(p.price) + "</span><span class=\"product-bulk\">from " + fmtINR(p.bulkPrice) + " in bulk</span></div>" +
      '<div class="product-actions">' +
      '<button class="add-inquiry-btn" data-addbasket><i class="fa-regular fa-heart"></i> Inquiry</button>' +
      '<button class="add-cart-btn" data-addcart><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>' +
      "</div></div></article>"
    );
  }

  function renderGrid(container, list) {
    if (!list.length) {
      container.innerHTML = '<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>No pouches match these filters yet. Try clearing a filter.</p></div>';
      return;
    }
    container.innerHTML = list.map(productCardHTML).join("");
    wireGridEvents(container);
    // re-run reveal for freshly injected nodes
    $$(".reveal", container).forEach((el) => el.classList.add("in"));
  }

  function wireGridEvents(container) {
    $$("[data-quickview]", container).forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.target.closest(".product-card").dataset.id;
        openQuickView(id);
      })
    );
    $$("[data-addbasket]", container).forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        addToBasket(card.dataset.id, 1);
        if (btn.classList.contains("add-inquiry-btn")) {
          btn.classList.add("added");
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
          setTimeout(() => {
            btn.classList.remove("added");
            btn.innerHTML = '<i class="fa-regular fa-heart"></i> Inquiry';
          }, 1600);
        }
      })
    );
    $$("[data-addcart]", container).forEach((btn) =>
      btn.addEventListener("click", (e) => {
        if (!window.DemoData) return;
        const card = e.target.closest(".product-card");
        const p = DemoData.getAllProducts().find((pp) => pp.id === card.dataset.id);
        DemoData.addToCart(card.dataset.id, 1);
        updateCartBadge();
        showToast((p ? p.name : "Item") + " added to cart", "fa-cart-shopping");
        btn.classList.add("added");
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
        setTimeout(() => {
          btn.classList.remove("added");
          btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';
        }, 1600);
      })
    );
  }

  const featuredGrid = $("[data-grid='featured']");
  if (featuredGrid) {
    let featured;
    if (window.OAA_FEATURED_IDS && window.OAA_FEATURED_IDS.length) {
      featured = window.OAA_FEATURED_IDS.map((id) => DemoData.getAllProducts().find((p) => p.id === id)).filter(Boolean);
    } else {
      featured = DemoData.getAllProducts().filter((p) => p.tag === "Bestseller" || p.tag === "New").slice(0, 6);
    }
    renderGrid(featuredGrid, featured.length ? featured : DemoData.getAllProducts().slice(0, 6));
    initAutoScrollRow(featuredGrid, 3200);
    enableDragScroll(featuredGrid);
  }

  const shopGrid = $("[data-grid='shop']");
  if (shopGrid) {
    let state = { category: "all", color: null, sort: "featured" };

    function apply() {
      let list = DemoData.getAllProducts().slice();
      if (state.category !== "all") list = list.filter((p) => p.category === state.category);
      if (state.color) list = list.filter((p) => p.color === state.color);
      switch (state.sort) {
        case "price-asc": list.sort((a, b) => a.price - b.price); break;
        case "price-desc": list.sort((a, b) => b.price - a.price); break;
        case "rating": list.sort((a, b) => b.rating - a.rating); break;
        default: list.sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0));
      }
      renderGrid(shopGrid, list);
      const countEl = $("[data-result-count]");
      if (countEl) countEl.textContent = list.length;
    }

    $$("[data-filter]").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$("[data-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.category = btn.dataset.filter;
        apply();
      })
    );
    $$("[data-color-filter]").forEach((sw) =>
      sw.addEventListener("click", () => {
        const already = sw.classList.contains("active");
        $$("[data-color-filter]").forEach((s) => s.classList.remove("active"));
        if (!already) {
          sw.classList.add("active");
          state.color = sw.dataset.colorFilter;
        } else {
          state.color = null;
        }
        apply();
      })
    );
    const sortSelect = $("[data-sort]");
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value;
        apply();
      });
    }

    // deep link e.g. shop.html#leather filters by category, shop.html#royal-charm opens quick view
    apply();
    initAutoScrollRow(shopGrid, 3200);
    enableDragScroll(shopGrid);
    if (location.hash) {
      const id = location.hash.replace("#", "");
      if (CATEGORY_LABELS[id]) {
        const btn = document.querySelector('[data-filter="' + id + '"]');
        if (btn) btn.click();
      } else {
        setTimeout(() => openQuickView(id), 300);
      }
    }
  }

  /* ---------------- Quick view modal ---------------- */
  const modalOverlay = $(".modal-overlay");
  function openQuickView(id) {
    const p = DemoData.getAllProducts().find((pp) => pp.id === id);
    if (!p || !modalOverlay) return;
    $(".modal-media img", modalOverlay).src = p.image;
    $(".modal-media img", modalOverlay).alt = p.name;
    $("[data-modal-cat]", modalOverlay).textContent = p.categoryLabel + " · " + p.size;
    $("[data-modal-title]", modalOverlay).textContent = p.name;
    $("[data-modal-stars]", modalOverlay).innerHTML = starString(p.rating) + ' <span style="color:var(--ink-faint);font-size:.78rem;margin-left:6px;">' + p.rating + " (" + p.reviews + " reviews)</span>";
    $("[data-modal-price]", modalOverlay).textContent = fmtINR(p.price) + " / " + p.unit;
    $("[data-modal-bulk]", modalOverlay).textContent = "Bulk from " + fmtINR(p.bulkPrice) + " / " + p.unit + " (50+ pcs)";
    $("[data-modal-desc]", modalOverlay).textContent = p.desc;
    $("[data-modal-color]", modalOverlay).textContent = p.colorLabel;
    const qtyInput = $("[data-modal-qty]", modalOverlay);
    if (qtyInput) qtyInput.value = 1;
    const addBtn = $("[data-modal-add]", modalOverlay);
    if (addBtn) {
      addBtn.onclick = () => {
        const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
        addToBasket(p.id, qty);
        closeModal();
      };
    }
    const addCartBtn = $("[data-modal-addcart]", modalOverlay);
    if (addCartBtn) {
      addCartBtn.onclick = () => {
        const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
        if (window.DemoData) {
          DemoData.addToCart(p.id, qty);
          updateCartBadge();
          showToast(p.name + " added to cart", "fa-cart-shopping");
        }
        closeModal();
      };
    }
    if (!modalOverlay.classList.contains("open")) lockScroll();
    modalOverlay.classList.add("open");
  }
  function closeModal() {
    if (!modalOverlay || !modalOverlay.classList.contains("open")) return;
    modalOverlay.classList.remove("open");
    unlockScroll();
  }
  if (modalOverlay) {
    $(".modal-close", modalOverlay).addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    const dec = $("[data-modal-dec]", modalOverlay);
    const inc = $("[data-modal-inc]", modalOverlay);
    const qtyInput = $("[data-modal-qty]", modalOverlay);
    if (dec) dec.addEventListener("click", () => (qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1)));
    if (inc) inc.addEventListener("click", () => (qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1));
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeDrawer();
      closeSearch();
    }
  });

  /* ---------------- Search dialog ---------------- */
  const searchDialog = $(".search-dialog");
  const searchInput = $(".search-input-row input", searchDialog);
  const searchResults = $(".search-results", searchDialog);
  function openSearch() {
    if (!searchDialog || searchDialog.classList.contains("open")) return;
    searchDialog.classList.add("open");
    lockScroll();
    setTimeout(() => searchInput && searchInput.focus(), 200);
    renderSearch("");
  }
  function closeSearch() {
    if (!searchDialog || !searchDialog.classList.contains("open")) return;
    searchDialog.classList.remove("open");
    unlockScroll();
  }
  $$("[data-search-open]").forEach((btn) => btn.addEventListener("click", openSearch));
  if (searchDialog) {
    $(".search-close", searchDialog).addEventListener("click", closeSearch);
    searchDialog.addEventListener("click", (e) => {
      if (e.target === searchDialog) closeSearch();
    });
    searchInput.addEventListener("input", () => renderSearch(searchInput.value));
  }
  function renderSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    const matches = !q
      ? DemoData.getAllProducts().slice(0, 5)
      : DemoData.getAllProducts().filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.categoryLabel.toLowerCase().includes(q) ||
            p.colorLabel.toLowerCase().includes(q)
        );
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">No pouches found for "' + query + '". Try “leather”, “keychain” or a colour.</div>';
      return;
    }
    searchResults.innerHTML = matches
      .map(
        (p) =>
          '<a class="search-result-item" href="shop.html#' + p.id + '">' +
          '<img src="' + p.image + '" alt="">' +
          '<div><div class="title">' + p.name + '</div><div class="meta">' + p.categoryLabel + " · " + fmtINR(p.price) + "</div></div></a>"
      )
      .join("");
  }

  /* ---------------- Bulk price calculator (customize.html) ---------------- */
  const calc = $("[data-calc]");
  if (calc) {
    const qtyInput = $("[data-calc-qty]", calc);
    const range = $("[data-calc-range]", calc);
    const unitPriceEl = $("[data-calc-unit]", calc);
    const totalEl = $("[data-calc-total]", calc);
    const badge = $("[data-calc-badge]", calc);
    const dec = $("[data-calc-dec]", calc);
    const inc = $("[data-calc-inc]", calc);

    function tierFor(qty) {
      if (qty >= 200) return 12;
      if (qty >= 50) return 13;
      return 15;
    }
    function update(qty) {
      qty = Math.max(1, Math.min(1000, qty));
      qtyInput.value = qty;
      range.value = qty;
      const unit = tierFor(qty);
      unitPriceEl.innerHTML = "₹" + unit + " <span>/ pc</span>";
      totalEl.innerHTML = "Estimated total: <strong>" + fmtINR(unit * qty) + "</strong> for " + qty + " pcs";
      if (badge) badge.style.display = qty >= 50 ? "inline-flex" : "none";
    }
    qtyInput.addEventListener("input", () => update(parseInt(qtyInput.value, 10) || 1));
    range.addEventListener("input", () => update(parseInt(range.value, 10) || 1));
    if (dec) dec.addEventListener("click", () => update((parseInt(qtyInput.value, 10) || 1) - 10));
    if (inc) inc.addEventListener("click", () => update((parseInt(qtyInput.value, 10) || 1) + 10));
    update(50);
  }

  /* ---------------- Star picker (write a review) ---------------- */
  const starPicker = $(".star-picker");
  if (starPicker) {
    const stars = $$("i", starPicker);
    let current = 0;
    stars.forEach((star, i) => {
      star.addEventListener("click", () => {
        current = i + 1;
        starPicker.dataset.rating = current;
        stars.forEach((s, j) => s.classList.toggle("active", j <= i));
      });
      star.addEventListener("mouseenter", () => {
        stars.forEach((s, j) => s.classList.toggle("active", j <= i));
      });
    });
    starPicker.addEventListener("mouseleave", () => {
      stars.forEach((s, j) => s.classList.toggle("active", j < current));
    });
  }

  /* ---------------- Reviews page rendering ---------------- */
  const reviewGrid = $("[data-review-grid]");
  if (reviewGrid) {
    const STORE_KEY = "oaa_reviews_user";
    function getUserReviews() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
      } catch (e) {
        return [];
      }
    }
    function saveUserReviews(list) {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    }
    let activeFilter = "all";

    function allReviews() {
      return getUserReviews().concat(REVIEWS_SEED);
    }

    function initials(name) {
      return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    }

    function reviewCardHTML(r) {
      return (
        '<div class="review-card reveal in">' +
        '<div class="top"><div class="stars">' + starString(r.rating) + "</div>" +
        (r.verified ? '<span class="verified"><i class="fa-solid fa-circle-check"></i> Verified</span>' : "") +
        "</div>" +
        '<p class="text">' + r.text + "</p>" +
        '<div class="bywho"><div class="avatar">' + initials(r.name) + "</div>" +
        "<div><strong>" + r.name + "</strong><span>" + r.product + " · " + new Date(r.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) + "</span></div></div>" +
        "</div>"
      );
    }

    function renderReviews() {
      const list = allReviews().filter((r) => (activeFilter === "all" ? true : r.rating === Number(activeFilter)));
      reviewGrid.innerHTML = list.length
        ? list.map(reviewCardHTML).join("")
        : '<div class="empty-state" style="grid-column:1/-1;"><i class="fa-regular fa-comment-dots"></i><p>No reviews with this rating yet.</p></div>';
      renderSummary();
    }

    function renderSummary() {
      const list = allReviews();
      const total = list.length;
      const avg = total ? list.reduce((s, r) => s + r.rating, 0) / total : 0;
      const bigNum = $("[data-rating-avg]");
      const bigStars = $("[data-rating-stars]");
      const bigCount = $("[data-rating-count]");
      if (bigNum) bigNum.textContent = avg.toFixed(1);
      if (bigStars) bigStars.innerHTML = starString(avg);
      if (bigCount) bigCount.textContent = total + " reviews";
      for (let star = 5; star >= 1; star--) {
        const count = list.filter((r) => r.rating === star).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const fill = $('[data-bar="' + star + '"] .bar-fill');
        const pctLabel = $('[data-bar="' + star + '"] .pct');
        if (fill) fill.style.width = pct + "%";
        if (pctLabel) pctLabel.textContent = count;
      }
    }

    $$("[data-review-filter]").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$("[data-review-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.reviewFilter;
        renderReviews();
      })
    );

    const reviewForm = $("[data-review-form]");
    if (reviewForm) {
      reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = $("[name='name']", reviewForm).value.trim();
        const product = $("[name='product']", reviewForm).value;
        const text = $("[name='text']", reviewForm).value.trim();
        const rating = Number(starPicker ? starPicker.dataset.rating || 0 : 0);
        if (!name || !text || !rating) {
          showToast("Please add your name, a rating and a short review", "fa-triangle-exclamation");
          return;
        }
        const newReview = {
          id: "u" + Date.now(),
          name,
          rating,
          product,
          date: new Date().toISOString(),
          verified: false,
          text
        };
        const list = getUserReviews();
        list.unshift(newReview);
        saveUserReviews(list);
        reviewForm.reset();
        if (starPicker) {
          starPicker.dataset.rating = 0;
          $$("i", starPicker).forEach((s) => s.classList.remove("active"));
        }
        activeFilter = "all";
        $$("[data-review-filter]").forEach((b) => b.classList.toggle("active", b.dataset.reviewFilter === "all"));
        renderReviews();
        showToast("Thank you! Your review has been posted.", "fa-heart");
        document.getElementById("reviews-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    renderReviews();
    initAutoScrollRow(reviewGrid, 3200);
    enableDragScroll(reviewGrid);
  }

  /* ---------------- Placeholder links (social icons not yet set up) ---------------- */
  $$('a[href="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (a.title) showToast(a.title, "fa-circle-info");
    });
  });

  /* ---------------- Generic contact / order forms ---------------- */
  $$("[data-contact-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const required = $$("[required]", form);
      const missing = required.some((f) => !f.value.trim());
      if (missing) {
        showToast("Please fill in all required fields", "fa-triangle-exclamation");
        return;
      }
      const msg = $(".form-msg", form.closest("form, .form-card") || document);
      if (msg) {
        msg.classList.add("show");
        setTimeout(() => msg.classList.remove("show"), 5000);
      }
      form.reset();
      showToast("Message sent! We'll get back to you within a day.", "fa-paper-plane");
    });
  });

  $$("[data-order-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const required = $$("[required]", form);
      const missing = required.some((f) => !f.value.trim());
      if (missing) {
        showToast("Please fill in all required fields", "fa-triangle-exclamation");
        return;
      }
      const data = new FormData(form);
      let msg = "Hi ONE ABOVE ALL! I'd like to place a custom order.\n";
      for (const [key, value] of data.entries()) {
        if (value) msg += "- " + key + ": " + value + "\n";
      }
      window.open(waLink(msg), "_blank", "noopener");
      const msgBox = $(".form-msg", form);
      if (msgBox) {
        msgBox.classList.add("show");
        setTimeout(() => msgBox.classList.remove("show"), 6000);
      }
      form.reset();
    });
  });

  /* ---------------- Auto-scroll + drag-scroll for every other horizontal card row ---------------- */
  // product-grid/review-grid are wired individually above (they re-render dynamically);
  // these are static, so a single pass on load is enough.
  $$(".feature-strip, .steps-grid, .value-grid, .contact-info-grid, .proof-gallery").forEach((row) => {
    initAutoScrollRow(row, 3200);
    enableDragScroll(row);
  });
  $$(".chip-row").forEach(enableDragScroll);
})();
