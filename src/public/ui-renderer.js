// ============================================================
//  Digital Agency Suite — Marketing Agency ERP
//  ui-renderer.js  |  Views & Rendering
// ============================================================

// ==========================================
// NAVIGATION DEFINITIONS
// ==========================================
const navItems = {
  dashboard:      { icon: '◆',  label: 'Dashboard' },
  financeTracker: { icon: '💰', label: 'Finance Tracker' },
  campaigns:     { icon: '📢', label: 'Campaigns' },
  clients:       { icon: '👥', label: 'Clients' },
  services:      { icon: '✦',  label: 'Services' },
  projects:      { icon: '📁', label: 'Projects' },
  tasks:         { icon: '✓',  label: 'Tasks' },
  archives:      { icon: '🗂', label: 'Archives' },
  reviewDesk:    { icon: '✓',  label: 'Review Desk' },
  invoices:      { icon: '🧾', label: 'Invoices' },
  payments:      { icon: '💳', label: 'Payments' },
  receipts:      { icon: '🗒', label: 'Receipts' },
  expenses:      { icon: '📉', label: 'Expenses' },
  reports:       { icon: '📊', label: 'Reports' },
  kanban:        { icon: '▦',  label: 'Kanban Board' },
  settings:      { icon: '⚙',  label: 'Settings' },
  docs:          { icon: '📖', label: 'Help & Docs' }
};

const bottomNavDef = [
  { sec: 'dashboard', icon: '◆',  label: 'Home' },
  { sec: 'campaigns', icon: '📢', label: 'Campaigns' },
  { sec: 'clients', icon: '👥', label: 'Clients' },
  { sec: 'invoices', icon: '🧾', label: 'Invoice' },
  { sec: '_more',    icon: '☰',  label: 'More' },
];

// ==========================================
// UI HELPERS
// ==========================================
function title(t, s) {
  return `
    <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="font-size:24px;font-weight:800;color:var(--text);margin:0 0 4px;letter-spacing:-0.02em;">${t}</h1>
        <p style="color:var(--text-muted);font-size:13px;margin:0;">${s}</p>
      </div>
      ${logoUrl ? `<img src="${logoUrl}" style="height:36px;object-fit:contain;opacity:0.8;" alt="Logo">` : ''}
    </div>
  `;
}

function denied() {
  return `<div class="card" style="text-align:center;padding:60px;"><div style="font-size:40px;margin-bottom:12px;">🔒</div><h2 style="font-weight:700;">Access Denied</h2><p style="color:var(--text-muted);">You don't have permission to view this section.</p></div>`;
}

function calculateStats() {
  const revenue  = currentData.payments.reduce((a, b) => a + Number(b.amount || 0), 0);
  const expenses = currentData.expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  return { revenue, expenses, profit: revenue - expenses };
}

function showModal(content, extraClass = '') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.innerHTML = `<div class="modal ${extraClass}">${content}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  document.getElementById('modalOverlay')?.remove();
}

// ==========================================
// APP SHELL & LOGIN
// ==========================================
function shell() {
  const mods    = Object.keys(navItems).filter(m => m === 'docs' || has(m));
  const cName   = companyData?.name || APP_NAME;
  const initials = cName.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase();
  const bnItems  = bottomNavDef.filter(b => b.sec === '_more' || mods.includes(b.sec));

  return `
    <!-- MOBILE TOP BAR -->
    <div class="mobile-topbar">
      <button class="hamburger" onclick="toggleDrawer()" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <div class="topbar-logo">
        ${logoUrl ? `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;" alt="">` : initials}
      </div>
      <div class="topbar-title" id="topbarTitle">${cName}</div>
      <div class="topbar-role">${currentUser?.role}</div>
    </div>

    <!-- DRAWER OVERLAY -->
    <div class="drawer-overlay" id="drawerOverlay" onclick="toggleDrawer()"></div>

    <!-- MOBILE DRAWER -->
    <div class="mobile-drawer" id="mobileDrawer">
      <div class="drawer-header">
        ${logoUrl ? `<img src="${logoUrl}" style="height:32px;object-fit:contain;margin-bottom:8px;" alt="">` : `<div style="width:36px;height:36px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:12px;margin-bottom:8px;">${initials}</div>`}
        <div style="color:white;font-weight:700;font-size:14px;">${cName}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px;">${currentUser?.name || currentUser?.email}</div>
      </div>
      <div class="drawer-nav">
        ${mods.map(m => `
          <button class="nav-item" data-sec="${m}" onclick="renderSection('${m}');toggleDrawer()">
            <span class="nav-icon">${navItems[m]?.icon || '○'}</span>
            <span>${navItems[m]?.label || m}</span>
          </button>
        `).join('')}
      </div>
      <div class="drawer-footer">
        <button onclick="handleLogout()" class="nav-item" style="color:rgba(255,100,100,0.9);">
          <span class="nav-icon">→</span><span>Logout</span>
        </button>
      </div>
    </div>

    <!-- MAIN LAYOUT -->
    <div class="app-shell" style="min-height:100vh;display:grid;grid-template-columns:var(--sidebar-w) 1fr;">
      <!-- DESKTOP SIDEBAR -->
      <aside class="sidebar">
        <div style="margin-bottom:20px;padding:12px;border-radius:10px;background:rgba(255,255,255,0.08);">
          ${logoUrl ? `<img src="${logoUrl}" style="height:36px;object-fit:contain;margin-bottom:8px;" alt="Logo">` : `<div style="width:40px;height:40px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:13px;margin-bottom:8px;">${initials}</div>`}
          <div style="color:rgba(255,255,255,0.9);font-weight:700;font-size:13px;">${cName}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:2px;">${currentUser?.name || currentUser?.email}</div>
          <div style="margin-top:6px;display:inline-block;background:var(--accent);color:white;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;">${currentUser?.role}</div>
        </div>
        <div class="section-label">NAVIGATION</div>
        <nav style="flex:1;overflow-y:auto;">
          ${mods.map(m => `
            <button class="nav-item" data-sec="${m}" onclick="renderSection('${m}')">
              <span class="nav-icon">${navItems[m]?.icon || '○'}</span>
              <span>${navItems[m]?.label || m}</span>
            </button>
          `).join('')}
        </nav>
        <div class="divider" style="margin-top:8px;"></div>
        <button onclick="handleLogout()" class="nav-item" style="color:rgba(255,100,100,0.8);">
          <span class="nav-icon">→</span><span>Logout</span>
        </button>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="app-main" style="background:var(--bg);overflow-y:auto;">
        <div id="content" class="fade-in" style="padding:28px;max-width:1200px;margin:0 auto;"></div>
      </main>
    </div>

    <!-- MOBILE BOTTOM NAV -->
    <nav class="mobile-bottomnav" id="bottomNav">
      ${bnItems.map(b => `
        <button class="bottomnav-item ${b.sec === '_more' ? 'bottomnav-more' : ''}" data-bsec="${b.sec}" onclick="${b.sec === '_more' ? 'toggleDrawer()' : `renderSection('${b.sec}')`}">
          <div class="bottomnav-icon">${b.icon}</div>
          <span>${b.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function renderLogin() {
  const cName    = companyData?.name || APP_NAME;
  const initials = cName.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase();
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--primary);padding:20px;">
      <div style="width:100%;max-width:400px;">
        <div class="card fade-in" style="padding:36px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="width:64px;height:64px;background:var(--primary);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;border:3px solid var(--accent);">
              ${logoUrl ? `<img src="${logoUrl}" style="width:48px;height:48px;object-fit:contain;border-radius:8px;" alt="logo">` : `<span style="color:white;font-weight:800;font-size:14px;letter-spacing:-0.5px;">${initials}</span>`}
            </div>
            <h1 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 4px;">${cName}</h1>
            <p style="color:var(--text-muted);font-size:13px;margin:0;">Digital Agency Suite · v${APP_VERSION}</p>
            <p style="color:var(--text-light);font-size:11px;margin:4px 0 0;">by ${APP_DEVELOPER}</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <input type="email" id="loginEmail" placeholder="Email address" required>
            <input type="password" id="loginPassword" placeholder="Password" required onkeydown="if(event.key==='Enter')handleLogin()">
            <button onclick="handleLogin()" class="btn" style="justify-content:center;padding:12px;">Sign In</button>
          </div>
          <div style="margin-top:16px;text-align:center;">
            <button onclick="showSignup()" style="background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer;">Create account</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (!currentUser) { renderLogin(); return; }
  destroyCharts();
  document.getElementById('app').innerHTML = shell();
  renderSection('dashboard');
}

function toggleDrawer() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (!drawer) return;
  drawer.classList.toggle('open');
  overlay.classList.toggle('open');
  document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
}

// ==========================================
// SECTION ROUTING
// ==========================================
function renderSection(sec) {
  destroyCharts();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.bottomnav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-sec="${sec}"]`)?.classList.add('active');
  document.querySelector(`[data-bsec="${sec}"]`)?.classList.add('active');

  const titleEl = document.getElementById('topbarTitle');
  if (titleEl && navItems[sec]) titleEl.textContent = navItems[sec].label;

  const views = {
    dashboard: viewDashboard, campaigns: viewCampaigns, clients: viewClients,
    services: viewServices, projects: viewProjects, tasks: viewTasks,
    archives: viewArchives, reviewDesk: viewReviewDesk, invoices: viewInvoices,
    payments: viewPayments, receipts: viewReceipts, expenses: viewExpenses,
    reports: viewReports, kanban: viewKanban, settings: viewSettings,
    docs: viewDocs, financeTracker: viewFinanceTracker
  };

  const content = document.getElementById('content');
  if (!content || !views[sec]) return;

  setupListenersForSection(sec);
  content.innerHTML = views[sec]();

  if (sec === 'dashboard')      setTimeout(drawDashboardCharts, 120);
  if (sec === 'reports')       setTimeout(() => generateReport(activeReportType), 120);
  if (sec === 'financeTracker') setTimeout(drawTrackerCharts, 120);
  if (sec === 'kanban')      setTimeout(initKanbanDnd, 80);

  content.scrollIntoView && content.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function setupListenersForSection(sec) {
  cleanupListeners();
  const listeners = {
    dashboard:     ['activities','payments','expenses','tasks','campaigns','clients','projects'],
    financeTracker:['payments','expenses','budgets','goals'],
    campaigns:    ['campaigns','clients'],
    clients:     ['clients'],
    services:    ['services'],
    projects:    ['projects','clients','tasks'],
    tasks:       ['tasks','projects','users'],
    archives:    ['tasks','projects','users'],
    reviewDesk:  ['uploads','tasks','projects','users'],
    invoices:   ['invoices','clients','services'],
    payments:   ['payments','invoices','clients'],
    receipts:   ['receipts','clients'],
    expenses:   ['expenses'],
    reports:    ['payments','expenses','clients','campaigns','projects','tasks','invoices'],
    kanban:     ['tasks','users'],
    settings:    []
  };

  (listeners[sec] || []).forEach(col => {
    subscribeToCollection(col, () => {
      const content   = document.getElementById('content');
      const activeBtn = document.querySelector(`[data-sec="${sec}"].active`);
      if (content && activeBtn) {
        destroyCharts();
        const views = {
          dashboard: viewDashboard, campaigns: viewCampaigns, clients: viewClients,
          services: viewServices, projects: viewProjects, tasks: viewTasks,
          archives: viewArchives, reviewDesk: viewReviewDesk, invoices: viewInvoices,
          payments: viewPayments, receipts: viewReceipts, expenses: viewExpenses,
          reports: viewReports, kanban: viewKanban, settings: viewSettings,
          docs: viewDocs, financeTracker: viewFinanceTracker
        };
        content.innerHTML = views[sec]();
        if (sec === 'dashboard')      setTimeout(drawDashboardCharts, 120);
        if (sec === 'reports')        setTimeout(() => generateReport(activeReportType), 120);
        if (sec === 'financeTracker') setTimeout(drawTrackerCharts, 120);
        if (sec === 'kanban')         setTimeout(initKanbanDnd, 80);
      }
    });
  });
}

// ==========================================
// SECTION VIEWS
// ==========================================
function viewDashboard() {
  const stats              = calculateStats();
  const myTasks           = currentData.tasks.filter(t => t.assignedTo === currentUser.id && t.status !== 'Completed');
  const pendingReviews    = currentData.tasks.filter(t => t.status === 'Review').length;
  const activeCampaigns = currentData.campaigns.filter(c => c.status === 'active').length;
  const draftCampaigns = currentData.campaigns.filter(c => c.status === 'draft').length;
  const showFinancial  = canViewFinancial();

  return `
    ${title('Dashboard', 'Welcome back, ' + (currentUser?.name || 'User'))}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
      ${showFinancial ? `
      <div class="stat-card green">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">Revenue</div>
        <div style="font-size:24px;font-weight:800;color:var(--text);">${money(stats.revenue)}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">Total collected</div>
      </div>
      <div class="stat-card red">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">Expenses</div>
        <div style="font-size:24px;font-weight:800;color:var(--text);">${money(stats.expenses)}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">Total spent</div>
      </div>
      <div class="stat-card ${stats.profit >= 0 ? '' : 'red'}">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">Net Profit</div>
        <div style="font-size:24px;font-weight:800;color:${stats.profit >= 0 ? 'var(--text)' : 'var(--danger)'};">${money(stats.profit)}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">${stats.profit >= 0 ? 'Profitable' : 'Loss'}</div>
      </div>
      ` : ''}
      <div class="stat-card blue">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">My Tasks</div>
        <div style="font-size:24px;font-weight:800;color:var(--text);">${myTasks.length}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">Active assignments</div>
      </div>
      <div class="stat-card orange">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">Campaigns</div>
        <div style="font-size:24px;font-weight:800;color:var(--text);">${activeCampaigns + draftCampaigns}</div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">${activeCampaigns} active · ${draftCampaigns} draft</div>
      </div>
    </div>

    ${showFinancial ? `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;margin-bottom:24px;">
      <div class="card">
        <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">Financial Overview</h3>
        <div style="height:220px;position:relative;"><canvas id="chartMain"></canvas></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${pendingReviews > 0 && has('reviewDesk') ? `
        <div class="card" style="border-left:3px solid var(--warning);padding:16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Pending Reviews</div>
          <div style="font-size:28px;font-weight:800;color:var(--warning);margin:4px 0;">${pendingReviews}</div>
          <button onclick="renderSection('reviewDesk')" class="btn btn-sm" style="margin-top:4px;">Review Now</button>
        </div>
        ` : ''}
        <div class="card" style="padding:16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Quick Stats</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${[['Clients', currentData.clients.length],['Projects', currentData.projects.length],['Campaigns', currentData.campaigns.length],['Services', currentData.services.length]].map(([label, val]) => `
              <div style="display:flex;justify-content:space-between;font-size:13px;">
                <span style="color:var(--text-muted);">${label}</span>
                <span style="font-weight:700;">${val}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card"><h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">Monthly Revenue</h3><div style="height:180px;position:relative;"><canvas id="chartMonthly"></canvas></div></div>
      <div class="card"><h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">Payment Methods</h3><div style="height:180px;position:relative;"><canvas id="chartMethods"></canvas></div></div>
    </div>
    ` : `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">My Tasks Overview</h3>
      <div style="height:200px;position:relative;"><canvas id="chartTasks"></canvas></div>
    </div>
    `}

    ${myTasks.length > 0 ? `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">My Active Tasks</h3>
      ${myTasks.slice(0, 5).map(t => {
        const proj = currentData.projects.find(p => p.id === t.projectId);
        return `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:13px;font-weight:600;">${t.taskTitle}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${proj?.title || 'Unknown project'} · Due ${formatDate(t.deadline)}</div>
        </div>`;
      }).join('')}
    </div>
    ` : ''}

    ${isAdmin() ? `
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">Recent Activity</h3>
      <div style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:0;">
        ${currentData.activities.slice(0, 25).map(a => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
            <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="color:var(--primary);font-size:12px;">●</span>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;">${a.action}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:1px;">${formatDate(a.createdAt)} · ${a.userName || a.userId}</div>
            </div>
          </div>
        `).join('') || '<p style="color:var(--text-light);font-size:13px;">No recent activity</p>'}
      </div>
    </div>
    ` : ''}
  `;
}

function viewClients() {
  return `
    ${title('Clients', 'Client database — ' + currentData.clients.length + ' total')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Add New Client</h4>
      <form onsubmit="handleAddClient(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Company/Name *</label><input name="name" placeholder="Company name" required></div>
        <div><label class="form-label">Contact Person</label><input name="contactPerson" placeholder="Contact name"></div>
        <div><label class="form-label">Phone *</label><input name="phone" placeholder="Phone number" required></div>
        <div><label class="form-label">Email</label><input name="email" placeholder="email@example.com" type="email"></div>
        <div><label class="form-label">Client Type</label><select name="type"><option value="">Select type...</option>${CLIENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select></div>
        <div><label class="form-label">Industry</label><input name="industry" placeholder="Industry"></div>
        <button type="submit" class="btn">Add</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table>
        <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Type</th><th>Industry</th><th>Added</th><th>Actions</th></tr></thead>
        <tbody>
          ${currentData.clients.length === 0 ? `<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:40px;">No clients yet</td></tr>` :
            currentData.clients.map(c => `
              <tr>
                <td><span style="font-weight:600;cursor:pointer;color:var(--primary);" onclick="viewClientDetail('${c.id}')">${c.name}</span></td>
                <td>${c.contactPerson || '-'}</td>
                <td>${c.phone}</td>
                <td>${c.email || '-'}</td>
                <td>${c.type ? `<span class="badge badge-pending">${c.type}</span>` : '-'}</td>
                <td style="color:var(--text-muted);">${c.industry || '-'}</td>
                <td style="color:var(--text-muted);">${formatDate(c.createdAt)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button onclick="messageClient('${c.id}','${c.phone}')" class="btn btn-sm" style="background:#25D366;color:white;">WA</button>
                    <button onclick="viewClientDetail('${c.id}')" class="btn-secondary btn btn-sm">View</button>
                    <button onclick="editClient('${c.id}')" class="btn-secondary btn btn-sm">Edit</button>
                    ${canDelete() ? `<button onclick="deleteClient('${c.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewClientDetail(id) {
  const c            = currentData.clients.find(x => x.id === id);
  if (!c) return;
  const clientInvoices = currentData.invoices.filter(i => i.clientId === id);
  const clientPayments = currentData.payments.filter(p => p.clientId === id);
  const clientCampaigns = currentData.campaigns.filter(cmp => cmp.clientId === id);
  const totalPaid     = clientPayments.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalInvoiced  = clientInvoices.reduce((a, b) => a + Number(b.amount || 0), 0);
  const arrears       = totalInvoiced - totalPaid;

  showModal(`
    <div class="modal-header"><div class="modal-title">👤 ${c.name}</div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
      <div style="background:var(--accent-muted);border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Total Paid</div><div style="font-size:20px;font-weight:800;color:var(--success);margin-top:4px;">${money(totalPaid)}</div></div>
      <div style="background:var(--primary-light);border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Invoiced</div><div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:4px;">${money(totalInvoiced)}</div></div>
      <div style="background:${arrears > 0 ? 'var(--danger-soft)' : 'var(--accent-muted)'};border-radius:8px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Arrears</div><div style="font-size:20px;font-weight:800;color:${arrears > 0 ? 'var(--danger)' : 'var(--success)'};margin-top:4px;">${money(arrears)}</div></div>
    </div>
    <div style="margin-bottom:16px;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${c.phone} ${c.email ? '· ' + c.email : ''} ${c.type ? '· <span class="badge badge-pending">' + c.type + '</span>' : ''}</div></div>
    <div class="tab-bar" id="custDetailTabs">
      <div class="tab active" onclick="switchCustTab('invoices')">Invoices (${clientInvoices.length})</div>
      <div class="tab" onclick="switchCustTab('payments')">Payments (${clientPayments.length})</div>
      <div class="tab" onclick="switchCustTab('campaigns')">Campaigns (${clientCampaigns.length})</div>
    </div>
    <div id="custDetailContent">
      <table><thead><tr><th>Invoice #</th><th>Amount</th><th>Deposit</th><th>Balance</th><th>Due</th><th>Action</th></tr></thead>
      <tbody>
        ${clientInvoices.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-light);">No invoices</td></tr>' :
          clientInvoices.map(i => {
            const bal = Number(i.amount) - Number(i.deposit || 0);
            return `<tr><td style="font-weight:600;color:var(--primary);">${i.invoiceNo}</td><td>${money(i.amount)}</td><td>${money(i.deposit || 0)}</td><td style="color:${bal > 0 ? 'var(--danger)' : 'var(--success)'};">${money(bal)}</td><td>${formatDate(i.dueDate)}</td><td><button onclick="printInvoice('${i.id}')" class="btn btn-sm btn-secondary">Print</button></td></tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `, 'modal-lg');
  window._custDetailData = { id, clientInvoices, clientPayments, clientCampaigns };
}

function switchCustTab(tab) {
  document.querySelectorAll('#custDetailTabs .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const d  = window._custDetailData;
  if (!d) return;
  const el = document.getElementById('custDetailContent');
  if (tab === 'invoices') {
    el.innerHTML = `<table><thead><tr><th>Invoice #</th><th>Amount</th><th>Deposit</th><th>Balance</th><th>Due</th><th>Action</th></tr></thead><tbody>${d.clientInvoices.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-light);">No invoices</td></tr>' : d.clientInvoices.map(i => { const bal = Number(i.amount) - Number(i.deposit || 0); return `<tr><td style="font-weight:600;color:var(--primary);">${i.invoiceNo}</td><td>${money(i.amount)}</td><td>${money(i.deposit||0)}</td><td style="color:${bal>0?'var(--danger)':'var(--success)'};">${money(bal)}</td><td>${formatDate(i.dueDate)}</td><td><button onclick="printInvoice('${i.id}')" class="btn btn-sm btn-secondary">Print</button></td></tr>`; }).join('')}</tbody></table>`;
  } else if (tab === 'payments') {
    el.innerHTML = `<table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Invoice</th></tr></thead><tbody>${d.clientPayments.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-light);">No payments</td></tr>' : d.clientPayments.map(p => { const inv = currentData.invoices.find(i => i.id === p.invoiceId); return `<tr><td>${formatDate(p.date)}</td><td style="font-weight:600;color:var(--success);">${money(p.amount)}</td><td>${p.method}</td><td>${inv?.invoiceNo || '-'}</td></tr>`; }).join('')}</tbody></table>`;
  } else {
    el.innerHTML = `<table><thead><tr><th>Campaign</th><th>Channel</th><th>Budget</th><th>Status</th></tr></thead><tbody>${d.clientCampaigns.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-light);">No campaigns</td></tr>' : d.clientCampaigns.map(cmp => `<tr><td>${cmp.name}</td><td>${cmp.channel}</td><td>${money(cmp.budget)}</td><td><span class="badge badge-${cmp.status}">${cmp.status}</span></td></tr>`; }).join('')}</tbody></table>`;
  }
}

function viewServices() {
  const grouped = {};
  currentData.services.forEach(s => {
    const cat = s.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });
  const groupedRows = Object.entries(grouped).map(([cat, svcs]) => {
    const subRows = svcs.map(s => `<tr><td style="font-weight:600;">${s.name}</td><td style="color:var(--text-muted);">${s.description || '-'}</td><td style="font-weight:700;color:var(--primary);">${money(s.price)}</td><td><div style="display:flex;gap:6px;"><button onclick="editService('${s.id}')" class="btn-secondary btn btn-sm">Edit</button>${canDelete() ? `<button onclick="deleteService('${s.id}')" class="btn-danger btn btn-sm">Delete</button>` : ''}</div></td></tr>`).join('');
    return `<tr style="background:var(--primary-light);"><td colspan="4" style="font-weight:800;font-size:13px;color:var(--primary);letter-spacing:.03em;padding:10px 16px;">📂 ${cat}</td></tr>${subRows}`;
  }).join('');

  return `
    ${title('Services', 'Service catalog')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Add Service</h4>
      <form onsubmit="handleAddService(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Service Name *</label><input name="name" placeholder="e.g. Social Media Management" required></div>
        <div><label class="form-label">Category *</label><input name="category" placeholder="e.g. Social Media" list="catList" required><datalist id="catList">${MARKETING_SERVICES.map(c => `<option value="${c}">`).join('')}</datalist></div>
        <div><label class="form-label">Description</label><input name="description" placeholder="Brief description"></div>
        <div><label class="form-label">Price (${getCurrency().trim()}) *</label><input name="price" type="number" placeholder="0.00" required min="0" step="0.01"></div>
        <button type="submit" class="btn">Add</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Service</th><th>Description</th><th>Price</th><th>Actions</th></tr></thead>
      <tbody>${currentData.services.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:40px;">No services yet — add your first service above</td></tr>` : groupedRows}</tbody></table>
    </div>
  `;
}

function viewCampaigns() {
  return `
    ${title('Campaigns', 'Marketing campaigns')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">New Campaign</h4>
      <form onsubmit="handleAddCampaign(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Campaign Name *</label><input name="name" placeholder="Campaign Name" required></div>
        <div><label class="form-label">Client *</label><select name="clientId" required><option value="">Select...</option>${currentData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Channel *</label><select name="channel" required>${CAMPAIGN_CHANNELS.map(ch => `<option value="${ch}">${ch}</option>`).join('')}</select></div>
        <div><label class="form-label">Start Date</label><input name="startDate" type="date"></div>
        <div><label class="form-label">End Date</label><input name="endDate" type="date"></div>
        <div><label class="form-label">Budget</label><input name="budget" type="number" placeholder="0.00" min="0" step="0.01"></div>
        <button type="submit" class="btn">Create</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Campaign</th><th>Client</th><th>Channel</th><th>Budget</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${currentData.campaigns.length === 0 ? `<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:40px;">No campaigns</td></tr>` :
          currentData.campaigns.map(camp => {
            const client = currentData.clients.find(cl => cl.id === camp.clientId);
            const statusClass = { draft: 'badge-draft', active: 'badge-active', paused: 'badge-paused', completed: 'badge-completed' }[camp.status] || 'badge-pending';
            return `<tr>
              <td style="font-weight:600;">${camp.name}</td>
              <td>${client?.name || 'Unknown'}</td>
              <td>${camp.channel}</td>
              <td>${money(camp.budget)}</td>
              <td>${formatDate(camp.startDate)}</td>
              <td>${formatDate(camp.endDate)}</td>
              <td><span class="badge ${statusClass}">${camp.status}</span></td>
              <td><div style="display:flex;gap:6px;">
                <button onclick="editCampaign('${camp.id}')" class="btn-secondary btn btn-sm">Edit</button>
                ${canDelete() ? `<button onclick="deleteCampaign('${camp.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
              </div></td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewProjects() {
  return `
    ${title('Projects', 'Client projects')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">New Project</h4>
      <form onsubmit="handleAddProject(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Client *</label><select name="clientId" required><option value="">Select...</option>${currentData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Title *</label><input name="title" placeholder="Project Title" required></div>
        <div><label class="form-label">Deliverables</label><input name="deliverables" placeholder="e.g. Reports, Content"></div>
        <div><label class="form-label">Start Date</label><input name="startDate" type="date"></div>
        <div><label class="form-label">Due Date</label><input name="deliveryDate" type="date"></div>
        <div><label class="form-label">Completion Date</label><input name="completionDate" type="date"></div>
        <button type="submit" class="btn">Create</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Client</th><th>Project</th><th>Deliverables</th><th>Progress</th><th>Start</th><th>Due</th><th>Completed</th><th>Actions</th></tr></thead>
      <tbody>
        ${currentData.projects.length === 0 ? `<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:40px;">No projects yet</td></tr>` :
          currentData.projects.map(p => {
            const client    = currentData.clients.find(c => c.id === p.clientId);
            const progress = p.progress || 0;
            const isOverdue = p.deliveryDate && !p.completionDate && new Date(p.deliveryDate) < new Date();
            return `<tr>
              <td>${client?.name || 'Unknown'}</td>
              <td style="font-weight:600;">${p.title}</td>
              <td style="color:var(--text-muted);">${p.deliverables || '-'}</td>
              <td style="min-width:120px;"><div style="display:flex;align-items:center;gap:8px;"><div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${progress}%;"></div></div><span style="font-size:12px;font-weight:700;color:var(--primary);width:32px;">${progress}%</span></div></td>
              <td>${formatDate(p.startDate)}</td>
              <td style="color:${isOverdue?'var(--danger)':'inherit'};">${formatDate(p.deliveryDate)}</td>
              <td style="color:var(--success);">${formatDate(p.completionDate)}</td>
              <td><div style="display:flex;gap:4px;flex-wrap:wrap;">
                <button onclick="updateProjectProgress('${p.id}')" class="btn btn-sm btn-accent">Progress</button>
                <button onclick="editProject('${p.id}')" class="btn-secondary btn btn-sm">Edit</button>
                <button onclick="assignFromProject('${p.id}')" class="btn btn-sm" style="background:var(--primary);">Assign Task</button>
                ${canDelete() ? `<button onclick="deleteProject('${p.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
              </div></td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewTasks() {
  const isCreative = ['SocialMediaManager','ContentCreator','Designer','SEOspecialist'].includes(currentUser.role);
  let tasks = isCreative
    ? currentData.tasks.filter(t => t.assignedTo === currentUser.id && t.status !== 'Completed')
    : currentData.tasks.filter(t => t.status !== 'Completed');

  return `
    ${title('Tasks', isCreative ? 'My Assignments' : 'Team Assignments')}
    ${!isCreative ? `
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Assign New Task</h4>
      <form onsubmit="handleAddTask(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Project *</label><select name="projectId" required><option value="">Select...</option>${currentData.projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}</select></div>
        <div><label class="form-label">Assign To *</label><select name="assignedTo" required><option value="">Select...</option>${currentData.users.filter(u => ['SocialMediaManager','ContentCreator','Designer','SEOspecialist','CampaignManager'].includes(u.role) && u.active).map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}</select></div>
        <div><label class="form-label">Task Title *</label><input name="taskTitle" placeholder="e.g. Create social posts" required></div>
        <div><label class="form-label">Deadline *</label><input name="deadline" type="date" required></div>
        <div><label class="form-label">Status</label><select name="status"><option value="To Do">To Do</option><option value="In Progress">In Progress</option></select></div>
        <button type="submit" class="btn">Assign</button>
      </form>
    </div>
    ` : ''}
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Project</th><th>Task</th><th>Assigned To</th><th>Deadline</th><th>Status</th><th>Updates</th><th>Actions</th></tr></thead>
      <tbody>
        ${tasks.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:40px;">No tasks${isCreative ? ' assigned to you' : ' yet'}</td></tr>` :
          tasks.map(t => {
            const project  = currentData.projects.find(p => p.id === t.projectId);
            const assignee = currentData.users.find(u => u.id === t.assignedTo);
            const statusClass = { 'To Do':'badge-draft','In Progress':'badge-inprogress','Review':'badge-review','Completed':'badge-completed' }[t.status] || 'badge-pending';
            return `<tr>
              <td style="font-weight:600;">${project?.title || 'Unknown'}</td>
              <td>${t.taskTitle}</td>
              <td>${assignee?.name || 'Unknown'}</td>
              <td style="color:${t.deadline && new Date(t.deadline) < new Date() && t.status !== 'Completed' ? 'var(--danger)' : 'inherit'};">${formatDate(t.deadline)}</td>
              <td><span class="badge ${statusClass}">${t.status || 'To Do'}</span></td>
              <td style="color:var(--text-muted);font-size:12px;">${(t.updates || []).length} note${(t.updates||[]).length !== 1 ? 's' : ''}</td>
              <td>${isCreative ? `
                <div style="display:flex;gap:6px;">
                  <button onclick="updateTaskStatus('${t.id}')" class="btn btn-sm btn-secondary">Update</button>
                </div>` : `
                <div style="display:flex;gap:6px;">
                  <button onclick="editTask('${t.id}')" class="btn-secondary btn btn-sm">Edit</button>
                  ${canDelete() ? `<button onclick="deleteTask('${t.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
                </div>`}
              </td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewArchives() {
  const archivedTasks = currentData.tasks.filter(t => t.status === 'Completed');

  return `
    ${title('Archives', 'Completed work')}
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Project</th><th>Task</th><th>Assigned To</th><th>Completed</th></tr></thead>
      <tbody>
        ${archivedTasks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:40px;">No archived tasks yet</td></tr>` :
          archivedTasks.map(t => {
            const project  = currentData.projects.find(p => p.id === t.projectId);
            const assignee = currentData.users.find(u => u.id === t.assignedTo);
            return `<tr>
              <td style="font-weight:600;">${project?.title || 'Unknown'}</td>
              <td>${t.taskTitle}</td>
              <td>${assignee?.name || 'Unknown'}</td>
              <td style="color:var(--success);">${formatDate(t.updatedAt || t.createdAt)}</td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewReviewDesk() {
  if (!has('reviewDesk')) return denied();
  const pending  = currentData.tasks.filter(t => t.status === 'Review');
  const approved = currentData.tasks.filter(t => t.status === 'Completed');

  return `
    ${title('Review Desk', 'Review task submissions')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div class="stat-card orange"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Pending Review</div><div style="font-size:28px;font-weight:800;">${pending.length}</div></div>
      <div class="stat-card green"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Approved</div><div style="font-size:28px;font-weight:800;">${approved.length}</div></div>
    </div>
    ${pending.length === 0 ? `<div class="card empty-state"><div style="font-size:40px;margin-bottom:12px;">✅</div><h3 style="font-weight:700;">All Clear!</h3><p style="color:var(--text-muted);">No pending reviews.</p></div>` : `
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Project</th><th>Task</th><th>Assigned To</th><th>Submitted</th><th>Actions</th></tr></thead>
      <tbody>
        ${pending.map(t => {
          const project  = currentData.projects.find(p => p.id === t.projectId);
          const assignee = currentData.users.find(u => u.id === t.assignedTo);
          return `<tr>
            <td style="font-weight:600;">${project?.title || 'Unknown'}</td>
            <td>${t.taskTitle}</td>
            <td>${assignee?.name || 'Unknown'}</td>
            <td>${formatDate(t.updatedAt || t.createdAt)}</td>
            <td><div style="display:flex;gap:6px;">
              <button onclick="approveTask('${t.id}')" class="btn-success btn btn-sm">Approve</button>
              <button onclick="rejectTask('${t.id}')" class="btn-danger btn btn-sm">Reject</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody></table>
    </div>`}
  `;
}

function approveTask(id) {
  db.collection('tasks').doc(id).update({ status: 'Completed' });
  addActivity('Task approved: ' + id);
}

function rejectTask(id) {
  db.collection('tasks').doc(id).update({ status: 'In Progress' });
  addActivity('Task sent back: ' + id);
}

function viewInvoices() {
  if (!has('invoices')) return denied();
  const taxOn = anyTaxEnabled();
  const taxSummary = taxSummaryLine();

  return `
    ${title('Invoices', 'Billing & invoicing')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Generate Invoice</h4>
      <form onsubmit="handleAddInvoice(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Client *</label><select name="clientId" required><option value="">Select...</option>${currentData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Service *</label><select name="serviceId" required><option value="">Select...</option>${currentData.services.map(s => `<option value="${s.id}">${s.name} (${money(s.price)})</option>`).join('')}</select></div>
        <div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div>
        <div><label class="form-label">Deposit Paid</label><input name="deposit" type="number" placeholder="0.00" min="0" step="0.01"></div>
        <div><label class="form-label">Due Date *</label><input name="dueDate" type="date" required></div>
        <div><label class="form-label">Tax Treatment</label><select name="taxInclusive"><option value="exclusive">Tax Exclusive (add tax on top)</option><option value="inclusive">Tax Inclusive (tax within amount)</option></select></div>
        <button type="submit" class="btn">Generate</button>
      </form>
      ${taxOn ? `<div class="alert alert-info" style="margin-top:12px;">Active taxes: <strong>${taxSummary}</strong>.</div>` : `<div class="alert alert-warning" style="margin-top:12px;">No taxes are currently enabled.</div>`}
    </div>
    <div class="card" style="overflow:auto;">
      <table>
        <thead><tr><th>Invoice #</th><th>Client</th><th>Subtotal</th>${taxOn ? '<th>Tax</th>' : ''}<th>Deposit</th><th>Balance</th><th>Due</th><th>Actions</th></tr></thead>
        <tbody>
          ${currentData.invoices.length === 0 ? `<tr><td colspan="${taxOn ? 8 : 7}" style="text-align:center;color:var(--text-light);padding:40px;">No invoices yet</td></tr>` :
            currentData.invoices.map(i => {
              const client   = currentData.clients.find(c => c.id === i.clientId);
              const inclusive = i.taxInclusive === 'inclusive';
              const taxCalc  = calcTax(i.amount, inclusive);
              const gross   = inclusive ? Number(i.amount) : taxCalc.gross;
              const balance = gross - Number(i.deposit || 0);
              const isOverdue = i.dueDate && new Date(i.dueDate) < new Date() && balance > 0;
              return `<tr>
                <td style="font-weight:700;color:var(--primary);">${i.invoiceNo}</td>
                <td>${client?.name || 'Unknown'}</td>
                <td>${money(i.amount)}</td>
                ${taxOn ? `<td style="color:var(--warning);">${money(taxCalc.totalTax)}</td>` : ''}
                <td style="color:var(--success);">${money(i.deposit || 0)}</td>
                <td style="font-weight:700;color:${isOverdue ? 'var(--danger)' : balance > 0 ? 'var(--warning)' : 'var(--success)'};">${money(balance)}</td>
                <td style="color:${isOverdue ? 'var(--danger)' : 'inherit'};">${formatDate(i.dueDate)}</td>
                <td><div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button onclick="printInvoice('${i.id}')" class="btn-secondary btn btn-sm">Print</button>
                  <button onclick="sendInvoiceWhatsApp('${i.id}')" class="btn btn-sm" style="background:#25D366;color:white;">WA</button>
                  ${canEditTransaction() ? `<button onclick="editInvoice('${i.id}')" class="btn btn-sm btn-secondary">Edit</button>` : ''}
                  ${canDelete() ? `<button onclick="deleteInvoice('${i.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
                </div></td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewPayments() {
  if (!has('payments')) return denied();
  return `
    ${title('Payments', 'Record & track payments')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <h4 style="font-size:13px;font-weight:700;margin:0 0 14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Record Payment</h4>
      <form onsubmit="handleAddPayment(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Client *</label><select name="clientId" required><option value="">Select...</option>${currentData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div><label class="form-label">Link to Invoice</label><select name="invoiceId"><option value="">No invoice</option>${currentData.invoices.map(i => { const c = currentData.clients.find(x=>x.id===i.clientId); return `<option value="${i.id}">${i.invoiceNo} — ${c?.name||'?'} (Bal: ${money(Number(i.amount)-Number(i.deposit||0))})</option>`; }).join('')}</select></div>
        <div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div>
        <div><label class="form-label">Method</label><select name="method"><option value="MoMo">MoMo</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Card">Card</option></select></div>
        <div><label class="form-label">Date *</label><input name="date" type="date" value="${today()}" required></div>
        <div><label class="form-label">Reference</label><input name="reference" placeholder="e.g. Momo ref #"></div>
        <button type="submit" class="btn">Record</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Client</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${currentData.payments.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:40px;">No payments recorded</td></tr>` :
          currentData.payments.map(p => {
            const client = currentData.clients.find(c => c.id === p.clientId);
            const invoice = currentData.invoices.find(i => i.id === p.invoiceId);
            return `<tr>
              <td style="font-weight:600;">${client?.name || 'Unknown'}</td>
              <td>${invoice ? `<span style="color:var(--primary);font-weight:600;">${invoice.invoiceNo}</span>` : '-'}</td>
              <td style="font-weight:700;color:var(--success);">${money(p.amount)}</td>
              <td><span class="badge badge-pending">${p.method}</span></td>
              <td style="color:var(--text-muted);font-size:12px;">${p.reference || '-'}</td>
              <td>${formatDate(p.date)}</td>
              <td><div style="display:flex;gap:6px;">
                ${canEditTransaction() ? `<button onclick="editPayment('${p.id}')" class="btn-secondary btn btn-sm">Edit</button>` : ''}
                ${canDelete() ? `<button onclick="deletePayment('${p.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
              </div></td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewReceipts() {
  if (!has('receipts')) return denied();
  return `
    ${title('Receipts', 'Official payment receipts')}
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Receipt #</th><th>Client</th><th>Amount</th><th>Method</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${currentData.receipts.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:40px;">No receipts</td></tr>` :
          currentData.receipts.map(r => {
            const client = currentData.clients.find(c => c.id === r.clientId);
            return `<tr>
              <td style="font-weight:700;color:var(--primary);">${r.receiptNo}</td>
              <td>${client?.name || 'Unknown'}</td>
              <td style="font-weight:700;color:var(--success);">${money(r.amount)}</td>
              <td><span class="badge badge-pending">${r.method}</span></td>
              <td>${formatDate(r.date)}</td>
              <td><div style="display:flex;gap:6px;">
                <button onclick="printReceipt('${r.id}')" class="btn-secondary btn btn-sm">Print</button>
                <button onclick="sendReceiptWhatsApp('${r.id}')" class="btn btn-sm" style="background:#25D366;color:white;">WA</button>
              </div></td>
            </tr>`;
          }).join('')}
      </tbody></table>
    </div>
  `;
}

function viewExpenses() {
  if (!has('expenses')) return denied();
  return `
    ${title('Expenses', 'Track business expenses')}
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <form onsubmit="handleAddExpense(event)" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Date *</label><input name="date" type="date" value="${today()}" required></div>
        <div><label class="form-label">Category *</label><select name="category" required><option value="">Select...</option>${['Equipment','Software','Travel','Marketing','Salaries','Utilities','Office Supplies','Training','Other'].map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <div><label class="form-label">Description *</label><input name="description" placeholder="Brief description" required></div>
        <div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div>
        <div><label class="form-label">Paid By</label><select name="paidBy"><option value="Cash">Cash</option><option value="MoMo">MoMo</option><option value="Bank">Bank</option><option value="Card">Card</option></select></div>
        <button type="submit" class="btn">Save</button>
      </form>
    </div>
    <div class="card" style="overflow:auto;">
      <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Paid By</th><th>Actions</th></tr></thead>
      <tbody>
        ${currentData.expenses.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:40px;">No expenses</td></tr>` :
          currentData.expenses.map(e => `<tr>
            <td>${formatDate(e.date)}</td>
            <td><span class="badge badge-pending">${e.category}</span></td>
            <td>${e.description}</td>
            <td style="font-weight:700;color:var(--danger);">${money(e.amount)}</td>
            <td style="color:var(--text-muted);">${e.paidBy || '-'}</td>
            <td><div style="display:flex;gap:6px;">
              ${canEditTransaction() ? `<button onclick="editExpense('${e.id}')" class="btn-secondary btn btn-sm">Edit</button>` : ''}
              ${canDelete() ? `<button onclick="deleteExpense('${e.id}')" class="btn-danger btn btn-sm">Del</button>` : ''}
            </div></td>
          </tr>`).join('')}
      </tbody></table>
    </div>
  `;
}

function viewReports() {
  if (!has('reports')) return denied();
  const stats = calculateStats();
  const reportTypes = [
    { id: 'finance', label: 'Financial Summary' },
    { id: 'clients', label: 'Clients' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'projects', label: 'Projects' },
    { id: 'income_statement', label: 'Income Statement' },
    { id: 'tax', label: 'Tax Report' },
    { id: 'outstanding', label: 'Outstanding Balances' },
    { id: 'expense_breakdown', label: 'Expense Breakdown' },
  ];
  return `
    ${title('Reports', 'Business analytics')}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
      <div class="stat-card green"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Revenue</div><div style="font-size:24px;font-weight:800;">${money(stats.revenue)}</div></div>
      <div class="stat-card red"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Expenses</div><div style="font-size:24px;font-weight:800;">${money(stats.expenses)}</div></div>
      <div class="stat-card ${stats.profit >= 0 ? '' : 'red'}"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Net Profit</div><div style="font-size:24px;font-weight:800;color:${stats.profit >= 0 ? 'var(--text)' : 'var(--danger)'};">${money(stats.profit)}</div></div>
    </div>
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">Date Range:</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:12px;color:var(--text-muted);">From</label>
          <input type="date" id="rptFrom" value="${reportDateFrom}" style="width:140px;" onchange="reportDateFrom=this.value">
          <label style="font-size:12px;color:var(--text-muted);">To</label>
          <input type="date" id="rptTo" value="${reportDateTo}" style="width:140px;" onchange="reportDateTo=this.value">
        </div>
        <button onclick="reportDateFrom='';reportDateTo='';document.getElementById('rptFrom').value='';document.getElementById('rptTo').value='';" class="btn-secondary btn btn-sm">Clear Range</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px;padding:20px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Select Report</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${reportTypes.map(rt => `<button onclick="switchReport('${rt.id}')" id="rptBtn_${rt.id}" class="btn ${activeReportType === rt.id ? '' : 'btn-secondary'}">${rt.label}</button>`).join('')}
      </div>
    </div>
    <div id="reportOutput" class="card" style="padding:0;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);">
        <h3 style="font-size:14px;font-weight:700;margin:0;" id="reportTitle">Report</h3>
        <button onclick="printReportContent()" class="btn btn-sm btn-secondary">🖨 Print</button>
      </div>
      <div id="reportContent" style="padding:20px;"></div>
    </div>
  `;
}

function switchReport(type) {
  activeReportType = type;
  document.querySelectorAll('[id^="rptBtn_"]').forEach(b => { b.classList.remove('btn'); b.classList.add('btn-secondary'); b.style.background = ''; b.style.color = ''; });
  const active = document.getElementById('rptBtn_' + type);
  if (active) { active.classList.remove('btn-secondary'); active.classList.add('btn'); }
  generateReport(type);
}

function generateReport(type) {
  const el      = document.getElementById('reportContent');
  const titleEl = document.getElementById('reportTitle');
  if (!el) return;
  activeReportType = type;
  const c        = companyData || defaultCompany;
  const payments = filterByDateRange(currentData.payments, 'date');
  const expenses = filterByDateRange(currentData.expenses, 'date');
  const campaigns = filterByDateRange(currentData.campaigns, 'startDate');
  const revenue  = payments.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalExpenses = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const rangeLabel = reportDateFrom || reportDateTo ? ` (${reportDateFrom || 'Start'} → ${reportDateTo || 'Today'})` : ' (All Time)';
  let html = '';

  if (type === 'finance') {
    const profit = revenue - totalExpenses;
    const grossMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
    if (titleEl) titleEl.textContent = 'Financial Summary' + rangeLabel;
    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="background:var(--accent-muted);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Total Revenue</div><div style="font-size:24px;font-weight:800;color:var(--success);margin-top:6px;">${money(revenue)}</div></div>
        <div style="background:var(--danger-soft);border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Total Expenses</div><div style="font-size:24px;font-weight:800;color:var(--danger);margin-top:6px;">${money(totalExpenses)}</div></div>
        <div style="background:${profit >= 0 ? 'var(--primary-light)' : 'var(--danger-soft)'};border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Net Profit</div><div style="font-size:24px;font-weight:800;color:${profit >= 0 ? 'var(--primary)' : 'var(--danger)'};margin-top:6px;">${money(profit)}</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Margin: ${grossMargin}%</div></div>
      </div>
      <h4 style="font-size:13px;font-weight:700;margin:0 0 10px;">Payments${rangeLabel}</h4>
      <table style="margin-bottom:24px;"><thead><tr><th>Date</th><th>Client</th><th>Amount</th><th>Method</th><th>Invoice</th></tr></thead><tbody>
        ${payments.slice(0, 50).map(p => { const client = currentData.clients.find(cx => cx.id === p.clientId); const inv = currentData.invoices.find(i => i.id === p.invoiceId); return `<tr><td>${formatDate(p.date)}</td><td>${client?.name || 'Unknown'}</td><td style="font-weight:600;color:var(--success);">${money(p.amount)}</td><td>${p.method}</td><td>${inv?.invoiceNo || '-'}</td></tr>`; }).join('')}
        ${payments.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No payments in range</td></tr>` : ''}
      </tbody></table>
      <h4 style="font-size:13px;font-weight:700;margin:0 0 10px;">Expenses${rangeLabel}</h4>
      <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead><tbody>
        ${expenses.slice(0, 50).map(e => `<tr><td>${formatDate(e.date)}</td><td>${e.category}</td><td>${e.description}</td><td style="font-weight:600;color:var(--danger);">${money(e.amount)}</td></tr>`).join('')}
        ${expenses.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:var(--text-light);">No expenses in range</td></tr>` : ''}
      </tbody></table>
    `;
  } else if (type === 'clients') {
    if (titleEl) titleEl.textContent = 'Client Report';
    html = `<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Total Clients: <strong>${currentData.clients.length}</strong></p>
      <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Type</th><th>Industry</th><th>Added</th></tr></thead><tbody>
        ${currentData.clients.map(c => `<tr><td style="font-weight:600;">${c.name}</td><td>${c.phone}</td><td>${c.email||'-'}</td><td>${c.type||'-'}</td><td>${c.industry||'-'}</td><td>${formatDate(c.createdAt)}</td></tr>`).join('')}
        ${currentData.clients.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--text-light);">No clients</td></tr>` : ''}
      </tbody></table>`;
  } else if (type === 'campaigns') {
    if (titleEl) titleEl.textContent = 'Campaign Report' + rangeLabel;
    html = `<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Total Campaigns: <strong>${campaigns.length}</strong></p>
      <table><thead><tr><th>Campaign</th><th>Client</th><th>Channel</th><th>Budget</th><th>Status</th></tr></thead><tbody>
        ${campaigns.map(camp => { const client = currentData.clients.find(c => c.id === camp.clientId); return `<tr><td style="font-weight:600;">${camp.name}</td><td>${client?.name||'Unknown'}</td><td>${camp.channel}</td><td>${money(camp.budget)}</td><td><span class="badge badge-${camp.status}">${camp.status}</span></td></tr>`; }).join('')}
        ${campaigns.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No campaigns in range</td></tr>` : ''}
      </tbody></table>`;
  } else if (type === 'outstanding') {
    if (titleEl) titleEl.textContent = 'Outstanding Balances';
    const outstanding = currentData.invoices.map(i => { const client = currentData.clients.find(c => c.id === i.clientId); const paid = currentData.payments.filter(p => p.invoiceId === i.id).reduce((a, b) => a + Number(b.amount || 0), 0); const balance = Number(i.amount) - paid; return { ...i, client, paid, balance }; }).filter(i => i.balance > 0);
    const totalOutstanding = outstanding.reduce((a, b) => a + b.balance, 0);
    html = `<div style="background:var(--danger-soft);border-radius:8px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:700;color:var(--danger);">Total Outstanding</span><span style="font-size:22px;font-weight:800;color:var(--danger);">${money(totalOutstanding)}</span></div>
      <table><thead><tr><th>Client</th><th>Invoice #</th><th>Invoice Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Overdue?</th></tr></thead><tbody>
        ${outstanding.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:var(--text-light);">No outstanding balances</td></tr>` : outstanding.map(i => { const overdue = i.dueDate && new Date(i.dueDate) < new Date(); return `<tr><td style="font-weight:600;">${i.client?.name || 'Unknown'}</td><td style="color:var(--primary);">${i.invoiceNo}</td><td>${money(i.amount)}</td><td style="color:var(--success);">${money(i.paid)}</td><td style="font-weight:700;color:var(--danger);">${money(i.balance)}</td><td>${formatDate(i.dueDate)}</td><td>${overdue ? '<span class="badge badge-rejected">Overdue</span>' : '<span class="badge badge-approved">On Time</span>'}</td></tr>`; }).join('')}
      </tbody></table>`;
  } else {
    html = '<p style="color:var(--text-muted);">Select another report type.</p>';
  }

  el.innerHTML = html || '<p style="color:var(--text-muted);">Report not found.</p>';
  addActivity('Report generated: ' + type);
}

// ==========================================
// REMAINING VIEWS (Simplified for brevity)
// ==========================================
function viewKanban() {
  if (!has('kanban')) return denied();
  const tasks = currentData.tasks || [];
  const users = currentData.users || [];
  
  return `${title('Kanban Board', 'Track tasks across the team')}
  <div class="card">
    <p style="color:var(--text-muted);">Kanban board renders full task management. Use the Tasks section for complete view.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;">
      ${['To Do','In Progress','Review','Completed'].map(status => {
        const statusTasks = tasks.filter(t => t.status === status);
        return `<div style="background:var(--surface2);border-radius:8px;padding:16px;">
          <div style="font-weight:700;margin-bottom:12px;color:var(--primary);">${status}</div>
          ${statusTasks.map(t => `<div style="background:white;border-radius:6px;padding:12px;margin-bottom:8px;font-size:13px;">${t.taskTitle}</div>`).join('') || '<p style="color:var(--text-light);font-size:12px;">No tasks</p>'}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function viewSettings() {
  if (!isSuperAdmin()) return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:16px;">
    <div style="font-size:40px;">🔐</div>
    <h2 style="font-size:20px;font-weight:800;">SuperAdmin Access Required</h2>
    <p style="color:var(--text-muted);font-size:14px;">System settings are restricted to SuperAdmin.</p>
    <div style="background:var(--primary-light);border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:12px 20px;font-size:13px;color:var(--primary);font-weight:600;">Your role: ${currentUser?.role}</div>
  </div>`;

  return `
    <div style="margin-bottom:20px;">
      <h1 style="font-size:22px;font-weight:800;color:var(--text);margin:0 0 3px;">System Settings</h1>
      <p style="color:var(--text-muted);font-size:13px;margin:0;">SuperAdmin console · ${APP_NAME} v${APP_VERSION}</p>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">⚙ Configuration</h3>
      <p style="color:var(--text-muted);">Use Settings → Branding/Currency/Tax for full configuration.</p>
    </div>
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 16px;">🔑 Security</h3>
      <button onclick="handleChangeMyPassword()" class="btn btn-secondary" style="margin-right:8px;">🔒 Change My Password</button>
      <button onclick="handleLogout()" class="btn" style="background:#ef4444;">→ Sign Out</button>
    </div>
  `;
}

function viewDocs() {
  return `
    ${title('Help & Documentation', `How to use ${APP_NAME}`)}
    <div class="card">
      <div class="doc-heading">📖 Overview</div>
      <div class="doc-text">${APP_NAME} is a comprehensive digital marketing agency management system. It covers client management, campaigns, projects, team tasks, invoicing, payments, and analytics.</div>
    </div>
  `;
}

function viewFinanceTracker() {
  if (!has('financeTracker')) return denied();
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const monthKey = thisYear + '-' + String(thisMonth + 1).padStart(2,'0');
  const mPayments = currentData.payments.filter(p => { if (!p.date) return false; const d = new Date(p.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
  const mExpenses = currentData.expenses.filter(e => { if (!e.date) return false; const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
  const monthIncome  = mPayments.reduce((a,b) => a + Number(b.amount||0), 0);
  const monthExpense = mExpenses.reduce((a,b) => a + Number(b.amount||0), 0);
  const monthNet    = monthIncome - monthExpense;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return `
    ${title('Finance Tracker', `${MONTHS[thisMonth]} ${thisYear}`)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
      <div class="stat-card green"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">This Month Income</div><div style="font-size:24px;font-weight:800;color:var(--success);">${money(monthIncome)}</div><div style="font-size:11px;color:var(--text-muted);">${mPayments.length} transactions</div></div>
      <div class="stat-card red"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">This Month Expenses</div><div style="font-size:24px;font-weight:800;color:var(--danger);">${money(monthExpense)}</div><div style="font-size:11px;color:var(--text-muted);">${mExpenses.length} items</div></div>
      <div class="stat-card ${monthNet>=0?'':'red'}"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Net This Month</div><div style="font-size:24px;font-weight:800;">${money(monthNet)}</div><div style="font-size:11px;color:var(--text-muted);">${monthNet>=0?'Surplus':'Deficit'}</div></div>
      <div class="stat-card" style="border:2px solid var(--primary);"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Running Balance</div><div style="font-size:24px;font-weight:800;">${money(calculateStats().profit)}</div><div style="font-size:11px;color:var(--text-muted);">All-time net</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div class="card"><h3 style="font-size:14px;font-weight:700;margin:0 0 12px;">6-Month Cash Flow</h3><div class="chart-container" style="height:200px;position:relative;"><canvas id="ftCashFlow"></canvas></div></div>
      <div class="card"><h3 style="font-size:14px;font-weight:700;margin:0 0 12px;">This Month by Category</h3><div class="chart-container" style="height:200px;position:relative;"><canvas id="ftExpCat"></canvas></div></div>
    </div>
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 14px;">Quick Add Transaction</h3>
      <div class="tab-bar" id="ftTxTabs" style="margin-bottom:14px;">
        <div class="tab active" onclick="ftSwitchTab('income',this)">💰 Income</div>
        <div class="tab" onclick="ftSwitchTab('expense',this)">📉 Expense</div>
      </div>
      <div id="ftTxForm">
        <form onsubmit="handleFtAddIncome(event)" style="display:flex;flex-direction:column;gap:10px;">
          <div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div>
          <div><label class="form-label">Client / Source</label><select name="clientId"><option value="">Direct / Other</option>${currentData.clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
          <div><label class="form-label">Method</label><select name="method"><option value="MoMo">MoMo</option><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Card">Card</option></select></div>
          <div><label class="form-label">Date</label><input name="date" type="date" value="${today()}"></div>
          <button type="submit" class="btn btn-full">Record Income</button>
        </form>
      </div>
    </div>
  `;
}

function ftSwitchTab(type, el) {
  document.querySelectorAll('#ftTxTabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const form = document.getElementById('ftTxForm');
  if (!form) return;
  if (type === 'income') {
    form.innerHTML = `<form onsubmit="handleFtAddIncome(event)" style="display:flex;flex-direction:column;gap:10px;"><div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div><div><label class="form-label">Client / Source</label><select name="clientId"><option value="">Direct / Other</option>${currentData.clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div><label class="form-label">Method</label><select name="method"><option value="MoMo">MoMo</option><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Card">Card</option></select></div><div><label class="form-label">Date</label><input name="date" type="date" value="${today()}"></div><button type="submit" class="btn btn-full">Record Income</button></form>`;
  } else {
    form.innerHTML = `<form onsubmit="handleFtAddExpense(event)" style="display:flex;flex-direction:column;gap:10px;"><div><label class="form-label">Amount *</label><input name="amount" type="number" placeholder="0.00" required min="0" step="0.01"></div><div><label class="form-label">Category *</label><select name="category" required><option value="">Select...</option>${['Equipment','Software','Travel','Marketing','Salaries','Utilities','Office Supplies','Training','Other'].map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div><div><label class="form-label">Description *</label><input name="description" placeholder="What was spent on?" required></div><div><label class="form-label">Date</label><input name="date" type="date" value="${today()}"></div><button type="submit" class="btn btn-full" style="background:var(--danger);">Record Expense</button></form>`;
  }
}

// ==========================================
// KANBAN (Simplified)
// ==========================================
const KANBAN_COLS = [
  { id: 'todo',       label: 'To Do',       color: '#64748b' },
  { id: 'inprogress', label: 'In Progress', color: '#6366f1' },
  { id: 'review',    label: 'In Review',  color: '#8b5cf6' },
  { id: 'completed', label: 'Completed',  color: '#10b981' },
];

function viewKanbanFull() {
  if (!has('kanban')) return denied();
  const tasks = currentData.tasks || [];
  
  return `
    ${title('Kanban Board', 'Track tasks')}
    <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:16px;">
      ${KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return `<div style="flex:0 0 280px;min-width:280px;background:var(--bg);border-radius:12px;padding:16px;">
          <div style="font-weight:700;margin-bottom:12px;color:${col.color};">${col.label} (${colTasks.length})</div>
          ${colTasks.map(t => `<div style="background:white;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;"><div style="font-weight:600;font-size:13px;">${t.taskTitle}</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${formatDate(t.deadline)}</div></div>`).join('') || '<p style="color:var(--text-light);font-size:12px;">No tasks</p>'}
        </div>`;
      }).join('')}
    </div>
  `;
}

function initKanbanDnd() {}

// ==========================================
// APP BOOT — Auth State Listener
// ==========================================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      currentUser = { id: user.uid, ...userDoc.data() };
      await loadCompanyData();
      render();
    } else {
      await db.collection('users').doc(user.uid).set({
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: 'ContentCreator',
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      currentUser = { id: user.uid, email: user.email, role: 'ContentCreator', active: true };
      await loadCompanyData();
      render();
    }
  } else {
    currentUser = null;
    await loadCompanyDataPublic();
    renderLogin();
  }
});