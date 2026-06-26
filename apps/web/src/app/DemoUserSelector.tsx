import { useEffect } from 'react';
import { useUsers } from '../shared/api/hooks';
import { useDemoUser } from '../shared/hooks/demo-user-context';

export function DemoUserSelector() {
  const { selectedUserId, setSelectedUserId } = useDemoUser();
  const { data: users, isPending, isError } = useUsers();

  // Auto-select the first user once the list arrives and none is selected.
  useEffect(() => {
    const firstUser = users?.[0];
    if (!firstUser) {
      return;
    }
    const stillValid = selectedUserId && users.some((user) => user.id === selectedUserId);
    if (!stillValid) {
      setSelectedUserId(firstUser.id);
    }
  }, [users, selectedUserId, setSelectedUserId]);

  return (
    <div className="demo-user">
      <label className="demo-user__label" htmlFor="demo-user-select">
        Acting as
      </label>
      <select
        id="demo-user-select"
        className="demo-user__select"
        value={selectedUserId ?? ''}
        disabled={isPending || isError || !users || users.length === 0}
        onChange={(event) => {
          setSelectedUserId(event.target.value || null);
        }}
      >
        {(!users || users.length === 0) && <option value="">No users available</option>}
        {users?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
      <span className="demo-user__note">Demo only — not real authentication.</span>
    </div>
  );
}
