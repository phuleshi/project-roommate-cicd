import Sidebar from "../components/Sidebar/sidebars";
import { Outlet } from "react-router-dom";
import "../styles/global.css";

function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
