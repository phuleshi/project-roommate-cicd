import { UserRow } from "../../components/members/UserRow";

export default function Invoice() {
  const users = [
    { id: 1, name: "Phú (Admin)" },
    { id: 2, name: "Nam" },
    { id: 3, name: "Hùng" },
  ];

  const expenses = [
    { id: 1, name: "Tiền điện", amount: 900000 },
    { id: 2, name: "Tiền nước", amount: 200000 },
  ];

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const per = total / users.length;

  return (
    <div>
      <h2>Hóa đơn tháng</h2>
      <p>Tổng: {total.toLocaleString()} VND</p>
      {users.map(u => (
        <UserRow key={u.id} user={u} amount={per} />
      ))}
    </div>
  );
}
