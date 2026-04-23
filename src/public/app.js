// ============================================================
//  Digital Agency Suite — Marketing Agency ERP
//  app.js  |  Firebase Logic & State Management
// ============================================================

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G-XXXXXXXXXX"
};
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db        = firebase.firestore();
const auth      = firebase.auth();
const storage   = firebase.storage();

// ==========================================
// APP STATE & CONSTANTS
// ==========================================
const APP_VERSION   = '1.0.0';
const APP_NAME      = 'Digital Agency Suite';
const APP_DEVELOPER = 'Digital Agency Solutions';

let currentUser         = null;
let companyData         = null;
let logoUrl             = null;
let unsubscribeListeners = [];
let activeReportType    = 'finance';
let reportDateFrom      = '';
let reportDateTo        = '';
let activeCharts        = {};

// Configurable Tax definitions (default rates - can be changed in Settings)
const DEFAULT_TAXES = {
  vat:     { key: 'vat',     label: 'VAT',                      rate: 15.0, desc: 'Value Added Tax' },
  gst:     { key: 'gst',     label: 'GST',                      rate: 10.0, desc: 'Goods & Services Tax' },
  sales:   { key: 'sales',   label: 'Sales Tax',                 rate: 5.0,  desc: 'Sales Tax' },
  withholding: { key: 'withholding', label: 'Withholding Tax',    rate: 10.0, desc: 'Withholding Tax on Payments' },
};

const CLIENT_TYPES = [
  'Brand / Corporate', 'Startup', 'E-commerce Business', 'NGO / Non-Profit', 
  'Government', 'Media House', 'Influencer', 'Content Creator', 'Real Estate', 
  'Healthcare', 'Education', 'Retail', 'Restaurant / Hospitality', 
  'Finance / Fintech', 'Tech Company', 'Referral', 'Walk-In'
];

const MARKETING_SERVICES = [
  'Social Media Management', 'Content Marketing', 'SEO Services', 'PPC / Google Ads',
  'Facebook/Instagram Ads', 'LinkedIn Marketing', 'Email Marketing', 'WhatsApp Business',
  'Website Development', 'Graphic Design', 'Video Production', 'Brand Strategy',
  'Analytics & Reporting', 'Influencer Marketing', 'Community Management', 'PR / Media Relations'
];

const SOCIAL_PLATFORMS = [
  'Instagram','TikTok','Facebook','Twitter / X','YouTube','LinkedIn',
  'WhatsApp','Snapchat','Pinterest','Threads','Telegram','BeReal','Other'
];

const CAMPAIGN_CHANNELS = [
  'Google Ads', 'Facebook/Instagram', 'LinkedIn', 'Twitter', 'TikTok', 
  'YouTube', 'Email', 'SMS', 'WhatsApp', 'Influencer', 'SEO', 'Content'
];

const defaultCompany = {
  name: '', phone: '', location: '', digitalAddress: '',
  socialMedia: [],
  momoNumber: '', momoName: '',
  bankName: '', branch: '', accountName: '', accountNumber: '',
  logoUrl: '', currency: 'USD', currencySymbol: '$',
  taxVatEnabled: false, taxGstEnabled: false, taxSalesEnabled: false, taxWithholdingEnabled: false,
  taxVatRate: 15.0, taxGstRate: 10.0, taxSalesRate: 5.0, taxWithholdingRate: 10.0,
  agencyName: '', agencyTagline: '', agencyWebsite: ''
};

const roles = {
  SuperAdmin:    ['all'],
  Admin:         ['dashboard','financeTracker','campaigns','clients','services','projects','tasks','archives','reviewDesk','invoices','payments','receipts','expenses','reports','kanban'],
  Finance:       ['dashboard','financeTracker','clients','invoices','payments','receipts','expenses','reports','kanban'],
  AccountManager: ['dashboard','financeTracker','campaigns','clients','services','projects','tasks','reviewDesk','invoices','payments','receipts','reports','kanban'],
  CampaignManager: ['dashboard','campaigns','clients','services','projects','tasks','reviewDesk','archives','reports','kanban'],
  SocialMediaManager: ['dashboard','campaigns','tasks','archives','kanban'],
  ContentCreator: ['dashboard','tasks','archives','kanban'],
  Designer:      ['dashboard','tasks','archives','kanban'],
  SEOspecialist: ['dashboard','campaigns','tasks','archives','kanban'],
  FrontDesk:     ['dashboard','campaigns','clients','services','kanban'],
};

const ALL_MODULES = ['dashboard','financeTracker','campaigns','clients','services','projects','tasks','archives','reviewDesk','invoices','payments','receipts','expenses','reports','kanban'];
const financialRoles = ['SuperAdmin','Admin','Finance','AccountManager','CampaignManager'];

let currentData = {
  clients: [], services: [], campaigns: [], projects: [],
  tasks: [], uploads: [], invoices: [], payments: [],
  receipts: [], expenses: [], activities: [], users: [],
  budgets: [], goals: []
};

// ==========================================
// UTILITIES
// ==========================================
function uid(p='id') { return p + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
function getCurrency() { return companyData?.currencySymbol || '$ '; }
function money(v) { return getCurrency() + Number(v || 0).toFixed(2); }
function today() { return new Date().toISOString().slice(0, 10); }
function now() { return new Date().toLocaleString(); }
function formatDate(date) {
  if (!date) return '-';
  if (typeof date === 'object' && date.toDate) return date.toDate().toLocaleDateString('en-US');
  return new Date(date).toLocaleDateString('en-US');
}
function has(module) {
  if (!currentUser) return false;
  if (currentUser.customModules && Array.isArray(currentUser.customModules)) {
    return currentUser.customModules.includes(module);
  }
  const perms = roles[currentUser.role] || [];
  return perms.includes('all') || perms.includes(module);
}
function isSuperAdmin()        { return currentUser?.role === 'SuperAdmin'; }
function canDelete()           { return currentUser?.role === 'Admin' || isSuperAdmin(); }
function isAdmin()             { return currentUser?.role === 'Admin' || isSuperAdmin(); }
function canEditTransaction()  { return ['SuperAdmin','Admin','Finance','AccountManager'].includes(currentUser?.role); }
function canViewFinancial()    { return financialRoles.includes(currentUser?.role); }
function normalizePhone(p) {
  const n = (p || '').replace(/\D/g, '');
  if (n.startsWith('233')) return n;
  if (n.startsWith('0')) return '233' + n.slice(1);
  return n;
}

// ==========================================
// TAX CALCULATION ENGINE
// ==========================================
function calcTax(subtotal, inclusive = false) {
  const cd = companyData || defaultCompany;
  const vatRate        = cd.taxVatEnabled        ? Number(cd.taxVatRate        || 15.0) / 100 : 0;
  const gstRate        = cd.taxGstEnabled        ? Number(cd.taxGstRate        || 10.0) / 100 : 0;
  const salesRate      = cd.taxSalesEnabled      ? Number(cd.taxSalesRate      || 5.0)  / 100 : 0;
  const withholdingRate = cd.taxWithholdingEnabled ? Number(cd.taxWithholdingRate || 10.0) / 100 : 0;

  const anyTaxOn = vatRate + gstRate + salesRate + withholdingRate > 0;
  if (!anyTaxOn) return { vat: 0, gst: 0, sales: 0, withholding: 0, totalTax: 0, netSubtotal: subtotal, gross: subtotal, taxedBase: subtotal };

  let net = Number(subtotal);
  if (inclusive) {
    const taxRateSum = vatRate + gstRate + salesRate;
    const grossFactor = 1 + taxRateSum;
    net = Number(subtotal) / grossFactor;
  }

  const vatAmt       = net * vatRate;
  const gstAmt       = net * gstRate;
  const salesAmt    = net * salesRate;
  const taxedBase  = net + vatAmt + gstAmt + salesAmt;
  const withholdingAmt = taxedBase * withholdingRate;
  const totalTax    = vatAmt + gstAmt + salesAmt + withholdingAmt;
  const gross     = net + totalTax;

  return { vat: vatAmt, gst: gstAmt, sales: salesAmt, withholding: withholdingAmt, totalTax, netSubtotal: net, gross, taxedBase };
}

function applyTax(amount) { return calcTax(amount).totalTax; }

function anyTaxEnabled() {
  const cd = companyData || defaultCompany;
  return cd.taxVatEnabled || cd.taxGstEnabled || cd.taxSalesEnabled || cd.taxWithholdingEnabled;
}

function taxSummaryLine() {
  const cd = companyData || defaultCompany;
  const parts = [];
  if (cd.taxVatEnabled)        parts.push(`VAT ${cd.taxVatRate}%`);
  if (cd.taxGstEnabled)        parts.push(`GST ${cd.taxGstRate}%`);
  if (cd.taxSalesEnabled)     parts.push(`Sales ${cd.taxSalesRate}%`);
  if (cd.taxWithholdingEnabled) parts.push(`Withholding ${cd.taxWithholdingRate}%`);
  return parts.length ? parts.join(' + ') : 'None enabled';
}

function filterByDateRange(arr, field) {
  if (!reportDateFrom && !reportDateTo) return arr;
  return arr.filter(item => {
    const d = item[field];
    if (!d) return true;
    const dt = (typeof d === 'object' && d.toDate) ? d.toDate() : new Date(d);
    if (reportDateFrom && dt < new Date(reportDateFrom)) return false;
    if (reportDateTo && dt > new Date(reportDateTo + 'T23:59:59')) return false;
    return true;
  });
}

function destroyCharts() {
  Object.values(activeCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  activeCharts = {};
}

// ==========================================
// AUTH & INIT
// ==========================================
async function loadCompanyDataPublic() {
  try {
    const doc = await db.collection('settings').doc('company').get();
    if (doc.exists) {
      companyData = { ...defaultCompany, ...doc.data() };
      logoUrl = companyData.logoUrl || null;
    } else {
      companyData = defaultCompany;
    }
  } catch(e) {
    companyData = defaultCompany;
  }
}

async function loadCompanyData() {
  const doc = await db.collection('settings').doc('company').get();
  if (doc.exists) {
    companyData = { ...defaultCompany, ...doc.data() };
    logoUrl = companyData.logoUrl || null;
  } else {
    companyData = defaultCompany;
    await db.collection('settings').doc('company').set(defaultCompany);
  }
}

function subscribeToCollection(collection, callback) {
  const unsub = db.collection(collection)
    .onSnapshot(snapshot => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const ta = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const tb = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return tb - ta;
      });
      currentData[collection] = data;
      callback(data);
    }, err => {
      if (!err.message?.includes('index')) console.error('Firestore:', collection, err.message);
    });
  unsubscribeListeners.push(unsub);
  return unsub;
}

function cleanupListeners() {
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];
}

// ==========================================
// DATA HANDLERS — AUTH
// ==========================================
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
}

function showSignup() {
  const email    = prompt('Email:');
  const password = prompt('Password (6+ chars):');
  const name     = prompt('Full Name:');
  if (email && password && name) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => db.collection('users').doc(cred.user.uid).set({
        email, name, role: 'ContentCreator', active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }))
      .catch(err => alert('Error: ' + err.message));
  }
}

async function handleLogout() {
  destroyCharts();
  cleanupListeners();
  await auth.signOut();
}

// ==========================================
// DATA HANDLERS — CRUD
// ==========================================
async function handleAddClient(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('clients').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Client added: ' + data.name);
  e.target.reset();
}

async function handleAddService(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.price = Number(data.price);
  await db.collection('services').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  addActivity('Service added: ' + data.name);
  e.target.reset();
}

async function handleAddCampaign(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.budget = Number(data.budget || 0);
  data.status = 'draft';
  await db.collection('campaigns').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Campaign created: ' + data.name);
  e.target.reset();
}

async function handleAddProject(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.progress = 0;
  await db.collection('projects').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Project created: ' + data.title);
  e.target.reset();
}

async function handleAddTask(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('tasks').add({ ...data, updates: [], createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Task assigned: ' + data.taskTitle);
  e.target.reset();
}

async function handleAddInvoice(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount  = Number(data.amount);
  data.deposit = Number(data.deposit || 0);
  const cd = companyData || defaultCompany;
  data.taxSnapshot = {
    vatEnabled: cd.taxVatEnabled || false,       vatRate: cd.taxVatRate || 15.0,
    gstEnabled: cd.taxGstEnabled || false,       gstRate: cd.taxGstRate || 10.0,
    salesEnabled: cd.taxSalesEnabled || false,    salesRate: cd.taxSalesRate || 5.0,
    withholdingEnabled: cd.taxWithholdingEnabled || false, withholdingRate: cd.taxWithholdingRate || 10.0,
  };
  const invoiceNo = 'INV-' + Date.now().toString().slice(-6);
  await db.collection('invoices').add({ ...data, invoiceNo, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Invoice generated: ' + invoiceNo);
  e.target.reset();
}

async function handleAddPayment(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  const receiptNo = 'RCP-' + Date.now().toString().slice(-6);
  const batch = db.batch();
  const paymentRef = db.collection('payments').doc();
  batch.set(paymentRef, { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  const receiptRef = db.collection('receipts').doc();
  batch.set(receiptRef, { receiptNo, clientId: data.clientId, invoiceId: data.invoiceId || null, amount: data.amount, date: data.date, method: data.method, reference: data.reference || '', createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  await batch.commit();
  addActivity('Payment recorded: ' + money(data.amount));
  e.target.reset();
}

async function handleAddExpense(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  await db.collection('expenses').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('Expense: ' + data.category);
  e.target.reset();
}

async function handleAddUser(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const adminEmail  = auth.currentUser.email;
  const adminPassword = prompt('Enter YOUR admin password to create user:');
  if (!adminPassword) { alert('Password required'); return; }
  try {
    const userCred  = await auth.createUserWithEmailAndPassword(data.email, data.password);
    const newUserId = userCred.user.uid;
    await auth.signOut();
    await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
    await new Promise(r => setTimeout(r, 500));
    await db.collection('users').doc(newUserId).set({
      email: data.email, name: data.name, role: data.role, phone: data.phone || '',
      active: true, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: auth.currentUser.uid
    });
    addActivity('User added: ' + data.name);
    e.target.reset();
    alert('User created: ' + data.email);
    renderSection('settings');
  } catch (err) {
    try { await auth.signInWithEmailAndPassword(adminEmail, adminPassword); } catch(e2) { location.reload(); }
    alert('Error: ' + err.message);
  }
}

// ==========================================
// DATA HANDLERS — SETTINGS
// ==========================================
async function handleUpdateCompany(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const smRows = document.querySelectorAll('.social-media-row');
  const socialMedia = [];
  smRows.forEach(row => {
    const platform = row.querySelector('.sm-platform')?.value?.trim();
    const handle   = row.querySelector('.sm-handle')?.value?.trim();
    if (platform && handle) socialMedia.push({ platform, handle });
  });
  data.socialMedia = socialMedia;
  await db.collection('settings').doc('company').update(data);
  companyData = { ...companyData, ...data };
  addActivity('Company info updated');
  alert('Business info saved!');
}

async function handleUpdatePaymentDetails(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('settings').doc('company').update(data);
  companyData = { ...companyData, ...data };
  alert('Payment details saved!');
}

function renderSocialMediaRows(list) {
  if (!list || list.length === 0) return '<div id="sm_empty" style="font-size:13px;color:var(--text-light);padding:8px 0;">No social media added yet.</div>';
  return list.map((item, i) => buildSocialRow(item.platform, item.handle, i)).join('');
}

function buildSocialRow(platform, handle, idx) {
  const opts = SOCIAL_PLATFORMS.map(p => `<option value="${p}" ${platform===p?'selected':''}>${p}</option>`).join('');
  return `
  <div class="social-media-row" style="display:flex;align-items:center;gap:8px;">
    <select class="sm-platform" style="width:160px;font-size:13px;flex-shrink:0;">${opts}</select>
    <input class="sm-handle" value="${handle||''}" placeholder="@handle or URL" style="flex:1;font-size:13px;">
    <button type="button" onclick="this.closest('.social-media-row').remove();updateSocialEmptyState();" class="btn btn-danger btn-sm" style="flex-shrink:0;padding:7px 10px;">✕</button>
  </div>`;
}

function addSocialMediaRow() {
  const list = document.getElementById('socialMediaList');
  if (!list) return;
  const empty = document.getElementById('sm_empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.innerHTML = buildSocialRow('Instagram', '', Date.now());
  list.appendChild(div.firstElementChild);
}

function updateSocialEmptyState() {
  const list = document.getElementById('socialMediaList');
  if (!list) return;
  if (list.querySelectorAll('.social-media-row').length === 0) {
    list.innerHTML = '<div id="sm_empty" style="font-size:13px;color:var(--text-light);padding:8px 0;">No social media added yet.</div>';
  }
}

async function handleUpdateCurrency(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('settings').doc('company').update(data);
  companyData = { ...companyData, ...data };
  addActivity('Currency updated: ' + data.currency);
  alert('Currency saved!');
}

async function handleUpdateTax(e) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  Object.values(DEFAULT_TAXES).forEach(tax => {
    const enableKey = 'tax' + tax.key.charAt(0).toUpperCase() + tax.key.slice(1) + 'Enabled';
    const rateKey   = 'tax' + tax.key.charAt(0).toUpperCase() + tax.key.slice(1) + 'Rate';
    data[enableKey] = form.querySelector(`[name="${enableKey}"]`)?.checked || false;
    data[rateKey]   = Number(form.querySelector(`[name="${rateKey}"]`)?.value || tax.rate);
  });
  await db.collection('settings').doc('company').update(data);
  companyData = { ...companyData, ...data };
  addActivity('Tax settings updated');
  alert('Tax settings saved! Active: ' + taxSummaryLine());
  renderSection('settings');
}

function updateCurrencySymbol(code) {
  const currencies = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', KES: 'KSh ', ZAR: 'R', GHS: 'GHS ' };
  const sym = document.getElementById('currencySymbolInput');
  if (sym && currencies[code]) sym.value = currencies[code];
}

async function handleLogoUpload(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
  try {
    const storageRef = storage.ref('logos/company-logo-' + Date.now());
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();
    await db.collection('settings').doc('company').update({ logoUrl: url });
    logoUrl = url;
    addActivity('Logo updated');
    renderSection('settings');
  } catch (err) { alert('Upload failed: ' + err.message); }
}

async function removeLogo() {
  if (!confirm('Remove logo?')) return;
  await db.collection('settings').doc('company').update({ logoUrl: '' });
  logoUrl = null;
  renderSection('settings');
}

async function addActivity(action) {
  await db.collection('activities').add({
    action, userId: currentUser.id, userName: currentUser.name || currentUser.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ==========================================
// ACTION HANDLERS — CLIENTS
// ==========================================
function editClient(id) {
  const c = currentData.clients.find(x => x.id === id);
  if (!c) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Client</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditClient(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Company / Name *</label><input name="name" value="${c.name}" required></div>
      <div><label class="form-label">Contact Person</label><input name="contactPerson" value="${c.contactPerson||''}"></div>
      <div><label class="form-label">Phone *</label><input name="phone" value="${c.phone}" required></div>
      <div><label class="form-label">Email</label><input name="email" value="${c.email||''}" type="email"></div>
      <div><label class="form-label">Client Type</label><select name="type"><option value="">Select...</option>${CLIENT_TYPES.map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div><label class="form-label">Industry</label><input name="industry" value="${c.industry||''}"></div>
      <div><label class="form-label">Notes</label><textarea name="notes" rows="2">${c.notes||''}</textarea></div>
      <div style="display:flex;gap:10px;margin-top:4px;"><button type="submit" class="btn" style="flex:1;">Save Changes</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditClient(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('clients').doc(id).update(data);
  addActivity('Client updated: ' + data.name);
  closeModal();
}

async function deleteClient(id) {
  if (!canDelete()) return;
  if (!confirm('Delete this client? This cannot be undone.')) return;
  await db.collection('clients').doc(id).delete();
  addActivity('Client deleted');
}

function messageClient(id, phone) {
  const c = currentData.clients.find(x => x.id === id);
  if (!c) return;
  const text = prompt('Message:', `Hello ${c.name}, this is ${companyData?.name || APP_NAME}.`);
  if (!text) return;
  window.open(`https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// ACTION HANDLERS — SERVICES
// ==========================================
async function editService(id) {
  const s = currentData.services.find(x => x.id === id);
  if (!s) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Service</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditService(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Service Name</label><input name="name" value="${s.name}" required></div>
      <div><label class="form-label">Category</label><input name="category" value="${s.category}" required list="editCatList"><datalist id="editCatList">${MARKETING_SERVICES.map(c => `<option value="${c}">`).join('')}</datalist></div>
      <div><label class="form-label">Description</label><textarea name="description" rows="2">${s.description||''}</textarea></div>
      <div><label class="form-label">Price (${getCurrency().trim()})</label><input name="price" type="number" value="${s.price}" required min="0" step="0.01"></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditService(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.price = Number(data.price);
  await db.collection('services').doc(id).update(data);
  closeModal();
}

async function deleteService(id) {
  if (!canDelete() || !confirm('Delete service?')) return;
  await db.collection('services').doc(id).delete();
}

// ==========================================
// ACTION HANDLERS — CAMPAIGNS
// ==========================================
function editCampaign(id) {
  const c = currentData.campaigns.find(x => x.id === id);
  if (!c) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Campaign</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditCampaign(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Campaign Name</label><input name="name" value="${c.name}" required></div>
      <div><label class="form-label">Client</label><select name="clientId">${currentData.clients.map(cl => `<option value="${cl.id}" ${c.clientId===cl.id?'selected':''}>${cl.name}</option>`).join('')}</select></div>
      <div class="form-row cols-2"><div><label class="form-label">Start Date</label><input name="startDate" type="date" value="${c.startDate||''}"></div><div><label class="form-label">End Date</label><input name="endDate" type="date" value="${c.endDate||''}"></div></div>
      <div><label class="form-label">Channel</label><select name="channel">${CAMPAIGN_CHANNELS.map(ch => `<option value="${ch}" ${c.channel===ch?'selected':''}>${ch}</option>`).join('')}</select></div>
      <div><label class="form-label">Budget</label><input name="budget" type="number" value="${c.budget||0}" min="0" step="0.01"></div>
      <div><label class="form-label">Status</label><select name="status"><option value="draft" ${c.status==='draft'?'selected':''}>Draft</option><option value="active" ${c.status==='active'?'selected':''}>Active</option><option value="paused" ${c.status==='paused'?'selected':''}>Paused</option><option value="completed" ${c.status==='completed'?'selected':''}>Completed</option></select></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditCampaign(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.budget = Number(data.budget || 0);
  await db.collection('campaigns').doc(id).update(data);
  addActivity('Campaign updated: ' + data.name);
  closeModal();
}

async function deleteCampaign(id) {
  if (!canDelete() || !confirm('Delete campaign?')) return;
  await db.collection('campaigns').doc(id).delete();
}

// ==========================================
// ACTION HANDLERS — PROJECTS
// ==========================================
function editProject(id) {
  const p = currentData.projects.find(x => x.id === id);
  if (!p) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Project</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditProject(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Title</label><input name="title" value="${p.title}" required></div>
      <div><label class="form-label">Client</label><select name="clientId">${currentData.clients.map(c => `<option value="${c.id}" ${p.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
      <div><label class="form-label">Deliverables</label><input name="deliverables" value="${p.deliverables||''}"></div>
      <div class="form-row cols-2"><div><label class="form-label">Start Date</label><input name="startDate" type="date" value="${p.startDate||''}"></div><div><label class="form-label">Due Date</label><input name="deliveryDate" type="date" value="${p.deliveryDate||''}"></div></div>
      <div><label class="form-label">Completion Date</label><input name="completionDate" type="date" value="${p.completionDate||''}"></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditProject(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('projects').doc(id).update(data);
  addActivity('Project updated: ' + data.title);
  closeModal();
}

async function updateProjectProgress(id) {
  const p = currentData.projects.find(x => x.id === id);
  if (!p) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Update Progress: ${p.title}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div style="margin-bottom:16px;"><label class="form-label">Progress: <strong id="progVal">${p.progress || 0}%</strong></label><input type="range" id="progSlider" min="0" max="100" value="${p.progress || 0}" style="width:100%;height:6px;accent-color:var(--primary);" oninput="document.getElementById('progVal').textContent=this.value+'%'"></div>
    <div><label class="form-label">Progress Note (optional)</label><textarea id="progNote" rows="2" placeholder="What was accomplished?"></textarea></div>
    <div style="display:flex;gap:10px;margin-top:16px;"><button onclick="saveProjectProgress('${id}')" class="btn" style="flex:1;">Save Progress</button><button onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
  `);
}

async function saveProjectProgress(id) {
  const progress = Number(document.getElementById('progSlider').value);
  const note    = document.getElementById('progNote').value;
  const updates  = { progress };
  if (progress === 100) updates.completionDate = today();
  await db.collection('projects').doc(id).update(updates);
  if (note) addActivity(`Project progress: ${progress}% — ${note}`);
  closeModal();
}

async function deleteProject(id) {
  if (!canDelete() || !confirm('Delete project?')) return;
  await db.collection('projects').doc(id).delete();
}

function assignFromProject(projectId) {
  renderSection('tasks');
  setTimeout(() => {
    const select = document.querySelector('select[name="projectId"]');
    if (select) select.value = projectId;
  }, 200);
}

// ==========================================
// ACTION HANDLERS — TASKS
// ==========================================
async function editTask(id) {
  const t = currentData.tasks.find(x => x.id === id);
  if (!t) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Task</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditTask(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Task Title</label><input name="taskTitle" value="${t.taskTitle}" required></div>
      <div><label class="form-label">Project</label><select name="projectId">${currentData.projects.map(p => `<option value="${p.id}" ${t.projectId===p.id?'selected':''}>${p.title}</option>`).join('')}</select></div>
      <div><label class="form-label">Deadline</label><input name="deadline" type="date" value="${t.deadline||''}"></div>
      <div><label class="form-label">Status</label><select name="status">${['To Do','In Progress','Review','Completed'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div><label class="form-label">Assign To</label><select name="assignedTo">${currentData.users.filter(u => ['SocialMediaManager','ContentCreator','Designer','SEOspecialist','CampaignManager'].includes(u.role)).map(u => `<option value="${u.id}" ${t.assignedTo===u.id?'selected':''}>${u.name}</option>`).join('')}</select></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditTask(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('tasks').doc(id).update(data);
  addActivity('Task updated: ' + data.taskTitle);
  closeModal();
}

async function deleteTask(id) {
  if (!canDelete() || !confirm('Delete task?')) return;
  await db.collection('tasks').doc(id).delete();
}

async function updateTaskStatus(id) {
  const t = currentData.tasks.find(x => x.id === id);
  if (!t) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Update: ${t.taskTitle}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div style="margin-bottom:14px;"><label class="form-label">Status</label><select id="newStatus">${['To Do','In Progress','Review','Completed'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div><label class="form-label">Progress Note</label><textarea id="statusNote" rows="3" placeholder="Optional update note..."></textarea></div>
    <div style="display:flex;gap:10px;margin-top:16px;"><button onclick="saveTaskStatus('${id}')" class="btn" style="flex:1;">Update</button><button onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
  `);
}

async function saveTaskStatus(id) {
  const t         = currentData.tasks.find(x => x.id === id);
  const newStatus = document.getElementById('newStatus').value;
  const note      = document.getElementById('statusNote').value;
  const updates   = { status: newStatus };
  if (note) {
    const updatesList = t.updates || [];
    updatesList.push({ date: now(), note, user: currentUser.name || currentUser.email });
    updates.updates = updatesList;
  }
  await db.collection('tasks').doc(id).update(updates);
  addActivity('Task: ' + t.taskTitle + ' → ' + newStatus);
  closeModal();
}

// ==========================================
// ACTION HANDLERS — USERS
// ==========================================
async function editUserRole(id) {
  const u = currentData.users.find(x => x.id === id);
  if (!u) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Change Role: ${u.name}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div style="margin-bottom:14px;"><label class="form-label">New Role</label><select id="newRoleSelect">${Object.keys(roles).map(r => `<option value="${r}" ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></div>
    <div style="display:flex;gap:10px;"><button onclick="saveUserRole('${id}')" class="btn" style="flex:1;">Save Role</button><button onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
  `);
}

async function saveUserRole(id) {
  const newRole = document.getElementById('newRoleSelect').value;
  await db.collection('users').doc(id).update({ role: newRole });
  const u = currentData.users.find(x => x.id === id);
  addActivity('Role changed: ' + (u?.name || id) + ' → ' + newRole);
  closeModal();
}

function editTeamMember(id) {
  const u = currentData.users.find(x => x.id === id);
  if (!u) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Team Member</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditTeamMember(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Full Name</label><input name="name" value="${u.name||''}" required></div>
      <div><label class="form-label">Phone</label><input name="phone" value="${u.phone||''}"></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditTeamMember(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await db.collection('users').doc(id).update(data);
  addActivity('User profile updated: ' + data.name);
  closeModal();
}

async function toggleUserStatus(id) {
  const u = currentData.users.find(x => x.id === id);
  if (!u) return;
  const newActive = u.active === false ? true : false;
  await db.collection('users').doc(id).update({ active: newActive });
  addActivity('User ' + (newActive ? 'activated' : 'deactivated') + ': ' + u.name);
}

async function deleteUser(id) {
  if (!canDelete() || !confirm('Delete this user?')) return;
  await db.collection('users').doc(id).delete();
  addActivity('User deleted');
}

function adminResetPassword(id) {
  const u = currentData.users.find(x => x.id === id);
  if (!u) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Reset Password: ${u.name}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="alert alert-warning" style="margin-bottom:16px;">Resetting will send a password reset email to <strong>${u.email}</strong>.</div>
    <div style="display:flex;gap:10px;"><button onclick="sendPasswordReset('${u.email}')" class="btn" style="flex:1;">Send Reset Email</button><button onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
  `);
}

async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    alert('Password reset email sent to ' + email);
    closeModal();
  } catch (err) { alert('Error: ' + err.message); }
}

async function handleChangeMyPassword() {
  const newPw = prompt('Enter new password (6+ chars):');
  if (!newPw || newPw.length < 6) return;
  try {
    await auth.currentUser.updatePassword(newPw);
    alert('Password changed successfully!');
  } catch (err) { alert('Error: ' + err.message + '. You may need to re-login first.'); }
}

// ==========================================
// ACTION HANDLERS — INVOICES / PAYMENTS / EXPENSES
// ==========================================
function editInvoice(id) {
  const i = currentData.invoices.find(x => x.id === id);
  if (!i) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Invoice ${i.invoiceNo}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditInvoice(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Amount</label><input name="amount" type="number" value="${i.amount}" required min="0" step="0.01"></div>
      <div><label class="form-label">Deposit</label><input name="deposit" type="number" value="${i.deposit||0}" min="0" step="0.01"></div>
      <div><label class="form-label">Due Date</label><input name="dueDate" type="date" value="${i.dueDate||''}"></div>
      <div><label class="form-label">Notes</label><textarea name="notes" rows="2">${i.notes||''}</textarea></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditInvoice(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount  = Number(data.amount);
  data.deposit = Number(data.deposit || 0);
  await db.collection('invoices').doc(id).update(data);
  addActivity('Invoice updated: ' + id);
  closeModal();
}

async function deleteInvoice(id) {
  if (!canDelete() || !confirm('Delete invoice?')) return;
  await db.collection('invoices').doc(id).delete();
}

function editPayment(id) {
  const p = currentData.payments.find(x => x.id === id);
  if (!p) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Payment</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditPayment(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Amount</label><input name="amount" type="number" value="${p.amount}" required min="0" step="0.01"></div>
      <div><label class="form-label">Method</label><select name="method"><option value="MoMo" ${p.method==='MoMo'?'selected':''}>MoMo</option><option value="Bank Transfer" ${p.method==='Bank Transfer'?'selected':''}>Bank Transfer</option><option value="Cash" ${p.method==='Cash'?'selected':''}>Cash</option><option value="Card" ${p.method==='Card'?'selected':''}>Card</option></select></div>
      <div><label class="form-label">Date</label><input name="date" type="date" value="${p.date||''}"></div>
      <div><label class="form-label">Reference</label><input name="reference" value="${p.reference||''}"></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditPayment(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  await db.collection('payments').doc(id).update(data);
  addActivity('Payment updated');
  closeModal();
}

async function deletePayment(id) {
  if (!canDelete() || !confirm('Delete payment?')) return;
  await db.collection('payments').doc(id).delete();
}

function editExpense(id) {
  const e = currentData.expenses.find(x => x.id === id);
  if (!e) return;
  showModal(`
    <div class="modal-header"><div class="modal-title">Edit Expense</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <form onsubmit="saveEditExpense(event,'${id}')" style="display:flex;flex-direction:column;gap:12px;">
      <div><label class="form-label">Date</label><input name="date" type="date" value="${e.date||''}" required></div>
      <div><label class="form-label">Category</label><input name="category" value="${e.category}" required></div>
      <div><label class="form-label">Description</label><input name="description" value="${e.description}" required></div>
      <div><label class="form-label">Amount</label><input name="amount" type="number" value="${e.amount}" required min="0" step="0.01"></div>
      <div style="display:flex;gap:10px;"><button type="submit" class="btn" style="flex:1;">Save</button><button type="button" onclick="closeModal()" class="btn-secondary btn" style="flex:1;">Cancel</button></div>
    </form>
  `);
}

async function saveEditExpense(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  await db.collection('expenses').doc(id).update(data);
  closeModal();
}

async function deleteExpense(id) {
  if (!canDelete() || !confirm('Delete expense?')) return;
  await db.collection('expenses').doc(id).delete();
}

// ==========================================
// PRINT FUNCTIONS
// ==========================================
function getPrintStyles() {
  const c = companyData || defaultCompany;
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 40px; color: #0a0e1a; background: #fff; line-height: 1.6; }
      .header { text-align: center; margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #6366f1; }
      .logo { max-height: 80px; margin-bottom: 16px; object-fit: contain; }
      h1 { font-size: 28px; font-weight: 800; margin: 0 0 6px; color: #6366f1; }
      h2 { font-size: 20px; font-weight: 700; margin: 0 0 20px; color: #0a0e1a; }
      .subtitle { font-size: 13px; color: #64748b; margin: 0; }
      .company-info { font-size: 12px; color: #64748b; line-height: 1.8; margin-top: 12px; }
      .divider { height: 1px; background: #e5e7eb; margin: 28px 0; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 36px; }
      .info-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; margin: 0 0 6px; font-weight: 700; }
      .info-block p { font-size: 14px; margin: 0; font-weight: 600; }
      .info-block .small { font-size: 12px; color: #64748b; font-weight: 400; margin-top: 3px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #64748b; border-bottom: 2px solid #e5e7eb; }
      td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #3f4d5e; }
      .amount { text-align: right; font-weight: 700; font-family: 'DM Mono', monospace; }
      .total-section { margin-top: 36px; padding-top: 20px; border-top: 2px solid #e5e7eb; max-width: 360px; margin-left: auto; }
      .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #64748b; }
      .total-row.grand { font-size: 18px; font-weight: 800; color: #6366f1; padding-top: 14px; border-top: 2px solid #6366f1; margin-top: 14px; }
      .payment-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 36px; border: 1px solid #e5e7eb; }
      .payment-info h4 { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #6366f1; }
      .payment-info p { margin: 6px 0; font-size: 12px; color: #475569; }
      .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #d1fae5; color: #065f46; }
      .badge.pending { background: #fef3c7; color: #92400e; }
      @media print { body { padding: 20px; } .no-print { display: none !important; } }
    </style>
  `;
}

function printInvoice(id) {
  const invoice  = currentData.invoices.find(i => i.id === id);
  if (!invoice) return;
  const client  = currentData.clients.find(c => c.id === invoice.clientId);
  const service = currentData.services.find(s => s.id === invoice.serviceId);
  const c       = companyData || defaultCompany;
  const inclusive = invoice.taxInclusive === 'inclusive';
  const taxCalc  = calcTax(invoice.amount, inclusive);
  const hasTax   = taxCalc.totalTax > 0;
  const gross   = inclusive ? Number(invoice.amount) : taxCalc.gross;
  const balance = gross - Number(invoice.deposit || 0);
  const taxLabel = invoice.taxInclusive === 'inclusive' ? '(Tax Inclusive)' : '(Tax Exclusive)';
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoiceNo}</title>${getPrintStyles()}</head><body>
    <div class="header">
      ${c.logoUrl ? `<img src="${c.logoUrl}" class="logo" alt="${c.name}">` : `<h1>${c.name}</h1>`}
      <div class="company-info">${c.location ? c.location+'<br>' : ''}${c.phone ? 'Phone: '+c.phone : ''}${c.agencyWebsite ? ' | Web: '+c.agencyWebsite : ''}<br>${(c.socialMedia||[]).map(s=>s.platform+': '+s.handle).join(' | ')}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:36px;">
      <div><p class="subtitle">INVOICE</p><h2 style="margin:6px 0 0;">${invoice.invoiceNo}</h2>${hasTax ? `<p style="font-size:11px;color:#64748b;margin:4px 0 0;">${taxLabel}</p>` : ''}</div>
      <div style="text-align:right;"><p class="subtitle">DATE ISSUED</p><p style="font-size:14px;font-weight:600;margin:6px 0 0;">${formatDate(invoice.createdAt)}</p></div>
    </div>
    <div class="info-grid">
      <div class="info-block"><h4>Bill To</h4><p>${client?.name || 'N/A'}</p><p class="small">${client?.phone || ''}</p><p class="small">${client?.email || ''}</p></div>
      <div class="info-block"><h4>Service Details</h4><p>${service?.name || 'N/A'}</p><p class="small">Category: ${service?.category || '-'}</p><p class="small">Due: ${formatDate(invoice.dueDate)}</p></div>
    </div>
    <table><thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead><tbody><tr><td>${service?.name || 'Service'}</td><td class="amount">${money(inclusive ? taxCalc.netSubtotal : invoice.amount)}</td></tr></tbody></table>
    <div class="total-section">
      <div class="total-row"><span>Subtotal</span><span>${money(inclusive ? taxCalc.netSubtotal : invoice.amount)}</span></div>
      ${hasTax ? `
        ${taxCalc.vat > 0 ? `<div class="total-row"><span>VAT (${c.taxVatRate}%)</span><span>${money(taxCalc.vat)}</span></div>` : ''}
        ${taxCalc.gst > 0 ? `<div class="total-row"><span>GST (${c.taxGstRate}%)</span><span>${money(taxCalc.gst)}</span></div>` : ''}
        <div class="total-row" style="font-weight:600;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:4px;"><span>Total Tax</span><span>${money(taxCalc.totalTax)}</span></div>
      ` : ''}
      <div class="total-row" style="color:#16a34a;"><span>Deposit Paid</span><span>-${money(invoice.deposit || 0)}</span></div>
      <div class="total-row grand"><span>Balance Due</span><span>${money(balance)}</span></div>
    </div>
    <div class="payment-info"><h4>Payment Details</h4><p><strong>Mobile Money:</strong> ${c.momoNumber} (${c.momoName})</p><p><strong>Bank:</strong> ${c.bankName}, ${c.branch}</p><p><strong>Account:</strong> ${c.accountNumber} (${c.accountName})</p></div>
    <div class="footer"><p>Thank you for your business! — ${c.name} · ${c.phone}</p></div>
  </body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
  addActivity('Invoice printed: ' + invoice.invoiceNo);
}

function printReceipt(id) {
  const receipt  = currentData.receipts.find(r => r.id === id);
  if (!receipt) return;
  const client  = currentData.clients.find(c => c.id === receipt.clientId);
  const c       = companyData || defaultCompany;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt ${receipt.receiptNo}</title>${getPrintStyles()}</head><body>
    <div class="header">${c.logoUrl ? `<img src="${c.logoUrl}" class="logo" alt="${c.name}">` : `<h1>${c.name}</h1>`}<div class="company-info">${c.location}<br>Phone: ${c.phone}</div></div>
    <div style="text-align:center;margin-bottom:36px;"><p class="subtitle">OFFICIAL RECEIPT</p><h2 style="margin:6px 0 0;">${receipt.receiptNo}</h2></div>
    <div class="info-grid"><div class="info-block"><h4>Received From</h4><p>${client?.name || 'N/A'}</p><p class="small">${client?.phone || ''}</p></div><div class="info-block"><h4>Payment Details</h4><p>${formatDate(receipt.date)}</p><p class="small">Method: ${receipt.method}</p>${receipt.reference ? `<p class="small">Ref: ${receipt.reference}</p>` : ''}</div></div>
    <div style="background:#f0fdf4;padding:28px;border-radius:10px;text-align:center;margin:32px 0;border:1px solid #bbf7d0;"><p class="subtitle" style="margin-bottom:8px;">AMOUNT RECEIVED</p><p style="font-size:36px;font-weight:800;color:#16a34a;margin:0;">${money(receipt.amount)}</p></div>
    <div class="footer"><p>Thank you for your payment! This is an official receipt from ${c.name}.</p></div>
  </body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
  addActivity('Receipt printed: ' + receipt.receiptNo);
}

function sendInvoiceWhatsApp(id) {
  const invoice = currentData.invoices.find(i => i.id === id);
  if (!invoice) return;
  const client = currentData.clients.find(c => c.id === invoice.clientId);
  const c       = companyData || defaultCompany;
  const inclusive = invoice.taxInclusive === 'inclusive';
  const taxCalc  = calcTax(invoice.amount, inclusive);
  const gross    = inclusive ? Number(invoice.amount) : taxCalc.gross;
  const balance  = gross - Number(invoice.deposit || 0);
  const hasTax   = taxCalc.totalTax > 0;
  let taxLines = '';
  if (hasTax) {
    if (taxCalc.vat > 0)    taxLines += `\nVAT (${c.taxVatRate}%): ${money(taxCalc.vat)}`;
    if (taxCalc.gst > 0)    taxLines += `\nGST (${c.taxGstRate}%): ${money(taxCalc.gst)}`;
    taxLines += `\nTotal Tax: ${money(taxCalc.totalTax)}`;
  }
  const msg = `Hello ${client?.name || ''},\n\n*INVOICE ${invoice.invoiceNo}*\nFrom: ${c.name}\n\n*Subtotal:* ${money(invoice.amount)}${taxLines}\n*Total:* ${money(gross)}\n*Deposit Paid:* ${money(invoice.deposit || 0)}\n*Balance Due:* ${money(balance)}\n*Due Date:* ${formatDate(invoice.dueDate)}\n\n*Payment Details:*\nMoMo: ${c.momoNumber} (${c.momoName})\nBank: ${c.bankName} — ${c.accountNumber} (${c.accountName})\n\nThank you for your business!`;
  window.open(`https://wa.me/${normalizePhone(client?.phone || c.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
  addActivity('Invoice WA sent: ' + invoice.invoiceNo);
}

function sendReceiptWhatsApp(id) {
  const receipt = currentData.receipts.find(r => r.id === id);
  if (!receipt) return;
  const client = currentData.clients.find(c => c.id === receipt.clientId);
  const c       = companyData || defaultCompany;
  const msg = `Hello ${client?.name || ''},\n\n*RECEIPT ${receipt.receiptNo}*\nFrom: ${c.name}\n\n*Amount:* ${money(receipt.amount)}\n*Date:* ${formatDate(receipt.date)}\n*Method:* ${receipt.method}\n\nThank you for your payment!`;
  window.open(`https://wa.me/${normalizePhone(client?.phone || c.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
}

function printReportContent() {
  const content = document.getElementById('reportContent')?.innerHTML;
  if (!content) return;
  const c = companyData || defaultCompany;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Report</title>${getPrintStyles()}</head><body><div class="header">${c.logoUrl ? `<img src="${c.logoUrl}" class="logo">` : `<h1>${c.name}</h1>`}</div>${content}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

// ==========================================
// CHARTS
// ==========================================
function drawDashboardCharts() {
  if (!canViewFinancial()) {
    const ctx = document.getElementById('chartTasks');
    if (!ctx) return;
    const statuses = ['To Do','In Progress','Review','Completed'];
    const counts  = statuses.map(s => currentData.tasks.filter(t => t.status === s).length);
    activeCharts.tasks = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: statuses, datasets: [{ data: counts, backgroundColor: ['#f59e0b','#6366f1','#8b5cf6','#10b981'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11, family: 'DM Sans' }, padding: 12 } } }
    });
    return;
  }
  const stats    = calculateStats();
  const ctxMain = document.getElementById('chartMain');
  if (ctxMain && !activeCharts.main) {
    activeCharts.main = new Chart(ctxMain, {
      type: 'bar',
      data: { labels: ['Revenue', 'Expenses', 'Profit'], datasets: [{ data: [stats.revenue, stats.expenses, stats.profit], backgroundColor: ['#10b981', '#ef4444', stats.profit >= 0 ? '#6366f1' : '#ef4444'], borderRadius: 6, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => getCurrency() + v.toLocaleString(), font: { size: 10, family: 'DM Sans' } } }, x: { grid: { display: false }, ticks: { font: { size: 12, family: 'DM Sans', weight: '600' } } } }
    });
  }
  const ctxMonthly = document.getElementById('chartMonthly');
  if (ctxMonthly && !activeCharts.monthly) {
    const months = [], monthRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
      const rev = currentData.payments.filter(p => {
        const pd = p.date ? new Date(p.date) : (p.createdAt?.toDate ? p.createdAt.toDate() : null);
        return pd && pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).reduce((a, b) => a + Number(b.amount || 0), 0);
      monthRevenue.push(rev);
    }
    activeCharts.monthly = new Chart(ctxMonthly, {
      type: 'line',
      data: { labels: months, datasets: [{ data: monthRevenue, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#10b981', pointRadius: 4, pointBorderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => getCurrency() + v, font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
    });
  }
  const ctxMethods = document.getElementById('chartMethods');
  if (ctxMethods && !activeCharts.methods) {
    const methodMap = {};
    currentData.payments.forEach(p => { methodMap[p.method] = (methodMap[p.method] || 0) + Number(p.amount || 0); });
    const methods    = Object.keys(methodMap);
    const methodVals = methods.map(m => methodMap[m]);
    activeCharts.methods = new Chart(ctxMethods, {
      type: 'doughnut',
      data: { labels: methods.length ? methods : ['No data'], datasets: [{ data: methodVals.length ? methodVals : [1], backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10, family: 'DM Sans' }, padding: 8 } } }
    });
  }
}

function drawTrackerCharts() {
  const ctx1 = document.getElementById('ftCashFlow');
  if (ctx1 && !activeCharts.ftCashFlow) {
    const months = [], income = [], expense = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      months.push(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]);
      income.push(currentData.payments.filter(p => { if (!p.date) return false; const pd = new Date(p.date); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear(); }).reduce((a,b) => a + Number(b.amount||0), 0));
      expense.push(currentData.expenses.filter(e => { if (!e.date) return false; const ed = new Date(e.date); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); }).reduce((a,b) => a + Number(b.amount||0), 0));
    }
    activeCharts.ftCashFlow = new Chart(ctx1, {
      type: 'bar',
      data: { labels: months, datasets: [{ label: 'Income', data: income, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 5 }, { label: 'Expenses', data: expense, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 11, family: 'DM Sans' }, padding: 10 } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => getCurrency() + v.toLocaleString(), font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } }
    });
  }
  const ctx2 = document.getElementById('ftExpCat');
  if (ctx2 && !activeCharts.ftExpCat) {
    const now  = new Date();
    const mExp = currentData.expenses.filter(e => { if (!e.date) return false; const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const catMap = {};
    mExp.forEach(e => { catMap[e.category] = (catMap[e.category]||0) + Number(e.amount||0); });
    const cats = Object.keys(catMap), vals = cats.map(c => catMap[c]);
    const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#10b981','#f97316'];
    activeCharts.ftExpCat = new Chart(ctx2, {
      type: 'doughnut',
      data: { labels: cats.length ? cats : ['No data'], datasets: [{ data: vals.length ? vals : [1], backgroundColor: COLORS.slice(0, Math.max(cats.length, 1)), borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10, family: 'DM Sans' }, padding: 8, boxWidth: 10 } } } }
    });
  }
}

// ==========================================
// FINANCE TRACKER — DATA OPERATIONS
// ==========================================
async function handleFtAddIncome(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  const receiptNo = 'RCP-' + Date.now().toString().slice(-6);
  const batch = db.batch();
  const payRef = db.collection('payments').doc();
  batch.set(payRef, { clientId: data.clientId || null, amount: data.amount, method: data.method, date: data.date, note: data.note || '', reference: '', createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  const recRef = db.collection('receipts').doc();
  batch.set(recRef, { receiptNo, clientId: data.clientId || null, amount: data.amount, method: data.method, date: data.date, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  await batch.commit();
  addActivity('FT income: ' + money(data.amount));
  e.target.reset();
  alert('Income recorded: ' + money(data.amount));
}

async function handleFtAddExpense(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.amount = Number(data.amount);
  await db.collection('expenses').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.id });
  addActivity('FT expense: ' + data.category);
  e.target.reset();
  alert('Expense recorded: ' + money(data.amount));
}

// ==========================================
// KANBAN — DATA OPERATIONS  
// ==========================================
async function saveTask(editId) {
  const title    = document.getElementById('kt_title')?.value?.trim();
  if (!title) { alert('Title is required'); return; }
  const status   = document.getElementById('kt_status')?.value    || 'todo';
  const priority = document.getElementById('kt_priority')?.value  || 'Medium';
  const assignee = document.getElementById('kt_assignee')?.value  || '';
  const dueDate  = document.getElementById('kt_due')?.value       || '';
  const labelsRaw = document.getElementById('kt_labels')?.value   || '';
  const labels   = labelsRaw.split(',').map(l => l.trim()).filter(Boolean);
  const ciRows  = document.querySelectorAll('.checklist-row');
  const checklist = [];
  ciRows.forEach(row => {
    const text = row.querySelector('input[type="text"]')?.value?.trim();
    const done = row.querySelector('input[type="checkbox"]')?.checked || false;
    if (text) checklist.push({ text, done });
  });
  const data = {
    title, status, priority, assignedTo: assignee || null, dueDate: dueDate || null,
    labels, checklist, description: document.getElementById('kt_desc')?.value?.trim() || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser.id,
  };
  if (editId) {
    await db.collection('tasks').doc(editId).update(data);
    addActivity('Task updated: ' + title);
  } else {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    data.createdBy = currentUser.id;
    await db.collection('tasks').add(data);
    addActivity('Task created: ' + title);
  }
  closeModal();
}

async function deleteTask(id) {
  if (!isAdmin() || !confirm('Delete this task permanently?')) return;
  const t = (currentData.tasks||[]).find(x => x.id === id);
  await db.collection('tasks').doc(id).delete();
  addActivity('Task deleted: ' + (t?.title || id));
}

async function toggleChecklistItem(taskId, index, done) {
  const t = (currentData.tasks||[]).find(x => x.id === taskId);
  if (!t || !t.checklist) return;
  t.checklist[index].done = done;
  await db.collection('tasks').doc(taskId).update({ checklist: t.checklist, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}