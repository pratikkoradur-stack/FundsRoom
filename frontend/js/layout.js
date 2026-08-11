// Shared Layout Injector & Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('login.html');
  const isWelcomePage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';

  // Skip layout injection for login page and welcome page
  if (isLoginPage) {
    if (typeof gsap !== 'undefined') {
      gsap.from('.login-card', {
        duration: 0.8,
        y: 40,
        opacity: 0,
        ease: 'power3.out',
      });
    }
    return;
  }

  if (isWelcomePage) return;

  // Auth Protection Check for admin pages
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  let user = { name: 'User', role: 'sales', email: 'user@company.com' };
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user session');
    }
  }

  // Inject Layout Shell
  renderLayout(user);

  // Run GSAP Entrance Animations
  if (typeof gsap !== 'undefined') {
    gsap.from('.sidebar', {
      duration: 0.7,
      x: -260,
      ease: 'power3.out',
    });

    gsap.from('.top-header', {
      duration: 0.6,
      y: -50,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.2,
    });

    gsap.from('.content-area', {
      duration: 0.6,
      y: 30,
      opacity: 0,
      ease: 'power3.out',
      delay: 0.3,
    });
  }
});

function renderLayout(user) {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;

  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

  const sidebarHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">E</div>
        <div>Fundsroom <span>ERP</span></div>
      </div>

      <nav class="sidebar-menu">
        <div class="menu-label">Main Navigation</div>
        
        <a href="dashboard.html" class="nav-link ${currentPath === 'dashboard.html' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
          Analytics Dashboard
        </a>

        <div class="menu-label" style="margin-top: 0.5rem;">Core Modules</div>

        <a href="customers.html" class="nav-link ${currentPath === 'customers.html' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Customers (CRM)
        </a>

        <a href="products.html" class="nav-link ${currentPath === 'products.html' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          Products & Inventory
        </a>

        <a href="challans.html" class="nav-link ${currentPath === 'challans.html' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Sales Challans
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-badge">
          <div class="avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <span class="user-name">${user.name || 'User'}</span>
            <span class="user-role">${user.role || 'Sales'}</span>
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
