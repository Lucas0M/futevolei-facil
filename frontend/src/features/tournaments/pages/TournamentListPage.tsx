import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listTournaments } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  statusBadgeClasses,
  statusLabel,
} from "../../../shared/utils/tournamentLabels";
import type { Tournament, TournamentStatus } from "../../../types/api.types";
import { Trophy, Search, Calendar, MapPin, Sparkles } from "lucide-react";

const PAGE_SIZE = 12;

const STATUS_FILTER_OPTIONS: Array<{
  value: TournamentStatus | "";
  label: string;
}> = [
  { value: "", label: "Todos os status" },
  { value: "PUBLISHED", label: "Inscrições abertas" },
  { value: "REGISTRATIONS_CLOSED", label: "Inscrições encerradas" },
  { value: "FINISHED", label: "Finalizados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function TournamentListPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchTournaments() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listTournaments({
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        });

        if (!isCancelled) {
          setTournaments(result.data);
          setTotalPages(result.meta.totalPages);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            getApiErrorMessage(err, "Não foi possível carregar os torneios."),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTournaments();

    return () => {
      isCancelled = true;
    };
  }, [page, statusFilter, categoryFilter]);

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-emerald-400" />
            Torneios Disponíveis
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Encontre a sua categoria, prepare sua dupla e dispute o topo do pódio.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <Link
            to="/admin"
            className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition hover:bg-emerald-400"
          >
            Acessar Painel Admin
          </Link>
        )}
      </div>

      {/* Filter panel */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por categoria (ex: Iniciante)..."
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              handleFilterChange();
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:bg-slate-950"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TournamentStatus | "");
            handleFilterChange();
          }}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-950"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400 animate-pulse">Carregando painel de disputas...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isLoading && !error && tournaments.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center text-sm text-slate-500">
          Nenhum torneio ativo encontrado com os filtros selecionados.
        </div>
      )}

      {/* Tournaments grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/torneios/${tournament.id}`}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-6 transition duration-300 hover:border-emerald-500/30 hover:bg-slate-900/30"
          >
            {/* Top border glow */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-start justify-between gap-4">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClasses(tournament.status)}`}>
                  {statusLabel(tournament.status)}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-white group-hover:text-emerald-400 transition">
                {tournament.name}
              </h2>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{new Date(tournament.eventDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</span>
                </div>
              </div>

              {tournament.description && (
                <p className="mt-4 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {tournament.description}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:underline">
                <Sparkles className="h-3.5 w-3.5" />
                Ver Detalhes & Inscrição
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Página <span className="text-white font-bold">{page}</span> de{" "}
            <span className="text-white font-bold">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
