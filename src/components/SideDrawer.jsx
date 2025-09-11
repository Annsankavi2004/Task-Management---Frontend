import React from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";

export default function SideDrawer({ open, onClose }) {
  return (
    <>
      <div className={`drawer ${open ? "show" : ""}`}>
        <nav className="drawer-nav">
          <Link to="/admin#tasks" onClick={onClose}>⚛️ Dashboard</Link>
          <Link to="/manage" onClick={onClose}>📁 Manage Task</Link>
          <Link to="/team" onClick={onClose}>👥 Team members</Link>
        </nav>
      </div>
      {/* click outside to close */}
      {open && <div className="drawer-backdrop" onClick={onClose} />}
    </>
  );
}
