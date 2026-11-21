// spot-the-difference entry point (Node 22, standard library only).
//
// The game is the repository's game/ folder: plain static files a desktop
// browser loads offline, game/index.html at its root, no build step and no
// network request. This program hands that game in. The grader mounts the
// repository READ-ONLY at /bot and runs `node /bot/main.ts` as uid 65534 with
// an empty writable /output and MAKEFUN_OUTPUT_DIR naming it, so everything
// this file writes goes under the output directory and nothing is created,
// changed or deleted inside the repository.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// With MAKEFUN_OUTPUT_DIR unset it writes /output, which is where the judge
// reads the entry. The dossier is not written out of hand: vendor/makefun-game.ts
// is the kit's own library, unchanged, and buildDossier is what the scorer runs
// on the handed-in tree, so the dossier written here is byte for byte the one
// the gate rebuilds from game/ and screenshots/.

import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Made before anything else, and its parent too, so a nested output path works.
mkdirSync(outDir, { recursive: true });

/** The files under a directory, in sorted order, with their sizes. */
function walk(dir) {
  const found = [];
  (function step(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const at = join(path, entry.name);
      if (entry.isDirectory()) step(at);
      else if (entry.isFile()) found.push({ path: at, bytes: statSync(at).size });
    }
  })(dir);
  return found;
}

/** Copy one top-level directory of the repository into the output directory. */
function handIn(name) {
  const from = join(here, name);
  const to = join(outDir, name);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  const files = walk(to);
  return { files: files.length, bytes: files.reduce((total, file) => total + file.bytes, 0) };
}

// The game first: the dossier is built from what was just handed in.
const game = handIn('game');
const shots = handIn('screenshots');

// The scorer's own caps, from the bounty's gate. Only text_max_bytes shapes the
// dossier's bytes; the rest bound what the gate accepts, and passing them means
// this program refuses the same entry the gate would refuse.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read the dossier back, so the summary is the handed-in file's own account of
// itself rather than a second description kept in step by hand.
const written = JSON.parse(readFileSync(dossierPath, 'utf8'));
const cover = written.images[0];
const sourceLine = (written.text.split('\n').find((line: string) => line.startsWith('Source files:')) || '').trim();

console.log('spot-the-difference -> ' + outDir);
console.log('  ' + written.schema + ', cover ' + (cover ? cover.name : 'none'));
console.log('  game/          ' + game.files + ' file(s), ' + game.bytes + ' bytes');
console.log('  screenshots/   ' + shots.files + ' file(s), ' + shots.bytes + ' bytes');
for (const image of written.images) {
  console.log('    ' + image.name + '  ' + image.media_type + ', sha256 ' + image.sha256.slice(0, 16) + '…');
}
console.log('  dossier.json   ' + statSync(dossierPath).size + ' bytes, ' + sourceLine);
