"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Atom,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Gamepad2,
  Globe2,
  HardDrive,
  Layers,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Network,
  Orbit,
  Radio,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import AssetInventory from "@/components/AssetInventory";
import DeveloperWorkspace from "@/components/DeveloperWorkspace";
import ModuleWorkbench from "@/components/ModuleWorkbench";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  categoryColors,
  categoryCounts,
  moduleCategories,
  technologyModules,
  type ModuleCategory,
  type TechnologyModule,
} from "@/data/modules";

const TechnologyUniverse = dynamic(
  () => import("@/components/TechnologyUniverse"),
  { ssr: false, loading: () => <div className="universe-fallback" /> },
);

const iconByName: Record<string, LucideIcon> = {
  analytics: BarChart3,
  atom: Atom,
  blocks: Blocks,
  brain: BrainCircuit,
  briefcase: BriefcaseBusiness,
  chip: CircuitBoard,
  cloud: Cloud,
  code: Code2,
  cpu: Cpu,
  chart: Activity,
  database: Database,
  devops: ArrowDownUp,
  edge: Workflow,
  flask: FlaskConical,
  game: Gamepad2,
  globe: Globe2,
  layers: Layers,
  lock: LockKeyhole,
  mobile: Smartphone,
  network: Network,
  radio: Radio,
  robot: Bot,
  settings: Settings2,
  shield: Shield,
  sparkles: Sparkles,
  vr: Orbit,
  workflow: Workflow,
};

type ApiStatus = "checking" | "online" | "offline";

function ModuleIcon({
  module,
  size = 17,
}: {
  module: TechnologyModule;
  size?: number;
}) {
  const Icon = iconByName[module.icon] ?? CircuitBoard;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}

function PlatformHealth({ status }: { status: ApiStatus }) {
  const details: Record<ApiStatus, string> = {
    checking: "Checking API connectivity",
    online: "FastAPI health endpoint responded successfully",
    offline: "API unavailable — start FastAPI to restore connectivity",
  };
  const labels: Record<ApiStatus, string> = {
    checking: "Checking",
    online: "Online",
    offline: "Offline",
  };

  return (
    <span
      className={`health-pill health-${status}`}
      role="status"
      title={details[status]}
    >
      <span className="health-dot" />
      API {labels[status]}
    </span>
  );
}

function EmptyProjects() {
  return (
    <div className="empty-projects">
      <span className="empty-icon">
        <HardDrive size={19} aria-hidden="true" />
      </span>
      <div>
        <p>Project workspaces are not available yet</p>
        <span>Use the software development module to save code snippets locally.</span>
      </div>
      <span className="coming-label">PLANNED</span>
    </div>
  );
}

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    ModuleCategory | "All modules"
  >("All modules");
  const [selectedModule, setSelectedModule] =
    useState<TechnologyModule | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return technologyModules.filter((module) => {
      const matchesCategory =
        activeCategory === "All modules" || module.category === activeCategory;
      const matchesSearch =
        !query ||
        `${module.name} ${module.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const openModule = useCallback((module: TechnologyModule) => {
    setSelectedModule(module);
    setMobileSidebarOpen(false);
    document.getElementById("module-library")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
    let active = true;
    let request: AbortController | undefined;

    const checkApi = async () => {
      request?.abort();
      request = new AbortController();
      try {
        const response = await fetch(`${baseUrl}/health`, {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) throw new Error(`API responded with ${response.status}`);
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("service" in result) ||
          result.service !== "techverse-api" ||
          !("status" in result) ||
          result.status !== "ok"
        ) {
          throw new Error("Unexpected API health response");
        }
        if (active) setApiStatus("online");
      } catch {
        if (active && !request?.signal.aborted) setApiStatus("offline");
      }
    };

    void checkApi();
    const intervalId = window.setInterval(() => void checkApi(), 30_000);
    return () => {
      active = false;
      request?.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const isMac = navigator.platform.includes("Mac");
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSelectedModule(null);
        setNotificationsOpen(false);
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectCategory = (
    category: ModuleCategory | "All modules",
  ) => {
    setActiveCategory(category);
    setSelectedModule(null);
    setMobileSidebarOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && visibleModules.length > 0) {
      openModule(visibleModules[0]);
    }
  };

  return (
    <main className="app-shell">
      {mobileSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          className="mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileSidebarOpen ? "sidebar-mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        <a className="sidebar-brand" href="#overview" aria-label="TECHVERSE 30 overview">
          <span className="sidebar-brand-icon">T</span>
          {!sidebarCollapsed && (
            <span className="sidebar-brand-wordmark">
              TECHVERSE <small>30</small>
            </span>
          )}
        </a>

        <div className="sidebar-scroll">
          <p className="nav-section-label">
            {!sidebarCollapsed && "WORKSPACE"}
          </p>
          <nav className="primary-nav" aria-label="Workspace sections">
            <button
              className="nav-link nav-link-active"
              onClick={() => {
                selectCategory("All modules");
                document.getElementById("overview")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              title={sidebarCollapsed ? "Overview" : undefined}
            >
              <Orbit size={17} aria-hidden="true" />
              {!sidebarCollapsed && <span>Overview</span>}
              {!sidebarCollapsed && <span className="nav-active-mark" />}
            </button>
            <button
              className="nav-link"
              onClick={() => {
                selectCategory("All modules");
                document.getElementById("module-library")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              title={sidebarCollapsed ? "All 30 modules" : undefined}
            >
              <CircuitBoard size={17} aria-hidden="true" />
              {!sidebarCollapsed && <span>Technology modules</span>}
              {!sidebarCollapsed && (
                <span className="nav-count">{technologyModules.length}</span>
              )}
            </button>
            <div
              className="nav-link nav-link-upcoming"
              title={
                sidebarCollapsed
                  ? "Project workspaces are not available yet"
                  : undefined
              }
            >
              <BriefcaseBusiness size={17} aria-hidden="true" />
              {!sidebarCollapsed && (
                <>
                  <span>Projects</span>
                  <span className="nav-lock">SOON</span>
                </>
              )}
            </div>
            <div
              className="nav-link nav-link-upcoming"
              title={sidebarCollapsed ? "AI assistant arrives in Stage 7" : undefined}
            >
              <BrainCircuit size={17} aria-hidden="true" />
              {!sidebarCollapsed && (
                <>
                  <span>AI assistant</span>
                  <span className="nav-lock">S7</span>
                </>
              )}
            </div>
          </nav>

          {!sidebarCollapsed && (
            <>
              <p className="nav-section-label nav-section-spaced">
                EXPLORE BY DOMAIN
              </p>
              <nav className="category-nav" aria-label="Filter by domain">
                {moduleCategories.map((category) => {
                  const color = categoryColors[category];
                  const active = activeCategory === category;
                  return (
                    <button
                      className={`category-link ${active ? "category-link-active" : ""}`}
                      key={category}
                      onClick={() => {
                        selectCategory(category);
                        document.getElementById("module-library")?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                      aria-pressed={active}
                    >
                      <span className="category-dot" style={{ backgroundColor: color }} />
                      <span>{category}</span>
                      <span className="category-count">
                        {categoryCounts.find((item) => item.category === category)?.count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className={`sidebar-roadmap ${sidebarCollapsed ? "sidebar-roadmap-mini" : ""}`}>
            <span className="roadmap-status" />
            {!sidebarCollapsed && (
              <span>
                <strong>Stage 6 of 10</strong>
                <small>Robotics · wheel-motion planning</small>
              </span>
            )}
          </div>
          <button
            className="sidebar-collapse"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
            {!sidebarCollapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="main-column" id="overview">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              aria-label="Open navigation menu"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={13} />
              <strong>Overview</strong>
            </div>
            <span className="topbar-stage">STAGE 06</span>
          </div>

          <div className="topbar-actions">
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <input
                ref={searchRef}
                aria-label="Search technology modules"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  selectCategory("All modules");
                }}
                onKeyDown={handleSearchKeyDown}
              />
              <kbd>
                {typeof navigator !== "undefined" &&
                navigator.platform.includes("Mac")
                  ? "⌘"
                  : "Ctrl"}
                K
              </kbd>
            </label>
            <div className="notification-anchor">
              <button
                className={`icon-button ${notificationsOpen ? "icon-button-active" : ""}`}
                aria-label="Platform notices"
                aria-expanded={notificationsOpen}
                aria-controls="notice-panel"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={17} />
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    className="notice-panel"
                    id="notice-panel"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div className="notice-panel-heading">
                      <strong>Platform notices</strong>
                      <button
                        className="notice-close"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close platform notices"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="notice-item">
                      <span className="notice-icon">
                        <Check size={14} />
                      </span>
                      <span>
                        <strong>Foundation ready</strong>
                        <small>Stage 1 · project scaffold and API health check</small>
                      </span>
                    </div>
                    <div className="notice-item">
                      <span className="notice-icon notice-icon-current">
                        <Sparkles size={14} />
                      </span>
                      <span>
                        <strong>IT management available</strong>
                        <small>Stage 4 · authenticated asset inventory</small>
                      </span>
                    </div>
                    <p className="notice-footnote">
                      Build milestones · not personal activity alerts
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="avatar" aria-label="TECHVERSE workspace">T</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-strip" aria-labelledby="welcome-heading">
            <div className="welcome-copy">
              <p className="eyebrow">
                <span className="eyebrow-line" />
                YOUR TECHNOLOGY WORKSPACE
              </p>
              <h1 id="welcome-heading">
                Explore the <span>possibilities.</span>
              </h1>
              <p>
                One connected workspace for 30 technology domains. Pick a
                direction; the tools will follow.
              </p>
            </div>
            <div className="welcome-orbit" aria-hidden="true">
              <span className="welcome-orbit-ring welcome-orbit-ring-one" />
              <span className="welcome-orbit-ring welcome-orbit-ring-two" />
              <span className="welcome-orbit-core">T</span>
              <i className="welcome-orbit-dot welcome-orbit-dot-one" />
              <i className="welcome-orbit-dot welcome-orbit-dot-two" />
            </div>
          </section>

          <section className="metric-row" aria-label="Workspace overview">
            <article className="metric-card">
              <span className="metric-icon metric-icon-cyan">
                <CircuitBoard size={16} />
              </span>
              <span className="metric-label">Technology domains</span>
              <strong>{technologyModules.length}</strong>
              <span className="metric-caption">Defined in the platform catalog</span>
            </article>
            <article className="metric-card">
              <span className="metric-icon metric-icon-violet">
                <Layers size={16} />
              </span>
              <span className="metric-label">Domain collections</span>
              <strong>{moduleCategories.length}</strong>
              <span className="metric-caption">Browse by area of interest</span>
            </article>
            <article className="metric-card">
              <span className="metric-icon metric-icon-green">
                <Activity size={16} />
              </span>
              <span className="metric-label">Platform API</span>
              <strong className={`metric-live metric-live-${apiStatus}`}>
                <span className="health-dot" />
                {apiStatus === "checking"
                  ? "Checking"
                  : apiStatus === "online"
                    ? "Connected"
                    : "Unavailable"}
              </strong>
              <span className="metric-caption">Live FastAPI health check</span>
            </article>
            <article className="metric-card">
              <span className="metric-icon metric-icon-orange">
                <ShieldCheck size={16} />
              </span>
              <span className="metric-label">IT asset inventory</span>
              <strong>Available</strong>
              <span className="metric-caption">Authenticated and API-backed</span>
            </article>
          </section>

          <section className="content-grid" aria-label="Technology overview">
            <article className="panel universe-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">INTERACTIVE DOMAIN MAP</span>
                  <h2>Technology universe</h2>
                </div>
                <span className="live-tag">
                  <span className="live-tag-dot" />
                  30 DOMAINS
                </span>
              </div>
              <div
                className="universe-stage"
                role="img"
                aria-label="Interactive three-dimensional map representing the 30 technology domains. Drag to rotate."
              >
                <TechnologyUniverse />
                <span className="universe-label universe-label-left">
                  ROTATE TO EXPLORE
                </span>
                <span className="universe-label universe-label-right">
                  3D DOMAIN MAP
                </span>
              </div>
              <div className="universe-legend">
                {categoryCounts.map(({ category }) => (
                  <span key={category}>
                    <i style={{ background: categoryColors[category] }} />
                    {category}
                  </span>
                ))}
              </div>
            </article>

            <article className="panel analytics-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">PLATFORM DIRECTORY</span>
                  <h2>Domain distribution</h2>
                </div>
                <span className="subtle-count">BY COLLECTION</span>
              </div>
              <p className="chart-description">
                Mapped domains by collection. These are catalog counts, not usage
                analytics.
              </p>
              <div className="distribution-chart">
                {categoryCounts.map(({ category, count }, index) => (
                  <button
                    className="distribution-row"
                    key={category}
                    onClick={() => {
                      selectCategory(category);
                      document.getElementById("module-library")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    aria-label={`${category}: ${count} modules. Filter the directory.`}
                  >
                    <span className="distribution-name">
                      <i style={{ background: categoryColors[category] }} />
                      {category}
                    </span>
                    <span className="distribution-track">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / 8) * 100}%` }}
                        transition={{ duration: 0.6, delay: index * 0.06 }}
                        style={{
                          background: `linear-gradient(90deg, ${categoryColors[category]}66, ${categoryColors[category]})`,
                        }}
                      />
                    </span>
                    <strong>{String(count).padStart(2, "0")}</strong>
                  </button>
                ))}
              </div>
              <div className="chart-footnote">
                <span>Directory coverage</span>
                <strong>{technologyModules.length} of 30 mapped</strong>
              </div>
            </article>
          </section>

          <section className="content-grid lower-grid" aria-label="Workspace status">
            <article className="panel systems-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">SERVICE READINESS</span>
                  <h2>System status</h2>
                </div>
                <PlatformHealth status={apiStatus} />
              </div>
              <div className="system-list">
                <div className="system-row">
                  <span className="system-service-icon system-icon-online">
                    <Globe2 size={16} />
                  </span>
                  <span className="system-info">
                    <strong>Web workspace</strong>
                    <small>Dashboard is serving this page</small>
                  </span>
                  <span className="system-status system-status-online">
                    <Check size={12} /> Active
                  </span>
                </div>
                <div className="system-row">
                  <span
                    className={`system-service-icon ${apiStatus === "online" ? "system-icon-online" : "system-icon-offline"}`}
                  >
                    <Network size={16} />
                  </span>
                  <span className="system-info">
                    <strong>Platform API</strong>
                    <small>
                      {apiStatus === "online"
                        ? "Health endpoint responded"
                        : apiStatus === "checking"
                          ? "Waiting for health endpoint"
                          : "Health endpoint did not respond"}
                    </small>
                  </span>
                  <span
                    className={`system-status ${apiStatus === "online" ? "system-status-online" : "system-status-pending"}`}
                  >
                    <i />
                    {apiStatus === "online"
                      ? "Connected"
                      : apiStatus === "checking"
                        ? "Checking"
                        : "Unavailable"}
                  </span>
                </div>
                <div className="system-row">
                  <span className="system-service-icon system-icon-muted">
                    <Database size={16} />
                  </span>
                  <span className="system-info">
                    <strong>PostgreSQL & Redis</strong>
                    <small>Defined for local setup, not connected</small>
                  </span>
                  <span className="system-status system-status-muted">
                    <i />
                    Not configured
                  </span>
                </div>
              </div>
              <p className="system-footnote">
                Service status reflects direct checks and setup state.
              </p>
            </article>

            <article className="panel projects-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">PLATFORM ROADMAP</span>
                  <h2>Project workspaces</h2>
                </div>
                <span className="subtle-count">PLANNED</span>
              </div>
              <EmptyProjects />
              <div className="assistant-callout">
                <span className="assistant-callout-icon">
                  <MessageSquareText size={17} />
                </span>
                <span>
                  <strong>Central AI assistant</strong>
                  <small>Model integrations arrive with Stage 7.</small>
                </span>
                <span className="coming-label">STAGE 7</span>
              </div>
            </article>
          </section>

          <section
            className="panel module-library"
            id="module-library"
            aria-labelledby="library-title"
          >
            <div className="library-heading">
              <div>
                <span className="panel-eyebrow">THE TECHNOLOGY LANDSCAPE</span>
                <h2 id="library-title">Explore the modules</h2>
                <p>
                  Search the catalog, choose a domain, and see when its tools
                  are scheduled.
                </p>
              </div>
              <div className="library-total">
                <strong>{String(visibleModules.length).padStart(2, "0")}</strong>
                <span>OF 30 MODULES</span>
              </div>
            </div>

            <div className="module-filters" aria-label="Filter technology modules">
              <button
                className={`filter-chip ${activeCategory === "All modules" ? "filter-chip-active" : ""}`}
                onClick={() => selectCategory("All modules")}
                aria-pressed={activeCategory === "All modules"}
              >
                All modules
                <span>{technologyModules.length}</span>
              </button>
              {moduleCategories.map((category) => (
                <button
                  className={`filter-chip ${activeCategory === category ? "filter-chip-active" : ""}`}
                  key={category}
                  onClick={() => selectCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                  <span>
                    {categoryCounts.find((item) => item.category === category)?.count}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {selectedModule && (
                <motion.div
                  className="module-detail"
                  key={selectedModule.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  role="status"
                >
                  <span
                    className="module-detail-icon"
                    style={{ color: categoryColors[selectedModule.category] }}
                  >
                    <ModuleIcon module={selectedModule} size={19} />
                  </span>
                  <span>
                    <strong>{selectedModule.name}</strong>
                    <small>
                      {selectedModule.id === "information-technology-management"
                        ? "Available now · authenticated asset inventory with private API-backed storage."
                        : selectedModule.id === "software-development"
                          ? "Available now · save and copy reusable code snippets in this browser."
                          : selectedModule.stage === 5 ||
                              selectedModule.id === "internet-of-things" ||
                              selectedModule.id === "robotics"
                            ? "Available now · use this module's interactive tools locally in your browser."
                            : `Planned for Stage ${selectedModule.stage} · dedicated tools and persistence are not available yet.`}
                    </small>
                  </span>
                  <button
                    className="detail-close"
                    aria-label={`Close ${selectedModule.name} details`}
                    onClick={() => setSelectedModule(null)}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedModule?.id === "information-technology-management" && (
              <AssetInventory />
            )}
            {selectedModule?.id === "software-development" && (
              <DeveloperWorkspace />
            )}
            {((selectedModule?.stage === 5 &&
              selectedModule.id !== "software-development") ||
              selectedModule?.id === "internet-of-things" ||
              selectedModule?.id === "robotics") && (
                <ModuleWorkbench
                  key={selectedModule.id}
                  module={selectedModule}
                />
              )}

            {visibleModules.length > 0 ? (
              <motion.div layout className="module-grid">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visibleModules.map((module, index) => (
                    <motion.button
                      className="module-card"
                      key={module.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.18, delay: index < 6 ? index * 0.025 : 0 }}
                      onClick={() => setSelectedModule(module)}
                      aria-pressed={selectedModule?.id === module.id}
                    >
                      <span
                        className="module-icon"
                        style={{
                          color: categoryColors[module.category],
                          backgroundColor: `${categoryColors[module.category]}12`,
                          borderColor: `${categoryColors[module.category]}27`,
                        }}
                      >
                        <ModuleIcon module={module} />
                      </span>
                      <span className="module-name">{module.shortName}</span>
                      <span className="module-arrow">
                        <ArrowRight size={14} />
                      </span>
                      <span className="module-card-category">
                        {module.category}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="no-results">
                <Search size={18} />
                <span>No modules match “{search}”. Try a different search.</span>
                <button
                  onClick={() => {
                    setSearch("");
                    selectCategory("All modules");
                    searchRef.current?.focus();
                  }}
                >
                  Clear search
                </button>
              </div>
            )}
          </section>

          <section className="roadmap-strip" aria-label="Platform delivery roadmap">
            <div className="roadmap-intro">
              <span className="roadmap-intro-icon">
                <Sparkles size={17} />
              </span>
              <span>
                <strong>Built in stages. Connected by design.</strong>
                <small>Explore what is here; see what is on the way.</small>
              </span>
            </div>
            <div className="roadmap-steps">
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>Foundation</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>Dashboard</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>Identity</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>IT management</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>Developer tools</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-done">
                <i><Check size={10} /></i>
                <span>IoT tools</span>
              </span>
              <span className="roadmap-connector roadmap-connector-active" />
              <span className="roadmap-step roadmap-step-current" aria-current="step">
                <i><span /></i>
                <span>Robotics</span>
              </span>
            </div>
          </section>

          <footer className="footer">
            <span>TECHVERSE 30</span>
            <span>STAGE 06 IN PROGRESS · ROBOTICS MOTION PLANNING</span>
            <a href="#overview">
              Back to top <ChevronDown size={13} />
            </a>
          </footer>
        </div>
      </div>
    </main>
  );
}
