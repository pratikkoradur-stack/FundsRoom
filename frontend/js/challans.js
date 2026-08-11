// Sales Challans Module JS with Print-Ready Invoice Support
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') return;

  const challansTableBody = document.getElementById('challans-tbody');
  const addChallanBtn = document.getElementById('add-challan-btn');
  const modal = document.getElementById('challan-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const challanForm = document.getElementById('challan-form');
  const statusFilter = document.getElementById('challan-status-filter');
  const itemsContainer = document.getElementById('challan-items-container');
  const addItemBtn = document.getElementById('add-item-row-btn');

  // Detail Modal
  const detailModal = document.getElementById('challan-detail-modal');
  const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');

  // Invoice Modal
  const invoiceModal = document.getElementById('invoice-modal');
  const closeInvoiceModalBtn = document.getElementById('close-invoice-modal-btn');
  const openPrintInvoiceBtn = document.getElementById('open-print-invoice-btn');

  let availableCustomers = [];
  let availableProducts = [];
  let currentChallanId = null;
  let currentChallanData = null;

  fetchChallans();
  loadDropdownData();

  async function loadDropdownData() {
    try {
      const [custRes, prodRes] = await Promise.all([
        apiRequest('/customers'),
        apiRequest('/products'),
      ]);

      availableCustomers = custRes.customers || [];
      availableProducts = prodRes.products || [];

      populateCustomerDropdown();
    } catch (err) {
      console.warn('Error loading customers or products for challan modal:', err.message);
    }
  }

  function populateCustomerDropdown() {
    const custSelect = document.getElementById('challan-cust-id');
    if (!custSelect) return;

    custSelect.innerHTML = '<option value="">-- Choose Customer --</option>';
    availableCustomers.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.business_name || c.name} (${c.customer_type})`;
      custSelect.appendChild(option);
    });
  }

  async function fetchChallans() {
    try {
      let endpoint = '/challans';
      if (statusFilter && statusFilter.value) {
        endpoint += `?status=${encodeURIComponent(statusFilter.value)}`;
      }
      const res = await apiRequest(endpoint);
      renderChallans(res.challans || []);
    } catch (err) {
      console.error('Failed to fetch challans:', err.message);
      if (challansTableBody) {
        challansTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load sales challans: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderChallans(list) {
    if (!challansTableBody) return;
    challansTableBody.innerHTML = '';

    if (list.length === 0) {
      challansTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No sales challans found.</td></tr>`;
      return;
    }

    list.forEach(ch => {
      const custName = ch.customers ? (ch.customers.business_name || ch.customers.name) : 'N/A';
      const statusClass = ch.status === 'Confirmed' ? 'badge-confirmed' : ch.status === 'Cancelled' ? 'badge-cancelled' : 'badge-draft';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><code>${escapeHtml(ch.challan_number)}</code></td>
        <td><strong>${escapeHtml(custName)}</strong></td>
        <td>${ch.total_quantity} units</td>
        <td><span class="badge ${statusClass}">${escapeHtml(ch.status)}</span></td>
        <td>${new Date(ch.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-secondary btn-sm view-challan-btn" data-id="${ch.id}">View / Actions</button>
        </td>
      `;
      challansTableBody.appendChild(row);
    });

    document.querySelectorAll('.view-challan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openChallanDetailModal(id);
      });
    });
  }

  async function openChallanDetailModal(id) {
    currentChallanId = id;
    try {
      const res = await apiRequest(`/challans/${id}`);
      const ch = res.challan;
      currentChallanData = ch;

      document.getElementById('detail-challan-num').textContent = `Challan #${ch.challan_number}`;
      document.getElementById('detail-challan-meta').textContent = `Customer: ${ch.customers ? (ch.customers.business_name || ch.customers.name) : 'N/A'} | Status: ${ch.status} | Created By: ${ch.users ? ch.users.name : 'Staff'}`;

      const itemsTable = document.getElementById('detail-challan-items-tbody');
      itemsTable.innerHTML = '';

      let grandTotal = 0;
      (ch.items || []).forEach(item => {
        const sub = (item.unit_price || 0) * (item.quantity || 0);
        grandTotal += sub;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(item.name)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(item.sku)}</small></td>
          <td>₹${Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td>${item.quantity}</td>
          <td>₹${sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        `;
        itemsTable.appendChild(tr);
      });

      document.getElementById('detail-challan-total').textContent = `Total Qty: ${ch.total_quantity} units | Total Amount: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

      const confirmBtn = document.getElementById('confirm-draft-btn');
      const cancelBtn = document.getElementById('cancel-challan-btn');

      if (ch.status === 'Draft') {
        if (confirmBtn) confirmBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      } else if (ch.status === 'Confirmed') {
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      } else {
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
      }

      if (detailModal) detailModal.classList.add('active');
    } catch (err) {
      alert('Failed to load challan detail: ' + err.message);
    }
  }

  // Populate Printable Invoice Modal
  function populateInvoiceModal(ch) {
    if (!ch) return;

    document.getElementById('inv-num').textContent = `INVOICE #${ch.challan_number}`;
    document.getElementById('inv-date').textContent = `Date: ${new Date(ch.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    document.getElementById('inv-status-badge').textContent = `Status: ${ch.status}`;

    const cust = ch.customers || {};
    document.getElementById('inv-cust-name').textContent = cust.business_name || cust.name || 'Valued Customer';
    document.getElementById('inv-cust-type').textContent = `Customer Type: ${cust.customer_type || 'Retail'}`;
    document.getElementById('inv-cust-phone').textContent = `Mobile: ${cust.mobile || 'N/A'}`;
    document.getElementById('inv-cust-email').textContent = `Email: ${cust.email || 'N/A'}`;

    document.getElementById('inv-creator').textContent = ch.users ? `${ch.users.name} (${ch.users.role})` : 'Staff';

    const invItemsTable = document.getElementById('inv-items-tbody');
    invItemsTable.innerHTML = '';

    let rawSubtotal = 0;
    (ch.items || []).forEach((item, index) => {
      const sub = (item.unit_price || 0) * (item.quantity || 0);
      rawSubtotal += sub;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(item.name)}</strong><br><small style="color: #64748b;">SKU: ${escapeHtml(item.sku)}</small></td>
        <td>₹${Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>${item.quantity}</td>
        <td>₹${sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      `;
      invItemsTable.appendChild(tr);
    });

    const cgst = rawSubtotal * 0.09;
    const sgst = rawSubtotal * 0.09;
    const grandTotal = rawSubtotal + cgst + sgst;

    document.getElementById('inv-subtotal').textContent = `₹${rawSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('inv-cgst').textContent = `₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('inv-sgst').textContent = `₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('inv-grandtotal').textContent = `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (invoiceModal) invoiceModal.classList.add('active');
  }

  if (openPrintInvoiceBtn) {
    openPrintInvoiceBtn.addEventListener('click', () => {
      if (currentChallanData) {
        populateInvoiceModal(currentChallanData);
      }
    });
  }

  // Dynamic Item Row Management
  if (addItemBtn && itemsContainer) {
    addItemBtn.addEventListener('click', () => addItemRow());
  }

  function addItemRow() {
    const row = document.createElement('div');
    row.className = 'challan-item-row';
    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';

    const prodOptions = availableProducts.map(p => 
      `<option value="${p.id}" data-price="${p.unit_price}" data-stock="${p.current_stock}">${escapeHtml(p.name)} (${p.current_stock} in stock)</option>`
    ).join('');

    row.innerHTML = `
      <select class="form-control item-product-id" required>
        <option value="">-- Select Product --</option>
        ${prodOptions}
      </select>
      <input type="number" class="form-control item-qty" min="1" value="1" placeholder="Qty" required>
      <input type="text" class="form-control item-subtotal" value="₹0.00" readonly style="background: var(--bg-main);">
      <button type="button" class="btn btn-danger btn-sm remove-row-btn" style="padding: 0.5rem;">&times;</button>
    `;

    itemsContainer.appendChild(row);

    const prodSelect = row.querySelector('.item-product-id');
    const qtyInput = row.querySelector('.item-qty');
    const subInput = row.querySelector('.item-subtotal');
    const removeBtn = row.querySelector('.remove-row-btn');

    function updateSub() {
      const selectedOption = prodSelect.options[prodSelect.selectedIndex];
      const price = parseFloat(selectedOption.getAttribute('data-price') || '0');
      const qty = parseInt(qtyInput.value, 10) || 0;
      subInput.value = `₹${(price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    prodSelect.addEventListener('change', updateSub);
    qtyInput.addEventListener('input', updateSub);
    removeBtn.addEventListener('click', () => {
      if (itemsContainer.children.length > 1) {
        row.remove();
      } else {
        alert('Challan must contain at least one product row.');
      }
    });
  }

  // Modal Controls
  if (addChallanBtn && modal) {
    addChallanBtn.addEventListener('click', () => {
      loadDropdownData();
      if (itemsContainer) {
        itemsContainer.innerHTML = '';
        addItemRow();
      }
      modal.classList.add('active');
    });
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (closeDetailModalBtn && detailModal) {
    closeDetailModalBtn.addEventListener('click', () => detailModal.classList.remove('active'));
  }
  if (closeInvoiceModalBtn && invoiceModal) {
    closeInvoiceModalBtn.addEventListener('click', () => invoiceModal.classList.remove('active'));
  }

  // Create Challan Form Submit
  if (challanForm) {
    challanForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customer_id = document.getElementById('challan-cust-id').value;
      const status = document.getElementById('challan-status').value;

      const itemRows = document.querySelectorAll('.challan-item-row');
      const items = [];

      itemRows.forEach(row => {
        const product_id = row.querySelector('.item-product-id').value;
        const quantity = parseInt(row.querySelector('.item-qty').value, 10);
        if (product_id && quantity > 0) {
          items.push({ product_id, quantity });
        }
      });

      if (!customer_id || items.length === 0) {
        alert('Please select a customer and at least one valid product item.');
        return;
      }

      try {
        const res = await apiRequest('/challans', 'POST', { customer_id, items, status });
        alert(res.message);
        modal.classList.remove('active');
        challanForm.reset();
        fetchChallans();
      } catch (err) {
        alert('Failed to Create Sales Challan: ' + err.message);
      }
    });
  }

  // Confirm Draft Challan Action
  const confirmBtn = document.getElementById('confirm-draft-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!currentChallanId) return;
      if (!confirm('Are you sure you want to CONFIRM this Sales Challan? Stock will be deducted from inventory immediately.')) return;

      try {
        const res = await apiRequest(`/challans/${currentChallanId}/status`, 'PUT', { status: 'Confirmed' });
        alert(res.message);
        detailModal.classList.remove('active');
        fetchChallans();
      } catch (err) {
        alert('Confirmation Failed: ' + err.message);
      }
    });
  }

  // Cancel Challan Action
  const cancelBtn = document.getElementById('cancel-challan-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      if (!currentChallanId) return;
      if (!confirm('Are you sure you want to CANCEL this Sales Challan? If confirmed previously, inventory stock will be restored.')) return;

      try {
        const res = await apiRequest(`/challans/${currentChallanId}/status`, 'PUT', { status: 'Cancelled' });
        alert(res.message);
        detailModal.classList.remove('active');
        fetchChallans();
      } catch (err) {
        alert('Cancellation Failed: ' + err.message);
      }
    });
  }

  if (statusFilter) statusFilter.addEventListener('change', fetchChallans);

  function escapeHtml(str) {
    return str ? String(str).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match])) : '';
  }
});
