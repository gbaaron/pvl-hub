/* ========================================
   PVL HUB — Auth & Navigation Manager
   ======================================== */

const Auth = {
  init() {
    this.injectBgDecor();
    this.updateNavUI();
    this.initThemeToggle();
    this.initMobileNav();
    this.initScrollReveal();
  },

  /**
   * Inject floating background decorations (fixed, site-wide)
   */
  injectBgDecor() {
    if (document.querySelector('.bg-decor')) return;
    const decor = document.createElement('div');
    decor.className = 'bg-decor';
    document.body.insertBefore(decor, document.body.firstChild);
  },

  updateNavUI() {
    const user = PVLApi.getCurrentUser();
    const authBtns = document.getElementById('nav-auth-buttons');
    const userNav = document.getElementById('nav-user-section');
    const creditsEl = document.getElementById('nav-credits-amount');

    if (!authBtns || !userNav) return;

    if (user) {
      authBtns.classList.add('hidden');
      userNav.classList.remove('hidden');
      if (creditsEl) creditsEl.textContent = (user.credits || 0).toLocaleString();

      const avatarEl = document.getElementById('nav-avatar');
      if (avatarEl) {
        avatarEl.textContent = (user.display_name || user.username || 'U')[0].toUpperCase();
      }
    } else {
      authBtns.classList.remove('hidden');
      userNav.classList.add('hidden');
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  },

  initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const saved = localStorage.getItem('pvl_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    toggle.textContent = saved === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('pvl_theme', next);
      toggle.textContent = next === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    });
  },

  initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  },

  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  requireAuth() {
    if (!PVLApi.isLoggedIn()) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Auth.init());
