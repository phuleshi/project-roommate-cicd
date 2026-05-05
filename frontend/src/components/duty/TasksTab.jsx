import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function TasksTab() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Take out trash", assigned: "Nam", done: false },
    { id: 2, title: "Mop floor", assigned: "Hung", done: true },
  ]);
  const { t } = useLanguage();

  const toggleTask = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  return (
    <div>
      <h3>{t("misc.tasksTabTitle")}</h3>

      {tasks.map((task) => (
        <div key={task.id} className="item-row">
          <div>
            <p className={task.done ? "done" : ""}>{task.title}</p>
            <small>{task.assigned}</small>
          </div>

          <button onClick={() => toggleTask(task.id)}>
            {task.done ? t("duty.done") : t("misc.notDone")}
          </button>
        </div>
      ))}
    </div>
  );
}
