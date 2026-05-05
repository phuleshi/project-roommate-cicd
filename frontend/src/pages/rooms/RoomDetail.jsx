import { useState } from "react";
import {
  updateRoom,
  leaveRoom,
  disbandRoom,
  kickMember,
  transferAdmin,
} from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./RoomDetail.css";

function RoomDetail({ room, onRoomLeftDisbanded, onRoomUpdated }) {
  const isAdmin = room.currentUserRole === "admin";
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editAddress, setEditAddress] = useState(room.address || "");
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const { t } = useLanguage();

  const handleUpdate = async (event) => {
    event.preventDefault();
    try {
      await updateRoom({ name: editName, address: editAddress });
      setIsEditing(false);
      onRoomUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(t("rooms.confirmLeave"))) return;
    try {
      await leaveRoom();
      onRoomLeftDisbanded();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleDisband = async () => {
    if (!window.confirm(t("rooms.confirmDisband"))) return;
    try {
      await disbandRoom();
      onRoomLeftDisbanded();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleKick = async (memberId) => {
    if (!window.confirm(t("rooms.confirmKick"))) return;
    try {
      await kickMember(memberId);
      onRoomUpdated();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleTransferAdmin = async (memberId) => {
    if (!window.confirm(t("rooms.confirmTransfer"))) return;
    try {
      await transferAdmin(memberId);
      onRoomUpdated();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(room.invite_code);
    window.alert(t("rooms.copiedInvite"));
  };

  return (
    <div className="room-detail-container">
      <div className="room-header-actions">
        <h2 className="page-title">{t("rooms.pageTitle")}</h2>
        {isAdmin ? (
          <button className="btn-danger-outline" onClick={handleDisband}>
            {t("rooms.disbandRoom")}
          </button>
        ) : (
          <button className="btn-danger-outline" onClick={handleLeave}>
            {t("rooms.leaveRoom")}
          </button>
        )}
      </div>

      <div className="room-info-card">
        <div className="card-header">
          <h3>{t("rooms.roomInfo")}</h3>
          {isAdmin && !isEditing && (
            <button className="btn-icon" onClick={() => setIsEditing(true)}>
              {t("rooms.edit")}
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {isEditing ? (
          <form className="edit-room-form" onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label>{t("rooms.name")}</label>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("rooms.address")}</label>
                <input
                  value={editAddress}
                  onChange={(event) => setEditAddress(event.target.value)}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                {t("rooms.cancel")}
              </button>
              <button type="submit" className="btn-primary">
                {t("rooms.saveChanges")}
              </button>
            </div>
          </form>
        ) : (
          <div className="info-grid">
            <div className="info-item">
              <span className="label">{t("rooms.name")}</span>
              <span className="value">{room.name}</span>
            </div>
            <div className="info-item">
              <span className="label">{t("rooms.address")}</span>
              <span className="value">{room.address || t("rooms.roomNotUpdated")}</span>
            </div>
            <div className="info-item">
              <span className="label">{t("rooms.inviteCode")}</span>
              <div className="invite-code-box">
                <strong>{room.invite_code}</strong>
                <button className="btn-copy" onClick={copyInviteCode}>
                  {t("rooms.copyCode")}
                </button>
              </div>
            </div>
            <div className="info-item">
              <span className="label">{t("rooms.yourRole")}</span>
              <span className={`role-badge ${room.currentUserRole}`}>
                {room.currentUserRole === "admin" ? t("rooms.admin") : t("rooms.member")}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="members-section">
        <div className="section-header">
          <h3>{t("rooms.membersTitle", { count: room.members.length })}</h3>
        </div>

        <div className="members-list">
          {room.members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">{member.full_name.charAt(0).toUpperCase()}</div>
              <div className="member-info">
                <h4>
                  {member.full_name} {member.id === currentUser?.id ? t("rooms.meLabel") : ""}
                </h4>
                <p>{member.email}</p>
                <span className={`role-badge ${member.role}`}>
                  {member.role === "admin" ? t("rooms.admin") : t("rooms.member")}
                </span>
              </div>

              {isAdmin && member.role !== "admin" && (
                <div className="member-actions">
                  <button
                    className="btn-outline-primary"
                    onClick={() => handleTransferAdmin(member.id)}
                  >
                    {t("rooms.promoteAdmin")}
                  </button>
                  <button className="btn-outline-danger" onClick={() => handleKick(member.id)}>
                    {t("rooms.remove")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoomDetail;
