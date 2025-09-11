import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUser } from "../context/UserContext";
import "../styles/dashboard.css";
import "../styles/team.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

/* ---------- Helpers & Mappers (from ManageTasks) ---------- */
const norm = (s) => (s || "").toLowerCase().trim();
const statusClass = (s) => (s || "").replace(/\s/g, "").toLowerCase();
const titleCase = (s = "") =>
  s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

const canonStatus = (s) => {
  const x = norm(s).replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  if (!x) return "Pending";
  if (["completed", "complete", "done", "finished", "closed"].includes(x)) return "Completed";
  if (["in progress", "progress", "working", "ongoing", "processing"].includes(x)) return "In Progress";
  if (["on hold", "hold", "paused", "pause", "waiting"].includes(x)) return "On Hold";
  if (["incomplete", "in complete", "not complete", "notcompleted", "not-complete"].includes(x)) return "Incomplete";
  if (["todo", "to do", "new", "open", "not started", "not-started", "start", "pending"].includes(x)) return "Pending";
  return titleCase(s || "Pending");
};

const safeISODate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString().split("T")[0] : "";
};
const safeTime = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.getTime() : Date.now();
};

/* ---------- API (from ManageTasks) ---------- */
const API_BASE_URL = "http://localhost:5000";

const mapApiTaskToInternal = (apiTask) => ({
  id: apiTask.TaskId,
  title: apiTask.TaskName,
  desc: apiTask.Description,
  status: canonStatus(apiTask.Status),
  priority: apiTask.Priority || "Medium",
  due: safeISODate(apiTask.CompleteDate),
  assignees: [apiTask.UserId],
  assigneeName: apiTask.FullName,
  done: canonStatus(apiTask.Status) === "Completed",
  createdAt: safeTime(apiTask.CreateDate),
});

const fetchTasks = async () => {
  const res = await fetch(`${API_BASE_URL}/tasks`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return data.map(mapApiTaskToInternal);
};

const fetchUsers = async () => {
  const res = await fetch(`${API_BASE_URL}/users`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

/* ---------- Reusable Modals ---------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="tm-modal" onClick={(e) => { if (e.target.classList.contains("tm-modal")) onClose?.(); }}>
      <div className="tm-dialog">{children}</div>
    </div>
  );
}
function Confirm({ open, title = "Confirm", message = "Are you sure?", onYes, onNo }) {
  if (!open) return null;
  return (
    <div className="tm-modal" onClick={(e) => { if (e.target.classList.contains("tm-modal")) onNo?.(); }}>
      <div className="tm-dialog">
        <h3>{title}</h3>
        <p className="tm-confirm-msg">{message}</p>
        <div className="tm-actions-right">
          <button className="tm-btn" onClick={onNo}><Icon icon="material-symbols:close" width="16" height="16" /> No</button>
          <button className="tm-btn primary" onClick={onYes}><Icon icon="material-symbols:check" width="16" height="16" /> Yes</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function TeamTasks() {
  const { user, setUser } = useUser();
  const username = user?.username || user?.name || "Guest";
  const userEmail = user?.email || "";
  const userRole = user?.role || "Admin";
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [openSide, setOpenSide] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // ===== NAV items (also used by topbar search) =====
  const NAV_ITEMS = [
    { label: "Dashboard", to: "/admin", icon: "material-symbols:dashboard" },
    { label: "Tasks", to: "/admin/tasks", icon: "material-symbols:folder" },
    { label: "Team", to: "/admin/team", icon: "material-symbols:group" },
    { label: "Notifications", to: "/admin/notifications", icon: "mdi:bell-outline" },
  ];

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, usersData] = await Promise.all([fetchTasks(), fetchUsers()]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message || "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Topbar profile menu
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }
  const handleLogout = () => { setUser(null); navigate("/login"); };

  // KPIs
  const KPI = useMemo(() => ({
    pending: tasks.filter((t) => canonStatus(t.status) === "Pending").length,
    inprog: tasks.filter((t) => canonStatus(t.status) === "In Progress").length,
    done: tasks.filter((t) => canonStatus(t.status) === "Completed").length,
    hold: tasks.filter((t) => canonStatus(t.status) === "On Hold").length,
  }), [tasks]);

  // CRUD helpers for modals
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, onYes: null, title: "", message: "" });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));
  function openUserDetails(u) { setSelectedUser(u); setShowUserDetails(true); }

  // Search logic
  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u =>
      (u.FullName || "").toLowerCase().includes(s) ||
      (u.UserName || "").toLowerCase().includes(s)
    );
  }, [q, users]);

  // Topbar Search state
  const [navQuery, setNavQuery] = useState("");
  const [showNavDD, setShowNavDD] = useState(false);
  const searchRef = useRef(null);
  const navMatches = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(navQuery.trim().toLowerCase()));
  const goTo = (item) => { setShowNavDD(false); setNavQuery(""); if (pathname !== item.to) navigate(item.to); };
  const onNavSearchKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (navMatches.length) goTo(navMatches[0]); }
    else if (e.key === "Escape") { setShowNavDD(false); setNavQuery(""); searchRef.current?.blur(); }
  };
  useEffect(() => {
    function onKey(e) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ad-wrap">
      {/* TOPBAR */}
      <header className="ad-topbar">
        <button className="ad-hamburger" onClick={() => setOpenSide(v => !v)} aria-label="Toggle menu">
          <Icon icon="material-symbols:menu" width="20" height="20" />
        </button>
        <div className="ad-brand-logos">
          <img src={logo1} alt="Logo 1" />
          <img src={logo2} alt="Logo 2" />
        </div>
        <div className="ad-search ad-search--topbar" onFocus={() => setShowNavDD(true)}>
          <Icon  width="18" height="18" className="ad-search-icons" />
          <input
            ref={searchRef}
            placeholder='Search '
            value={navQuery}
            onChange={(e) => { setNavQuery(e.target.value); setShowNavDD(true); }}
            onKeyDown={onNavSearchKeyDown}
            onBlur={() => setTimeout(() => setShowNavDD(false), 120)}
          />
          {showNavDD && navQuery.trim() && (
            <ul className="ad-search-dd" role="listbox">
              {navMatches.length ? navMatches.map((m) => (
                <li key={m.to} role="option" tabIndex={0} onMouseDown={(e) => e.preventDefault()} onClick={() => goTo(m)} onKeyDown={(e) => e.key === "Enter" && goTo(m)}>
                  <Icon icon={m.icon} width="16" height="16" /><span>{m.label}</span><code className="ad-kbd">{m.to.replace("/admin", "") || "/"}</code>
                </li>
              )) : <li className="empty">No matches</li>}
            </ul>
          )}
        </div>
        <div className="ad-clock" title="Asia/Colombo">
          <Icon icon="mdi:calendar-clock" width="18" height="18" />
          <span>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" })}</span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Colombo" })}</span>
        </div>
        <div className="ad-profile" ref={profileRef}>
          <button className="ad-avatar-btn" onClick={() => setShowProfile(v => !v)} aria-haspopup="menu" aria-expanded={showProfile} title={username}>
            <Icon icon="material-symbols:person" width="22" height="22" />
          </button>
          <div className="ad-profile-greeting">{getGreeting()}, {username}</div>
          {showProfile && (
            <div className="ad-profile-menu" role="menu">
              <div className="ad-profile-head">
                <div className="ad-avatar-mini"><Icon icon="material-symbols:person" width="18" height="18" /></div>
                <div><div className="ad-name">{username}</div><div className="ad-sub">{getGreeting()}, {username}</div></div>
              </div>
              <button className="ad-menu-item" role="menuitem" onClick={handleLogout}>
                <Icon icon="material-symbols:logout" width="18" height="18" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* SHELL + SIDEBAR */}
      <div className="ad-shell">
        <aside className={`ad-side ${openSide ? "open" : "closed"}`}>
          <div className="ad-profile-card">
            <div className="ad-avatar"><Icon icon="material-symbols:person" width="24" height="24" /></div>
            <div className="ad-role">{userRole}</div>
            <div className="ad-name">{username}</div>
          </div>
          <nav className="ad-nav" aria-label="Sidebar">
            {NAV_ITEMS.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {({ isActive }) => (<><Icon icon={n.icon} width="16" height="16" /><span>{n.label}</span>{isActive && <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="ad-right" />}</>)}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="ad-main">
          {/* KPI Cards section */}
          <section className="mtc-kpis">
            <div className="mtc-kpi"><div className="kpi-label">PENDING</div><div className="kpi-value">{KPI.pending}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">IN PROGRESS</div><div className="kpi-value">{KPI.inprog}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">COMPLETED</div><div className="kpi-value">{KPI.done}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">ON HOLD</div><div className="kpi-value">{KPI.hold}</div></div>
          </section>

          {/* Loading & Error */}
          {loading && <div style={{ padding: 20, textAlign: "center" }}><Icon icon="material-symbols:loading" width="24" height="24" /> Loading users...</div>}
          {error && (
            <div style={{ padding: 20, textAlign: "center", color: "#e74c3c" }}>
              <Icon icon="material-symbols:error" width="24" height="24" /> Error: {error}
              <button onClick={fetchData} style={{ marginLeft: 10 }}>Retry</button>
            </div>
          )}

          {/* TEAM MEMBERS — TABLE */}
          {users.length > 0 && !loading && !error && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ marginBottom: "1rem", color: "#333" }}>Team Members</h2>
              <div className="ad-actions-right">
                <div className="tm-search">
                  <input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
                  <Icon icon="material-symbols:search" width="18" height="18" />
                </div>
                <button className="tm-btn" onClick={fetchData} disabled={loading}><Icon icon="material-symbols:refresh" width="16" height="16" /> Refresh Users</button>
              </div>

              <table className="tm-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Avatar</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th style={{ width: 120 }}>Role ID</th>
                    <th style={{ width: 120 }}>Total</th>
                    <th style={{ width: 140 }}>Completed</th>
                    <th style={{ width: 120 }}>Pending</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.UserId} style={{ cursor: "pointer" }}>
                      <td data-label="Avatar">
                        <div className="tm-avatar">
                          <Icon icon="material-symbols:person" width="20" height="20" />
                        </div>
                      </td>
                      <td data-label="Name">{u.FullName}</td>
                      <td data-label="Username" className="text-ellipsis">{u.UserName}</td>
                      <td data-label="Role ID">{u.RoleId}</td>
                      <td data-label="Total"><div className="tm-chip"><strong>{Number(u.TotalTasks || 0)}</strong><span>Total</span></div></td>
                      <td data-label="Completed"><div className="tm-chip completed"><strong>{Number(u.CompletedTasks || 0)}</strong><span>Done</span></div></td>
                      <td data-label="Pending"><div className="tm-chip pending"><strong>{Number(u.PendingTasks || 0)}</strong><span>Pending</span></div></td>
                      <td data-label="Actions">
                        <button className="tm-btn" onClick={() => openUserDetails(u)}><Icon icon="mdi:eye" /> Details</button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={8} className="tm-empty">No matching users</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>

      {/* Modals */}
      <Modal open={showUserDetails} onClose={() => setShowUserDetails(false)}>
        <div>
          <h3>User Details</h3>
          {selectedUser && (
            <div className="view-grid">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="tm-avatar"><Icon icon="material-symbols:person" width="24" height="24" /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>{selectedUser.FullName}</div>
                  <div className="tm-email">{selectedUser.UserName}</div>
                </div>
              </div>
              <div><strong>User ID:</strong> {selectedUser.UserId}</div>
              <div><strong>Role ID:</strong> {selectedUser.RoleId}</div>
              <div><strong>Create Date:</strong> {new Date(selectedUser.CreateDate).toLocaleDateString()}</div>
              <div><strong>Total Tasks:</strong> {selectedUser.TotalTasks}</div>
              <div><strong>Completed Tasks:</strong> {selectedUser.CompletedTasks}</div>
              <div><strong>Pending Tasks:</strong> {selectedUser.PendingTasks}</div>
            </div>
          )}
          <div className="tm-actions-right" style={{ marginTop: 12 }}>
            <button className="tm-btn" onClick={() => setShowUserDetails(false)}>
              <Icon icon="material-symbols:close" width="16" height="16" /> Close
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={confirm.open} title={confirm.title} message={confirm.message} onYes={confirm.onYes} onNo={closeConfirm} />

      <footer className="ad-footer">© {new Date().getFullYear()} Created by Annsankavi</footer>
    </div>
  );
}