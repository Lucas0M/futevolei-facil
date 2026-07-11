import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Settings, ArrowRight, ArrowLeft, Shield, Trash2, PencilLine } from "lucide-react";
import {
  getTournamentDetail,
  updateTournament,
  publishTournament,
  getTournamentPendingPayments,
} from "../../../api/tournaments.api";
import { confirmRegistrationPayment, confirmTeamPayment, type TeamPaymentPortion } from "../../../api/payments.api";
import { createRegistration } from "../../../api/registrations.api";
import { createCategory, publishCategory, updateCategory, deleteCategory, generatePersistentBracket, updateMatchWinner } from "../../../api/categories.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { statusBadgeClasses, statusLabel, formatLabel, slotsUnitLabel } from "../../../shared/utils/tournamentLabels";
import type { TournamentDetail, TournamentFormInput, PendingConfirmationEntry, TournamentDetailCategory } from "../../../types/api.types";

const TEAM_PORTION_OPTIONS: Array<{ value: TeamPaymentPortion; label: string }> = [
  { value: "FULL", label: "Dupla inteira" },
  { value: "OWNER_SHARE", label: "Parte do dono" },
  { value: "PARTNER_SHARE", label: "Parte do parceiro" },
];

type CategoryFormState = {
  name: string;
  format: "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
  entryFee: string;
  maxSlots: string;
  registrationDeadline: string;
  reservationTtlMinutes: string;
  refundFullBeforeDays: string;
  refundPartialBeforeDays: string;
  refundPartialPercent: string;
  cancellationDeadlineHours: string;
};

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: "",
  format: "INDIVIDUAL",
  entryFee: "",
  maxSlots: "",
  registrationDeadline: "",
  reservationTtlMinutes: "20",
  refundFullBeforeDays: "",
  refundPartialBeforeDays: "",
  refundPartialPercent: "",
  cancellationDeadlineHours: "48",
};

export function AdminTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingConfirmationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pending payments state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<Record<string, TeamPaymentPortion>>({});

  // Editing tournament state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [isPublishingTournament, setIsPublishingTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState<TournamentFormInput>({
    name: "", description: "", eventDate: "", location: ""
  });

  // Category state
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [publishingCategoryId, setPublishingCategoryId] = useState<string | null>(null);

  // Match editing state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchWinnerId, setMatchWinnerId] = useState<string>("");
  const [matchScore, setMatchScore] = useState<string>("");
  const [isSavingMatchResult, setIsSavingMatchResult] = useState(false);
  const [isGeneratingBracketId, setIsGeneratingBracketId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, "WINNER" | "LOSER" | "FINALS">>({});

  // Manual registration state
  const [manualPlayer1, setManualPlayer1] = useState("");
  const [manualPlayer2, setManualPlayer2] = useState("");
  const [isRegisteringManual, setIsRegisteringManual] = useState(false);

  async function handleAddManualRegistration(categoryId: string, format: string) {
    if (format === "DUO_FIXED" && (!manualPlayer1.trim() || !manualPlayer2.trim())) {
      setError("Por favor, preencha os nomes de ambos os jogadores.");
      return;
    }
    if (format !== "DUO_FIXED" && !manualPlayer1.trim()) {
      setError("Por favor, preencha o nome do jogador.");
      return;
    }

    setIsRegisteringManual(true);
    setError(null);
    try {
      if (format === "DUO_FIXED") {
        await createRegistration(categoryId, {
          customOwnerName: manualPlayer1.trim(),
          partnerName: manualPlayer2.trim(),
        });
      } else {
        await createRegistration(categoryId, {
          customPlayerName: manualPlayer1.trim(),
        });
      }
      setManualPlayer1("");
      setManualPlayer2("");
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível realizar a inscrição manual."));
    } finally {
      setIsRegisteringManual(false);
    }
  }

  async function handleGeneratePersistentBracket(categoryId: string) {
    setIsGeneratingBracketId(categoryId);
    setError(null);
    try {
      await generatePersistentBracket(categoryId);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível gerar o chaveamento."));
    } finally {
      setIsGeneratingBracketId(null);
    }
  }

  async function handleSaveMatchWinner(matchId: string) {
    if (!matchWinnerId) return;
    setIsSavingMatchResult(true);
    setError(null);
    try {
      await updateMatchWinner(matchId, matchWinnerId, matchScore);
      setEditingMatchId(null);
      setMatchWinnerId("");
      setMatchScore("");
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o vencedor da partida."));
    } finally {
      setIsSavingMatchResult(false);
    }
  }

  const loadData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [detailResult, paymentsResult] = await Promise.all([
        getTournamentDetail(id),
        getTournamentPendingPayments(id),
      ]);
      setTournament(detailResult);
      setPendingPayments(paymentsResult);
      if (detailResult.categories.length > 0) {
        setSelectedCategoryId((prev) => prev || detailResult.categories[0].id);
      }

      if (!isEditing) {
        setTournamentForm({
          name: detailResult.name,
          description: detailResult.description ?? "",
          eventDate: toDatetimeLocalValue(detailResult.eventDate),
          location: detailResult.location,
          status: detailResult.status,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os dados deste torneio."));
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirmPayment(entry: PendingConfirmationEntry) {
    setConfirmingId(entry.id);
    setError(null);
    try {
      if (entry.kind === "registration") {
        await confirmRegistrationPayment(entry.id);
      } else {
        const portion = selectedPortion[entry.id] ?? "FULL";
        await confirmTeamPayment(entry.id, portion);
      }
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível confirmar o pagamento."));
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleTournamentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setIsSavingTournament(true);
    setError(null);

    try {
      const payload: TournamentFormInput = {
        ...tournamentForm,
        eventDate: new Date(tournamentForm.eventDate).toISOString(),
      };
      await updateTournament(id, payload);
      setIsEditing(false);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o torneio."));
    } finally {
      setIsSavingTournament(false);
    }
  }

  async function handlePublishTournament() {
    if (!id) return;
    setIsPublishingTournament(true);
    setError(null);

    try {
      await publishTournament(id);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível publicar o torneio."));
    } finally {
      setIsPublishingTournament(false);
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setIsSavingCategory(true);
    setError(null);

    try {
      const payload = {
        name: categoryForm.name.trim(),
        format: categoryForm.format,
        entryFee: Number(categoryForm.entryFee),
        maxSlots: Number(categoryForm.maxSlots),
        registrationDeadline: new Date(categoryForm.registrationDeadline).toISOString(),
        reservationTtlMinutes: Number(categoryForm.reservationTtlMinutes),
        refundFullBeforeDays: categoryForm.refundFullBeforeDays ? Number(categoryForm.refundFullBeforeDays) : undefined,
        refundPartialBeforeDays: categoryForm.refundPartialBeforeDays ? Number(categoryForm.refundPartialBeforeDays) : undefined,
        refundPartialPercent: categoryForm.refundPartialPercent ? Number(categoryForm.refundPartialPercent) : undefined,
        cancellationDeadlineHours: Number(categoryForm.cancellationDeadlineHours),
      };

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        setEditingCategoryId(null);
      } else {
        await createCategory(id, payload);
      }

      setCategoryForm(EMPTY_CATEGORY_FORM);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar a categoria."));
    } finally {
      setIsSavingCategory(false);
    }
  }

  function handleSelectCategory(cat: TournamentDetailCategory) {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      format: cat.format,
      entryFee: String(cat.entryFee),
      maxSlots: String(cat.maxSlots),
      registrationDeadline: toDatetimeLocalValue(cat.registrationDeadline),
      reservationTtlMinutes: "20",
      refundFullBeforeDays: "",
      refundPartialBeforeDays: "",
      refundPartialPercent: "",
      cancellationDeadlineHours: "48",
    });
    setError(null);
  }

  function handleResetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
  }

  async function handleDeleteCategory(categoryId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta categoria? Todas as inscrições e pagamentos vinculados a ela serão deletados permanentemente do banco de dados.",
    );
    if (!confirmed) return;

    setError(null);
    try {
      await deleteCategory(categoryId);
      if (editingCategoryId === categoryId) {
        handleResetCategoryForm();
      }
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível excluir a categoria."));
    }
  }

  async function handlePublishCategory(categoryId: string) {
    setPublishingCategoryId(categoryId);
    setError(null);

    try {
      await publishCategory(categoryId);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível publicar a categoria."));
    } finally {
      setPublishingCategoryId(null);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><p className="text-slate-400">Carregando...</p></div>;
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
        <p className="text-red-300">Torneio não encontrado.</p>
        <Link to="/admin" className="mt-5 inline-flex text-emerald-400 hover:text-emerald-300">
          ← Voltar para admin
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-950 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <Shield className="h-3.5 w-3.5" />
              Painel do Torneio
            </span>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {tournament.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Gerencie configurações, categorias e pagamentos pendentes deste torneio.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard Admin
            </Link>

            <Link
              to={`/torneios/${tournament.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              Ver página pública
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Confirmações de pagamento */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Pagamentos Pendentes</h2>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
              {pendingPayments.length}
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              Nenhum pagamento pendente neste torneio.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingPayments.map((entry) => (
                <li
                  key={`${entry.kind}-${entry.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg"
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
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                      >
                        {TEAM_PORTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => handleConfirmPayment(entry)}
                      disabled={confirmingId === entry.id}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {confirmingId === entry.id ? "Confirmando..." : "Confirmar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Informações do Torneio */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Informações</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
              >
                <Settings className="h-4 w-4" />
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleTournamentSubmit} className="space-y-4">
              <FieldLabel label="Status">
                <select
                  value={tournamentForm.status || "DRAFT"}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, status: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Inscrições abertas</option>
                  <option value="REGISTRATIONS_CLOSED">Inscrições encerradas</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="FINISHED">Finalizado</option>
                </select>
              </FieldLabel>

              <FieldLabel label="Nome">
                <input
                  required
                  type="text"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Descrição">
                <textarea
                  value={tournamentForm.description}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Data e hora">
                <input
                  required
                  type="datetime-local"
                  value={tournamentForm.eventDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, eventDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Local">
                <input
                  required
                  type="text"
                  value={tournamentForm.location}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTournament}
                  className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSavingTournament ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(tournament.status)}`}>
                  {statusLabel(tournament.status)}
                </span>

                {tournament.status === "DRAFT" && (
                  <button
                    onClick={handlePublishTournament}
                    disabled={isPublishingTournament}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {isPublishingTournament ? "Publicando..." : "Publicar torneio"}
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">Local</p>
                <p className="text-white">{tournament.location}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">Data</p>
                <p className="text-white">
                  {new Date(tournament.eventDate).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Categorias */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Categorias do Torneio</h2>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingCategoryId ? "Editar Categoria" : "Adicionar Nova Categoria"}
            </h3>
            {editingCategoryId && (
              <button
                type="button"
                onClick={handleResetCategoryForm}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Cancelar Edição
              </button>
            )}
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="Nome da categoria">
                <input
                  required type="text" value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                  placeholder="Ex: Dupla Masculina Open"
                />
              </FieldLabel>
              <FieldLabel label="Formato">
                <select
                  value={categoryForm.format}
                  onChange={(e) => setCategoryForm({ ...categoryForm, format: e.target.value as CategoryFormState["format"] })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="DUO_FIXED">Dupla fixa</option>
                  <option value="DUO_RANDOM">Dupla sorteada</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Valor da inscrição (R$)">
                <input
                  required type="number" min="0" step="0.01" value={categoryForm.entryFee}
                  onChange={(e) => setCategoryForm({ ...categoryForm, entryFee: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
              <FieldLabel label="Número de vagas">
                <input
                  required type="number" min="1" step="1" value={categoryForm.maxSlots}
                  onChange={(e) => setCategoryForm({ ...categoryForm, maxSlots: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
              <FieldLabel label="Limite de inscrição">
                <input
                  required type="datetime-local" value={categoryForm.registrationDeadline}
                  onChange={(e) => setCategoryForm({ ...categoryForm, registrationDeadline: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSavingCategory}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSavingCategory ? "Salvando..." : editingCategoryId ? "Salvar Alterações" : "Criar Categoria"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {tournament.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
              {tournament.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  type="button"
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategoryId === c.id
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {c.name} · {formatLabel(c.format)}
                </button>
              ))}
            </div>
          )}

          {tournament.categories
            .filter((c) => c.id === selectedCategoryId)
            .map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-white">{category.name}</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatLabel(category.format)} · R$ {category.entryFee} · {category.occupiedSlots}/{category.maxSlots} {slotsUnitLabel(category.format, category.maxSlots)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(category)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>

                  {category.status === "DRAFT" && (
                    <button
                      onClick={() => handlePublishCategory(category.id)}
                      disabled={publishingCategoryId === category.id}
                      className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {publishingCategoryId === category.id ? "Publicando..." : "Publicar"}
                    </button>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(category.status)}`}>
                    {statusLabel(category.status)}
                  </span>
                </div>
              </div>

              {/* Admin Manual Registration Form */}
              <div className="mt-5 border-t border-slate-800 pt-5 bg-slate-900/20 p-4 rounded-xl">
                <h5 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                  Inscrever Jogador/Dupla Manualmente
                </h5>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  {category.format === "DUO_FIXED" ? (
                    <>
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Jogador 1</label>
                        <input
                          type="text"
                          value={manualPlayer1}
                          onChange={(e) => setManualPlayer1(e.target.value)}
                          placeholder="Nome do Jogador 1"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Jogador 2</label>
                        <input
                          type="text"
                          value={manualPlayer2}
                          onChange={(e) => setManualPlayer2(e.target.value)}
                          placeholder="Nome do Jogador 2"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Jogador</label>
                      <input
                        type="text"
                        value={manualPlayer1}
                        onChange={(e) => setManualPlayer1(e.target.value)}
                        placeholder="Nome do Jogador"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddManualRegistration(category.id, category.format)}
                    disabled={isRegisteringManual}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 h-9 shrink-0"
                  >
                    {isRegisteringManual ? "Inscrevendo..." : "Inscrever"}
                  </button>
                </div>
              </div>

              {/* Persistent Bracket Section */}
              <div className="mt-5 border-t border-slate-800 pt-5">
                {category.winnerName && (
                  <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 font-bold flex items-center gap-2">
                    🏆 Campeão da Categoria: {category.winnerName}
                  </div>
                )}

                {category.matches && category.matches.length > 0 ? (
                  <div className="space-y-6">
                    <h5 className="text-sm font-bold text-slate-300">Chaveamento do Torneio (Double Elimination)</h5>
                    {(() => {
                      const renderMatchCard = (match: any) => {
                        const isEditingMatch = editingMatchId === match.id;
                        return (
                          <div key={match.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm hover:border-slate-700 transition">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  {match.label || "Jogo"}
                                </span>
                                {match.score && (
                                  <span className="text-[11px] text-slate-400">
                                    Placar: <span className="text-white font-semibold">{match.score}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center">
                                <span className={match.winnerId === match.competitorAId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                  {match.competitorAName || "A definir"}
                                </span>
                                {match.winnerId === match.competitorAId && <span className="text-xs text-emerald-400 font-semibold">🏆</span>}
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-800/30 pt-2">
                                <span className={match.winnerId === match.competitorBId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                  {match.competitorBName || "A definir"}
                                </span>
                                {match.winnerId === match.competitorBId && <span className="text-xs text-emerald-400 font-semibold">🏆</span>}
                              </div>

                              {!match.winnerId && match.competitorAId && match.competitorBId && (
                                <div className="mt-2 border-t border-slate-800 pt-2">
                                  {isEditingMatch ? (
                                    <div className="space-y-3 pt-1">
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Vencedor</label>
                                        <select
                                          value={matchWinnerId}
                                          onChange={(e) => setMatchWinnerId(e.target.value)}
                                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-emerald-400 outline-none"
                                        >
                                          <option value={match.competitorAId || ""}>{match.competitorAName}</option>
                                          <option value={match.competitorBId || ""}>{match.competitorBName}</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Placar (ex: 21-15, 21-18)</label>
                                        <input
                                          type="text"
                                          value={matchScore}
                                          onChange={(e) => setMatchScore(e.target.value)}
                                          placeholder="Score"
                                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:border-emerald-400 outline-none"
                                        />
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setEditingMatchId(null)}
                                          className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveMatchWinner(match.id)}
                                          disabled={isSavingMatchResult}
                                          className="rounded-lg bg-emerald-500 px-3 py-1 text-xs text-slate-950 font-bold"
                                        >
                                          {isSavingMatchResult ? "Salvando..." : "Confirmar"}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMatchId(match.id);
                                        setMatchWinnerId(match.competitorAId || "");
                                        setMatchScore("");
                                      }}
                                      className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
                                    >
                                      Informar Resultado
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      };

                      const wMatches = category.matches!.filter(m => m.bracketType === "WINNER");
                      const lMatches = category.matches!.filter(m => m.bracketType === "LOSER");
                      const gfMatches = category.matches!.filter(m => m.bracketType === "GRAND_FINAL" || m.bracketType === "RESET_FINAL");
                      const tpMatches = category.matches!.filter(m => m.bracketType === "THIRD_PLACE");

                      const totalWBRounds = wMatches.length > 0 ? Math.max(...wMatches.map((m) => m.round)) : 1;
                      const totalLBRounds = lMatches.length > 0 ? Math.max(...lMatches.map((m) => m.round)) : 1;

                      const getRoundTitle = (round: number, totalRounds: number) => {
                        if (round === totalRounds) return "Final Winner";
                        if (round === totalRounds - 1) return "Semifinal";
                        if (round === totalRounds - 2) return "Quartas de Final";
                        if (round === totalRounds - 3) return "Oitavas de Final";
                        if (round === totalRounds - 4) return "16-avos de Final";
                        return `Rodada ${round}`;
                      };

                      const getLoserRoundTitle = (round: number, totalRounds: number) => {
                        if (round === totalRounds) return "Final Loser";
                        if (round === totalRounds - 1) return "Semifinal Loser";
                        if (round === totalRounds - 2) return "Quartas Loser";
                        return `Loser Rodada ${round}`;
                      };

                      const activeTab = activeTabs[category.id] || "WINNER";
                      const setActiveTab = (tab: "WINNER" | "LOSER" | "FINALS") => {
                        setActiveTabs((prev) => ({ ...prev, [category.id]: tab }));
                      };

                      return (
                        <div className="space-y-6 mt-4 z-10 relative">
                          <div className="flex gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-fit">
                            <button
                              type="button"
                              onClick={() => setActiveTab("WINNER")}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                                activeTab === "WINNER"
                                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Chave Principal (Winner)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("LOSER")}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                                activeTab === "LOSER"
                                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Chave de Repescagem (Loser)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("FINALS")}
                              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                                activeTab === "FINALS"
                                  ? "bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Finais e Decisões
                            </button>
                          </div>

                          {activeTab === "WINNER" && (
                            <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                              {wMatches.length > 0 ? (
                                Array.from(new Set(wMatches.map((m) => m.round))).sort((a,b)=>a-b).map((roundNum) => {
                                  const roundMatches = wMatches.filter((m) => m.round === roundNum);
                                  const isFinalRound = roundNum === totalWBRounds;
                                  return (
                                    <div key={`w-r-${roundNum}`} className="flex flex-col justify-around min-h-[500px] w-64 relative py-8">
                                      <div className="text-center text-[10px] font-bold text-emerald-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-emerald-500/20 bg-emerald-500/5 py-1 rounded-md">
                                        {getRoundTitle(roundNum, totalWBRounds)}
                                      </div>
                                      {roundMatches.map((match) => (
                                        <div key={match.id} className="relative group">
                                          {!isFinalRound && (
                                            <div className="absolute right-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-emerald-500 transition duration-300 z-0" />
                                          )}
                                          {roundNum > 1 && (
                                            <div className="absolute left-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-emerald-500 transition duration-300 z-0" />
                                          )}
                                          <div className="relative z-10">
                                            {renderMatchCard(match)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-slate-400 text-sm">Nenhuma partida gerada ainda.</p>
                              )}
                            </div>
                          )}

                          {activeTab === "LOSER" && (
                            <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                              {lMatches.length > 0 ? (
                                Array.from(new Set(lMatches.map((m) => m.round))).sort((a,b)=>a-b).map((roundNum) => {
                                  const roundMatches = lMatches.filter((m) => m.round === roundNum);
                                  const isFinalRound = roundNum === totalLBRounds;
                                  return (
                                    <div key={`l-r-${roundNum}`} className="flex flex-col justify-around min-h-[500px] w-64 relative py-8">
                                      <div className="text-center text-[10px] font-bold text-amber-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-amber-500/20 bg-amber-500/5 py-1 rounded-md">
                                        {getLoserRoundTitle(roundNum, totalLBRounds)}
                                      </div>
                                      {roundMatches.map((match) => (
                                        <div key={match.id} className="relative group">
                                          {roundNum > 1 && (
                                            <div className="absolute left-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-amber-500 transition duration-300 z-0" />
                                          )}
                                          {!isFinalRound && (
                                            <div className="absolute right-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-amber-500 transition duration-300 z-0" />
                                          )}
                                          <div className="relative z-10">
                                            {renderMatchCard(match)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-slate-400 text-sm">Nenhuma partida de repescagem.</p>
                              )}
                            </div>
                          )}

                          {activeTab === "FINALS" && (
                            <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                              {gfMatches.length > 0 && (
                                <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                                  <div className="text-center text-[10px] font-bold text-rose-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-rose-500/20 bg-rose-500/5 py-1 rounded-md">
                                    Grande Final
                                  </div>
                                  {gfMatches.filter(m => m.bracketType === "GRAND_FINAL").map((match) => (
                                    <div key={match.id} className="relative group">
                                      <div className="relative z-10">
                                        {renderMatchCard(match)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {gfMatches.some(m => m.bracketType === "RESET_FINAL" && (m.competitorAId || m.competitorBId)) && (
                                <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                                  <div className="text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-rose-500/20 bg-rose-500/5 py-1 rounded-md">
                                    Jogo de Reset
                                  </div>
                                  {gfMatches.filter(m => m.bracketType === "RESET_FINAL").map((match) => (
                                    <div key={match.id} className="relative group">
                                      <div className="relative z-10">
                                        {renderMatchCard(match)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {tpMatches.length > 0 && (
                                <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                                  <div className="text-center text-[10px] font-bold text-sky-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-sky-500/20 bg-sky-500/5 py-1 rounded-md">
                                    Disputa de 3º Lugar
                                  </div>
                                  {tpMatches.map((match) => (
                                    <div key={match.id} className="relative group">
                                      <div className="relative z-10">
                                        {renderMatchCard(match)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  category.status !== "DRAFT" && (
                    <div className="flex flex-col items-center py-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                      <p className="text-xs text-slate-400 mb-3">O chaveamento oficial ainda não foi gerado.</p>
                      <button
                        type="button"
                        onClick={() => handleGeneratePersistentBracket(category.id)}
                        disabled={isGeneratingBracketId === category.id || category.occupiedSlots < 2}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {isGeneratingBracketId === category.id ? "Gerando..." : "Gerar Chaveamento Oficial"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
          {tournament.categories.length === 0 && (
            <p className="text-slate-400 text-center py-8">Nenhuma categoria criada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
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
