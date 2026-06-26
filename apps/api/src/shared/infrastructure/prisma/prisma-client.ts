import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/** Either the root client or a transaction-scoped client. Repositories accept both. */
export type PrismaDb = PrismaClient | Prisma.TransactionClient;

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}
