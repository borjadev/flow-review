import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

/**
 * Local-development convenience: load a `.env` file if one exists, checking the
 * api package directory first and then the repository root. In containers and CI
 * the environment is provided directly and no file exists, so this is a harmless
 * no-op. Import this module FIRST, before anything that reads `process.env`.
 */
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const file of candidates) {
  if (existsSync(file)) {
    config({ path: file });
    break;
  }
}
