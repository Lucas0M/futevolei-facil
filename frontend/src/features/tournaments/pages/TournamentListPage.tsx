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

const PAGE_SIZE = 10;

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Torneios
          </h1>
          <p className="mt-2 text-slate-300">
            Encontre o próximo torneio e faça sua inscrição.
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <Link
            to="/admin"
            className="inline-flex items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
          >
            Abrir painel admin
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TournamentStatus | "");
            handleFilterChange();
          }}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900"
            >
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filtrar por categoria..."
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            handleFilterChange();
          }}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400"
        />
      </div>

      {isLoading && <p className="text-slate-300">Carregando torneios...</p>}

      {error && <p className="font-medium text-red-400">{error}</p>}

      {!isLoading && !error && tournaments.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
          Nenhum torneio encontrado com esses filtros.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/torneios/${tournament.id}`}
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                {tournament.name}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(tournament.status)}`}
              >
                {statusLabel(tournament.status)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="text-slate-300">📍 {tournament.location}</p>

              <p className="text-slate-300">
                📅 {new Date(tournament.eventDate).toLocaleDateString("pt-BR")}
              </p>

              {tournament.description && (
                <p className="text-slate-400">{tournament.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-5 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm font-medium text-slate-300">
            Página <span className="text-white">{page}</span> de{" "}
            <span className="text-white">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
