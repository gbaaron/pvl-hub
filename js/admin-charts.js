/* ========================================
   PVL HUB — Admin Dashboard Charts
   Chart.js Visualizations (Dark Theme)
   ======================================== */

/* ==========================================
   COLOR PALETTE & CHART.JS GLOBAL DEFAULTS
   ========================================== */

const PVL_COLORS = {
  gold:       '#f6b816',
  goldLight:  '#f9cd4a',
  goldDark:   '#d49e0e',
  navy:       '#040707',
  navyLight:  '#0d1117',
  navyMid:    '#161b22',
  white:      '#ffffff',
  gray100:    '#f4f5f7',
  gray300:    '#c5c9d2',
  gray400:    '#8b92a0',
  gray500:    '#5a6271',
  gray700:    '#2a3040',
  green:      '#2ecc71',
  red:        '#ed1f24',
  blue:       '#045397',
  blueLight:  '#1a6fc2',
  orange:     '#f39c12',
  purple:     '#9b59b6',
  teal:       '#1abc9c',
  tierFree:   '#8b92a0',
  tierFan:    '#045397',
  tierSuperfan: '#9b59b6',
  tierVip:    '#f6b816'
};

// Ordered color cycle for multi-series charts
const CHART_PALETTE = [
  PVL_COLORS.gold,
  PVL_COLORS.blue,
  PVL_COLORS.purple,
  PVL_COLORS.teal,
  PVL_COLORS.orange,
  PVL_COLORS.green,
  PVL_COLORS.red,
  PVL_COLORS.goldLight
];

// Set Chart.js global defaults for dark theme
Chart.defaults.color = PVL_COLORS.gray400;
Chart.defaults.borderColor = 'rgba(246, 184, 22, 0.08)';
Chart.defaults.font.family = "'Outfit', 'Rajdhani', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.color = PVL_COLORS.gray300;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(4, 7, 7, 0.95)';
Chart.defaults.plugins.tooltip.titleColor = PVL_COLORS.white;
Chart.defaults.plugins.tooltip.bodyColor = PVL_COLORS.gray300;
Chart.defaults.plugins.tooltip.borderColor = 'rgba(246, 184, 22, 0.25)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.elements.point.radius = 3;
Chart.defaults.elements.point.hoverRadius = 6;
Chart.defaults.elements.point.borderWidth = 2;
Chart.defaults.elements.line.tension = 0.35;
Chart.defaults.elements.line.borderWidth = 2.5;
Chart.defaults.elements.bar.borderRadius = 4;
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.elements.arc.borderColor = PVL_COLORS.navyLight;
Chart.defaults.scale.grid = {
  color: 'rgba(246, 184, 22, 0.04)',
  drawBorder: false
};
Chart.defaults.scale.ticks = {
  color: PVL_COLORS.gray500,
  font: { size: 11 }
};

/* ==========================================
   HELPER FUNCTIONS
   ========================================== */

/**
 * Generate an array of dates as labels (e.g., "Mar 15")
 */
function generateDateLabels(days, endDate) {
  const end = endDate || new Date();
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

/**
 * Generate week labels (e.g., "W1", "W2", ...)
 */
function generateWeekLabels(count) {
  return Array.from({ length: count }, (_, i) => `W${i + 1}`);
}

/**
 * Generate a time series with realistic upward trend + noise
 */
function generateTrendData(count, start, end, variance) {
  const data = [];
  const step = (end - start) / (count - 1);
  for (let i = 0; i < count; i++) {
    const base = start + step * i;
    const noise = (Math.random() - 0.5) * 2 * variance;
    data.push(Math.round(base + noise));
  }
  return data;
}

/**
 * Generate random data within a range
 */
function randomRange(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Create a gradient fill for line charts
 */
function createGradient(ctx, color, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height || 320);
  gradient.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'));
  gradient.addColorStop(1, color.replace(')', ', 0.01)').replace('rgb', 'rgba'));
  return gradient;
}

/**
 * Hex to rgba helper
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Create a canvas gradient from a hex color
 */
function makeGradientFill(ctx, hex, canvasHeight) {
  const h = canvasHeight || 300;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hexToRgba(hex, 0.3));
  grad.addColorStop(0.7, hexToRgba(hex, 0.05));
  grad.addColorStop(1, hexToRgba(hex, 0));
  return grad;
}


/* ==========================================
   CHART INITIALIZATION
   ========================================== */

function initAllCharts() {
  initDAUChart();
  initTierChart();
  initRegistrationsChart();
  initEngagementTypeChart();
  initSessionDurationChart();
  initPopularContentChart();
  initPredictionsMatchChart();
  initAccuracyChart();
  initPredictedPlayersChart();
  initSentimentChart();
  initDiscussedPlayersChart();
  initCreditsFlowChart();
  initCreditsSourceChart();
}


/* ------------------------------------------
   SECTION 2: User Analytics
   ------------------------------------------ */

function initDAUChart() {
  const ctx = document.getElementById('chart-dau');
  if (!ctx) return;

  const labels = generateDateLabels(30);
  const data = generateTrendData(30, 2800, 3847, 180);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Active Users',
        data,
        borderColor: PVL_COLORS.gold,
        backgroundColor: makeGradientFill(ctx.getContext('2d'), PVL_COLORS.gold),
        fill: true,
        pointBackgroundColor: PVL_COLORS.gold,
        pointBorderColor: PVL_COLORS.navyLight
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y.toLocaleString()} users`
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8 }
        },
        y: {
          beginAtZero: false,
          ticks: {
            callback: (v) => v.toLocaleString()
          }
        }
      }
    }
  });
}

function initTierChart() {
  const ctx = document.getElementById('chart-tiers');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Free (68%)', 'Fan (21%)', 'Superfan (8%)', 'VIP (3%)'],
      datasets: [{
        data: [68, 21, 8, 3],
        backgroundColor: [
          PVL_COLORS.tierFree,
          PVL_COLORS.tierFan,
          PVL_COLORS.tierSuperfan,
          PVL_COLORS.tierVip
        ],
        hoverBackgroundColor: [
          hexToRgba(PVL_COLORS.tierFree, 0.85),
          hexToRgba(PVL_COLORS.tierFan, 0.85),
          hexToRgba(PVL_COLORS.tierSuperfan, 0.85),
          hexToRgba(PVL_COLORS.tierVip, 0.85)
        ],
        borderWidth: 3,
        borderColor: PVL_COLORS.navyLight
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 14,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (c) => {
              const count = Math.round(12438 * c.parsed / 100);
              return `${c.label}: ${count.toLocaleString()} users`;
            }
          }
        }
      }
    }
  });
}

function initRegistrationsChart() {
  const ctx = document.getElementById('chart-registrations');
  if (!ctx) return;

  const labels = generateWeekLabels(12);
  const data = [180, 210, 195, 240, 265, 230, 290, 310, 275, 340, 355, 324];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'New Users',
        data,
        backgroundColor: hexToRgba(PVL_COLORS.gold, 0.7),
        hoverBackgroundColor: PVL_COLORS.gold,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y} new registrations`
          }
        }
      },
      scales: {
        x: {},
        y: {
          beginAtZero: true,
          ticks: { stepSize: 50 }
        }
      }
    }
  });
}


/* ------------------------------------------
   SECTION 3: Engagement Metrics
   ------------------------------------------ */

function initEngagementTypeChart() {
  const ctx = document.getElementById('chart-engagement-type');
  if (!ctx) return;

  const labels = ['Articles', 'Videos', 'Podcasts', 'Predictions', 'Card Game', 'Manager', 'Shop'];
  const data = [8420, 6890, 3250, 12400, 7650, 5120, 4980];
  const colors = [
    PVL_COLORS.gold,
    PVL_COLORS.blue,
    PVL_COLORS.purple,
    PVL_COLORS.green,
    PVL_COLORS.orange,
    PVL_COLORS.teal,
    PVL_COLORS.red
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Interactions',
        data,
        backgroundColor: colors.map(c => hexToRgba(c, 0.7)),
        hoverBackgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y.toLocaleString()} interactions`
          }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 } }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => (v / 1000).toFixed(0) + 'K'
          }
        }
      }
    }
  });
}

function initSessionDurationChart() {
  const ctx = document.getElementById('chart-session-duration');
  if (!ctx) return;

  const labels = generateDateLabels(30);
  const data = generateTrendData(30, 8.2, 14.5, 1.8).map(v => Math.round(v * 10) / 10);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Avg. Session (min)',
        data,
        borderColor: PVL_COLORS.teal,
        backgroundColor: makeGradientFill(ctx.getContext('2d'), PVL_COLORS.teal),
        fill: true,
        pointBackgroundColor: PVL_COLORS.teal,
        pointBorderColor: PVL_COLORS.navyLight
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y} minutes`
          }
        }
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8 }
        },
        y: {
          beginAtZero: false,
          suggestedMin: 6,
          suggestedMax: 18,
          ticks: {
            callback: (v) => v + ' min'
          }
        }
      }
    }
  });
}

function initPopularContentChart() {
  const ctx = document.getElementById('chart-popular-content');
  if (!ctx) return;

  const labels = [
    'Creamline Dominates in 3 Sets',
    'Top 5 Setters to Watch',
    'PVL 2026 Week 3 Highlights',
    'Alyssa Valdez Interview',
    'Choco Mucho Training Camp',
    'PLDT Roster Shake-Up',
    'Cignal Block Defense Breakdown',
    'Fantasy Manager Guide',
    'Pre-Season Power Rankings',
    'Rookie Spotlight: Torres'
  ];
  const data = [4280, 3650, 3420, 3180, 2870, 2640, 2310, 2150, 1980, 1760];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Views',
        data,
        backgroundColor: hexToRgba(PVL_COLORS.gold, 0.55),
        hoverBackgroundColor: PVL_COLORS.gold,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.x.toLocaleString()} views`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (v) => (v / 1000).toFixed(1) + 'K'
          }
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 28 ? label.substring(0, 28) + '...' : label;
            }
          }
        }
      }
    }
  });
}


/* ------------------------------------------
   SECTION 4: Predictions Analytics
   ------------------------------------------ */

function initPredictionsMatchChart() {
  const ctx = document.getElementById('chart-predictions-match');
  if (!ctx) return;

  const labels = [
    'CCS vs CMF',
    'PLDT vs Cignal',
    'Petro vs Akari',
    'FF vs Capital1',
    'NXLED vs CT',
    'Galeries vs ZUS',
    'CCS vs PLDT',
    'CMF vs Petro'
  ];
  const data = [1840, 1520, 980, 870, 760, 640, 2150, 1340];
  const colors = data.map((v) => {
    if (v > 1800) return hexToRgba(PVL_COLORS.gold, 0.85);
    if (v > 1200) return hexToRgba(PVL_COLORS.gold, 0.6);
    if (v > 800) return hexToRgba(PVL_COLORS.gold, 0.4);
    return hexToRgba(PVL_COLORS.gold, 0.25);
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Predictions',
        data,
        backgroundColor: colors,
        hoverBackgroundColor: PVL_COLORS.gold,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y.toLocaleString()} predictions`
          }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v.toLocaleString()
          }
        }
      }
    }
  });
}

function initAccuracyChart() {
  const ctx = document.getElementById('chart-accuracy');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [
        '0 correct (15%)',
        '1 correct (25%)',
        '2 correct (28%)',
        '3 correct (18%)',
        '4 correct (10%)',
        '5 correct (4%)'
      ],
      datasets: [{
        data: [15, 25, 28, 18, 10, 4],
        backgroundColor: [
          PVL_COLORS.red,
          PVL_COLORS.orange,
          PVL_COLORS.blue,
          PVL_COLORS.teal,
          PVL_COLORS.green,
          PVL_COLORS.gold
        ],
        hoverBackgroundColor: [
          hexToRgba(PVL_COLORS.red, 0.85),
          hexToRgba(PVL_COLORS.orange, 0.85),
          hexToRgba(PVL_COLORS.blue, 0.85),
          hexToRgba(PVL_COLORS.teal, 0.85),
          hexToRgba(PVL_COLORS.green, 0.85),
          hexToRgba(PVL_COLORS.gold, 0.85)
        ],
        borderWidth: 3,
        borderColor: PVL_COLORS.navyLight
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 10,
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: (c) => {
              const total = 48219;
              const count = Math.round(total * c.parsed / 100);
              return `${c.label}: ~${count.toLocaleString()} predictions`;
            }
          }
        }
      }
    }
  });
}

function initPredictedPlayersChart() {
  const ctx = document.getElementById('chart-predicted-players');
  if (!ctx) return;

  const labels = [
    'Alyssa Valdez',
    'Jia De Guzman',
    'Maddie Madayag',
    'Tots Carlos',
    'Deanna Wong',
    'Sisi Rondina',
    'Mika Reyes',
    'Jema Galanza'
  ];
  const data = [5840, 4920, 4310, 3870, 3650, 3280, 2940, 2710];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Times Predicted',
        data,
        backgroundColor: [
          hexToRgba(PVL_COLORS.gold, 0.85),
          hexToRgba(PVL_COLORS.gold, 0.72),
          hexToRgba(PVL_COLORS.gold, 0.6),
          hexToRgba(PVL_COLORS.gold, 0.5),
          hexToRgba(PVL_COLORS.gold, 0.42),
          hexToRgba(PVL_COLORS.gold, 0.35),
          hexToRgba(PVL_COLORS.gold, 0.28),
          hexToRgba(PVL_COLORS.gold, 0.22)
        ],
        hoverBackgroundColor: PVL_COLORS.gold,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `Predicted ${c.parsed.y.toLocaleString()} times`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 9 },
            maxRotation: 45,
            callback: function(value) {
              const label = this.getLabelForValue(value);
              // Show just last name for space
              return label.split(' ').pop();
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => (v / 1000).toFixed(1) + 'K'
          }
        }
      }
    }
  });
}


/* ------------------------------------------
   SECTION 6: Comment Sentiment
   ------------------------------------------ */

function initSentimentChart() {
  const ctx = document.getElementById('chart-sentiment');
  if (!ctx) return;

  const labels = generateWeekLabels(12);

  // Positive trend: generally going up
  const positive = [52, 54, 51, 58, 55, 60, 57, 62, 59, 65, 63, 67];
  // Neutral: stays relatively flat
  const neutral = [32, 30, 33, 28, 31, 27, 30, 26, 29, 24, 27, 23];
  // Negative: generally going down
  const negative = [16, 16, 16, 14, 14, 13, 13, 12, 12, 11, 10, 10];

  const context2d = ctx.getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Positive',
          data: positive,
          borderColor: PVL_COLORS.green,
          backgroundColor: makeGradientFill(context2d, PVL_COLORS.green),
          fill: true,
          pointBackgroundColor: PVL_COLORS.green,
          pointBorderColor: PVL_COLORS.navyLight
        },
        {
          label: 'Neutral',
          data: neutral,
          borderColor: PVL_COLORS.blue,
          backgroundColor: 'transparent',
          fill: false,
          pointBackgroundColor: PVL_COLORS.blue,
          pointBorderColor: PVL_COLORS.navyLight,
          borderDash: [5, 5]
        },
        {
          label: 'Negative',
          data: negative,
          borderColor: PVL_COLORS.red,
          backgroundColor: 'transparent',
          fill: false,
          pointBackgroundColor: PVL_COLORS.red,
          pointBorderColor: PVL_COLORS.navyLight,
          borderDash: [3, 3]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          align: 'end'
        },
        tooltip: {
          callbacks: {
            label: (c) => `${c.dataset.label}: ${c.parsed.y}%`
          }
        }
      },
      scales: {
        x: {},
        y: {
          beginAtZero: true,
          max: 80,
          ticks: {
            callback: (v) => v + '%'
          }
        }
      }
    }
  });
}

function initDiscussedPlayersChart() {
  const ctx = document.getElementById('chart-discussed-players');
  if (!ctx) return;

  const labels = [
    'Alyssa Valdez',
    'Jia De Guzman',
    'Tots Carlos',
    'Sisi Rondina',
    'Deanna Wong',
    'Maddie Madayag',
    'Mika Reyes',
    'Dawn Macandili'
  ];
  const data = [3420, 2890, 2540, 2180, 1950, 1720, 1580, 1340];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Mentions',
        data,
        backgroundColor: hexToRgba(PVL_COLORS.blue, 0.55),
        hoverBackgroundColor: PVL_COLORS.blue,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.x.toLocaleString()} mentions`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (v) => (v / 1000).toFixed(1) + 'K'
          }
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 16 ? label.substring(0, 16) + '...' : label;
            }
          }
        }
      }
    }
  });
}


/* ------------------------------------------
   SECTION 7: Revenue & Credits Economy
   ------------------------------------------ */

function initCreditsFlowChart() {
  const ctx = document.getElementById('chart-credits-flow');
  if (!ctx) return;

  const labels = generateWeekLabels(12);

  // Earned generally grows, spent grows slower (healthy economy)
  const earned = [98000, 105000, 112000, 118000, 125000, 132000, 140000, 148000, 155000, 163000, 170000, 178000];
  const spent =  [42000, 44000, 47000, 50000, 52000, 55000, 58000, 60000, 63000, 66000, 68000, 72000];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Credits Earned',
          data: earned,
          backgroundColor: hexToRgba(PVL_COLORS.green, 0.65),
          hoverBackgroundColor: PVL_COLORS.green,
          borderRadius: 4,
          borderSkipped: false,
          stack: 'stack0'
        },
        {
          label: 'Credits Spent',
          data: spent,
          backgroundColor: hexToRgba(PVL_COLORS.orange, 0.65),
          hoverBackgroundColor: PVL_COLORS.orange,
          borderRadius: 4,
          borderSkipped: false,
          stack: 'stack1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          align: 'end'
        },
        tooltip: {
          callbacks: {
            label: (c) => `${c.dataset.label}: ${c.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {},
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => (v / 1000).toFixed(0) + 'K'
          }
        }
      }
    }
  });
}

function initCreditsSourceChart() {
  const ctx = document.getElementById('chart-credits-source');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        'Predictions (35%)',
        'Card Game (25%)',
        'Manager Game (20%)',
        'Daily Login (12%)',
        'Comments/Ratings (8%)'
      ],
      datasets: [{
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          PVL_COLORS.gold,
          PVL_COLORS.orange,
          PVL_COLORS.teal,
          PVL_COLORS.blue,
          PVL_COLORS.purple
        ],
        hoverBackgroundColor: [
          hexToRgba(PVL_COLORS.gold, 0.85),
          hexToRgba(PVL_COLORS.orange, 0.85),
          hexToRgba(PVL_COLORS.teal, 0.85),
          hexToRgba(PVL_COLORS.blue, 0.85),
          hexToRgba(PVL_COLORS.purple, 0.85)
        ],
        borderWidth: 3,
        borderColor: PVL_COLORS.navyLight
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: (c) => {
              const totalCredits = 1842300;
              const credits = Math.round(totalCredits * c.parsed / 100);
              return `${c.label}: ${credits.toLocaleString()} credits`;
            }
          }
        }
      }
    }
  });
}
