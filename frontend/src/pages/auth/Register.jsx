import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { registerApi } from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
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
  const { t } = useLanguage();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirm_password) {
      setError(t("auth.passwordMismatch"));
      return;
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
          <h1 className="auth-title">{t("auth.createAccount")}</h1>
          <p className="auth-subtitle">{t("auth.registerSubtitle")}</p>
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
            {t("auth.registerSuccess")}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            name="full_name"
            placeholder={t("auth.fullNamePlaceholder")}
            className="form-input"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder={t("auth.passwordPlaceholder")}
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirm_password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            className="form-input"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />

          <button className="auth-btn" disabled={loading}>
            {loading ? t("common.loading") : (
              <>
                <UserPlus size={18} />
                {t("auth.registerButton")}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {t("auth.hasAccount")} <Link to="/login">{t("auth.login")}</Link>
        </div>
      </div>
    </div>
  );
}
