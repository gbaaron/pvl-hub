# PVL Hub — Outstanding Work / Roadmap

Running list of things still to change. Grouped by area. Checked items are
done on the `claude/app-status-overview-b2yl3w` branch; unchecked items remain.

_Last updated: 2026-07-01_

---

## ✅ Recently shipped (this branch)
- [x] Smart cross-app game launchers (web new-tab + native deep-link / App Store fallback)
- [x] Multi-select favorite teams **and** players (registration, profile, My Feed)
- [x] My Feed page (next game, venue, tickets, write-ups) + "Players to Watch"
- [x] Site-wide notification bell + first-run onboarding modal + nudge banner
- [x] Personalized home countdown + "For You" band
- [x] Follow/unfollow activity tracking
- [x] Admin "Fan Personalization" analytics (wired to real backend aggregation, demo fallback)
- [x] Capacitor iOS/Android scaffold + `window.PVLNative` bridge

---

## 📱 Native app (iOS/Android)
- [ ] Fill in real **App Store / Play Store URLs** and confirm deep-link **schemes** in `js/launch.js` (`PRODUCTS`) — currently `TODO` placeholders; launcher falls back to web until then.
- [ ] On a Mac: `npx cap add ios`, set signing team, run in Xcode (see `mobile/README.md`).
- [ ] Add **Push Notifications** + **Background Modes → Remote notifications** capabilities in Xcode.
- [ ] Create an **APNs key**; stand up a push sender (e.g. FCM or custom).
- [ ] Persist device tokens: `native-bridge.js` `registration` listener → new backend endpoint.
- [ ] Register `pvlhub://` URL type so sibling apps can open the Hub back.
- [ ] Add **Associated Domains** + host `apple-app-site-association` for universal links.
- [ ] Decide bundled-web vs `server.url` wrapping; set the live Hub URL in `mobile/capacitor.config.json`.

## 🔔 Notifications
- [ ] Server-side scheduler to actually **send** game-reminder pushes for followed teams (in-app reminders exist client-side today).
- [ ] Persist notification read-state to the backend (currently `localStorage` only).

## ⭐ Personalization / content data
- [ ] Replace static demo data in `js/pvl-data.js` (rosters, schedule, write-ups) with **live Airtable** / a real schedule feed.
- [ ] Real **ticket links** (currently a Ticketmaster placeholder).
- [ ] Link feed write-ups to **real article records** (currently team-text filtering on `articles.html`).
- [ ] Add real **logos for Petro Gazz & Chery Tiggo** (currently text-abbreviation fallback).
- [ ] Add `favorite_teams` / `favorite_players` (array) fields to Airtable **USERS**; make server-side persistence primary (currently localStorage-first, best-effort sync).

## 📊 Admin / analytics
- [ ] Align the admin gate password with the server `ADMIN_PASSWORD` (or add real admin auth) so live favorites data loads instead of demo.
- [ ] Aggregate the **remaining** admin charts from real data (many are still demo).
- [ ] Add favorites **trends over time** (follows per week).

## 🔒 Security / production hardening (see README "Demo Notes")
- [ ] Replace **Base64 password hashing** with bcrypt/argon2.
- [ ] Proper **JWT** library with expiry/refresh; server-side session validation.
- [ ] Move the **admin password off the client**; server-verified admin sessions.
- [ ] Input validation + rate limiting on all serverless functions.

## 🧪 QA / polish
- [ ] Cross-browser + real-device QA of the new UI (onboarding modal, nudge, feed, bell).
- [ ] Accessibility pass (focus traps in modal, ARIA on bell/menu).
- [ ] Confirm the notification bell/nudge look right on every page's nav variant.
