import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTaskDone,
  transferTask,
} from "../../services/taskService";
import { getMyRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./DutyPage.css";

function DutyPage() {
  const [room, setRoom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 14);
  const startDate = today.toISOString().split("T")[0];
  const endDate = nextWeek.toISOString().split("T")[0];
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [repeatType, setRepeatType] = useState("daily");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRoom = await getMyRoom();
      setRoom(myRoom);
      if (myRoom) {
        const taskData = await getTasks(startDate, endDate);
        setAssignments(taskData);
      }
    } catch (err) {
      window.alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!newTitle || selectedAssignees.length === 0) {
      window.alert(t("duty.missingInfo"));
      return;
    }

    try {
      await createTask({
        title: newTitle,
        description: newDesc,
        repeat_type: repeatType,
        assignees: selectedAssignees.map((id) => parseInt(id, 10)),
        start_date: new Date().toISOString().split("T")[0],
      });
      setShowModal(false);
      setNewTitle("");
      setNewDesc("");
      setSelectedAssignees([]);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleToggleDone = async (id) => {
    try {
      await toggleTaskDone(id);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleTransfer = async (id) => {
    if (!window.confirm(t("duty.confirmTransfer"))) return;
    try {
      await transferTask(id);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(t("duty.confirmDelete"))) return;
    try {
      await deleteTask(taskId);
      fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const toggleAssignee = (id) => {
    const value = id.toString();
    setSelectedAssignees((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );
  };

  if (loading) {
    return <div className="duty-loading">{t("duty.loading")}</div>;
  }

  if (!room) {
    return <div className="duty-error">{t("common.noRoom")}</div>;
  }

  const isAdmin = room.currentUserRole === "admin";
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const groupedTasks = assignments.reduce((accumulator, current) => {
    const date = current.assigned_date.split("T")[0];
    if (!accumulator[date]) accumulator[date] = [];
    accumulator[date].push(current);
    return accumulator;
  }, {});

  const daysArray = [];
  for (let index = 0; index < 14; index += 1) {
    const day = new Date();
    day.setDate(day.getDate() + index);
    daysArray.push(day.toISOString().split("T")[0]);
  }

  return (
    <div className="duty-container">
      <div className="duty-header">
        <div>
          <h2 className="page-title">{t("duty.pageTitle")}</h2>
          <p className="page-subtitle">{t("duty.subtitle")}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + {t("duty.createSchedule")}
          </button>
        )}
      </div>

      <div className="timeline-container">
        {daysArray.map((dateStr) => {
          const tasksForDay = groupedTasks[dateStr] || [];
          const dateObj = new Date(dateStr);
          const isToday = dateStr === today.toISOString().split("T")[0];

          return (
            <div key={dateStr} className={`timeline-day ${isToday ? "today" : ""}`}>
              <div className="day-label">
                <span className="weekday">
                  {isToday ? t("duty.todayLabel") : dateObj.toLocaleDateString(locale, { weekday: "short" })}
                </span>
                <span className="date">
                  {dateObj.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })}
                </span>
              </div>

              <div className="day-content">
                {tasksForDay.length === 0 ? (
                  <div className="no-tasks">{t("duty.noTask")}</div>
                ) : (
                  tasksForDay.map((task) => {
                    const isMyTask = task.user_id === currentUser.id;
                    const isDone = task.status === "done";

                    return (
                      <div
                        key={task.id}
                        className={`task-card ${isDone ? "done" : ""} ${isMyTask ? "is-mine" : ""}`}
                      >
                        <div className="task-main">
                          <div className="task-title">
                            <h4>{task.title}</h4>
                            <span className="tag">
                              {task.repeat_type === "daily" ? t("duty.daily") : t("duty.weekly")}
                            </span>
                          </div>
                          <p className="task-desc">{task.description}</p>

                          <div className="assignee">
                            <div className="avatar">{task.assignee_name.charAt(0)}</div>
                            <span>
                              {task.assignee_name} {isMyTask ? t("duty.currentUser") : ""}
                            </span>
                          </div>

                          {task.note && <div className="task-note">{t("duty.note", { note: task.note })}</div>}
                        </div>

                        <div className="task-actions">
                          {isDone ? (
                            <div className="status-done">✓ {t("duty.done")}</div>
                          ) : (
                            isToday && (
                              <>
                                {isMyTask ? (
                                  <button className="btn-done" onClick={() => handleToggleDone(task.id)}>
                                    {t("duty.complete")}
                                  </button>
                                ) : (
                                  <button className="btn-help" onClick={() => handleTransfer(task.id)}>
                                    {t("duty.helpOut")}
                                  </button>
                                )}
                              </>
                            )
                          )}
                          {isAdmin && (
                            <button
                              className="btn-icon-danger"
                              onClick={() => handleDeleteTask(task.task_id)}
                              title={t("duty.deleteTitle")}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t("duty.createModalTitle")}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label>{t("duty.taskName")}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder={t("duty.taskNamePlaceholder")}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("duty.noteLabel")}</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(event) => setNewDesc(event.target.value)}
                  placeholder={t("duty.notePlaceholder")}
                />
              </div>

              <div className="form-group">
                <label>{t("duty.repeatLabel")}</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="repeat"
                      checked={repeatType === "daily"}
                      onChange={() => setRepeatType("daily")}
                    />
                    {t("duty.repeatDaily")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="repeat"
                      checked={repeatType === "weekly"}
                      onChange={() => setRepeatType("weekly")}
                    />
                    {t("duty.repeatWeekly")}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>{t("duty.assigneeLabel")}</label>
                <p className="help-text">{t("duty.assigneeHelp")}</p>
                <div className="assignee-list">
                  {room.members.map((member) => (
                    <label key={member.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.id.toString())}
                        onChange={() => toggleAssignee(member.id)}
                      />
                      <div className="avatar small">{member.full_name.charAt(0)}</div>
                      {member.full_name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("duty.createButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DutyPage;
