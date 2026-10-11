/* ONE ABOVE ALL — demo data layer (front-end only simulation)
   No backend: everything lives in this browser's localStorage. Accounts,
   orders and admin content edits do NOT sync across devices/browsers and
   are not secure — this exists purely to demo the login/cart/order/admin
   flow end to end. */

const DemoData = (function () {
  "use strict";

  const KEYS = {
    users: "oaa_users",
    session: "oaa_session",
    adminSession: "oaa_admin_session",
    cart: "oaa_cart",
    orders: "oaa_orders",
    content: "oaa_admin_content",
    customProducts: "oaa_custom_products",
    hiddenProducts: "oaa_hidden_products"
  };

  const STATUS_FLOW = ["Placed", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

  function genId(prefix) {
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function readJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---------------- Seed accounts (fetched once) ---------------- */
  let seed = { customers: [], admins: [] };
  const ready = fetch("data/accounts.json")
    .then((r) => r.json())
    .then((data) => {
      seed = data;
    })
    .catch(() => {
      // offline/file:// fallback so login still works without the fetch
      seed = {
        customers: [{ id: "cust-demo-1", name: "Ananya Sharma", email: "demo@oneaboveall.test", password: "demo1234", phone: "9876543210" }],
        admins: [{ id: "admin-demo-1", name: "OAA Admin", email: "admin@oneaboveall.test", password: "admin1234" }]
      };
    });

  function allCustomers() {
    return seed.customers.concat(readJSON(KEYS.users, []));
  }

  /* ---------------- Customer auth ---------------- */
  function getCurrentUser() {
    return readJSON(KEYS.session, null);
  }
  function login(email, password) {
    return ready.then(() => {
      const user = allCustomers().find(
        (u) => u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password
      );
      if (!user) return { ok: false, error: "No account matches that email and password." };
      const session = { id: user.id, name: user.name, email: user.email, phone: user.phone || "" };
      writeJSON(KEYS.session, session);
      return { ok: true, user: session };
    });
  }
  function signup(fields) {
    return ready.then(() => {
      const email = String(fields.email || "").trim().toLowerCase();
      if (!fields.name || !email || !fields.password) {
        return { ok: false, error: "Please fill in all fields." };
      }
      if (allCustomers().some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: "An account with that email already exists." };
      }
      const user = {
        id: genId("cust"),
        name: fields.name.trim(),
        email,
        password: fields.password,
        phone: fields.phone || ""
      };
      const users = readJSON(KEYS.users, []);
      users.push(user);
      writeJSON(KEYS.users, users);
      const session = { id: user.id, name: user.name, email: user.email, phone: user.phone };
      writeJSON(KEYS.session, session);
      return { ok: true, user: session };
    });
  }
  function logout() {
    localStorage.removeItem(KEYS.session);
  }

  /* ---------------- Admin auth (separate session, no signup) ---------------- */
  function getCurrentAdmin() {
    return readJSON(KEYS.adminSession, null);
  }
  function adminLogin(email, password) {
    return ready.then(() => {
      const admin = seed.admins.find(
        (a) => a.email.toLowerCase() === String(email).trim().toLowerCase() && a.password === password
      );
      if (!admin) return { ok: false, error: "No admin account matches that email and password." };
      const session = { id: admin.id, name: admin.name, email: admin.email };
      writeJSON(KEYS.adminSession, session);
      return { ok: true, admin: session };
    });
  }
  function adminLogout() {
    localStorage.removeItem(KEYS.adminSession);
  }

  /* ---------------- Cart ---------------- */
  function getCart() {
    return readJSON(KEYS.cart, []);
  }
  function saveCart(cart) {
    writeJSON(KEYS.cart, cart);
  }
  function addToCart(productId, qty) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find((i) => i.productId === productId);
    if (existing) existing.qty += qty;
    else cart.push({ productId, qty });
    saveCart(cart);
    return cart;
  }
  function setCartQty(productId, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.productId === productId);
    if (!item) return cart;
    item.qty = Math.max(1, qty);
    saveCart(cart);
    return cart;
  }
  function removeFromCart(productId) {
    const cart = getCart().filter((i) => i.productId !== productId);
    saveCart(cart);
    return cart;
  }
  function clearCart() {
    saveCart([]);
  }
  function cartCount() {
    return getCart().reduce((s, i) => s + i.qty, 0);
  }
  function cartLines() {
    return getCart()
      .map((i) => {
        const p = getAllProducts().find((pp) => pp.id === i.productId);
        if (!p) return null;
        return { productId: p.id, name: p.name, image: p.image, unit: p.unit, qty: i.qty, price: p.price, lineTotal: p.price * i.qty };
      })
      .filter(Boolean);
  }
  function cartTotal() {
    return cartLines().reduce((s, l) => s + l.lineTotal, 0);
  }

  /* ---------------- Product catalog (admin-managed overlay on PRODUCTS) ---------------- */
  function getCustomProducts() {
    return readJSON(KEYS.customProducts, []);
  }
  function saveCustomProducts(list) {
    writeJSON(KEYS.customProducts, list);
  }
  function getHiddenProductIds() {
    return readJSON(KEYS.hiddenProducts, []);
  }
  function saveHiddenProductIds(list) {
    writeJSON(KEYS.hiddenProducts, list);
  }
  function setProductHidden(id, hidden) {
    let list = getHiddenProductIds();
    if (hidden) {
      if (!list.includes(id)) list.push(id);
    } else {
      list = list.filter((x) => x !== id);
    }
    saveHiddenProductIds(list);
  }
  // Every page's live product list (shop, featured, search, cart, quick view)
  // should call this instead of the raw PRODUCTS constant, so admin-added
  // products and admin-hidden products actually take effect site-wide.
  function getAllProducts() {
    const hidden = getHiddenProductIds();
    const base = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter((p) => !hidden.includes(p.id));
    const custom = getCustomProducts().filter((p) => !hidden.includes(p.id));
    return base.concat(custom);
  }
  function addProduct(values) {
    const list = getCustomProducts();
    const product = Object.assign(
      {
        id: genId("prod"),
        categoryLabel: { keychain: "Keychain Pouch", leather: "Leather Pouch", large: "Large Pouch" }[values.category] || "Pouch",
        colorLabel: values.color || "",
        colorHex: "#C7A253",
        unit: "pc",
        size: values.size || "",
        rating: 4.8,
        reviews: 0,
        tag: values.tag || null
      },
      values
    );
    list.push(product);
    saveCustomProducts(list);
    return product;
  }
  function updateProduct(id, values) {
    const list = getCustomProducts();
    const item = list.find((p) => p.id === id);
    if (item) Object.assign(item, values);
    saveCustomProducts(list);
  }
  function deleteCustomProduct(id) {
    saveCustomProducts(getCustomProducts().filter((p) => p.id !== id));
  }

  /* ---------------- Orders ---------------- */
  function daysAgo(n, hour) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour || 12, 15, 0, 0);
    return d.toISOString();
  }
  function seedOrders() {
    function order(id, userName, userEmail, items, status, placedDaysAgo, hour, otp) {
      const placedAt = daysAgo(placedDaysAgo, hour);
      const total = items.reduce((s, it) => s + it.lineTotal, 0);
      const statusHistory = [{ status: "Placed", at: placedAt }];
      if (status !== "Placed") statusHistory.push({ status, at: daysAgo(Math.max(0, placedDaysAgo - 1), hour) });
      return {
        id, userId: "seed-" + id, userName, userEmail, items, total,
        address: { name: userName, phone: "98xxxxxx10", line: "Flat 2B, Lotus Residency", city: "Bengaluru", pin: "560001" },
        paymentMethod: "UPI", status, otp: otp || null, statusHistory, placedAt
      };
    }
    const img = (id) => (PRODUCTS.find((p) => p.id === id) || {}).image;
    return [
      order("OAA-SEED1", "Priya Menon", "priya.menon@example.com",
        [{ productId: "royal-charm", name: "Royal Charm Keychain Trio", image: img("royal-charm"), unit: "pc", qty: 3, price: 15, lineTotal: 45 }],
        "Delivered", 12, 11),
      order("OAA-SEED2", "Simran Kaur", "simran.kaur@example.com",
        [{ productId: "storage-envelope", name: "Storage Envelope Clutch (Large)", image: img("storage-envelope"), unit: "pc", qty: 1, price: 249, lineTotal: 249 }],
        "Delivered", 9, 15),
      order("OAA-SEED3", "Neha Verma", "neha.verma@example.com",
        [{ productId: "floral-silk-set", name: "Floral Silk Keychain Set — 5 Shades", image: img("floral-silk-set"), unit: "pc", qty: 2, price: 15, lineTotal: 30 }],
        "Out for Delivery", 2, 10, "4821"),
      order("OAA-SEED4", "Divya Pillai", "divya.pillai@example.com",
        [
          { productId: "dusk-rose", name: "Dusk Rose Leather Pouch", image: img("dusk-rose"), unit: "pc", qty: 1, price: 149, lineTotal: 149 },
          { productId: "ocean-bloom", name: "Ocean Bloom Keychain Pouch", image: img("ocean-bloom"), unit: "pc", qty: 1, price: 15, lineTotal: 15 }
        ],
        "Shipped", 1, 17),
      order("OAA-SEED5", "Ritika Bansal", "ritika.bansal@example.com",
        [{ productId: "blossom-champagne", name: "Blossom & Champagne Duo", image: img("blossom-champagne"), unit: "pc", qty: 1, price: 149, lineTotal: 149 }],
        "Confirmed", 0, 9),
      order("OAA-SEED6", "Meera Iyer", "meera.iyer@example.com",
        [{ productId: "golden-hour", name: "Golden Hour Leather Pouch Set", image: img("golden-hour"), unit: "pc", qty: 2, price: 149, lineTotal: 298 }],
        "Placed", 0, 14),
      order("OAA-SEED7", "Tanya Joshi", "tanya.joshi@example.com",
        [{ productId: "classic-collection", name: "Classic Leather Pouch Collection", image: img("classic-collection"), unit: "pc", qty: 1, price: 149, lineTotal: 149 }],
        "Cancelled", 5, 12)
    ];
  }
  function getOrdersRaw() {
    let orders = readJSON(KEYS.orders, null);
    if (!orders || !orders.length) {
      orders = seedOrders();
      writeJSON(KEYS.orders, orders);
    }
    return orders;
  }
  function saveOrders(orders) {
    writeJSON(KEYS.orders, orders);
  }
  function placeOrder({ address, paymentMethod }) {
    const user = getCurrentUser();
    if (!user) return { ok: false, error: "Please log in first." };
    const lines = cartLines();
    if (!lines.length) return { ok: false, error: "Your cart is empty." };
    const now = new Date().toISOString();
    const order = {
      id: genId("OAA"),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: lines,
      total: lines.reduce((s, l) => s + l.lineTotal, 0),
      address,
      paymentMethod,
      status: "Placed",
      otp: null,
      statusHistory: [{ status: "Placed", at: now }],
      placedAt: now
    };
    const orders = getOrdersRaw();
    orders.push(order);
    saveOrders(orders);
    clearCart();
    return { ok: true, order };
  }
  function getOrdersForUser(userId) {
    return getOrdersRaw()
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  }
  function getAllOrders() {
    return getOrdersRaw().sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  }
  function getOrder(orderId) {
    return getOrdersRaw().find((o) => o.id === orderId) || null;
  }
  function advanceStatus(orderId, newStatus) {
    const orders = getOrdersRaw();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "Order not found." };
    if (newStatus === "Delivered") {
      return { ok: false, error: "Enter the delivery OTP to mark this order delivered." };
    }
    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, at: new Date().toISOString() });
    if (newStatus === "Out for Delivery" && !order.otp) {
      order.otp = String(Math.floor(1000 + Math.random() * 9000));
    }
    saveOrders(orders);
    return { ok: true, order };
  }
  function confirmDelivery(orderId, enteredOtp) {
    const orders = getOrdersRaw();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "Order not found." };
    if (!order.otp) return { ok: false, error: "This order hasn't reached Out for Delivery yet." };
    if (String(enteredOtp).trim() !== order.otp) return { ok: false, error: "That OTP doesn't match." };
    order.status = "Delivered";
    order.statusHistory.push({ status: "Delivered", at: new Date().toISOString() });
    saveOrders(orders);
    return { ok: true, order };
  }
  function cancelOrder(orderId) {
    const orders = getOrdersRaw();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, error: "Order not found." };
    order.status = "Cancelled";
    order.statusHistory.push({ status: "Cancelled", at: new Date().toISOString() });
    saveOrders(orders);
    return { ok: true, order };
  }

  /* ---------------- Admin content (homepage sections) ---------------- */
  function defaultContent() {
    return {
      shopCategories: [
        { id: "keychain", title: "Keychain Pouches", subtitle: "From ₹15/pc", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.27 PM.jpeg", link: "shop.html#keychain", priority: 1, enabled: true },
        { id: "leather", title: "Leather Pouches", subtitle: "From ₹149/pc", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.30 PM.jpeg", link: "shop.html#classic-collection", priority: 2, enabled: true },
        { id: "large", title: "Large Pouches", subtitle: "From ₹249/pc", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.28 PM (1).jpeg", link: "shop.html#storage-envelope", priority: 3, enabled: true },
        { id: "custom", title: "Custom & Bulk", subtitle: "For gifting & business", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.31 PM (1).jpeg", link: "customize.html", priority: 4, enabled: true }
      ],
      featuredProducts: [
        { productId: "royal-charm", priority: 1, enabled: true },
        { productId: "blossom-champagne", priority: 2, enabled: true },
        { productId: "ocean-bloom", priority: 3, enabled: true },
        { productId: "storage-envelope", priority: 4, enabled: true }
      ],
      proofGallery: [
        { id: "p1", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.28 PM.jpeg", title: "Designed for Everyday Carry", subtitle: "Roomy enough for stationery, glasses or cables.", priority: 1, enabled: true },
        { id: "p2", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.28 PM (3).jpeg", title: "Waterproof. Wipeable. Reliable.", subtitle: "Keeps your valuables protected, rain or shine.", priority: 2, enabled: true },
        { id: "p3", image: "images/products/WhatsApp Image 2026-10-08 at 11.01.29 PM.jpeg", title: "One Pouch, Endless Uses", subtitle: "Jewellery today, earbuds tomorrow, medicines on a trip.", priority: 3, enabled: true }
      ],
      testimonials: [
        { id: "t1", name: "Ananya Sharma", initials: "AS", rating: 5, product: "Royal Charm Keychain Trio", text: "These are so much prettier in person! I got the purple one on my keychain and it still looks brand new after two months of daily use.", priority: 1, enabled: true },
        { id: "t2", name: "Simran Kaur", initials: "SK", rating: 5, product: "Storage Envelope Clutch", text: "I run a small jewellery page and ordered these in bulk for packaging — customers kept asking where the pouch was from!", priority: 2, enabled: true },
        { id: "t3", name: "Kavita Reddy", initials: "KR", rating: 4, product: "Classic Leather Pouch Collection", text: "Lovely little pouches, use the navy one for earphones in my bag. Quality feels genuinely premium for the price.", priority: 3, enabled: true }
      ]
    };
  }
  function getContent() {
    let content = readJSON(KEYS.content, null);
    const defaults = defaultContent();
    if (!content) {
      content = defaults;
    } else {
      // backfill any keys missing from an older cached schema (e.g. a
      // browser that saved content before a section was added/renamed)
      // so a stale localStorage value can never crash the admin page.
      Object.keys(defaults).forEach((key) => {
        if (!Array.isArray(content[key])) content[key] = defaults[key];
      });
    }
    writeJSON(KEYS.content, content);
    return content;
  }
  function saveContent(content) {
    writeJSON(KEYS.content, content);
  }
  function enabledSorted(list) {
    return (list || []).filter((i) => i.enabled !== false).sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  return {
    ready,
    STATUS_FLOW,
    genId,
    getCurrentUser, login, signup, logout,
    getCurrentAdmin, adminLogin, adminLogout,
    getCart, addToCart, setCartQty, removeFromCart, clearCart, cartCount, cartLines, cartTotal,
    placeOrder, getOrdersForUser, getAllOrders, getOrder, advanceStatus, confirmDelivery, cancelOrder,
    getContent, saveContent, defaultContent, enabledSorted,
    getAllProducts, getCustomProducts, addProduct, updateProduct, deleteCustomProduct,
    getHiddenProductIds, setProductHidden
  };
})();

window.DemoData = DemoData;
