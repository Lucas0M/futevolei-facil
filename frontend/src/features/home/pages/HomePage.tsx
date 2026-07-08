import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden">
      {/* Glow */}
      <div className="absolute left-1/2 top-40 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-accent/15 blur-[160px]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
        <span className="mb-8 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-5 py-2 text-sm font-medium text-brand-accent">
          Plataforma Oficial de Torneios
        </span>

        <h1 className="max-w-5xl text-6xl font-black leading-tight tracking-tight text-white md:text-7xl">
          A nova forma de organizar
          <span className="block bg-gradient-to-r from-brand-accent to-emerald-300 bg-clip-text text-transparent">
            torneios de futevôlei.
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400">
          Inscrições online, gerenciamento profissional e uma experiência
          moderna para atletas e organizadores. Tudo em um só lugar.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <Link
            to="/torneios"
            className="
              rounded-xl
              bg-brand-accent
              px-8
              py-4
              font-semibold
              text-white
              shadow-[0_0_35px_rgba(16,185,129,.30)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-emerald-400
            "
          >
            Explorar Torneios
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-8 py-4 font-semibold text-emerald-300 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-emerald-500/20"
            >
              Abrir painel admin
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              className="
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                px-8
                py-4
                font-semibold
                text-slate-200
                backdrop-blur-xl
                transition-all
                duration-300
                hover:border-brand-accent/40
                hover:bg-white/[0.05]
              "
            >
              Criar conta
            </Link>
          )}
        </div>

        {/* Stats */}

        <div className="mt-24 grid w-full max-w-4xl grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h2 className="text-3xl font-black text-white">100+</h2>
            <p className="mt-2 text-sm text-slate-400">Torneios cadastrados</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h2 className="text-3xl font-black text-white">500+</h2>
            <p className="mt-2 text-sm text-slate-400">Atletas inscritos</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h2 className="text-3xl font-black text-white">24/7</h2>
            <p className="mt-2 text-sm text-slate-400">Plataforma disponível</p>
          </div>
        </div>
      </div>
    </section>
  );
}
