/* ========================================
   PVL HUB — Predictions Page Logic
   Crown Jewel Feature
   ======================================== */

const Predictions = {

  // --- State ---
  selections: {},       // { questionIndex: selectedOption }
  submitted: false,
  currentTab: 'weekly', // leaderboard tab

  // --- Demo Match Data ---
  activeMatch: {
    id: 'match_20260416_ccs_cmf',
    teamA: 'Creamline Cool Smashers',
    teamB: 'Choco Mucho Flying Titans',
    teamAShort: 'Creamline',
    teamBShort: 'Choco Mucho',
    date: 'April 16, 2026',
    time: '4:00 PM',
    venue: 'PhilSports Arena, Pasig City'
  },

  // --- Prediction Questions ---
  questions: [
    {
      id: 'q1',
      text: 'How many points will Alyssa Valdez score?',
      options: ['0', '1-5', '6-9', '10-14', '15+'],
      gridClass: ''
    },
    {
      id: 'q2',
      text: 'How many sets will the match go?',
      options: ['3', '4', '5'],
      gridClass: 'three-col'
    },
    {
      id: 'q3',
      text: 'Which team will have more blocks?',
      options: ['Creamline', 'Choco Mucho', 'Tie'],
      gridClass: 'three-col'
    },
    {
      id: 'q4',
      text: 'Total match points (both teams combined)?',
      options: ['Under 150', '150-175', '176-200', '201-225', '226+'],
      gridClass: ''
    },
    {
      id: 'q5',
      text: 'Who will be match MVP?',
      options: ['Alyssa Valdez', 'Maddie Madayag', 'Kat Tolentino', 'Deanna Wong', 'Sisi Rondina', 'Bea De Leon'],
      gridClass: 'three-col'
    }
  ],

  // --- Leaderboard Demo Data ---
  leaderboardData: {
    weekly: [
      { rank: 1, username: 'VolleyBoss_MNL', avatar: 'VB', correct: 23, total: 25, points: 2850 },
      { rank: 2, username: 'SpikerQueen', avatar: 'SQ', correct: 22, total: 25, points: 2700 },
      { rank: 3, username: 'AceMaster_PH', avatar: 'AM', correct: 21, total: 25, points: 2550 },
      { rank: 4, username: 'PasigSmasher', avatar: 'PS', correct: 20, total: 25, points: 2400 },
      { rank: 5, username: 'DiggerDave_03', avatar: 'DD', correct: 19, total: 25, points: 2200 },
      { rank: 6, username: 'NetQueen_Taft', avatar: 'NQ', correct: 18, total: 25, points: 2050 },
      { rank: 7, username: 'BlockParty_PH', avatar: 'BP', correct: 17, total: 25, points: 1900 },
      { rank: 8, username: 'SetterMindset', avatar: 'SM', correct: 17, total: 25, points: 1880 },
      { rank: 9, username: 'QuezonAce', avatar: 'QA', correct: 16, total: 25, points: 1750 },
      { rank: 10, username: 'LiberoLife_MNL', avatar: 'LL', correct: 16, total: 25, points: 1720 },
      { rank: 11, username: 'MakatiSpiker', avatar: 'MS', correct: 15, total: 25, points: 1600 },
      { rank: 12, username: 'CourtKing_BGC', avatar: 'CK', correct: 14, total: 25, points: 1450 },
      { rank: 13, username: 'ServingAces22', avatar: 'SA', correct: 14, total: 25, points: 1420 },
      { rank: 14, username: 'DugongPinoy', avatar: 'DP', correct: 13, total: 25, points: 1300 },
      { rank: 15, username: 'VolleyFan_Cebu', avatar: 'VF', correct: 12, total: 25, points: 1150 }
    ],
    alltime: [
      { rank: 1, username: 'SpikerQueen', avatar: 'SQ', correct: 312, total: 400, points: 38500 },
      { rank: 2, username: 'VolleyBoss_MNL', avatar: 'VB', correct: 298, total: 400, points: 36200 },
      { rank: 3, username: 'AceMaster_PH', avatar: 'AM', correct: 287, total: 400, points: 34800 },
      { rank: 4, username: 'BlockParty_PH', avatar: 'BP', correct: 275, total: 400, points: 32100 },
      { rank: 5, username: 'NetQueen_Taft', avatar: 'NQ', correct: 268, total: 400, points: 30900 },
      { rank: 6, username: 'PasigSmasher', avatar: 'PS', correct: 260, total: 400, points: 29500 },
      { rank: 7, username: 'SetterMindset', avatar: 'SM', correct: 245, total: 400, points: 27800 },
      { rank: 8, username: 'DiggerDave_03', avatar: 'DD', correct: 240, total: 400, points: 26500 },
      { rank: 9, username: 'QuezonAce', avatar: 'QA', correct: 232, total: 400, points: 25200 },
      { rank: 10, username: 'MakatiSpiker', avatar: 'MS', correct: 225, total: 400, points: 24100 },
      { rank: 11, username: 'CourtKing_BGC', avatar: 'CK', correct: 218, total: 400, points: 23000 },
      { rank: 12, username: 'LiberoLife_MNL', avatar: 'LL', correct: 210, total: 400, points: 22200 },
      { rank: 13, username: 'ServingAces22', avatar: 'SA', correct: 202, total: 400, points: 21000 },
      { rank: 14, username: 'DugongPinoy', avatar: 'DP', correct: 195, total: 400, points: 20100 },
      { rank: 15, username: 'VolleyFan_Cebu', avatar: 'VF', correct: 188, total: 400, points: 19300 }
    ]
  },

  // --- Past Results Demo Data ---
  pastResults: [
    {
      id: 'past_1',
      teamA: 'Creamline',
      teamB: 'PLDT',
      date: 'April 12, 2026',
      score: '3-1',
      picks: [
        { question: 'Alyssa Valdez points?', yourPick: '15+', correct: '15+', isCorrect: true },
        { question: 'How many sets?', yourPick: '3', correct: '4', isCorrect: false },
        { question: 'More blocks?', yourPick: 'Creamline', correct: 'Creamline', isCorrect: true },
        { question: 'Total match points?', yourPick: '176-200', correct: '201-225', isCorrect: false },
        { question: 'Match MVP?', yourPick: 'Alyssa Valdez', correct: 'Alyssa Valdez', isCorrect: true }
      ],
      creditsEarned: 100
    },
    {
      id: 'past_2',
      teamA: 'Choco Mucho',
      teamB: 'Cignal',
      date: 'April 10, 2026',
      score: '2-3',
      picks: [
        { question: 'Maddie Madayag points?', yourPick: '10-14', correct: '10-14', isCorrect: true },
        { question: 'How many sets?', yourPick: '5', correct: '5', isCorrect: true },
        { question: 'More blocks?', yourPick: 'Choco Mucho', correct: 'Cignal', isCorrect: false },
        { question: 'Total match points?', yourPick: '226+', correct: '226+', isCorrect: true },
        { question: 'Match MVP?', yourPick: 'Maddie Madayag', correct: 'Rachel Anne Daquis', isCorrect: false }
      ],
      creditsEarned: 100
    },
    {
      id: 'past_3',
      teamA: 'Petro Gazz',
      teamB: 'Akari',
      date: 'April 8, 2026',
      score: '3-0',
      picks: [
        { question: 'Brooke Van Sickle points?', yourPick: '10-14', correct: '6-9', isCorrect: false },
        { question: 'How many sets?', yourPick: '3', correct: '3', isCorrect: true },
        { question: 'More blocks?', yourPick: 'Petro Gazz', correct: 'Petro Gazz', isCorrect: true },
        { question: 'Total match points?', yourPick: 'Under 150', correct: 'Under 150', isCorrect: true },
        { question: 'Match MVP?', yourPick: 'Brooke Van Sickle', correct: 'Myla Pablo', isCorrect: false }
      ],
      creditsEarned: 100
    }
  ],

  // ==========================================
  // INITIALIZATION
  // ==========================================
  init() {
    Tracking.pageView('predictions');
    this.renderQuestions();
    this.renderLeaderboard('weekly');
    this.renderPastResults();
    this.bindSectionNav();
    this.bindLeaderboardTabs();
    this.bindSubmit();
    this.bindReceiptClose();
  },

  // ==========================================
  // SECTION NAVIGATION
  // ==========================================
  bindSectionNav() {
    const btns = document.querySelectorAll('.section-nav-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-section');

        // Update button active state
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show target section
        document.querySelectorAll('.pred-section').forEach(sec => {
          sec.classList.remove('active');
        });
        const targetSection = document.getElementById('section-' + target);
        if (targetSection) {
          targetSection.classList.add('active');
          // Re-trigger reveals
          targetSection.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('visible');
          });
        }
      });
    });
  },

  // ==========================================
  // SECTION 1: PREDICTION QUESTIONS
  // ==========================================
  renderQuestions() {
    const grid = document.getElementById('questions-grid');
    if (!grid) return;

    grid.innerHTML = this.questions.map((q, index) => `
      <div class="question-card reveal" id="qcard-${index}">
        <div class="question-header">
          <div class="question-number">${index + 1}</div>
          <div class="question-text">${q.text}</div>
        </div>
        <div class="options-grid ${q.gridClass}">
          ${q.options.map(opt => `
            <button class="option-btn" data-question="${index}" data-option="${opt}">
              <span class="check-icon">&#10003;</span>
              <span class="option-label">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Bind option clicks
    grid.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.submitted) return;
        const qIndex = parseInt(btn.getAttribute('data-question'));
        const option = btn.getAttribute('data-option');
        this.selectOption(qIndex, option);
      });
    });

    // Trigger reveal animation
    setTimeout(() => {
      grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 100);
  },

  selectOption(questionIndex, option) {
    // Update state
    this.selections[questionIndex] = option;

    // Update UI: remove selected from siblings, add to clicked
    const card = document.getElementById('qcard-' + questionIndex);
    if (!card) return;

    card.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.getAttribute('data-option') === option) {
        btn.classList.add('selected');
      }
    });

    // Mark card as answered
    card.classList.add('answered');

    // Update progress
    this.updateProgress();
  },

  updateProgress() {
    const answeredCount = Object.keys(this.selections).length;
    const total = this.questions.length;

    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
      dot.classList.toggle('filled', this.selections[i] !== undefined);
    });

    // Update count text
    const countEl = document.getElementById('answered-count');
    if (countEl) countEl.textContent = answeredCount;

    // Enable/disable submit button
    const submitBtn = document.getElementById('btn-lock-in');
    if (submitBtn) {
      const allAnswered = answeredCount === total;
      submitBtn.disabled = !allAnswered;

      // Update button text with lock/unlock icon
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) {
        if (allAnswered) {
          btnText.innerHTML = '<span class="lock-icon">&#128275;</span> Lock In Predictions';
        } else {
          btnText.innerHTML = '<span class="lock-icon">&#128274;</span> Lock In Predictions';
        }
      }
    }
  },

  // ==========================================
  // SUBMIT PREDICTIONS
  // ==========================================
  bindSubmit() {
    const btn = document.getElementById('btn-lock-in');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (btn.disabled || this.submitted) return;
      this.submitPredictions();
    });
  },

  submitPredictions() {
    this.submitted = true;

    // Build submission payload
    const picks = this.questions.map((q, i) => ({
      questionId: q.id,
      question: q.text,
      answer: this.selections[i]
    }));

    // Track activity
    Tracking.predictionMade(this.activeMatch.id);

    // Attempt API submit (will fail gracefully for demo)
    PVLApi.submitPrediction({
      matchId: this.activeMatch.id,
      predictions: picks
    }).catch(() => {
      // Expected in demo mode
    });

    // Show confirmation
    this.showConfirmation(picks);

    // Show toast
    Toast.show('Predictions locked in! Good luck!', 'success');

    // Disable all options and submit button
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.style.pointerEvents = 'none';
    });
    const lockBtn = document.getElementById('btn-lock-in');
    if (lockBtn) {
      lockBtn.disabled = true;
      const btnText = lockBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.innerHTML = '&#10003; Predictions Submitted';
      }
    }
  },

  showConfirmation(picks) {
    const overlay = document.getElementById('confirmation-overlay');
    if (!overlay) return;

    // Populate receipt picks
    const picksContainer = document.getElementById('receipt-picks');
    if (picksContainer) {
      picksContainer.innerHTML = picks.map(p => `
        <div class="receipt-pick">
          <span class="pick-q">${p.question}</span>
          <span class="pick-answer">${p.answer}</span>
        </div>
      `).join('');
    }

    // Show overlay
    overlay.classList.add('active');

    // Fire confetti effect
    this.fireConfetti();
  },

  bindReceiptClose() {
    const closeBtn = document.getElementById('receipt-close');
    if (!closeBtn) return;

    closeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('confirmation-overlay');
      if (overlay) overlay.classList.remove('active');
    });

    // Close on overlay click outside card
    const overlay = document.getElementById('confirmation-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    }
  },

  // Simple confetti burst
  fireConfetti() {
    const colors = ['#d4a843', '#f0c75e', '#ffffff', '#3498db', '#2ecc71', '#e74c3c'];
    const container = document.createElement('div');
    container.className = 'confetti-burst';
    document.body.appendChild(container);

    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 1.5 + Math.random() * 2;
      const size = 6 + Math.random() * 8;
      const rotation = Math.random() * 360;

      confetti.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${left}%;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        border-radius: 2px;
        opacity: 1;
        transform: rotate(${rotation}deg);
        animation: confettiFall ${duration}s ${delay}s ease-in forwards;
      `;
      container.appendChild(confetti);
    }

    // Add confetti keyframes if not already present
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confettiFall {
          0% { top: -10px; opacity: 1; transform: rotate(0deg) translateX(0); }
          100% { top: 110vh; opacity: 0; transform: rotate(720deg) translateX(${Math.random() > 0.5 ? '' : '-'}80px); }
        }
      `;
      document.head.appendChild(style);
    }

    // Cleanup
    setTimeout(() => container.remove(), 4000);
  },

  // ==========================================
  // SECTION 2: LEADERBOARD
  // ==========================================
  bindLeaderboardTabs() {
    const tabs = document.querySelectorAll('.lb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const period = tab.getAttribute('data-period');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderLeaderboard(period);
      });
    });
  },

  renderLeaderboard(period) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    const data = this.leaderboardData[period] || this.leaderboardData.weekly;

    tbody.innerHTML = data.map(user => {
      const accuracy = ((user.correct / user.total) * 100).toFixed(1);
      const rankClass = user.rank <= 3 ? `rank-${user.rank}` : '';
      const badgeClass = user.rank === 1 ? 'gold' : user.rank === 2 ? 'silver' : user.rank === 3 ? 'bronze' : 'normal';
      const accuracyClass = accuracy >= 80 ? 'high' : accuracy >= 60 ? 'mid' : 'low';

      return `
        <tr class="${rankClass}">
          <td>
            <span class="rank-badge ${badgeClass}">${user.rank}</span>
          </td>
          <td>
            <div class="lb-user">
              <div class="lb-avatar">${user.avatar}</div>
              <span class="lb-username">${user.username}</span>
            </div>
          </td>
          <td>${user.correct}/${user.total}</td>
          <td><span class="lb-accuracy ${accuracyClass}">${accuracy}%</span></td>
          <td style="text-align:right;">
            <span class="lb-points">${user.points.toLocaleString()}</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ==========================================
  // SECTION 3: PAST PREDICTIONS
  // ==========================================
  renderPastResults() {
    const container = document.getElementById('past-predictions');
    if (!container) return;

    container.innerHTML = this.pastResults.map(match => {
      const correctCount = match.picks.filter(p => p.isCorrect).length;
      const total = match.picks.length;
      const scoreClass = correctCount >= 4 ? 'great' : correctCount >= 3 ? 'good' : 'poor';
      const scoreLabel = correctCount >= 4 ? 'Excellent' : correctCount >= 3 ? 'Good' : 'Keep Trying';

      return `
        <div class="past-card reveal">
          <div class="past-card-header">
            <div class="past-match-info">
              <div>
                <div class="past-match-teams">${match.teamA} vs ${match.teamB}</div>
                <div class="past-match-date">${match.date} &bull; Final Score: ${match.score}</div>
              </div>
            </div>
            <div class="past-score-badge ${scoreClass}">
              ${correctCount >= 3 ? '&#10003;' : '&#10005;'} ${correctCount}/${total} Correct &mdash; ${scoreLabel}
            </div>
          </div>
          <div class="past-card-body">
            <div class="past-picks-grid">
              ${match.picks.map(pick => `
                <div class="past-pick-item">
                  <div class="past-pick-status ${pick.isCorrect ? 'correct' : 'wrong'}">
                    ${pick.isCorrect ? '&#10003;' : '&#10005;'}
                  </div>
                  <div class="past-pick-content">
                    <div class="past-pick-question">${pick.question}</div>
                    <div class="past-pick-answers">
                      <span class="past-your-pick">${pick.yourPick}</span>
                      ${!pick.isCorrect ? `
                        <span class="past-pick-arrow">&#8594;</span>
                        <span class="past-correct-answer">${pick.correct}</span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="past-card-footer">
            <span class="text-muted">${match.date}</span>
            <div class="past-credits-earned">
              &#x1FA99; +${match.creditsEarned} Credits
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Trigger reveal after a short delay
    setTimeout(() => {
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 200);
  }
};

// ==========================================
// BOOTSTRAP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  Predictions.init();
});
