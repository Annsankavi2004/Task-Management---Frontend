
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
import "../styles/dashboard.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import { useUser } from "../context/UserContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { user } = useUser();
  const username = user?.username || "Guest";
  const userId = user?.userId || null;
  const rolename = user?.rolename || "Guest";

  const [open, setOpen] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState(""); // table search
  const [newTask, setNewTask] = useState({
    task: "",
    status: "Pending",
    priority: "Low",
    description: "",
  });
  const [showForm, setShowForm] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // ====== Sidebar items (single source of truth) ======
  const NAV_ITEMS = [
    { label: "Dashboard", to: "/admin", icon: "material-symbols:dashboard" },
    { label: "Tasks", to: "/admin/tasks", icon: "material-symbols:folder" },
    { label: "Team", to: "/admin/team", icon: "material-symbols:group" },
    { label: "Notifications", to: "/admin/notifications", icon: "mdi:bell-outline" },
  ];

  // ====== Topbar Search (searches SIDEBAR items) ======
  const [navQuery, setNavQuery] = useState("");
  const [showNavDD, setShowNavDD] = useState(false);
  const searchRef = useRef(null);

  const navMatches = NAV_ITEMS.filter((n) =>
    n.label.toLowerCase().includes(navQuery.trim().toLowerCase())
  );

  function goTo(item) {
    setShowNavDD(false);
    setNavQuery("");
    if (pathname !== item.to) navigate(item.to);
  }

  function onNavSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (navMatches.length) goTo(navMatches[0]);
    } else if (e.key === "Escape") {
      setShowNavDD(false);
      setNavQuery("");
      searchRef.current?.blur();
    }
  }

  // quick shortcut: press "/" to focus topbar search
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

  // ===== Live Date/Time (As`ia/Colombo) =====
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  });

  // ===== Profile popover outside-click =====
  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ===== Helpers for CSV =====
  function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function rowsToCSV(rows, headers) {
    const head = headers.map(csvEscape).join(",");
    const body = rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")).join("\n");
    return head + "\n" + body;
  }
  function downloadBlob(content, filename, type = "text/csv;charset=utf-8;") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== Fetch tasks =====
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await axios.get(`http://localhost:5000/tasks/${userId}`);
        const formatted = res.data.map((t) => ({
          ...t,
          created: new Date(t.CreateDate).toLocaleDateString("en-GB").replace(/\//g, "."),
        }));
        setTasks(formatted);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    })();
  }, [userId]);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }
  function handleLogout() {
    navigate("/login");
  }

  // ===== Create Task =====
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.task.trim()) return;
    const payload = {
      UserId: userId,
      TaskName: newTask.task,
      Status: newTask.status,
      Description: newTask.description,
      Priority: newTask.priority,
    };
    try {
      const res = await axios.post("http://localhost:5000/create-task", payload);
      const createdTask = {
        ...res.data,
        created: new Date(res.data.CreateDate || Date.now())
          .toLocaleDateString("en-GB")
          .replace(/\//g, "."),
      };
      setTasks((prev) => [...prev, createdTask]);
      setNewTask({ task: "", status: "Pending", priority: "Low", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.TaskName?.toLowerCase().includes(q) ||
      t.Status?.toLowerCase().includes(q) ||
      t.Priority?.toLowerCase().includes(q)
    );
  });

  function handleDownloadReport() {
    if (!filteredTasks.length) return;
    const headers = ["TaskId", "TaskName", "Status", "Priority", "created", "Description"];
    const rows = filteredTasks.map((t) => ({
      TaskId: t.TaskId ?? "",
      TaskName: t.TaskName ?? "",
      Status: t.Status ?? "",
      Priority: t.Priority ?? "",
      created: t.created ?? "",
      Description: t.Description ?? "",
    }));
    const csv = rowsToCSV(rows, headers);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csv, `tasks_report_${stamp}.csv`);
  }

  function handleDownloadSingle(t) {
    const headers = ["TaskId", "TaskName", "Status", "Priority", "created", "Description"];
    const row = {
      TaskId: t.TaskId ?? "",
      TaskName: t.TaskName ?? "",
      Status: t.Status ?? "",
      Priority: t.Priority ?? "",
      created: t.created ?? "",
      Description: t.Description ?? "",
    };
    const csv = rowsToCSV([row], headers);
    const safeName = (t.TaskName || "task").toLowerCase().replace(/[^a-z0-9\-]+/g, "_");
    downloadBlob(csv, `${safeName}.csv`);
  }

  return (
    <div className="ad-wrap">
      
      {/* TOPBAR */}
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
          <Icon  width="18" height="18" className="ad-search-icons" />
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

      {/* SHELL */}
      <div className="ad-shell">
        {/* SIDEBAR */}
        <aside className={`ad-side ${open ? "open" : "closed"}`}>
          <div className="ad-profile-card">
            <div className="ad-avatar">
              <Icon icon="material-symbols:person" width="24" height="24" />
            </div>
            <div className="ad-role">{rolename}</div>
            <div className="ad-name">{username}</div>
          </div>

          <nav className="ad-nav" aria-label="Sidebar">
            {NAV_ITEMS.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
                <Icon icon={n.icon} width="16" height="16" />
                {n.label}
                {n.to === "/admin" && <Icon icon="material-symbols:arrow-forward" width="16" height="16" />}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="ad-main">
          <section className="ad-card" id="tasks">
            <div className="ad-table-top">
              <div className="ad-table-actions">
                <button
                  className="ad-download"
                  type="button"
                  title="Download report"
                  onClick={handleDownloadReport}
                  disabled={!filteredTasks.length}
                >
                  <Icon icon="material-symbols:download" width="16" height="16" />
                  Download Report
                </button>
                <button className="ad-add-btn" onClick={() => setShowForm(true)} type="button">
                  <Icon icon="material-symbols:add" width="16" height="16" />
                  Add Task
                </button>
              </div>

              <div className="ad-search-table">
                <input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="ad-search-icons" aria-hidden>
                  <Icon  width="18" height="18" />
                </div>
              </div>
            </div>

            <h2 className="ad-card-title">Recent Tasks</h2>

            <div className="ad-table" role="table" aria-label="Tasks">
              <div className="ad-tr ad-tr-head" role="row">
                <div role="columnheader">Task</div>
                <div role="columnheader">Status</div>
                <div role="columnheader">Priority</div>
                <div role="columnheader">Created On</div>
                <div role="columnheader" className="ad-center">Action</div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="ad-tr empty">
                  <div>No matching tasks</div>
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <div className="ad-tr" role="row" key={t.TaskId}>
                    <div role="cell">{t.TaskName}</div>
                    <div role="cell">
                      <span className={`badge ${t.Status.replace(/\s/g, "").toLowerCase()}`}>
                        {t.Status}
                      </span>
                    </div>
                    <div role="cell">{t.Priority}</div>
                    <div role="cell">{t.created}</div>
                    <div role="cell" className="ad-table-action">
                      <button
                        title="Download"
                        className="ad-action-btn"
                        type="button"
                        onClick={() => handleDownloadSingle(t)}
                      >
                        <Icon icon="material-symbols:download" width="18" height="18" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showForm && (
              <div className="modal" role="dialog" aria-modal="true" aria-label="Add task">
                <form className="task-form" onSubmit={handleAddTask}>
                  <h3>
                    <Icon icon="material-symbols:add-task" width="20" height="20" />
                    Add New Task
                  </h3>

                  <input
                    type="text"
                    placeholder="Task name"
                    value={newTask.task}
                    onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>On Hold</option>
                    <option>Start</option>

                  </select>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <div className="form-actions">
                    <button type="submit">
                      <Icon icon="material-symbols:check" width="16" height="16" />
                      Add
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}>
                      <Icon icon="material-symbols:close" width="16" height="16" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className="ad-footer">© {new Date().getFullYear()} Created by Annsankavi</footer>
    </div>
  );
}
