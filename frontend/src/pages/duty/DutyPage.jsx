import { useState } from "react";
import { TaskItem } from "../../components/duty/TaskItem";

export default function DailyDuty() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Đổ rác", assigned: "Nam", done: false },
    { id: 2, title: "Lau nhà", assigned: "Hùng", done: true },
  ]);

  const toggle = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div>
      <h2>Trực nhật</h2>
      {tasks.map(t => (
        <TaskItem key={t.id} task={t} onToggle={toggle} />
      ))}
    </div>
  );
}
