import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// Intentionally minimal for now - visual identity/styling will be done
// separately later. Keep this structure simple so it's easy to restyle.
export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto mt-16 max-w-xl text-center">
      <h1 className="text-3xl font-bold text-gray-900">Futevôlei Fácil</h1>
      <p className="mt-3 text-gray-600">
        Encontre e se inscreva em torneios de futevôlei da sua região, sem bagunça de grupo de WhatsApp.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/torneios"
          className="rounded-md bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700"
        >
          Ver torneios
        </Link>

        {!user && (
          <Link
            to="/login"
            className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            Entrar / Criar conta
          </Link>
        )}
      </div>
    </div>
  );
}
