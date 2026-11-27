// Entry program for news-image-20261127.
//
// The deliverable is the front-page image itself, entry.png. This script
// copies that file into the output directory the harness points at and
// verifies the copy, so the graded bytes are exactly the bytes in the
// repository. It never draws or alters the image.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const sourcePath = join(here, 'entry.png');
const destPath = join(outDir, 'entry.png');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function sha256Hex(data: Buffer): Promise<string> {
  return createHash('sha256').update(data).digest('hex');
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const image = await readFile(sourcePath);
  // Refuse to ship anything that is not a whole PNG: the gate judges the
  // file by its first bytes, so a truncated or non-PNG source must fail
  // here, loudly, instead of reaching the judge as a broken entry.
  if (!image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('entry.png is not a PNG file (bad signature)');
  }
  // The competition gate refuses images over 1 MiB; fail here rather than
  // shipping an entry that can never be judged.
  const ONE_MIB = 1024 * 1024;
  if (image.length > ONE_MIB) {
    throw new Error(`entry.png is ${image.length} bytes, over the 1 MiB limit`);
  }
  await writeFile(destPath, image);
  const copied = await readFile(destPath);
  const sourceHash = await sha256Hex(image);
  if ((await sha256Hex(copied)) !== sourceHash) {
    throw new Error('entry.png copy failed verification against the source');
  }
  console.log(`wrote ${image.length} bytes to ${destPath} (sha256 ${sourceHash})`);
}

await main();
