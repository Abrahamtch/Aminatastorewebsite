/**
 * ═══════════════════════════════════════════════════════════════
 *  AMINATA STORE — Application JavaScript
 *  Auth, Panier, Commandes DB, Gestion Produits, Chat, Admin
 * ═══════════════════════════════════════════════════════════════
 */

// ── Configuration ──
const WHATSAPP_NUMBER = '221769214015';
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

// ── Supabase Cloud Database ──
const SUPABASE_URL = 'https://nglihypdaiyftfutjqoo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__wfinp2_RVVYznuD3_aMMg_L8FNgoXq';
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Supabase client error:', e);
    }
  }
  return supabaseClient;
}

// ══════════════════════════════════════════════
//  DATABASE — Supabase Cloud (with IndexedDB fallback)
// ══════════════════════════════════════════════
const DB = {
  db: null,
  async init() {
    // 1. Initialize IndexedDB as local cache
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

    // 2. Seed initial products if needed
    await this.seedProducts();

    // 3. Setup Supabase Realtime synchronization
    this.setupRealtime();
  },

  setupRealtime() {
    const sb = getSupabase();
    if (!sb) return;
    try {
      sb.channel('realtime_products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
          console.log('🔄 Synchro Supabase en temps réel reçue');
          products = await this.getAll('products');
          renderAdminProducts();
          if ($('#productsGrid')) renderProducts();
          if ($('#collectionProductsGrid')) renderCollectionPage();
        })
        .subscribe();
    } catch(e) {
      console.warn('Realtime subscription error:', e);
    }
  },

  async seedProducts() {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('products').select('*');
        if (!error && (!data || data.length === 0)) {
          console.log('Seeding initial products to Supabase...');
          await sb.from('products').upsert(DEFAULT_PRODUCTS);
        }
      } catch (err) {
        console.warn('Supabase seed notice:', err);
      }
    }

    const localExisting = await this.getLocalAll('products');
    if (localExisting.length === 0) {
      for (const p of DEFAULT_PRODUCTS) await this.putLocal('products', p);
    }
  },

  async putLocal(store, data) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => res();
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async getLocalAll(store) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = (e) => rej(e.target.error);
    });
  },

  async put(store, data) {
    const sb = getSupabase();
    if (sb) {
      try {
        if (store === 'products') {
          const { error } = await sb.from('products').upsert(data);
          if (error) console.warn('Supabase put product error:', error);
        } else if (store === 'orders') {
          const { error } = await sb.from('orders').upsert(data);
          if (error) console.warn('Supabase put order error:', error);
        } else if (store === 'clients') {
          const { error } = await sb.from('clients').upsert(data);
          if (error) console.warn('Supabase put client error:', error);
        } else if (store === 'messages') {
          const { error } = await sb.from('messages').upsert(data);
          if (error) console.warn('Supabase put message error:', error);
        }
      } catch (err) {
        console.warn('Supabase put error, falling back to local:', err);
      }
    }

    return this.putLocal(store, data);
  },

  async get(store, key) {
    const sb = getSupabase();
    if (sb && ['products', 'orders', 'clients'].includes(store)) {
      try {
        const keyField = store === 'clients' ? 'phone' : 'id';
        const { data, error } = await sb.from(store).select('*').eq(keyField, key).maybeSingle();
        if (!error && data) return data;
      } catch (err) {}
    }

    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = (e) => rej(e.target.error);
    });
  },

  async getAll(store) {
    const sb = getSupabase();
    if (sb && ['products', 'orders', 'clients', 'messages'].includes(store)) {
      try {
        let query = sb.from(store).select('*');
        if (store === 'products') query = query.order('id', { ascending: true });
        if (store === 'orders') query = query.order('date', { ascending: false });
        if (store === 'messages') query = query.order('timestamp', { ascending: true });
        
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          for (const item of data) {
            this.putLocal(store, item).catch(() => {});
          }
          return data;
        }
      } catch (err) {
        console.warn(`Supabase getAll(${store}) notice:`, err);
      }
    }

    return this.getLocalAll(store);
  },

  async delete(store, key) {
    const sb = getSupabase();
    if (sb && ['products', 'orders', 'clients', 'messages'].includes(store)) {
      try {
        const keyField = store === 'clients' ? 'phone' : 'id';
        await sb.from(store).delete().eq(keyField, key);
      } catch(err) {
        console.warn(`Supabase delete(${store}) notice:`, err);
      }
    }

    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => res();
      tx.onerror = (e) => rej(e.target.error);
    });
  },

  async getNextProductId() {
    const all = await this.getAll('products');
    const numericIds = all.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n) && n > 0);
    return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
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

function buildFullPhoneNumber(countrySelectId, phoneInputId) {
  const countrySelect = $(`#${countrySelectId}`);
  const phoneInput = $(`#${phoneInputId}`);
  const rawInput = phoneInput ? phoneInput.value.trim() : '';
  const countryCode = (countrySelect && countrySelect.value !== 'other') ? countrySelect.value : '228';

  let cleanDigits = rawInput.replace(/\D/g, '');
  if (!cleanDigits) return '';

  if (rawInput.startsWith('+')) {
    return `+${cleanDigits}`;
  }

  if (countrySelect?.value === 'other') {
    return `+${cleanDigits}`;
  }

  // Remove leading 0 (e.g. 090123456 -> 90123456)
  if (cleanDigits.startsWith('0')) {
    cleanDigits = cleanDigits.substring(1);
  }

  // Check if country code is already prefixed
  if (cleanDigits.startsWith(countryCode) && cleanDigits.length > countryCode.length + 5) {
    return `+${cleanDigits}`;
  }

  return `+${countryCode}${cleanDigits}`;
}

async function clientLogin(e) {
  e.preventDefault();
  const phone = buildFullPhoneNumber('loginCountrySelect', 'clientLoginPhone') || $('#clientLoginPhone')?.value.trim() || '';
  const pass = $('#clientLoginPass')?.value.trim() || '';
  const err = $('#clientLoginError');
  if (err) err.textContent = '';

  if (!phone || phone.replace(/\D/g, '').length < 4) {
    if (err) err.textContent = 'Veuillez saisir un numéro de téléphone valide';
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
      showToast(`👤 Bienvenue, ${client.prenom || 'Client'} !`, 'success');
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
  const prenom = ($('#regPrenom') || $('#regName'))?.value.trim() || '';
  const nom = ($('#regNom') || $('#clientRegNom'))?.value.trim() || '';
  const phone = buildFullPhoneNumber('regCountrySelect', 'regPhone') || $('#regPhone')?.value.trim() || '';
  const pass = $('#regPass')?.value.trim() || '';
  const passConfirm = ($('#regPassConfirm') || $('#clientRegPassConfirm'))?.value.trim() || '';
  const err = $('#clientRegisterError') || $('#clientRegError');
  if (err) err.textContent = '';

  if (!prenom || prenom.length < 2) { 
    if (err) err.textContent = 'Prénom requis (au moins 2 caractères)'; 
    return; 
  }
  if (!nom || nom.length < 2) { 
    if (err) err.textContent = 'Nom de famille requis (au moins 2 caractères)'; 
    return; 
  }
  if (!phone || phone.replace(/\D/g, '').length < 6) { 
    if (err) err.textContent = 'Numéro WhatsApp valide requis'; 
    return; 
  }
  if (!pass || pass.length < 4) { 
    if (err) err.textContent = 'Le mot de passe doit comporter au moins 4 caractères'; 
    return; 
  }
  if (pass !== passConfirm) {
    if (err) err.textContent = 'Les deux mots de passe ne correspondent pas'; 
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

    const client = { 
      phone, 
      prenom, 
      nom, 
      password: pass, 
      createdAt: new Date().toISOString() 
    };
    await DB.put('clients', client);
    saveAuth({ role: 'client', user: client });
    closeLogin();
    showToast(`📝 Compte créé avec succès ! Bienvenue, ${prenom} ${nom} !`, 'success');
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
  const prodList = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const product = prodList.find(p => String(p.id) === String(productId));
  if (!product) return;
  const ex = cart.find(i => String(i.id) === String(productId) && !i.color);
  if (ex) {
    ex.quantity += 1;
    if (!ex.name) ex.name = product.name;
    if (!ex.price) ex.price = product.price;
    if (!ex.image) ex.image = product.image;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  saveCart();
  if (btnEl) {
    const orig = btnEl.innerHTML;
    btnEl.innerHTML = '✓ Ajouté !';
    btnEl.classList.add('added');
    setTimeout(() => { btnEl.innerHTML = orig; btnEl.classList.remove('added'); }, 1500);
  }
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

function removeFromCart(pid) {
  cart = cart.filter(i => String(i.id) !== String(pid));
  saveCart();
  showToast('Article retiré', 'info');
}

function updateQuantity(pid, d) {
  const i = cart.find(x => String(x.id) === String(pid));
  if (!i) return;
  i.quantity = (Number(i.quantity) || 1) + d;
  if (i.quantity <= 0) removeFromCart(pid);
  else saveCart();
}

function getCartTotal() {
  const prodList = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  return cart.reduce((t, i) => {
    const p = prodList.find(x => String(x.id) === String(i.id));
    const price = (p && p.price) ? p.price : (Number(i.price) || 0);
    const qty = Number(i.quantity) || 1;
    return t + (price * qty);
  }, 0);
}

function getCartCount() {
  return cart.reduce((c, i) => c + (Number(i.quantity) || 1), 0);
}

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
  if (cart.length === 0) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    if (footer) footer.style.display = 'none';
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }
  if (empty) empty.style.display = 'none';
  if (footer) footer.style.display = 'block';

  const prodList = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  container.innerHTML = cart.map(item => {
    const p = prodList.find(x => String(x.id) === String(item.id));
    const name = item.name || p?.name || 'Tissu Africain';
    const price = (p && p.price) ? p.price : (Number(item.price) || 0);
    const image = item.image || p?.image || 'images/wax_hollandais.jpg';
    const qty = Number(item.quantity) || 1;
    return `<div class="cart-item">
      <img class="cart-item-img" src="${image}" alt="${name}">
      <div class="cart-item-details">
        <div class="cart-item-name">${name}</div>
        <div class="cart-item-price">${formatPrice(price)} /yard</div>
        <div class="cart-item-bottom">
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)" aria-label="Diminuer">−</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)" aria-label="Augmenter">+</button>
          </div>
          <span class="cart-item-line-total">${formatPrice(price * qty)}</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Supprimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>`;
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

    const ex = cart.find(i => String(i.id) === String(pid) && i.color === selectedColorVariant);
    if (ex) {
      ex.quantity += qvQty;
      if (!ex.name) ex.name = itemTitle;
      if (!ex.price) ex.price = p.price;
      if (!ex.image) ex.image = p.image;
    } else {
      cart.push({ id: pid, name: itemTitle, color: selectedColorVariant, price: p.price, image: p.image, quantity: qvQty });
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

  const prodList = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const oi = $('#orderItems') || $('#summaryItems');
  const ot = $('#orderTotal') || $('#summaryTotal');
  const totalAmount = getCartTotal();

  if (oi) {
    oi.innerHTML = cart.map(i => {
      const p = prodList.find(x => String(x.id) === String(i.id));
      const name = i.name || p?.name || 'Tissu Africain';
      const price = (p && p.price) ? p.price : (Number(i.price) || 0);
      const qty = Number(i.quantity) || 1;
      return `<div class="order-item-row">
        <span>${name} <span class="order-item-qty">×${qty}</span></span>
        <span>${formatPrice(price * qty)}</span>
      </div>`;
    }).join('');
  }

  if (ot) ot.textContent = formatPrice(totalAmount);

  // Pre-fill if client logged in
  if (currentAuth?.role === 'client') {
    const nameEl = $('#clientNom') || $('#customerName');
    const phoneEl = $('#clientPhone') || $('#customerPhone');
    const user = currentAuth.user;
    if (nameEl && user?.prenom) nameEl.value = (user.prenom + (user.nom ? ' ' + user.nom : '')).trim();
    if (phoneEl && user?.phone) phoneEl.value = user.phone;
  }

  // Clear previous error states
  const ne = $('#nomError') || $('#nameError');
  const pe = $('#phoneError');
  const ve = $('#villeError');
  if (ne) ne.textContent = '';
  if (pe) pe.textContent = '';
  if (ve) ve.textContent = '';

  if (typeof fbq === 'function') {
    try {
      fbq('track', 'InitiateCheckout', {
        num_items: getCartCount(),
        value: totalAmount,
        currency: 'XOF'
      });
    } catch(e) {}
  }

  setTimeout(() => {
    $('#checkoutOverlay')?.classList.add('open');
    $('#checkoutModal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }, 200);
}

function closeCheckout() {
  $('#checkoutOverlay')?.classList.remove('open');
  $('#checkoutModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

async function submitOrder(e) {
  e.preventDefault();

  const nameEl = $('#clientNom') || $('#customerName');
  const phoneEl = $('#clientPhone') || $('#customerPhone');
  const countrySelect = $('#countrySelect');
  const villeEl = $('#clientVille');
  const commentEl = $('#clientCommentaire') || $('#customerComment');

  const prenom = nameEl?.value.trim() || '';
  const rawPhone = phoneEl?.value.trim() || '';
  const countryCode = countrySelect?.value || '228';
  const ville = villeEl?.value.trim() || '';
  const comment = commentEl?.value.trim() || '';

  const ne = $('#nomError') || $('#nameError');
  const pe = $('#phoneError');
  const ve = $('#villeError');
  let err = false;

  if (ne) ne.textContent = '';
  if (pe) pe.textContent = '';
  if (ve) ve.textContent = '';

  if (prenom.length < 2) {
    if (ne) ne.textContent = 'Nom complet requis (min. 2 car.)';
    err = true;
  }

  const cleanPhone = rawPhone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleanPhone || cleanPhone.length < 4) {
    if (pe) pe.textContent = 'Numéro WhatsApp requis (au moins 4 chiffres)';
    err = true;
  }

  if (villeEl && ville.length < 2) {
    if (ve) ve.textContent = 'Ville / Quartier requis (min. 2 car.)';
    err = true;
  }

  if (err) return;

  // Format full international phone number
  let fullPhone = cleanPhone;
  if (!fullPhone.startsWith('+')) {
    if (fullPhone.startsWith(countryCode)) {
      fullPhone = '+' + fullPhone;
    } else {
      fullPhone = `+${countryCode}${fullPhone}`;
    }
  }

  const prodList = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const orderTotal = getCartTotal();

  const order = {
    id: genId('ORD'),
    date: new Date().toISOString(),
    customer: { prenom, phone: fullPhone, rawPhone, ville },
    items: cart.map(i => {
      const p = prodList.find(x => String(x.id) === String(i.id));
      const name = i.name || p?.name || 'Tissu Africain';
      const price = (p && p.price) ? p.price : (Number(i.price) || 0);
      const qty = Number(i.quantity) || 1;
      return { name, qty, price, total: price * qty };
    }),
    total: orderTotal,
    comment,
    status: 'nouveau',
    read: false,
    clientPhone: (currentAuth?.role === 'client' && currentAuth.user?.phone) ? currentAuth.user.phone : fullPhone
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
        num_items: cart.reduce((acc, cur) => acc + (Number(cur.quantity) || 1), 0)
      });
    } catch(e) {}
  }

  // Compose WhatsApp message with full details
  const now = new Date();
  let msg = `🛒 *NOUVELLE COMMANDE* 🛒\n━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `📋 *Réf:* ${order.id}\n`;
  msg += `👤 *Client:* ${prenom}\n`;
  msg += `📱 *WhatsApp:* ${fullPhone}\n`;
  if (ville) msg += `📍 *Ville / Quartier:* ${ville}\n`;
  msg += `\n📦 *Articles commandés:*\n`;

  cart.forEach((i, idx) => {
    const p = prodList.find(x => String(x.id) === String(i.id));
    const name = i.name || p?.name || 'Tissu';
    const price = (p && p.price) ? p.price : (Number(i.price) || 0);
    const qty = Number(i.quantity) || 1;
    msg += `${idx + 1}. *${name}* × ${qty} = ${formatPrice(price * qty)}\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL: ${formatPrice(orderTotal)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (comment) msg += `\n💬 *Commentaire:* ${comment}\n`;
  msg += `\n📅 *Date:* ${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
  msg += `_Commande passée sur ${STORE_NAME}_`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  cart = [];
  saveCart();
  $('#checkoutForm')?.reset();
  showToast('✅ Commande validée ! Redirection WhatsApp...', 'success');
  closeCheckout();
  setTimeout(() => {
    window.open(waUrl, '_blank') || (window.location.href = waUrl);
  }, 1200);
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
  renderAdminOrders(); renderAdminProducts(); renderAdminChatList(); renderMarketingTab();
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

async function processImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
  if (!file) return '';
  if (file.type && file.type.startsWith('video/')) {
    if (file.size > 20 * 1024 * 1024) {
      showToast('Vidéo trop lourde (max 20 Mo)', 'warning');
      throw new Error('Video too large');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > maxWidth || h > maxHeight) {
          if (w > h) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          } else {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch(err) {
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function readFileAsBase64(file) {
  return processImageFile(file);
}

async function saveProduct(e) {
  if (e) e.preventDefault();

  const formModal = $('#productFormModal');
  const submitBtn = $('#productForm button[type="submit"]') || $('.btn-save-product');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '💾 Enregistrer le Produit';

  try {
    const editIdInput = $('#prodEditId');
    const editId = (editIdInput && editIdInput.value) ? parseInt(editIdInput.value, 10) : null;
    const nameInput = $('#prodName');
    const categoryInput = $('#prodCategory');
    const priceInput = $('#prodPrice');
    const descInput = $('#prodDesc');
    const badgeInput = $('#prodBadge');
    const badgeTypeInput = $('#prodBadgeType');
    const featCheckbox = $('#prodFeatured');

    const name = nameInput ? nameInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : 'Wax';
    const price = priceInput ? parseInt(priceInput.value, 10) : 0;
    const description = descInput ? descInput.value.trim() : '';
    const badge = badgeInput ? badgeInput.value.trim() : null;
    const badgeType = badgeTypeInput ? badgeTypeInput.value : '';
    const featured = featCheckbox ? featCheckbox.checked : true;

    // Reset styles
    if (nameInput) nameInput.style.borderColor = '';
    if (priceInput) priceInput.style.borderColor = '';

    if (!name) {
      if (nameInput) {
        nameInput.style.borderColor = 'var(--color-error)';
        nameInput.focus();
        if (formModal) formModal.scrollTo({ top: 0, behavior: 'smooth' });
      }
      showToast('⚠️ Veuillez renseigner le nom du tissu (en haut du formulaire)', 'error');
      return;
    }

    if (!price || isNaN(price) || price <= 0) {
      if (priceInput) {
        priceInput.style.borderColor = 'var(--color-error)';
        priceInput.focus();
        if (formModal) formModal.scrollTo({ top: 0, behavior: 'smooth' });
      }
      showToast('⚠️ Veuillez renseigner un prix valide (ex: 12000)', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Enregistrement du produit...';
    }

    // Determine primary image
    let image = '';
    const previewEl = $('#imagePreview');
    const fileInput = $('#prodImage');

    if (previewEl && previewEl.src && previewEl.style.display !== 'none' && !previewEl.src.endsWith('.html')) {
      image = previewEl.src;
    } else if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        image = await processImageFile(fileInput.files[0]);
      } catch (err) {
        console.warn('Image processing error:', err);
      }
    } else if (editId) {
      const existing = await DB.get('products', editId);
      image = existing?.image || '';
    }

    // If no primary image set but extra media exists, use first extra media!
    if (!image && editingExtraMedia.length > 0) {
      image = editingExtraMedia[0].url;
    }

    if (!image) {
      image = 'images/wax_hollandais.jpg';
    }

    const id = editId || await DB.getNextProductId();
    const validColors = editingColorVariants.filter(c => c && c.name && c.name.trim() !== '');

    const productRecord = { 
      id: Number(id), 
      name, 
      category, 
      price: Number(price), 
      description, 
      image, 
      media: editingExtraMedia.slice(0, 20),
      colors: validColors,
      badge: badge || null, 
      badgeType,
      featured: Boolean(featured)
    };

    await DB.put('products', productRecord);

    products = await DB.getAll('products');
    renderAdminProducts(); 
    if ($('#productsGrid')) renderProducts();
    if ($('#collectionProductsGrid')) renderCollectionPage();
    
    closeProductForm();
    showToast(editId ? `✅ "${name}" modifié avec succès !` : `✅ "${name}" ajouté avec succès !`, 'success');
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement du produit:', err);
    showToast('Erreur lors de l\'enregistrement : ' + (err.message || err), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}
window.saveProduct = saveProduct;

// ══════════════════════════════════════════════
//  CLIENT PANEL
// ══════════════════════════════════════════════
function openClientPanel() {
  if (currentAuth?.role !== 'client') return;
  const user = currentAuth.user || {};
  const w = $('#clientWelcome'); if (w) w.textContent = `Bienvenue, ${user.prenom || 'Client'}`;
  const pName = $('#clientProfileName'); if (pName) pName.textContent = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Client';
  const pPhone = $('#clientProfilePhone'); if (pPhone) pPhone.textContent = user.phone || '';
  
  $('#clientPanelOverlay')?.classList.add('open'); 
  $('#clientPanel')?.classList.add('open'); 
  document.body.style.overflow = 'hidden';

  renderClientOrders(); 
  renderClientChat();
}
function closeClientPanel() { $('#clientPanelOverlay')?.classList.remove('open'); $('#clientPanel')?.classList.remove('open'); document.body.style.overflow = ''; }

async function changeClientPassword(e) {
  e.preventDefault();
  if (currentAuth?.role !== 'client' || !currentAuth.user) {
    showToast('Vous devez être connecté pour changer de mot de passe', 'error');
    return;
  }

  const oldPass = $('#oldPass')?.value.trim() || '';
  const newPass = $('#newPass')?.value.trim() || '';
  const confirmNewPass = $('#confirmNewPass')?.value.trim() || '';
  const err = $('#changePassError');
  if (err) err.textContent = '';

  if (!oldPass) {
    if (err) err.textContent = 'Veuillez saisir votre mot de passe actuel';
    return;
  }

  if (oldPass !== currentAuth.user.password) {
    if (err) err.textContent = 'Le mot de passe actuel est incorrect';
    return;
  }

  if (!newPass || newPass.length < 4) {
    if (err) err.textContent = 'Le nouveau mot de passe doit comporter au moins 4 caractères';
    return;
  }

  if (newPass !== confirmNewPass) {
    if (err) err.textContent = 'La confirmation du mot de passe ne correspond pas';
    return;
  }

  const saveBtn = $('#changePasswordForm button[type="submit"]');
  const origText = saveBtn ? saveBtn.innerHTML : '💾 Mettre à jour le mot de passe';

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Mise à jour...';
    }

    const updatedClient = {
      ...currentAuth.user,
      password: newPass,
      updatedAt: new Date().toISOString()
    };

    await DB.put('clients', updatedClient);
    saveAuth({ role: 'client', user: updatedClient });
    
    $('#changePasswordForm')?.reset();
    showToast('✅ Votre mot de passe a été modifié avec succès !', 'success');
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    if (err) err.textContent = 'Erreur lors de la mise à jour : ' + (error.message || error);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = origText;
    }
  }
}
window.changeClientPassword = changeClientPassword;

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
// ══════════════════════════════════════════════
//  MARKETING, META PIXEL & SMART AI ASSISTANT (ABRAHAM)
// ══════════════════════════════════════════════
const DEFAULT_PIXEL_CODE = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1532882571493316');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1532882571493316&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

function getActivePixelCode() {
  return localStorage.getItem('aminata_meta_pixel_code') || DEFAULT_PIXEL_CODE;
}

function extractPixelIdFromCode(code) {
  if (!code) return '1532882571493316';
  const m1 = code.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/);
  if (m1 && m1[1]) return m1[1];
  const m2 = code.match(/tr\?id=(\d+)/);
  if (m2 && m2[1]) return m2[1];
  const m3 = code.match(/\b\d{10,20}\b/);
  if (m3) return m3[0];
  return '1532882571493316';
}

function togglePixelEditor(show) {
  const drawer = $('#pixelEditorDrawer');
  const btn = $('#btnTogglePixelEditor');
  if (!drawer) return;
  const isVisible = drawer.style.display !== 'none';
  const nextState = typeof show === 'boolean' ? show : !isVisible;
  
  drawer.style.display = nextState ? 'block' : 'none';
  if (btn) {
    btn.innerHTML = nextState ? '✕ Fermer l\'éditeur' : '⚙️ Changer le pixel';
  }
  if (nextState) {
    const area = $('#metaPixelCodeInput');
    if (area) {
      area.value = getActivePixelCode();
      area.focus();
    }
  }
}
window.togglePixelEditor = togglePixelEditor;

function saveMetaPixelCode(rawCode) {
  if (!rawCode || !rawCode.trim()) {
    showToast('Veuillez coller le code source du pixel', 'warning');
    return;
  }
  const cleanCode = rawCode.trim();
  localStorage.setItem('aminata_meta_pixel_code', cleanCode);
  const pixelId = extractPixelIdFromCode(cleanCode);
  localStorage.setItem('aminata_meta_pixel_id', pixelId);

  if (typeof window.fbq === 'function') {
    try {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    } catch (e) {
      console.warn('Erreur fbq init:', e);
    }
  }

  const badge = $('#pixelStatusBadge');
  if (badge) {
    badge.textContent = `✅ Pixel Actif (ID: ${pixelId})`;
  }

  togglePixelEditor(false);
  showToast(`🎯 Code Meta Pixel enregistré & activé (ID: ${pixelId}) !`, 'success');
}
window.saveMetaPixelCode = saveMetaPixelCode;

function resetMetaPixelCode() {
  localStorage.removeItem('aminata_meta_pixel_code');
  localStorage.removeItem('aminata_meta_pixel_id');
  const codeArea = $('#metaPixelCodeInput');
  if (codeArea) codeArea.value = DEFAULT_PIXEL_CODE;
  const badge = $('#pixelStatusBadge');
  if (badge) badge.textContent = `✅ Pixel Actif (ID: 1532882571493316)`;
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('init', '1532882571493316');
      window.fbq('track', 'PageView');
    } catch (e) {}
  }
  togglePixelEditor(false);
  showToast('🔄 Code Pixel réinitialisé par défaut', 'info');
}
window.resetMetaPixelCode = resetMetaPixelCode;

// ── AI Marketing Chat History ──
const AI_HISTORY_KEY = 'aminata_ai_chat_history_v3';

function getAiDefaultGreeting() {
  return [
    {
      id: 'init_msg',
      role: 'assistant',
      html: `
        <p><strong>Bonjour Aminata !</strong> Je suis Abraham votre assistant IA en marketing e-commerce et publicités Facebook Ads pour vendre vos articles Aminata Store.</p>
        <p>Je suis à vos côtés pour analyser votre boutique, rédiger des textes publicitaires irrésistibles, trouver les meilleures audiences et multiplier vos ventes sur WhatsApp. 🚀</p>
        <p><em>👉 Choisissez un tissu ci-dessus et cliquez sur un bouton d'action rapide, ou posez-moi n'importe quelle question sur votre business !</em></p>
      `,
      timestamp: new Date().toISOString()
    }
  ];
}

function getAiChatHistory() {
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY);
    if (!raw) return getAiDefaultGreeting();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getAiDefaultGreeting();
  } catch (e) {
    return getAiDefaultGreeting();
  }
}

function saveAiChatHistory(history) {
  try {
    localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Erreur sauvegarde historique IA:', e);
  }
}

function renderAiChatHistory() {
  const chatContainer = $('#aiMarketingMessages');
  if (!chatContainer) return;
  const history = getAiChatHistory();

  let html = '';
  history.forEach(msg => {
    if (msg.role === 'user') {
      html += `
        <div class="ai-msg ai-msg-user">
          <div class="ai-msg-avatar">👤</div>
          <div class="ai-msg-content"><p>${escapeHtml(msg.text)}</p></div>
        </div>
      `;
    } else {
      html += `
        <div class="ai-msg ai-msg-bot">
          <div class="ai-msg-avatar">🤖</div>
          <div class="ai-msg-content">${msg.html}</div>
        </div>
      `;
    }
  });

  chatContainer.innerHTML = html;
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearAiChatHistory() {
  const def = getAiDefaultGreeting();
  saveAiChatHistory(def);
  renderAiChatHistory();
  showToast('🔄 Nouvelle conversation démarrée avec Abraham !', 'info');
}
window.clearAiChatHistory = clearAiChatHistory;

function appendAiBotMessage(htmlContent) {
  const history = getAiChatHistory();
  history.push({
    id: 'bot_' + Date.now(),
    role: 'assistant',
    html: htmlContent,
    timestamp: new Date().toISOString()
  });
  saveAiChatHistory(history);
  renderAiChatHistory();
}

function appendAiUserMessage(text) {
  const history = getAiChatHistory();
  history.push({
    id: 'user_' + Date.now(),
    role: 'user',
    text: text,
    timestamp: new Date().toISOString()
  });
  saveAiChatHistory(history);
  renderAiChatHistory();
}

async function renderMarketingTab() {
  const pixelTextarea = $('#metaPixelCodeInput');
  if (pixelTextarea) {
    pixelTextarea.value = getActivePixelCode();
  }

  const activeId = extractPixelIdFromCode(getActivePixelCode());
  const badge = $('#pixelStatusBadge');
  if (badge) {
    badge.textContent = `✅ Pixel Actif (ID: ${activeId})`;
  }

  const prodSelect = $('#aiProductSelect');
  if (prodSelect) {
    const allProds = await DB.getAll('products');
    let html = '<option value="all">🌟 Stratégie Globale Boutique (Tous les Tissus)</option>';
    allProds.forEach(p => {
      html += `<option value="${p.id}">🧵 ${p.name} — ${formatPrice(p.price)}/yard (${p.category})</option>`;
    });
    prodSelect.innerHTML = html;
  }

  renderAiChatHistory();
}
window.renderMarketingTab = renderMarketingTab;

// ── Smart Conversational Reasoning Engine (Abraham) ──
async function runAiMarketingAction(actionType) {
  const prodSelect = $('#aiProductSelect');
  const goalSelect = $('#aiGoalSelect');
  const selectedProdId = prodSelect ? prodSelect.value : 'all';
  const selectedGoal = goalSelect ? goalSelect.value : 'whatsapp_sales';

  let targetProduct = null;
  if (selectedProdId !== 'all') {
    targetProduct = await DB.get('products', selectedProdId);
  }

  const chatContainer = $('#aiMarketingMessages');
  if (!chatContainer) return;

  const thinkingId = 'ai_thinking_' + Date.now();
  const thinkingHtml = `
    <div class="ai-msg ai-msg-bot" id="${thinkingId}">
      <div class="ai-msg-avatar">🤖</div>
      <div class="ai-msg-content">
        <div class="ai-typing-indicator">
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span style="font-size:0.85rem;color:var(--color-text-light);margin-left:6px;">Abraham analyse vos données et rédige votre stratégie...</span>
        </div>
      </div>
    </div>
  `;
  chatContainer.insertAdjacentHTML('beforeend', thinkingHtml);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  setTimeout(() => {
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) thinkingEl.remove();

    let responseContent = '';
    if (actionType === 'copywriting') {
      responseContent = generateCopywritingResponse(targetProduct, selectedGoal);
    } else if (actionType === 'audience') {
      responseContent = generateAudienceResponse(targetProduct, selectedGoal);
    } else if (actionType === 'video_ideas') {
      responseContent = generateVideoIdeasResponse(targetProduct, selectedGoal);
    } else if (actionType === 'offer_strategy') {
      responseContent = generateOfferStrategyResponse(targetProduct, selectedGoal);
    }

    appendAiBotMessage(responseContent);
  }, 700);
}
window.runAiMarketingAction = runAiMarketingAction;

function copyAdText(btnElement, textToCopy) {
  navigator.clipboard.writeText(textToCopy).then(() => {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '✅ Copié !';
    btnElement.style.background = '#10b981';
    btnElement.style.color = '#fff';
    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.background = '';
      btnElement.style.color = '';
    }, 2000);
    showToast('📋 Texte publicitaire copié dans le presse-papier !', 'success');
  });
}
window.copyAdText = copyAdText;

function escapeHtml(string) {
  const str = String(string || '');
  return str.replace(/[&<>"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

function generateCopywritingResponse(product, goal) {
  const prodName = product ? product.name : 'Nos Tissus Wax, Basin & Dentelle de Luxe';
  const prodPrice = product ? `${formatPrice(product.price)} / yard` : 'Prix direct atelier';
  const category = product ? product.category : 'Wax, Basin & Soie';
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  const text1 = `👑 FAITES TOURNER TOUS LES REGARDS LORS DE VOTRE PROCHAINE CÉRÉMONIE ! 👑\n\nVous cherchez un tissu d'une brillance et d'une tenue irréprochable qui sublimera votre modèle de couture ? ✨\n\nDécouvrez notre collection exclusive : "${prodName}" (${category}) chez Aminata Store !\n\n💎 100% Qualité Supérieure — Couleurs vibrantes & tenue garantie\n🎨 Motifs raffinés & finitions haut de gamme\n📏 Vendu au yard (${prodPrice}) ou en coupons complets\n\n🚚 Livraison rapide et expédition disponible partout !\n\n👇 Cliquez sur le lien pour commander directement sur WhatsApp :\n👉 ${waLink}`;

  const text2 = `⚠️ ALERTE NOUVEL ARRIVAGE & STOCK TRÈS LIMITÉ ! ⚠️\n\nLes passionnées de véritable élégance africaine vont tomber sous le charme ! 😍\nNotre tissu star "${prodName}" vient tout juste d'arriver en boutique.\n\nPourquoi nos clientes en raffolent ?\n✅ Douceur et confort incomparable sur la peau\n✅ Idéal pour mariages, baptêmes, dot, cérémonies et tenues de fête\n✅ Tarif exceptionnel : seulement ${prodPrice} !\n\n🎁 Offre spéciale : Profitez d'un avantage exclusif pour toute commande passée aujourd'hui sur notre boutique Aminata Store !\n\n📲 Réservez votre coupon immédiatement sur WhatsApp :\n👉 ${waLink}`;

  const text3 = `✨ "Ce n'est pas juste un tissu... C'est une affirmation de votre élégance." ✨\n\nPour vos grands événements, faites le choix de l'excellence avec notre "${prodName}".\n\n🧵 Catégorie : ${category} Prestige\n💰 Prix : ${prodPrice}\n📦 Commande simplifiée en 1 clic sur WhatsApp !\n\n💬 Écrivez à Aminata dès maintenant pour voir les détails et vidéo du tissu :\n👉 ${waLink}`;

  return `
    <p>Bonjour Aminata ! Voici <strong>3 textes publicitaires à haute conversion</strong> spécialement calibrés pour <strong>${prodName}</strong> :</p>
    
    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>Option 1 : Angle Célébration & Prestige (Méthode AIDA)</span>
        <button type="button" class="btn-copy-ad" onclick="copyAdText(this, \`${text1.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">📋 Copier</button>
      </div>
      <div class="ai-copy-text">${text1}</div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>Option 2 : Angle Nouveauté & Urgence (Méthode PAS)</span>
        <button type="button" class="btn-copy-ad" onclick="copyAdText(this, \`${text2.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">📋 Copier</button>
      </div>
      <div class="ai-copy-text">${text2}</div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>Option 3 : Angle Storytelling & Image de Marque</span>
        <button type="button" class="btn-copy-ad" onclick="copyAdText(this, \`${text3.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">📋 Copier</button>
      </div>
      <div class="ai-copy-text">${text3}</div>
    </div>

    <p>💡 <strong>Mon conseil d'expert :</strong> Associez l'Option 1 à une vidéo courte (Reels) montrant le drapé du tissu sous une bonne lumière du jour pour maximiser vos messages WhatsApp entrants !</p>
  `;
}

function generateAudienceResponse(product, goal) {
  const prodName = product ? product.name : 'votre boutique Aminata Store';

  return `
    <p>Bonjour Aminata ! Voici la <strong>stratégie de ciblage Facebook & Instagram Ads optimale</strong> pour <strong>${prodName}</strong> :</p>
    
    <div style="background:#fff;border:1px solid var(--color-border);padding:18px;border-radius:12px;margin:12px 0;">
      <h4 style="margin:0 0 10px;color:var(--color-primary-dark);font-family:var(--font-display);">📍 1. Localisation Géographique Cible</h4>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.5;">
        <li><strong>Zone 1 (Vente directe rapide) :</strong> Sénégal (Dakar, Thiès, Saint-Louis, Touba), Togo (Lomé), Côte d'Ivoire (Abidjan), Bénin (Cotonou).</li>
        <li><strong>Zone 2 (Diaspora à fort pouvoir d'achat) :</strong> France (Paris, Île-de-France, Lyon, Marseille), Belgique (Bruxelles), Canada (Montréal), USA.</li>
      </ul>

      <h4 style="margin:0 0 10px;color:var(--color-primary-dark);font-family:var(--font-display);">👥 2. Données Démographiques</h4>
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.5;">
        <li><strong>Genre :</strong> Femmes (85%) et Hommes (15% pour cadeaux, cérémonies & fêtes de famille).</li>
        <li><strong>Âge cible :</strong> 25 à 55 ans (Coeur de cible acheteuse : 28 - 48 ans).</li>
      </ul>

      <h4 style="margin:0 0 10px;color:var(--color-primary-dark);font-family:var(--font-display);">❤️ 3. Centres d'Intérêts Facebook Ads</h4>
      <p style="margin:0 0 8px;font-size:0.9rem;">Sélectionnez ces intérêts dans votre gestionnaire de publicités :</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Mode africaine</span>
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Wax (textile)</span>
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Boubou & Pagne</span>
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Mariage & Cérémonies</span>
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Couture & Stylisme</span>
        <span style="background:#f4efe9;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;">Vlisco / Haute Couture</span>
      </div>

      <h4 style="margin:0 0 10px;color:var(--color-primary-dark);font-family:var(--font-display);">📱 4. Objectif & Format de Campagne</h4>
      <p style="margin:0;line-height:1.5;">Utilisez l'objectif <strong>Messages (WhatsApp)</strong> avec des formats <strong>Reels & Stories Instagram/Facebook</strong>. C'est le tunnel le plus rapide pour convertir des acheteuses de tissus en Afrique et dans la diaspora.</p>
    </div>
  `;
}

function generateVideoIdeasResponse(product, goal) {
  const prodName = product ? product.name : 'vos tissus';
  return `
    <p>Bonjour Aminata ! Voici <strong>3 concepts de vidéos courtes (Reels / TikTok / Statuts)</strong> à filmer avec votre téléphone pour <strong>${prodName}</strong> :</p>
    
    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>🎬 Concept 1 : Le Test de Texture & Drapé en Mouvement (15s)</span>
      </div>
      <div class="ai-copy-text">
🎥 <strong>Plan 1 (0-3s) :</strong> Tenez le tissu à deux mains près d'une fenêtre et dépliez-le d'un geste élégant vers l'objectif.<br>
🎙️ <strong>Texte / Voix-off :</strong> « Ne choisissez pas votre pagne de fête sans avoir touché cette qualité... 😍✨ »<br>
🔍 <strong>Plan 2 (4-10s) :</strong> Gros plan sur le tissage, la brillance et les détails des motifs.<br>
👉 <strong>Call to Action (11-15s) :</strong> « Pièce unique chez Aminata Store. Cliquez sur le lien pour commander votre coupon sur WhatsApp ! »
      </div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>🎬 Concept 2 : "Inspiration Modèle de Couture" (15s)</span>
      </div>
      <div class="ai-copy-text">
👗 <strong>Plan 1 (0-5s) :</strong> Montrez le coupon brut avec une jolie musique tendance en fond sonore.<br>
✨ <strong>Plan 2 (5-12s) :</strong> Enroulez le tissu autour du buste d'un mannequin ou sur vos épaules pour montrer le tombé en robe/boubou.<br>
👉 <strong>Call to Action (12-15s) :</strong> « Vous aimez ce motif ? Envoyez-nous un message WhatsApp pour recevoir tous les coloris disponibles ! »
      </div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>🎬 Concept 3 : Préparation & Expédition d'une Commande (15s)</span>
      </div>
      <div class="ai-copy-text">
📦 <strong>Plan 1 :</strong> Pliage méticuleux du tissu avec étiquette soignée.<br>
🎁 <strong>Plan 2 :</strong> Mise dans le sachet boutique avec ruban.<br>
🛵 <strong>Plan 3 :</strong> Remise au coursier pour la livraison du jour.<br>
🎙️ <strong>Message :</strong> « Une nouvelle commande qui part pour une cliente VIP ! Qui sera la prochaine ? Contactez Aminata Store sur WhatsApp ! »
      </div>
    </div>
  `;
}

function generateOfferStrategyResponse(product, goal) {
  return `
    <p>Bonjour Aminata ! Voici <strong>3 stratégies d'offres commerciales percutantes</strong> pour déclencher des achats immédiats sur votre boutique :</p>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>🎁 Offre 1 : Le Pack "Duo Élégance" (Augmente le panier moyen)</span>
      </div>
      <div class="ai-copy-text">
✨ <strong>L'Offre :</strong> « Pour 2 coupons de tissus achetés, la <strong>LIVRAISON EST 100% OFFERTE</strong> + 1 accessoire ou foulard assorti en cadeau ! »<br>
🎯 <strong>Pourquoi ça cartonne :</strong> Les clientes préfèrent s'offrir un pagne supplémentaire plutôt que de dépenser dans les frais de livraison.
      </div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>👑 Offre 2 : L'Offre "Aso Ebi & Cérémonies de Famille" (Vente en volume)</span>
      </div>
      <div class="ai-copy-text">
✨ <strong>L'Offre :</strong> « Mariage, baptême ou fête familiale ? Bénéficiez de <strong>-10% dès 3 pièces</strong> et <strong>-15% dès 6 pièces</strong> pour habiller tout votre cortège avec le même tissu d'honneur ! »<br>
🎯 <strong>Pourquoi ça cartonne :</strong> Cela vous permet d'écouler des rouleaux complets en une seule commande.
      </div>
    </div>

    <div class="ai-copy-box">
      <div class="ai-copy-title">
        <span>⚡ Offre 3 : L'Offre Flash 48H "Stock Privilège" (Urgence)</span>
      </div>
      <div class="ai-copy-text">
✨ <strong>L'Offre :</strong> « Seulement 5 coupons disponibles dans ce motif exclusif. Les 3 premières commandes reçoivent un bon de réduction de 2 000 FCFA sur leur prochain achat ! »<br>
🎯 <strong>Pourquoi ça cartonne :</strong> Crée une urgence immédiate (peur de rater le modèle) qui accélère le passage à l'action.
      </div>
    </div>
  `;
}

function handleAiFreeformQuestion(question) {
  const q = question.toLowerCase();
  let answer = '';

  if (q.includes('budget') || q.includes('combien') || q.includes('prix') || q.includes('argent') || q.includes('coût')) {
    answer = `
      <p>💡 <strong>Recommandation de Budget pour vos Publicités Facebook :</strong></p>
      <p>Pour débuter efficacement avec <strong>Aminata Store</strong> :</p>
      <ul>
        <li><strong>Budget de Test (Jour 1 à 3) :</strong> 3 000 à 5 000 FCFA / jour (environ 5$ à 8$).</li>
        <li><strong>Objectif :</strong> Campagne de Messages WhatsApp (ou Trafic vers le site).</li>
        <li><strong>Règle d'or :</strong> Dès qu'une publicité vous génère 3 à 5 conversations WhatsApp rentables, augmentez son budget de 20% par jour pour maximiser vos ventes sans perturber l'algorithme !</li>
      </ul>
    `;
  } else if (q.includes('relancer') || q.includes('whatsapp') || q.includes('message') || q.includes('client')) {
    answer = `
      <p>💬 <strong>Script de Relance WhatsApp Imparable pour valider une vente :</strong></p>
      <div class="ai-copy-box">
        <div class="ai-copy-title">
          <span>Message de relance bienveillante (à envoyer 3h après) :</span>
        </div>
        <div class="ai-copy-text">
« Bonjour Chère Cliente ! ✨ Nous préparons actuellement les expéditions de la journée. Souhaitez-vous que nous vous réservions votre coupon de tissu avant la rupture de stock pour qu'il parte avec la livraison d'aujourd'hui ? 📦😊 »
        </div>
      </div>
    `;
  } else if (q.includes('photo') || q.includes('video') || q.includes('smartphone') || q.includes('camera')) {
    answer = `
      <p>📸 <strong>Conseils Pro pour photographier vos tissus au smartphone :</strong></p>
      <ol>
        <li><strong>Lumière naturelle :</strong> Photographiez toujours près d'une fenêtre le matin ou en fin d'après-midi (évitez le flash qui dénature les couleurs du Wax et du Basin).</li>
        <li><strong>Drapé vivant :</strong> Ne laissez pas le tissu toujours à plat. Suspendez-le ou posez-le sur un mannequin pour faire ressortir la souplesse et la brillance de la matière.</li>
        <li><strong>Vidéo en mouvement :</strong> Faites une vidéo de 5 secondes où vous passez votre main sur le tissu ; cela prouve l'authenticité et donne confiance aux acheteurs en ligne !</li>
      </ol>
    `;
  } else {
    answer = `
      <p>✨ <strong>Conseil Stratégique Aminata Store :</strong></p>
      <p>Pour développer vos ventes de tissus :</p>
      <ul>
        <li>Assurez-vous de poster au moins <strong>2 à 3 stories par jour</strong> montrant les arrivages et les avis de clients satisfaits.</li>
        <li>Créez un catalogue WhatsApp Business connecté avec les photos HD de votre boutique.</li>
        <li>Lancez régulièrement des offres de week-end pour déclencher des achats coup de coeur !</li>
      </ul>
      <p>N'hésitez pas à sélectionner un produit dans la liste ci-dessus et cliquer sur <strong>✍️ 3 Textes Publicitaires Facebook</strong> pour obtenir des accroches prêtes à l'emploi ! 🚀</p>
    `;
  }

  appendAiBotMessage(answer);
}
window.handleAiFreeformQuestion = handleAiFreeformQuestion;

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
    if (tab.dataset.adminTab === 'marketing') renderMarketingTab();
  }));

  // Marketing & Meta Pixel Code
  $('#btnTogglePixelEditor')?.addEventListener('click', () => togglePixelEditor());
  $('#btnCancelPixel')?.addEventListener('click', () => togglePixelEditor(false));
  $('#pixelConfigForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('#metaPixelCodeInput')?.value || '';
    saveMetaPixelCode(val);
  });
  $('#btnResetPixel')?.addEventListener('click', resetMetaPixelCode);
  $('#btnClearAiHistory')?.addEventListener('click', clearAiChatHistory);

  // AI Marketing Action Buttons
  $$('.btn-ai-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const action = pill.dataset.aiAction;
      if (action) runAiMarketingAction(action);
    });
  });

  // AI Marketing Chat
  $('#btnSendAiMarketing')?.addEventListener('click', () => {
    const input = $('#aiMarketingInput');
    const q = input?.value.trim();
    if (!q) return;
    appendAiUserMessage(q);
    input.value = '';
    handleAiFreeformQuestion(q);
  });

  $('#aiMarketingInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (!q) return;
      appendAiUserMessage(q);
      e.target.value = '';
      handleAiFreeformQuestion(q);
    }
  });

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
    try {
      const b64 = await processImageFile(file);
      if (b64) {
        preview.src = b64;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        showToast('Photo principale prête !', 'success');
      }
    } catch(err) {
      console.error(err);
      showToast('Erreur lors du traitement de l\'image', 'error');
    }
  });

  // Extra Media & Color Variant Upload Listeners
  $('#btnAddExtraMedia')?.addEventListener('click', () => $('#prodExtraMedia')?.click());
  $('#prodExtraMedia')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      if (editingExtraMedia.length >= 20) {
        showToast('Limite de 20 médias atteinte', 'warning');
        break;
      }
      const isVideo = file.type.startsWith('video/');
      try {
        const b64 = await processImageFile(file);
        if (b64) {
          editingExtraMedia.push({ type: isVideo ? 'video' : 'image', url: b64 });
        }
      } catch(err) {
        console.error(err);
      }
    }
    renderExtraMediaGrid();
    showToast(`${editingExtraMedia.length}/20 médias chargés`, 'info');
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
  $('#changePasswordForm')?.addEventListener('submit', changeClientPassword);

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

