// Auth Logic for Login Page
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorAlert = document.getElementById('login-error');
  const testBtns = document.querySelectorAll('.test-login-btn');

  if (!loginForm) return;

  // If user is already logged in, redirect to dashboard.html
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Quick Test Buttons Handler
  testBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      document.getElementById('email').value = email;
      document.getElementById('password').value = 'admin123';
      performLogin(email, 'admin123');
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    performLogin(email, password);
  });

  async function performLogin(email, password) {
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';
      hideError();

      const data = await apiRequest('/auth/login', 'POST', { email, password });

      // Save token and user details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to main portal page
      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message || 'Login failed. Please check backend connection.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Portal';
    }
  }

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
  }
});
