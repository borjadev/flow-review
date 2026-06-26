import type { UserRepository } from './user-repository.js';

export interface DemoUserView {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class ListDemoUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<DemoUserView[]> {
    const users = await this.users.list();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }
}
