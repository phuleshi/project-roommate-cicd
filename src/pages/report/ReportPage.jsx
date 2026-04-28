export default function Report() {
  const expenses = [
    { id: 1, name: "Tiền điện", amount: 900000 },
    { id: 2, name: "Tiền nước", amount: 200000 },
  ];

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h2>Báo cáo</h2>
      <p>Tổng chi: {total.toLocaleString()} VND</p>

      {expenses.map(e => (
        <div key={e.id} className="border p-2 rounded">
          {e.name} - {e.amount.toLocaleString()} VND
        </div>
      ))}
    </div>
  );
}