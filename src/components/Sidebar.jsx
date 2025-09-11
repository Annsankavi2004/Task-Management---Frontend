import { NavLink } from "react-router-dom";
import "../styles/dashboard.css";

export default function Sidebar({ onLogout }) {
  return (
    <aside className="ad-side">
      <div className="ad-profile-card">
        <div className="ad-avatar">👤</div>
        <div className="ad-role">Admin</div>
      
      </div>

      <nav className="ad-nav">
        <NavLink
          to="/admin"
          className={({ isActive }) => "ad-link " + (isActive ? "active" : "")}
        >
          ⚛️ Dashboard 
        </NavLink>

        <NavLink
          to="/manage"
          className={({ isActive }) => "ad-link " + (isActive ? "active" : "")}
        >
          📁 Manage Task
        </NavLink>

        <NavLink
          to="/team"
          className={({ isActive }) => "ad-link " + (isActive ? "active" : "")}
        >
          👥 Team members
        </NavLink>
      </nav>

     
    
    </aside>
  );
}
