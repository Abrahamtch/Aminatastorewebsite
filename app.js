/**
 * ═══════════════════════════════════════════════════════════════
 *  AMINATA STORE — Application JavaScript
 *  Auth, Panier, Commandes DB, Gestion Produits, Chat, Admin
 * ═══════════════════════════════════════════════════════════════
 */

// ── Configuration ──
const WHATSAPP_NUMBER = '22896065418';
const STORE_NAME = 'Aminata Store';
const DB_NAME = 'AminataStoreDB';
const DB_VERSION = 2;
const ADMIN_USER = 'ADMIN';
const ADMIN_PASS = 'ADMIN';

// ── Default Products (seeded on first run) ──
const DEFAULT_PRODUCTS = [
  { 
    id: 1, 
    name: 'Wax Hollandais Premium', 
    category: 'Wax', 
    price: 12000, 
    description: 'Tissu wax hollandais authentique aux motifs géométriques vibrants. Qualité supérieure, couleurs éclatantes qui résistent au lavage.', 
    image: 'images/wax_hollandais.jpg', 
    media: [
      { type: 'image', url: 'images/wax_hollandais.jpg' },
      { type: 'image', url: 'images/wax_ankara.jpg' }
    ],
    colors: [
      { name: 'Rouge & Or', hex: '#C83232' },
      { name: 'Bleu Royal', hex: '#1E3A8A' },
      { name: 'Jaune Solaire', hex: '#EAB308' }
    ],
    badge: 'Populaire', 
    badgeType: '',
    featured: true
  },
  { 
    id: 2, 
    name: 'Basin Riche Doré', 
    category: 'Basin', 
    price: 25000, 
    description: 'Basin riche de qualité exceptionnelle avec des motifs damassés dorés. Parfait pour les grandes occasions et cérémonies.', 
    image: 'images/basin_riche.jpg', 
    media: [
      { type: 'image', url: 'images/basin_riche.jpg' },
      { type: 'image', url: 'images/bazin_brode.jpg' }
    ],
    colors: [
      { name: 'Or Impérial', hex: '#D4AF37' },
      { name: 'Blanc Pur', hex: '#FFFFFF' },
      { name: 'Violet Royal', hex: '#6B21A8' }
    ],
    badge: 'Premium', 
    badgeType: 'premium',
    featured: true
  },
  { id: 3, name: 'Lin Naturel Européen', category: 'Lin', price: 8500, description: 'Lin européen 100% naturel, texture douce et respirante. Idéal pour les tenues décontractées et élégantes.', image: 'images/lin_naturel.jpg', media: [{ type: 'image', url: 'images/lin_naturel.jpg' }], colors: [{ name: 'Beige Lin', hex: '#D7C4B7' }, { name: 'Blanc Cassé', hex: '#F5F5DC' }], badge: null, badgeType: '', featured: false },
  { id: 4, name: 'Coton Piqué Luxe', category: 'Coton', price: 6000, description: 'Coton piqué premium avec une texture diamant subtile. Confortable, respirant et polyvalent pour toutes saisons.', image: 'images/coton_pique.jpg', media: [{ type: 'image', url: 'images/coton_pique.jpg' }], colors: [{ name: 'Bleu Ciel', hex: '#38BDF8' }, { name: 'Blanc', hex: '#FFFFFF' }], badge: 'Meilleur Prix', badgeType: '', featured: false },
  { id: 5, name: 'Soie Brillante', category: 'Soie', price: 18000, description: "Soie naturelle d'une brillance exceptionnelle, toucher soyeux et fluide. Pour des créations haut de gamme.", image: 'images/soie_brillante.jpg', media: [{ type: 'image', url: 'images/soie_brillante.jpg' }], colors: [{ name: 'Rouge Rubis', hex: '#991B1B' }, { name: 'Noir Ébène', hex: '#18181B' }], badge: 'Luxe', badgeType: 'premium', featured: true },
  { id: 6, name: 'Dentelle Royale', category: 'Dentelle', price: 15000, description: 'Dentelle fine avec des motifs floraux délicats et festonnés. Parfaite pour robes de soirée et tenues de mariée.', image: 'images/dentelle_royale.jpg', media: [{ type: 'image', url: 'images/dentelle_royale.jpg' }], colors: [{ name: 'Blanc Mariée', hex: '#FFFFFF' }, { name: 'Doré Champagne', hex: '#FDE047' }], badge: null, badgeType: '', featured: false },
  { id: 7, name: 'Bazin Brodé Premium', category: 'Basin', price: 30000, description: "Bazin brodé artisanal avec fils d'or et d'argent. Pièce d'exception pour les événements prestigieux.", image: 'images/bazin_brode.jpg', media: [{ type: 'image', url: 'images/bazin_brode.jpg' }], colors: [{ name: 'Bleu Nuit', hex: '#1E1B4B' }, { name: 'Vert Émeraude', hex: '#065F46' }], badge: 'Exclusif', badgeType: 'premium', featured: true },
  { id: 8, name: 'Wax Ankara Moderne', category: 'Wax', price: 9500, description: 'Imprimé Ankara contemporain aux couleurs vives et design moderne. Parfait pour un style tendance et audacieux.', image: 'images/wax_ankara.jpg', media: [{ type: 'image', url: 'images/wax_ankara.jpg' }], colors: [{ name: 'Multicolore', hex: '#F59E0B' }, { name: 'Orange Sanguine', hex: '#EA580C' }], badge: 'Nouveau', badgeType: 'new', featured: true }
];

// ── App State ──
let cart = [];
let products = [];
let collectionCategory = 'all';
let collectionMaxPrice = 50000;
let collectionSearchQuery = '';
let collectionSortBy = 'popular';
let adminFilterStatus = 'all';
let adminSearchQuery = '';
let currentAuth = null;
let adminChatActiveClient = null;
let chatPollInterval = null;
let editingExtraMedia = []; // Array of { type: 'image'|'video', url: string }
let editingColorVariants = []; // Array of { name: string, hex: string }
let selectedColorVariant = null;

// ── Featured Products Helpers (Admin Managed Only) ──
function isFeatured(product) {
  if (!product) return false;
  if (typeof product.featured === 'boolean') return product.featured;
  if (typeof product.isFavorite === 'boolean') return product.isFavorite;
  return [1, 2, 5, 7, 8].includes(Number(product.id));
}

async function toggleAdminFeatured(id) {
  const p = await DB.get('products', Number(id));
  if (!p) return;
  p.featured = !isFeatured(p);
  await DB.put('products', p);
  showToast(p.featured ? `⭐ "${p.name}" mis en avant sur l'accueil` : `"${p.name}" retiré de l'accueil`, 'success');
  products = await DB.getAll('products');
  renderAdminProducts();
  if ($('#productsGrid')) renderProducts();
  if ($('#collectionProductsGrid')) renderCollectionPage();
}
window.toggleAdminFeatured = toggleAdminFeatured;

// ── Utilities ──
const formatPrice = (p) => p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function genId(prefix = 'ID') { return prefix + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(); }

// ══════════════════════════════════════════════
//  DATABASE — IndexedDB
// ══════════════════════════════════════════════
const DB = {
  db: null,
  async init() {
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('orders')) { const s = db.createObjectStore('orders', { keyPath: 'id' }); s.createIndex('status', 'status'); }
        if (!db.objectStoreNames.contains('products')) { db.createObjectStore('products', { keyPath: 'id' }); }
        if (!db.objectStoreNames.contains('clients')) { db.createObjectStore('clients', { keyPath: 'phone' }); }
        if (!db.objectStoreNames.contains('messages')) { const m = db.createObjectStore('messages', { keyPath: 'id' }); m.createIndex('conversation', 'conversation'); }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    await this.seedProducts();
  },

  async seedProducts() {
    const existing = await this.getAll('products');
    if (existing.length === 0) {
      for (const p of DEFAULT_PRODUCTS) await this.put('products', p);
    }
  },

  async put(store, data) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => res();
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async get(store, key) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = (e) => rej(e.target.error);
    });
  },

  async getAll(store) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = (e) => rej(e.target.error);
    });
  },

  async delete(store, key) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => res();
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async getNextProductId() {
    const all = await this.getAll('products');
    return all.length > 0 ? Math.max(...all.map(p => p.id)) + 1 : 1;
  }
};

// ══════════════════════════════════════════════
//  NOTIFICATION SYSTEM
// ══════════════════════════════════════════════
const Notify = {
  audioCtx: null,
  getCtx() { if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); return this.audioCtx; },
  playChime() {
    try {
      const ctx = this.getCtx(), now = ctx.currentTime;
      [{ f: 880, s: 0, d: 0.25 }, { f: 1108.73, s: 0.15, d: 0.25 }, { f: 1318.51, s: 0.3, d: 0.4 }].forEach(n => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(n.f, now + n.s);
        g.gain.setValueAtTime(0, now + n.s); g.gain.linearRampToValueAtTime(0.3, now + n.s + 0.05); g.gain.exponentialRampToValueAtTime(0.001, now + n.s + n.d);
        o.connect(g); g.connect(ctx.destination); o.start(now + n.s); o.stop(now + n.s + n.d + 0.1);
      });
    } catch (e) {}
  },
  async requestPerm() { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); },
  push(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { const n = new Notification(title, { body, tag: 'aminata-store' }); n.onclick = () => { window.focus(); n.close(); }; } catch(e){}
    }
  }
};

// ══════════════════════════════════════════════
//  AUTH SYSTEM
// ══════════════════════════════════════════════
function loadAuth() {
  try { currentAuth = JSON.parse(localStorage.getItem('aminata_auth')); } catch(e) { currentAuth = null; }
  updateAuthUI();
}

function saveAuth(auth) {
  currentAuth = auth;
  if (auth) localStorage.setItem('aminata_auth', JSON.stringify(auth));
  else localStorage.removeItem('aminata_auth');
  updateAuthUI();
}

function updateAuthUI() {
  const btn = $('#authBtn');
  const text = $('#authBtnText');
  const bubble = $('#chatBubble');
  if (!btn) return;

  if (!currentAuth) {
    text.textContent = "Se connecter";
    btn.className = 'auth-btn';
    if (bubble) bubble.style.display = 'none';
  } else if (currentAuth.role === 'admin') {
    text.textContent = '👑 Admin';
    btn.className = 'auth-btn auth-btn-admin';
    if (bubble) bubble.style.display = 'none';
  } else {
    text.textContent = '👤 ' + (currentAuth.user?.prenom || 'Client');
    btn.className = 'auth-btn auth-btn-client';
    if (bubble) bubble.style.display = 'flex';
  }
}

function handleAuthClick() {
  if (!currentAuth) { openLogin(); }
  else if (currentAuth.role === 'admin') { openAdmin(); }
  else { openClientPanel(); }
}

function logout() {
  saveAuth(null);
  closeAdmin();
  closeClientPanel();
  stopChatPolling();
  showToast('Déconnecté', 'info');
}

// ── Login Modal ──
function openLogin(tab = 'client') {
  $$('.login-tab').forEach(t => t.classList.remove('active'));
  $$('.login-tab-content').forEach(c => c.classList.remove('active'));
  
  const targetTabBtn = $(`.login-tab[data-tab="${tab}"]`) || $('.login-tab');
  targetTabBtn?.classList.add('active');
  const targetTabContent = $(`#tab${tab === 'proprietaire' ? 'Proprietaire' : 'Client'}`);
  targetTabContent?.classList.add('active');

  const clv = $('#clientLoginView'), crv = $('#clientRegisterView');
  if (clv) clv.style.display = 'block';
  if (crv) crv.style.display = 'none';

  $('#loginOverlay')?.classList.add('open');
  $('#loginModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLogin() {
  $('#loginOverlay')?.classList.remove('open');
  $('#loginModal')?.classList.remove('open');
  document.body.style.overflow = '';
  // Reset forms
  $('#adminLoginForm')?.reset();
  $('#clientLoginForm')?.reset();
  $('#clientRegisterForm')?.reset();
  $$('.form-error').forEach(e => e.textContent = '');
}

function adminLogin(e) {
  e.preventDefault();
  const user = $('#adminUser')?.value.trim() || '';
  const pass = $('#adminPass')?.value.trim() || '';
  const err = $('#adminLoginError');
  if (err) err.textContent = '';

  if (!user || !pass) {
    if (err) err.textContent = "Veuillez saisir le nom d'utilisateur et le mot de passe";
    return;
  }

  if (user.toUpperCase() === ADMIN_USER.toUpperCase() && pass === ADMIN_PASS) {
    saveAuth({ role: 'admin', user: { prenom: 'Propriétaire' } });
    closeLogin();
    showToast('👑 Bienvenue, Propriétaire !', 'success');
    Notify.requestPerm();
    openAdmin();
  } else {
    if (err) err.textContent = 'Identifiants incorrects (ADMIN / ADMIN)';
  }
}

async function clientLogin(e) {
  e.preventDefault();
  const phone = $('#clientLoginPhone')?.value.trim() || '';
  const pass = $('#clientLoginPass')?.value.trim() || '';
  const err = $('#clientLoginError');
  if (err) err.textContent = '';

  if (!phone) {
    if (err) err.textContent = 'Veuillez saisir votre numéro de téléphone';
    return;
  }
  if (!pass) {
    if (err) err.textContent = 'Veuillez saisir votre mot de passe';
    return;
  }

  try {
    const allClients = await DB.getAll('clients');
    const targetDigits = phone.replace(/\D/g, '');

    const client = allClients.find(c => {
      if (!c.phone) return false;
      const cDigits = c.phone.replace(/\D/g, '');
      return c.phone === phone || 
             (targetDigits && cDigits === targetDigits) || 
             (targetDigits.length >= 6 && cDigits.endsWith(targetDigits)) || 
             (cDigits.length >= 6 && targetDigits.endsWith(cDigits));
    });

    if (client && client.password === pass) {
      saveAuth({ role: 'client', user: client });
      closeLogin();
      showToast(`👤 Bienvenue, ${client.prenom} !`, 'success');
      openClientPanel();
      startChatPolling();
    } else if (client) {
      if (err) err.textContent = 'Mot de passe incorrect';
    } else {
      if (err) err.textContent = 'Compte introuvable. Cliquez sur "Créer un compte" ci-dessous.';
    }
  } catch (errDb) {
    console.error('Login DB error:', errDb);
    if (err) err.textContent = 'Erreur lors de la connexion. Veuillez réessayer.';
  }
}

async function clientRegister(e) {
  e.preventDefault();
  const prenom = $('#regName')?.value.trim() || '';
  const phone = $('#regPhone')?.value.trim() || '';
  const pass = $('#regPass')?.value.trim() || '';
  const err = $('#clientRegisterError');
  if (err) err.textContent = '';

  if (!prenom || prenom.length < 2) { 
    if (err) err.textContent = 'Prénom requis (au moins 2 caractères)'; 
    return; 
  }
  if (!phone || phone.replace(/\D/g, '').length < 4) { 
    if (err) err.textContent = 'Numéro de téléphone valide requis'; 
    return; 
  }
  if (!pass || pass.length < 3) { 
    if (err) err.textContent = 'Mot de passe requis (au moins 3 caractères)'; 
    return; 
  }

  try {
    const allClients = await DB.getAll('clients');
    const targetDigits = phone.replace(/\D/g, '');
    const existing = allClients.find(c => {
      if (!c.phone) return false;
      const cDigits = c.phone.replace(/\D/g, '');
      return c.phone === phone || (targetDigits && cDigits === targetDigits);
    });

    if (existing) { 
      if (err) err.textContent = 'Ce numéro est déjà inscrit. Connectez-vous avec vos identifiants.'; 
      return; 
    }

    const client = { phone, prenom, password: pass, createdAt: new Date().toISOString() };
    await DB.put('clients', client);
    saveAuth({ role: 'client', user: client });
    closeLogin();
    showToast(`📝 Compte créé ! Bienvenue, ${prenom} !`, 'success');
    openClientPanel();
    startChatPolling();
  } catch (errDb) {
    console.error('Register DB error:', errDb);
    if (err) err.textContent = "Erreur lors de l'enregistrement. Veuillez réessayer.";
  }
}

// Expose modal handlers globally for inline HTML fallbacks
window.handleAuthClick = handleAuthClick;
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.openAdmin = openAdmin;
window.closeAdmin = closeAdmin;
window.openClientPanel = openClientPanel;
window.closeClientPanel = closeClientPanel;

// ══════════════════════════════════════════════
//  INITIALISATION
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Synchronous UI setup FIRST so buttons work immediately!
  setupEventListeners();
  setupScrollEffects();
  loadAuth();
  loadCart();
  parseUrlParams();

  // Asynchronous DB initialization
  try {
    await DB.init();
    products = await DB.getAll('products');
    
    // Render Home Favorites or Full Collection
    if ($('#productsGrid')) {
      renderProducts();
    }
    if ($('#collectionProductsGrid')) {
      renderCollectionPage();
    }
    
    if (currentAuth?.role === 'client') startChatPolling();
  } catch(e) {
    console.error('DB init error:', e);
  }
});

// ══════════════════════════════════════════════
//  HOME PAGE: FEATURED PRODUCTS SHOWCASE
// ══════════════════════════════════════════════
async function renderProducts(category = 'all') {
  const grid = $('#productsGrid');
  if (!grid) return;
  products = await DB.getAll('products');
  if (!products || products.length === 0) {
    products = [...DEFAULT_PRODUCTS];
  }
  
  // Only display products that are marked as featured by the admin!
  let featuredList = products.filter(p => isFeatured(p));
  if (category !== 'all') {
    featuredList = featuredList.filter(p => p.category === category);
  }

  if (featuredList.length === 0) {
    grid.innerHTML = `
      <div class="empty-favorites-card">
        <div class="empty-fav-icon">✦</div>
        <h3 class="empty-fav-title">Aucun tissu vedette dans cette catégorie</h3>
        <p class="empty-fav-text">Découvrez notre collection complète de tissus premium sur notre catalogue.</p>
        <a href="collection.html" class="btn btn-primary" style="margin-top: 8px;">
          <span>Explorer Toute la Collection (${products.length} Tissus)</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    `;
  } else {
    grid.innerHTML = featuredList.map((p, i) => `
      <div class="product-card" data-id="${p.id}" style="animation-delay: ${i * 0.08}s">
        <div class="product-image-container" onclick="openQuickView(${p.id})">
          ${p.badge ? `<span class="product-badge-label ${p.badgeType || ''}">${p.badge}</span>` : ''}
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="product-overlay">
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id}, this)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>
              Ajouter au panier
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category-tag">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc-short">${p.description || ''}</p>
          <div class="product-bottom">
            <span class="product-price">${formatPrice(p.price)}<span class="product-price-unit"> /yard</span></span>
          </div>
        </div>
      </div>
    `).join('');
  }
  grid.style.opacity = '1';
}

// ══════════════════════════════════════════════
//  COLLECTION PAGE: COMPLETE CATALOG & FILTERS
// ══════════════════════════════════════════════
async function renderCollectionPage() {
  const grid = $('#collectionProductsGrid');
  if (!grid) return;
  products = await DB.getAll('products');
  if (!products || products.length === 0) {
    products = [...DEFAULT_PRODUCTS];
  }
  
  // Update header counters
  const totalCountEl = $('#colTotalCountBadge');
  if (totalCountEl) totalCountEl.textContent = products.length;

  let list = [...products];

  // 1. Category Filter
  if (collectionCategory && collectionCategory !== 'all') {
    list = list.filter(p => p.category && p.category.toLowerCase() === collectionCategory.toLowerCase());
  }

  // 2. Price Filter
  list = list.filter(p => (p.price || 0) <= collectionMaxPrice);

  // 3. Search Query Filter
  if (collectionSearchQuery && collectionSearchQuery.trim()) {
    const q = collectionSearchQuery.toLowerCase().trim();
    list = list.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.badge || '').toLowerCase().includes(q)
    );
  }

  // 4. Sorting
  if (collectionSortBy === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (collectionSortBy === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (collectionSortBy === 'new') {
    list.sort((a, b) => (b.badge === 'Nouveau' ? 1 : 0) - (a.badge === 'Nouveau' ? 1 : 0) || b.id - a.id);
  } else if (collectionSortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Popular default
    list.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
  }

  // Update results count indicator
  const countLabel = $('#colResultsCount');
  if (countLabel) {
    countLabel.textContent = `${list.length} tissu${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-favorites-card" style="grid-column: 1 / -1;">
        <div class="empty-fav-icon">🔍</div>
        <h3 class="empty-fav-title">Aucun tissu ne correspond à vos critères</h3>
        <p class="empty-fav-text">Essayez d'augmenter le prix maximum, d'effacer la recherche ou de changer de catégorie.</p>
        <button class="btn btn-primary" onclick="resetCollectionFilters()" style="margin-top: 10px;">
          <span>Réinitialiser tous les filtres</span>
        </button>
      </div>
    `;
  } else {
    grid.innerHTML = list.map((p, i) => `
      <div class="product-card" data-id="${p.id}" style="animation-delay: ${i * 0.05}s">
        <div class="product-image-container" onclick="openQuickView(${p.id})">
          ${p.badge ? `<span class="product-badge-label ${p.badgeType || ''}">${p.badge}</span>` : ''}
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="product-overlay">
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id}, this)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 01-8 0"></path></svg>
              Ajouter au panier
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category-tag">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc-short">${p.description || ''}</p>
          <div class="product-bottom">
            <span class="product-price">${formatPrice(p.price)}<span class="product-price-unit"> /yard</span></span>
          </div>
        </div>
      </div>
    `).join('');
  }
  grid.style.opacity = '1';
}

function resetCollectionFilters() {
  collectionCategory = 'all';
  collectionMaxPrice = 50000;
  collectionSearchQuery = '';
  collectionSortBy = 'popular';

  const searchInput = $('#colSearchInput');
  if (searchInput) searchInput.value = '';
  const sortSelect = $('#colSortSelect');
  if (sortSelect) sortSelect.value = 'popular';
  const slider = $('#priceRangeSlider');
  if (slider) slider.value = 50000;
  const priceBadge = $('#priceValueBadge');
  if (priceBadge) priceBadge.textContent = '50 000 FCFA';

  $$('#colCategoriesBar .col-cat-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.category === 'all');
  });
  $$('.btn-budget-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.budget === 'all');
  });

  renderCollectionPage();
  showToast('Filtres réinitialisés', 'info');
}

function setCollectionFilter(category) {
  collectionCategory = category;
  $$('#colCategoriesBar .col-cat-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.category === category);
  });
  renderCollectionPage();
}

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get('category');
  if (cat) {
    collectionCategory = cat;
  }
}

function setupProductAnimations() {
  if (!('IntersectionObserver' in window)) { $$('.product-card').forEach(c => c.classList.add('visible')); return; }
  const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$('.product-card:not(.visible)').forEach(c => obs.observe(c));
}

// ══════════════════════════════════════════════
//  CART
// ══════════════════════════════════════════════
function loadCart() { try { cart = JSON.parse(localStorage.getItem('aminata_cart') || '[]'); } catch(e) { cart = []; } updateCartUI(); }
function saveCart() { localStorage.setItem('aminata_cart', JSON.stringify(cart)); updateCartUI(); }
function addToCart(productId, btnEl) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const ex = cart.find(i => i.id === productId);
  if (ex) ex.quantity += 1; else cart.push({ id: product.id, quantity: 1 });
  saveCart();
  if (btnEl) { const orig = btnEl.innerHTML; btnEl.innerHTML = '✓ Ajouté !'; btnEl.classList.add('added'); setTimeout(() => { btnEl.innerHTML = orig; btnEl.classList.remove('added'); }, 1500); }
  pulseBadge();
  showToast(`${product.name} ajouté au panier`, 'success');
  if (typeof fbq === 'function') {
    try {
      fbq('track', 'AddToCart', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [String(product.id)],
        content_type: 'product',
        value: product.price,
        currency: 'XOF'
      });
    } catch(e) {}
  }
}
function removeFromCart(pid) { cart = cart.filter(i => i.id !== pid); saveCart(); showToast('Article retiré', 'info'); }
function updateQuantity(pid, d) { const i = cart.find(x => x.id === pid); if (!i) return; i.quantity += d; if (i.quantity <= 0) removeFromCart(pid); else saveCart(); }
function getCartTotal() { return cart.reduce((t, i) => { const p = products.find(x => x.id === i.id); return t + (p ? p.price * i.quantity : 0); }, 0); }
function getCartCount() { return cart.reduce((c, i) => c + i.quantity, 0); }

function updateCartUI() {
  const count = getCartCount();
  const badge = $('#cartBadge');
  if (badge) { badge.textContent = count; badge.classList.toggle('show', count > 0); }
  const hc = $('#cartHeaderCount'); if (hc) hc.textContent = `(${count})`;
  renderCartItems();
}

function renderCartItems() {
  const container = $('#cartItems'), empty = $('#cartEmpty'), footer = $('#cartFooter'), totalEl = $('#cartTotal');
  if (!container) return;
  if (cart.length === 0) { container.innerHTML = ''; if (empty) empty.style.display = 'flex'; if (footer) footer.style.display = 'none'; return; }
  if (empty) empty.style.display = 'none'; if (footer) footer.style.display = 'block';
  container.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id); if (!p) return '';
    return `<div class="cart-item"><img class="cart-item-img" src="${p.image}" alt="${p.name}"><div class="cart-item-details"><div class="cart-item-name">${p.name}</div><div class="cart-item-price">${formatPrice(p.price)} /yard</div><div class="cart-item-bottom"><div class="qty-controls"><button class="qty-btn" onclick="updateQuantity(${p.id},-1)">−</button><span class="qty-value">${item.quantity}</span><button class="qty-btn" onclick="updateQuantity(${p.id},+1)">+</button></div><span class="cart-item-line-total">${formatPrice(p.price * item.quantity)}</span></div></div><button class="cart-item-remove" onclick="removeFromCart(${p.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>`;
  }).join('');
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
}

function pulseBadge() { const b = $('#cartBadge'); if (!b) return; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
function openCart() { $('#cartSidebar')?.classList.add('open'); $('#cartOverlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; renderCartItems(); }
function closeCart() { $('#cartSidebar')?.classList.remove('open'); $('#cartOverlay')?.classList.remove('open'); document.body.style.overflow = ''; }

// ══════════════════════════════════════════════
//  QUICK VIEW (Gallery, Zoom & Colors)
// ══════════════════════════════════════════════
let qvQty = 1;
function openQuickView(pid) {
  const p = products.find(x => x.id === pid); if (!p) return;
  qvQty = 1;
  selectedColorVariant = null;
  
  // Set up text details
  $('#quickViewCategory').textContent = p.category;
  $('#quickViewName').textContent = p.name;
  $('#quickViewDescription').textContent = p.description || '';
  $('#quickViewPrice').textContent = formatPrice(p.price) + ' /yard';
  $('#qvQtyInput').value = 1;

  // Compile media list (up to 20 photos/videos)
  const mediaList = [];
  if (p.image) mediaList.push({ type: 'image', url: p.image });
  if (Array.isArray(p.media)) {
    p.media.forEach(m => {
      if (mediaList.length < 20 && m.url && !mediaList.some(x => x.url === m.url)) {
        mediaList.push(m);
      }
    });
  }

  // Display first media
  setQuickViewMainMedia(mediaList[0] || { type: 'image', url: p.image });

  // Render Thumbnails
  const thumbsContainer = $('#qvThumbnails');
  const countLabel = $('#qvMediaCount');
  if (countLabel) countLabel.textContent = `Galerie (${mediaList.length}/20)`;

  if (thumbsContainer) {
    thumbsContainer.innerHTML = mediaList.map((m, idx) => `
      <div class="qv-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
        ${m.type === 'video' 
          ? `<video src="${m.url}"></video><div class="qv-thumb-video-badge">▶</div>` 
          : `<img src="${m.url}" alt="">`}
      </div>
    `).join('');

    $$('#qvThumbnails .qv-thumb').forEach(thumb => {
      thumb.onclick = () => {
        $$('#qvThumbnails .qv-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const idx = parseInt(thumb.dataset.idx);
        if (mediaList[idx]) setQuickViewMainMedia(mediaList[idx]);
      };
    });
  }

  // Hover Zoom mouse tracking
  const mainBox = $('#qvMainMediaBox');
  const mainImg = $('#quickViewImage');
  if (mainBox && mainImg) {
    mainBox.onmousemove = (e) => {
      const rect = mainBox.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    };
    mainBox.onmouseleave = () => {
      mainImg.style.transformOrigin = 'center center';
    };
  }

  // Color Classification Swatches
  const swatchesGrid = $('#qvColorSwatches');
  const colorNameLabel = $('#qvSelectedColorName');
  const colors = Array.isArray(p.colors) && p.colors.length > 0 
    ? p.colors 
    : [{ name: 'Standard', hex: '#C8A96E' }];

  if (swatchesGrid) {
    swatchesGrid.innerHTML = colors.map((c, idx) => `
      <div class="color-swatch-item ${idx === 0 ? 'active' : ''}" data-color-name="${c.name}">
        <span class="color-circle" style="background-color: ${c.hex};"></span>
        <span>${c.name}</span>
      </div>
    `).join('');

    selectedColorVariant = colors[0].name;
    if (colorNameLabel) colorNameLabel.textContent = `Sélectionné : ${colors[0].name}`;

    $$('#qvColorSwatches .color-swatch-item').forEach(item => {
      item.onclick = () => {
        $$('#qvColorSwatches .color-swatch-item').forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        selectedColorVariant = item.dataset.colorName;
        if (colorNameLabel) colorNameLabel.textContent = `Sélectionné : ${selectedColorVariant}`;
      };
    });
  }

  // Add to Cart
  $('#qvAddToCart').onclick = () => {
    const itemTitle = selectedColorVariant && selectedColorVariant !== 'Standard'
      ? `${p.name} — Variante: ${selectedColorVariant}`
      : p.name;

    const ex = cart.find(i => i.id === pid && i.color === selectedColorVariant);
    if (ex) {
      ex.quantity += qvQty;
    } else {
      cart.push({ id: pid, name: itemTitle, color: selectedColorVariant, quantity: qvQty });
    }
    saveCart();
    pulseBadge();
    showToast(`${p.name} (${selectedColorVariant || 'Standard'}, ×${qvQty}) ajouté`, 'success');
    if (typeof fbq === 'function') {
      try {
        fbq('track', 'AddToCart', {
          content_name: itemTitle,
          content_category: p.category,
          content_ids: [String(pid)],
          content_type: 'product',
          value: (p.price || 0) * qvQty,
          currency: 'XOF'
        });
      } catch(e) {}
    }
    closeQuickView();
  };

  $('#qvQtyMinus').onclick = () => { if (qvQty > 1) { qvQty--; $('#qvQtyInput').value = qvQty; } };
  $('#qvQtyPlus').onclick = () => { if (qvQty < 99) { qvQty++; $('#qvQtyInput').value = qvQty; } };
  $('#qvQtyInput').oninput = (e) => { let v = parseInt(e.target.value) || 1; v = Math.max(1, Math.min(99, v)); qvQty = v; e.target.value = v; };

  $('#quickViewOverlay')?.classList.add('open');
  $('#quickViewModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setQuickViewMainMedia(m) {
  const img = $('#quickViewImage');
  const vid = $('#quickViewVideo');
  if (!img || !vid) return;

  if (m.type === 'video') {
    img.style.display = 'none';
    vid.style.display = 'block';
    vid.src = m.url;
  } else {
    vid.style.display = 'none';
    vid.pause();
    img.style.display = 'block';
    img.src = m.url;
  }
}

function closeQuickView() { 
  $('#quickViewOverlay')?.classList.remove('open'); 
  $('#quickViewModal')?.classList.remove('open'); 
  document.body.style.overflow = ''; 
  const vid = $('#quickViewVideo');
  if (vid) vid.pause();
}

// ══════════════════════════════════════════════
//  CHECKOUT
// ══════════════════════════════════════════════
function openCheckout() {
  if (cart.length === 0) { showToast('Votre panier est vide', 'error'); return; }
  closeCart();
  const oi = $('#orderItems'), ot = $('#orderTotal');
  if (oi) oi.innerHTML = cart.map(i => { const p = products.find(x => x.id === i.id); if (!p) return ''; return `<div class="order-item-row"><span>${p.name} <span class="order-item-qty">×${i.quantity}</span></span><span>${formatPrice(p.price * i.quantity)}</span></div>`; }).join('');
  if (ot) ot.textContent = formatPrice(getCartTotal());
  // Pre-fill if client logged in
  if (currentAuth?.role === 'client') {
    const nameEl = $('#customerName'), phoneEl = $('#customerPhone');
    if (nameEl && currentAuth.user?.prenom) nameEl.value = currentAuth.user.prenom;
    if (phoneEl && currentAuth.user?.phone) phoneEl.value = currentAuth.user.phone;
  }
  if (typeof fbq === 'function') {
    try {
      fbq('track', 'InitiateCheckout', {
        num_items: getCartCount(),
        value: getCartTotal(),
        currency: 'XOF'
      });
    } catch(e) {}
  }
  setTimeout(() => { $('#checkoutOverlay')?.classList.add('open'); $('#checkoutModal')?.classList.add('open'); document.body.style.overflow = 'hidden'; }, 300);
}
function closeCheckout() { $('#checkoutOverlay')?.classList.remove('open'); $('#checkoutModal')?.classList.remove('open'); document.body.style.overflow = ''; }

async function submitOrder(e) {
  e.preventDefault();
  const prenom = $('#customerName')?.value.trim() || '';
  const phone = $('#customerPhone')?.value.trim() || '';
  const comment = $('#customerComment')?.value.trim() || '';
  const ne = $('#nameError'), pe = $('#phoneError'); let err = false;
  if (ne) ne.textContent = ''; if (pe) pe.textContent = '';
  if (prenom.length < 2) { if (ne) ne.textContent = 'Prénom requis (min. 2 car.)'; err = true; }
  if (phone.length < 4) { if (pe) pe.textContent = 'Numéro WhatsApp requis'; err = true; }
  if (err) return;

  const order = {
    id: genId('ORD'), date: new Date().toISOString(),
    customer: { prenom, phone },
    items: cart.map(i => { const p = products.find(x => x.id === i.id); return { name: i.name || p?.name || '?', qty: i.quantity, price: p?.price || 0, total: (p?.price || 0) * i.quantity }; }),
    total: getCartTotal(), comment, status: 'nouveau', read: false, clientPhone: currentAuth?.role === 'client' ? currentAuth.user.phone : phone
  };
  await DB.put('orders', order);
  Notify.playChime();
  Notify.push('🛒 Nouvelle Commande', `${prenom} — ${formatPrice(order.total)}`);

  if (typeof fbq === 'function') {
    try {
      fbq('track', 'Purchase', {
        content_type: 'product',
        value: order.total,
        currency: 'XOF',
        num_items: cart.reduce((acc, cur) => acc + cur.quantity, 0)
      });
    } catch(e) {}
  }

  // WhatsApp message
  const now = new Date();
  let msg = `🛒 *NOUVELLE COMMANDE*  🛒\n━━━━━━━━━━━━━━━━━━━━\n\n📋 *Réf:* ${order.id}\n👤 *Client:* ${prenom}\n📱 *WhatsApp:* ${phone}\n\n📋 *Détails:*\n\n`;
  cart.forEach((i, idx) => { const p = products.find(x => x.id === i.id); if (p) msg += `${idx + 1}. ${i.name || p.name} × ${i.quantity} — ${formatPrice(p.price * i.quantity)}\n`; });
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: ${formatPrice(getCartTotal())}*\n━━━━━━━━━━━━━━━━━━━━\n\n💬 *Commentaire:* ${comment || 'Aucun'}\n\n📅 *Date:* ${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n_Commande via ${STORE_NAME}_`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  cart = []; saveCart(); $('#checkoutForm')?.reset();
  showToast('✅ Commande enregistrée !', 'success');
  closeCheckout();
  setTimeout(() => { window.open(waUrl, '_blank') || (window.location.href = waUrl); }, 1500);
}

// ══════════════════════════════════════════════
//  CATEGORY FILTER
// ══════════════════════════════════════════════
function filterByCategory(cat, tab) { $$('.category-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); renderProducts(cat); }

// ══════════════════════════════════════════════
//  ADMIN PANEL
// ══════════════════════════════════════════════
function openAdmin() {
  if (currentAuth?.role !== 'admin') { openLogin(); return; }
  Notify.requestPerm();
  $('#adminOverlay')?.classList.add('open'); $('#adminPanel')?.classList.add('open'); document.body.style.overflow = 'hidden';
  renderAdminOrders(); renderAdminProducts(); renderAdminChatList();
}
function closeAdmin() { $('#adminOverlay')?.classList.remove('open'); $('#adminPanel')?.classList.remove('open'); document.body.style.overflow = ''; }

async function renderAdminOrders() {
  const orders = (await DB.getAll('orders')).sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = orders.length, rev = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status === 'nouveau' || o.status === 'en_cours').length;
  const delivered = orders.filter(o => o.status === 'livre').length;
  const k = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  k('#kpiTotalOrders', total); k('#kpiRevenue', formatPrice(rev)); k('#kpiPending', pending); k('#kpiDelivered', delivered);

  let filtered = orders;
  if (adminFilterStatus !== 'all') filtered = filtered.filter(o => o.status === adminFilterStatus);
  if (adminSearchQuery) { const q = adminSearchQuery.toLowerCase(); filtered = filtered.filter(o => (o.customer?.prenom || '').toLowerCase().includes(q) || (o.customer?.phone || '').includes(q) || (o.id || '').toLowerCase().includes(q)); }

  const tbody = $('#adminOrdersBody'), empty = $('#adminEmpty'), table = $('#adminOrdersTable');
  if (!tbody) return;
  if (filtered.length === 0) { tbody.innerHTML = ''; if (table) table.style.display = 'none'; if (empty) empty.style.display = 'flex'; return; }
  if (table) table.style.display = 'table'; if (empty) empty.style.display = 'none';

  tbody.innerHTML = filtered.map(o => {
    const d = new Date(o.date), ds = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }), ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const ph = o.customer?.phone || '', wa = `https://wa.me/${ph.replace(/[^0-9]/g, '')}`;
    const sc = o.status || 'nouveau';
    return `<tr class="${!o.read ? 'order-unread' : ''}"><td><span class="order-id-cell">${o.id}</span></td><td><div class="order-date-cell"><span>${ds}</span><span class="order-time">${ts}</span></div></td><td><strong>${o.customer?.prenom || '—'}</strong></td><td><a href="${wa}" target="_blank" class="order-wa-link">📱 ${ph}</a></td><td><strong>${formatPrice(o.total || 0)}</strong></td><td><select class="status-select status-${sc}" onchange="changeOrderStatus('${o.id}',this.value)"><option value="nouveau" ${sc === 'nouveau' ? 'selected' : ''}>🆕 Nouveau</option><option value="en_cours" ${sc === 'en_cours' ? 'selected' : ''}>🔄 En cours</option><option value="livre" ${sc === 'livre' ? 'selected' : ''}>✅ Livré</option><option value="annule" ${sc === 'annule' ? 'selected' : ''}>❌ Annulé</option></select></td><td><div class="order-actions-cell"><button class="order-action-btn" onclick="viewOrderDetail('${o.id}')">👁️</button><a href="${wa}" target="_blank" class="order-action-btn">💬</a><button class="order-action-btn order-action-delete" onclick="confirmDeleteOrder('${o.id}')">🗑️</button></div></td></tr>`;
  }).join('');
}

async function changeOrderStatus(id, s) { const o = await DB.get('orders', id); if (o) { o.status = s; await DB.put('orders', o); } showToast(`Statut: ${s}`, 'success'); renderAdminOrders(); }
async function confirmDeleteOrder(id) { if (confirm(`Supprimer la commande ${id} ?`)) { await DB.delete('orders', id); showToast('Supprimée', 'info'); renderAdminOrders(); } }

async function viewOrderDetail(id) {
  const o = await DB.get('orders', id); if (!o) return;
  if (!o.read) { o.read = true; await DB.put('orders', o); renderAdminOrders(); }
  const di = $('#orderDetailId'), db = $('#orderDetailBody');
  if (di) di.textContent = o.id;
  const d = new Date(o.date), ds = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sl = { nouveau: '🆕 Nouveau', en_cours: '🔄 En cours', livre: '✅ Livré', annule: '❌ Annulé' };
  const ph = o.customer?.phone || '', wa = `https://wa.me/${ph.replace(/[^0-9]/g, '')}`;
  if (db) db.innerHTML = `<div class="detail-section"><h4>📅 Informations</h4><div class="detail-row"><span>Date</span><span>${ds} à ${ts}</span></div><div class="detail-row"><span>Statut</span><span class="detail-status status-${o.status}">${sl[o.status] || o.status}</span></div></div><div class="detail-section"><h4>👤 Client</h4><div class="detail-row"><span>Prénom</span><span>${o.customer?.prenom || '—'}</span></div><div class="detail-row"><span>WhatsApp</span><a href="${wa}" target="_blank" class="detail-wa-link">📱 ${ph}</a></div></div><div class="detail-section"><h4>📋 Articles</h4>${(o.items || []).map(i => `<div class="detail-item-row"><span>${i.name} <span class="detail-qty">×${i.qty}</span></span><span>${formatPrice(i.total || 0)}</span></div>`).join('')}<div class="detail-total-row"><span>Total</span><span>${formatPrice(o.total || 0)}</span></div></div>${o.comment ? `<div class="detail-section"><h4>💬 Commentaire</h4><p class="detail-comment">${o.comment}</p></div>` : ''}<div class="detail-actions"><a href="${wa}" target="_blank" class="btn btn-whatsapp-detail">💬 Contacter sur WhatsApp</a></div>`;
  $('#orderDetailOverlay')?.classList.add('open'); $('#orderDetailModal')?.classList.add('open');
}
function closeOrderDetail() { $('#orderDetailOverlay')?.classList.remove('open'); $('#orderDetailModal')?.classList.remove('open'); }

// ── Admin Export ──
async function exportCSV() {
  const orders = await DB.getAll('orders'); if (!orders.length) { showToast('Rien à exporter', 'info'); return; }
  let csv = 'ID,Date,Client,Téléphone,Articles,Total,Statut,Commentaire\n';
  orders.forEach(o => { const d = new Date(o.date).toLocaleDateString('fr-FR'); const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join(' | '); csv += `"${o.id}","${d}","${o.customer?.prenom || ''}","${o.customer?.phone || ''}","${items}","${o.total || 0}","${o.status}","${(o.comment || '').replace(/"/g, '""')}"\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `aminata-commandes-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); showToast('CSV téléchargé', 'success');
}

// ══════════════════════════════════════════════
//  ADMIN — PRODUCT MANAGEMENT
// ══════════════════════════════════════════════
async function renderAdminProducts() {
  const grid = $('#adminProductsGrid'); if (!grid) return;
  const prods = await DB.getAll('products');
  grid.innerHTML = prods.map(p => {
    const feat = isFeatured(p);
    return `
    <div class="admin-product-card">
      <img src="${p.image}" alt="${p.name}" class="admin-product-img">
      <div class="admin-product-info">
        <h4>${p.name}</h4>
        <span class="product-category-tag">${p.category}</span>
        <p class="admin-product-price">${formatPrice(p.price)}/yard</p>
        <button class="admin-featured-btn ${feat ? 'active' : ''}" onclick="toggleAdminFeatured(${p.id})" title="${feat ? 'Cliquer pour retirer de l\'accueil' : 'Cliquer pour afficher sur l\'accueil'}">
          ${feat ? '⭐ Affiché sur l\'accueil' : '☆ Non affiché sur l\'accueil'}
        </button>
        ${p.badge ? `<span class="product-badge-label ${p.badgeType || ''}" style="position:static;margin-top:6px;display:inline-block;">${p.badge}</span>` : ''}
      </div>
      <div class="admin-product-actions">
        <button class="order-action-btn" onclick="editProduct(${p.id})" title="Modifier">✏️</button>
        <button class="order-action-btn order-action-delete" onclick="deleteProduct(${p.id})" title="Supprimer">🗑️</button>
      </div>
    </div>
  `;
  }).join('');
}

function openProductForm(editId = null) {
  const title = $('#productFormTitle');
  if (title) title.textContent = editId ? 'Modifier le Produit' : 'Ajouter un Produit';
  $('#prodEditId').value = editId || '';
  editingExtraMedia = [];
  editingColorVariants = [];

  if (!editId) { 
    $('#productForm')?.reset(); 
    $('#imagePreview').style.display = 'none'; 
    $('#imageUploadPlaceholder').style.display = 'flex'; 
    const featCheckbox = $('#prodFeatured');
    if (featCheckbox) featCheckbox.checked = true;
    renderExtraMediaGrid();
    renderColorVariantsEditor();
  }
  $('#productModalOverlay')?.classList.add('open'); 
  $('#productFormModal')?.classList.add('open');
}
function closeProductForm() { $('#productModalOverlay')?.classList.remove('open'); $('#productFormModal')?.classList.remove('open'); }

async function editProduct(id) {
  const p = await DB.get('products', id); if (!p) return;
  openProductForm(id);
  $('#prodName').value = p.name; 
  $('#prodCategory').value = p.category; 
  $('#prodPrice').value = p.price;
  $('#prodDesc').value = p.description || ''; 
  $('#prodBadge').value = p.badge || ''; 
  $('#prodBadgeType').value = p.badgeType || '';
  
  const featCheckbox = $('#prodFeatured');
  if (featCheckbox) featCheckbox.checked = isFeatured(p);

  if (p.image) { 
    const prev = $('#imagePreview'); 
    prev.src = p.image; 
    prev.style.display = 'block'; 
    $('#imageUploadPlaceholder').style.display = 'none'; 
  }

  editingExtraMedia = Array.isArray(p.media) ? [...p.media] : [];
  editingColorVariants = Array.isArray(p.colors) ? [...p.colors] : [];
  
  renderExtraMediaGrid();
  renderColorVariantsEditor();
}

function renderExtraMediaGrid() {
  const container = $('#extraMediaGrid');
  const counter = $('#extraMediaCounter');
  if (counter) counter.textContent = `${editingExtraMedia.length} / 20`;
  if (!container) return;

  container.innerHTML = editingExtraMedia.map((m, idx) => `
    <div class="extra-media-item">
      ${m.type === 'video' ? `<video src="${m.url}"></video>` : `<img src="${m.url}" alt="">`}
      <button type="button" class="btn-remove-media" onclick="removeExtraMedia(${idx})">✕</button>
    </div>
  `).join('');
}

function removeExtraMedia(idx) {
  editingExtraMedia.splice(idx, 1);
  renderExtraMediaGrid();
}
window.removeExtraMedia = removeExtraMedia;

function renderColorVariantsEditor() {
  const container = $('#colorVariantsList');
  if (!container) return;

  container.innerHTML = editingColorVariants.map((c, idx) => `
    <div class="color-variant-row">
      <input type="color" value="${c.hex || '#C8A96E'}" onchange="updateColorVariantHex(${idx}, this.value)">
      <input type="text" placeholder="Nom de la couleur (ex: Rouge & Or)" value="${c.name || ''}" oninput="updateColorVariantName(${idx}, this.value)">
      <button type="button" class="btn-delete-variant" onclick="removeColorVariant(${idx})">🗑️</button>
    </div>
  `).join('');
}

function updateColorVariantHex(idx, hex) { if (editingColorVariants[idx]) editingColorVariants[idx].hex = hex; }
function updateColorVariantName(idx, name) { if (editingColorVariants[idx]) editingColorVariants[idx].name = name; }
function removeColorVariant(idx) { editingColorVariants.splice(idx, 1); renderColorVariantsEditor(); }
window.updateColorVariantHex = updateColorVariantHex;
window.updateColorVariantName = updateColorVariantName;
window.removeColorVariant = removeColorVariant;

async function deleteProduct(id) {
  const p = await DB.get('products', id);
  if (confirm(`Supprimer "${p?.name || id}" ?`)) {
    await DB.delete('products', id);
    products = await DB.getAll('products');
    renderAdminProducts(); renderProducts();
    if ($('#collectionProductsGrid')) renderCollectionPage();
    showToast('Produit supprimé', 'info');
  }
}

async function saveProduct(e) {
  e.preventDefault();
  const editId = $('#prodEditId').value ? parseInt($('#prodEditId').value) : null;
  const name = $('#prodName').value.trim();
  const category = $('#prodCategory').value;
  const price = parseInt($('#prodPrice').value) || 0;
  const description = $('#prodDesc').value.trim();
  const badge = $('#prodBadge').value.trim() || null;
  const badgeType = $('#prodBadgeType').value;
  const featured = $('#prodFeatured') ? $('#prodFeatured').checked : true;

  if (!name || !price) { showToast('Nom et prix requis', 'error'); return; }

  let image = '';
  const fileInput = $('#prodImage');
  if (fileInput.files && fileInput.files[0]) {
    image = await readFileAsBase64(fileInput.files[0]);
  } else if (editId) {
    const existing = await DB.get('products', editId);
    image = existing?.image || '';
  }
  if (!image && !editId) image = 'images/wax_hollandais.jpg';

  const id = editId || await DB.getNextProductId();
  const validColors = editingColorVariants.filter(c => c.name && c.name.trim() !== '');

  await DB.put('products', { 
    id, 
    name, 
    category, 
    price, 
    description, 
    image, 
    media: editingExtraMedia.slice(0, 20),
    colors: validColors,
    badge, 
    badgeType,
    featured
  });

  products = await DB.getAll('products');
  renderAdminProducts(); 
  if ($('#productsGrid')) renderProducts();
  if ($('#collectionProductsGrid')) renderCollectionPage();
  closeProductForm();
  showToast(editId ? 'Produit modifié !' : 'Produit ajouté !', 'success');
}

function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    if (file.size > 3 * 1024 * 1024) { showToast('Image trop grande (max 3 Mo)', 'error'); rej('too large'); return; }
    const r = new FileReader(); r.onload = (e) => res(e.target.result); r.onerror = rej; r.readAsDataURL(file);
  });
}

// ══════════════════════════════════════════════
//  CLIENT PANEL
// ══════════════════════════════════════════════
function openClientPanel() {
  if (currentAuth?.role !== 'client') return;
  const w = $('#clientWelcome'); if (w) w.textContent = `Bienvenue, ${currentAuth.user?.prenom || 'Client'}`;
  $('#clientPanelOverlay')?.classList.add('open'); $('#clientPanel')?.classList.add('open'); document.body.style.overflow = 'hidden';
  renderClientOrders(); renderClientChat();
}
function closeClientPanel() { $('#clientPanelOverlay')?.classList.remove('open'); $('#clientPanel')?.classList.remove('open'); document.body.style.overflow = ''; }

async function renderClientOrders() {
  const container = $('#clientOrders'); if (!container) return;
  const phone = currentAuth?.user?.phone;
  if (!phone) { container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Connectez-vous pour voir vos commandes.</p>'; return; }
  const all = await DB.getAll('orders');
  const mine = all.filter(o => o.clientPhone === phone || o.customer?.phone === phone).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (mine.length === 0) { container.innerHTML = '<div class="admin-empty"><div class="admin-empty-icon">📭</div><p>Aucune commande</p><p class="admin-empty-sub">Vos commandes apparaîtront ici.</p></div>'; return; }

  const sl = { nouveau: '🆕 Nouveau', en_cours: '🔄 En cours', livre: '✅ Livré', annule: '❌ Annulé' };
  container.innerHTML = mine.map(o => {
    const d = new Date(o.date), ds = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    return `<div class="client-order-card"><div class="client-order-top"><span class="order-id-cell">${o.id}</span><span class="detail-status status-${o.status}">${sl[o.status] || o.status}</span></div><div class="client-order-date">${ds}</div><div class="client-order-items">${(o.items || []).map(i => `<span>${i.name} ×${i.qty}</span>`).join(', ')}</div><div class="client-order-total">Total: <strong>${formatPrice(o.total || 0)}</strong></div></div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  CHAT SYSTEM
// ══════════════════════════════════════════════
async function sendMessage(fromId, toId, text) {
  const msg = { 
    id: genId('MSG'), 
    conversation: [fromId, toId].sort().join('_'), 
    from: fromId, 
    to: toId, 
    text, 
    timestamp: new Date().toISOString(), 
    read: false 
  };
  await DB.put('messages', msg);
  return msg;
}

async function getConversation(id1, id2) {
  const all = await DB.getAll('messages');
  const convKey = [id1, id2].sort().join('_');
  return all.filter(m => m.conversation === convKey).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

async function getUniqueClients() {
  const allMessages = await DB.getAll('messages');
  const allClients = await DB.getAll('clients');
  const allOrders = await DB.getAll('orders');
  
  const clientsMap = new Map();

  // 1. Add registered clients
  allClients.forEach(c => {
    if (c.phone) {
      clientsMap.set(c.phone, {
        id: c.phone,
        name: c.prenom || c.phone,
        unread: 0,
        lastMsg: null
      });
    }
  });

  // 2. Add clients from orders if not present
  allOrders.forEach(o => {
    const phone = o.clientPhone || o.customer?.phone;
    const prenom = o.customer?.prenom;
    if (phone && !clientsMap.has(phone)) {
      clientsMap.set(phone, {
        id: phone,
        name: prenom || phone,
        unread: 0,
        lastMsg: null
      });
    }
  });

  // 3. Process messages
  allMessages.forEach(m => {
    const clientId = m.from === 'admin' ? m.to : m.from;
    if (clientId !== 'admin') {
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          name: clientId,
          unread: 0,
          lastMsg: m
        });
      }
      const c = clientsMap.get(clientId);
      if (!c.lastMsg || new Date(m.timestamp) > new Date(c.lastMsg.timestamp)) {
        c.lastMsg = m;
      }
      if (!m.read && m.to === 'admin') {
        c.unread++;
      }
    }
  });

  return [...clientsMap.values()].sort((a, b) => {
    if (a.lastMsg && b.lastMsg) {
      return new Date(b.lastMsg.timestamp) - new Date(a.lastMsg.timestamp);
    }
    if (a.lastMsg) return -1;
    if (b.lastMsg) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Admin Chat ──
async function renderAdminChatList() {
  const container = $('#adminChatContacts'); if (!container) return;
  const clients = await getUniqueClients();
  const totalUnread = clients.reduce((s, c) => s + c.unread, 0);
  const badge = $('#adminChatBadge'); if (badge) { badge.textContent = totalUnread || ''; badge.style.display = totalUnread > 0 ? 'inline-flex' : 'none'; }

  if (clients.length === 0) { 
    container.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">Aucun client trouvé</p>'; 
    return; 
  }

  container.innerHTML = clients.map(c => {
    const preview = c.lastMsg 
      ? (c.lastMsg.text.length > 35 ? c.lastMsg.text.substring(0, 35) + '...' : c.lastMsg.text)
      : '<i>Pas encore de message</i>';
    return `
      <div class="chat-contact ${c.id === adminChatActiveClient ? 'active' : ''}" data-client-id="${c.id}" onclick="openAdminChat('${c.id}')">
        <div class="chat-contact-avatar">👤</div>
        <div class="chat-contact-info">
          <div class="chat-contact-name">
            <span>${c.name}</span>
            ${c.unread > 0 ? `<span class="chat-unread-dot">${c.unread}</span>` : ''}
          </div>
          <div class="chat-contact-preview">${preview}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function openAdminChat(clientId) {
  if (!clientId) return;
  adminChatActiveClient = clientId;
  window.adminChatActiveClient = clientId;

  const placeholder = $('#adminChatPlaceholder'), active = $('#adminChatActive');
  if (placeholder) placeholder.style.display = 'none'; 
  if (active) active.style.display = 'flex';

  const clientData = await DB.get('clients', clientId);
  const topBar = $('#adminChatTopBar');
  if (topBar) {
    topBar.innerHTML = `<strong>👤 ${clientData?.prenom || clientId}</strong> <span style="font-size:0.8rem;color:#999;margin-left:8px;">${clientId}</span>`;
  }

  // Mark messages as read
  const msgs = await getConversation('admin', clientId);
  let updated = false;
  for (const m of msgs) { 
    if (m.to === 'admin' && !m.read) { 
      m.read = true; 
      await DB.put('messages', m); 
      updated = true;
    } 
  }

  await renderAdminChatList();
  await renderAdminChatMessages(clientId);
}
window.openAdminChat = openAdminChat;

async function renderAdminChatMessages(clientId) {
  const container = $('#adminChatMessages'); if (!container) return;
  const msgs = await getConversation('admin', clientId);
  container.innerHTML = msgs.length === 0
    ? '<div style="padding:40px;text-align:center;color:#999;">Démarrez la conversation avec ce client.</div>'
    : msgs.map(m => `<div class="chat-msg ${m.from === 'admin' ? 'chat-msg-sent' : 'chat-msg-received'}"><div class="chat-msg-bubble">${m.text}</div><div class="chat-msg-time">${new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div>`).join('');
  requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
}

async function adminSendMessage() {
  const input = $('#adminChatInput'); if (!input || !adminChatActiveClient) return;
  const text = input.value.trim(); if (!text) return;
  await sendMessage('admin', adminChatActiveClient, text);
  input.value = '';
  await renderAdminChatMessages(adminChatActiveClient);
  await renderAdminChatList();
}

// ── Client Chat ──
async function renderClientChat() {
  if (currentAuth?.role !== 'client') return;
  const container = $('#clientChatMessages'); if (!container) return;
  const phone = currentAuth.user.phone;
  const msgs = await getConversation('admin', phone);

  // Mark messages as read
  for (const m of msgs) { if (m.to === phone && !m.read) { m.read = true; await DB.put('messages', m); } }
  updateClientChatBadge();

  container.innerHTML = msgs.length === 0
    ? '<div style="padding:40px;text-align:center;color:#999;">Envoyez un message au propriétaire de la boutique.</div>'
    : msgs.map(m => `<div class="chat-msg ${m.from === phone ? 'chat-msg-sent' : 'chat-msg-received'}"><div class="chat-msg-bubble">${m.text}</div><div class="chat-msg-time">${new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div>`).join('');
  requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
}

async function clientSendMessage() {
  if (currentAuth?.role !== 'client') return;
  const input = $('#clientChatInput'); if (!input) return;
  const text = input.value.trim(); if (!text) return;
  await sendMessage(currentAuth.user.phone, 'admin', text);
  input.value = '';
  await renderClientChat();
  Notify.playChime();
}

async function updateClientChatBadge() {
  if (currentAuth?.role !== 'client') return;
  const phone = currentAuth.user.phone;
  const all = await DB.getAll('messages');
  const unread = all.filter(m => m.to === phone && !m.read).length;
  const badge = $('#clientChatBadge'), bubbleBadge = $('#chatBubbleBadge');
  if (badge) { badge.textContent = unread || ''; badge.style.display = unread > 0 ? 'inline-flex' : 'none'; }
  if (bubbleBadge) { bubbleBadge.textContent = unread || ''; bubbleBadge.style.display = unread > 0 ? 'flex' : 'none'; }
}

function startChatPolling() { 
  stopChatPolling(); 
  chatPollInterval = setInterval(async () => { 
    if (currentAuth?.role === 'client') { 
      await updateClientChatBadge(); 
      if ($('#clientPanel')?.classList.contains('open')) {
        await renderClientChat(); 
      }
    } else if (currentAuth?.role === 'admin') {
      if ($('#adminPanel')?.classList.contains('open')) {
        await renderAdminChatList();
        if (adminChatActiveClient) {
          await renderAdminChatMessages(adminChatActiveClient);
        }
      }
    }
  }, 2500); 
}

function stopChatPolling() { 
  if (chatPollInterval) { 
    clearInterval(chatPollInterval); 
    chatPollInterval = null; 
  } 
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function showToast(message, type = 'success') {
  const c = $('#toastContainer'); if (!c) return;
  const t = document.createElement('div'); t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${{ success: '✓', error: '✕', info: 'ℹ' }[type] || 'ℹ'}</span><span class="toast-message">${message}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

// ══════════════════════════════════════════════
//  SCROLL EFFECTS
// ══════════════════════════════════════════════
function setupScrollEffects() {
  const nav = $('#navbar'), bg = $('.hero-bg'); let tick = false;
  window.addEventListener('scroll', () => { if (!tick) { requestAnimationFrame(() => { const y = window.scrollY; if (y > 60) nav?.classList.add('scrolled'); else nav?.classList.remove('scrolled'); if (bg && window.innerWidth > 768) bg.style.transform = `translateY(${y * 0.3}px)`; tick = false; }); tick = true; } });
}

// ══════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════
function setupEventListeners() {
  // Cart
  $('#cartBtn')?.addEventListener('click', openCart);
  $('#cartClose')?.addEventListener('click', closeCart);
  $('#cartOverlay')?.addEventListener('click', closeCart);
  $('#continueShopping')?.addEventListener('click', closeCart);
  $('#checkoutBtn')?.addEventListener('click', openCheckout);

  // Checkout
  $('#checkoutClose')?.addEventListener('click', closeCheckout);
  $('#checkoutOverlay')?.addEventListener('click', closeCheckout);
  $('#checkoutForm')?.addEventListener('submit', submitOrder);

  // Quick View
  $('#quickViewClose')?.addEventListener('click', closeQuickView);
  $('#quickViewOverlay')?.addEventListener('click', closeQuickView);

  // Category Tabs
  $$('.category-tab').forEach(tab => tab.addEventListener('click', () => filterByCategory(tab.dataset.category, tab)));

  // Hamburger
  const hamburger = $('#hamburger'), navLinks = $('#navLinks');
  hamburger?.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks?.classList.toggle('open'); });

  // Smooth Scroll
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', function(e) { const h = this.getAttribute('href'); if (h === '#') return; const t = document.querySelector(h); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); hamburger?.classList.remove('active'); navLinks?.classList.remove('open'); } }));

  // Auth
  $('#authBtn')?.addEventListener('click', handleAuthClick);

  // Login Modal
  $('#loginClose')?.addEventListener('click', closeLogin);
  $('#loginOverlay')?.addEventListener('click', closeLogin);
  $$('.login-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.login-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.login-tab-content').forEach(c => c.classList.remove('active'));
    $(`#tab${tab.dataset.tab === 'proprietaire' ? 'Proprietaire' : 'Client'}`)?.classList.add('active');
  }));
  $('#adminLoginForm')?.addEventListener('submit', adminLogin);
  $('#clientLoginForm')?.addEventListener('submit', clientLogin);
  $('#clientRegisterForm')?.addEventListener('submit', clientRegister);
  $('#showRegister')?.addEventListener('click', (e) => { e.preventDefault(); $('#clientLoginView').style.display = 'none'; $('#clientRegisterView').style.display = 'block'; });
  $('#showLogin')?.addEventListener('click', (e) => { e.preventDefault(); $('#clientLoginView').style.display = 'block'; $('#clientRegisterView').style.display = 'none'; });

  // Admin Panel
  $('#adminClose')?.addEventListener('click', closeAdmin);
  $('#adminOverlay')?.addEventListener('click', closeAdmin);
  $('#adminLogoutBtn')?.addEventListener('click', logout);
  $('#adminSearchInput')?.addEventListener('input', (e) => { adminSearchQuery = e.target.value; renderAdminOrders(); });
  $$('.admin-filter-btn').forEach(b => b.addEventListener('click', () => { $$('.admin-filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); adminFilterStatus = b.dataset.status; renderAdminOrders(); }));
  $('#adminTestSound')?.addEventListener('click', () => { Notify.playChime(); showToast('🔔 Son testé', 'info'); });
  $('#adminExportCSV')?.addEventListener('click', exportCSV);

  // Admin Tabs
  $$('[data-admin-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-admin-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('#adminPanel .admin-tab-content').forEach(c => c.classList.remove('active'));
    $(`#adminTab${tab.dataset.adminTab.charAt(0).toUpperCase() + tab.dataset.adminTab.slice(1)}`)?.classList.add('active');
    if (tab.dataset.adminTab === 'chat') renderAdminChatList();
    if (tab.dataset.adminTab === 'products') renderAdminProducts();
  }));

  // Admin Chat
  $('#adminChatSend')?.addEventListener('click', adminSendMessage);
  $('#adminChatInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') adminSendMessage(); });
  $('#adminChatContacts')?.addEventListener('click', (e) => {
    const card = e.target.closest('.chat-contact');
    if (card && card.dataset.clientId) {
      openAdminChat(card.dataset.clientId);
    }
  });

  // Product Management
  $('#addProductBtn')?.addEventListener('click', () => openProductForm());
  $('#productFormClose')?.addEventListener('click', closeProductForm);
  $('#productModalOverlay')?.addEventListener('click', closeProductForm);
  $('#productForm')?.addEventListener('submit', saveProduct);
  // Image upload
  const uploadArea = $('#imageUploadArea'), fileInput = $('#prodImage'), preview = $('#imagePreview'), placeholder = $('#imageUploadPlaceholder');
  uploadArea?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const b64 = await readFileAsBase64(file); preview.src = b64; preview.style.display = 'block'; placeholder.style.display = 'none'; } catch(err) {}
  });

  // Extra Media & Color Variant Upload Listeners
  $('#btnAddExtraMedia')?.addEventListener('click', () => $('#prodExtraMedia')?.click());
  $('#prodExtraMedia')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (editingExtraMedia.length >= 20) {
        showToast('Limite de 20 médias atteinte', 'warning');
        break;
      }
      const isVideo = file.type.startsWith('video/');
      try {
        const b64 = await readFileAsBase64(file);
        editingExtraMedia.push({ type: isVideo ? 'video' : 'image', url: b64 });
      } catch(err) {}
    }
    renderExtraMediaGrid();
  });

  $('#btnAddColorVariant')?.addEventListener('click', () => {
    editingColorVariants.push({ name: 'Nouvelle Couleur', hex: '#C8A96E' });
    renderColorVariantsEditor();
  });

  // Client Panel
  $('#clientPanelClose')?.addEventListener('click', closeClientPanel);
  $('#clientPanelOverlay')?.addEventListener('click', closeClientPanel);
  $('#clientLogoutBtn')?.addEventListener('click', logout);
  $$('[data-client-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-client-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.client-tab-content').forEach(c => c.classList.remove('active'));
    $(`#clientTab${tab.dataset.clientTab.charAt(0).toUpperCase() + tab.dataset.clientTab.slice(1)}`)?.classList.add('active');
    if (tab.dataset.clientTab === 'chat') renderClientChat();
  }));
  $('#clientChatSend')?.addEventListener('click', clientSendMessage);
  $('#clientChatInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') clientSendMessage(); });

  // Collection Page Controls & Listeners
  const colSearchInput = $('#colSearchInput');
  if (colSearchInput) {
    colSearchInput.addEventListener('input', (e) => {
      collectionSearchQuery = e.target.value;
      renderCollectionPage();
    });
  }

  const colSortSelect = $('#colSortSelect');
  if (colSortSelect) {
    colSortSelect.addEventListener('change', (e) => {
      collectionSortBy = e.target.value;
      renderCollectionPage();
    });
  }

  $$('#colCategoriesBar .col-cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('#colCategoriesBar .col-cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      collectionCategory = chip.dataset.category || 'all';
      renderCollectionPage();
    });
  });

  const priceSlider = $('#priceRangeSlider');
  const priceBadge = $('#priceValueBadge');
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      collectionMaxPrice = Number(e.target.value);
      if (priceBadge) priceBadge.textContent = `${formatPrice(collectionMaxPrice)}`;
      $$('.btn-budget-pill').forEach(b => b.classList.remove('active'));
      renderCollectionPage();
    });
  }

  $$('.btn-budget-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.btn-budget-pill').forEach(b => b.classList.remove('active'));
      pill.classList.add('active');
      const bVal = pill.dataset.budget;
      if (bVal === 'all') {
        collectionMaxPrice = 50000;
      } else {
        collectionMaxPrice = Number(bVal);
      }
      if (priceSlider) priceSlider.value = collectionMaxPrice;
      if (priceBadge) priceBadge.textContent = `${formatPrice(collectionMaxPrice)}`;
      renderCollectionPage();
    });
  });

  const btnReset = $('#btnResetFilters');
  if (btnReset) {
    btnReset.addEventListener('click', resetCollectionFilters);
  }

  // Chat Bubble
  $('#chatBubble')?.addEventListener('click', () => {
    openClientPanel();
    setTimeout(() => {
      $$('[data-client-tab]').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.clientTab === 'chat') t.classList.add('active');
      });
      $$('.client-tab-content').forEach(c => c.classList.remove('active'));
      $('#clientTabChat')?.classList.add('active');
      renderClientChat();
    }, 100);
  });

  // Order Detail
  $('#orderDetailClose')?.addEventListener('click', closeOrderDetail);
  $('#orderDetailOverlay')?.addEventListener('click', closeOrderDetail);

  // Global window functions for inline onclick handlers
  window.toggleAdminFeatured = toggleAdminFeatured;
  window.resetCollectionFilters = resetCollectionFilters;
  window.setCollectionFilter = setCollectionFilter;

  // Escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closeCheckout(); closeQuickView(); closeLogin(); closeAdmin(); closeClientPanel(); closeOrderDetail(); closeProductForm(); } });
}

