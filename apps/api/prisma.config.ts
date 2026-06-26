import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma no longer auto-loads .env when a config file is present, so load it here.
// Prefer the api package's own .env, then fall back to the repository root.
for (const file of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(file)) {
    loadEnv({ path: file });
    break;
  }
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
});
