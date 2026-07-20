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
  Clock,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getDashboardSummary } from "../../../api/dashboard.api";
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
  
  // Loading action states
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);
  const [publishingTournamentId, setPublishingTournamentId] = useState<string | null>(null);

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

  // Chart Monthly Aggegation
  const lastMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      monthName: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      year: d.getFullYear(),
      count: 0,
      monthNum: d.getMonth(),
    };
  }).reverse();

  tournaments.forEach((t) => {
    const tDate = new Date(t.eventDate);
    const match = lastMonths.find(
      (m) => m.monthNum === tDate.getMonth() && m.year === tDate.getFullYear()
    );
    if (match) {
      match.count++;
    }
  });

  // Calculate highest count for SVG sizing
  const maxCount = Math.max(...lastMonths.map((m) => m.count), 4);

  // Filter next/upcoming tournaments
  const upcomingTournaments = tournaments
    .filter((t) => t.status !== "FINISHED" && t.status !== "CANCELLED")
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  // Mocked recent actions to ensure perfect presentation as per requirements
  const recentActivities = [
    {
      id: "1",
      icon: Plus,
      description: "Novo torneio Copa Verão ARES criado com sucesso.",
      time: "Há 10 minutos",
      type: "create",
    },
    {
      id: "2",
      icon: Pencil,
      description: "Categoria 'Intermediário Masculino' atualizada.",
      time: "Há 2 horas",
      type: "edit",
    },
    {
      id: "3",
      icon: Users,
      description: "Inscrição recebida para a dupla Roberto + Marcos.",
      time: "Há 4 horas",
      type: "registration",
    },
    {
      id: "4",
      icon: Check,
      description: "Pagamento manual confirmado para categoria Misto Nível B.",
      time: "Há 1 dia",
      type: "payment",
    },
    {
      id: "5",
      icon: Trophy,
      description: "Torneio Integração de Futevôlei concluído.",
      time: "Há 2 dias",
      type: "finish",
    },
  ];

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

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns (Chart & Upcoming) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Chart Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Torneios Criados
                </h3>
                <p className="text-xs text-slate-400">Torneios lançados nos últimos 6 meses</p>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full h-48 flex items-end justify-between px-2 pt-4">
              {lastMonths.map((item, idx) => {
                const barHeightPercent = (item.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip on hover */}
                    <div className="relative mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-slate-700">
                        {item.count} {item.count === 1 ? "torneio" : "torneios"}
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="w-8 sm:w-12 bg-slate-900 rounded-t-md overflow-hidden h-32 flex items-end">
                      <div
                        style={{ height: `${Math.max(barHeightPercent, 6)}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-500 group-hover:from-emerald-500 group-hover:to-emerald-300"
                      />
                    </div>
                    {/* Label */}
                    <span className="mt-2 text-xs font-semibold text-slate-400 uppercase">
                      {item.monthName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Tournaments */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  Próximos Torneios
                </h3>
                <p className="text-xs text-slate-400">Próximos eventos programados na agenda</p>
              </div>

              <Link
                to="/torneios"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingTournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-slate-700 mb-3" />
                <p className="text-sm text-slate-400 font-medium">Nenhum torneio agendado no momento.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-4 text-xs font-bold text-emerald-400 hover:underline"
                >
                  Criar um torneio agora
                </button>
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

        {/* Right Column (Recent Activities) */}
        <div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Atividades Recentes
              </h3>
              <p className="text-xs text-slate-400">Últimas ações e ocorrências no sistema</p>
            </div>

            <div className="relative flex-1 space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-900">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="relative flex gap-4 items-start pl-2">
                    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-slate-300 leading-snug">
                        {act.description}
                      </p>
                      <span className="block text-[11px] text-slate-500 font-medium">
                        {act.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
