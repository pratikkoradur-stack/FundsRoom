// Customer Management Module JS
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') return;

  const customersTableBody = document.getElementById('customers-tbody');
  const addCustomerBtn = document.getElementById('add-customer-btn');
  const modal = document.getElementById('customer-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const customerForm = document.getElementById('customer-form');
  const searchInput = document.getElementById('customer-search');
  const statusFilter = document.getElementById('status-filter');

  // Detail Modal Elements
  const detailModal = document.getElementById('customer-detail-modal');
  const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
  const addNoteForm = document.getElementById('add-note-form');

  let currentCustomerId = null;

  // Load Customers
  fetchCustomers();

  async function fetchCustomers() {
    try {
      let endpoint = '/customers';
      const params = new URLSearchParams();
      if (searchInput && searchInput.value) params.append('search', searchInput.value);
      if (statusFilter && statusFilter.value) params.append('status', statusFilter.value);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const res = await apiRequest(endpoint);
      renderCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err.message);
      if (customersTableBody) {
        customersTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load customers: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderCustomers(list) {
    if (!customersTableBody) return;
    customersTableBody.innerHTML = '';

    if (list.length === 0) {
      customersTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No customers found matching filter.</td></tr>`;
      return;
    }

    list.forEach(c => {
      const statusClass = c.status === 'Active' ? 'badge-active' : c.status === 'Lead' ? 'badge-lead' : 'badge-inactive';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHtml(c.business_name || c.name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(c.name)}</small></td>
        <td>${escapeHtml(c.mobile)}</td>
        <td>${escapeHtml(c.email || 'N/A')}</td>
        <td><span class="badge badge-draft">${escapeHtml(c.customer_type)}</span></td>
        <td><span class="badge ${statusClass}">${escapeHtml(c.status)}</span></td>
        <td>${c.follow_up_date || 'N/A'}</td>
        <td>
          <button class="btn btn-secondary btn-sm view-cust-btn" data-id="${c.id}">View / Notes</button>
        </td>
      `;
      customersTableBody.appendChild(row);
    });

    // Attach click handlers to View buttons
    document.querySelectorAll('.view-cust-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openCustomerDetailModal(id);
      });
    });
  }

  async function openCustomerDetailModal(id) {
    currentCustomerId = id;
    try {
      const res = await apiRequest(`/customers/${id}`);
      const cust = res.customer;

      document.getElementById('detail-cust-name').textContent = cust.business_name || cust.name;
      document.getElementById('detail-cust-contact').textContent = `${cust.name} | ${cust.mobile} | ${cust.email || 'No email'}`;
      document.getElementById('detail-cust-type').textContent = `${cust.customer_type} • Status: ${cust.status}`;
      document.getElementById('detail-cust-notes').textContent = cust.notes || 'No follow-up notes recorded yet.';
      document.getElementById('note-followup').value = cust.follow_up_date || '';

      if (detailModal) detailModal.classList.add('active');
    } catch (err) {
      alert('Error fetching customer details: ' + err.message);
    }
  }

  // Modal Controls
  if (addCustomerBtn && modal) {
    addCustomerBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (closeDetailModalBtn && detailModal) {
    closeDetailModalBtn.addEventListener('click', () => detailModal.classList.remove('active'));
  }

  // Add Customer Form Submit
  if (customerForm) {
    customerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('cust-name').value.trim(),
        business_name: document.getElementById('cust-business').value.trim(),
        mobile: document.getElementById('cust-mobile').value.trim(),
        email: document.getElementById('cust-email').value.trim() || null,
        customer_type: document.getElementById('cust-type').value,
        status: document.getElementById('cust-status').value,
        follow_up_date: document.getElementById('cust-followup').value || null,
      };

      try {
        await apiRequest('/customers', 'POST', payload);
        modal.classList.remove('active');
        customerForm.reset();
        fetchCustomers();
      } catch (err) {
        alert('Failed to save customer: ' + err.message);
      }
    });
  }

  // Add Note Form Submit
  if (addNoteForm) {
    addNoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentCustomerId) return;

      const noteText = document.getElementById('new-note-text').value.trim();
      const newFollowup = document.getElementById('note-followup').value || null;

      if (!noteText) return;

      try {
        await apiRequest(`/customers/${currentCustomerId}/notes`, 'POST', {
          note: noteText,
          follow_up_date: newFollowup,
        });

        document.getElementById('new-note-text').value = '';
        openCustomerDetailModal(currentCustomerId);
        fetchCustomers();
      } catch (err) {
        alert('Failed to add note: ' + err.message);
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', debounce(fetchCustomers, 300));
  if (statusFilter) statusFilter.addEventListener('change', fetchCustomers);

  function escapeHtml(str) {
    return str ? String(str).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match])) : '';
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
});
