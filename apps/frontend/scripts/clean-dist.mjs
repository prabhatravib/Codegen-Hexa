import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const distPath = resolve(process.cwd(), 'dist');

if (!existsSync(distPath)) {
  process.exit(0);
}

const MAX_ATTEMPTS = 5;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    rmSync(distPath, { recursive: true, force: true });
    console.log(`[clean-dist] Removed ${distPath}`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[clean-dist] Attempt ${attempt} failed: ${message}`);

    if (attempt === MAX_ATTEMPTS) {
      console.warn('[clean-dist] Continuing build with existing dist directory (will rely on hashed filenames).');
      process.exit(0);
    }

    const backoffMs = 500 * attempt;
    await sleep(backoffMs);
  }
}