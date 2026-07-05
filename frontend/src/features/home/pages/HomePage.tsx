import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6">
      {/* Glow de fundo */}
      <div className="absolute left-1/2 top-1/3 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[140px]" />

      <div className="max-w-3xl text-center">
        <span className="mb-5 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-300">
          Plataforma de torneios de futevôlei
        </span>

        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
          Futevôlei{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
            Fácil
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Encontre e se inscreva em torneios de futevôlei da sua região, sem
          depender de grupos de WhatsApp. Descubra eventos, acompanhe inscrições
          e participe de competições de forma simples e organizada.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/torneios"
            className="rounded-xl bg-emerald-500 px-7 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-400 active:scale-95"
          >
            Ver torneios
          </Link>

          {!user && (
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-7 py-3 font-semibold text-slate-200 transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-800 hover:text-white"
            >
              Entrar / Criar conta
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
