/* ========================================
   PVL HUB — Ratings Module
   ======================================== */

const Ratings = {
  /**
   * Render star rating into container
   */
  async render(container, contentType, contentId, options = {}) {
    const { showReview = false, avgRating = null } = options;

    container.innerHTML = `
      <div class="rating-section" style="margin-bottom: 20px;">
        ${avgRating !== null ? `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div class="star-rating static">${this.renderStars(avgRating)}</div>
            <span class="text-sm text-muted">${avgRating.toFixed(1)} avg</span>
          </div>
        ` : ''}
        <div id="user-rating-${contentId}" style="display: flex; align-items: center; gap: 12px;">
          <span class="text-sm text-muted">Your rating:</span>
          <div class="star-rating interactive" id="stars-${contentId}">
            ${[1,2,3,4,5].map(i => `
              <span class="star" data-value="${i}" onclick="Ratings.rate('${contentType}', ${contentId}, ${i})">&#9733;</span>
            `).join('')}
          </div>
        </div>
        ${showReview ? `
          <div style="margin-top: 12px;">
            <textarea class="form-input" id="review-text-${contentId}" placeholder="Write a review (optional)..." rows="2" style="resize: vertical;"></textarea>
            <button class="btn btn-sm btn-secondary mt-1" onclick="Ratings.submitReview('${contentType}', ${contentId})">Submit Review</button>
          </div>
        ` : ''}
      </div>
    `;

    if (!PVLApi.isLoggedIn()) {
      document.getElementById(`user-rating-${contentId}`).innerHTML = `
        <span class="text-sm text-muted"><a href="/login.html">Log in</a> to rate.</span>
      `;
    }
  },

  renderStars(rating) {
    return [1,2,3,4,5].map(i =>
      `<span class="star ${i <= Math.round(rating) ? 'filled' : ''}">&#9733;</span>`
    ).join('');
  },

  async rate(contentType, contentId, value) {
    if (!PVLApi.isLoggedIn()) return;

    // Update stars visually
    const starsEl = document.getElementById(`stars-${contentId}`);
    if (starsEl) {
      starsEl.querySelectorAll('.star').forEach((star, idx) => {
        star.classList.toggle('filled', idx < value);
      });
    }

    try {
      await PVLApi.postRating({
        content_type: contentType,
        content_id: contentId,
        rating: value
      });
      Toast.show(`Rated ${value} star${value > 1 ? 's' : ''}!`, 'success');
      PVLApi.trackActivity('Rating', contentId, { type: contentType, rating: value });
    } catch (err) {
      Toast.show('Failed to submit rating', 'error');
    }
  },

  async submitReview(contentType, contentId) {
    const reviewEl = document.getElementById(`review-text-${contentId}`);
    const text = reviewEl?.value?.trim();
    if (!text) return;

    try {
      await PVLApi.postRating({
        content_type: contentType,
        content_id: contentId,
        review_text: text
      });
      reviewEl.value = '';
      Toast.show('Review submitted!', 'success');
    } catch (err) {
      Toast.show('Failed to submit review', 'error');
    }
  }
};
