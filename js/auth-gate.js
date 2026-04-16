/* ========================================
   PVL HUB — Auth Gate
   Blocks game pages for unregistered users
   with a compelling signup push.
   ======================================== */

const AuthGate = {
  /**
   * Render the auth gate if user is not logged in.
   * @param {Object} config - { title, subtitle, perks: string[], icon }
   */
  guard(config = {}) {
    if (PVLApi.isLoggedIn()) return true;

    const {
      title = 'Join The Hub To Play',
      subtitle = 'Create a free account to unlock this game.',
      icon = '&#127918;',
      perks = [
        'Free to play — no credit card needed',
        'Earn credits across all 3 PVL games',
        'Climb leaderboards with other fans',
        'Track your stats, predictions & achievements',
      ]
    } = config;

    // Build the gate overlay
    const gate = document.createElement('div');
    gate.className = 'auth-gate-overlay';
    gate.innerHTML = `
      <div class="auth-gate-bg"></div>
      <div class="auth-gate-card">
        <div class="auth-gate-stripe"></div>
        <div class="auth-gate-icon-wrap">
          <span class="auth-gate-icon">${icon}</span>
        </div>
        <span class="auth-gate-kicker">
          <span class="dot"></span> Members Only
        </span>
        <h2 class="auth-gate-title">${title}</h2>
        <p class="auth-gate-subtitle">${subtitle}</p>

        <ul class="auth-gate-perks">
          ${perks.map(p => `
            <li>
              <span class="perk-check">&#10003;</span>
              <span>${p}</span>
            </li>
          `).join('')}
        </ul>

        <div class="auth-gate-actions">
          <a href="register.html" class="btn btn-primary btn-lg">
            Create Free Account <span class="arrow-bounce">&rarr;</span>
          </a>
          <a href="login.html" class="btn btn-secondary btn-lg">
            Log In
          </a>
        </div>

        <p class="auth-gate-footer">
          Already playing the Card Game or Manager Game?
          <a href="register.html">Link your account here.</a>
        </p>

        <div class="auth-gate-socialproof">
          <div class="sp-avatars">
            <span class="sp-avatar" style="background:linear-gradient(135deg,#ed1f24,#8b171b);">J</span>
            <span class="sp-avatar" style="background:linear-gradient(135deg,#f6b816,#c48d0c);">A</span>
            <span class="sp-avatar" style="background:linear-gradient(135deg,#045397,#022d56);">M</span>
            <span class="sp-avatar" style="background:linear-gradient(135deg,#8b5cf6,#5b3a9b);">R</span>
          </div>
          <div class="sp-text">
            <strong>12,438 fans</strong> already playing this season
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(gate);
    document.body.classList.add('auth-gate-active');

    // Blur the main content behind
    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.classList.add('auth-gate-blurred');

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    return false;
  }
};
