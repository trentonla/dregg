# Dregg — Offline Use on iPhone (No Developer Account)

**Short answer:** Yes — with **one free static deploy**. Safari’s “Add to Home Screen / Open as Web
App” needs an `https://` URL, so a local HTML file cannot be installed as a true home-screen app. But
once the app is installed from a static host, a service worker caches everything and the app runs
**fully offline**. No Apple Developer account, App Store, signing, paid service, or ongoing network
connection is required.

This document is the install, verification, and troubleshooting guide. The builder should record the
actual test result in §8 during M0.

---

## 1. What works and what does not

| Approach | Home-screen app? | Offline? | Verdict |
| --- | --- | --- | --- |
| Single `file://` HTML file in Safari/Files | No reliable install | N/A | Not viable for a real app |
| Local server app on the phone (a-Shell, etc.) | No real PWA install; server must run | Only while running | Not viable |
| Static HTTPS host + “Open as Web App” | Yes | Yes, after first load | **Recommended** |
| App Store / TestFlight | Yes | Yes | Needs Apple Developer account; out of scope |

Why the file-only path fails:

- **Installability requires HTTPS or localhost.** MDN’s installability requirements are explicit;
  `file://` is not an installable origin. Safari’s “Open as Web App” is designed for a website.
- **Service workers require a secure context** — HTTPS or `localhost`. They do not register from
  `file://`, so there is no reliable offline cache.
- Safari on iPhone/iPad no longer opens arbitrary local HTML files as a normal browser page; the
  Files preview and third-party viewers do not provide a home-screen app.

So the one-time host is not “hosting the app for daily use.” It is the install/update channel. After
the first load, the app is local.

---

## 2. Recommended setup

**GitHub Pages from a public repository.** It is free, serves over HTTPS, and needs only a normal
GitHub account — not an Apple developer account.

- Free GitHub Pages requires a public repo. Private Pages requires a paid GitHub plan. The repo
  contains no personal data (progress is on the phone), so a public repo is usually fine.
- Alternatives with free tiers: Netlify, Cloudflare Pages. Use one if you need private source or do
  not want a GitHub account.
- The repository name and GitHub username are visible in the URL; do not put anything sensitive in
  the repo.

The app is a static `app/` folder. No server code, database, or secrets.

**Target:** iOS 16.4+ (Safari Add to Home Screen / Open as Web App; service workers are supported).
iOS 17+ is recommended because `navigator.storage.persist()` is fully supported there; feature-detect
it and fall back to best-effort storage on older versions.

---

## 3. One-time deploy

The builder will wire this up, but the shape is:

1. Create a public GitHub repository.
2. Add the app under `app/`.
3. Add `.github/workflows/pages.yml` to publish `app/` to GitHub Pages.
4. Run the precache generator (`node tools/precache.mjs`) so `sw.js` lists every runtime file.
5. Enable Pages (GitHub → Settings → Pages → GitHub Actions).
6. Open `https://<user>.github.io/<repo>/` on the phone.

HTTPS is automatic on `github.io`. No certificate or domain setup is needed.

---

## 4. Install on the iPhone

1. Open the Pages URL in **Safari**. Do not use an in-app browser (Messages, Mail, etc.).
2. Wait for the app to show **“Ready offline.”** This means the service worker has finished caching.
3. Tap **Share** → **Add to Home Screen**.
4. Turn on **Open as Web App**.
5. Tap **Add**.
6. Launch from the new Home Screen icon, not from a Safari tab.

The icon should open without Safari’s address bar or toolbar. The app uses the paper background and
its own navigation.

Implementation note: include both the web app manifest (`display: standalone`) and the legacy iOS
meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`,
`apple-mobile-web-app-status-bar-style`) plus a 180×180 `apple-touch-icon`. iOS uses the Share-sheet
toggle for install, but these improve standalone behavior and the Home Screen icon.

---

## 5. Verify offline use

Do this once after install, and again after any update:

1. While online, open the app and wait for “Ready offline.”
2. Enable **Airplane Mode**.
3. Force-quit the app (swipe up from the app switcher).
4. Relaunch from the Home Screen icon.
5. Complete a full session.
6. Force-quit and relaunch again; confirm progress and settings persisted.
7. Open the network panel on a desktop test build, or use a proxy, to confirm zero requests after the
   first load. On the phone, the strongest check is Airplane Mode plus a cold launch.

If the app opens blank in Airplane Mode, the service worker did not finish installing. Reconnect,
open the app, wait for “Ready offline,” and try again.

---

## 6. Updates (optional)

The app is usable offline indefinitely on the version it has cached. Updates require one online visit.

- On deploy, the cache version is bumped. When online, the new service worker installs in the
  background and the app shows “Update ready — reload.”
- Reloading is optional. The old cached version keeps working offline.
- iOS may not check for a new service worker until the app is relaunched. Opening the app online and
  closing/reopening it is enough.
- If an update gets stuck, delete the Home Screen icon, clear the site’s website data only if
  necessary, and re-add it. Export a backup first if progress matters.

---

## 7. Storage persistence

Progress is stored in `localStorage` on the phone. There is no cloud copy.

- The app calls `navigator.storage.persist()` after install. WebKit grants this based on heuristics,
  and being opened as a Home Screen web app is a positive signal.
- Home Screen web apps are not part of Safari and have their own counter for Safari’s 7-day
  script-writable-storage cap, so they are not expected to lose first-party data after a week of not
  being opened. This is much safer than a Safari tab.
- Storage is still best-effort under system storage pressure. iOS can evict website data, and the
  user can clear it manually.
- Therefore: offer **Export backup** in Settings, show **Last saved**, and remind the user
  occasionally. Import restores progress on a new phone.

No sync, accounts, or server-side backup. The JSON export is the backup.

---

## 8. M0 test result (builder fills this in)

- iPhone model:
- iOS version:
- Safari version:
- Host / URL:
- Install method (Open as Web App on/off):
- Launch is standalone (no browser chrome): yes / no
- “Ready offline” appeared after first load: yes / no
- Airplane Mode cold launch: pass / fail
- Full session offline: pass / fail
- Progress persisted across relaunch: pass / fail
- `navigator.storage.persist()` result: granted / denied / unsupported
- Update flow tested: pass / fail / not tested
- Quirks or workarounds:

M0 passes only if the Airplane Mode cold launch, a full session, and progress persistence all pass.
If they do not, stop and choose a different distribution approach before building the app.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No “Add to Home Screen” | Not in Safari, or the action is hidden | Use Safari; scroll the share sheet; Edit Actions → add it |
| Icon opens with browser chrome | “Open as Web App” was off, or the manifest is missing `display: standalone` | Delete the icon; re-add with the toggle on; verify the manifest |
| Blank screen offline | Service worker did not finish installing | Open online, wait for “Ready offline,” retry |
| Stale version | Old cache still active | Open online; accept the update toast; relaunch; if stuck, delete/re-add |
| Progress gone | Website data cleared, storage eviction, or a different origin (URL changed) | Restore from the exported JSON; keep the same URL |
| No speech | Voice not installed or speech disabled | Dictation is optional; the app must work without it |
| App opens in a private tab | Private browsing | Use a normal tab; private storage is temporary |

---

## 10. Limitations and honest caveats

- **One device, one install.** This is a sole-user app. There is no sync.
- **Updates need one online visit.** Daily use does not.
- **iOS storage can be evicted.** Home Screen install plus `persist()` makes it unlikely, but export
  backups are the real safety net.
- **The first install needs network.** There is no way around this for a real home-screen app.
- **A public repo is visible.** The app source is not secret; user progress never leaves the phone.
- **No push notifications, background sync, or App Store presence.** None are needed.
- **Safari is the reliable install path.** iOS 16.4+ also allows Add to Home Screen from some other
  browsers via the share sheet, but Safari is the one to document and test.

---

## 11. Sources

- Apple Support, *Turn a website into an app in Safari on iPhone* — Share → Add to Home Screen →
  Open as Web App.
- MDN, *Making PWAs installable* — installability requires HTTPS or localhost; `file://` is not an
  installable origin; service workers require a secure context.
- WebKit, *Updates to Storage Policy* (2023) — quota, eviction, persistent mode, and standalone web
  app behavior.
- WebKit, *Full Third-Party Cookie Blocking and More* (2020) — Home Screen web apps have their own
  counter for the 7-day cap.
- GitHub Docs, *What is GitHub Pages?* — free for public repos; HTTPS hosting; private repos require
  a paid plan.
