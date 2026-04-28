import "./Rooms.css";
import { Link } from "react-router-dom";

function Rooms() {
  const rooms = [
    { id: 1, name: "Room 101", address: "12 Nguyen Trai, District 1", members: 4 },
    { id: 2, name: "Room 202", address: "45 Le Loi, District 3", members: 3 },
    { id: 3, name: "Room 303", address: "88 Vo Van Tan, District 10", members: 5 },
  ];

  return (
    <div className="rooms-page">
      {/* Header */}
      <div className="rooms-header">
        <div>
          <h2 className="rooms-title">Rooms</h2>
          <p className="rooms-subtitle">Manage your rental rooms</p>
        </div>
        <button className="btn-primary">+ Add Room</button>
      </div>

      {/* Rooms list */}
      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-card__header">
              <h3>{room.name}</h3>
              <span className="room-badge">Active</span>
            </div>

            <div className="room-info">
              <p>📍 {room.address}</p>
              <p>👥 {room.members} members</p>
            </div>

            <div className="room-actions">
              <Link to={`/rooms/${room.id}`} className="btn-outline">View</Link>
              <button className="btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;