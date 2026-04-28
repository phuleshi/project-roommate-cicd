export function UserRow({ user, amount }) {
  return (
    <div className="flex justify-between border p-2 rounded">
      <span>{user.name}</span>
      <span>{amount.toLocaleString()} VND</span>
    </div>
  );
}
