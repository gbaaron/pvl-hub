/* ========================================
   PVL HUB — Admin CMS
   Content management: Articles, Videos,
   Podcast Episodes, Matches, Prediction
   Questions, and User admin toggles.
   ======================================== */

const AdminCMS = {
  // ---------- State ----------
  currentTab: 'ARTICLES',
  cache: {
    ARTICLES: [],
    VIDEOS: [],
    PODCAST_EPISODES: [],
    MATCHES: [],
    PREDICTION_QUESTIONS: [],
    USERS: []
  },

  // ---------- Constants / Field definitions ----------
  ENDPOINT: '/.netlify/functions/admin-crud',

  TIER_OPTIONS: ['Free', 'Fan', 'Superfan', 'VIP'],

  ARTICLE_CATEGORIES: ['Game Recap', 'Feature', 'News', 'Opinion', 'Analysis'],
  VIDEO_TYPES: ['Interview', 'Highlight', 'Analysis', 'Behind the Scenes'],
  MATCH_STATUSES: ['Upcoming', 'Live', 'Completed'],
  PREDICTION_QUESTION_TYPES: ['Player Stat', 'Match Outcome', 'Set Score', 'MVP'],

  TABS: [
    { key: 'ARTICLES',             label: 'Articles',             iconText: 'A'  },
    { key: 'VIDEOS',               label: 'Videos',               iconText: 'V'  },
    { key: 'PODCAST_EPISODES',     label: 'Podcast Episodes',     iconText: 'P'  },
    { key: 'MATCHES',              label: 'Matches',              iconText: 'M'  },
    { key: 'PREDICTION_QUESTIONS', label: 'Prediction Questions', iconText: 'Q'  },
    { key: 'USERS',                label: 'Users',                iconText: 'U'  }
  ],

  // ===================================================
  //  Initialization
  // ===================================================
  init() {
    // Auth gate
    const user = PVLApi.getCurrentUser();
    const isAdmin = PVLApi.isLoggedIn() && user && user.is_admin === true;

    const deniedEl = document.getElementById('cms-denied');
    const shellEl = document.getElementById('cms-shell');

    if (!isAdmin) {
      if (deniedEl) deniedEl.style.display = 'flex';
      if (shellEl) shellEl.style.display = 'none';
      return;
    }

    if (deniedEl) deniedEl.style.display = 'none';
    if (shellEl) shellEl.style.display = 'flex';

    this.renderSidebar();
    this.bindModal();
    this.switchTab('ARTICLES');
  },

  // ===================================================
  //  Sidebar / Tabs
  // ===================================================
  renderSidebar() {
    const nav = document.getElementById('cms-nav');
    if (!nav) return;
    nav.innerHTML = this.TABS.map(tab => `
      <button class="cms-nav-item" data-tab="${tab.key}" type="button">
        <span class="cms-nav-icon">${tab.iconText}</span>
        <span>${tab.label}</span>
      </button>
    `).join('');

    nav.querySelectorAll('.cms-nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  },

  switchTab(tabKey) {
    this.currentTab = tabKey;
    document.querySelectorAll('.cms-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });

    const loaders = {
      ARTICLES: () => this.loadArticles(),
      VIDEOS: () => this.loadVideos(),
      PODCAST_EPISODES: () => this.loadPodcastEpisodes(),
      MATCHES: () => this.loadMatches(),
      PREDICTION_QUESTIONS: () => this.loadPredictionQuestions(),
      USERS: () => this.loadUsers()
    };

    const title = this.TABS.find(t => t.key === tabKey).label;
    this.renderSectionHead(title);
    this.renderMainLoading();

    const loader = loaders[tabKey];
    if (loader) loader();
  },

  renderSectionHead(title) {
    const head = document.getElementById('cms-section-head');
    if (!head) return;

    const showAddBtn = this.currentTab !== 'USERS';
    head.innerHTML = `
      <div class="cms-section-head-left">
        <h2>${title.toUpperCase().split(' ').map((w, i) =>
          i === 0 ? w : `<span>${w}</span>`
        ).join(' ')}</h2>
        <div class="cms-section-sub">Manage ${title.toLowerCase()}</div>
      </div>
      ${showAddBtn ? `
        <button class="cms-btn cms-btn-primary" id="cms-add-btn" type="button">
          <span class="cms-btn-add-icon">&plus;</span>
          Add New
        </button>
      ` : ''}
    `;

    const addBtn = document.getElementById('cms-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openFormForCurrentTab(null));
    }
  },

  renderMainLoading() {
    const main = document.getElementById('cms-records');
    if (main) main.innerHTML = `<div class="cms-loading">Loading</div>`;
  },

  // ===================================================
  //  Generic API helpers
  // ===================================================
  _getToken() {
    return localStorage.getItem('pvl_token');
  },

  async apiGet(table) {
    const res = await fetch(`${this.ENDPOINT}?table=${encodeURIComponent(table)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._getToken()}`
      }
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Failed to load ${table}`);
    }
    return data.records || [];
  },

  async apiCreate(table, fields) {
    const res = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._getToken()}`
      },
      body: JSON.stringify({ table, fields })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Failed to create in ${table}`);
    }
    return data.record;
  },

  async apiUpdate(table, id, fields) {
    const res = await fetch(this.ENDPOINT, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._getToken()}`
      },
      body: JSON.stringify({ table, id, fields })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Failed to update in ${table}`);
    }
    return data.record;
  },

  async apiDelete(table, id) {
    const res = await fetch(`${this.ENDPOINT}?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._getToken()}`
      }
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Failed to delete from ${table}`);
    }
    return data;
  },

  // ===================================================
  //  Loaders
  // ===================================================
  async loadArticles() {
    try {
      const records = await this.apiGet('ARTICLES');
      this.cache.ARTICLES = records;
      this.renderTable({
        records,
        columns: [
          { label: 'Title',        render: r => `<span class="cms-cell-title">${AdminCMS._esc(r.title)}</span>` },
          { label: 'Category',     render: r => AdminCMS._esc(r.category || '') },
          { label: 'Author',       render: r => AdminCMS._esc(r.author || '') },
          { label: 'Tier',         render: r => AdminCMS._tierBadge(r.tier_required) },
          { label: 'Featured',     render: r => AdminCMS._boolBadge(r.is_featured) },
          { label: 'Publish Date', render: r => `<span class="cms-cell-muted">${AdminCMS._esc(r.publish_date || '')}</span>` }
        ],
        table: 'ARTICLES',
        emptyTitle: 'No Articles Yet',
        emptySub: 'Create your first article to get started.'
      });
    } catch (err) {
      this.renderError(err.message);
    }
  },

  async loadVideos() {
    try {
      const records = await this.apiGet('VIDEOS');
      this.cache.VIDEOS = records;
      this.renderTable({
        records,
        columns: [
          { label: 'Title',        render: r => `<span class="cms-cell-title">${AdminCMS._esc(r.title)}</span>` },
          { label: 'Type',         render: r => AdminCMS._esc(r.type || '') },
          { label: 'Tier',         render: r => AdminCMS._tierBadge(r.tier_required) },
          { label: 'YouTube URL',  render: r => r.youtube_url ? `<a href="${AdminCMS._esc(r.youtube_url)}" target="_blank" rel="noopener" class="cms-cell-muted">Open &rarr;</a>` : '' },
          { label: 'Publish Date', render: r => `<span class="cms-cell-muted">${AdminCMS._esc(r.publish_date || '')}</span>` }
        ],
        table: 'VIDEOS',
        emptyTitle: 'No Videos Yet',
        emptySub: 'Add your first video to start populating the Videos page.'
      });
    } catch (err) {
      this.renderError(err.message);
    }
  },

  async loadPodcastEpisodes() {
    try {
      const records = await this.apiGet('PODCAST_EPISODES');
      this.cache.PODCAST_EPISODES = records;
      this.renderTable({
        records,
        columns: [
          { label: 'Title',        render: r => `<span class="cms-cell-title">${AdminCMS._esc(r.title)}</span>` },
          { label: 'Guest',        render: r => AdminCMS._esc(r.guest || '') },
          { label: 'Duration',     render: r => AdminCMS._esc(r.duration || '') },
          { label: 'Rating',       render: r => r.avg_rating != null ? AdminCMS._esc(String(r.avg_rating)) : '' },
          { label: 'Tier',         render: r => AdminCMS._tierBadge(r.tier_required) },
          { label: 'Publish Date', render: r => `<span class="cms-cell-muted">${AdminCMS._esc(r.publish_date || '')}</span>` }
        ],
        table: 'PODCAST_EPISODES',
        emptyTitle: 'No Podcast Episodes',
        emptySub: 'Add your first podcast episode.'
      });
    } catch (err) {
      this.renderError(err.message);
    }
  },

  async loadMatches() {
    try {
      const records = await this.apiGet('MATCHES');
      this.cache.MATCHES = records;
      this.renderTable({
        records,
        columns: [
          { label: 'Match',      render: r => `<span class="cms-cell-title">${AdminCMS._esc(r.team_a || '')} vs ${AdminCMS._esc(r.team_b || '')}</span>` },
          { label: 'Date',       render: r => `<span class="cms-cell-muted">${AdminCMS._esc(r.match_date || '')}</span>` },
          { label: 'Venue',      render: r => AdminCMS._esc(r.venue || '') },
          { label: 'Status',     render: r => AdminCMS._statusBadge(r.status) },
          { label: 'Score',      render: r => `${AdminCMS._esc(String(r.score_a ?? 0))} - ${AdminCMS._esc(String(r.score_b ?? 0))}` },
          { label: 'Pred. Open', render: r => AdminCMS._boolBadge(r.predictions_open) }
        ],
        table: 'MATCHES',
        emptyTitle: 'No Matches Yet',
        emptySub: 'Create your first match fixture.'
      });
    } catch (err) {
      this.renderError(err.message);
    }
  },

  async loadPredictionQuestions() {
    try {
      const records = await this.apiGet('PREDICTION_QUESTIONS');
      this.cache.PREDICTION_QUESTIONS = records;
      this.renderTable({
        records,
        columns: [
          { label: 'Question',  render: r => `<span class="cms-cell-title">${AdminCMS._esc(r.question_text || '')}</span>` },
          { label: 'Type',      render: r => AdminCMS._esc(r.question_type || '') },
          { label: 'Match ID',  render: r => `<span class="cms-cell-muted">${AdminCMS._esc(r.match_id || '')}</span>` },
          { label: 'Points',    render: r => r.points_value != null ? AdminCMS._esc(String(r.points_value)) : '' },
          { label: 'Correct',   render: r => AdminCMS._esc(r.correct_answer || '') }
        ],
        table: 'PREDICTION_QUESTIONS',
        emptyTitle: 'No Prediction Questions',
        emptySub: 'Add your first prediction question for a match.'
      });
    } catch (err) {
      this.renderError(err.message);
    }
  },

  async loadUsers() {
    try {
      const records = await this.apiGet('USERS');
      this.cache.USERS = records;
      this.renderUsers(records);
    } catch (err) {
      this.renderError(err.message);
    }
  },

  renderUsers(records) {
    const main = document.getElementById('cms-records');
    if (!main) return;

    if (!records.length) {
      main.innerHTML = `
        <div class="cms-empty">
          <div class="cms-empty-title">No Users</div>
          <div class="cms-empty-sub">No users exist in the USERS table.</div>
        </div>
      `;
      return;
    }

    const rowsHtml = records.map(r => `
      <tr data-id="${r.id}">
        <td>${this._esc(r.email || '')}</td>
        <td>${this._esc(r.username || '')}</td>
        <td>${this._esc(r.display_name || '')}</td>
        <td>${this._tierBadge(r.tier)}</td>
        <td class="cms-cell-muted">${this._esc(String(r.credits ?? 0))}</td>
        <td>
          <label class="cms-toggle">
            <input type="checkbox" data-user-id="${r.id}" ${r.is_admin === true ? 'checked' : ''}>
            <span class="cms-toggle-slider"></span>
          </label>
        </td>
      </tr>
    `).join('');

    main.innerHTML = `
      <div class="cms-table-wrap">
        <table class="cms-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Display Name</th>
              <th>Tier</th>
              <th>Credits</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;

    main.querySelectorAll('input[type="checkbox"][data-user-id]').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const id = e.target.dataset.userId;
        const newVal = e.target.checked;
        try {
          await this.apiUpdate('USERS', id, { is_admin: newVal });
          Toast.show(`Admin status ${newVal ? 'granted' : 'revoked'}.`, 'success');
          // Update cache
          const u = this.cache.USERS.find(x => x.id === id);
          if (u) u.is_admin = newVal;
        } catch (err) {
          Toast.show(err.message || 'Update failed', 'error');
          e.target.checked = !newVal;
        }
      });
    });
  },

  // ===================================================
  //  Generic Table Renderer
  // ===================================================
  renderTable({ records, columns, table, emptyTitle, emptySub }) {
    const main = document.getElementById('cms-records');
    if (!main) return;

    if (!records.length) {
      main.innerHTML = `
        <div class="cms-empty">
          <div class="cms-empty-title">${this._esc(emptyTitle)}</div>
          <div class="cms-empty-sub">${this._esc(emptySub)}</div>
          <button class="cms-btn cms-btn-primary" type="button" id="cms-empty-add">
            <span class="cms-btn-add-icon">&plus;</span> Add New
          </button>
        </div>
      `;
      const emptyAdd = document.getElementById('cms-empty-add');
      if (emptyAdd) emptyAdd.addEventListener('click', () => this.openFormForCurrentTab(null));
      return;
    }

    const headHtml = columns.map(c => `<th>${this._esc(c.label)}</th>`).join('') +
                     `<th style="text-align:right;">Actions</th>`;

    const rowsHtml = records.map(r => {
      const cells = columns.map(c => `<td>${c.render(r) || ''}</td>`).join('');
      return `
        <tr data-id="${r.id}">
          ${cells}
          <td class="cms-cell-actions">
            <button class="cms-btn cms-btn-edit" type="button" data-action="edit" data-id="${r.id}">Edit</button>
            <button class="cms-btn cms-btn-delete" type="button" data-action="delete" data-id="${r.id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    main.innerHTML = `
      <div class="cms-table-wrap">
        <table class="cms-table">
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;

    main.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const record = this.cache[table].find(r => r.id === id);
        if (record) this.openFormForCurrentTab(record);
      });
    });

    main.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.confirmDelete(table, id);
      });
    });
  },

  renderError(message) {
    const main = document.getElementById('cms-records');
    if (!main) return;
    main.innerHTML = `
      <div class="cms-empty">
        <div class="cms-empty-title" style="color: var(--pvl-red-light);">Error</div>
        <div class="cms-empty-sub">${this._esc(message)}</div>
      </div>
    `;
  },

  // ===================================================
  //  Delete confirmation
  // ===================================================
  async confirmDelete(table, id) {
    const ok = window.confirm('Delete this record? This cannot be undone.');
    if (!ok) return;
    try {
      await this.apiDelete(table, id);
      Toast.show('Record deleted.', 'success');
      // Reload current tab
      this.switchTab(this.currentTab);
    } catch (err) {
      Toast.show(err.message || 'Delete failed', 'error');
    }
  },

  // ===================================================
  //  Modal System
  // ===================================================
  bindModal() {
    const overlay = document.getElementById('cms-modal-overlay');
    const closeBtn = document.getElementById('cms-modal-close');
    const cancelBtn = document.getElementById('cms-modal-cancel');

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  openModal(title, formHtml, onSubmit) {
    const overlay = document.getElementById('cms-modal-overlay');
    const titleEl = document.getElementById('cms-modal-title');
    const bodyEl = document.getElementById('cms-modal-body');
    const saveBtn = document.getElementById('cms-modal-save');

    if (!overlay || !bodyEl || !saveBtn) return;

    if (titleEl) {
      titleEl.innerHTML = title;
    }

    bodyEl.innerHTML = `<form class="cms-form" id="cms-modal-form" onsubmit="return false;">${formHtml}</form>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Replace save button to clear previous handlers
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.addEventListener('click', async () => {
      const form = document.getElementById('cms-modal-form');
      if (!form) return;
      const fields = this._serializeForm(form);
      newSaveBtn.disabled = true;
      const originalText = newSaveBtn.textContent;
      newSaveBtn.textContent = 'Saving...';
      try {
        await onSubmit(fields);
        this.closeModal();
      } catch (err) {
        Toast.show(err.message || 'Save failed', 'error');
      } finally {
        newSaveBtn.disabled = false;
        newSaveBtn.textContent = originalText;
      }
    });

    // Focus first input
    setTimeout(() => {
      const first = bodyEl.querySelector('input, textarea, select');
      if (first) first.focus();
    }, 50);
  },

  closeModal() {
    const overlay = document.getElementById('cms-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  /**
   * Serialize a form's values into a plain object.
   * Skips empty strings (Airtable prefers the field absent).
   * Respects input type for numbers / checkboxes / JSON textareas.
   */
  _serializeForm(form) {
    const fields = {};
    form.querySelectorAll('[data-field]').forEach(el => {
      const name = el.dataset.field;
      const type = el.dataset.type || el.type;

      let val;
      if (el.type === 'checkbox') {
        val = !!el.checked;
      } else {
        val = el.value;
      }

      // Type coercion
      if (type === 'number') {
        if (val === '' || val === null) {
          val = undefined;
        } else {
          const n = Number(val);
          val = Number.isNaN(n) ? undefined : n;
        }
      } else if (type === 'json') {
        if (val && String(val).trim()) {
          try {
            val = JSON.parse(val);
          } catch {
            throw new Error(`Field "${name}" must be valid JSON.`);
          }
        } else {
          val = undefined;
        }
      } else if (typeof val === 'string') {
        val = val.trim();
        if (val === '') val = undefined;
      }

      if (val !== undefined) {
        fields[name] = val;
      }
    });
    return fields;
  },

  // ===================================================
  //  Form dispatch per tab
  // ===================================================
  openFormForCurrentTab(record) {
    switch (this.currentTab) {
      case 'ARTICLES':             return this.openArticleForm(record);
      case 'VIDEOS':               return this.openVideoForm(record);
      case 'PODCAST_EPISODES':     return this.openPodcastForm(record);
      case 'MATCHES':              return this.openMatchForm(record);
      case 'PREDICTION_QUESTIONS': return this.openPredictionQuestionForm(record);
    }
  },

  // ---------- Articles form ----------
  openArticleForm(record) {
    const editing = !!record;
    const r = record || {};

    const html = `
      <div class="cms-form-group full">
        <label class="cms-form-label">Title<span class="req">*</span></label>
        <input class="cms-input" data-field="title" type="text" value="${this._attr(r.title)}" required>
      </div>
      <div class="cms-form-group full">
        <label class="cms-form-label">Excerpt</label>
        <textarea class="cms-textarea" data-field="excerpt">${this._esc(r.excerpt || '')}</textarea>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">URL</label>
          <input class="cms-input" data-field="url" type="url" value="${this._attr(r.url)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Image URL</label>
          <input class="cms-input" data-field="image_url" type="url" value="${this._attr(r.image_url)}">
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Category</label>
          ${this._selectHtml('category', this.ARTICLE_CATEGORIES, r.category)}
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Tier Required</label>
          ${this._selectHtml('tier_required', this.TIER_OPTIONS, r.tier_required)}
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Publish Date</label>
          <input class="cms-input" data-field="publish_date" type="date" value="${this._attr(r.publish_date)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Author</label>
          <input class="cms-input" data-field="author" type="text" value="${this._attr(r.author)}">
        </div>
      </div>
      <div class="cms-form-group full">
        <label class="cms-checkbox-row">
          <input type="checkbox" data-field="is_featured" ${r.is_featured ? 'checked' : ''}>
          <span>Featured article</span>
        </label>
      </div>
    `;

    this.openModal(editing ? 'Edit <span>Article</span>' : 'New <span>Article</span>', html, async (fields) => {
      if (editing) {
        await this.apiUpdate('ARTICLES', record.id, fields);
        Toast.show('Article updated.', 'success');
      } else {
        await this.apiCreate('ARTICLES', fields);
        Toast.show('Article created.', 'success');
      }
      this.loadArticles();
    });
  },

  // ---------- Videos form ----------
  openVideoForm(record) {
    const editing = !!record;
    const r = record || {};

    const html = `
      <div class="cms-form-group full">
        <label class="cms-form-label">Title<span class="req">*</span></label>
        <input class="cms-input" data-field="title" type="text" value="${this._attr(r.title)}" required>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">YouTube URL</label>
          <input class="cms-input" data-field="youtube_url" type="url" value="${this._attr(r.youtube_url)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Thumbnail URL</label>
          <input class="cms-input" data-field="thumbnail_url" type="url" value="${this._attr(r.thumbnail_url)}">
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Type</label>
          ${this._selectHtml('type', this.VIDEO_TYPES, r.type)}
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Tier Required</label>
          ${this._selectHtml('tier_required', this.TIER_OPTIONS, r.tier_required)}
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Publish Date</label>
          <input class="cms-input" data-field="publish_date" type="date" value="${this._attr(r.publish_date)}">
        </div>
      </div>
    `;

    this.openModal(editing ? 'Edit <span>Video</span>' : 'New <span>Video</span>', html, async (fields) => {
      if (editing) {
        await this.apiUpdate('VIDEOS', record.id, fields);
        Toast.show('Video updated.', 'success');
      } else {
        await this.apiCreate('VIDEOS', fields);
        Toast.show('Video created.', 'success');
      }
      this.loadVideos();
    });
  },

  // ---------- Podcast Episodes form ----------
  openPodcastForm(record) {
    const editing = !!record;
    const r = record || {};

    const html = `
      <div class="cms-form-group full">
        <label class="cms-form-label">Title<span class="req">*</span></label>
        <input class="cms-input" data-field="title" type="text" value="${this._attr(r.title)}" required>
      </div>
      <div class="cms-form-group full">
        <label class="cms-form-label">Description</label>
        <textarea class="cms-textarea" data-field="description">${this._esc(r.description || '')}</textarea>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Audio URL</label>
          <input class="cms-input" data-field="audio_url" type="url" value="${this._attr(r.audio_url)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Duration</label>
          <input class="cms-input" data-field="duration" type="text" placeholder="e.g. 42:10" value="${this._attr(r.duration)}">
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Publish Date</label>
          <input class="cms-input" data-field="publish_date" type="date" value="${this._attr(r.publish_date)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Guest</label>
          <input class="cms-input" data-field="guest" type="text" value="${this._attr(r.guest)}">
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Tier Required</label>
          ${this._selectHtml('tier_required', this.TIER_OPTIONS, r.tier_required)}
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Avg Rating</label>
          <input class="cms-input" data-field="avg_rating" data-type="number" type="number" step="0.1" min="0" max="5" value="${this._attr(r.avg_rating)}">
        </div>
      </div>
    `;

    this.openModal(editing ? 'Edit <span>Episode</span>' : 'New <span>Episode</span>', html, async (fields) => {
      if (editing) {
        await this.apiUpdate('PODCAST_EPISODES', record.id, fields);
        Toast.show('Episode updated.', 'success');
      } else {
        await this.apiCreate('PODCAST_EPISODES', fields);
        Toast.show('Episode created.', 'success');
      }
      this.loadPodcastEpisodes();
    });
  },

  // ---------- Matches form ----------
  openMatchForm(record) {
    const editing = !!record;
    const r = record || {};

    const html = `
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Team A<span class="req">*</span></label>
          <input class="cms-input" data-field="team_a" type="text" value="${this._attr(r.team_a)}" required>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Team B<span class="req">*</span></label>
          <input class="cms-input" data-field="team_b" type="text" value="${this._attr(r.team_b)}" required>
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Match Date</label>
          <input class="cms-input" data-field="match_date" type="date" value="${this._attr(r.match_date)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Venue</label>
          <input class="cms-input" data-field="venue" type="text" value="${this._attr(r.venue)}">
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Status</label>
          ${this._selectHtml('status', this.MATCH_STATUSES, r.status)}
        </div>
        <div class="cms-form-group">
          <label class="cms-checkbox-row" style="margin-top: 22px;">
            <input type="checkbox" data-field="predictions_open" ${r.predictions_open ? 'checked' : ''}>
            <span>Predictions open</span>
          </label>
        </div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Score A</label>
          <input class="cms-input" data-field="score_a" data-type="number" type="number" min="0" value="${this._attr(r.score_a)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Score B</label>
          <input class="cms-input" data-field="score_b" data-type="number" type="number" min="0" value="${this._attr(r.score_b)}">
        </div>
      </div>
    `;

    this.openModal(editing ? 'Edit <span>Match</span>' : 'New <span>Match</span>', html, async (fields) => {
      if (editing) {
        await this.apiUpdate('MATCHES', record.id, fields);
        Toast.show('Match updated.', 'success');
      } else {
        await this.apiCreate('MATCHES', fields);
        Toast.show('Match created.', 'success');
      }
      this.loadMatches();
    });
  },

  // ---------- Prediction Questions form ----------
  openPredictionQuestionForm(record) {
    const editing = !!record;
    const r = record || {};

    const optionsValue = Array.isArray(r.options)
      ? JSON.stringify(r.options, null, 2)
      : (typeof r.options === 'string' ? r.options : '');

    const html = `
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Match ID</label>
          <input class="cms-input" data-field="match_id" type="text" value="${this._attr(r.match_id)}">
          <div class="cms-form-hint">Airtable record ID of the linked match.</div>
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Question Type</label>
          ${this._selectHtml('question_type', this.PREDICTION_QUESTION_TYPES, r.question_type)}
        </div>
      </div>
      <div class="cms-form-group full">
        <label class="cms-form-label">Question Text<span class="req">*</span></label>
        <input class="cms-input" data-field="question_text" type="text" value="${this._attr(r.question_text)}" required>
      </div>
      <div class="cms-form-group full">
        <label class="cms-form-label">Options (JSON array)</label>
        <textarea class="cms-textarea" data-field="options" data-type="json" placeholder='["Option A", "Option B", "Option C"]'>${this._esc(optionsValue)}</textarea>
        <div class="cms-form-hint">Must be a valid JSON array. Leave empty if not applicable.</div>
      </div>
      <div class="cms-form-row">
        <div class="cms-form-group">
          <label class="cms-form-label">Correct Answer</label>
          <input class="cms-input" data-field="correct_answer" type="text" value="${this._attr(r.correct_answer)}">
        </div>
        <div class="cms-form-group">
          <label class="cms-form-label">Points Value</label>
          <input class="cms-input" data-field="points_value" data-type="number" type="number" min="0" value="${this._attr(r.points_value)}">
        </div>
      </div>
    `;

    this.openModal(editing ? 'Edit <span>Question</span>' : 'New <span>Question</span>', html, async (fields) => {
      if (editing) {
        await this.apiUpdate('PREDICTION_QUESTIONS', record.id, fields);
        Toast.show('Question updated.', 'success');
      } else {
        await this.apiCreate('PREDICTION_QUESTIONS', fields);
        Toast.show('Question created.', 'success');
      }
      this.loadPredictionQuestions();
    });
  },

  // ===================================================
  //  Small helpers
  // ===================================================
  _selectHtml(name, options, current) {
    const opts = ['<option value="">— Select —</option>']
      .concat(options.map(o => `<option value="${this._attr(o)}" ${current === o ? 'selected' : ''}>${this._esc(o)}</option>`))
      .join('');
    return `<select class="cms-select" data-field="${name}">${opts}</select>`;
  },

  _esc(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _attr(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/"/g, '&quot;');
  },

  _tierBadge(tier) {
    if (!tier) return '';
    const key = String(tier).toLowerCase();
    return `<span class="cms-badge tier-${key}">${this._esc(tier)}</span>`;
  },

  _statusBadge(status) {
    if (!status) return '';
    const key = String(status).toLowerCase();
    return `<span class="cms-badge status-${key}">${this._esc(status)}</span>`;
  },

  _boolBadge(v) {
    if (v === true) return `<span class="cms-badge bool-yes">Yes</span>`;
    return `<span class="cms-badge bool-no">No</span>`;
  }
};

// Initialize after DOM is ready AND all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
  // Small delay so PVLApi / Auth have initialized
  setTimeout(() => AdminCMS.init(), 50);
});
