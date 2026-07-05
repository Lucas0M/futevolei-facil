import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { listMyRegistrations, cancelRegistration, cancelTeam } from "../../../api/registrations.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import type { Registration, Team, RegistrationStatus } from "../../../types/api.types";

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

const STATUS_BADGE_CLASSES: Record<RegistrationStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-blue-100 text-blue-700",
};

const CANCELLABLE_STATUSES: RegistrationStatus[] = ["PENDING_PAYMENT", "CONFIRMED"];

// A unified shape so both Registration (individual) and Team (duo) rows
// can be rendered by the same list, without the page needing to know
// which underlying entity each one is until the "cancel" action fires.
interface UnifiedEntry {
  kind: "registration" | "team";
  id: string;
  tournamentId: string;
  tournamentName: string;
  eventDate: string;
  label: string; // "Individual" or "Você + parceiro"
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
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );

      setEntries(all);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar suas inscrições."));
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
      setError(getApiErrorMessage(err, "Não foi possível cancelar esta inscrição."));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Minhas inscrições</h1>

      {isLoading && <p className="mt-6 text-gray-500">Carregando...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!isLoading && entries.length === 0 && (
        <p className="mt-6 text-gray-500">
          Você ainda não se inscreveu em nenhum torneio.{" "}
          <Link to="/torneios" className="text-green-700 hover:underline">
            Ver torneios disponíveis
          </Link>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={`${entry.kind}-${entry.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/torneios/${entry.tournamentId}`} className="font-semibold text-gray-900 hover:underline">
                  {entry.tournamentName}
                </Link>
                <p className="text-sm text-gray-600">
                  {new Date(entry.eventDate).toLocaleDateString("pt-BR")} · {entry.label}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[entry.status]}`}>
                {STATUS_LABELS[entry.status]}
              </span>
            </div>

            {CANCELLABLE_STATUSES.includes(entry.status) && (
              <button
                onClick={() => handleCancel(entry)}
                disabled={cancellingId === entry.id}
                className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {cancellingId === entry.id ? "Cancelando..." : "Cancelar inscrição"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
