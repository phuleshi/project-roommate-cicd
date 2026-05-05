import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Home,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getProfileApi, updateProfileApi } from "../../services/authService";
import { getMyRoom } from "../../services/roomService";
import "./AccountPage.css";

const initialForm = {
  full_name: "",
  email: "",
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function formatCreatedAt(value, locale, fallback) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Account() {
  const navigate = useNavigate();
  const { user, updateAuth, logout } = useAuth();
  const { language, locale, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState(initialForm);
  const [room, setRoom] = useState(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, roomResponse] = await Promise.all([
          getProfileApi(),
          getMyRoom().catch(() => null),
        ]);

        setFormData((prev) => ({
          ...prev,
          full_name: profileResponse.user.full_name || "",
          email: profileResponse.user.email || "",
        }));
        setProfileCreatedAt(profileResponse.user.created_at || null);
        setRoom(roomResponse);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setError(t("account.passwordMismatch"));
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        current_password: formData.current_password,
        new_password: formData.new_password,
      };

      const data = await updateProfileApi(payload);
      updateAuth(data);
      setSuccess(t("account.profileSaved"));
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));

      const refreshedRoom = await getMyRoom().catch(() => null);
      setRoom(refreshedRoom);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = formData.full_name || user?.full_name || "Roommate";
  const currentRole = room?.currentUserRole === "admin" ? t("common.admin") : t("common.member");
  const avatarLetter = displayName.charAt(0).toUpperCase() || "R";

  if (loading) {
    return <div className="account-card">{t("common.loadingAccount")}</div>;
  }

  return (
    <div className="account-page">
      <section className="account-hero">
        <div className="account-hero__identity">
          <div className="account-avatar">{avatarLetter}</div>
          <div>
            <h1>{displayName}</h1>
            <p className="account-subtitle">{formData.email}</p>
            <div className="account-meta">
              <span className="account-chip account-chip--accent">
                <ShieldCheck size={16} />
                {currentRole}
              </span>
              <span className="account-chip">
                <Home size={16} />
                {room ? room.name : t("account.noRoomJoined")}
              </span>
              <span className="account-chip">
                <Users size={16} />
                {room ? t("account.roleSummary", { count: room.members.length }) : t("account.readyToJoin")}
              </span>
            </div>
          </div>
        </div>

        <div className="account-hero__actions">
          <div className="account-status">
            <CheckCircle2 size={16} />
            {t("account.active")}
          </div>
          <button type="button" className="account-btn account-btn--danger" onClick={handleLogout}>
            <LogOut size={16} />
            {t("account.logout")}
          </button>
        </div>
      </section>

      <div className="account-grid">
        <section className="account-card">
          <h2>{t("account.profileDetailsTitle")}</h2>
          <p className="account-card__hint">{t("account.profileDetailsBody")}</p>

          {error && (
            <div className="account-message account-message--error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="account-message account-message--success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form className="account-form" onSubmit={handleSubmit}>
            <div className="account-form__row">
              <div className="account-field">
                <label htmlFor="full_name">{t("common.fullName")}</label>
                <input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={t("account.fullNamePlaceholder")}
                  required
                />
              </div>

              <div className="account-field">
                <label htmlFor="email">{t("common.email")}</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("account.emailPlaceholder")}
                  required
                />
              </div>
            </div>

            <div className="account-form__divider" />

            <div className="account-form__row">
              <div className="account-field">
                <label htmlFor="current_password">{t("account.currentPassword")}</label>
                <input
                  id="current_password"
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder={t("account.currentPasswordHint")}
                />
              </div>

              <div className="account-field">
                <label htmlFor="new_password">{t("account.newPassword")}</label>
                <input
                  id="new_password"
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder={t("account.newPasswordHint")}
                />
              </div>
            </div>

            <div className="account-field">
              <label htmlFor="confirm_password">{t("account.confirmNewPassword")}</label>
              <input
                id="confirm_password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder={t("account.confirmNewPasswordHint")}
              />
            </div>

            <div className="account-form__actions">
              <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
                <Save size={16} />
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>
        </section>

        <aside className="account-summary">
          <section className="account-card">
            <h2>{t("account.summaryTitle")}</h2>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.displayName")}</span>
              <span className="account-summary__value">{displayName}</span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.emailAddress")}</span>
              <span className="account-summary__value">{formData.email}</span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("common.memberSince")}</span>
              <span className="account-summary__value">
                {formatCreatedAt(profileCreatedAt, locale, t("account.joinedRecently"))}
              </span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.accessLevel")}</span>
              <span className="account-summary__value">{currentRole}</span>
            </div>
          </section>

          <section className="account-card">
            <h2>{t("account.languageTitle")}</h2>
            <p className="account-card__hint">{t("account.languageBody")}</p>
            <div className="account-field">
              <label htmlFor="app-language">{t("account.languageLabel")}</label>
              <div className="account-language-select">
                <Globe size={16} />
                <select
                  id="app-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option value="en">{t("account.languageEnglish")}</option>
                  <option value="vi">{t("account.languageVietnamese")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="account-card">
            <h2>{t("account.roomStatus")}</h2>

            {room ? (
              <div className="account-room">
                <div className="account-room__title">
                  <div>
                    <h3>{room.name}</h3>
                    <p className="account-card__hint">{room.address || t("common.noAddress")}</p>
                  </div>
                  <span className="account-chip">{currentRole}</span>
                </div>

                <div className="account-room__stats">
                  <div className="account-room__stat">
                    {t("account.inviteCode")}
                    <strong>{room.invite_code}</strong>
                  </div>
                  <div className="account-room__stat">
                    {t("account.roomMembers")}
                    <strong>{room.members.length}</strong>
                  </div>
                </div>

                <Link to="/rooms" className="account-link">
                  {t("account.openRoomManagement")}
                </Link>
              </div>
            ) : (
              <div className="account-room__empty">
                <div>
                  <strong>{t("account.roomRequiredTitle")}</strong>
                  <p className="account-card__hint">{t("account.roomRequiredBody")}</p>
                </div>
                <Link to="/rooms" className="account-link">
                  {t("account.goToRoomSetup")}
                </Link>
              </div>
            )}
          </section>

          <section className="account-card">
            <h2>{t("account.securityTitle")}</h2>
            <p className="account-card__hint">{t("account.securityBody")}</p>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.primaryContact")}</span>
              <span className="account-summary__value">{formData.email}</span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.profileOwner")}</span>
              <span className="account-summary__value">{displayName}</span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.protectedBy")}</span>
              <span className="account-summary__value">
                <Mail size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                {t("account.emailPassword")}
              </span>
            </div>
            <div className="account-summary__row">
              <span className="account-summary__label">{t("account.identity")}</span>
              <span className="account-summary__value">
                <UserRound size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                {t("account.verifiedSession")}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
