import { useState } from "react";

export default function CostsTab() {
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      name: "Tiền điện",
      amount: 900000,
      paidBy: "Phú",
    },
    {
      id: 2,
      name: "Tiền nước",
      amount: 200000,
      paidBy: "Nam",
    },
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <h3>Chi phí</h3>

      <p><b>Tổng:</b> {total.toLocaleString()} VND</p>

      {expenses.map((e) => (
        <div key={e.id} className="item-row">
          <div>
            <p>{e.name}</p>
            <small>Người trả: {e.paidBy}</small>
          </div>
          <span>{e.amount.toLocaleString()} VND</span>
        </div>
      ))}
    </div>
  );
}