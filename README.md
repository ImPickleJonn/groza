# GROZA · Гроза

**Become the storm. Survive the swarm.**

Bullet-heaven survivor Telegram Mini App. Single-file HTML. One finger to play.

- 🌩 Move with one finger — weapons auto-fire
- ⚡ 6 weapons × evolutions, 6 passives
- 🎭 3 heroes, 3 stages
- 👑 Boss at 5:00, Titan at 10:00 = win
- 📅 Daily challenge with rotating modifier
- 🏆 18 feats, 7 permanent meta upgrades

## Local dev

Requires Node 18+. From the project folder:

```
RUN.bat
```

Opens `http://localhost:3000` with a 2-second delay so the server boots first. To stop, close the terminal window.

## Layout

- `index.html` — entire game, single file
- `server.js` — zero-dependency static file server (also used by Render)
- `RUN.bat` — Windows launcher
- `render.yaml` — Render Blueprint deploy config
- `privacy.html`, `terms.html` — legal pages required for Telegram Stars IAP

## Deploy

Pushes to `main` auto-deploy on Render (see `render.yaml`).

## Telegram bot

Bot: **@GrozaGameBot** · display name **GROZA** · Menu button → Web App pointing at the Render URL.
