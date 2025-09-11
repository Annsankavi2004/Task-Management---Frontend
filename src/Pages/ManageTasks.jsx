import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, NavLink, useLocation, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUser } from "../context/UserContext";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import "../styles/dashboard.css";
import "../styles/manage.css";

/* ---------- Helpers ---------- */
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

const parseDue = (d) => {
  if (!d) return 0;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(d)) return new Date(d).getTime() || 0;
  const parts = d.split(" ");
  if (parts.length === 3) return new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`).getTime() || 0;
  return new Date(d).getTime() || 0;
};

const safeISODate = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toISOString().split("T")[0] : "";
};
const safeTime = (d) => {
  const t = d ? new Date(d) : null;
  return t && !Number.isNaN(t.getTime()) ? t.getTime() : Date.now();
};

/* ---------- Constants ---------- */
const STATUSES = ["Pending", "In Progress", "On Hold", "Completed", "Incomplete"];
const TABS = ["All", ...STATUSES];

/* ---------- API ---------- */
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

const mapInternalToApiPayload = (task, userId) => ({
  UserId: userId || task.assignees[0] || 1,
  TaskName: task.title,
  Status: canonStatus(task.status),
  Description: task.desc,
  Priority: task.priority,
});

const mapInternalToUpdateApiPayload = (task) => ({
  TaskId: task.id,
  TaskName: task.title,
  Status: canonStatus(task.status),
  Description: task.desc,
  Priority: task.priority,
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
const createTask = async (task, userId) => {
  const res = await fetch(`${API_BASE_URL}/create-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapInternalToApiPayload(task, userId)),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};
const updateTask = async (task) => {
  const res = await fetch(`${API_BASE_URL}/update-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapInternalToUpdateApiPayload(task)),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};
const deleteTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/delete-task/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};

/* ---------- Reusable UI ---------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="mtc-modal" onClick={(e) => e.target.classList.contains("mtc-modal") && onClose()}>
      <div className="mtc-dialog">{children}</div>
    </div>
  );
}

function Confirm({ open, title = "Confirm", message = "Are you sure?", onYes, onNo }) {
  if (!open) return null;
  return (
    <div className="mtc-modal" onClick={(e) => e.target.classList.contains("mtc-modal") && onNo?.()}>
      <div className="mtc-dialog">
        <h3>{title}</h3>
        <p className="mtc-confirm-msg">{message}</p>
        <div className="mtc-actions-right">
          <button className="mtc-btn" onClick={onNo}>
            <Icon icon="material-symbols:close" width="16" height="16" />&nbsp;No
          </button>
          <button className="mtc-btn primary" onClick={onYes}>
            <Icon icon="material-symbols:check" width="16" height="16" />&nbsp;Yes
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskForm({
  title,
  value,
  setValue,
  onSubmit,
  onCancel,
  isLoading = false,
  users = [],
  isEdit = false,
}) {
  return (
    <form onSubmit={onSubmit}>
      <h3>{title}</h3>

      <label className="mtc-lab">Title</label>
      <input
        className="mtc-inp"
        placeholder="Task title"
        value={value.title}
        onChange={(e) => setValue({ ...value, title: e.target.value })}
        required
        disabled={isLoading}
      />

      <label className="mtc-lab">Description</label>
      <textarea
        className="mtc-text"
        rows={3}
        placeholder="Short description"
        value={value.desc}
        onChange={(e) => setValue({ ...value, desc: e.target.value })}
        disabled={isLoading}
      />

      <div className="mtc-row">
        <div>
          <label className="mtc-lab">Status</label>
          <select
            className="mtc-inp"
            value={value.status}
            onChange={(e) => setValue({ ...value, status: e.target.value })}
            disabled={isLoading}
          >
            {["Pending","In Progress","On Hold","Completed","Incomplete"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mtc-lab">Priority</label>
          <select
            className="mtc-inp"
            value={value.priority}
            onChange={(e) => setValue({ ...value, priority: e.target.value })}
            disabled={isLoading}
          >
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
      </div>

      {!isEdit && (
        <div className="mtc-row">
          <div>
            <label className="mtc-lab">Assignee</label>
            <select
              className="mtc-inp"
              value={value.assignees[0] || ""}
              onChange={(e) => {
                const userId = parseInt(e.target.value, 10);
                const selectedUser = users.find((u) => u.UserId === userId);
                setValue({
                  ...value,
                  assignees: userId ? [userId] : [],
                  assigneeName: selectedUser ? selectedUser.FullName : "",
                });
              }}
              disabled={isLoading}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.UserId} value={user.UserId}>
                  {user.FullName} ({user.UserName})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mtc-actions-right">
        <button type="button" className="mtc-btn" onClick={onCancel} disabled={isLoading}>
          <Icon icon="material-symbols:close" width="16" height="16" />&nbsp;Cancel
        </button>
        <button type="submit" className="mtc-btn primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <Icon icon="material-symbols:hourglass-empty" width="16" height="16" />
              &nbsp;Saving...
            </>
          ) : (
            <>
              <Icon icon="material-symbols:save" width="16" height="16" />
              &nbsp;Save
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function LoadingSpinner() {
  return (
    <div className="mtc-loading">
      <Icon icon="material-symbols:hourglass-empty" width="24" height="24" />
      <span>Loading tasks...</span>
    </div>
  );
}
function ErrorMessage({ error, onRetry }) {
  return (
    <div className="mtc-error">
      <Icon icon="material-symbols:error" width="24" height="24" />
      <span>Error: {error}</span>
      <button className="mtc-btn" onClick={onRetry}>
        <Icon icon="material-symbols:refresh" width="16" height="16" />
        &nbsp;Retry
      </button>
    </div>
  );
}

/* ---------- Page ---------- */
export default function ManageTasks() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, setUser } = useUser();

  const username = user?.username || user?.name || "Guest";
  const userEmail = user?.email || "";
  const userRole = user?.role || "Admin";
  const userAvatar = user?.avatar || null;

  const [open, setOpen] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== Live Clock (Asia/Colombo) =====
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const nowStr = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Colombo",
  }).format(now);

  // dateStr and timeStr used by the new header
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", year: "numeric", month: "short", day: "2-digit", timeZone: "Asia/Colombo",
  }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Colombo",
  }).format(now);

  const emptyTask = { title: "", desc: "", status: "Pending", priority: "Low", assignees: [], assigneeName: "", done: false };
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [draft, setDraft] = useState(emptyTask);
  const [isSaving, setIsSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onYes: null });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));
  const askConfirm = (opts) => setConfirm({ open: true, ...opts });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tasksData, usersData] = await Promise.all([fetchTasks(), fetchUsers()]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { loadData(); }, []);

  function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  }
  const handleLogout = () => { setUser(null); nav("/login"); };

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); };
    const onEsc = (e) => { if (e.key === "Escape") setShowProfile(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onEsc); };
  }, []);

  /* KPIs / Filters */
  const KPI = {
    pending: tasks.filter((t) => canonStatus(t.status) === "Pending").length,
    inprog: tasks.filter((t) => canonStatus(t.status) === "In Progress").length,
    done: tasks.filter((t) => canonStatus(t.status) === "Completed").length,
    hold: tasks.filter((t) => canonStatus(t.status) === "On Hold").length,
  };
  const countBy = (status) =>
    tasks.filter((t) => (status === "All" ? true : canonStatus(t.status) === status)).length;

  const filtered = useMemo(() => {
    const byTab = (t) => (tab === "All" ? true : canonStatus(t.status) === tab);
    const sq = norm(q);
    const byQ = (t) => !sq || norm(t.title).includes(sq) || norm(t.desc).includes(sq) || norm(t.priority).includes(sq);
    const base = tasks.filter((t) => byTab(t) && byQ(t));
    const pW = (p) => (p === "High" ? 3 : p === "Medium" ? 2 : 1);
    return [...base].sort((a, b) =>
      sortBy === "priority" ? pW(b.priority) - pW(a.priority)
        : sortBy === "due" ? parseDue(a.due) - parseDue(b.due)
        : (b.createdAt || b.id) - (a.createdAt || a.id)
    );
  }, [tasks, tab, q, sortBy]);

  const numberOf = (id) => filtered.findIndex((t) => t.id === id) + 1;

  const toggleDone = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const wasDone = canonStatus(task.status) === "Completed" || task.done;
    const nextStatus = wasDone ? "Pending" : "Completed";
    const updatedTask = { ...task, done: !wasDone, status: nextStatus };
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    updateTask(updatedTask).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    });
  };

  const openAdd = () => { setDraft(emptyTask); setShowAdd(true); };
  const saveAdd = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try { setIsSaving(true); await createTask(draft, draft.assignees[0]); await loadData(); setShowAdd(false); setDraft(emptyTask); }
    finally { setIsSaving(false); }
  };

  const openView = (task) => { setCurrent(task); setShowView(true); };
  const openEdit = (task) => {
    setCurrent(task);
    setDraft({
      id: task.id,
      title: task.title,
      desc: task.desc,
      status: canonStatus(task.status),
      priority: task.priority,
      assignees: task.assignees,
      assigneeName: task.assigneeName,
      done: canonStatus(task.status) === "Completed",
    });
    setShowEdit(true);
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try { setIsSaving(true); await updateTask(draft); await loadData(); setShowEdit(false); setDraft(emptyTask); }
    finally { setIsSaving(false); }
  };

  const deleteOne = (id) => {
    const row = tasks.find((t) => t.id === id);
    setConfirm({
      open: true,
      title: "Delete Task",
      message: `Do you want to delete "${row?.title || "this task"}"?`,
      onYes: async () => { await deleteTask(id); await loadData(); closeConfirm(); },
    });
  };

  // ====== Topbar Search (search sidebar) ======
  const NAV_ITEMS = [
    { label: "Dashboard", to: "/admin", icon: "material-symbols:dashboard" },
    { label: "Tasks", to: "/admin/tasks", icon: "material-symbols:folder" },
    { label: "Team", to: "/admin/team", icon: "material-symbols:group" },
    { label: "Notifications", to: "/admin/notifications", icon: "mdi:bell-outline" },
  ];
  const [navQuery, setNavQuery] = useState("");
  const [showNavDD, setShowNavDD] = useState(false);
  const searchRef = useRef(null);
  const navMatches = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(navQuery.trim().toLowerCase()));
  const goTo = (item) => { setShowNavDD(false); setNavQuery(""); if (pathname !== item.to) nav(item.to); };
  const onNavSearchKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); if (navMatches.length) goTo(navMatches[0]); }
    else if (e.key === "Escape") { setShowNavDD(false); setNavQuery(""); searchRef.current?.blur(); }
  };
  useEffect(() => {
    const onKey = (e) => { if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ad-wrap">
      <header className="ad-topbar">
        <button className="ad-hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <Icon icon="material-symbols:menu" width="20" height="20" />
        </button>

        <div className="ad-brand-logos">
          <img src={logo1} alt="Logo 1" />
          <img src={logo2} alt="Logo 2" />
        </div>

        {/* 🔎 Topbar Search -> searches SIDEBAR items */}
        <div className="ad-search ad-search--topbar" onFocus={() => setShowNavDD(true)}>
          <Icon width="18" height="18" className="ad-search-icons" />
          <input
            ref={searchRef}
            placeholder='Search '
            value={navQuery}
            onChange={(e) => {
              setNavQuery(e.target.value);
              setShowNavDD(true);
            }}
            onKeyDown={onNavSearchKeyDown}
            onBlur={() => setTimeout(() => setShowNavDD(false), 120)}
          />
          {/* dropdown */}
          {showNavDD && navQuery.trim() && (
            <ul className="ad-search-dd" role="listbox">
              {navMatches.length ? (
                navMatches.map((m) => (
                  <li
                    key={m.to}
                    role="option"
                    tabIndex={0}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(m)}
                    onKeyDown={(e) => e.key === "Enter" && goTo(m)}
                  >
                    <Icon icon={m.icon} width="16" height="16" />
                    <span>{m.label}</span>
                    <code className="ad-kbd">{m.to.replace("/admin", "") || "/"}</code>
                  </li>
                ))
              ) : (
                <li className="empty">No matches</li>
              )}
            </ul>
          )}
        </div>

        <div className="ad-clock" title="Asia/Colombo">
          <Icon icon="mdi:calendar-clock" width="18" height="18" />
          <span>{dateStr}</span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>

        <Link to="/admin/notifications" className="ad-notification" aria-label="Notifications">
          {/* optionally add a bell icon / badge here */}
        </Link>

        <div className="ad-profile" ref={profileRef}>
          <button
            className="ad-avatar-btn"
            onClick={() => setShowProfile((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showProfile}
            title={username}
          >
            <Icon icon="material-symbols:person" width="22" height="22" />
          </button>
          <div className="ad-profile-greeting">{getGreeting()}, {username}</div>

          {showProfile && (
            <div className="ad-profile-menu" role="menu">
              <div className="ad-profile-head">
                <div className="ad-avatar-mini">
                  <Icon icon="material-symbols:person" width="18" height="18" />
                </div>
                <div>
                  <div className="ad-name">{username}</div>
                  <div className="ad-sub">{getGreeting()}, {username}</div>
                </div>
              </div>
              <button className="ad-menu-item" role="menuitem" onClick={handleLogout}>
                <Icon icon="material-symbols:logout" width="18" height="18" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="ad-shell">
        <aside className={`ad-side ${open ? "open" : "closed"}`}>
          <div className="ad-profile-card">
            <div className="ad-avatar">
              {userAvatar ? <img src={userAvatar} alt={username} className="avatar-image" /> : <Icon icon="material-symbols:person" width="24" height="24" />}
            </div>
            <div className="ad-role">{userRole}</div>
            <div className="ad-name">{username}</div>
            {userEmail && <div className="ad-email">{userEmail}</div>}
          </div>
          <nav className="ad-nav" aria-label="Sidebar">
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
              {({ isActive }) => (<>
                <Icon icon="material-symbols:dashboard" width="16" height="16" />
                <span>Dashboard</span>
                {isActive && <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="ad-right" />}
              </>)}
            </NavLink>
            <NavLink to="/admin/tasks" className={({ isActive }) => (isActive ? "active" : "")}>
              {({ isActive }) => (<>
                <Icon icon="material-symbols:folder" width="16" height="16" />
                <span>Task</span>
                {isActive && <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="ad-right" />}
              </>)}
            </NavLink>
            <NavLink to="/admin/team" className={({ isActive }) => (isActive ? "active" : "")}>
              {({ isActive }) => (<>
                <Icon icon="material-symbols:group" width="16" height="16" />
                <span>Team </span>
                {isActive && <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="ad-right" />}
              </>)}
            </NavLink>
            <NavLink to="/admin/notification" className={({ isActive }) => (isActive ? "active" : "")}>
              {({ isActive }) => (<>
                <Icon icon="material-symbols:folder" width="16" height="16" />
                <span>Notification</span>
                {isActive && <Icon icon="material-symbols:arrow-forward" width="16" height="16" className="ad-right" />}
              </>)}
                </NavLink>
          </nav>
        </aside>

        <main className="ad-main">
          <section className="mtc-kpis">
            <div className="mtc-kpi"><div className="kpi-label">PENDING</div><div className="kpi-value">{KPI.pending}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">IN PROGRESS</div><div className="kpi-value">{KPI.inprog}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">COMPLETED</div><div className="kpi-value">{KPI.done}</div></div>
            <div className="mtc-kpi"><div className="kpi-label">ON HOLD</div><div className="kpi-value">{KPI.hold}</div></div>
          </section>

          <div className="ad-actions">
            <div className="ad-actions-left">
              <div className="mtc-tabs">
                {["All","Pending","In Progress","On Hold","Completed","Incomplete"].map((s) => (
                  <button key={s} className={`mtc-tab ${tab === s ? "active" : ""}`} onClick={() => setTab(s)}>
                    {s}<span className="count">{countBy(s)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="ad-actions-right">
              <select className="ad-download" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Sort: Recent</option>
                <option value="priority">Sort: Priority</option>
                <option value="due">Sort: Due date</option>
              </select>
              <button className="ad-add-btn" onClick={openAdd} disabled={isLoading}>
                <Icon icon="material-symbols:add" width="16" height="16" /> Add Task
              </button>
            </div>
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage error={error} onRetry={loadData} />}

          {!isLoading && !error && (
            <section className="mtc-list">
              {filtered.map((t) => (
                <article key={t.id} className="mtc-card">
                  <div className="mtc-left">
                    <label className="tick">
                      <input type="checkbox" checked={canonStatus(t.status) === "Completed" || t.done} onChange={() => toggleDone(t.id)} aria-label={`Mark ${t.title} as completed`} />
                      <span className="tickbox" aria-hidden></span>
                    </label>
                    <div className="num">#{numberOf(t.id)}</div>
                    <div className="meta">
                      <div className="title">{t.title}</div>
                      <div className="sub">
                        <span className={`badge ${statusClass(canonStatus(t.status))}`}>{canonStatus(t.status)}</span>
                        <span className={`pill ${norm(t.priority)}`}>{t.priority}</span>
                        <span className="due"><b>Due:</b> {t.due || "—"}</span>
                        {t.assigneeName && (<span className="assignee"><b>Assignee:</b> {t.assigneeName}</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="mtc-actions">
                    <button type="button" className="ico" title="View" onClick={() => openView(t)}><Icon icon="mdi:eye-outline" width="18" height="18" /></button>
                    <button type="button" className="ico" title="Edit" onClick={() => openEdit(t)}><Icon icon="mdi:pencil-outline" width="18" height="18" /></button>
                    <button type="button" className="ico" title="Delete" onClick={() => deleteOne(t.id)}><Icon icon="mdi:trash-can-outline" width="18" height="18" /></button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <div className="mtc-empty">No tasks found</div>}
            </section>
          )}
        </main>
      </div>

      <Modal open={showAdd} onClose={() => !isSaving && setShowAdd(false)}>
        <TaskForm title="Add Task" value={draft} setValue={setDraft} onSubmit={saveAdd} onCancel={() => setShowAdd(false)} isLoading={isSaving} users={users} isEdit={false} />
      </Modal>

      <Modal open={showEdit} onClose={() => !isSaving && setShowEdit(false)}>
        <TaskForm title="Edit Task" value={draft} setValue={setDraft} onSubmit={saveEdit} onCancel={() => setShowEdit(false)} isLoading={isSaving} users={users} isEdit={true} />
      </Modal>

      <Modal open={showView} onClose={() => setShowView(false)}>
        <h3>View Task</h3>
        {current && (
          <>
            <p><b>Title:</b> {current.title}</p>
            <p><b>Description:</b> {current.desc || "—"}</p>
            <p><b>Status:</b> {canonStatus(current.status)} &nbsp; | &nbsp; <b>Priority:</b> {current.priority}</p>
            <p><b>Due:</b> {current.due || "—"}</p>
            <p><b>Assignees:</b> {(current.assignees || []).join(", ") || "—"}</p>
            {current.assigneeName && (<p><b>Assigned to:</b> {current.assigneeName}</p>)}
            <p><b>Created:</b> {current.createdAt ? new Date(current.createdAt).toLocaleDateString() : "—"}</p>
          </>
        )}
        <div className="mtc-actions-right">
          <button className="mtc-btn" onClick={() => setShowView(false)}>
            <Icon icon="material-symbols:close" width="16" height="16" />&nbsp;Close
          </button>
        </div>
      </Modal>

      <Confirm open={confirm.open} title={confirm.title} message={confirm.message} onYes={confirm.onYes} onNo={closeConfirm} />

      <footer className="ad-footer">© {new Date().getFullYear()} Created by Annsankavi</footer>
    </div>
  );
}
