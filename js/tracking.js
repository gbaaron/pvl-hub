/* ========================================
   PVL HUB — Activity Tracking Module
   ======================================== */

const Tracking = {
  /**
   * Track a page view
   */
  pageView(pageName) {
    if (!PVLApi.isLoggedIn()) return;
    PVLApi.trackActivity('Page View', null, { page: pageName });
  },

  /**
   * Track article read
   */
  articleRead(articleId, title) {
    PVLApi.trackActivity('Article Read', articleId, { title });
  },

  /**
   * Track video watch
   */
  videoWatch(videoId, title) {
    PVLApi.trackActivity('Video Watch', videoId, { title });
  },

  /**
   * Track podcast listen
   */
  podcastListen(episodeId, title) {
    PVLApi.trackActivity('Podcast Listen', episodeId, { title });
  },

  /**
   * Track prediction
   */
  predictionMade(matchId) {
    PVLApi.trackActivity('Prediction', matchId);
  },

  /**
   * Track game play sessions
   */
  cardGamePlay() {
    PVLApi.trackActivity('Card Game Play');
  },

  managerGamePlay() {
    PVLApi.trackActivity('Manager Game Play');
  },

  /**
   * Track shop purchase
   */
  shopPurchase(itemId, itemName, price) {
    PVLApi.trackActivity('Shop Purchase', itemId, { name: itemName, price });
  }
};
