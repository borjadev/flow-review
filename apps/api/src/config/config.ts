import { z } from 'zod';

/** Parses "true"/"false" strings (and real booleans) into a boolean. */
const booleanFromString = z.preprocess(
  (value) => value === true || value === 'true',
  z.boolean(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_VERBOSE_PAYLOADS: booleanFromString.default(false),
  DATABASE_URL: z.string().min(1),
  AI_PROVIDER: z.enum(['fake', 'openai']).default('fake'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  CLASSIFIER_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  ROUTING_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  isProduction: boolean;
  apiPort: number;
  corsOrigins: string[];
  logVerbosePayloads: boolean;
  databaseUrl: string;
  aiProvider: 'fake' | 'openai';
  openaiApiKey: string | undefined;
  openaiModel: string;
  classifierMaxRetries: number;
  routingConfidenceThreshold: number;
};

/**
 * Loads and validates configuration from the environment. Fails fast with a
 * readable message if the environment is invalid. This is the only place
 * environment variables are read.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const value = parsed.data;
  return {
    nodeEnv: value.NODE_ENV,
    isProduction: value.NODE_ENV === 'production',
    apiPort: value.API_PORT,
    corsOrigins: value.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    logVerbosePayloads: value.LOG_VERBOSE_PAYLOADS,
    databaseUrl: value.DATABASE_URL,
    aiProvider: value.AI_PROVIDER,
    openaiApiKey: value.OPENAI_API_KEY,
    openaiModel: value.OPENAI_MODEL,
    classifierMaxRetries: value.CLASSIFIER_MAX_RETRIES,
    routingConfidenceThreshold: value.ROUTING_CONFIDENCE_THRESHOLD,
  };
}
