export interface UserProps {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * A demo user. Note: these users exist only to simulate "who is acting" in the
 * UI — they are NOT an authentication mechanism (see README / ADR notes).
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get role(): string {
    return this.props.role;
  }
}
