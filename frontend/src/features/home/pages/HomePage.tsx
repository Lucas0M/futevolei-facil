import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Trophy, Users, ShieldAlert, Zap } from "lucide-react";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden">
      {/* Glow */}
      <div className="absolute left-1/2 top-40 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[160px]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          Plataforma ARES Futevôlei
        </span>

        <h1 className="max-w-5xl text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
          A nova forma de disputar
          <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            torneios de futevôlei.
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-base md:text-lg leading-8 text-slate-400">
          Inscrições descomplicadas, chaveamentos oficiais gerados na hora e acompanhamento de partidas em tempo real. Viva a melhor experiência competitiva na areia.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            to="/torneios"
            className="
              rounded-xl
              bg-emerald-500
              px-8
              py-4
              font-bold
              text-slate-950
              shadow-[0_0_30px_rgba(16,185,129,.35)]
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-emerald-400
            "
          >
            Ver Torneios Ativos
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-8 py-4 font-bold text-emerald-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-emerald-500/10"
            >
              Painel Administrativo
            </Link>
          )}

          {!user && (
            <Link
              to="/registro"
              className="
                rounded-xl
                border
                border-white/10
                bg-white/[0.02]
                px-8
                py-4
                font-bold
                text-slate-200
                backdrop-blur-xl
                transition-all
                duration-300
                hover:border-emerald-500/30
                hover:bg-white/[0.05]
              "
            >
              Criar Conta Grátis
            </Link>
          )}
        </div>

        {/* LetzPlay inspired quick statistics grid */}
        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col items-center">
            <Trophy className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="text-2xl font-black text-white">Torneios Ativos</h3>
            <p className="mt-1 text-xs text-slate-500">Inscrições abertas na plataforma</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col items-center">
            <Users className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="text-2xl font-black text-white">Atletas na Arena</h3>
            <p className="mt-1 text-xs text-slate-500">Milhares de duplas disputando</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col items-center">
            <ShieldAlert className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="text-2xl font-black text-white">100% Seguro</h3>
            <p className="mt-1 text-xs text-slate-500">Confirmação instantânea Mercado Pago</p>
          </div>
        </div>
      </div>
    </section>
  );
}
