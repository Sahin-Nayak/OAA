/* ONE ABOVE ALL — admin dashboard (demo, localStorage only) */
(function () {
  "use strict";

  var fmt = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  // Wire up navigation FIRST, before any content rendering — so a bad
  // render (bad cached data, a future bug, whatever) can never again
  // leave the whole page looking unresponsive. Tab clicks and logout
  // always work regardless of what happens below.
  var logoutBtn = $("[data-admin-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      DemoData.adminLogout();
      window.location.href = "login.html";
    });
  }

  $$(".admin-nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".admin-nav-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var tab = btn.dataset.tab;
      $$(".admin-panel").forEach(function (p) { p.classList.toggle("active", p.dataset.panel === tab); });
    });
  });

  // getCurrentAdmin()/getContent()/getAllOrders() only read localStorage —
  // they don't need the accounts.json fetch, so don't gate the whole
  // dashboard behind that network request finishing.
  var admin = DemoData.getCurrentAdmin();
  if (!admin) {
    window.location.href = "login.html";
  } else {
    var nameEl = $("[data-admin-name]");
    if (nameEl) nameEl.textContent = admin.name;
    init();
  }

  function init() {
    try {
      renderSales();
      renderOrdersAdmin();
      renderProductList();
      renderGenericSection("categories");
      renderFeatured();
      renderGenericSection("proof");
      renderGenericSection("testimonials");
      renderReviewsAdmin();
    } catch (err) {
      console.error("Admin dashboard render error:", err);
    }
  }

  /* ---------------- Sales ---------------- */
  function renderSales(fromStr, toStr) {
    if (!$("[data-sales-rows]")) return;
    var orders = DemoData.getAllOrders();
    if (fromStr) orders = orders.filter(function (o) { return o.placedAt.slice(0, 10) >= fromStr; });
    if (toStr) orders = orders.filter(function (o) { return o.placedAt.slice(0, 10) <= toStr; });
    var revenue = orders.reduce(function (s, o) { return s + o.total; }, 0);
    $("[data-stat-orders]").textContent = orders.length;
    $("[data-stat-revenue]").textContent = fmt(revenue);
    $("[data-stat-avg]").textContent = fmt(orders.length ? Math.round(revenue / orders.length) : 0);
    $("[data-sales-rows]").innerHTML = orders.map(function (o) {
      return "<tr><td>" + o.id + "</td><td>" + new Date(o.placedAt).toLocaleDateString("en-IN") + "</td><td>" + (o.userName || o.userId) + "</td><td>" + o.items.length + "</td><td>" + fmt(o.total) + "</td><td><span class='status-badge s-" + o.status.toLowerCase().replace(/ /g, "") + "'>" + o.status + "</span></td></tr>";
    }).join("") || "<tr><td colspan='6' style='text-align:center;color:var(--ink-faint);padding:30px;'>No orders in this range.</td></tr>";
  }
  var salesApply = $("[data-sales-apply]");
  if (salesApply) salesApply.addEventListener("click", function () { renderSales($("[data-sales-from]").value, $("[data-sales-to]").value); });
  var salesReset = $("[data-sales-reset]");
  if (salesReset) salesReset.addEventListener("click", function () {
    $("[data-sales-from]").value = "";
    $("[data-sales-to]").value = "";
    renderSales();
  });

  /* ---------------- Orders ---------------- */
  function renderOrdersAdmin() {
    var wrap = $("[data-orders-admin-list]");
    if (!wrap) return;
    var orders = DemoData.getAllOrders();
    if (!orders.length) { wrap.innerHTML = "<p style='color:var(--ink-faint);'>No orders yet.</p>"; return; }
    var flow = DemoData.STATUS_FLOW;
    wrap.innerHTML = orders.map(function (o) {
      var badgeClass = "s-" + o.status.toLowerCase().replace(/ /g, "");
      var idx = flow.indexOf(o.status);
      var actionsHTML;
      if (o.status === "Cancelled" || o.status === "Delivered") {
        actionsHTML = "<span style='font-size:0.78rem;color:var(--ink-faint);'>No further action</span>";
      } else if (o.status === "Out for Delivery") {
        actionsHTML =
          "<input type='text' placeholder='Enter OTP' maxlength='4' style='width:100px;padding:9px 10px;border:1px solid var(--line);border-radius:8px;' data-otp-input='" + o.id + "'>" +
          "<button class='admin-mini-btn' data-confirm-delivery='" + o.id + "'>Confirm Delivered</button>" +
          "<button class='admin-mini-btn' data-cancel='" + o.id + "'>Cancel</button>";
      } else {
        var next = flow[idx + 1];
        actionsHTML =
          "<button class='admin-mini-btn' data-advance='" + o.id + "' data-next='" + next + "'>Mark as " + next + "</button>" +
          "<button class='admin-mini-btn' data-cancel='" + o.id + "'>Cancel</button>";
      }
      var itemsHTML = o.items.map(function (it) { return it.name + " ×" + it.qty; }).join(", ");
      return "<div class='order-card'>" +
        "<div class='top-row'><div><div class='order-id'>" + o.id + "</div><div class='order-meta'>" + (o.userName || "") + " · " + new Date(o.placedAt).toLocaleString("en-IN") + " · " + fmt(o.total) + "</div></div>" +
        "<span class='status-badge " + badgeClass + "'>" + o.status + "</span></div>" +
        "<p style='font-size:0.84rem;color:var(--ink-soft);margin-bottom:14px;'>" + itemsHTML + "</p>" +
        "<div style='display:flex;gap:10px;flex-wrap:wrap;align-items:center;'>" + actionsHTML + "</div>" +
        "</div>";
    }).join("");

    $$("[data-advance]", wrap).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var res = DemoData.advanceStatus(btn.dataset.advance, btn.dataset.next);
        if (!res.ok) { alert(res.error); return; }
        renderOrdersAdmin();
        renderSales();
      });
    });
    $$("[data-cancel]", wrap).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("Cancel this order?")) return;
        DemoData.cancelOrder(btn.dataset.cancel);
        renderOrdersAdmin();
        renderSales();
      });
    });
    $$("[data-confirm-delivery]", wrap).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.confirmDelivery;
        var input = $("[data-otp-input='" + id + "']", wrap);
        var res = DemoData.confirmDelivery(id, input.value);
        if (!res.ok) { alert(res.error); return; }
        renderOrdersAdmin();
        renderSales();
      });
    });
  }

  /* ---------------- Products ---------------- */
  var PRODUCT_FIELDS = [
    { key: "name", label: "Product name", type: "text" },
    { key: "category", label: "Category", type: "select", options: [["keychain", "Keychain Pouch"], ["leather", "Leather Pouch"], ["large", "Large Pouch"]] },
    { key: "color", label: "Colour (e.g. blue)", type: "text" },
    { key: "colorLabel", label: "Colour label shown to customers", type: "text" },
    { key: "price", label: "Retail price (₹)", type: "number" },
    { key: "bulkPrice", label: "Bulk price (₹)", type: "number" },
    { key: "size", label: "Size (e.g. 7 x 5.5 cm)", type: "text" },
    { key: "image", label: "Image path", type: "text", full: true },
    { key: "desc", label: "Description", type: "textarea", full: true },
    { key: "tag", label: "Badge", type: "select", options: [["", "None"], ["Bestseller", "Bestseller"], ["New", "New"]] }
  ];

  function renderProductList() {
    var listEl = $("[data-product-list]");
    if (!listEl) return;
    var customIds = DemoData.getCustomProducts().map(function (p) { return p.id; });
    var hidden = DemoData.getHiddenProductIds();
    var all = (window.PRODUCTS || []).concat(DemoData.getCustomProducts());
    listEl.innerHTML = all.map(function (p) {
      var isCustom = customIds.indexOf(p.id) !== -1;
      var isHidden = hidden.indexOf(p.id) !== -1;
      return "<div class='admin-item-row'><img src='" + p.image + "' alt=''>" +
        "<div class='info'><strong>" + p.name + (isHidden ? " (hidden)" : "") + "</strong><span>" + p.categoryLabel + " · " + fmt(p.price) + (isCustom ? "" : " · Built-in") + "</span></div>" +
        "<div class='ctrls'>" +
        "<label style='font-size:0.7rem;display:flex;align-items:center;gap:4px;'><input type='checkbox' " + (isHidden ? "" : "checked") + " data-product-visible='" + p.id + "'> Show in shop</label>" +
        (isCustom ? "<button class='admin-mini-btn' data-edit-product='" + p.id + "'>Edit</button><button class='admin-mini-btn' data-delete-product='" + p.id + "'>Delete</button>" : "") +
        "</div></div>";
    }).join("") || "<p style='color:var(--ink-faint);'>No products found.</p>";

    $$("[data-product-visible]", listEl).forEach(function (chk) {
      chk.addEventListener("change", function () {
        DemoData.setProductHidden(chk.dataset.productVisible, !chk.checked);
        renderProductList();
      });
    });
    $$("[data-delete-product]", listEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("Delete this product?")) return;
        DemoData.deleteCustomProduct(btn.dataset.deleteProduct);
        renderProductList();
      });
    });
    $$("[data-edit-product]", listEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = DemoData.getCustomProducts().find(function (p) { return p.id === btn.dataset.editProduct; });
        renderProductForm(item);
      });
    });
  }

  function renderProductForm(editItem) {
    var editId = editItem ? editItem.id : null;
    var formWrap = $("[data-product-form]");
    formWrap.hidden = false;
    formWrap.innerHTML = "<h3 style='font-size:0.98rem;margin-bottom:14px;'>" + (editItem ? "Edit Product" : "Add New Product") + "</h3>" +
      "<div class='admin-inline-form'>" +
      PRODUCT_FIELDS.map(function (f) {
        var val = editItem ? (editItem[f.key] != null ? editItem[f.key] : "") : "";
        var cls = f.full ? "full" : "";
        if (f.type === "textarea") return "<textarea class='" + cls + "' placeholder='" + f.label + "' data-pf='" + f.key + "'>" + val + "</textarea>";
        if (f.type === "select") return "<select class='" + cls + "' data-pf='" + f.key + "'>" + f.options.map(function (o) { return "<option value='" + o[0] + "'" + (String(val) === String(o[0]) ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
        return "<input type='" + (f.type === "number" ? "number" : "text") + "' class='" + cls + "' placeholder='" + f.label + "' value='" + String(val).replace(/'/g, "&#39;") + "' data-pf='" + f.key + "'>";
      }).join("") +
      "<button class='btn btn-primary btn-sm full' type='button' data-save-product>" + (editItem ? "Save Changes" : "Add Product") + "</button>" +
      "<button class='btn btn-outline btn-sm full' type='button' data-cancel-product>Cancel</button>" +
      "</div>";

    $("[data-save-product]", formWrap).addEventListener("click", function () {
      var values = {};
      PRODUCT_FIELDS.forEach(function (f) {
        var el = $("[data-pf='" + f.key + "']", formWrap);
        var v = el.value;
        if (f.key === "price" || f.key === "bulkPrice") v = parseInt(v, 10) || 0;
        if (f.key === "tag" && v === "") v = null;
        values[f.key] = v;
      });
      if (!values.name) { alert("Please enter a product name."); return; }
      if (editId) {
        DemoData.updateProduct(editId, values);
      } else {
        DemoData.addProduct(values);
      }
      formWrap.hidden = true;
      formWrap.innerHTML = "";
      renderProductList();
      showAdminToast(editId ? "Product updated" : "Product added");
    });
    $("[data-cancel-product]", formWrap).addEventListener("click", function () {
      formWrap.hidden = true;
      formWrap.innerHTML = "";
    });
  }

  var addProductBtn = $("[data-add-product]");
  if (addProductBtn) addProductBtn.addEventListener("click", function () { renderProductForm(null); });

  /* ---------------- Generic content sections (categories / proof / testimonials) ---------------- */
  var CONTENT_KEY = { categories: "shopCategories", proof: "proofGallery", testimonials: "testimonials" };
  var SECTION_FIELDS = {
    categories: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle (e.g. From ₹15/pc)", type: "text" },
      { key: "image", label: "Image path", type: "text" },
      { key: "link", label: "Link (e.g. shop.html#keychain)", type: "text" }
    ],
    proof: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "image", label: "Image path", type: "text" }
    ],
    testimonials: [
      { key: "name", label: "Customer name", type: "text" },
      { key: "initials", label: "Initials (e.g. AS)", type: "text" },
      { key: "product", label: "Product", type: "text" },
      { key: "rating", label: "Rating", type: "select", options: [5, 4, 3, 2, 1] },
      { key: "text", label: "Testimonial text", type: "textarea", full: true }
    ]
  };

  function renderGenericSection(tab) {
    var listEl = $("[data-list='" + tab + "']");
    if (!listEl) return;
    var content = DemoData.getContent();
    var key = CONTENT_KEY[tab];
    var list = (content[key] || []).slice().sort(function (a, b) { return (a.priority || 0) - (b.priority || 0); });
    listEl.innerHTML = list.map(function (item) {
      var title = item.title || item.name || "(untitled)";
      var sub = item.subtitle || item.product || "";
      var img = item.image
        ? "<img src='" + item.image + "' alt=''>"
        : "<div style='width:54px;height:54px;border-radius:10px;background:var(--cream-soft);flex-shrink:0;'></div>";
      return "<div class='admin-item-row'>" + img +
        "<div class='info'><strong>" + title + (item.enabled === false ? " (hidden)" : "") + "</strong><span>" + sub + "</span></div>" +
        "<div class='ctrls'>" +
        "<label style='font-size:0.7rem;color:var(--ink-faint);display:flex;align-items:center;gap:4px;'>Priority <input type='number' value='" + (item.priority || 1) + "' data-priority='" + item.id + "'></label>" +
        "<label style='font-size:0.7rem;display:flex;align-items:center;gap:4px;'><input type='checkbox' " + (item.enabled !== false ? "checked" : "") + " data-enabled='" + item.id + "'> Show</label>" +
        "<button class='admin-mini-btn' data-edit='" + item.id + "'>Edit</button>" +
        "<button class='admin-mini-btn' data-delete='" + item.id + "'>Delete</button>" +
        "</div></div>";
    }).join("") || "<p style='color:var(--ink-faint);margin-bottom:16px;'>Nothing added yet.</p>";

    $$("[data-priority]", listEl).forEach(function (input) {
      input.addEventListener("change", function () {
        var c = DemoData.getContent();
        var item = c[key].find(function (i) { return i.id === input.dataset.priority; });
        if (item) { item.priority = parseInt(input.value, 10) || 1; DemoData.saveContent(c); }
      });
    });
    $$("[data-enabled]", listEl).forEach(function (input) {
      input.addEventListener("change", function () {
        var c = DemoData.getContent();
        var item = c[key].find(function (i) { return i.id === input.dataset.enabled; });
        if (item) { item.enabled = input.checked; DemoData.saveContent(c); }
      });
    });
    $$("[data-delete]", listEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("Delete this item?")) return;
        var c = DemoData.getContent();
        c[key] = c[key].filter(function (i) { return i.id !== btn.dataset.delete; });
        DemoData.saveContent(c);
        renderGenericSection(tab);
      });
    });
    $$("[data-edit]", listEl).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var c = DemoData.getContent();
        var item = c[key].find(function (i) { return i.id === btn.dataset.edit; });
        renderForm(tab, item);
      });
    });
  }

  function renderForm(tab, editItem) {
    var editId = editItem ? editItem.id : null;
    var formWrap = $("[data-form='" + tab + "']");
    var fields = SECTION_FIELDS[tab];
    formWrap.hidden = false;
    formWrap.innerHTML = "<h3 style='font-size:0.98rem;margin-bottom:14px;'>" + (editItem ? "Edit Item" : "Add New Item") + "</h3>" +
      "<div class='admin-inline-form'>" +
      fields.map(function (f) {
        var val = editItem ? (editItem[f.key] != null ? editItem[f.key] : "") : "";
        var cls = f.full ? "full" : "";
        if (f.type === "textarea") return "<textarea class='" + cls + "' placeholder='" + f.label + "' data-f='" + f.key + "'>" + val + "</textarea>";
        if (f.type === "select") return "<select class='" + cls + "' data-f='" + f.key + "'>" + f.options.map(function (o) { return "<option value='" + o + "'" + (String(val) === String(o) ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select>";
        return "<input type='text' class='" + cls + "' placeholder='" + f.label + "' value='" + String(val).replace(/'/g, "&#39;") + "' data-f='" + f.key + "'>";
      }).join("") +
      "<button class='btn btn-primary btn-sm full' type='button' data-save-item>" + (editItem ? "Save Changes" : "Add Item") + "</button>" +
      "<button class='btn btn-outline btn-sm full' type='button' data-cancel-item>Cancel</button>" +
      "</div>";

    $("[data-save-item]", formWrap).addEventListener("click", function () {
      var key = CONTENT_KEY[tab];
      var c = DemoData.getContent();
      var values = {};
      fields.forEach(function (f) {
        var el = $("[data-f='" + f.key + "']", formWrap);
        values[f.key] = f.type === "select" ? parseInt(el.value, 10) : el.value;
      });
      var target = editId ? c[key].find(function (i) { return i.id === editId; }) : null;
      if (target) {
        Object.assign(target, values);
      } else {
        values.id = DemoData.genId(tab);
        values.priority = (c[key].length ? Math.max.apply(null, c[key].map(function (i) { return i.priority || 0; })) : 0) + 1;
        values.enabled = true;
        c[key].push(values);
      }
      DemoData.saveContent(c);
      formWrap.hidden = true;
      formWrap.innerHTML = "";
      renderGenericSection(tab);
    });
    $("[data-cancel-item]", formWrap).addEventListener("click", function () {
      formWrap.hidden = true;
      formWrap.innerHTML = "";
    });
  }

  $$("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () { renderForm(btn.dataset.add, null); });
  });

  /* ---------------- Featured products ---------------- */
  function renderFeatured() {
    var listEl = $("[data-featured-list]");
    if (!listEl) return;
    var content = DemoData.getContent();
    var selected = {};
    (content.featuredProducts || []).forEach(function (f) { selected[f.productId] = f; });
    listEl.innerHTML = DemoData.getAllProducts().map(function (p) {
      var f = selected[p.id];
      return "<div class='admin-item-row'><img src='" + p.image + "' alt=''>" +
        "<div class='info'><strong>" + p.name + "</strong><span>" + p.categoryLabel + " · " + fmt(p.price) + "</span></div>" +
        "<div class='ctrls'>" +
        "<label style='font-size:0.7rem;color:var(--ink-faint);display:flex;align-items:center;gap:4px;'>Priority <input type='number' value='" + (f ? f.priority : 1) + "' data-fpriority='" + p.id + "'></label>" +
        "<label style='font-size:0.78rem;display:flex;align-items:center;gap:4px;'><input type='checkbox' " + (f ? "checked" : "") + " data-fenabled='" + p.id + "'> Featured</label>" +
        "</div></div>";
    }).join("");
  }
  var featuredSave = $("[data-featured-save]");
  if (featuredSave) {
    featuredSave.addEventListener("click", function () {
      var c = DemoData.getContent();
      var result = [];
      $$("[data-fenabled]").forEach(function (chk) {
        if (!chk.checked) return;
        var priorityInput = $("[data-fpriority='" + chk.dataset.fenabled + "']");
        result.push({ productId: chk.dataset.fenabled, priority: parseInt(priorityInput.value, 10) || 1, enabled: true });
      });
      c.featuredProducts = result;
      DemoData.saveContent(c);
      showAdminToast("Featured products saved");
    });
  }

  /* ---------------- Reviews ---------------- */
  function renderReviewsAdmin() {
    var wrap = $("[data-reviews-admin-list]");
    if (!wrap) return;
    var stored = JSON.parse(localStorage.getItem("oaa_reviews_user") || "[]");
    var all = stored.concat(window.REVIEWS_SEED || []);
    wrap.innerHTML = "<div class='admin-table-wrap'><table class='admin-table'><thead><tr><th>Name</th><th>Product</th><th>Rating</th><th>Text</th></tr></thead><tbody>" +
      all.map(function (r) {
        return "<tr><td>" + r.name + "</td><td>" + r.product + "</td><td>" + r.rating + "★</td><td style='max-width:360px;'>" + r.text + "</td></tr>";
      }).join("") +
      "</tbody></table></div>";
  }
  var rvAdd = $("[data-rv-add]");
  if (rvAdd) {
    rvAdd.addEventListener("click", function () {
      var name = $("[data-rv-name]").value.trim();
      var product = $("[data-rv-product]").value.trim();
      var text = $("[data-rv-text]").value.trim();
      var rating = parseInt($("[data-rv-rating]").value, 10);
      if (!name || !product || !text) { alert("Please fill in all review fields."); return; }
      var stored = JSON.parse(localStorage.getItem("oaa_reviews_user") || "[]");
      stored.unshift({ id: "admin" + Date.now(), name: name, rating: rating, product: product, date: new Date().toISOString(), verified: true, text: text });
      localStorage.setItem("oaa_reviews_user", JSON.stringify(stored));
      $("[data-rv-name]").value = "";
      $("[data-rv-product]").value = "";
      $("[data-rv-text]").value = "";
      renderReviewsAdmin();
      showAdminToast("Review added");
    });
  }

  function showAdminToast(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#391420;color:#fff;padding:12px 22px;border-radius:999px;font-size:0.85rem;z-index:999;box-shadow:0 14px 36px rgba(0,0,0,.2);";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
})();
