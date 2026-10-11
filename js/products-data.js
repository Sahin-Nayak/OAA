/* ONE ABOVE ALL — Product catalogue (demo data) */

const WA_NUMBER = "918882878046"; // used for all WhatsApp deep links
const WA_DISPLAY = "+91 88828 78046";

const PRODUCTS = [
  {
    id: "royal-charm",
    name: "Royal Charm Keychain Trio",
    category: "keychain",
    categoryLabel: "Keychain Pouch",
    color: "purple",
    colorLabel: "Purple, Blue & Gold",
    colorHex: "#6A3FA0",
    price: 15,
    bulkPrice: 12,
    unit: "pc",
    size: "6.5 x 6 cm",
    rating: 4.9,
    reviews: 52,
    tag: "Bestseller",
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.27 PM (1).jpeg",
    desc: "A trio of hand-finished silk brocade mini pouches on a sturdy keyring — perfect for coins, earrings or a tiny gift. Shown in Purple, Ocean Blue and Champagne Gold."
  },
  {
    id: "floral-silk-set",
    name: "Floral Silk Keychain Set — 5 Shades",
    category: "keychain",
    categoryLabel: "Keychain Pouch",
    color: "pink",
    colorLabel: "5 Colour Options",
    colorHex: "#D08A96",
    price: 15,
    bulkPrice: 12,
    unit: "pc",
    size: "7.5 x 7 cm",
    rating: 4.8,
    reviews: 41,
    tag: null,
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.27 PM.jpeg",
    desc: "Jacquard floral pouches with a brass snap closure and keyring, available in Purple, Blue, Gold, Grey and Blush Pink. Mix and match for gifting."
  },
  {
    id: "ocean-bloom",
    name: "Ocean Bloom Keychain Pouch",
    category: "keychain",
    categoryLabel: "Keychain Pouch",
    color: "blue",
    colorLabel: "Ocean Blue",
    colorHex: "#2F6E93",
    price: 15,
    bulkPrice: 12,
    unit: "pc",
    size: "7.5 cm",
    rating: 4.7,
    reviews: 24,
    tag: "New",
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.28 PM (2).jpeg",
    desc: "A compact 7.5cm floral-textured pouch in deep ocean blue — light enough for a keychain, roomy enough for your little essentials."
  },
  {
    id: "classic-collection",
    name: "Classic Leather Pouch Collection",
    category: "leather",
    categoryLabel: "Leather Pouch",
    color: "navy",
    colorLabel: "Navy, Grey, Pink & Mauve",
    colorHex: "#32465A",
    price: 149,
    bulkPrice: 119,
    unit: "pc",
    size: "7 x 5.5 cm",
    rating: 4.8,
    reviews: 33,
    tag: null,
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.30 PM.jpeg",
    desc: "Our signature scalloped-flap PU leather pouch, offered across four everyday shades. Soft structure, wipeable finish, snap closure."
  },
  {
    id: "dusk-rose",
    name: "Dusk Rose Leather Pouch",
    category: "leather",
    categoryLabel: "Leather Pouch",
    color: "mauve",
    colorLabel: "Dusk Mauve",
    colorHex: "#A9707B",
    price: 149,
    bulkPrice: 119,
    unit: "pc",
    size: "7 x 5.5 cm",
    rating: 4.9,
    reviews: 29,
    tag: null,
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.30 PM (1).jpeg",
    desc: "A refined envelope pouch in dusty mauve PU leather with a soft snap closure — ideal for rings, studs, cash or small tools."
  },
  {
    id: "blossom-champagne",
    name: "Blossom & Champagne Duo",
    category: "leather",
    categoryLabel: "Leather Pouch",
    color: "gold",
    colorLabel: "Blush & Champagne",
    colorHex: "#D8B978",
    price: 149,
    bulkPrice: 119,
    unit: "pc",
    size: "7 x 6 cm",
    rating: 4.9,
    reviews: 46,
    tag: "Bestseller",
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.31 PM (1).jpeg",
    desc: "Our best-loved colourway — soft blush pink paired with shimmering champagne leather. Beautiful alone or gifted as a pair."
  },
  {
    id: "golden-hour",
    name: "Golden Hour Leather Pouch Set",
    category: "leather",
    categoryLabel: "Leather Pouch",
    color: "gold",
    colorLabel: "Champagne Gold",
    colorHex: "#C7A253",
    price: 149,
    bulkPrice: 119,
    unit: "pc",
    size: "7 x 6 cm",
    rating: 4.7,
    reviews: 19,
    tag: null,
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.31 PM.jpeg",
    desc: "Warm champagne-gold pouches with a pearlescent finish — catches the light beautifully, perfect for festive gifting."
  },
  {
    id: "storage-envelope",
    name: "Storage Envelope Clutch (Large)",
    category: "large",
    categoryLabel: "Large Pouch",
    color: "pink",
    colorLabel: "Dusty Rose",
    colorHex: "#C97B86",
    price: 249,
    bulkPrice: 199,
    unit: "pc",
    size: "17 x 6 cm",
    rating: 4.8,
    reviews: 17,
    tag: "New",
    image: "images/products/WhatsApp Image 2026-10-08 at 11.01.28 PM (1).jpeg",
    desc: "A roomy envelope pouch that fits sunglasses, stationery, cables or makeup — our largest silhouette yet, same signature finish."
  }
];

const CATEGORY_LABELS = {
  all: "All Pouches",
  keychain: "Keychain Pouches",
  leather: "Leather Pouches",
  large: "Large Pouches"
};

// top-level `const` does not attach to `window` in classic scripts — other
// files that check `window.PRODUCTS` as an existence guard need this.
window.PRODUCTS = PRODUCTS;
window.CATEGORY_LABELS = CATEGORY_LABELS;
window.WA_NUMBER = WA_NUMBER;
window.WA_DISPLAY = WA_DISPLAY;
