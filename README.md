# PVL Hub -- The Ultimate Philippine Volleyball League Fan Platform

**Powered by Globally Ballin**

---

## Overview

PVL Hub is a comprehensive fan engagement platform for the Philippine Volleyball League (PVL). It brings together articles, videos, podcasts, match predictions, a fantasy card game, a manager game, a merchandise shop, and a data-rich admin dashboard -- all unified by a shared credits economy.

This project is a **proof of concept** built to present to the PVL as a pitch for an official fan platform partnership. It demonstrates how a single ecosystem can drive fan engagement, retention, and monetization across content, games, and commerce.

---

## Tech Stack

| Layer            | Technology                                  |
|------------------|---------------------------------------------|
| **Frontend**     | Plain HTML / CSS / JavaScript (no frameworks) |
| **Backend**      | Netlify Serverless Functions (Node.js)      |
| **Database**     | Airtable (REST API)                         |
| **Charts**       | Chart.js 4.x                               |
| **Hosting**      | Netlify                                     |
| **Fonts**        | Google Fonts (Bebas Neue, Rajdhani, Outfit) |
| **Auth**         | Custom JWT-based authentication             |

---

## Features

- **Home Page** -- Live score ticker, next-match countdown timer, featured articles/videos/podcast preview, platform stats bar
- **Articles** -- PVL news and analysis with star ratings and threaded comments
- **Videos** -- Match highlights, interviews, and analysis with ratings and comments
- **Podcast** -- Episode listing with embedded audio player, ratings, and comments
- **Match Predictions** -- Fox Pick 6-style prediction game with 5 questions per match, confirmation receipt with confetti, weekly and all-time leaderboards, and past results review
- **PVL Fantasy Card Game** -- Collect 100+ player cards across 5 rarities (Common, Rare, Epic, Legendary, Mythic), build lineups, trade cards, and compete on leaderboards (integrated via iframe from existing Airtable app)
- **PVL Manager Game** -- Draft, trade, manage lineups, and simulate matches in a full team management experience (integrated via iframe from existing Netlify app)
- **Shop** -- 12 products across 4 categories (Apparel, Accessories, Digital, Collectibles) with dual pricing in PHP and credits, category filtering, and cart management
- **User Profiles** -- Display name, bio, favorite team, banner color customization, prediction accuracy ring, engagement score, credit balance with earn/spend breakdown, activity tabs (predictions history, comments, transactions), and 12 achievement badges
- **Admin Dashboard** -- Password-protected analytics dashboard with 13+ Chart.js visualizations, key insight cards, trending topics word cloud, tier upgrade funnel, and credits economy tracking
- **Shared Credits Economy** -- Unified virtual currency earned and spent across predictions, games, shop, and engagement activities
- **Activity Tracking** -- Fire-and-forget user behavior analytics for page views, article reads, video watches, podcast listens, predictions, game sessions, and shop purchases
- **Dark/Light Theme Toggle** -- Persisted in localStorage, available on every page
- **Mobile Responsive** -- Fully responsive layout with hamburger navigation on all pages

---

## Project Structure

```
pvl-hub/
|-- index.html                  # Home page (score ticker, countdown, featured content)
|-- articles.html               # Articles listing with ratings & comments
|-- videos.html                 # Videos listing with ratings & comments
|-- podcast.html                # Podcast episodes with audio player
|-- predictions.html            # Match predictions (Pick 6 style)
|-- cards.html                  # Fantasy Card Game integration page
|-- manager.html                # Manager Game integration page
|-- shop.html                   # Merchandise shop with dual pricing
|-- profile.html                # User profile with stats & achievements
|-- login.html                  # Login page
|-- register.html               # Registration page
|-- admin.html                  # Admin dashboard (password-protected)
|
|-- css/
|   |-- global.css              # Design system, theme variables, shared components
|   |-- home.css                # Home page styles
|   |-- articles.css            # Articles page styles
|   |-- videos.css              # Videos page styles
|   |-- podcast.css             # Podcast page styles
|   |-- predictions.css         # Predictions page styles
|   |-- games.css               # Card Game & Manager Game shared styles
|   |-- shop.css                # Shop page styles
|   |-- profile.css             # Profile page styles
|   |-- auth.css                # Login & Register page styles
|   |-- admin.css               # Admin dashboard styles
|
|-- js/
|   |-- api.js                  # Centralized API helper (PVLApi object)
|   |-- auth.js                 # Auth & navigation manager (theme, mobile nav, scroll reveal)
|   |-- tracking.js             # Activity tracking module
|   |-- predictions.js          # Predictions page logic (questions, leaderboard, past results)
|   |-- comments.js             # Reusable comments module
|   |-- ratings.js              # Reusable star ratings module
|   |-- toast.js                # Toast notification system
|   |-- admin-charts.js         # All 13 Chart.js dashboard visualizations
|
|-- netlify/
|   |-- functions/
|       |-- auth-register.js    # POST - User registration
|       |-- auth-login.js       # POST - User login (returns JWT)
|       |-- get-articles.js     # GET  - Fetch articles from Airtable
|       |-- get-videos.js       # GET  - Fetch videos from Airtable
|       |-- get-podcasts.js     # GET  - Fetch podcast episodes
|       |-- get-matches.js      # GET  - Fetch match schedule
|       |-- get-predictions.js  # GET  - Fetch predictions for a match
|       |-- submit-prediction.js# POST - Submit match predictions
|       |-- get-leaderboard.js  # GET  - Fetch prediction leaderboard
|       |-- get-comments.js     # GET  - Fetch comments for content
|       |-- post-comment.js     # POST - Post a new comment
|       |-- get-ratings.js      # GET  - Fetch ratings for content
|       |-- post-rating.js      # POST - Submit a rating/review
|       |-- get-shop-items.js   # GET  - Fetch shop products
|       |-- get-user-profile.js # GET  - Fetch user profile data
|       |-- update-user-profile.js # POST - Update profile fields
|       |-- get-credits.js      # GET  - Fetch credit balance & transactions
|       |-- transfer-credits.js # POST - Add or deduct credits
|       |-- track-activity.js   # POST - Log user activity (fire-and-forget)
|       |-- get-user-activity.js# GET  - Fetch user activity history
|       |-- admin-dashboard.js  # POST - Fetch aggregated dashboard analytics
|
|-- assets/
|   |-- icons/                  # (placeholder for app icons)
|   |-- images/                 # (placeholder for static images)
|
|-- scripts/                    # Utility scripts (seed data, etc.)
|-- netlify.toml                # Netlify build config & API redirect rules
|-- .env.example                # Environment variable template
|-- .gitignore                  # Git ignore rules
```

---

## Setup Instructions

### 1. Airtable Setup

Create a new Airtable base and add the following tables with their key fields:

| Table                  | Key Fields                                                                                    |
|------------------------|-----------------------------------------------------------------------------------------------|
| **USERS**              | `email`, `username`, `password_hash`, `display_name`, `favorite_team`, `tier`, `credits`, `date_joined`, `last_login`, `bio`, `banner_color`, `favorite_player` |
| **ARTICLES**           | `title`, `slug`, `content`, `excerpt`, `category`, `author`, `publish_date`, `is_featured`, `image_url` |
| **VIDEOS**             | `title`, `slug`, `video_url`, `thumbnail_url`, `category`, `publish_date`, `duration`         |
| **PODCASTS**           | `title`, `episode_number`, `audio_url`, `description`, `guest`, `publish_date`, `duration`    |
| **MATCHES**            | `team_a`, `team_b`, `match_date`, `venue`, `status` (upcoming/live/final), `score_a`, `score_b` |
| **PREDICTIONS**        | `user_id`, `match_id`, `predictions` (JSON), `submitted_at`, `score`                          |
| **COMMENTS**           | `user_id`, `username`, `content_type`, `content_id`, `comment_text`, `created_at`             |
| **RATINGS**            | `user_id`, `content_type`, `content_id`, `rating` (1-5), `review_text`                       |
| **SHOP_ITEMS**         | `name`, `description`, `category`, `price_php`, `price_credits`, `stock_status`, `image_url`  |
| **CREDIT_TRANSACTIONS**| `user_id`, `amount`, `source`, `description`, `timestamp`                                     |
| **USER_ACTIVITY**      | `user_id`, `activity_type`, `content_id`, `metadata` (JSON), `timestamp`                      |

Get your **Personal Access Token** from [https://airtable.com/create/tokens](https://airtable.com/create/tokens). The token needs read/write access to all tables in your base.

### 2. Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```
# Airtable Configuration
AIRTABLE_API_KEY=pat_your_airtable_personal_access_token
AIRTABLE_BASE_ID=app_your_pvl_hub_base_id

# Existing PVL Card Game Airtable (for credits integration)
CREDITS_BASE_ID=appo7PS69rWmzEPnC

# JWT Secret for auth tokens
JWT_SECRET=your_random_jwt_secret_here

# Admin password for dashboard access
ADMIN_PASSWORD=your_admin_password_here
```

| Variable            | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| `AIRTABLE_API_KEY`  | Airtable Personal Access Token with read/write permissions         |
| `AIRTABLE_BASE_ID`  | The ID of your PVL Hub Airtable base (starts with `app`)          |
| `CREDITS_BASE_ID`   | Airtable base ID for the existing PVL Card Game (`appo7PS69rWmzEPnC`) |
| `JWT_SECRET`        | Random string used to sign authentication tokens                   |
| `ADMIN_PASSWORD`    | Password to access the admin dashboard                             |

### 3. Seed Data (Optional)

If you have a seed script, run it to populate Airtable with sample data:

```bash
export AIRTABLE_API_KEY=your_key
export AIRTABLE_BASE_ID=your_base
node scripts/seed-data.js
```

Note: The HTML pages contain embedded static demo data, so the platform is fully browsable even without Airtable configured.

### 4. Local Development

**Static browsing (no backend):**

Simply open `index.html` in a browser. All pages render with demo data hardcoded in the HTML. No server required.

**With serverless functions (live Airtable data):**

```bash
npx netlify-cli dev
```

This starts a local dev server (typically at `http://localhost:8888`) that runs both the static site and the Netlify Functions, with API calls proxied from `/api/*` to `/.netlify/functions/*`.

### 5. Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set the build configuration (already handled by `netlify.toml`):
   - **Publish directory:** `.` (project root)
   - **Functions directory:** `netlify/functions`
3. Add all environment variables from `.env` in the Netlify dashboard under **Site settings > Environment variables**
4. Deploy

---

## Airtable Schema

### USERS
Stores all registered user accounts.

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `email`         | Email       | Unique, used for login                     |
| `username`      | Single line | Unique handle                              |
| `password_hash` | Single line | Base64-encoded hash (demo-grade security)  |
| `display_name`  | Single line | Public display name                        |
| `favorite_team` | Single line | e.g. "Creamline Cool Smashers"             |
| `tier`          | Single select| Free, Fan, Superfan, VIP                  |
| `credits`       | Number      | Current credit balance                     |
| `date_joined`   | Date        | Registration date                          |
| `last_login`    | Date        | Most recent login                          |
| `bio`           | Long text   | User bio (max 200 chars on frontend)       |
| `banner_color`  | Single line | Hex color for profile banner               |
| `favorite_player`| Single line | Favorite PVL player name                  |

### ARTICLES
Published articles and news content.

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `title`         | Single line | Article headline                           |
| `slug`          | Single line | URL-friendly identifier                    |
| `content`       | Long text   | Full article body                          |
| `excerpt`       | Long text   | Short preview text                         |
| `category`      | Single select| Game Recap, Analysis, News, Feature, etc. |
| `author`        | Single line | Author name                                |
| `publish_date`  | Date        | Publication date                           |
| `is_featured`   | Checkbox    | Featured on home page                      |
| `image_url`     | URL         | Hero/thumbnail image                       |

### MATCHES
PVL match schedule and results.

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `team_a`        | Single line | Home team name                             |
| `team_b`        | Single line | Away team name                             |
| `match_date`    | Date/time   | Scheduled date and time                    |
| `venue`         | Single line | Arena/location                             |
| `status`        | Single select| upcoming, live, final                     |
| `score_a`       | Number      | Team A final score (sets won)              |
| `score_b`       | Number      | Team B final score (sets won)              |

### PREDICTIONS
User match predictions (5 questions per match).

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `user_id`       | Single line | Airtable record ID of the user             |
| `match_id`      | Single line | Match identifier                           |
| `predictions`   | Long text   | JSON array of question/answer pairs        |
| `submitted_at`  | Date/time   | Submission timestamp                       |
| `score`         | Number      | Number of correct predictions (0-5)        |

### CREDIT_TRANSACTIONS
Ledger of all credit movements.

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `user_id`       | Single line | Airtable record ID of the user             |
| `amount`        | Number      | Positive = earned, negative = spent        |
| `source`        | Single line | e.g. prediction, daily_login, shop, card_game |
| `description`   | Long text   | Human-readable description                 |
| `timestamp`     | Date/time   | Transaction timestamp                      |

### USER_ACTIVITY
Behavioral analytics log.

| Field           | Type        | Notes                                      |
|-----------------|-------------|--------------------------------------------|
| `user_id`       | Single line | Airtable record ID (null for anonymous)    |
| `activity_type` | Single line | Page View, Article Read, Prediction, etc.  |
| `content_id`    | Single line | ID of related content (optional)           |
| `metadata`      | Long text   | JSON with extra context                    |
| `timestamp`     | Date/time   | Activity timestamp                         |

---

## Credits Economy

PVL Hub features a unified virtual currency ("Credits") that connects all platform features into a single engagement loop.

### Earning Credits

| Action                        | Credits Earned |
|-------------------------------|---------------|
| Account registration bonus    | 100           |
| Daily login bonus             | 10            |
| Correct prediction            | 15-25         |
| Perfect prediction (5/5)      | 50            |
| Posting a comment             | 5             |
| Card Game achievements        | Variable      |
| Manager Game achievements     | Variable      |

### Spending Credits

| Action                        | Credit Cost   |
|-------------------------------|---------------|
| Card Booster Pack (10 cards)  | 100           |
| Shop items (digital)          | 15-50         |
| Shop items (physical)         | 25-450        |
| Manager Game upgrades         | Variable      |

### Cross-Platform Integration

Credits sync in real-time across PVL Hub, the Card Game, and the Manager Game. The nav bar displays the current balance on every page, and the `transfer-credits` serverless function handles all additions and deductions with negative-balance protection.

---

## Admin Dashboard

The admin dashboard is the **key sales tool** for the PVL pitch. It demonstrates the depth of analytics available to league stakeholders.

**Demo password:** `pvldemo2026`

### Analytics Sections

1. **Platform Overview** -- Total users, daily active users, total predictions, credits in circulation (with earn/spend breakdown)
2. **User Analytics** -- Daily active users trend (30-day line chart), tier distribution doughnut (Free/Fan/Superfan/VIP), new registrations per week bar chart
3. **Engagement Metrics** -- Engagement by content type (bar chart across 7 features), average session duration trend, most popular content (horizontal bar, top 10)
4. **Predictions Analytics** -- Predictions per match (bar chart), accuracy distribution (pie chart, 0-5 correct), most predicted players (bar chart, top 8)
5. **Key Insights** -- 6 data-driven insight cards (e.g. card game users 3.2x more likely to return daily, prediction players comment 4.5x more, Superfan tier generates 12x engagement)
6. **Comment Sentiment** -- Sentiment trend over 12 weeks (positive/neutral/negative line chart), most discussed players (horizontal bar), trending topics word cloud
7. **Revenue and Credits Economy** -- Credits earned vs spent per week (grouped bar chart), credits by source (doughnut: predictions 35%, card game 25%, manager 20%, daily login 12%, comments 8%), tier upgrade funnel (Free to Fan to Superfan to VIP conversion rates)

All charts use realistic demo data generated with Chart.js 4.x and are styled to match the platform's dark navy/gold theme.

---

## Game Integrations

### PVL Fantasy Card Game

- **Airtable base:** `appo7PS69rWmzEPnC`
- Embedded via iframe on `cards.html`
- Features 100+ player cards across 5 rarity tiers
- Pack opening, lineup building, trading, and leaderboards
- Credits earned in the Card Game are usable across PVL Hub

### PVL Manager Game

- **Airtable base:** `appz9ke2FR9OhyysG`
- **Hosted at:** `https://pvl-manager-game.netlify.app`
- Embedded via iframe on `manager.html`
- Draft, trade, and manage rosters of 200+ PVL players
- Simulated matches with real-time lineup management
- Credits earned in the Manager Game are usable across PVL Hub

Both games display a credits-sync notice and share the unified credits balance shown in the navigation bar.

---

## Demo Notes

- **This is a proof of concept / pitch site** -- not a production application
- **Static demo data** is embedded directly in the HTML files, so the entire platform is browsable offline without any backend configured
- **Serverless functions** connect to Airtable for live data when deployed with proper environment variables
- **Admin dashboard** uses realistic fake data generated by Chart.js helper functions to demonstrate analytics capabilities
- **Password hashing** uses Base64 encoding (demo-grade only) -- a production build would use bcrypt or similar
- **Authentication** uses a simplified JWT implementation -- production would use a proper auth library
- The platform is **not officially affiliated with the PVL** -- this is an independent proof of concept

---

## API Routes

All API routes are proxied from `/api/*` to `/.netlify/functions/*` via `netlify.toml`.

| Method | Endpoint                 | Description                        |
|--------|--------------------------|------------------------------------|
| POST   | `/api/auth-register`     | Register a new user                |
| POST   | `/api/auth-login`        | Log in and receive JWT             |
| GET    | `/api/get-articles`      | Fetch articles (with filters)      |
| GET    | `/api/get-videos`        | Fetch videos (with filters)        |
| GET    | `/api/get-podcasts`      | Fetch podcast episodes             |
| GET    | `/api/get-matches`       | Fetch match schedule               |
| GET    | `/api/get-predictions`   | Fetch predictions for a match      |
| POST   | `/api/submit-prediction` | Submit match predictions           |
| GET    | `/api/get-leaderboard`   | Fetch prediction leaderboard       |
| GET    | `/api/get-comments`      | Fetch comments for content         |
| POST   | `/api/post-comment`      | Post a new comment                 |
| GET    | `/api/get-ratings`       | Fetch ratings for content          |
| POST   | `/api/post-rating`       | Submit a rating/review             |
| GET    | `/api/get-shop-items`    | Fetch shop products                |
| GET    | `/api/get-user-profile`  | Fetch user profile data            |
| POST   | `/api/update-user-profile`| Update user profile               |
| GET    | `/api/get-credits`       | Fetch credit balance & history     |
| POST   | `/api/transfer-credits`  | Add or deduct credits              |
| POST   | `/api/track-activity`    | Log user activity                  |
| GET    | `/api/get-user-activity` | Fetch user activity history        |
| POST   | `/api/admin-dashboard`   | Fetch aggregated admin analytics   |

---

## License

MIT
