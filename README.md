# The Great Pollination Race

A GTAC classroom game: students win funding, build a pollinator transporter
under budget, space and power limits, then drive it around seven Victorian
farms, handling events along the way.

## Run locally

It's a static site — no build step. Serve this folder over HTTP, for example:

```bash
python -m http.server 8765
```

then open <http://localhost:8765>. (ES modules used by the mini-games don't load
from `file://`.)

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `styles/`, `scripts/game.js` | Main game: title, builder, journey, scoring |
| `scripts/title.js` | Title-screen bee animation |
| `scripts/minigames.js` | Loads the mini-games on demand |
| `minigames/grant-grab/` | Grant Grab (funding round after Start) |
| `minigames/pollen-rush/` | Pollen Rush (optional bonus at each farm) |
| `data/` | Components, route and events |
| `assets/` | Art, fonts, truck layers |

## Tuning the game

Balance numbers live at the top of `scripts/game.js`:

- `FUNDING_RULES` — Grant Grab base funding and maximum bonus.
- `POLLEN_RUSH_MAX_BONUS_PCT` — best-case Pollen Rush boost per farm.
- `BALANCE` — farm pollination demand, bee ageing, charging, lateness,
  and the score weights.

Component prices, power and notes are in `data/components.json`.

## Deploying

The live copy is served by Caddy from `~/apps/pollen` on `bird`
(`richard.made-this.app/pollen/`). Copy the tracked files there.
