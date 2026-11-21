# spot-the-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/genkstrx/spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/genkstrx/spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

An entry for the [make.fun](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
bounty “Make the best spot the difference game”: **Harbour Hunt**, a spot the
difference game in one self-contained HTML file. Two hand-drawn harbour pictures
sit side by side at dusk — five things are not the same, and the pictures,
markers, timer and score are all drawn by the page itself, with no network
request and no build step.

Each round is a different harbour: the layout, the clouds, the birds, the boats
and the waves come from a seed, and the five differences are one of each kind —
a colour, a missing thing, an extra thing, a size and a position — chosen from
the props in the scene. “New round” deals a fresh seed.

## Run it

Hand the entry in (writes `app/`, `screenshots/` and `dossier.json` into the
output directory; it never writes inside the repository):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

With `MAKEFUN_OUTPUT_DIR` unset it writes `/output`, which is where the judge
reads the entry.

To play it, serve `app/` with any static file server and open `index.html`:

```sh
python3 -m http.server 8080 --directory app
# then open http://localhost:8080/
```

## How to play

- Click or tap a difference in either picture; a found one is circled in both.
- Keyboard: arrow keys move the cursor, `Tab` switches picture, `Enter` marks.
- `H` hints (costs points), `R` restarts the round, `N` deals a new harbour.
- Three minutes on the clock; finds in quick succession raise the combo.

## Files

- `app/index.html` — the whole game: scene, differences, input, HUD, styles.
- `screenshots/` — renders of the game itself (the first by name is the cover).
- `main.ts` — the entry point; reads the repository, writes the output directory.
- `.makefun/owner.json` — the entry’s wallet.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2wxjspza&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
