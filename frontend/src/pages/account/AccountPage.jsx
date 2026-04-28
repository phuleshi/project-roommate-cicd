import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [name, setName] = useState("Phú");
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xoá dữ liệu đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect về login
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "400px" }}>
      <h2>Tài khoản</h2>

      <div style={{ marginBottom: "12px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </div>

      <button className="btn-primary" style={{ marginRight: "10px" }}>
        Lưu
      </button>

      {/* 🔥 Logout button */}
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          background: "#ef4444",
          color: "white",
          fontWeight: "500",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}