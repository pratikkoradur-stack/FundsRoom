// Shared Layout Injector & Navigation Handler for Admin Module Pages
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('login.html');
  const isWelcomePage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';
  const isDashboardPage = currentPath.endsWith('dashboard.html');

  // Skip layout injection for login and welcome pages
  if (isLoginPage || isWelcomePage) return;

  // Auth Protection Check for admin module pages
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let user = { name: 'Admin', role: 'Administrator', email: 'admin@company.com' };
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {}
  }

  // Inject Layout Shell Sidebar for pages other than standalone dashboard
  if (!isDashboardPage) {
    renderLayout(user);
  }
});

function renderLayout(user) {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;

  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  const userName = user.name || 'Admin';
  const avatarInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'A';
  const userRole = user.role || 'Administrator';

  const sidebarHTML = `
    <aside class="sidebar">
      <div>
        <a href="dashboard.html" class="sidebar-brand">
          <div class="sidebar-brand-icon">F</div>
          <div>
            FUNDROOM ERP
            <span>WHOLESALE OPERATIONS</span>
          </div>
        </a>

        <nav class="sidebar-menu">
          <div class="menu-label">Main Navigation</div>

          <a href="dashboard.html" class="nav-link ${currentPath === 'dashboard.html' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Dashboard
          </a>

          <a href="customers.html" class="nav-link ${currentPath === 'customers.html' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            Customers (CRM)
          </a>

          <a href="products.html" class="nav-link ${currentPath === 'products.html' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Products & Inventory
          </a>

          <a href="challans.html" class="nav-link ${currentPath === 'challans.html' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Sales Challans
          </a>

          <div style="height: 1px; background: var(--border-color); margin: 1rem 0.5rem;"></div>

          <a href="#" class="nav-link">
            <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Reports
          </a>

          <a href="#" class="nav-link">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Activity Log
          </a>

          <a href="#" class="nav-link">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="user-badge">
          <div class="avatar">${avatarInitials}</div>
          <div class="user-info">
            <span class="user-name">${userName}</span>
            <span class="user-role">${userRole}</span>
          </div>
        </div>
        <button id="logout-btn" class="btn btn-danger btn-sm" style="width: 100%;">
          Logout Portal
        </button>
      </div>
    </aside>
  `;

  appContainer.insertAdjacentHTML('afterbegin', sidebarHTML);

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });
}
