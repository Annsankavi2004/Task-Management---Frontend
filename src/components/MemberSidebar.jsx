// src/components/MemberSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function MemberSidebar({ open = true, onToggle, onLogout, username = "Member" }) {
  return (
    <aside className={`ad-side ${open ? "open" : "closed"}`}>
      <div className="ad-profile-card">
        <div className="ad-avatar">
          <Icon icon="material-symbols:person" width="22" height="22" />
        </div>
        <div className="ad-profile-meta">
          <div className="ad-role">Member</div>
          <div className="ad-name">{username}</div>
        </div>
      </div>

      <nav className="ad-nav" aria-label="Sidebar">
        {/* ✅ fixed routes to match App.jsx */}
        <NavLink to="/user" className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon icon="material-symbols:dashboard" width="18" height="18" />
          <span className="label">Dashboard</span>
          <Icon icon="material-symbols:arrow-forward" width="18" height="18" />
        </NavLink>

        <NavLink to="/my-task" className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon icon="material-symbols:checklist" width="18" height="18" />
          <span className="label">My Tasks</span>
        </NavLink>

        {/* optional future route */}
        {/* 
        <NavLink to="/user/notifications" className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon icon="material-symbols:notifications" width="18" height="18" />
          <span className="label">Notifications</span>
        </NavLink> 
        */}
      </nav>

      <div style={{ padding: "12px" }}>
        <button className="ad-logout-pill" onClick={onLogout} style={{ width: "100%" }}>
          <Icon icon="material-symbols:logout" width="16" height="16" />
          LOG OUT
        </button>
      </div>
    </aside>
  );
}
