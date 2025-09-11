// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import LoginPage from "./Pages/LoginPage.jsx";
import RegisterPage from "./Pages/RegisterPage.jsx";
import ForgotPasswordPage from "./Pages/ForgotPassword.jsx"; // 👈 single, aliased

// Admin
import Dashboard from "./Pages/Dashboard.jsx";
import ManageTasks from "./Pages/ManageTasks.jsx";
import TeamTasks from "./Pages/TeamTasks.jsx";
import Notifications from "./Pages/Notifications.jsx";

// Other pages
import MyTask from "./Pages/Mytask.jsx";
import UserDashboard from "./Pages/UserDashboard.jsx";

// ✅ Context
import { UserProvider } from "./context/UserContext.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* ✅ Wrap everything in UserProvider */}
      <UserProvider>
        <Routes>
          {/* auth */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgotpassword" element={<ForgotPasswordPage />} />

          {/* admin */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/tasks" element={<ManageTasks />} />
          <Route path="/admin/team" element={<TeamTasks />} />
          <Route path="/admin/notifications" element={<Notifications />} />

          {/* user/member */}
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/my-task" element={<MyTask />} />

          {/* aliases */}
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/manage" element={<Navigate to="/admin/tasks" replace />} />
          <Route path="/team" element={<Navigate to="/admin/team" replace />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}
