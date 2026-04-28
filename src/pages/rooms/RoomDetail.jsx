import { useParams } from "react-router-dom";
import { useState } from "react";

import MembersTab from "../../components/members/MembersTab";
import TasksTab from "../../components/duty/TasksTab";
import CostsTab from "../../components/cost/CostsTab";
import DutyCalendar from "../../components/duty/DutyCalendar";

import "./RoomDetail.css";

function RoomDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("members");
  return (
    <div className="room-detail">
      {/* Header */}
      <div className="room-detail__header">
        <h2>Room {id}</h2>
        <p>Room detail & management</p>
      </div>

      {/* Tabs */}
      <div className="room-tabs">
      <button
        className={`room-tab ${activeTab === "members" ? "active" : ""}`}
        onClick={() => setActiveTab("members")}
      >
        Members
      </button>

      <button
        className={`room-tab ${activeTab === "tasks" ? "active" : ""}`}
        onClick={() => setActiveTab("tasks")}
      >
        Tasks
      </button>

      <button
        className={`room-tab ${activeTab === "costs" ? "active" : ""}`}
        onClick={() => setActiveTab("costs")}
      >
        Costs
      </button>

      <button
        className={`room-tab ${activeTab === "duty" ? "active" : ""}`}
        onClick={() => setActiveTab("duty")}
      >
        Duty Calendar
      </button>
      </div>

      {/* Content */}
      <div className="room-content">
      {activeTab === "members" && <MembersTab />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "costs" && <CostsTab />}
      {activeTab === "duty" && <DutyCalendar />}
      </div>
    </div>
  );
}

export default RoomDetail;
