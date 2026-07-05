import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  createRegistration,
  listMyRegistrations,
  cancelRegistration,
  cancelTeam,
} from "../../../api/registrations.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { useAuth } from "../../../context/AuthContext";
import type { TournamentDetail, Registration, Team } from "../../../types/api.types";

interface MyEntry {
  kind: "registration" | "team";
  id: string;
  status: Registration["status"];
}

// Statuses that still count as "actively registered" for this tournament -
// CANCELLED/EXPIRED entries should not block a new registration attempt.
const ACTIVE_STATUSES: Registration["status"][] = ["PENDING_PAYMENT", "CONFIRMED"];

const STATUS_LABELS: Record<Registration["status"], string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

interface Props {
  tournament: TournamentDetail;
  onRegistrationChanged: () => void; // lets the parent page refetch the registrant list
}

export function RegistrationActionCard({ tournament, onRegistrationChanged }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);
  const [partnerName, setPartnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Anonymous visitors have nothing to check - skip the /registrations/me call.
    if (!user) {
      setIsLoadingEntry(false);
      return;
    }

    let isCancelled = false;

    async function loadMyEntry() {
      setIsLoadingEntry(true);
      try {
        const { registrations, teams } = await listMyRegistrations();

        const registration = registrations.find(
          (r) => r.tournamentId === tournament.id && ACTIVE_STATUSES.includes(r.status)
        );
        const team = teams.find((t) => t.tournamentId === tournament.id && ACTIVE_STATUSES.includes(t.status));

        if (!isCancelled) {
          if (registration) {
            setMyEntry({ kind: "registration", id: registration.id, status: registration.status });
          } else if (team) {
            setMyEntry({ kind: "team", id: team.id, status: team.status });
          } else {
            setMyEntry(null);
          }
        }
      } catch {
        // Silently ignore - worst case the button stays available and the
        // backend will reject a duplicate registration anyway (RN01).
      } finally {
        if (!isCancelled) {
          setIsLoadingEntry(false);
        }
      }
    }

    loadMyEntry();
    return () => {
      isCancelled = true;
    };
  }, [tournament.id, user]);

  async function handleRegister() {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const body = tournament.format === "DUO_FIXED" ? { partnerName } : {};
      const created = (await createRegistration(tournament.id, body)) as (Registration | Team) & { id: string };

      const kind = tournament.format === "DUO_FIXED" ? "team" : "registration";
      setMyEntry({ kind, id: created.id, status: "PENDING_PAYMENT" });
      setSuccessMessage("Inscrição realizada com sucesso!");
      onRegistrationChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível concluir a inscrição."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!myEntry) return;
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      if (myEntry.kind === "registration") {
        await cancelRegistration(myEntry.id);
      } else {
        await cancelTeam(myEntry.id);
      }
      setMyEntry(null);
      setSuccessMessage("Inscrição cancelada.");
      onRegistrationChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível cancelar a inscrição."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingEntry) {
    return null;
  }

  if (!user) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-gray-700">Você precisa estar logado para se inscrever neste torneio.</p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="mt-3 inline-block rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          Fazer login para se inscrever
        </Link>
      </div>
    );
  }

  const canRegister = tournament.status === "PUBLISHED" && new Date(tournament.registrationDeadline) > new Date();

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
      {successMessage && <p className="mb-3 text-sm text-green-700">{successMessage}</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {myEntry ? (
        <div>
          <p className="text-gray-900">
            Você já está inscrito neste torneio.{" "}
            <span className="text-sm text-gray-500">({STATUS_LABELS[myEntry.status]})</span>
          </p>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {isSubmitting ? "Cancelando..." : "Cancelar minha inscrição"}
          </button>
        </div>
      ) : !canRegister ? (
        <p className="text-gray-500">As inscrições para este torneio não estão abertas no momento.</p>
      ) : tournament.format === "DUO_FIXED" ? (
        <div>
          <label htmlFor="partnerName" className="mb-1 block text-sm font-medium text-gray-700">
            Nome do parceiro(a)
          </label>
          <div className="flex gap-2">
            <input
              id="partnerName"
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Nome completo do seu parceiro"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
            <button
              onClick={handleRegister}
              disabled={isSubmitting || partnerName.trim().length < 2}
              className="whitespace-nowrap rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Inscrevendo..." : "Inscrever dupla"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleRegister}
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? "Inscrevendo..." : "Inscrever-se"}
        </button>
      )}
    </div>
  );
}
