/* ========================================
   PVL HUB — Centralized API Helper
   ======================================== */

const API_BASE = '/.netlify/functions';

const PVLApi = {
  /**
   * Generic fetch wrapper with auth
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('pvl_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `API error: ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // --- Auth ---
  async register(userData) {
    return this.request('auth-register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(email, password) {
    const data = await this.request('auth-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('pvl_token', data.token);
      localStorage.setItem('pvl_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('pvl_token');
    localStorage.removeItem('pvl_user');
    window.location.href = '/login.html';
  },

  getCurrentUser() {
    const userData = localStorage.getItem('pvl_user');
    return userData ? JSON.parse(userData) : null;
  },

  isLoggedIn() {
    return !!localStorage.getItem('pvl_token');
  },

  // --- Articles ---
  async getArticles(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`get-articles?${params}`);
  },

  // --- Videos ---
  async getVideos(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`get-videos?${params}`);
  },

  // --- Podcasts ---
  async getPodcasts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`get-podcasts?${params}`);
  },

  // --- Matches ---
  async getMatches(status) {
    const params = status ? `?status=${status}` : '';
    return this.request(`get-matches${params}`);
  },

  // --- Predictions ---
  async getPredictions(matchId) {
    return this.request(`get-predictions?match_id=${matchId}`);
  },

  async submitPrediction(predictions) {
    return this.request('submit-prediction', {
      method: 'POST',
      body: JSON.stringify(predictions)
    });
  },

  async getLeaderboard(period = 'alltime') {
    return this.request(`get-leaderboard?period=${period}`);
  },

  // --- Comments ---
  async getComments(contentType, contentId) {
    return this.request(`get-comments?content_type=${contentType}&content_id=${contentId}`);
  },

  async postComment(data) {
    return this.request('post-comment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- Ratings ---
  async getRatings(contentType, contentId) {
    return this.request(`get-ratings?content_type=${contentType}&content_id=${contentId}`);
  },

  async postRating(data) {
    return this.request('post-rating', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- Shop ---
  async getShopItems(category) {
    const params = category ? `?category=${category}` : '';
    return this.request(`get-shop-items${params}`);
  },

  // --- Profile ---
  async getUserProfile(userId) {
    return this.request(`get-user-profile?user_id=${userId}`);
  },

  async updateUserProfile(data) {
    return this.request('update-user-profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- Credits ---
  async getCredits() {
    return this.request('get-credits');
  },

  async transferCredits(data) {
    return this.request('transfer-credits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- Activity Tracking ---
  async trackActivity(activityType, contentId = null, metadata = {}) {
    return this.request('track-activity', {
      method: 'POST',
      body: JSON.stringify({
        activity_type: activityType,
        content_id: contentId,
        metadata
      })
    }).catch(() => {}); // Don't block on tracking failures
  },

  // --- Admin ---
  async getAdminDashboard(adminPassword) {
    return this.request('admin-dashboard', {
      method: 'POST',
      body: JSON.stringify({ password: adminPassword })
    });
  },

  // --- User Activity ---
  async getUserActivity(userId, limit = 20) {
    return this.request(`get-user-activity?user_id=${userId}&limit=${limit}`);
  }
};
