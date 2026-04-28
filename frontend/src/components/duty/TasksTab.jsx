import { useState } from "react";

export default function TasksTab() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Đổ rác", assigned: "Nam", done: false },
    { id: 2, title: "Lau nhà", assigned: "Hùng", done: true },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };

  return (
    <div>
      <h3>Công việc</h3>

      {tasks.map((t) => (
        <div key={t.id} className="item-row">
          <div>
            <p className={t.done ? "done" : ""}>{t.title}</p>
            <small>{t.assigned}</small>
          </div>

          <button onClick={() => toggleTask(t.id)}>
            {t.done ? "✔ Done" : "Chưa xong"}
          </button>
        </div>
      ))}
    </div>
  );
}