// Product & Inventory Management Module JS
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') return;

  const productsTableBody = document.getElementById('products-tbody');
  const addProductBtn = document.getElementById('add-product-btn');
  const modal = document.getElementById('product-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const productForm = document.getElementById('product-form');
  const searchInput = document.getElementById('product-search');
  const lowStockFilter = document.getElementById('low-stock-filter');

  // Stock Adjustment Modal Elements
  const stockModal = document.getElementById('stock-modal');
  const closeStockModalBtn = document.getElementById('close-stock-modal-btn');
  const stockForm = document.getElementById('stock-form');

  // Movement Log Modal Elements
  const logModal = document.getElementById('log-modal');
  const closeLogModalBtn = document.getElementById('close-log-modal-btn');
  const logList = document.getElementById('movement-log-list');

  let currentProductId = null;

  fetchProducts();

  async function fetchProducts() {
    try {
      let endpoint = '/products';
      const params = new URLSearchParams();
      if (searchInput && searchInput.value) params.append('search', searchInput.value);
      if (lowStockFilter && lowStockFilter.checked) params.append('low_stock', 'true');

      if (params.toString()) endpoint += `?${params.toString()}`;

      const res = await apiRequest(endpoint);
      renderProducts(res.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err.message);
      if (productsTableBody) {
        productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load products: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderProducts(list) {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '';

    if (list.length === 0) {
      productsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found in inventory catalog.</td></tr>`;
      return;
    }

    list.forEach(p => {
      const isLowStock = p.current_stock <= (p.min_stock_alert || 10);
      const stockBadge = isLowStock 
        ? `<span class="badge badge-inactive">Low Stock (${p.current_stock})</span>`
        : `<span class="badge badge-active">${p.current_stock} units</span>`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><code>${escapeHtml(p.sku)}</code></td>
        <td><span class="badge badge-draft">${escapeHtml(p.category)}</span></td>
        <td>₹${Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>${stockBadge}</td>
        <td>${escapeHtml(p.location || 'Warehouse')}</td>
        <td style="display: flex; gap: 0.4rem;">
          <button class="btn btn-secondary btn-sm adjust-stock-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Adjust Stock</button>
          <button class="btn btn-secondary btn-sm view-log-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Logs</button>
        </td>
      `;
      productsTableBody.appendChild(row);
    });

    // Attach click handlers
    document.querySelectorAll('.adjust-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentProductId = btn.getAttribute('data-id');
        const prodName = btn.getAttribute('data-name');
        document.getElementById('stock-prod-title').textContent = `Adjust Stock: ${prodName}`;
        if (stockModal) stockModal.classList.add('active');
      });
    });

    document.querySelectorAll('.view-log-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prodName = btn.getAttribute('data-name');
        openMovementLogModal(id, prodName);
      });
    });
  }

  async function openMovementLogModal(id, prodName) {
    document.getElementById('log-prod-title').textContent = `Stock Movement Logs: ${prodName}`;
    if (logList) logList.innerHTML = '<p style="color: var(--text-muted);">Loading logs...</p>';
    if (logModal) logModal.classList.add('active');

    try {
      const res = await apiRequest(`/products/${id}/movements`);
      const logs = res.movements || [];

      if (logs.length === 0) {
        logList.innerHTML = '<p style="color: var(--text-muted);">No stock movement logs found for this product.</p>';
        return;
      }

      logList.innerHTML = logs.map(m => `
        <div style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem;">
            <span class="${m.movement_type === 'IN' ? 'badge badge-active' : 'badge badge-inactive'}">${m.movement_type} ${m.quantity} Units</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(m.created_at).toLocaleString()}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-primary); margin-top: 0.4rem;">Reason: ${escapeHtml(m.reason || 'N/A')}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">By: ${escapeHtml(m.users ? m.users.name : 'Staff')}</p>
        </div>
      `).join('');
    } catch (err) {
      if (logList) logList.innerHTML = `<p style="color: var(--danger);">Failed to load logs: ${err.message}</p>`;
    }
  }

  // Modal Controls
  if (addProductBtn && modal) {
    addProductBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (closeStockModalBtn && stockModal) {
    closeStockModalBtn.addEventListener('click', () => stockModal.classList.remove('active'));
  }
  if (closeLogModalBtn && logModal) {
    closeLogModalBtn.addEventListener('click', () => logModal.classList.remove('active'));
  }

  // Product Form Submit
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('prod-name').value.trim(),
        sku: document.getElementById('prod-sku').value.trim(),
        category: document.getElementById('prod-category').value.trim(),
        unit_price: parseFloat(document.getElementById('prod-price').value),
        current_stock: parseInt(document.getElementById('prod-stock').value, 10) || 0,
        min_stock_alert: parseInt(document.getElementById('prod-alert').value, 10) || 10,
        location: document.getElementById('prod-location').value.trim() || null,
      };

      try {
        await apiRequest('/products', 'POST', payload);
        modal.classList.remove('active');
        productForm.reset();
        fetchProducts();
      } catch (err) {
        alert('Failed to save product: ' + err.message);
      }
    });
  }

  // Stock Form Submit
  if (stockForm) {
    stockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentProductId) return;

      const payload = {
        movement_type: document.getElementById('stock-type').value,
        quantity: parseInt(document.getElementById('stock-qty').value, 10),
        reason: document.getElementById('stock-reason').value.trim(),
      };

      try {
        await apiRequest(`/products/${currentProductId}/stock`, 'POST', payload);
        stockModal.classList.remove('active');
        stockForm.reset();
        fetchProducts();
      } catch (err) {
        alert('Stock Adjustment Failed: ' + err.message);
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => fetchProducts());
  if (lowStockFilter) lowStockFilter.addEventListener('change', () => fetchProducts());

  function escapeHtml(str) {
    return str ? String(str).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match])) : '';
  }
});
