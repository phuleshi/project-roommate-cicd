import { useState } from "react";

export default function DutyCalendar() {
  const [duties, setDuties] = useState([
    { id: 1, date: "2026-04-22", task: "Đổ rác", user: "Nam", done: false },
    { id: 2, date: "2026-04-22", task: "Lau nhà", user: "Hùng", done: true },
  ]);

  const toggle = (id) => {
    setDuties(duties.map(d =>
      d.id === id ? { ...d, done: !d.done } : d
    ));
  };

  return (
    <div>
      <h3>Lịch trực nhật</h3>

      {duties.map((d) => (
        <div key={d.id} className="item-row">
          <div>
            <p className={d.done ? "done" : ""}>{d.task}</p>
            <small>{d.user} - {d.date}</small>
          </div>

          <button onClick={() => toggle(d.id)}>
            {d.done ? "✔ Done" : "Chưa xong"}
          </button>
        </div>
      ))}
    </div>
  );
}