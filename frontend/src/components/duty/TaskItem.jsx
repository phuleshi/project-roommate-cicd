export function TaskItem({ task, onToggle }) {
  return (
    <div className="flex justify-between border p-2 rounded">
      <div>
        <p className={task.done ? "line-through" : ""}>{task.title}</p>
        <small>{task.assigned}</small>
      </div>
      <button onClick={() => onToggle(task.id)}>
        {task.done ? "Hoàn thành" : "Chưa xong"}
      </button>
    </div>
  );
}