// spot-the-difference entry point (Node 22, standard library only).
//
// The grader mounts this repository READ-ONLY at /bot and runs `node main.ts`
// as an unprivileged user (uid 65534) with an empty, writable /output and
// MAKEFUN_OUTPUT_DIR pointing at it. So this program reads the repository and
// writes only inside the output directory: it makes the directory first, copies
// app/ and screenshots/ into it, writes dossier.json there, and prints a
// summary. It never creates, changes or deletes anything inside the repository.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// With MAKEFUN_OUTPUT_DIR unset it writes to /output, which is where the judge
// reads the entry.

import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The output directory is made before anything else, and its own parent too,
// so a nested MAKEFUN_OUTPUT_DIR works.
mkdirSync(outDir, { recursive: true });

function copyTree(name) {
  const from = join(here, name);
  const to = join(outDir, name);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return to;
}

// A whole directory of the repository is handed in: app/ is the game.
copyTree('app');
copyTree('screenshots');

/** The pixel size of a PNG or JPEG, read from its header; null when unknown. */
function imageSize(buffer) {
  // PNG: the width and height are the first two big-endian words of the IHDR.
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: walk the markers to a start-of-frame, which carries the dimensions.
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < buffer.length) {
    if (buffer[at] !== 0xff) { at += 1; continue; }
    const marker = buffer[at + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { at += 2; continue; }
    const length = buffer.readUInt16BE(at + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(at + 5), width: buffer.readUInt16BE(at + 7) };
    }
    if (length < 2) return null;
    at += 2 + length;
  }
  return null;
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function bytesOf(dir, name) {
  return statSync(join(dir, name)).size;
}

const shotNames = listFiles(join(here, 'screenshots'));
const images = shotNames.map((name, index) => {
  const buffer = readFileSync(join(here, 'screenshots', name));
  const size = imageSize(buffer);
  return {
    index,
    name,
    bytes: buffer.length,
    width: size ? size.width : 0,
    height: size ? size.height : 0,
    cover: index === 0,
  };
});

const appNames = listFiles(join(here, 'app'));
const appBytes = appNames.reduce((total, name) => total + bytesOf(join(here, 'app'), name), 0);

// The page itself is read back for the dossier: its title and its hash. A
// missing index.html is a broken entry, so it stops here rather than handing
// in an empty app.
const indexPath = join(here, 'app', 'index.html');
if (!appNames.includes('index.html')) {
  throw new Error('app/index.html is missing beside ' + join(here, 'app'));
}
const indexBytes = readFileSync(indexPath);
const indexTitle = /<title>([\s\S]*?)<\/title>/.exec(indexBytes.toString('utf8'))?.[1]?.trim() || '';

// The dossier the judge reads: the cover's index, every screenshot with its
// size, and a few facts about the entry.
const dossier = {
  cover: 0,
  images,
  game: 'Harbour Hunt',
  title: indexTitle,
  kind: 'spot-the-difference',
  differences: 5,
  source: 'app/index.html',
  indexSha256: createHash('sha256').update(indexBytes).digest('hex'),
  app: { files: appNames.length, bytes: appBytes, index: 'app/index.html' },
  screenshots: { files: images.length, bytes: images.reduce((total, image) => total + image.bytes, 0) },
  repository: 'spot-the-difference',
  writtenBy: 'main.ts',
};

const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, JSON.stringify(dossier, null, 2) + '\n');

const shotBytes = images.reduce((total, image) => total + image.bytes, 0);
console.log('spot-the-difference -> ' + outDir);
if (indexTitle) console.log('  ' + indexTitle);
console.log('  app/          ' + appNames.length + ' file(s), ' + appBytes + ' bytes');
console.log('  screenshots/  ' + images.length + ' file(s), ' + shotBytes + ' bytes');
for (const image of images) {
  console.log('    ' + image.name + '  ' + image.width + 'x' + image.height + ', ' + image.bytes + ' bytes');
}
console.log('  dossier.json  ' + bytesOf(outDir, 'dossier.json') + ' bytes, cover ' + (images[0] ? images[0].name : 'none'));
