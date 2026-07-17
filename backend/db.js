// ============================================================
// db.js — JSON file database (lowdb) + auto-seed on first run
//
// Product images/data are pulled LIVE from DummyJSON (https://dummyjson.com) —
// a free, public API built specifically for e-commerce demos/prototypes, so
// every product has a REAL name, REAL brand, REAL price/rating, and a REAL
// photo (hosted on DummyJSON's own CDN, not scraped — safe & reliable).
//
// DummyJSON doesn't have Books / Toys & Baby / Pet Supplies categories, so
// those three are filled in with the synthetic icon-tile generator instead
// (clearly marked with photo:null) — see README for details.
// ============================================================
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

db.defaults({
  products: [],
  users: [],
  orders: [],
  reviews: [],
  coupons: [
    { code: 'WELCOME', pct: 15 },
    { code: 'SAVE10', pct: 10 },
    { code: 'SHOPWAVE', pct: 20 }
  ]
}).write();

// Maps DummyJSON's raw category slugs -> our India-style storefront categories + a friendly subcategory label.
const CATEGORY_MAP = {
  smartphones:        { category: 'Electronics', subcategory: 'Smartphones' },
  laptops:             { category: 'Electronics', subcategory: 'Laptops' },
  tablets:             { category: 'Electronics', subcategory: 'Tablets' },
  'mobile-accessories': { category: 'Electronics', subcategory: 'Computer Accessories' },
  'mens-shirts':       { category: 'Fashion', subcategory: "Men's Clothing" },
  tops:                { category: 'Fashion', subcategory: "Women's Clothing" },
  'womens-dresses':    { category: 'Fashion', subcategory: "Women's Clothing" },
  'mens-shoes':        { category: 'Fashion', subcategory: 'Footwear' },
  'womens-shoes':      { category: 'Fashion', subcategory: 'Footwear' },
  'mens-watches':      { category: 'Fashion', subcategory: 'Watches' },
  'womens-watches':    { category: 'Fashion', subcategory: 'Watches' },
  'womens-bags':       { category: 'Fashion', subcategory: 'Handbags' },
  'womens-jewellery':  { category: 'Fashion', subcategory: 'Jewelry' },
  sunglasses:          { category: 'Fashion', subcategory: 'Sunglasses' },
  beauty:              { category: 'Beauty & Personal Care', subcategory: 'Makeup' },
  fragrances:          { category: 'Beauty & Personal Care', subcategory: 'Perfumes' },
  'skin-care':         { category: 'Beauty & Personal Care', subcategory: 'Skincare' },
  furniture:           { category: 'Home & Kitchen', subcategory: 'Furniture' },
  'home-decoration':   { category: 'Home & Kitchen', subcategory: 'Home Decor' },
  'kitchen-accessories': { category: 'Home & Kitchen', subcategory: 'Kitchen Appliances' },
  groceries:           { category: 'Grocery', subcategory: 'Packaged Foods' },
  'sports-accessories': { category: 'Sports & Fitness', subcategory: 'Outdoor Sports' },
  motorcycle:          { category: 'Automotive', subcategory: 'Bike Accessories' },
  vehicle:             { category: 'Automotive', subcategory: 'Car Accessories' }
};

const EMOJI_BY_CATEGORY = {
  Electronics: '💻', Fashion: '👗', 'Beauty & Personal Care': '💄',
  'Home & Kitchen': '🍳', Grocery: '🛒', 'Sports & Fitness': '🏋️',
  Automotive: '🚗', Books: '📚', 'Toys & Baby': '🧸', 'Pet Supplies': '🐶'
};

// ---------- FETCH REAL PRODUCTS FROM DUMMYJSON ----------
async function fetchRealProducts() {
  const res = await fetch('https://dummyjson.com/products?limit=0');
  if (!res.ok) throw new Error('DummyJSON request failed: ' + res.status);
  const data = await res.json();
  return data.products.map(p => {
    const map = CATEGORY_MAP[p.category] || { category: 'Home & Kitchen', subcategory: p.category };
    const originalPrice = p.discountPercentage > 1 ? +(p.price / (1 - p.discountPercentage / 100)).toFixed(2) : 0;
    const badgeRoll = Math.random();
    const badge = p.stock === 0 ? null : p.discountPercentage > 15 ? 'sale' : badgeRoll > 0.85 ? 'hot' : badgeRoll > 0.72 ? 'new' : null;
    const badgeText = badge === 'hot' ? '🔥 Hot' : badge === 'new' ? '✨ New' : badge === 'sale' ? `${Math.round(p.discountPercentage)}% OFF` : null;
    return {
      id: p.id,
      name: p.title,
      brand: p.brand || map.category,
      category: map.category,
      subcategory: map.subcategory,
      price: p.price,
      originalPrice,
      rating: +p.rating.toFixed(1),
      reviews: (p.reviews && p.reviews.length ? p.reviews.length * 137 : 0) + Math.floor(Math.random() * 900) + 20,
      badge, badgeText,
      emoji: EMOJI_BY_CATEGORY[map.category] || '📦',
      photo: p.thumbnail,
      stock: p.stock,
      description: p.description,
      tags: p.tags && p.tags.length ? p.tags : [map.subcategory.toLowerCase()],
      colors: ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399'],
      sizes: map.subcategory === 'Footwear' ? ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'] : (map.category === 'Fashion' && (map.subcategory.includes('Clothing'))) ? ['S', 'M', 'L', 'XL'] : ['Standard'],
      images: (p.images && p.images.length ? p.images : [p.thumbnail])
    };
  });
}

// ---------- SYNTHETIC FALLBACK GENERATOR (used for Books / Toys & Baby / Pet Supplies,
// and as an offline fallback if DummyJSON can't be reached) ----------
function generateSynthetic(category, subcatDefs, count, startId) {
  const TAGS_POOL = ['bestseller', 'trending', 'premium', 'eco-friendly', 'limited-edition', 'handpicked', 'durable', 'giftable', 'everyday-use'];
  const emoji = EMOJI_BY_CATEGORY[category] || '📦';
  const products = [];
  let id = startId;
  for (let i = 0; i < count; i++) {
    const sub = subcatDefs[i % subcatDefs.length];
    const adj = sub.adj[Math.floor(i / subcatDefs.length) % sub.adj.length];
    const noun = sub.nouns[i % sub.nouns.length];
    const basePrice = +(9 + Math.random() * 200).toFixed(2);
    const hasDiscount = Math.random() > 0.4;
    const originalPrice = hasDiscount ? +(basePrice * (1 + Math.random() * 0.4)).toFixed(2) : 0;
    const rating = +(3.6 + Math.random() * 1.4).toFixed(1);
    const stock = Math.random() > 0.08 ? Math.floor(Math.random() * 60) : 0;
    const badgeRoll = Math.random();
    const badge = stock === 0 ? null : badgeRoll > 0.85 ? 'hot' : badgeRoll > 0.7 ? 'new' : badgeRoll > 0.55 ? 'sale' : null;
    const badgeText = badge === 'hot' ? '🔥 Hot' : badge === 'new' ? '✨ New' : badge === 'sale' ? 'Sale' : null;
    products.push({
      id: id++,
      name: `${adj} ${noun}`,
      brand: category,
      category,
      subcategory: sub.name,
      price: basePrice,
      originalPrice,
      rating,
      reviews: Math.floor(Math.random() * 3000) + 15,
      badge, badgeText,
      emoji,
      photo: null, // no real photo source available for this category — see README
      stock,
      description: `${adj} ${noun} from our ${sub.name} range — quality checked and ready to ship.`,
      tags: [...TAGS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3),
      colors: ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399'],
      sizes: ['Standard'],
      images: [emoji, emoji, emoji, emoji]
    });
  }
  return products;
}

function generateFallbackCategories(startId) {
  let id = startId;
  let all = [];

  const books = generateSynthetic('Books', [
    { name: 'Educational', adj: ['Illustrated', 'Complete', 'Essential'], nouns: ['Science Guide', 'Math Workbook', 'History Atlas'] },
    { name: 'Novels', adj: ['Bestselling', 'Classic', 'Modern'], nouns: ['Mystery Novel', 'Romance Novel', 'Thriller Novel'] },
    { name: 'Comics', adj: ['Deluxe', 'Collector\u2019s', 'Junior'], nouns: ['Comic Anthology', 'Graphic Novel', 'Manga Volume'] },
    { name: 'Competitive Exams', adj: ['Complete', 'Updated', 'Practice'], nouns: ['Exam Guide', 'Mock Test Set', 'Reasoning Book'] },
    { name: 'Technology', adj: ['Practical', 'Modern', 'Beginner\u2019s'], nouns: ['Programming Guide', 'AI Handbook', 'Web Dev Book'] },
    { name: 'Biography', adj: ['Inspiring', 'Bestselling', 'Illustrated'], nouns: ['Life Story', 'Memoir', 'Autobiography'] }
  ], 24, id); id += books.length; all = all.concat(books);

  const toys = generateSynthetic('Toys & Baby', [
    { name: 'Toys', adj: ['Fun', 'Colorful', 'Interactive'], nouns: ['Building Blocks Set', 'Remote Car', 'Puzzle'] },
    { name: 'Baby Care', adj: ['Gentle', 'Soft', 'Premium'], nouns: ['Baby Wipes Pack', 'Baby Lotion', 'Feeding Set'] },
    { name: 'School Supplies', adj: ['Durable', 'Colorful', 'Essential'], nouns: ['Pencil Box', 'School Bag', 'Notebook Set'] },
    { name: 'Games', adj: ['Classic', 'Family', 'Strategy'], nouns: ['Board Game', 'Card Game', 'Puzzle Game'] }
  ], 20, id); id += toys.length; all = all.concat(toys);

  const pets = generateSynthetic('Pet Supplies', [
    { name: 'Pet Food', adj: ['Premium', 'Nutritious', 'Everyday'], nouns: ['Dog Food Pack', 'Cat Food Pack', 'Pet Treats'] },
    { name: 'Toys', adj: ['Durable', 'Fun', 'Interactive'], nouns: ['Chew Toy', 'Squeaky Toy', 'Pet Ball'] },
    { name: 'Grooming', adj: ['Gentle', 'Professional', 'Easy-use'], nouns: ['Pet Shampoo', 'Grooming Brush', 'Nail Clipper'] },
    { name: 'Accessories', adj: ['Comfortable', 'Adjustable', 'Stylish'], nouns: ['Pet Collar', 'Pet Bed', 'Pet Carrier'] }
  ], 16, id); all = all.concat(pets);

  return all;
}

// ---------- SEED ----------
async function seedProducts() {
  if (db.get('products').size().value() > 0) return; // already seeded

  let realProducts = [];
  try {
    realProducts = await fetchRealProducts();
    console.log(`✅ Fetched ${realProducts.length} real products (with real images) from DummyJSON`);
  } catch (err) {
    console.warn('⚠️  Could not reach DummyJSON API (' + err.message + ') — using synthetic products only for those categories.');
  }

  const maxId = realProducts.reduce((m, p) => Math.max(m, p.id), 0);
  const fallbackProducts = generateFallbackCategories(maxId + 1);
  const products = [...realProducts, ...fallbackProducts];

  db.set('products', products).write();
  const cats = [...new Set(products.map(p => p.category))];
  console.log(`✅ Seeded ${products.length} products across ${cats.length} categories (${realProducts.length} with real photos)`);
}

function seedAdmin() {
  const existing = db.get('users').find({ email: 'admin@shopwave.com' }).value();
  if (existing) return;
  const hashed = bcrypt.hashSync('admin123', 10);
  db.get('users').push({
    id: 1,
    name: 'Admin',
    email: 'admin@shopwave.com',
    password: hashed,
    role: 'admin',
    points: 0,
    referral: 'SW-ADMIN',
    addresses: [],
    createdAt: new Date().toISOString()
  }).write();
  console.log('✅ Seeded default admin user: admin@shopwave.com / admin123');
}

// Exposed init function — server.js awaits this before starting to listen,
// since product seeding now involves a real network call to DummyJSON.
async function initDB() {
  await seedProducts();
  seedAdmin();
}

module.exports = db;
module.exports.initDB = initDB;
