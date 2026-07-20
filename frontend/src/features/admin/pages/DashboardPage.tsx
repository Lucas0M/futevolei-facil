import {
  useEffect,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Plus,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Check,
  TrendingUp,
  Activity,
  X,
  Sparkles,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getDashboardSummary } from "../../../api/dashboard.api";
import {
  confirmRegistrationPayment,
  confirmTeamPayment,
} from "../../../api/payments.api";
import {
  createTournament,
  deleteTournament,
  listTournaments,
  publishTournament,
  updateTournament,
} from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  statusBadgeClasses,
  statusLabel,
} from "../../../shared/utils/tournamentLabels";
import type {
  DashboardSummary,
  Tournament,
  TournamentFormInput,
  PendingConfirmationEntry,
} from "../../../types/api.types";

const EMPTY_TOURNAMENT_FORM: TournamentFormInput = {
  name: "",
  description: "",
  eventDate: "",
  location: "",
};

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [tournamentForm, setTournamentForm] = useState<TournamentFormInput>(EMPTY_TOURNAMENT_FORM);

  // Action loading states
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);
  const [publishingTournamentId, setPublishingTournamentId] = useState<string | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const [summaryResult, tournamentsResult] = await Promise.all([
        getDashboardSummary(),
        listTournaments({ page: 1, pageSize: 100 }),
      ]);

      setSummary(summaryResult);
      setTournaments(tournamentsResult.data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar o dashboard."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleOpenCreateModal() {
    setEditingTournamentId(null);
    setTournamentForm(EMPTY_TOURNAMENT_FORM);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(tournament: Tournament) {
    setEditingTournamentId(tournament.id);
    setTournamentForm({
      name: tournament.name,
      description: tournament.description ?? "",
      eventDate: toDatetimeLocalValue(tournament.eventDate),
      location: tournament.location,
      status: tournament.status,
    });
    setIsModalOpen(true);
  }

  async function handleTournamentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingTournament(true);
    setError(null);

    try {
      const payload: TournamentFormInput = {
        ...tournamentForm,
        eventDate: new Date(tournamentForm.eventDate).toISOString(),
      };

      if (editingTournamentId) {
        await updateTournament(editingTournamentId, payload);
      } else {
        await createTournament(payload);
      }

      setIsModalOpen(false);
      setTournamentForm(EMPTY_TOURNAMENT_FORM);
      setEditingTournamentId(null);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o torneio."));
    } finally {
      setIsSavingTournament(false);
    }
  }

  async function handleDeleteTournament(tournamentId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este torneio? Ele e todas as suas categorias, inscrições e pagamentos serão DELETADOS PERMANENTEMENTE do banco de dados.",
    );
    if (!confirmed) {
      return;
    }

    setDeletingTournamentId(tournamentId);
    setError(null);

    try {
      await deleteTournament(tournamentId);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível excluir o torneio."));
    } finally {
      setDeletingTournamentId(null);
    }
  }

  async function handlePublishTournament(tournamentId: string) {
    setPublishingTournamentId(tournamentId);
    setError(null);

    try {
      await publishTournament(tournamentId);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível publicar o torneio."));
    } finally {
      setPublishingTournamentId(null);
    }
  }

  async function handleConfirmPayment(entry: PendingConfirmationEntry) {
    const confirmed = window.confirm(
      `Deseja confirmar manualmente o pagamento de R$ ${entry.amountDue} para ${entry.playerName}?`
    );
    if (!confirmed) return;

    setConfirmingPaymentId(entry.id);
    setError(null);

    try {
      if (entry.kind === "registration") {
        await confirmRegistrationPayment(entry.id);
      } else {
        await confirmTeamPayment(entry.id, "FULL");
      }
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao confirmar pagamento."));
    } finally {
      setConfirmingPaymentId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!summary) return null;

  // Metric aggregates
  const totalTournamentsCount = tournaments.length;
  const activeTournamentsCount = tournaments.filter(
    (t) => t.status === "PUBLISHED" || t.status === "REGISTRATIONS_CLOSED"
  ).length;
  const finishedTournamentsCount = tournaments.filter(
    (t) => t.status === "FINISHED"
  ).length;
  const totalRegistrationsCount = summary.confirmedEntriesCount;

  // Tournament Status Distribution for Donut Chart
  const statusCounts = {
    DRAFT: 0,
    PUBLISHED: 0,
    REGISTRATIONS_CLOSED: 0,
    FINISHED: 0,
    CANCELLED: 0,
  };
  tournaments.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });

  const totalStatus = totalTournamentsCount || 1;
  const slices = [
    { label: "Rascunho", count: statusCounts.DRAFT, color: "#64748b", className: "bg-slate-500" },
    { label: "Inscrições Abertas", count: statusCounts.PUBLISHED, color: "#10b981", className: "bg-emerald-500" },
    { label: "Inscrições Fechadas", count: statusCounts.REGISTRATIONS_CLOSED, color: "#f59e0b", className: "bg-amber-500" },
    { label: "Finalizado", count: statusCounts.FINISHED, color: "#6366f1", className: "bg-indigo-500" },
    { label: "Cancelado", count: statusCounts.CANCELLED, color: "#ef4444", className: "bg-red-500" },
  ];

  // Calculate conic gradient parts for the donut chart
  let currentAccum = 0;
  const conicParts = slices.map((s) => {
    const percent = (s.count / totalStatus) * 100;
    const start = currentAccum;
    currentAccum += percent;
    return `${s.color} ${start}% ${currentAccum}%`;
  });
  const donutGradient = `conic-gradient(${conicParts.join(", ")})`;

  // Filter next/upcoming tournaments
  const upcomingTournaments = tournaments
    .filter((t) => t.status !== "FINISHED" && t.status !== "CANCELLED")
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const currentDateString = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDate = currentDateString.charAt(0).toUpperCase() + currentDateString.slice(1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Olá, {user?.name || "Administrador"}!
          </h1>
          <p className="mt-1 text-sm text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            {formattedDate}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 hover:shadow-emerald-400/30"
        >
          <Plus className="h-5 w-5" />
          Novo Torneio
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Trophy}
          title="Total de Torneios"
          value={totalTournamentsCount}
          accentColor="text-emerald-400"
          bgColor="from-emerald-500/5 to-transparent"
          borderColor="border-emerald-500/10 hover:border-emerald-500/20"
        />
        <SummaryCard
          icon={Activity}
          title="Torneios em Andamento"
          value={activeTournamentsCount}
          accentColor="text-sky-400"
          bgColor="from-sky-500/5 to-transparent"
          borderColor="border-sky-500/10 hover:border-sky-500/20"
        />
        <SummaryCard
          icon={Check}
          title="Torneios Finalizados"
          value={finishedTournamentsCount}
          accentColor="text-indigo-400"
          bgColor="from-indigo-500/5 to-transparent"
          borderColor="border-indigo-500/10 hover:border-indigo-500/20"
        />
        <SummaryCard
          icon={Users}
          title="Inscrições Totais"
          value={totalRegistrationsCount}
          accentColor="text-amber-400"
          bgColor="from-amber-500/5 to-transparent"
          borderColor="border-amber-500/10 hover:border-amber-500/20"
        />
      </section>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Tournaments and Pending Payments */}
        <div className="space-y-6 lg:col-span-2">

          {/* Real Pending Payments */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Confirmações de Pagamento Pendentes
              </h3>
              <p className="text-xs text-slate-400">Inscrições aguardando compensação manual ou pix</p>
            </div>

            {summary.pendingConfirmations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-850 rounded-xl">
                <Check className="h-10 w-10 text-emerald-500/40 mb-2" />
                <p className="text-sm text-slate-400 font-medium">Tudo em dia! Nenhum pagamento pendente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.pendingConfirmations.slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-900 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{entry.playerName}</span>
                        <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400 uppercase tracking-wide">
                          {entry.kind === "registration" ? "Individual" : "Dupla"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{entry.tournamentName}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        R$ {Number(entry.amountDue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => handleConfirmPayment(entry)}
                        disabled={confirmingPaymentId === entry.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirmar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tournaments list */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  Todos os Torneios
                </h3>
                <p className="text-xs text-slate-400">Lista geral de torneios do sistema</p>
              </div>
            </div>

            {upcomingTournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-slate-700 mb-3" />
                <p className="text-sm text-slate-400 font-medium">Nenhum torneio agendado no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-900">
                {upcomingTournaments.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white group-hover:text-emerald-400 transition">
                        {t.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {new Date(t.eventDate).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {t.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${statusBadgeClasses(
                          t.status
                        )}`}
                      >
                        {statusLabel(t.status)}
                      </span>

                      <div className="flex items-center gap-1">
                        {t.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublishTournament(t.id)}
                            disabled={publishingTournamentId === t.id}
                            className="p-2 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-slate-900 transition disabled:opacity-50"
                            title={publishingTournamentId === t.id ? "Publicando..." : "Publicar"}
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/torneios/${t.id}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition"
                          title="Gerenciar"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTournament(t.id)}
                          disabled={deletingTournamentId === t.id}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Donut Chart & Bracket Candidates */}
        <div className="space-y-6">

          {/* Pizza/Donut Status Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md flex flex-col items-center">
            <div className="w-full mb-6 text-left">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Status dos Torneios
              </h3>
              <p className="text-xs text-slate-400">Distribuição geral de torneios</p>
            </div>

            {/* Circular Donut Diagram */}
            <div className="relative flex items-center justify-center w-40 h-40 rounded-full" style={{ background: donutGradient }}>
              {/* Inner Hole */}
              <div className="absolute flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-950 border border-slate-900 shadow-inner">
                <span className="text-3xl font-black text-white">{totalTournamentsCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Torneios</span>
              </div>
            </div>

            {/* Legends */}
            <div className="w-full mt-6 space-y-2">
              {slices.map((slice, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${slice.className}`} />
                    <span>{slice.label}</span>
                  </div>
                  <span className="font-bold text-white">{slice.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bracket Candidates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
                Categorias Prontas
              </h3>
              <p className="text-xs text-slate-400">Categorias aptas para chaveamento</p>
            </div>

            {summary.bracketCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-slate-900 rounded-xl">
                <Sparkles className="h-8 w-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-400">Nenhuma categoria com atletas mínimos pronta para chaveamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.bracketCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex flex-col gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{cand.categoryName}</h4>
                        <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">
                          {cand.confirmedEntriesCount} Confirmados
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{cand.tournamentName}</p>
                    </div>

                    <Link
                      to={`/admin/torneios/${cand.id}`}
                      className="mt-1 text-center block text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Gerenciar Categoria
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              {editingTournamentId ? "Editar Torneio" : "Novo Torneio"}
            </h3>

            <form onSubmit={handleTournamentSubmit} className="space-y-4">
              {editingTournamentId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    value={tournamentForm.status || "DRAFT"}
                    onChange={(event) =>
                      setTournamentForm({
                        ...tournamentForm,
                        status: event.target.value as any,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="PUBLISHED">Inscrições abertas</option>
                    <option value="REGISTRATIONS_CLOSED">Inscrições encerradas</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="FINISHED">Finalizado</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nome
                </label>
                <input
                  required
                  type="text"
                  value={tournamentForm.name}
                  onChange={(event) =>
                    setTournamentForm({
                      ...tournamentForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="Ex: Copa ARES de Verão"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Descrição
                </label>
                <textarea
                  value={tournamentForm.description}
                  onChange={(event) =>
                    setTournamentForm({
                      ...tournamentForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  placeholder="Detalhes opcionais sobre o torneio"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Data e Hora
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={tournamentForm.eventDate}
                    onChange={(event) =>
                      setTournamentForm({
                        ...tournamentForm,
                        eventDate: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Local
                  </label>
                  <input
                    required
                    type="text"
                    value={tournamentForm.location}
                    onChange={(event) =>
                      setTournamentForm({
                        ...tournamentForm,
                        location: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    placeholder="Ex: Praia de Iracema"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-transparent px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTournament}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition"
                >
                  {isSavingTournament ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: typeof Trophy;
  title: string;
  value: string | number;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  accentColor,
  bgColor,
  borderColor,
}: SummaryCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${bgColor} ${borderColor} p-6 shadow-xl backdrop-blur-md transition-all duration-300 flex items-center justify-between`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-3xl font-black text-white block">
          {value}
        </span>
      </div>
      <div className={`p-3 rounded-xl bg-slate-900/60 border border-slate-800 ${accentColor}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
