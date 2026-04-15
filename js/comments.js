/* ========================================
   PVL HUB — Comments Module
   ======================================== */

const Comments = {
  /**
   * Render comments section into a container
   */
  async render(container, contentType, contentId) {
    container.innerHTML = `
      <div class="comments-section">
        <h3 style="margin-bottom: 20px;">Comments</h3>
        <div class="comment-input-wrap" id="comment-input-${contentId}">
          <textarea placeholder="Share your thoughts..." maxlength="500" id="comment-text-${contentId}"></textarea>
          <button class="btn btn-primary btn-sm" onclick="Comments.submit('${contentType}', ${contentId})">Post</button>
        </div>
        <div id="comments-list-${contentId}">
          <div class="spinner" style="margin: 20px auto;"></div>
        </div>
      </div>
    `;

    if (!PVLApi.isLoggedIn()) {
      document.getElementById(`comment-input-${contentId}`).innerHTML = `
        <p class="text-muted text-sm"><a href="/login.html">Log in</a> to leave a comment.</p>
      `;
    }

    this.loadComments(contentType, contentId);
  },

  async loadComments(contentType, contentId) {
    const listEl = document.getElementById(`comments-list-${contentId}`);
    try {
      const data = await PVLApi.getComments(contentType, contentId);
      const comments = data.comments || [];

      if (comments.length === 0) {
        listEl.innerHTML = '<p class="text-muted text-sm" style="padding: 20px 0;">No comments yet. Be the first!</p>';
        return;
      }

      listEl.innerHTML = comments.map(c => `
        <div class="comment-item">
          <div class="comment-avatar">${(c.username || 'U')[0].toUpperCase()}</div>
          <div class="comment-content">
            <div class="comment-author">${this.escapeHtml(c.username || 'Anonymous')}</div>
            <div class="comment-text">${this.escapeHtml(c.comment_text)}</div>
            <div class="comment-time">${this.timeAgo(c.created_at)}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = '<p class="text-muted text-sm">Could not load comments.</p>';
    }
  },

  async submit(contentType, contentId) {
    if (!PVLApi.isLoggedIn()) return;

    const textarea = document.getElementById(`comment-text-${contentId}`);
    const text = textarea.value.trim();
    if (!text) return;

    const user = PVLApi.getCurrentUser();
    try {
      await PVLApi.postComment({
        content_type: contentType,
        content_id: contentId,
        comment_text: text
      });

      textarea.value = '';
      Toast.show('Comment posted!', 'success');
      this.loadComments(contentType, contentId);
      PVLApi.trackActivity('Comment', contentId, { type: contentType });
    } catch (err) {
      Toast.show('Failed to post comment', 'error');
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
};
