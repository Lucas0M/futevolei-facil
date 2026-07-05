import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTournaments } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { formatLabel, statusLabel, statusBadgeClasses } from "../../../shared/utils/tournamentLabels";
import type { Tournament, TournamentStatus } from "../../../types/api.types";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS: Array<{ value: TournamentStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "PUBLISHED", label: "Inscrições abertas" },
  { value: "REGISTRATIONS_CLOSED", label: "Inscrições encerradas" },
  { value: "FINISHED", label: "Finalizados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function TournamentListPage() {
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
          setError(getApiErrorMessage(err, "Não foi possível carregar os torneios."));
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
    // Any filter change resets pagination back to the first page,
    // otherwise the user could land on an out-of-range page.
    setPage(1);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Torneios</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TournamentStatus | "");
            handleFilterChange();
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
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
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading && <p className="mt-6 text-gray-500">Carregando torneios...</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!isLoading && !error && tournaments.length === 0 && (
        <p className="mt-6 text-gray-500">Nenhum torneio encontrado com esses filtros.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/torneios/${tournament.id}`}
            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-green-600"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-gray-900">{tournament.name}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(tournament.status)}`}>
                {statusLabel(tournament.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{tournament.location}</p>
            <p className="text-sm text-gray-600">
              {new Date(tournament.eventDate).toLocaleDateString("pt-BR")} · {tournament.category}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {formatLabel(tournament.format)} · R$ {tournament.entryFee}
            </p>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
