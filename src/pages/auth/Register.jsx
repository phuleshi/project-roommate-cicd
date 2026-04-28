import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { registerApi } from "../../services/authService";
import "./Auth.css";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      return setError("Mật khẩu không khớp");
    }

    setLoading(true);

    try {
      await registerApi({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Tham gia quản lý phòng trọ</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <CheckCircle size={20} />
            Đăng ký thành công!
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            name="full_name"
            placeholder="Họ tên"
            className="form-input"
            value={formData.full_name}
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirm_password"
            placeholder="Xác nhận mật khẩu"
            className="form-input"
            value={formData.confirm_password}
            onChange={handleChange}
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? "Loading..." : <><UserPlus size={18}/> Đăng ký</>}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}