import { useState } from "react";
import { createRoom, joinRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./NoRoom.css";

function NoRoom({ onRoomCreatedJoined }) {
  const [activeTab, setActiveTab] = useState("create");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    setError("");
    setIsCreating(true);
    try {
      await createRoom({ name, address });
      onRoomCreatedJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    setError("");
    setIsJoining(true);
    try {
      await joinRoom(inviteCode);
      onRoomCreatedJoined();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="no-room-container">
      <div className="no-room-card">
        <h2 className="no-room-title">{t("rooms.noRoomTitle")}</h2>
        <p className="no-room-subtitle">{t("rooms.noRoomSubtitle")}</p>

        <div className="no-room-tabs">
          <button
            className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("create");
              setError("");
            }}
          >
            {t("rooms.createTab")}
          </button>
          <button
            className={`tab-btn ${activeTab === "join" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("join");
              setError("");
            }}
          >
            {t("rooms.joinTab")}
          </button>
        </div>

        {error && <div className="no-room-error">{error}</div>}

        {activeTab === "create" ? (
          <form className="no-room-form" onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label>{t("rooms.roomNameLabel")}</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("rooms.roomNamePlaceholder")}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("rooms.addressLabel")}</label>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={t("rooms.addressPlaceholder")}
              />
            </div>
            <button type="submit" className="btn-primary full-width" disabled={isCreating}>
              {isCreating ? t("rooms.createSubmitting") : t("rooms.createButton")}
            </button>
          </form>
        ) : (
          <form className="no-room-form" onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label>{t("rooms.inviteLabel")}</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={t("rooms.invitePlaceholder")}
                required
              />
            </div>
            <button type="submit" className="btn-primary full-width" disabled={isJoining}>
              {isJoining ? t("rooms.joinSubmitting") : t("rooms.joinButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default NoRoom;
