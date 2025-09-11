import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link, NavLink, useLocation as useRRLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import "../styles/dashboard.css";
import "../styles/notifications.css";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";

export default function Notifications() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const rrLoc = useRRLocation();
  const { pathname } = rrLoc;

  const username = state?.username || "Guest";
  const [open, setOpen] = useState(true);

  const seed = state?.notifications || [
    { msg: "New task assigned to you", time: "2 min ago" },
    { msg: "Team meeting at 5 PM", time: "1 hr ago" },
    { msg: "Report generated successfully", time: "Yesterday" },
  ];
  const [items, setItems] = useState(seed);

  // ===== Live Clock (Asia/Colombo) =====
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

  // ===== Topbar Search (searches SIDEBAR items) =====
  const NAV_ITEMS = [
    { label: "Dashboard",     to: "/admin",               icon: "material-symbols:dashboard" },
    { label: "Tasks",         to: "/admin/tasks",         icon: "material-symbols:folder" },
    { label: "Team",          to: "/admin/team",          icon: "material-symbols:group" },
    { label: "Notifications", to: "/admin/notifications", icon: "mdi:bell-outline" },
  ];

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
  // "/" shortcut
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

  // profile menu
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }
  function handleLogout() {
    navigate("/login");
  }
  function dismissAt(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="ad-wrap">
      {/* TOPBAR */}
      <header className="ad-topbar">
        <button
          className="ad-hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Icon icon="material-symbols:menu" width="20" height="20" />
        </button>

        <div className="ad-brand-logos">
          <img src={logo1} alt="Logo 1" />
          <img src={logo2} alt="Logo 2" />
        </div>

        {/* 🔎 Topbar Search — searches sidebar items */}
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


        {/* 🕒 Current date & time */}
        <div className="ad-clock" title="Asia/Colombo">
          <Icon icon="mdi:calendar-clock" width="18" height="18" />
          <span>{dateStr}</span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>

        {/* Profile */}
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

      {/* SHELL — sidebar + main */}
      <div className="ad-shell">
        {/* SIDEBAR */}
        <aside className={`ad-side ${open ? "open" : "closed"}`}>
          <div className="ad-profile-card">
            <div className="ad-avatar">
              <Icon icon="material-symbols:person" width="24" height="24" />
            </div>
            <div className="ad-role">Admin</div>
            <div className="ad-name">{username}</div>
          </div>

          <nav className="ad-nav" aria-label="Sidebar">
            {NAV_ITEMS.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {({ isActive }) => (
                  <>
                    <Icon icon={n.icon} width="16" height="16" />
                    <span>{n.label}</span>
                    {isActive && (
                      <Icon
                        icon="material-symbols:arrow-forward"
                        width="16"
                        height="16"
                        className="ad-right"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="ad-main">
          <section className="ad-card">
            <h2 className="ad-card-title">
              <Icon icon="material-symbols:notifications" width="22" height="22" />
              Notifications
            </h2>

            {items.length === 0 ? (
              <div className="ad-tr empty"><div>No notifications yet</div></div>
            ) : (
              <div className="ad-card divide-y" role="list">
                {items.map((n, i) => (
                  <div
                    key={i}
                    role="listitem"
                    className="ad-tr p-4 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{n.msg}</div>
                      <div className="text-sm text-gray-500">{n.time}</div>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700"
                      aria-label="Dismiss notification"
                      onClick={() => dismissAt(i)}
                    >
                      <Icon icon="mdi:close" width="18" height="18" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className="ad-footer">© {new Date().getFullYear()} Created by Annsankavi</footer>
    </div>
  );
}
