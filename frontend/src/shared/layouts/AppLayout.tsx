import { useState } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsSidebarOpen(false);
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {/* Toggle Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
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

          {/* User Profile Summary Shortcut in Header */}
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

      {/* Sidebar Drawer Component */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Sidebar Panel */}
          <div className="fixed left-0 top-0 bottom-0 z-50 flex h-full w-80 flex-col border-r border-white/10 bg-[#080b11]/95 p-6 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <Link
                to="/"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3"
              >
                <img src="/logo.png" alt="ARES" className="h-10 w-auto" />
                <div className="leading-tight">
                  <h1 className="text-xl font-black tracking-wider text-white">ARES</h1>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">
                    Futevôlei
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Link List */}
            <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
              <Link
                to="/torneios"
                onClick={() => setIsSidebarOpen(false)}
                className={linkClass("/torneios")}
              >
                <Trophy size={18} />
                Torneios
              </Link>

              <Link
                to="/historico"
                onClick={() => setIsSidebarOpen(false)}
                className={linkClass("/historico")}
              >
                <History size={18} />
                Histórico
              </Link>

              <Link
                to="/ranking"
                onClick={() => setIsSidebarOpen(false)}
                className={linkClass("/ranking")}
              >
                <BarChart3 size={18} />
                Ranking
              </Link>

              {user && (
                <Link
                  to="/minhas-inscricoes"
                  onClick={() => setIsSidebarOpen(false)}
                  className={linkClass("/minhas-inscricoes")}
                >
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
                  <Link
                    to="/admin"
                    onClick={() => setIsSidebarOpen(false)}
                    className={linkClass("/admin")}
                  >
                    <Shield size={18} />
                    Painel Geral
                  </Link>
                  <Link
                    to="/admin/atletas"
                    onClick={() => setIsSidebarOpen(false)}
                    className={linkClass("/admin/atletas")}
                  >
                    <Users size={18} />
                    Gerenciar Atletas
                  </Link>
                </>
              )}

              {user?.role === "SUPERADMIN" && (
                <Link
                  to="/admin/logs"
                  onClick={() => setIsSidebarOpen(false)}
                  className={linkClass("/admin/logs")}
                >
                  <FileText size={18} />
                  Logs de Auditoria
                </Link>
              )}
            </nav>

            {/* Sidebar User Profile / Logout */}
            <div className="border-t border-white/5 pt-5 mt-auto">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/profile"
                    onClick={() => setIsSidebarOpen(false)}
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
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Conteúdo */}
      <main className="relative z-10 mx-auto min-h-[calc(100vh-80px)] w-full max-w-7xl px-4 sm:px-6 md:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
