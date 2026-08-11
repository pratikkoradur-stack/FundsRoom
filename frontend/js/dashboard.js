// Dashboard Overview Analytics JS
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.location.pathname.endsWith('dashboard.html')) return;

  const revEl = document.getElementById('dash-total-revenue');
  const custEl = document.getElementById('dash-total-cust');
  const prodEl = document.getElementById('dash-total-prods');
  const lowStockCountEl = document.getElementById('dash-low-stock-count');

  const recentChallansTbody = document.getElementById('dash-recent-challans-tbody');
  const lowStockTbody = document.getElementById('dash-low-stock-tbody');

  try {
    const [custRes, prodRes, challanRes] = await Promise.all([
      apiRequest('/customers'),
      apiRequest('/products'),
      apiRequest('/challans'),
    ]);

    const customers = custRes.customers || [];
    const products = prodRes.products || [];
    const challans = challanRes.challans || [];

    // 1. Customer Count
    if (custEl) custEl.textContent = customers.length;

    // 2. Product Count & Low Stock Calculation
    if (prodEl) prodEl.textContent = products.length;

    const lowStockItems = products.filter(p => p.current_stock <= (p.min_stock_alert || 10));
    if (lowStockCountEl) lowStockCountEl.textContent = `${lowStockItems.length} Items`;

    // 3. Total Sales Revenue from Confirmed Challans
    let totalRevenue = 0;
    challans.forEach(ch => {
      if (ch.status === 'Confirmed' && Array.isArray(ch.items)) {
        ch.items.forEach((item) => {
          totalRevenue += (item.subtotal || (item.unit_price * item.quantity) || 0);
        });
      }
    });

    if (revEl) {
      revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    // 4. Render Recent Challans
    if (recentChallansTbody) {
      recentChallansTbody.innerHTML = '';
      if (challans.length === 0) {
        recentChallansTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No challans created yet.</td></tr>`;
      } else {
        challans.slice(0, 5).forEach(ch => {
          const custName = ch.customers ? (ch.customers.business_name || ch.customers.name) : 'N/A';
          const statusClass = ch.status === 'Confirmed' ? 'badge-confirmed' : ch.status === 'Cancelled' ? 'badge-cancelled' : 'badge-draft';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><code>${escapeHtml(ch.challan_number)}</code></td>
            <td>${escapeHtml(custName)}</td>
            <td>${ch.total_quantity}</td>
            <td><span class="badge ${statusClass}">${ch.status}</span></td>
          `;
          recentChallansTbody.appendChild(tr);
        });
      }
    }

    // 5. Render Low Stock Items
    if (lowStockTbody) {
      lowStockTbody.innerHTML = '';
      if (lowStockItems.length === 0) {
        lowStockTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--success);">All stock levels healthy!</td></tr>`;
      } else {
        lowStockItems.slice(0, 5).forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHtml(p.name)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(p.sku)}</small></td>
            <td><span class="badge badge-inactive">${p.current_stock} units</span></td>
            <td>${p.min_stock_alert || 10}</td>
          `;
          lowStockTbody.appendChild(tr);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard analytics:', err.message);
  }

  function escapeHtml(str) {
    return str ? String(str).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match])) : '';
  }
});
