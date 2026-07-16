import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Shield, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            to="/"
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

          {/* Nav */}
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

          {/* User */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                  <span className="text-sm text-gray-300">
                    Olá,&nbsp;
                    <span className="font-semibold text-white">
                      {user.name}
                    </span>
                  </span>
                </div>

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
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 mx-auto min-h-[calc(100vh-80px)] max-w-7xl px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
