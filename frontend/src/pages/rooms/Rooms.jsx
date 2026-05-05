import { useEffect, useState } from "react";
import { getMyRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import NoRoom from "./NoRoom";
import RoomDetail from "./RoomDetail";
import "./Rooms.css";

function Rooms() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError("");
      const myRoom = await getMyRoom();
      setRoom(myRoom);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, []);

  if (loading) {
    return <div className="rooms-loading">{t("rooms.loading")}</div>;
  }

  if (error) {
    return <div className="rooms-error">{t("common.errorPrefix", { message: error })}</div>;
  }

  return (
    <div className="rooms-page">
      {!room ? (
        <NoRoom onRoomCreatedJoined={fetchRoom} />
      ) : (
        <RoomDetail
          room={room}
          onRoomLeftDisbanded={fetchRoom}
          onRoomUpdated={fetchRoom}
        />
      )}
    </div>
  );
}

export default Rooms;
