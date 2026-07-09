import { useEffect, useState } from "react";
import {
  createRegistration,
  listMyRegistrations,
  cancelRegistration,
  cancelTeam,
} from "../../../api/registrations.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import type {
  TournamentDetailCategory,
  Registration,
  Team,
} from "../../../types/api.types";
import { useAuth } from "../../../context/AuthContext";

interface MyEntry {
  kind: "registration" | "team";
  id: string;
  status: Registration["status"];
}

const ACTIVE_STATUSES: Registration["status"][] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
];

const STATUS_LABELS: Record<Registration["status"], string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

interface Props {
  category: TournamentDetailCategory;
  onRegistrationChanged: () => void;
}

export function RegistrationActionCard({
  category,
  onRegistrationChanged,
}: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);
  const [partnerName, setPartnerName] = useState("");
  const [customOwnerName, setCustomOwnerName] = useState("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadMyEntry() {
      setIsLoadingEntry(true);

      try {
        const { registrations, teams } = await listMyRegistrations();

        const registration = registrations.find(
          (r) =>
            r.category?.id === category.id &&
            ACTIVE_STATUSES.includes(r.status),
        );

        const team = teams.find(
          (t) =>
            t.category?.id === category.id &&
            ACTIVE_STATUSES.includes(t.status),
        );

        if (!isCancelled) {
          if (registration) {
            setMyEntry({
              kind: "registration",
              id: registration.id,
              status: registration.status,
            });
          } else if (team) {
            setMyEntry({
              kind: "team",
              id: team.id,
              status: team.status,
            });
          } else {
            setMyEntry(null);
          }
        }
      } catch {
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
  }, [category.id]);

  async function handleRegister() {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      let body: any = {};
      if (category.format === "DUO_FIXED") {
        body.partnerName = partnerName;
        if (isAdmin && customOwnerName.trim()) {
          body.customOwnerName = customOwnerName;
        }
      } else {
        if (isAdmin && customPlayerName.trim()) {
          body.customPlayerName = customPlayerName;
        }
      }

      const created = (await createRegistration(category.id, body)) as (
        | Registration
        | Team
      ) & { id: string };

      const kind = category.format === "DUO_FIXED" ? "team" : "registration";

      setMyEntry({
        kind,
        id: created.id,
        status: "PENDING_PAYMENT",
      });

      setSuccessMessage("Inscrição realizada com sucesso!");
      onRegistrationChanged();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível concluir a inscrição."),
      );
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
      setError(
        getApiErrorMessage(err, "Não foi possível cancelar a inscrição."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingEntry) {
    return null;
  }

  const canRegister =
    category.status === "PUBLISHED" &&
    new Date(category.registrationDeadline) > new Date();

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur">
      {successMessage && (
        <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {myEntry ? (
        <div>
          <p className="text-white font-medium">
            Você já está inscrito nesta categoria.
          </p>

          <p className="mt-1 text-slate-400">
            Status: {STATUS_LABELS[myEntry.status]}
          </p>

          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2 font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Cancelando..." : "Cancelar minha inscrição"}
          </button>
        </div>
      ) : !canRegister ? (
        <p className="text-slate-400">
          As inscrições para esta categoria não estão abertas no momento.
        </p>
      ) : category.format === "DUO_FIXED" ? (
        <div className="space-y-4">
          {isAdmin && (
            <div>
              <label
                htmlFor="customOwnerName"
                className="mb-2 block text-sm font-medium text-emerald-400"
              >
                [Admin] Nome do Jogador 1 (Dono)
              </label>
              <input
                id="customOwnerName"
                type="text"
                value={customOwnerName}
                onChange={(e) => setCustomOwnerName(e.target.value)}
                placeholder="Nome do primeiro jogador"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="partnerName"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nome do {isAdmin ? "Jogador 2 (Parceiro)" : "parceiro(a)"}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="partnerName"
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Nome completo do parceiro"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />

              <button
                onClick={handleRegister}
                disabled={isSubmitting || partnerName.trim().length < 2 || (isAdmin && customOwnerName.trim().length > 0 && customOwnerName.trim().length < 2)}
                className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSubmitting ? "Inscrevendo..." : "Inscrever dupla"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <div>
              <label
                htmlFor="customPlayerName"
                className="mb-2 block text-sm font-medium text-emerald-400"
              >
                [Admin] Nome do Jogador
              </label>
              <input
                id="customPlayerName"
                type="text"
                value={customPlayerName}
                onChange={(e) => setCustomPlayerName(e.target.value)}
                placeholder="Nome do jogador"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isSubmitting || (isAdmin && customPlayerName.trim().length > 0 && customPlayerName.trim().length < 2)}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? "Inscrevendo..." : "Inscrever-se"}
          </button>
        </div>
      )}
    </div>
  );
}
