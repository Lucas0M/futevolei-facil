import { useEffect, useState, useCallback } from "react";
import { Trophy, Users, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { getDashboardSummary } from "../../../api/dashboard.api";
import { confirmRegistrationPayment, confirmTeamPayment, type TeamPaymentPortion } from "../../../api/payments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import type { DashboardSummary } from "../../../types/api.types";

const TEAM_PORTION_OPTIONS: Array<{ value: TeamPaymentPortion; label: string }> = [
  { value: "FULL", label: "Dupla inteira" },
  { value: "OWNER_SHARE", label: "Parte do dono" },
  { value: "PARTNER_SHARE", label: "Parte do parceiro" },
];

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<Record<string, TeamPaymentPortion>>({});

  const fetchSummary = useCallback(async () => {
    setError(null);
    try {
      const result = await getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar o dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  async function handleConfirm(entry: DashboardSummary["pendingConfirmations"][number]) {
    setConfirmingId(entry.id);
    setError(null);
    try {
      if (entry.kind === "registration") {
        await confirmRegistrationPayment(entry.id);
      } else {
        const portion = selectedPortion[entry.id] ?? "FULL";
        await confirmTeamPayment(entry.id, portion);
      }
      await fetchSummary();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível confirmar este pagamento."));
    } finally {
      setConfirmingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-slate-400">Carregando...</p>;
  }

  if (error && !summary) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!summary) return null;

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-wide text-white">Dashboard</h1>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard icon={Trophy} label="Torneios ativos" value={summary.activeTournaments} />
        <MetricCard icon={Users} label="Inscrições confirmadas" value={summary.confirmedEntriesCount} />
        <MetricCard
          icon={DollarSign}
          label="Receita confirmada"
          value={`R$ ${summary.confirmedRevenue}`}
          accent="text-emerald-400"
        />
        <MetricCard
          icon={Clock}
          label="Receita pendente"
          value={`R$ ${summary.pendingRevenue}`}
          accent="text-amber-400"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-white">Aguardando confirmação de pagamento</h2>

        {summary.pendingConfirmations.length === 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Nenhum pagamento pendente no momento.
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {summary.pendingConfirmations.map((entry) => (
              <li
                key={`${entry.kind}-${entry.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/10"
              >
                <div>
                  <p className="font-semibold text-white">{entry.playerName}</p>
                  <p className="text-sm text-slate-400">
                    {entry.tournamentName} · R$ {entry.amountDue}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {entry.kind === "team" && (
                    <select
                      value={selectedPortion[entry.id] ?? "FULL"}
                      onChange={(e) =>
                        setSelectedPortion((prev) => ({
                          ...prev,
                          [entry.id]: e.target.value as TeamPaymentPortion,
                        }))
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      {TEAM_PORTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => handleConfirm(entry)}
                    disabled={confirmingId === entry.id}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {confirmingId === entry.id ? "Confirmando..." : "Confirmar pagamento"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/10">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ?? "text-emerald-400"}`} />
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <p className={`mt-2 text-xl font-bold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}
