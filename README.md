# 🎮 PlayNova — Play More. Download Nothing.

**A modern, free browser gaming portal built for the Web Engineering Lab Final Project.**

PlayNova brings games together in one colourful, easy-to-use place. Visitors can find a game, start playing right in their browser, and pick up where they left off—**no downloads or player accounts required**. The project also includes a secure admin area for keeping the game collection up to date.

## ✨ What Makes PlayNova Useful?

- **10 playable games, 6 categories** — original HTML5/JavaScript games with instructions, restart controls, scores, and fullscreen support where available.
- **Easy discovery** — search games, explore categories, and browse featured, popular, or new titles.
- **A personal play space** — favourites, recently played games, best scores, and dark/light preference saved locally in the browser.
- **Built for every screen** — responsive layouts, mobile-friendly navigation, and keyboard/touch controls where appropriate.
- **A real admin dashboard** — add, edit, hide, or delete games; manage categories and featured labels; read contact messages.
- **Room to grow** — spaces reserved for future advertisements and an optional ad-free membership, clearly labelled *Coming Soon*.

### 🕹️ Games You Can Play

| Category | Games |
| --- | --- |
| **Puzzle** | Merge 2048, Minefield, Tile Quest |
| **Action** | Pixel Duel, Quick Spark |
| **Racing** | Neon Drift |
| **Arcade** | Brick Galaxy |
| **Adventure** | Snake Odyssey |
| **Brain Training** | Cosmic Match, Echo Sequence |

Each game opens on its own page with **gameplay, instructions, controls, and related recommendations**. Admins may also register properly licensed local HTML5 games or authorised external game links/embeds. Third-party games are **not** bundled with the project.

## 🛠️ Built With

**Frontend:** React, Vite, Tailwind CSS, Lucide React  
**Backend:** Node.js, Express  
**Database:** SQLite (`node:sqlite`)  
**Games:** JavaScript, React, HTML5 Canvas  
**Testing:** Node.js built-in test runner

Everything needed for the **local version uses free tooling**—no paid APIs, premium plugins, or cloud database are required.

## 🚀 Run It Locally (Windows)

Install **Node.js 22.13+**, then open PowerShell in the downloaded project folder:

```powershell
npm ci
Copy-Item .env.example .env
npm run admin:setup
npm run dev
```

The setup command creates an admin account and prints a **generated password** if none is set in `.env`. Save that password privately; there is **no default admin password**.

| Open | URL |
| --- | --- |
| **Gaming portal** | http://127.0.0.1:5173 |
| **Admin dashboard** | http://127.0.0.1:5173/admin |
| **API health check** | http://127.0.0.1:3001/api/health |

For a production-style local build:

```powershell
npm test
npm run build
npm start
```

The built website runs at **http://127.0.0.1:3001**. `npm test` checks API behaviour, authentication, game management, database persistence, and selected game rules.

## 🔐 Security & Data

Security was considered from the start: **hashed admin passwords, protected sessions, CSRF and origin checks, login rate limiting, input validation, and parameterised database queries**.

- `.env`, local SQLite data, build output, and `node_modules` are excluded from Git tracking through `.gitignore`.
- **No passwords, API keys, or private database files should be uploaded to GitHub.**
- Contact-form submissions are saved in the protected admin inbox; **they are not sent as emails**.
- Favourites, history, theme, and personal scores are stored in browser `localStorage`, not synced across devices.

## 💰 Cost-Effective by Design

The local project needs **no paid software or hosting**. For the lab's MVP quotation, an **illustrative development estimate is ৳12,000 over 5 days**. Publishing it online may add domain, hosting, persistent database storage, backup, and game-licensing costs.

**Important:** A public deployment needs persistent storage for SQLite—free temporary hosting may erase the database. Only games and assets with the right usage permissions should be added.

## 🔮 What Could Come Next?

Player accounts, cloud-synced scores, advanced leaderboards, real advertisements, payments, and an ad-free subscription are **future ideas—not features claimed as complete today**.

---

**Made for quick breaks, friendly competition, and the simple joy of playing.**