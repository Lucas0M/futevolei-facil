import {
  useEffect,
  useState,
  useCallback,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  PencilLine,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Swords,
  Trash2,
  X,
  Trophy,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../../../api/dashboard.api";
import { generateCategoryBracket } from "../../../api/categories.api";
import {
  createTournament,
  deleteTournament,
  listTournaments,
  publishTournament,
  updateTournament,
} from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  formatLabel,
  statusBadgeClasses,
  statusLabel,
} from "../../../shared/utils/tournamentLabels";
import type {
  DashboardSummary,
  GeneratedBracket,
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bracket, setBracket] = useState<GeneratedBracket | null>(null);
  const [generatingCategoryId, setGeneratingCategoryId] = useState<
    string | null
  >(null);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [deletingTournamentId, setDeletingTournamentId] = useState<
    string | null
  >(null);
  const [publishingTournamentId, setPublishingTournamentId] = useState<
    string | null
  >(null);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(
    null,
  );
  const [tournamentForm, setTournamentForm] = useState<TournamentFormInput>(
    EMPTY_TOURNAMENT_FORM,
  );

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

  async function handleGenerateBracket(categoryId: string) {
    setGeneratingCategoryId(categoryId);
    setError(null);

    try {
      const result = await generateCategoryBracket(categoryId);
      setBracket(result);
    } catch (err) {
      setBracket(null);
      setError(
        getApiErrorMessage(err, "Não foi possível gerar o chaveamento."),
      );
    } finally {
      setGeneratingCategoryId(null);
    }
  }

  function handleSelectTournament(tournament: Tournament) {
    setEditingTournamentId(tournament.id);
    setTournamentForm({
      name: tournament.name,
      description: tournament.description ?? "",
      eventDate: toDatetimeLocalValue(tournament.eventDate),
      location: tournament.location,
    });
    setError(null);
  }

  function handleResetTournamentForm() {
    setEditingTournamentId(null);
    setTournamentForm(EMPTY_TOURNAMENT_FORM);
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

      handleResetTournamentForm();
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o torneio."));
    } finally {
      setIsSavingTournament(false);
    }
  }

  async function handleDeleteTournament(tournamentId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este torneio? Ele será cancelado no sistema.",
    );
    if (!confirmed) {
      return;
    }

    setDeletingTournamentId(tournamentId);
    setError(null);

    try {
      await deleteTournament(tournamentId);
      if (editingTournamentId === tournamentId) {
        handleResetTournamentForm();
      }
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
    return <p className="text-slate-400">Carregando...</p>;
  }

  if (error && !summary) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-950 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Painel administrativo
            </span>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Dashboard
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Aqui você confirma pagamentos, acompanha a operação e gera o
                chaveamento automático das categorias prontas para a próxima
                rodada.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/torneios"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
            >
              Ver torneios
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar painel
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatusPill
            label="Torneios ativos"
            value={summary.activeTournaments}
          />
          <StatusPill
            label="Pagamentos pendentes"
            value={summary.pendingConfirmations.length}
          />
          <StatusPill
            label="Categorias para chaveamento"
            value={summary.bracketCandidates.length}
          />
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Trophy}
          label="Torneios ativos"
          value={summary.activeTournaments}
        />
        <MetricCard
          icon={Users}
          label="Inscrições confirmadas"
          value={summary.confirmedEntriesCount}
        />
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

      <div className="grid gap-8 xl:grid-cols-[1fr]">

        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Chaveamento automático
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Gera a primeira rodada com base nos inscritos confirmados.
              </p>
            </div>
            <Swords className="h-5 w-5 text-emerald-400" />
          </div>

          {summary.bracketCandidates.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
              Nenhuma categoria pronta para chaveamento neste momento.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {summary.bracketCandidates.map((category) => (
                <article
                  key={category.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        {category.tournamentName}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">
                        {category.categoryName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {category.confirmedEntriesCount} confirmados ·{" "}
                        {formatLabel(category.format)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(category.status)}`}
                    >
                      {statusLabel(category.status)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleGenerateBracket(category.id)}
                    disabled={generatingCategoryId === category.id}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {generatingCategoryId === category.id
                      ? "Gerando..."
                      : "Gerar chaveamento"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {bracket && <BracketPanel bracket={bracket} />}

      <TournamentManagementPanel
        tournaments={tournaments}
        onSelectTournament={handleSelectTournament}
        onResetTournamentForm={handleResetTournamentForm}
        onTournamentFormChange={setTournamentForm}
        onTournamentSubmit={handleTournamentSubmit}
        onDeleteTournament={handleDeleteTournament}
        onPublishTournament={handlePublishTournament}
        tournamentForm={tournamentForm}
        editingTournamentId={editingTournamentId}
        isSavingTournament={isSavingTournament}
        deletingTournamentId={deletingTournamentId}
        publishingTournamentId={publishingTournamentId}
      />
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
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
      <p className={`mt-2 text-xl font-bold ${accent ?? "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function BracketPanel({ bracket }: { bracket: GeneratedBracket }) {
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-emerald-400">Chaveamento gerado</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {bracket.categoryName}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {bracket.tournamentName} · {bracket.participantCount} participantes
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          Chaveamento automático da primeira rodada
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-3">
          {bracket.matches.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-400">
              Não há confrontos suficientes para montar a primeira rodada.
            </p>
          ) : (
            bracket.matches.map((match) => (
              <div
                key={match.position}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
                  <span>Confronto {match.position}</span>
                  <span>Seed automático</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <BracketCompetitor
                    label="Casa"
                    competitor={match.competitorA}
                  />
                  {match.competitorB ? (
                    <BracketCompetitor
                      label="Fora"
                      competitor={match.competitorB}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-500">
                      Bye automático
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Classificados diretos
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Entram sem confronto quando há número ímpar.
            </p>
          </div>

          {bracket.byes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum bye gerado.</p>
          ) : (
            <div className="space-y-2">
              {bracket.byes.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="font-medium text-white">{participant.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Inscrito em{" "}
                    {new Date(participant.registeredAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function BracketCompetitor({
  label,
  competitor,
}: {
  label: string;
  competitor: GeneratedBracket["matches"][number]["competitorA"];
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-white">{competitor.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        Inscrito em{" "}
        {new Date(competitor.registeredAt).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}

function TournamentManagementPanel({
  tournaments,
  tournamentForm,
  editingTournamentId,
  isSavingTournament,
  deletingTournamentId,
  publishingTournamentId,
  onSelectTournament,
  onResetTournamentForm,
  onTournamentFormChange,
  onTournamentSubmit,
  onDeleteTournament,
  onPublishTournament,
}: {
  tournaments: Tournament[];
  tournamentForm: TournamentFormInput;
  editingTournamentId: string | null;
  isSavingTournament: boolean;
  deletingTournamentId: string | null;
  publishingTournamentId: string | null;
  onSelectTournament: (tournament: Tournament) => void;
  onResetTournamentForm: () => void;
  onTournamentFormChange: (value: TournamentFormInput) => void;
  onTournamentSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteTournament: (tournamentId: string) => void;
  onPublishTournament: (tournamentId: string) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-emerald-400">CRUD de torneios</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Gerenciar torneios
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Crie, edite ou exclua torneios usando as rotas já existentes do
            backend.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <PlusCircle className="h-4 w-4 text-emerald-400" />
          {tournaments.length} cadastrados
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          onSubmit={onTournamentSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">
              {editingTournamentId ? "Editar torneio" : "Novo torneio"}
            </h3>

            {editingTournamentId && (
              <button
                type="button"
                onClick={onResetTournamentForm}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <FieldLabel label="Nome">
              <input
                required
                type="text"
                value={tournamentForm.name}
                onChange={(event) =>
                  onTournamentFormChange({
                    ...tournamentForm,
                    name: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                placeholder="Ex: Copa ARES de Verão"
              />
            </FieldLabel>

            <FieldLabel label="Descrição">
              <textarea
                value={tournamentForm.description}
                onChange={(event) =>
                  onTournamentFormChange({
                    ...tournamentForm,
                    description: event.target.value,
                  })
                }
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                placeholder="Detalhes opcionais sobre o torneio"
              />
            </FieldLabel>

            <FieldLabel label="Data e hora">
              <input
                required
                type="datetime-local"
                value={tournamentForm.eventDate}
                onChange={(event) =>
                  onTournamentFormChange({
                    ...tournamentForm,
                    eventDate: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              />
            </FieldLabel>

            <FieldLabel label="Local">
              <input
                required
                type="text"
                value={tournamentForm.location}
                onChange={(event) =>
                  onTournamentFormChange({
                    ...tournamentForm,
                    location: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                placeholder="Ex: Praia de Iracema"
              />
            </FieldLabel>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSavingTournament}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {isSavingTournament
                ? "Salvando..."
                : editingTournamentId
                  ? "Salvar alterações"
                  : "Criar torneio"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              Torneios cadastrados
            </h3>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
              {tournaments.length}
            </span>
          </div>

          {tournaments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
              Nenhum torneio cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => {
                const isSelected = editingTournamentId === tournament.id;

                return (
                  <article
                    key={tournament.id}
                    className={`rounded-2xl border p-4 transition ${isSelected
                        ? "border-emerald-400/50 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-900/60"
                      }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {tournament.name}
                        </h4>
                        <p className="mt-1 text-sm text-slate-400">
                          {new Date(tournament.eventDate).toLocaleString(
                            "pt-BR",
                          )}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {tournament.location}
                        </p>
                        {tournament.description && (
                          <p className="mt-2 text-sm text-slate-400">
                            {tournament.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(tournament.status)}`}
                      >
                        {statusLabel(tournament.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/admin/torneios/${tournament.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Gerenciar
                      </Link>

                      <button
                        type="button"
                        onClick={() => onSelectTournament(tournament)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                      >
                        <PencilLine className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTournament(tournament.id)}
                        disabled={deletingTournamentId === tournament.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingTournamentId === tournament.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>

                      {tournament.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => onPublishTournament(tournament.id)}
                          disabled={publishingTournamentId === tournament.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          {publishingTournamentId === tournament.id
                            ? "Publicando..."
                            : "Publicar"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
