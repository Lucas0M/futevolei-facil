import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { Trophy, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div
      className="
        min-h-screen
        flex flex-col
        text-slate-100
        font-sans
        antialiased
        selection:bg-emerald-500
        selection:text-slate-950

        bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%),linear-gradient(to_bottom,#020617,#08111f,#020617)]
      "
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="rounded-xl bg-emerald-500/10 p-2 transition group-hover:bg-emerald-500/20">
                <Trophy className="h-5 w-5 text-emerald-400" />
              </div>

              <span className="bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-xl font-black uppercase tracking-wide text-transparent">
                Futevôlei Fácil
              </span>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              <NavLink
                to="/torneios"
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                  }`
                }
              >
                Torneios
              </NavLink>

              {user && (
                <NavLink
                  to="/minhas-inscricoes"
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  Minhas inscrições
                </NavLink>
              )}
            </nav>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 shadow-lg shadow-black/20">
                  <User className="h-4 w-4 text-emerald-400" />

                  <span className="text-sm font-semibold text-white">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="rounded-xl p-2 text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Entrar
              </Link>
            )}
          </div>

          <button className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-6 py-10">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/70 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Futevôlei Fácil. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}
