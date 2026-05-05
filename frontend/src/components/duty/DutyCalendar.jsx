import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function DutyCalendar() {
  const [duties, setDuties] = useState([
    { id: 1, date: "2026-04-22", task: "Take out trash", user: "Nam", done: false },
    { id: 2, date: "2026-04-22", task: "Mop floor", user: "Hung", done: true },
  ]);
  const { t } = useLanguage();

  const toggle = (id) => {
    setDuties(duties.map((duty) => (duty.id === id ? { ...duty, done: !duty.done } : duty)));
  };

  return (
    <div>
      <h3>{t("misc.dutyCalendarTitle")}</h3>

      {duties.map((duty) => (
        <div key={duty.id} className="item-row">
          <div>
            <p className={duty.done ? "done" : ""}>{duty.task}</p>
            <small>{duty.user} - {duty.date}</small>
          </div>

          <button onClick={() => toggle(duty.id)}>
            {duty.done ? t("duty.done") : t("misc.notDone")}
          </button>
        </div>
      ))}
    </div>
  );
}
