import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Shield, Users, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  }

  const linkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;
  };

  const mobileLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex w-full items-center rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200 ${
      isActive
        ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-4 transition-opacity hover:opacity-90"
          >
            <img src="/logo.png" alt="ARES" className="h-12 w-auto" />

            <div className="leading-tight">
              <h1 className="text-2xl font-black tracking-[0.18em]">ARES</h1>

              <span className="text-xs uppercase tracking-[0.45em] text-gray-400">
                Futevôlei
              </span>
            </div>
          </Link>

          {/* Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link to="/torneios" className={linkClass("/torneios")}>
              Torneios
            </Link>
            <Link to="/historico" className={linkClass("/historico")}>
              Histórico
            </Link>
            <Link to="/ranking" className={linkClass("/ranking")}>
              Ranking
            </Link>
            {user && (
              <Link
                to="/minhas-inscricoes"
                className={linkClass("/minhas-inscricoes")}
              >
                Minhas inscrições
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 ${linkClass("/admin")}`}
                >
                  <Shield size={16} />
                  Admin
                </Link>
                <Link
                  to="/admin/atletas"
                  className={`flex items-center gap-1.5 ${linkClass("/admin/atletas")}`}
                >
                  <Users size={16} />
                  Atletas
                </Link>
              </>
            )}
          </nav>

          {/* User - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `${import.meta.env.VITE_API_URL || ""}${user.avatarUrl}`}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">
                    {user.name}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(34,197,94,0.45)]"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#07090e]/95 backdrop-blur-lg md:hidden">
            <div className="flex flex-col gap-2 p-4">
              <Link
                to="/torneios"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileLinkClass("/torneios")}
              >
                Torneios
              </Link>
              <Link
                to="/historico"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileLinkClass("/historico")}
              >
                Histórico
              </Link>
              <Link
                to="/ranking"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileLinkClass("/ranking")}
              >
                Ranking
              </Link>
              {user && (
                <Link
                  to="/minhas-inscricoes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileLinkClass("/minhas-inscricoes")}
                >
                  Minhas inscrições
                </Link>
              )}

              {user?.role === "ADMIN" && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClass("/admin")}
                  >
                    <Shield size={18} className="mr-2" />
                    Admin
                  </Link>
                  <Link
                    to="/admin/atletas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClass("/admin/atletas")}
                  >
                    <Users size={18} className="mr-2" />
                    Atletas
                  </Link>
                </>
              )}

              <div className="mt-4 border-t border-white/5 pt-4">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `${import.meta.env.VITE_API_URL || ""}${user.avatarUrl}`}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs text-slate-400">Meu Perfil</p>
                        <p className="text-sm font-semibold text-white">{user.name}</p>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                  >
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 mx-auto min-h-[calc(100vh-80px)] w-full max-w-7xl px-4 sm:px-6 md:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
