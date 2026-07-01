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
    this.initOnboarding();
    this.injectPersonalizeNudge();
  },

  /**
   * First-run onboarding modal: for logged-in users who haven't personalized
   * yet, prompt them to follow teams right away. Shown once (until they act).
   */
  initOnboarding() {
    if (!PVLApi.isLoggedIn()) return;
    if (typeof PVLFav === 'undefined' || typeof PVLData === 'undefined') return;
    if (PVLFav.isPersonalized()) return;
    if (localStorage.getItem('pvl_onboarded') === '1') return;

    this._onboardingShown = true;

    const chips = PVLData.TEAMS.map((t) => {
      const logo = t.logo
        ? '<span class="fav-chip-logo"><img src="' + t.logo + '" alt="' + t.short + '"></span>'
        : '<span class="fav-chip-logo fallback">' + t.abbr + '</span>';
      return '<div class="fav-chip" data-team="' + t.name + '">' + logo + '<span>' + t.short + '</span></div>';
    }).join('');

    const backdrop = document.createElement('div');
    backdrop.className = 'pvl-onboard-backdrop';
    backdrop.id = 'pvl-onboard';
    backdrop.innerHTML =
      '<div class="pvl-onboard-modal">' +
        '<div class="pvl-onboard-head">' +
          '<h2>&#11088; Welcome to PVL Hub!</h2>' +
          '<p>Follow your favorite teams to get game reminders, ticket links, and a feed built just for you.</p>' +
        '</div>' +
        '<div class="fav-picker pvl-onboard-teams">' + chips + '</div>' +
        '<div class="pvl-onboard-actions">' +
          '<button class="btn btn-primary" id="pvl-onboard-save">Personalize my hub</button>' +
          '<button class="btn btn-secondary" id="pvl-onboard-skip">Skip for now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);

    backdrop.querySelectorAll('.fav-chip').forEach((chip) => {
      chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });

    const finish = () => { localStorage.setItem('pvl_onboarded', '1'); backdrop.remove(); };

    backdrop.querySelector('#pvl-onboard-skip').addEventListener('click', finish);
    backdrop.querySelector('#pvl-onboard-save').addEventListener('click', () => {
      const teams = Array.prototype.map.call(
        backdrop.querySelectorAll('.fav-chip.selected'), (c) => c.dataset.team);
      if (teams.length && PVLFav.setTeams) PVLFav.setTeams(teams);
      finish();
      if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(teams.length ? 'Your feed is personalized! Check "My Feed".'
          : 'You can personalize anytime from My Feed.', 'success');
      }
      if (typeof PVLNotify !== 'undefined' && PVLNotify.refreshBadge) PVLNotify.refreshBadge();
      if (typeof renderForYou === 'function') { try { renderForYou(); } catch (e) { /* ignore */ } }
    });
  },

  /**
   * Site-wide nudge encouraging logged-in users who haven't personalized yet
   * to follow their favorite teams. Dismissible; hidden once they personalize.
   */
  injectPersonalizeNudge() {
    if (!PVLApi.isLoggedIn()) return;
    if (typeof PVLFav === 'undefined' || !PVLFav.isPersonalized) return;
    if (PVLFav.isPersonalized()) return;
    if (this._onboardingShown) return; // don't stack under the onboarding modal
    if (localStorage.getItem('pvl_onboarded') !== '1') return; // only after onboarding seen
    if (localStorage.getItem('pvl_nudge_dismissed') === '1') return;

    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'myfeed.html') return; // they're already in the right place
    if (document.getElementById('personalize-nudge')) return;

    const nav = document.querySelector('.navbar');
    if (!nav) return;

    const bar = document.createElement('div');
    bar.id = 'personalize-nudge';
    bar.className = 'personalize-nudge';
    bar.innerHTML =
      '<div class="container personalize-nudge-inner">' +
        '<span class="pn-text">&#11088; Make PVL Hub yours — follow your favorite teams for game reminders, tickets &amp; a personalized feed.</span>' +
        '<span class="pn-actions">' +
          '<a href="myfeed.html" class="btn btn-primary btn-sm">Set up my feed</a>' +
          '<button class="pn-dismiss" aria-label="Dismiss">&times;</button>' +
        '</span>' +
      '</div>';
    nav.insertAdjacentElement('afterend', bar);

    const dismiss = bar.querySelector('.pn-dismiss');
    if (dismiss) dismiss.addEventListener('click', () => {
      localStorage.setItem('pvl_nudge_dismissed', '1');
      bar.remove();
    });
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

      // Add a "My Feed" nav link for logged-in users (site-wide, no per-page edit)
      const navLinksEl = document.getElementById('nav-links');
      if (navLinksEl && !document.getElementById('nav-feed-link')) {
        const feedLink = document.createElement('a');
        feedLink.href = 'myfeed.html';
        feedLink.id = 'nav-feed-link';
        feedLink.textContent = 'My Feed';
        // Insert right after the Home link
        const homeLink = navLinksEl.querySelector('a');
        if (homeLink && homeLink.nextSibling) navLinksEl.insertBefore(feedLink, homeLink.nextSibling);
        else navLinksEl.appendChild(feedLink);
      }

      // Show admin nav link for admins
      if (user.is_admin) {
        const navLinks = document.getElementById('nav-links');
        if (navLinks && !document.getElementById('nav-admin-link')) {
          const adminLink = document.createElement('a');
          adminLink.href = 'admin-cms.html';
          adminLink.id = 'nav-admin-link';
          adminLink.textContent = 'Admin';
          adminLink.style.color = 'var(--pvl-red-light)';
          navLinks.appendChild(adminLink);
        }
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
