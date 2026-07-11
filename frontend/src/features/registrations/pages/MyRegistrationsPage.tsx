import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  listMyRegistrations,
  cancelRegistration,
  cancelTeam,
} from "../../../api/registrations.api";
import { checkoutRegistration, checkoutTeam } from "../../../api/payments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import type {
  Registration,
  Team,
  RegistrationStatus,
  TournamentFormat,
} from "../../../types/api.types";
import { CreditCard, Calendar, Volleyball, ShieldX, Sparkles, Trophy } from "lucide-react";

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
  amountDue: string;
  format: TournamentFormat;
}

export function MyRegistrationsPage() {
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchMyRegistrations = useCallback(async () => {
    setError(null);

    try {
      const { registrations, teams } = await listMyRegistrations();

      const registrationEntries: UnifiedEntry[] = registrations
        .filter((r) => r.category?.tournament)
        .map((r: Registration) => ({
          kind: "registration",
          id: r.id,
          tournamentId: r.category!.tournament.id,
          tournamentName: r.category!.tournament.name,
          eventDate: r.category!.tournament.eventDate,
          label: `Individual - ${r.category!.name}`,
          status: r.status,
          amountDue: r.amountDue,
          format: r.category!.format,
        }));

      const teamEntries: UnifiedEntry[] = teams
        .filter((t) => t.category?.tournament)
        .map((t: Team) => ({
          kind: "team",
          id: t.id,
          tournamentId: t.category!.tournament.id,
          tournamentName: t.category!.tournament.name,
          eventDate: t.category!.tournament.eventDate,
          label: `${t.category!.name} - Você + ${t.partnerName}`,
          status: t.status,
          amountDue: t.amountDue,
          format: t.category!.format,
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

  async function handleCheckout(entry: UnifiedEntry, portion?: "FULL" | "OWNER_SHARE") {
    setPayingId(entry.id);
    setError(null);
    try {
      let checkoutUrl = "";
      if (entry.kind === "registration") {
        const res = await checkoutRegistration(entry.id);
        checkoutUrl = res.checkoutUrl;
      } else {
        const res = await checkoutTeam(entry.id, portion || "FULL");
        checkoutUrl = res.checkoutUrl;
      }
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Não foi possível obter o link de checkout.");
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível iniciar o pagamento com Mercado Pago."),
      );
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
          <Volleyball className="h-8 w-8 text-emerald-400" />
          Minhas Inscrições
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Gerencie e pague suas inscrições em torneios e acompanhe seu status de confirmação.
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400 animate-pulse">Carregando painel de inscrições...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-12 text-center">
          <p className="text-slate-400 text-sm">
            Você ainda não se inscreveu em nenhum torneio de futevôlei.
          </p>
          <Link
            to="/torneios"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Trophy className="h-4 w-4" />
            Explorar Torneios
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={`${entry.kind}-${entry.id}`}
            className="group relative rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition duration-300 hover:border-emerald-500/20"
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${entry.status === "CONFIRMED" ? "bg-emerald-500" : entry.status === "PENDING_PAYMENT" ? "bg-yellow-500" : "bg-slate-700"}`} />

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <Link
                  to={`/torneios/${entry.tournamentId}`}
                  className="text-lg font-bold text-white transition hover:text-emerald-400"
                >
                  {entry.tournamentName}
                </Link>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    {new Date(entry.eventDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Volleyball className="h-4 w-4 text-slate-500" />
                    {entry.label}
                  </span>
                </div>
              </div>

              <span
                className={`self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASSES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>

            <div className="mt-6 border-t border-slate-800/80 pt-5 flex flex-wrap items-center justify-between gap-4">
              {entry.status === "PENDING_PAYMENT" && (
                <div className="flex flex-wrap gap-2">
                  {entry.format === "DUO_FIXED" ? (
                    <>
                      <button
                        onClick={() => handleCheckout(entry, "FULL")}
                        disabled={payingId === entry.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pagar Inteiro (R$ {(Number(entry.amountDue) * 2).toFixed(2)})
                      </button>
                      <button
                        onClick={() => handleCheckout(entry, "OWNER_SHARE")}
                        disabled={payingId === entry.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Pagar Minha Parte (R$ {entry.amountDue})
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCheckout(entry)}
                      disabled={payingId === entry.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pagar Inscrição (R$ {entry.amountDue})
                    </button>
                  )}
                </div>
              )}

              {CANCELLABLE_STATUSES.includes(entry.status) && (
                <button
                  onClick={() => handleCancel(entry)}
                  disabled={cancellingId === entry.id}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50 ml-auto"
                >
                  <ShieldX className="h-3.5 w-3.5" />
                  {cancellingId === entry.id
                    ? "Cancelando..."
                    : "Cancelar Inscrição"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
