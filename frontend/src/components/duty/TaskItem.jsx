import { useLanguage } from "../../context/LanguageContext";

export function TaskItem({ task, onToggle }) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between border p-2 rounded">
      <div>
        <p className={task.done ? "line-through" : ""}>{task.title}</p>
        <small>{task.assigned}</small>
      </div>
      <button onClick={() => onToggle(task.id)}>
        {task.done ? t("duty.done") : t("misc.notDone")}
      </button>
    </div>
  );
}
