import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  listMyRegistrations,
  cancelRegistration,
  cancelTeam,
} from "../../../api/registrations.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import type {
  Registration,
  Team,
  RegistrationStatus,
} from "../../../types/api.types";

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

const STATUS_BADGE_CLASSES: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT:
    "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
  CONFIRMED: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  CANCELLED: "bg-slate-700 text-slate-300 border border-slate-600",
  EXPIRED: "bg-slate-700 text-slate-300 border border-slate-600",
  REFUNDED: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
};

const CANCELLABLE_STATUSES: RegistrationStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
];

interface UnifiedEntry {
  kind: "registration" | "team";
  id: string;
  tournamentId: string;
  tournamentName: string;
  eventDate: string;
  label: string;
  status: RegistrationStatus;
}

export function MyRegistrationsPage() {
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyRegistrations = useCallback(async () => {
    setError(null);

    try {
      const { registrations, teams } = await listMyRegistrations();

      const registrationEntries: UnifiedEntry[] = registrations
        .filter((r) => r.tournament)
        .map((r: Registration) => ({
          kind: "registration",
          id: r.id,
          tournamentId: r.tournamentId,
          tournamentName: r.tournament!.name,
          eventDate: r.tournament!.eventDate,
          label: "Individual",
          status: r.status,
        }));

      const teamEntries: UnifiedEntry[] = teams
        .filter((t) => t.tournament)
        .map((t: Team) => ({
          kind: "team",
          id: t.id,
          tournamentId: t.tournamentId,
          tournamentName: t.tournament!.name,
          eventDate: t.tournament!.eventDate,
          label: `Você + ${t.partnerName}`,
          status: t.status,
        }));

      const all = [...registrationEntries, ...teamEntries].sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      );

      setEntries(all);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar suas inscrições."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  async function handleCancel(entry: UnifiedEntry) {
    setCancellingId(entry.id);
    setError(null);

    try {
      if (entry.kind === "registration") {
        await cancelRegistration(entry.id);
      } else {
        await cancelTeam(entry.id);
      }

      await fetchMyRegistrations();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível cancelar esta inscrição."),
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-white">
          Minhas inscrições
        </h1>

        <p className="mt-2 text-slate-300">
          Gerencie todas as suas inscrições em torneios.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-300">
          Carregando...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
          <p className="text-slate-300">
            Você ainda não se inscreveu em nenhum torneio.
          </p>

          <Link
            to="/torneios"
            className="mt-5 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400"
          >
            Ver torneios disponíveis
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={`${entry.kind}-${entry.id}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <Link
                  to={`/torneios/${entry.tournamentId}`}
                  className="text-xl font-bold text-white transition hover:text-emerald-400"
                >
                  {entry.tournamentName}
                </Link>

                <p className="mt-2 text-slate-300">
                  📅 {new Date(entry.eventDate).toLocaleDateString("pt-BR")}
                </p>

                <p className="mt-1 text-slate-400">🏐 {entry.label}</p>
              </div>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>

            {CANCELLABLE_STATUSES.includes(entry.status) && (
              <div className="mt-6 border-t border-slate-800 pt-5">
                <button
                  onClick={() => handleCancel(entry)}
                  disabled={cancellingId === entry.id}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2 font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingId === entry.id
                    ? "Cancelando..."
                    : "Cancelar inscrição"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
