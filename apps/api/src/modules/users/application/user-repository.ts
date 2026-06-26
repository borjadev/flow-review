import type { User } from '../domain/user.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
}
