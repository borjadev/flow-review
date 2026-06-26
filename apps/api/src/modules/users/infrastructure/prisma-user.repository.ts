import type { User as PrismaUser } from '@prisma/client';
import type { PrismaDb } from '../../../shared/infrastructure/prisma/prisma-client.js';
import type { UserRepository } from '../application/user-repository.js';
import { User } from '../domain/user.js';

function toDomain(row: PrismaUser): User {
  return User.fromPersistence({ id: row.id, name: row.name, email: row.email, role: row.role });
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaDb) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async list(): Promise<User[]> {
    const rows = await this.db.user.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toDomain);
  }
}
