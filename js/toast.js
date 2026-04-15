/* ========================================
   PVL HUB — Toast Notification System
   ======================================== */

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '\u2705',
      error: '\u274C',
      info: '\u2139\uFE0F',
      credits: '\uD83E\uDE99'
    };

    toast.innerHTML = `
      <span>${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  credits(amount) {
    this.show(`+${amount} Credits earned!`, 'credits');
  }
};
