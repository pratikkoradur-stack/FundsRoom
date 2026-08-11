// Auth Logic & Micro-Interactions for Login Page
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('login-error');
  const submitBtn = document.getElementById('submit-btn');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const eyeShowIcon = document.getElementById('eye-show-icon');
  const eyeHideIcon = document.getElementById('eye-hide-icon');
  const testBtns = document.querySelectorAll('.test-login-btn');
  const googleBtn = document.getElementById('google-btn');
  const createAccountBtn = document.getElementById('create-account-btn');

  // Video elements
  const video = document.getElementById('auth-video');
  const videoPlayToggle = document.getElementById('video-play-toggle');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');
  const videoTimer = document.getElementById('video-timer');
  const videoProgressFill = document.getElementById('video-progress-fill');
  const floatingSoundToggle = document.getElementById('floating-sound-toggle');
  const soundOffIcon = document.getElementById('sound-off-icon');
  const soundOnIcon = document.getElementById('sound-on-icon');

  // Redirect if already logged in
  if (localStorage.getItem('token') && loginForm) {
    const userJson = localStorage.getItem('user');
    let userRole = 'admin';
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        userRole = parsed.role || 'admin';
      } catch (e) {}
    }
    window.location.href = `dashboard.html?role=${userRole}`;
    return;
  }

  // Password Toggle Handler
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      if (eyeShowIcon && eyeHideIcon) {
        eyeShowIcon.style.display = isPassword ? 'none' : 'block';
        eyeHideIcon.style.display = isPassword ? 'block' : 'none';
      }
    });
  }

  // Quick 4 Role Login Buttons Handler
  testBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      if (emailInput) emailInput.value = email;
      if (passwordInput) passwordInput.value = 'admin123';
      performLogin(email, 'admin123');
    });
  });

  // Google Login Placeholder
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      showError('Google Single Sign-On will be configured with production OAuth credentials.');
    });
  }

  // Create Account Placeholder
  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showError('Account registration is currently restricted to Admin invitation.');
    });
  }

  // Form Submit Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      performLogin(email, password);
    });
  }

  // Perform Login Procedure
  async function performLogin(email, password) {
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    try {
      setLoadingState(true);
      hideError();

      const data = await apiRequest('/auth/login', 'POST', { email, password });

      // Save token and user details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Visual success state
      if (submitBtn) {
        submitBtn.innerHTML = `
          <span>Signed In! Redirecting...</span>
          <svg viewBox="0 0 24 24" style="stroke: #3F7A55;"><polyline points="20 6 9 17 4 12"/></svg>
        `;
      }

      // Role-Based Redirect Navigation
      const role = (data.user && data.user.role) ? data.user.role.toLowerCase() : 'admin';

      setTimeout(() => {
        window.location.href = `dashboard.html?role=${role}`;
      }, 600);

    } catch (err) {
      showError(err.message || 'Authentication failed. Please check your credentials.');
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.innerHTML = `
        <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
        <span>Signing in...</span>
      `;
    } else {
      submitBtn.innerHTML = `
        <span>Sign In</span>
        <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      `;
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

  // ================================================
  // Video Player Controls & Progress Animation
  // ================================================
  if (video) {
    // Time & Progress update
    video.addEventListener('timeupdate', () => {
      const current = video.currentTime || 0;
      const duration = video.duration || 6;

      if (videoTimer) {
        const curMin = Math.floor(current / 60).toString().padStart(2, '0');
        const curSec = Math.floor(current % 60).toString().padStart(2, '0');
        const durMin = Math.floor(duration / 60).toString().padStart(2, '0');
        const durSec = Math.floor(duration % 60).toString().padStart(2, '0');
        videoTimer.textContent = `${curMin}:${curSec} / ${durMin}:${durSec}`;
      }

      if (videoProgressFill && duration > 0) {
        const pct = (current / duration) * 100;
        videoProgressFill.style.width = `${pct}%`;
      }
    });

    // Play / Pause Toggle
    if (videoPlayToggle) {
      videoPlayToggle.addEventListener('click', () => {
        if (video.paused) {
          video.play();
          if (pauseIcon) pauseIcon.style.display = 'block';
          if (playIcon) playIcon.style.display = 'none';
        } else {
          video.pause();
          if (pauseIcon) pauseIcon.style.display = 'none';
          if (playIcon) playIcon.style.display = 'block';
        }
      });
    }

    // Sound Toggle
    if (floatingSoundToggle) {
      floatingSoundToggle.addEventListener('click', () => {
        video.muted = !video.muted;
        if (soundOffIcon && soundOnIcon) {
          soundOffIcon.style.display = video.muted ? 'block' : 'none';
          soundOnIcon.style.display = video.muted ? 'none' : 'block';
        }
      });
    }
  }
});

// Inject keyframe animation for spinner if missing
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
