import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/home/home";
import Rooms from "./pages/rooms/Rooms";
import RoomDetail from "./pages/rooms/RoomDetail";
import CostsPage from "./pages/costs/CostsPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Invoice from "./pages/invoice/InvoicePage";
import DailyDuty from "./pages/duty/DutyPage";
import Report from "./pages/report/ReportPage";
import Account from "./pages/account/AccountPage";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/duty" element={<DailyDuty />} />
          <Route path="/report" element={<Report />} />
          <Route path="/account" element={<Account />} />
          <Route path="/costs" element={<CostsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;