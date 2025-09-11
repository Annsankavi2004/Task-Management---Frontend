// src/Pages/MyTasks.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import "../styles/dashboard.css";
import "../styles/user.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

// ✅ import context
import { useUser } from "../context/UserContext";

// Demo tasks
const DEFAULT_TASKS = [
  { id: 201, title: "Design Homepage",  desc:"Polish hero",      status:"In Progress", priority:"High",   due:"2025-09-10", assignees:[1,5], progress:40, createdAt: Date.now()-86400000*5 },
  { id: 202, title: "API Integration",  desc:"Hook endpoints",   status:"Pending",     priority:"High",   due:"2025-09-12", assignees:[1,3], progress:0,  createdAt: Date.now()-86400000*4 },
  { id: 203, title: "QA Checklist",     desc:"Regression",       status:"On Hold",     priority:"Low",    due:"2025-09-05", assignees:[2],   progress:10, createdAt: Date.now()-86400000*7 },
  { id: 204, title: "Blog Post",        desc:"React perf",       status:"In Progress", priority:"Medium", due:"2025-09-08", assignees:[1,2], progress:65, createdAt: Date.now()-86400000*3 },
  { id: 205, title: "Refactor utils",   desc:"Split helpers",    status:"Completed",   priority:"Medium", due:"2025-09-03", assignees:[4],   progress:100,createdAt: Date.now()-86400000*8 },
];

const norm = s => (s||"").toLowerCase().trim();

export default function MyTasks() {
  const nav = useNavigate();
  const { user, setUser } = useUser();
  const username = user?.username || "Member";
  const userId = user?.userId ?? 1;
  const rolename = user?.rolename || "Member";

  const [open, setOpen] = useState(true);
  const [tasks] = useState(DEFAULT_TASKS);
  const [search, setSearch] = useState("");

  const profileRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ===== Live Clock (Asia/Colombo) =====
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const dateStr = new Intl.DateTimeFormat("en-GB", { weekday: "short", year: "numeric", month: "short", day: "2-digit", timeZone: "Asia/Colombo" }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Colombo" }).format(now);

  const myTasks = useMemo(() => tasks.filter(t => (t.assignees||[]).includes(userId)), [tasks, userId]);

  const KPI = {
    total:     myTasks.length,
    pending:   myTasks.filter(t=>norm(t.status)==="pending").length,
    inprog:    myTasks.filter(t=>norm(t.status)==="in progress").length,
    done:      myTasks.filter(t=>norm(t.status)==="completed").length,
    onhold:    myTasks.filter(t=>norm(t.status)==="on hold").length,
    overdue:   myTasks.filter(t=>t.due && new Date(t.due).getTime() < Date.now() && norm(t.status)!=="completed").length,
  };

  const filteredTasks = useMemo(() => {
    const q = norm(search);
    if(!q) return myTasks;
    return myTasks.filter(t =>
      norm(t.title).includes(q) ||
      norm(t.desc).includes(q) ||
      norm(t.status).includes(q) ||
      norm(t.priority).includes(q)
    );
  }, [myTasks, search]);

  const handleLogout = () => {
    setUser(null);
    nav("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if(hour<12) return "Good Morning";
    if(hour<18) return "Good Afternoon";
    return "Good Evening";
  }

  return (
    <div className="ad-wrap">
      {/* TOPBAR */}
      <header className="ad-topbar">
        <button className="ad-hamburger" onClick={()=>setOpen(o=>!o)} aria-label="Toggle menu">
          <Icon icon="material-symbols:menu" width="20" height="20" />
        </button>

        <div className="ad-brand-logos">
          <img src={logo1} alt="Logo 1" />
          <img src={logo2} alt="Logo 2" />
        </div>

        <nav className="ad-topnav" aria-label="Primary">
          <NavLink to="/user" className={({isActive})=>isActive?"active":""}>Dashboard</NavLink>
          <NavLink to="/my-task" className={({isActive})=>isActive?"active":""}>My Tasks</NavLink>
        </nav>

        {/* 🔎 Topbar Search (keeps it simple) */}
        <div className="ad-search ad-search--topbar">
          <Icon  width="18" height="18" className="ad-search-icons" />
          <input placeholder="Search my tasks..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>

        <div className="ad-clock" title="Asia/Colombo">
          <Icon icon="mdi:calendar-clock" width="18" height="18" />
          <span>{dateStr}</span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>

        <Link to="/user/notifications" className="ad-notification" aria-label="Notifications">
          {/* bell or badge can go here */}
        </Link>

        <div className="ad-profile" ref={profileRef}>
          <button className="ad-avatar-btn" onClick={()=>setShowProfile(v=>!v)} title={username}>
            <Icon icon="material-symbols:person" width="22" height="22" />
          </button>
          <div className="ad-profile-greeting">{getGreeting()}, {username}</div>

          {showProfile && (
            <div className="ad-profile-menu">
              <div className="ad-profile-head">
                <div className="ad-avatar-mini">
                  <Icon icon="material-symbols:person" width="18" height="18" />
                </div>
                <div>
                  <div className="ad-name">{username}</div>
                  <div className="ad-sub">{rolename}</div>
                </div>
              </div>
              <button className="ad-menu-item" onClick={handleLogout}>
                <Icon icon="material-symbols:logout" width="18" height="18" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* SHELL */}
      <div className="ad-shell">
        <aside className={`ad-side ${open?"open":"closed"}`}>
          <div className="ad-profile-card">
            <div className="ad-avatar">
              <Icon icon="material-symbols:person" width="24" height="24" />
            </div>
            <div className="ad-role">{rolename}</div>
            <div className="ad-name">{username}</div>
          </div>
          <nav className="ad-nav" aria-label="Sidebar">
            <NavLink to="/user" className={({isActive})=>isActive?"active":""}>
              <Icon icon="material-symbols:dashboard" width="16" height="16" /> Dashboard
            </NavLink>
            <NavLink to="/my-task" className={({isActive})=>isActive?"active":""}>
              <Icon icon="material-symbols:folder" width="16" height="16" /> My Tasks
            </NavLink>
          </nav>
        </aside>

        <main className="ad-main">
          {/* KPI */}
          <section className="mem-kpis">
            <div className="mem-kpi"><div className="kpi-label">Total</div><div className="kpi-value">{KPI.total}</div></div>
            <div className="mem-kpi"><div className="kpi-label">Pending</div><div className="kpi-value">{KPI.pending}</div></div>
            <div className="mem-kpi"><div className="kpi-label">In Progress</div><div className="kpi-value">{KPI.inprog}</div></div>
            <div className="mem-kpi"><div className="kpi-label">Completed</div><div className="kpi-value">{KPI.done}</div></div>
            <div className="mem-kpi"><div className="kpi-label">On Hold</div><div className="kpi-value">{KPI.onhold}</div></div>
            <div className="mem-kpi warn"><div className="kpi-label">Overdue</div><div className="kpi-value">{KPI.overdue}</div></div>
          </section>

          {/* Tasks Table */}
          <section className="ad-card">
            <h2 className="ad-card-title">My Tasks</h2>
            <div className="ad-table">
              <div className="ad-tr ad-tr-head">
                <div>Task</div><div>Status</div><div>Priority</div><div>Due</div>
              </div>
              {filteredTasks.length===0 ? (
                <div className="ad-tr empty"><div>No matching tasks</div></div>
              ) : (
                filteredTasks.map(t => (
                  <div className="ad-tr" key={t.id}>
                    <div>{t.title}</div>
                    <div><span className={`badge ${norm(t.status).replace(/\\s/g,"")}`}>{t.status}</span></div>
                    <div><span className={`pill ${norm(t.priority)}`}>{t.priority}</span></div>
                    <div>{t.due || "—"}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="ad-footer">
        © {new Date().getFullYear()} Created by Annsankavi
      </footer>
    </div>
  );
}
