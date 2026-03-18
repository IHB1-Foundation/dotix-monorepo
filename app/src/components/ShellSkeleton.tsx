export function ShellSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, #ddf4ff 0%, #f7fbff 45%, #ffffff 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          .shell-bg { background: radial-gradient(circle at top left, #172036 0%, #0b1220 45%, #060b14 100%) !important; }
          .shell-gnb { background: rgba(15,18,30,0.85) !important; border-color: rgba(51,65,85,0.6) !important; }
          .shell-pulse { background: #1e293b !important; }
          .shell-card { background: rgba(15,23,42,0.8) !important; border-color: #334155 !important; }
        }
        @keyframes shell-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .shell-anim { animation: shell-pulse 1.5s ease-in-out infinite; }
      `}</style>

      {/* GNB skeleton */}
      <div
        className="shell-gnb"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Dotix logo inline SVG — no external resource */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 10, flexShrink: 0 }}>
            <rect width="36" height="36" rx="10" fill="#0f7ad8" />
            <path d="M10 18a8 8 0 1 1 16 0A8 8 0 0 1 10 18z" fill="none" stroke="#20c997" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="3" fill="white" />
          </svg>
          <div className="shell-anim shell-pulse" style={{ width: 60, height: 16, borderRadius: 6, background: "#e2e8f0" }} />
        </div>
        {/* Connect button skeleton */}
        <div className="shell-anim shell-pulse" style={{ width: 120, height: 36, borderRadius: 10, background: "#e2e8f0" }} />
      </div>

      {/* Body with sidebar + content */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        {/* Sidebar skeleton — hidden on small screens */}
        <div
          className="shell-card"
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid #e2e8f0",
            background: "rgba(255,255,255,0.8)",
            padding: "16px 8px",
            display: "none",
          }}
          id="shell-sidebar"
        >
          <style>{`@media(min-width:1024px){#shell-sidebar{display:block!important}}`}</style>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shell-anim shell-pulse" style={{ height: 36, borderRadius: 8, background: "#e2e8f0", marginBottom: 6 }} />
          ))}
        </div>

        {/* Main content skeleton */}
        <main style={{ flex: 1, padding: "24px 16px 112px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {/* KPI cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shell-card" style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "rgba(255,255,255,0.8)", padding: 16 }}>
                  <div className="shell-anim shell-pulse" style={{ width: 64, height: 12, borderRadius: 4, background: "#e2e8f0", marginBottom: 12 }} />
                  <div className="shell-anim shell-pulse" style={{ width: 100, height: 28, borderRadius: 6, background: "#e2e8f0" }} />
                </div>
              ))}
            </div>
            {/* Content cards */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="shell-card" style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "rgba(255,255,255,0.8)", padding: 16, marginBottom: 16 }}>
                <div className="shell-anim shell-pulse" style={{ width: 140, height: 14, borderRadius: 4, background: "#e2e8f0", marginBottom: 12 }} />
                <div className="shell-anim shell-pulse" style={{ width: "100%", height: 12, borderRadius: 4, background: "#e2e8f0", marginBottom: 8 }} />
                <div className="shell-anim shell-pulse" style={{ width: "75%", height: 12, borderRadius: 4, background: "#e2e8f0" }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
