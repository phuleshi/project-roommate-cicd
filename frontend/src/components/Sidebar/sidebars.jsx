import "./sidebars.css";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Banknote,
  Newspaper,
  Calendar,
  ChartColumn,
  User,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

function Sidebar() {
  const { t } = useLanguage();

  const menu = [
    { label: t("common.dashboard"), icon: LayoutDashboard, path: "/" },
    { label: t("common.rooms"), icon: Warehouse, path: "/rooms" },
    { label: t("common.costs"), icon: Banknote, path: "/costs" },
    { label: t("common.invoices"), icon: Newspaper, path: "/invoice" },
    { label: t("common.duty"), icon: Calendar, path: "/duty" },
    { label: t("common.reports"), icon: ChartColumn, path: "/report" },
    { label: t("common.account"), icon: User, path: "/account" },
  ];

  return (
    <aside className="sidebar">
      <h1 className="sidebar__title">{t("sidebar.title")}</h1>
      <ul className="sidebar__menu">
        {menu.map(({ label, icon: Icon, path }) => (
          <li key={label} className="sidebar__item">
            <NavLink to={path} className="sidebar__link">
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
