import "./sidebars.css";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Users,
  Banknote,
  Newspaper,
  Calendar,
  ChartColumn,
  User
} from "lucide-react";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Rooms", icon: Warehouse, path: "/rooms" },
  { label: "Costs", icon: Banknote, path: "/costs" },
  { label: "Invoices", icon: Newspaper, path: "/invoice" },
  { label: "Daily duty", icon: Calendar, path: "/duty" },
  { label: "Reports", icon: ChartColumn, path: "/report" },
  { label: "Accounts", icon: User, path: "/account" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <h1 className="sidebar__title">RoomMate Hub</h1>
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