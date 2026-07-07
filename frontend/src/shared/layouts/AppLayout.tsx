import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Futevôlei Fácil
          </Link>

          <nav className="flex items-center gap-4 text-sm text-gray-700">
            <Link to="/torneios" className="hover:text-gray-900">
              Torneios
            </Link>
            {user && (
              <Link to="/minhas-inscricoes" className="hover:text-gray-900">
                Minhas inscrições
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="font-medium text-green-700 hover:text-green-800">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <span className="text-gray-500">Olá, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-gray-900">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
