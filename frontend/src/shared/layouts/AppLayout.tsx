import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Shield,
  Users,
  Menu,
  X,
  Trophy,
  History,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("desktop-sidebar-open");
    return saved !== "false"; // default to true
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("desktop-sidebar-open", String(isDesktopSidebarOpen));
  }, [isDesktopSidebarOpen]);

  function handleLogout() {
    logout();
    setIsMobileSidebarOpen(false);
    setIsDesktopSidebarOpen(false);
    navigate("/login");
  }

  const linkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    } else {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const renderSidebarContent = (onClose: () => void) => (
    <div className="flex h-full w-full flex-col bg-[#080b11]/95 p-6 shadow-2xl backdrop-blur-md">
      {/* Header of Sidebar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
        <Link to="/" onClick={onClose} className="flex items-center gap-3">
          <img src="/logo.png" alt="ARES" className="h-10 w-auto" />
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-wider text-white">ARES</h1>
            <span className="text-[10px] uppercase tracking-widest text-gray-400">
              Futevôlei
            </span>
          </div>
        </Link>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Link List */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        <Link to="/torneios" onClick={onClose} className={linkClass("/torneios")}>
          <Trophy size={18} />
          Torneios
        </Link>

        <Link to="/historico" onClick={onClose} className={linkClass("/historico")}>
          <History size={18} />
          Histórico
        </Link>

        <Link to="/ranking" onClick={onClose} className={linkClass("/ranking")}>
          <BarChart3 size={18} />
          Ranking
        </Link>

        {user && (
          <Link to="/minhas-inscricoes" onClick={onClose} className={linkClass("/minhas-inscricoes")}>
            <Calendar size={18} />
            Minhas Inscrições
          </Link>
        )}

        {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
          <>
            <div className="my-2 border-t border-white/5 pt-2" />
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Painel Administrativo
            </span>
            <Link to="/admin" onClick={onClose} className={linkClass("/admin")}>
              <Shield size={18} />
              Painel Geral
            </Link>
            <Link to="/admin/atletas" onClick={onClose} className={linkClass("/admin/atletas")}>
              <Users size={18} />
              Gerenciar Atletas
            </Link>
          </>
        )}

        {user?.role === "SUPERADMIN" && (
          <Link to="/admin/logs" onClick={onClose} className={linkClass("/admin/logs")}>
            <FileText size={18} />
            Logs de Auditoria
          </Link>
        )}
      </nav>

      {/* Footer Profile / Logout */}
      <div className="border-t border-white/5 pt-5 mt-auto">
        {user ? (
          <div className="flex flex-col gap-3">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
            >
              {user.avatarUrl ? (
                <img
                  src={
                    user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("data:")
                      ? user.avatarUrl
                      : `${import.meta.env.VITE_API_URL || ""}${user.avatarUrl}`
                  }
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left leading-tight">
                <p className="text-xs text-slate-400">Meu Perfil</p>
                <p className="text-sm font-semibold text-white max-w-[140px] truncate">
                  {user.name}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Entrar
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. PERMANENT SIDEBAR (Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden md:flex h-screen w-72 border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(() => {})}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR (Mobile only) */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-80 border-r border-white/10 md:hidden transition-all duration-300">
            {renderSidebarContent(() => setIsMobileSidebarOpen(false))}
          </aside>
        </>
      )}

      {/* 3. MAIN PAGE CONTAINER */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isDesktopSidebarOpen ? "md:pl-72" : "md:pl-0"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
          <div className="mx-auto flex h-20 w-full items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-4">
              {/* Toggle Menu Button */}
              <button
                onClick={toggleSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Alternar menu"
              >
                <Menu size={20} />
              </button>

              {/* Logo / Header Title (Hide on desktop when sidebar is open) */}
              <Link
                to="/"
                className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${
                  isDesktopSidebarOpen ? "md:hidden" : ""
                }`}
              >
                <img src="/logo.png" alt="ARES" className="h-10 w-auto" />
                <div className="leading-tight">
                  <h1 className="text-xl font-black tracking-[0.18em]">ARES</h1>
                  <span className="text-[10px] uppercase tracking-[0.45em] text-gray-400">
                    Futevôlei
                  </span>
                </div>
              </Link>
            </div>

            {/* Header Right Side: User Profile / Login */}
            <div>
              {user ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 hover:bg-white/10 transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={
                        user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("data:")
                          ? user.avatarUrl
                          : `${import.meta.env.VITE_API_URL || ""}${user.avatarUrl}`
                      }
                      alt={user.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold text-white">
                    {user.name}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 md:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
